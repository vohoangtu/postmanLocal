<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;

class ApiDesignReview extends BaseModel
{
    use HasFactory;

    protected $fillable = [
        'schema_id',
        'workspace_id',
        'requested_by_id',
        'reviewer_id',
        'status',
        'comments',
        'review_data',
        'reviewed_at',
    ];

    protected $casts = [
        'review_data' => 'array',
        'reviewed_at' => 'datetime',
    ];

    public function schema()
    {
        return $this->belongsTo(Schema::class);
    }

    public function workspace()
    {
        return $this->belongsTo(Workspace::class);
    }

    public function requestedBy()
    {
        return $this->belongsTo(User::class, 'requested_by_id');
    }

    public function reviewer()
    {
        return $this->belongsTo(User::class, 'reviewer_id');
    }
}
