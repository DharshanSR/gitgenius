import simpleGit, { SimpleGit } from 'simple-git';
import chalk from 'chalk';
import { GitStats } from '../types.js';

export class GitService {
  private git: SimpleGit;

  constructor() {
    this.git = simpleGit();
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
    const status = await this.git.status();
    return status.current || 'main';
  }

  async getStatus() {
    return await this.git.status();
  }

  async getDiff(options: string[] = []): Promise<string> {
    return await this.git.diff(options);
  }

  async getStagedDiff(): Promise<string> {
    return await this.git.diff(['--staged']);
  }

  async getLastCommitDiff(): Promise<string> {
    return await this.git.diff(['HEAD~1', 'HEAD']);
  }

  async getFileDiff(file: string): Promise<string> {
    return await this.git.diff([file]);
  }

  async commit(message: string, options?: any): Promise<void> {
    await this.git.commit(message, undefined, options);
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
