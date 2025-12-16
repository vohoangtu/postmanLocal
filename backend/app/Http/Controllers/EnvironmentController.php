<?php

namespace App\Http\Controllers;

use App\Models\Environment;
use App\Models\Workspace;
use App\Models\TeamMember;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class EnvironmentController extends Controller
{
    public function index(Request $request)
    {
        $workspaceId = $request->query('workspace_id');
        
        if ($workspaceId) {
            // Kiểm tra user có access vào workspace không
            $workspace = Workspace::find($workspaceId);
            if (!$workspace) {
                return response()->json(['error' => 'Workspace not found'], 404);
            }
            
            $hasAccess = $workspace->owner_id === Auth::id() ||
                TeamMember::where('team_id', $workspaceId)
                    ->where('user_id', Auth::id())
                    ->exists();
            
            if (!$hasAccess) {
                return response()->json(['error' => 'Unauthorized'], 403);
            }
            
            // Trả về environments của workspace
            $environments = Environment::where('workspace_id', $workspaceId)->get();
        } else {
            // Trả về environments của user (không có workspace_id)
            $environments = Environment::where('user_id', Auth::id())
                ->whereNull('workspace_id')
                ->get();
        }
        
        return response()->json($environments);
    }

    /**
     * Lấy environments của workspace (route: GET /workspaces/{workspaceId}/environments)
     */
    public function indexForWorkspace($workspaceId)
    {
        $workspace = Workspace::find($workspaceId);
        if (!$workspace) {
            return response()->json(['error' => 'Workspace not found'], 404);
        }
        
        $hasAccess = $workspace->owner_id === Auth::id() ||
            TeamMember::where('team_id', $workspaceId)
                ->where('user_id', Auth::id())
                ->exists();
        
        if (!$hasAccess) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }
        
        $environments = Environment::where('workspace_id', $workspaceId)->get();
        return response()->json($environments);
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'variables' => 'nullable|json',
            'workspace_id' => 'nullable|uuid|exists:workspaces,id',
        ]);

        $workspaceId = $request->input('workspace_id');
        
        // Nếu có workspace_id, kiểm tra quyền truy cập
        if ($workspaceId) {
            $workspace = Workspace::find($workspaceId);
            if (!$workspace) {
                return response()->json(['error' => 'Workspace not found'], 404);
            }
            
            $hasAccess = $workspace->owner_id === Auth::id() ||
                TeamMember::where('team_id', $workspaceId)
                    ->where('user_id', Auth::id())
                    ->exists();
            
            if (!$hasAccess) {
                return response()->json(['error' => 'Unauthorized'], 403);
            }
        }

        $environment = Environment::create([
            'user_id' => Auth::id(),
            'workspace_id' => $workspaceId,
            'name' => $request->name,
            'variables' => $request->variables,
        ]);

        return response()->json($environment, 201);
    }

    /**
     * Tạo environment cho workspace (route: POST /workspaces/{workspaceId}/environments)
     */
    public function storeForWorkspace(Request $request, $workspaceId)
    {
        $workspace = Workspace::find($workspaceId);
        if (!$workspace) {
            return response()->json(['error' => 'Workspace not found'], 404);
        }
        
        $hasAccess = $workspace->owner_id === Auth::id() ||
            TeamMember::where('team_id', $workspaceId)
                ->where('user_id', Auth::id())
                ->exists();
        
        if (!$hasAccess) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $request->validate([
            'name' => 'required|string|max:255',
            'variables' => 'nullable|json',
        ]);

        $environment = Environment::create([
            'user_id' => Auth::id(),
            'workspace_id' => $workspaceId,
            'name' => $request->name,
            'variables' => $request->variables,
        ]);

        return response()->json($environment, 201);
    }

    public function show($id)
    {
        $environment = Environment::findOrFail($id);
        
        // Kiểm tra quyền truy cập
        if ($environment->workspace_id) {
            $workspace = Workspace::find($environment->workspace_id);
            if (!$workspace) {
                return response()->json(['error' => 'Workspace not found'], 404);
            }
            
            $hasAccess = $workspace->owner_id === Auth::id() ||
                TeamMember::where('team_id', $environment->workspace_id)
                    ->where('user_id', Auth::id())
                    ->exists();
            
            if (!$hasAccess) {
                return response()->json(['error' => 'Unauthorized'], 403);
            }
        } else {
            // Environment của user
            if ($environment->user_id !== Auth::id()) {
                return response()->json(['error' => 'Unauthorized'], 403);
            }
        }
        
        return response()->json($environment);
    }

    public function update(Request $request, $id)
    {
        $environment = Environment::findOrFail($id);
        
        // Kiểm tra quyền truy cập
        if ($environment->workspace_id) {
            $workspace = Workspace::find($environment->workspace_id);
            if (!$workspace) {
                return response()->json(['error' => 'Workspace not found'], 404);
            }
            
            $hasAccess = $workspace->owner_id === Auth::id() ||
                TeamMember::where('team_id', $environment->workspace_id)
                    ->where('user_id', Auth::id())
                    ->exists();
            
            if (!$hasAccess) {
                return response()->json(['error' => 'Unauthorized'], 403);
            }
        } else {
            // Environment của user
            if ($environment->user_id !== Auth::id()) {
                return response()->json(['error' => 'Unauthorized'], 403);
            }
        }

        $request->validate([
            'name' => 'sometimes|string|max:255',
            'variables' => 'nullable|json',
        ]);

        $environment->update($request->only(['name', 'variables']));

        return response()->json($environment);
    }

    public function destroy($id)
    {
        $environment = Environment::findOrFail($id);
        
        // Kiểm tra quyền truy cập
        if ($environment->workspace_id) {
            $workspace = Workspace::find($environment->workspace_id);
            if (!$workspace) {
                return response()->json(['error' => 'Workspace not found'], 404);
            }
            
            $hasAccess = $workspace->owner_id === Auth::id() ||
                TeamMember::where('team_id', $environment->workspace_id)
                    ->where('user_id', Auth::id())
                    ->exists();
            
            if (!$hasAccess) {
                return response()->json(['error' => 'Unauthorized'], 403);
            }
        } else {
            // Environment của user
            if ($environment->user_id !== Auth::id()) {
                return response()->json(['error' => 'Unauthorized'], 403);
            }
        }
        
        $environment->delete();

        return response()->json(['message' => 'Environment deleted successfully']);
    }

    public function sync(Request $request)
    {
        $request->validate([
            'environments' => 'required|array',
        ]);

        $synced = [];
        foreach ($request->environments as $envData) {
            $environment = Environment::updateOrCreate(
                [
                    'user_id' => Auth::id(),
                    'name' => $envData['name'],
                ],
                [
                    'variables' => json_encode($envData['variables'] ?? []),
                ]
            );
            $synced[] = $environment;
        }

        return response()->json(['environments' => $synced]);
    }
}

