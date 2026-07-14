<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\Http;
use App\Interfaces\RetrievalServiceInterface;
use App\DTOs\RetrievalResult;
use App\Interfaces\PaperRepositoryInterface;

// Mock Retrieval
$retrievalMock = Mockery::mock(RetrievalServiceInterface::class);
$retrievalMock->shouldReceive('search')->andReturn([
    new RetrievalResult(1, 1, 'Test chunk content', 0.99)
]);
app()->instance(RetrievalServiceInterface::class, $retrievalMock);

$paperMock = Mockery::mock(PaperRepositoryInterface::class);
$paperMock->shouldReceive('getByIds')->andReturn(collect([(object)[
    'id' => 1, 'title' => 'Test Paper', 'authors' => [], 'published_year' => 2026,
    'doi' => '10', 'url' => 'http', 'abstract' => 'A', 'journal' => 'J'
]]));
app()->instance(PaperRepositoryInterface::class, $paperMock);

// Fake HTTP to Gemini
Http::fake([
    '*' => function ($request) {
        if (str_contains($request->url(), 'generateContent')) {
            echo "\n[HTTP MOCK] RAG Request Sent To: " . $request->url() . "\n";
            preg_match('/models\/([^:]+):generateContent/', $request->url(), $matches);
            $modelUsed = $matches[1] ?? 'unknown';
            echo "[MOCK ASSERTION] Model được sử dụng bởi Backend: " . $modelUsed . "\n";
        }
        return Http::response([
            'candidates' => [['content' => ['parts' => [['text' => 'AI MOCK RESPONSE']]], 'finishReason' => 'STOP']]
        ], 200);
    }
]);

try {
    echo "Configured Chat Model in Memory: " . config('rag.gemini_chat_model') . "\n";
    $ragService = app(\App\Interfaces\RagServiceInterface::class);
    $response = $ragService->generateAnswer("Test question");
    echo "RAG Response: " . $response->answer . "\n";
} catch (\Exception $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
}
