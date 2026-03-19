import { describe, test, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { CommitHandler } from '../handlers/CommitHandler';
import type { CommitOptions, PreviousCommitOptions } from '../types';

describe('CommitHandler', () => {
  let commitHandler: CommitHandler;
  let consoleSpy: ReturnType<typeof jest.spyOn>;

  beforeEach(() => {
    consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    commitHandler = new CommitHandler();
  });

  afterEach(() => {
    consoleSpy.mockRestore();
    jest.restoreAllMocks();
  });

  describe('getLastCommitMessage and setLastCommitMessage', () => {
    test('should return null initially', () => {
      expect(commitHandler.getLastCommitMessage()).toBeNull();
    });

    test('should set and get a commit message', () => {
      commitHandler.setLastCommitMessage('feat: new feature');
      expect(commitHandler.getLastCommitMessage()).toBe('feat: new feature');
    });

    test('should update the last commit message', () => {
      commitHandler.setLastCommitMessage('feat: first message');
      commitHandler.setLastCommitMessage('fix: updated message');
      expect(commitHandler.getLastCommitMessage()).toBe('fix: updated message');
    });

    test('should store arbitrary commit message strings', () => {
      const message = 'chore(deps): update dependencies to latest versions\n\nBreaking changes: none';
      commitHandler.setLastCommitMessage(message);
      expect(commitHandler.getLastCommitMessage()).toBe(message);
    });
  });

  describe('generateCommit', () => {
    test('should throw when not in a git repository', async () => {
      const gitService = (commitHandler as any).gitService;
      jest.spyOn(gitService, 'checkIsRepo').mockResolvedValue(false);

      const options: CommitOptions = {};
      await expect(commitHandler.generateCommit(options)).rejects.toThrow(/Generate commit failed/);
    });

    test('should warn when no staged changes', async () => {
      const gitService = (commitHandler as any).gitService;
      jest.spyOn(gitService, 'checkIsRepo').mockResolvedValue(true);
      jest.spyOn(gitService, 'getStatus').mockResolvedValue({ staged: [], current: 'main' } as any);
      jest.spyOn(gitService, 'getStagedDiff').mockResolvedValue('');

      const options: CommitOptions = {};
      await commitHandler.generateCommit(options);

      const output = consoleSpy.mock.calls.map(c => c[0] as string).join(' ');
      expect(output).toContain('No staged changes');
    });

    test('should generate and display commit message', async () => {
      const gitService = (commitHandler as any).gitService;
      const aiService = (commitHandler as any).aiService;
      const configManager = (commitHandler as any).configManager;

      jest.spyOn(gitService, 'checkIsRepo').mockResolvedValue(true);
      jest.spyOn(gitService, 'getStatus').mockResolvedValue({ staged: ['file.ts'] } as any);
      jest.spyOn(gitService, 'getStagedDiff').mockResolvedValue('+ new code');
      jest.spyOn(aiService, 'generateCommitMessage').mockResolvedValue('feat: add new feature');
      jest.spyOn(configManager, 'getConfig').mockReturnValue([]);
      jest.spyOn(configManager, 'setConfigValue').mockReturnValue(undefined);

      const options: CommitOptions = {};
      await commitHandler.generateCommit(options);

      expect(commitHandler.getLastCommitMessage()).toBe('feat: add new feature');
      const output = consoleSpy.mock.calls.map(c => c[0] as string).join(' ');
      expect(output).toContain('feat: add new feature');
    });

    test('should show dry run message when dryRun is true', async () => {
      const gitService = (commitHandler as any).gitService;
      const aiService = (commitHandler as any).aiService;
      const configManager = (commitHandler as any).configManager;

      jest.spyOn(gitService, 'checkIsRepo').mockResolvedValue(true);
      jest.spyOn(gitService, 'getStatus').mockResolvedValue({ staged: ['file.ts'] } as any);
      jest.spyOn(gitService, 'getStagedDiff').mockResolvedValue('+ new code');
      jest.spyOn(aiService, 'generateCommitMessage').mockResolvedValue('feat: dry run feature');
      jest.spyOn(configManager, 'getConfig').mockReturnValue([]);
      jest.spyOn(configManager, 'setConfigValue').mockReturnValue(undefined);

      const options: CommitOptions = { dryRun: true };
      await commitHandler.generateCommit(options);

      const output = consoleSpy.mock.calls.map(c => c[0] as string).join(' ');
      expect(output).toContain('DRY RUN');
    });

    test('should handle AI service errors', async () => {
      const gitService = (commitHandler as any).gitService;
      const aiService = (commitHandler as any).aiService;

      jest.spyOn(gitService, 'checkIsRepo').mockResolvedValue(true);
      jest.spyOn(gitService, 'getStatus').mockResolvedValue({ staged: ['file.ts'] } as any);
      jest.spyOn(gitService, 'getStagedDiff').mockResolvedValue('+ new code');
      jest.spyOn(aiService, 'generateCommitMessage').mockRejectedValue(new Error('AI service unavailable'));

      const options: CommitOptions = {};
      await expect(commitHandler.generateCommit(options)).rejects.toThrow(/Generate commit failed/);
    });
  });

  describe('handlePreviousCommit', () => {
    test('should warn when no previous commit message', async () => {
      const options: PreviousCommitOptions = {};
      await commitHandler.handlePreviousCommit(options);

      const output = consoleSpy.mock.calls.map(c => c[0] as string).join(' ');
      expect(output).toContain('No previous commit message');
    });

    test('should display previous commit message when available', async () => {
      commitHandler.setLastCommitMessage('feat: previous feature');
      const options: PreviousCommitOptions = {};
      await commitHandler.handlePreviousCommit(options);

      const output = consoleSpy.mock.calls.map(c => c[0] as string).join(' ');
      expect(output).toContain('feat: previous feature');
    });

    test('should copy message to clipboard when copy is true', async () => {
      commitHandler.setLastCommitMessage('feat: copy this message');

      // Mock clipboardy dynamically
      const clipboardy = await import('clipboardy');
      const writeSpy = jest.spyOn(clipboardy, 'write').mockResolvedValue(undefined);

      const options: PreviousCommitOptions = { copy: true };
      await commitHandler.handlePreviousCommit(options);

      expect(writeSpy).toHaveBeenCalledWith('feat: copy this message');
      writeSpy.mockRestore();
    });
  });
});
