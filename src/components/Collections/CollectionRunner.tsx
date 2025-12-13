import { useState, useCallback } from "react";
import { useCollectionStore, Request } from "../../stores/collectionStore";
import { executeRequest } from "../../services/apiService";
import { TestEngine } from "../../services/testEngine";
import { executePreRequestScript, executePostRequestScript } from "../../services/scriptEngine";
import { useEnvironmentStore } from "../../stores/environmentStore";
import { useToast } from "../../hooks/useToast";
import Button from "../UI/Button";
import { Play, Square, CheckCircle, XCircle, Loader2 } from "lucide-react";

interface CollectionRunnerProps {
  collectionId: string;
  onComplete?: (results: CollectionRunResult) => void;
}

export interface RequestRunResult {
  requestId: string;
  requestName: string;
  success: boolean;
  status?: number;
  duration: number;
  testResults?: Array<{ name: string; passed: boolean; message?: string }>;
  error?: string;
}

export interface CollectionRunResult {
  collectionId: string;
  totalRequests: number;
  passed: number;
  failed: number;
  results: RequestRunResult[];
  totalDuration: number;
}

export default function CollectionRunner({ collectionId, onComplete }: CollectionRunnerProps) {
  const { collections } = useCollectionStore();
  const { replaceVariables, getActiveEnvironment } = useEnvironmentStore();
  const toast = useToast();
  const [isRunning, setIsRunning] = useState(false);
  const [currentRequest, setCurrentRequest] = useState<string | null>(null);
  const [results, setResults] = useState<RequestRunResult[]>([]);

  const collection = collections.find((c) => c.id === collectionId);

  const runCollection = useCallback(async () => {
    if (!collection || collection.requests.length === 0) {
      toast.error("Collection không có requests");
      return;
    }

    setIsRunning(true);
    setResults([]);
    setCurrentRequest(null);

    const runResults: RequestRunResult[] = [];
    const testEngine = new TestEngine();
    const environment = getActiveEnvironment();

    const startTime = Date.now();

    for (const request of collection.requests) {
      setCurrentRequest(request.id);

      try {
        const requestStartTime = Date.now();

        // Get pre-request script từ request data (nếu có)
        const preRequestScript = (request as any).preRequestScript || "";
        const testScript = (request as any).testScript || "";

        // Build request với variable replacement
        let finalUrl = replaceVariables(request.url);
        const finalHeaders: Record<string, string> = {};
        if (request.headers) {
          Object.entries(request.headers).forEach(([key, value]) => {
            finalHeaders[key] = replaceVariables(value);
          });
        }

        let finalBody = request.body ? replaceVariables(request.body) : undefined;

        // Execute pre-request script
        if (preRequestScript) {
          const scriptResult = await executePreRequestScript(
            preRequestScript,
            {
              url: finalUrl,
              method: request.method,
              headers: finalHeaders,
              body: finalBody,
            },
            environment?.variables || {}
          );

          if (!scriptResult.success) {
            runResults.push({
              requestId: request.id,
              requestName: request.name,
              success: false,
              duration: Date.now() - requestStartTime,
              error: `Pre-request script failed: ${scriptResult.error}`,
            });
            continue;
          }

          // Update request với script changes
          if (scriptResult.updatedRequest) {
            finalUrl = scriptResult.updatedRequest.url || finalUrl;
            finalHeaders = { ...finalHeaders, ...scriptResult.updatedRequest.headers };
            finalBody = scriptResult.updatedRequest.body !== undefined ? scriptResult.updatedRequest.body : finalBody;
          }
        }

        // Execute request
        const response = await executeRequest({
          method: request.method,
          url: finalUrl,
          headers: finalHeaders,
          body: finalBody,
        });

        const duration = Date.now() - requestStartTime;

        // Execute post-request script và tests
        let testResults: Array<{ name: string; passed: boolean; message?: string }> = [];

        if (testScript) {
          const tests = await testEngine.runTests(
            testScript,
            response,
            {
              url: finalUrl,
              method: request.method,
              headers: finalHeaders,
              body: finalBody,
            },
            duration
          );
          testResults = tests;
        }

        // Execute post-request script
        const postRequestScript = (request as any).postRequestScript || "";
        if (postRequestScript) {
          await executePostRequestScript(
            postRequestScript,
            {
              url: finalUrl,
              method: request.method,
              headers: finalHeaders,
              body: finalBody,
            },
            response,
            duration,
            environment?.variables || {}
          );
        }

        const allTestsPassed = testResults.length === 0 || testResults.every((t) => t.passed);
        const success = response.status >= 200 && response.status < 300 && allTestsPassed;

        runResults.push({
          requestId: request.id,
          requestName: request.name,
          success,
          status: response.status,
          duration,
          testResults,
        });

        setResults([...runResults]);
      } catch (error: any) {
        const duration = Date.now() - requestStartTime;
        runResults.push({
          requestId: request.id,
          requestName: request.name,
          success: false,
          duration,
          error: error.message || "Request failed",
        });
        setResults([...runResults]);
      }
    }

    setIsRunning(false);
    setCurrentRequest(null);

    const totalDuration = Date.now() - startTime;
    const passed = runResults.filter((r) => r.success).length;
    const failed = runResults.length - passed;

    const finalResults: CollectionRunResult = {
      collectionId,
      totalRequests: runResults.length,
      passed,
      failed,
      results: runResults,
      totalDuration,
    };

    toast.success(`Collection run completed: ${passed}/${runResults.length} passed`);

    if (onComplete) {
      onComplete(finalResults);
    }
  }, [collection, replaceVariables, getActiveEnvironment, toast, onComplete]);

  const stopRun = useCallback(() => {
    setIsRunning(false);
    setCurrentRequest(null);
    toast.info("Collection run stopped");
  }, [toast]);

  if (!collection) {
    return <div className="p-4 text-gray-500">Collection not found</div>;
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Run Collection: {collection.name}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {collection.requests.length} requests
          </p>
        </div>
        {!isRunning ? (
          <Button
            variant="primary"
            onClick={runCollection}
            disabled={collection.requests.length === 0}
          >
            <Play size={16} className="mr-2" />
            Run Collection
          </Button>
        ) : (
          <Button variant="danger" onClick={stopRun}>
            <Square size={16} className="mr-2" />
            Stop
          </Button>
        )}
      </div>

      {results.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            Results ({results.filter((r) => r.success).length}/{results.length} passed)
          </h4>
          <div className="space-y-1 max-h-96 overflow-y-auto">
            {results.map((result) => (
              <div
                key={result.requestId}
                className={`p-3 rounded border ${
                  result.success
                    ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
                    : "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {result.success ? (
                      <CheckCircle size={16} className="text-green-600 dark:text-green-400" />
                    ) : (
                      <XCircle size={16} className="text-red-600 dark:text-red-400" />
                    )}
                    <span className="font-medium text-sm text-gray-900 dark:text-white">
                      {result.requestName}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                    {result.status && <span>Status: {result.status}</span>}
                    <span>{result.duration}ms</span>
                  </div>
                </div>
                {result.error && (
                  <p className="mt-1 text-xs text-red-600 dark:text-red-400">{result.error}</p>
                )}
                {result.testResults && result.testResults.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {result.testResults.map((test, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-xs">
                        {test.passed ? (
                          <CheckCircle size={12} className="text-green-600" />
                        ) : (
                          <XCircle size={12} className="text-red-600" />
                        )}
                        <span className={test.passed ? "text-green-700" : "text-red-700"}>
                          {test.name}
                        </span>
                        {test.message && (
                          <span className="text-gray-500">- {test.message}</span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {isRunning && currentRequest && (
        <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-200 dark:border-blue-800">
          <Loader2 size={16} className="animate-spin text-blue-600" />
          <span className="text-sm text-blue-900 dark:text-blue-200">
            Running: {collection.requests.find((r) => r.id === currentRequest)?.name}
          </span>
        </div>
      )}
    </div>
  );
}
