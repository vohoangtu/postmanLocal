<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Environment extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'name',
        'variables',
    ];

    protected $casts = [
        'variables' => 'array',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}

