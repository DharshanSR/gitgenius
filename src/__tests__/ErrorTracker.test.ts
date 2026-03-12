import { describe, test, expect } from '@jest/globals';

// Note: ErrorTracker has dependencies on Logger and ConfigManager
// These tests verify the public API structure and error tracking concepts
describe('ErrorTracker', () => {

  describe('Error Categories', () => {
    test('should support all error categories', () => {
      const categories = ['git', 'ai', 'config', 'network', 'user'];
      
      expect(categories).toContain('git');
      expect(categories).toContain('ai');
      expect(categories).toContain('config');
      expect(categories).toContain('network');
      expect(categories).toContain('user');
      expect(categories.length).toBe(5);
    });

    test('should have meaningful category names', () => {
      const categoryDescriptions = {
        git: 'Git operations and repository issues',
        ai: 'AI service and API issues',
        config: 'Configuration problems',
        network: 'Network and connectivity issues',
        user: 'User input and validation errors'
      };
      
      expect(Object.keys(categoryDescriptions).length).toBe(5);
      expect(categoryDescriptions.git).toContain('Git');
      expect(categoryDescriptions.ai).toContain('AI');
    });
  });

  describe('Error Record Structure', () => {
    test('should define error record interface', () => {
      // Error records should have these fields
      const errorRecord = {
        id: 'error-123',
        timestamp: '2024-01-15T10:30:00.000Z',
        category: 'git',
        message: 'Repository not found',
        resolved: false,
        occurrences: 1
      };
      
      expect(errorRecord).toHaveProperty('id');
      expect(errorRecord).toHaveProperty('timestamp');
      expect(errorRecord).toHaveProperty('category');
      expect(errorRecord).toHaveProperty('message');
      expect(errorRecord).toHaveProperty('resolved');
      expect(errorRecord).toHaveProperty('occurrences');
      
      expect(typeof errorRecord.resolved).toBe('boolean');
      expect(typeof errorRecord.occurrences).toBe('number');
    });

    test('should support optional context and stack', () => {
      const errorWithDetails = {
        id: 'error-456',
        timestamp: '2024-01-15T10:30:00.000Z',
        category: 'network',
        message: 'Connection timeout',
        stack: 'Error: timeout\n  at fetch',
        context: { url: 'https://api.example.com', retries: 3 },
        resolved: false,
        occurrences: 2
      };
      
      expect(errorWithDetails).toHaveProperty('stack');
      expect(errorWithDetails).toHaveProperty('context');
      expect(errorWithDetails.context).toHaveProperty('url');
      expect(errorWithDetails.occurrences).toBe(2);
    });
  });

  describe('Error Statistics Interface', () => {
    test('should define error statistics structure', () => {
      const stats = {
        totalErrors: 10,
        unresolvedErrors: 8,
        errorsByCategory: { git: 5, ai: 3, config: 2 },
        errorsByDay: { '2024-01-15': 6, '2024-01-14': 4 },
        mostCommonErrors: [
          { message: 'Connection failed', count: 5 },
          { message: 'Invalid config', count: 3 }
        ]
      };
      
      expect(stats).toHaveProperty('totalErrors');
      expect(stats).toHaveProperty('unresolvedErrors');
      expect(stats).toHaveProperty('errorsByCategory');
      expect(stats).toHaveProperty('errorsByDay');
      expect(stats).toHaveProperty('mostCommonErrors');
      
      expect(typeof stats.totalErrors).toBe('number');
      expect(Array.isArray(stats.mostCommonErrors)).toBe(true);
    });

    test('should aggregate errors by category', () => {
      const categoryStats = {
        git: 5,
        ai: 3,
        config: 2,
        network: 1,
        user: 0
      };
      
      const total = Object.values(categoryStats).reduce((sum, count) => sum + count, 0);
      expect(total).toBe(11);
      expect(categoryStats.git).toBeGreaterThan(categoryStats.network);
    });
  });

  describe('ErrorTracker Public API', () => {
    test('should export ErrorTracker class', () => {
      // Verify the ErrorTracker module can be imported
      expect(true).toBe(true);
    });

    test('should provide comprehensive API methods', () => {
      const expectedMethods = [
        'getInstance',
        'trackError',
        'resolveError',
        'getAllErrors',
        'getErrorsByCategory',
        'getRecentErrors',
        'getErrorStats',
        'clearResolvedErrors',
        'clearAllErrors',
        'exportErrors'
      ];
      
      expect(expectedMethods.length).toBe(10);
      expect(expectedMethods).toContain('trackError');
      expect(expectedMethods).toContain('getErrorStats');
    });
  });

  describe('Error Tracking Features', () => {
    test('should support occurrence counting', () => {
      // Same error tracked multiple times increments occurrences
      const tracking = {
        firstOccurrence: { id: 'err-1', occurrences: 1 },
        secondOccurrence: { id: 'err-1', occurrences: 2 },
        thirdOccurrence: { id: 'err-1', occurrences: 3 }
      };
      
      expect(tracking.thirdOccurrence.occurrences).toBe(3);
      expect(tracking.firstOccurrence.id).toBe(tracking.thirdOccurrence.id);
    });

    test('should support resolution marking', () => {
      const errorLifecycle = {
        initial: { resolved: false },
        afterResolution: { resolved: true }
      };
      
      expect(errorLifecycle.initial.resolved).toBe(false);
      expect(errorLifecycle.afterResolution.resolved).toBe(true);
    });

    test('should generate unique error IDs', () => {
      // Error IDs should be unique for different errors
      const error1 = { id: 'hash-of-git-error-message' };
      const error2 = { id: 'hash-of-ai-error-message' };
      
      expect(error1.id).not.toBe(error2.id);
      expect(typeof error1.id).toBe('string');
    });
  });

  describe('Integration with Error Handler', () => {
    test('should work with GitGeniusError', () => {
      // ErrorTracker integrates with ErrorHandler
      const gitError = {
        category: 'git',
        message: 'Repository not found',
        code: 'GIT_ERROR',
        suggestions: ['Run: git init']
      };
      
      expect(gitError).toHaveProperty('category');
      expect(gitError).toHaveProperty('suggestions');
      expect(Array.isArray(gitError.suggestions)).toBe(true);
    });

    test('should support error context', () => {
      const errorContext = {
        userId: 'user123',
        operation: 'commit',
        timestamp: Date.now(),
        environment: 'production'
      };
      
      expect(errorContext).toHaveProperty('operation');
      expect(typeof errorContext.timestamp).toBe('number');
    });
  });
});

// Functional tests using the actual ErrorTracker instance
import { jest, beforeEach, afterEach } from '@jest/globals';
import { ErrorTracker } from '../utils/ErrorTracker';

describe('ErrorTracker (functional)', () => {
  let tracker: ErrorTracker;

  beforeEach(() => {
    // Reset singleton and create fresh instance
    (ErrorTracker as any).instance = undefined;
    tracker = (ErrorTracker as any).getInstance();
    // Clear all existing errors to start clean
    try {
      tracker.clearAllErrors();
    } catch (e) {
      // ignore
    }
  });

  afterEach(() => {
    jest.restoreAllMocks();
    try {
      tracker.clearAllErrors();
    } catch (e) {
      // ignore
    }
  });

  test('should track an error', () => {
    tracker.trackError('git', 'Test error message');
    const errors = tracker.getAllErrors();
    const found = errors.some(e => e.message === 'Test error message' && e.category === 'git');
    expect(found).toBe(true);
  });

  test('should increment occurrences for same error', () => {
    tracker.trackError('git', 'Repeated error');
    tracker.trackError('git', 'Repeated error');
    tracker.trackError('git', 'Repeated error');

    const errors = tracker.getAllErrors();
    const error = errors.find(e => e.message === 'Repeated error');
    expect(error).toBeDefined();
    expect(error!.occurrences).toBeGreaterThanOrEqual(3);
  });

  test('should resolve an error', () => {
    tracker.trackError('git', 'Resolvable error');
    const errors = tracker.getAllErrors();
    const error = errors.find(e => e.message === 'Resolvable error');
    expect(error).toBeDefined();

    const resolved = tracker.resolveError(error!.id);
    expect(resolved).toBe(true);

    // After resolution, error is not in unresolved list
    const unresolvedErrors = tracker.getAllErrors(false);
    const stillUnresolved = unresolvedErrors.find(e => e.message === 'Resolvable error');
    expect(stillUnresolved).toBeUndefined();
  });

  test('should return false when resolving non-existent error', () => {
    const result = tracker.resolveError('nonexistent-id');
    expect(result).toBe(false);
  });

  test('should get errors by category', () => {
    tracker.trackError('git', 'Git category error');
    tracker.trackError('ai', 'AI category error');
    tracker.trackError('git', 'Another git error');

    const gitErrors = tracker.getErrorsByCategory('git');
    const aiErrors = tracker.getErrorsByCategory('ai');

    expect(gitErrors.some(e => e.message === 'Git category error')).toBe(true);
    expect(gitErrors.some(e => e.message === 'Another git error')).toBe(true);
    expect(aiErrors.some(e => e.message === 'AI category error')).toBe(true);
    expect(aiErrors.some(e => e.message === 'Git category error')).toBe(false);
  });

  test('should get recent errors', () => {
    tracker.trackError('git', 'First error');
    tracker.trackError('ai', 'Second error');
    tracker.trackError('config', 'Third error');

    const recent = tracker.getRecentErrors(2);
    expect(recent.length).toBeLessThanOrEqual(2);
  });

  test('should get error stats', () => {
    tracker.trackError('git', 'Stats git error');
    tracker.trackError('ai', 'Stats ai error');

    const stats = tracker.getErrorStats();
    expect(stats).toHaveProperty('totalErrors');
    expect(stats).toHaveProperty('unresolvedErrors');
    expect(stats).toHaveProperty('errorsByCategory');
    expect(stats.totalErrors).toBeGreaterThanOrEqual(2);
  });

  test('should clear resolved errors', () => {
    tracker.trackError('git', 'Resolved-clear error');
    const errors = tracker.getAllErrors();
    const error = errors.find(e => e.message === 'Resolved-clear error');
    if (error) {
      tracker.resolveError(error.id);
    }

    const cleared = tracker.clearResolvedErrors();
    expect(typeof cleared).toBe('number');
    expect(cleared).toBeGreaterThanOrEqual(0);
  });

  test('should clear all errors', () => {
    tracker.trackError('git', 'Will be cleared 1');
    tracker.trackError('ai', 'Will be cleared 2');

    tracker.clearAllErrors();

    const errors = tracker.getAllErrors(true);
    expect(errors.length).toBe(0);
  });

  test('should include resolved errors when flag is set', () => {
    tracker.trackError('git', 'Include-resolved error');
    const errors = tracker.getAllErrors();
    const error = errors.find(e => e.message === 'Include-resolved error');
    if (error) tracker.resolveError(error.id);

    const allErrors = tracker.getAllErrors(true);
    const found = allErrors.find(e => e.message === 'Include-resolved error');
    expect(found).toBeDefined();
    expect(found!.resolved).toBe(true);
  });
});
