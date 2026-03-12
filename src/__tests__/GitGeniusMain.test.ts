/**
 * Tests for the main GitGenius class (core/GitGenius.ts)
 * This is the primary 912-line class with all core functionality
 */
import { describe, test, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { GitGenius } from '../core/GitGenius';
import inquirer from 'inquirer';
import type { CommitOptions, StatsOptions, TemplateOptions, LogOptions, DiffOptions } from '../types';

describe('GitGenius (main class)', () => {
  let gitGenius: GitGenius;
  let consoleSpy: ReturnType<typeof jest.spyOn>;

  beforeEach(() => {
    consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    gitGenius = new GitGenius();
  });

  afterEach(() => {
    consoleSpy.mockRestore();
    jest.restoreAllMocks();
  });

  describe('constructor', () => {
    test('should create instance', () => {
      expect(gitGenius).toBeDefined();
      expect(gitGenius instanceof GitGenius).toBe(true);
    });
  });

  describe('generateCommit', () => {
    test('should throw error when not in git repo', async () => {
      const git = (gitGenius as any).git;
      jest.spyOn(git, 'checkIsRepo').mockResolvedValue(false);

      const options: CommitOptions = {};
      await expect(gitGenius.generateCommit(options)).rejects.toThrow(/Generate commit failed/);
    });

    test('should warn when no staged changes', async () => {
      const git = (gitGenius as any).git;
      jest.spyOn(git, 'checkIsRepo').mockResolvedValue(true);
      jest.spyOn(git, 'status').mockResolvedValue({ staged: [] } as any);

      const options: CommitOptions = {};
      await gitGenius.generateCommit(options);

      const output = consoleSpy.mock.calls.map(c => c[0] as string).join(' ');
      expect(output).toContain('No staged changes');
    });

    test('should generate commit message with staged changes', async () => {
      const git = (gitGenius as any).git;
      const configManager = (gitGenius as any).configManager;

      jest.spyOn(git, 'checkIsRepo').mockResolvedValue(true);
      jest.spyOn(git, 'status').mockResolvedValue({ staged: ['file.ts'] } as any);
      jest.spyOn(git, 'diff').mockResolvedValue('+ new code\n');
      jest.spyOn(configManager, 'getConfig').mockReturnValue([]);
      jest.spyOn(configManager, 'setConfigValue').mockReturnValue(undefined);
      jest.spyOn(configManager, 'getApiKey').mockReturnValue('test-key-1234567890');

      // Mock OpenAI/Gemini provider
      const providerMock = {
        name: 'openai',
        generateCommitMessage: jest.fn<() => Promise<string>>().mockResolvedValue('feat: add new feature')
      };
      jest.spyOn(gitGenius as any, 'getAIProvider').mockReturnValue(providerMock);

      const options: CommitOptions = {};
      await gitGenius.generateCommit(options);

      const output = consoleSpy.mock.calls.map(c => c[0] as string).join(' ');
      expect(output).toContain('feat: add new feature');
    });
  });

  describe('handlePreviousCommit', () => {
    test('should warn when no previous commit message', async () => {
      await gitGenius.handlePreviousCommit({});
      const output = consoleSpy.mock.calls.map(c => c[0] as string).join(' ');
      expect(output).toContain('No previous commit message');
    });

    test('should display previous commit message', async () => {
      // Set a last commit message via internal state
      (gitGenius as any).lastCommitMessage = 'feat: previous feature';
      await gitGenius.handlePreviousCommit({});

      const output = consoleSpy.mock.calls.map(c => c[0] as string).join(' ');
      expect(output).toContain('feat: previous feature');
    });

    test('should copy message to clipboard when copy option set', async () => {
      (gitGenius as any).lastCommitMessage = 'feat: copy me';
      const clipboardy = await import('clipboardy');
      const writeSpy = jest.spyOn(clipboardy, 'write').mockResolvedValue(undefined);

      await gitGenius.handlePreviousCommit({ copy: true });

      expect(writeSpy).toHaveBeenCalledWith('feat: copy me');
    });
  });

  describe('showStats', () => {
    test('should display stats for repository', async () => {
      const git = (gitGenius as any).git;
      jest.spyOn(git, 'log').mockResolvedValue({
        total: 5,
        all: [
          { author_name: 'Alice', message: 'feat: feature 1' },
          { author_name: 'Bob', message: 'fix: bug fix' },
          { author_name: 'Alice', message: 'docs: docs update' },
          { author_name: 'Alice', message: 'feat: feature 2' },
          { author_name: 'Bob', message: 'chore: cleanup' }
        ]
      } as any);

      const options: StatsOptions = { days: '7' };
      await gitGenius.showStats(options);

      const output = consoleSpy.mock.calls.map(c => c[0] as string).join(' ');
      expect(output).toContain('5');
    });

    test('should filter by author', async () => {
      const git = (gitGenius as any).git;
      const logSpy = jest.spyOn(git, 'log').mockResolvedValue({
        total: 2,
        all: [
          { author_name: 'Alice', message: 'feat: something' },
          { author_name: 'Alice', message: 'fix: something else' }
        ]
      } as any);

      const options: StatsOptions = { days: '30', author: 'Alice' };
      await gitGenius.showStats(options);

      expect(logSpy).toHaveBeenCalledWith(expect.objectContaining({ author: 'Alice' }));
    });

    test('should throw on git error', async () => {
      const git = (gitGenius as any).git;
      jest.spyOn(git, 'log').mockRejectedValue(new Error('git error'));

      await expect(gitGenius.showStats({ days: '7' })).rejects.toThrow('Failed to generate stats');
    });
  });

  describe('handleTemplates', () => {
    test('should list templates', async () => {
      const configManager = (gitGenius as any).configManager;
      jest.spyOn(configManager, 'getConfig').mockReturnValue([
        { name: 'test-template', pattern: 'feat: {d}', description: 'Test' }
      ]);

      await gitGenius.handleTemplates({ list: true });

      const output = consoleSpy.mock.calls.map(c => c[0] as string).join(' ');
      expect(output).toContain('test-template');
    });

    test('should show warning for empty template list', async () => {
      const configManager = (gitGenius as any).configManager;
      jest.spyOn(configManager, 'getConfig').mockReturnValue([]);

      await gitGenius.handleTemplates({ list: true });

      const output = consoleSpy.mock.calls.map(c => c[0] as string).join(' ');
      expect(output).toContain('No templates');
    });

    test('should remove template', async () => {
      const configManager = (gitGenius as any).configManager;
      jest.spyOn(configManager, 'getConfig').mockReturnValue([
        { name: 'to-remove', pattern: 'fix: {d}', description: 'To remove' }
      ]);
      const setSpy = jest.spyOn(configManager, 'setConfigValue').mockReturnValue(undefined);

      await gitGenius.handleTemplates({ remove: 'to-remove' });

      expect(setSpy).toHaveBeenCalledWith('templates', []);
    });

    test('should use template', async () => {
      const configManager = (gitGenius as any).configManager;
      jest.spyOn(configManager, 'getConfig').mockReturnValue([
        { name: 'mytemplate', pattern: 'feat({scope}): {desc}', description: 'Feature' }
      ]);

      await gitGenius.handleTemplates({ use: 'mytemplate' });

      expect((gitGenius as any).lastCommitMessage).toBe('feat({scope}): {desc}');
    });

    test('should warn when template not found', async () => {
      const configManager = (gitGenius as any).configManager;
      jest.spyOn(configManager, 'getConfig').mockReturnValue([]);

      await gitGenius.handleTemplates({ use: 'nonexistent' });

      const output = consoleSpy.mock.calls.map(c => c[0] as string).join(' ');
      expect(output).toContain('not found');
    });
  });

  describe('showLog', () => {
    test('should display git log', async () => {
      const git = (gitGenius as any).git;
      jest.spyOn(git, 'log').mockResolvedValue({
        total: 2,
        all: [
          { hash: 'abc1234567', message: 'feat: new', author_name: 'Dev', date: '2024-01-01', refs: '' },
          { hash: 'def8901234', message: 'fix: bug', author_name: 'Dev', date: '2024-01-02', refs: '' }
        ]
      } as any);

      const options: LogOptions = { number: '2' };
      await gitGenius.showLog(options);

      const output = consoleSpy.mock.calls.map(c => c[0] as string).join(' ');
      expect(output).toContain('feat: new');
    });

    test('should throw on git error', async () => {
      const git = (gitGenius as any).git;
      jest.spyOn(git, 'log').mockRejectedValue(new Error('git failed'));

      await expect(gitGenius.showLog({})).rejects.toThrow('Failed to show log');
    });
  });

  describe('showDiff', () => {
    test('should show staged diff', async () => {
      const git = (gitGenius as any).git;
      jest.spyOn(git, 'diff').mockResolvedValue('+ staged change');

      const options: DiffOptions = { staged: true };
      await gitGenius.showDiff(options);

      const output = consoleSpy.mock.calls.map(c => c[0] as string).join(' ');
      expect(output).toContain('staged change');
    });

    test('should warn when no differences found', async () => {
      const git = (gitGenius as any).git;
      jest.spyOn(git, 'diff').mockResolvedValue('');

      const options: DiffOptions = {};
      await gitGenius.showDiff(options);

      const output = consoleSpy.mock.calls.map(c => c[0] as string).join(' ');
      expect(output).toContain('No differences');
    });
  });

  describe('undoChanges', () => {
    test('should warn when no option specified', async () => {
      await gitGenius.undoChanges({});
      const output = consoleSpy.mock.calls.map(c => c[0] as string).join(' ');
      expect(output).toContain('Please specify');
    });

    test('should perform soft reset when confirmed', async () => {
      const git = (gitGenius as any).git;
      jest.spyOn(inquirer, 'prompt').mockResolvedValue({ confirmed: true } as any);
      const resetSpy = jest.spyOn(git, 'reset').mockResolvedValue(undefined);

      await gitGenius.undoChanges({ commit: true });

      expect(resetSpy).toHaveBeenCalled();
    });

    test('should unstage all changes', async () => {
      const git = (gitGenius as any).git;
      const resetSpy = jest.spyOn(git, 'reset').mockResolvedValue(undefined);

      await gitGenius.undoChanges({ staged: true });

      expect(resetSpy).toHaveBeenCalled();
    });
  });

  describe('showHistory', () => {
    test('should warn when history is empty', async () => {
      const configManager = (gitGenius as any).configManager;
      jest.spyOn(configManager, 'getConfig').mockReturnValue([]);

      await gitGenius.showHistory({});

      const output = consoleSpy.mock.calls.map(c => c[0] as string).join(' ');
      expect(output).toContain('No message history');
    });

    test('should display message history', async () => {
      const configManager = (gitGenius as any).configManager;
      jest.spyOn(configManager, 'getConfig').mockReturnValue([
        { message: 'feat: old feature', type: 'feat', timestamp: '2024-01-01T10:00:00.000Z' }
      ]);

      await gitGenius.showHistory({});

      const output = consoleSpy.mock.calls.map(c => c[0] as string).join(' ');
      expect(output).toContain('feat: old feature');
    });
  });

  describe('manageAliases', () => {
    test('should list aliases', async () => {
      const configManager = (gitGenius as any).configManager;
      jest.spyOn(configManager, 'getConfig').mockReturnValue({ test: 'gitgenius -t feat' });

      await gitGenius.manageAliases({ list: true });

      const output = consoleSpy.mock.calls.map(c => c[0] as string).join(' ');
      expect(output).toContain('test');
    });
  });
});
