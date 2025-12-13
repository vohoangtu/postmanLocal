<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use App\Models\Collection;
use App\Models\CollectionShare;
use Illuminate\Foundation\Testing\RefreshDatabase;

class CollectionSharingTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
    }

    public function test_user_can_share_collection()
    {
        $owner = User::factory()->create();
        $sharedWith = User::factory()->create();
        $collection = Collection::factory()->create(['user_id' => $owner->id]);

        $response = $this->actingAs($owner)->postJson("/api/collections/{$collection->id}/share", [
            'user_id' => $sharedWith->id,
            'permission' => 'read',
        ]);

        $response->assertStatus(200);

        $this->assertDatabaseHas('collection_shares', [
            'collection_id' => $collection->id,
            'shared_with_user_id' => $sharedWith->id,
            'permission' => 'read',
        ]);
    }

    public function test_shared_user_can_access_collection()
    {
        $owner = User::factory()->create();
        $sharedWith = User::factory()->create();
        $collection = Collection::factory()->create(['user_id' => $owner->id]);

        CollectionShare::create([
            'collection_id' => $collection->id,
            'shared_by_user_id' => $owner->id,
            'shared_with_user_id' => $sharedWith->id,
            'permission' => 'read',
        ]);

        $response = $this->actingAs($sharedWith)->getJson("/api/collections/{$collection->id}");

        $response->assertStatus(200)
            ->assertJsonFragment([
                'id' => $collection->id,
            ]);
    }

    public function test_user_can_update_share_permission()
    {
        $owner = User::factory()->create();
        $sharedWith = User::factory()->create();
        $collection = Collection::factory()->create(['user_id' => $owner->id]);

        $share = CollectionShare::create([
            'collection_id' => $collection->id,
            'shared_by_user_id' => $owner->id,
            'shared_with_user_id' => $sharedWith->id,
            'permission' => 'read',
        ]);

        $response = $this->actingAs($owner)->putJson("/api/collections/{$collection->id}/shares/{$share->id}", [
            'permission' => 'write',
        ]);

        $response->assertStatus(200);

        $this->assertDatabaseHas('collection_shares', [
            'id' => $share->id,
            'permission' => 'write',
        ]);
    }

    public function test_user_can_revoke_share()
    {
        $owner = User::factory()->create();
        $sharedWith = User::factory()->create();
        $collection = Collection::factory()->create(['user_id' => $owner->id]);

        $share = CollectionShare::create([
            'collection_id' => $collection->id,
            'shared_by_user_id' => $owner->id,
            'shared_with_user_id' => $sharedWith->id,
            'permission' => 'read',
        ]);

        $response = $this->actingAs($owner)->deleteJson("/api/collections/{$collection->id}/shares/{$share->id}");

        $response->assertStatus(200);

        $this->assertDatabaseMissing('collection_shares', [
            'id' => $share->id,
        ]);
    }
}
