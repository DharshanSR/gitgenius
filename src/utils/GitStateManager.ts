/**
 * Git State Manager - Handles detection and management of various Git states
 * including detached HEAD, merge conflicts, worktrees, submodules, and dirty workspace
 */
import simpleGit, { SimpleGit, StatusResult } from 'simple-git';
import chalk from 'chalk';
import { ErrorHandler } from './ErrorHandler.js';

export interface GitState {
  isDetachedHead: boolean;
  hasConflicts: boolean;
  hasMergeInProgress: boolean;
  hasRebaseInProgress: boolean;
  isDirty: boolean;
  hasUncommittedChanges: boolean;
  hasUntrackedFiles: boolean;
  hasStagedChanges: boolean;
  currentBranch: string | null;
  currentCommit: string;
}

export interface WorktreeInfo {
  path: string;
  branch: string | null;
  commit: string;
  isMain: boolean;
}

export interface SubmoduleInfo {
  path: string;
  url: string;
  branch: string | null;
  commit: string;
  isInitialized: boolean;
}

export class GitStateManager {
  private git: SimpleGit;

  constructor() {
    this.git = simpleGit();
  }

  /**
   * Get comprehensive Git state information
   */
  async getState(): Promise<GitState> {
    try {
      const status = await this.git.status();
      const isDetached = await this.isDetachedHead();
      const hasConflicts = this.checkConflicts(status);
      const hasMerge = await this.hasMergeInProgress();
      const hasRebase = await this.hasRebaseInProgress();

      return {
        isDetachedHead: isDetached,
        hasConflicts,
        hasMergeInProgress: hasMerge,
        hasRebaseInProgress: hasRebase,
        isDirty: status.files.length > 0,
        hasUncommittedChanges: status.modified.length > 0 || status.deleted.length > 0,
        hasUntrackedFiles: status.not_added.length > 0,
        hasStagedChanges: status.staged.length > 0 || status.created.length > 0 || status.renamed.length > 0,
        currentBranch: status.current || null,
        currentCommit: status.tracking || 'HEAD'
      };
    } catch (error) {
      throw ErrorHandler.gitError(
        `Failed to get Git state: ${error instanceof Error ? error.message : String(error)}`,
        ['Ensure you are in a Git repository', 'Check Git installation']
      );
    }
  }

  /**
   * Check if HEAD is detached
   */
  async isDetachedHead(): Promise<boolean> {
    try {
      const status = await this.git.status();
      return status.detached || status.current === null;
    } catch (error) {
      return false;
    }
  }

  /**
   * Check for merge conflicts
   */
  private checkConflicts(status: StatusResult): boolean {
    return status.conflicted.length > 0;
  }

  /**
   * Check if a merge is in progress
   */
  async hasMergeInProgress(): Promise<boolean> {
    try {
      // Check for MERGE_HEAD file which indicates ongoing merge
      const result = await this.git.raw(['rev-parse', '--verify', 'MERGE_HEAD']);
      return result.trim().length > 0;
    } catch (error) {
      return false;
    }
  }

  /**
   * Check if a rebase is in progress
   */
  async hasRebaseInProgress(): Promise<boolean> {
    try {
      // Check for rebase-apply or rebase-merge directories
      const result = await this.git.raw(['rev-parse', '--git-dir']);
      const gitDir = result.trim();
      
      // Check if rebase directories exist
      try {
        await this.git.raw(['rev-parse', '--verify', 'REBASE_HEAD']);
        return true;
      } catch {
        return false;
      }
    } catch (error) {
      return false;
    }
  }

  /**
   * Ensure workspace is clean before dangerous operations
   */
  async ensureCleanWorkspace(allowStaged: boolean = false): Promise<void> {
    const state = await this.getState();

    if (state.hasConflicts) {
      throw ErrorHandler.gitError(
        'Cannot proceed: merge conflicts detected',
        [
          'Resolve conflicts using: git status',
          'After resolving, stage changes: git add <file>',
          'Then commit or continue merge/rebase'
        ]
      );
    }

    if (state.hasMergeInProgress) {
      throw ErrorHandler.gitError(
        'Cannot proceed: merge in progress',
        [
          'Complete the merge: git commit',
          'Or abort the merge: git merge --abort'
        ]
      );
    }

    if (state.hasRebaseInProgress) {
      throw ErrorHandler.gitError(
        'Cannot proceed: rebase in progress',
        [
          'Continue the rebase: git rebase --continue',
          'Or abort the rebase: git rebase --abort'
        ]
      );
    }

    if (state.hasUncommittedChanges && !allowStaged) {
      throw ErrorHandler.gitError(
        'Cannot proceed: uncommitted changes detected',
        [
          'Commit your changes: git commit -am "message"',
          'Or stash them: git stash',
          'Or discard them: git checkout -- <file>'
        ]
      );
    }

    if (state.hasStagedChanges && !allowStaged) {
      throw ErrorHandler.gitError(
        'Cannot proceed: staged changes detected',
        [
          'Commit your changes: git commit -m "message"',
          'Or unstage them: git reset HEAD'
        ]
      );
    }
  }

  /**
   * Handle detached HEAD state
   */
  async handleDetachedHead(): Promise<void> {
    const isDetached = await this.isDetachedHead();
    
    if (!isDetached) {
      return;
    }

    console.log(chalk.yellow('⚠ Detached HEAD state detected'));
    console.log(chalk.yellow('You are not on any branch. Commits made in this state will be lost unless you create a branch.'));
    
    throw ErrorHandler.gitError(
      'Operation blocked: detached HEAD state',
      [
        'Create a new branch: git checkout -b <branch-name>',
        'Switch to an existing branch: git checkout <branch-name>',
        'To continue anyway, manually perform the operation'
      ]
    );
  }

  /**
   * Get worktree information
   */
  async getWorktrees(): Promise<WorktreeInfo[]> {
    try {
      const result = await this.git.raw(['worktree', 'list', '--porcelain']);
      const worktrees: WorktreeInfo[] = [];
      
      if (!result.trim()) {
        return worktrees;
      }

      const lines = result.split('\n');
      let currentWorktree: Partial<WorktreeInfo> = {};

      for (const line of lines) {
        if (line.startsWith('worktree ')) {
          if (currentWorktree.path) {
            worktrees.push(currentWorktree as WorktreeInfo);
          }
          currentWorktree = { path: line.substring(9) };
        } else if (line.startsWith('HEAD ')) {
          currentWorktree.commit = line.substring(5);
        } else if (line.startsWith('branch ')) {
          currentWorktree.branch = line.substring(7);
        } else if (line === 'bare') {
          // Skip bare repositories
        } else if (line === '') {
          if (currentWorktree.path) {
            worktrees.push({
              path: currentWorktree.path,
              branch: currentWorktree.branch || null,
              commit: currentWorktree.commit || '',
              isMain: worktrees.length === 0
            });
            currentWorktree = {};
          }
        }
      }

      // Add last worktree if exists
      if (currentWorktree.path) {
        worktrees.push({
          path: currentWorktree.path,
          branch: currentWorktree.branch || null,
          commit: currentWorktree.commit || '',
          isMain: worktrees.length === 0
        });
      }

      return worktrees;
    } catch (error) {
      // Worktrees not supported or no worktrees exist
      return [];
    }
  }

  /**
   * Check if worktrees are in use
   */
  async hasWorktrees(): Promise<boolean> {
    const worktrees = await this.getWorktrees();
    return worktrees.length > 1; // More than just the main worktree
  }

  /**
   * Get submodule information
   */
  async getSubmodules(): Promise<SubmoduleInfo[]> {
    try {
      const result = await this.git.raw(['submodule', 'status']);
      
      if (!result.trim()) {
        return [];
      }

      const submodules: SubmoduleInfo[] = [];
      const lines = result.split('\n').filter(line => line.trim());

      for (const line of lines) {
        const match = line.match(/^([ +-U])([a-f0-9]+) (.+?)(?: \((.+)\))?$/);
        if (match) {
          const [, status, commit, path, branch] = match;
          submodules.push({
            path,
            url: '', // URL requires additional query
            branch: branch || null,
            commit,
            isInitialized: status !== '-'
          });
        }
      }

      // Get URLs for each submodule
      for (const submodule of submodules) {
        try {
          const url = await this.git.raw(['config', '--get', `submodule.${submodule.path}.url`]);
          submodule.url = url.trim();
        } catch {
          // URL not found
        }
      }

      return submodules;
    } catch (error) {
      // No submodules or command failed
      return [];
    }
  }

  /**
   * Check if repository has submodules
   */
  async hasSubmodules(): Promise<boolean> {
    const submodules = await this.getSubmodules();
    return submodules.length > 0;
  }

  /**
   * Initialize submodules
   */
  async initializeSubmodules(): Promise<void> {
    try {
      await this.git.raw(['submodule', 'update', '--init', '--recursive']);
      console.log(chalk.green('✓ Submodules initialized'));
    } catch (error) {
      throw ErrorHandler.gitError(
        `Failed to initialize submodules: ${error instanceof Error ? error.message : String(error)}`,
        ['Check .gitmodules file', 'Verify submodule URLs', 'Ensure network connectivity']
      );
    }
  }

  /**
   * Update submodules
   */
  async updateSubmodules(): Promise<void> {
    try {
      await this.git.raw(['submodule', 'update', '--remote', '--merge']);
      console.log(chalk.green('✓ Submodules updated'));
    } catch (error) {
      throw ErrorHandler.gitError(
        `Failed to update submodules: ${error instanceof Error ? error.message : String(error)}`,
        ['Check for conflicts in submodules', 'Verify network connectivity', 'Check submodule configuration']
      );
    }
  }

  /**
   * Get detailed conflict information
   */
  async getConflictDetails(): Promise<string[]> {
    try {
      const status = await this.git.status();
      return status.conflicted;
    } catch (error) {
      return [];
    }
  }

  /**
   * Provide actionable conflict resolution hints
   */
  async getConflictResolutionHints(): Promise<string[]> {
    const conflicts = await this.getConflictDetails();
    
    if (conflicts.length === 0) {
      return [];
    }

    return [
      `Found ${conflicts.length} conflicted file(s): ${conflicts.join(', ')}`,
      'To resolve conflicts:',
      '  1. Edit each conflicted file and resolve markers (<<<<<<< ======= >>>>>>>)',
      '  2. Stage resolved files: git add <file>',
      '  3. Complete the merge: git commit',
      'Or abort the merge: git merge --abort'
    ];
  }

  /**
   * Validate Git environment for operations
   */
  async validateEnvironment(): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];

    try {
      // Check if in a Git repository
      const isRepo = await this.git.checkIsRepo();
      if (!isRepo) {
        errors.push('Not in a Git repository');
      }

      // Check Git version
      try {
        const version = await this.git.version();
        if (!version.installed) {
          errors.push('Git is not properly installed');
        }
      } catch {
        errors.push('Unable to determine Git version');
      }

      // Check for Git configuration
      try {
        await this.git.getConfig('user.name');
      } catch {
        errors.push('Git user.name not configured');
      }

      try {
        await this.git.getConfig('user.email');
      } catch {
        errors.push('Git user.email not configured');
      }

    } catch (error) {
      errors.push(`Environment validation failed: ${error instanceof Error ? error.message : String(error)}`);
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Display current Git state in a friendly format
   */
  async displayState(): Promise<void> {
    const state = await this.getState();

    console.log(chalk.blue('\n📊 Git State:'));
    
    if (state.currentBranch) {
      console.log(chalk.white(`  Branch: ${chalk.green(state.currentBranch)}`));
    } else {
      console.log(chalk.yellow('  ⚠ Detached HEAD'));
    }

    if (state.hasConflicts) {
      const conflicts = await this.getConflictDetails();
      console.log(chalk.red(`  ⚠ Conflicts: ${conflicts.length} file(s)`));
    }

    if (state.hasMergeInProgress) {
      console.log(chalk.yellow('  ⚠ Merge in progress'));
    }

    if (state.hasRebaseInProgress) {
      console.log(chalk.yellow('  ⚠ Rebase in progress'));
    }

    if (state.hasStagedChanges) {
      console.log(chalk.green('  ✓ Staged changes'));
    }

    if (state.hasUncommittedChanges) {
      console.log(chalk.yellow('  ⚠ Uncommitted changes'));
    }

    if (state.hasUntrackedFiles) {
      console.log(chalk.gray('  • Untracked files'));
    }

    if (!state.isDirty && !state.hasConflicts && !state.hasMergeInProgress && !state.hasRebaseInProgress) {
      console.log(chalk.green('  ✓ Clean workspace'));
    }

    // Show worktree info
    const hasWorktrees = await this.hasWorktrees();
    if (hasWorktrees) {
      const worktrees = await this.getWorktrees();
      console.log(chalk.blue(`  📁 Worktrees: ${worktrees.length}`));
    }

    // Show submodule info
    const hasSubmodules = await this.hasSubmodules();
    if (hasSubmodules) {
      const submodules = await this.getSubmodules();
      const initialized = submodules.filter(s => s.isInitialized).length;
      console.log(chalk.blue(`  📦 Submodules: ${initialized}/${submodules.length} initialized`));
    }

    console.log('');
  }
}
