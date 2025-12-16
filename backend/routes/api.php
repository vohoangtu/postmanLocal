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
    // Auth routes với rate limiting
    Route::post('/auth/register', [AuthController::class, 'register'])
        ->middleware('throttle:register')
        ->name('register');
    Route::post('/auth/login', [AuthController::class, 'login'])
        ->middleware('throttle:login')
        ->name('login');
    Route::post('/auth/login-with-token-file', [AuthController::class, 'loginWithTokenFile'])
        ->middleware('throttle:login');
    Route::post('/auth/refresh', [AuthController::class, 'refresh']);
    Route::post('/auth/forgot-password', [AuthController::class, 'forgotPassword'])
        ->middleware('throttle:password_reset');
    Route::post('/auth/reset-password', [AuthController::class, 'resetPassword'])
        ->middleware('throttle:password_reset');
    
    // Protected routes
    Route::middleware('auth:sanctum')->group(function () {
        Route::get('/auth/user', [AuthController::class, 'user']);
        Route::post('/auth/logout', [AuthController::class, 'logout']);
        Route::post('/auth/revoke-all-tokens', [AuthController::class, 'revokeAllTokens']);
        
        // 2FA routes
        Route::post('/auth/2fa/enable', [AuthController::class, 'enable2FA']);
        Route::post('/auth/2fa/verify', [AuthController::class, 'verify2FA']);
        Route::post('/auth/2fa/disable', [AuthController::class, 'disable2FA']);
        Route::post('/auth/2fa/recovery-codes', [AuthController::class, 'generateRecoveryCodes']);
        
        // Collections
        Route::apiResource('collections', CollectionController::class);
        Route::post('/collections/sync', [CollectionController::class, 'sync']);
        Route::get('/collections/default', [CollectionController::class, 'getDefault']);
        Route::post('/collections/{id}/set-default', [CollectionController::class, 'setDefault']);
        
        // Collection Workspace Permissions
        Route::get('/collections/{collectionId}/workspaces/{workspaceId}/permissions', [\App\Http\Controllers\CollectionWorkspacePermissionController::class, 'index']);
        Route::put('/collections/{collectionId}/workspaces/{workspaceId}/permissions', [\App\Http\Controllers\CollectionWorkspacePermissionController::class, 'update']);
        Route::put('/collections/{collectionId}/workspaces/{workspaceId}/permissions/{userId}', [\App\Http\Controllers\CollectionWorkspacePermissionController::class, 'setUserPermission']);
        Route::delete('/collections/{collectionId}/workspaces/{workspaceId}/permissions/{userId}', [\App\Http\Controllers\CollectionWorkspacePermissionController::class, 'removeUserPermission']);
        
        // Environments
        Route::apiResource('environments', EnvironmentController::class);
        Route::post('/environments/sync', [EnvironmentController::class, 'sync']);
        
        // Workspace Environments
        Route::get('/workspaces/{workspaceId}/environments', [EnvironmentController::class, 'indexForWorkspace']);
        Route::post('/workspaces/{workspaceId}/environments', [EnvironmentController::class, 'storeForWorkspace']);
        
        // Schemas
        Route::apiResource('schemas', SchemaController::class);
        Route::post('/schemas/sync', [SchemaController::class, 'sync']);
        
        // Sync operations
        Route::post('/sync', [SyncController::class, 'sync']);
        
        // Workspaces
        Route::apiResource('workspaces', WorkspaceController::class);
        Route::post('/workspaces/{id}/invite', [WorkspaceController::class, 'invite']);
        Route::delete('/workspaces/{id}/members/{userId}', [WorkspaceController::class, 'removeMember']);
        Route::get('/workspaces/{id}/analytics', [WorkspaceController::class, 'getAnalytics']);
        Route::get('/workspaces/{id}/activities', [WorkspaceController::class, 'getActivities']);
        Route::get('/workspaces/{id}/templates', [CollectionController::class, 'getWorkspaceTemplates']);
        
        // API Documentation
        Route::get('/collections/{id}/documentation/preview', [\App\Http\Controllers\ApiDocumentationController::class, 'preview']);
        Route::get('/collections/{id}/documentation', [\App\Http\Controllers\ApiDocumentationController::class, 'generate']);
        Route::get('/workspaces/{id}/documentation', [\App\Http\Controllers\ApiDocumentationController::class, 'generateWorkspace']);
        
        // API Schemas
        Route::get('/workspaces/{id}/schemas', [SchemaController::class, 'getWorkspaceSchemas']);
        Route::post('/workspaces/{id}/schemas', [SchemaController::class, 'storeWorkspaceSchema']);
        Route::post('/schemas/{id}/validate', [SchemaController::class, 'validateSchema']);
        Route::post('/schemas/{id}/import-from-collection', [SchemaController::class, 'importFromCollection']);
        
        // API Versions
        Route::get('/schemas/{id}/versions', [\App\Http\Controllers\ApiVersionController::class, 'index']);
        Route::post('/schemas/{id}/versions', [\App\Http\Controllers\ApiVersionController::class, 'store']);
        Route::get('/versions/{id}/diff', [\App\Http\Controllers\ApiVersionController::class, 'diff']);
        Route::post('/versions/{id}/set-current', [\App\Http\Controllers\ApiVersionController::class, 'setCurrent']);
        
        // Mock Servers
        Route::get('/workspaces/{id}/mock-servers', [\App\Http\Controllers\MockServerController::class, 'index']);
        Route::post('/workspaces/{id}/mock-servers', [\App\Http\Controllers\MockServerController::class, 'store']);
        Route::get('/mock-servers/{id}', [\App\Http\Controllers\MockServerController::class, 'show']);
        Route::put('/mock-servers/{id}', [\App\Http\Controllers\MockServerController::class, 'update']);
        Route::delete('/mock-servers/{id}', [\App\Http\Controllers\MockServerController::class, 'destroy']);
        Route::post('/mock-servers/{id}/start', [\App\Http\Controllers\MockServerController::class, 'start']);
        Route::post('/mock-servers/{id}/stop', [\App\Http\Controllers\MockServerController::class, 'stop']);
        Route::get('/mock-servers/{id}/routes', [\App\Http\Controllers\MockServerController::class, 'getRoutes']);
        
        // API Test Suites
        Route::get('/workspaces/{id}/test-suites', [\App\Http\Controllers\ApiTestController::class, 'index']);
        Route::post('/workspaces/{id}/test-suites', [\App\Http\Controllers\ApiTestController::class, 'store']);
        Route::get('/test-suites/{id}', [\App\Http\Controllers\ApiTestController::class, 'show']);
        Route::put('/test-suites/{id}', [\App\Http\Controllers\ApiTestController::class, 'update']);
        Route::delete('/test-suites/{id}', [\App\Http\Controllers\ApiTestController::class, 'destroy']);
        Route::post('/test-suites/{id}/run', [\App\Http\Controllers\ApiTestController::class, 'run']);
        Route::post('/test-suites/{id}/contract-test', [\App\Http\Controllers\ApiTestController::class, 'contractTest']);
        
        // API Templates
        Route::get('/api-templates', [\App\Http\Controllers\ApiTemplateController::class, 'index']);
        Route::get('/api-templates/{id}', [\App\Http\Controllers\ApiTemplateController::class, 'show']);
        Route::post('/workspaces/{id}/schemas/from-template', [\App\Http\Controllers\ApiTemplateController::class, 'createFromTemplate']);
        
        // API Design Reviews
        Route::post('/schemas/{id}/request-review', [\App\Http\Controllers\ApiDesignReviewController::class, 'requestReview']);
        Route::get('/workspaces/{id}/design-reviews', [\App\Http\Controllers\ApiDesignReviewController::class, 'index']);
        Route::post('/design-reviews/{id}/approve', [\App\Http\Controllers\ApiDesignReviewController::class, 'approve']);
        Route::post('/design-reviews/{id}/reject', [\App\Http\Controllers\ApiDesignReviewController::class, 'reject']);
        Route::post('/design-reviews/{id}/request-changes', [\App\Http\Controllers\ApiDesignReviewController::class, 'requestChanges']);
        
        // Tasks
        Route::get('/workspaces/{id}/tasks', [\App\Http\Controllers\TaskController::class, 'index']);
        Route::post('/workspaces/{id}/tasks', [\App\Http\Controllers\TaskController::class, 'store']);
        Route::put('/tasks/{id}', [\App\Http\Controllers\TaskController::class, 'update']);
        Route::delete('/tasks/{id}', [\App\Http\Controllers\TaskController::class, 'destroy']);
        Route::post('/tasks/{id}/assign', [\App\Http\Controllers\TaskController::class, 'assign']);
        Route::post('/tasks/{id}/complete', [\App\Http\Controllers\TaskController::class, 'complete']);
        
        // Discussions
        Route::get('/workspaces/{id}/discussions', [\App\Http\Controllers\DiscussionController::class, 'index']);
        Route::post('/workspaces/{id}/discussions', [\App\Http\Controllers\DiscussionController::class, 'store']);
        Route::get('/discussions/{id}', [\App\Http\Controllers\DiscussionController::class, 'show']);
        Route::put('/discussions/{id}', [\App\Http\Controllers\DiscussionController::class, 'update']);
        Route::delete('/discussions/{id}', [\App\Http\Controllers\DiscussionController::class, 'destroy']);
        Route::post('/discussions/{id}/replies', [\App\Http\Controllers\DiscussionController::class, 'addReply']);
        Route::post('/discussions/{id}/resolve', [\App\Http\Controllers\DiscussionController::class, 'resolve']);
        Route::post('/discussions/{id}/unresolve', [\App\Http\Controllers\DiscussionController::class, 'unresolve']);
        
        // Discussions
        Route::get('/workspaces/{id}/discussions', [\App\Http\Controllers\DiscussionController::class, 'index']);
        Route::post('/workspaces/{id}/discussions', [\App\Http\Controllers\DiscussionController::class, 'store']);
        Route::get('/discussions/{id}', [\App\Http\Controllers\DiscussionController::class, 'show']);
        Route::put('/discussions/{id}', [\App\Http\Controllers\DiscussionController::class, 'update']);
        Route::delete('/discussions/{id}', [\App\Http\Controllers\DiscussionController::class, 'destroy']);
        Route::post('/discussions/{id}/replies', [\App\Http\Controllers\DiscussionController::class, 'addReply']);
        Route::post('/discussions/{id}/resolve', [\App\Http\Controllers\DiscussionController::class, 'resolve']);
        
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
        
        // Request Reviews
        Route::get('/collections/{collectionId}/reviews', [\App\Http\Controllers\RequestReviewController::class, 'index']);
        Route::post('/requests/{requestId}/reviews', [\App\Http\Controllers\RequestReviewController::class, 'store']);
        Route::put('/reviews/{id}', [\App\Http\Controllers\RequestReviewController::class, 'update']);
        Route::post('/reviews/{id}/approve', [\App\Http\Controllers\RequestReviewController::class, 'approve']);
        Route::post('/reviews/{id}/reject', [\App\Http\Controllers\RequestReviewController::class, 'reject']);
        Route::post('/reviews/{id}/request-changes', [\App\Http\Controllers\RequestReviewController::class, 'requestChanges']);
        Route::delete('/reviews/{id}', [\App\Http\Controllers\RequestReviewController::class, 'destroy']);
        Route::get('/workspaces/{id}/reviews', [\App\Http\Controllers\RequestReviewController::class, 'getWorkspaceReviews']);
        
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
        
        // User Panel routes
        Route::prefix('user')->group(function () {
            Route::get('profile', [\App\Http\Controllers\User\ProfileController::class, 'show']);
            Route::put('profile', [\App\Http\Controllers\User\ProfileController::class, 'update']);
            Route::put('password', [\App\Http\Controllers\User\ProfileController::class, 'updatePassword']);
            Route::get('preferences', [\App\Http\Controllers\User\ProfileController::class, 'getPreferences']);
            Route::put('preferences', [\App\Http\Controllers\User\ProfileController::class, 'updatePreferences']);
            
            // Onboarding routes
            Route::get('onboarding', [\App\Http\Controllers\User\OnboardingController::class, 'index']);
            Route::post('onboarding/complete-step', [\App\Http\Controllers\User\OnboardingController::class, 'completeStep']);
            Route::post('onboarding/complete', [\App\Http\Controllers\User\OnboardingController::class, 'complete']);
            Route::post('onboarding/reset', [\App\Http\Controllers\User\OnboardingController::class, 'reset']);
        });
    });
});

