<?php

namespace App\Http\Controllers;

use App\Models\Discussion;
use App\Models\DiscussionReply;
use App\Models\Workspace;
use App\Events\DiscussionCreated;
use App\Events\DiscussionReplied;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class DiscussionController extends BaseController
{
    /**
     * Get discussions for a workspace
     */
    public function index(Request $request, string $workspaceId)
    {
        $workspace = Workspace::where('owner_id', Auth::id())
            ->orWhereHas('teamMembers', function ($query) {
                $query->where('user_id', Auth::id());
            })
            ->findOrFail($workspaceId);

        $query = Discussion::where('workspace_id', $workspaceId)
            ->with(['creator', 'resolver', 'replies.user'])
            ->orderBy('created_at', 'desc');

        // Filter by resolved status
        if ($request->has('resolved')) {
            $query->where('resolved', $request->resolved);
        }

        // Pagination
        if ($request->has('page') || $request->has('per_page')) {
            $perPage = $request->get('per_page', 15);
            $discussions = $query->paginate($perPage);
            return response()->json($discussions);
        }

        return response()->json($query->get());
    }

    /**
     * Create a new discussion
     */
    public function store(Request $request, string $workspaceId)
    {
        $workspace = Workspace::where('owner_id', Auth::id())
            ->orWhereHas('teamMembers', function ($query) {
                $query->where('user_id', Auth::id());
            })
            ->findOrFail($workspaceId);

        $request->validate([
            'title' => 'required|string|max:255',
            'content' => 'required|string',
        ]);

        $discussion = Discussion::create([
            'workspace_id' => $workspaceId,
            'title' => $request->title,
            'content' => $request->content,
            'created_by' => Auth::id(),
        ]);

        $discussion->load(['creator', 'replies.user']);
        
        // Broadcast event
        event(new DiscussionCreated($discussion));

        return response()->json($discussion, 201);
    }

    /**
     * Get a specific discussion
     */
    public function show(string $id)
    {
        $discussion = Discussion::with(['creator', 'resolver', 'replies.user'])
            ->findOrFail($id);

        // Check permission
        $workspace = $discussion->workspace;
        $hasAccess = $workspace->owner_id === Auth::id() ||
            $workspace->teamMembers()->where('user_id', Auth::id())->exists();

        if (!$hasAccess) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        return response()->json($discussion);
    }

    /**
     * Update a discussion
     */
    public function update(Request $request, string $id)
    {
        $discussion = Discussion::findOrFail($id);

        // Check permission - only creator or admin can update
        $workspace = $discussion->workspace;
        $isCreator = $discussion->created_by === Auth::id();
        $isOwner = $workspace->owner_id === Auth::id();
        $isAdmin = $workspace->teamMembers()
            ->where('user_id', Auth::id())
            ->whereIn('role', ['owner', 'admin'])
            ->exists();

        if (!$isCreator && !$isOwner && !$isAdmin) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $request->validate([
            'title' => 'sometimes|string|max:255',
            'content' => 'sometimes|string',
        ]);

        $discussion->update($request->only(['title', 'content']));

        return response()->json($discussion->load(['creator', 'resolver', 'replies.user']));
    }

    /**
     * Delete a discussion
     */
    public function destroy(string $id)
    {
        $discussion = Discussion::findOrFail($id);

        // Check permission - only creator, owner, or admin can delete
        $workspace = $discussion->workspace;
        $isCreator = $discussion->created_by === Auth::id();
        $isOwner = $workspace->owner_id === Auth::id();
        $isAdmin = $workspace->teamMembers()
            ->where('user_id', Auth::id())
            ->whereIn('role', ['owner', 'admin'])
            ->exists();

        if (!$isCreator && !$isOwner && !$isAdmin) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $discussion->delete();

        return response()->json(['message' => 'Discussion deleted successfully']);
    }

    /**
     * Add reply to discussion
     */
    public function addReply(Request $request, string $id)
    {
        $discussion = Discussion::findOrFail($id);

        // Check permission
        $workspace = $discussion->workspace;
        $hasAccess = $workspace->owner_id === Auth::id() ||
            $workspace->teamMembers()->where('user_id', Auth::id())->exists();

        if (!$hasAccess) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $request->validate([
            'content' => 'required|string',
        ]);

        $reply = DiscussionReply::create([
            'discussion_id' => $id,
            'user_id' => Auth::id(),
            'content' => $request->content,
        ]);

        $reply->load('user');
        
        // Broadcast event
        event(new DiscussionReplied($reply));

        return response()->json($reply, 201);
    }

    /**
     * Mark discussion as resolved
     */
    public function resolve(string $id)
    {
        $discussion = Discussion::findOrFail($id);

        // Check permission
        $workspace = $discussion->workspace;
        $hasAccess = $workspace->owner_id === Auth::id() ||
            $workspace->teamMembers()
                ->where('user_id', Auth::id())
                ->whereIn('role', ['owner', 'admin', 'member'])
                ->exists();

        if (!$hasAccess) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $discussion->update([
            'resolved' => true,
            'resolved_by' => Auth::id(),
            'resolved_at' => now(),
        ]);

        return response()->json($discussion->load(['creator', 'resolver', 'replies.user']));
    }

    /**
     * Unresolve a discussion
     */
    public function unresolve(string $id)
    {
        $discussion = Discussion::findOrFail($id);

        // Check permission
        $workspace = $discussion->workspace;
        $hasAccess = $workspace->owner_id === Auth::id() ||
            $workspace->teamMembers()
                ->where('user_id', Auth::id())
                ->whereIn('role', ['owner', 'admin', 'member'])
                ->exists();

        if (!$hasAccess) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $discussion->update([
            'resolved' => false,
            'resolved_by' => null,
            'resolved_at' => null,
        ]);

        return response()->json($discussion->load(['creator', 'resolver', 'replies.user']));
    }
}
