import { ConfigManager } from '../core/ConfigManager.js';
import { OpenAIProvider } from '../providers/OpenAIProvider.js';
import { GeminiProvider } from '../providers/GeminiProvider.js';
import { AIProvider } from '../types.js';
import { CacheManager } from '../utils/CacheManager.js';
import { DiffChunker } from '../utils/DiffChunker.js';

/** A pending item in the request batch queue. */
interface BatchItem {
  diff: string;
  type?: string;
  provider?: string;
  detailed?: boolean;
  resolve: (value: string) => void;
  reject: (reason: unknown) => void;
}

export class AIService {
  private configManager: ConfigManager;
  private currentProvider: string;
  private cacheManager: CacheManager;

  /** Pending batch requests waiting to be flushed. */
  private batchQueue: BatchItem[] = [];
  /** Timer handle for the batch flush. */
  private batchTimer: ReturnType<typeof setTimeout> | null = null;
  /** Delay (ms) before a batch is automatically flushed. */
  private readonly BATCH_DELAY_MS = 50;

  constructor() {
    this.configManager = new ConfigManager();
    this.currentProvider = this.configManager.getConfig('provider') || 'openai';
    this.cacheManager = new CacheManager();
  }

  setProvider(providerName: string): void {
    this.currentProvider = providerName;
  }

  getCurrentProvider(): string {
    return this.currentProvider;
  }

  getProvider(providerName?: string): AIProvider {
    const provider = providerName || process.env.GITGENIUS_PROVIDER || this.configManager.getConfig('provider');
    const apiKey = this.configManager.getApiKey();

    if (!apiKey) {
      throw new Error('API key not configured. Run: gitgenius config apiKey');
    }

    switch (provider) {
      case 'openai':
        return new OpenAIProvider(apiKey);
      case 'gemini':
        return new GeminiProvider(apiKey);
      default:
        throw new Error(`Unsupported provider: ${provider}`);
    }
  }

  async getProviderAsync(providerName?: string): Promise<AIProvider> {
    return this.getProvider(providerName);
  }

  hasApiKey(): boolean {
    return this.configManager.hasApiKey();
  }

  /**
   * Generate a commit message for `diff`.
   *
   * Performance features applied automatically:
   * - **Caching** – responses for identical diff+type+provider are returned
   *   from the in-memory / persisted cache without a new API call.
   * - **Diff chunking** – when `diff` exceeds the configured `maxChunkSize`,
   *   it is split into file-level chunks and each chunk is sent separately;
   *   results are joined into a single message.
   * - **Streaming** – when the provider supports it and `onChunk` is provided,
   *   partial tokens are delivered in real-time.
   */
  async generateCommitMessage(
    diff: string,
    type?: string,
    provider?: string,
    detailed?: boolean,
    onChunk?: (chunk: string) => void
  ): Promise<string> {
    const providerName = provider || this.currentProvider;
    const cacheEnabled = this.configManager.getConfig('enableCache') !== false;

    // ── Cache lookup ───────────────────────────────────────────────────────
    if (cacheEnabled) {
      const diffHash = CacheManager.createHash(diff + (type ?? '') + (detailed ? '1' : '0'));
      const cached = this.cacheManager.getCachedCommitMessage(diffHash, providerName);
      if (cached) {
        // Replay cached value through onChunk so callers get consistent UX
        onChunk?.(cached);
        return cached;
      }
    }

    // ── Diff chunking for large diffs ──────────────────────────────────────
    const maxChunkSize: number = this.configManager.getConfig('maxChunkSize') ?? DiffChunker.DEFAULT_CHUNK_SIZE;
    const aiProvider = this.getProvider(provider);

    let message: string;
    if (DiffChunker.isLargeDiff(diff, maxChunkSize)) {
      message = await this.generateForLargeDiff(aiProvider, diff, type, detailed, maxChunkSize, onChunk);
    } else {
      message = await this.callProvider(aiProvider, diff, type, detailed, onChunk);
    }

    // ── Cache store ────────────────────────────────────────────────────────
    if (cacheEnabled) {
      const cacheTimeout: number = this.configManager.getConfig('cacheTimeout') ?? 120;
      const diffHash = CacheManager.createHash(diff + (type ?? '') + (detailed ? '1' : '0'));
      // Store with the user-configured TTL via the generic set() so we avoid
      // a second write that cacheCommitMessage() would otherwise trigger.
      this.cacheManager.set(`commit:${providerName}:${diffHash}`, message, cacheTimeout);
    }

    return message;
  }

  /**
   * Queue a commit-message request for batched execution.
   *
   * Multiple calls made within `BATCH_DELAY_MS` are collected and then fired
   * concurrently rather than serially, reducing total wall-clock time when
   * several diffs need messages at once.
   */
  async generateCommitMessageBatched(
    diff: string,
    type?: string,
    provider?: string,
    detailed?: boolean
  ): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      this.batchQueue.push({ diff, type, provider, detailed, resolve, reject });
      this.scheduleBatchFlush();
    });
  }

  async explainCommit(commitMessage: string, files?: string, provider?: string): Promise<string> {
    const aiProvider = this.getProvider(provider);
    return await aiProvider.generateCommitMessage(
      `Explain this commit: ${commitMessage}\nFiles: ${files || 'N/A'}`,
      'explain'
    );
  }

  async reviewCode(diff: string, provider?: string): Promise<string> {
    const aiProvider = this.getProvider(provider);
    return await aiProvider.generateCommitMessage(
      `Perform a code review of these changes. Focus on:
- Code quality and best practices
- Potential bugs or issues
- Security concerns
- Performance implications
- Suggestions for improvement

Changes:
${diff.substring(0, 3000)}`,
      'review'
    );
  }

  async suggestCommitType(diff: string, provider?: string): Promise<string> {
    const aiProvider = this.getProvider(provider);
    return await aiProvider.generateCommitMessage(
      `Based on these changes, suggest the most appropriate conventional commit type (feat, fix, docs, etc.):\n${diff.substring(0, 1000)}`,
      'suggest'
    );
  }

  async suggestCommitScope(diff: string, provider?: string): Promise<string> {
    const aiProvider = this.getProvider(provider);
    return await aiProvider.generateCommitMessage(
      `Based on these changes, suggest an appropriate commit scope:\n${diff.substring(0, 1000)}`,
      'suggest'
    );
  }

  // ── Private helpers ───────────────────────────────────────────────────────

  /**
   * Dispatch a single call to the provider, preferring streaming when both the
   * provider supports it and the caller supplied an `onChunk` callback.
   */
  private async callProvider(
    aiProvider: AIProvider,
    diff: string,
    type?: string,
    detailed?: boolean,
    onChunk?: (chunk: string) => void
  ): Promise<string> {
    if (onChunk && typeof aiProvider.generateCommitMessageStream === 'function') {
      return aiProvider.generateCommitMessageStream(diff, type, detailed, onChunk);
    }
    return aiProvider.generateCommitMessage(diff, type, detailed);
  }

  /**
   * Handle large diffs by chunking, generating a message per chunk, then
   * asking the AI to summarise all partial messages into one cohesive commit
   * message.
   */
  private async generateForLargeDiff(
    aiProvider: AIProvider,
    diff: string,
    type?: string,
    detailed?: boolean,
    maxChunkSize?: number,
    onChunk?: (chunk: string) => void
  ): Promise<string> {
    const chunks = DiffChunker.chunkDiff(diff, maxChunkSize);

    // If only one chunk after splitting (edge case), fall through normally
    if (chunks.length === 1) {
      return this.callProvider(aiProvider, chunks[0], type, detailed, onChunk);
    }

    // Generate a message for each chunk sequentially (avoids rate limit spikes)
    const partialMessages: string[] = [];
    for (const chunk of chunks) {
      const msg = await aiProvider.generateCommitMessage(chunk, type, detailed);
      partialMessages.push(msg);
    }

    // Merge partial messages locally: use the first message as the primary
    // subject line (most likely to represent the most important change) and
    // append any distinct additional scopes/subjects from subsequent chunks.
    const [primary, ...rest] = partialMessages;
    const additional = rest
      .filter(m => m && m !== primary)
      .map(m => `  ${m}`)
      .join('\n');
    const combined = additional ? `${primary}\n${additional}` : primary;

    onChunk?.(combined);
    return combined;
  }

  /** Schedule (or reset) the batch flush timer. */
  private scheduleBatchFlush(): void {
    if (this.batchTimer !== null) return;
    this.batchTimer = setTimeout(() => this.flushBatch(), this.BATCH_DELAY_MS);
  }

  /** Process all queued batch items concurrently. */
  private flushBatch(): void {
    this.batchTimer = null;
    const items = this.batchQueue.splice(0);
    if (items.length === 0) return;

    // Fire all requests concurrently
    for (const item of items) {
      this.generateCommitMessage(item.diff, item.type, item.provider, item.detailed)
        .then(item.resolve)
        .catch(item.reject);
    }
  }
}

