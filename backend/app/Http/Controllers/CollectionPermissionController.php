<?php

namespace App\Http\Controllers;

use App\Models\Collection;
use App\Models\CollectionPermission;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;

class CollectionPermissionController extends BaseController
{
    /**
     * Get permissions for a collection
     */
    public function index(Request $request, string $collectionId)
    {
        // Check if collection exists and user has access
        $collection = Collection::where('user_id', Auth::id())
            ->orWhereHas('permissions', function ($query) {
                $query->where('user_id', Auth::id());
            })
            ->findOrFail($collectionId);

        // Check if user can view permissions (owner or has admin permission)
        $isOwner = $collection->user_id === Auth::id();
        $hasAdminPermission = $collection->permissions()
            ->where('user_id', Auth::id())
            ->where('permission', 'admin')
            ->exists();

        if (!$isOwner && !$hasAdminPermission) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $permissions = CollectionPermission::where('collection_id', $collectionId)
            ->with('user')
            ->get();

        return response()->json($permissions);
    }

    /**
     * Update permissions for a collection
     */
    public function update(Request $request, string $collectionId)
    {
        // Check if collection exists and user is owner
        $collection = Collection::where('user_id', Auth::id())
            ->findOrFail($collectionId);

        $request->validate([
            'permissions' => 'required|array',
            'permissions.*.user_id' => 'required|exists:users,id',
            'permissions.*.permission' => 'required|in:read,write,admin',
        ]);

        // Update permissions
        foreach ($request->permissions as $perm) {
            CollectionPermission::updateOrCreate(
                [
                    'collection_id' => $collectionId,
                    'user_id' => $perm['user_id'],
                ],
                [
                    'permission' => $perm['permission'],
                ]
            );
        }

        // Invalidate cache
        Cache::forget($this->getUserCacheKey('collections', Auth::id()));

        $permissions = CollectionPermission::where('collection_id', $collectionId)
            ->with('user')
            ->get();

        return response()->json($permissions);
    }

    /**
     * Set permission for a specific user
     */
    public function setUserPermission(Request $request, string $collectionId, string $userId)
    {
        // Check if collection exists and user is owner
        $collection = Collection::where('user_id', Auth::id())
            ->findOrFail($collectionId);

        $request->validate([
            'permission' => 'required|in:read,write,admin',
        ]);

        $permission = CollectionPermission::updateOrCreate(
            [
                'collection_id' => $collectionId,
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
    public function removeUserPermission(string $collectionId, string $userId)
    {
        // Check if collection exists and user is owner
        $collection = Collection::where('user_id', Auth::id())
            ->findOrFail($collectionId);

        CollectionPermission::where('collection_id', $collectionId)
            ->where('user_id', $userId)
            ->delete();

        // Invalidate cache
        Cache::forget($this->getUserCacheKey('collections', Auth::id()));

        return response()->json(['message' => 'Permission removed successfully']);
    }
}
