/**
 * Professional error handler with detailed error information
 */
import chalk from 'chalk';
import { logger } from './Logger.js';
import { errorTracker } from './ErrorTracker.js';

export class GitGeniusError extends Error {
  constructor(
    message: string,
    public code: string,
    public category: 'git' | 'ai' | 'config' | 'network' | 'user',
    public suggestions: string[] = []
  ) {
    super(message);
    this.name = 'GitGeniusError';
  }
}

export class ErrorHandler {
  static handle(error: unknown): void {
    if (error instanceof GitGeniusError) {
      this.handleGitGeniusError(error);
    } else if (error instanceof Error) {
      this.handleGenericError(error);
    } else {
      this.handleUnknownError(error);
    }
  }

  private static handleGitGeniusError(error: GitGeniusError): void {
    // Track error
    errorTracker.trackError(error.category, error.message, error, { 
      code: error.code,
      suggestions: error.suggestions 
    });

    console.error(chalk.red(`[${error.category.toUpperCase()}] ${error.message}`));
    
    if (error.suggestions.length > 0) {
      console.log(chalk.yellow('\n💡 Suggestions:'));
      error.suggestions.forEach(suggestion => {
        console.log(chalk.yellow(`   • ${suggestion}`));
      });
    }

    this.showCommonSolutions(error.category);
    process.exit(1);
  }

  private static handleGenericError(error: Error): void {
    // Track error
    errorTracker.trackError('error', error.message, error);

    console.error(chalk.red(`[ERROR] ${error.message}`));
    
    if (process.env.DEBUG || logger.getLogLevel() === 'debug') {
      console.error(chalk.gray(error.stack));
    }
    
    process.exit(1);
  }

  private static handleUnknownError(error: unknown): void {
    // Track error
    errorTracker.trackError('unknown', 'An unexpected error occurred', undefined, { error: String(error) });

    console.error(chalk.red('[ERROR] An unexpected error occurred'));
    console.error(chalk.gray(String(error)));
    process.exit(1);
  }

  private static showCommonSolutions(category: string): void {
    const solutions: Record<string, string[]> = {
      git: [
        'Ensure you are in a git repository',
        'Check if you have staged changes: git status',
        'Verify git is properly configured'
      ],
      ai: [
        'Check your API key configuration: gitgenius config',
        'Verify your internet connection',
        'Try a different AI provider: gitgenius config provider'
      ],
      config: [
        'Reset configuration: gitgenius config --reset',
        'Check file permissions in ~/.config/gitgenius/',
        'Reconfigure your settings: gitgenius config'
      ],
      network: [
        'Check your internet connection',
        'Verify firewall settings',
        'Try again in a few moments'
      ],
      user: [
        'Check the command syntax: gitgenius --help',
        'Refer to documentation: https://docs.gitgenius.dev',
        'Join our community: https://discord.gg/gitgenius'
      ]
    };

    const categorySolutions = solutions[category];
    if (categorySolutions) {
      console.log(chalk.blue('\n🔧 Common solutions:'));
      categorySolutions.forEach(solution => {
        console.log(chalk.blue(`   • ${solution}`));
      });
    }
  }

  // Specific error creators
  static gitError(message: string, suggestions: string[] = []): GitGeniusError {
    return new GitGeniusError(message, 'GIT_ERROR', 'git', suggestions);
  }

  static aiError(message: string, suggestions: string[] = []): GitGeniusError {
    return new GitGeniusError(message, 'AI_ERROR', 'ai', suggestions);
  }

  static configError(message: string, suggestions: string[] = []): GitGeniusError {
    return new GitGeniusError(message, 'CONFIG_ERROR', 'config', suggestions);
  }

  static networkError(message: string, suggestions: string[] = []): GitGeniusError {
    return new GitGeniusError(message, 'NETWORK_ERROR', 'network', suggestions);
  }

  static userError(message: string, suggestions: string[] = []): GitGeniusError {
    return new GitGeniusError(message, 'USER_ERROR', 'user', suggestions);
  }
}
