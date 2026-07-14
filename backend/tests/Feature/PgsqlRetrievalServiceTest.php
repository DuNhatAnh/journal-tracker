<?php

namespace Tests\Feature;

use App\DTOs\RetrievalResult;
use App\Interfaces\EmbeddingServiceInterface;
use App\Services\RetrievalService;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class PgsqlRetrievalServiceTest extends TestCase
{
    // Use DatabaseTransactions so we don't wipe the real development database
    use DatabaseTransactions;

    private RetrievalService $retrievalService;
    private $embeddingServiceMock;

    protected function setUp(): void
    {
        parent::setUp();

        // Force connection to pgsql and set correct database name (avoiding phpunit.xml :memory: override)
        config([
            'database.default' => 'pgsql',
            'database.connections.pgsql.database' => 'postgres'
        ]);
        DB::purge('pgsql');

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

    public function test_pgsql_search_filters_by_threshold_in_sql()
    {
        // Insert a dummy paper
        $paperId = DB::table('research_papers')->insertGetId([
            'title' => 'PgSql Test Paper',
            'abstract' => 'Test Abstract',
            'published_year' => 2026,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // Mock the query embedding using a unique index to avoid collision with real DB data
        $this->embeddingServiceMock->expects($this->once())
            ->method('getEmbedding')
            ->willReturn($this->createDummyVectorArray(767));

        // Insert chunks with exact match (similarity 1.0) and orthogonal match (similarity 0.0)
        DB::table('paper_chunks')->insert([
            ['paper_id' => $paperId, 'content' => 'PgSql Good Match', 'embedding' => $this->createDummyVector(767)],
            ['paper_id' => $paperId, 'content' => 'PgSql Bad Match', 'embedding' => $this->createDummyVector(766)],
        ]);

        // Search with a threshold of 0.9 and a large topK.
        // If the threshold is processed correctly in SQL, the 'PgSql Bad Match' should not be in the results.
        $results = $this->retrievalService->search('query', 100, 0.9);

        $contents = array_map(fn($r) => $r->content, $results);

        $this->assertContains('PgSql Good Match', $contents, 'The good match should be returned.');
        $this->assertNotContains('PgSql Bad Match', $contents, 'The bad match should be filtered out by SQL.');
    }
}
