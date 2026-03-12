import { describe, test, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { LoggingHandler } from '../handlers/LoggingHandler';
import type { LogCommandOptions, ErrorCommandOptions, DebugCommandOptions } from '../handlers/LoggingHandler';

describe('LoggingHandler', () => {
  let handler: LoggingHandler;
  let consoleSpy: ReturnType<typeof jest.spyOn>;

  beforeEach(() => {
    consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
    handler = new LoggingHandler();
  });

  afterEach(() => {
    consoleSpy.mockRestore();
    jest.restoreAllMocks();
  });

  describe('handleLogs', () => {
    test('should clear logs when clear option is set', async () => {
      const logger = await import('../utils/Logger');
      const clearSpy = jest.spyOn(logger.logger, 'clearLogs').mockReturnValue(undefined);

      const options: LogCommandOptions = { clear: true };
      await handler.handleLogs(options);

      expect(clearSpy).toHaveBeenCalled();
      const output = consoleSpy.mock.calls.map(c => c[0] as string).join(' ');
      expect(output).toContain('cleared');
    });

    test('should show log statistics when stats option is set', async () => {
      const loggerModule = await import('../utils/Logger');
      jest.spyOn(loggerModule.logger, 'getLogStats').mockReturnValue({
        totalLogs: 10,
        fileSize: 1024,
        byLevel: { info: 8, error: 2 }
      } as any);
      jest.spyOn(loggerModule.logger, 'getLogFilePath').mockReturnValue('/path/to/log');

      const options: LogCommandOptions = { stats: true };
      await handler.handleLogs(options);

      const output = consoleSpy.mock.calls.map(c => c[0] as string).join(' ');
      expect(output).toContain('10');
    });

    test('should set log level when level option is set', async () => {
      const loggerModule = await import('../utils/Logger');
      const setLevelSpy = jest.spyOn(loggerModule.logger, 'setLogLevel').mockReturnValue(undefined);

      const options: LogCommandOptions = { level: 'debug' };
      await handler.handleLogs(options);

      expect(setLevelSpy).toHaveBeenCalledWith('debug');
      const output = consoleSpy.mock.calls.map(c => c[0] as string).join(' ');
      expect(output).toContain('debug');
    });

    test('should reject invalid log level', async () => {
      const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      const options: LogCommandOptions = { level: 'invalid' };
      await handler.handleLogs(options);

      expect(errorSpy).toHaveBeenCalled();
    });

    test('should display recent logs by default', async () => {
      const loggerModule = await import('../utils/Logger');
      jest.spyOn(loggerModule.logger, 'getRecentLogs').mockReturnValue([
        { level: 'info', category: 'Test', message: 'test log', timestamp: '2024-01-01', metadata: {} }
      ] as any);

      const options: LogCommandOptions = {};
      await handler.handleLogs(options);

      const output = consoleSpy.mock.calls.map(c => c[0] as string).join(' ');
      expect(output).toContain('test log');
    });

    test('should show no logs message when empty', async () => {
      const loggerModule = await import('../utils/Logger');
      jest.spyOn(loggerModule.logger, 'getRecentLogs').mockReturnValue([]);

      const options: LogCommandOptions = {};
      await handler.handleLogs(options);

      const output = consoleSpy.mock.calls.map(c => c[0] as string).join(' ');
      expect(output).toContain('No logs');
    });
  });

  describe('handleErrors', () => {
    test('should show error statistics', async () => {
      const errorTrackerModule = await import('../utils/ErrorTracker');
      jest.spyOn(errorTrackerModule.errorTracker, 'getErrorStats').mockReturnValue({
        totalErrors: 5,
        unresolvedErrors: 3,
        errorsByCategory: { git: 2, ai: 1 },
        mostCommonErrors: [{ message: 'common error', count: 3 }]
      } as any);

      const options: ErrorCommandOptions = { stats: true };
      await handler.handleErrors(options);

      const output = consoleSpy.mock.calls.map(c => c[0] as string).join(' ');
      expect(output).toContain('5');
    });

    test('should clear all errors', async () => {
      const errorTrackerModule = await import('../utils/ErrorTracker');
      const clearSpy = jest.spyOn(errorTrackerModule.errorTracker, 'clearAllErrors').mockReturnValue(undefined);

      const options: ErrorCommandOptions = { clear: true };
      await handler.handleErrors(options);

      expect(clearSpy).toHaveBeenCalled();
      const output = consoleSpy.mock.calls.map(c => c[0] as string).join(' ');
      expect(output).toContain('cleared');
    });

    test('should clear resolved errors when resolved option is set', async () => {
      const errorTrackerModule = await import('../utils/ErrorTracker');
      const clearSpy = jest.spyOn(errorTrackerModule.errorTracker, 'clearResolvedErrors').mockReturnValue(5);

      const options: ErrorCommandOptions = { clear: true, resolved: true };
      await handler.handleErrors(options);

      expect(clearSpy).toHaveBeenCalled();
    });

    test('should list recent errors', async () => {
      const errorTrackerModule = await import('../utils/ErrorTracker');
      jest.spyOn(errorTrackerModule.errorTracker, 'getRecentErrors').mockReturnValue([
        {
          id: '1',
          timestamp: new Date().toISOString(),
          category: 'git',
          message: 'git error occurred',
          resolved: false,
          occurrences: 1
        }
      ] as any);

      const options: ErrorCommandOptions = {};
      await handler.handleErrors(options);

      const output = consoleSpy.mock.calls.map(c => c[0] as string).join(' ');
      expect(output).toContain('git error occurred');
    });

    test('should show no errors message when empty', async () => {
      const errorTrackerModule = await import('../utils/ErrorTracker');
      jest.spyOn(errorTrackerModule.errorTracker, 'getRecentErrors').mockReturnValue([]);

      const options: ErrorCommandOptions = {};
      await handler.handleErrors(options);

      const output = consoleSpy.mock.calls.map(c => c[0] as string).join(' ');
      expect(output).toContain('No errors');
    });

    test('should filter by category', async () => {
      const errorTrackerModule = await import('../utils/ErrorTracker');
      const getSpy = jest.spyOn(errorTrackerModule.errorTracker, 'getErrorsByCategory').mockReturnValue([]);

      const options: ErrorCommandOptions = { category: 'git' };
      await handler.handleErrors(options);

      expect(getSpy).toHaveBeenCalledWith('git', false);
    });
  });

  describe('handleDebug', () => {
    test('should enable debug mode', async () => {
      const loggerModule = await import('../utils/Logger');
      const setLevelSpy = jest.spyOn(loggerModule.logger, 'setLogLevel').mockReturnValue(undefined);

      const options: DebugCommandOptions = { enable: true };
      await handler.handleDebug(options);

      expect(setLevelSpy).toHaveBeenCalledWith('debug');
      const output = consoleSpy.mock.calls.map(c => c[0] as string).join(' ');
      expect(output).toContain('enabled');
    });

    test('should disable debug mode', async () => {
      const loggerModule = await import('../utils/Logger');
      const setLevelSpy = jest.spyOn(loggerModule.logger, 'setLogLevel').mockReturnValue(undefined);

      const options: DebugCommandOptions = { disable: true };
      await handler.handleDebug(options);

      expect(setLevelSpy).toHaveBeenCalledWith('info');
      const output = consoleSpy.mock.calls.map(c => c[0] as string).join(' ');
      expect(output).toContain('disabled');
    });

    test('should show performance metrics', async () => {
      const perfMonitor = (handler as any).performanceMonitor;
      jest.spyOn(perfMonitor, 'getMetrics').mockReturnValue([
        { operation: 'test-op', duration: 100, timestamp: Date.now(), success: true }
      ]);
      jest.spyOn(perfMonitor, 'getAverageTime').mockReturnValue(100);
      jest.spyOn(perfMonitor, 'getSuccessRate').mockReturnValue(100);

      const options: DebugCommandOptions = { performance: true };
      await handler.handleDebug(options);

      const output = consoleSpy.mock.calls.map(c => c[0] as string).join(' ');
      expect(output).toContain('test-op');
    });

    test('should show no metrics message when empty', async () => {
      const perfMonitor = (handler as any).performanceMonitor;
      jest.spyOn(perfMonitor, 'getMetrics').mockReturnValue([]);

      const options: DebugCommandOptions = { performance: true };
      await handler.handleDebug(options);

      const output = consoleSpy.mock.calls.map(c => c[0] as string).join(' ');
      expect(output).toContain('No performance metrics');
    });

    test('should show debug status by default', async () => {
      const loggerModule = await import('../utils/Logger');
      jest.spyOn(loggerModule.logger, 'getLogLevel').mockReturnValue('info');
      jest.spyOn(loggerModule.logger, 'getLogFilePath').mockReturnValue('/path/log');
      jest.spyOn(loggerModule.logger, 'getLogDir').mockReturnValue('/path/');
      jest.spyOn(loggerModule.logger, 'getLogStats').mockReturnValue({
        totalLogs: 5,
        fileSize: 512,
        byLevel: {}
      } as any);

      const options: DebugCommandOptions = {};
      await handler.handleDebug(options);

      const output = consoleSpy.mock.calls.map(c => c[0] as string).join(' ');
      expect(output).toContain('Debug Status');
    });
  });
});
