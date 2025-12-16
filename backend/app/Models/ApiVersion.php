<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;

class ApiVersion extends BaseModel
{
    use HasFactory;

    protected $fillable = [
        'schema_id',
        'version_number',
        'version_name',
        'changelog',
        'schema_data',
        'is_current',
        'created_by_id',
    ];

    protected $casts = [
        'schema_data' => 'array',
        'is_current' => 'boolean',
    ];

    public function schema()
    {
        return $this->belongsTo(Schema::class);
    }

    public function createdBy()
    {
        return $this->belongsTo(User::class, 'created_by_id');
    }
}
