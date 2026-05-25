<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Keyword;

class KeywordController extends Controller
{
    public function index()
    {
        $q = request('q');
        $perPage = request('per_page', 30);
        $keywords = Keyword::withCount('papers')
            ->when($q, function ($query, $q) {
                $query->where('name', 'like', "%{$q}%");
            })
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
