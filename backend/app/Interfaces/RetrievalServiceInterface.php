<?php

namespace App\Interfaces;

interface RetrievalServiceInterface
{
    /**
     * Search for chunks similar to the given query.
     *
     * @param string $query The search query text.
     * @param int $topK The maximum number of results to return.
     * @param float $minSimilarity The minimum similarity score (0.0 to 1.0).
     * @param string|null $scope The scope of research papers ('all' or 'bookmarked').
     * @param int|null $userId The user ID if filtering by bookmarks.
     * @return \App\DTOs\RetrievalResult[] Array of retrieval results.
     */
    public function search(string $query, int $topK = 5, float $minSimilarity = 0.0, ?string $scope = 'all', ?int $userId = null): array;
}
