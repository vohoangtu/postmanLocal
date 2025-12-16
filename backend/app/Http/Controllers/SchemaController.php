<?php

namespace App\Http\Controllers;

use App\Models\Schema as SchemaModel;
use App\Models\Collection;
use App\Models\Workspace;
use App\Services\SchemaValidationService;
use App\Services\ApiDocumentationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class SchemaController extends Controller
{
    protected $validationService;

    public function __construct(SchemaValidationService $validationService)
    {
        $this->validationService = $validationService;
    }
    public function index()
    {
        $schemas = SchemaModel::where('user_id', Auth::id())->get();
        return response()->json($schemas);
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'schema_data' => 'required|json',
        ]);

        $schema = SchemaModel::create([
            'user_id' => Auth::id(),
            'name' => $request->name,
            'schema_data' => $request->schema_data,
        ]);

        return response()->json($schema, 201);
    }

    public function show($id)
    {
        $schema = SchemaModel::where('user_id', Auth::id())
            ->findOrFail($id);
        return response()->json($schema);
    }

    public function update(Request $request, $id)
    {
        $schema = SchemaModel::where('user_id', Auth::id())
            ->findOrFail($id);

        $request->validate([
            'name' => 'sometimes|string|max:255',
            'schema_data' => 'sometimes|json',
        ]);

        $schema->update($request->only(['name', 'schema_data']));

        return response()->json($schema);
    }

    public function destroy($id)
    {
        $schema = SchemaModel::where('user_id', Auth::id())
            ->findOrFail($id);
        $schema->delete();

        return response()->json(['message' => 'Schema deleted successfully']);
    }

    public function sync(Request $request)
    {
        $request->validate([
            'schemas' => 'required|array',
        ]);

        $synced = [];
        foreach ($request->schemas as $schemaData) {
            $schema = SchemaModel::updateOrCreate(
                [
                    'user_id' => Auth::id(),
                    'name' => $schemaData['name'],
                ],
                [
                    'schema_data' => json_encode($schemaData['schema_data'] ?? []),
                ]
            );
            $synced[] = $schema;
        }

        return response()->json(['schemas' => $synced]);
    }

    /**
     * Get schemas for a workspace
     */
    public function getWorkspaceSchemas(Request $request, string $workspaceId)
    {
        // Check if user has access to workspace
        $workspace = Workspace::where('owner_id', Auth::id())
            ->orWhereHas('teamMembers', function ($query) {
                $query->where('user_id', Auth::id());
            })
            ->findOrFail($workspaceId);

        $schemas = SchemaModel::where('workspace_id', $workspaceId)->get();

        return response()->json($schemas);
    }

    /**
     * Create schema for a workspace
     */
    public function storeWorkspaceSchema(Request $request, string $workspaceId)
    {
        // Check if user has access to workspace
        $workspace = Workspace::where('owner_id', Auth::id())
            ->orWhereHas('teamMembers', function ($query) {
                $query->where('user_id', Auth::id());
            })
            ->findOrFail($workspaceId);

        $request->validate([
            'name' => 'required|string|max:255',
            'schema_data' => 'required|array',
        ]);

        $schema = SchemaModel::create([
            'user_id' => Auth::id(),
            'workspace_id' => $workspaceId,
            'name' => $request->name,
            'schema_data' => $request->schema_data,
        ]);

        return response()->json($schema, 201);
    }

    /**
     * Validate schema
     */
    public function validateSchema(Request $request, string $id)
    {
        $schema = SchemaModel::where('user_id', Auth::id())
            ->orWhereHas('workspace.teamMembers', function ($query) {
                $query->where('user_id', Auth::id());
            })
            ->findOrFail($id);

        $schemaData = $request->has('schema_data') 
            ? $request->schema_data 
            : $schema->schema_data;

        $result = $this->validationService->validate($schemaData);

        return response()->json($result);
    }

    /**
     * Import schema from collection
     */
    public function importFromCollection(Request $request, string $id)
    {
        $schema = SchemaModel::where('user_id', Auth::id())
            ->orWhereHas('workspace.teamMembers', function ($query) {
                $query->where('user_id', Auth::id());
            })
            ->findOrFail($id);

        $request->validate([
            'collection_id' => 'required|exists:collections,id',
        ]);

        $collection = Collection::where('user_id', Auth::id())
            ->orWhereHas('shares', function ($query) {
                $query->where('shared_with_user_id', Auth::id());
            })
            ->orWhereHas('workspace.teamMembers', function ($query) {
                $query->where('user_id', Auth::id());
            })
            ->findOrFail($request->collection_id);

        // Generate OpenAPI from collection
        $documentationService = new ApiDocumentationService();
        $openApi = $documentationService->generateOpenAPI($collection);

        // Update schema with imported data
        $schema->update([
            'schema_data' => $openApi,
        ]);

        return response()->json($schema);
    }
}

