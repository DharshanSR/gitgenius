import inquirer from 'inquirer';
import chalk from 'chalk';
import clipboardy from 'clipboardy';
import ora from 'ora';
import { AIService } from '../services/AIService.js';
import { GitService } from '../services/GitService.js';
import { ConfigManager } from '../core/ConfigManager.js';
import { CommitOptions, PreviousCommitOptions } from '../types.js';

export class CommitHandler {
  private aiService: AIService;
  private gitService: GitService;
  private configManager: ConfigManager;
  private lastCommitMessage: string | null = null;

  constructor() {
    this.aiService = new AIService();
    this.gitService = new GitService();
    this.configManager = new ConfigManager();
  }

  async generateCommit(options: CommitOptions): Promise<void> {
    try {
      // Check if we're in a git repository
      const isRepo = await this.gitService.checkIsRepo();
      if (!isRepo) {
        throw new Error('Not in a git repository');
      }

      // Check for staged changes
      const status = await this.gitService.getStatus();
      if (status.staged.length === 0) {
        console.log(chalk.yellow('[WARNING] No staged changes found. Stage some changes first with:'));
        console.log(chalk.blue('          git add <files>'));
        return;
      }

      // Get the diff
      const diff = await this.gitService.getStagedDiff();
      if (!diff.trim()) {
        throw new Error('No staged changes to commit');
      }

      // Generate commit message
      const spinner = ora('Generating commit message...').start();
      
      try {
        const commitMessage = await this.aiService.generateCommitMessage(diff, options.type, options.provider, options.detailed);
        this.lastCommitMessage = commitMessage;
        
        // Store in history
        this.storeInHistory(commitMessage, options);
        
        spinner.stop();
        console.log(chalk.green('✨ [SUCCESS] Generated commit message:'));
        console.log(chalk.white(`          ${commitMessage}`));

        // Handle options
        if (options.edit) {
          await this.editCommitMessage();
        }

        if (options.copy) {
          await clipboardy.write(this.lastCommitMessage || commitMessage);
          console.log(chalk.green('[SUCCESS] Commit message copied to clipboard'));
        }

        if (options.apply) {
          await this.applyCommitMessage();
        }

      } catch (error) {
        spinner.fail('Failed to generate commit message');
        throw error;
      }

    } catch (error) {
      throw new Error(`Generate commit failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async handlePreviousCommit(options: PreviousCommitOptions): Promise<void> {
    if (!this.lastCommitMessage) {
      console.log(chalk.yellow('[WARNING] No previous commit message found'));
      return;
    }

    console.log(chalk.blue('[INFO] Previous commit message:'));
    console.log(chalk.white(`       ${this.lastCommitMessage}`));

    if (options.edit) {
      await this.editCommitMessage();
    }

    if (options.copy) {
      await clipboardy.write(this.lastCommitMessage);
      console.log(chalk.green('[SUCCESS] Previous commit message copied to clipboard'));
    }

    if (options.apply) {
      if (options.amend) {
        await this.amendCommit();
      } else {
        await this.applyCommitMessage();
      }
    }
  }

  private async editCommitMessage(): Promise<void> {
    const { editedMessage } = await inquirer.prompt([
      {
        type: 'editor',
        name: 'editedMessage',
        message: 'Edit the commit message:',
        default: this.lastCommitMessage
      }
    ]);

    this.lastCommitMessage = editedMessage.trim();
  }

  private async applyCommitMessage(): Promise<void> {
    if (!this.lastCommitMessage) {
      throw new Error('No commit message to apply');
    }

    const { confirmed } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'confirmed',
        message: 'Apply this commit message?',
        default: true
      }
    ]);

    if (confirmed) {
      await this.gitService.commit(this.lastCommitMessage);
      console.log(chalk.green('✨ [SUCCESS] Commit created successfully'));
    }
  }

  private async amendCommit(): Promise<void> {
    if (!this.lastCommitMessage) {
      throw new Error('No commit message to amend');
    }

    const { confirmed } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'confirmed',
        message: 'Amend the previous commit with this message?',
        default: true
      }
    ]);

    if (confirmed) {
      await this.gitService.commit(this.lastCommitMessage, { '--amend': null });
      console.log(chalk.green('✨ [SUCCESS] Commit amended successfully'));
    }
  }

  private storeInHistory(commitMessage: string, options: CommitOptions): void {
    const history = this.configManager.getConfig('messageHistory') || [];
    history.unshift({
      message: commitMessage,
      type: options.type || 'auto',
      timestamp: new Date().toISOString(),
      provider: options.provider || process.env.GITGENIUS_PROVIDER || this.configManager.getConfig('provider')
    });
    
    // Keep only last 50 messages
    if (history.length > 50) {
      history.splice(50);
    }
    
    this.configManager.setConfigValue('messageHistory', history);
  }

  getLastCommitMessage(): string | null {
    return this.lastCommitMessage;
  }

  setLastCommitMessage(message: string): void {
    this.lastCommitMessage = message;
  }
}
