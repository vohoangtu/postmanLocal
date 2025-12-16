<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;

class MockServer extends BaseModel
{
    use HasFactory;

    protected $fillable = [
        'workspace_id',
        'schema_id',
        'name',
        'base_url',
        'port',
        'is_active',
        'config',
        'created_by_id',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'config' => 'array',
    ];

    public function workspace()
    {
        return $this->belongsTo(Workspace::class);
    }

    public function schema()
    {
        return $this->belongsTo(Schema::class);
    }

    public function createdBy()
    {
        return $this->belongsTo(User::class, 'created_by_id');
    }
}
