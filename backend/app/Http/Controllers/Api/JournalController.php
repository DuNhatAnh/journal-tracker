<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Journal;
use App\Models\ResearchPaper;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class JournalController extends Controller
{
    /**
     * GET /api/journals
     * Danh sách tạp chí, kèm trường is_followed nếu đã đăng nhập.
     */
    public function index(Request $request)
    {
        $user = Auth::user();
        $followedIds = $user ? $user->followedJournals()->pluck('journals.id') : collect();

        $journals = Journal::withCount('papers')
            ->orderByDesc('papers_count')
            ->paginate(20)
            ->through(fn($j) => array_merge($j->toArray(), [
                'is_followed' => $followedIds->contains($j->id),
            ]));

        return response()->json($journals);
    }

    /**
     * GET /api/journals/{journal}
     */
    public function show(Journal $journal)
    {
        $journal->loadCount('papers');
        $trends = $journal->paperCountByYear();

        return response()->json([
            'journal' => $journal,
            'trends'  => $trends,
        ]);
    }

    /**
     * POST /api/journals/{journal}/follow
     */
    public function follow(Journal $journal)
    {
        $user = Auth::user();
        $user->followedJournals()->syncWithoutDetaching([$journal->id]);
        \Illuminate\Support\Facades\Cache::forget("user." . $user->id . ".following_status");

        return response()->json(['message' => 'Đã theo dõi tạp chí.', 'is_followed' => true]);
    }

    /**
     * DELETE /api/journals/{journal}/follow
     */
    public function unfollow(Journal $journal)
    {
        $user = Auth::user();
        $user->followedJournals()->detach($journal->id);
        \Illuminate\Support\Facades\Cache::forget("user." . $user->id . ".following_status");

        return response()->json(['message' => 'Đã bỏ theo dõi tạp chí.', 'is_followed' => false]);
    }

    /**
     * GET /api/journals/feed
     * Trả về bài báo mới nhất từ các tạp chí đang theo dõi.
     */
    public function feed(Request $request)
    {
        $user = Auth::user();

        // Chỉ lấy IDs — nhẹ hơn load full relation
        $followedJournalIds = $user->followedJournals()->pluck('journals.id');

        if ($followedJournalIds->isEmpty()) {
            return response()->json([
                'papers'            => [],
                'followed_journals' => [],
            ]);
        }

        // Chạy song song: papers + followed journals info
        $papers = ResearchPaper::select('id', 'title', 'abstract', 'published_year', 'journal_id', 'citations_count', 'doi')
            ->with([
                'journal:id,name',
                'authors:id,name',
                'keywords:id,name',
            ])
            ->whereIn('journal_id', $followedJournalIds)
            ->orderByDesc('published_year')
            ->orderByDesc('citations_count')
            ->limit(20)
            ->get()
            ->map(fn($p) => [
                'id'             => $p->id,
                'title'          => $p->title,
                'abstract'       => $p->abstract,
                'published_year' => $p->published_year,
                'citations'      => $p->citations_count ?? 0,
                'doi'            => $p->doi,
                'journal_name'   => $p->journal?->name ?? 'Không rõ',
                'journal_id'     => $p->journal_id,
                'keywords'       => $p->keywords->pluck('name')->toArray(),
                'authors'        => $p->authors->pluck('name')->join(', '),
            ]);

        // Lấy thông tin journals đang follow với papers_count
        $followedJournals = Journal::select('id', 'name', 'field')
            ->withCount('papers')
            ->whereIn('id', $followedJournalIds)
            ->get()
            ->map(fn($j) => [
                'id'           => $j->id,
                'name'         => $j->name,
                'field'        => $j->field,
                'papers_count' => $j->papers_count,
            ]);

        return response()->json([
            'papers'            => $papers,
            'followed_journals' => $followedJournals,
        ]);
    }
}
