<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use App\Models\Workspace;
use App\Services\PermissionService;
use Illuminate\Support\Facades\Auth;

class CheckWorkspacePermission
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
    public function handle(Request $request, Closure $next, string $requiredRole = 'member'): Response
    {
        $user = Auth::user();
        if (!$user) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        $workspaceId = $request->route('id') ?? $request->route('workspace');
        if (!$workspaceId) {
            return response()->json(['message' => 'Workspace not found'], 404);
        }

        $workspace = Workspace::find($workspaceId);
        if (!$workspace) {
            return response()->json(['message' => 'Workspace not found'], 404);
        }

        if (!$this->permissionService->hasWorkspacePermission($workspace, $user, $requiredRole)) {
            return response()->json(['message' => 'Insufficient permissions'], 403);
        }

        return $next($request);
    }
}
