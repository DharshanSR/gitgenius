import { describe, test, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { GitService } from '../services/GitService';

describe('GitService', () => {
  let gitService: GitService;
  let consoleSpy: ReturnType<typeof jest.spyOn>;

  beforeEach(() => {
    gitService = new GitService();
    consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
    jest.restoreAllMocks();
  });

  describe('calculateStats', () => {
    test('should calculate total commits', () => {
      const logs = {
        total: 5,
        all: [
          { author_name: 'Alice', message: 'feat: add feature' },
          { author_name: 'Bob', message: 'fix: fix bug' },
          { author_name: 'Alice', message: 'docs: update readme' },
          { author_name: 'Alice', message: 'feat: new component' },
          { author_name: 'Bob', message: 'chore: cleanup' }
        ]
      };

      const stats = gitService.calculateStats(logs);
      expect(stats.totalCommits).toBe(5);
    });

    test('should count commits by author', () => {
      const logs = {
        total: 3,
        all: [
          { author_name: 'Alice', message: 'feat: feature 1' },
          { author_name: 'Bob', message: 'fix: bug' },
          { author_name: 'Alice', message: 'feat: feature 2' }
        ]
      };

      const stats = gitService.calculateStats(logs);
      expect(stats.authors['Alice']).toBe(2);
      expect(stats.authors['Bob']).toBe(1);
    });

    test('should count conventional commit types', () => {
      const logs = {
        total: 4,
        all: [
          { author_name: 'Dev', message: 'feat: add login' },
          { author_name: 'Dev', message: 'fix: fix crash' },
          { author_name: 'Dev', message: 'feat: add dashboard' },
          { author_name: 'Dev', message: 'docs: update readme' }
        ]
      };

      const stats = gitService.calculateStats(logs);
      expect(stats.commitTypes['feat']).toBe(2);
      expect(stats.commitTypes['fix']).toBe(1);
      expect(stats.commitTypes['docs']).toBe(1);
    });

    test('should handle commits with scoped types', () => {
      const logs = {
        total: 2,
        all: [
          { author_name: 'Dev', message: 'feat(auth): add login' },
          { author_name: 'Dev', message: 'fix(ui): fix button' }
        ]
      };

      const stats = gitService.calculateStats(logs);
      expect(stats.commitTypes['feat']).toBe(1);
      expect(stats.commitTypes['fix']).toBe(1);
    });

    test('should not count commits without conventional format', () => {
      const logs = {
        total: 2,
        all: [
          { author_name: 'Dev', message: 'Updated something' },
          { author_name: 'Dev', message: 'Fix the bug' }
        ]
      };

      const stats = gitService.calculateStats(logs);
      expect(Object.keys(stats.commitTypes)).toHaveLength(0);
    });

    test('should handle commits without author_name', () => {
      const logs = {
        total: 1,
        all: [
          { author_name: null, message: 'feat: something' }
        ]
      };

      const stats = gitService.calculateStats(logs);
      expect(Object.keys(stats.authors)).toHaveLength(0);
    });

    test('should initialize filesChanged, linesAdded, linesDeleted to zero', () => {
      const logs = { total: 0, all: [] };
      const stats = gitService.calculateStats(logs);
      expect(stats.filesChanged).toBe(0);
      expect(stats.linesAdded).toBe(0);
      expect(stats.linesDeleted).toBe(0);
    });

    test('should handle empty commit list', () => {
      const logs = { total: 0, all: [] };
      const stats = gitService.calculateStats(logs);
      expect(stats.totalCommits).toBe(0);
      expect(stats.authors).toEqual({});
      expect(stats.commitTypes).toEqual({});
    });
  });

  describe('displayStats', () => {
    test('should display stats with total commits', () => {
      const stats = {
        totalCommits: 10,
        authors: { Alice: 5, Bob: 3 },
        commitTypes: { feat: 4, fix: 3 },
        filesChanged: 0,
        linesAdded: 0,
        linesDeleted: 0
      };

      gitService.displayStats(stats, 7);
      expect(consoleSpy).toHaveBeenCalled();
      const calls = consoleSpy.mock.calls.map(c => c[0] as string);
      const hasStats = calls.some(c => c.includes('10') || c.includes('Git Statistics'));
      expect(hasStats).toBe(true);
    });

    test('should display stats with author filter', () => {
      const stats = {
        totalCommits: 3,
        authors: { Alice: 3 },
        commitTypes: { feat: 2 },
        filesChanged: 0,
        linesAdded: 0,
        linesDeleted: 0
      };

      gitService.displayStats(stats, 30, 'Alice');
      const calls = consoleSpy.mock.calls.map(c => c[0] as string);
      const hasAuthor = calls.some(c => c.includes('Alice'));
      expect(hasAuthor).toBe(true);
    });

    test('should not display authors section when authors is empty', () => {
      const stats = {
        totalCommits: 0,
        authors: {},
        commitTypes: {},
        filesChanged: 0,
        linesAdded: 0,
        linesDeleted: 0
      };

      gitService.displayStats(stats, 7);
      const calls = consoleSpy.mock.calls.map(c => c[0] as string);
      const hasAuthorSection = calls.some(c => c.includes('Commits by author'));
      expect(hasAuthorSection).toBe(false);
    });

    test('should sort authors by commit count descending', () => {
      const stats = {
        totalCommits: 5,
        authors: { Alice: 1, Bob: 3, Charlie: 1 },
        commitTypes: {},
        filesChanged: 0,
        linesAdded: 0,
        linesDeleted: 0
      };

      gitService.displayStats(stats, 7);
      const calls = consoleSpy.mock.calls.map(c => c[0] as string);
      const aliceIdx = calls.findIndex(c => c.includes('Alice'));
      const bobIdx = calls.findIndex(c => c.includes('Bob'));
      // Bob (3 commits) should appear before Alice (1 commit)
      expect(bobIdx).toBeLessThan(aliceIdx);
    });

    test('should display commit types section', () => {
      const stats = {
        totalCommits: 5,
        authors: {},
        commitTypes: { feat: 3, fix: 2 },
        filesChanged: 0,
        linesAdded: 0,
        linesDeleted: 0
      };

      gitService.displayStats(stats, 7);
      const calls = consoleSpy.mock.calls.map(c => c[0] as string);
      const hasTypeSection = calls.some(c => c.includes('Commits by type'));
      expect(hasTypeSection).toBe(true);
    });
  });

  describe('checkIsRepo (spied)', () => {
    test('should return true for a repository', async () => {
      jest.spyOn(gitService, 'checkIsRepo').mockResolvedValue(true);
      const result = await gitService.checkIsRepo();
      expect(result).toBe(true);
    });

    test('should return false when not in a repository', async () => {
      jest.spyOn(gitService, 'checkIsRepo').mockResolvedValue(false);
      const result = await gitService.checkIsRepo();
      expect(result).toBe(false);
    });
  });

  describe('ensureGitRepo (spied)', () => {
    test('should not throw when in a git repo', async () => {
      jest.spyOn(gitService, 'checkIsRepo').mockResolvedValue(true);
      await expect(gitService.ensureGitRepo()).resolves.toBeUndefined();
    });

    test('should throw when not in a git repo', async () => {
      jest.spyOn(gitService, 'checkIsRepo').mockResolvedValue(false);
      await expect(gitService.ensureGitRepo()).rejects.toThrow('Not in a git repository');
    });
  });

  describe('getCurrentBranch (spied)', () => {
    test('should return the current branch name', async () => {
      jest.spyOn(gitService, 'getCurrentBranch').mockResolvedValue('main');
      const branch = await gitService.getCurrentBranch();
      expect(branch).toBe('main');
    });

    test('should return feature branch name', async () => {
      jest.spyOn(gitService, 'getCurrentBranch').mockResolvedValue('feature/new-feature');
      const branch = await gitService.getCurrentBranch();
      expect(branch).toBe('feature/new-feature');
    });
  });

  describe('getStatus (spied)', () => {
    test('should return status object', async () => {
      const mockStatus = { staged: ['file.ts'], current: 'main', modified: [] };
      jest.spyOn(gitService, 'getStatus').mockResolvedValue(mockStatus as any);
      const status = await gitService.getStatus();
      expect(status.staged).toEqual(['file.ts']);
      expect(status.current).toBe('main');
    });
  });

  describe('getDiff (spied)', () => {
    test('should return diff string', async () => {
      const mockDiff = '+ added line\n- removed line';
      jest.spyOn(gitService, 'getDiff').mockResolvedValue(mockDiff);
      const diff = await gitService.getDiff();
      expect(diff).toBe(mockDiff);
    });

    test('should pass options to getDiff', async () => {
      const spy = jest.spyOn(gitService, 'getDiff').mockResolvedValue('diff');
      await gitService.getDiff(['--staged']);
      expect(spy).toHaveBeenCalledWith(['--staged']);
    });
  });

  describe('getStagedDiff (spied)', () => {
    test('should return staged diff', async () => {
      const mockDiff = '+ new feature code';
      jest.spyOn(gitService, 'getStagedDiff').mockResolvedValue(mockDiff);
      const diff = await gitService.getStagedDiff();
      expect(diff).toBe(mockDiff);
    });
  });

  describe('getLastCommitDiff (spied)', () => {
    test('should return last commit diff', async () => {
      const mockDiff = '+ last commit changes';
      jest.spyOn(gitService, 'getLastCommitDiff').mockResolvedValue(mockDiff);
      const diff = await gitService.getLastCommitDiff();
      expect(diff).toBe(mockDiff);
    });
  });

  describe('commit (spied)', () => {
    test('should commit with message', async () => {
      const spy = jest.spyOn(gitService, 'commit').mockResolvedValue(undefined);
      await gitService.commit('feat: test commit');
      expect(spy).toHaveBeenCalledWith('feat: test commit');
    });
  });

  describe('reset (spied)', () => {
    test('should call reset with options', async () => {
      const spy = jest.spyOn(gitService, 'reset').mockResolvedValue(undefined);
      await gitService.reset(['--soft', 'HEAD~1']);
      expect(spy).toHaveBeenCalledWith(['--soft', 'HEAD~1']);
    });
  });

  describe('getStateManager', () => {
    test('should return state manager instance', () => {
      const stateManager = gitService.getStateManager();
      expect(stateManager).toBeDefined();
    });
  });

  describe('checkDetachedHead (spied)', () => {
    test('should return false when not in detached HEAD state', async () => {
      jest.spyOn(gitService, 'checkDetachedHead').mockResolvedValue(false);
      const result = await gitService.checkDetachedHead();
      expect(result).toBe(false);
    });

    test('should return true when in detached HEAD state', async () => {
      jest.spyOn(gitService, 'checkDetachedHead').mockResolvedValue(true);
      const result = await gitService.checkDetachedHead();
      expect(result).toBe(true);
    });
  });
});
