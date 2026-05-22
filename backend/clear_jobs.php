<?php

require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$count = \App\Models\SyncLog::whereIn('status', ['running', 'pending'])->delete();
\Illuminate\Support\Facades\DB::table('jobs')->truncate();

echo "Deleted {$count} running/pending sync logs and cleared jobs queue.\n";
