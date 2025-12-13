<?php

return [
    /*
    |--------------------------------------------------------------------------
    | File Upload Configuration
    |--------------------------------------------------------------------------
    |
    | Cấu hình cho file uploads: allowed types, max size, storage location
    |
    */

    'allowed_types' => [
        'jpg',
        'jpeg',
        'png',
        'gif',
        'pdf',
        'txt',
        'json',
        'xml',
        'csv',
    ],

    'max_size' => 10485760, // 10MB in bytes

    'storage_location' => storage_path('app/uploads'),

    'store_outside_web_root' => true, // Store files outside web root for security

    /*
    |--------------------------------------------------------------------------
    | Virus Scanning
    |--------------------------------------------------------------------------
    |
    | Cấu hình virus scanning (nếu có)
    |
    */

    'virus_scanning' => [
        'enabled' => false,
        'service' => null, // 'clamav', 'custom', etc.
    ],
];
