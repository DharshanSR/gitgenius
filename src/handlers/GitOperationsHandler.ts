import chalk from 'chalk';
import ora from 'ora';
import { AIService } from '../services/AIService.js';
import { GitService } from '../services/GitService.js';
import { LogOptions, DiffOptions, ReviewOptions, SuggestOptions } from '../types.js';

export class GitOperationsHandler {
  private aiService: AIService;
  private gitService: GitService;

  constructor() {
    this.aiService = new AIService();
    this.gitService = new GitService();
  }

  async showLog(options: LogOptions): Promise<void> {
    try {
      const count = parseInt(options.number || '10');
      const logs = await this.gitService.getLog({
        maxCount: count,
        ...(options.since && { since: options.since }),
        ...(options.author && { author: options.author })
      });

      console.log(chalk.blue(`[LOG] Git Log (${count} commits):`));
      
      for (const commit of logs.all.slice(0, count)) {
        const date = new Date(commit.date).toLocaleDateString();
        console.log(`${chalk.yellow(commit.hash.substring(0, 7))} ${chalk.white(commit.message)}`);
        console.log(`  ${chalk.gray(`${commit.author_name} • ${date}`)}`);
        
        if (options.ai && this.aiService.hasApiKey()) {
          try {
            const summary = await this.aiService.explainCommit(commit.message, commit.refs);
            console.log(`  ${chalk.green(`[AI] ${summary}`)}`);
          } catch (error) {
            console.log(`  ${chalk.red('[AI] Summary unavailable')}`);
          }
        }
        console.log('');
      }
    } catch (error) {
      throw new Error(`Failed to show log: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async showDiff(options: DiffOptions): Promise<void> {
    try {
      let diff = '';
      
      if (options.staged) {
        diff = await this.gitService.getStagedDiff();
      } else if (options.last) {
        diff = await this.gitService.getLastCommitDiff();
      } else if (options.file) {
        diff = await this.gitService.getFileDiff(options.file);
      } else {
        diff = await this.gitService.getDiff();
      }

      if (!diff.trim()) {
        console.log(chalk.yellow('[WARNING] No differences found'));
        return;
      }

      console.log(chalk.blue('[DIFF] Git Diff:'));
      console.log(diff);

      if (options.ai && this.aiService.hasApiKey()) {
        try {
          const explanation = await this.aiService.explainCommit(
            `Explain these code changes:\n${diff.substring(0, 2000)}`,
            'code changes'
          );
          console.log(chalk.green(`\n[AI] Explanation: ${explanation}`));
        } catch (error) {
          console.log(chalk.red('\n[AI] Explanation unavailable'));
        }
      }
    } catch (error) {
      throw new Error(`Failed to show diff: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async reviewChanges(options: ReviewOptions): Promise<void> {
    try {
      const diff = options.file 
        ? await this.gitService.getFileDiff(options.file)
        : await this.gitService.getStagedDiff();

      if (!diff.trim()) {
        console.log(chalk.yellow('[WARNING] No changes to review'));
        return;
      }

      if (!this.aiService.hasApiKey()) {
        console.log(chalk.red('[ERROR] API key required for code review'));
        return;
      }

      console.log(chalk.blue('✨ [REVIEW] AI Code Review:'));
      const spinner = ora('Analyzing code...').start();

      try {
        const review = await this.aiService.reviewCode(diff);
        spinner.stop();
        console.log(chalk.white(review));

        // Format based on requested format
        if (options.format === 'json') {
          const reviewData = {
            timestamp: new Date().toISOString(),
            severity: options.severity,
            review: review,
            file: options.file || 'staged changes'
          };
          console.log('\n' + JSON.stringify(reviewData, null, 2));
        }
      } catch (error) {
        spinner.fail('Code review failed');
        throw error;
      }
    } catch (error) {
      throw new Error(`Failed to review changes: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async suggestCommitInfo(options: SuggestOptions): Promise<void> {
    try {
      const diff = await this.gitService.getStagedDiff();
      
      if (!diff.trim()) {
        console.log(chalk.yellow('[WARNING] No staged changes found'));
        return;
      }

      console.log(chalk.blue('✨ [SUGGEST] AI Suggestions:'));

      if (!this.aiService.hasApiKey()) {
        // Provide basic suggestions without AI
        const basicTypes = ['feat', 'fix', 'docs', 'style', 'refactor', 'test', 'chore'];
        console.log(chalk.white(`Suggested types: ${basicTypes.join(', ')}`));
        return;
      }

      const spinner = ora('Generating suggestions...').start();

      try {
        let suggestion = '';

        if (options.type) {
          suggestion = await this.aiService.suggestCommitType(diff);
        } else if (options.scope) {
          suggestion = await this.aiService.suggestCommitScope(diff);
        } else {
          suggestion = await this.aiService.suggestCommitType(diff);
        }

        spinner.stop();
        console.log(chalk.green(`[SUGGEST] ${suggestion}`));
      } catch (error) {
        spinner.fail('Failed to generate suggestions');
        throw error;
      }
    } catch (error) {
      throw new Error(`Failed to generate suggestions: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}
