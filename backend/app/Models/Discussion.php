<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Discussion extends BaseModel
{
    use HasFactory;

    protected $fillable = [
        'collection_id',
        'title',
        'content',
        'created_by',
        'resolved',
        'resolved_by',
        'resolved_at',
    ];

    protected $casts = [
        'resolved' => 'boolean',
        'resolved_at' => 'datetime',
    ];

    /**
     * Get the collection
     */
    public function collection(): BelongsTo
    {
        return $this->belongsTo(Collection::class);
    }

    /**
     * Get the creator
     */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Get the resolver
     */
    public function resolver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'resolved_by');
    }

    /**
     * Get the replies
     */
    public function replies(): HasMany
    {
        return $this->hasMany(DiscussionReply::class)->orderBy('created_at', 'asc');
    }
}
