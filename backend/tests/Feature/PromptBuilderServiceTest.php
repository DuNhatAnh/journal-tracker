<?php

namespace Tests\Feature;

use App\DTOs\Citation;
use App\DTOs\PaperContext;
use App\DTOs\RetrievedContext;
use App\DTOs\RetrievalResult;
use App\Services\PromptBuilderService;
use Tests\TestCase;

class PromptBuilderServiceTest extends TestCase
{
    private PromptBuilderService $promptBuilder;

    protected function setUp(): void
    {
        parent::setUp();
        $this->promptBuilder = $this->app->make(PromptBuilderService::class);
        
        config([
            'rag.system_prompt_template' => "TEST TEMPLATE\n%context%"
        ]);
    }

    public function test_grouping_chunks_from_same_paper()
    {
        $citation = new Citation(
            paperId: 1,
            title: 'Test Paper A',
            publishedYear: 2026,
            doi: '10.1234/test'
        );

        $chunks = [
            new RetrievalResult(1, 101, 'First chunk content', 0.9),
            new RetrievalResult(1, 102, 'Second chunk content', 0.8),
            new RetrievalResult(1, 103, 'Third chunk content', 0.75),
        ];

        $paperContext = new PaperContext($citation, $chunks);
        $retrievedContext = new RetrievedContext([$paperContext]);

        $prompt = $this->promptBuilder->buildPrompt($retrievedContext);

        // Assert Title appears exactly ONCE
        $titleCount = substr_count($prompt, 'Title: Test Paper A (2026) | DOI: 10.1234/test');
        $this->assertEquals(1, $titleCount);

        // Assert all 3 chunks appear
        $this->assertStringContainsString('- Chunk: First chunk content', $prompt);
        $this->assertStringContainsString('- Chunk: Second chunk content', $prompt);
        $this->assertStringContainsString('- Chunk: Third chunk content', $prompt);
    }
}
