import { performance } from 'perf_hooks';
import { ConfigManager } from '../core/ConfigManager.js';
import { logger } from './Logger.js';

interface PerformanceMetric {
  operation: string;
  duration: number;
  timestamp: number;
  success: boolean;
}

export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private configManager: ConfigManager;
  private metrics: PerformanceMetric[] = [];
  private timers: Map<string, number> = new Map();

  constructor() {
    this.configManager = new ConfigManager();
  }

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  startTimer(operation: string): void {
    this.timers.set(operation, performance.now());
  }

  endTimer(operation: string, success: boolean = true): void {
    const startTime = this.timers.get(operation);
    if (startTime) {
      const duration = performance.now() - startTime;
      this.recordMetric({
        operation,
        duration,
        timestamp: Date.now(),
        success
      });
      this.timers.delete(operation);
    }
  }

  private recordMetric(metric: PerformanceMetric): void {
    this.metrics.push(metric);
    
    // Keep only last 100 metrics
    if (this.metrics.length > 100) {
      this.metrics = this.metrics.slice(-100);
    }

    // Store in config for persistence
    this.configManager.setConfigValue('performanceMetrics', this.metrics);

    // Log performance metric
    logger.debug('Performance', `${metric.operation} completed in ${metric.duration.toFixed(2)}ms`, {
      operation: metric.operation,
      duration: metric.duration,
      success: metric.success
    });

    // Log slow operations as warnings
    if (metric.duration > 5000 && metric.success) {
      logger.warn('Performance', `Slow operation detected: ${metric.operation} took ${(metric.duration / 1000).toFixed(2)}s`);
    }
  }

  getAverageTime(operation: string): number {
    const operationMetrics = this.metrics.filter(m => m.operation === operation && m.success);
    if (operationMetrics.length === 0) return 0;
    
    const total = operationMetrics.reduce((sum, m) => sum + m.duration, 0);
    return total / operationMetrics.length;
  }

  getSuccessRate(operation: string): number {
    const operationMetrics = this.metrics.filter(m => m.operation === operation);
    if (operationMetrics.length === 0) return 0;
    
    const successful = operationMetrics.filter(m => m.success).length;
    return (successful / operationMetrics.length) * 100;
  }

  getMetrics(): PerformanceMetric[] {
    return [...this.metrics];
  }

  clearMetrics(): void {
    this.metrics = [];
    this.configManager.setConfigValue('performanceMetrics', []);
  }
}
