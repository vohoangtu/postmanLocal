<?php

namespace App\Services;

use App\Models\SecurityLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\Log;

/**
 * Security Logger Service
 * Ghi log các sự kiện bảo mật
 */
class SecurityLogger
{
    /**
     * Log security event
     */
    public function logEvent(
        string $eventType,
        ?string $userId = null,
        ?array $metadata = null,
        ?Request $request = null
    ): void {
        // Rate limit logging để prevent DoS
        $key = "security_log:{$eventType}:" . ($request?->ip() ?? 'unknown');
        if (RateLimiter::tooManyAttempts($key, 100)) {
            // Quá nhiều logs, chỉ log vào file log thay vì database
            Log::warning('Security log rate limit exceeded', [
                'event_type' => $eventType,
                'user_id' => $userId,
                'ip' => $request?->ip(),
            ]);
            return;
        }

        RateLimiter::hit($key, 60); // 100 logs per minute

        try {
            SecurityLog::create([
                'user_id' => $userId,
                'event_type' => $eventType,
                'ip_address' => $request?->ip(),
                'user_agent' => $request?->userAgent(),
                'metadata' => $metadata,
                'created_at' => now(),
            ]);
        } catch (\Exception $e) {
            // Nếu không thể lưu vào database, log vào file
            Log::error('Failed to save security log', [
                'event_type' => $eventType,
                'user_id' => $userId,
                'error' => $e->getMessage(),
            ]);
        }
    }

    /**
     * Log login success
     */
    public function logLoginSuccess(string $userId, Request $request): void
    {
        $this->logEvent('login_success', $userId, null, $request);
    }

    /**
     * Log login failure
     */
    public function logLoginFailure(string $email, Request $request, ?string $reason = null): void
    {
        $this->logEvent('login_failed', null, [
            'email' => $email,
            'reason' => $reason,
        ], $request);
    }

    /**
     * Log password reset request
     */
    public function logPasswordResetRequest(string $email, Request $request): void
    {
        $this->logEvent('password_reset_requested', null, [
            'email' => $email,
        ], $request);
    }

    /**
     * Log password reset success
     */
    public function logPasswordResetSuccess(string $userId, Request $request): void
    {
        $this->logEvent('password_reset_success', $userId, null, $request);
    }

    /**
     * Log token revocation
     */
    public function logTokenRevoked(string $userId, Request $request, ?string $tokenId = null): void
    {
        $this->logEvent('token_revoked', $userId, [
            'token_id' => $tokenId,
        ], $request);
    }

    /**
     * Log account lockout
     */
    public function logAccountLockout(string $userId, Request $request): void
    {
        $this->logEvent('account_locked', $userId, null, $request);
    }

    /**
     * Log 2FA enabled
     */
    public function log2FAEnabled(string $userId, Request $request): void
    {
        $this->logEvent('2fa_enabled', $userId, null, $request);
    }

    /**
     * Log 2FA disabled
     */
    public function log2FADisabled(string $userId, Request $request): void
    {
        $this->logEvent('2fa_disabled', $userId, null, $request);
    }
}
