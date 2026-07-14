<?php

namespace App\DTOs;

class RagResponse
{
    /**
     * @param string $answer
     * @param Citation[] $citations
     * @param float $maxSimilarity
     * @param int $retrievedChunks
     * @param int $usedTopK
     * @param float $usedThreshold
     * @param bool $hasContext
     */
    public function __construct(
        public readonly string $answer,
        public readonly array $citations,
        public readonly float $maxSimilarity,
        public readonly int $retrievedChunks,
        public readonly int $usedTopK,
        public readonly float $usedThreshold,
        public readonly bool $hasContext
    ) {}
}
