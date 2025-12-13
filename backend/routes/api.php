<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\CollectionController;
use App\Http\Controllers\EnvironmentController;
use App\Http\Controllers\SchemaController;
use App\Http\Controllers\SyncController;
use App\Http\Controllers\WorkspaceController;

Route::middleware('api')->group(function () {
    // Auth routes
    Route::post('/auth/register', [AuthController::class, 'register']);
    Route::post('/auth/login', [AuthController::class, 'login']);
    Route::post('/auth/refresh', [AuthController::class, 'refresh']);
    
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
        
        // Workspaces
        Route::apiResource('workspaces', WorkspaceController::class);
        Route::post('/workspaces/{id}/invite', [WorkspaceController::class, 'invite']);
        Route::delete('/workspaces/{id}/members/{userId}', [WorkspaceController::class, 'removeMember']);
        
        // Collection sharing
        Route::post('/collections/{id}/share', [CollectionController::class, 'share']);
        Route::get('/collections/shared', [CollectionController::class, 'shared']);
        Route::put('/collections/{id}/permission', [CollectionController::class, 'updatePermission']);
        Route::delete('/collections/{id}/share/{shareId}', [CollectionController::class, 'unshare']);
        
        // Comments
        Route::get('/collections/{id}/comments', [\App\Http\Controllers\CommentController::class, 'index']);
        Route::post('/collections/{id}/comments', [\App\Http\Controllers\CommentController::class, 'store']);
        Route::put('/comments/{id}', [\App\Http\Controllers\CommentController::class, 'update']);
        Route::delete('/comments/{id}', [\App\Http\Controllers\CommentController::class, 'destroy']);
        
        // Annotations
        Route::get('/requests/{id}/annotations', [\App\Http\Controllers\AnnotationController::class, 'index']);
        Route::post('/requests/{id}/annotations', [\App\Http\Controllers\AnnotationController::class, 'store']);
        Route::delete('/annotations/{id}', [\App\Http\Controllers\AnnotationController::class, 'destroy']);
        
        // Collection Versions
        Route::get('/collections/{id}/versions', [CollectionController::class, 'versions']);
        Route::post('/collections/{id}/versions', [CollectionController::class, 'createVersion']);
        Route::get('/collections/{id}/versions/{versionId}', [CollectionController::class, 'getVersion']);
        Route::post('/collections/{id}/restore/{versionId}', [CollectionController::class, 'restoreVersion']);
        
        // Templates
        Route::get('/templates', [\App\Http\Controllers\TemplateController::class, 'index']);
        Route::post('/collections/{id}/publish-template', [\App\Http\Controllers\TemplateController::class, 'publishTemplate']);
        Route::post('/templates/{id}/use', [\App\Http\Controllers\TemplateController::class, 'useTemplate']);
        
        // Activity Logs
        Route::get('/activities', [\App\Http\Controllers\ActivityController::class, 'index']);
        Route::get('/workspaces/{id}/activities', [\App\Http\Controllers\ActivityController::class, 'index']);
        Route::get('/collections/{id}/activities', [\App\Http\Controllers\ActivityController::class, 'collectionActivities']);
        
        // Notifications
        Route::get('/notifications', [\App\Http\Controllers\NotificationController::class, 'index']);
        Route::get('/notifications/unread', [\App\Http\Controllers\NotificationController::class, 'unread']);
        Route::put('/notifications/{id}/read', [\App\Http\Controllers\NotificationController::class, 'markAsRead']);
        Route::put('/notifications/read-all', [\App\Http\Controllers\NotificationController::class, 'markAllAsRead']);
    });
});

