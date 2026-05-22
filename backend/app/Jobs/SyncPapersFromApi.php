<?php

namespace App\Jobs;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use App\Services\OpenAlexService;
use App\Models\ResearchPaper;
use App\Models\Journal;
use App\Models\Author;
use App\Models\Keyword;
use App\Models\SyncLog;
use App\Models\ApiSource;

class SyncPapersFromApi implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries   = 3;
    public int $timeout = 3600;

    protected int $syncedCount = 0;

    public function __construct(
        protected string $query = '',
        protected string $source = 'openalex',
        protected int    $maxPages = 50,
        protected string $topicId = '',
        protected string $years = ''
    ) {}

    public function handle(OpenAlexService $openAlex): void
    {
        Log::info("SyncPapersFromApi started", ['query' => $this->query, 'source' => $this->source]);

        $apiSource = ApiSource::whereRaw('LOWER(name) = ?', [strtolower($this->source)])->first();
        $log = SyncLog::create([
            'api_source_id' => $apiSource?->id,
            'status'        => 'running',
            'papers_synced' => 0,
        ]);

        $this->syncedCount = 0;

        try {
            // 1. TOP CONCEPTS: Identify the base concept ID from the query
            $conceptId = null;
            if (!empty($this->query)) {
                $conceptId = $openAlex->searchConcepts($this->query);
                if ($conceptId) {
                    Log::info("Found Top Concept for query", ['query' => $this->query, 'concept_id' => $conceptId]);
                }
            }

            // Distribute pages between Top Cited and Recent
            $pagesEach = max(1, floor($this->maxPages / 2));

            // 2. TOP CITED PAPERS (Classics)
            for ($page = 1; $page <= $pagesEach; $page++) {
                $data = $openAlex->searchWorks(
                    query: $this->query, 
                    page: $page, 
                    perPage: 100, 
                    topicId: $this->topicId, 
                    years: '', // All-time top cited
                    sort: 'cited_by_count:desc',
                    conceptId: $conceptId
                );

                if (empty($data['results'])) break;
                foreach ($data['results'] as $item) {
                    $this->processWork($item);
                }
                sleep(1);
            }

            // 3. RECENT PAPERS (Cutting-edge)
            for ($page = 1; $page <= $pagesEach; $page++) {
                $data = $openAlex->searchWorks(
                    query: $this->query, 
                    page: $page, 
                    perPage: 100, 
                    topicId: $this->topicId, 
                    years: $this->years, // Respect configured years or default recent
                    sort: 'publication_date:desc',
                    conceptId: $conceptId
                );

                if (empty($data['results'])) break;
                foreach ($data['results'] as $item) {
                    $this->processWork($item);
                }
                sleep(1);
            }

            $log->update([
                'status'        => 'success',
                'papers_synced' => $this->syncedCount,
            ]);

            if ($apiSource) {
                $apiSource->update(['last_synced_at' => now()]);
            }

            Log::info("SyncPapersFromApi completed", ['query' => $this->query, 'synced_count' => $this->syncedCount]);

        } catch (\Throwable $e) {
            Log::error("SyncPapersFromApi failed", ['error' => $e->getMessage()]);

            $log->update([
                'status'        => 'failed',
                'papers_synced' => $this->syncedCount,
                'error_message' => $e->getMessage(),
            ]);

            throw $e;
        }
    }

    protected function processWork(array $item): void
    {
        try {
            // Resolve journal
            $journal = null;
            if ($sourceName = data_get($item, 'primary_location.source.display_name')) {
                $issn = data_get($item, 'primary_location.source.issn_l');
                $journal = Journal::firstOrCreate(
                    ['name' => $sourceName],
                    ['issn' => $issn, 'field' => 'Computer Science']
                );
            }

            // Decode abstract
            $abstract = OpenAlexService::decodeAbstract(
                data_get($item, 'abstract_inverted_index')
            );

            // Upsert paper
            $paper = ResearchPaper::updateOrCreate(
                ['source_id' => $item['id']],
                [
                    'title'          => $item['title'] ?? 'Untitled',
                    'abstract'       => $abstract,
                    'published_year' => $item['publication_year'] ?? date('Y'),
                    'journal_id'     => $journal?->id,
                    'citations_count'=> $item['cited_by_count'] ?? 0,
                    'doi'            => $item['doi'] ?? null,
                    'source'         => $this->source,
                ]
            );

            // Sync authors
            $authorIds = [];
            foreach (data_get($item, 'authorships', []) as $authorship) {
                $name = data_get($authorship, 'author.display_name');
                if ($name) {
                    $author = Author::firstOrCreate(['name' => $name]);
                    $authorIds[] = $author->id;
                }
            }
            $paper->authors()->sync($authorIds);

            // Sync keywords from concepts
            $keywordIds = [];
            foreach (data_get($item, 'concepts', []) as $concept) {
                if ($concept['score'] > 0.3) {
                    $kw = Keyword::firstOrCreate(
                        ['name' => $concept['display_name']],
                        ['slug' => Str::slug($concept['display_name'])]
                    );
                    $keywordIds[] = $kw->id;
                }
            }
            $paper->keywords()->sync($keywordIds);

            // Notify users if this is a newly imported research paper
            if ($paper->wasRecentlyCreated) {
                app(\App\Services\NotificationService::class)->notifyUsersForPaper($paper);
            }

            $this->syncedCount++;

        } catch (\Throwable $e) {
            Log::warning('Failed to process work', [
                'id'    => $item['id'] ?? 'unknown',
                'error' => $e->getMessage(),
            ]);
        }
    }
}
