<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Keyword;

class KeywordController extends Controller
{
    public function index()
    {
        $q = request('q');
        $perPage = (int) request('per_page', 30);

        if (empty($q)) {
            $cacheKey = "keywords.index.per_page.{$perPage}";
            $keywords = \Illuminate\Support\Facades\Cache::remember($cacheKey, 3600, function () use ($perPage) {
                return Keyword::withCount('papers')
                    ->orderByDesc('papers_count')
                    ->paginate($perPage);
            });
            return response()->json($keywords);
        }

        $lowerQ = mb_strtolower($q);

        // Standard case-insensitive search
        $keywords = Keyword::withCount('papers')
            ->whereRaw('LOWER(name) LIKE ?', ["%{$lowerQ}%"])
            ->orderByDesc('papers_count')
            ->paginate($perPage);

        // Fallback to fuzzy match (typo tolerance) if no exact match found
        if ($keywords->isEmpty() && mb_strlen($q) >= 3) {
            $chars = mb_str_split(str_replace(' ', '', $lowerQ));
            $fuzzyPattern = '%' . implode('%', $chars) . '%';
            
            $keywords = Keyword::withCount('papers')
                ->whereRaw('LOWER(name) LIKE ?', [$fuzzyPattern])
                ->orderByRaw("LENGTH(name) ASC") // Prioritize tighter matches
                ->orderByDesc('papers_count')
                ->paginate($perPage);
        }

        return response()->json($keywords);
    }

    public function show(Keyword $keyword)
    {
        $keyword->loadCount('papers');

        return response()->json($keyword);
    }
}
