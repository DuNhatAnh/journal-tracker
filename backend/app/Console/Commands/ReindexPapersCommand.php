<?php

namespace App\Console\Commands;

use App\Jobs\IndexPaperForRag;
use App\Models\ResearchPaper;
use Illuminate\Console\Command;

class ReindexPapersCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'papers:reindex {--limit=0} {--delay=2}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Dispatch IndexPaperForRag job for papers that have not been indexed yet.';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $limit = (int) $this->option('limit');
        $delayOption = (int) $this->option('delay');

        // Lấy danh sách ResearchPaper CHƯA có bất kỳ PaperChunk nào liên kết
        $query = ResearchPaper::whereDoesntHave('paperChunks');

        if ($limit > 0) {
            $query->limit($limit);
        }

        $papers = $query->get();
        $total = $papers->count();

        if ($total === 0) {
            $this->info("Không có paper nào cần reindex.");
            return;
        }

        $this->info("Tổng số paper sẽ xử lý: {$total}");

        $dispatched = 0;
        foreach ($papers as $index => $paper) {
            // Dispatch job với delay tăng dần
            IndexPaperForRag::dispatch($paper->id)
                ->delay(now()->addSeconds($index * $delayOption));
            
            $dispatched++;
            
            // Log tiến độ
            if ($dispatched % 50 === 0 || $dispatched === $total) {
                $this->info("Dispatched {$dispatched}/{$total}");
            }
        }

        $this->info("Hoàn thành việc dispatch {$total} jobs vào Queue.");
    }
}
