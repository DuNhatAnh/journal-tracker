<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ResearchPaper;
use App\Models\Keyword;
use App\Models\PublicationTrend;
use App\Models\Journal;
use Illuminate\Support\Facades\Cache;

class DashboardController extends Controller
{
    /**
     * GET /api/dashboard
     */
    public function index()
    {
        $user = auth()->user();

        // 1. General Stats (Cached for 30 minutes)
        $stats = Cache::remember('dashboard.stats', now()->addMinutes(30), function () {
            return [
                'total_papers'     => ResearchPaper::count(),
                'total_keywords'   => Keyword::count(),
                'papers_this_year' => ResearchPaper::byYear(now()->year)->count(),
            ];
        });

        // Add user-specific bookmarks count dynamically (not cached)
        $stats['total_bookmarks'] = $user ? $user->bookmarks()->count() : 0;

        // 2. Trending Topics with Sparkline History (Cached for 30 minutes)
        $trendingTopics = Cache::remember('dashboard.trending_topics', now()->addMinutes(30), function () {
            $latestYear = PublicationTrend::max('year');
            $topics = collect();
            if ($latestYear) {
                $topics = PublicationTrend::with('keyword')
                    ->where('year', $latestYear)
                    ->orderByRaw('(growth_rate * 0.4 + paper_count * 3.0 + citation_count * 0.3) DESC')
                    ->limit(6)
                    ->get();

                $keywordIds = $topics->pluck('keyword_id');
                $trendsHistory = PublicationTrend::whereIn('keyword_id', $keywordIds)
                    ->where('year', '>=', $latestYear - 6)
                    ->where('year', '<=', $latestYear)
                    ->orderBy('year')
                    ->get()
                    ->groupBy('keyword_id');

                $topics->each(function ($topic) use ($trendsHistory, $latestYear) {
                    $history = $trendsHistory->get($topic->keyword_id) ?? collect();
                    $chartData = [];
                    for ($y = $latestYear - 6; $y <= $latestYear; $y++) {
                        $trendRecord = $history->firstWhere('year', $y);
                        $chartData[] = $trendRecord ? $trendRecord->paper_count : 0;
                    }
                    $topic->chart_data = $chartData;
                });
            }
            return $topics;
        });

        // 3. Recent Papers (Cached for 30 minutes)
        $recentPapers = Cache::remember('dashboard.recent_papers', now()->addMinutes(30), function () {
            return ResearchPaper::with(['journal', 'authors', 'keywords'])
                ->orderByDesc('published_year')
                ->orderByDesc('created_at')
                ->limit(10)
                ->get();
        });

        // 4. Top Journals (Cached for 30 minutes)
        $topJournals = Cache::remember('dashboard.top_journals', now()->addMinutes(30), function () {
            return Journal::withCount('papers')
                ->orderByDesc('papers_count')
                ->limit(3)
                ->get()
                ->map(function ($j) {
                    $colors = [
                        'bg-white text-black',
                        'bg-secondary-container text-on-secondary-container',
                        'bg-tertiary-container text-on-tertiary-container'
                    ];
                    static $index = 0;
                    $color = $colors[$index % 3];
                    $index++;

                    return [
                        'id' => $j->id,
                        'name' => $j->name,
                        'field' => $j->field ?? 'Đa ngành',
                        'initial' => mb_substr($j->name, 0, 1),
                        'color' => $color,
                    ];
                });
        });

        // 5. Research Fields Distribution (Cached for 30 minutes)
        $fieldsDistribution = Cache::remember('dashboard.fields_distribution', now()->addMinutes(30), function () {
            return ResearchPaper::join('journals', 'research_papers.journal_id', '=', 'journals.id')
                ->selectRaw('journals.field, COUNT(*) as count')
                ->groupBy('journals.field')
                ->orderByDesc('count')
                ->limit(5)
                ->get()
                ->map(function ($item) {
                    return [
                        'name' => $item->field ? ucwords($item->field) : 'Lĩnh vực khác',
                        'value' => (int) $item->count,
                    ];
                });
        });

        // 6. User-specific AI Insights Recommendations (Dynamic, not cached globally)
        $followedKeywords = $user ? $user->followedKeywords()->pluck('keywords.id') : collect();
        $bookmarkedPaperIds = $user ? $user->bookmarks()->pluck('paper_id') : collect();
        $bookmarkedJournalFields = $user 
            ? $user->bookmarks()->with('paper.journal')->get()->pluck('paper.journal.field')->filter()->unique() 
            : collect();

        $recommendedPapers = ResearchPaper::with(['authors', 'journal', 'keywords'])
            ->whereNotIn('id', $bookmarkedPaperIds)
            ->when($followedKeywords->isNotEmpty() || $bookmarkedJournalFields->isNotEmpty(), function ($query) use ($followedKeywords, $bookmarkedJournalFields) {
                $query->where(function ($q) use ($followedKeywords, $bookmarkedJournalFields) {
                    if ($followedKeywords->isNotEmpty()) {
                        $q->whereHas('keywords', function ($k) use ($followedKeywords) {
                            $k->whereIn('keywords.id', $followedKeywords);
                        });
                    }
                    if ($bookmarkedJournalFields->isNotEmpty()) {
                        $q->orWhereHas('journal', function ($j) use ($bookmarkedJournalFields) {
                            $j->whereIn('field', $bookmarkedJournalFields);
                        });
                    }
                });
            })
            ->orderByDesc('citations_count')
            ->limit(2)
            ->get()
            ->map(function ($paper) use ($followedKeywords, $bookmarkedJournalFields) {
                $hasKeywordMatch = $followedKeywords->isNotEmpty() && $paper->keywords->pluck('id')->intersect($followedKeywords)->isNotEmpty();
                $hasFieldMatch = $bookmarkedJournalFields->isNotEmpty() && $paper->journal && $bookmarkedJournalFields->contains($paper->journal->field);

                if ($hasKeywordMatch && $hasFieldMatch) {
                    $match = 95 + ($paper->id % 5);
                } elseif ($hasKeywordMatch) {
                    $match = 90 + ($paper->id % 10);
                } elseif ($hasFieldMatch) {
                    $match = 85 + ($paper->id % 15);
                } else {
                    $match = 80 + ($paper->id % 15);
                }

                $authorNames = $paper->authors->isNotEmpty()
                    ? $paper->authors->pluck('name')->join(', ')
                    : 'Chưa rõ tác giả';

                return [
                    'id' => $paper->id,
                    'title' => $paper->title,
                    'author' => $authorNames,
                    'match' => $match . '%',
                ];
            });

        $latestYear = $trendingTopics->isNotEmpty() ? $trendingTopics->first()->year : null;

        return response()->json([
            'stats'              => $stats,
            'trending_topics'    => $trendingTopics,
            'recent_papers'      => $recentPapers,
            'recommended_papers' => $recommendedPapers,
            'top_journals'       => $topJournals,
            'fields_distribution'=> $fieldsDistribution,
            'latest_year'        => $latestYear,
        ]);
    }
}
