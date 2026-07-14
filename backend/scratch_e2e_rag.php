<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Services\EnvService;
use App\Models\ResearchPaper;
use App\Models\PaperChunk;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Artisan;

echo "=== 1. KIỂM TRA GHI .ENV ===\n";
$envService = app(EnvService::class);
$envService->setKey('GEMINI_CHAT_MODEL', 'gemini-1.5-flash');
Artisan::call('optimize:clear');
echo "Nội dung file .env (sau khi cập nhật GEMINI_CHAT_MODEL = gemini-1.5-flash):\n";
echo trim(shell_exec('grep GEMINI_CHAT_MODEL .env')) . "\n\n";

echo "=== 2. THAY ĐỔI GEMINI_CHAT_MODEL SANG gemini-1.5-pro ===\n";
$envService->setKey('GEMINI_CHAT_MODEL', 'gemini-1.5-pro');
Artisan::call('optimize:clear');
echo "Nội dung file .env (sau khi cập nhật):\n";
echo trim(shell_exec('grep GEMINI_CHAT_MODEL .env')) . "\n\n";

echo "=== 3. KIỂM TRA MÔ HÌNH RAG SỬ DỤNG ===\n";
use App\Interfaces\RetrievalServiceInterface;
use App\DTOs\RetrievalResult;

$retrievalMock = Mockery::mock(RetrievalServiceInterface::class);
$retrievalMock->shouldReceive('search')
    ->andReturn([
        new RetrievalResult(1, 1, 'Test chunk content', 0.99)
    ]);
app()->instance(RetrievalServiceInterface::class, $retrievalMock);
$paperMock = Mockery::mock(\App\Interfaces\PaperRepositoryInterface::class);
$paperMock->shouldReceive('getByIds')
    ->andReturn(collect([(object)[
        'id' => 1, 
        'title' => 'Test Paper', 
        'authors' => [], 
        'published_year' => 2026,
        'doi' => '10.1234/test',
        'url' => 'http://test',
        'abstract' => 'Test abstract',
        'journal' => 'Test Journal'
    ]]));
app()->instance(\App\Interfaces\PaperRepositoryInterface::class, $paperMock);

Http::fake([
    '*' => function ($request) {
        if (str_contains($request->url(), 'generateContent')) {
            echo "-> GỬI RAG REQUEST TỚI GEMINI: " . $request->url() . "\n";
            if (str_contains($request->url(), 'gemini-1.5-pro')) {
                echo "-> ĐÃ XÁC NHẬN: Backend đã dùng đúng model gemini-1.5-pro!\n";
            }
        }
        return Http::response([
            'embeddings' => [['values' => array_fill(0, 768, 0.1)]],
            'candidates' => [['content' => ['parts' => [['text' => 'AI Response']]], 'finishReason' => 'STOP']]
        ], 200);
    }
]);

try {
    $ragService = app(\App\Interfaces\RagServiceInterface::class);
    $response = $ragService->generateAnswer("Test câu hỏi");
    echo "-> RAG Trả về Answer: " . $response->answer . "\n";
} catch (\Exception $e) {
    echo "Lỗi: " . $e->getMessage() . "\n";
}

$envService->setKey('GEMINI_CHAT_MODEL', 'gemini-2.5-flash');
Artisan::call('optimize:clear');
