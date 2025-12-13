<?php

use Illuminate\Support\Facades\Broadcast;

/*
|--------------------------------------------------------------------------
| Broadcast Channels
|--------------------------------------------------------------------------
|
| Here you may register all of the event broadcasting channels that your
| application supports. The given channel authorization callbacks are
| used to check if an authenticated user can listen to the channel.
|
*/

Broadcast::channel('collection.{collectionId}', function ($user, $collectionId) {
    // Check if user has access to collection
    $collection = \App\Models\Collection::find($collectionId);
    
    if (!$collection) {
        return false;
    }

    // Owner has access
    if ($collection->user_id === $user->id) {
        return true;
    }

    // Check if collection is shared with user
    $share = \App\Models\CollectionShare::where('collection_id', $collectionId)
        ->where('shared_with_user_id', $user->id)
        ->first();

    if ($share) {
        return true;
    }

    // Check workspace access
    if ($collection->workspace_id) {
        $workspace = \App\Models\Workspace::find($collection->workspace_id);
        if ($workspace) {
            if ($workspace->owner_id === $user->id) {
                return true;
            }
            $member = \App\Models\TeamMember::where('team_id', $workspace->id)
                ->where('user_id', $user->id)
                ->first();
            if ($member) {
                return true;
            }
        }
    }

    return false;
});

Broadcast::channel('workspace.{workspaceId}', function ($user, $workspaceId) {
    $workspace = \App\Models\Workspace::find($workspaceId);
    
    if (!$workspace) {
        return false;
    }

    // Owner has access
    if ($workspace->owner_id === $user->id) {
        return true;
    }

    // Check if user is team member
    $member = \App\Models\TeamMember::where('team_id', $workspaceId)
        ->where('user_id', $user->id)
        ->first();

    return $member !== null;
});
