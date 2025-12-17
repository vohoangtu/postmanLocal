<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CollectionPermission extends BaseModel
{
    use HasFactory;

    protected $fillable = [
        'collection_id',
        'user_id',
        'permission',
    ];

    /**
     * Get the collection
     */
    public function collection(): BelongsTo
    {
        return $this->belongsTo(Collection::class);
    }

    /**
     * Get the user
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
