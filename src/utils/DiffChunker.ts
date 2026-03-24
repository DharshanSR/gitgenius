/**
 * Utility for chunking and optimizing large git diffs for AI processing.
 * Splits diffs at file boundaries and provides truncation strategies to
 * keep prompts within token limits while preserving the most relevant changes.
 */
export class DiffChunker {
  /** Default maximum characters per chunk sent to the AI. */
  static readonly DEFAULT_CHUNK_SIZE = 3000;

  /** Threshold above which a diff is considered "large". */
  static readonly LARGE_DIFF_THRESHOLD = 3000;

  // ── Sample limits used by optimizeForAI ──────────────────────────────────
  /** Maximum hunk-header lines (`@@ … @@`) to include in the AI sample. */
  private static readonly SAMPLE_MAX_HUNK_HEADERS = 20;
  /** Maximum removed lines (`-`) to include in the AI sample. */
  private static readonly SAMPLE_MAX_REMOVED_LINES = 20;
  /** Maximum added lines (`+`) to include in the AI sample. */
  private static readonly SAMPLE_MAX_ADDED_LINES = 50;

  /**
   * Split a diff into chunks no larger than `maxChunkSize` characters.
   * Prefers splitting at `diff --git` file-section boundaries so each chunk
   * contains complete per-file diffs.  Falls back to line-level splitting when
   * no file boundaries are present.
   */
  static chunkDiff(diff: string, maxChunkSize: number = DiffChunker.DEFAULT_CHUNK_SIZE): string[] {
    if (diff.length <= maxChunkSize) {
      return [diff];
    }

    // Split at file-section headers while keeping the header with its section
    const fileSections = diff.split(/(?=diff --git )/);

    // No file boundaries found – fall back to line-level size splitting
    if (fileSections.length <= 1) {
      return DiffChunker.splitBySize(diff, maxChunkSize);
    }

    const chunks: string[] = [];
    let currentChunk = '';

    for (const section of fileSections) {
      if (currentChunk.length + section.length > maxChunkSize && currentChunk.length > 0) {
        chunks.push(currentChunk.trimEnd());
        currentChunk = section;
      } else {
        currentChunk += section;
      }
    }

    if (currentChunk.trim()) {
      chunks.push(currentChunk.trimEnd());
    }

    return chunks.length > 0 ? chunks : [diff];
  }

  /**
   * Return the number of chunks `chunkDiff` would produce for the given diff.
   */
  static getChunkCount(diff: string, maxChunkSize: number = DiffChunker.DEFAULT_CHUNK_SIZE): number {
    return DiffChunker.chunkDiff(diff, maxChunkSize).length;
  }

  /**
   * Return `true` when `diff` exceeds the large-diff threshold.
   */
  static isLargeDiff(diff: string, threshold: number = DiffChunker.LARGE_DIFF_THRESHOLD): boolean {
    return diff.length > threshold;
  }

  /**
   * Produce a representative, AI-friendly summary of a diff that is too large
   * to send in full.  The summary preserves hunk headers and the first batches
   * of added / removed lines so the AI still understands the change intent.
   */
  static optimizeForAI(diff: string, maxSize: number = DiffChunker.DEFAULT_CHUNK_SIZE): string {
    if (diff.length <= maxSize) {
      return diff;
    }

    const lines = diff.split('\n');
    const hunkHeaders = lines.filter(l => l.startsWith('@@')).slice(0, DiffChunker.SAMPLE_MAX_HUNK_HEADERS);
    const removedLines = lines.filter(l => l.startsWith('-') && !l.startsWith('---')).slice(0, DiffChunker.SAMPLE_MAX_REMOVED_LINES);
    const addedLines = lines.filter(l => l.startsWith('+') && !l.startsWith('+++')).slice(0, DiffChunker.SAMPLE_MAX_ADDED_LINES);

    const parts = [
      `[LARGE DIFF: ${lines.length} lines, ${diff.length} chars — representative sample below]`,
      ...hunkHeaders,
      ...removedLines,
      ...addedLines,
    ];

    const summary = parts.join('\n');
    return summary.length <= maxSize ? summary : summary.substring(0, maxSize) + '\n[truncated]';
  }

  // ── Private helpers ───────────────────────────────────────────────────────

  /**
   * Split text at line boundaries so that no chunk exceeds `maxSize` characters.
   */
  private static splitBySize(text: string, maxSize: number): string[] {
    const chunks: string[] = [];
    const lines = text.split('\n');
    let currentChunk = '';

    for (const line of lines) {
      const wouldExceed = currentChunk.length + line.length + 1 > maxSize;
      if (wouldExceed && currentChunk.length > 0) {
        chunks.push(currentChunk);
        currentChunk = line;
      } else {
        currentChunk += (currentChunk ? '\n' : '') + line;
      }
    }

    if (currentChunk) {
      chunks.push(currentChunk);
    }

    return chunks.length > 0 ? chunks : [text];
  }
}
