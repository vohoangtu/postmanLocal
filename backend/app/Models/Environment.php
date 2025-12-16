<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Support\Facades\Crypt;

class Environment extends BaseModel
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'workspace_id',
        'name',
        'variables',
    ];

    protected $casts = [
        'variables' => 'array',
    ];

    /**
     * Encrypt variables trước khi lưu
     */
    public function setVariablesAttribute($value)
    {
        if (is_array($value)) {
            // Encrypt từng variable value
            $encrypted = [];
            foreach ($value as $key => $var) {
                if (isset($var['value'])) {
                    $encrypted[$key] = [
                        'key' => $var['key'] ?? $key,
                        'value' => Crypt::encryptString($var['value']),
                        'enabled' => $var['enabled'] ?? true,
                    ];
                } else {
                    $encrypted[$key] = $var;
                }
            }
            $this->attributes['variables'] = json_encode($encrypted);
        } else {
            $this->attributes['variables'] = $value;
        }
    }

    /**
     * Decrypt variables khi đọc
     */
    public function getVariablesAttribute($value)
    {
        if (empty($value)) {
            return [];
        }

        $decoded = is_string($value) ? json_decode($value, true) : $value;
        
        if (!is_array($decoded)) {
            return [];
        }

        // Decrypt từng variable value
        $decrypted = [];
        foreach ($decoded as $key => $var) {
            if (isset($var['value'])) {
                try {
                    $decrypted[$key] = [
                        'key' => $var['key'] ?? $key,
                        'value' => Crypt::decryptString($var['value']),
                        'enabled' => $var['enabled'] ?? true,
                    ];
                } catch (\Exception $e) {
                    // Nếu không decrypt được, có thể là dữ liệu cũ chưa được encrypt
                    $decrypted[$key] = $var;
                }
            } else {
                $decrypted[$key] = $var;
            }
        }

        return $decrypted;
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function workspace()
    {
        return $this->belongsTo(Workspace::class);
    }

    /**
     * Scope để query environments theo workspace hoặc user
     */
    public function scopeForWorkspace($query, $workspaceId)
    {
        return $query->where('workspace_id', $workspaceId);
    }

    public function scopeForUser($query, $userId)
    {
        return $query->where('user_id', $userId)->whereNull('workspace_id');
    }
}

