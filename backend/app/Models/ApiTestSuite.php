<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;

class ApiTestSuite extends BaseModel
{
    use HasFactory;

    protected $fillable = [
        'workspace_id',
        'schema_id',
        'name',
        'description',
        'test_config',
        'results',
        'status',
        'created_by_id',
        'last_run_at',
    ];

    protected $casts = [
        'test_config' => 'array',
        'results' => 'array',
        'last_run_at' => 'datetime',
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
