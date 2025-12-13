<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use App\Models\Collection;
use App\Models\CollectionVersion;
use Illuminate\Foundation\Testing\RefreshDatabase;

class VersionControlTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
    }

    public function test_user_can_create_collection_version()
    {
        $user = User::factory()->create();
        $collection = Collection::factory()->create(['user_id' => $user->id]);

        $response = $this->actingAs($user)->postJson("/api/collections/{$collection->id}/versions", [
            'snapshot' => ['name' => 'Updated Collection', 'requests' => []],
        ]);

        $response->assertStatus(201)
            ->assertJsonStructure([
                'id',
                'collection_id',
                'version',
                'snapshot',
            ]);

        $this->assertDatabaseHas('collection_versions', [
            'collection_id' => $collection->id,
            'version' => 1,
        ]);
    }

    public function test_user_can_list_collection_versions()
    {
        $user = User::factory()->create();
        $collection = Collection::factory()->create(['user_id' => $user->id]);

        CollectionVersion::create([
            'collection_id' => $collection->id,
            'version' => 1,
            'snapshot' => ['name' => 'Version 1'],
        ]);

        CollectionVersion::create([
            'collection_id' => $collection->id,
            'version' => 2,
            'snapshot' => ['name' => 'Version 2'],
        ]);

        $response = $this->actingAs($user)->getJson("/api/collections/{$collection->id}/versions");

        $response->assertStatus(200)
            ->assertJsonCount(2);
    }

    public function test_user_can_restore_collection_version()
    {
        $user = User::factory()->create();
        $collection = Collection::factory()->create([
            'user_id' => $user->id,
            'name' => 'Current Name',
        ]);

        $version = CollectionVersion::create([
            'collection_id' => $collection->id,
            'version' => 1,
            'snapshot' => ['name' => 'Old Name', 'requests' => []],
        ]);

        $response = $this->actingAs($user)->postJson("/api/collections/{$collection->id}/restore/{$version->id}");

        $response->assertStatus(200);

        $collection->refresh();
        // Collection should be updated with version data
        $this->assertNotNull($collection->version);
    }
}
