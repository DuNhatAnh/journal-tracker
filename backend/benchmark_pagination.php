<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;

// Query 1: Offset Pagination (Page 1000, roughly offset 10000)
$queryOffset = DB::table('research_papers')
    ->orderByDesc('published_year')
    ->orderByDesc('citations_count')
    ->orderByDesc('id');

$start = microtime(true);
$offsetResult = $queryOffset->offset(10000)->limit(10)->get();
$offsetTime = microtime(true) - $start;

// Query 2: Cursor Pagination (Simulating cursor at 10000)
// To do a fair benchmark, let's explain analyze instead.
$explainOffset = DB::select("EXPLAIN ANALYZE SELECT * FROM research_papers ORDER BY published_year DESC, citations_count DESC, id DESC OFFSET 10000 LIMIT 10");

// For Cursor, it translates to WHERE (published_year, citations_count, id) < (val1, val2, val3) ORDER BY ... LIMIT 10
// Let's assume we have values.
$explainCursor = DB::select("EXPLAIN ANALYZE SELECT * FROM research_papers WHERE (published_year, citations_count, id) < (2020, 50, 1000) ORDER BY published_year DESC, citations_count DESC, id DESC LIMIT 10");

echo "=== OFFSET PAGINATION EXPLAIN ===\n";
foreach($explainOffset as $row) {
    echo $row->{"QUERY PLAN"} . "\n";
}

echo "\n=== CURSOR PAGINATION EXPLAIN ===\n";
foreach($explainCursor as $row) {
    echo $row->{"QUERY PLAN"} . "\n";
}
