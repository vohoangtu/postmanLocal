<?php

namespace App\Events;

use App\Models\Comment;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class CommentAdded implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $comment;

    public function __construct(Comment $comment)
    {
        $this->comment = $comment->load('user');
    }

    public function broadcastOn()
    {
        $channels = [];
        
        if ($this->comment->collection_id) {
            $channels[] = new PrivateChannel('collection.' . $this->comment->collection_id);
        }
        
        return $channels;
    }

    public function broadcastAs()
    {
        return 'comment.added';
    }

    public function broadcastWith()
    {
        return [
            'id' => $this->comment->id,
            'content' => $this->comment->content,
            'user' => $this->comment->user,
            'collection_id' => $this->comment->collection_id,
            'created_at' => $this->comment->created_at,
        ];
    }
}





