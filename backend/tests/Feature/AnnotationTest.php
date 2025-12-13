<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use App\Models\Collection;
use App\Models\Annotation;
use Illuminate\Foundation\Testing\RefreshDatabase;

class AnnotationTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
    }

    public function test_user_can_create_annotation()
    {
        $user = User::factory()->create();
        $collection = Collection::factory()->create(['user_id' => $user->id]);

        $response = $this->actingAs($user)->postJson("/api/annotations", [
            'request_id' => 'req-123',
            'collection_id' => $collection->id,
            'content' => 'This is an annotation',
            'position' => ['line' => 10, 'column' => 5],
        ]);

        $response->assertStatus(201)
            ->assertJsonStructure([
                'id',
                'request_id',
                'collection_id',
                'content',
                'position',
            ]);

        $this->assertDatabaseHas('annotations', [
            'request_id' => 'req-123',
            'collection_id' => $collection->id,
            'user_id' => $user->id,
        ]);
    }

    public function test_user_can_list_annotations()
    {
        $user = User::factory()->create();
        $collection = Collection::factory()->create(['user_id' => $user->id]);

        Annotation::factory()->count(2)->create([
            'collection_id' => $collection->id,
            'user_id' => $user->id,
            'request_id' => 'req-123',
        ]);

        $response = $this->actingAs($user)->getJson("/api/collections/{$collection->id}/annotations");

        $response->assertStatus(200)
            ->assertJsonCount(2);
    }

    public function test_user_can_update_own_annotation()
    {
        $user = User::factory()->create();
        $collection = Collection::factory()->create(['user_id' => $user->id]);
        $annotation = Annotation::factory()->create([
            'collection_id' => $collection->id,
            'user_id' => $user->id,
            'content' => 'Original annotation',
        ]);

        $response = $this->actingAs($user)->putJson("/api/annotations/{$annotation->id}", [
            'content' => 'Updated annotation',
        ]);

        $response->assertStatus(200);

        $this->assertDatabaseHas('annotations', [
            'id' => $annotation->id,
            'content' => 'Updated annotation',
        ]);
    }

    public function test_user_can_delete_own_annotation()
    {
        $user = User::factory()->create();
        $collection = Collection::factory()->create(['user_id' => $user->id]);
        $annotation = Annotation::factory()->create([
            'collection_id' => $collection->id,
            'user_id' => $user->id,
        ]);

        $response = $this->actingAs($user)->deleteJson("/api/annotations/{$annotation->id}");

        $response->assertStatus(200);

        $this->assertDatabaseMissing('annotations', [
            'id' => $annotation->id,
        ]);
    }
}
