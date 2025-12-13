<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Symfony\Component\HttpFoundation\Response;

/**
 * Verify Request Signature Middleware
 * Verify request signatures để prevent tampering
 */
class VerifyRequestSignature
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Chỉ verify nếu có signature header
        if (!$request->hasHeader('X-Request-Signature')) {
            return $next($request);
        }

        $signature = $request->header('X-Request-Signature');
        $timestamp = $request->header('X-Request-Timestamp');

        if (!$timestamp) {
            return response()->json(['message' => 'Missing timestamp'], 400);
        }

        // Check timestamp để prevent replay attacks
        $maxAge = 300; // 5 minutes
        if (abs(time() - (int)$timestamp) > $maxAge) {
            return response()->json(['message' => 'Request expired'], 400);
        }

        // Get secret key (có thể từ config hoặc user-specific)
        $secret = config('app.request_signing_secret');
        
        if (!$secret) {
            // Nếu không có secret, skip verification
            return $next($request);
        }

        // Generate expected signature
        $method = $request->method();
        $path = $request->path() . ($request->getQueryString() ? '?' . $request->getQueryString() : '');
        $body = $request->getContent();
        
        $message = "{$method}\n{$path}\n{$body}\n{$timestamp}";
        $expectedSignature = hash_hmac('sha256', $message, $secret);

        // Verify signature
        if (!hash_equals($expectedSignature, $signature)) {
            return response()->json(['message' => 'Invalid request signature'], 400);
        }

        return $next($request);
    }
}
