#!/usr/bin/env node

import 'dotenv/config';
import { Command } from 'commander';
import { GitGenius } from './core/GitGeniusCore.js';
import { ConfigManager } from './core/ConfigManager.js';
import { BranchManager } from './core/BranchManager.js';
import { LoggingHandler } from './handlers/LoggingHandler.js';
import chalk from 'chalk';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Read version from package.json
const packageJson = JSON.parse(
  readFileSync(join(__dirname, '..', 'package.json'), 'utf8')
);

const program = new Command();
const gitGenius = new GitGenius();
const configManager = new ConfigManager();
const branchManager = new BranchManager();
const loggingHandler = new LoggingHandler();

program
  .name('gitgenius')
  .description('AI-powered commit message generator with enhanced features')
  .version(packageJson.version);

// Main command - generate commit message
program
  .command('commit', { isDefault: true })
  .description('Generate AI-powered commit message')
  .option('-a, --apply', 'Apply the generated commit message directly')
  .option('-c, --copy', 'Copy the generated commit message to clipboard')
  .option('-e, --edit', 'Enable interactive editing of the commit message')
  .option('-t, --type <type>', 'Specify the commit type (feat, fix, chore, etc.)')
  .option('-p, --provider <provider>', 'AI provider to use (openai, gemini, anthropic)')
  .option('-d, --detailed', 'Generate detailed commit message with body')
  .option('--dry-run', 'Generate commit message without applying changes')
  .action(async (options) => {
    try {
      await gitGenius.generateCommit(options);
    } catch (error) {
      console.error(chalk.red('Error:'), error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });

// Previous commit command
program
  .command('prev')
  .description('Retrieve and work with the previously generated commit message')
  .option('-a, --apply', 'Apply the previous commit message')
  .option('-c, --copy', 'Copy the previous commit message to clipboard')
  .option('-e, --edit', 'Edit the previous commit message')
  .option('--amend', 'Amend the previous commit (requires --edit)')
  .action(async (options) => {
    try {
      await gitGenius.handlePreviousCommit(options);
    } catch (error) {
      console.error(chalk.red('Error:'), error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });

// Configuration commands
program
  .command('config')
  .description('Manage GitGenius configuration')
  .argument('[key]', 'Configuration key to set')
  .argument('[value]', 'Configuration value')
  .option('--reset', 'Reset all configuration')
  .option('--list', 'List all configuration')
  .option('--backup', 'Backup current configuration')
  .option('--restore <file>', 'Restore configuration from backup')
  .option('--validate', 'Validate current configuration')
  .option('--template <name>', 'Apply a configuration template')
  .option('--export <file>', 'Export configuration to file')
  .option('--import <file>', 'Import configuration from file')
  .option('--migrate', 'Manually migrate configuration')
  .action(async (key, value, options) => {
    try {
      await configManager.handleConfig(key, value, options);
    } catch (error) {
      console.error(chalk.red('Error:'), error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });

// Branch management commands
program
  .command('branch')
  .description('Manage git branches')
  .option('-r, --remote', 'Include remote branches')
  .option('-c, --copy', 'Copy selected branch name to clipboard')
  .option('-d, --delete', 'Delete branches')
  .option('-f, --force', 'Force delete branches (with --delete)')
  .action(async (options) => {
    try {
      await branchManager.handleBranches(options);
    } catch (error) {
      console.error(chalk.red('Error:'), error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });

// Checkout command
program
  .command('checkout')
  .description('Interactive branch checkout')
  .action(async () => {
    try {
      await branchManager.interactiveCheckout();
    } catch (error) {
      console.error(chalk.red('Error:'), error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });

// Statistics command
program
  .command('stats')
  .description('Show commit statistics and insights')
  .option('-d, --days <days>', 'Number of days to analyze', '30')
  .option('--author <author>', 'Filter by author')
  .action(async (options) => {
    try {
      await gitGenius.showStats(options);
    } catch (error) {
      console.error(chalk.red('Error:'), error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });

// Templates command
program
  .command('template')
  .description('Manage commit message templates')
  .option('-l, --list', 'List all templates')
  .option('-a, --add <name>', 'Add a new template')
  .option('-r, --remove <name>', 'Remove a template')
  .option('-u, --use <name>', 'Use a specific template')
  .action(async (options) => {
    try {
      await gitGenius.handleTemplates(options);
    } catch (error) {
      console.error(chalk.red('Error:'), error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });

// Pull Request command
program
  .command('pr')
  .alias('pull-request')
  .description('Create AI-powered pull requests')
  .option('-t, --title <title>', 'PR title')
  .option('-b, --body <body>', 'PR body/description')
  .option('--draft', 'Create as draft PR')
  .option('--target <branch>', 'Target branch (default: main)')
  .option('--source <branch>', 'Source branch (default: current branch)')
  .option('-r, --reviewers <reviewers>', 'Comma-separated list of reviewers')
  .action(async (options) => {
    try {
      const reviewers = options.reviewers ? options.reviewers.split(',').map((r: string) => r.trim()) : [];
      await gitGenius.createPullRequest({ ...options, reviewers });
    } catch (error) {
      console.error(chalk.red('Error:'), error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });

// Log command - Show formatted git log with AI summaries
program
  .command('log')
  .description('Show git log with AI summaries and insights')
  .option('-n, --number <count>', 'Number of commits to show', '10')
  .option('--since <date>', 'Show commits since date')
  .option('--author <author>', 'Filter by author')
  .option('--ai', 'Generate AI summary of changes')
  .action(async (options) => {
    try {
      await gitGenius.showLog(options);
    } catch (error) {
      console.error(chalk.red('Error:'), error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });

// Diff command - Show diffs with AI explanations
program
  .command('diff')
  .description('Show git diff with optional AI explanations')
  .option('--staged', 'Show staged changes')
  .option('--last', 'Show last commit changes')
  .option('--ai', 'Get AI explanation of changes')
  .option('--file <file>', 'Show diff for specific file')
  .action(async (options) => {
    try {
      await gitGenius.showDiff(options);
    } catch (error) {
      console.error(chalk.red('Error:'), error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });

// Review command - AI-powered code review
program
  .command('review')
  .description('AI-powered code review for staged changes')
  .option('--file <file>', 'Review specific file')
  .option('--severity <level>', 'Filter by severity (low, medium, high)', 'medium')
  .option('--format <format>', 'Output format (text, json, markdown)', 'text')
  .action(async (options) => {
    try {
      await gitGenius.reviewChanges(options);
    } catch (error) {
      console.error(chalk.red('Error:'), error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });

// Suggest command - AI suggestions for commit types and scopes
program
  .command('suggest')
  .description('AI suggestions for commit types and scopes')
  .option('--type', 'Suggest commit type only')
  .option('--scope', 'Suggest scope only')
  .option('--branch', 'Base suggestions on branch name')
  .action(async (options) => {
    try {
      await gitGenius.suggestCommitInfo(options);
    } catch (error) {
      console.error(chalk.red('Error:'), error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });

// Undo command - Undo commits or reset changes
program
  .command('undo')
  .description('Undo last commit or AI-generated changes')
  .option('--commit', 'Undo last commit (soft reset)')
  .option('--hard', 'Hard reset (loses changes)')
  .option('--staged', 'Unstage all changes')
  .action(async (options) => {
    try {
      await gitGenius.undoChanges(options);
    } catch (error) {
      console.error(chalk.red('Error:'), error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });

// History command - Show history of generated messages
program
  .command('history')
  .description('Show history of generated commit messages')
  .option('-n, --number <count>', 'Number of messages to show', '10')
  .option('--clear', 'Clear message history')
  .option('--export <file>', 'Export history to file')
  .action(async (options) => {
    try {
      await gitGenius.showHistory(options);
    } catch (error) {
      console.error(chalk.red('Error:'), error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });

// Alias command - Manage custom aliases
program
  .command('alias')
  .description('Manage custom command aliases')
  .option('-l, --list', 'List all aliases')
  .option('-a, --add <name> <command>', 'Add new alias')
  .option('-r, --remove <name>', 'Remove alias')
  .action(async (options, name, command) => {
    try {
      await gitGenius.manageAliases(options, name, command);
    } catch (error) {
      console.error(chalk.red('Error:'), error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });

// Init command - Initialize repo with best practices
program
  .command('init')
  .description('Initialize repository with GitGenius best practices')
  .option('--hooks', 'Install git hooks')
  .option('--templates', 'Setup commit templates')
  .option('--config', 'Setup recommended git config')
  .option('--all', 'Setup everything')
  .action(async (options) => {
    try {
      await gitGenius.initializeRepo(options);
    } catch (error) {
      console.error(chalk.red('Error:'), error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });

// Feedback command - Send feedback
program
  .command('feedback')
  .description('Send feedback or bug reports')
  .option('--bug', 'Report a bug')
  .option('--feature', 'Request a feature')
  .option('--rating <stars>', 'Rate GitGenius (1-5 stars)')
  .action(async (options) => {
    try {
      await gitGenius.sendFeedback(options);
    } catch (error) {
      console.error(chalk.red('Error:'), error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });

// Update command - Check for updates
program
  .command('update')
  .description('Check for GitGenius updates')
  .option('--check', 'Check for updates only')
  .option('--force', 'Force update even if up to date')
  .action(async (options) => {
    try {
      await gitGenius.checkUpdates(options);
    } catch (error) {
      console.error(chalk.red('Error:'), error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });

// Whoami command - Show current configuration
program
  .command('whoami')
  .description('Show current API key and provider information')
  .action(async () => {
    try {
      await gitGenius.showWhoami();
    } catch (error) {
      console.error(chalk.red('Error:'), error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });

// Git state command - Show detailed Git state
program
  .command('state')
  .description('Show detailed Git repository state')
  .option('--validate', 'Validate Git environment')
  .option('--worktrees', 'Show worktree information')
  .option('--submodules', 'Show submodule information')
  .action(async (options) => {
    try {
      await gitGenius.showGitState(options);
    } catch (error) {
      console.error(chalk.red('Error:'), error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });

// Logs command - Manage and view logs
program
  .command('logs')
  .description('View and manage GitGenius logs')
  .option('-l, --level <level>', 'Set log level (trace, debug, info, warn, error)')
  .option('-n, --lines <count>', 'Number of log lines to show', '50')
  .option('--clear', 'Clear all logs')
  .option('--stats', 'Show log statistics')
  .option('--tail', 'Tail logs (watch mode)')
  .option('--export <file>', 'Export logs to file')
  .action(async (options) => {
    try {
      await loggingHandler.handleLogs(options);
    } catch (error) {
      console.error(chalk.red('Error:'), error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });

// Errors command - Track and manage errors
program
  .command('errors')
  .description('View and manage error tracking')
  .option('-l, --list', 'List errors (default)')
  .option('--stats', 'Show error statistics')
  .option('--clear', 'Clear errors')
  .option('--resolved', 'Include resolved errors')
  .option('--category <category>', 'Filter by error category')
  .option('--export <file>', 'Export errors to file')
  .action(async (options) => {
    try {
      await loggingHandler.handleErrors(options);
    } catch (error) {
      console.error(chalk.red('Error:'), error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });

// Debug command - Debug mode and performance metrics
program
  .command('debug')
  .description('Debug mode and performance monitoring')
  .option('--enable', 'Enable debug mode')
  .option('--disable', 'Disable debug mode')
  .option('--status', 'Show debug status (default)')
  .option('--performance', 'Show performance metrics')
  .option('--memory', 'Show memory usage report')
  .action(async (options) => {
    try {
      await loggingHandler.handleDebug(options);
    } catch (error) {
      console.error(chalk.red('Error:'), error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });

program.parse();
