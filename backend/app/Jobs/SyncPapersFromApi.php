<?php

namespace App\Jobs;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\DB;
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
    protected ?SyncLog $syncLog = null;

    public function __construct(
        protected string $query = '',
        protected string $source = 'openalex',
        protected int    $maxPages = 50,
        protected string $topicId = '',
        protected string $years = ''
    ) {}

    /**
     * Check if this sync has been cancelled by admin via DB flag.
     */
    protected function isCancelled(): bool
    {
        if (!$this->syncLog) return false;
        // Re-read from DB to pick up admin cancel
        $fresh = SyncLog::find($this->syncLog->id);
        return $fresh && $fresh->status === 'cancelled';
    }

    /**
     * Update progress message on the sync log.
     */
    protected function updateProgress(string $message): void
    {
        if (!$this->syncLog) return;
        $this->syncLog->update([
            'error_message' => $message,
            'papers_synced' => $this->syncedCount,
        ]);
    }

    public function handle(OpenAlexService $openAlex): void
    {
        Log::info("SyncPapersFromApi started", ['query' => $this->query, 'source' => $this->source]);

        $apiSource = ApiSource::whereRaw('LOWER(name) = ?', [strtolower($this->source)])->first();
        $this->syncLog = SyncLog::create([
            'api_source_id' => $apiSource?->id,
            'status'        => 'running',
            'papers_synced' => 0,
        ]);

        $this->syncedCount = 0;

        try {
            // Step 1: Analyse keywords / find concept ID
            $this->updateProgress("Đang chuẩn bị dữ liệu và phân tích từ khóa...");
            if ($this->isCancelled()) return;

            $conceptId = null;
            if (!empty($this->query)) {
                $conceptId = $openAlex->searchConcepts($this->query);
            }

            $totalLimit = $this->maxPages; // actually total articles requested
            $limitEach  = max(1, (int) floor($totalLimit / 2));
            
            // Maximum per-page allowed by OpenAlex is 200. We'll stick to max 100 for safety.
            $pagesEach = (int) ceil($limitEach / 100);

            // Step 2: TOP CITED PAPERS
            $remainingToFetch = $limitEach;
            for ($page = 1; $page <= $pagesEach; $page++) {
                if ($this->isCancelled()) return;
                
                $currentPerPage = min(100, $remainingToFetch);
                if ($currentPerPage <= 0) break;

                $remainingToFetch -= $currentPerPage;
                $eta = $pagesEach * 2; // rough estimate
                $this->updateProgress("Đang tải dữ liệu (Trích dẫn cao)... Ước tính còn ~{$eta}s");

                $data = $openAlex->searchWorks(
                    query: $this->query,
                    page: $page,
                    perPage: $currentPerPage,
                    topicId: $this->topicId,
                    years: '',
                    sort: 'cited_by_count:desc',
                    conceptId: $conceptId
                );

                if (empty($data['results'])) break;
                $this->processBatch($data['results']);
                usleep(200000); // 200ms
            }

            // Step 3: RECENT PAPERS
            $remainingToFetch = $limitEach;
            for ($page = 1; $page <= $pagesEach; $page++) {
                if ($this->isCancelled()) return;

                $currentPerPage = min(100, $remainingToFetch);
                if ($currentPerPage <= 0) break;

                $remainingToFetch -= $currentPerPage;
                $eta = $pagesEach * 2;
                $this->updateProgress("Đang tải dữ liệu (Mới xuất bản)... Ước tính còn ~{$eta}s");

                $data = $openAlex->searchWorks(
                    query: $this->query,
                    page: $page,
                    perPage: $currentPerPage,
                    topicId: $this->topicId,
                    years: $this->years,
                    sort: 'publication_date:desc',
                    conceptId: $conceptId
                );

                if (empty($data['results'])) break;
                $this->processBatch($data['results']);
                usleep(200000);
            }

            // Final cancelled check before marking success
            if ($this->isCancelled()) return;

            $this->syncLog->update([
                'status'        => 'success',
                'papers_synced' => $this->syncedCount,
                'error_message' => null,
            ]);

            if ($apiSource) {
                $apiSource->update(['last_synced_at' => now()]);
            }

            Log::info("SyncPapersFromApi completed", ['synced_count' => $this->syncedCount]);

        } catch (\Throwable $e) {
            Log::error("SyncPapersFromApi failed", ['error' => $e->getMessage()]);

            // Only update if not already cancelled by admin
            if ($this->syncLog) {
                $fresh = SyncLog::find($this->syncLog->id);
                if ($fresh && $fresh->status !== 'cancelled') {
                    $fresh->update([
                        'status'        => 'failed',
                        'papers_synced' => $this->syncedCount,
                        'error_message' => $e->getMessage(),
                    ]);
                }
            }

            throw $e;
        }
    }

    /**
     * Process a batch of works in a single DB transaction for speed.
     * Notifications are sent AFTER the transaction to avoid blocking writes.
     */
    protected function processBatch(array $items): void
    {
        // 1. Extract all unique names to preload/bulk insert
        $journalNames = [];
        $authorNames = [];
        $keywordNames = [];
        
        foreach ($items as $item) {
            if ($sourceName = data_get($item, 'primary_location.source.display_name')) {
                $journalNames[] = $sourceName;
            }
            foreach (data_get($item, 'authorships', []) as $authorship) {
                if ($name = data_get($authorship, 'author.display_name')) {
                    $authorNames[] = $name;
                }
            }
            foreach (data_get($item, 'concepts', []) as $concept) {
                if (($concept['score'] ?? 0) > 0.3) {
                    $keywordNames[] = $concept['display_name'];
                }
            }
        }
        
        $journalNames = array_unique(array_filter($journalNames));
        $authorNames = array_unique(array_filter($authorNames));
        $keywordNames = array_unique(array_filter($keywordNames));

        $newPaperIds = [];

        DB::transaction(function () use ($items, &$newPaperIds, $journalNames, $authorNames, $keywordNames) {
            $now = now();

            // Bulk Insert Journals
            $existingJournals = Journal::whereIn('name', $journalNames)->pluck('id', 'name')->toArray();
            $missingJournals = array_diff($journalNames, array_keys($existingJournals));
            if (!empty($missingJournals)) {
                $journalData = array_map(fn($n) => ['name' => $n, 'issn' => null, 'field' => 'Computer Science', 'created_at' => $now, 'updated_at' => $now], $missingJournals);
                foreach (array_chunk($journalData, 500) as $chunk) Journal::insert($chunk);
                $existingJournals = Journal::whereIn('name', $journalNames)->pluck('id', 'name')->toArray();
            }

            // Bulk Insert Authors
            $existingAuthors = Author::whereIn('name', $authorNames)->pluck('id', 'name')->toArray();
            $missingAuthors = array_diff($authorNames, array_keys($existingAuthors));
            if (!empty($missingAuthors)) {
                $authorData = array_map(fn($n) => ['name' => $n, 'created_at' => $now, 'updated_at' => $now], $missingAuthors);
                foreach (array_chunk($authorData, 500) as $chunk) Author::insert($chunk);
                $existingAuthors = Author::whereIn('name', $authorNames)->pluck('id', 'name')->toArray();
            }

            // Bulk Insert Keywords
            $existingKeywords = Keyword::whereIn('name', $keywordNames)->pluck('id', 'name')->toArray();
            $missingKeywords = array_diff($keywordNames, array_keys($existingKeywords));
            if (!empty($missingKeywords)) {
                $keywordData = array_map(fn($n) => ['name' => $n, 'slug' => Str::slug($n), 'created_at' => $now, 'updated_at' => $now], $missingKeywords);
                foreach (array_chunk($keywordData, 500) as $chunk) Keyword::insert($chunk);
                $existingKeywords = Keyword::whereIn('name', $keywordNames)->pluck('id', 'name')->toArray();
            }

            foreach ($items as $item) {
                try {
                    $journalId = null;
                    if ($sourceName = data_get($item, 'primary_location.source.display_name')) {
                        $journalId = $existingJournals[$sourceName] ?? null;
                    }

                    $abstract = OpenAlexService::decodeAbstract(data_get($item, 'abstract_inverted_index'));

                    $paper = ResearchPaper::updateOrCreate(
                        ['source_id' => $item['id']],
                        [
                            'title'           => $item['title'] ?? 'Untitled',
                            'abstract'        => $abstract,
                            'published_year'  => $item['publication_year'] ?? date('Y'),
                            'journal_id'      => $journalId,
                            'citations_count' => $item['cited_by_count'] ?? 0,
                            'doi'             => $item['doi'] ?? null,
                            'source'          => $this->source,
                        ]
                    );

                    $authorIds = [];
                    foreach (data_get($item, 'authorships', []) as $authorship) {
                        if ($name = data_get($authorship, 'author.display_name')) {
                            if (isset($existingAuthors[$name])) $authorIds[] = $existingAuthors[$name];
                        }
                    }
                    $paper->authors()->sync($authorIds);

                    $keywordIds = [];
                    foreach (data_get($item, 'concepts', []) as $concept) {
                        if (($concept['score'] ?? 0) > 0.3) {
                            $name = $concept['display_name'];
                            if (isset($existingKeywords[$name])) $keywordIds[] = $existingKeywords[$name];
                        }
                    }
                    $paper->keywords()->sync($keywordIds);

                    if ($paper->wasRecentlyCreated) {
                        $newPaperIds[] = $paper->id;
                    }

                    $this->syncedCount++;
                } catch (\Throwable $e) {
                    Log::warning('Failed to process work', [
                        'id'    => $item['id'] ?? 'unknown',
                        'error' => $e->getMessage(),
                    ]);
                }
            }
        });

        // Send notifications outside the transaction to avoid blocking DB writes
        try {
            if (!empty($newPaperIds)) {
                app(\App\Services\NotificationService::class)->notifyBatch($newPaperIds);
            }
        } catch (\Throwable $e) {
            Log::warning('Batch notification failed', ['error' => $e->getMessage()]);
        }

        // Update live count after batch
        $this->updateProgress("Đã lưu {$this->syncedCount} bài báo...");
    }
}
