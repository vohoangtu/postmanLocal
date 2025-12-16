<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

/**
 * User Token Model
 * Quản lý token files cho user authentication
 */
class UserToken extends BaseModel
{
    protected $fillable = [
        'user_id',
        'token',
        'device_fingerprint',
        'device_info',
        'last_used_at',
    ];

    protected $casts = [
        'device_info' => 'array',
        'last_used_at' => 'datetime',
    ];

    /**
     * Relationship với User
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Tạo token ngẫu nhiên
     */
    public static function generateToken(): string
    {
        return Str::random(64);
    }

    /**
     * Check xem token đã bind với device chưa
     */
    public function isBoundToDevice(): bool
    {
        return !is_null($this->device_fingerprint);
    }

    /**
     * Bind token với device
     */
    public function bindToDevice(string $fingerprint, array $deviceInfo): void
    {
        $this->update([
            'device_fingerprint' => $fingerprint,
            'device_info' => $deviceInfo,
        ]);
    }

    /**
     * Scope: Query tokens của user
     */
    public function scopeForUser($query, string $userId)
    {
        return $query->where('user_id', $userId);
    }

    /**
     * Scope: Query token chưa bind với device
     */
    public function scopeUnbound($query)
    {
        return $query->whereNull('device_fingerprint');
    }

    /**
     * Scope: Query token đã bind với device
     */
    public function scopeBound($query)
    {
        return $query->whereNotNull('device_fingerprint');
    }
}
