<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\ResearchPaper;
use App\Models\Journal;
use App\Models\Keyword;
use App\Models\ApiSource;
use App\Models\SyncLog;
use Illuminate\Support\Facades\DB;

class AdminDashboardController extends Controller
{
    /**
     * GET /api/admin/stats
     * Returns aggregated system statistics for the Admin Dashboard.
     */
    public function stats()
    {
        // User counts by role
        $usersByRole = User::select('role', DB::raw('count(*) as count'))
            ->groupBy('role')
            ->orderByDesc('count')
            ->get()
            ->map(fn($u) => ['role' => $u->role, 'count' => (int) $u->count])
            ->toArray();

        // API Source counts
        $totalApiSources  = ApiSource::count();
        $activeApiSources = ApiSource::where('is_active', true)->count();

        // Last sync timestamp
        $lastSyncLog = SyncLog::orderByDesc('created_at')->first();

        // Recent 8 sync logs with api_source name
        $recentSyncLogs = SyncLog::with('apiSource')
            ->orderByDesc('created_at')
            ->limit(8)
            ->get()
            ->map(fn($log) => [
                'id'           => $log->id,
                'status'       => $log->status,
                'papers_synced'=> (int) $log->papers_synced,
                'created_at'   => $log->created_at,
                'api_source'   => $log->apiSource ? ['name' => $log->apiSource->name] : null,
            ]);

        return response()->json([
            'total_users'         => User::count(),
            'total_papers'        => ResearchPaper::count(),
            'total_journals'      => Journal::count(),
            'total_keywords'      => Keyword::count(),
            'total_api_sources'   => $totalApiSources,
            'active_api_sources'  => $activeApiSources,
            'total_sync_logs'     => SyncLog::count(),
            'last_sync_at'        => $lastSyncLog?->created_at,
            'users_by_role'       => $usersByRole,
            'recent_sync_logs'    => $recentSyncLogs,
        ]);
    }
}
