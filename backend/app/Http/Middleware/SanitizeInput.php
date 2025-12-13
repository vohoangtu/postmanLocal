<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Sanitize input middleware
 * Sanitize user input để prevent XSS và injection attacks
 */
class SanitizeInput
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Sanitize request input
        $input = $request->all();
        $sanitized = $this->sanitizeArray($input);
        
        // Replace request input với sanitized data
        $request->merge($sanitized);

        return $next($request);
    }

    /**
     * Recursively sanitize array
     */
    private function sanitizeArray(array $data): array
    {
        $sanitized = [];
        
        foreach ($data as $key => $value) {
            if (is_array($value)) {
                $sanitized[$key] = $this->sanitizeArray($value);
            } elseif (is_string($value)) {
                // Sanitize string - strip tags và escape special characters
                $sanitized[$key] = $this->sanitizeString($value);
            } else {
                $sanitized[$key] = $value;
            }
        }
        
        return $sanitized;
    }

    /**
     * Sanitize string
     */
    private function sanitizeString(string $value): string
    {
        // Strip HTML tags
        $value = strip_tags($value);
        
        // Escape special characters
        $value = htmlspecialchars($value, ENT_QUOTES, 'UTF-8');
        
        return $value;
    }
}
