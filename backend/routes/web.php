<?php

use Illuminate\Support\Facades\Route;

// Redirect tất cả về API docs / health check
Route::get('/', function () {
    return response()->json([
        'app'     => 'Journal Tracker API',
        'version' => '1.0.0',
        'status'  => 'running',
        'docs'    => url('/api'),
    ]);
});
