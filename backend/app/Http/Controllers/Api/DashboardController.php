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

        // 5. Research Topics Distribution (Cached for 30 minutes)
        $fieldsDistribution = Cache::remember('dashboard.fields_distribution', now()->addMinutes(30), function () {
            return \Illuminate\Support\Facades\DB::table('keyword_paper')
                ->join('keywords', 'keyword_paper.keyword_id', '=', 'keywords.id')
                ->selectRaw('keywords.name, COUNT(*) as count')
                ->groupBy('keywords.id', 'keywords.name')
                ->orderByDesc('count')
                ->limit(5)
                ->get()
                ->map(function ($item) {
                    return [
                        'name' => ucwords($item->name),
                        'value' => (int) $item->count,
                    ];
                });
        });

        // 6. User-specific AI Insights Recommendations (Dynamic, not cached globally)
        $followedKeywords = $user ? $user->followedKeywords()->pluck('keywords.id') : collect();
        $bookmarkedPaperIds = $user ? $user->bookmarks()->pluck('paper_id') : collect();
        
        // Lấy tất cả từ khóa từ các bài báo đã lưu
        $bookmarkedPaperKeywords = $user && $bookmarkedPaperIds->isNotEmpty()
            ? DB::table('keyword_paper')->whereIn('paper_id', $bookmarkedPaperIds)->pluck('keyword_id')
            : collect();
            
        $targetKeywords = $followedKeywords->merge($bookmarkedPaperKeywords)->unique();

        $bookmarkedJournalFields = $user 
            ? $user->bookmarks()->with('paper.journal')->get()->pluck('paper.journal.field')->filter()->unique() 
            : collect();

        $recommendedPapers = ResearchPaper::with(['authors', 'journal', 'keywords'])
            ->whereNotIn('id', $bookmarkedPaperIds)
            ->when($targetKeywords->isNotEmpty() || $bookmarkedJournalFields->isNotEmpty(), function ($query) use ($targetKeywords, $bookmarkedJournalFields) {
                $query->where(function ($q) use ($targetKeywords, $bookmarkedJournalFields) {
                    if ($targetKeywords->isNotEmpty()) {
                        $q->whereHas('keywords', function ($k) use ($targetKeywords) {
                            $k->whereIn('keywords.id', $targetKeywords);
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
            ->map(function ($paper) use ($targetKeywords, $bookmarkedJournalFields) {
                $matchedKeywordsCount = $paper->keywords->pluck('id')->intersect($targetKeywords)->count();
                $hasFieldMatch = $bookmarkedJournalFields->isNotEmpty() && $paper->journal && $bookmarkedJournalFields->contains($paper->journal->field);

                if ($targetKeywords->isEmpty() && $bookmarkedJournalFields->isEmpty()) {
                    // Người dùng mới chưa theo dõi/lưu: Dựa trên số trích dẫn
                    $matchScore = 70 + min(25, (int)($paper->citations_count / 10));
                } else {
                    $score = 50; // Điểm cơ bản
                    
                    // Tối đa 30 điểm cho mức độ khớp từ khóa (15đ/từ khóa khớp)
                    $score += min(30, $matchedKeywordsCount * 15);
                    
                    // 15 điểm nếu cùng lĩnh vực tạp chí đã lưu
                    if ($hasFieldMatch) {
                        $score += 15;
                    }
                    
                    // Tối đa 4 điểm cho độ phổ biến (trích dẫn)
                    $score += min(4, (int)($paper->citations_count / 50));
                    
                    $matchScore = $score;
                }

                $matchScore = min(99, max(0, $matchScore)); // Giới hạn max 99%

                $authorNames = $paper->authors->isNotEmpty()
                    ? $paper->authors->pluck('name')->join(', ')
                    : 'Chưa rõ tác giả';

                return [
                    'id' => $paper->id,
                    'title' => $paper->title,
                    'authors' => $authorNames,
                    'journal' => $paper->journal?->name ?? 'Khác',
                    'time' => (string) ($paper->published_year ?? ''),
                    'impact' => $paper->citations_count ? round(($paper->citations_count / 10), 1) : 0,
                    'citations' => $paper->citations_count ?? 0,
                    'doi' => $paper->doi,
                    'abstract' => $paper->abstract,
                    'keywords' => $paper->keywords->pluck('name')->toArray(),
                    'match' => $matchScore . '%',
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
            'bookmarked_paper_ids' => $bookmarkedPaperIds,
        ]);
    }
}
