<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ResearchPaper;
use App\Models\Keyword;
use App\Models\PublicationTrend;
use Illuminate\Support\Facades\Cache;

class DashboardController extends Controller
{
    /**
     * GET /api/dashboard
     */
    public function index()
    {
        $stats = Cache::remember('dashboard.stats', now()->addMinutes(30), function () {
            return [
                'total_papers'     => ResearchPaper::count(),
                'total_keywords'   => Keyword::count(),
                'papers_this_year' => ResearchPaper::byYear(now()->year)->count(),
                'top_keywords'     => Keyword::withCount('papers')
                    ->orderByDesc('papers_count')
                    ->limit(5)
                    ->get(['id', 'name', 'slug', 'papers_count']),
            ];
        });

        $trendingTopics = PublicationTrend::with('keyword')
            ->where('year', now()->year - 1)
            ->orderByDesc('growth_rate')
            ->limit(6)
            ->get();

        $recentPapers = ResearchPaper::with(['journal', 'authors', 'keywords'])
            ->orderByDesc('published_year')
            ->limit(10)
            ->get();

        return response()->json([
            'stats'           => $stats,
            'trending_topics' => $trendingTopics,
            'recent_papers'   => $recentPapers,
        ]);
    }
}
