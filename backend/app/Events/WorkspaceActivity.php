<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Auth;

class WorkspaceActivity implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $workspaceId;
    public $action;
    public $entityType;
    public $entityId;
    public $entityName;
    public $userId;

    public function __construct($workspaceId, $action, $entityType = null, $entityId = null, $entityName = null)
    {
        $this->workspaceId = $workspaceId;
        $this->action = $action;
        $this->entityType = $entityType;
        $this->entityId = $entityId;
        $this->entityName = $entityName;
        $this->userId = Auth::id();
    }

    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('private-workspace.' . $this->workspaceId),
        ];
    }

    public function broadcastAs(): string
    {
        return 'activity.real-time';
    }

    public function broadcastWith(): array
    {
        return [
            'id' => uniqid(),
            'workspace_id' => $this->workspaceId,
            'user_id' => $this->userId,
            'action' => $this->action,
            'entity_type' => $this->entityType,
            'entity_id' => $this->entityId,
            'entity_name' => $this->entityName,
            'user' => Auth::user() ? [
                'id' => Auth::id(),
                'name' => Auth::user()->name,
                'email' => Auth::user()->email,
            ] : null,
            'created_at' => now()->toISOString(),
        ];
    }
}
