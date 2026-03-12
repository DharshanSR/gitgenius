import { describe, test, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { GitOperationsHandler } from '../handlers/GitOperationsHandler';
import type { LogOptions, DiffOptions, ReviewOptions, SuggestOptions } from '../types';

describe('GitOperationsHandler', () => {
  let handler: GitOperationsHandler;
  let consoleSpy: ReturnType<typeof jest.spyOn>;

  beforeEach(() => {
    consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
    handler = new GitOperationsHandler();
  });

  afterEach(() => {
    consoleSpy.mockRestore();
    jest.restoreAllMocks();
  });

  describe('showLog', () => {
    test('should show git log entries', async () => {
      const gitService = (handler as any).gitService;
      const mockLogs = {
        total: 3,
        all: [
          { hash: 'abc1234def', message: 'feat: add login', author_name: 'Alice', date: '2024-01-01', refs: '' },
          { hash: 'bcd2345efg', message: 'fix: fix bug', author_name: 'Bob', date: '2024-01-02', refs: '' },
          { hash: 'cde3456fgh', message: 'docs: update', author_name: 'Alice', date: '2024-01-03', refs: '' }
        ]
      };
      jest.spyOn(gitService, 'getLog').mockResolvedValue(mockLogs as any);

      const options: LogOptions = { number: '3' };
      await handler.showLog(options);

      const output = consoleSpy.mock.calls.map(c => c[0] as string).join(' ');
      expect(output).toContain('abc1234');
      expect(output).toContain('feat: add login');
    });

    test('should use default count of 10', async () => {
      const gitService = (handler as any).gitService;
      const mockLogs = { total: 0, all: [] };
      const getLogSpy = jest.spyOn(gitService, 'getLog').mockResolvedValue(mockLogs as any);

      const options: LogOptions = {};
      await handler.showLog(options);

      expect(getLogSpy).toHaveBeenCalledWith(expect.objectContaining({ maxCount: 10 }));
    });

    test('should pass since and author filters', async () => {
      const gitService = (handler as any).gitService;
      const mockLogs = { total: 0, all: [] };
      const getLogSpy = jest.spyOn(gitService, 'getLog').mockResolvedValue(mockLogs as any);

      const options: LogOptions = { number: '5', since: '2024-01-01', author: 'Alice' };
      await handler.showLog(options);

      expect(getLogSpy).toHaveBeenCalledWith(expect.objectContaining({
        maxCount: 5,
        since: '2024-01-01',
        author: 'Alice'
      }));
    });

    test('should throw error when git service fails', async () => {
      const gitService = (handler as any).gitService;
      jest.spyOn(gitService, 'getLog').mockRejectedValue(new Error('git error'));

      await expect(handler.showLog({})).rejects.toThrow('Failed to show log');
    });
  });

  describe('showDiff', () => {
    test('should show staged diff', async () => {
      const gitService = (handler as any).gitService;
      jest.spyOn(gitService, 'getStagedDiff').mockResolvedValue('+ staged change');

      const options: DiffOptions = { staged: true };
      await handler.showDiff(options);

      const output = consoleSpy.mock.calls.map(c => c[0] as string).join(' ');
      expect(output).toContain('staged change');
    });

    test('should show last commit diff', async () => {
      const gitService = (handler as any).gitService;
      jest.spyOn(gitService, 'getLastCommitDiff').mockResolvedValue('+ last commit change');

      const options: DiffOptions = { last: true };
      await handler.showDiff(options);

      const output = consoleSpy.mock.calls.map(c => c[0] as string).join(' ');
      expect(output).toContain('last commit change');
    });

    test('should show file diff', async () => {
      const gitService = (handler as any).gitService;
      jest.spyOn(gitService, 'getFileDiff').mockResolvedValue('+ file specific change');

      const options: DiffOptions = { file: 'src/index.ts' };
      await handler.showDiff(options);

      const output = consoleSpy.mock.calls.map(c => c[0] as string).join(' ');
      expect(output).toContain('file specific change');
    });

    test('should show full diff when no option specified', async () => {
      const gitService = (handler as any).gitService;
      jest.spyOn(gitService, 'getDiff').mockResolvedValue('+ general change');

      const options: DiffOptions = {};
      await handler.showDiff(options);

      const output = consoleSpy.mock.calls.map(c => c[0] as string).join(' ');
      expect(output).toContain('general change');
    });

    test('should warn when no differences found', async () => {
      const gitService = (handler as any).gitService;
      jest.spyOn(gitService, 'getDiff').mockResolvedValue('');

      const options: DiffOptions = {};
      await handler.showDiff(options);

      const output = consoleSpy.mock.calls.map(c => c[0] as string).join(' ');
      expect(output).toContain('No differences');
    });

    test('should throw error when git service fails', async () => {
      const gitService = (handler as any).gitService;
      jest.spyOn(gitService, 'getDiff').mockRejectedValue(new Error('git error'));

      await expect(handler.showDiff({})).rejects.toThrow('Failed to show diff');
    });
  });

  describe('reviewChanges', () => {
    test('should warn when no changes to review', async () => {
      const gitService = (handler as any).gitService;
      jest.spyOn(gitService, 'getStagedDiff').mockResolvedValue('');

      const options: ReviewOptions = {};
      await handler.reviewChanges(options);

      const output = consoleSpy.mock.calls.map(c => c[0] as string).join(' ');
      expect(output).toContain('No changes to review');
    });

    test('should warn when no API key', async () => {
      const gitService = (handler as any).gitService;
      const aiService = (handler as any).aiService;
      jest.spyOn(gitService, 'getStagedDiff').mockResolvedValue('+ some change');
      jest.spyOn(aiService, 'hasApiKey').mockReturnValue(false);

      const options: ReviewOptions = {};
      await handler.reviewChanges(options);

      const output = consoleSpy.mock.calls.map(c => c[0] as string).join(' ');
      expect(output).toContain('API key required');
    });

    test('should perform code review with AI', async () => {
      const gitService = (handler as any).gitService;
      const aiService = (handler as any).aiService;
      jest.spyOn(gitService, 'getStagedDiff').mockResolvedValue('+ new code');
      jest.spyOn(aiService, 'hasApiKey').mockReturnValue(true);
      jest.spyOn(aiService, 'reviewCode').mockResolvedValue('LGTM - looks good');

      const options: ReviewOptions = {};
      await handler.reviewChanges(options);

      const output = consoleSpy.mock.calls.map(c => c[0] as string).join(' ');
      expect(output).toContain('LGTM');
    });

    test('should review specific file diff', async () => {
      const gitService = (handler as any).gitService;
      const aiService = (handler as any).aiService;
      jest.spyOn(gitService, 'getFileDiff').mockResolvedValue('+ file change');
      jest.spyOn(aiService, 'hasApiKey').mockReturnValue(true);
      jest.spyOn(aiService, 'reviewCode').mockResolvedValue('File looks good');

      const options: ReviewOptions = { file: 'src/index.ts' };
      await handler.reviewChanges(options);

      expect(gitService.getFileDiff).toHaveBeenCalledWith('src/index.ts');
    });

    test('should output JSON format when requested', async () => {
      const gitService = (handler as any).gitService;
      const aiService = (handler as any).aiService;
      jest.spyOn(gitService, 'getStagedDiff').mockResolvedValue('+ change');
      jest.spyOn(aiService, 'hasApiKey').mockReturnValue(true);
      jest.spyOn(aiService, 'reviewCode').mockResolvedValue('Code review');

      const options: ReviewOptions = { format: 'json' };
      await handler.reviewChanges(options);

      const output = consoleSpy.mock.calls.map(c => c[0] as string).join(' ');
      expect(output).toContain('{');
    });
  });

  describe('suggestCommitInfo', () => {
    test('should warn when no staged changes', async () => {
      const gitService = (handler as any).gitService;
      jest.spyOn(gitService, 'getStagedDiff').mockResolvedValue('');

      const options: SuggestOptions = {};
      await handler.suggestCommitInfo(options);

      const output = consoleSpy.mock.calls.map(c => c[0] as string).join(' ');
      expect(output).toContain('No staged changes');
    });

    test('should provide basic suggestions without API key', async () => {
      const gitService = (handler as any).gitService;
      const aiService = (handler as any).aiService;
      jest.spyOn(gitService, 'getStagedDiff').mockResolvedValue('+ some change');
      jest.spyOn(aiService, 'hasApiKey').mockReturnValue(false);

      const options: SuggestOptions = {};
      await handler.suggestCommitInfo(options);

      const output = consoleSpy.mock.calls.map(c => c[0] as string).join(' ');
      expect(output).toContain('feat');
    });

    test('should suggest commit type with AI', async () => {
      const gitService = (handler as any).gitService;
      const aiService = (handler as any).aiService;
      jest.spyOn(gitService, 'getStagedDiff').mockResolvedValue('+ new feature');
      jest.spyOn(aiService, 'hasApiKey').mockReturnValue(true);
      jest.spyOn(aiService, 'suggestCommitType').mockResolvedValue('feat');
      jest.spyOn(aiService, 'suggestCommitScope').mockResolvedValue('auth');

      const options: SuggestOptions = { type: true };
      await handler.suggestCommitInfo(options);

      expect(aiService.suggestCommitType).toHaveBeenCalled();
    });

    test('should suggest commit scope with AI', async () => {
      const gitService = (handler as any).gitService;
      const aiService = (handler as any).aiService;
      jest.spyOn(gitService, 'getStagedDiff').mockResolvedValue('+ auth changes');
      jest.spyOn(aiService, 'hasApiKey').mockReturnValue(true);
      jest.spyOn(aiService, 'suggestCommitType').mockResolvedValue('feat');
      jest.spyOn(aiService, 'suggestCommitScope').mockResolvedValue('auth');

      const options: SuggestOptions = { scope: true };
      await handler.suggestCommitInfo(options);

      expect(aiService.suggestCommitScope).toHaveBeenCalled();
    });
  });
});
