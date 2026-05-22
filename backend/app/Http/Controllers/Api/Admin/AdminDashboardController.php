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
        $activeApiSources = ApiSource::where('is_active', DB::raw('true'))->count();

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

    /**
     * GET /api/admin/charts
     * Returns chart data for papers/journals/keywords visualizations.
     */
    public function charts()
    {
        // Chart 1: Papers published per year — last 10 years only
        $papersPerYear = ResearchPaper::select(
                'published_year',
                DB::raw('count(*) as total')
            )
            ->whereNotNull('published_year')
            ->where('published_year', '>=', date('Y') - 9)
            ->where('published_year', '<=', date('Y'))
            ->groupBy('published_year')
            ->orderBy('published_year')
            ->get()
            ->map(fn($r) => ['year' => (int)$r->published_year, 'total' => (int)$r->total]);

        // Chart 2: Top 10 journals by paper count (donut chart)
        $topJournals = Journal::withCount('papers')
            ->orderByDesc('papers_count')
            ->limit(10)
            ->get()
            ->map(fn($r) => ['name' => $r->name, 'total' => $r->papers_count]);

        // Chart 3: Top 15 keywords by paper count (horizontal bar chart)
        $topKeywords = Keyword::withCount('papers')
            ->orderByDesc('papers_count')
            ->limit(15)
            ->get()
            ->map(fn($r) => ['name' => $r->name, 'total' => $r->papers_count]);

        return response()->json([
            'papers_per_year' => $papersPerYear,
            'top_journals'    => $topJournals,
            'top_keywords'    => $topKeywords,
        ]);
    }
}
