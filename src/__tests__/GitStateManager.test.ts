/**
 * Tests for GitStateManager
 * 
 * Note: These tests validate the API and structure of GitStateManager.
 * Some tests may be skipped in CI/CD environments without a full Git setup.
 */
import { describe, test, expect, jest, beforeEach, afterEach } from '@jest/globals';

// Import types only to avoid runtime module issues
import type { GitState, WorktreeInfo, SubmoduleInfo } from '../utils/GitStateManager';
import { GitStateManager } from '../utils/GitStateManager';

describe('GitStateManager API', () => {
  test('should export GitState interface', () => {
    // Test that the type exists
    const mockState: GitState = {
      isDetachedHead: false,
      hasConflicts: false,
      hasMergeInProgress: false,
      hasRebaseInProgress: false,
      isDirty: false,
      hasUncommittedChanges: false,
      hasUntrackedFiles: false,
      hasStagedChanges: false,
      currentBranch: 'main',
      currentCommit: 'abc123'
    };

    expect(mockState.isDetachedHead).toBe(false);
    expect(mockState.currentBranch).toBe('main');
  });

  test('should export WorktreeInfo interface', () => {
    const mockWorktree: WorktreeInfo = {
      path: '/path/to/worktree',
      branch: 'main',
      commit: 'abc123',
      isMain: true
    };

    expect(mockWorktree.path).toBe('/path/to/worktree');
    expect(mockWorktree.isMain).toBe(true);
  });

  test('should export SubmoduleInfo interface', () => {
    const mockSubmodule: SubmoduleInfo = {
      path: 'path/to/submodule',
      url: 'https://github.com/user/repo.git',
      branch: 'main',
      commit: 'abc123',
      isInitialized: true
    };

    expect(mockSubmodule.path).toBe('path/to/submodule');
    expect(mockSubmodule.isInitialized).toBe(true);
  });
});

describe('GitStateManager Module', () => {
  test('should have correct type definitions', () => {
    // Test that TypeScript types are correctly exported
    const state: Partial<GitState> = {
      isDetachedHead: true
    };
    
    expect(state.isDetachedHead).toBe(true);
  });

  test('should have WorktreeInfo with correct structure', () => {
    const worktree: Partial<WorktreeInfo> = {
      path: '/test',
      isMain: false
    };
    
    expect(worktree.path).toBe('/test');
  });

  test('should have SubmoduleInfo with correct structure', () => {
    const submodule: Partial<SubmoduleInfo> = {
      path: 'submodule',
      isInitialized: false
    };
    
    expect(submodule.isInitialized).toBe(false);
  });
});

describe('GitStateManager class', () => {
  let stateManager: GitStateManager;
  let consoleSpy: ReturnType<typeof jest.spyOn>;

  beforeEach(() => {
    stateManager = new GitStateManager();
    consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
    jest.restoreAllMocks();
  });

  describe('getState', () => {
    test('should return git state object', async () => {
      const git = (stateManager as any).git;
      jest.spyOn(git, 'status').mockResolvedValue({
        files: [],
        modified: [],
        deleted: [],
        not_added: [],
        staged: ['file.ts'],
        created: [],
        renamed: [],
        conflicted: [],
        current: 'main',
        tracking: 'origin/main',
        detached: false
      } as any);
      jest.spyOn(stateManager, 'isDetachedHead').mockResolvedValue(false);
      jest.spyOn(stateManager as any, 'hasMergeInProgress').mockResolvedValue(false);
      jest.spyOn(stateManager as any, 'hasRebaseInProgress').mockResolvedValue(false);

      const state = await stateManager.getState();

      expect(state).toHaveProperty('isDetachedHead');
      expect(state).toHaveProperty('hasConflicts');
      expect(state).toHaveProperty('hasMergeInProgress');
      expect(state).toHaveProperty('hasRebaseInProgress');
      expect(state).toHaveProperty('isDirty');
      expect(state).toHaveProperty('currentBranch');
      expect(state.currentBranch).toBe('main');
      expect(state.isDetachedHead).toBe(false);
      expect(state.hasStagedChanges).toBe(true);
    });

    test('should detect dirty workspace', async () => {
      const git = (stateManager as any).git;
      jest.spyOn(git, 'status').mockResolvedValue({
        files: [{ path: 'file.ts' }],
        modified: ['file.ts'],
        deleted: [],
        not_added: [],
        staged: [],
        created: [],
        renamed: [],
        conflicted: [],
        current: 'main',
        tracking: 'origin/main',
        detached: false
      } as any);
      jest.spyOn(stateManager, 'isDetachedHead').mockResolvedValue(false);
      jest.spyOn(stateManager as any, 'hasMergeInProgress').mockResolvedValue(false);
      jest.spyOn(stateManager as any, 'hasRebaseInProgress').mockResolvedValue(false);

      const state = await stateManager.getState();
      expect(state.isDirty).toBe(true);
      expect(state.hasUncommittedChanges).toBe(true);
    });

    test('should detect untracked files', async () => {
      const git = (stateManager as any).git;
      jest.spyOn(git, 'status').mockResolvedValue({
        files: [{ path: 'new.ts' }],
        modified: [],
        deleted: [],
        not_added: ['new.ts'],
        staged: [],
        created: [],
        renamed: [],
        conflicted: [],
        current: 'main',
        tracking: null,
        detached: false
      } as any);
      jest.spyOn(stateManager, 'isDetachedHead').mockResolvedValue(false);
      jest.spyOn(stateManager as any, 'hasMergeInProgress').mockResolvedValue(false);
      jest.spyOn(stateManager as any, 'hasRebaseInProgress').mockResolvedValue(false);

      const state = await stateManager.getState();
      expect(state.hasUntrackedFiles).toBe(true);
    });

    test('should throw on git error', async () => {
      const git = (stateManager as any).git;
      jest.spyOn(git, 'status').mockRejectedValue(new Error('git error'));

      await expect(stateManager.getState()).rejects.toThrow('Failed to get Git state');
    });
  });

  describe('isDetachedHead', () => {
    test('should return false when on a branch', async () => {
      const git = (stateManager as any).git;
      jest.spyOn(git, 'status').mockResolvedValue({ detached: false, current: 'main' } as any);

      const result = await stateManager.isDetachedHead();
      expect(result).toBe(false);
    });

    test('should return true when in detached HEAD state', async () => {
      const git = (stateManager as any).git;
      jest.spyOn(git, 'status').mockResolvedValue({ detached: true, current: null } as any);

      const result = await stateManager.isDetachedHead();
      expect(result).toBe(true);
    });
  });

  describe('validateEnvironment', () => {
    test('should validate environment successfully', async () => {
      const git = (stateManager as any).git;
      jest.spyOn(git, 'checkIsRepo').mockResolvedValue(true);
      jest.spyOn(git, 'version').mockResolvedValue({ installed: true, major: 2, minor: 39 } as any);
      jest.spyOn(git, 'getConfig').mockResolvedValue({ value: 'Test User' } as any);

      const validation = await stateManager.validateEnvironment();
      expect(validation.valid).toBe(true);
      expect(validation.errors).toEqual([]);
    });

    test('should report error when not in git repo', async () => {
      const git = (stateManager as any).git;
      jest.spyOn(git, 'checkIsRepo').mockResolvedValue(false);
      jest.spyOn(git, 'version').mockResolvedValue({ installed: true } as any);
      jest.spyOn(git, 'getConfig').mockResolvedValue({ value: 'Test' } as any);

      const validation = await stateManager.validateEnvironment();
      expect(validation.valid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);
      expect(validation.errors.some(e => e.includes('Git repository'))).toBe(true);
    });

    test('should report error when git is not installed', async () => {
      const git = (stateManager as any).git;
      jest.spyOn(git, 'checkIsRepo').mockResolvedValue(true);
      jest.spyOn(git, 'version').mockResolvedValue({ installed: false } as any);
      jest.spyOn(git, 'getConfig').mockResolvedValue({ value: 'Test' } as any);

      const validation = await stateManager.validateEnvironment();
      expect(validation.valid).toBe(false);
    });

    test('should report error when git user not configured', async () => {
      const git = (stateManager as any).git;
      jest.spyOn(git, 'checkIsRepo').mockResolvedValue(true);
      jest.spyOn(git, 'version').mockResolvedValue({ installed: true } as any);
      jest.spyOn(git, 'getConfig').mockRejectedValue(new Error('not configured'));

      const validation = await stateManager.validateEnvironment();
      expect(validation.valid).toBe(false);
    });
  });

  describe('displayState', () => {
    test('should display git state', async () => {
      jest.spyOn(stateManager, 'getState').mockResolvedValue({
        isDetachedHead: false,
        hasConflicts: false,
        hasMergeInProgress: false,
        hasRebaseInProgress: false,
        isDirty: false,
        hasUncommittedChanges: false,
        hasUntrackedFiles: false,
        hasStagedChanges: true,
        currentBranch: 'main',
        currentCommit: 'origin/main'
      });

      await stateManager.displayState();
      expect(consoleSpy).toHaveBeenCalled();
      const output = consoleSpy.mock.calls.map(c => c[0] as string).join(' ');
      expect(output).toContain('main');
    });

    test('should display detached HEAD warning', async () => {
      jest.spyOn(stateManager, 'getState').mockResolvedValue({
        isDetachedHead: true,
        hasConflicts: false,
        hasMergeInProgress: false,
        hasRebaseInProgress: false,
        isDirty: false,
        hasUncommittedChanges: false,
        hasUntrackedFiles: false,
        hasStagedChanges: false,
        currentBranch: null,
        currentCommit: 'HEAD'
      });

      await stateManager.displayState();
      // The detached head info is part of the state display
      expect(consoleSpy).toHaveBeenCalled();
    });

    test('should display conflict warning', async () => {
      jest.spyOn(stateManager, 'getState').mockResolvedValue({
        isDetachedHead: false,
        hasConflicts: true,
        hasMergeInProgress: true,
        hasRebaseInProgress: false,
        isDirty: true,
        hasUncommittedChanges: true,
        hasUntrackedFiles: false,
        hasStagedChanges: false,
        currentBranch: 'main',
        currentCommit: 'abc123'
      });

      await stateManager.displayState();
      expect(consoleSpy).toHaveBeenCalled();
    });
  });

  describe('getConflictResolutionHints', () => {
    test('should return empty array when no conflicts', async () => {
      const git = (stateManager as any).git;
      jest.spyOn(git, 'status').mockResolvedValue({ conflicted: [] } as any);

      const hints = await stateManager.getConflictResolutionHints();
      expect(Array.isArray(hints)).toBe(true);
      expect(hints.length).toBe(0);
    });

    test('should return hints array when conflicts exist', async () => {
      const git = (stateManager as any).git;
      jest.spyOn(git, 'status').mockResolvedValue({ conflicted: ['file.ts', 'other.ts'] } as any);

      const hints = await stateManager.getConflictResolutionHints();
      expect(Array.isArray(hints)).toBe(true);
      expect(hints.length).toBeGreaterThan(0);
    });
  });

  describe('getWorktrees', () => {
    test('should return worktrees array', async () => {
      const git = (stateManager as any).git;
      jest.spyOn(git, 'raw').mockResolvedValue(
        'worktree /path/to/repo\nHEAD abc1234\nbranch refs/heads/main\n\n' +
        'worktree /path/to/worktree\nHEAD def5678\nbranch refs/heads/feature\n\n'
      );

      const worktrees = await stateManager.getWorktrees();
      expect(Array.isArray(worktrees)).toBe(true);
    });

    test('should handle worktree listing error gracefully', async () => {
      const git = (stateManager as any).git;
      jest.spyOn(git, 'raw').mockRejectedValue(new Error('git error'));

      const worktrees = await stateManager.getWorktrees();
      expect(Array.isArray(worktrees)).toBe(true);
    });
  });

  describe('getSubmodules', () => {
    test('should return submodules array', async () => {
      const git = (stateManager as any).git;
      jest.spyOn(git, 'subModule').mockResolvedValue('' as any);

      const submodules = await stateManager.getSubmodules();
      expect(Array.isArray(submodules)).toBe(true);
    });

    test('should handle submodule listing error gracefully', async () => {
      const git = (stateManager as any).git;
      jest.spyOn(git, 'subModule').mockRejectedValue(new Error('no submodules'));

      const submodules = await stateManager.getSubmodules();
      expect(Array.isArray(submodules)).toBe(true);
    });
  });

  describe('ensureCleanWorkspace', () => {
    test('should not throw when workspace is clean', async () => {
      jest.spyOn(stateManager, 'getState').mockResolvedValue({
        isDetachedHead: false,
        hasConflicts: false,
        hasMergeInProgress: false,
        hasRebaseInProgress: false,
        isDirty: false,
        hasUncommittedChanges: false,
        hasUntrackedFiles: false,
        hasStagedChanges: false,
        currentBranch: 'main',
        currentCommit: 'abc123'
      });

      await expect(stateManager.ensureCleanWorkspace()).resolves.toBeUndefined();
    });

    test('should throw when workspace has uncommitted changes', async () => {
      jest.spyOn(stateManager, 'getState').mockResolvedValue({
        isDetachedHead: false,
        hasConflicts: false,
        hasMergeInProgress: false,
        hasRebaseInProgress: false,
        isDirty: true,
        hasUncommittedChanges: true,
        hasUntrackedFiles: false,
        hasStagedChanges: false,
        currentBranch: 'main',
        currentCommit: 'abc123'
      });

      await expect(stateManager.ensureCleanWorkspace()).rejects.toThrow();
    });

    test('should not throw when allowStaged is true and only staged changes', async () => {
      jest.spyOn(stateManager, 'getState').mockResolvedValue({
        isDetachedHead: false,
        hasConflicts: false,
        hasMergeInProgress: false,
        hasRebaseInProgress: false,
        isDirty: true,
        hasUncommittedChanges: false,
        hasUntrackedFiles: false,
        hasStagedChanges: true,
        currentBranch: 'main',
        currentCommit: 'abc123'
      });

      await expect(stateManager.ensureCleanWorkspace(true)).resolves.toBeUndefined();
    });
  });

  describe('handleDetachedHead', () => {
    test('should not throw when not in detached HEAD state', async () => {
      jest.spyOn(stateManager, 'isDetachedHead').mockResolvedValue(false);
      await expect(stateManager.handleDetachedHead()).resolves.toBeUndefined();
    });

    test('should throw when in detached HEAD state', async () => {
      jest.spyOn(stateManager, 'isDetachedHead').mockResolvedValue(true);
      await expect(stateManager.handleDetachedHead()).rejects.toThrow();
    });
  });

  describe('hasWorktrees', () => {
    test('should return false when only main worktree', async () => {
      jest.spyOn(stateManager, 'getWorktrees').mockResolvedValue([
        { path: '/main', branch: 'main', commit: 'abc', isMain: true }
      ]);
      const result = await stateManager.hasWorktrees();
      expect(result).toBe(false);
    });

    test('should return true when additional worktrees exist', async () => {
      jest.spyOn(stateManager, 'getWorktrees').mockResolvedValue([
        { path: '/main', branch: 'main', commit: 'abc', isMain: true },
        { path: '/secondary', branch: 'feature', commit: 'def', isMain: false }
      ]);
      const result = await stateManager.hasWorktrees();
      expect(result).toBe(true);
    });
  });

  describe('checkConflicts (private)', () => {
    test('should detect conflicts in status', async () => {
      const git = (stateManager as any).git;
      jest.spyOn(git, 'status').mockResolvedValue({
        files: [{ path: 'conflict.ts' }],
        modified: [],
        deleted: [],
        not_added: [],
        staged: [],
        created: [],
        renamed: [],
        conflicted: ['conflict.ts'],
        current: 'main',
        tracking: null,
        detached: false
      } as any);
      jest.spyOn(stateManager, 'isDetachedHead').mockResolvedValue(false);
      jest.spyOn(stateManager as any, 'hasMergeInProgress').mockResolvedValue(false);
      jest.spyOn(stateManager as any, 'hasRebaseInProgress').mockResolvedValue(false);

      const state = await stateManager.getState();
      expect(state.hasConflicts).toBe(true);
    });
  });

  describe('getConflictDetails', () => {
    test('should return conflicted files', async () => {
      const git = (stateManager as any).git;
      jest.spyOn(git, 'status').mockResolvedValue({ conflicted: ['file1.ts', 'file2.ts'] } as any);

      const conflicts = await stateManager.getConflictDetails();
      expect(conflicts).toEqual(['file1.ts', 'file2.ts']);
    });

    test('should return empty array when git fails', async () => {
      const git = (stateManager as any).git;
      jest.spyOn(git, 'status').mockRejectedValue(new Error('git error'));

      const conflicts = await stateManager.getConflictDetails();
      expect(conflicts).toEqual([]);
    });
  });
});

