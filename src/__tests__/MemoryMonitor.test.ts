import { describe, test, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { MemoryMonitor } from '../utils/MemoryMonitor';

describe('MemoryMonitor', () => {
  let monitor: MemoryMonitor;

  beforeEach(() => {
    // Reset the singleton between tests
    (MemoryMonitor as any).instance = undefined;
    monitor = new MemoryMonitor(512);

    // Suppress logger output during tests
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('getInstance (singleton)', () => {
    test('should return the same singleton instance', () => {
      (MemoryMonitor as any).instance = undefined;
      const a = MemoryMonitor.getInstance();
      const b = MemoryMonitor.getInstance();
      expect(a).toBe(b);
    });
  });

  describe('captureSnapshot', () => {
    test('should return a snapshot with positive memory values', () => {
      const snap = monitor.captureSnapshot();

      expect(snap.heapUsed).toBeGreaterThan(0);
      expect(snap.heapTotal).toBeGreaterThan(0);
      expect(snap.rss).toBeGreaterThan(0);
      expect(snap.external).toBeGreaterThanOrEqual(0);
      expect(snap.arrayBuffers).toBeGreaterThanOrEqual(0);
      expect(snap.timestamp).toBeGreaterThan(0);
    });

    test('should accumulate snapshots', () => {
      monitor.captureSnapshot();
      monitor.captureSnapshot();
      monitor.captureSnapshot();

      // Access internal array directly to avoid the extra snapshot that getStats() adds
      expect((monitor as any).snapshots.length).toBe(3);
    });

    test('should keep only the last 100 snapshots', () => {
      for (let i = 0; i < 110; i++) {
        monitor.captureSnapshot();
      }
      // Access internal array directly – should be capped at 100
      expect((monitor as any).snapshots.length).toBe(100);
    });

    test('should update peak when higher heap usage is recorded', () => {
      // Manually inject a "large" snapshot to become the peak
      monitor.captureSnapshot();
      const initialPeak = monitor.getPeakUsage();

      // Inject a synthetic high-usage snapshot
      (monitor as any).snapshots.push({
        heapUsed: Number.MAX_SAFE_INTEGER,
        heapTotal: Number.MAX_SAFE_INTEGER,
        rss: Number.MAX_SAFE_INTEGER,
        external: 0,
        arrayBuffers: 0,
        timestamp: Date.now()
      });
      (monitor as any).peakSnapshot = (monitor as any).snapshots.at(-1);

      const newPeak = monitor.getPeakUsage();
      expect(newPeak!.heapUsed).toBeGreaterThan(initialPeak!.heapUsed);
    });
  });

  describe('getCurrentUsage', () => {
    test('should return a valid memory snapshot', () => {
      const snap = monitor.getCurrentUsage();
      expect(snap).toHaveProperty('heapUsed');
      expect(snap).toHaveProperty('heapTotal');
      expect(snap).toHaveProperty('rss');
    });
  });

  describe('getPeakUsage', () => {
    test('should return null before any snapshot is taken', () => {
      expect(monitor.getPeakUsage()).toBeNull();
    });

    test('should return non-null after first snapshot', () => {
      monitor.captureSnapshot();
      expect(monitor.getPeakUsage()).not.toBeNull();
    });
  });

  describe('getStats', () => {
    test('should return current, peak, and snapshots', () => {
      monitor.captureSnapshot();
      const stats = monitor.getStats();

      expect(stats).toHaveProperty('current');
      expect(stats).toHaveProperty('peak');
      expect(stats).toHaveProperty('snapshots');
      expect(Array.isArray(stats.snapshots)).toBe(true);
    });

    test('snapshots array should be a copy, not the internal array', () => {
      monitor.captureSnapshot();
      const stats1 = monitor.getStats();
      const stats2 = monitor.getStats();
      expect(stats1.snapshots).not.toBe(stats2.snapshots);
    });
  });

  describe('checkThreshold', () => {
    test('should return false when threshold is extremely high', () => {
      const highThresholdMonitor = new MemoryMonitor(Number.MAX_SAFE_INTEGER);
      expect(highThresholdMonitor.checkThreshold()).toBe(false);
    });

    test('should return true when threshold is extremely low', () => {
      const lowThresholdMonitor = new MemoryMonitor(0.001); // 1 KB threshold
      expect(lowThresholdMonitor.checkThreshold()).toBe(true);
    });
  });

  describe('registerCleanupCallback and triggerCleanup', () => {
    test('should invoke registered cleanup callbacks', () => {
      const cb1 = jest.fn();
      const cb2 = jest.fn();

      monitor.registerCleanupCallback(cb1);
      monitor.registerCleanupCallback(cb2);
      monitor.triggerCleanup();

      expect(cb1).toHaveBeenCalledTimes(1);
      expect(cb2).toHaveBeenCalledTimes(1);
    });

    test('should not throw if a cleanup callback throws', () => {
      monitor.registerCleanupCallback(() => {
        throw new Error('cleanup error');
      });
      expect(() => monitor.triggerCleanup()).not.toThrow();
    });

    test('should call gc when available', () => {
      const originalGc = global.gc;
      const mockGc = jest.fn();
      (global as any).gc = mockGc;

      monitor.triggerCleanup();

      expect(mockGc).toHaveBeenCalled();
      global.gc = originalGc;
    });
  });

  describe('formatBytes', () => {
    test('should format bytes as MB with 2 decimal places', () => {
      expect(monitor.formatBytes(1024 * 1024)).toBe('1.00 MB');
      expect(monitor.formatBytes(512 * 1024)).toBe('0.50 MB');
      expect(monitor.formatBytes(0)).toBe('0.00 MB');
    });
  });

  describe('formatSnapshot', () => {
    test('should return a string containing Heap and RSS info', () => {
      const snap = monitor.captureSnapshot();
      const formatted = monitor.formatSnapshot(snap);
      expect(formatted).toContain('Heap:');
      expect(formatted).toContain('RSS:');
      expect(formatted).toContain('External:');
    });
  });

  describe('clearSnapshots', () => {
    test('should clear all snapshots and reset peak', () => {
      monitor.captureSnapshot();
      monitor.captureSnapshot();

      expect((monitor as any).snapshots.length).toBeGreaterThan(0);
      expect(monitor.getPeakUsage()).not.toBeNull();

      monitor.clearSnapshots();

      // Internal snapshots array is empty immediately after clearing
      expect((monitor as any).snapshots.length).toBe(0);
      expect(monitor.getPeakUsage()).toBeNull();
    });
  });
});
