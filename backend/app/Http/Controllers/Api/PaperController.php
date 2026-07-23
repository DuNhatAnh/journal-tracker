<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ResearchPaper;
use Illuminate\Http\Request;

class PaperController extends Controller
{
    /**
     * GET /api/papers?keyword=&year=&page=
     */
    public function index(Request $request)
    {
        $cacheKey = 'papers.index.' . md5(json_encode($request->all()));
        
        $papers = \Illuminate\Support\Facades\Cache::remember($cacheKey, 3600, function () use ($request) {
            return ResearchPaper::with(['journal', 'authors', 'keywords'])
                ->when($request->keyword, fn($q) => $q->byKeyword($request->keyword))
                ->when($request->year,    fn($q) => $q->byYear((int) $request->year))
                ->orderByDesc('published_year')
                ->cursorPaginate(10)
                ->withQueryString();
        });

        return response()->json($papers);
    }

    /**
     * GET /api/papers/suggestions?q=
     */
    public function suggestions(Request $request)
    {
        $q = $request->q;
        if (!$q) return response()->json([]);

        $cacheKey = 'papers.suggestions.' . md5($q);
        $suggestions = \Illuminate\Support\Facades\Cache::remember($cacheKey, 3600, function () use ($q) {
            $words = array_filter(explode(' ', preg_replace('/[^\w\s]/', '', $q)));
            
            // 1. Try Full Text Search (Prefix)
            $results = collect();
            if (!empty($words)) {
                $qFts = implode(' & ', array_map(fn($w) => $w . ':*A', $words));
                $results = ResearchPaper::whereRaw("searchable @@ to_tsquery('english', ?)", [$qFts])
                    ->orderByRaw("ts_rank(searchable, to_tsquery('english', ?)) DESC", [$qFts])
                    ->select('id', 'title')
                    ->limit(5)
                    ->get();
            }

            // 2. Typo Tolerance Fallback (Trigram word_similarity)
            if ($results->count() < 5 && mb_strlen($q) >= 3) {
                $typoResults = ResearchPaper::whereRaw("? <% title", [$q])
                    ->orderByRaw("word_similarity(?, title) DESC", [$q])
                    ->select('id', 'title')
                    ->limit(5)
                    ->get();
                
                $results = $results->merge($typoResults)->unique('id')->take(5)->values();
            }

            // 3. Last Fallback (Classic ILIKE) if still empty
            if ($results->isEmpty()) {
                $results = ResearchPaper::where('title', 'ilike', '%' . $q . '%')
                    ->select('id', 'title')
                    ->limit(5)
                    ->get();
            }

            return $results;
        });

        return response()->json($suggestions);
    }

    /**
     * GET /api/papers/search?q=&year=&sort=
     */
    public function search(Request $request)
    {
        $request->validate([
            'q' => 'nullable|string',
            'year' => 'nullable|integer',
            'author' => 'nullable|string',
            'journal' => 'nullable|string',
            'sort' => 'nullable|string|in:relevance,citations'
        ]);

        $cacheKey = 'papers.search.' . md5(json_encode($request->all()));

        $papers = \Illuminate\Support\Facades\Cache::remember($cacheKey, 3600, function () use ($request) {
            $query = ResearchPaper::with(['journal', 'authors', 'keywords']);
            
            if ($request->filled('q')) {
                // Add relevance score based on PostgreSQL ts_rank
                $query->selectRaw("research_papers.*, ts_rank(searchable, websearch_to_tsquery('english', ?)) AS relevance_score", [$request->q]);
                $query->search($request->q);
            } else {
                $query->select('research_papers.*');
            }

            if ($request->year) {
                $query->byYear((int) $request->year);
            }

            if ($request->filled('author')) {
                $query->whereHas('authors', fn($q) => $q->where('name', 'ilike', "%{$request->author}%"));
            }

            if ($request->filled('journal')) {
                $query->whereHas('journal', fn($q) => $q->where('name', 'ilike', "%{$request->journal}%"));
            }

            if ($request->filled('keyword')) {
                $keywords = array_map('trim', explode(',', $request->keyword));
                $query->whereHas('keywords', fn($q) => $q->whereIn('name', $keywords));
            }

            if ($request->sort === 'citations') {
                $query->orderByDesc('citations_count');
            } else {
                // Default sort is Relevance
                if ($request->filled('q')) {
                    $query->orderByDesc('relevance_score')->orderByDesc('citations_count');
                } else {
                    $query->orderByDesc('published_year')->orderByDesc('citations_count');
                }
            }

            // NOTE: Cursor pagination requires ordering by a unique column (e.g., id) to ensure deterministic results.
            // When ordering by non-unique columns like 'published_year' or 'citations_count',
            // we must append orderBy('id') or orderByDesc('id') at the end.
            $query->orderByDesc('id');

            return $query->cursorPaginate(10)->withQueryString();
        });

        return response()->json($papers);
    }

    /**
     * GET /api/papers/{id}
     */
    public function show(ResearchPaper $paper)
    {
        $paper->load(['journal', 'authors', 'keywords']);

        $isBookmarked = auth()->user()
            ?->bookmarks()
            ->where('paper_id', $paper->id)
            ->exists();

        return response()->json([
            'paper'        => $paper,
            'is_bookmarked' => $isBookmarked,
        ]);
    }
}
