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
            ->with(['paper.journal', 'paper.keywords', 'paper.authors'])
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
     * PUT /api/bookmarks/{bookmark}
     */
    public function update(Request $request, Bookmark $bookmark)
    {
        if ($bookmark->user_id !== auth()->id()) {
            return response()->json(['message' => 'Không có quyền.'], 403);
        }

        $request->validate(['note' => 'nullable|string|max:1000']);

        $bookmark->update(['note' => $request->note]);

        return response()->json($bookmark->load('paper'));
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

    /**
     * DELETE /api/bookmarks/paper/{paper_id}
     */
    public function destroyByPaperId($paperId)
    {
        $deleted = Bookmark::where('user_id', auth()->id())
            ->where('paper_id', $paperId)
            ->delete();

        if (!$deleted) {
            return response()->json(['message' => 'Không tìm thấy bookmark cho bài báo này.'], 404);
        }

        return response()->json(['message' => 'Đã xóa bookmark.']);
    }

    /**
     * GET /api/bookmarks/export
     */
    public function export()
    {
        $bookmarks = auth()->user()
            ->bookmarks()
            ->with(['paper.journal', 'paper.authors', 'paper.keywords'])
            ->latest()
            ->get();

        $headers = [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Content-Disposition' => 'attachment; filename="bao_cao_dau_trang_' . now()->format('Ymd_His') . '.csv"',
            'Pragma' => 'no-cache',
            'Cache-Control' => 'must-revalidate, post-check=0, pre-check=0',
            'Expires' => '0',
        ];

        $callback = function () use ($bookmarks) {
            $file = fopen('php://output', 'w');
            
            // Write UTF-8 BOM
            fprintf($file, chr(0xEF).chr(0xBB).chr(0xBF));

            // Write CSV headers
            fputcsv($file, [
                'Tiêu đề bài báo',
                'Tác giả',
                'Tạp chí',
                'Năm xuất bản',
                'Số trích dẫn',
                'Ghi chú cá nhân',
                'Ngày lưu'
            ]);

            foreach ($bookmarks as $bookmark) {
                $paper = $bookmark->paper;
                $authors = $paper->authors->pluck('name')->join(', ');
                $journal = $paper->journal ? $paper->journal->name : ($paper->source ?: 'N/A');
                
                fputcsv($file, [
                    $paper->title,
                    $authors,
                    $journal,
                    $paper->published_year,
                    $paper->citations_count,
                    $bookmark->note ?? '',
                    $bookmark->created_at->format('d/m/Y H:i:s'),
                ]);
            }

            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }
}
