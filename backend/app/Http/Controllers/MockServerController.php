<?php

namespace App\Http\Controllers;

use App\Models\MockServer;
use App\Models\Workspace;
use App\Models\Schema;
use App\Services\MockServerService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class MockServerController extends Controller
{
    protected $mockServerService;

    public function __construct(MockServerService $mockServerService)
    {
        $this->mockServerService = $mockServerService;
    }

    /**
     * List mock servers for workspace
     */
    public function index(Request $request, string $workspaceId)
    {
        $workspace = Workspace::where('owner_id', Auth::id())
            ->orWhereHas('teamMembers', function ($query) {
                $query->where('user_id', Auth::id());
            })
            ->findOrFail($workspaceId);

        $mockServers = MockServer::where('workspace_id', $workspaceId)
            ->with(['schema', 'createdBy'])
            ->get();

        return response()->json($mockServers);
    }

    /**
     * Create mock server
     */
    public function store(Request $request, string $workspaceId)
    {
        $workspace = Workspace::where('owner_id', Auth::id())
            ->orWhereHas('teamMembers', function ($query) {
                $query->where('user_id', Auth::id());
            })
            ->findOrFail($workspaceId);

        $request->validate([
            'name' => 'required|string|max:255',
            'schema_id' => 'nullable|exists:schemas,id',
            'base_url' => 'sometimes|string|max:255',
            'port' => 'sometimes|integer|min:1|max:65535',
            'config' => 'sometimes|array',
        ]);

        $mockServer = MockServer::create([
            'workspace_id' => $workspaceId,
            'schema_id' => $request->schema_id,
            'name' => $request->name,
            'base_url' => $request->base_url ?? 'http://localhost',
            'port' => $request->port ?? 3000,
            'is_active' => false,
            'config' => $request->config ?? [],
            'created_by_id' => Auth::id(),
        ]);

        return response()->json($mockServer, 201);
    }

    /**
     * Get mock server
     */
    public function show(string $id)
    {
        $mockServer = MockServer::with(['schema', 'workspace', 'createdBy'])
            ->findOrFail($id);

        // Check access
        if ($mockServer->workspace->owner_id !== Auth::id() &&
            !$mockServer->workspace->teamMembers()->where('user_id', Auth::id())->exists()) {
            abort(403, 'Unauthorized');
        }

        return response()->json($mockServer);
    }

    /**
     * Update mock server
     */
    public function update(Request $request, string $id)
    {
        $mockServer = MockServer::with('workspace')->findOrFail($id);

        // Check access
        if ($mockServer->workspace->owner_id !== Auth::id() &&
            !$mockServer->workspace->teamMembers()->where('user_id', Auth::id())->exists()) {
            abort(403, 'Unauthorized');
        }

        $request->validate([
            'name' => 'sometimes|string|max:255',
            'schema_id' => 'sometimes|nullable|exists:schemas,id',
            'base_url' => 'sometimes|string|max:255',
            'port' => 'sometimes|integer|min:1|max:65535',
            'config' => 'sometimes|array',
        ]);

        $mockServer->update($request->only([
            'name',
            'schema_id',
            'base_url',
            'port',
            'config',
        ]));

        return response()->json($mockServer);
    }

    /**
     * Delete mock server
     */
    public function destroy(string $id)
    {
        $mockServer = MockServer::with('workspace')->findOrFail($id);

        // Check access
        if ($mockServer->workspace->owner_id !== Auth::id() &&
            !$mockServer->workspace->teamMembers()->where('user_id', Auth::id())->exists()) {
            abort(403, 'Unauthorized');
        }

        $mockServer->delete();

        return response()->json(['message' => 'Mock server deleted successfully']);
    }

    /**
     * Start mock server
     */
    public function start(string $id)
    {
        $mockServer = MockServer::with('workspace')->findOrFail($id);

        // Check access
        if ($mockServer->workspace->owner_id !== Auth::id() &&
            !$mockServer->workspace->teamMembers()->where('user_id', Auth::id())->exists()) {
            abort(403, 'Unauthorized');
        }

        // Note: Trong thực tế, đây sẽ start một mock server process
        // Ở đây chúng ta chỉ đánh dấu là active
        $mockServer->update(['is_active' => true]);

        return response()->json([
            'message' => 'Mock server started',
            'mock_server' => $mockServer,
        ]);
    }

    /**
     * Stop mock server
     */
    public function stop(string $id)
    {
        $mockServer = MockServer::with('workspace')->findOrFail($id);

        // Check access
        if ($mockServer->workspace->owner_id !== Auth::id() &&
            !$mockServer->workspace->teamMembers()->where('user_id', Auth::id())->exists()) {
            abort(403, 'Unauthorized');
        }

        $mockServer->update(['is_active' => false]);

        return response()->json([
            'message' => 'Mock server stopped',
            'mock_server' => $mockServer,
        ]);
    }

    /**
     * Get mock routes
     */
    public function getRoutes(string $id)
    {
        $mockServer = MockServer::with(['schema', 'workspace'])->findOrFail($id);

        // Check access
        if ($mockServer->workspace->owner_id !== Auth::id() &&
            !$mockServer->workspace->teamMembers()->where('user_id', Auth::id())->exists()) {
            abort(403, 'Unauthorized');
        }

        if (!$mockServer->schema) {
            return response()->json(['routes' => []]);
        }

        $routes = $this->mockServerService->generateRoutes($mockServer->schema);

        return response()->json(['routes' => $routes]);
    }
}
