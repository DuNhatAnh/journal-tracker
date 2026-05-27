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

        $keywords = Keyword::withCount('papers')
            ->where('name', 'like', "%{$q}%")
            ->orderByDesc('papers_count')
            ->paginate($perPage);

        return response()->json($keywords);
    }

    public function show(Keyword $keyword)
    {
        $keyword->loadCount('papers');

        return response()->json($keyword);
    }
}
