/**
 * Comprehensive structured logging system for GitGenius
 * Supports multiple log levels, log rotation, and debug mode
 */
import chalk from 'chalk';
import { writeFileSync, existsSync, mkdirSync, readFileSync, appendFileSync, statSync, readdirSync, unlinkSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'trace';

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  category: string;
  message: string;
  metadata?: any;
  stack?: string;
}

export interface LoggerConfig {
  level: LogLevel;
  enableConsole: boolean;
  enableFile: boolean;
  logDir: string;
  maxFileSize: number; // in bytes
  maxFiles: number;
  prettyPrint: boolean;
}

export class Logger {
  private static instance: Logger;
  private config: LoggerConfig;
  private logFilePath: string;
  private readonly levels: Record<LogLevel, number> = {
    trace: 0,
    debug: 1,
    info: 2,
    warn: 3,
    error: 4
  };

  private constructor() {
    const logDir = join(homedir(), '.gitgenius', 'logs');
    
    this.config = {
      level: this.getLogLevelFromEnv(),
      enableConsole: true,
      enableFile: true,
      logDir,
      maxFileSize: 10 * 1024 * 1024, // 10MB
      maxFiles: 5,
      prettyPrint: process.env.LOG_PRETTY !== 'false'
    };

    // Ensure log directory exists
    if (!existsSync(this.config.logDir)) {
      mkdirSync(this.config.logDir, { recursive: true });
    }

    this.logFilePath = join(this.config.logDir, 'gitgenius.log');
    this.rotateLogsIfNeeded();
  }

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  /**
   * Get log level from environment variables
   */
  private getLogLevelFromEnv(): LogLevel {
    const debugEnv = process.env.DEBUG;
    const logLevel = process.env.LOG_LEVEL;

    if (logLevel && ['debug', 'info', 'warn', 'error', 'trace'].includes(logLevel)) {
      return logLevel as LogLevel;
    }

    if (debugEnv && debugEnv.includes('gitgenius')) {
      return 'debug';
    }

    return 'info';
  }

  /**
   * Check if logs should be rotated
   */
  private rotateLogsIfNeeded(): void {
    if (!existsSync(this.logFilePath)) {
      return;
    }

    const stats = statSync(this.logFilePath);
    if (stats.size >= this.config.maxFileSize) {
      this.rotateLogs();
    }
  }

  /**
   * Rotate log files
   */
  private rotateLogs(): void {
    try {
      // Remove oldest log if we have too many
      const logFiles = readdirSync(this.config.logDir)
        .filter(f => f.startsWith('gitgenius.log'))
        .sort()
        .reverse();

      if (logFiles.length >= this.config.maxFiles) {
        const oldestLog = join(this.config.logDir, logFiles[logFiles.length - 1]);
        unlinkSync(oldestLog);
      }

      // Rotate current log
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const rotatedPath = join(this.config.logDir, `gitgenius.log.${timestamp}`);
      
      if (existsSync(this.logFilePath)) {
        const content = readFileSync(this.logFilePath, 'utf-8');
        writeFileSync(rotatedPath, content);
        writeFileSync(this.logFilePath, '');
      }
    } catch (error) {
      // Silently fail - don't break the app if log rotation fails
      console.error('Failed to rotate logs:', error);
    }
  }

  /**
   * Check if a log level should be logged
   */
  private shouldLog(level: LogLevel): boolean {
    return this.levels[level] >= this.levels[this.config.level];
  }

  /**
   * Write log entry to file
   */
  private writeToFile(entry: LogEntry): void {
    if (!this.config.enableFile) {
      return;
    }

    try {
      this.rotateLogsIfNeeded();
      const logLine = JSON.stringify(entry) + '\n';
      appendFileSync(this.logFilePath, logLine);
    } catch (error) {
      // Silently fail - don't break the app if file logging fails
    }
  }

  /**
   * Format log entry for console output
   */
  private formatForConsole(entry: LogEntry): string {
    if (!this.config.prettyPrint) {
      return JSON.stringify(entry);
    }

    const timestamp = chalk.gray(entry.timestamp);
    const category = chalk.cyan(`[${entry.category}]`);
    
    let levelStr = '';
    switch (entry.level) {
      case 'trace':
        levelStr = chalk.magenta('[TRACE]');
        break;
      case 'debug':
        levelStr = chalk.blue('[DEBUG]');
        break;
      case 'info':
        levelStr = chalk.green('[INFO]');
        break;
      case 'warn':
        levelStr = chalk.yellow('[WARN]');
        break;
      case 'error':
        levelStr = chalk.red('[ERROR]');
        break;
    }

    let output = `${timestamp} ${levelStr} ${category} ${entry.message}`;

    if (entry.metadata && Object.keys(entry.metadata).length > 0) {
      output += '\n' + chalk.gray(JSON.stringify(entry.metadata, null, 2));
    }

    if (entry.stack) {
      output += '\n' + chalk.gray(entry.stack);
    }

    return output;
  }

  /**
   * Core log method
   */
  private log(level: LogLevel, category: string, message: string, metadata?: any, error?: Error): void {
    if (!this.shouldLog(level)) {
      return;
    }

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      category,
      message,
      metadata,
      stack: error?.stack
    };

    // Write to file
    this.writeToFile(entry);

    // Write to console
    if (this.config.enableConsole) {
      const formatted = this.formatForConsole(entry);
      
      switch (level) {
        case 'error':
          console.error(formatted);
          break;
        case 'warn':
          console.warn(formatted);
          break;
        default:
          console.log(formatted);
      }
    }
  }

  /**
   * Public logging methods
   */
  trace(category: string, message: string, metadata?: any): void {
    this.log('trace', category, message, metadata);
  }

  debug(category: string, message: string, metadata?: any): void {
    this.log('debug', category, message, metadata);
  }

  info(category: string, message: string, metadata?: any): void {
    this.log('info', category, message, metadata);
  }

  warn(category: string, message: string, metadata?: any): void {
    this.log('warn', category, message, metadata);
  }

  error(category: string, message: string, error?: Error, metadata?: any): void {
    this.log('error', category, message, metadata, error);
  }

  /**
   * Configuration methods
   */
  setLogLevel(level: LogLevel): void {
    this.config.level = level;
  }

  getLogLevel(): LogLevel {
    return this.config.level;
  }

  enableFileLogging(enable: boolean): void {
    this.config.enableFile = enable;
  }

  enableConsoleLogging(enable: boolean): void {
    this.config.enableConsole = enable;
  }

  getLogFilePath(): string {
    return this.logFilePath;
  }

  getLogDir(): string {
    return this.config.logDir;
  }

  /**
   * Get recent logs from file
   */
  getRecentLogs(lines: number = 100): LogEntry[] {
    try {
      if (!existsSync(this.logFilePath)) {
        return [];
      }

      const content = readFileSync(this.logFilePath, 'utf-8');
      const logLines = content.trim().split('\n').filter(line => line.length > 0);
      const recentLines = logLines.slice(-lines);

      return recentLines.map(line => {
        try {
          return JSON.parse(line) as LogEntry;
        } catch {
          return null;
        }
      }).filter(entry => entry !== null) as LogEntry[];
    } catch (error) {
      return [];
    }
  }

  /**
   * Clear all logs
   */
  clearLogs(): void {
    try {
      if (existsSync(this.logFilePath)) {
        writeFileSync(this.logFilePath, '');
      }

      // Clear rotated logs
      const logFiles = readdirSync(this.config.logDir)
        .filter(f => f.startsWith('gitgenius.log'));

      logFiles.forEach(file => {
        const filePath = join(this.config.logDir, file);
        if (filePath !== this.logFilePath) {
          unlinkSync(filePath);
        }
      });
    } catch (error) {
      console.error('Failed to clear logs:', error);
    }
  }

  /**
   * Get log statistics
   */
  getLogStats(): { totalLogs: number; byLevel: Record<string, number>; fileSize: number } {
    try {
      const logs = this.getRecentLogs(1000);
      const byLevel: Record<string, number> = {
        trace: 0,
        debug: 0,
        info: 0,
        warn: 0,
        error: 0
      };

      logs.forEach(log => {
        byLevel[log.level] = (byLevel[log.level] || 0) + 1;
      });

      const fileSize = existsSync(this.logFilePath) 
        ? statSync(this.logFilePath).size 
        : 0;

      return {
        totalLogs: logs.length,
        byLevel,
        fileSize
      };
    } catch {
      return {
        totalLogs: 0,
        byLevel: { trace: 0, debug: 0, info: 0, warn: 0, error: 0 },
        fileSize: 0
      };
    }
  }
}

// Export singleton instance
export const logger = Logger.getInstance();
