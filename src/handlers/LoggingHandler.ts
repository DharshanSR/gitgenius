/**
 * Handler for logging and debugging commands
 */
import chalk from 'chalk';
import { logger, LogLevel } from '../utils/Logger.js';
import { errorTracker } from '../utils/ErrorTracker.js';
import { PerformanceMonitor } from '../utils/PerformanceMonitor.js';

export interface LogCommandOptions {
  level?: string;
  lines?: string;
  clear?: boolean;
  stats?: boolean;
  tail?: boolean;
  export?: string;
}

export interface ErrorCommandOptions {
  list?: boolean;
  stats?: boolean;
  clear?: boolean;
  resolved?: boolean;
  category?: string;
  export?: string;
}

export interface DebugCommandOptions {
  enable?: boolean;
  disable?: boolean;
  status?: boolean;
  performance?: boolean;
}

export class LoggingHandler {
  private performanceMonitor: PerformanceMonitor;

  constructor() {
    this.performanceMonitor = PerformanceMonitor.getInstance();
  }

  /**
   * Handle log commands
   */
  async handleLogs(options: LogCommandOptions): Promise<void> {
    // Clear logs
    if (options.clear) {
      logger.clearLogs();
      console.log(chalk.green('[SUCCESS] Logs cleared'));
      return;
    }

    // Show log statistics
    if (options.stats) {
      const stats = logger.getLogStats();
      console.log(chalk.blue('[LOGS] Log Statistics:'));
      console.log(chalk.white(`  Total logs: ${stats.totalLogs}`));
      console.log(chalk.white(`  File size: ${(stats.fileSize / 1024).toFixed(2)} KB`));
      console.log(chalk.white(`  Log file: ${logger.getLogFilePath()}`));
      console.log(chalk.white('\n  By level:'));
      
      Object.entries(stats.byLevel).forEach(([level, count]) => {
        const color = this.getLevelColor(level as LogLevel);
        console.log(chalk[color](`    ${level}: ${count}`));
      });
      return;
    }

    // Export logs
    if (options.export) {
      try {
        const logs = logger.getRecentLogs(10000);
        const content = JSON.stringify(logs, null, 2);
        const fs = await import('fs');
        fs.writeFileSync(options.export, content);
        console.log(chalk.green(`[SUCCESS] Logs exported to ${options.export}`));
        return;
      } catch (error) {
        console.error(chalk.red(`[ERROR] Failed to export logs: ${error}`));
        throw error;
      }
    }

    // Set log level
    if (options.level) {
      const validLevels: LogLevel[] = ['trace', 'debug', 'info', 'warn', 'error'];
      if (!validLevels.includes(options.level as LogLevel)) {
        console.error(chalk.red(`[ERROR] Invalid log level. Valid levels: ${validLevels.join(', ')}`));
        return;
      }
      logger.setLogLevel(options.level as LogLevel);
      console.log(chalk.green(`[SUCCESS] Log level set to: ${options.level}`));
      return;
    }

    // Show recent logs (tail)
    const lines = parseInt(options.lines || '50');
    const logs = logger.getRecentLogs(lines);
    
    console.log(chalk.blue(`[LOGS] Recent logs (${logs.length} entries):`));
    console.log(chalk.gray('─'.repeat(80)));
    
    logs.forEach(log => {
      const color = this.getLevelColor(log.level);
      const timestamp = chalk.gray(log.timestamp);
      const level = chalk[color](`[${log.level.toUpperCase()}]`);
      const category = chalk.cyan(`[${log.category}]`);
      
      console.log(`${timestamp} ${level} ${category} ${log.message}`);
      
      if (log.metadata && Object.keys(log.metadata).length > 0) {
        console.log(chalk.gray('  ' + JSON.stringify(log.metadata)));
      }
    });

    if (logs.length === 0) {
      console.log(chalk.gray('No logs found'));
    }
  }

  /**
   * Handle error tracking commands
   */
  async handleErrors(options: ErrorCommandOptions): Promise<void> {
    // Show error statistics
    if (options.stats) {
      const stats = errorTracker.getErrorStats();
      console.log(chalk.blue('[ERRORS] Error Statistics:'));
      console.log(chalk.white(`  Total errors: ${stats.totalErrors}`));
      console.log(chalk.white(`  Unresolved errors: ${stats.unresolvedErrors}`));
      
      if (Object.keys(stats.errorsByCategory).length > 0) {
        console.log(chalk.white('\n  By category:'));
        Object.entries(stats.errorsByCategory).forEach(([category, count]) => {
          console.log(chalk.yellow(`    ${category}: ${count}`));
        });
      }

      if (stats.mostCommonErrors.length > 0) {
        console.log(chalk.white('\n  Most common errors:'));
        stats.mostCommonErrors.slice(0, 5).forEach((error, index) => {
          console.log(chalk.red(`    ${index + 1}. ${error.message} (${error.count}x)`));
        });
      }
      return;
    }

    // Clear errors
    if (options.clear) {
      if (options.resolved) {
        const cleared = errorTracker.clearResolvedErrors();
        console.log(chalk.green(`[SUCCESS] Cleared ${cleared} resolved errors`));
      } else {
        errorTracker.clearAllErrors();
        console.log(chalk.green('[SUCCESS] All errors cleared'));
      }
      return;
    }

    // Export errors
    if (options.export) {
      try {
        errorTracker.exportErrors(options.export);
        console.log(chalk.green(`[SUCCESS] Errors exported to ${options.export}`));
        return;
      } catch (error) {
        console.error(chalk.red(`[ERROR] Failed to export errors: ${error}`));
        throw error;
      }
    }

    // List errors
    const errors = options.category 
      ? errorTracker.getErrorsByCategory(options.category, options.resolved || false)
      : errorTracker.getRecentErrors(50, options.resolved || false);

    console.log(chalk.blue(`[ERRORS] ${options.resolved ? 'All' : 'Unresolved'} Errors (${errors.length} entries):`));
    console.log(chalk.gray('─'.repeat(80)));

    if (errors.length === 0) {
      console.log(chalk.gray('No errors found'));
      return;
    }

    errors.forEach((error, index) => {
      const status = error.resolved ? chalk.green('✓') : chalk.red('✗');
      const timestamp = chalk.gray(new Date(error.timestamp).toLocaleString());
      const category = chalk.cyan(`[${error.category}]`);
      
      console.log(`${status} ${timestamp} ${category}`);
      console.log(`   ${chalk.white(error.message)}`);
      
      if (error.occurrences > 1) {
        console.log(chalk.yellow(`   Occurrences: ${error.occurrences}`));
      }
      
      if (error.context) {
        console.log(chalk.gray(`   Context: ${JSON.stringify(error.context)}`));
      }
      
      if (index < errors.length - 1) {
        console.log('');
      }
    });
  }

  /**
   * Handle debug commands
   */
  async handleDebug(options: DebugCommandOptions): Promise<void> {
    // Enable debug mode
    if (options.enable) {
      logger.setLogLevel('debug');
      console.log(chalk.green('[SUCCESS] Debug mode enabled'));
      console.log(chalk.gray('Set LOG_LEVEL=debug in your environment for persistent debug mode'));
      return;
    }

    // Disable debug mode
    if (options.disable) {
      logger.setLogLevel('info');
      console.log(chalk.green('[SUCCESS] Debug mode disabled'));
      return;
    }

    // Show performance metrics
    if (options.performance) {
      const metrics = this.performanceMonitor.getMetrics();
      
      console.log(chalk.blue('[DEBUG] Performance Metrics:'));
      console.log(chalk.gray('─'.repeat(80)));
      
      if (metrics.length === 0) {
        console.log(chalk.gray('No performance metrics recorded'));
        return;
      }

      // Group by operation
      const groupedMetrics = metrics.reduce((acc, metric) => {
        if (!acc[metric.operation]) {
          acc[metric.operation] = [];
        }
        acc[metric.operation].push(metric);
        return acc;
      }, {} as Record<string, typeof metrics>);

      Object.entries(groupedMetrics).forEach(([operation, opMetrics]) => {
        const avgTime = this.performanceMonitor.getAverageTime(operation);
        const successRate = this.performanceMonitor.getSuccessRate(operation);
        
        console.log(chalk.white(`\n${operation}:`));
        console.log(chalk.cyan(`  Average time: ${avgTime.toFixed(2)}ms`));
        console.log(chalk.cyan(`  Success rate: ${successRate.toFixed(2)}%`));
        console.log(chalk.cyan(`  Total runs: ${opMetrics.length}`));
      });

      return;
    }

    // Show debug status (default)
    const currentLevel = logger.getLogLevel();
    const isDebugMode = currentLevel === 'debug' || currentLevel === 'trace';
    
    console.log(chalk.blue('[DEBUG] Debug Status:'));
    console.log(chalk.white(`  Debug mode: ${isDebugMode ? chalk.green('enabled') : chalk.red('disabled')}`));
    console.log(chalk.white(`  Log level: ${chalk.cyan(currentLevel)}`));
    console.log(chalk.white(`  Log file: ${chalk.gray(logger.getLogFilePath())}`));
    console.log(chalk.white(`  Log directory: ${chalk.gray(logger.getLogDir())}`));
    
    const stats = logger.getLogStats();
    console.log(chalk.white(`\n  Total logs: ${stats.totalLogs}`));
    console.log(chalk.white(`  File size: ${(stats.fileSize / 1024).toFixed(2)} KB`));

    console.log(chalk.gray('\nTo enable debug mode:'));
    console.log(chalk.gray('  gitgenius debug --enable'));
    console.log(chalk.gray('  or set environment variable: DEBUG=gitgenius* or LOG_LEVEL=debug'));
  }

  /**
   * Get color for log level
   */
  private getLevelColor(level: LogLevel): 'red' | 'yellow' | 'green' | 'blue' | 'magenta' {
    switch (level) {
      case 'error':
        return 'red';
      case 'warn':
        return 'yellow';
      case 'info':
        return 'green';
      case 'debug':
        return 'blue';
      case 'trace':
        return 'magenta';
      default:
        return 'blue';
    }
  }
}
