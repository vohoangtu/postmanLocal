<?php

namespace App\Http\Controllers;

use App\Models\Collection;
use App\Models\Workspace;
use App\Services\ApiDocumentationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Response;

class ApiDocumentationController extends BaseController
{
    protected $documentationService;

    public function __construct(ApiDocumentationService $documentationService)
    {
        $this->documentationService = $documentationService;
    }

    /**
     * Generate documentation for a collection
     */
    public function generate(Request $request, string $collectionId)
    {
        $collection = Collection::where('user_id', Auth::id())
            ->orWhereHas('shares', function ($query) {
                $query->where('shared_with_user_id', Auth::id());
            })
            ->findOrFail($collectionId);

        $format = $request->get('format', 'markdown');

        switch ($format) {
            case 'markdown':
                $content = $this->documentationService->generateMarkdown($collection);
                $filename = str_replace(' ', '-', strtolower($collection->name)) . '-documentation.md';
                $mimeType = 'text/markdown';
                break;
            case 'html':
                $content = $this->documentationService->generateHTML($collection);
                $filename = str_replace(' ', '-', strtolower($collection->name)) . '-documentation.html';
                $mimeType = 'text/html';
                break;
            case 'openapi':
                $openApi = $this->documentationService->generateOpenAPI($collection);
                $content = json_encode($openApi, JSON_PRETTY_PRINT);
                $filename = str_replace(' ', '-', strtolower($collection->name)) . '-openapi.json';
                $mimeType = 'application/json';
                break;
            default:
                return response()->json(['message' => 'Invalid format. Supported: markdown, html, openapi'], 400);
        }

        return Response::make($content, 200, [
            'Content-Type' => $mimeType,
            'Content-Disposition' => 'attachment; filename="' . $filename . '"',
        ]);
    }

    /**
     * Generate documentation for all collections in a workspace
     */
    public function generateWorkspace(Request $request, string $workspaceId)
    {
        // Check if user has access to workspace
        $workspace = Workspace::where('owner_id', Auth::id())
            ->orWhereHas('teamMembers', function ($query) {
                $query->where('user_id', Auth::id());
            })
            ->findOrFail($workspaceId);

        $format = $request->get('format', 'markdown');

        $content = $this->documentationService->generateWorkspaceDocumentation((int)$workspaceId, $format);
        
        switch ($format) {
            case 'markdown':
                $filename = str_replace(' ', '-', strtolower($workspace->name)) . '-documentation.md';
                $mimeType = 'text/markdown';
                break;
            case 'html':
                $filename = str_replace(' ', '-', strtolower($workspace->name)) . '-documentation.html';
                $mimeType = 'text/html';
                break;
            case 'openapi':
                $filename = str_replace(' ', '-', strtolower($workspace->name)) . '-openapi.json';
                $mimeType = 'application/json';
                break;
            default:
                return response()->json(['message' => 'Invalid format'], 400);
        }

        return Response::make($content, 200, [
            'Content-Type' => $mimeType,
            'Content-Disposition' => 'attachment; filename="' . $filename . '"',
        ]);
    }

    /**
     * Preview documentation (return as JSON for frontend rendering)
     */
    public function preview(Request $request, string $collectionId)
    {
        $collection = Collection::where('user_id', Auth::id())
            ->orWhereHas('shares', function ($query) {
                $query->where('shared_with_user_id', Auth::id());
            })
            ->findOrFail($collectionId);

        $format = $request->get('format', 'markdown');

        switch ($format) {
            case 'markdown':
                $content = $this->documentationService->generateMarkdown($collection);
                break;
            case 'html':
                $content = $this->documentationService->generateHTML($collection);
                break;
            case 'openapi':
                $content = $this->documentationService->generateOpenAPI($collection);
                break;
            default:
                return response()->json(['message' => 'Invalid format'], 400);
        }

        return response()->json([
            'format' => $format,
            'content' => $content,
        ]);
    }
}
