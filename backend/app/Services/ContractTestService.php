<?php

namespace App\Services;

use App\Models\Schema;
use Illuminate\Support\Facades\Http;

/**
 * Contract Test Service
 * Chạy contract tests để đảm bảo API đúng spec
 */
class ContractTestService
{
    /**
     * Run contract tests
     */
    public function runContractTests(Schema $schema, string $baseUrl): array
    {
        $schemaData = $schema->schema_data;
        $results = [];
        $passed = 0;
        $failed = 0;

        if (!isset($schemaData['paths']) || !is_array($schemaData['paths'])) {
            return [
                'status' => 'error',
                'message' => 'No paths found in schema',
                'results' => [],
                'summary' => ['passed' => 0, 'failed' => 0, 'total' => 0],
            ];
        }

        foreach ($schemaData['paths'] as $path => $pathItem) {
            if (!is_array($pathItem)) {
                continue;
            }

            foreach ($pathItem as $method => $operation) {
                if (!in_array(strtolower($method), ['get', 'post', 'put', 'patch', 'delete'])) {
                    continue;
                }

                $testResult = $this->testEndpoint(
                    $baseUrl,
                    $path,
                    strtoupper($method),
                    $operation
                );

                $results[] = $testResult;

                if ($testResult['passed']) {
                    $passed++;
                } else {
                    $failed++;
                }
            }
        }

        return [
            'status' => $failed === 0 ? 'passed' : 'failed',
            'results' => $results,
            'summary' => [
                'passed' => $passed,
                'failed' => $failed,
                'total' => count($results),
            ],
        ];
    }

    /**
     * Test một endpoint
     */
    private function testEndpoint(
        string $baseUrl,
        string $path,
        string $method,
        array $operation
    ): array {
        $url = rtrim($baseUrl, '/') . $path;
        $testResult = [
            'path' => $path,
            'method' => $method,
            'passed' => false,
            'errors' => [],
        ];

        try {
            // Prepare request
            $requestOptions = [
                'timeout' => 10,
                'verify' => false, // Trong production nên verify SSL
            ];

            // Add headers nếu có
            if (isset($operation['parameters'])) {
                $headers = [];
                foreach ($operation['parameters'] as $param) {
                    if (isset($param['in']) && $param['in'] === 'header' && isset($param['name'])) {
                        $headers[$param['name']] = $param['schema']['default'] ?? 'test-value';
                    }
                }
                if (!empty($headers)) {
                    $requestOptions['headers'] = $headers;
                }
            }

            // Make request
            $response = Http::withOptions($requestOptions)->{strtolower($method)}($url);

            // Check status code
            $expectedStatus = $this->getExpectedStatusCode($operation);
            $actualStatus = $response->status();

            if ($actualStatus === $expectedStatus) {
                $testResult['passed'] = true;
            } else {
                $testResult['errors'][] = "Expected status {$expectedStatus}, got {$actualStatus}";
            }

            // Check response structure nếu có schema
            if (isset($operation['responses'][$expectedStatus]['content'])) {
                $content = $operation['responses'][$expectedStatus]['content'];
                foreach ($content as $contentType => $contentSchema) {
                    if (str_contains($response->header('Content-Type', ''), $contentType)) {
                        // Validate response structure (simplified)
                        $responseData = $response->json();
                        if ($responseData === null && $contentType === 'application/json') {
                            $testResult['errors'][] = 'Response is not valid JSON';
                            $testResult['passed'] = false;
                        }
                        break;
                    }
                }
            }

            $testResult['response_status'] = $actualStatus;
            $testResult['response_body'] = $response->body();
        } catch (\Exception $e) {
            $testResult['errors'][] = $e->getMessage();
            $testResult['passed'] = false;
        }

        return $testResult;
    }

    /**
     * Get expected status code từ operation
     */
    private function getExpectedStatusCode(array $operation): int
    {
        if (isset($operation['responses'])) {
            // Ưu tiên 200, sau đó là status code đầu tiên
            if (isset($operation['responses']['200'])) {
                return 200;
            }

            foreach (array_keys($operation['responses']) as $statusCode) {
                if (is_numeric($statusCode)) {
                    return (int)$statusCode;
                }
            }
        }

        return 200; // Default
    }
}
