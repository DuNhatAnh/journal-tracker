<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Keyword;
use App\Models\PublicationTrend;

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

        return response()->json([
            'year'     => $latest,
            'trending' => $trending,
            'details'  => $details,
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
}
