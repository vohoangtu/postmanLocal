<?php

namespace App\Http\Controllers;

use App\Models\RequestReview;
use App\Models\Collection;
use App\Models\Workspace;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;

class RequestReviewController extends BaseController
{
    /**
     * List reviews for a collection
     */
    public function index(Request $request, string $collectionId)
    {
        // Check if user has access to collection
        $collection = Collection::where('user_id', Auth::id())
            ->orWhereHas('shares', function ($query) {
                $query->where('shared_with_user_id', Auth::id());
            })
            ->findOrFail($collectionId);

        // Check workspace access
        if ($collection->workspace_id) {
            $workspace = Workspace::where('owner_id', Auth::id())
                ->orWhereHas('teamMembers', function ($query) {
                    $query->where('user_id', Auth::id());
                })
                ->find($collection->workspace_id);

            if (!$workspace) {
                return response()->json(['message' => 'Unauthorized'], 403);
            }
        }

        $query = RequestReview::where('collection_id', $collectionId)
            ->with(['reviewer', 'collection', 'workspace'])
            ->orderBy('created_at', 'desc');

        // Filter by status
        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        // Filter by reviewer
        if ($request->has('reviewer_id')) {
            $query->where('reviewer_id', $request->reviewer_id);
        }

        // Filter by request_id
        if ($request->has('request_id')) {
            $query->where('request_id', $request->request_id);
        }

        // Pagination
        if ($request->has('page') || $request->has('per_page')) {
            return $this->paginate($query, $request);
        }

        return response()->json($query->get());
    }

    /**
     * Create a review request
     */
    public function store(Request $request, string $requestId)
    {
        $request->validate([
            'collection_id' => 'required|exists:collections,id',
            'workspace_id' => 'required|exists:workspaces,id',
            'reviewer_id' => 'required|exists:users,id',
            'comments' => 'nullable|string',
        ]);

        // Check if user has access to collection
        $collection = Collection::where('user_id', Auth::id())
            ->orWhereHas('shares', function ($query) {
                $query->where('shared_with_user_id', Auth::id())
                    ->whereIn('permission', ['write', 'admin']);
            })
            ->findOrFail($request->collection_id);

        // Check workspace access
        $workspace = Workspace::where('owner_id', Auth::id())
            ->orWhereHas('teamMembers', function ($query) {
                $query->where('user_id', Auth::id());
            })
            ->findOrFail($request->workspace_id);

        // Check if reviewer is in workspace
        $isReviewerInWorkspace = $workspace->owner_id == $request->reviewer_id ||
            $workspace->teamMembers()->where('user_id', $request->reviewer_id)->exists();

        if (!$isReviewerInWorkspace) {
            return response()->json(['message' => 'Reviewer must be a member of the workspace'], 400);
        }

        // Check if review already exists
        $existingReview = RequestReview::where('request_id', $requestId)
            ->where('collection_id', $request->collection_id)
            ->where('reviewer_id', $request->reviewer_id)
            ->where('status', 'pending')
            ->first();

        if ($existingReview) {
            return response()->json(['message' => 'Review request already exists'], 400);
        }

        $review = RequestReview::create([
            'request_id' => $requestId,
            'collection_id' => $request->collection_id,
            'workspace_id' => $request->workspace_id,
            'reviewer_id' => $request->reviewer_id,
            'status' => 'pending',
            'comments' => $request->comments,
        ]);

        return response()->json($review->load(['reviewer', 'collection', 'workspace']), 201);
    }

    /**
     * Update review status
     */
    public function update(Request $request, string $id)
    {
        $review = RequestReview::findOrFail($id);

        // Check if user is the reviewer
        if ($review->reviewer_id !== Auth::id()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $request->validate([
            'status' => 'required|in:pending,approved,rejected,changes_requested',
            'comments' => 'nullable|string',
        ]);

        $review->update([
            'status' => $request->status,
            'comments' => $request->comments ?? $review->comments,
            'reviewed_at' => $request->status !== 'pending' ? now() : null,
        ]);

        return response()->json($review->load(['reviewer', 'collection', 'workspace']));
    }

    /**
     * Approve a review
     */
    public function approve(string $id)
    {
        $review = RequestReview::findOrFail($id);

        // Check if user is the reviewer
        if ($review->reviewer_id !== Auth::id()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $review->update([
            'status' => 'approved',
            'reviewed_at' => now(),
        ]);

        return response()->json($review->load(['reviewer', 'collection', 'workspace']));
    }

    /**
     * Reject a review
     */
    public function reject(Request $request, string $id)
    {
        $review = RequestReview::findOrFail($id);

        // Check if user is the reviewer
        if ($review->reviewer_id !== Auth::id()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $request->validate([
            'comments' => 'nullable|string',
        ]);

        $review->update([
            'status' => 'rejected',
            'comments' => $request->comments ?? $review->comments,
            'reviewed_at' => now(),
        ]);

        return response()->json($review->load(['reviewer', 'collection', 'workspace']));
    }

    /**
     * Request changes
     */
    public function requestChanges(Request $request, string $id)
    {
        $review = RequestReview::findOrFail($id);

        // Check if user is the reviewer
        if ($review->reviewer_id !== Auth::id()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $request->validate([
            'comments' => 'required|string',
        ]);

        $review->update([
            'status' => 'changes_requested',
            'comments' => $request->comments,
            'reviewed_at' => now(),
        ]);

        return response()->json($review->load(['reviewer', 'collection', 'workspace']));
    }

    /**
     * Delete a review
     */
    public function destroy(string $id)
    {
        $review = RequestReview::findOrFail($id);

        // Check if user is the reviewer or collection owner
        $collection = $review->collection;
        $isOwner = $collection->user_id === Auth::id();
        $isReviewer = $review->reviewer_id === Auth::id();

        if (!$isOwner && !$isReviewer) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $review->delete();

        return response()->json(['message' => 'Review deleted successfully']);
    }

    /**
     * Get reviews for workspace
     */
    public function getWorkspaceReviews(Request $request, string $workspaceId)
    {
        // Check if user has access to workspace
        $workspace = Workspace::where('owner_id', Auth::id())
            ->orWhereHas('teamMembers', function ($query) {
                $query->where('user_id', Auth::id());
            })
            ->findOrFail($workspaceId);

        $query = RequestReview::where('workspace_id', $workspaceId)
            ->with(['reviewer', 'collection', 'workspace'])
            ->orderBy('created_at', 'desc');

        // Filter by status
        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        // Filter by reviewer
        if ($request->has('reviewer_id')) {
            $query->where('reviewer_id', $request->reviewer_id);
        }

        // Pagination
        if ($request->has('page') || $request->has('per_page')) {
            return $this->paginate($query, $request);
        }

        return response()->json($query->get());
    }
}
