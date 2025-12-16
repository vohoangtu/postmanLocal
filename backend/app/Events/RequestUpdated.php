<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Auth;

class RequestUpdated implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $requestId;
    public $collectionId;
    public $workspaceId;
    public $userId;
    public $changes;
    public $timestamp;

    public function __construct($requestId, $collectionId, $workspaceId = null, $changes = [])
    {
        $this->requestId = $requestId;
        $this->collectionId = $collectionId;
        $this->workspaceId = $workspaceId;
        $this->userId = Auth::id();
        $this->changes = $changes;
        $this->timestamp = now()->toISOString();
    }

    public function broadcastOn(): array
    {
        $channels = [
            new PrivateChannel('collection.' . $this->collectionId),
        ];

        if ($this->workspaceId) {
            $channels[] = new PrivateChannel('private-workspace.' . $this->workspaceId);
        }

        return $channels;
    }

    public function broadcastAs(): string
    {
        return 'request.updated';
    }

    public function broadcastWith(): array
    {
        return [
            'request_id' => $this->requestId,
            'collection_id' => $this->collectionId,
            'workspace_id' => $this->workspaceId,
            'user_id' => $this->userId,
            'user' => Auth::user() ? [
                'id' => Auth::id(),
                'name' => Auth::user()->name,
                'email' => Auth::user()->email,
            ] : null,
            'changes' => $this->changes,
            'timestamp' => $this->timestamp,
        ];
    }
}
