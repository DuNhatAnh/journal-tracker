<?php

namespace Tests\Feature;

use App\DTOs\RetrievalResult;
use App\Interfaces\LlmServiceInterface;
use App\Interfaces\PaperRepositoryInterface;
use App\Interfaces\PromptBuilderInterface;
use App\Interfaces\RetrievalServiceInterface;
use App\Models\ResearchPaper;
use App\Services\RagService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use App\DTOs\Citation;

class RagServiceTest extends TestCase
{
    use RefreshDatabase;

    private $retrievalServiceMock;
    private $llmServiceMock;
    private $paperRepositoryMock;
    private RagService $ragService;

    protected function setUp(): void
    {
        parent::setUp();

        $this->retrievalServiceMock = $this->createMock(RetrievalServiceInterface::class);
        $this->llmServiceMock = $this->createMock(LlmServiceInterface::class);
        $this->paperRepositoryMock = $this->createMock(PaperRepositoryInterface::class);

        $this->app->instance(RetrievalServiceInterface::class, $this->retrievalServiceMock);
        $this->app->instance(LlmServiceInterface::class, $this->llmServiceMock);
        $this->app->instance(PaperRepositoryInterface::class, $this->paperRepositoryMock);

        $this->ragService = $this->app->make(RagService::class);
        
        config([
            'rag.default_top_k' => 5,
            'rag.default_min_similarity' => 0.7,
            'rag.max_top_k' => 20,
            'rag.system_prompt_template' => '%context%'
        ]);
    }

    public function test_short_circuit_when_retrieval_empty()
    {
        $this->retrievalServiceMock->expects($this->once())
            ->method('search')
            ->willReturn([]);

        // LlmService should NOT be called
        $this->llmServiceMock->expects($this->never())->method('generate');

        $response = $this->ragService->generateAnswer('query');

        $this->assertFalse($response->hasContext);
        $this->assertEquals(0, $response->retrievedChunks);
        $this->assertEmpty($response->citations);
        $this->assertStringContainsString('không tìm thấy thông tin', $response->answer);
    }

    public function test_duplicate_paper_queries_unique_ids()
    {
        // 3 chunks, but only 2 papers
        $this->retrievalServiceMock->expects($this->once())
            ->method('search')
            ->willReturn([
                new RetrievalResult(1, 101, 'c1', 0.9),
                new RetrievalResult(1, 102, 'c2', 0.8),
                new RetrievalResult(2, 201, 'c3', 0.75),
            ]);

        // Mock PaperRepository to ensure it's called EXACTLY ONCE (No N+1)
        $this->paperRepositoryMock->expects($this->once())
            ->method('getByIds')
            ->with([1, 2])
            ->willReturn(collect([
                (object)['id' => 1, 'title' => 'P1', 'published_year' => 2026, 'doi' => 'doi1'],
                (object)['id' => 2, 'title' => 'P2', 'published_year' => 2026, 'doi' => 'doi2'],
            ]));

        $this->llmServiceMock->expects($this->once())
            ->method('generate')
            ->willReturn(new \App\DTOs\LlmResponse('AI Answer'));

        $response = $this->ragService->generateAnswer('query');

        $this->assertTrue($response->hasContext);
        $this->assertEquals(3, $response->retrievedChunks);
        $this->assertCount(2, $response->citations);
        $this->assertEquals(1, $response->citations[0]->paperId); // Unique citation for P1
        $this->assertEquals(2, $response->citations[1]->paperId); // Unique citation for P2
        $this->assertEquals(0.9, $response->maxSimilarity);
    }

    public function test_citations_preserve_similarity_order()
    {
        // 3 papers, ordered by similarity: P3 (0.95) -> P1 (0.8) -> P2 (0.7)
        $this->retrievalServiceMock->expects($this->once())
            ->method('search')
            ->willReturn([
                new RetrievalResult(3, 301, 'c3', 0.95),
                new RetrievalResult(1, 101, 'c1', 0.8),
                new RetrievalResult(2, 201, 'c2', 0.7),
            ]);

        // Mock PaperRepository returns data in DIFFERENT order to prove it doesn't break ordering
        $this->paperRepositoryMock->expects($this->once())
            ->method('getByIds')
            ->with([3, 1, 2])
            ->willReturn(collect([
                (object)['id' => 1, 'title' => 'P1', 'published_year' => 2026, 'doi' => null],
                (object)['id' => 2, 'title' => 'P2', 'published_year' => 2026, 'doi' => null],
                (object)['id' => 3, 'title' => 'P3', 'published_year' => 2026, 'doi' => null],
            ]));

        $this->llmServiceMock->expects($this->once())
            ->method('generate')
            ->willReturn(new \App\DTOs\LlmResponse('AI Answer'));

        $response = $this->ragService->generateAnswer('query');

        $this->assertCount(3, $response->citations);
        
        // Assert order is preserved exactly as retrieval results (3 -> 1 -> 2)
        $this->assertEquals(3, $response->citations[0]->paperId);
        $this->assertEquals(1, $response->citations[1]->paperId);
        $this->assertEquals(2, $response->citations[2]->paperId);
    }

    public function test_config_override_and_clamp()
    {
        // Pass topK 50, should be clamped to max 20
        $this->retrievalServiceMock->expects($this->once())
            ->method('search')
            ->with('query', 20, 0.9) // 50 clamped to 20, threshold 0.9 passed directly
            ->willReturn([]);

        $response = $this->ragService->generateAnswer('query', 50, 0.9);

        $this->assertEquals(20, $response->usedTopK);
        $this->assertEquals(0.9, $response->usedThreshold);
    }

    public function test_missing_metadata_handled_gracefully()
    {
        $this->retrievalServiceMock->expects($this->once())
            ->method('search')
            ->willReturn([
                new RetrievalResult(1, 101, 'c1', 0.9),
            ]);

        // Mock PaperRepository returning missing metadata
        $this->paperRepositoryMock->expects($this->once())
            ->method('getByIds')
            ->willReturn(collect([
                (object)['id' => 1, 'title' => 'P1', 'published_year' => null, 'doi' => null],
            ]));

        $this->llmServiceMock->expects($this->once())
            ->method('generate')
            ->willReturn(new \App\DTOs\LlmResponse('AI Answer'));

        $response = $this->ragService->generateAnswer('query');

        $this->assertCount(1, $response->citations);
        $this->assertEquals('P1', $response->citations[0]->title);
        $this->assertNull($response->citations[0]->publishedYear);
        $this->assertNull($response->citations[0]->doi);
    }
}
