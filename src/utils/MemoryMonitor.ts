import { logger } from './Logger.js';

export interface MemorySnapshot {
  heapUsed: number;
  heapTotal: number;
  rss: number;
  external: number;
  arrayBuffers: number;
  timestamp: number;
}

export interface MemoryStats {
  current: MemorySnapshot;
  peak: MemorySnapshot;
  snapshots: MemorySnapshot[];
}

export class MemoryMonitor {
  private static instance: MemoryMonitor;
  private snapshots: MemorySnapshot[] = [];
  private peakSnapshot: MemorySnapshot | null = null;
  private readonly maxSnapshots = 100;
  private readonly warningThresholdMB: number;
  private cleanupCallbacks: Array<() => void> = [];

  constructor(warningThresholdMB: number = 512) {
    this.warningThresholdMB = warningThresholdMB;
  }

  static getInstance(): MemoryMonitor {
    if (!MemoryMonitor.instance) {
      MemoryMonitor.instance = new MemoryMonitor();
    }
    return MemoryMonitor.instance;
  }

  /**
   * Capture a snapshot of the current memory usage.
   */
  captureSnapshot(): MemorySnapshot {
    const usage = process.memoryUsage();
    const snapshot: MemorySnapshot = {
      heapUsed: usage.heapUsed,
      heapTotal: usage.heapTotal,
      rss: usage.rss,
      external: usage.external,
      arrayBuffers: usage.arrayBuffers,
      timestamp: Date.now()
    };

    this.snapshots.push(snapshot);

    // Keep only the most recent snapshots
    if (this.snapshots.length > this.maxSnapshots) {
      this.snapshots = this.snapshots.slice(-this.maxSnapshots);
    }

    // Track peak heap usage
    if (!this.peakSnapshot || snapshot.heapUsed > this.peakSnapshot.heapUsed) {
      this.peakSnapshot = { ...snapshot };
    }

    // Warn when heap usage exceeds the configured threshold
    const heapUsedMB = snapshot.heapUsed / (1024 * 1024);
    if (heapUsedMB > this.warningThresholdMB) {
      logger.warn(
        'Memory',
        `High memory usage detected: ${heapUsedMB.toFixed(2)} MB (threshold: ${this.warningThresholdMB} MB)`
      );
    }

    return snapshot;
  }

  /**
   * Return the current memory usage snapshot.
   */
  getCurrentUsage(): MemorySnapshot {
    return this.captureSnapshot();
  }

  /**
   * Return the peak recorded heap usage snapshot.
   */
  getPeakUsage(): MemorySnapshot | null {
    return this.peakSnapshot;
  }

  /**
   * Return comprehensive memory statistics including current, peak, and history.
   */
  getStats(): MemoryStats {
    const current = this.captureSnapshot();
    return {
      current,
      peak: this.peakSnapshot || current,
      snapshots: [...this.snapshots]
    };
  }

  /**
   * Check whether heap usage currently exceeds the warning threshold.
   */
  checkThreshold(): boolean {
    const usage = process.memoryUsage();
    const heapUsedMB = usage.heapUsed / (1024 * 1024);
    return heapUsedMB > this.warningThresholdMB;
  }

  /**
   * Register a callback to be invoked when cleanup is triggered.
   */
  registerCleanupCallback(callback: () => void): void {
    this.cleanupCallbacks.push(callback);
  }

  /**
   * Invoke all registered cleanup callbacks to free resources.
   * Optionally requests a garbage collection pass when available.
   */
  triggerCleanup(): void {
    this.cleanupCallbacks.forEach(cb => {
      try {
        cb();
      } catch {
        // Cleanup callbacks must not throw – silently continue
      }
    });

    // Request explicit GC when running under --expose-gc (e.g. in tests)
    if (typeof global.gc === 'function') {
      global.gc();
    }
  }

  /**
   * Format a byte value as a human-readable megabyte string.
   */
  formatBytes(bytes: number): string {
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  }

  /**
   * Format a snapshot as a concise human-readable string.
   */
  formatSnapshot(snapshot: MemorySnapshot): string {
    return (
      `Heap: ${this.formatBytes(snapshot.heapUsed)} / ${this.formatBytes(snapshot.heapTotal)}, ` +
      `RSS: ${this.formatBytes(snapshot.rss)}, ` +
      `External: ${this.formatBytes(snapshot.external)}`
    );
  }

  /**
   * Clear all captured snapshots and reset peak tracking.
   */
  clearSnapshots(): void {
    this.snapshots = [];
    this.peakSnapshot = null;
  }
}

// Export a singleton instance for convenience
export const memoryMonitor = MemoryMonitor.getInstance();
