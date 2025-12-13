<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\CollectionController;
use App\Http\Controllers\EnvironmentController;
use App\Http\Controllers\SchemaController;
use App\Http\Controllers\SyncController;

Route::middleware('api')->group(function () {
    // Auth routes
    Route::post('/auth/register', [AuthController::class, 'register']);
    Route::post('/auth/login', [AuthController::class, 'login']);
    
    // Protected routes
    Route::middleware('auth:sanctum')->group(function () {
        Route::get('/auth/user', [AuthController::class, 'user']);
        Route::post('/auth/logout', [AuthController::class, 'logout']);
        
        // Collections
        Route::apiResource('collections', CollectionController::class);
        Route::post('/collections/sync', [CollectionController::class, 'sync']);
        
        // Environments
        Route::apiResource('environments', EnvironmentController::class);
        Route::post('/environments/sync', [EnvironmentController::class, 'sync']);
        
        // Schemas
        Route::apiResource('schemas', SchemaController::class);
        Route::post('/schemas/sync', [SchemaController::class, 'sync']);
        
        // Sync operations
        Route::post('/sync', [SyncController::class, 'sync']);
    });
});

