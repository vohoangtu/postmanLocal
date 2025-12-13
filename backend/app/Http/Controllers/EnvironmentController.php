<?php

namespace App\Http\Controllers;

use App\Models\Environment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class EnvironmentController extends Controller
{
    public function index()
    {
        $environments = Environment::where('user_id', Auth::id())->get();
        return response()->json($environments);
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'variables' => 'nullable|json',
        ]);

        $environment = Environment::create([
            'user_id' => Auth::id(),
            'name' => $request->name,
            'variables' => $request->variables,
        ]);

        return response()->json($environment, 201);
    }

    public function show($id)
    {
        $environment = Environment::where('user_id', Auth::id())
            ->findOrFail($id);
        return response()->json($environment);
    }

    public function update(Request $request, $id)
    {
        $environment = Environment::where('user_id', Auth::id())
            ->findOrFail($id);

        $request->validate([
            'name' => 'sometimes|string|max:255',
            'variables' => 'nullable|json',
        ]);

        $environment->update($request->only(['name', 'variables']));

        return response()->json($environment);
    }

    public function destroy($id)
    {
        $environment = Environment::where('user_id', Auth::id())
            ->findOrFail($id);
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

