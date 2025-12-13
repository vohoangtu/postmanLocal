<?php

namespace App\Http\Controllers;

use App\Models\Workspace;
use App\Models\TeamMember;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;

class WorkspaceController extends BaseController
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $cacheKey = $this->getUserCacheKey('workspaces', Auth::id());
        
        $workspaces = $this->cache($cacheKey, 300, function () use ($request) {
            $query = Workspace::where('owner_id', Auth::id())
                ->orWhereHas('teamMembers', function ($query) {
                    $query->where('user_id', Auth::id());
                })
                ->with(['owner', 'teamMembers.user'])
                ->orderBy('updated_at', 'desc');
            
            // Pagination
            if ($request->has('page') || $request->has('per_page')) {
                return $this->paginate($query, $request);
            }
            
            return $query->get();
        });

        return response()->json($workspaces);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'is_team' => 'boolean',
        ]);

        $workspace = Workspace::create([
            'name' => $request->name,
            'description' => $request->description,
            'owner_id' => Auth::id(),
            'is_team' => $request->is_team ?? false,
        ]);

        // If it's a team, add owner as team member with owner role
        if ($workspace->is_team) {
            TeamMember::create([
                'team_id' => $workspace->id,
                'user_id' => Auth::id(),
                'role' => 'owner',
            ]);
        }

        // Invalidate cache
        Cache::forget($this->getUserCacheKey('workspaces', Auth::id()));

        return response()->json($workspace->load(['owner', 'teamMembers.user']), 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        $workspace = Workspace::where('owner_id', Auth::id())
            ->orWhereHas('teamMembers', function ($query) {
                $query->where('user_id', Auth::id());
            })
            ->with(['owner', 'teamMembers.user', 'collections'])
            ->findOrFail($id);

        return response()->json($workspace);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        $workspace = Workspace::where('owner_id', Auth::id())
            ->findOrFail($id);

        $request->validate([
            'name' => 'sometimes|string|max:255',
            'description' => 'nullable|string',
        ]);

        $workspace->update($request->only(['name', 'description']));

        return response()->json($workspace->load(['owner', 'teamMembers.user']));
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        $workspace = Workspace::where('owner_id', Auth::id())
            ->findOrFail($id);

        $workspace->delete();

        return response()->json(['message' => 'Workspace deleted successfully']);
    }

    /**
     * Invite a user to the workspace
     */
    public function invite(Request $request, string $id)
    {
        $workspace = Workspace::where('owner_id', Auth::id())
            ->orWhereHas('teamMembers', function ($query) {
                $query->where('user_id', Auth::id())
                    ->whereIn('role', ['owner', 'admin']);
            })
            ->findOrFail($id);

        $request->validate([
            'email' => 'required|email|exists:users,email',
            'role' => 'required|in:admin,member,viewer',
        ]);

        $user = User::where('email', $request->email)->first();

        // Check if user is already a member
        if ($workspace->teamMembers()->where('user_id', $user->id)->exists()) {
            return response()->json(['message' => 'User is already a member'], 400);
        }

        $member = TeamMember::create([
            'team_id' => $workspace->id,
            'user_id' => $user->id,
            'role' => $request->role,
        ]);

        return response()->json($member->load('user'), 201);
    }

    /**
     * Remove a member from the workspace
     */
    public function removeMember(string $id, string $userId)
    {
        $workspace = Workspace::where('owner_id', Auth::id())
            ->orWhereHas('teamMembers', function ($query) {
                $query->where('user_id', Auth::id())
                    ->whereIn('role', ['owner', 'admin']);
            })
            ->findOrFail($id);

        // Cannot remove owner
        if ($workspace->owner_id == $userId) {
            return response()->json(['message' => 'Cannot remove workspace owner'], 400);
        }

        $member = TeamMember::where('team_id', $workspace->id)
            ->where('user_id', $userId)
            ->firstOrFail();

        $member->delete();

        return response()->json(['message' => 'Member removed successfully']);
    }
}
