<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Bookmark;
use Illuminate\Http\Request;

class BookmarkController extends Controller
{
    /**
     * GET /api/bookmarks
     */
    public function index()
    {
        $bookmarks = auth()->user()
            ->bookmarks()
            ->with(['paper.journal', 'paper.keywords'])
            ->latest()
            ->paginate(20);

        return response()->json($bookmarks);
    }

    /**
     * POST /api/bookmarks
     */
    public function store(Request $request)
    {
        $request->validate(['paper_id' => 'required|exists:research_papers,id']);

        $bookmark = Bookmark::firstOrCreate(
            ['user_id'  => auth()->id(), 'paper_id' => $request->paper_id],
            ['note'     => $request->note]
        );

        return response()->json($bookmark->load('paper'), 201);
    }

    /**
     * DELETE /api/bookmarks/{bookmark}
     */
    public function destroy(Bookmark $bookmark)
    {
        if ($bookmark->user_id !== auth()->id()) {
            return response()->json(['message' => 'Không có quyền.'], 403);
        }

        $bookmark->delete();

        return response()->json(['message' => 'Đã xóa bookmark.']);
    }
}
