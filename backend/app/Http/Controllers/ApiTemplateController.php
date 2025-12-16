<?php

namespace App\Http\Controllers;

use App\Models\ApiTemplate;
use App\Models\Workspace;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class ApiTemplateController extends Controller
{
    /**
     * List templates
     */
    public function index(Request $request)
    {
        $query = ApiTemplate::query();

        // Filter by category
        if ($request->has('category')) {
            $query->where('category', $request->category);
        }

        // Show public templates or user's templates
        $query->where(function ($q) {
            $q->where('is_public', true)
              ->orWhere('created_by_id', Auth::id());
        });

        $templates = $query->with('createdBy')->get();

        return response()->json($templates);
    }

    /**
     * Get template
     */
    public function show(string $id)
    {
        $template = ApiTemplate::with('createdBy')->findOrFail($id);

        // Check access
        if (!$template->is_public && $template->created_by_id !== Auth::id()) {
            abort(403, 'Unauthorized');
        }

        return response()->json($template);
    }

    /**
     * Create schema from template
     */
    public function createFromTemplate(Request $request, string $workspaceId)
    {
        $workspace = Workspace::where('owner_id', Auth::id())
            ->orWhereHas('teamMembers', function ($query) {
                $query->where('user_id', Auth::id());
            })
            ->findOrFail($workspaceId);

        $request->validate([
            'template_id' => 'required|exists:api_templates,id',
            'name' => 'required|string|max:255',
        ]);

        $template = ApiTemplate::findOrFail($request->template_id);

        // Check access
        if (!$template->is_public && $template->created_by_id !== Auth::id()) {
            abort(403, 'Unauthorized');
        }

        // Create schema from template
        $schema = \App\Models\Schema::create([
            'user_id' => Auth::id(),
            'workspace_id' => $workspaceId,
            'name' => $request->name,
            'schema_data' => $template->template_data,
        ]);

        return response()->json($schema, 201);
    }
}
