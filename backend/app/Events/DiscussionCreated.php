<?php

namespace App\Events;

use App\Models\Discussion;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class DiscussionCreated implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $discussion;

    public function __construct(Discussion $discussion)
    {
        $this->discussion = $discussion->load(['creator']);
    }

    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('private-workspace.' . $this->discussion->workspace_id),
        ];
    }

    public function broadcastAs(): string
    {
        return 'discussion.created';
    }

    public function broadcastWith(): array
    {
        return [
            'discussion' => [
                'id' => $this->discussion->id,
                'title' => $this->discussion->title,
                'workspace_id' => $this->discussion->workspace_id,
                'created_by' => $this->discussion->created_by,
                'creator' => $this->discussion->creator ? [
                    'id' => $this->discussion->creator->id,
                    'name' => $this->discussion->creator->name,
                ] : null,
            ],
        ];
    }
}
