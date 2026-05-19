<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Jobs\SyncPapersFromApi;

class SyncPapersCommand extends Command
{
    protected $signature = 'papers:sync
                            {--source=openalex : Data source (openalex|semantic_scholar)}
                            {--field=computer science : Research field/query to sync}
                            {--pages=5 : Max pages to fetch}';

    protected $description = 'Sync research papers from external academic APIs';

    public function handle(): void
    {
        $source = $this->option('source');
        $field  = $this->option('field');
        $pages  = (int) $this->option('pages');

        $this->info("📡 Dispatching sync job...");
        $this->table(
            ['Option', 'Value'],
            [['Source', $source], ['Field', $field], ['Max Pages', $pages]]
        );

        SyncPapersFromApi::dispatch($field, $source, $pages);

        $this->info("✅ Job dispatched to queue. Run `php artisan queue:work` to process.");
    }
}
