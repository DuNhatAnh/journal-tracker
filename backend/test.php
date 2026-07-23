<?php
$start = microtime(true);
require "vendor/autoload.php";
$app = require_once "bootstrap/app.php";
$kernel = $app->make(Illuminate\Contracts\Http\Kernel::class);
$request = Illuminate\Http\Request::capture();
echo "Boot time: " . (microtime(true) - $start) . "\n";
