<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;

class ApiTemplate extends BaseModel
{
    use HasFactory;

    protected $fillable = [
        'name',
        'category',
        'description',
        'template_data',
        'is_public',
        'created_by_id',
    ];

    protected $casts = [
        'template_data' => 'array',
        'is_public' => 'boolean',
    ];

    public function createdBy()
    {
        return $this->belongsTo(User::class, 'created_by_id');
    }
}
