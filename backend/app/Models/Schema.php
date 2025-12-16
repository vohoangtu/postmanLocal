<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;

class Schema extends BaseModel
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'workspace_id',
        'name',
        'schema_data',
    ];

    protected $casts = [
        'schema_data' => 'array',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function workspace()
    {
        return $this->belongsTo(Workspace::class);
    }
}

