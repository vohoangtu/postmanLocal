<?php

namespace App\Services;

use App\Models\Schema;

/**
 * Mock Server Service
 * Generate mock routes từ OpenAPI schema
 */
class MockServerService
{
    /**
     * Generate mock routes từ schema
     */
    public function generateRoutes(Schema $schema): array
    {
        $schemaData = $schema->schema_data;
        $routes = [];

        if (!isset($schemaData['paths']) || !is_array($schemaData['paths'])) {
            return $routes;
        }

        foreach ($schemaData['paths'] as $path => $pathItem) {
            if (!is_array($pathItem)) {
                continue;
            }

            foreach ($pathItem as $method => $operation) {
                if (!in_array(strtolower($method), ['get', 'post', 'put', 'patch', 'delete', 'head', 'options'])) {
                    continue;
                }

                $route = [
                    'path' => $path,
                    'method' => strtoupper($method),
                    'summary' => $operation['summary'] ?? $operation['operationId'] ?? '',
                    'description' => $operation['description'] ?? '',
                    'response' => $this->generateMockResponse($operation),
                ];

                // Add parameters
                if (isset($operation['parameters']) && is_array($operation['parameters'])) {
                    $route['parameters'] = $operation['parameters'];
                }

                // Add request body
                if (isset($operation['requestBody'])) {
                    $route['requestBody'] = $operation['requestBody'];
                }

                $routes[] = $route;
            }
        }

        return $routes;
    }

    /**
     * Generate mock response từ operation
     */
    private function generateMockResponse(array $operation): array
    {
        $defaultResponse = [
            'status' => 200,
            'headers' => ['Content-Type' => 'application/json'],
            'body' => ['message' => 'Mock response'],
        ];

        if (!isset($operation['responses']) || !is_array($operation['responses'])) {
            return $defaultResponse;
        }

        // Ưu tiên 200, sau đó là response đầu tiên
        if (isset($operation['responses']['200'])) {
            $response = $operation['responses']['200'];
            return $this->extractResponseData($response, 200);
        }

        foreach ($operation['responses'] as $statusCode => $response) {
            if (is_numeric($statusCode)) {
                return $this->extractResponseData($response, (int)$statusCode);
            }
        }

        return $defaultResponse;
    }

    /**
     * Extract response data từ OpenAPI response object
     */
    private function extractResponseData(array $response, int $statusCode): array
    {
        $result = [
            'status' => $statusCode,
            'headers' => ['Content-Type' => 'application/json'],
            'body' => null,
        ];

        if (isset($response['content'])) {
            foreach ($response['content'] as $contentType => $content) {
                if (isset($content['example'])) {
                    $result['body'] = $content['example'];
                    $result['headers']['Content-Type'] = $contentType;
                    break;
                } elseif (isset($content['schema'])) {
                    $result['body'] = $this->generateExampleFromSchema($content['schema']);
                    $result['headers']['Content-Type'] = $contentType;
                    break;
                }
            }
        }

        if ($result['body'] === null) {
            $result['body'] = ['message' => $response['description'] ?? 'Response'];
        }

        return $result;
    }

    /**
     * Generate example từ schema
     */
    private function generateExampleFromSchema(array $schema): mixed
    {
        if (isset($schema['example'])) {
            return $schema['example'];
        }

        $type = $schema['type'] ?? 'object';

        switch ($type) {
            case 'string':
                return isset($schema['format']) && $schema['format'] === 'date-time'
                    ? date('c')
                    : 'string';
            case 'number':
            case 'integer':
                return 0;
            case 'boolean':
                return false;
            case 'array':
                $items = $schema['items'] ?? ['type' => 'string'];
                return [$this->generateExampleFromSchema($items)];
            case 'object':
                $example = [];
                if (isset($schema['properties']) && is_array($schema['properties'])) {
                    foreach ($schema['properties'] as $propName => $propSchema) {
                        $example[$propName] = $this->generateExampleFromSchema($propSchema);
                    }
                }
                return $example;
            default:
                return null;
        }
    }
}
