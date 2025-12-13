<?php

namespace App\Http\Controllers;

use App\Models\Collection;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class CollectionController extends Controller
{
    public function index()
    {
        $collections = Collection::where('user_id', Auth::id())->get();
        return response()->json($collections);
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'data' => 'nullable|json',
        ]);

        $collection = Collection::create([
            'user_id' => Auth::id(),
            'name' => $request->name,
            'description' => $request->description,
            'data' => $request->data,
        ]);

        return response()->json($collection, 201);
    }

    public function show($id)
    {
        $collection = Collection::where('user_id', Auth::id())
            ->findOrFail($id);
        return response()->json($collection);
    }

    public function update(Request $request, $id)
    {
        $collection = Collection::where('user_id', Auth::id())
            ->findOrFail($id);

        $request->validate([
            'name' => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'data' => 'nullable|json',
        ]);

        $collection->update($request->only(['name', 'description', 'data']));

        return response()->json($collection);
    }

    public function destroy($id)
    {
        $collection = Collection::where('user_id', Auth::id())
            ->findOrFail($id);
        $collection->delete();

        return response()->json(['message' => 'Collection deleted successfully']);
    }

    public function sync(Request $request)
    {
        $request->validate([
            'collections' => 'required|array',
        ]);

        $synced = [];
        foreach ($request->collections as $collectionData) {
            $collection = Collection::updateOrCreate(
                [
                    'user_id' => Auth::id(),
                    'name' => $collectionData['name'],
                ],
                [
                    'description' => $collectionData['description'] ?? null,
                    'data' => json_encode($collectionData['data'] ?? []),
                ]
            );
            $synced[] = $collection;
        }

        return response()->json(['collections' => $synced]);
    }
}

