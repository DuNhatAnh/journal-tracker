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

class SyncPapersFromApi implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries   = 3;
    public int $timeout = 120;

    public function __construct(
        protected string $query,
        protected string $source = 'openalex',
        protected int    $maxPages = 5,
    ) {}

    public function handle(OpenAlexService $openAlex): void
    {
        Log::info("SyncPapersFromApi started", ['query' => $this->query, 'source' => $this->source]);

        for ($page = 1; $page <= $this->maxPages; $page++) {
            $data = $openAlex->searchWorks($this->query, $page, 50);

            if (empty($data['results'])) {
                break;
            }

            foreach ($data['results'] as $item) {
                $this->processWork($item);
            }

            // Respect rate limits — polite crawling
            sleep(1);
        }

        Log::info("SyncPapersFromApi completed", ['query' => $this->query]);
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
                    ['issn' => $issn]
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

        } catch (\Throwable $e) {
            Log::warning('Failed to process work', [
                'id'    => $item['id'] ?? 'unknown',
                'error' => $e->getMessage(),
            ]);
        }
    }
}
