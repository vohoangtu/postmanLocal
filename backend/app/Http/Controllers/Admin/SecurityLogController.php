<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\SecurityLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/**
 * Admin Security Log Controller
 * Quản lý security logs cho admin panel
 */
class SecurityLogController extends Controller
{
    /**
     * List security logs với filters
     */
    public function index(Request $request)
    {
        $query = SecurityLog::with('user');

        // Filters
        if ($request->has('event_type')) {
            $query->where('event_type', $request->event_type);
        }

        if ($request->has('user_id')) {
            $query->where('user_id', $request->user_id);
        }

        if ($request->has('ip_address')) {
            $query->where('ip_address', $request->ip_address);
        }

        if ($request->has('date_from')) {
            $query->where('created_at', '>=', $request->date_from);
        }

        if ($request->has('date_to')) {
            $query->where('created_at', '<=', $request->date_to);
        }

        // Pagination
        $perPage = $request->get('per_page', 50);
        $logs = $query->orderBy('created_at', 'desc')->paginate($perPage);

        return response()->json($logs);
    }

    /**
     * Chi tiết log
     */
    public function show($id)
    {
        $log = SecurityLog::with('user')->findOrFail($id);
        return response()->json($log);
    }

    /**
     * Export logs
     */
    public function export(Request $request)
    {
        $query = SecurityLog::with('user');

        // Apply same filters as index
        if ($request->has('event_type')) {
            $query->where('event_type', $request->event_type);
        }

        if ($request->has('user_id')) {
            $query->where('user_id', $request->user_id);
        }

        if ($request->has('ip_address')) {
            $query->where('ip_address', $request->ip_address);
        }

        if ($request->has('date_from')) {
            $query->where('created_at', '>=', $request->date_from);
        }

        if ($request->has('date_to')) {
            $query->where('created_at', '<=', $request->date_to);
        }

        $format = $request->get('format', 'json');
        $logs = $query->orderBy('created_at', 'desc')->get();

        if ($format === 'csv') {
            return $this->exportToCsv($logs);
        }

        return response()->json($logs);
    }

    /**
     * Export to CSV
     */
    protected function exportToCsv($logs)
    {
        $filename = 'security_logs_' . date('Y-m-d_His') . '.csv';
        
        $headers = [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
        ];

        $callback = function () use ($logs) {
            $file = fopen('php://output', 'w');
            
            // Header
            fputcsv($file, ['ID', 'User', 'Event Type', 'IP Address', 'User Agent', 'Metadata', 'Created At']);

            // Data
            foreach ($logs as $log) {
                fputcsv($file, [
                    $log->id,
                    $log->user ? $log->user->email : 'N/A',
                    $log->event_type,
                    $log->ip_address,
                    $log->user_agent,
                    json_encode($log->metadata),
                    $log->created_at->toDateTimeString(),
                ]);
            }

            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }
}
