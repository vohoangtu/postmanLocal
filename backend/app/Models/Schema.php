<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Schema extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
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
}

