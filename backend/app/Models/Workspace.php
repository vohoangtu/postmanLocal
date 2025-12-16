<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Workspace extends BaseModel
{
    use HasFactory;

    protected $fillable = [
        'name',
        'description',
        'owner_id',
        'is_team',
    ];

    protected $casts = [
        'is_team' => 'boolean',
    ];

    /**
     * Get the owner of the workspace
     */
    public function owner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'owner_id');
    }

    /**
     * Get the team members
     */
    public function teamMembers(): HasMany
    {
        return $this->hasMany(TeamMember::class, 'team_id');
    }

    /**
     * Get the collections in this workspace
     */
    public function collections(): HasMany
    {
        return $this->hasMany(Collection::class);
    }

    /**
     * Get all users in this workspace (owner + team members)
     */
    public function users()
    {
        $owner = $this->owner;
        $members = $this->teamMembers()->with('user')->get()->pluck('user');
        return collect([$owner])->merge($members)->unique('id');
    }

    /**
     * Get collection workspace permissions
     */
    public function collectionWorkspacePermissions(): HasMany
    {
        return $this->hasMany(CollectionWorkspacePermission::class);
    }
}
