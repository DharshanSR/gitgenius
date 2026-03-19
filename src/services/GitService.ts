import simpleGit, { SimpleGit } from 'simple-git';
import chalk from 'chalk';
import { spawn } from 'child_process';
import { GitStats } from '../types.js';
import { GitStateManager } from '../utils/GitStateManager.js';
import { ErrorHandler } from '../utils/ErrorHandler.js';
import { memoryMonitor } from '../utils/MemoryMonitor.js';
import { logger } from '../utils/Logger.js';

/** Maximum diff size (in bytes) before a warning is emitted and the diff is truncated. */
const MAX_DIFF_SIZE_BYTES = 1 * 1024 * 1024; // 1 MB

export class GitService {
  private git: SimpleGit;
  private stateManager: GitStateManager;

  constructor() {
    this.git = simpleGit();
    this.stateManager = new GitStateManager();
  }

  async checkIsRepo(): Promise<boolean> {
    return await this.git.checkIsRepo();
  }

  async ensureGitRepo(): Promise<void> {
    const isRepo = await this.checkIsRepo();
    if (!isRepo) {
      throw new Error('Not in a git repository');
    }
  }

  async getCurrentBranch(): Promise<string> {
    try {
      const status = await this.git.status();
      
      // Check for detached HEAD
      if (status.detached || !status.current) {
        const state = await this.stateManager.getState();
        console.log(chalk.yellow('⚠ Warning: Detached HEAD state detected'));
        console.log(chalk.yellow(`Currently at commit: ${state.currentCommit}`));
        return state.currentCommit;
      }
      
      return status.current || 'main';
    } catch (error) {
      throw ErrorHandler.gitError(
        `Failed to get current branch: ${error instanceof Error ? error.message : String(error)}`,
        ['Ensure you are in a Git repository', 'Check Git configuration']
      );
    }
  }

  async getStatus() {
    try {
      return await this.git.status();
    } catch (error) {
      throw ErrorHandler.gitError(
        `Failed to get status: ${error instanceof Error ? error.message : String(error)}`,
        ['Ensure you are in a Git repository', 'Check for repository corruption']
      );
    }
  }

  async getDiff(options: string[] = []): Promise<string> {
    return await this.git.diff(options);
  }

  async getStagedDiff(): Promise<string> {
    try {
      // Check for conflicts before showing diff
      const state = await this.stateManager.getState();
      if (state.hasConflicts) {
        console.log(chalk.yellow('⚠ Warning: Merge conflicts detected'));
        const hints = await this.stateManager.getConflictResolutionHints();
        hints.forEach(hint => console.log(chalk.yellow(hint)));
      }

      memoryMonitor.captureSnapshot();
      const diff = await this.git.diff(['--staged']);
      memoryMonitor.captureSnapshot();

      return this.applyDiffSizeLimit(diff, 'staged diff');
    } catch (error) {
      throw ErrorHandler.gitError(
        `Failed to get staged diff: ${error instanceof Error ? error.message : String(error)}`,
        ['Check if there are staged changes: git status']
      );
    }
  }

  async getLastCommitDiff(): Promise<string> {
    const diff = await this.git.diff(['HEAD~1', 'HEAD']);
    return this.applyDiffSizeLimit(diff, 'last commit diff');
  }

  async getFileDiff(file: string): Promise<string> {
    const diff = await this.git.diff([file]);
    return this.applyDiffSizeLimit(diff, `file diff (${file})`);
  }

  /**
   * Return a size-limited version of `getDiff`.
   * If the diff exceeds `maxBytes`, it is truncated and a warning is logged.
   */
  async getDiffLimited(options: string[] = [], maxBytes: number = MAX_DIFF_SIZE_BYTES): Promise<string> {
    const diff = await this.git.diff(options);
    return this.applyDiffSizeLimit(diff, 'diff', maxBytes);
  }

  /**
   * Stream a git diff via `child_process.spawn` and collect at most `maxBytes`
   * of output, then resolve with the (possibly truncated) diff string.
   *
   * This avoids buffering the entire diff in memory before processing.
   */
  getDiffStream(options: string[] = [], maxBytes: number = MAX_DIFF_SIZE_BYTES): Promise<string> {
    return new Promise((resolve, reject) => {
      let chunks: Buffer[] = [];
      let totalSize = 0;
      let truncated = false;
      const stderrLines: string[] = [];

      const child = spawn('git', ['diff', ...options], { stdio: ['ignore', 'pipe', 'pipe'] });

      child.stdout.on('data', (chunk: Buffer) => {
        if (truncated) return;

        const remaining = maxBytes - totalSize;
        if (chunk.length > remaining) {
          chunks.push(chunk.subarray(0, remaining));
          totalSize += remaining;
          truncated = true;
          child.kill('SIGTERM');
        } else {
          chunks.push(chunk);
          totalSize += chunk.length;
        }
      });

      child.stderr.on('data', (chunk: Buffer) => {
        stderrLines.push(chunk.toString('utf8'));
      });

      child.on('error', reject);

      child.on('close', (code) => {
        // If the process exited with a non-zero code and we have stderr output,
        // treat it as an error (unless we killed the process intentionally).
        if (code !== 0 && !truncated && stderrLines.length > 0) {
          return reject(new Error(`git diff failed: ${stderrLines.join('').trim()}`));
        }

        const diff = Buffer.concat(chunks).toString('utf8');
        if (truncated) {
          logger.warn(
            'GitService',
            `Diff output truncated at ${(maxBytes / (1024 * 1024)).toFixed(2)} MB to protect memory`
          );
          console.log(
            chalk.yellow(
              `⚠ Diff truncated at ${(maxBytes / (1024 * 1024)).toFixed(2)} MB. ` +
                'Only the first portion of the diff is shown.'
            )
          );
        }
        // Release buffer references so they can be garbage-collected
        chunks = [];
        memoryMonitor.captureSnapshot();
        resolve(diff);
      });
    });
  }

  /**
   * Enforce a size limit on a diff string.
   * If the diff exceeds `maxBytes`, it is truncated and a warning is printed.
   */
  private applyDiffSizeLimit(
    diff: string,
    label: string,
    maxBytes: number = MAX_DIFF_SIZE_BYTES
  ): string {
    const byteLength = Buffer.byteLength(diff, 'utf8');
    if (byteLength > maxBytes) {
      logger.warn(
        'GitService',
        `Large ${label} detected (${(byteLength / (1024 * 1024)).toFixed(2)} MB). ` +
          `Truncating to ${(maxBytes / (1024 * 1024)).toFixed(2)} MB.`
      );
      console.log(
        chalk.yellow(
          `⚠ ${label} is large (${(byteLength / (1024 * 1024)).toFixed(2)} MB). ` +
            `Processing first ${(maxBytes / (1024 * 1024)).toFixed(2)} MB only.`
        )
      );
      // Truncate at a safe byte boundary
      return Buffer.from(diff, 'utf8').subarray(0, maxBytes).toString('utf8');
    }
    return diff;
  }

  async commit(message: string, options?: any): Promise<void> {
    try {
      // Validate environment before committing
      const validation = await this.stateManager.validateEnvironment();
      if (!validation.valid) {
        console.log(chalk.yellow('⚠ Environment warnings:'));
        validation.errors.forEach(err => console.log(chalk.yellow(`  • ${err}`)));
      }

      // Check for conflicts
      const state = await this.stateManager.getState();
      if (state.hasConflicts) {
        throw ErrorHandler.gitError(
          'Cannot commit: merge conflicts detected',
          await this.stateManager.getConflictResolutionHints()
        );
      }

      await this.git.commit(message, undefined, options);
    } catch (error) {
      if (error instanceof Error && error.message.includes('nothing to commit')) {
        throw ErrorHandler.gitError(
          'Nothing to commit',
          ['Stage changes first: git add <file>', 'Check status: git status']
        );
      }
      throw error;
    }
  }

  async reset(options: string[] = []): Promise<void> {
    await this.git.reset(options);
  }

  async getLog(options: any) {
    return await this.git.log(options);
  }

  async getBranchLocal() {
    return await this.git.branchLocal();
  }

  async getConfig(key: string) {
    return await this.git.getConfig(key);
  }

  async addConfig(key: string, value: string): Promise<void> {
    await this.git.addConfig(key, value);
  }

  // New methods for enhanced Git operations

  /**
   * Get Git state manager
   */
  getStateManager(): GitStateManager {
    return this.stateManager;
  }

  /**
   * Check workspace cleanliness before operations
   */
  async ensureCleanWorkspace(allowStaged: boolean = false): Promise<void> {
    await this.stateManager.ensureCleanWorkspace(allowStaged);
  }

  /**
   * Check for detached HEAD and handle appropriately
   */
  async checkDetachedHead(): Promise<boolean> {
    return await this.stateManager.isDetachedHead();
  }

  /**
   * Get worktree information
   */
  async getWorktrees() {
    return await this.stateManager.getWorktrees();
  }

  /**
   * Get submodule information
   */
  async getSubmodules() {
    return await this.stateManager.getSubmodules();
  }

  /**
   * Display current Git state
   */
  async displayState(): Promise<void> {
    await this.stateManager.displayState();
  }

  calculateStats(logs: any): GitStats {
    const stats: GitStats = {
      totalCommits: logs.total,
      authors: {},
      commitTypes: {},
      filesChanged: 0,
      linesAdded: 0,
      linesDeleted: 0
    };

    logs.all.forEach((commit: any) => {
      // Count by author
      if (commit.author_name) {
        stats.authors[commit.author_name] = (stats.authors[commit.author_name] || 0) + 1;
      }

      // Count by commit type (conventional commits)
      const typeMatch = commit.message.match(/^(\w+)(\(.+\))?:/);
      if (typeMatch) {
        const type = typeMatch[1];
        stats.commitTypes[type] = (stats.commitTypes[type] || 0) + 1;
      }
    });

    return stats;
  }

  displayStats(stats: GitStats, days: number, author?: string): void {
    console.log(chalk.blue(`[STATS] Git Statistics (${days} days)${author ? ` for ${author}` : ''}`));
    console.log(chalk.yellow(`[INFO] Total commits: ${stats.totalCommits}`));
    
    if (Object.keys(stats.authors).length > 0) {
      console.log(chalk.blue('\n[STATS] Commits by author:'));
      Object.entries(stats.authors)
        .sort(([,a], [,b]) => b - a)
        .forEach(([author, count]) => {
          console.log(`        ${chalk.white(author)}: ${chalk.green(count)}`);
        });
    }

    if (Object.keys(stats.commitTypes).length > 0) {
      console.log(chalk.blue('\n[STATS] Commits by type:'));
      Object.entries(stats.commitTypes)
        .sort(([,a], [,b]) => b - a)
        .forEach(([type, count]) => {
          console.log(`        ${chalk.white(type)}: ${chalk.green(count)}`);
        });
    }
  }
}
