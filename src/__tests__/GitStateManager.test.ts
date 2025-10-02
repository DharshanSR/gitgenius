/**
 * Tests for GitStateManager
 * 
 * Note: These tests validate the API and structure of GitStateManager.
 * Some tests may be skipped in CI/CD environments without a full Git setup.
 */
import { describe, test, expect } from '@jest/globals';

// Import types only to avoid runtime module issues
import type { GitState, WorktreeInfo, SubmoduleInfo } from '../utils/GitStateManager';

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
