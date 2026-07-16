<?php

namespace App\Services;

use GuzzleHttp\Client;
use GuzzleHttp\Exception\GuzzleException;
use Illuminate\Support\Facades\Log;

class OpenAlexService
{
    protected Client $client;
    protected string $baseUrl;
    protected string $email;

    public function __construct()
    {
        $this->baseUrl = config('services.openalex.base_url', 'https://api.openalex.org');
        $this->email   = config('services.openalex.email', 'admin@example.com');

        $this->client = new Client([
            'base_uri' => $this->baseUrl,
            'timeout'  => 30,
            'headers'  => [
                'User-Agent' => "JournalTracker/1.0 (mailto:{$this->email})",
                'Accept'     => 'application/json',
            ],
        ]);
    }

    /**
     * Search works (papers) by keyword or concept.
     * Scope is ALWAYS restricted to Computer Science:
     *  - primary_topic.field.id = 17  (OpenAlex field: Computer Science)
     *  - concepts.id = C41008148       (OpenAlex concept: Computer Science)
     *
     * @param  string  $query   Search query
     * @param  int     $page    Page number (1-indexed)
     * @param  int     $perPage Results per page (max 200 for OpenAlex)
     * @param  string  $topicId Topic ID
     * @param  string  $years   Year range
     * @return array
     */
    public function searchWorks(
        string $query = '', 
        int $page = 1, 
        int $perPage = 100, 
        string $topicId = '', 
        string $years = '',
        string $sort = 'cited_by_count:desc,publication_year:desc',
        ?string $conceptId = null
    ): array {
        // Default year range: from 2023 to current year
        if (empty($years)) {
            $years = '2023-' . date('Y');
        }
        try {
            // Build the filter
            $filters = [];

            // ALWAYS restrict to Computer Science field based on user requirement
            $filters[] = "primary_topic.field.id:17";

            // Optionally narrow down to a specific topic within CS or other
            if (!empty($topicId)) {
                $filters[] = "topics.id:{$topicId}";
            }

            if (!empty($years)) {
                $filters[] = "publication_year:{$years}";
            }
            if (!empty($conceptId)) {
                $filters[] = "concepts.id:{$conceptId}";
            } elseif (!empty(trim($query))) {
                $filters[] = "default.search:{$query}";
            }

            $queryParams = [
                'page'       => $page,
                'per-page'   => $perPage,
                'sort'       => $sort,
                'select'     => 'id,title,abstract_inverted_index,publication_year,primary_location,best_oa_location,authorships,concepts,topics,cited_by_count,doi',
                'mailto'     => $this->email,
            ];

            if (!empty($filters)) {
                $queryParams['filter'] = implode(',', $filters);
            }

            $response = $this->client->get('/works', [
                'query' => $queryParams,
            ]);

            return json_decode($response->getBody()->getContents(), true);
        } catch (GuzzleException $e) {
            Log::error('OpenAlex searchWorks failed', ['error' => $e->getMessage()]);
            return [];
        }
    }

    /**
     * Search for the top concept matching the query.
     */
    public function searchConcepts(string $query): ?string
    {
        if (empty(trim($query))) return null;

        try {
            $response = $this->client->get('/concepts', [
                'query' => [
                    'search' => $query,
                    'per-page' => 1,
                    'mailto' => $this->email,
                ],
            ]);
            $data = json_decode($response->getBody()->getContents(), true);
            if (!empty($data['results'])) {
                return $data['results'][0]['id'];
            }
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::error('OpenAlex searchConcepts failed', ['error' => $e->getMessage()]);
        }
        return null;
    }

    /**
     * Get publication counts per year for a concept/keyword.
     *
     * @param  string  $conceptId  OpenAlex concept ID (e.g. C41008148 for Computer Science)
     * @return array
     */
    public function getConceptTrend(string $conceptId): array
    {
        try {
            $response = $this->client->get('/works', [
                'query' => [
                    'filter'  => "concepts.id:{$conceptId}",
                    'group_by' => 'publication_year',
                    'mailto'  => $this->email,
                ],
            ]);

            $data = json_decode($response->getBody()->getContents(), true);
            return $data['group_by'] ?? [];
        } catch (GuzzleException $e) {
            Log::error('OpenAlex getConceptTrend failed', ['error' => $e->getMessage()]);
            return [];
        }
    }

    /**
     * Convert OpenAlex abstract_inverted_index back to plain text.
     */
    public static function decodeAbstract(?array $invertedIndex): ?string
    {
        if (empty($invertedIndex)) {
            return null;
        }

        $words = [];
        foreach ($invertedIndex as $word => $positions) {
            foreach ($positions as $pos) {
                $words[$pos] = $word;
            }
        }
        ksort($words);

        return implode(' ', $words);
    }
}
