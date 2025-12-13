<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use App\Models\Workspace;
use App\Models\TeamMember;
use Illuminate\Foundation\Testing\RefreshDatabase;

class WorkspaceTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
    }

    public function test_user_can_create_workspace()
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->postJson('/api/workspaces', [
            'name' => 'Test Workspace',
            'description' => 'Test description',
        ]);

        $response->assertStatus(201)
            ->assertJsonStructure([
                'id',
                'name',
                'description',
                'owner_id',
            ]);

        $this->assertDatabaseHas('workspaces', [
            'name' => 'Test Workspace',
            'owner_id' => $user->id,
        ]);
    }

    public function test_user_can_list_their_workspaces()
    {
        $user = User::factory()->create();
        $workspace = Workspace::factory()->create(['owner_id' => $user->id]);

        $response = $this->actingAs($user)->getJson('/api/workspaces');

        $response->assertStatus(200)
            ->assertJsonCount(1)
            ->assertJsonFragment([
                'id' => $workspace->id,
                'name' => $workspace->name,
            ]);
    }

    public function test_user_can_invite_member_to_workspace()
    {
        $owner = User::factory()->create();
        $member = User::factory()->create();
        $workspace = Workspace::factory()->create(['owner_id' => $owner->id]);

        $response = $this->actingAs($owner)->postJson("/api/workspaces/{$workspace->id}/invite", [
            'email' => $member->email,
            'role' => 'member',
        ]);

        $response->assertStatus(200);

        $this->assertDatabaseHas('team_members', [
            'workspace_id' => $workspace->id,
            'user_id' => $member->id,
            'role' => 'member',
        ]);
    }

    public function test_only_owner_can_invite_members()
    {
        $owner = User::factory()->create();
        $member = User::factory()->create();
        $workspace = Workspace::factory()->create(['owner_id' => $owner->id]);

        $response = $this->actingAs($member)->postJson("/api/workspaces/{$workspace->id}/invite", [
            'email' => 'test@example.com',
            'role' => 'member',
        ]);

        $response->assertStatus(403);
    }
}
