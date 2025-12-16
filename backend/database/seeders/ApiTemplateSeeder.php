<?php

namespace Database\Seeders;

use App\Models\ApiTemplate;
use Illuminate\Database\Seeder;

class ApiTemplateSeeder extends Seeder
{
    /**
     * Seed API templates
     */
    public function run(): void
    {
        // REST API Template
        ApiTemplate::create([
            'name' => 'REST API - Basic CRUD',
            'category' => 'REST',
            'description' => 'Basic REST API template with CRUD operations',
            'is_public' => true,
            'template_data' => [
                'openapi' => '3.0.0',
                'info' => [
                    'title' => 'REST API',
                    'version' => '1.0.0',
                    'description' => 'Basic REST API with CRUD operations',
                ],
                'paths' => [
                    '/api/v1/resources' => [
                        'get' => [
                            'summary' => 'List resources',
                            'responses' => [
                                '200' => [
                                    'description' => 'List of resources',
                                    'content' => [
                                        'application/json' => [
                                            'schema' => [
                                                'type' => 'array',
                                                'items' => ['type' => 'object'],
                                            ],
                                        ],
                                    ],
                                ],
                            ],
                        ],
                        'post' => [
                            'summary' => 'Create resource',
                            'requestBody' => [
                                'content' => [
                                    'application/json' => [
                                        'schema' => ['type' => 'object'],
                                    ],
                                ],
                            ],
                            'responses' => [
                                '201' => [
                                    'description' => 'Resource created',
                                ],
                            ],
                        ],
                    ],
                    '/api/v1/resources/{id}' => [
                        'get' => [
                            'summary' => 'Get resource',
                            'parameters' => [
                                [
                                    'name' => 'id',
                                    'in' => 'path',
                                    'required' => true,
                                    'schema' => ['type' => 'string'],
                                ],
                            ],
                            'responses' => [
                                '200' => [
                                    'description' => 'Resource details',
                                ],
                            ],
                        ],
                        'put' => [
                            'summary' => 'Update resource',
                            'parameters' => [
                                [
                                    'name' => 'id',
                                    'in' => 'path',
                                    'required' => true,
                                    'schema' => ['type' => 'string'],
                                ],
                            ],
                            'requestBody' => [
                                'content' => [
                                    'application/json' => [
                                        'schema' => ['type' => 'object'],
                                    ],
                                ],
                            ],
                            'responses' => [
                                '200' => [
                                    'description' => 'Resource updated',
                                ],
                            ],
                        ],
                        'delete' => [
                            'summary' => 'Delete resource',
                            'parameters' => [
                                [
                                    'name' => 'id',
                                    'in' => 'path',
                                    'required' => true,
                                    'schema' => ['type' => 'string'],
                                ],
                            ],
                            'responses' => [
                                '204' => [
                                    'description' => 'Resource deleted',
                                ],
                            ],
                        ],
                    ],
                ],
            ],
        ]);

        // GraphQL Template
        ApiTemplate::create([
            'name' => 'GraphQL API',
            'category' => 'GraphQL',
            'description' => 'Basic GraphQL API template',
            'is_public' => true,
            'template_data' => [
                'openapi' => '3.0.0',
                'info' => [
                    'title' => 'GraphQL API',
                    'version' => '1.0.0',
                    'description' => 'GraphQL API endpoint',
                ],
                'paths' => [
                    '/graphql' => [
                        'post' => [
                            'summary' => 'GraphQL Query',
                            'requestBody' => [
                                'content' => [
                                    'application/json' => [
                                        'schema' => [
                                            'type' => 'object',
                                            'properties' => [
                                                'query' => ['type' => 'string'],
                                                'variables' => ['type' => 'object'],
                                            ],
                                        ],
                                    ],
                                ],
                            ],
                            'responses' => [
                                '200' => [
                                    'description' => 'GraphQL response',
                                ],
                            ],
                        ],
                    ],
                ],
            ],
        ]);
    }
}
