<?php

namespace Tests\Feature;

use App\DTOs\RetrievalResult;
use App\Interfaces\EmbeddingServiceInterface;
use App\Services\RetrievalService;
use App\Exceptions\AiServiceException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;
use Tests\TestCase;

class RetrievalServiceTest extends TestCase
{
    use RefreshDatabase;

    private RetrievalService $retrievalService;
    private $embeddingServiceMock;

    protected function setUp(): void
    {
        parent::setUp();

        $this->embeddingServiceMock = $this->createMock(EmbeddingServiceInterface::class);
        $this->app->instance(EmbeddingServiceInterface::class, $this->embeddingServiceMock);

        $this->retrievalService = $this->app->make(RetrievalService::class);
    }

    private function createDummyVector(int $indexToSet1 = 0): string
    {
        $arr = array_fill(0, 768, 0.0);
        $arr[$indexToSet1] = 1.0;
        return '[' . implode(',', $arr) . ']';
    }

    private function createDummyVectorArray(int $indexToSet1 = 0): array
    {
        $arr = array_fill(0, 768, 0.0);
        $arr[$indexToSet1] = 1.0;
        return $arr;
    }

    public function test_search_with_empty_db_returns_empty_array()
    {
        $this->embeddingServiceMock->expects($this->once())
            ->method('getEmbedding')
            ->willReturn($this->createDummyVectorArray(0));

        $results = $this->retrievalService->search('test query');
        
        $this->assertIsArray($results);
        $this->assertEmpty($results);
    }

    public function test_search_with_empty_query_throws_exception()
    {
        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage('Search query cannot be empty.');

        $this->retrievalService->search('   ');
    }

    public function test_search_with_invalid_topK_throws_exception()
    {
        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage('topK must be greater than 0.');

        $this->retrievalService->search('query', 0);
    }

    public function test_search_with_invalid_minSimilarity_throws_exception()
    {
        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage('minSimilarity must be between 0.0 and 1.0.');

        $this->retrievalService->search('query', 5, 1.5);
    }

    public function test_search_when_ai_throws_exception()
    {
        $this->embeddingServiceMock->expects($this->once())
            ->method('getEmbedding')
            ->willThrowException(new AiServiceException('API Error'));

        $this->expectException(AiServiceException::class);
        $this->expectExceptionMessage('API Error');

        $this->retrievalService->search('query');
    }

    public function test_search_returns_correct_order_and_similarity()
    {
        $paperId = DB::table('research_papers')->insertGetId([
            'title' => 'Test Paper',
            'abstract' => 'Test Abstract',
            'published_year' => 2026,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $queryVectorArray = $this->createDummyVectorArray(0);
        $this->embeddingServiceMock->expects($this->once())
            ->method('getEmbedding')
            ->willReturn($queryVectorArray);

        DB::table('paper_chunks')->insert([
            'paper_id' => $paperId,
            'content' => 'Chunk 1 (Exact Match)',
            'embedding' => $this->createDummyVector(0),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        DB::table('paper_chunks')->insert([
            'paper_id' => $paperId,
            'content' => 'Chunk 2 (Slightly Different)',
            'embedding' => $this->createDummyVector(1),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        DB::table('paper_chunks')->insert([
            'paper_id' => $paperId,
            'content' => 'Chunk 3 (Very Different)',
            'embedding' => $this->createDummyVector(2),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $results = $this->retrievalService->search('query', 5, 0.0);

        $this->assertCount(3, $results);
        $this->assertInstanceOf(RetrievalResult::class, $results[0]);
        
        $this->assertEquals('Chunk 1 (Exact Match)', $results[0]->content);
        $this->assertEqualsWithDelta(1.0, $results[0]->similarityScore, 0.001);

        $this->assertTrue($results[0]->similarityScore > $results[1]->similarityScore);
        $this->assertEquals(0.0, $results[1]->similarityScore);
        $this->assertEquals(0.0, $results[2]->similarityScore);
    }

    public function test_search_filters_by_minSimilarity()
    {
        $paperId = DB::table('research_papers')->insertGetId([
            'title' => 'Test Paper',
            'published_year' => 2026,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $this->embeddingServiceMock->expects($this->once())
            ->method('getEmbedding')
            ->willReturn($this->createDummyVectorArray(0));

        DB::table('paper_chunks')->insert([
            ['paper_id' => $paperId, 'content' => 'Good Match', 'embedding' => $this->createDummyVector(0)],
            ['paper_id' => $paperId, 'content' => 'Bad Match', 'embedding' => $this->createDummyVector(1)],
        ]);

        $results = $this->retrievalService->search('query', 5, 0.9);

        $this->assertCount(1, $results);
        $this->assertEquals('Good Match', $results[0]->content);
    }

    public function test_search_respects_topK_limit_even_if_more_chunks_exist()
    {
        $paperId = DB::table('research_papers')->insertGetId([
            'title' => 'Test Paper',
            'published_year' => 2026,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $this->embeddingServiceMock->expects($this->once())
            ->method('getEmbedding')
            ->willReturn($this->createDummyVectorArray(0));

        for ($i = 0; $i < 5; $i++) {
            DB::table('paper_chunks')->insert([
                'paper_id' => $paperId, 
                'content' => "Chunk $i", 
                'embedding' => $this->createDummyVector(0)
            ]);
        }

        $results = $this->retrievalService->search('query', 2);
        
        $this->assertCount(2, $results);
    }
    
    public function test_topK_larger_than_existing_chunks()
    {
        $paperId = DB::table('research_papers')->insertGetId([
            'title' => 'Test Paper',
            'published_year' => 2026,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $this->embeddingServiceMock->expects($this->once())
            ->method('getEmbedding')
            ->willReturn($this->createDummyVectorArray(0));

        DB::table('paper_chunks')->insert([
            'paper_id' => $paperId, 
            'content' => "Only Chunk", 
            'embedding' => $this->createDummyVector(0)
        ]);

        $results = $this->retrievalService->search('query', 10);
        
        $this->assertCount(1, $results);
    }
}
