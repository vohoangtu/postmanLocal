<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
        then: function () {
            Route::middleware('api')
                ->prefix('api')
                ->group(base_path('routes/admin.php'));
        },
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->api(prepend: [
            \Illuminate\Http\Middleware\HandleCors::class,
            \App\Http\Middleware\SecurityHeaders::class,
        ]);
        
        // Sanitize input cho API requests (trừ file uploads)
        $middleware->api(append: [
            \App\Http\Middleware\SanitizeInput::class,
        ]);

        // Admin middleware alias
        $middleware->alias([
            'admin' => \App\Http\Middleware\CheckAdmin::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        // Cấu hình xử lý AuthenticationException
        $exceptions->render(function (\Illuminate\Auth\AuthenticationException $e, $request) {
            // Luôn trả về JSON response cho API routes
            // Vì đây là API-only application, không có web login page
            return response()->json([
                'message' => 'Bạn chưa đăng nhập hoặc phiên đăng nhập đã hết hạn.',
                'error' => 'Unauthenticated',
            ], 401);
        });

        // Không expose sensitive information trong errors
        $exceptions->render(function (\Throwable $e, $request) {
            // Log detailed error
            \Illuminate\Support\Facades\Log::error('Exception occurred', [
                'message' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString(),
            ]);

            // Return generic error message cho users
            if ($request->expectsJson()) {
                $statusCode = method_exists($e, 'getStatusCode') ? $e->getStatusCode() : 500;
                
                // Get user-friendly message
                $userMessage = 'Đã xảy ra lỗi. Vui lòng thử lại sau.';
                if ($e instanceof \Illuminate\Validation\ValidationException) {
                    $userMessage = 'Dữ liệu không hợp lệ. Vui lòng kiểm tra lại.';
                } elseif ($e instanceof \Illuminate\Auth\Access\AuthorizationException) {
                    $userMessage = 'Bạn không có quyền thực hiện hành động này.';
                } elseif ($e instanceof \Symfony\Component\HttpKernel\Exception\NotFoundHttpException) {
                    $userMessage = 'Không tìm thấy tài nguyên.';
                }
                
                return response()->json([
                    'message' => $userMessage,
                    'error' => config('app.debug') ? $e->getMessage() : 'Internal Server Error',
                ], $statusCode);
            }
        });
    })->create();
