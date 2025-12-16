<?php

namespace App\Http\Controllers;

use App\Models\Annotation;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class AnnotationController extends Controller
{
    public function index($requestId)
    {
        $annotations = Annotation::where('request_id', $requestId)
            ->with('user')
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($annotations);
    }

    public function store(Request $request, $requestId)
    {
        $request->validate([
            'type' => 'required|in:note,highlight',
            'content' => 'required|string',
            'position' => 'nullable|array',
        ]);

        $annotation = Annotation::create([
            'request_id' => $requestId,
            'user_id' => Auth::id(),
            'type' => $request->type,
            'content' => $request->content,
            'position' => $request->position,
        ]);

        return response()->json($annotation->load('user'), 201);
    }

    public function destroy($id)
    {
        $annotation = Annotation::where('user_id', Auth::id())->findOrFail($id);
        $annotation->delete();

        return response()->json(['message' => 'Annotation deleted successfully']);
    }
}




