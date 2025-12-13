import { useState, useEffect } from "react";
import { performanceMonitor } from "../../services/performanceMonitor";
import { BarChart3, Activity, MemoryStick } from "lucide-react";
import Button from "../UI/Button";

export default function PerformanceDashboard() {
  const [metrics, setMetrics] = useState(performanceMonitor.getMetrics());
  const [selectedType, setSelectedType] = useState<"request" | "render" | "memory" | "all">("all");

  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics(performanceMonitor.getMetrics());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const filteredMetrics = selectedType === "all" 
    ? metrics 
    : metrics.filter((m) => m.type === selectedType);

  const requestMetrics = metrics.filter((m) => m.type === "request");
  const renderMetrics = metrics.filter((m) => m.type === "render");
  const memoryMetrics = metrics.filter((m) => m.type === "memory");

  const avgRequestTime = requestMetrics.length > 0
    ? requestMetrics.reduce((acc, m) => acc + m.value, 0) / requestMetrics.length
    : 0;

  const avgRenderTime = renderMetrics.length > 0
    ? renderMetrics.reduce((acc, m) => acc + m.value, 0) / renderMetrics.length
    : 0;

  const latestMemory = memoryMetrics.length > 0
    ? memoryMetrics[memoryMetrics.length - 1].value
    : 0;

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i];
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
          Performance Dashboard
        </h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            performanceMonitor.clear();
            setMetrics([]);
          }}
        >
          Clear
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 mb-1">
            <Activity size={16} className="text-blue-600 dark:text-blue-400" />
            <span className="text-xs text-gray-600 dark:text-gray-400">Avg Request</span>
          </div>
          <div className="text-lg font-semibold text-gray-900 dark:text-white">
            {avgRequestTime.toFixed(0)}ms
          </div>
        </div>

        <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 mb-1">
            <BarChart3 size={16} className="text-green-600 dark:text-green-400" />
            <span className="text-xs text-gray-600 dark:text-gray-400">Avg Render</span>
          </div>
          <div className="text-lg font-semibold text-gray-900 dark:text-white">
            {avgRenderTime.toFixed(2)}ms
          </div>
        </div>

        <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 mb-1">
            <MemoryStick size={16} className="text-purple-600 dark:text-purple-400" />
            <span className="text-xs text-gray-600 dark:text-gray-400">Memory</span>
          </div>
          <div className="text-lg font-semibold text-gray-900 dark:text-white">
            {formatBytes(latestMemory)}
          </div>
        </div>
      </div>

      {/* Filter */}
      <div className="flex gap-2">
        <button
          onClick={() => setSelectedType("all")}
          className={`px-3 py-1 text-xs rounded ${
            selectedType === "all"
              ? "bg-blue-600 text-white"
              : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
          }`}
        >
          All
        </button>
        <button
          onClick={() => setSelectedType("request")}
          className={`px-3 py-1 text-xs rounded ${
            selectedType === "request"
              ? "bg-blue-600 text-white"
              : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
          }`}
        >
          Requests
        </button>
        <button
          onClick={() => setSelectedType("render")}
          className={`px-3 py-1 text-xs rounded ${
            selectedType === "render"
              ? "bg-blue-600 text-white"
              : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
          }`}
        >
          Renders
        </button>
        <button
          onClick={() => setSelectedType("memory")}
          className={`px-3 py-1 text-xs rounded ${
            selectedType === "memory"
              ? "bg-blue-600 text-white"
              : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
          }`}
        >
          Memory
        </button>
      </div>

      {/* Metrics List */}
      <div className="space-y-1 max-h-64 overflow-y-auto">
        {filteredMetrics.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
            No metrics yet
          </p>
        ) : (
          filteredMetrics.slice(-20).reverse().map((metric, index) => (
            <div
              key={index}
              className="p-2 bg-gray-50 dark:bg-gray-900 rounded border border-gray-200 dark:border-gray-700 text-xs"
            >
              <div className="flex items-center justify-between">
                <span className="text-gray-700 dark:text-gray-300">{metric.name}</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {metric.type === "memory" ? formatBytes(metric.value) : `${metric.value.toFixed(2)}ms`}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}


