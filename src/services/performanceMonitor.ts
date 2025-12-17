/**
 * Performance Monitor - Track performance metrics
 */

interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: number;
  type: "request" | "render" | "memory";
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private maxMetrics = 1000;

  /**
   * Track request timing
   */
  trackRequest(url: string, duration: number): void {
    this.addMetric({
      name: `request:${url}`,
      value: duration,
      timestamp: Date.now(),
      type: "request",
    });
  }

  /**
   * Track component render time
   */
  trackRender(componentName: string, duration: number): void {
    this.addMetric({
      name: `render:${componentName}`,
      value: duration,
      timestamp: Date.now(),
      type: "render",
    });
  }

  /**
   * Track memory usage
   */
  trackMemory(): void {
    if (typeof performance !== "undefined" && (performance as any).memory) {
      const memory = (performance as any).memory;
      this.addMetric({
        name: "memory:used",
        value: memory.usedJSHeapSize,
        timestamp: Date.now(),
        type: "memory",
      });
    }
  }

  /**
   * Get metrics
   */
  getMetrics(type?: "request" | "render" | "memory"): PerformanceMetric[] {
    if (type) {
      return this.metrics.filter((m) => m.type === type);
    }
    return [...this.metrics];
  }

  /**
   * Get average for a metric name
   */
  getAverage(metricName: string): number {
    const matching = this.metrics.filter((m) => m.name === metricName);
    if (matching.length === 0) return 0;
    const sum = matching.reduce((acc, m) => acc + m.value, 0);
    return sum / matching.length;
  }

  /**
   * Clear metrics
   */
  clear(): void {
    this.metrics = [];
  }

  private addMetric(metric: PerformanceMetric): void {
    this.metrics.push(metric);
    if (this.metrics.length > this.maxMetrics) {
      this.metrics.shift();
    }
  }
}

export const performanceMonitor = new PerformanceMonitor();

// Auto-track memory every 30 seconds
if (typeof window !== "undefined") {
  setInterval(() => {
    performanceMonitor.trackMemory();
  }, 30000);
}





