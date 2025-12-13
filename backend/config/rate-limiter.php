<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Rate Limiter Configuration
    |--------------------------------------------------------------------------
    |
    | Cấu hình rate limiting cho các endpoints khác nhau.
    | Format: 'max_attempts' => số lần request tối đa trong 'decay_minutes' phút
    |
    */

    'limits' => [
        // Login endpoints: 5 requests/minute
        'login' => [
            'max_attempts' => 5,
            'decay_minutes' => 1,
        ],

        // Register endpoints: 3 requests/hour
        'register' => [
            'max_attempts' => 3,
            'decay_minutes' => 60,
        ],

        // Password reset: 3 requests/hour
        'password_reset' => [
            'max_attempts' => 3,
            'decay_minutes' => 60,
        ],

        // API endpoints: 60 requests/minute
        'api' => [
            'max_attempts' => 60,
            'decay_minutes' => 1,
        ],

        // General endpoints: 100 requests/minute
        'general' => [
            'max_attempts' => 100,
            'decay_minutes' => 1,
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Rate Limiter Keys
    |--------------------------------------------------------------------------
    |
    | Định nghĩa cách tạo key cho rate limiting.
    | Có thể dựa trên IP, user ID, hoặc kết hợp cả hai.
    |
    */

    'key_prefix' => 'rate_limit:',
];
