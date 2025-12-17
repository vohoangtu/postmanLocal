/**
 * Base Test Editor Component
 * Component cơ bản chứa tất cả logic chung cho test editor
 * Được sử dụng bởi cả PublicTestEditor và WorkspaceTestEditor
 */

import { useState } from "react";
import { TestEngine } from "../../services/testEngine";
import TestDashboard from "./TestDashboard";

export interface BaseTestEditorProps {
  response: any;
  onTestResults: (results: TestResult[]) => void;
  // Props để customize behavior
  enableCollaboration?: boolean; // Cho phép hiển thị collaboration features
  renderCollaborationPanel?: () => React.ReactNode; // Render collaboration panel
  testId?: string | null; // Test ID để hiển thị reviews/comments
}

export interface TestResult {
  name: string;
  passed: boolean;
  message?: string;
}

export default function BaseTestEditor({
  response,
  onTestResults,
  enableCollaboration = false,
  renderCollaborationPanel,
  testId
}: BaseTestEditorProps) {
  const [testScript, setTestScript] = useState("");
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [preRequestScript, setPreRequestScript] = useState("");
  const [showDashboard, setShowDashboard] = useState(false);
  const testEngine = new TestEngine();

  const runTests = async () => {
    if (!response || !testScript.trim()) {
      return;
    }

    try {
      const startTime = Date.now();
      const results = await testEngine.runTests(
        testScript,
        response,
        { url: "", method: "", headers: {}, body: "" },
        Date.now() - startTime
      );

      // Simple test execution
      const testLines = testScript.split("\n");
      testLines.forEach((line) => {
        if (line.includes("pm.test")) {
          const match = line.match(/pm\.test\(["'](.+?)["']/);
          if (match) {
            const testName = match[1];
            // Simple status code check
            if (line.includes("status code")) {
              const statusMatch = line.match(/be\.equal\((\d+)\)/);
              if (statusMatch) {
                const expectedStatus = parseInt(statusMatch[1]);
                const passed = response.status === expectedStatus;
                results.push({
                  name: testName,
                  passed,
                  message: passed
                    ? undefined
                    : `Expected status ${expectedStatus}, got ${response.status}`,
                });
              }
            } else if (line.includes("response time")) {
              results.push({ name: testName, passed: true });
            } else {
              results.push({ name: testName, passed: true });
            }
          }
        }
      });

      if (results.length === 0) {
        // If no explicit tests, check for common patterns
        if (testScript.includes("status")) {
          results.push({
            name: "Status Code Check",
            passed: response.status >= 200 && response.status < 300,
            message:
              response.status >= 200 && response.status < 300
                ? undefined
                : `Status code is ${response.status}`,
          });
        }
      }

      setTestResults(results);
      onTestResults(results);
      setShowDashboard(true);
    } catch (error: any) {
      const errorResult: TestResult = {
        name: "Test Execution Error",
        passed: false,
        message: error.message,
      };
      setTestResults([errorResult]);
      onTestResults([errorResult]);
      setShowDashboard(true);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-800">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            Tests
          </h3>
          <div className="flex gap-2">
            {testResults.length > 0 && (
              <button
                onClick={() => setShowDashboard(!showDashboard)}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
              >
                {showDashboard ? "Hide" : "Show"} Dashboard
              </button>
            )}
            <button
              onClick={runTests}
              disabled={!response}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-sm"
            >
              Run Tests
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {showDashboard && testResults.length > 0 && (
          <div className="mb-4">
            <TestDashboard results={testResults} />
          </div>
        )}
        <div>
          <h4 className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2">
            Pre-request Script
          </h4>
          <textarea
            value={preRequestScript}
            onChange={(e) => setPreRequestScript(e.target.value)}
            placeholder="// Pre-request script (runs before sending request)"
            className="w-full h-32 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono text-sm"
          />
        </div>

        <div>
          <h4 className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2">
            Test Script
          </h4>
          <textarea
            value={testScript}
            onChange={(e) => setTestScript(e.target.value)}
            placeholder={`// Test script example:
pm.test("Status code is 200", function () {
  pm.response.to.have.status(200);
});

pm.test("Response has data", function () {
  const jsonData = pm.response.json();
  pm.expect(jsonData).to.have.property("data");
});`}
            className="w-full h-48 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono text-sm"
          />
        </div>

        {testResults.length > 0 && (
          <div>
            <h4 className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2">
              Test Results
            </h4>
            <div className="space-y-2">
              {testResults.map((result, index) => (
                <div
                  key={index}
                  className={`p-3 rounded ${
                    result.passed
                      ? "bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800"
                      : "bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800"
                  }`}
                >
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
            <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              {testResults.filter((r) => r.passed).length} / {testResults.length} tests passed
            </div>
          </div>
        )}
      </div>

      {/* Collaboration Panel - chỉ render nếu enableCollaboration = true */}
      {enableCollaboration && renderCollaborationPanel && (
        <div className="border-t border-gray-200 dark:border-gray-700">
          {renderCollaborationPanel()}
        </div>
      )}
    </div>
  );
}
