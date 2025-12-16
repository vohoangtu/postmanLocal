<?php

namespace App\Http\Controllers;

use App\Models\ApiVersion;
use App\Models\Schema;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class ApiVersionController extends Controller
{
    /**
     * List versions for a schema
     */
    public function index(Request $request, string $schemaId)
    {
        $schema = Schema::where('user_id', Auth::id())
            ->orWhereHas('workspace.teamMembers', function ($query) {
                $query->where('user_id', Auth::id());
            })
            ->findOrFail($schemaId);

        $versions = ApiVersion::where('schema_id', $schemaId)
            ->orderBy('version_number', 'desc')
            ->with('createdBy')
            ->get();

        return response()->json($versions);
    }

    /**
     * Create a new version
     */
    public function store(Request $request, string $schemaId)
    {
        $schema = Schema::where('user_id', Auth::id())
            ->orWhereHas('workspace.teamMembers', function ($query) {
                $query->where('user_id', Auth::id());
            })
            ->findOrFail($schemaId);

        $request->validate([
            'version_name' => 'sometimes|string|max:255',
            'changelog' => 'sometimes|string',
        ]);

        // Get next version number
        $lastVersion = ApiVersion::where('schema_id', $schemaId)
            ->orderBy('version_number', 'desc')
            ->first();

        $versionNumber = $lastVersion ? $lastVersion->version_number + 1 : 1;

        // Set all other versions to not current
        if ($request->get('is_current', true)) {
            ApiVersion::where('schema_id', $schemaId)
                ->update(['is_current' => false]);
        }

        $version = ApiVersion::create([
            'schema_id' => $schemaId,
            'version_number' => $versionNumber,
            'version_name' => $request->version_name,
            'changelog' => $request->changelog,
            'schema_data' => $schema->schema_data,
            'is_current' => $request->get('is_current', true),
            'created_by_id' => Auth::id(),
        ]);

        return response()->json($version, 201);
    }

    /**
     * Get version diff
     */
    public function diff(Request $request, string $id)
    {
        $version = ApiVersion::with('schema')->findOrFail($id);

        // Check access
        $schema = $version->schema;
        if ($schema->user_id !== Auth::id() && 
            !$schema->workspace?->teamMembers()->where('user_id', Auth::id())->exists()) {
            abort(403, 'Unauthorized');
        }

        // Get previous version
        $previousVersion = ApiVersion::where('schema_id', $version->schema_id)
            ->where('version_number', '<', $version->version_number)
            ->orderBy('version_number', 'desc')
            ->first();

        if (!$previousVersion) {
            return response()->json([
                'current' => $version->schema_data,
                'previous' => null,
                'diff' => [],
            ]);
        }

        // Simple diff (có thể cải thiện với library chuyên dụng)
        $diff = $this->calculateDiff($previousVersion->schema_data, $version->schema_data);

        return response()->json([
            'current' => $version->schema_data,
            'previous' => $previousVersion->schema_data,
            'diff' => $diff,
        ]);
    }

    /**
     * Set version as current
     */
    public function setCurrent(Request $request, string $id)
    {
        $version = ApiVersion::with('schema')->findOrFail($id);

        // Check access
        $schema = $version->schema;
        if ($schema->user_id !== Auth::id() && 
            !$schema->workspace?->teamMembers()->where('user_id', Auth::id())->exists()) {
            abort(403, 'Unauthorized');
        }

        DB::transaction(function () use ($version, $schema) {
            // Set all versions to not current
            ApiVersion::where('schema_id', $schema->id)
                ->update(['is_current' => false]);

            // Set this version as current
            $version->update(['is_current' => true]);

            // Update schema with this version's data
            $schema->update(['schema_data' => $version->schema_data]);
        });

        return response()->json($version);
    }

    /**
     * Simple diff calculation
     */
    private function calculateDiff(array $old, array $new): array
    {
        $diff = [];

        // Compare keys
        $oldKeys = array_keys($old);
        $newKeys = array_keys($new);

        $added = array_diff($newKeys, $oldKeys);
        $removed = array_diff($oldKeys, $newKeys);
        $common = array_intersect($oldKeys, $newKeys);

        foreach ($added as $key) {
            $diff[] = [
                'type' => 'added',
                'path' => $key,
                'value' => $new[$key],
            ];
        }

        foreach ($removed as $key) {
            $diff[] = [
                'type' => 'removed',
                'path' => $key,
                'value' => $old[$key],
            ];
        }

        foreach ($common as $key) {
            if (is_array($old[$key]) && is_array($new[$key])) {
                $nestedDiff = $this->calculateDiff($old[$key], $new[$key]);
                foreach ($nestedDiff as $item) {
                    $item['path'] = $key . '.' . $item['path'];
                    $diff[] = $item;
                }
            } elseif ($old[$key] !== $new[$key]) {
                $diff[] = [
                    'type' => 'modified',
                    'path' => $key,
                    'old_value' => $old[$key],
                    'new_value' => $new[$key],
                ];
            }
        }

        return $diff;
    }
}
