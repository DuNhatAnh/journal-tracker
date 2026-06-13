<?php
require __DIR__.'/../vendor/autoload.php';
$app = require_once __DIR__.'/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Http\Kernel::class);
$kernel->handle(Illuminate\Http\Request::capture());

echo "Files in migrations dir:\n";
$files = scandir(__DIR__.'/../database/migrations');
foreach($files as $f) echo $f."\n";

echo "\nRunning migration:\n";
\Illuminate\Support\Facades\Artisan::call('migrate', ['--force' => true]);
echo \Illuminate\Support\Facades\Artisan::output();

echo "\nDoes table exist? " . (\Illuminate\Support\Facades\Schema::hasTable('keyword_merge_logs') ? 'YES' : 'NO');
