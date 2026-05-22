<?php

require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$source = \App\Models\ApiSource::where('name', 'like', '%Semantic%')->first();
$count = 0;
if ($source) {
    echo "Found source ID: " . $source->id . "\n";
    
    // Delete sync logs
    \App\Models\SyncLog::where('api_source_id', $source->id)->delete();
    
    // Delete papers synced from Semantic Scholar
    $count = \App\Models\ResearchPaper::where('source', 'semantic_scholar')->delete();
    // Also delete openalex papers that might be tagged under semantic scholar if any, but let's just stick to source.
    // Some papers might have just empty source but were pulled by Semantic Scholar?
    // Let's also delete papers containing 'semantic' in source or something just in case, but 'semantic_scholar' is standard.
    
    // Actually, in SyncPapersFromApi, it sets: 'source' => $sourceName
    // $sourceName is passed as strtolower($apiSource->name), so 'semantic scholar'
    $count2 = \App\Models\ResearchPaper::where('source', 'semantic scholar')->delete();
    
    $source->delete();
    echo "Deleted source and " . ($count + $count2) . " papers.\n";
} else {
    // maybe try to just delete papers anyway
    $count = \App\Models\ResearchPaper::where('source', 'semantic scholar')->delete();
    $count2 = \App\Models\ResearchPaper::where('source', 'semantic_scholar')->delete();
    echo "Source not found. Deleted " . ($count + $count2) . " orphaned papers.\n";
}
