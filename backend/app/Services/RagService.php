<?php

namespace App\Services;

use App\DTOs\Citation;
use App\DTOs\PaperContext;
use App\DTOs\RagResponse;
use App\DTOs\RetrievedContext;
use App\Interfaces\LlmServiceInterface;
use App\Interfaces\PaperRepositoryInterface;
use App\Interfaces\PromptBuilderInterface;
use App\Interfaces\RagServiceInterface;
use App\Interfaces\RetrievalServiceInterface;

class RagService implements RagServiceInterface
{
    public function __construct(
        private readonly RetrievalServiceInterface $retrievalService,
        private readonly PaperRepositoryInterface $paperRepository,
        private readonly PromptBuilderInterface $promptBuilder,
        private readonly LlmServiceInterface $llmService
    ) {}

    /**
     * @inheritDoc
     */
    public function generateAnswer(string $question, ?int $topK = null, ?float $threshold = null): RagResponse
    {
        // 1. Resolve configuration
        $usedTopK = $topK ?? config('rag.default_top_k', 5);
        $usedThreshold = $threshold ?? config('rag.default_min_similarity', 0.7);
        $maxTopK = config('rag.max_top_k', 20);
        
        // Clamp topK
        if ($usedTopK > $maxTopK) {
            $usedTopK = $maxTopK;
        }

        // 2. Retrieval
        $retrievalResults = $this->retrievalService->search($question, $usedTopK, $usedThreshold);

        // 3. Short-circuit if no chunks found
        if (empty($retrievalResults)) {
            return new RagResponse(
                answer: "Tôi không tìm thấy thông tin phù hợp trong cơ sở dữ liệu.",
                citations: [],
                maxSimilarity: 0.0,
                retrievedChunks: 0,
                usedTopK: $usedTopK,
                usedThreshold: $usedThreshold,
                hasContext: false
            );
        }

        // 4. Extract unique paper IDs
        $paperIds = [];
        $maxSim = 0.0;
        foreach ($retrievalResults as $result) {
            $paperIds[$result->paperId] = true;
            if ($result->similarityScore > $maxSim) {
                $maxSim = $result->similarityScore;
            }
        }
        $uniquePaperIds = array_keys($paperIds);

        // 5. Fetch Metadata
        $papers = $this->paperRepository->getByIds($uniquePaperIds)->keyBy('id');

        // 6. Build RetrievedContext (Group chunks by paper)
        $paperContexts = [];
        $citations = [];

        foreach ($uniquePaperIds as $pid) {
            $paper = $papers->get($pid);
            if (!$paper) {
                continue;
            }

            $citation = new Citation(
                paperId: $paper->id,
                title: $paper->title ?? 'Unknown Title',
                publishedYear: $paper->published_year,
                doi: $paper->doi
            );
            
            $citations[] = $citation;

            // Find all chunks for this paper
            $paperChunks = array_filter($retrievalResults, fn($r) => $r->paperId === $pid);

            $paperContexts[] = new PaperContext(
                citation: $citation,
                chunks: array_values($paperChunks)
            );
        }

        $retrievedContext = new RetrievedContext($paperContexts);

        // 7. Build Prompt
        $systemPrompt = $this->promptBuilder->buildPrompt($retrievedContext);

        // 8. Generate Answer
        $finalPrompt = $systemPrompt . "\n\nQuestion: " . $question;
        $llmResponse = $this->llmService->generate($finalPrompt);
        $answer = $llmResponse->content;

        // 9. Return Response
        return new RagResponse(
            answer: $answer,
            citations: $citations,
            maxSimilarity: $maxSim,
            retrievedChunks: count($retrievalResults),
            usedTopK: $usedTopK,
            usedThreshold: $usedThreshold,
            hasContext: true
        );
    }
}
