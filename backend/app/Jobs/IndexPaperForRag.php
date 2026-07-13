<?php

namespace App\Jobs;

use App\Exceptions\AiServiceException;
use App\Interfaces\EmbeddingServiceInterface;
use App\Models\ResearchPaper;
use App\Services\ChunkingService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Database\DatabaseManager;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Carbon;

class IndexPaperForRag implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /**
     * Số lần thử lại tối đa khi job thất bại (để xử lý rate limit).
     */
    public int $tries = 3;

    /**
     * Thời gian chờ (giây) trước mỗi lần thử lại (Exponential backoff).
     */
    public array $backoff = [10, 30, 60];

    /**
     * @param int $paperId ID của bài báo cần index
     */
    public function __construct(
        public readonly int $paperId
    ) {}

    /**
     * Thực thi Job.
     *
     * @param ChunkingService $chunkingService
     * @param EmbeddingServiceInterface $embeddingService
     * @param DatabaseManager $db
     * @return void
     * @throws AiServiceException
     */
    public function handle(
        ChunkingService $chunkingService,
        EmbeddingServiceInterface $embeddingService,
        DatabaseManager $db
    ): void {
        // 1. Lấy ResearchPaper
        $paper = ResearchPaper::find($this->paperId);
        if (!$paper) {
            return; // Kết thúc Job nếu bài báo không tồn tại
        }

        // 2. Chunk title + abstract
        $chunks = $chunkingService->chunk((string) $paper->title, $paper->abstract);

        if (empty($chunks)) {
            return;
        }

        // 3. Lấy Vector (Embeddings)
        $embeddings = $embeddingService->getEmbeddings($chunks);

        // 4. Kiểm tra số lượng chunk và vector
        if (count($chunks) !== count($embeddings)) {
            throw new AiServiceException('Số lượng chunks sinh ra không khớp với số lượng vectors trả về từ AI.');
        }

        foreach ($embeddings as $index => $vector) {
            if (count($vector) !== 768) {
                throw new AiServiceException("Vector tại vị trí {$index} không đúng 768 chiều (thực tế: " . count($vector) . ").");
            }
        }

        // 5 & 6. Transaction: Xóa data cũ và Insert data mới bằng Batch Insert
        $db->transaction(function () use ($paper, $chunks, $embeddings, $db) {
            // Xóa toàn bộ paper_chunks cũ của paper hiện tại
            $db->table('paper_chunks')->where('paper_id', $paper->id)->delete();

            // Chuẩn bị mảng để Batch Insert
            $insertData = [];
            $now = Carbon::now();

            foreach ($chunks as $index => $chunkText) {
                $insertData[] = [
                    'paper_id'   => $paper->id,
                    'content'    => $chunkText,
                    // Dùng chuỗi JSON array để pgvector tự động cast sang vector
                    'embedding'  => json_encode($embeddings[$index]),
                    'created_at' => $now,
                    'updated_at' => $now,
                ];
            }

            // Batch Insert toàn bộ
            $db->table('paper_chunks')->insert($insertData);
        });
    }
}
