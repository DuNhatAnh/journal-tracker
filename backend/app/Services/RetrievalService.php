<?php

namespace App\Services;

use App\DTOs\RetrievalResult;
use App\Interfaces\EmbeddingServiceInterface;
use App\Interfaces\RetrievalServiceInterface;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;

class RetrievalService implements RetrievalServiceInterface
{
    public function __construct(
        private readonly EmbeddingServiceInterface $embeddingService
    ) {}

    /**
     * @inheritDoc
     */
    public function search(string $query, int $topK = 5, float $minSimilarity = 0.0): array
    {
        if (trim($query) === '') {
            throw new InvalidArgumentException('Search query cannot be empty.');
        }

        if ($topK <= 0) {
            throw new InvalidArgumentException('topK must be greater than 0.');
        }

        if ($minSimilarity < 0.0 || $minSimilarity > 1.0) {
            throw new InvalidArgumentException('minSimilarity must be between 0.0 and 1.0.');
        }

        // Generate embedding for the query
        $queryVector = $this->embeddingService->getEmbedding($query);
        $vectorString = '[' . implode(',', $queryVector) . ']';

        if (DB::connection()->getDriverName() === 'sqlite') {
            $allChunks = DB::table('paper_chunks')->get();
            $results = [];
            foreach ($allChunks as $chunk) {
                // In SQLite, embedding is stored as JSON string
                $chunkEmb = json_decode($chunk->embedding, true) ?? array_fill(0, 768, 0);
                $sim = $this->calculateCosineSimilarity($queryVector, $chunkEmb);
                if ($sim >= $minSimilarity) {
                    $chunk->similarity = $sim;
                    $results[] = $chunk;
                }
            }
            usort($results, fn($a, $b) => $b->similarity <=> $a->similarity);
            $results = array_slice($results, 0, $topK);
        } else {
            // Query pgvector using Cosine Distance (<=>)
            // Cosine Similarity = 1 - Cosine Distance
            $results = DB::table('paper_chunks')
                ->select('id', 'paper_id', 'content')
                ->selectRaw('1 - (embedding <=> ?::vector) as similarity', [$vectorString])
                ->whereRaw('1 - (embedding <=> ?::vector) >= ?', [$vectorString, $minSimilarity])
                ->orderByRaw('embedding <=> ?::vector', [$vectorString])
                ->limit($topK)
                ->get()
                ->toArray();
        }

        $retrievalResults = [];

        foreach ($results as $row) {
            $retrievalResults[] = new RetrievalResult(
                paperId: $row->paper_id,
                chunkId: $row->id,
                content: $row->content,
                similarityScore: (float) $row->similarity
            );
        }

        return $retrievalResults;
    }

    private function calculateCosineSimilarity(array $vecA, array $vecB): float
    {
        $dotProduct = 0.0;
        $normA = 0.0;
        $normB = 0.0;
        $len = min(count($vecA), count($vecB));
        
        for ($i = 0; $i < $len; $i++) {
            $dotProduct += $vecA[$i] * $vecB[$i];
            $normA += pow($vecA[$i], 2);
            $normB += pow($vecB[$i], 2);
        }
        
        if ($normA == 0.0 || $normB == 0.0) {
            return 0.0;
        }
        
        return $dotProduct / (sqrt($normA) * sqrt($normB));
    }
}
