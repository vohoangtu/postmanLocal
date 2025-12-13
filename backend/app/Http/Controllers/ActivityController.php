<?php

namespace App\Http\Controllers;

use App\Models\ActivityLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class ActivityController extends Controller
{
    public function index($workspaceId = null)
    {
        $query = ActivityLog::with(['user', 'workspace'])
            ->orderBy('created_at', 'desc');

        if ($workspaceId) {
            $query->where('workspace_id', $workspaceId);
        } else {
            // Get activities from user's workspaces
            $user = Auth::user();
            $workspaceIds = \App\Models\Workspace::where('owner_id', $user->id)
                ->orWhereHas('teamMembers', function ($q) use ($user) {
                    $q->where('user_id', $user->id);
                })
                ->pluck('id');
            $query->whereIn('workspace_id', $workspaceIds);
        }

        $activities = $query->paginate(50);

        return response()->json($activities);
    }

    public function collectionActivities($collectionId)
    {
        $activities = ActivityLog::where('entity_type', 'collection')
            ->where('entity_id', $collectionId)
            ->with(['user', 'workspace'])
            ->orderBy('created_at', 'desc')
            ->paginate(50);

        return response()->json($activities);
    }
}


