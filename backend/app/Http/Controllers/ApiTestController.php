<?php

namespace App\Http\Controllers;

use App\Models\ApiTestSuite;
use App\Models\Workspace;
use App\Models\Schema;
use App\Services\ContractTestService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class ApiTestController extends Controller
{
    protected $contractTestService;

    public function __construct(ContractTestService $contractTestService)
    {
        $this->contractTestService = $contractTestService;
    }

    /**
     * List test suites for workspace
     */
    public function index(Request $request, string $workspaceId)
    {
        $workspace = Workspace::where('owner_id', Auth::id())
            ->orWhereHas('teamMembers', function ($query) {
                $query->where('user_id', Auth::id());
            })
            ->findOrFail($workspaceId);

        $testSuites = ApiTestSuite::where('workspace_id', $workspaceId)
            ->with(['schema', 'createdBy'])
            ->get();

        return response()->json($testSuites);
    }

    /**
     * Create test suite
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
            'description' => 'sometimes|string',
            'schema_id' => 'sometimes|nullable|exists:schemas,id',
            'test_config' => 'required|array',
        ]);

        $testSuite = ApiTestSuite::create([
            'workspace_id' => $workspaceId,
            'schema_id' => $request->schema_id,
            'name' => $request->name,
            'description' => $request->description,
            'test_config' => $request->test_config,
            'status' => 'pending',
            'created_by_id' => Auth::id(),
        ]);

        return response()->json($testSuite, 201);
    }

    /**
     * Get test suite
     */
    public function show(string $id)
    {
        $testSuite = ApiTestSuite::with(['schema', 'workspace', 'createdBy'])
            ->findOrFail($id);

        // Check access
        if ($testSuite->workspace->owner_id !== Auth::id() &&
            !$testSuite->workspace->teamMembers()->where('user_id', Auth::id())->exists()) {
            abort(403, 'Unauthorized');
        }

        return response()->json($testSuite);
    }

    /**
     * Update test suite
     */
    public function update(Request $request, string $id)
    {
        $testSuite = ApiTestSuite::with('workspace')->findOrFail($id);

        // Check access
        if ($testSuite->workspace->owner_id !== Auth::id() &&
            !$testSuite->workspace->teamMembers()->where('user_id', Auth::id())->exists()) {
            abort(403, 'Unauthorized');
        }

        $request->validate([
            'name' => 'sometimes|string|max:255',
            'description' => 'sometimes|string',
            'test_config' => 'sometimes|array',
        ]);

        $testSuite->update($request->only(['name', 'description', 'test_config']));

        return response()->json($testSuite);
    }

    /**
     * Delete test suite
     */
    public function destroy(string $id)
    {
        $testSuite = ApiTestSuite::with('workspace')->findOrFail($id);

        // Check access
        if ($testSuite->workspace->owner_id !== Auth::id() &&
            !$testSuite->workspace->teamMembers()->where('user_id', Auth::id())->exists()) {
            abort(403, 'Unauthorized');
        }

        $testSuite->delete();

        return response()->json(['message' => 'Test suite deleted successfully']);
    }

    /**
     * Run test suite
     */
    public function run(string $id)
    {
        $testSuite = ApiTestSuite::with(['schema', 'workspace'])->findOrFail($id);

        // Check access
        if ($testSuite->workspace->owner_id !== Auth::id() &&
            !$testSuite->workspace->teamMembers()->where('user_id', Auth::id())->exists()) {
            abort(403, 'Unauthorized');
        }

        $testSuite->update(['status' => 'running']);

        try {
            $baseUrl = $testSuite->test_config['base_url'] ?? 'http://localhost:3000';

            if (!$testSuite->schema) {
                throw new \Exception('No schema associated with test suite');
            }

            $results = $this->contractTestService->runContractTests(
                $testSuite->schema,
                $baseUrl
            );

            $testSuite->update([
                'status' => $results['status'],
                'results' => $results,
                'last_run_at' => now(),
            ]);

            return response()->json($testSuite);
        } catch (\Exception $e) {
            $testSuite->update([
                'status' => 'error',
                'results' => [
                    'error' => $e->getMessage(),
                ],
            ]);

            return response()->json([
                'error' => $e->getMessage(),
                'test_suite' => $testSuite,
            ], 500);
        }
    }

    /**
     * Run contract test
     */
    public function contractTest(Request $request, string $id)
    {
        $testSuite = ApiTestSuite::with(['schema', 'workspace'])->findOrFail($id);

        // Check access
        if ($testSuite->workspace->owner_id !== Auth::id() &&
            !$testSuite->workspace->teamMembers()->where('user_id', Auth::id())->exists()) {
            abort(403, 'Unauthorized');
        }

        $request->validate([
            'base_url' => 'required|string|url',
        ]);

        if (!$testSuite->schema) {
            return response()->json(['error' => 'No schema associated with test suite'], 400);
        }

        try {
            $results = $this->contractTestService->runContractTests(
                $testSuite->schema,
                $request->base_url
            );

            $testSuite->update([
                'status' => $results['status'],
                'results' => $results,
                'last_run_at' => now(),
            ]);

            return response()->json($testSuite);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }
}
