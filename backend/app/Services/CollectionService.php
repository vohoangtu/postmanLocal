<?php

namespace App\Services;

use App\Models\Collection;
use Illuminate\Support\Facades\Auth;

class CollectionService
{
    public function syncCollections(array $collections): array
    {
        $synced = [];
        
        foreach ($collections as $collectionData) {
            $collection = Collection::updateOrCreate(
                [
                    'user_id' => Auth::id(),
                    'name' => $collectionData['name'],
                ],
                [
                    'description' => $collectionData['description'] ?? null,
                    'data' => $collectionData['data'] ?? [],
                ]
            );
            
            $synced[] = $collection;
        }
        
        return $synced;
    }
}

