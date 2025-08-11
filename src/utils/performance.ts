/**
 * Performance optimization utilities for NEAR Intent Protocol
 */

export class PerformanceMonitor {
  private metrics: Map<string, number[]> = new Map();

  startTimer(operation: string): () => number {
    const start = performance.now();
    return () => {
      const duration = performance.now() - start;
      this.recordMetric(operation, duration);
      return duration;
    };
  }

  recordMetric(operation: string, value: number): void {
    if (!this.metrics.has(operation)) {
      this.metrics.set(operation, []);
    }
    this.metrics.get(operation)!.push(value);
  }

  getAverageTime(operation: string): number {
    const values = this.metrics.get(operation) || [];
    return values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0;
  }

  getMetrics(): Record<string, { avg: number; count: number; min: number; max: number }> {
    const result: Record<string, any> = {};
    for (const [operation, values] of this.metrics.entries()) {
      result[operation] = {
        avg: values.reduce((a, b) => a + b, 0) / values.length,
        count: values.length,
        min: Math.min(...values),
        max: Math.max(...values),
      };
    }
    return result;
  }
}

export const performanceMonitor = new PerformanceMonitor();
