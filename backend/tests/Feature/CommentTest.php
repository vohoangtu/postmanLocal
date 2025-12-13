<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use App\Models\Collection;
use App\Models\Comment;
use Illuminate\Foundation\Testing\RefreshDatabase;

class CommentTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
    }

    public function test_user_can_create_comment()
    {
        $user = User::factory()->create();
        $collection = Collection::factory()->create(['user_id' => $user->id]);

        $response = $this->actingAs($user)->postJson("/api/collections/{$collection->id}/comments", [
            'content' => 'This is a test comment',
            'request_id' => null,
        ]);

        $response->assertStatus(201)
            ->assertJsonStructure([
                'id',
                'content',
                'user_id',
                'collection_id',
            ]);

        $this->assertDatabaseHas('comments', [
            'collection_id' => $collection->id,
            'user_id' => $user->id,
            'content' => 'This is a test comment',
        ]);
    }

    public function test_user_can_list_comments()
    {
        $user = User::factory()->create();
        $collection = Collection::factory()->create(['user_id' => $user->id]);

        Comment::factory()->count(3)->create([
            'collection_id' => $collection->id,
            'user_id' => $user->id,
        ]);

        $response = $this->actingAs($user)->getJson("/api/collections/{$collection->id}/comments");

        $response->assertStatus(200)
            ->assertJsonCount(3);
    }

    public function test_user_can_update_own_comment()
    {
        $user = User::factory()->create();
        $collection = Collection::factory()->create(['user_id' => $user->id]);
        $comment = Comment::factory()->create([
            'collection_id' => $collection->id,
            'user_id' => $user->id,
            'content' => 'Original comment',
        ]);

        $response = $this->actingAs($user)->putJson("/api/comments/{$comment->id}", [
            'content' => 'Updated comment',
        ]);

        $response->assertStatus(200);

        $this->assertDatabaseHas('comments', [
            'id' => $comment->id,
            'content' => 'Updated comment',
        ]);
    }

    public function test_user_can_delete_own_comment()
    {
        $user = User::factory()->create();
        $collection = Collection::factory()->create(['user_id' => $user->id]);
        $comment = Comment::factory()->create([
            'collection_id' => $collection->id,
            'user_id' => $user->id,
        ]);

        $response = $this->actingAs($user)->deleteJson("/api/comments/{$comment->id}");

        $response->assertStatus(200);

        $this->assertDatabaseMissing('comments', [
            'id' => $comment->id,
        ]);
    }
}
