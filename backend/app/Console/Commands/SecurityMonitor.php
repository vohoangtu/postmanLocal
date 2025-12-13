<?php

namespace App\Console\Commands;

use App\Models\SecurityLog;
use App\Services\SecurityAlertService;
use Illuminate\Console\Command;
use Carbon\Carbon;

/**
 * Security Monitor Command
 * Monitor security logs và detect suspicious patterns
 */
class SecurityMonitor extends Command
{
    protected $signature = 'security:monitor';
    protected $description = 'Monitor security logs và detect suspicious patterns';

    protected SecurityAlertService $alertService;

    public function __construct(SecurityAlertService $alertService)
    {
        parent::__construct();
        $this->alertService = $alertService;
    }

    public function handle(): void
    {
        $this->info('Monitoring security logs...');

        // Check for multiple failed login attempts từ cùng IP
        $this->checkFailedLoginAttempts();

        // Check for unusual activity patterns
        $this->checkUnusualActivity();

        // Check for account lockouts
        $this->checkAccountLockouts();

        $this->info('Security monitoring completed.');
    }

    /**
     * Check for multiple failed login attempts
     */
    protected function checkFailedLoginAttempts(): void
    {
        $threshold = 10; // 10 failed attempts trong 1 giờ
        $timeWindow = Carbon::now()->subHour();

        $failedAttempts = SecurityLog::where('event_type', 'login_failed')
            ->where('created_at', '>=', $timeWindow)
            ->selectRaw('ip_address, COUNT(*) as count')
            ->groupBy('ip_address')
            ->having('count', '>=', $threshold)
            ->get();

        foreach ($failedAttempts as $attempt) {
            $this->alertService->sendAlert(
                'multiple_failed_logins',
                "Multiple failed login attempts từ IP: {$attempt->ip_address}",
                [
                    'ip_address' => $attempt->ip_address,
                    'count' => $attempt->count,
                ],
                ['log', 'email']
            );
        }
    }

    /**
     * Check for unusual activity patterns
     */
    protected function checkUnusualActivity(): void
    {
        // Check for login từ nhiều IP khác nhau trong thời gian ngắn
        $timeWindow = Carbon::now()->subMinutes(30);
        
        $userLogins = SecurityLog::where('event_type', 'login_success')
            ->where('created_at', '>=', $timeWindow)
            ->whereNotNull('user_id')
            ->selectRaw('user_id, COUNT(DISTINCT ip_address) as ip_count')
            ->groupBy('user_id')
            ->having('ip_count', '>=', 5) // 5 IPs khác nhau trong 30 phút
            ->get();

        foreach ($userLogins as $login) {
            $this->alertService->sendAlert(
                'unusual_login_pattern',
                "User {$login->user_id} đăng nhập từ nhiều IP khác nhau",
                [
                    'user_id' => $login->user_id,
                    'ip_count' => $login->ip_count,
                ],
                ['log', 'email']
            );
        }
    }

    /**
     * Check for account lockouts
     */
    protected function checkAccountLockouts(): void
    {
        $timeWindow = Carbon::now()->subHour();
        
        $lockouts = SecurityLog::where('event_type', 'account_locked')
            ->where('created_at', '>=', $timeWindow)
            ->count();

        if ($lockouts > 0) {
            $this->alertService->sendAlert(
                'account_lockouts',
                "Có {$lockouts} tài khoản bị khóa trong giờ qua",
                [
                    'lockout_count' => $lockouts,
                ],
                ['log']
            );
        }
    }
}
