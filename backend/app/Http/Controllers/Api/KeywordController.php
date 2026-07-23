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
        $cacheKey = "keywords.search." . md5($lowerQ) . ".per_page.{$perPage}";

        $keywords = \Illuminate\Support\Facades\Cache::remember($cacheKey, 3600, function () use ($lowerQ, $q, $perPage) {
            // Standard case-insensitive search - Optimized for Auto-complete
            $results = Keyword::select('id', 'name')
                ->where('name', 'ilike', "%{$lowerQ}%")
                ->limit($perPage)
                ->get();

            // Fallback to fuzzy match (typo tolerance) if no exact match found
            if ($results->isEmpty() && mb_strlen($q) >= 3) {
                $chars = mb_str_split(str_replace(' ', '', $lowerQ));
                $fuzzyPattern = '%' . implode('%', $chars) . '%';
                
                $results = Keyword::select('id', 'name')
                    ->whereRaw('LOWER(name) LIKE ?', [$fuzzyPattern])
                    ->orderByRaw("LENGTH(name) ASC") // Prioritize tighter matches
                    ->limit($perPage)
                    ->get();
            }

            // Return as paginated format to keep backward compatibility with frontend expecting data array
            return [
                'data' => $results,
                'total' => $results->count(),
            ];
        });

        return response()->json($keywords);
    }

    public function show(Keyword $keyword)
    {
        $keyword->loadCount('papers');

        return response()->json($keyword);
    }
}
