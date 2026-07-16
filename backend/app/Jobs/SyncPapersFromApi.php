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
    protected array $progressItems = [];

    public function __construct(
        protected string $query = '',
        protected string $source = 'openalex',
        protected int    $maxPages = 50,
        protected string $topicId = '',
        protected string $years = '',
        protected int    $startPage = 1,
        ?SyncLog $syncLog = null
    ) {
        $this->syncLog = $syncLog;
    }

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
        $this->saveProgressDetails();
    }

    /**
     * Save progress details list and stats to database.
     */
    protected function saveProgressDetails(): void
    {
        if (!$this->syncLog) return;

        $success = 0;
        $created = 0;
        $updated = 0;
        $skipped = 0;
        $failed = 0;

        foreach ($this->progressItems as $item) {
            if ($item['status'] === 'success') {
                $success++;
                if (str_contains($item['reason'] ?? '', 'Thêm mới') || str_contains($item['reason'] ?? '', 'created')) {
                    $created++;
                } else {
                    $updated++;
                }
            } elseif ($item['status'] === 'skipped') {
                $skipped++;
            } elseif ($item['status'] === 'failed') {
                $failed++;
            }
        }

        $existingDetails = $this->syncLog->progress_details ?? [];
        $parameters = $existingDetails['parameters'] ?? null;

        $newDetails = [
            'total_expected' => $this->maxPages,
            'items' => array_values($this->progressItems),
            'summary' => [
                'success' => $success,
                'created' => $created,
                'updated' => $updated,
                'skipped' => $skipped,
                'failed' => $failed,
            ]
        ];

        if ($parameters) {
            $newDetails['parameters'] = $parameters;
        }

        $this->syncLog->update([
            'progress_details' => $newDetails
        ]);
    }

    public function handle(OpenAlexService $openAlex): void
    {
        Log::info("SyncPapersFromApi started", ['query' => $this->query, 'source' => $this->source, 'startPage' => $this->startPage]);

        $apiSource = ApiSource::whereRaw('LOWER(name) = ?', [strtolower($this->source)])->first();
        if (!$this->syncLog) {
            $this->syncLog = SyncLog::create([
                'api_source_id' => $apiSource?->id,
                'status'        => 'running',
                'papers_synced' => 0,
                'progress_details' => [
                    'total_expected' => $this->maxPages,
                    'items' => [],
                    'summary' => ['success' => 0, 'skipped' => 0, 'failed' => 0]
                ]
            ]);
        } else {
            // Update to running and reset fields
            $existingDetails = $this->syncLog->progress_details ?? [];
            $parameters = $existingDetails['parameters'] ?? null;
            
            $newDetails = [
                'total_expected' => $this->maxPages,
                'items' => [],
                'summary' => ['success' => 0, 'skipped' => 0, 'failed' => 0]
            ];
            
            if ($parameters) {
                $newDetails['parameters'] = $parameters;
            }

            $this->syncLog->update([
                'status'        => 'running',
                'papers_synced' => 0,
                'progress_details' => $newDetails
            ]);
        }

        $this->syncedCount = 0;
        $this->progressItems = [];

        try {
            // Step 1: Analyse keywords / find concept ID
            $this->updateProgress("Đang chuẩn bị dữ liệu và phân tích từ khóa...");
            if ($this->isCancelled()) return;

            $conceptId = null;
            if (!empty($this->query)) {
                $conceptId = $openAlex->searchConcepts($this->query);
            }

            $totalLimit = $this->maxPages; // actually total articles requested
            $limitTopCited = max(1, (int) ceil($totalLimit / 2));
            $limitRecent   = max(1, $totalLimit - $limitTopCited);
            
            // Step 2: TOP CITED PAPERS
            $remainingToFetch = $limitTopCited;
            $pagesEachTop = (int) ceil($limitTopCited / 100);
            $endPage = $this->startPage + $pagesEachTop - 1;
            for ($page = $this->startPage; $page <= $endPage; $page++) {
                if ($this->isCancelled()) return;
                
                $currentPerPage = min(100, $remainingToFetch);
                if ($currentPerPage <= 0) break;

                $remainingToFetch -= $currentPerPage;
                $eta = ($endPage - $page + 1) * 2; // rough estimate
                $this->updateProgress("Đang tải dữ liệu (Trích dẫn cao)... Ước tính còn ~{$eta}s");

                $data = $openAlex->searchWorks(
                    query: $this->query,
                    page: $page,
                    perPage: $currentPerPage,
                    topicId: $this->topicId,
                    years: $this->years,
                    sort: 'cited_by_count:desc',
                    conceptId: $conceptId
                );

                if (empty($data['results'])) break;
                
                // Chia nhỏ mảng kết quả thành các lô 10 bài để cập nhật tiến độ liên tục (vd: 10 - 10 - 5)
                $chunks = array_chunk($data['results'], 10);
                foreach ($chunks as $chunk) {
                    if ($this->isCancelled()) return;
                    $this->processBatch($chunk);
                }
                
                usleep(200000); // 200ms
            }

            // Step 3: RECENT PAPERS
            $remainingToFetch = $limitRecent;
            $pagesEachRecent = (int) ceil($limitRecent / 100);
            $endPage = $this->startPage + $pagesEachRecent - 1;
            for ($page = $this->startPage; $page <= $endPage; $page++) {
                if ($this->isCancelled()) return;

                $currentPerPage = min(100, $remainingToFetch);
                if ($currentPerPage <= 0) break;

                $remainingToFetch -= $currentPerPage;
                $eta = ($endPage - $page + 1) * 2;
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
                
                // Chia nhỏ mảng kết quả thành các lô 10 bài để cập nhật tiến độ liên tục (vd: 10 - 10 - 5)
                $chunks = array_chunk($data['results'], 10);
                foreach ($chunks as $chunk) {
                    if ($this->isCancelled()) return;
                    $this->processBatch($chunk);
                }
                
                usleep(200000);
            }

            // Final cancelled check before marking success
            if ($this->isCancelled()) return;

            // Recalculate trends
            $this->updateProgress("Đang tính toán lại xu hướng các chủ đề...");
            try {
                \Illuminate\Support\Facades\Artisan::call('trends:calculate');
            } catch (\Throwable $e) {
                Log::warning('Trend calculation failed during sync', ['error' => $e->getMessage()]);
            }

            $this->syncLog->update([
                'status'        => 'success',
                'papers_synced' => $this->syncedCount,
                'error_message' => null,
            ]);
            $this->saveProgressDetails();

            if ($apiSource) {
                $apiSource->update(['last_synced_at' => now()]);
            }

            // Clear dashboard and listing caches so all users see updated counts immediately
            \Illuminate\Support\Facades\Cache::flush();

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
                    $this->saveProgressDetails();
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

            // Bulk Insert Keywords (using withTrashed to avoid inserting existing soft-deleted/merged keywords)
            $allKeywordsFromDb = Keyword::withTrashed()->whereIn('name', $keywordNames)->get();
            $existingKeywordsByName = $allKeywordsFromDb->keyBy('name');
            $missingKeywords = array_diff($keywordNames, $allKeywordsFromDb->pluck('name')->toArray());
            if (!empty($missingKeywords)) {
                $keywordData = array_map(fn($n) => ['name' => $n, 'slug' => Str::slug($n), 'created_at' => $now, 'updated_at' => $now], $missingKeywords);
                foreach (array_chunk($keywordData, 500) as $chunk) Keyword::insert($chunk);
                // Re-fetch to include newly inserted keywords
                $newlyInsertedKeywords = Keyword::whereIn('name', $missingKeywords)->get();
                $allKeywordsFromDb = $allKeywordsFromDb->concat($newlyInsertedKeywords);
                $existingKeywordsByName = $allKeywordsFromDb->keyBy('name');
            }

            // Resolve merged keywords to their target keyword IDs (or restore them if they were deleted but not merged)
            $resolvedKeywordIds = [];
            foreach ($allKeywordsFromDb as $keyword) {
                $resolvedKeyword = $keyword;
                $visited = [];
                while ($resolvedKeyword->deleted_at !== null && $resolvedKeyword->merged_into_id !== null) {
                    if (in_array($resolvedKeyword->id, $visited)) {
                        break; // prevent infinite loops
                    }
                    $visited[] = $resolvedKeyword->id;
                    $target = Keyword::withTrashed()->find($resolvedKeyword->merged_into_id);
                    if ($target) {
                        $resolvedKeyword = $target;
                    } else {
                        break;
                    }
                }

                // If it is soft-deleted but has no merge target, skip it (do not associate, do not restore)
                if ($resolvedKeyword->deleted_at !== null && $resolvedKeyword->merged_into_id === null) {
                    continue;
                }

                $resolvedKeywordIds[$keyword->name] = $resolvedKeyword->id;
            }

            // Load existing papers in this batch to compare and bypass database writes if identical
            $sourceIds = array_filter(array_map(fn($item) => $item['id'] ?? null, $items));
            $existingPapers = ResearchPaper::whereIn('source_id', $sourceIds)->get()->keyBy('source_id');

            foreach ($items as $item) {
                if (empty($item['id'])) continue;

                // Add to progress items list (initialized to pending if not present)
                if (!isset($this->progressItems[$item['id']])) {
                    $this->progressItems[$item['id']] = [
                        'title' => $item['title'] ?? 'Untitled',
                        'status' => 'pending',
                        'reason' => null
                    ];
                }

                try {
                    $existing = $existingPapers->get($item['id']);
                    
                    if ($existing) {
                        $citationsOnApi = $item['cited_by_count'] ?? 0;
                        
                        // Cập nhật lại keywords bị thiếu do gộp/xóa nhầm
                        $keywordIds = [];
                        foreach (data_get($item, 'concepts', []) as $concept) {
                            if (($concept['score'] ?? 0) > 0.3) {
                                $name = $concept['display_name'];
                                if (isset($resolvedKeywordIds[$name])) {
                                    $keywordIds[] = $resolvedKeywordIds[$name];
                                }
                            }
                        }
                        if (!empty($keywordIds)) {
                            // Chỉ thêm vào, không xóa các keyword hiện tại của bài báo
                            $existing->keywords()->syncWithoutDetaching(array_unique($keywordIds));
                        }

                        // Cập nhật URL nếu hiện tại đang trống
                        if (is_null($existing->url)) {
                            $paperUrl = data_get($item, 'best_oa_location.pdf_url')
                                ?? data_get($item, 'primary_location.pdf_url')
                                ?? data_get($item, 'best_oa_location.landing_page_url')
                                ?? data_get($item, 'primary_location.landing_page_url');
                            if ($paperUrl) {
                                $existing->update(['url' => $paperUrl]);
                            }
                        }

                        if ($existing->citations_count === $citationsOnApi) {
                            // Perfect match - skip writing to database and pivot tables entirely
                            $this->progressItems[$item['id']]['status'] = 'skipped';
                            $this->progressItems[$item['id']]['reason'] = 'Dữ liệu trùng khớp (Đã kiểm tra lại tags)';
                            $this->syncedCount++;
                            continue;
                        }

                        // Citation count updated
                        $oldCitations = $existing->citations_count;
                        $existing->update(['citations_count' => $citationsOnApi]);
                        $this->progressItems[$item['id']]['status'] = 'success';
                        $this->progressItems[$item['id']]['reason'] = 'Cập nhật số lượt trích dẫn (' . $oldCitations . ' -> ' . $citationsOnApi . ') và tags';
                        $this->syncedCount++;
                        continue;
                    }

                    // New paper processing
                    $journalId = null;
                    if ($sourceName = data_get($item, 'primary_location.source.display_name')) {
                        $journalId = $existingJournals[$sourceName] ?? null;
                    }

                    $abstractIndex = data_get($item, 'abstract_inverted_index');
                    $abstract = is_array($abstractIndex) ? OpenAlexService::decodeAbstract($abstractIndex) : null;

                    // Ưu tiên PDF trực tiếp (best_oa_location > primary_location), sau đó dùng landing_page_url
                    $paperUrl = data_get($item, 'best_oa_location.pdf_url')
                        ?? data_get($item, 'primary_location.pdf_url')
                        ?? data_get($item, 'best_oa_location.landing_page_url')
                        ?? data_get($item, 'primary_location.landing_page_url');

                    $paper = ResearchPaper::create([
                        'source_id'       => $item['id'],
                        'title'           => $item['title'] ?? 'Untitled',
                        'abstract'        => $abstract,
                        'published_year'  => $item['publication_year'] ?? date('Y'),
                        'journal_id'      => $journalId,
                        'citations_count' => $item['cited_by_count'] ?? 0,
                        'doi'             => $item['doi'] ?? null,
                        'url'             => $paperUrl,
                        'source'          => $this->source,
                    ]);

                    $authorIds = [];
                    foreach (data_get($item, 'authorships', []) as $authorship) {
                        if ($name = data_get($authorship, 'author.display_name')) {
                            // Prevent string truncation error
                            $name = Str::limit($name, 250);
                            if (isset($existingAuthors[$name])) $authorIds[] = $existingAuthors[$name];
                        }
                    }
                    $paper->authors()->sync($authorIds);

                    $keywordIds = [];
                    foreach (data_get($item, 'concepts', []) as $concept) {
                        if (($concept['score'] ?? 0) > 0.3) {
                            $name = $concept['display_name'];
                            if (isset($resolvedKeywordIds[$name])) {
                                $keywordIds[] = $resolvedKeywordIds[$name];
                            }
                        }
                    }
                    $paper->keywords()->sync(array_unique($keywordIds));

                    $newPaperIds[] = $paper->id;
                    $this->progressItems[$item['id']]['status'] = 'success';
                    $this->progressItems[$item['id']]['reason'] = 'Thêm mới thành công';
                    $this->syncedCount++;
                } catch (\Throwable $e) {
                    Log::warning('Failed to process work', [
                        'id'    => $item['id'] ?? 'unknown',
                        'error' => $e->getMessage(),
                    ]);
                    $this->progressItems[$item['id']]['status'] = 'failed';
                    $this->progressItems[$item['id']]['reason'] = $e->getMessage();
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

        // Update live count and progress logs
        $this->updateProgress("Đã lưu {$this->syncedCount} bài báo...");
    }
}
