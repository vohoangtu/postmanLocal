<?php

namespace App\Http\Controllers;

use App\Models\ApiDesignReview;
use App\Models\Schema;
use App\Models\Workspace;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class ApiDesignReviewController extends Controller
{
    /**
     * Request review for schema
     */
    public function requestReview(Request $request, string $schemaId)
    {
        $schema = Schema::where('user_id', Auth::id())
            ->orWhereHas('workspace.teamMembers', function ($query) {
                $query->where('user_id', Auth::id());
            })
            ->findOrFail($schemaId);

        if (!$schema->workspace_id) {
            return response()->json(['message' => 'Schema must be in a workspace'], 400);
        }

        $request->validate([
            'reviewer_id' => 'sometimes|exists:users,id',
        ]);

        $review = ApiDesignReview::create([
            'schema_id' => $schemaId,
            'workspace_id' => $schema->workspace_id,
            'requested_by_id' => Auth::id(),
            'reviewer_id' => $request->reviewer_id,
            'status' => 'pending',
            'review_data' => $schema->schema_data,
        ]);

        return response()->json($review, 201);
    }

    /**
     * List design reviews for workspace
     */
    public function index(Request $request, string $workspaceId)
    {
        $workspace = Workspace::where('owner_id', Auth::id())
            ->orWhereHas('teamMembers', function ($query) {
                $query->where('user_id', Auth::id());
            })
            ->findOrFail($workspaceId);

        $query = ApiDesignReview::where('workspace_id', $workspaceId)
            ->with(['schema', 'requestedBy', 'reviewer'])
            ->orderBy('created_at', 'desc');

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        $reviews = $query->get();

        return response()->json($reviews);
    }

    /**
     * Approve design
     */
    public function approve(Request $request, string $id)
    {
        $review = ApiDesignReview::with(['schema', 'workspace'])->findOrFail($id);

        // Check access
        if ($review->workspace->owner_id !== Auth::id() &&
            !$review->workspace->teamMembers()->where('user_id', Auth::id())->exists()) {
            abort(403, 'Unauthorized');
        }

        $request->validate([
            'comments' => 'sometimes|string',
        ]);

        $review->update([
            'status' => 'approved',
            'reviewer_id' => Auth::id(),
            'comments' => $request->comments,
            'reviewed_at' => now(),
        ]);

        return response()->json($review);
    }

    /**
     * Reject design
     */
    public function reject(Request $request, string $id)
    {
        $review = ApiDesignReview::with(['schema', 'workspace'])->findOrFail($id);

        // Check access
        if ($review->workspace->owner_id !== Auth::id() &&
            !$review->workspace->teamMembers()->where('user_id', Auth::id())->exists()) {
            abort(403, 'Unauthorized');
        }

        $request->validate([
            'comments' => 'required|string',
        ]);

        $review->update([
            'status' => 'rejected',
            'reviewer_id' => Auth::id(),
            'comments' => $request->comments,
            'reviewed_at' => now(),
        ]);

        return response()->json($review);
    }

    /**
     * Request changes
     */
    public function requestChanges(Request $request, string $id)
    {
        $review = ApiDesignReview::with(['schema', 'workspace'])->findOrFail($id);

        // Check access
        if ($review->workspace->owner_id !== Auth::id() &&
            !$review->workspace->teamMembers()->where('user_id', Auth::id())->exists()) {
            abort(403, 'Unauthorized');
        }

        $request->validate([
            'comments' => 'required|string',
        ]);

        $review->update([
            'status' => 'changes_requested',
            'reviewer_id' => Auth::id(),
            'comments' => $request->comments,
            'reviewed_at' => now(),
        ]);

        return response()->json($review);
    }
}
