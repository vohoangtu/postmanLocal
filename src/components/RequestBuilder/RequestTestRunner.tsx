/**
 * Request Test Runner Component
 * Chạy test suite cho requests và hiển thị results
 */

import { useState } from 'react';
import { useCollectionStore } from '../../stores/collectionStore';
import { useToast } from '../../hooks/useToast';
import Button from '../UI/Button';
import Badge from '../UI/Badge';
import { Play, CheckCircle2, XCircle, Loader2, FileText } from 'lucide-react';

interface RequestTestRunnerProps {
  collectionId: string;
}

interface TestResult {
  requestId: string;
  requestName: string;
  status: 'passed' | 'failed' | 'skipped';
  message?: string;
  responseTime?: number;
  statusCode?: number;
}

export default function RequestTestRunner({ collectionId }: RequestTestRunnerProps) {
  const { collections } = useCollectionStore();
  const toast = useToast();
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState<TestResult[]>([]);

  const collection = collections.find((c) => c.id === collectionId);

  const runTests = async () => {
    if (!collection || !collection.requests || collection.requests.length === 0) {
      toast.error('No requests to test');
      return;
    }

    setRunning(true);
    setResults([]);

    const testResults: TestResult[] = [];

    for (const request of collection.requests) {
      try {
        const startTime = Date.now();
        
        // Build URL with query params
        let url = request.url || '';
        if (request.queryParams && request.queryParams.length > 0) {
          const params = new URLSearchParams();
          request.queryParams
            .filter((p) => p.enabled && p.key)
            .forEach((p) => params.append(p.key, p.value));
          const queryString = params.toString();
          if (queryString) {
            url += (url.includes('?') ? '&' : '?') + queryString;
          }
        }

        // Send request
        const response = await fetch(url, {
          method: request.method || 'GET',
          headers: request.headers || {},
          body: request.body || undefined,
        });

        const responseTime = Date.now() - startTime;

        // Basic validation
        const passed = response.ok && responseTime < 5000; // Status OK and response time < 5s

        testResults.push({
          requestId: request.id,
          requestName: request.name,
          status: passed ? 'passed' : 'failed',
          message: passed
            ? `Request successful (${response.status})`
            : `Request failed: ${response.status} ${response.statusText}`,
          responseTime,
          statusCode: response.status,
        });
      } catch (error: any) {
        testResults.push({
          requestId: request.id,
          requestName: request.name,
          status: 'failed',
          message: `Error: ${error.message || 'Request failed'}`,
        });
      }
    }

    setResults(testResults);
    setRunning(false);

    const passedCount = testResults.filter((r) => r.status === 'passed').length;
    const failedCount = testResults.filter((r) => r.status === 'failed').length;

    if (failedCount === 0) {
      toast.success(`All ${passedCount} tests passed!`);
    } else {
      toast.error(`${failedCount} test${failedCount !== 1 ? 's' : ''} failed`);
    }
  };

  if (!collection) {
    return (
      <div className="p-4 text-center text-gray-500">
        Collection not found
      </div>
    );
  }

  const requestCount = collection.requests?.length || 0;
  const passedCount = results.filter((r) => r.status === 'passed').length;
  const failedCount = results.filter((r) => r.status === 'failed').length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <FileText size={18} />
            Test Runner
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {requestCount} request{requestCount !== 1 ? 's' : ''} in collection
          </p>
        </div>
        <Button
          variant="primary"
          onClick={runTests}
          disabled={running || requestCount === 0}
          className="flex items-center gap-2"
        >
          {running ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Running Tests...
            </>
          ) : (
            <>
              <Play size={16} />
              Run Tests
            </>
          )}
        </Button>
      </div>

      {results.length > 0 && (
        <div className="p-4 bg-gray-50 dark:bg-gray-900/30 rounded-lg border-2 border-gray-300 dark:border-gray-700">
          <div className="flex items-center gap-4 mb-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={18} className="text-green-600 dark:text-green-400" />
              <span className="font-semibold text-green-800 dark:text-green-200">
                {passedCount} passed
              </span>
            </div>
            {failedCount > 0 && (
              <div className="flex items-center gap-2">
                <XCircle size={18} className="text-red-600 dark:text-red-400" />
                <span className="font-semibold text-red-800 dark:text-red-200">
                  {failedCount} failed
                </span>
              </div>
            )}
          </div>

          <div className="space-y-2 max-h-64 overflow-y-auto">
            {results.map((result) => (
              <div
                key={result.requestId}
                className={`p-3 rounded border-2 ${
                  result.status === 'passed'
                    ? 'bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700'
                    : 'bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-gray-900 dark:text-white">
                    {result.requestName}
                  </span>
                  <Badge
                    variant={result.status === 'passed' ? 'success' : 'danger'}
                    size="sm"
                  >
                    {result.status === 'passed' ? 'Passed' : 'Failed'}
                  </Badge>
                </div>
                {result.message && (
                  <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">
                    {result.message}
                  </p>
                )}
                {result.responseTime && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Response time: {result.responseTime}ms
                    {result.statusCode && ` | Status: ${result.statusCode}`}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {results.length === 0 && !running && (
        <div className="text-center text-gray-500 py-8 text-sm">
          Click "Run Tests" to validate all requests in this collection
        </div>
      )}
    </div>
  );
}
