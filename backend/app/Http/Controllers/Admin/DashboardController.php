<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\SecurityLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

/**
 * Admin Dashboard Controller
 * Thống kê và dashboard cho admin panel
 */
class DashboardController extends Controller
{
    /**
     * Get dashboard stats
     */
    public function stats()
    {
        $stats = [
            'total_users' => User::count(),
            'active_users' => User::whereNull('locked_until')
                ->orWhere('locked_until', '<=', now())
                ->count(),
            'locked_users' => User::whereNotNull('locked_until')
                ->where('locked_until', '>', now())
                ->count(),
            'admin_users' => User::admins()->count(),
            'regular_users' => User::users()->count(),
            'users_with_2fa' => User::where('two_factor_enabled', true)->count(),
            'security_events_today' => SecurityLog::whereDate('created_at', today())->count(),
            'security_events_week' => SecurityLog::where('created_at', '>=', now()->subWeek())->count(),
            'security_events_month' => SecurityLog::where('created_at', '>=', now()->subMonth())->count(),
            'failed_logins_today' => SecurityLog::where('event_type', 'login_failed')
                ->whereDate('created_at', today())
                ->count(),
            'account_lockouts_today' => SecurityLog::where('event_type', 'account_locked')
                ->whereDate('created_at', today())
                ->count(),
        ];

        // User growth chart data (last 30 days)
        $userGrowth = User::select(
            DB::raw('DATE(created_at) as date'),
            DB::raw('COUNT(*) as count')
        )
        ->where('created_at', '>=', now()->subDays(30))
        ->groupBy('date')
        ->orderBy('date')
        ->get();

        // Security events by type (last 7 days)
        $eventsByType = SecurityLog::select(
            'event_type',
            DB::raw('COUNT(*) as count')
        )
        ->where('created_at', '>=', now()->subDays(7))
        ->groupBy('event_type')
        ->orderByDesc('count')
        ->get();

        return response()->json([
            'stats' => $stats,
            'user_growth' => $userGrowth,
            'events_by_type' => $eventsByType,
        ]);
    }

    /**
     * Recent activity
     */
    public function recentActivity(Request $request)
    {
        $limit = $request->get('limit', 20);
        
        $activities = SecurityLog::with('user')
            ->orderBy('created_at', 'desc')
            ->limit($limit)
            ->get();

        return response()->json($activities);
    }

    /**
     * User activity
     */
    public function userActivity($userId)
    {
        $user = User::findOrFail($userId);

        $activities = SecurityLog::where('user_id', $userId)
            ->orderBy('created_at', 'desc')
            ->limit(50)
            ->get();

        return response()->json([
            'user' => $user,
            'activities' => $activities,
        ]);
    }
}
