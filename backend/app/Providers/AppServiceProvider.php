<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Support\Facades\RateLimiter;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Đăng ký rate limiters tùy chỉnh
        $this->configureRateLimiters();
    }

    /**
     * Cấu hình rate limiters
     */
    protected function configureRateLimiters(): void
    {
        $limits = config('rate-limiter.limits', []);

        // Login rate limiter
        RateLimiter::for('login', function ($request) use ($limits) {
            $config = $limits['login'] ?? ['max_attempts' => 5, 'decay_minutes' => 1];
            return Limit::perMinutes($config['decay_minutes'], $config['max_attempts'])
                ->by($request->ip());
        });

        // Register rate limiter
        RateLimiter::for('register', function ($request) use ($limits) {
            $config = $limits['register'] ?? ['max_attempts' => 3, 'decay_minutes' => 60];
            return Limit::perMinutes($config['decay_minutes'], $config['max_attempts'])
                ->by($request->ip());
        });

        // Password reset rate limiter
        RateLimiter::for('password_reset', function ($request) use ($limits) {
            $config = $limits['password_reset'] ?? ['max_attempts' => 3, 'decay_minutes' => 60];
            return Limit::perMinutes($config['decay_minutes'], $config['max_attempts'])
                ->by($request->ip());
        });

        // API rate limiter
        RateLimiter::for('api', function ($request) use ($limits) {
            $config = $limits['api'] ?? ['max_attempts' => 60, 'decay_minutes' => 1];
            $key = $request->user()?->id ?? $request->ip();
            return Limit::perMinutes($config['decay_minutes'], $config['max_attempts'])
                ->by($key);
        });

        // General rate limiter
        RateLimiter::for('general', function ($request) use ($limits) {
            $config = $limits['general'] ?? ['max_attempts' => 100, 'decay_minutes' => 1];
            $key = $request->user()?->id ?? $request->ip();
            return Limit::perMinutes($config['decay_minutes'], $config['max_attempts'])
                ->by($key);
        });
    }
}
