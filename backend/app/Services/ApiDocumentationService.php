<?php

namespace App\Services;

use App\Models\Collection;

class ApiDocumentationService
{
    /**
     * Generate Markdown documentation for a collection
     */
    public function generateMarkdown(Collection $collection): string
    {
        $requests = $collection->data['requests'] ?? [];
        
        $markdown = "# {$collection->name}\n\n";
        
        if ($collection->description) {
            $markdown .= "{$collection->description}\n\n";
        }
        
        $markdown .= "---\n\n";
        
        foreach ($requests as $request) {
            $markdown .= "## {$request['name']}\n\n";
            $markdown .= "**Method:** `{$request['method']}`\n\n";
            $markdown .= "**URL:** `{$request['url']}`\n\n";
            
            if (!empty($request['queryParams'])) {
                $markdown .= "### Query Parameters\n\n";
                $markdown .= "| Parameter | Type | Required | Description |\n";
                $markdown .= "|-----------|------|----------|-------------|\n";
                foreach ($request['queryParams'] as $param) {
                    $enabled = $param['enabled'] ?? true;
                    $markdown .= "| {$param['key']} | string | " . ($enabled ? 'Yes' : 'No') . " | |\n";
                }
                $markdown .= "\n";
            }
            
            if (!empty($request['headers'])) {
                $markdown .= "### Headers\n\n";
                $markdown .= "| Header | Value |\n";
                $markdown .= "|--------|-------|\n";
                foreach ($request['headers'] as $key => $value) {
                    $markdown .= "| {$key} | {$value} |\n";
                }
                $markdown .= "\n";
            }
            
            if (!empty($request['body'])) {
                $markdown .= "### Request Body\n\n";
                $markdown .= "```json\n";
                $markdown .= $request['body'] . "\n";
                $markdown .= "```\n\n";
            }
            
            $markdown .= "---\n\n";
        }
        
        return $markdown;
    }

    /**
     * Generate HTML documentation for a collection
     */
    public function generateHTML(Collection $collection): string
    {
        $requests = $collection->data['requests'] ?? [];
        
        $html = "<!DOCTYPE html>\n<html>\n<head>\n";
        $html .= "<meta charset='UTF-8'>\n";
        $html .= "<title>{$collection->name} - API Documentation</title>\n";
        $html .= "<style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 1200px; margin: 0 auto; padding: 20px; line-height: 1.6; }
            h1 { color: #2563eb; border-bottom: 2px solid #2563eb; padding-bottom: 10px; }
            h2 { color: #1e40af; margin-top: 30px; }
            h3 { color: #3b82f6; }
            code { background: #f3f4f6; padding: 2px 6px; border-radius: 4px; font-family: 'Courier New', monospace; }
            pre { background: #1f2937; color: #f9fafb; padding: 15px; border-radius: 8px; overflow-x: auto; }
            table { border-collapse: collapse; width: 100%; margin: 15px 0; }
            th, td { border: 1px solid #e5e7eb; padding: 8px 12px; text-align: left; }
            th { background: #f9fafb; font-weight: 600; }
            .method-badge { display: inline-block; padding: 4px 8px; border-radius: 4px; font-weight: 600; font-size: 12px; }
            .method-GET { background: #10b981; color: white; }
            .method-POST { background: #3b82f6; color: white; }
            .method-PUT { background: #f59e0b; color: white; }
            .method-DELETE { background: #ef4444; color: white; }
            .method-PATCH { background: #8b5cf6; color: white; }
        </style>\n";
        $html .= "</head>\n<body>\n";
        
        $html .= "<h1>{$collection->name}</h1>\n";
        
        if ($collection->description) {
            $html .= "<p>{$collection->description}</p>\n";
        }
        
        $html .= "<hr>\n";
        
        foreach ($requests as $request) {
            $method = strtoupper($request['method'] ?? 'GET');
            $html .= "<h2>{$request['name']}</h2>\n";
            $html .= "<span class='method-badge method-{$method}'>{$method}</span>\n";
            $html .= "<p><strong>URL:</strong> <code>{$request['url']}</code></p>\n";
            
            if (!empty($request['queryParams'])) {
                $html .= "<h3>Query Parameters</h3>\n";
                $html .= "<table>\n<thead><tr><th>Parameter</th><th>Type</th><th>Required</th><th>Description</th></tr></thead>\n<tbody>\n";
                foreach ($request['queryParams'] as $param) {
                    $enabled = $param['enabled'] ?? true;
                    $html .= "<tr><td>{$param['key']}</td><td>string</td><td>" . ($enabled ? 'Yes' : 'No') . "</td><td></td></tr>\n";
                }
                $html .= "</tbody>\n</table>\n";
            }
            
            if (!empty($request['headers'])) {
                $html .= "<h3>Headers</h3>\n";
                $html .= "<table>\n<thead><tr><th>Header</th><th>Value</th></tr></thead>\n<tbody>\n";
                foreach ($request['headers'] as $key => $value) {
                    $html .= "<tr><td>{$key}</td><td>{$value}</td></tr>\n";
                }
                $html .= "</tbody>\n</table>\n";
            }
            
            if (!empty($request['body'])) {
                $html .= "<h3>Request Body</h3>\n<pre><code>";
                $html .= htmlspecialchars($request['body']);
                $html .= "</code></pre>\n";
            }
            
            $html .= "<hr>\n";
        }
        
        $html .= "</body>\n</html>";
        
        return $html;
    }

    /**
     * Generate OpenAPI 3.0 documentation for a collection
     */
    public function generateOpenAPI(Collection $collection): array
    {
        $requests = $collection->data['requests'] ?? [];
        
        $openApi = [
            'openapi' => '3.0.0',
            'info' => [
                'title' => $collection->name,
                'description' => $collection->description ?? '',
                'version' => '1.0.0',
            ],
            'paths' => [],
        ];
        
        foreach ($requests as $request) {
            try {
                $urlObj = parse_url($request['url']);
                $path = $urlObj['path'] ?? '/';
                $method = strtolower($request['method'] ?? 'get');
                
                if (!isset($openApi['paths'][$path])) {
                    $openApi['paths'][$path] = [];
                }
                
                $operation = [
                    'summary' => $request['name'],
                    'description' => $request['name'],
                    'responses' => [
                        '200' => [
                            'description' => 'Successful response',
                            'content' => [
                                'application/json' => [
                                    'schema' => [
                                        'type' => 'object',
                                    ],
                                ],
                            ],
                        ],
                    ],
                ];
                
                // Add query parameters
                if (!empty($request['queryParams'])) {
                    $operation['parameters'] = [];
                    foreach ($request['queryParams'] as $param) {
                        if ($param['enabled'] ?? true) {
                            $operation['parameters'][] = [
                                'name' => $param['key'],
                                'in' => 'query',
                                'required' => false,
                                'schema' => [
                                    'type' => 'string',
                                ],
                            ];
                        }
                    }
                }
                
                // Add request body
                if (!empty($request['body']) && in_array($method, ['post', 'put', 'patch'])) {
                    $operation['requestBody'] = [
                        'content' => [
                            'application/json' => [
                                'schema' => [
                                    'type' => 'object',
                                ],
                                'example' => json_decode($request['body'], true) ?? $request['body'],
                            ],
                        ],
                    ];
                }
                
                $openApi['paths'][$path][$method] = $operation;
            } catch (\Exception $e) {
                // Skip invalid URLs
                continue;
            }
        }
        
        return $openApi;
    }

    /**
     * Generate documentation for all collections in a workspace
     */
    public function generateWorkspaceDocumentation(int $workspaceId, string $format = 'markdown'): string
    {
        $collections = Collection::where('workspace_id', $workspaceId)->get();
        
        if ($format === 'markdown') {
            $markdown = "# Workspace API Documentation\n\n";
            $markdown .= "Generated: " . now()->toDateTimeString() . "\n\n";
            $markdown .= "---\n\n";
            
            foreach ($collections as $collection) {
                $markdown .= $this->generateMarkdown($collection);
                $markdown .= "\n\n";
            }
            
            return $markdown;
        } elseif ($format === 'openapi') {
            $openApi = [
                'openapi' => '3.0.0',
                'info' => [
                    'title' => 'Workspace API Documentation',
                    'description' => 'Combined API documentation for all collections',
                    'version' => '1.0.0',
                ],
                'paths' => [],
            ];
            
            foreach ($collections as $collection) {
                $collectionOpenApi = $this->generateOpenAPI($collection);
                $openApi['paths'] = array_merge($openApi['paths'], $collectionOpenApi['paths']);
            }
            
            return json_encode($openApi, JSON_PRETTY_PRINT);
        } else {
            // HTML
            $html = "<!DOCTYPE html>\n<html>\n<head>\n";
            $html .= "<meta charset='UTF-8'>\n";
            $html .= "<title>Workspace API Documentation</title>\n";
            $html .= "<style>
                body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 1200px; margin: 0 auto; padding: 20px; line-height: 1.6; }
                h1 { color: #2563eb; border-bottom: 2px solid #2563eb; padding-bottom: 10px; }
                h2 { color: #1e40af; margin-top: 30px; }
                .collection-section { margin: 40px 0; padding: 20px; border: 2px solid #e5e7eb; border-radius: 8px; }
            </style>\n";
            $html .= "</head>\n<body>\n";
            $html .= "<h1>Workspace API Documentation</h1>\n";
            $html .= "<p>Generated: " . now()->toDateTimeString() . "</p>\n<hr>\n";
            
            foreach ($collections as $collection) {
                $html .= "<div class='collection-section'>\n";
                $html .= $this->generateHTML($collection);
                $html .= "</div>\n";
            }
            
            $html .= "</body>\n</html>";
            
            return $html;
        }
    }
}
