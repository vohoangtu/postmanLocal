<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;

class Collection extends BaseModel
{
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
        'is_default',
    ];

    protected $casts = [
        'data' => 'array',
        'is_shared' => 'boolean',
        'is_template' => 'boolean',
        'template_tags' => 'array',
        'is_default' => 'boolean',
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

    /**
     * Get workspace permissions for this collection
     */
    public function workspacePermissions()
    {
        return $this->hasMany(CollectionWorkspacePermission::class);
    }

    /**
     * Lấy default collection của user
     */
    public static function getDefaultCollection(string $userId): ?self
    {
        return self::where('user_id', $userId)
            ->where('is_default', true)
            ->first();
    }

    /**
     * Set collection này làm default
     */
    public function setAsDefault(): void
    {
        // Unset default của các collection khác cùng user (đảm bảo chỉ có 1 default)
        self::where('user_id', $this->user_id)
            ->where('id', '!=', $this->id)
            ->where('is_default', true)
            ->update(['is_default' => false]);

        // Set collection này làm default
        $this->is_default = true;
        $this->save();
    }

    /**
     * Unset default (chỉ dùng khi cần)
     */
    public function unsetDefault(): void
    {
        $this->update(['is_default' => false]);
    }
}

