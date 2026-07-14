<?php

namespace App\DTOs;

class RetrievalResult
{
    public function __construct(
        public readonly int $paperId,
        public readonly int $chunkId,
        public readonly string $content,
        public readonly float $similarityScore
    ) {}

    public function toArray(): array
    {
        return [
            'paper_id' => $this->paperId,
            'chunk_id' => $this->chunkId,
            'content' => $this->content,
            'similarity_score' => $this->similarityScore,
        ];
    }
}
