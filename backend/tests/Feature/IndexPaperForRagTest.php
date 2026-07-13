<?php

namespace Tests\Feature;

use App\Exceptions\AiServiceException;
use App\Interfaces\EmbeddingServiceInterface;
use App\Jobs\IndexPaperForRag;
use App\Models\PaperChunk;
use App\Models\ResearchPaper;
use App\Services\ChunkingService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Mockery\MockInterface;
use Tests\TestCase;

class IndexPaperForRagTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        // Cần thiết lập extension pgvector cho DB test (thường SQLite test dùng trong memory sẽ không support pgvector)
        // Vì vậy có thể skip test liên quan đến pgvector syntax hoặc giả lập.
        // Tuy nhiên ở đây chúng ta test logic Rollback và Flow của Job.
    }

    public function test_it_successfully_indexes_paper_and_replaces_old_chunks()
    {
        // 1. Arrange
        $paper = ResearchPaper::create([
            'title' => 'Test Paper',
            'abstract' => 'This is an abstract.',
            'published_year' => 2026,
            'source' => 'openalex',
            'source_id' => 'W12345',
        ]);

        // Tạo dữ liệu cũ để test xóa
        DB::table('paper_chunks')->insert([
            'paper_id' => $paper->id,
            'content' => 'Old chunk',
            'embedding' => json_encode(array_fill(0, 768, 0.5)),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $this->assertDatabaseHas('paper_chunks', ['content' => 'Old chunk']);

        // Mock ChunkingService
        $this->mock(ChunkingService::class, function (MockInterface $mock) {
            $mock->shouldReceive('chunk')->once()->andReturn(['Chunk 1', 'Chunk 2']);
        });

        // Mock EmbeddingServiceInterface
        $this->mock(EmbeddingServiceInterface::class, function (MockInterface $mock) {
            $mock->shouldReceive('getEmbeddings')
                 ->once()
                 ->with(['Chunk 1', 'Chunk 2'])
                 ->andReturn([
                     array_fill(0, 768, 0.1),
                     array_fill(0, 768, 0.2),
                 ]);
        });

        // 2. Act
        $job = new IndexPaperForRag($paper->id);
        $job->handle(
            app(ChunkingService::class),
            app(EmbeddingServiceInterface::class),
            app(\Illuminate\Database\DatabaseManager::class)
        );

        // 3. Assert
        $this->assertDatabaseMissing('paper_chunks', ['content' => 'Old chunk']); // Old chunk should be deleted
        $this->assertDatabaseHas('paper_chunks', ['content' => 'Chunk 1']);
        $this->assertDatabaseHas('paper_chunks', ['content' => 'Chunk 2']);
        $this->assertEquals(2, DB::table('paper_chunks')->count());
    }

    public function test_it_rolls_back_transaction_on_failure()
    {
        // 1. Arrange
        $paper = ResearchPaper::create([
            'title' => 'Test Paper',
            'abstract' => 'This is an abstract.',
            'published_year' => 2026,
            'source' => 'openalex',
            'source_id' => 'W12345',
        ]);

        // Tạo dữ liệu cũ, mong đợi nó không bị xóa nếu Rollback
        DB::table('paper_chunks')->insert([
            'paper_id' => $paper->id,
            'content' => 'Old chunk',
            'embedding' => json_encode(array_fill(0, 768, 0.5)),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // Mock ChunkingService
        $this->mock(ChunkingService::class, function (MockInterface $mock) {
            $mock->shouldReceive('chunk')->once()->andReturn(['Chunk 1']);
        });

        // Mock EmbeddingServiceInterface (trả về mảng rỗng để gây lỗi không khớp độ dài)
        $this->mock(EmbeddingServiceInterface::class, function (MockInterface $mock) {
            $mock->shouldReceive('getEmbeddings')
                 ->once()
                 ->andReturn([]); // Không khớp với mảng chunks có 1 phần tử
        });

        // 2. Act & Assert Exception
        $this->expectException(AiServiceException::class);
        $this->expectExceptionMessage('Số lượng chunks sinh ra không khớp');

        $job = new IndexPaperForRag($paper->id);
        try {
            $job->handle(
                app(ChunkingService::class),
                app(EmbeddingServiceInterface::class),
                app(\Illuminate\Database\DatabaseManager::class)
            );
        } finally {
            // 3. Assert Rollback
            // Vì lỗi xảy ra trước hoặc trong transaction, dữ liệu cũ phải còn nguyên
            $this->assertDatabaseHas('paper_chunks', ['content' => 'Old chunk']);
            $this->assertEquals(1, DB::table('paper_chunks')->count());
        }
    }

    public function test_it_throws_exception_if_vector_dimension_is_not_768()
    {
        $paper = ResearchPaper::create([
            'title' => 'Test',
            'published_year' => 2026,
            'source' => 'test',
            'source_id' => 'T1',
        ]);

        $this->mock(ChunkingService::class, function ($mock) {
            $mock->shouldReceive('chunk')->andReturn(['Chunk 1']);
        });

        $this->mock(EmbeddingServiceInterface::class, function ($mock) {
            // Trả về vector 767 chiều
            $mock->shouldReceive('getEmbeddings')->andReturn([
                array_fill(0, 767, 0.1)
            ]);
        });

        $this->expectException(AiServiceException::class);
        $this->expectExceptionMessage('không đúng 768 chiều');

        $job = new IndexPaperForRag($paper->id);
        $job->handle(
            app(ChunkingService::class),
            app(EmbeddingServiceInterface::class),
            app(\Illuminate\Database\DatabaseManager::class)
        );
    }
}
