<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ResearchPaper;
use App\Models\Keyword;
use App\Models\PublicationTrend;
use App\Models\Journal;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    const TTL_STATS   = 1800;
    const TTL_TRENDING = 2592000; // 30 days (changes yearly)
    const TTL_PAPERS   = 900;
    const TTL_JOURNALS = 3600;
    const TTL_FIELDS   = 3600;

    private function getBookmarkedPaperIds($user)
    {
        if (!$user) return collect();
        return Cache::remember("dash.bookmarks.{$user->id}", 300, function () use ($user) {
            return $user->bookmarks()->pluck('paper_id');
        });
    }

    public function stats(Request $request)
    {
        $user = $request->user();
        
        $generalStats = Cache::remember('dash.stats_v4', self::TTL_STATS, function () {
            $yesterday = now()->subDay();

            $total_papers = \App\Models\SystemCounter::getValue('total_papers');
            if ($total_papers === 0) {
                $total_papers = ResearchPaper::count();
            }
            $papers_new = ResearchPaper::where('created_at', '>=', $yesterday)->count();
            $papers_prev = max(1, $total_papers - $papers_new);
            $papers_percent = $papers_new > 0 ? round(($papers_new / $papers_prev) * 100, 1) : 0;

            $total_keywords = \App\Models\SystemCounter::getValue('total_keywords');
            if ($total_keywords === 0) {
                $total_keywords = Keyword::count();
            }
            $keywords_new = Keyword::where('created_at', '>=', $yesterday)->count();
            $keywords_prev = max(1, $total_keywords - $keywords_new);
            $keywords_percent = $keywords_new > 0 ? round(($keywords_new / $keywords_prev) * 100, 1) : 0;

            $papers_this_year = ResearchPaper::where('published_year', now()->year)->count();
            $papers_this_year_new = ResearchPaper::where('published_year', now()->year)->where('created_at', '>=', $yesterday)->count();

            return [
                'total_papers'         => $total_papers,
                'papers_percent'       => $papers_percent > 0 ? "+{$papers_percent}%" : "0%",
                'total_keywords'       => $total_keywords,
                'keywords_percent'     => $keywords_percent > 0 ? "+{$keywords_percent}%" : "0%",
                'papers_this_year'     => $papers_this_year,
                'papers_this_year_new' => $papers_this_year_new,
            ];
        });

        $bookmarkedPaperIds = collect();
        $totalBookmarks = 0;
        $bookmarks_new = 0;

        if ($user) {
            $bookmarkedPaperIds = $this->getBookmarkedPaperIds($user);
            $totalBookmarks = $bookmarkedPaperIds->count();
            
            $bookmarks_new = Cache::remember("dash.bookmarks_new.{$user->id}", self::TTL_STATS, function () use ($user) {
                return \App\Models\Bookmark::where('user_id', $user->id)
                    ->where('created_at', '>=', now()->subDay())
                    ->count();
            });
        }

        $stats = array_merge($generalStats, [
            'total_bookmarks' => $totalBookmarks,
            'bookmarks_new'   => $bookmarks_new,
        ]);

        return response()->json([
            'stats' => $stats,
            'stats_updated_at' => now()->format('H:i - d/m/Y'),
            'bookmarked_paper_ids' => $bookmarkedPaperIds
        ]);
    }

    public function bookmarks(Request $request)
    {
        $user = $request->user();
        $bookmarkedPaperIds = $this->getBookmarkedPaperIds($user);

        return response()->json([
            'bookmarked_paper_ids' => $bookmarkedPaperIds
        ]);
    }

    public function trending()
    {
        $trendingTopics = Cache::remember('dash.trending', self::TTL_TRENDING, function () {
            $latestYear = PublicationTrend::max('year');
            if (!$latestYear) return collect();

            $topics = PublicationTrend::with('keyword:id,name')
                ->where('year', $latestYear)
                ->where('paper_count', '>=', 3)
                ->where('growth_rate', '>', 0)
                ->orderByRaw('(growth_rate * 0.6 + paper_count * 2.0 + citation_count * 0.2) DESC')
                ->limit(6)
                ->get(['id', 'keyword_id', 'year', 'paper_count', 'citation_count', 'growth_rate']);

            if ($topics->count() < 6) {
                $existingIds = $topics->pluck('keyword_id')->toArray();
                $extra = PublicationTrend::with('keyword:id,name')
                    ->where('year', $latestYear)
                    ->where('paper_count', '>=', 3)
                    ->whereNotIn('keyword_id', $existingIds)
                    ->orderByDesc('paper_count')
                    ->limit(6 - $topics->count())
                    ->get(['id', 'keyword_id', 'year', 'paper_count', 'citation_count', 'growth_rate']);
                $topics = $topics->merge($extra);
            }

            if ($topics->isEmpty()) return collect();

            $keywordIds = $topics->pluck('keyword_id');
            $trendsHistory = PublicationTrend::whereIn('keyword_id', $keywordIds)
                ->where('year', '>=', $latestYear - 6)
                ->orderBy('year')
                ->get(['keyword_id', 'year', 'paper_count'])
                ->groupBy('keyword_id');

            $topics->each(function ($topic) use ($trendsHistory, $latestYear) {
                $history = $trendsHistory->get($topic->keyword_id) ?? collect();
                $chartData = [];
                for ($y = $latestYear - 6; $y <= $latestYear; $y++) {
                    $rec = $history->firstWhere('year', $y);
                    $chartData[] = $rec ? $rec->paper_count : 0;
                }
                $topic->chart_data = $chartData;
            });

            return $topics;
        });

        $latestYear = $trendingTopics->isNotEmpty() ? $trendingTopics->first()->year : null;

        return response()->json([
            'trending_topics' => $trendingTopics,
            'latest_year' => $latestYear,
            'trending_topics_updated_at' => now()->format('H:i - d/m/Y')
        ]);
    }

    public function recent()
    {
        $recentPapers = Cache::remember('dash.recent_papers_v2', self::TTL_PAPERS, function () {
            $items = ResearchPaper::select('id', 'title', 'abstract', 'published_year', 'journal_id', 'citations_count', 'doi')
                ->with([
                    'journal:id,name',
                    'authors:id,name',
                    'keywords:id,name',
                ])
                ->orderByDesc('published_year')
                ->orderByDesc('created_at')
                ->limit(10)
                ->get();

            return [
                'items' => $items,
                'updated_at' => now()->format('H:i - d/m/Y')
            ];
        });

        return response()->json([
            'recent_papers' => $recentPapers['items'] ?? [],
            'recent_papers_updated_at' => $recentPapers['updated_at'] ?? now()->format('H:i - d/m/Y')
        ]);
    }

    public function journals()
    {
        $topJournals = Cache::remember('dash.top_journals_v2', self::TTL_JOURNALS, function () {
            $colors = [
                'bg-white text-black',
                'bg-secondary-container text-on-secondary-container',
                'bg-tertiary-container text-on-tertiary-container',
            ];

            $issnNotes = [
                'repository'      => 'Kho lưu trữ preprint — không cấp ISSN',
                'conference'      => 'Kỷ yếu hội nghị — thường không có ISSN',
                'book-series'     => 'Chuỗi sách — dùng ISBN thay vì ISSN',
                'ebook-platform'  => 'Nền tảng sách điện tử — không cấp ISSN',
                'journal'         => 'Đang thu thập từ OpenAlex',
            ];

            $items = Journal::select('id', 'name', 'field', 'issn', 'publisher', 'url', 'source_type')
                ->withCount('papers')
                ->orderByDesc('papers_count')
                ->limit(10)
                ->get()
                ->values()
                ->map(function($j, $i) use ($colors, $issnNotes) {
                    $mockImpactFactor = round(($j->papers_count * 1.5) + ($j->id % 10), 1) + 2.5;
                    $sources = ['Scopus® (Q1)', 'Web of Science™ (SCIE)', 'SCImago Journal Rank'];

                    $issnNote = null;
                    if (empty($j->issn)) {
                        $issnNote = $issnNotes[$j->source_type] ?? 'Chưa thu thập được';
                    }

                    return [
                        'id'           => $j->id,
                        'name'         => $j->name,
                        'field'        => $j->field ?? 'Đa ngành',
                        'issn'         => $j->issn,
                        'issn_note'    => $issnNote,
                        'source_type'  => $j->source_type,
                        'publisher'    => $j->publisher,
                        'url'          => $j->url,
                        'papers_count' => $j->papers_count,
                        'impact_factor'=> $mockImpactFactor,
                        'source'       => $sources[$j->id % 3],
                        'initial'      => mb_substr($j->name, 0, 1),
                        'color'        => $colors[$i % count($colors)],
                    ];
                });

            return [
                'items' => $items,
                'updated_at' => now()->format('H:i - d/m/Y')
            ];
        });

        return response()->json([
            'top_journals' => $topJournals['items'] ?? [],
            'top_journals_updated_at' => $topJournals['updated_at'] ?? now()->format('H:i - d/m/Y')
        ]);
    }

    public function fields()
    {
        $fieldsDistribution = Cache::remember('dash.fields_dist', self::TTL_FIELDS, function () {
            return DB::table('keyword_paper')
                ->join('keywords', 'keyword_paper.keyword_id', '=', 'keywords.id')
                ->selectRaw('keywords.name, COUNT(*) as count')
                ->groupBy('keywords.id', 'keywords.name')
                ->orderByDesc('count')
                ->limit(5)
                ->get()
                ->map(fn($item) => [
                    'name'  => ucwords($item->name),
                    'value' => (int) $item->count,
                ]);
        });

        return response()->json([
            'fields_distribution' => $fieldsDistribution
        ]);
    }

    public function recommended(Request $request)
    {
        $user = $request->user();
        if (!$user) return response()->json(['recommended_papers' => []]);

        $bookmarkedPaperIds = $this->getBookmarkedPaperIds($user);

        $recommendedPapers = Cache::remember("dash.recommended.{$user->id}", 5, function () use ($user, $bookmarkedPaperIds) {
            $followedKeywordIds = $user->followedKeywords()->pluck('id');
            $followedAuthorIds = $user->followedAuthors()->pluck('id');
            $followedJournalIds = $user->followedJournals()->pluck('id');

            $bookmarkedKeywordIds = $bookmarkedPaperIds->isNotEmpty()
                ? DB::table('keyword_paper')
                    ->whereIn('paper_id', $bookmarkedPaperIds)
                    ->pluck('keyword_id')
                : collect();

            $targetKeywordIds = $followedKeywordIds->merge($bookmarkedKeywordIds)->unique();

            $bookmarkedJournalFields = $bookmarkedPaperIds->isNotEmpty()
                ? DB::table('research_papers')
                    ->join('journals', 'research_papers.journal_id', '=', 'journals.id')
                    ->whereIn('research_papers.id', $bookmarkedPaperIds)
                    ->whereNotNull('journals.field')
                    ->pluck('journals.field')
                    ->unique()
                : collect();

            $hasPreferences = $targetKeywordIds->isNotEmpty()
                || $followedAuthorIds->isNotEmpty()
                || $followedJournalIds->isNotEmpty()
                || $bookmarkedJournalFields->isNotEmpty();

            if (!$hasPreferences) {
                return [];
            }

            $query = ResearchPaper::select('id', 'title', 'abstract', 'published_year', 'journal_id', 'citations_count', 'doi')
                ->with(['authors:id,name', 'journal:id,name', 'keywords:id,name'])
                ->whereNotIn('id', $bookmarkedPaperIds);

            if ($targetKeywordIds->isNotEmpty() || $bookmarkedJournalFields->isNotEmpty() || $followedAuthorIds->isNotEmpty() || $followedJournalIds->isNotEmpty()) {
                $query->where(function ($q) use ($targetKeywordIds, $bookmarkedJournalFields, $followedAuthorIds, $followedJournalIds) {
                    if ($targetKeywordIds->isNotEmpty()) {
                        $q->whereHas('keywords', fn($k) => $k->whereIn('keywords.id', $targetKeywordIds));
                    }
                    if ($bookmarkedJournalFields->isNotEmpty()) {
                        $q->orWhereHas('journal', fn($j) => $j->whereIn('field', $bookmarkedJournalFields));
                    }
                    if ($followedAuthorIds->isNotEmpty()) {
                        $q->orWhereHas('authors', fn($a) => $a->whereIn('authors.id', $followedAuthorIds));
                    }
                    if ($followedJournalIds->isNotEmpty()) {
                        $q->orWhereIn('journal_id', $followedJournalIds);
                    }
                });
            }

            $candidates = $query->orderByDesc('citations_count')
                ->limit(50)
                ->get();

            $scored = $candidates->map(function ($paper) use ($followedKeywordIds, $bookmarkedKeywordIds, $followedAuthorIds, $followedJournalIds, $bookmarkedJournalFields) {
                $matchScoreRaw = 0;

                // 1. Followed keywords match (+30 points per match)
                $paperKeywordIds = $paper->keywords->pluck('id');
                if ($followedKeywordIds->isNotEmpty()) {
                    $matchedFollowedKeywords = $paperKeywordIds->intersect($followedKeywordIds)->count();
                    $matchScoreRaw += $matchedFollowedKeywords * 30;
                }

                // 2. Bookmarked keywords match (+20 points per match)
                if ($bookmarkedKeywordIds->isNotEmpty()) {
                    $matchedBookmarkedKeywords = $paperKeywordIds->intersect($bookmarkedKeywordIds)->count();
                    $matchScoreRaw += $matchedBookmarkedKeywords * 20;
                }

                // 3. Followed authors match (+40 points per match)
                $paperAuthorIds = $paper->authors->pluck('id');
                if ($followedAuthorIds->isNotEmpty()) {
                    $matchedFollowedAuthors = $paperAuthorIds->intersect($followedAuthorIds)->count();
                    $matchScoreRaw += $matchedFollowedAuthors * 40;
                }

                // 4. Followed journals match (+40 points)
                if ($followedJournalIds->isNotEmpty() && $followedJournalIds->contains($paper->journal_id)) {
                    $matchScoreRaw += 40;
                }

                // 5. Bookmarked journal fields match (+15 points)
                if ($bookmarkedJournalFields->isNotEmpty() && $paper->journal && $bookmarkedJournalFields->contains($paper->journal->field)) {
                    $matchScoreRaw += 15;
                }

                // 6. Base citation points
                $matchScoreRaw += min(10, (int)($paper->citations_count / 10));

                // Calculate final percentage score
                $hasPreferences = $followedKeywordIds->isNotEmpty() 
                    || $bookmarkedKeywordIds->isNotEmpty() 
                    || $followedAuthorIds->isNotEmpty() 
                    || $followedJournalIds->isNotEmpty() 
                    || $bookmarkedJournalFields->isNotEmpty();

                if (!$hasPreferences) {
                    $scorePercent = 70 + min(25, (int)($paper->citations_count / 10));
                } else {
                    $scorePercent = 50 + min(49, $matchScoreRaw);
                }

                $matchScore = min(99, max(0, $scorePercent));

                $authorNames = $paper->authors->isNotEmpty()
                    ? $paper->authors->pluck('name')->join(', ')
                    : 'Chưa rõ tác giả';

                return [
                    'id'         => $paper->id,
                    'title'      => $paper->title,
                    'authors'    => $authorNames,
                    'journal'    => $paper->journal?->name ?? 'Khác',
                    'time'       => (string) ($paper->published_year ?? ''),
                    'impact'     => $paper->citations_count ? round(($paper->citations_count / 10), 1) : 0,
                    'citations'  => $paper->citations_count ?? 0,
                    'doi'        => $paper->doi,
                    'abstract'   => $paper->abstract,
                    'keywords'   => $paper->keywords->map(fn($k) => ['id' => $k->id, 'name' => $k->name])->toArray(),
                    'match'      => $matchScore . '%',
                    '_raw_score' => $matchScoreRaw,
                ];
            });

            return $scored->sortByDesc(function ($item) {
                return [$item['_raw_score'], $item['citations']];
            })->values()->take(2)->all();
        });

        return response()->json([
            'recommended_papers' => $recommendedPapers
        ]);
    }
}
