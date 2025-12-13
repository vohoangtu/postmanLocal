import { useMemo } from "react";

interface TestResult {
  name: string;
  passed: boolean;
  message?: string;
  duration?: number;
}

interface TestDashboardProps {
  results: TestResult[];
}

export default function TestDashboard({ results }: TestDashboardProps) {
  const stats = useMemo(() => {
    const total = results.length;
    const passed = results.filter((r) => r.passed).length;
    const failed = total - passed;
    const avgDuration =
      results.reduce((sum, r) => sum + (r.duration || 0), 0) / total || 0;

    return { total, passed, failed, avgDuration };
  }, [results]);

  if (results.length === 0) {
    return (
      <div className="p-4 text-center text-gray-500 dark:text-gray-400 text-sm">
        No test results yet. Run tests to see results here.
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 p-4 rounded border border-gray-200 dark:border-gray-700">
          <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</div>
          <div className="text-xs text-gray-600 dark:text-gray-400">Total Tests</div>
        </div>
        <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded border border-green-200 dark:border-green-800">
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">
            {stats.passed}
          </div>
          <div className="text-xs text-green-700 dark:text-green-300">Passed</div>
        </div>
        <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded border border-red-200 dark:border-red-800">
          <div className="text-2xl font-bold text-red-600 dark:text-red-400">{stats.failed}</div>
          <div className="text-xs text-red-700 dark:text-red-300">Failed</div>
        </div>
        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded border border-blue-200 dark:border-blue-800">
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {Math.round(stats.avgDuration)}ms
          </div>
          <div className="text-xs text-blue-700 dark:text-blue-300">Avg Duration</div>
        </div>
      </div>

      <div className="space-y-2">
        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Test Results</h4>
        {results.map((result, index) => (
          <div
            key={index}
            className={`p-3 rounded border ${
              result.passed
                ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
                : "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className={result.passed ? "text-green-600" : "text-red-600"}>
                  {result.passed ? "✓" : "✗"}
                </span>
                <span
                  className={`text-sm font-medium ${
                    result.passed
                      ? "text-green-800 dark:text-green-200"
                      : "text-red-800 dark:text-red-200"
                  }`}
                >
                  {result.name}
                </span>
              </div>
              {result.duration && (
                <span className="text-xs text-gray-600 dark:text-gray-400">
                  {result.duration}ms
                </span>
              )}
            </div>
            {result.message && (
              <p
                className={`text-xs mt-1 ${
                  result.passed
                    ? "text-green-700 dark:text-green-300"
                    : "text-red-700 dark:text-red-300"
                }`}
              >
                {result.message}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

