<?php

namespace App\Console\Commands;

use App\Models\Journal;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class EnrichJournalsCommand extends Command
{
    protected $signature   = 'journals:enrich
                              {--limit=0   : Max number of journals to process (0 = all missing)}
                              {--dry-run   : Show what would be updated without saving}';

    protected $description = 'Enrich journals with ISSN, publisher and URL by querying the OpenAlex Sources API';

    private string $email;

    public function handle(): int
    {
        $this->email  = config('services.openalex.email', 'admin@example.com');
        $limit        = (int) $this->option('limit');
        $dryRun       = (bool) $this->option('dry-run');

        // Only process journals that are still missing at least one field
        $query = Journal::where(function ($q) {
            $q->whereNull('issn')
              ->orWhereNull('url')
              ->orWhereNull('publisher')
              ->orWhereNull('source_type');
        });

        if ($limit > 0) {
            $query->limit($limit);
        }

        $journals = $query->get();

        if ($journals->isEmpty()) {
            $this->info('✅ All journals already have complete data. Nothing to do.');
            return Command::SUCCESS;
        }

        $this->info("🔍 Found {$journals->count()} journal(s) with missing data. Enriching via OpenAlex Sources API…");
        $this->newLine();

        $updated = 0;
        $notFound = 0;

        foreach ($journals as $journal) {
            $this->line("  ⏳ <fg=yellow>{$journal->name}</>");

            $sourceData = $this->fetchFromOpenAlex($journal->name);

            if (! $sourceData) {
                $this->line("     <fg=red>✗ Not found in OpenAlex</>");
                $notFound++;
                continue;
            }

            $changes = $this->buildChanges($journal, $sourceData);

            if (empty($changes)) {
                $this->line("     <fg=green>✓ Already complete, skipping</>");
                continue;
            }

            $this->line("     <fg=green>✓ Found:</> " . implode(', ', array_keys($changes)));

            if (! $dryRun) {
                $journal->update($changes);
            }

            $updated++;

            // Rate-limit: max 10 req/s recommended by OpenAlex polite pool
            usleep(120_000);
        }

        $this->newLine();
        $this->info("🎉 Done! Updated: {$updated} | Not found: {$notFound}");

        return Command::SUCCESS;
    }

    // ──────────────────────────────────────────────────────────────────────
    //  OpenAlex Sources API
    // ──────────────────────────────────────────────────────────────────────

    private function fetchFromOpenAlex(string $journalName): ?array
    {
        $searchTerms = [$journalName];
        
        // Cải thiện tìm kiếm: bỏ phụ đề (sau dấu :) hoặc bỏ chữ "The " ở đầu
        if (str_contains($journalName, ':')) {
            $searchTerms[] = trim(explode(':', $journalName)[0]);
        }
        if (str_starts_with(strtolower($journalName), 'the ')) {
            $searchTerms[] = substr($journalName, 4);
        }

        foreach ($searchTerms as $term) {
            try {
                $response = Http::timeout(15)
                    ->withHeaders(['User-Agent' => "JournalTracker/1.0 (mailto:{$this->email})"])
                    ->get('https://api.openalex.org/sources', [
                        'search'   => $term,
                        'per-page' => 1,
                        'mailto'   => $this->email,
                    ]);

                if ($response->successful()) {
                    $results = $response->json('results', []);
                    if (!empty($results)) {
                        return $results[0]; // Trả về kết quả đầu tiên tìm thấy
                    }
                }
            } catch (\Throwable $e) {
                Log::error('EnrichJournals: HTTP error', ['journal' => $term, 'error' => $e->getMessage()]);
            }
            
            // Rate-limit between retries
            usleep(100_000);
        }

        return null;
    }

    private function buildChanges(Journal $journal, array $src): array
    {
        $changes = [];

        // Source type (journal | repository | conference | book-series | ebook-platform | …)
        if (empty($journal->source_type) && ! empty($src['type'])) {
            $changes['source_type'] = $src['type'];
        }

        // ISSN — prefer issn_l (linking ISSN), fall back to first in issn array
        if (empty($journal->issn)) {
            $issn = $src['issn_l']
                ?? (! empty($src['issn']) ? $src['issn'][0] : null);

            if ($issn) {
                $changes['issn'] = $issn;
            }
        }

        // Publisher
        if (empty($journal->publisher) && ! empty($src['host_organization_name'])) {
            $changes['publisher'] = $src['host_organization_name'];
        }

        // Homepage URL
        if (empty($journal->url) && ! empty($src['homepage_url'])) {
            $changes['url'] = $src['homepage_url'];
        }

        return $changes;
    }
}
