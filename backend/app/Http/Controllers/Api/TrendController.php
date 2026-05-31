<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Keyword;
use App\Models\PublicationTrend;
use App\Models\Author;

class TrendController extends Controller
{
    /**
     * GET /api/trends
     */
    public function index()
    {
        $trends = PublicationTrend::with('keyword')
            ->orderByDesc('year')
            ->orderByDesc('paper_count')
            ->get()
            ->groupBy('keyword.name');

        return response()->json($trends);
    }

    /**
     * GET /api/trends/trending
     * Hot topics (highest growth_rate in latest year)
     */
    public function trending()
    {
        $latest  = PublicationTrend::max('year') ?? date('Y');
        $trending = PublicationTrend::with('keyword')
            ->where('year', $latest)
            ->orderByRaw('(growth_rate * 0.4 + paper_count * 3.0 + citation_count * 0.3) DESC')
            ->limit(10)
            ->get();

        $details = null;
        if ($trending->isNotEmpty() && $trending[0]->keyword) {
            $keyword = $trending[0]->keyword;
            $trends = PublicationTrend::where('keyword_id', $keyword->id)
                ->orderBy('year')
                ->get();
                
            $papers = $keyword->papers()->with('keywords')->get();
            $counts = [];
            foreach ($papers as $paper) {
                foreach ($paper->keywords as $kw) {
                    if ($kw->id !== $keyword->id) {
                        if (!isset($counts[$kw->name])) {
                            $counts[$kw->name] = [
                                'id' => $kw->id,
                                'name' => $kw->name,
                                'count' => 0,
                            ];
                        }
                        $counts[$kw->name]['count']++;
                    }
                }
            }
            uasort($counts, fn($a, $b) => $b['count'] <=> $a['count']);
            $coOccurring = array_slice(array_values($counts), 0, 8);

            $details = [
                'keyword' => $keyword,
                'trends'  => $trends,
                'coOccurring' => $coOccurring,
            ];
        }

        // Emerging Authors: highest citation on papers in the last 3 years
        $trendingAuthors = \DB::table('paper_author')
            ->join('research_papers', 'paper_author.paper_id', '=', 'research_papers.id')
            ->join('authors', 'paper_author.author_id', '=', 'authors.id')
            ->where('research_papers.published_year', '>=', (int)$latest - 2)
            ->selectRaw('authors.id, authors.name, authors.affiliation, COUNT(research_papers.id) as paper_count, SUM(research_papers.citations_count) as citation_count')
            ->groupBy('authors.id', 'authors.name', 'authors.affiliation')
            ->orderByDesc('citation_count')
            ->orderByDesc('paper_count')
            ->limit(5)
            ->get();

        // Emerging Papers: highest citation count in the last 3 years
        $trendingPapers = \App\Models\ResearchPaper::with(['journal', 'authors'])
            ->where('published_year', '>=', (int)$latest - 2)
            ->orderByDesc('citations_count')
            ->limit(5)
            ->get();

        return response()->json([
            'year'            => $latest,
            'trending'        => $trending,
            'details'         => $details,
            'trendingAuthors' => $trendingAuthors,
            'trendingPapers'  => $trendingPapers,
        ]);
    }

    /**
     * GET /api/trends/{keyword}
     */
    public function show(Keyword $keyword)
    {
        $details = $this->getKeywordDetails($keyword);
        return response()->json($details);
    }

    /**
     * GET /api/trends/{keyword}/history
     */
    public function history(Keyword $keyword)
    {
        $trends = PublicationTrend::where('keyword_id', $keyword->id)
            ->orderBy('year')
            ->get();

        $papers = $keyword->papers()->with('keywords')->get();
        $counts = [];
        foreach ($papers as $paper) {
            foreach ($paper->keywords as $kw) {
                if ($kw->id !== $keyword->id) {
                    if (!isset($counts[$kw->name])) {
                        $counts[$kw->name] = [
                            'id' => $kw->id,
                            'name' => $kw->name,
                            'count' => 0,
                        ];
                    }
                    $counts[$kw->name]['count']++;
                }
            }
        }
        uasort($counts, fn($a, $b) => $b['count'] <=> $a['count']);
        $coOccurring = array_slice(array_values($counts), 0, 8);

        return response()->json([
            'keyword' => $keyword,
            'trends'  => $trends,
            'coOccurring' => $coOccurring,
        ]);
    }

    /**
     * GET /api/trends/{keyword}/journals
     */
    public function journals(Keyword $keyword)
    {
        $papers = $keyword->papers()->with(['journal', 'authors'])->get();

        $allJournalCitations = \App\Models\ResearchPaper::select('journal_id', 'citations_count')
            ->whereNotNull('journal_id')
            ->get()
            ->groupBy('journal_id');

        $journalHIndexes = [];
        foreach ($allJournalCitations as $journalId => $papersList) {
            $citations = $papersList->pluck('citations_count')->sortByDesc(fn($x) => $x)->values();
            $hIndex = 0;
            foreach ($citations as $idx => $citationsCount) {
                if ($citationsCount >= $idx + 1) {
                    $hIndex = $idx + 1;
                } else {
                    break;
                }
            }
            $journalHIndexes[$journalId] = $hIndex;
        }

        $journalCounts = [];
        $journalModels = [];
        foreach ($papers as $paper) {
            if ($paper->journal) {
                $j = $paper->journal;
                $journalCounts[$j->id] = ($journalCounts[$j->id] ?? 0) + 1;
                $journalModels[$j->id] = $j;
            }
        }
        
        arsort($journalCounts);
        $topJournalIds = array_slice(array_keys($journalCounts), 0, 3);
        
        $journals = [];
        foreach ($topJournalIds as $jId) {
            if (isset($journalModels[$jId])) {
                $j = $journalModels[$jId];
                $j->papers_count = $journalCounts[$jId];
                $j->h_index = $journalHIndexes[$jId] ?? 0;
                $journals[] = $j;
            }
        }

        return response()->json($journals);
    }

    /**
     * GET /api/trends/{keyword}/network
     */
    public function network(Keyword $keyword)
    {
        $papers = $keyword->papers()->with(['journal', 'authors'])->get();

        $authorStats = [];
        foreach ($papers as $paper) {
            foreach ($paper->authors as $author) {
                if (!isset($authorStats[$author->id])) {
                    $authorStats[$author->id] = [
                        'author' => $author,
                        'count' => 0,
                    ];
                }
                $authorStats[$author->id]['count']++;
            }
        }
        
        uasort($authorStats, function($a, $b) {
            return $b['count'] <=> $a['count'];
        });
        
        $topAuthorStats = array_slice($authorStats, 0, 15, true);
        $topAuthorIds = array_keys($topAuthorStats);

        $allAuthorCitations = \DB::table('paper_author')
            ->join('research_papers', 'paper_author.paper_id', '=', 'research_papers.id')
            ->select('paper_author.author_id', 'research_papers.citations_count')
            ->get()
            ->groupBy('author_id');

        $authorHIndexes = [];
        foreach ($allAuthorCitations as $authorId => $papersList) {
            $citations = $papersList->pluck('citations_count')->sortByDesc(fn($x) => $x)->values();
            $hIndex = 0;
            foreach ($citations as $idx => $citationsCount) {
                if ($citationsCount >= $idx + 1) {
                    $hIndex = $idx + 1;
                } else {
                    break;
                }
            }
            $authorHIndexes[$authorId] = $hIndex;
        }
        
        $nodes = [];
        foreach ($topAuthorStats as $authorId => $stats) {
            $author = $stats['author'];
            $nodes[] = [
                'id' => $author->id,
                'name' => $author->name,
                'papers_count' => $stats['count'],
                'h_index' => $authorHIndexes[$author->id] ?? 0,
            ];
        }
        
        $pairWeights = [];
        foreach ($papers as $paper) {
            $authorsOnPaper = $paper->authors->pluck('id')->intersect($topAuthorIds)->values()->toArray();
            $count = count($authorsOnPaper);
            for ($i = 0; $i < $count; $i++) {
                for ($j = $i + 1; $j < $count; $j++) {
                    $id1 = $authorsOnPaper[$i];
                    $id2 = $authorsOnPaper[$j];
                    $key = $id1 < $id2 ? "{$id1}-{$id2}" : "{$id2}-{$id1}";
                    if (!isset($pairWeights[$key])) {
                        $pairWeights[$key] = [
                            'source' => $id1,
                            'target' => $id2,
                            'weight' => 0,
                        ];
                    }
                    $pairWeights[$key]['weight']++;
                }
            }
        }
        $links = array_values($pairWeights);

        return response()->json([
            'nodes' => $nodes,
            'links' => $links,
        ]);
    }

    /**
     * GET /api/trends/{keyword}/papers
     */
    public function papers(Keyword $keyword)
    {
        $topPapers = $keyword->papers()
            ->with(['journal', 'authors'])
            ->orderByDesc('citations_count')
            ->limit(5)
            ->get();
        return response()->json($topPapers);
    }

    /**
     * Helper to load full metadata for a selected keyword trend
     */
    private function getKeywordDetails(Keyword $keyword)
    {
        // 1. Get history trends for the line chart
        $trends = PublicationTrend::where('keyword_id', $keyword->id)
            ->orderBy('year')
            ->get();

        // 2. Fetch all keyword papers with their authors and journals in a single query
        $papers = $keyword->papers()->with(['journal', 'authors'])->get();

        // 3. Compute H-index for all journals in-memory
        $allJournalCitations = \App\Models\ResearchPaper::select('journal_id', 'citations_count')
            ->whereNotNull('journal_id')
            ->get()
            ->groupBy('journal_id');

        $journalHIndexes = [];
        foreach ($allJournalCitations as $journalId => $papersList) {
            $citations = $papersList->pluck('citations_count')->sortByDesc(fn($x) => $x)->values();
            $hIndex = 0;
            foreach ($citations as $idx => $citationsCount) {
                if ($citationsCount >= $idx + 1) {
                    $hIndex = $idx + 1;
                } else {
                    break;
                }
            }
            $journalHIndexes[$journalId] = $hIndex;
        }

        // 4. Extract top 3 journals based on keyword papers count
        $journalCounts = [];
        $journalModels = [];
        foreach ($papers as $paper) {
            if ($paper->journal) {
                $j = $paper->journal;
                $journalCounts[$j->id] = ($journalCounts[$j->id] ?? 0) + 1;
                $journalModels[$j->id] = $j;
            }
        }
        
        arsort($journalCounts);
        $topJournalIds = array_slice(array_keys($journalCounts), 0, 3);
        
        $journals = [];
        foreach ($topJournalIds as $jId) {
            if (isset($journalModels[$jId])) {
                $j = $journalModels[$jId];
                $j->papers_count = $journalCounts[$jId];
                $j->h_index = $journalHIndexes[$jId] ?? 0;
                $journals[] = $j;
            }
        }

        // 5. Build Co-authorship Network Node & Edge data
        $authorStats = [];
        foreach ($papers as $paper) {
            foreach ($paper->authors as $author) {
                if (!isset($authorStats[$author->id])) {
                    $authorStats[$author->id] = [
                        'author' => $author,
                        'count' => 0,
                    ];
                }
                $authorStats[$author->id]['count']++;
            }
        }
        
        uasort($authorStats, function($a, $b) {
            return $b['count'] <=> $a['count'];
        });
        
        // Take top 15 authors for the network
        $topAuthorStats = array_slice($authorStats, 0, 15, true);
        $topAuthorIds = array_keys($topAuthorStats);

        // Compute H-index for all authors in-memory
        $allAuthorCitations = \DB::table('paper_author')
            ->join('research_papers', 'paper_author.paper_id', '=', 'research_papers.id')
            ->select('paper_author.author_id', 'research_papers.citations_count')
            ->get()
            ->groupBy('author_id');

        $authorHIndexes = [];
        foreach ($allAuthorCitations as $authorId => $papersList) {
            $citations = $papersList->pluck('citations_count')->sortByDesc(fn($x) => $x)->values();
            $hIndex = 0;
            foreach ($citations as $idx => $citationsCount) {
                if ($citationsCount >= $idx + 1) {
                    $hIndex = $idx + 1;
                } else {
                    break;
                }
            }
            $authorHIndexes[$authorId] = $hIndex;
        }
        
        $nodes = [];
        foreach ($topAuthorStats as $authorId => $stats) {
            $author = $stats['author'];
            $nodes[] = [
                'id' => $author->id,
                'name' => $author->name,
                'papers_count' => $stats['count'],
                'h_index' => $authorHIndexes[$author->id] ?? 0,
            ];
        }
        
        $pairWeights = [];
        foreach ($papers as $paper) {
            $authorsOnPaper = $paper->authors->pluck('id')->intersect($topAuthorIds)->values()->toArray();
            $count = count($authorsOnPaper);
            for ($i = 0; $i < $count; $i++) {
                for ($j = $i + 1; $j < $count; $j++) {
                    $id1 = $authorsOnPaper[$i];
                    $id2 = $authorsOnPaper[$j];
                    $key = $id1 < $id2 ? "{$id1}-{$id2}" : "{$id2}-{$id1}";
                    if (!isset($pairWeights[$key])) {
                        $pairWeights[$key] = [
                            'source' => $id1,
                            'target' => $id2,
                            'weight' => 0,
                        ];
                    }
                    $pairWeights[$key]['weight']++;
                }
            }
        }
        $links = array_values($pairWeights);

        $topPapers = $keyword->papers()
            ->with(['journal', 'authors'])
            ->orderByDesc('citations_count')
            ->limit(5)
            ->get();

        return [
            'keyword' => $keyword,
            'trends'  => $trends,
            'journals'=> $journals,
            'papers'  => $topPapers,
            'network' => [
                'nodes' => $nodes,
                'links' => $links,
            ],
        ];
    }

    public function authorHistory(Author $author)
    {
        $papers = $author->papers()->with(['keywords', 'journal', 'authors'])->get();
        
        $yearsData = [];
        foreach ($papers as $paper) {
            $yr = $paper->published_year;
            if (!isset($yearsData[$yr])) {
                $yearsData[$yr] = [
                    'year' => $yr,
                    'paper_count' => 0,
                    'citation_count' => 0,
                ];
            }
            $yearsData[$yr]['paper_count']++;
            $yearsData[$yr]['citation_count'] += $paper->citations_count;
        }
        
        ksort($yearsData);
        
        $trends = [];
        $prevCount = 0;
        foreach ($yearsData as $yr => $data) {
            $growthRate = 0;
            if ($prevCount > 0) {
                $growthRate = round((($data['paper_count'] - $prevCount) / $prevCount) * 100, 1);
            }
            $trends[] = [
                'year' => $yr,
                'paper_count' => $data['paper_count'],
                'citation_count' => $data['citation_count'],
                'growth_rate' => $growthRate,
            ];
            $prevCount = $data['paper_count'];
        }

        $counts = [];
        foreach ($papers as $paper) {
            foreach ($paper->keywords as $kw) {
                if (!isset($counts[$kw->name])) {
                    $counts[$kw->name] = [
                        'id' => $kw->id,
                        'name' => $kw->name,
                        'count' => 0,
                    ];
                }
                $counts[$kw->name]['count']++;
            }
        }
        uasort($counts, fn($a, $b) => $b['count'] <=> $a['count']);
        $coOccurring = array_slice(array_values($counts), 0, 8);

        // Compute H-index
        $citations = $papers->pluck('citations_count')->sortByDesc(fn($x) => $x)->values();
        $hIndex = 0;
        foreach ($citations as $idx => $citationsCount) {
            if ($citationsCount >= $idx + 1) {
                $hIndex = $idx + 1;
            } else {
                break;
            }
        }

        // Compute unique co-authors count
        $coAuthorIds = [];
        foreach ($papers as $paper) {
            foreach ($paper->authors as $auth) {
                if ($auth->id !== $author->id) {
                    $coAuthorIds[$auth->id] = true;
                }
            }
        }
        $coAuthorsCount = count($coAuthorIds);

        // Compute top collaborators
        $collaborators = [];
        foreach ($papers as $paper) {
            foreach ($paper->authors as $auth) {
                if ($auth->id !== $author->id) {
                    if (!isset($collaborators[$auth->name])) {
                        $collaborators[$auth->name] = 0;
                    }
                    $collaborators[$auth->name]++;
                }
            }
        }
        arsort($collaborators);
        $topCollaborators = array_slice(array_keys($collaborators), 0, 3);

        // Compute trending papers count (published in last 3 years with >= 10 citations)
        $latestYear = \App\Models\PublicationTrend::max('year') ?? date('Y');
        $trendingPapersCount = $papers->where('published_year', '>=', (int)$latestYear - 2)
            ->where('citations_count', '>=', 10)
            ->count();

        // Compute i10-index
        $i10Index = $papers->where('citations_count', '>=', 10)->count();

        // Compute paper citations list
        $papersCitations = $papers->map(function ($paper) {
            return [
                'id' => $paper->id,
                'title' => $paper->title,
                'citations_count' => $paper->citations_count,
                'published_year' => $paper->published_year,
            ];
        })->sortByDesc('citations_count')->values()->all();

        return response()->json([
            'author' => $author,
            'trends'  => $trends,
            'coOccurring' => $coOccurring,
            'h_index' => $hIndex,
            'co_authors_count' => $coAuthorsCount,
            'total_papers_count' => $papers->count(),
            'total_citations_count' => $papers->sum('citations_count'),
            'i10_index' => $i10Index,
            'trending_papers_count' => $trendingPapersCount,
            'top_collaborators' => $topCollaborators,
            'papers_citations' => $papersCitations,
        ]);
    }

    /**
     * GET /api/trends/author/{author}/network
     */
    public function authorNetwork(Author $author)
    {
        $papers = $author->papers()->with(['journal', 'authors'])->get();

        $authorStats = [];
        foreach ($papers as $paper) {
            foreach ($paper->authors as $auth) {
                if (!isset($authorStats[$auth->id])) {
                    $authorStats[$auth->id] = [
                        'author' => $auth,
                        'count' => 0,
                    ];
                }
                $authorStats[$auth->id]['count']++;
            }
        }
        
        uasort($authorStats, function($a, $b) {
            return $b['count'] <=> $a['count'];
        });
        
        $topAuthorStats = array_slice($authorStats, 0, 15, true);
        $topAuthorIds = array_keys($topAuthorStats);

        $allAuthorCitations = \DB::table('paper_author')
            ->join('research_papers', 'paper_author.paper_id', '=', 'research_papers.id')
            ->select('paper_author.author_id', 'research_papers.citations_count')
            ->get()
            ->groupBy('author_id');

        $authorHIndexes = [];
        foreach ($allAuthorCitations as $authorId => $papersList) {
            $citations = $papersList->pluck('citations_count')->sortByDesc(fn($x) => $x)->values();
            $hIndex = 0;
            foreach ($citations as $idx => $citationsCount) {
                if ($citationsCount >= $idx + 1) {
                    $hIndex = $idx + 1;
                } else {
                    break;
                }
            }
            $authorHIndexes[$authorId] = $hIndex;
        }
        
        $nodes = [];
        foreach ($topAuthorStats as $authorId => $stats) {
            $auth = $stats['author'];
            $nodes[] = [
                'id' => $auth->id,
                'name' => $auth->name,
                'papers_count' => $stats['count'],
                'h_index' => $authorHIndexes[$auth->id] ?? 0,
            ];
        }
        
        $pairWeights = [];
        foreach ($papers as $paper) {
            $authorsOnPaper = $paper->authors->pluck('id')->intersect($topAuthorIds)->values()->toArray();
            $count = count($authorsOnPaper);
            for ($i = 0; $i < $count; $i++) {
                for ($j = $i + 1; $j < $count; $j++) {
                    $id1 = $authorsOnPaper[$i];
                    $id2 = $authorsOnPaper[$j];
                    $key = $id1 < $id2 ? "{$id1}-{$id2}" : "{$id2}-{$id1}";
                    if (!isset($pairWeights[$key])) {
                        $pairWeights[$key] = [
                            'source' => $id1,
                            'target' => $id2,
                            'weight' => 0,
                        ];
                    }
                    $pairWeights[$key]['weight']++;
                }
            }
        }
        $links = array_values($pairWeights);

        return response()->json([
            'nodes' => $nodes,
            'links' => $links,
        ]);
    }

    /**
     * GET /api/trends/author/{author}/journals
     */
    public function authorJournals(Author $author)
    {
        $papers = $author->papers()->with(['journal', 'authors'])->get();

        $allJournalCitations = \App\Models\ResearchPaper::select('journal_id', 'citations_count')
            ->whereNotNull('journal_id')
            ->get()
            ->groupBy('journal_id');

        $journalHIndexes = [];
        foreach ($allJournalCitations as $journalId => $papersList) {
            $citations = $papersList->pluck('citations_count')->sortByDesc(fn($x) => $x)->values();
            $hIndex = 0;
            foreach ($citations as $idx => $citationsCount) {
                if ($citationsCount >= $idx + 1) {
                    $hIndex = $idx + 1;
                } else {
                    break;
                }
            }
            $journalHIndexes[$journalId] = $hIndex;
        }

        $journalCounts = [];
        $journalModels = [];
        $otherPapersCount = 0;
        $otherPapersCitations = [];

        foreach ($papers as $paper) {
            if ($paper->journal) {
                $j = $paper->journal;
                $journalCounts[$j->id] = ($journalCounts[$j->id] ?? 0) + 1;
                $journalModels[$j->id] = $j;
            } else {
                $otherPapersCount++;
                $otherPapersCitations[] = $paper->citations_count;
            }
        }
        
        arsort($journalCounts);
        $topJournalIds = array_slice(array_keys($journalCounts), 0, 3);
        
        $journals = [];
        foreach ($topJournalIds as $jId) {
            if (isset($journalModels[$jId])) {
                $j = $journalModels[$jId];
                $j->papers_count = $journalCounts[$jId];
                $j->h_index = $journalHIndexes[$jId] ?? 0;
                $journals[] = $j;
            }
        }

        // Include virtual journal for books/preprints
        if ($otherPapersCount > 0) {
            rsort($otherPapersCitations);
            $otherHIndex = 0;
            foreach ($otherPapersCitations as $idx => $citationsCount) {
                if ($citationsCount >= $idx + 1) {
                    $otherHIndex = $idx + 1;
                } else {
                    break;
                }
            }

            $virtualJournal = new \App\Models\Journal([
                'name' => 'Sách & Ấn phẩm khác',
                'field' => 'Nhiều lĩnh vực',
                'publisher' => 'Khác',
            ]);
            $virtualJournal->id = 0; // Virtual ID
            $virtualJournal->papers_count = $otherPapersCount;
            $virtualJournal->h_index = $otherHIndex;

            $journals[] = $virtualJournal;
        }

        return response()->json($journals);
    }

    /**
     * GET /api/trends/author/{author}/papers
     */
    public function authorPapers(Author $author)
    {
        $topPapers = $author->papers()
            ->with(['journal', 'authors'])
            ->orderByDesc('citations_count')
            ->limit(5)
            ->get();
        return response()->json($topPapers);
    }

    /**
     * GET /api/public/trends
     */
    public function publicTrends()
    {
        // Lấy top 3 từ khóa có dữ liệu xu hướng
        $keywords = \App\Models\Keyword::has('trends')
            ->with(['trends' => function($q) {
                $q->orderBy('year');
            }])
            ->limit(3)
            ->get();

        $result = [];
        foreach ($keywords as $kw) {
            $points = [];
            foreach ($kw->trends as $trend) {
                $points[] = [
                    'year' => (int)$trend->year,
                    'val' => (int)$trend->paper_count
                ];
            }
            if (!empty($points)) {
                $result[] = [
                    'id' => $kw->slug,
                    'name' => $kw->name,
                    'points' => $points
                ];
            }
        }

        // Fallback chất lượng cao nếu database trống hoặc thiếu dữ liệu
        if (count($result) < 3) {
            $result = [
                [
                    'id' => 'dl',
                    'name' => 'Trí tuệ nhân tạo',
                    'points' => [
                        ['year' => 2020, 'val' => 12400],
                        ['year' => 2021, 'val' => 18600],
                        ['year' => 2022, 'val' => 24500],
                        ['year' => 2023, 'val' => 31200],
                        ['year' => 2024, 'val' => 42000],
                        ['year' => 2025, 'val' => 49500],
                        ['year' => 2026, 'val' => 56200],
                    ]
                ],
                [
                    'id' => 'cyber',
                    'name' => 'An ninh mạng',
                    'points' => [
                        ['year' => 2020, 'val' => 8200],
                        ['year' => 2021, 'val' => 11500],
                        ['year' => 2022, 'val' => 14800],
                        ['year' => 2023, 'val' => 19200],
                        ['year' => 2024, 'val' => 23400],
                        ['year' => 2025, 'val' => 26800],
                        ['year' => 2026, 'val' => 29800],
                    ]
                ],
                [
                    'id' => 'cloud',
                    'name' => 'Điện toán đám mây',
                    'points' => [
                        ['year' => 2020, 'val' => 4100],
                        ['year' => 2021, 'val' => 6700],
                        ['year' => 2022, 'val' => 9200],
                        ['year' => 2023, 'val' => 11800],
                        ['year' => 2024, 'val' => 14500],
                        ['year' => 2025, 'val' => 16200],
                        ['year' => 2026, 'val' => 18400],
                    ]
                ]
            ];
        }

        return response()->json($result);
    }
}

