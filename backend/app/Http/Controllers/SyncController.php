<?php

namespace App\Http\Controllers;

use App\Http\Controllers\CollectionController;
use App\Http\Controllers\EnvironmentController;
use App\Http\Controllers\SchemaController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class SyncController extends Controller
{
    public function sync(Request $request)
    {
        $request->validate([
            'collections' => 'sometimes|array',
            'environments' => 'sometimes|array',
            'schemas' => 'sometimes|array',
        ]);

        $result = [];

        if ($request->has('collections')) {
            $collectionController = new CollectionController();
            $collectionRequest = new Request(['collections' => $request->collections]);
            $collectionRequest->setUserResolver(fn() => Auth::user());
            $collectionResponse = $collectionController->sync($collectionRequest);
            $result['collections'] = $collectionResponse->getData(true)['collections'] ?? [];
        }

        if ($request->has('environments')) {
            $environmentController = new EnvironmentController();
            $environmentRequest = new Request(['environments' => $request->environments]);
            $environmentRequest->setUserResolver(fn() => Auth::user());
            $environmentResponse = $environmentController->sync($environmentRequest);
            $result['environments'] = $environmentResponse->getData(true)['environments'] ?? [];
        }

        if ($request->has('schemas')) {
            $schemaController = new SchemaController();
            $schemaRequest = new Request(['schemas' => $request->schemas]);
            $schemaRequest->setUserResolver(fn() => Auth::user());
            $schemaResponse = $schemaController->sync($schemaRequest);
            $result['schemas'] = $schemaResponse->getData(true)['schemas'] ?? [];
        }

        return response()->json($result);
    }
}

