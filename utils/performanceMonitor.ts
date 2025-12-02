
// Performance monitoring utility
class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: Map<string, number[]> = new Map();
  private memoryWarningThreshold = 0.8; // 80% memory usage

  private constructor() {
    console.log('PerformanceMonitor initialized');
  }

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  /**
   * Start timing an operation
   */
  startTiming(operationName: string): () => void {
    const startTime = Date.now();
    
    return () => {
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      if (!this.metrics.has(operationName)) {
        this.metrics.set(operationName, []);
      }
      
      const metrics = this.metrics.get(operationName)!;
      metrics.push(duration);
      
      // Keep only last 100 measurements
      if (metrics.length > 100) {
        metrics.shift();
      }
      
      // Log slow operations
      if (duration > 1000) {
        console.warn(`Slow operation detected: ${operationName} took ${duration}ms`);
      }
    };
  }

  /**
   * Get average timing for an operation
   */
  getAverageTiming(operationName: string): number {
    const metrics = this.metrics.get(operationName);
    if (!metrics || metrics.length === 0) {
      return 0;
    }
    
    const sum = metrics.reduce((acc, val) => acc + val, 0);
    return sum / metrics.length;
  }

  /**
   * Log all performance metrics
   */
  logMetrics(): void {
    console.log('=== Performance Metrics ===');
    this.metrics.forEach((timings, operation) => {
      const avg = this.getAverageTiming(operation);
      const max = Math.max(...timings);
      const min = Math.min(...timings);
      console.log(`${operation}: avg=${avg.toFixed(2)}ms, min=${min}ms, max=${max}ms`);
    });
    console.log('===========================');
  }

  /**
   * Clear all metrics
   */
  clearMetrics(): void {
    this.metrics.clear();
    console.log('Performance metrics cleared');
  }

  /**
   * Check memory usage (simplified)
   */
  checkMemoryUsage(): void {
    // Note: React Native doesn't have direct memory API
    // This is a placeholder for future implementation
    console.log('Memory check: Monitoring active');
  }
}

export const performanceMonitor = PerformanceMonitor.getInstance();

/**
 * Hook to measure component render time
 */
export function useMeasureRender(componentName: string): void {
  const startTime = Date.now();
  
  React.useEffect(() => {
    const renderTime = Date.now() - startTime;
    if (renderTime > 100) {
      console.warn(`Slow render: ${componentName} took ${renderTime}ms`);
    }
  });
}

// Export for use in components
export default performanceMonitor;
