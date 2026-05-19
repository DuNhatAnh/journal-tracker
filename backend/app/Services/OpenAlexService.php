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
     *
     * @param  string  $query   Search query
     * @param  int     $page    Page number (1-indexed)
     * @param  int     $perPage Results per page (max 200 for OpenAlex)
     * @return array
     */
    public function searchWorks(string $query, int $page = 1, int $perPage = 50): array
    {
        try {
            $response = $this->client->get('/works', [
                'query' => [
                    'search'     => $query,
                    'page'       => $page,
                    'per-page'   => $perPage,
                    'select'     => 'id,title,abstract_inverted_index,publication_year,primary_location,authorships,concepts,cited_by_count,doi',
                    'mailto'     => $this->email,
                ],
            ]);

            return json_decode($response->getBody()->getContents(), true);
        } catch (GuzzleException $e) {
            Log::error('OpenAlex searchWorks failed', ['error' => $e->getMessage()]);
            return [];
        }
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
