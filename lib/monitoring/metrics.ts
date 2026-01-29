/**
 * Metrics collection for monitoring and observability
 * Tracks performance, errors, and business metrics
 */

interface Counter {
  name: string;
  value: number;
  tags?: Record<string, string>;
}

interface Histogram {
  name: string;
  values: number[];
  tags?: Record<string, string>;
}

class MetricsCollector {
  private counters = new Map<string, Counter>();
  private histograms = new Map<string, Histogram>();
  private enableMetrics: boolean;

  constructor() {
    this.enableMetrics = process.env.ENABLE_METRICS !== "false";
  }

  /**
   * Increment a counter metric
   */
  increment(name: string, value: number = 1, tags?: Record<string, string>) {
    if (!this.enableMetrics) return;

    const key = this.getKey(name, tags);
    const counter = this.counters.get(key) || { name, value: 0, tags };
    counter.value += value;
    this.counters.set(key, counter);
  }

  /**
   * Record a histogram value (for timing, sizes, etc.)
   */
  histogram(name: string, value: number, tags?: Record<string, string>) {
    if (!this.enableMetrics) return;

    const key = this.getKey(name, tags);
    const histogram = this.histograms.get(key) || { name, values: [], tags };
    histogram.values.push(value);
    
    // Keep only last 1000 values to prevent memory issues
    if (histogram.values.length > 1000) {
      histogram.values = histogram.values.slice(-1000);
    }
    
    this.histograms.set(key, histogram);
  }

  /**
   * Record timing (convenience method for histogram)
   */
  timing(name: string, startTime: number, tags?: Record<string, string>) {
    const duration = Date.now() - startTime;
    this.histogram(name, duration, tags);
  }

  /**
   * Get counter value
   */
  getCounter(name: string, tags?: Record<string, string>): number {
    const key = this.getKey(name, tags);
    return this.counters.get(key)?.value || 0;
  }

  /**
   * Get histogram statistics
   */
  getHistogramStats(name: string, tags?: Record<string, string>) {
    const key = this.getKey(name, tags);
    const histogram = this.histograms.get(key);
    
    if (!histogram || histogram.values.length === 0) {
      return null;
    }

    const values = histogram.values.sort((a, b) => a - b);
    const sum = values.reduce((a, b) => a + b, 0);
    const count = values.length;
    const mean = sum / count;
    const median = values[Math.floor(count / 2)];
    const p95 = values[Math.floor(count * 0.95)];
    const p99 = values[Math.floor(count * 0.99)];
    const min = values[0];
    const max = values[values.length - 1];

    return {
      count,
      sum,
      mean: Math.round(mean),
      median: Math.round(median),
      p95: Math.round(p95),
      p99: Math.round(p99),
      min,
      max,
    };
  }

  /**
   * Get all metrics (for health check endpoint)
   */
  getAllMetrics() {
    const counters: Record<string, number> = {};
    for (const [key, counter] of this.counters.entries()) {
      counters[key] = counter.value;
    }

    const histograms: Record<string, any> = {};
    for (const [key, histogram] of this.histograms.entries()) {
      histograms[key] = this.getHistogramStats(histogram.name, histogram.tags);
    }

    return { counters, histograms };
  }

  /**
   * Reset all metrics
   */
  reset() {
    this.counters.clear();
    this.histograms.clear();
  }

  private getKey(name: string, tags?: Record<string, string>): string {
    if (!tags || Object.keys(tags).length === 0) {
      return name;
    }
    const tagStr = Object.entries(tags)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}:${v}`)
      .join(",");
    return `${name}{${tagStr}}`;
  }
}

export const metrics = new MetricsCollector();

/**
 * Performance monitoring decorator
 */
export function trackPerformance<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  metricName: string,
  tags?: Record<string, string>
): T {
  return (async (...args: any[]) => {
    const startTime = Date.now();
    try {
      const result = await fn(...args);
      metrics.timing(`${metricName}.success`, startTime, tags);
      return result;
    } catch (error) {
      metrics.timing(`${metricName}.error`, startTime, { ...tags, error: "true" });
      throw error;
    }
  }) as T;
}

/**
 * Common metric names
 */
export const MetricNames = {
  // API metrics
  API_REQUEST: "api.request",
  API_RESPONSE_TIME: "api.response_time",
  API_ERROR: "api.error",
  
  // Agent metrics
  AGENT_EXECUTION: "agent.execution",
  AGENT_EXECUTION_TIME: "agent.execution_time",
  AGENT_ERROR: "agent.error",
  
  // Database metrics
  DB_QUERY: "db.query",
  DB_QUERY_TIME: "db.query_time",
  DB_ERROR: "db.error",
  
  // Rate limiting
  RATE_LIMIT_HIT: "rate_limit.hit",
  RATE_LIMIT_EXCEEDED: "rate_limit.exceeded",
  
  // Business metrics
  DIAGRAM_GENERATED: "diagram.generated",
  DIAGRAM_GENERATION_TIME: "diagram.generation_time",
  USER_REGISTERED: "user.registered",
  USER_LOGIN: "user.login",
} as const;
