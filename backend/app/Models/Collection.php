<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Collection extends Model
{
    use HasFactory;
    use HasFactory;

    protected $fillable = [
        'user_id',
        'workspace_id',
        'name',
        'description',
        'data',
        'is_shared',
        'is_template',
        'template_category',
        'template_tags',
        'current_version_id',
    ];

    protected $casts = [
        'data' => 'array',
        'is_shared' => 'boolean',
        'is_template' => 'boolean',
        'template_tags' => 'array',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function workspace()
    {
        return $this->belongsTo(Workspace::class);
    }

    public function shares()
    {
        return $this->hasMany(CollectionShare::class);
    }

    public function versions()
    {
        return $this->hasMany(CollectionVersion::class);
    }

    public function currentVersion()
    {
        return $this->belongsTo(CollectionVersion::class, 'current_version_id');
    }
}

