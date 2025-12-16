<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Admin\UserController;
use App\Http\Controllers\Admin\SecurityLogController;
use App\Http\Controllers\Admin\DashboardController;

/*
|--------------------------------------------------------------------------
| Admin Routes
|--------------------------------------------------------------------------
|
| Routes cho admin panel, yêu cầu authentication và admin role
|
*/

Route::middleware(['auth:sanctum', 'admin'])->prefix('admin')->group(function () {
    // Dashboard
    Route::get('/dashboard/stats', [DashboardController::class, 'stats']);
    Route::get('/dashboard/recent-activity', [DashboardController::class, 'recentActivity']);
    Route::get('/dashboard/user-activity/{userId}', [DashboardController::class, 'userActivity']);

    // User Management
    Route::apiResource('users', UserController::class);
    Route::post('users/{id}/lock', [UserController::class, 'lock']);
    Route::post('users/{id}/unlock', [UserController::class, 'unlock']);
    Route::post('users/{id}/reset-password', [UserController::class, 'resetPassword']);
    Route::post('users/{id}/generate-token-file', [UserController::class, 'generateTokenFile']);

    // Security Logs
    Route::get('security-logs', [SecurityLogController::class, 'index']);
    Route::get('security-logs/{id}', [SecurityLogController::class, 'show']);
    Route::post('security-logs/export', [SecurityLogController::class, 'export']);
});
