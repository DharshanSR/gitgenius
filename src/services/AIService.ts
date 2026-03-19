import { ConfigManager } from '../core/ConfigManager.js';
import { OpenAIProvider } from '../providers/OpenAIProvider.js';
import { GeminiProvider } from '../providers/GeminiProvider.js';
import { AIProvider } from '../types.js';

export class AIService {
  private configManager: ConfigManager;
  private currentProvider: string;

  constructor() {
    this.configManager = new ConfigManager();
    this.currentProvider = this.configManager.getConfig('provider') || 'openai';
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

  async generateCommitMessage(diff: string, type?: string, provider?: string, detailed?: boolean): Promise<string> {
    const aiProvider = this.getProvider(provider);
    return await aiProvider.generateCommitMessage(diff, type, detailed);
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
}
