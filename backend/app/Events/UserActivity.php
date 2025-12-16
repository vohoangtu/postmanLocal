<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Auth;

class UserActivity implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $userId;
    public $workspaceId;
    public $action; // 'editing', 'viewing', 'idle'
    public $entityType;
    public $entityId;

    public function __construct($workspaceId, $action, $entityType = null, $entityId = null)
    {
        $this->userId = Auth::id();
        $this->workspaceId = $workspaceId;
        $this->action = $action;
        $this->entityType = $entityType;
        $this->entityId = $entityId;
    }

    public function broadcastOn()
    {
        return [
            new PresenceChannel('presence-workspace.' . $this->workspaceId),
            new PrivateChannel('private-workspace.' . $this->workspaceId),
        ];
    }

    public function broadcastAs()
    {
        return 'user.activity';
    }

    public function broadcastWith()
    {
        return [
            'user_id' => $this->userId,
            'action' => $this->action,
            'entity_type' => $this->entityType,
            'entity_id' => $this->entityId,
        ];
    }
}




