<?php

namespace App\Http\Controllers;

use App\Http\Requests\UpdateAiSettingsRequest;
use App\Services\AdminSettingsService;
use Illuminate\Http\JsonResponse;
use Exception;

class AdminSettingsController extends Controller
{
    public function __construct(
        private readonly AdminSettingsService $adminSettingsService
    ) {
    }

    /**
     * Get current AI Settings.
     */
    public function getAiSettings(): JsonResponse
    {
        $settings = $this->adminSettingsService->getAiSettings();

        return response()->json($settings);
    }

    /**
     * Get whitelist models from config.
     */
    public function getModels(): JsonResponse
    {
        $models = $this->adminSettingsService->getModelsWhitelist();

        return response()->json($models);
    }

    /**
     * Test AI driver connection without saving.
     */
    public function testConnection(UpdateAiSettingsRequest $request): JsonResponse
    {
        $validated = $request->validated();

        try {
            $this->adminSettingsService->testConnection($validated['driver'], $validated);

            return response()->json([
                'message' => 'Connection successful',
                'status' => 'valid'
            ]);
        } catch (Exception $e) {
            $status = $e->getCode() ?: 500;
            return response()->json([
                'message' => $e->getMessage(),
                'status' => 'invalid'
            ], $status >= 400 && $status < 600 ? $status : 500);
        }
    }

    /**
     * Validate, Test Connection, and Save AI Settings.
     */
    public function updateAiSettings(UpdateAiSettingsRequest $request): JsonResponse
    {
        $validated = $request->validated();

        try {
            // 1. Test Connection
            $this->adminSettingsService->testConnection($validated['driver'], $validated);

            // 2. Save Settings
            $this->adminSettingsService->saveAiSettings($validated['driver'], $validated);

            return response()->json([
                'message' => 'AI Settings updated successfully',
                'status' => 'valid'
            ]);
        } catch (Exception $e) {
            $status = $e->getCode() ?: 500;
            return response()->json([
                'message' => 'Test connection failed: ' . $e->getMessage(),
                'status' => 'invalid'
            ], $status >= 400 && $status < 600 ? $status : 500);
        }
    }

    /**
     * Reset AI Settings.
     */
    public function deleteAiSettings(): JsonResponse
    {
        $this->adminSettingsService->resetAiSettings();

        return response()->json([
            'message' => 'AI Settings reset successfully'
        ]);
    }

    /**
     * Get RAG indexing stats.
     */
    public function indexingStats(): JsonResponse
    {
        $totalPapers = \Illuminate\Support\Facades\DB::table('research_papers')->count();
        $chunkedPapers = \Illuminate\Support\Facades\DB::table('paper_chunks')
            ->distinct('paper_id')
            ->count('paper_id');

        $totalChunks = \Illuminate\Support\Facades\DB::table('paper_chunks')->count();

        // Fetch recent failed jobs
        $failedJobs = \Illuminate\Support\Facades\DB::table('failed_jobs')
            ->where('payload', 'like', '%IndexPaperForRag%')
            ->orderByDesc('failed_at')
            ->limit(3)
            ->get();

        $activities = [];
        foreach ($failedJobs as $job) {
            $msg = $job->exception;
            $summary = "Lỗi không xác định";
            if (str_contains($msg, '404') && str_contains($msg, 'Not Found')) {
                $summary = "Lỗi 404: Model không tồn tại hoặc tài khoản chưa được cấp quyền.";
            } elseif (str_contains($msg, '429') || str_contains($msg, 'Quota Exceeded')) {
                $summary = "Lỗi 429: Hết Quota (API Key) hoặc bị giới hạn tốc độ (Rate Limit).";
            } elseif (str_contains($msg, '403') || str_contains($msg, '401') || str_contains($msg, 'API Key')) {
                $summary = "Lỗi Xác thực: API Key không hợp lệ hoặc bị từ chối.";
            } else {
                $lines = explode("\n", $msg);
                $summary = mb_substr($lines[0] ?? "Lỗi không xác định", 0, 100) . '...';
            }
            $activities[] = [
                'time' => $job->failed_at,
                'message' => $summary,
                'type' => 'error'
            ];
        }

        // Fetch recent successes
        $recentSuccesses = \Illuminate\Support\Facades\DB::table('paper_chunks')
            ->join('research_papers', 'paper_chunks.paper_id', '=', 'research_papers.id')
            ->select('research_papers.title', 'paper_chunks.created_at')
            ->orderByDesc('paper_chunks.created_at')
            ->limit(20)
            ->get()
            ->unique('title')
            ->take(3);

        foreach ($recentSuccesses as $chunk) {
            $activities[] = [
                'time' => $chunk->created_at,
                'message' => 'Đã cắt thành công: ' . mb_substr($chunk->title, 0, 60) . '...',
                'type' => 'success'
            ];
        }

        // Sort by time descending
        usort($activities, function ($a, $b) {
            return strtotime($b['time']) - strtotime($a['time']);
        });

        // Limit to 50 total recent activities
        $activities = array_slice($activities, 0, 50);

        // Check if there are active jobs in queue using the Queue facade (supports Redis)
        $isRunning = \Illuminate\Support\Facades\Queue::size('default') > 0;

        return response()->json([
            'total_papers' => $totalPapers,
            'chunked_papers' => $chunkedPapers,
            'unchunked_papers' => max(0, $totalPapers - $chunkedPapers),
            'total_chunks' => $totalChunks,
            'recent_activities' => $activities,
            'is_running' => $isRunning
        ]);
    }

    /**
     * Start RAG indexing job.
     */
    public function startIndexing(\Illuminate\Http\Request $request): JsonResponse
    {
        \Illuminate\Support\Facades\Artisan::call('papers:reindex');

        return response()->json([
            'message' => "Đã đưa tất cả bài báo chưa cắt vào hàng đợi xử lý thành công!"
        ]);
    }

    /**
     * Stop RAG indexing job by clearing the queue.
     */
    public function stopIndexing(): JsonResponse
    {
        // Clear all jobs in the default queue
        \Illuminate\Support\Facades\Artisan::call('queue:clear', [
            'connection' => config('queue.default', 'redis'),
            '--queue' => 'default'
        ]);

        return response()->json([
            'message' => 'Đã dừng toàn bộ tiến trình cắt bài (Xóa hàng đợi thành công).'
        ]);
    }

    public function chunkedPapers(\Illuminate\Http\Request $request): \Illuminate\Http\JsonResponse
    {
        $query = \Illuminate\Support\Facades\DB::table('research_papers')
            ->select('id', 'title')
            ->selectSub(function ($q) {
                $q->selectRaw('count(*)')
                  ->from('paper_chunks')
                  ->whereColumn('paper_chunks.paper_id', 'research_papers.id');
            }, 'chunk_count')
            ->selectSub(function ($q) {
                $q->selectRaw('max(created_at)')
                  ->from('paper_chunks')
                  ->whereColumn('paper_chunks.paper_id', 'research_papers.id');
            }, 'last_chunked_at')
            ->whereExists(function ($q) {
                $q->select(\Illuminate\Support\Facades\DB::raw(1))
                  ->from('paper_chunks')
                  ->whereColumn('paper_chunks.paper_id', 'research_papers.id');
            })
            ->orderByDesc('last_chunked_at')
            ->limit(20);
            
        $papers = $query->get();

        return response()->json($papers);
    }
    
    public function paperChunks($paperId): \Illuminate\Http\JsonResponse
    {
        $chunks = \Illuminate\Support\Facades\DB::table('paper_chunks')
            ->where('paper_id', $paperId)
            ->orderBy('id')
            ->get();
            
        // Limit embedding array size for frontend display
        $chunks->transform(function ($chunk, $index) {
            $embedding = json_decode($chunk->embedding ?? '[]', true);
            if (is_array($embedding)) {
                $chunk->embedding_preview = array_slice($embedding, 0, 5);
                $chunk->embedding_dimensions = count($embedding);
            } else {
                $str = trim((string)$chunk->embedding, '[]');
                $arr = explode(',', $str);
                $chunk->embedding_preview = array_map('floatval', array_slice($arr, 0, 5));
                $chunk->embedding_dimensions = count($arr);
            }
            unset($chunk->embedding);
            $chunk->chunk_index = $index + 1;
            $chunk->chunk_text = $chunk->content;
            return $chunk;
        });

        return response()->json($chunks);
    }
}
