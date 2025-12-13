<?php

namespace App\Http\Controllers;

use App\Models\Schema as SchemaModel;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class SchemaController extends Controller
{
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
}

