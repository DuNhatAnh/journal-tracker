<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Jobs\SyncPapersFromApi;

class SyncPapersCommand extends Command
{
    protected $signature = 'papers:sync
                            {--source=openalex : Data source (openalex|semantic_scholar)}
                            {--keyword= : Search keyword}
                            {--topic= : OpenAlex topic ID (default: Computer Science Field)}
                            {--years= : Year range (default: 2023-current year)}
                            {--pages=50 : Max pages to fetch}
                            {--start-page=1 : The page offset to start fetching from}';

    protected $description = 'Sync research papers (Computer Science) from external academic APIs';

    public function handle(): void
    {
        $source = $this->option('source');
        $keyword  = (string) $this->option('keyword');
        $pages  = (int) $this->option('pages');
        $topicId = $this->option('topic') ?? '';
        $years = $this->option('years');
        $startPage = (int) $this->option('start-page');

        $this->info("📡 Dispatching sync job...");
        $this->table(
            ['Option', 'Value'],
            [
                ['Source', $source],
                ['Keyword', $keyword ?: '(None)'],
                ['Topic', $topicId ?: 'Primary Field: Computer Science (17)'],
                ['Years', $years],
                ['Max Pages', $pages],
                ['Start Page', $startPage]
            ]
        );

        SyncPapersFromApi::dispatch($keyword, $source, $pages, $topicId, $years, $startPage);

        $this->info("✅ Job dispatched to queue. Run `php artisan queue:work` to process.");
    }
}
