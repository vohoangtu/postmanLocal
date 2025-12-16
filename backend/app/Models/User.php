<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Str;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, Notifiable, HasApiTokens, HasUuids;

    /**
     * Loại khóa chính là string (UUID)
     */
    protected $keyType = 'string';

    /**
     * Không sử dụng auto-increment
     */
    public $incrementing = false;

    /**
     * Tên cột khóa chính
     */
    protected $primaryKey = 'id';

    /**
     * Generate UUID v7 mới khi tạo user
     */
    public function newUniqueId(): string
    {
        return (string) Str::uuid();
    }

    /**
     * Lấy tên cột để lưu UUID
     */
    public function uniqueIds(): array
    {
        return ['id'];
    }

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'role',
        'failed_login_attempts',
        'locked_until',
        'last_login_attempt_at',
        'two_factor_enabled',
        'two_factor_secret',
        'two_factor_recovery_codes',
        'preferences',
        'onboarding',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'locked_until' => 'datetime',
            'last_login_attempt_at' => 'datetime',
            'two_factor_enabled' => 'boolean',
            'two_factor_recovery_codes' => 'array',
            'preferences' => 'array',
            'onboarding' => 'array',
        ];
    }

    /**
     * Kiểm tra account có bị lock không
     */
    public function isLocked(): bool
    {
        if (!$this->locked_until) {
            return false;
        }

        // Nếu đã hết thời gian lock, tự động unlock
        if ($this->locked_until->isPast()) {
            $this->unlock();
            return false;
        }

        return true;
    }

    /**
     * Lock account
     */
    public function lock(int $minutes = 15): void
    {
        $this->update([
            'locked_until' => now()->addMinutes($minutes),
        ]);
    }

    /**
     * Unlock account
     */
    public function unlock(): void
    {
        $this->update([
            'failed_login_attempts' => 0,
            'locked_until' => null,
            'last_login_attempt_at' => null,
        ]);
    }

    /**
     * Tăng số lần failed login attempts
     */
    public function incrementFailedAttempts(): void
    {
        $this->increment('failed_login_attempts');
        $this->update(['last_login_attempt_at' => now()]);

        // Lock sau 5 failed attempts
        if ($this->failed_login_attempts >= 5) {
            $this->lock(15);
        }
    }

    /**
     * Reset failed login attempts
     */
    public function resetFailedAttempts(): void
    {
        $this->update([
            'failed_login_attempts' => 0,
            'last_login_attempt_at' => null,
        ]);
    }

    /**
     * Kiểm tra user có phải admin không
     */
    public function isAdmin(): bool
    {
        return in_array($this->role, ['admin', 'super_admin']);
    }

    /**
     * Kiểm tra user có phải super admin không
     */
    public function isSuperAdmin(): bool
    {
        return $this->role === 'super_admin';
    }

    /**
     * Kiểm tra user có role cụ thể không
     */
    public function hasRole(string $role): bool
    {
        return $this->role === $role;
    }

    /**
     * Scope để lấy chỉ admins
     */
    public function scopeAdmins($query)
    {
        return $query->whereIn('role', ['admin', 'super_admin']);
    }

    /**
     * Scope để lấy chỉ users thông thường
     */
    public function scopeUsers($query)
    {
        return $query->where('role', 'user');
    }

    /**
     * Kiểm tra user đã hoàn thành onboarding chưa
     */
    public function hasCompletedOnboarding(): bool
    {
        $onboarding = $this->onboarding ?? [];
        return isset($onboarding['completed']) && $onboarding['completed'] === true;
    }

    /**
     * Đánh dấu hoàn thành một bước onboarding
     */
    public function completeOnboardingStep(string $step): void
    {
        $onboarding = $this->onboarding ?? [
            'completed' => false,
            'current_step' => 'welcome',
            'completed_steps' => [],
            'started_at' => now()->toDateTimeString(),
            'completed_at' => null,
        ];

        // Nếu chưa có started_at, set nó
        if (!isset($onboarding['started_at'])) {
            $onboarding['started_at'] = now()->toDateTimeString();
        }

        // Thêm step vào completed_steps nếu chưa có
        if (!in_array($step, $onboarding['completed_steps'] ?? [])) {
            $onboarding['completed_steps'][] = $step;
        }

        // Cập nhật current_step
        $onboarding['current_step'] = $step;

        $this->update(['onboarding' => $onboarding]);
    }

    /**
     * Hoàn thành toàn bộ onboarding
     */
    public function completeOnboarding(): void
    {
        $onboarding = $this->onboarding ?? [
            'completed' => false,
            'current_step' => 'welcome',
            'completed_steps' => [],
            'started_at' => now()->toDateTimeString(),
            'completed_at' => null,
        ];

        $onboarding['completed'] = true;
        $onboarding['current_step'] = 'complete';
        $onboarding['completed_at'] = now()->toDateTimeString();

        // Đảm bảo tất cả các steps đều được đánh dấu
        $allSteps = ['welcome', 'create_request', 'send_request', 'explore_features', 'complete'];
        $onboarding['completed_steps'] = array_unique(array_merge($onboarding['completed_steps'] ?? [], $allSteps));

        $this->update(['onboarding' => $onboarding]);
    }

    /**
     * Reset onboarding (cho testing)
     */
    public function resetOnboarding(): void
    {
        $this->update([
            'onboarding' => [
                'completed' => false,
                'current_step' => 'welcome',
                'completed_steps' => [],
                'started_at' => null,
                'completed_at' => null,
            ]
        ]);
    }
}
