<?php

namespace App\Services;

/**
 * Schema Validation Service
 * Validate OpenAPI 3.0 schemas
 */
class SchemaValidationService
{
    /**
     * Validate OpenAPI schema
     * 
     * @param array $schemaData
     * @return array ['valid' => bool, 'errors' => array]
     */
    public function validate(array $schemaData): array
    {
        $errors = [];

        // Validate required fields
        if (!isset($schemaData['openapi'])) {
            $errors[] = [
                'path' => 'openapi',
                'message' => 'Missing required field: openapi',
                'level' => 'error',
            ];
        } elseif ($schemaData['openapi'] !== '3.0.0') {
            $errors[] = [
                'path' => 'openapi',
                'message' => 'Unsupported OpenAPI version. Only 3.0.0 is supported.',
                'level' => 'error',
            ];
        }

        if (!isset($schemaData['info'])) {
            $errors[] = [
                'path' => 'info',
                'message' => 'Missing required field: info',
                'level' => 'error',
            ];
        } else {
            if (!isset($schemaData['info']['title'])) {
                $errors[] = [
                    'path' => 'info.title',
                    'message' => 'Missing required field: info.title',
                    'level' => 'error',
                ];
            }

            if (!isset($schemaData['info']['version'])) {
                $errors[] = [
                    'path' => 'info.version',
                    'message' => 'Missing required field: info.version',
                    'level' => 'error',
                ];
            }
        }

        if (!isset($schemaData['paths'])) {
            $errors[] = [
                'path' => 'paths',
                'message' => 'Missing required field: paths',
                'level' => 'error',
            ];
        } else {
            // Validate paths
            foreach ($schemaData['paths'] as $path => $pathItem) {
                if (!is_string($path) || !str_starts_with($path, '/')) {
                    $errors[] = [
                        'path' => "paths.{$path}",
                        'message' => "Path must start with '/'",
                        'level' => 'error',
                    ];
                }

                if (!is_array($pathItem)) {
                    $errors[] = [
                        'path' => "paths.{$path}",
                        'message' => 'Path item must be an object',
                        'level' => 'error',
                    ];
                    continue;
                }

                // Validate operations
                $validMethods = ['get', 'post', 'put', 'patch', 'delete', 'head', 'options', 'trace'];
                foreach ($pathItem as $method => $operation) {
                    if (!in_array(strtolower($method), $validMethods)) {
                        $errors[] = [
                            'path' => "paths.{$path}.{$method}",
                            'message' => "Invalid HTTP method: {$method}",
                            'level' => 'warning',
                        ];
                    }

                    if (is_array($operation)) {
                        // Validate operation
                        if (isset($operation['responses']) && !is_array($operation['responses'])) {
                            $errors[] = [
                                'path' => "paths.{$path}.{$method}.responses",
                                'message' => 'Responses must be an object',
                                'level' => 'error',
                            ];
                        }

                        // Validate parameters
                        if (isset($operation['parameters']) && is_array($operation['parameters'])) {
                            foreach ($operation['parameters'] as $index => $param) {
                                if (!isset($param['name'])) {
                                    $errors[] = [
                                        'path' => "paths.{$path}.{$method}.parameters[{$index}]",
                                        'message' => 'Parameter must have a name',
                                        'level' => 'error',
                                    ];
                                }

                                if (!isset($param['in'])) {
                                    $errors[] = [
                                        'path' => "paths.{$path}.{$method}.parameters[{$index}]",
                                        'message' => 'Parameter must have an "in" field',
                                        'level' => 'error',
                                    ];
                                } elseif (!in_array($param['in'], ['query', 'header', 'path', 'cookie'])) {
                                    $errors[] = [
                                        'path' => "paths.{$path}.{$method}.parameters[{$index}].in",
                                        'message' => 'Parameter "in" must be one of: query, header, path, cookie',
                                        'level' => 'error',
                                    ];
                                }
                            }
                        }
                    }
                }
            }
        }

        // Validate components if present
        if (isset($schemaData['components']) && !is_array($schemaData['components'])) {
            $errors[] = [
                'path' => 'components',
                'message' => 'Components must be an object',
                'level' => 'error',
            ];
        }

        return [
            'valid' => empty($errors),
            'errors' => $errors,
        ];
    }
}
