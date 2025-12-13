<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use App\Models\Collection;
use App\Services\PermissionService;
use Illuminate\Support\Facades\Auth;

class CheckCollectionPermission
{
    protected $permissionService;

    public function __construct(PermissionService $permissionService)
    {
        $this->permissionService = $permissionService;
    }

    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next, string $permission = 'read'): Response
    {
        $user = Auth::user();
        if (!$user) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        $collectionId = $request->route('id') ?? $request->route('collection');
        if (!$collectionId) {
            return response()->json(['message' => 'Collection not found'], 404);
        }

        $collection = Collection::find($collectionId);
        if (!$collection) {
            return response()->json(['message' => 'Collection not found'], 404);
        }

        $hasPermission = false;
        switch ($permission) {
            case 'read':
                $hasPermission = $this->permissionService->canRead($collection, $user);
                break;
            case 'write':
                $hasPermission = $this->permissionService->canWrite($collection, $user);
                break;
            case 'admin':
                $hasPermission = $this->permissionService->canAdmin($collection, $user);
                break;
        }

        if (!$hasPermission) {
            return response()->json(['message' => 'Insufficient permissions'], 403);
        }

        return $next($request);
    }
}
