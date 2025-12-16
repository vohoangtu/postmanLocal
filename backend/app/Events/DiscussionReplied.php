<?php

namespace App\Events;

use App\Models\DiscussionReply;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class DiscussionReplied implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $reply;
    public $workspaceId;

    public function __construct(DiscussionReply $reply)
    {
        $this->reply = $reply->load(['user', 'discussion']);
        $this->workspaceId = $reply->discussion->workspace_id;
    }

    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('private-workspace.' . $this->workspaceId),
        ];
    }

    public function broadcastAs(): string
    {
        return 'discussion.replied';
    }

    public function broadcastWith(): array
    {
        return [
            'reply' => [
                'id' => $this->reply->id,
                'content' => $this->reply->content,
                'discussion_id' => $this->reply->discussion_id,
                'user' => $this->reply->user ? [
                    'id' => $this->reply->user->id,
                    'name' => $this->reply->user->name,
                ] : null,
            ],
        ];
    }
}
