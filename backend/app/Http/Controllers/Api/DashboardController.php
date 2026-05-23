<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ResearchPaper;
use App\Models\Keyword;
use App\Models\PublicationTrend;
use App\Models\Journal;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    // Cache TTL constants (giây)
    const TTL_STATS   = 1800; // 30 phút — dữ liệu tổng hợp ít thay đổi
    const TTL_TRENDING = 3600; // 1 giờ  — trending ổn định
    const TTL_PAPERS   = 900;  // 15 phút — bài báo mới hơn
    const TTL_JOURNALS = 3600; // 1 giờ  — journals ổn định
    const TTL_FIELDS   = 3600; // 1 giờ  — phân bổ ổn định

    /**
     * GET /api/dashboard
     */
    public function index()
    {
        $user = auth()->user();
        $userId = $user?->id;

        // ── 1. STATIC DATA (cached per key, không phụ thuộc user) ──────────────
        // Chạy tất cả cached queries trong một lần, độc lập nhau

        $generalStats = Cache::remember('dash.stats', self::TTL_STATS, function () {
            return [
                'total_papers'     => ResearchPaper::count(),
                'total_keywords'   => Keyword::count(),
                'papers_this_year' => ResearchPaper::where('published_year', now()->year)->count(),
            ];
        });

        $trendingTopics = Cache::remember('dash.trending', self::TTL_TRENDING, function () {
            $latestYear = PublicationTrend::max('year');
            if (!$latestYear) return collect();

            // Lấy top 6 trending dựa trên composite score
            $topics = PublicationTrend::with('keyword:id,name')
                ->where('year', $latestYear)
                ->orderByRaw('(growth_rate * 0.4 + paper_count * 3.0 + citation_count * 0.3) DESC')
                ->limit(6)
                ->get(['id', 'keyword_id', 'year', 'paper_count', 'citation_count', 'growth_rate']);

            if ($topics->isEmpty()) return collect();

            // Lấy lịch sử 7 năm cho tất cả keywords trong 1 query
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

        $recentPapers = Cache::remember('dash.recent_papers_v2', self::TTL_PAPERS, function () {
            // Chỉ select các cột cần thiết, tránh load toàn bộ record
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

        $topJournals = Cache::remember('dash.top_journals_v2', self::TTL_JOURNALS, function () {
            $colors = [
                'bg-white text-black',
                'bg-secondary-container text-on-secondary-container',
                'bg-tertiary-container text-on-tertiary-container',
            ];

            // Ánh xạ OpenAlex source_type → ghi chú ISSN thân thiện
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
                    // Tạo dữ liệu giả lập cho Impact Factor và Nguồn
                    $mockImpactFactor = round(($j->papers_count * 1.5) + ($j->id % 10), 1) + 2.5;
                    $sources = ['Scopus® (Q1)', 'Web of Science™ (SCIE)', 'SCImago Journal Rank'];

                    // Ghi chú ISSN — nếu có ISSN rồi thì bỏ qua
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

        // ── 2. USER-SPECIFIC DATA (không cache global, cache theo user_id) ──────
        $bookmarkedPaperIds = collect();
        $totalBookmarks     = 0;
        $recommendedPapers  = collect();

        if ($user) {
            // Cache bookmark list theo user, TTL ngắn hơn
            $bookmarkCache = Cache::remember("dash.bookmarks.{$userId}", 300, function () use ($user) {
                return $user->bookmarks()->pluck('paper_id');
            });
            $bookmarkedPaperIds = $bookmarkCache;
            $totalBookmarks     = $bookmarkedPaperIds->count();

            // Cache recommendations theo user
            $recommendedPapers = Cache::remember("dash.recommended.{$userId}", 600, function () use ($user, $bookmarkedPaperIds) {
                // Lấy keyword IDs từ các bài đã lưu + theo dõi trong 1 query
                $followedKeywordIds = $user->followedKeywords()->pluck('keywords.id');

                $bookmarkedKeywordIds = $bookmarkedPaperIds->isNotEmpty()
                    ? DB::table('keyword_paper')
                        ->whereIn('paper_id', $bookmarkedPaperIds)
                        ->pluck('keyword_id')
                    : collect();

                $targetKeywordIds = $followedKeywordIds->merge($bookmarkedKeywordIds)->unique();

                // Lấy field của journals từ bookmarked papers
                $bookmarkedJournalFields = $bookmarkedPaperIds->isNotEmpty()
                    ? DB::table('research_papers')
                        ->join('journals', 'research_papers.journal_id', '=', 'journals.id')
                        ->whereIn('research_papers.id', $bookmarkedPaperIds)
                        ->whereNotNull('journals.field')
                        ->pluck('journals.field')
                        ->unique()
                    : collect();

                $query = ResearchPaper::select('id', 'title', 'abstract', 'published_year', 'journal_id', 'citations_count', 'doi')
                    ->with(['authors:id,name', 'journal:id,name', 'keywords:id,name'])
                    ->whereNotIn('id', $bookmarkedPaperIds);

                if ($targetKeywordIds->isNotEmpty() || $bookmarkedJournalFields->isNotEmpty()) {
                    $query->where(function ($q) use ($targetKeywordIds, $bookmarkedJournalFields) {
                        if ($targetKeywordIds->isNotEmpty()) {
                            $q->whereHas('keywords', fn($k) => $k->whereIn('keywords.id', $targetKeywordIds));
                        }
                        if ($bookmarkedJournalFields->isNotEmpty()) {
                            $q->orWhereHas('journal', fn($j) => $j->whereIn('field', $bookmarkedJournalFields));
                        }
                    });
                }

                return $query->orderByDesc('citations_count')->limit(2)->get()
                    ->map(function ($paper) use ($targetKeywordIds, $bookmarkedJournalFields) {
                        $matchedCount   = $paper->keywords->pluck('id')->intersect($targetKeywordIds)->count();
                        $hasFieldMatch  = $bookmarkedJournalFields->isNotEmpty()
                            && $paper->journal
                            && $bookmarkedJournalFields->contains($paper->journal->field);

                        if ($targetKeywordIds->isEmpty() && $bookmarkedJournalFields->isEmpty()) {
                            $score = 70 + min(25, (int)($paper->citations_count / 10));
                        } else {
                            $score = 50 + min(30, $matchedCount * 15) + ($hasFieldMatch ? 15 : 0) + min(4, (int)($paper->citations_count / 50));
                        }

                        $matchScore = min(99, max(0, $score));

                        $authorNames = $paper->authors->isNotEmpty()
                            ? $paper->authors->pluck('name')->join(', ')
                            : 'Chưa rõ tác giả';

                        return [
                            'id'       => $paper->id,
                            'title'    => $paper->title,
                            'authors'  => $authorNames,
                            'journal'  => $paper->journal?->name ?? 'Khác',
                            'time'     => (string) ($paper->published_year ?? ''),
                            'impact'   => $paper->citations_count ? round(($paper->citations_count / 10), 1) : 0,
                            'citations'=> $paper->citations_count ?? 0,
                            'doi'      => $paper->doi,
                            'abstract' => $paper->abstract,
                            'keywords' => $paper->keywords->map(fn($k) => ['id' => $k->id, 'name' => $k->name])->toArray(),
                            'match'    => $matchScore . '%',
                        ];
                    });
            });
        }

        // ── 3. BUILD RESPONSE ───────────────────────────────────────────────────
        $stats = array_merge($generalStats, ['total_bookmarks' => $totalBookmarks]);
        $latestYear = $trendingTopics->isNotEmpty() ? $trendingTopics->first()->year : null;

        return response()->json([
            'stats'               => $stats,
            'trending_topics'     => $trendingTopics,
            'recent_papers'       => $recentPapers['items'] ?? [],
            'recent_papers_updated_at' => $recentPapers['updated_at'] ?? now()->format('H:i - d/m/Y'),
            'recommended_papers'  => $recommendedPapers,
            'top_journals'        => $topJournals['items'] ?? [],
            'top_journals_updated_at' => $topJournals['updated_at'] ?? now()->format('H:i - d/m/Y'),
            'fields_distribution' => $fieldsDistribution,
            'latest_year'         => $latestYear,
            'bookmarked_paper_ids'=> $bookmarkedPaperIds,
        ]);
    }
}
