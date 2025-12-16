<?php

namespace App\Services;

use App\Models\SecurityLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

/**
 * Admin Audit Service
 * Log tất cả admin actions để audit trail
 */
class AdminAuditService
{
    /**
     * Log admin action
     */
    public function logAction(
        int $adminId,
        string $action,
        array $metadata = [],
        ?Request $request = null
    ): void {
        try {
            SecurityLog::create([
                'user_id' => $adminId,
                'event_type' => 'admin_action',
                'ip_address' => $request?->ip(),
                'user_agent' => $request?->userAgent(),
                'metadata' => array_merge([
                    'action' => $action,
                ], $metadata),
                'created_at' => now(),
            ]);
        } catch (\Exception $e) {
            // Fallback to file log nếu database fail
            Log::error('Admin audit log failed', [
                'admin_id' => $adminId,
                'action' => $action,
                'metadata' => $metadata,
                'error' => $e->getMessage(),
            ]);
        }
    }

    /**
     * Log user update
     */
    public function logUserUpdate(int $adminId, int $userId, array $changes, ?Request $request = null): void
    {
        $this->logAction($adminId, 'user_updated', [
            'target_user_id' => $userId,
            'changes' => $changes,
        ], $request);
    }

    /**
     * Log user deletion
     */
    public function logUserDeletion(int $adminId, int $userId, array $userData, ?Request $request = null): void
    {
        $this->logAction($adminId, 'user_deleted', [
            'deleted_user_id' => $userId,
            'deleted_user_data' => $userData,
        ], $request);
    }

    /**
     * Log user lock/unlock
     */
    public function logUserLockAction(int $adminId, int $userId, string $action, ?Request $request = null): void
    {
        $this->logAction($adminId, "user_{$action}", [
            'target_user_id' => $userId,
        ], $request);
    }
}
