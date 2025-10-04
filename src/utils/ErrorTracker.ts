/**
 * Error tracking system with comprehensive error monitoring
 */
import { logger } from './Logger';
import { ConfigManager } from '../core/ConfigManager';
import { writeFileSync, existsSync, mkdirSync, readFileSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

export interface ErrorRecord {
  id: string;
  timestamp: string;
  category: string;
  message: string;
  stack?: string;
  context?: any;
  resolved: boolean;
  occurrences: number;
}

export interface ErrorStats {
  totalErrors: number;
  unresolvedErrors: number;
  errorsByCategory: Record<string, number>;
  errorsByDay: Record<string, number>;
  mostCommonErrors: Array<{ message: string; count: number }>;
}

export class ErrorTracker {
  private static instance: ErrorTracker;
  private configManager: ConfigManager;
  private errors: Map<string, ErrorRecord> = new Map();
  private errorLogPath: string;

  private constructor() {
    this.configManager = new ConfigManager();
    const errorDir = join(homedir(), '.gitgenius', 'errors');
    
    if (!existsSync(errorDir)) {
      mkdirSync(errorDir, { recursive: true });
    }

    this.errorLogPath = join(errorDir, 'errors.json');
    this.loadErrors();
  }

  static getInstance(): ErrorTracker {
    if (!ErrorTracker.instance) {
      ErrorTracker.instance = new ErrorTracker();
    }
    return ErrorTracker.instance;
  }

  /**
   * Load errors from persistent storage
   */
  private loadErrors(): void {
    try {
      if (existsSync(this.errorLogPath)) {
        const content = readFileSync(this.errorLogPath, 'utf-8');
        const errorArray = JSON.parse(content) as ErrorRecord[];
        errorArray.forEach(error => {
          this.errors.set(error.id, error);
        });
      }
    } catch (error) {
      logger.warn('ErrorTracker', 'Failed to load error history', { error });
    }
  }

  /**
   * Save errors to persistent storage
   */
  private saveErrors(): void {
    try {
      const errorArray = Array.from(this.errors.values());
      writeFileSync(this.errorLogPath, JSON.stringify(errorArray, null, 2));
    } catch (error) {
      logger.warn('ErrorTracker', 'Failed to save error history', { error });
    }
  }

  /**
   * Generate error ID from message and category
   */
  private generateErrorId(category: string, message: string): string {
    const hash = Buffer.from(`${category}:${message}`).toString('base64').substring(0, 16);
    return hash;
  }

  /**
   * Track an error
   */
  trackError(category: string, message: string, error?: Error, context?: any): void {
    const id = this.generateErrorId(category, message);
    
    logger.error(category, message, error, context);

    const existingError = this.errors.get(id);
    
    if (existingError) {
      existingError.occurrences++;
      existingError.timestamp = new Date().toISOString();
      existingError.resolved = false;
      if (context) {
        existingError.context = context;
      }
    } else {
      const errorRecord: ErrorRecord = {
        id,
        timestamp: new Date().toISOString(),
        category,
        message,
        stack: error?.stack,
        context,
        resolved: false,
        occurrences: 1
      };
      this.errors.set(id, errorRecord);
    }

    this.saveErrors();
  }

  /**
   * Mark error as resolved
   */
  resolveError(errorId: string): boolean {
    const error = this.errors.get(errorId);
    if (error) {
      error.resolved = true;
      this.saveErrors();
      logger.info('ErrorTracker', `Error resolved: ${errorId}`);
      return true;
    }
    return false;
  }

  /**
   * Get all errors
   */
  getAllErrors(includeResolved: boolean = false): ErrorRecord[] {
    const errors = Array.from(this.errors.values());
    return includeResolved ? errors : errors.filter(e => !e.resolved);
  }

  /**
   * Get errors by category
   */
  getErrorsByCategory(category: string, includeResolved: boolean = false): ErrorRecord[] {
    return this.getAllErrors(includeResolved).filter(e => e.category === category);
  }

  /**
   * Get recent errors
   */
  getRecentErrors(count: number = 10, includeResolved: boolean = false): ErrorRecord[] {
    return this.getAllErrors(includeResolved)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, count);
  }

  /**
   * Get error statistics
   */
  getErrorStats(): ErrorStats {
    const allErrors = this.getAllErrors(true);
    const unresolvedErrors = allErrors.filter(e => !e.resolved);
    
    const errorsByCategory: Record<string, number> = {};
    const errorsByDay: Record<string, number> = {};
    const errorCounts: Map<string, number> = new Map();

    allErrors.forEach(error => {
      // By category
      errorsByCategory[error.category] = (errorsByCategory[error.category] || 0) + 1;

      // By day
      const day = error.timestamp.split('T')[0];
      errorsByDay[day] = (errorsByDay[day] || 0) + 1;

      // Count occurrences
      const current = errorCounts.get(error.message) || 0;
      errorCounts.set(error.message, current + error.occurrences);
    });

    // Get most common errors
    const mostCommonErrors = Array.from(errorCounts.entries())
      .map(([message, count]) => ({ message, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      totalErrors: allErrors.length,
      unresolvedErrors: unresolvedErrors.length,
      errorsByCategory,
      errorsByDay,
      mostCommonErrors
    };
  }

  /**
   * Clear resolved errors
   */
  clearResolvedErrors(): number {
    const beforeCount = this.errors.size;
    const unresolvedErrors = Array.from(this.errors.values()).filter(e => !e.resolved);
    
    this.errors.clear();
    unresolvedErrors.forEach(error => {
      this.errors.set(error.id, error);
    });
    
    this.saveErrors();
    const clearedCount = beforeCount - this.errors.size;
    
    logger.info('ErrorTracker', `Cleared ${clearedCount} resolved errors`);
    return clearedCount;
  }

  /**
   * Clear all errors
   */
  clearAllErrors(): void {
    this.errors.clear();
    this.saveErrors();
    logger.info('ErrorTracker', 'All errors cleared');
  }

  /**
   * Export errors to file
   */
  exportErrors(filePath: string): void {
    try {
      const errors = this.getAllErrors(true);
      writeFileSync(filePath, JSON.stringify(errors, null, 2));
      logger.info('ErrorTracker', `Errors exported to ${filePath}`);
    } catch (error) {
      logger.error('ErrorTracker', `Failed to export errors: ${error}`);
      throw error;
    }
  }
}

// Export singleton instance
export const errorTracker = ErrorTracker.getInstance();
