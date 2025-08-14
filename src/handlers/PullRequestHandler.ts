import { execSync } from 'child_process';
import chalk from 'chalk';
import ora from 'ora';
import inquirer from 'inquirer';
import { GitService } from '../services/GitService.js';
import { AIService } from '../services/AIService.js';
import { PullRequestOptions } from '../types.js';

export class PullRequestHandler {
  private gitService: GitService;
  private aiService: AIService;

  constructor() {
    this.gitService = new GitService();
    this.aiService = new AIService();
  }

  async createPullRequest(options: PullRequestOptions): Promise<void> {
    try {
      // Check if we're in a git repository
      await this.gitService.ensureGitRepo();

      // Get current branch
      const currentBranch = await this.gitService.getCurrentBranch();
      const sourceBranch = options.source || currentBranch;
      const targetBranch = options.target || 'main';

      // Check if we have a remote repository
      const remoteInfo = await this.getRemoteInfo();
      if (!remoteInfo) {
        console.log(chalk.red('❌ No remote repository found. Please add a remote origin.'));
        return;
      }

      // Generate PR title and body if not provided
      let { title, body } = options;
      
      if (!title || !body) {
        const spinner = ora('🤖 Generating PR title and description...').start();
        const generatedContent = await this.generatePRContent(sourceBranch, targetBranch);
        spinner.stop();
        
        title = title || generatedContent.title;
        body = body || generatedContent.body;
      }

      // Interactive editing if needed
      const finalContent = await this.confirmPRContent(title, body);

      // Create PR based on platform
      await this.createPlatformPR(remoteInfo, {
        ...options,
        title: finalContent.title,
        body: finalContent.body,
        source: sourceBranch,
        target: targetBranch
      });

    } catch (error) {
      throw new Error(`Failed to create PR: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async getRemoteInfo(): Promise<{ platform: string; owner: string; repo: string; url: string } | null> {
    try {
      const remoteUrl = execSync('git remote get-url origin', { encoding: 'utf8' }).trim();
      
      // Parse GitHub URL
      const githubMatch = remoteUrl.match(/github\.com[:/]([^/]+)\/(.+?)(?:\.git)?$/);
      if (githubMatch) {
        return {
          platform: 'github',
          owner: githubMatch[1],
          repo: githubMatch[2],
          url: remoteUrl
        };
      }

      // Parse GitLab URL  
      const gitlabMatch = remoteUrl.match(/gitlab\.com[:/]([^/]+)\/(.+?)(?:\.git)?$/);
      if (gitlabMatch) {
        return {
          platform: 'gitlab',
          owner: gitlabMatch[1],
          repo: gitlabMatch[2],
          url: remoteUrl
        };
      }

      return null;
    } catch {
      return null;
    }
  }

  private async generatePRContent(sourceBranch: string, targetBranch: string): Promise<{ title: string; body: string }> {
    try {
      // Get commits between branches
      const commits = execSync(
        `git log ${targetBranch}..${sourceBranch} --oneline --no-merges`,
        { encoding: 'utf8' }
      ).trim();

      // Get diff summary
      const diffStat = execSync(
        `git diff ${targetBranch}...${sourceBranch} --stat`,
        { encoding: 'utf8' }
      ).trim();

      // Use AI to generate PR content
      const prompt = `Generate a pull request title and description for these changes:

COMMITS:
${commits}

DIFF SUMMARY:
${diffStat}

Generate a clear PR title and detailed description explaining what changed and why.`;

      const aiProvider = await this.aiService.getProviderAsync();
      const response = await aiProvider.generateCommitMessage(prompt, undefined, true);
      
      // Parse response to extract title and body
      const lines = response.split('\n');
      const title = lines[0].replace(/^#+\s*/, '').trim();
      const body = lines.slice(1).join('\n').trim();

      return { title, body };
    } catch (error) {
      // Fallback to simple generation
      return {
        title: `Merge ${sourceBranch} into ${targetBranch}`,
        body: `This PR merges changes from ${sourceBranch} into ${targetBranch}.`
      };
    }
  }

  private async confirmPRContent(title: string, body: string): Promise<{ title: string; body: string }> {
    console.log(chalk.blue('\n📋 Generated PR Content:'));
    console.log(chalk.yellow('Title:'), title);
    console.log(chalk.yellow('Body:'), body);

    const { action } = await inquirer.prompt([
      {
        type: 'list',
        name: 'action',
        message: 'What would you like to do?',
        choices: [
          { name: 'Use as is', value: 'use' },
          { name: 'Edit title and body', value: 'edit' },
          { name: 'Cancel', value: 'cancel' }
        ]
      }
    ]);

    if (action === 'cancel') {
      process.exit(0);
    }

    if (action === 'edit') {
      const edited = await inquirer.prompt([
        {
          type: 'input',
          name: 'title',
          message: 'Enter PR title:',
          default: title
        },
        {
          type: 'editor',
          name: 'body',
          message: 'Enter PR description:',
          default: body
        }
      ]);
      return edited;
    }

    return { title, body };
  }

  private async createPlatformPR(remoteInfo: any, options: PullRequestOptions & { source: string; target: string }): Promise<void> {
    const spinner = ora('🚀 Creating pull request...').start();

    try {
      if (remoteInfo.platform === 'github') {
        await this.createGitHubPR(remoteInfo, options);
      } else if (remoteInfo.platform === 'gitlab') {
        await this.createGitLabPR(remoteInfo, options);
      } else {
        throw new Error('Unsupported platform. Currently supports GitHub and GitLab.');
      }

      spinner.succeed('✅ Pull request created successfully!');
    } catch (error) {
      spinner.fail('❌ Failed to create pull request');
      throw error;
    }
  }

  private async createGitHubPR(remoteInfo: any, options: PullRequestOptions & { source: string; target: string }): Promise<void> {
    // Check if GitHub CLI is available
    try {
      execSync('gh --version', { stdio: 'pipe' });
    } catch {
      console.log(chalk.yellow('\n💡 GitHub CLI not found. Install it from: https://cli.github.com/'));
      console.log(chalk.blue('Alternative: Create PR manually at:'));
      console.log(`https://github.com/${remoteInfo.owner}/${remoteInfo.repo}/compare/${options.target}...${options.source}`);
      return;
    }

    // Create PR using GitHub CLI
    const cmd = [
      'gh pr create',
      `--title "${options.title}"`,
      `--body "${options.body}"`,
      `--base ${options.target}`,
      `--head ${options.source}`
    ];

    if (options.draft) {
      cmd.push('--draft');
    }

    if (options.reviewers && options.reviewers.length > 0) {
      cmd.push(`--reviewer ${options.reviewers.join(',')}`);
    }

    execSync(cmd.join(' '), { stdio: 'inherit' });
  }

  private async createGitLabPR(remoteInfo: any, options: PullRequestOptions & { source: string; target: string }): Promise<void> {
    // Check if GitLab CLI is available
    try {
      execSync('glab --version', { stdio: 'pipe' });
    } catch {
      console.log(chalk.yellow('\n💡 GitLab CLI not found. Install it from: https://gitlab.com/gitlab-org/cli'));
      console.log(chalk.blue('Alternative: Create MR manually at:'));
      console.log(`https://gitlab.com/${remoteInfo.owner}/${remoteInfo.repo}/-/merge_requests/new?merge_request%5Bsource_branch%5D=${options.source}&merge_request%5Btarget_branch%5D=${options.target}`);
      return;
    }

    // Create MR using GitLab CLI
    const cmd = [
      'glab mr create',
      `--title "${options.title}"`,
      `--description "${options.body}"`,
      `--target-branch ${options.target}`,
      `--source-branch ${options.source}`
    ];

    if (options.draft) {
      cmd.push('--draft');
    }

    execSync(cmd.join(' '), { stdio: 'inherit' });
  }
}
