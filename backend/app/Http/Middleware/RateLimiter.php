<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpFoundation\Response;

/**
 * Rate Limiter Middleware
 * Giới hạn số lượng requests từ một IP hoặc user trong một khoảng thời gian
 */
class RateLimiter
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next, string $limitType = 'general'): Response
    {
        $config = config("rate-limiter.limits.{$limitType}", config('rate-limiter.limits.general'));
        
        $maxAttempts = $config['max_attempts'] ?? 100;
        $decayMinutes = $config['decay_minutes'] ?? 1;

        // Tạo key dựa trên IP và user (nếu có)
        $key = $this->resolveRequestSignature($request, $limitType);

        // Kiểm tra rate limit
        if (RateLimiter::tooManyAttempts($key, $maxAttempts)) {
            $seconds = RateLimiter::availableIn($key);
            
            Log::warning('Rate limit exceeded', [
                'ip' => $request->ip(),
                'user_id' => $request->user()?->id,
                'limit_type' => $limitType,
                'retry_after' => $seconds,
            ]);

            return response()->json([
                'message' => 'Quá nhiều requests. Vui lòng thử lại sau.',
                'retry_after' => $seconds,
            ], 429)->withHeaders([
                'X-RateLimit-Limit' => $maxAttempts,
                'X-RateLimit-Remaining' => 0,
                'X-RateLimit-Reset' => now()->addSeconds($seconds)->getTimestamp(),
                'Retry-After' => $seconds,
            ]);
        }

        // Tăng số lượng attempts
        RateLimiter::hit($key, $decayMinutes * 60);

        // Lấy số lượng attempts còn lại
        $remaining = $maxAttempts - RateLimiter::attempts($key);

        $response = $next($request);

        // Thêm rate limit headers vào response
        return $response->withHeaders([
            'X-RateLimit-Limit' => $maxAttempts,
            'X-RateLimit-Remaining' => max(0, $remaining),
            'X-RateLimit-Reset' => now()->addMinutes($decayMinutes)->getTimestamp(),
        ]);
    }

    /**
     * Tạo key duy nhất cho request dựa trên IP và user ID
     */
    protected function resolveRequestSignature(Request $request, string $limitType): string
    {
        $prefix = config('rate-limiter.key_prefix', 'rate_limit:');
        $ip = $request->ip();
        $userId = $request->user()?->id ?? 'guest';
        
        return "{$prefix}{$limitType}:{$ip}:{$userId}";
    }
}
