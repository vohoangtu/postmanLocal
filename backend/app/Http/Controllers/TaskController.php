<?php

namespace App\Http\Controllers;

use App\Models\Task;
use App\Models\Workspace;
use App\Events\TaskCreated;
use App\Events\TaskUpdated;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class TaskController extends BaseController
{
    /**
     * Get tasks for a workspace
     */
    public function index(Request $request, string $workspaceId)
    {
        $workspace = Workspace::where('owner_id', Auth::id())
            ->orWhereHas('teamMembers', function ($query) {
                $query->where('user_id', Auth::id());
            })
            ->findOrFail($workspaceId);

        $query = Task::where('workspace_id', $workspaceId)
            ->with(['assignedUser', 'creator', 'collection']);

        // Filter by status
        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        // Filter by assigned user
        if ($request->has('assigned_to')) {
            $query->where('assigned_to', $request->assigned_to);
        }

        // Filter by priority
        if ($request->has('priority')) {
            $query->where('priority', $request->priority);
        }

        // Sort
        $sortBy = $request->get('sort_by', 'created_at');
        $sortOrder = $request->get('sort_order', 'desc');
        $query->orderBy($sortBy, $sortOrder);

        // Pagination
        if ($request->has('page') || $request->has('per_page')) {
            $perPage = $request->get('per_page', 15);
            $tasks = $query->paginate($perPage);
            return response()->json($tasks);
        }

        return response()->json($query->get());
    }

    /**
     * Create a new task
     */
    public function store(Request $request, string $workspaceId)
    {
        $workspace = Workspace::where('owner_id', Auth::id())
            ->orWhereHas('teamMembers', function ($query) {
                $query->where('user_id', Auth::id())
                    ->whereIn('role', ['owner', 'admin', 'member']);
            })
            ->findOrFail($workspaceId);

        $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'collection_id' => 'nullable|exists:collections,id',
            'request_id' => 'nullable|string',
            'assigned_to' => 'nullable|exists:users,id',
            'priority' => 'nullable|in:low,medium,high,urgent',
            'due_date' => 'nullable|date',
        ]);

        $task = Task::create([
            'workspace_id' => $workspaceId,
            'collection_id' => $request->collection_id,
            'request_id' => $request->request_id,
            'title' => $request->title,
            'description' => $request->description,
            'assigned_to' => $request->assigned_to,
            'created_by' => Auth::id(),
            'priority' => $request->priority ?? 'medium',
            'due_date' => $request->due_date,
        ]);

        $task->load(['assignedUser', 'creator', 'collection']);
        
        // Broadcast event
        event(new TaskCreated($task));

        return response()->json($task, 201);
    }

    /**
     * Update a task
     */
    public function update(Request $request, string $id)
    {
        $task = Task::findOrFail($id);

        // Check permission
        $workspace = $task->workspace;
        $isOwner = $workspace->owner_id === Auth::id();
        $isAssigned = $task->assigned_to === Auth::id();
        $isCreator = $task->created_by === Auth::id();
        $isAdmin = $workspace->teamMembers()
            ->where('user_id', Auth::id())
            ->whereIn('role', ['owner', 'admin'])
            ->exists();

        if (!$isOwner && !$isAssigned && !$isCreator && !$isAdmin) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $request->validate([
            'title' => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'status' => 'sometimes|in:todo,in_progress,done,cancelled',
            'priority' => 'sometimes|in:low,medium,high,urgent',
            'assigned_to' => 'nullable|exists:users,id',
            'due_date' => 'nullable|date',
        ]);

        $task->update($request->only([
            'title', 'description', 'status', 'priority', 'assigned_to', 'due_date'
        ]));

        $task->load(['assignedUser', 'creator', 'collection']);
        
        // Broadcast event
        event(new TaskUpdated($task));

        return response()->json($task);
    }

    /**
     * Delete a task
     */
    public function destroy(string $id)
    {
        $task = Task::findOrFail($id);

        // Check permission - only owner, creator, or admin can delete
        $workspace = $task->workspace;
        $isOwner = $workspace->owner_id === Auth::id();
        $isCreator = $task->created_by === Auth::id();
        $isAdmin = $workspace->teamMembers()
            ->where('user_id', Auth::id())
            ->whereIn('role', ['owner', 'admin'])
            ->exists();

        if (!$isOwner && !$isCreator && !$isAdmin) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $task->delete();

        return response()->json(['message' => 'Task deleted successfully']);
    }

    /**
     * Assign task to user
     */
    public function assign(Request $request, string $id)
    {
        $task = Task::findOrFail($id);

        $request->validate([
            'assigned_to' => 'required|exists:users,id',
        ]);

        $task->update(['assigned_to' => $request->assigned_to]);
        $task->load(['assignedUser', 'creator', 'collection']);
        
        // Broadcast event
        event(new TaskUpdated($task));

        return response()->json($task);
    }

    /**
     * Complete a task
     */
    public function complete(string $id)
    {
        $task = Task::findOrFail($id);
        $task->update(['status' => 'done']);
        $task->load(['assignedUser', 'creator', 'collection']);
        
        // Broadcast event
        event(new TaskUpdated($task));

        return response()->json($task);
    }
}
