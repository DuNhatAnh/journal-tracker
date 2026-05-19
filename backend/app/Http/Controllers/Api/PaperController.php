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
     * GET /api/papers/search?q=
     */
    public function search(Request $request)
    {
        $request->validate(['q' => 'required|string|min:2']);

        $papers = ResearchPaper::with(['journal', 'authors', 'keywords'])
            ->search($request->q)
            ->orderByDesc('citations_count')
            ->paginate(20)
            ->withQueryString();

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
