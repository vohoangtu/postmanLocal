<?php

namespace App\Services;

use App\Models\Collection;
use App\Models\Workspace;
use App\Models\User;
use App\Models\CollectionShare;
use App\Models\TeamMember;

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

                // Team members can read
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

                // Admin and member roles can write
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

                // Owner and admin roles can admin
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
}


