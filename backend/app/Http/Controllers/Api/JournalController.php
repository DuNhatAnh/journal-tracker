<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Journal;

class JournalController extends Controller
{
    public function index()
    {
        $journals = Journal::withCount('papers')
            ->orderByDesc('papers_count')
            ->paginate(20);

        return response()->json($journals);
    }

    public function show(Journal $journal)
    {
        $journal->loadCount('papers');
        $trends = $journal->paperCountByYear();

        return response()->json([
            'journal' => $journal,
            'trends'  => $trends,
        ]);
    }
}
