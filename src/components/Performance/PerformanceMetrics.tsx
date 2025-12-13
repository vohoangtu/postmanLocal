import { useState, useEffect } from "react";
import { performanceMonitor } from "../../services/performanceMonitor";
import { cacheService } from "../../services/cacheService";
import { Activity, Clock, Database, TrendingUp, TrendingDown } from "lucide-react";

interface PerformanceStats {
  requestMetrics: {
    total: number;
    average: number;
    min: number;
    max: number;
    recent: Array<{ url: string; duration: number; timestamp: number }>;
  };
  renderMetrics: {
    total: number;
    average: number;
    slowest: Array<{ component: string; duration: number }>;
  };
  memoryMetrics: {
    current: number;
    peak: number;
    average: number;
  };
  cacheStats: {
    totalEntries: number;
    memoryEntries: number;
    indexedDBEntries: number;
    hitRate: number;
    hits: number;
    misses: number;
  };
}

export default function PerformanceMetrics() {
  const [stats, setStats] = useState<PerformanceStats | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const loadStats = async () => {
    const requestMetrics = performanceMonitor.getMetrics("request");
    const renderMetrics = performanceMonitor.getMetrics("render");
    const memoryMetrics = performanceMonitor.getMetrics("memory");
    const cacheStats = await cacheService.getStats();

    // Process request metrics
    const requestDurations = requestMetrics.map((m) => m.value);
    const requestStats = {
      total: requestMetrics.length,
      average: requestDurations.length > 0
        ? requestDurations.reduce((a, b) => a + b, 0) / requestDurations.length
        : 0,
      min: requestDurations.length > 0 ? Math.min(...requestDurations) : 0,
      max: requestDurations.length > 0 ? Math.max(...requestDurations) : 0,
      recent: requestMetrics
        .slice(-10)
        .reverse()
        .map((m) => ({
          url: m.name.replace("request:", ""),
          duration: m.value,
          timestamp: m.timestamp,
        })),
    };

    // Process render metrics
    const renderDurations = renderMetrics.map((m) => m.value);
    const componentMap = new Map<string, number[]>();
    renderMetrics.forEach((m) => {
      const component = m.name.replace("render:", "");
      if (!componentMap.has(component)) {
        componentMap.set(component, []);
      }
      componentMap.get(component)!.push(m.value);
    });

    const slowest = Array.from(componentMap.entries())
      .map(([component, durations]) => ({
        component,
        duration: durations.reduce((a, b) => a + b, 0) / durations.length,
      }))
      .sort((a, b) => b.duration - a.duration)
      .slice(0, 5);

    const renderStats = {
      total: renderMetrics.length,
      average: renderDurations.length > 0
        ? renderDurations.reduce((a, b) => a + b, 0) / renderDurations.length
        : 0,
      slowest,
    };

    // Process memory metrics
    const memoryValues = memoryMetrics.map((m) => m.value);
    const memoryStats = {
      current: memoryValues.length > 0 ? memoryValues[memoryValues.length - 1] : 0,
      peak: memoryValues.length > 0 ? Math.max(...memoryValues) : 0,
      average: memoryValues.length > 0
        ? memoryValues.reduce((a, b) => a + b, 0) / memoryValues.length
        : 0,
    };

    setStats({
      requestMetrics: requestStats,
      renderMetrics: renderStats,
      memoryMetrics: memoryStats,
      cacheStats,
    });
  };

  useEffect(() => {
    loadStats();

    if (autoRefresh) {
      const interval = setInterval(loadStats, 5000); // Refresh every 5 seconds
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
  };

  const formatDuration = (ms: number): string => {
    if (ms < 1000) return `${ms.toFixed(0)}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  if (!stats) {
    return (
      <div className="p-4 text-center text-gray-500 dark:text-gray-400">
        Đang tải metrics...
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <Activity className="w-5 h-5" />
          Performance Metrics
        </h2>
        <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
          <input
            type="checkbox"
            checked={autoRefresh}
            onChange={(e) => setAutoRefresh(e.target.checked)}
            className="rounded"
          />
          Auto refresh
        </label>
      </div>

      {/* Request Metrics */}
      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
          <Clock className="w-4 h-4" />
          Request Performance
        </h3>
        <div className="grid grid-cols-4 gap-4 mb-4">
          <div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Total Requests</div>
            <div className="text-lg font-semibold text-gray-900 dark:text-white">
              {stats.requestMetrics.total}
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Average</div>
            <div className="text-lg font-semibold text-gray-900 dark:text-white">
              {formatDuration(stats.requestMetrics.average)}
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Min</div>
            <div className="text-lg font-semibold text-green-600 dark:text-green-400">
              {formatDuration(stats.requestMetrics.min)}
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Max</div>
            <div className="text-lg font-semibold text-red-600 dark:text-red-400">
              {formatDuration(stats.requestMetrics.max)}
            </div>
          </div>
        </div>
        {stats.requestMetrics.recent.length > 0 && (
          <div>
            <div className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2">
              Recent Requests:
            </div>
            <div className="space-y-1">
              {stats.requestMetrics.recent.map((req, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between text-xs bg-white dark:bg-gray-700 p-2 rounded"
                >
                  <span className="text-gray-700 dark:text-gray-300 truncate flex-1 mr-2">
                    {req.url}
                  </span>
                  <span className="text-gray-500 dark:text-gray-400">
                    {formatDuration(req.duration)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Render Metrics */}
      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
          <TrendingUp className="w-4 h-4" />
          Render Performance
        </h3>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Total Renders</div>
            <div className="text-lg font-semibold text-gray-900 dark:text-white">
              {stats.renderMetrics.total}
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Average</div>
            <div className="text-lg font-semibold text-gray-900 dark:text-white">
              {formatDuration(stats.renderMetrics.average)}
            </div>
          </div>
        </div>
        {stats.renderMetrics.slowest.length > 0 && (
          <div>
            <div className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2">
              Slowest Components:
            </div>
            <div className="space-y-1">
              {stats.renderMetrics.slowest.map((comp, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between text-xs bg-white dark:bg-gray-700 p-2 rounded"
                >
                  <span className="text-gray-700 dark:text-gray-300">{comp.component}</span>
                  <span className="text-gray-500 dark:text-gray-400">
                    {formatDuration(comp.duration)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Memory Metrics */}
      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
          <Database className="w-4 h-4" />
          Memory Usage
        </h3>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Current</div>
            <div className="text-lg font-semibold text-gray-900 dark:text-white">
              {formatBytes(stats.memoryMetrics.current)}
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Peak</div>
            <div className="text-lg font-semibold text-orange-600 dark:text-orange-400">
              {formatBytes(stats.memoryMetrics.peak)}
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Average</div>
            <div className="text-lg font-semibold text-gray-900 dark:text-white">
              {formatBytes(stats.memoryMetrics.average)}
            </div>
          </div>
        </div>
      </div>

      {/* Cache Stats */}
      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
          <Database className="w-4 h-4" />
          Cache Statistics
        </h3>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Total Entries</div>
            <div className="text-lg font-semibold text-gray-900 dark:text-white">
              {stats.cacheStats.totalEntries}
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Hit Rate</div>
            <div className="text-lg font-semibold text-gray-900 dark:text-white">
              {(stats.cacheStats.hitRate * 100).toFixed(1)}%
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Memory Cache</div>
            <div className="text-sm text-gray-700 dark:text-gray-300">
              {stats.cacheStats.memoryEntries} entries
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-500 dark:text-gray-400">IndexedDB Cache</div>
            <div className="text-sm text-gray-700 dark:text-gray-300">
              {stats.cacheStats.indexedDBEntries} entries
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1">
            <TrendingUp className="w-3 h-3 text-green-600 dark:text-green-400" />
            <span className="text-gray-600 dark:text-gray-400">
              Hits: {stats.cacheStats.hits}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <TrendingDown className="w-3 h-3 text-red-600 dark:text-red-400" />
            <span className="text-gray-600 dark:text-gray-400">
              Misses: {stats.cacheStats.misses}
            </span>
          </div>
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={loadStats}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
        >
          Refresh
        </button>
        <button
          onClick={() => {
            performanceMonitor.clear();
            cacheService.resetStats();
            loadStats();
          }}
          className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-300 dark:hover:bg-gray-600 text-sm"
        >
          Clear Metrics
        </button>
      </div>
    </div>
  );
}
