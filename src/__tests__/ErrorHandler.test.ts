import { describe, test, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { GitGeniusError, ErrorHandler } from '../utils/ErrorHandler';

// Mock process.exit to prevent test process from exiting
const mockExit = jest.spyOn(process, 'exit').mockImplementation((() => {}) as any);
const mockConsoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
const mockConsoleLog = jest.spyOn(console, 'log').mockImplementation(() => {});

describe('GitGeniusError', () => {
  test('should create error with all properties', () => {
    const error = new GitGeniusError('test message', 'TEST_CODE', 'git', ['suggestion 1']);
    expect(error.message).toBe('test message');
    expect(error.code).toBe('TEST_CODE');
    expect(error.category).toBe('git');
    expect(error.suggestions).toEqual(['suggestion 1']);
    expect(error.name).toBe('GitGeniusError');
  });

  test('should create error with default empty suggestions', () => {
    const error = new GitGeniusError('message', 'CODE', 'ai');
    expect(error.suggestions).toEqual([]);
  });

  test('should be instance of Error', () => {
    const error = new GitGeniusError('msg', 'CODE', 'config');
    expect(error instanceof Error).toBe(true);
    expect(error instanceof GitGeniusError).toBe(true);
  });

  test('should support all category types', () => {
    const categories: Array<'git' | 'ai' | 'config' | 'network' | 'user'> = [
      'git', 'ai', 'config', 'network', 'user'
    ];
    categories.forEach(cat => {
      const err = new GitGeniusError('msg', 'CODE', cat);
      expect(err.category).toBe(cat);
    });
  });
});

describe('ErrorHandler static factory methods', () => {
  test('gitError should create GitGeniusError with git category', () => {
    const error = ErrorHandler.gitError('git failure', ['check status']);
    expect(error instanceof GitGeniusError).toBe(true);
    expect(error.category).toBe('git');
    expect(error.code).toBe('GIT_ERROR');
    expect(error.message).toBe('git failure');
    expect(error.suggestions).toEqual(['check status']);
  });

  test('aiError should create GitGeniusError with ai category', () => {
    const error = ErrorHandler.aiError('ai failure');
    expect(error instanceof GitGeniusError).toBe(true);
    expect(error.category).toBe('ai');
    expect(error.code).toBe('AI_ERROR');
  });

  test('configError should create GitGeniusError with config category', () => {
    const error = ErrorHandler.configError('config failure');
    expect(error instanceof GitGeniusError).toBe(true);
    expect(error.category).toBe('config');
    expect(error.code).toBe('CONFIG_ERROR');
  });

  test('networkError should create GitGeniusError with network category', () => {
    const error = ErrorHandler.networkError('network failure');
    expect(error instanceof GitGeniusError).toBe(true);
    expect(error.category).toBe('network');
    expect(error.code).toBe('NETWORK_ERROR');
  });

  test('userError should create GitGeniusError with user category', () => {
    const error = ErrorHandler.userError('user failure');
    expect(error instanceof GitGeniusError).toBe(true);
    expect(error.category).toBe('user');
    expect(error.code).toBe('USER_ERROR');
  });

  test('factory methods should have default empty suggestions', () => {
    expect(ErrorHandler.gitError('msg').suggestions).toEqual([]);
    expect(ErrorHandler.aiError('msg').suggestions).toEqual([]);
    expect(ErrorHandler.configError('msg').suggestions).toEqual([]);
    expect(ErrorHandler.networkError('msg').suggestions).toEqual([]);
    expect(ErrorHandler.userError('msg').suggestions).toEqual([]);
  });

  test('factory methods should accept suggestions array', () => {
    const suggestions = ['try this', 'try that'];
    expect(ErrorHandler.gitError('msg', suggestions).suggestions).toEqual(suggestions);
    expect(ErrorHandler.aiError('msg', suggestions).suggestions).toEqual(suggestions);
    expect(ErrorHandler.configError('msg', suggestions).suggestions).toEqual(suggestions);
    expect(ErrorHandler.networkError('msg', suggestions).suggestions).toEqual(suggestions);
    expect(ErrorHandler.userError('msg', suggestions).suggestions).toEqual(suggestions);
  });
});

describe('ErrorHandler.handle', () => {
  beforeEach(() => {
    mockExit.mockClear();
    mockConsoleError.mockClear();
    mockConsoleLog.mockClear();
  });

  afterEach(() => {
    // Ensure mocks are still in place
  });

  test('should handle GitGeniusError and call process.exit', () => {
    const error = ErrorHandler.gitError('git problem', ['do this']);
    ErrorHandler.handle(error);
    expect(mockExit).toHaveBeenCalledWith(1);
    expect(mockConsoleError).toHaveBeenCalled();
  });

  test('should handle GitGeniusError with suggestions', () => {
    const error = ErrorHandler.aiError('api problem', ['check key', 'retry']);
    ErrorHandler.handle(error);
    expect(mockExit).toHaveBeenCalledWith(1);
    // Should log suggestions
    expect(mockConsoleLog).toHaveBeenCalled();
  });

  test('should handle generic Error and call process.exit', () => {
    const error = new Error('generic error');
    ErrorHandler.handle(error);
    expect(mockExit).toHaveBeenCalledWith(1);
    expect(mockConsoleError).toHaveBeenCalled();
  });

  test('should handle unknown error and call process.exit', () => {
    ErrorHandler.handle('not an Error object');
    expect(mockExit).toHaveBeenCalledWith(1);
    expect(mockConsoleError).toHaveBeenCalled();
  });

  test('should handle null error', () => {
    ErrorHandler.handle(null);
    expect(mockExit).toHaveBeenCalledWith(1);
  });

  test('should print category-specific common solutions for git errors', () => {
    const error = ErrorHandler.gitError('git issue');
    ErrorHandler.handle(error);
    expect(mockConsoleLog).toHaveBeenCalled();
  });

  test('should print category-specific common solutions for ai errors', () => {
    const error = ErrorHandler.aiError('ai issue');
    ErrorHandler.handle(error);
    expect(mockConsoleLog).toHaveBeenCalled();
  });

  test('should print category-specific common solutions for config errors', () => {
    const error = ErrorHandler.configError('config issue');
    ErrorHandler.handle(error);
    expect(mockConsoleLog).toHaveBeenCalled();
  });

  test('should print category-specific common solutions for network errors', () => {
    const error = ErrorHandler.networkError('network issue');
    ErrorHandler.handle(error);
    expect(mockConsoleLog).toHaveBeenCalled();
  });

  test('should print category-specific common solutions for user errors', () => {
    const error = ErrorHandler.userError('user issue');
    ErrorHandler.handle(error);
    expect(mockConsoleLog).toHaveBeenCalled();
  });
});
