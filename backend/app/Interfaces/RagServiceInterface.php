<?php

namespace App\Interfaces;

use App\DTOs\RagResponse;

interface RagServiceInterface
{
    /**
     * Generate an answer using the RAG pipeline.
     *
     * @param string $question
     * @param int|null $topK
     * @param float|null $threshold
     * @return RagResponse
     */
    public function generateAnswer(string $question, ?int $topK = null, ?float $threshold = null): RagResponse;
}
