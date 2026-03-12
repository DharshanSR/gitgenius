import { describe, test, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { PerformanceMonitor } from '../utils/PerformanceMonitor';

describe('PerformanceMonitor', () => {
  let monitor: PerformanceMonitor;

  beforeEach(() => {
    // Reset the singleton between tests
    (PerformanceMonitor as any).instance = undefined;
    monitor = new PerformanceMonitor();
    // Mock configManager methods
    const configManager = (monitor as any).configManager;
    jest.spyOn(configManager, 'setConfigValue').mockReturnValue(undefined);
    jest.spyOn(configManager, 'getConfig').mockReturnValue([]);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('getInstance (singleton)', () => {
    test('should return singleton instance', () => {
      (PerformanceMonitor as any).instance = undefined;
      const instance1 = PerformanceMonitor.getInstance();
      const instance2 = PerformanceMonitor.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('startTimer and endTimer', () => {
    test('should start and end a timer', async () => {
      monitor.startTimer('test-operation');
      // Small delay to ensure duration > 0
      await new Promise(resolve => setTimeout(resolve, 10));
      monitor.endTimer('test-operation', true);

      const metrics = monitor.getMetrics();
      expect(metrics.length).toBe(1);
      expect(metrics[0].operation).toBe('test-operation');
      expect(metrics[0].success).toBe(true);
      expect(metrics[0].duration).toBeGreaterThan(0);
    });

    test('should record failed operation', async () => {
      monitor.startTimer('failing-operation');
      await new Promise(resolve => setTimeout(resolve, 5));
      monitor.endTimer('failing-operation', false);

      const metrics = monitor.getMetrics();
      expect(metrics[0].success).toBe(false);
    });

    test('should not record metric if timer not started', () => {
      monitor.endTimer('non-started-operation');
      expect(monitor.getMetrics().length).toBe(0);
    });

    test('should remove timer after ending', () => {
      monitor.startTimer('op1');
      monitor.endTimer('op1');
      // Ending again should not add a metric
      const metricsCount = monitor.getMetrics().length;
      monitor.endTimer('op1');
      expect(monitor.getMetrics().length).toBe(metricsCount);
    });

    test('should default success to true', async () => {
      monitor.startTimer('default-success');
      await new Promise(resolve => setTimeout(resolve, 5));
      monitor.endTimer('default-success');

      const metrics = monitor.getMetrics();
      expect(metrics[0].success).toBe(true);
    });
  });

  describe('getAverageTime', () => {
    test('should return 0 when no metrics', () => {
      expect(monitor.getAverageTime('nonexistent')).toBe(0);
    });

    test('should calculate average duration for successful operations', async () => {
      monitor.startTimer('avg-op');
      await new Promise(resolve => setTimeout(resolve, 10));
      monitor.endTimer('avg-op', true);

      monitor.startTimer('avg-op');
      await new Promise(resolve => setTimeout(resolve, 10));
      monitor.endTimer('avg-op', true);

      const avg = monitor.getAverageTime('avg-op');
      expect(avg).toBeGreaterThan(0);
    });

    test('should exclude failed operations from average', () => {
      // Manually insert metrics for precise control
      (monitor as any).metrics = [
        { operation: 'test-avg', duration: 100, timestamp: Date.now(), success: true },
        { operation: 'test-avg', duration: 200, timestamp: Date.now(), success: true },
        { operation: 'test-avg', duration: 1000, timestamp: Date.now(), success: false }
      ];

      const avg = monitor.getAverageTime('test-avg');
      expect(avg).toBe(150); // Average of 100 and 200 (failed excluded)
    });
  });

  describe('getSuccessRate', () => {
    test('should return 0 when no metrics for operation', () => {
      expect(monitor.getSuccessRate('nonexistent')).toBe(0);
    });

    test('should calculate 100% success rate', () => {
      (monitor as any).metrics = [
        { operation: 'perfect-op', duration: 100, timestamp: Date.now(), success: true },
        { operation: 'perfect-op', duration: 150, timestamp: Date.now(), success: true }
      ];

      expect(monitor.getSuccessRate('perfect-op')).toBe(100);
    });

    test('should calculate partial success rate', () => {
      (monitor as any).metrics = [
        { operation: 'mixed-op', duration: 100, timestamp: Date.now(), success: true },
        { operation: 'mixed-op', duration: 100, timestamp: Date.now(), success: false },
        { operation: 'mixed-op', duration: 100, timestamp: Date.now(), success: true },
        { operation: 'mixed-op', duration: 100, timestamp: Date.now(), success: false }
      ];

      expect(monitor.getSuccessRate('mixed-op')).toBe(50);
    });

    test('should calculate 0% success rate', () => {
      (monitor as any).metrics = [
        { operation: 'failing-op', duration: 100, timestamp: Date.now(), success: false }
      ];

      expect(monitor.getSuccessRate('failing-op')).toBe(0);
    });
  });

  describe('getMetrics', () => {
    test('should return empty array initially', () => {
      expect(monitor.getMetrics()).toEqual([]);
    });

    test('should return a copy of metrics', async () => {
      monitor.startTimer('op');
      await new Promise(resolve => setTimeout(resolve, 5));
      monitor.endTimer('op');

      const metrics1 = monitor.getMetrics();
      const metrics2 = monitor.getMetrics();
      expect(metrics1).not.toBe(metrics2); // Different references
      expect(metrics1).toEqual(metrics2); // Same content
    });
  });

  describe('clearMetrics', () => {
    test('should clear all metrics', async () => {
      monitor.startTimer('op1');
      await new Promise(resolve => setTimeout(resolve, 5));
      monitor.endTimer('op1');

      expect(monitor.getMetrics().length).toBe(1);

      monitor.clearMetrics();
      expect(monitor.getMetrics().length).toBe(0);
    });

    test('should persist cleared state to config', () => {
      const configManager = (monitor as any).configManager;
      const setSpy = jest.spyOn(configManager, 'setConfigValue').mockReturnValue(undefined);

      monitor.clearMetrics();

      expect(setSpy).toHaveBeenCalledWith('performanceMetrics', []);
    });
  });

  describe('metric limits', () => {
    test('should keep only last 100 metrics', async () => {
      // Manually set more than 100 metrics
      const metrics = Array.from({ length: 105 }, (_, i) => ({
        operation: `op-${i}`,
        duration: 100,
        timestamp: Date.now(),
        success: true
      }));
      (monitor as any).metrics = metrics;

      // Add one more to trigger the limit
      monitor.startTimer('trigger-op');
      await new Promise(resolve => setTimeout(resolve, 5));
      monitor.endTimer('trigger-op');

      expect(monitor.getMetrics().length).toBeLessThanOrEqual(101);
    });
  });
});
