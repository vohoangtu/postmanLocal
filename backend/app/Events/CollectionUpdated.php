<?php

namespace App\Events;

use App\Models\Collection;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class CollectionUpdated implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $collection;

    /**
     * Create a new event instance.
     */
    public function __construct(Collection $collection)
    {
        $this->collection = $collection;
    }

    /**
     * Get the channels the event should broadcast on.
     */
    public function broadcastOn(): array
    {
        $channels = [
            new PrivateChannel('collection.' . $this->collection->id),
        ];

        // Also broadcast to workspace channel if collection belongs to workspace
        if ($this->collection->workspace_id) {
            $channels[] = new PrivateChannel('workspace.' . $this->collection->workspace_id);
        }

        return $channels;
    }

    /**
     * The event's broadcast name.
     */
    public function broadcastAs(): string
    {
        return 'collection.updated';
    }

    /**
     * Get the data to broadcast.
     */
    public function broadcastWith(): array
    {
        return [
            'collection' => [
                'id' => $this->collection->id,
                'name' => $this->collection->name,
                'description' => $this->collection->description,
                'updated_at' => $this->collection->updated_at->toISOString(),
            ],
        ];
    }
}
