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
        $papers = ResearchPaper::with(['journal', 'authors', 'keywords'])
            ->when($request->keyword, fn($q) => $q->byKeyword($request->keyword))
            ->when($request->year,    fn($q) => $q->byYear((int) $request->year))
            ->orderByDesc('published_year')
            ->paginate(20)
            ->withQueryString();

        return response()->json($papers);
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

        $query = ResearchPaper::with(['journal', 'authors', 'keywords']);
        
        if ($request->filled('q')) {
            $query->search($request->q);
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

        if ($request->sort === 'citations') {
            $query->orderByDesc('citations_count');
        } else {
            // relevance (default): Just order by latest for now, or let DB handle order
            $query->orderByDesc('published_year')->orderByDesc('citations_count');
        }

        $papers = $query->paginate(20)->withQueryString();

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
