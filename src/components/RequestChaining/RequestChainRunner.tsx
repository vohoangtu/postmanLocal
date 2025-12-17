import { useState } from "react";
import { RequestChain } from "../../stores/requestChainStore";
import { executeChain, ChainExecutionResult } from "../../services/requestChainService";
import Button from "../UI/Button";
import { useToast } from "../../hooks/useToast";
import { Play, CheckCircle, XCircle, Loader2 } from "lucide-react";

interface RequestChainRunnerProps {
  chain: RequestChain;
  onComplete?: (results: ChainExecutionResult[]) => void;
}

export default function RequestChainRunner({ chain, onComplete }: RequestChainRunnerProps) {
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState<ChainExecutionResult[]>([]);
  const toast = useToast();

  const handleRun = async () => {
    setRunning(true);
    setResults([]);

    try {
      const executionResults = await executeChain(chain.steps, chain.variables);
      setResults(executionResults);
      onComplete?.(executionResults);

      const successCount = executionResults.filter((r) => r.success).length;
      toast.success(`Chain completed: ${successCount}/${executionResults.length} steps succeeded`);
    } catch (error: any) {
      toast.error(error.message || "Failed to execute chain");
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{chain.name}</h3>
        <Button
          variant="primary"
          onClick={handleRun}
          disabled={running || chain.steps.length === 0}
          loading={running}
        >
          <Play size={14} className="mr-1" />
          Run Chain
        </Button>
      </div>

      {chain.description && (
        <p className="text-sm text-gray-600 dark:text-gray-400">{chain.description}</p>
      )}

      <div className="space-y-2">
        {chain.steps.map((step, index) => {
          const result = results.find((r) => r.stepId === step.id);
          const isRunning = running && !result;

          return (
            <div
              key={step.id}
              className="p-3 bg-gray-50 dark:bg-gray-900 rounded border border-gray-200 dark:border-gray-700"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  {isRunning ? (
                    <Loader2 size={16} className="text-blue-600 dark:text-blue-400 animate-spin" />
                  ) : result ? (
                    result.success ? (
                      <CheckCircle size={16} className="text-green-600 dark:text-green-400" />
                    ) : (
                      <XCircle size={16} className="text-red-600 dark:text-red-400" />
                    )
                  ) : (
                    <div className="w-4 h-4 rounded-full border-2 border-gray-300 dark:border-gray-600" />
                  )}
                  <span className="font-medium text-gray-900 dark:text-white">
                    {step.name || `Step ${index + 1}`}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {step.method} {step.url}
                  </span>
                </div>
              </div>

              {result && (
                <div className="mt-2 text-xs">
                  {result.success ? (
                    <div className="text-green-600 dark:text-green-400">
                      Status: {result.response?.status}
                    </div>
                  ) : (
                    <div className="text-red-600 dark:text-red-400">
                      Error: {result.error}
                    </div>
                  )}
                  {result.extractedData && Object.keys(result.extractedData).length > 0 && (
                    <div className="mt-1 text-gray-600 dark:text-gray-400">
                      Extracted: {Object.keys(result.extractedData).join(", ")}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}





