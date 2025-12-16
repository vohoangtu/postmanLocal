<?php

namespace App\Http\Controllers;

use App\Models\Collection;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class TemplateController extends Controller
{
    /**
     * List team templates
     */
    public function index(Request $request)
    {
        $query = Collection::where('is_template', true)
            ->with('user');

        // Filter by category
        if ($request->has('category')) {
            $query->where('template_category', $request->category);
        }

        // Search
        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%");
            });
        }

        // Get templates from user's workspaces
        $user = Auth::user();
        $workspaceIds = \App\Models\Workspace::where('owner_id', $user->id)
            ->orWhereHas('teamMembers', function ($q) use ($user) {
                $q->where('user_id', $user->id);
            })
            ->pluck('id');

        $query->where(function ($q) use ($user, $workspaceIds) {
            $q->where('user_id', $user->id)
              ->orWhereIn('workspace_id', $workspaceIds);
        });

        $templates = $query->orderBy('created_at', 'desc')->paginate(20);

        return response()->json($templates);
    }

    /**
     * Publish collection as template
     */
    public function publishTemplate(Request $request, $id)
    {
        $collection = Collection::where('user_id', Auth::id())
            ->findOrFail($id);

        $request->validate([
            'category' => 'nullable|string|max:255',
            'tags' => 'nullable|array',
        ]);

        $collection->update([
            'is_template' => true,
            'template_category' => $request->category,
            'template_tags' => json_encode($request->tags || []),
        ]);

        return response()->json($collection);
    }

    /**
     * Create collection from template
     */
    public function useTemplate($id)
    {
        $template = Collection::where('is_template', true)
            ->findOrFail($id);

        // Check if user has access (owner or in workspace)
        $user = Auth::user();
        $hasAccess = false;

        if ($template->user_id === $user->id) {
            $hasAccess = true;
        } elseif ($template->workspace_id) {
            $workspace = \App\Models\Workspace::find($template->workspace_id);
            if ($workspace) {
                if ($workspace->owner_id === $user->id) {
                    $hasAccess = true;
                } else {
                    $member = \App\Models\TeamMember::where('team_id', $workspace->id)
                        ->where('user_id', $user->id)
                        ->first();
                    if ($member) {
                        $hasAccess = true;
                    }
                }
            }
        }

        if (!$hasAccess) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        // Create new collection from template
        $newCollection = Collection::create([
            'user_id' => $user->id,
            'workspace_id' => $template->workspace_id,
            'name' => $template->name . ' (Copy)',
            'description' => $template->description,
            'data' => $template->data,
            'is_template' => false,
        ]);

        return response()->json($newCollection, 201);
    }
}




