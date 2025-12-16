<?php

namespace App\Services;

use App\Models\Collection;
use App\Models\Workspace;
use App\Models\User;
use App\Models\CollectionShare;
use App\Models\TeamMember;
use App\Models\CollectionWorkspacePermission;
use App\Models\RequestPermission;

class PermissionService
{
    /**
     * Check if user can read collection
     */
    public function canRead(Collection $collection, User $user): bool
    {
        // Owner can always read
        if ($collection->user_id === $user->id) {
            return true;
        }

        // Check if collection is shared with user
        $share = CollectionShare::where('collection_id', $collection->id)
            ->where('shared_with_user_id', $user->id)
            ->first();

        if ($share) {
            return true; // Any share permission allows read
        }

        // Check if user is in workspace that owns the collection
        if ($collection->workspace_id) {
            $workspace = Workspace::find($collection->workspace_id);
            if ($workspace) {
                // Owner can read
                if ($workspace->owner_id === $user->id) {
                    return true;
                }

                // Check workspace-level collection permissions
                $workspacePermission = CollectionWorkspacePermission::where('collection_id', $collection->id)
                    ->where('workspace_id', $collection->workspace_id)
                    ->where('user_id', $user->id)
                    ->first();

                if ($workspacePermission) {
                    return true; // Any workspace permission allows read
                }

                // Team members can read by default (if no explicit permission set)
                $member = TeamMember::where('team_id', $workspace->id)
                    ->where('user_id', $user->id)
                    ->first();

                if ($member) {
                    return true;
                }
            }
        }

        return false;
    }

    /**
     * Check if user can write to collection
     */
    public function canWrite(Collection $collection, User $user): bool
    {
        // Owner can always write
        if ($collection->user_id === $user->id) {
            return true;
        }

        // Check share permission
        $share = CollectionShare::where('collection_id', $collection->id)
            ->where('shared_with_user_id', $user->id)
            ->whereIn('permission', ['write', 'admin'])
            ->first();

        if ($share) {
            return true;
        }

        // Check workspace permissions
        if ($collection->workspace_id) {
            $workspace = Workspace::find($collection->workspace_id);
            if ($workspace) {
                // Owner can write
                if ($workspace->owner_id === $user->id) {
                    return true;
                }

                // Check workspace-level collection permissions
                $workspacePermission = CollectionWorkspacePermission::where('collection_id', $collection->id)
                    ->where('workspace_id', $collection->workspace_id)
                    ->where('user_id', $user->id)
                    ->whereIn('permission', ['write', 'admin'])
                    ->first();

                if ($workspacePermission) {
                    return true;
                }

                // Admin and member roles can write by default (if no explicit permission set)
                $member = TeamMember::where('team_id', $workspace->id)
                    ->where('user_id', $user->id)
                    ->whereIn('role', ['owner', 'admin', 'member'])
                    ->first();

                if ($member) {
                    return true;
                }
            }
        }

        return false;
    }

    /**
     * Check if user can admin collection
     */
    public function canAdmin(Collection $collection, User $user): bool
    {
        // Owner can always admin
        if ($collection->user_id === $user->id) {
            return true;
        }

        // Check share permission
        $share = CollectionShare::where('collection_id', $collection->id)
            ->where('shared_with_user_id', $user->id)
            ->where('permission', 'admin')
            ->first();

        if ($share) {
            return true;
        }

        // Check workspace permissions
        if ($collection->workspace_id) {
            $workspace = Workspace::find($collection->workspace_id);
            if ($workspace) {
                // Owner can admin
                if ($workspace->owner_id === $user->id) {
                    return true;
                }

                // Check workspace-level collection permissions
                $workspacePermission = CollectionWorkspacePermission::where('collection_id', $collection->id)
                    ->where('workspace_id', $collection->workspace_id)
                    ->where('user_id', $user->id)
                    ->where('permission', 'admin')
                    ->first();

                if ($workspacePermission) {
                    return true;
                }

                // Owner and admin roles can admin by default (if no explicit permission set)
                $member = TeamMember::where('team_id', $workspace->id)
                    ->where('user_id', $user->id)
                    ->whereIn('role', ['owner', 'admin'])
                    ->first();

                if ($member) {
                    return true;
                }
            }
        }

        return false;
    }

    /**
     * Check if user has permission in workspace
     */
    public function hasWorkspacePermission(Workspace $workspace, User $user, string $requiredRole = 'member'): bool
    {
        // Owner has all permissions
        if ($workspace->owner_id === $user->id) {
            return true;
        }

        $member = TeamMember::where('team_id', $workspace->id)
            ->where('user_id', $user->id)
            ->first();

        if (!$member) {
            return false;
        }

        $roleHierarchy = [
            'viewer' => 1,
            'member' => 2,
            'admin' => 3,
            'owner' => 4,
        ];

        $userRoleLevel = $roleHierarchy[$member->role] ?? 0;
        $requiredRoleLevel = $roleHierarchy[$requiredRole] ?? 0;

        return $userRoleLevel >= $requiredRoleLevel;
    }

    /**
     * Check if user can read a request in workspace
     */
    public function canReadRequest(string $requestId, string $collectionId, int $workspaceId, User $user): bool
    {
        $collection = Collection::find($collectionId);
        if (!$collection) {
            return false;
        }

        // Check collection permissions first
        if (!$this->canRead($collection, $user)) {
            return false;
        }

        // Check request-level permissions
        $requestPermission = RequestPermission::where('request_id', $requestId)
            ->where('collection_id', $collectionId)
            ->where('workspace_id', $workspaceId)
            ->where('user_id', $user->id)
            ->first();

        if ($requestPermission) {
            return true; // Any permission allows read
        }

        // Default: user has read access if they have collection access
        return true;
    }

    /**
     * Check if user can write to a request in workspace
     */
    public function canWriteRequest(string $requestId, string $collectionId, int $workspaceId, User $user): bool
    {
        $collection = Collection::find($collectionId);
        if (!$collection) {
            return false;
        }

        // Check collection permissions first
        if (!$this->canWrite($collection, $user)) {
            return false;
        }

        // Check request-level permissions
        $requestPermission = RequestPermission::where('request_id', $requestId)
            ->where('collection_id', $collectionId)
            ->where('workspace_id', $workspaceId)
            ->where('user_id', $user->id)
            ->whereIn('permission', ['write', 'admin'])
            ->first();

        if ($requestPermission) {
            return true;
        }

        // Default: user has write access if they have collection write access
        return true;
    }

    /**
     * Check if user can admin a request in workspace
     */
    public function canAdminRequest(string $requestId, string $collectionId, int $workspaceId, User $user): bool
    {
        $collection = Collection::find($collectionId);
        if (!$collection) {
            return false;
        }

        // Check collection permissions first
        if (!$this->canAdmin($collection, $user)) {
            return false;
        }

        // Check request-level permissions
        $requestPermission = RequestPermission::where('request_id', $requestId)
            ->where('collection_id', $collectionId)
            ->where('workspace_id', $workspaceId)
            ->where('user_id', $user->id)
            ->where('permission', 'admin')
            ->first();

        if ($requestPermission) {
            return true;
        }

        // Default: user has admin access if they have collection admin access
        return true;
    }
}




