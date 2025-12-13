<?php

namespace App\Http\Controllers;

use App\Models\Comment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;

class CommentController extends BaseController
{
    public function index(Request $request, $collectionId)
    {
        $cacheKey = "comments:collection:{$collectionId}";
        
        $comments = $this->cache($cacheKey, 60, function () use ($request, $collectionId) {
            $query = Comment::where('collection_id', $collectionId)
                ->whereNull('parent_id')
                ->with(['user', 'replies.user'])
                ->orderBy('created_at', 'desc');
            
            // Pagination
            if ($request->has('page') || $request->has('per_page')) {
                return $this->paginate($query, $request);
            }
            
            return $query->get();
        });

        return response()->json($comments);
    }

    public function store(Request $request, $collectionId)
    {
        $request->validate([
            'content' => 'required|string|max:5000', // Limit content length
            'request_id' => 'nullable|exists:requests,id',
            'parent_id' => 'nullable|exists:comments,id',
        ]);

        $comment = Comment::create([
            'collection_id' => $collectionId,
            'request_id' => $request->request_id,
            'user_id' => Auth::id(),
            'content' => $request->content,
            'parent_id' => $request->parent_id,
        ]);

        // Invalidate cache
        Cache::forget("comments:collection:{$collectionId}");

        // Broadcast event for real-time updates
        event(new \App\Events\CommentCreated($comment->load('user')));

        return response()->json($comment->load('user'), 201);
    }

    public function update(Request $request, $id)
    {
        $comment = Comment::where('user_id', Auth::id())->findOrFail($id);

        $request->validate([
            'content' => 'required|string',
        ]);

        $comment->update(['content' => $request->content]);

        return response()->json($comment->load('user'));
    }

    public function destroy($id)
    {
        $comment = Comment::where('user_id', Auth::id())->findOrFail($id);
        $comment->delete();

        return response()->json(['message' => 'Comment deleted successfully']);
    }
}

