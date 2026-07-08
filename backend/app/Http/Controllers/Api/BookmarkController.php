<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Bookmark;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Cache;

class BookmarkController extends Controller
{
    /**
     * GET /api/bookmarks
     */
    public function index(Request $request)
    {
        $query = $this->buildFilteredQuery($request, false);
        
        // Fallback to fuzzy search if search query is provided, exact match yields 0, and length >= 3
        if ($request->filled('search') && mb_strlen($request->search) >= 3 && $query->count() === 0) {
            $query = $this->buildFilteredQuery($request, true);
        }

        // Load limit from settings file
        $user = auth()->user();
        $path = storage_path('app/system_settings.json');
        $limit = 0;
        $role = $user->role;
        
        if (File::exists($path)) {
            $settings = json_decode(File::get($path), true);
            $limitKey = "{$role}_bookmark_limit";
            if (isset($settings[$limitKey])) {
                $limit = (int)$settings[$limitKey];
            }
        } else {
            // Fallback default limits
            if ($role === 'student') $limit = 50;
            elseif ($role === 'lecturer') $limit = 200;
        }

        $perPage = $request->input('per_page', 6);
        if ($perPage === 'all' || $perPage == -1) {
            $bookmarks = $query->get();
            return response()->json([
                'data' => $bookmarks,
                'total' => $bookmarks->count(),
                'per_page' => $bookmarks->count(),
                'current_page' => 1,
                'last_page' => 1,
                'bookmark_limit' => $limit
            ]);
        }

        $bookmarks = $query->paginate($perPage);
        $data = $bookmarks->toArray();
        $data['bookmark_limit'] = $limit;

        return response()->json($data);
    }

    /**
     * POST /api/bookmarks
     */
    public function store(Request $request)
    {
        $request->validate(['paper_id' => 'required|exists:research_papers,id']);

        $user = auth()->user();

        // Check if bookmark already exists
        $exists = Bookmark::where('user_id', $user->id)
            ->where('paper_id', $request->paper_id)
            ->exists();

        if (!$exists) {
            // Load limits from settings file
            $path = storage_path('app/system_settings.json');
            $limit = 0;
            $role = $user->role;
            
            if (File::exists($path)) {
                $settings = json_decode(File::get($path), true);
                $limitKey = "{$role}_bookmark_limit";
                if (isset($settings[$limitKey])) {
                    $limit = (int)$settings[$limitKey];
                }
            } else {
                // Fallback default limits
                if ($role === 'student') $limit = 50;
                elseif ($role === 'lecturer') $limit = 200;
            }

            // If limit is set (> 0) and reached, block creation
            if ($limit > 0) {
                $currentCount = $user->bookmarks()->count();
                if ($currentCount >= $limit) {
                    return response()->json([
                        'message' => "Bạn đã đạt giới hạn lưu tối đa cho vai trò của mình ($limit bài báo). Vui lòng xóa bớt bài báo cũ để lưu thêm."
                    ], 422);
                }
            }
        }

        $bookmark = Bookmark::firstOrCreate(
            ['user_id'  => $user->id, 'paper_id' => $request->paper_id],
            ['note'     => $request->note]
        );

        Cache::forget("dash.bookmarks_new." . $user->id);
        Cache::forget("dash.bookmarks." . $user->id);
        Cache::forget("dash.recommended." . $user->id);

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

        \Illuminate\Support\Facades\Cache::forget("dash.bookmarks_new." . auth()->id());
        \Illuminate\Support\Facades\Cache::forget("dash.bookmarks." . auth()->id());
        \Illuminate\Support\Facades\Cache::forget("dash.recommended." . auth()->id());

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

        \Illuminate\Support\Facades\Cache::forget("dash.bookmarks_new." . auth()->id());
        \Illuminate\Support\Facades\Cache::forget("dash.bookmarks." . auth()->id());
        \Illuminate\Support\Facades\Cache::forget("dash.recommended." . auth()->id());

        return response()->json(['message' => 'Đã xóa bookmark.']);
    }

    /**
     * Helper to build filtered query
     */
    private function buildFilteredQuery(Request $request, $isFuzzy = false)
    {
        $query = auth()->user()
            ->bookmarks()
            ->with(['paper.journal', 'paper.authors', 'paper.keywords']);

        // Filter by bookmark created_at
        if ($request->filled('start_date')) {
            $query->whereDate('bookmarks.created_at', '>=', $request->start_date);
        }
        if ($request->filled('end_date')) {
            $query->whereDate('bookmarks.created_at', '<=', $request->end_date);
        }

        // Filter by paper fields (citations, publication year)
        $hasPaperFilters = $request->filled('min_citations') || $request->filled('start_year') || $request->filled('end_year');
        if ($hasPaperFilters) {
            $query->whereHas('paper', function ($q) use ($request) {
                if ($request->filled('min_citations')) {
                    $q->where('citations_count', '>=', $request->min_citations);
                }
                if ($request->filled('start_year')) {
                    $q->where('published_year', '>=', $request->start_year);
                }
                if ($request->filled('end_year')) {
                    $q->where('published_year', '<=', $request->end_year);
                }
            });
        }

        // Filter by search query (matching title, journal name, authors, or personal note)
        if ($request->filled('search')) {
            $search = $request->search;
            $lowerSearch = mb_strtolower($search);
            
            if ($isFuzzy && mb_strlen($search) >= 3) {
                $chars = mb_str_split(str_replace(' ', '', $lowerSearch));
                $pattern = '%' . implode('%', $chars) . '%';
            } else {
                $pattern = "%{$lowerSearch}%";
            }

            $query->where(function ($q) use ($pattern) {
                $q->whereRaw('LOWER(note) LIKE ?', [$pattern])
                  ->orWhereHas('paper', function ($pq) use ($pattern) {
                      $pq->whereRaw('LOWER(title) LIKE ?', [$pattern])
                        ->orWhereRaw('LOWER(source) LIKE ?', [$pattern])
                        ->orWhereHas('journal', function ($jq) use ($pattern) {
                            $jq->whereRaw('LOWER(name) LIKE ?', [$pattern]);
                        })
                        ->orWhereHas('authors', function ($aq) use ($pattern) {
                            $aq->whereRaw('LOWER(name) LIKE ?', [$pattern]);
                        });
                  });
            });
        }

        // Sort configuration
        $sortBy = $request->input('sort_by', 'created_at');
        $sortOrder = $request->input('sort_order', 'desc');
        if (!in_array(strtolower($sortOrder), ['asc', 'desc'])) {
            $sortOrder = 'desc';
        }

        if ($sortBy === 'created_at') {
            $query->orderBy('bookmarks.created_at', $sortOrder);
        } else {
            // Need to join research_papers to sort by its columns
            $query->join('research_papers', 'bookmarks.paper_id', '=', 'research_papers.id')
                ->select('bookmarks.*');
            
            if ($sortBy === 'citations_count') {
                $query->orderBy('research_papers.citations_count', $sortOrder);
            } elseif ($sortBy === 'published_year') {
                $query->orderBy('research_papers.published_year', $sortOrder);
            } elseif ($sortBy === 'title') {
                $query->orderBy('research_papers.title', $sortOrder);
            } else {
                $query->orderBy('bookmarks.created_at', 'desc');
            }
        }

        return $query;
    }

    /**
     * GET /api/bookmarks/export
     */
    public function export(Request $request)
    {
        $query = $this->buildFilteredQuery($request, false);
        
        // Fallback to fuzzy search if search query is provided, exact match yields 0, and length >= 3
        if ($request->filled('search') && mb_strlen($request->search) >= 3 && $query->count() === 0) {
            $query = $this->buildFilteredQuery($request, true);
        }

        $bookmarks = $query->get();

        $headers = [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Content-Disposition' => 'attachment; filename="bao_cao_dau_trang_' . now()->format('Ymd_His') . '.csv"',
            'Pragma' => 'no-cache',
            'Cache-Control' => 'must-revalidate, post-check=0, pre-check=0',
            'Expires' => '0',
        ];

        // Column selection map
        $allColumnsMap = [
            'title' => 'Tiêu đề bài báo',
            'authors' => 'Tác giả',
            'journal' => 'Tạp chí',
            'published_year' => 'Năm xuất bản',
            'citations_count' => 'Số trích dẫn',
            'note' => 'Ghi chú cá nhân',
            'created_at' => 'Ngày lưu',
            'url' => 'Liên kết (URL/DOI)'
        ];

        // Parse chosen columns or default to all
        $selectedColumnsInput = $request->input('columns');
        $selectedColumns = [];
        if ($selectedColumnsInput) {
            $cols = is_array($selectedColumnsInput) ? $selectedColumnsInput : explode(',', $selectedColumnsInput);
            foreach ($cols as $c) {
                $c = trim($c);
                if (isset($allColumnsMap[$c])) {
                    $selectedColumns[$c] = $allColumnsMap[$c];
                }
            }
        }

        if (empty($selectedColumns)) {
            $selectedColumns = $allColumnsMap;
        }

        $callback = function () use ($bookmarks, $selectedColumns) {
            $file = fopen('php://output', 'w');
            
            // Write UTF-8 BOM
            fprintf($file, chr(0xEF).chr(0xBB).chr(0xBF));

            // Write CSV headers
            fputcsv($file, array_values($selectedColumns));

            foreach ($bookmarks as $bookmark) {
                $paper = $bookmark->paper;
                $row = [];

                foreach (array_keys($selectedColumns) as $colKey) {
                    switch ($colKey) {
                        case 'title':
                            $row[] = $paper->title;
                            break;
                        case 'authors':
                            $row[] = $paper->authors->pluck('name')->join(', ');
                            break;
                        case 'journal':
                            $row[] = $paper->journal ? $paper->journal->name : ($paper->source ?: 'N/A');
                            break;
                        case 'published_year':
                            $row[] = $paper->published_year;
                            break;
                        case 'citations_count':
                            $row[] = $paper->citations_count;
                            break;
                        case 'note':
                            $row[] = $bookmark->note ?? '';
                            break;
                        case 'created_at':
                            $row[] = $bookmark->created_at->format('d/m/Y H:i:s');
                            break;
                        case 'url':
                            $row[] = $paper->url ?: ($paper->doi ? 'https://doi.org/' . $paper->doi : '');
                            break;
                    }
                }
                
                fputcsv($file, $row);
            }

            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }
}
