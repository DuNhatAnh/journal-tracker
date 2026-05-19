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
        $latest  = PublicationTrend::max('year');
        $trending = PublicationTrend::with('keyword')
            ->where('year', $latest)
            ->orderByDesc('growth_rate')
            ->limit(10)
            ->get();

        return response()->json([
            'year'     => $latest,
            'trending' => $trending,
        ]);
    }

    /**
     * GET /api/trends/{keyword}
     */
    public function show(Keyword $keyword)
    {
        $trends = PublicationTrend::where('keyword_id', $keyword->id)
            ->orderBy('year')
            ->get();

        $papers = $keyword->papers()
            ->with(['journal', 'authors'])
            ->orderByDesc('citations_count')
            ->limit(20)
            ->get();

        return response()->json([
            'keyword' => $keyword,
            'trends'  => $trends,
            'papers'  => $papers,
        ]);
    }
}
