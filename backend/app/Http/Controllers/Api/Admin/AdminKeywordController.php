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

        $query = Keyword::withCount('papers');

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
            'name' => 'required|string|max:255|unique:keywords,name,' . $keyword->id,
        ]);

        $keyword->name = $validated['name'];
        $keyword->slug = Str::slug($validated['name']);
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
     * POST /api/admin/keywords/merge
     */
    public function merge(Request $request)
    {
        $request->validate([
            'target_id' => 'required|integer|exists:keywords,id',
            'source_ids' => 'required|array|min:1',
            'source_ids.*' => 'required|integer|exists:keywords,id|different:target_id',
        ]);

        $targetId = $request->input('target_id');
        $sourceIds = $request->input('source_ids');

        DB::transaction(function () use ($targetId, $sourceIds) {
            // 1. Move papers from sources to target without duplication
            $targetPaperIds = DB::table('keyword_paper')
                ->where('keyword_id', $targetId)
                ->pluck('paper_id')
                ->toArray();

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
            $targetUserIds = DB::table('user_keyword')
                ->where('keyword_id', $targetId)
                ->pluck('user_id')
                ->toArray();

            DB::table('user_keyword')
                ->whereIn('keyword_id', $sourceIds)
                ->whereNotIn('user_id', $targetUserIds)
                ->update(['keyword_id' => $targetId]);

            DB::table('user_keyword')
                ->whereIn('keyword_id', $sourceIds)
                ->delete();

            // 3. Delete old trends of sources
            PublicationTrend::whereIn('keyword_id', $sourceIds)->delete();

            // 4. Delete the source keywords themselves
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
