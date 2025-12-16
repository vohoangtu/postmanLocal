<?php

namespace App\Http\Controllers;

use App\Models\Collection;
use App\Models\CollectionWorkspacePermission;
use App\Models\Workspace;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;

class CollectionWorkspacePermissionController extends BaseController
{
    /**
     * Get permissions for a collection in workspace
     */
    public function index(Request $request, string $collectionId, string $workspaceId)
    {
        // Check if user has access to workspace
        $workspace = Workspace::where('owner_id', Auth::id())
            ->orWhereHas('teamMembers', function ($query) {
                $query->where('user_id', Auth::id());
            })
            ->findOrFail($workspaceId);

        // Check if collection belongs to workspace
        $collection = Collection::where('workspace_id', $workspaceId)
            ->findOrFail($collectionId);

        // Check if user can manage permissions (owner or admin)
        $isOwner = $workspace->owner_id === Auth::id();
        $isAdmin = $workspace->teamMembers()
            ->where('user_id', Auth::id())
            ->whereIn('role', ['owner', 'admin'])
            ->exists();

        if (!$isOwner && !$isAdmin && $collection->user_id !== Auth::id()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $permissions = CollectionWorkspacePermission::where('collection_id', $collectionId)
            ->where('workspace_id', $workspaceId)
            ->with('user')
            ->get();

        return response()->json($permissions);
    }

    /**
     * Update permissions for a collection in workspace
     */
    public function update(Request $request, string $collectionId, string $workspaceId)
    {
        // Check if user has access to workspace
        $workspace = Workspace::where('owner_id', Auth::id())
            ->orWhereHas('teamMembers', function ($query) {
                $query->where('user_id', Auth::id());
            })
            ->findOrFail($workspaceId);

        // Check if collection belongs to workspace
        $collection = Collection::where('workspace_id', $workspaceId)
            ->findOrFail($collectionId);

        // Check if user can manage permissions (owner or admin)
        $isOwner = $workspace->owner_id === Auth::id();
        $isAdmin = $workspace->teamMembers()
            ->where('user_id', Auth::id())
            ->whereIn('role', ['owner', 'admin'])
            ->exists();

        if (!$isOwner && !$isAdmin && $collection->user_id !== Auth::id()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $request->validate([
            'permissions' => 'required|array',
            'permissions.*.user_id' => 'required|exists:users,id',
            'permissions.*.permission' => 'required|in:read,write,admin',
        ]);

        DB::transaction(function () use ($collectionId, $workspaceId, $request) {
            // Delete existing permissions
            CollectionWorkspacePermission::where('collection_id', $collectionId)
                ->where('workspace_id', $workspaceId)
                ->delete();

            // Create new permissions
            foreach ($request->permissions as $perm) {
                CollectionWorkspacePermission::create([
                    'collection_id' => $collectionId,
                    'workspace_id' => $workspaceId,
                    'user_id' => $perm['user_id'],
                    'permission' => $perm['permission'],
                ]);
            }
        });

        // Invalidate cache
        Cache::forget($this->getUserCacheKey('collections', Auth::id()));

        $permissions = CollectionWorkspacePermission::where('collection_id', $collectionId)
            ->where('workspace_id', $workspaceId)
            ->with('user')
            ->get();

        return response()->json($permissions);
    }

    /**
     * Set permission for a specific user
     */
    public function setUserPermission(Request $request, string $collectionId, string $workspaceId, string $userId)
    {
        // Check if user has access to workspace
        $workspace = Workspace::where('owner_id', Auth::id())
            ->orWhereHas('teamMembers', function ($query) {
                $query->where('user_id', Auth::id());
            })
            ->findOrFail($workspaceId);

        // Check if collection belongs to workspace
        $collection = Collection::where('workspace_id', $workspaceId)
            ->findOrFail($collectionId);

        // Check if user can manage permissions
        $isOwner = $workspace->owner_id === Auth::id();
        $isAdmin = $workspace->teamMembers()
            ->where('user_id', Auth::id())
            ->whereIn('role', ['owner', 'admin'])
            ->exists();

        if (!$isOwner && !$isAdmin && $collection->user_id !== Auth::id()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $request->validate([
            'permission' => 'required|in:read,write,admin',
        ]);

        $permission = CollectionWorkspacePermission::updateOrCreate(
            [
                'collection_id' => $collectionId,
                'workspace_id' => $workspaceId,
                'user_id' => $userId,
            ],
            [
                'permission' => $request->permission,
            ]
        );

        // Invalidate cache
        Cache::forget($this->getUserCacheKey('collections', Auth::id()));

        return response()->json($permission->load('user'));
    }

    /**
     * Remove permission for a user
     */
    public function removeUserPermission(string $collectionId, string $workspaceId, string $userId)
    {
        // Check if user has access to workspace
        $workspace = Workspace::where('owner_id', Auth::id())
            ->orWhereHas('teamMembers', function ($query) {
                $query->where('user_id', Auth::id());
            })
            ->findOrFail($workspaceId);

        // Check if collection belongs to workspace
        $collection = Collection::where('workspace_id', $workspaceId)
            ->findOrFail($collectionId);

        // Check if user can manage permissions
        $isOwner = $workspace->owner_id === Auth::id();
        $isAdmin = $workspace->teamMembers()
            ->where('user_id', Auth::id())
            ->whereIn('role', ['owner', 'admin'])
            ->exists();

        if (!$isOwner && !$isAdmin && $collection->user_id !== Auth::id()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        CollectionWorkspacePermission::where('collection_id', $collectionId)
            ->where('workspace_id', $workspaceId)
            ->where('user_id', $userId)
            ->delete();

        // Invalidate cache
        Cache::forget($this->getUserCacheKey('collections', Auth::id()));

        return response()->json(['message' => 'Permission removed successfully']);
    }
}
