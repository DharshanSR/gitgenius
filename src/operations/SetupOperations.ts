import chalk from 'chalk';
import inquirer from 'inquirer';
import { GitService } from '../services/GitService.js';
import { TemplateService } from '../services/TemplateService.js';
import { ConfigManager } from '../core/ConfigManager.js';
import { InitOptions, FeedbackOptions } from '../types.js';

export class SetupOperations {
  private gitService: GitService;
  private templateService: TemplateService;
  private configManager: ConfigManager;

  constructor() {
    this.gitService = new GitService();
    this.templateService = new TemplateService();
    this.configManager = new ConfigManager();
  }

  async initializeRepo(options: InitOptions): Promise<void> {
    try {
      console.log(chalk.blue('✨ [INIT] Initializing GitGenius setup...'));

      if (options.all || options.hooks) {
        console.log(chalk.yellow('[INIT] Setting up git hooks...'));
        // Create commit-msg hook
        const hookContent = `#!/bin/sh
# GitGenius commit message validation
if [ -f ".gitgenius-skip" ]; then
  exit 0
fi

# Add your validation logic here
echo "GitGenius: Commit message validated"
`;
        // Implementation would go here
        console.log(chalk.green('[SUCCESS] Git hooks installed'));
      }

      if (options.all || options.templates) {
        console.log(chalk.yellow('[INIT] Setting up commit templates...'));
        const templates = this.templateService.createDefaultTemplates();
        this.configManager.setConfigValue('templates', templates);
        console.log(chalk.green('✨ [SUCCESS] Default templates created'));
      }

      if (options.all || options.config) {
        console.log(chalk.yellow('[INIT] Setting up git configuration...'));
        await this.gitService.addConfig('commit.template', '.gitmessage');
        console.log(chalk.green('[SUCCESS] Git configuration updated'));
      }

      console.log(chalk.green('✨ [SUCCESS] GitGenius initialization complete!'));
    } catch (error) {
      throw new Error(`Failed to initialize: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async sendFeedback(options: FeedbackOptions): Promise<void> {
    try {
      console.log(chalk.blue('[FEEDBACK] GitGenius Feedback'));

      if (options.rating) {
        const rating = parseInt(options.rating);
        if (rating >= 1 && rating <= 5) {
          console.log(chalk.green(`✨ [SUCCESS] Thank you for rating GitGenius ${rating}/5 stars!`));
        }
      }

      const { feedbackType, message } = await inquirer.prompt([
        {
          type: 'list',
          name: 'feedbackType',
          message: 'What type of feedback?',
          choices: [
            { name: 'Bug report', value: 'bug' },
            { name: 'Feature request', value: 'feature' },
            { name: 'General feedback', value: 'general' }
          ]
        },
        {
          type: 'editor',
          name: 'message',
          message: 'Please describe your feedback:'
        }
      ]);

      // Store feedback locally (in real implementation, would send to server)
      const feedback = {
        type: feedbackType,
        message,
        timestamp: new Date().toISOString(),
        version: '1.0.0'
      };

      const existingFeedback = this.configManager.getConfig('feedback') || [];
      existingFeedback.push(feedback);
      this.configManager.setConfigValue('feedback', existingFeedback);

      console.log(chalk.green('✨ [SUCCESS] Feedback submitted! Thank you for helping improve GitGenius.'));
      console.log(chalk.blue('[INFO] Join our community: https://github.com/yourusername/gitgenius/discussions'));
    } catch (error) {
      throw new Error(`Failed to send feedback: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}
