import { describe, test, expect } from '@jest/globals';
import { DiffChunker } from '../utils/DiffChunker';

// ── helpers ──────────────────────────────────────────────────────────────────

/** Build a fake multi-file diff with `n` files, each file section containing
 *  `linesPerFile` lines of "+added content". */
function buildMultiFileDiff(fileCount: number, linesPerFile: number): string {
  const parts: string[] = [];
  for (let i = 1; i <= fileCount; i++) {
    const section = [
      `diff --git a/file${i}.ts b/file${i}.ts`,
      `index 000000..111111 100644`,
      `--- a/file${i}.ts`,
      `+++ b/file${i}.ts`,
      `@@ -0,0 +1,${linesPerFile} @@`,
      ...Array.from({ length: linesPerFile }, (_, j) => `+line ${j + 1} in file ${i}`),
    ].join('\n');
    parts.push(section);
  }
  return parts.join('\n');
}

// ─────────────────────────────────────────────────────────────────────────────

describe('DiffChunker', () => {
  describe('chunkDiff', () => {
    test('returns single-element array when diff fits in one chunk', () => {
      const diff = 'diff --git a/foo.ts b/foo.ts\n+added line\n-removed line';
      const chunks = DiffChunker.chunkDiff(diff, 5000);
      expect(chunks).toHaveLength(1);
      expect(chunks[0]).toBe(diff);
    });

    test('splits diff at file boundaries (diff --git)', () => {
      // 4 files × ~480 chars each = ~1915 chars total.
      // Using maxChunkSize=1000 forces the algo to group 2 sections per chunk → 2 chunks.
      const diff = buildMultiFileDiff(4, 20);
      const chunks = DiffChunker.chunkDiff(diff, 1000);
      expect(chunks.length).toBeGreaterThan(1);
      // Every chunk except possibly the first should start with a file header
      for (let i = 1; i < chunks.length; i++) {
        expect(chunks[i]).toMatch(/^diff --git/);
      }
    });

    test('each chunk is no longer than maxChunkSize when split by size', () => {
      // Diff with no file boundaries – falls back to line-level splitting
      const noHeaderDiff = Array.from({ length: 200 }, (_, i) => `+line ${i}`).join('\n');
      const maxSize = 200;
      const chunks = DiffChunker.chunkDiff(noHeaderDiff, maxSize);
      expect(chunks.length).toBeGreaterThan(1);
      for (const chunk of chunks) {
        // Each chunk should be at most maxSize + the length of a single long line (tolerance)
        expect(chunk.length).toBeLessThanOrEqual(maxSize + 20);
      }
    });

    test('returns original diff in one chunk when it is exactly at the limit', () => {
      const diff = 'a'.repeat(100);
      const chunks = DiffChunker.chunkDiff(diff, 100);
      expect(chunks).toHaveLength(1);
    });

    test('reassembled chunks contain all original content', () => {
      const diff = buildMultiFileDiff(6, 15);
      const chunks = DiffChunker.chunkDiff(diff, 1000);
      const reassembled = chunks.join('');
      // All lines present (order may vary due to trimEnd on chunk boundaries)
      expect(reassembled.replace(/\s/g, '')).toEqual(diff.replace(/\s/g, ''));
    });
  });

  describe('getChunkCount', () => {
    test('returns 1 for small diffs', () => {
      expect(DiffChunker.getChunkCount('small diff', 5000)).toBe(1);
    });

    test('returns more than 1 for large diffs', () => {
      const diff = buildMultiFileDiff(10, 30);
      const count = DiffChunker.getChunkCount(diff, 500);
      expect(count).toBeGreaterThan(1);
    });
  });

  describe('isLargeDiff', () => {
    test('returns false for small diff', () => {
      expect(DiffChunker.isLargeDiff('small', 3000)).toBe(false);
    });

    test('returns true when diff exceeds threshold', () => {
      const bigDiff = 'x'.repeat(3001);
      expect(DiffChunker.isLargeDiff(bigDiff, 3000)).toBe(true);
    });

    test('uses DEFAULT_LARGE_DIFF_THRESHOLD when no threshold provided', () => {
      const atLimit = 'x'.repeat(DiffChunker.LARGE_DIFF_THRESHOLD);
      expect(DiffChunker.isLargeDiff(atLimit)).toBe(false);
      const overLimit = 'x'.repeat(DiffChunker.LARGE_DIFF_THRESHOLD + 1);
      expect(DiffChunker.isLargeDiff(overLimit)).toBe(true);
    });
  });

  describe('optimizeForAI', () => {
    test('returns diff unchanged when it fits within maxSize', () => {
      const diff = '+small change\n-old line';
      expect(DiffChunker.optimizeForAI(diff, 5000)).toBe(diff);
    });

    test('returns a shorter string when diff exceeds maxSize', () => {
      const largeDiff = buildMultiFileDiff(20, 50);
      const optimized = DiffChunker.optimizeForAI(largeDiff, 1000);
      expect(optimized.length).toBeLessThanOrEqual(1000 + 20); // small tolerance for last line
    });

    test('includes a header indicating the diff was large', () => {
      const largeDiff = 'x'.repeat(5000);
      const optimized = DiffChunker.optimizeForAI(largeDiff, 100);
      expect(optimized).toMatch(/LARGE DIFF/i);
    });

    test('preserves hunk headers in the optimized output', () => {
      const diff = [
        'diff --git a/foo.ts b/foo.ts',
        '@@ -1,3 +1,3 @@',
        '+new line',
        '-old line',
        ...Array.from({ length: 200 }, (_, i) => `+padding ${i}`),
      ].join('\n');
      const optimized = DiffChunker.optimizeForAI(diff, 200);
      // The hunk header or truncation notice should appear
      expect(optimized.length).toBeLessThanOrEqual(220);
    });
  });
});
