<?php

namespace Tests\Feature;

use App\Jobs\IndexPaperForRag;
use App\Models\PaperChunk;
use App\Models\ResearchPaper;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Queue;
use Tests\TestCase;

class ReindexPapersCommandTest extends TestCase
{
    use RefreshDatabase;

    public function test_command_only_dispatches_papers_without_chunks()
    {
        Queue::fake();

        // Tạo 3 papers
        $paper1 = ResearchPaper::create([
            'title' => 'Paper 1',
            'abstract' => 'Abstract 1',
            'published_year' => 2026,
            'source' => 'test',
            'source_id' => '1',
        ]);
        
        $paper2 = ResearchPaper::create([
            'title' => 'Paper 2',
            'abstract' => 'Abstract 2',
            'published_year' => 2026,
            'source' => 'test',
            'source_id' => '2',
        ]);
        
        $paper3 = ResearchPaper::create([
            'title' => 'Paper 3',
            'abstract' => 'Abstract 3',
            'published_year' => 2026,
            'source' => 'test',
            'source_id' => '3',
        ]);

        // Gán chunk cho paper1 (Đã index)
        PaperChunk::insert([
            'paper_id' => $paper1->id,
            'content' => 'Test content',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // Chạy command
        $this->artisan('papers:reindex')
            ->expectsOutput("Tổng số paper sẽ xử lý: 2")
            ->expectsOutput("Hoàn thành việc dispatch 2 jobs vào Queue.")
            ->assertExitCode(0);

        // Assert job được đẩy vào queue đúng số lượng
        Queue::assertPushed(IndexPaperForRag::class, 2);

        // Assert paper2 và paper3 được đưa vào queue
        Queue::assertPushed(IndexPaperForRag::class, function ($job) use ($paper2) {
            return $job->paperId === $paper2->id;
        });
        Queue::assertPushed(IndexPaperForRag::class, function ($job) use ($paper3) {
            return $job->paperId === $paper3->id;
        });
        
        // Assert paper1 (đã index) KHÔNG bị đưa vào queue
        Queue::assertNotPushed(IndexPaperForRag::class, function ($job) use ($paper1) {
            return $job->paperId === $paper1->id;
        });
    }

    public function test_command_respects_limit_option()
    {
        Queue::fake();

        // Tạo 10 papers chưa index
        for ($i = 1; $i <= 10; $i++) {
            ResearchPaper::create([
                'title' => "Paper $i",
                'published_year' => 2026,
                'source' => 'test',
                'source_id' => (string) $i,
            ]);
        }

        // Chạy command với limit 5
        $this->artisan('papers:reindex', ['--limit' => 5])
            ->expectsOutput("Tổng số paper sẽ xử lý: 5")
            ->expectsOutput("Hoàn thành việc dispatch 5 jobs vào Queue.")
            ->assertExitCode(0);

        Queue::assertPushed(IndexPaperForRag::class, 5);
    }
}
