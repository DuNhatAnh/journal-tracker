<?php

namespace App\Services;

use App\DTOs\RetrievalResult;
use App\Interfaces\EmbeddingServiceInterface;
use App\Interfaces\RetrievalServiceInterface;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;

use App\Interfaces\LlmServiceInterface;

class RetrievalService implements RetrievalServiceInterface
{
    public function __construct(
        private readonly EmbeddingServiceInterface $embeddingService,
        private readonly LlmServiceInterface $llmService
    ) {}

    /**
     * @inheritDoc
     */
    public function search(string $query, int $topK = 5, float $minSimilarity = 0.0, ?string $scope = 'all', ?int $userId = null): array
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

        // Detect if query is in Vietnamese and translate it to English for cross-lingual vector search
        $searchQuery = $query;
        if ($this->isVietnamese($query)) {
            $searchQuery = $this->translateToEnglish($query);
        }

        // Generate embedding for the query
        $queryVector = $this->embeddingService->getEmbedding($searchQuery);
        $vectorString = '[' . implode(',', $queryVector) . ']';

        if (DB::connection()->getDriverName() === 'sqlite') {
            $dbQuery = DB::table('paper_chunks');
            if ($scope === 'bookmarked' && $userId !== null) {
                $dbQuery->join('bookmarks', 'paper_chunks.paper_id', '=', 'bookmarks.paper_id')
                        ->where('bookmarks.user_id', $userId)
                        ->select('paper_chunks.*');
            }
            $allChunks = $dbQuery->get();
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
            $dbQuery = DB::table('paper_chunks');
            if ($scope === 'bookmarked' && $userId !== null) {
                $dbQuery->join('bookmarks', 'paper_chunks.paper_id', '=', 'bookmarks.paper_id')
                        ->where('bookmarks.user_id', $userId);
            }

            $results = $dbQuery
                ->select('paper_chunks.id', 'paper_chunks.paper_id', 'paper_chunks.content')
                ->selectRaw('1 - (paper_chunks.embedding <=> ?::vector) as similarity', [$vectorString])
                ->whereRaw('1 - (paper_chunks.embedding <=> ?::vector) >= ?', [$vectorString, $minSimilarity])
                ->orderByRaw('paper_chunks.embedding <=> ?::vector', [$vectorString])
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

    private function isVietnamese(string $text): bool
    {
        return (bool) preg_match('/[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđÀÁẠẢÃÂẦẤẬẨẪĂẰẮẶẲẴÈÉẸẺẼÊỀẾỆỂỄÌÍỊỈĨÒÓỌỎÕÔỒỐỘỔỖƠỜỚỢỞỠÙÚỤỦŨƯỪỨỰỬỮỲÝỴỶỸĐ]/u', $text);
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

    private function translateToEnglish(string $text): string
    {
        // 1. Try Google Translate Free API
        try {
            $response = \Illuminate\Support\Facades\Http::timeout(3)->get('https://translate.googleapis.com/translate_a/single', [
                'client' => 'gtx',
                'sl' => 'vi',
                'tl' => 'en',
                'dt' => 't',
                'q' => $text
            ]);
            if ($response->successful()) {
                $data = $response->json();
                if (isset($data[0][0][0])) {
                    return trim($data[0][0][0]);
                }
            }
        } catch (\Throwable $e) {
            // Fallback
        }

        // 2. Fallback to LLM Service
        try {
            $prompt = "Translate the following Vietnamese academic search query into a clean, search-optimized English keyword or phrase. Return ONLY the translated English search phrase, without any explanations, introductory text, or quotation marks:\n\n" . $text;
            $translationResponse = $this->llmService->generate($prompt);
            $translatedText = trim($translationResponse->content);
            $translatedText = trim($translatedText, "\"'\"“‘’”");
            if ($translatedText !== '') {
                return $translatedText;
            }
        } catch (\Throwable $e) {
            // Fallback to original text
        }

        return $text;
    }
}
