<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\Collection;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CollectionTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_create_collection()
    {
        $user = User::factory()->create();
        
        $response = $this->actingAs($user, 'sanctum')
            ->postJson('/api/collections', [
                'name' => 'Test Collection',
                'description' => 'Test Description',
            ]);

        $response->assertStatus(201);
        $response->assertJsonStructure([
            'id',
            'name',
            'description',
            'user_id',
        ]);
        
        $this->assertDatabaseHas('collections', [
            'name' => 'Test Collection',
            'user_id' => $user->id,
        ]);
    }

    public function test_user_can_list_their_collections()
    {
        $user = User::factory()->create();
        Collection::factory()->count(3)->create(['user_id' => $user->id]);
        Collection::factory()->count(2)->create(); // Other user's collections

        $response = $this->actingAs($user, 'sanctum')
            ->getJson('/api/collections');

        $response->assertStatus(200);
        $response->assertJsonCount(3);
    }

    public function test_user_can_update_collection()
    {
        $user = User::factory()->create();
        $collection = Collection::factory()->create(['user_id' => $user->id]);

        $response = $this->actingAs($user, 'sanctum')
            ->putJson("/api/collections/{$collection->id}", [
                'name' => 'Updated Name',
            ]);

        $response->assertStatus(200);
        $this->assertDatabaseHas('collections', [
            'id' => $collection->id,
            'name' => 'Updated Name',
        ]);
    }

    public function test_user_can_delete_collection()
    {
        $user = User::factory()->create();
        $collection = Collection::factory()->create(['user_id' => $user->id]);

        $response = $this->actingAs($user, 'sanctum')
            ->deleteJson("/api/collections/{$collection->id}");

        $response->assertStatus(200);
        $this->assertDatabaseMissing('collections', [
            'id' => $collection->id,
        ]);
    }
}
