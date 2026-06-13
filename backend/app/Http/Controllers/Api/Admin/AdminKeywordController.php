<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Keyword;
use App\Models\PublicationTrend;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;

class AdminKeywordController extends Controller
{
    /**
     * GET /api/admin/keywords
     */
    public function index(Request $request)
    {
        $q = $request->input('q');
        $sortBy = $request->input('sort_by', 'papers_count');
        $perPage = (int) $request->input('per_page', 15);

        $status = $request->input('status', 'active'); // 'active', 'trashed', 'merged', 'all'

        $query = Keyword::withCount('papers')->with('mergedInto');

        if ($status === 'trashed') {
            $query->onlyTrashed()->whereNull('merged_into_id');
        } elseif ($status === 'merged') {
            $query->onlyTrashed()->whereNotNull('merged_into_id');
        } elseif ($status === 'all') {
            $query->withTrashed();
        } else {
            // active is default (whereNull deleted_at)
        }

        if (!empty($q)) {
            $query->where(function ($sub) use ($q) {
                $sub->where('name', 'like', "%{$q}%")
                    ->orWhere('slug', 'like', "%{$q}%");
            });
        }

        switch ($sortBy) {
            case 'name_asc':
                $query->orderBy('name', 'asc');
                break;
            case 'name_desc':
                $query->orderBy('name', 'desc');
                break;
            case 'created_at_desc':
                $query->orderBy('created_at', 'desc');
                break;
            case 'created_at_asc':
                $query->orderBy('created_at', 'asc');
                break;
            case 'papers_count_asc':
                $query->orderBy('papers_count', 'asc');
                break;
            case 'papers_count_desc':
            default:
                $query->orderByDesc('papers_count');
                break;
        }

        $keywords = $query->paginate($perPage);

        return response()->json($keywords);
    }

    /**
     * PUT /api/admin/keywords/{id}
     */
    public function update(Request $request, $id)
    {
        $keyword = Keyword::findOrFail($id);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
        ]);

        // Check if name exists (excluding current and trashed)
        $existingName = Keyword::withTrashed()
            ->where('name', $validated['name'])
            ->where('id', '!=', $keyword->id)
            ->first();
            
        if ($existingName) {
            return response()->json(['message' => 'Tên từ khóa đã tồn tại.'], 422);
        }

        $keyword->name = $validated['name'];
        
        // Safe slug generation
        $slug = Str::slug($validated['name']);
        $originalSlug = $slug;
        $counter = 1;
        while (Keyword::withTrashed()->where('slug', $slug)->where('id', '!=', $keyword->id)->exists()) {
            $slug = $originalSlug . '-' . $counter;
            $counter++;
        }
        $keyword->slug = $slug;
        $keyword->save();

        // Clear cache
        Cache::flush();

        return response()->json($keyword);
    }

    /**
     * DELETE /api/admin/keywords/{id}
     */
    public function destroy($id)
    {
        $keyword = Keyword::findOrFail($id);
        $keyword->delete();

        // Clear cache
        Cache::flush();

        return response()->json(null, 204);
    }
    /**
     * POST /api/admin/keywords/{id}/restore
     */
    public function restore($id)
    {
        $keyword = Keyword::onlyTrashed()->findOrFail($id);

        DB::transaction(function () use ($keyword) {
            $keyword->restore();
            
            // Nếu từ khóa này từng bị gộp, tiến hành "unmerge"
            if ($keyword->merged_into_id !== null) {
                $targetId = $keyword->merged_into_id;
                
                // 1. Đọc logs để biết bài báo/user nào đã bị ảnh hưởng
                $logs = DB::table('keyword_merge_logs')
                    ->where('source_keyword_id', $keyword->id)
                    ->where('target_keyword_id', $targetId)
                    ->get();
                
                // 2. Trả lại dữ liệu
                foreach ($logs as $log) {
                    if ($log->entity_type === 'paper') {
                        if ($log->action === 'updated') {
                            // Đã bị đổi ID -> Đổi ngược lại
                            DB::table('keyword_paper')
                                ->where('keyword_id', $targetId)
                                ->where('paper_id', $log->entity_id)
                                ->update(['keyword_id' => $keyword->id]);
                        } else {
                            // Bị xóa do trùng lặp -> Tạo lại
                            DB::table('keyword_paper')->insertOrIgnore([
                                'keyword_id' => $keyword->id,
                                'paper_id' => $log->entity_id,
                            ]);
                        }
                    } elseif ($log->entity_type === 'user') {
                        if ($log->action === 'updated') {
                            DB::table('user_keyword')
                                ->where('keyword_id', $targetId)
                                ->where('user_id', $log->entity_id)
                                ->update(['keyword_id' => $keyword->id]);
                        } else {
                            DB::table('user_keyword')->insertOrIgnore([
                                'keyword_id' => $keyword->id,
                                'user_id' => $log->entity_id,
                            ]);
                        }
                    }
                }
                
                // 3. Xóa log
                DB::table('keyword_merge_logs')
                    ->where('source_keyword_id', $keyword->id)
                    ->where('target_keyword_id', $targetId)
                    ->delete();
                
                // 4. Xóa cờ gộp
                $keyword->merged_into_id = null;
                $keyword->merge_reason = null;
                $keyword->save();

                // 5. Tính lại xu hướng cho cả 2 từ khóa
                $this->doRecalculateTrends($targetId);
                $this->doRecalculateTrends($keyword->id);
            }
        });

        Cache::flush();

        return response()->json(['message' => 'Đã khôi phục từ khóa và dữ liệu liên kết thành công!', 'keyword' => $keyword]);
    }

    /**
     * DELETE /api/admin/keywords/{id}/force
     */
    public function forceDelete(Request $request, $id)
    {
        $request->validate([
            'password' => 'required|string'
        ]);

        $user = $request->user();
        if (!\Illuminate\Support\Facades\Hash::check($request->password, $user->password)) {
            return response()->json(['message' => 'Mật khẩu không chính xác. Xóa thất bại!'], 403);
        }

        $keyword = Keyword::onlyTrashed()->findOrFail($id);
        $keyword->forceDelete();

        Cache::flush();

        return response()->json(null, 204);
    }

    /**
     * GET /api/admin/keywords/{id}/merge-details
     */
    public function mergeDetails($id)
    {
        $sourceKeyword = Keyword::withTrashed()->findOrFail($id);
        
        if (!$sourceKeyword->merged_into_id) {
            return response()->json(['message' => 'Từ khóa này chưa từng bị gộp.'], 400);
        }

        $targetKeyword = Keyword::withTrashed()->find($sourceKeyword->merged_into_id);
        
        // Count how many papers and users were actually moved according to logs
        $papersMoved = DB::table('keyword_merge_logs')
            ->where('source_keyword_id', $sourceKeyword->id)
            ->where('target_keyword_id', $targetKeyword->id)
            ->where('entity_type', 'paper')
            ->count();
            
        $usersMoved = DB::table('keyword_merge_logs')
            ->where('source_keyword_id', $sourceKeyword->id)
            ->where('target_keyword_id', $targetKeyword->id)
            ->where('entity_type', 'user')
            ->count();

        // If it's 0, it might be an old merge before logs were implemented, or just 0.
        // We'll also return the current target's total papers for context.
        $targetCurrentPapers = DB::table('keyword_paper')->where('keyword_id', $targetKeyword->id)->count();

        return response()->json([
            'source' => [
                'id' => $sourceKeyword->id,
                'name' => $sourceKeyword->name,
                'slug' => $sourceKeyword->slug,
            ],
            'target' => [
                'id' => $targetKeyword->id,
                'name' => $targetKeyword->name,
                'slug' => $targetKeyword->slug,
                'current_papers_count' => $targetCurrentPapers,
            ],
            'merge_reason' => $sourceKeyword->merge_reason,
            'papers_moved' => $papersMoved,
            'users_moved' => $usersMoved,
            'has_logs' => DB::table('keyword_merge_logs')->where('source_keyword_id', $sourceKeyword->id)->exists()
        ]);
    }

    /**
     * POST /api/admin/keywords/merge
     */
    public function merge(Request $request)
    {
        $request->validate([
            'target_id' => 'required|integer|exists:keywords,id',
            'source_ids' => 'required|array|min:1',
            'source_ids.*' => 'required|integer|exists:keywords,id|different:target_id',
            'merge_reason' => 'nullable|string|max:500',
        ]);

        $targetId = $request->input('target_id');
        $sourceIds = $request->input('source_ids');
        $mergeReason = $request->input('merge_reason');

        DB::transaction(function () use ($targetId, $sourceIds, $mergeReason) {
            // 0. Lưu Log lịch sử (Merge Logs) để phục vụ Khôi phục (Unmerge)
            $targetPaperIds = DB::table('keyword_paper')->where('keyword_id', $targetId)->pluck('paper_id')->toArray();
            $targetUserIds = DB::table('user_keyword')->where('keyword_id', $targetId)->pluck('user_id')->toArray();
            
            $logs = [];
            $now = now();
            foreach ($sourceIds as $sourceId) {
                $sourcePapers = DB::table('keyword_paper')->where('keyword_id', $sourceId)->pluck('paper_id');
                foreach ($sourcePapers as $paperId) {
                    $logs[] = [
                        'source_keyword_id' => $sourceId,
                        'target_keyword_id' => $targetId,
                        'entity_type' => 'paper',
                        'entity_id' => $paperId,
                        'action' => in_array($paperId, $targetPaperIds) ? 'deleted' : 'updated',
                        'created_at' => $now,
                        'updated_at' => $now,
                    ];
                }
                
                $sourceUsers = DB::table('user_keyword')->where('keyword_id', $sourceId)->pluck('user_id');
                foreach ($sourceUsers as $userId) {
                    $logs[] = [
                        'source_keyword_id' => $sourceId,
                        'target_keyword_id' => $targetId,
                        'entity_type' => 'user',
                        'entity_id' => $userId,
                        'action' => in_array($userId, $targetUserIds) ? 'deleted' : 'updated',
                        'created_at' => $now,
                        'updated_at' => $now,
                    ];
                }
            }
            if (!empty($logs)) {
                foreach (array_chunk($logs, 500) as $chunk) {
                    DB::table('keyword_merge_logs')->insert($chunk);
                }
            }

            // 1. Move papers from sources to target without duplication
            // Update source papers that target doesn't have yet
            DB::table('keyword_paper')
                ->whereIn('keyword_id', $sourceIds)
                ->whereNotIn('paper_id', $targetPaperIds)
                ->update(['keyword_id' => $targetId]);

            // Delete remaining duplicate paper relations from sources
            DB::table('keyword_paper')
                ->whereIn('keyword_id', $sourceIds)
                ->delete();

            // 2. Move followers from sources to target without duplication
            DB::table('user_keyword')
                ->whereIn('keyword_id', $sourceIds)
                ->whereNotIn('user_id', $targetUserIds)
                ->update(['keyword_id' => $targetId]);

            DB::table('user_keyword')
                ->whereIn('keyword_id', $sourceIds)
                ->delete();

            // 3. Delete old trends of sources
            PublicationTrend::whereIn('keyword_id', $sourceIds)->delete();

            // 4. Update the source keywords to reference the target, then soft delete them
            Keyword::whereIn('id', $sourceIds)->update([
                'merged_into_id' => $targetId,
                'merge_reason' => $mergeReason,
            ]);
            Keyword::whereIn('id', $sourceIds)->delete();

            // 5. Recalculate trends for target keyword based on its new papers
            $this->doRecalculateTrends($targetId);
        });

        // Clear cache
        Cache::flush();

        $target = Keyword::withCount('papers')->findOrFail($targetId);

        return response()->json([
            'message' => 'Gộp từ khóa thành công!',
            'target' => $target,
        ]);
    }

    /**
     * POST /api/admin/keywords/{id}/recalculate-trends
     */
    public function recalculateTrends($id)
    {
        $keyword = Keyword::findOrFail($id);

        $this->doRecalculateTrends($keyword->id);

        // Clear cache
        Cache::flush();

        return response()->json([
            'message' => "Tính toán lại dữ liệu xu hướng cho từ khóa '{$keyword->name}' thành công!",
        ]);
    }

    /**
     * Core helper to recalculate trends for a single keyword.
     */
    private function doRecalculateTrends($keywordId)
    {
        PublicationTrend::where('keyword_id', $keywordId)->delete();

        $trendsData = DB::table('keyword_paper')
            ->join('research_papers', 'keyword_paper.paper_id', '=', 'research_papers.id')
            ->select(
                'research_papers.published_year as year',
                DB::raw('count(research_papers.id) as paper_count'),
                DB::raw('sum(research_papers.citations_count) as citation_count')
            )
            ->where('keyword_paper.keyword_id', $keywordId)
            ->whereNotNull('research_papers.published_year')
            ->groupBy('research_papers.published_year')
            ->orderBy('research_papers.published_year')
            ->get();

        foreach ($trendsData as $data) {
            PublicationTrend::create([
                'keyword_id' => $keywordId,
                'year' => (int) $data->year,
                'paper_count' => (int) $data->paper_count,
                'citation_count' => (int) ($data->citation_count ?? 0),
                'growth_rate' => 0.0,
            ]);
        }

        // Recalculate growth rates sequentially
        $trends = PublicationTrend::where('keyword_id', $keywordId)
            ->orderBy('year')
            ->get();

        $prevCount = null;
        foreach ($trends as $trend) {
            if ($prevCount !== null && $prevCount > 0) {
                $growthRate = (($trend->paper_count - $prevCount) / $prevCount) * 100;
                $trend->update(['growth_rate' => round($growthRate, 2)]);
            } else {
                $trend->update(['growth_rate' => 0.0]);
            }
            $prevCount = $trend->paper_count;
        }
    }
}
