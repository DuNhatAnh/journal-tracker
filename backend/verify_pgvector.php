<?php

require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

try {
    // Drop table if exists for clean test
    Schema::dropIfExists('test_vector');
    
    // Enable extension
    DB::statement('CREATE EXTENSION IF NOT EXISTS vector;');
    
    // Create test table
    DB::statement('CREATE TABLE test_vector (id serial PRIMARY KEY, embedding vector(3))');
    
    // Test json_encode
    $vector = [1.1, 2.2, 3.3];
    $json = json_encode($vector);
    
    echo "Inserting: " . $json . "\n";
    
    DB::table('test_vector')->insert([
        'embedding' => $json
    ]);
    
    $result = DB::table('test_vector')->first();
    echo "Success! Retrieved: " . $result->embedding . "\n";
    
    // Clean up
    Schema::dropIfExists('test_vector');
    
} catch (\Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
