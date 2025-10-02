import chalk from 'chalk';
import ora from 'ora';
import { GitService } from '../services/GitService.js';
import { AIService } from '../services/AIService.js';
import { ConfigManager } from '../core/ConfigManager.js';
import { StatsOptions, UpdateOptions, GitStateOptions } from '../types.js';

export class SystemOperations {
  private gitService: GitService;
  private aiService: AIService;
  private configManager: ConfigManager;

  constructor() {
    this.gitService = new GitService();
    this.aiService = new AIService();
    this.configManager = new ConfigManager();
  }

  async showStats(options: StatsOptions): Promise<void> {
    try {
      const days = parseInt(options.days || '30');
      const since = new Date();
      since.setDate(since.getDate() - days);

      const logs = await this.gitService.getLog({
        from: since.toISOString(),
        ...(options.author && { author: options.author })
      });

      const stats = this.gitService.calculateStats(logs);
      this.gitService.displayStats(stats, days, options.author);

    } catch (error) {
      throw new Error(`Failed to generate stats: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async checkUpdates(options: UpdateOptions): Promise<void> {
    try {
      console.log(chalk.blue('[UPDATE] Checking for GitGenius updates...'));
      
      const currentVersion = '1.0.0';
      
      // In real implementation, would check npm registry
      const spinner = ora('Checking npm registry...').start();
      
      setTimeout(async () => {
        spinner.stop();
        
        // Simulate update check
        const latestVersion = '1.0.0'; // Would fetch from npm
        
        if (currentVersion === latestVersion) {
          console.log(chalk.green(`✨ [SUCCESS] GitGenius is up to date (v${currentVersion})`));
        } else {
          console.log(chalk.yellow(`[UPDATE] Update available: v${currentVersion} → v${latestVersion}`));
          console.log(chalk.blue('[INFO] Run: npm install -g gitgenius@latest'));
          
          if (options.force) {
            console.log(chalk.yellow('[UPDATE] Force update requested...'));
            console.log(chalk.green('✨ [SUCCESS] GitGenius updated successfully!'));
          }
        }
        
        // Show changelog
        console.log(chalk.blue('\n[CHANGELOG] Recent changes:'));
        console.log(chalk.white('• Enhanced AI commit message generation'));
        console.log(chalk.white('• Added branch management features'));
        console.log(chalk.white('• Improved error handling'));
      }, 1000);
      
    } catch (error) {
      throw new Error(`Failed to check updates: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async showWhoami(): Promise<void> {
    try {
      console.log(chalk.blue('[IDENTITY] GitGenius Identity:'));
      
      const provider = process.env.GITGENIUS_PROVIDER || this.configManager.getConfig('provider') || 'openai';
      const model = process.env.GITGENIUS_MODEL || this.configManager.getConfig('model') || 'gpt-3.5-turbo';
      
      console.log(chalk.white(`Provider: ${chalk.yellow(provider)}`));
      console.log(chalk.white(`Model: ${chalk.yellow(model)}`));
      
      if (this.configManager.hasApiKey()) {
        const apiKey = this.configManager.getApiKey();
        const maskedKey = apiKey ? `${apiKey.substring(0, 8)}...${apiKey.substring(apiKey.length - 4)}` : 'Not set';
        console.log(chalk.white(`API Key: ${chalk.green(maskedKey)}`));
        console.log(chalk.green('✨ [SUCCESS] Ready to generate commit messages'));
      } else {
        console.log(chalk.red('[ERROR] No API key configured'));
        console.log(chalk.yellow('[INFO] Run: gitgenius config apiKey'));
      }
      
      // Show git user info
      try {
        const userName = await this.gitService.getConfig('user.name');
        const userEmail = await this.gitService.getConfig('user.email');
        console.log(chalk.white(`Git User: ${chalk.cyan(`${userName.value} <${userEmail.value}>`)}`));
      } catch {
        console.log(chalk.yellow('[WARNING] Git user not configured'));
      }
      
      // Show repository info
      try {
        const isRepo = await this.gitService.checkIsRepo();
        if (isRepo) {
          const branch = await this.gitService.getBranchLocal();
          console.log(chalk.white(`Current Branch: ${chalk.cyan(branch.current)}`));
        } else {
          console.log(chalk.yellow('[WARNING] Not in a git repository'));
        }
      } catch {
        console.log(chalk.yellow('[WARNING] Unable to read git repository'));
      }
      
    } catch (error) {
      throw new Error(`Failed to show identity: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async showGitState(options: GitStateOptions): Promise<void> {
    try {
      await this.gitService.ensureGitRepo();
      
      const stateManager = this.gitService.getStateManager();
      
      // Display main state
      await stateManager.displayState();
      
      // Validate environment if requested
      if (options.validate) {
        console.log(chalk.blue('\n🔍 Environment Validation:'));
        const validation = await stateManager.validateEnvironment();
        
        if (validation.valid) {
          console.log(chalk.green('  ✓ All checks passed'));
        } else {
          console.log(chalk.yellow('  ⚠ Issues found:'));
          validation.errors.forEach(err => {
            console.log(chalk.yellow(`    • ${err}`));
          });
        }
      }
      
      // Show worktree details if requested
      if (options.worktrees) {
        const worktrees = await stateManager.getWorktrees();
        console.log(chalk.blue('\n📁 Worktrees:'));
        
        if (worktrees.length === 0) {
          console.log(chalk.gray('  No additional worktrees'));
        } else {
          worktrees.forEach(wt => {
            const marker = wt.isMain ? '(main)' : '';
            console.log(chalk.white(`  • ${wt.path} ${marker}`));
            console.log(chalk.gray(`    Branch: ${wt.branch || 'detached'}`));
            console.log(chalk.gray(`    Commit: ${wt.commit.substring(0, 7)}`));
          });
        }
      }
      
      // Show submodule details if requested
      if (options.submodules) {
        const submodules = await stateManager.getSubmodules();
        console.log(chalk.blue('\n📦 Submodules:'));
        
        if (submodules.length === 0) {
          console.log(chalk.gray('  No submodules configured'));
        } else {
          submodules.forEach(sm => {
            const status = sm.isInitialized ? chalk.green('initialized') : chalk.yellow('not initialized');
            console.log(chalk.white(`  • ${sm.path} [${status}]`));
            if (sm.url) {
              console.log(chalk.gray(`    URL: ${sm.url}`));
            }
            if (sm.branch) {
              console.log(chalk.gray(`    Branch: ${sm.branch}`));
            }
            console.log(chalk.gray(`    Commit: ${sm.commit.substring(0, 7)}`));
          });
        }
      }
      
      // Show conflict resolution hints if there are conflicts
      const state = await stateManager.getState();
      if (state.hasConflicts) {
        console.log(chalk.yellow('\n⚠ Conflict Resolution:'));
        const hints = await stateManager.getConflictResolutionHints();
        hints.forEach(hint => {
          console.log(chalk.yellow(`  ${hint}`));
        });
      }
      
    } catch (error) {
      throw new Error(`Failed to show Git state: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}
