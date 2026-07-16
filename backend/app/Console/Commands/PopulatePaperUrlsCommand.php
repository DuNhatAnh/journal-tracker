<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\ResearchPaper;
use GuzzleHttp\Client;
use Illuminate\Support\Facades\Log;

class PopulatePaperUrlsCommand extends Command
{
    protected $signature = 'papers:populate-urls
                            {--dry-run : Preview changes without writing to database}
                            {--chunk=50 : Number of papers per OpenAlex API request}';

    protected $description = 'Backfill url field for existing papers that have null url by querying OpenAlex API';

    public function handle(): void
    {
        $isDryRun = $this->option('dry-run');
        $chunkSize = (int) $this->option('chunk');

        $papers = ResearchPaper::whereNull('url')
            ->whereNotNull('source_id')
            ->where('source', 'openalex')
            ->select(['id', 'source_id', 'title', 'url'])
            ->get();

        $total = $papers->count();
        $this->info("📋 Found {$total} papers with missing url.");

        if ($total === 0) {
            $this->info("✅ All papers already have URLs. Nothing to do.");
            return;
        }

        if ($isDryRun) {
            $this->warn("⚠️  DRY RUN mode - no changes will be saved.");
        }

        $client = new Client([
            'base_uri' => config('services.openalex.base_url', 'https://api.openalex.org'),
            'timeout'  => 30,
            'headers'  => [
                'User-Agent' => 'JournalTracker/1.0 (mailto:' . config('services.openalex.email', 'admin@example.com') . ')',
                'Accept'     => 'application/json',
            ],
        ]);

        $chunks = $papers->chunk($chunkSize);
        $updated = 0;
        $noUrl = 0;
        $failed = 0;

        $bar = $this->output->createProgressBar(count($chunks));
        $bar->start();

        foreach ($chunks as $chunk) {
            try {
                // Build OpenAlex IDs filter: pipe-separated list
                $ids = $chunk->pluck('source_id')->map(fn($id) => urlencode($id))->join('|');

                $response = $client->get('/works', [
                    'query' => [
                        'filter'   => "openalex_id:{$ids}",
                        'per-page' => $chunkSize,
                        'select'   => 'id,best_oa_location,primary_location',
                        'mailto'   => config('services.openalex.email', 'admin@example.com'),
                    ],
                ]);

                $data = json_decode($response->getBody()->getContents(), true);
                $works = collect($data['results'] ?? []);

                // Map OpenAlex id => url
                $urlMap = [];
                foreach ($works as $work) {
                    $openAlexId = $work['id']; // e.g. "https://openalex.org/W12345"
                    $url = data_get($work, 'best_oa_location.pdf_url')
                        ?? data_get($work, 'primary_location.pdf_url')
                        ?? data_get($work, 'best_oa_location.landing_page_url')
                        ?? data_get($work, 'primary_location.landing_page_url');
                    $urlMap[$openAlexId] = $url;
                }

                foreach ($chunk as $paper) {
                    $url = $urlMap[$paper->source_id] ?? null;
                    if ($url) {
                        if (!$isDryRun) {
                            ResearchPaper::where('id', $paper->id)->update(['url' => $url]);
                        }
                        $updated++;
                    } else {
                        $noUrl++;
                    }
                }

                usleep(100000); // 100ms rate limit
            } catch (\Throwable $e) {
                $failed += $chunk->count();
                Log::warning('PopulatePaperUrls chunk failed', ['error' => $e->getMessage()]);
                $this->newLine();
                $this->error("  ⚠️  Chunk failed: " . $e->getMessage());
            }

            $bar->advance();
        }

        $bar->finish();
        $this->newLine(2);

        $this->table(
            ['Metric', 'Count'],
            [
                ['Total papers processed', $total],
                [$isDryRun ? 'Would update (URL found)' : 'Updated (URL found)', $updated],
                ['No URL available', $noUrl],
                ['Failed (API error)', $failed],
            ]
        );

        if ($isDryRun) {
            $this->warn("DRY RUN complete. Run without --dry-run to save changes.");
        } else {
            $this->info("✅ Done! Updated {$updated} papers with URL.");
        }
    }
}
