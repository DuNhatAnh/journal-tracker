<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Keyword;
use App\Models\Journal;
use App\Models\Author;
use App\Models\ResearchPaper;
use Illuminate\Http\Request;

class FollowingController extends Controller
{
    /**
     * Get followed lists.
     */
    public function index()
    {
        $user = auth()->user();
        $cacheKey = "user.{$user->id}.following_status";

        $status = \Illuminate\Support\Facades\Cache::remember($cacheKey, 3600, function () use ($user) {
            return [
                'keywords' => $user->followedKeywords()->get(),
                'journals' => $user->followedJournals()->get(),
                'authors'  => $user->followedAuthors()->get(),
            ];
        });

        return response()->json($status);
    }

    /**
     * Get compiled latest feed.
     */
    public function feed(Request $request)
    {
        $user = auth()->user();

        $keywordIds = $user->followedKeywords()->pluck('id');
        $journalIds = $user->followedJournals()->pluck('id');
        $authorIds  = $user->followedAuthors()->pluck('id');

        if ($keywordIds->isEmpty() && $journalIds->isEmpty() && $authorIds->isEmpty()) {
            return response()->json([
                'data' => [],
                'current_page' => 1,
                'last_page' => 1,
                'total' => 0
            ]);
        }

        $papers = ResearchPaper::query()
            ->where(function ($query) use ($keywordIds, $journalIds, $authorIds) {
                if ($keywordIds->isNotEmpty()) {
                    $query->orWhereHas('keywords', function ($q) use ($keywordIds) {
                        $q->whereIn('keywords.id', $keywordIds);
                    });
                }
                if ($journalIds->isNotEmpty()) {
                    $query->orWhereIn('journal_id', $journalIds);
                }
                if ($authorIds->isNotEmpty()) {
                    $query->orWhereHas('authors', function ($q) use ($authorIds) {
                        $q->whereIn('authors.id', $authorIds);
                    });
                }
            })
            ->with(['journal', 'authors', 'keywords'])
            ->orderByDesc('published_year')
            ->orderByDesc('citations_count')
            ->orderByDesc('id')
            ->paginate(15);

        return response()->json($papers);
    }

    /**
     * Follow a Keyword.
     */
    public function followKeyword(Request $request)
    {
        $request->validate(['keyword_id' => 'required|exists:keywords,id']);
        auth()->user()->followedKeywords()->syncWithoutDetaching([$request->keyword_id]);
        \Illuminate\Support\Facades\Cache::forget("user." . auth()->id() . ".following_status");
        \Illuminate\Support\Facades\Cache::forget("dash.recommended." . auth()->id());
        return response()->json(['message' => 'Đã theo dõi từ khóa thành công.']);
    }

    /**
     * Unfollow a Keyword.
     */
    public function unfollowKeyword(Keyword $keyword)
    {
        auth()->user()->followedKeywords()->detach($keyword->id);
        \Illuminate\Support\Facades\Cache::forget("user." . auth()->id() . ".following_status");
        \Illuminate\Support\Facades\Cache::forget("dash.recommended." . auth()->id());
        return response()->json(['message' => 'Đã hủy theo dõi từ khóa.']);
    }

    /**
     * Follow a Journal.
     */
    public function followJournal(Request $request)
    {
        $request->validate(['journal_id' => 'required|exists:journals,id']);
        auth()->user()->followedJournals()->syncWithoutDetaching([$request->journal_id]);
        \Illuminate\Support\Facades\Cache::forget("user." . auth()->id() . ".following_status");
        \Illuminate\Support\Facades\Cache::forget("dash.recommended." . auth()->id());
        return response()->json(['message' => 'Đã theo dõi tạp chí thành công.']);
    }

    /**
     * Unfollow a Journal.
     */
    public function unfollowJournal(Journal $journal)
    {
        auth()->user()->followedJournals()->detach($journal->id);
        \Illuminate\Support\Facades\Cache::forget("user." . auth()->id() . ".following_status");
        \Illuminate\Support\Facades\Cache::forget("dash.recommended." . auth()->id());
        return response()->json(['message' => 'Đã hủy theo dõi tạp chí.']);
    }

    /**
     * Follow an Author.
     */
    public function followAuthor(Request $request)
    {
        $request->validate(['author_id' => 'required|exists:authors,id']);
        auth()->user()->followedAuthors()->syncWithoutDetaching([$request->author_id]);
        \Illuminate\Support\Facades\Cache::forget("user." . auth()->id() . ".following_status");
        \Illuminate\Support\Facades\Cache::forget("dash.recommended." . auth()->id());
        return response()->json(['message' => 'Đã theo dõi tác giả thành công.']);
    }

    /**
     * Unfollow an Author.
     */
    public function unfollowAuthor(Author $author)
    {
        auth()->user()->followedAuthors()->detach($author->id);
        \Illuminate\Support\Facades\Cache::forget("user." . auth()->id() . ".following_status");
        \Illuminate\Support\Facades\Cache::forget("dash.recommended." . auth()->id());
        return response()->json(['message' => 'Đã hủy theo dõi tác giả.']);
    }

    /**
     * Search options to follow.
     */
    public function search(Request $request)
    {
        $type = $request->query('type');
        $q = $request->query('q');

        if (empty($q)) {
            return response()->json([]);
        }

        if ($type === 'keyword') {
            $results = Keyword::where('name', 'ilike', "%{$q}%")
                ->limit(20)
                ->get();
        } elseif ($type === 'journal') {
            $results = Journal::where('name', 'ilike', "%{$q}%")
                ->limit(20)
                ->get();
        } elseif ($type === 'author') {
            $results = Author::where('name', 'ilike', "%{$q}%")
                ->limit(20)
                ->get();
        } else {
            return response()->json(['message' => 'Loại tìm kiếm không hợp lệ.'], 400);
        }

        return response()->json($results);
    }
}
