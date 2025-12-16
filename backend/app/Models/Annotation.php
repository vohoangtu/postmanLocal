<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Annotation extends Model
{
    use HasFactory;

    protected $fillable = [
        'request_id',
        'user_id',
        'type',
        'content',
        'position',
    ];

    protected $casts = [
        'position' => 'array',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function request(): BelongsTo
    {
        return $this->belongsTo(\App\Models\Request::class);
    }
}


