<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$n = App\Models\Notification::first();
if ($n) {
    echo "Before: " . ($n->is_read ? 'true' : 'false') . "\n";
    $n->update(['is_read' => 'true', 'read_at' => now()]);
    $n->refresh();
    echo "After: " . ($n->is_read ? 'true' : 'false') . "\n";
} else {
    echo "No notifications found\n";
}
