<?php

namespace Tests\Unit;

use PHPUnit\Framework\TestCase;
use App\Services\ChunkingService;

class ChunkingServiceTest extends TestCase
{
    private ChunkingService $chunkingService;

    protected function setUp(): void
    {
        parent::setUp();
        $this->chunkingService = new ChunkingService();
    }

    public function test_it_combines_title_and_abstract_properly()
    {
        $title = "Deep Learning in Healthcare";
        $abstract = "This is an abstract.";
        
        $chunks = $this->chunkingService->chunk($title, $abstract, 1000, 0);
        
        $this->assertCount(1, $chunks);
        $this->assertEquals("Deep Learning in Healthcare. This is an abstract.", $chunks[0]);
    }

    public function test_it_does_not_add_extra_period_if_title_has_punctuation()
    {
        $title = "Deep Learning in Healthcare?";
        $abstract = "This is an abstract.";
        
        $chunks = $this->chunkingService->chunk($title, $abstract, 1000, 0);
        
        $this->assertEquals("Deep Learning in Healthcare? This is an abstract.", $chunks[0]);
    }

    public function test_it_splits_by_sentences_and_respects_chunk_size()
    {
        // 3 sentences. Let's say we want a very small chunk size to force a split.
        $title = "First sentence.";
        $abstract = "Second sentence. Third sentence.";
        
        // "First sentence. Second sentence. Third sentence."
        // Let's set target chunk size to 20, which is enough for one sentence but not two.
        $chunks = $this->chunkingService->chunk($title, $abstract, 20, 0);
        
        $this->assertCount(3, $chunks);
        $this->assertEquals("First sentence.", $chunks[0]);
        $this->assertEquals("Second sentence.", $chunks[1]);
        $this->assertEquals("Third sentence.", $chunks[2]);
    }

    public function test_it_maintains_overlap_between_chunks()
    {
        $title = "Sentence one.";
        $abstract = "Sentence two. Sentence three. Sentence four. Sentence five.";
        
        // We set chunk size to ~30
        // Overlap size to ~15.
        // It will take the last 15 chars (or nearest space) of the previous chunk.
        $chunks = $this->chunkingService->chunk($title, $abstract, 30, 15);
        
        $this->assertGreaterThan(1, count($chunks));
        
        // Chunk 1 will be "Sentence one. Sentence two."
        // Last 15 chars: " Sentence two." (length 14).
        // It will find the first space and keep what follows.
        $this->assertStringContainsString("two.", $chunks[1]);
    }

    public function test_real_world_scenario_with_600_chunk_size()
    {
        $title = "Attention Is All You Need";
        $abstract = "The dominant sequence transduction models are based on complex recurrent or convolutional neural networks that include an encoder and a decoder. The best performing models also connect the encoder and decoder through an attention mechanism. We propose a new simple network architecture, the Transformer, based solely on attention mechanisms, dispensing with recurrence and convolutions entirely. Experiments on two machine translation tasks show these models to be superior in quality while being more parallelizable and requiring significantly less time to train. Our model achieves 28.4 BLEU on the WMT 2014 English-to-German translation task, improving over the existing best results, including ensembles, by over 2 BLEU. On the WMT 2014 English-to-French translation task, our model establishes a new single-model state-of-the-art BLEU score of 41.8 after training for 3.5 days on eight GPUs, a small fraction of the training costs of the best models from the literature.";

        $chunks = $this->chunkingService->chunk($title, $abstract, 600, 150);
        
        $this->assertCount(2, $chunks);
        
        $this->assertTrue(mb_strlen($chunks[0]) > 0);
        $this->assertTrue(mb_strlen($chunks[1]) > 0);
    }

    public function test_it_handles_empty_inputs()
    {
        $this->assertEmpty($this->chunkingService->chunk("", ""));
        $this->assertEmpty($this->chunkingService->chunk("   ", null));
    }

    public function test_it_handles_sentences_longer_than_chunk_size()
    {
        $longSentence = str_repeat("word ", 150); // ~750 characters
        $title = "Short title.";
        
        $chunks = $this->chunkingService->chunk($title, $longSentence, 600, 150);
        
        // Ensure no chunk exceeds 600 characters
        foreach ($chunks as $chunk) {
            $this->assertLessThanOrEqual(600, mb_strlen($chunk));
        }
        
        // Ensure it split into at least 2 chunks
        $this->assertGreaterThanOrEqual(2, count($chunks));
    }
}
