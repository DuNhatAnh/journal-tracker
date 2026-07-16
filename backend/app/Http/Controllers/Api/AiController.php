<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Interfaces\LlmServiceInterface;
use Illuminate\Support\Facades\Cache;

class AiController extends Controller
{
    protected LlmServiceInterface $llmService;

    public function __construct(LlmServiceInterface $llmService)
    {
        $this->llmService = $llmService;
    }

    public function review(Request $request)
    {
        $request->validate([
            'papers' => 'required|array|min:1',
        ]);

        $papers = collect($request->papers)->map(function ($p) {
            $abstract = !empty($p['abstract']) ? $p['abstract'] : 'Không có tóm tắt';
            $authors = !empty($p['authors']) ? $p['authors'] : 'Không rõ tác giả';
            return "- Tiêu đề: {$p['title']}\n  Tác giả: {$authors}\n  Tóm tắt: {$abstract}";
        })->implode("\n\n");

        $prompt = <<<EOT
Bạn là một trợ lý nghiên cứu học thuật chuyên nghiệp. Hãy đọc danh sách các bài báo dưới đây và viết một bản "Literature Review" ngắn gọn bằng TIẾNG VIỆT.

DANH SÁCH BÀI BÁO:
$papers

YÊU CẦU TRẢ VỀ CHÍNH XÁC ĐỊNH DẠNG JSON (Không chứa markdown code block như ```json) VỚI CÁC TRƯỜNG SAU:
{
    "overview": "Đoạn văn tổng quan chung về xu hướng của các bài báo này.",
    "similarities": [
        {
            "title": "Tiêu đề bài báo tương ứng trong danh sách",
            "insight": "Điểm chung hoặc đóng góp chính của bài báo này so với xu hướng."
        }
    ],
    "directions": "Đoạn văn gợi ý định hướng nghiên cứu tiếp theo dựa trên các bài báo trên."
}
EOT;

        try {
            $response = $this->llmService->generate($prompt);
            $text = $response->content;

            if ($text) {
                $cleanedText = preg_replace('/^```json\s*|```$/m', '', trim($text));
                $jsonContent = json_decode($cleanedText, true);
                if ($jsonContent && isset($jsonContent['overview'])) {
                    return response()->json($jsonContent);
                }
            }

            return response()->json([
                'error' => 'Lỗi khi gọi API AI hoặc parse kết quả.',
                'details' => $text
            ], 500);
            
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Lỗi kết nối tới AI: ' . $e->getMessage()
            ], 500);
        }
    }

    public function summarizePaper(Request $request)
    {
        $request->validate([
            'paper_id' => 'required|integer',
            'title' => 'required_without:check_only|string',
            'abstract' => 'required_without:check_only|string',
            'authors' => 'nullable|string',
            'force_refresh' => 'nullable|boolean',
            'check_only' => 'nullable|boolean',
        ]);

        $paperId = $request->input('paper_id');
        $title = $request->input('title');
        $abstract = $request->input('abstract');
        $authors = $request->input('authors', 'Không rõ tác giả');
        $forceRefresh = $request->input('force_refresh', false);
        $checkOnly = $request->input('check_only', false);

        $cacheKey = "paper_summary_{$paperId}";

        if ($checkOnly) {
            if (Cache::has($cacheKey)) {
                $cached = Cache::get($cacheKey);
                if (is_array($cached)) {
                    $cached['history'] = $cached['history'] ?? [];
                    $cached['created_at'] = $cached['created_at'] ?? now()->toDateTimeString();
                }
                return response()->json([
                    'success' => true,
                    'cached' => true,
                    'data' => $cached
                ]);
            }
            return response()->json([
                'success' => true,
                'cached' => false,
                'data' => null
            ]);
        }

        $oldCache = Cache::get($cacheKey);
        $history = [];
        if (is_array($oldCache)) {
            $history = $oldCache['history'] ?? [];
            if ($forceRefresh && isset($oldCache['tldr']) && isset($oldCache['insights'])) {
                array_unshift($history, [
                    'tldr' => $oldCache['tldr'],
                    'insights' => $oldCache['insights'],
                    'created_at' => $oldCache['created_at'] ?? now()->toDateTimeString(),
                ]);
            }
        }

        if ($forceRefresh) {
            Cache::forget($cacheKey);
        }

        try {
            $jsonContent = Cache::rememberForever($cacheKey, function () use ($title, $authors, $abstract, $history) {
                $prompt = <<<EOT
Bạn là một trợ lý nghiên cứu học thuật chuyên nghiệp. Hãy tóm tắt bài báo khoa học sau bằng TIẾNG VIỆT.

BÀI BÁO:
- Tiêu đề: {$title}
- Tác giả: {$authors}
- Tóm tắt gốc (Abstract): {$abstract}

YÊU CẦU TRẢ VỀ CHÍNH XÁC ĐỊNH DẠNG JSON (Không chứa markdown code block như ```json) VỚI CẤU TRÚC SAU:
{
    "tldr": "Một câu tóm tắt cực kỳ ngắn gọn (dưới 30 từ) về đóng góp chính của bài báo.",
    "insights": [
        "Dòng 1: Phương pháp nghiên cứu và cách tiếp cận chính của tác giả.",
        "Dòng 2: Phát hiện, kết quả hoặc đóng góp quan trọng nhất.",
        "Dòng 3: Ý nghĩa thực tiễn hoặc hạn chế/hướng đi tương lai."
    ]
}
EOT;
                $response = $this->llmService->generate($prompt);
                $text = $response->content;
                
                if ($text) {
                    $cleanedText = preg_replace('/^```json\s*|```$/m', '', trim($text));
                    $parsed = json_decode($cleanedText, true);
                    if ($parsed && isset($parsed['tldr']) && isset($parsed['insights']) && is_array($parsed['insights'])) {
                        return [
                            'tldr' => $parsed['tldr'],
                            'insights' => $parsed['insights'],
                            'created_at' => now()->toDateTimeString(),
                            'history' => $history
                        ];
                    }
                }
                throw new \Exception("Không thể phân tích dữ liệu trả về từ AI: " . $text);
            });

            return response()->json([
                'success' => true,
                'data' => $jsonContent
            ]);

        } catch (\App\Exceptions\AiServiceException $e) {
            \Illuminate\Support\Facades\Log::error("AiServiceException in summarizePaper: " . $e->getMessage(), ['trace' => $e->getTraceAsString()]);
            return response()->json([
                'success' => false,
                'message' => 'Dịch vụ AI chưa được cấu hình hoặc đang gián đoạn. Vui lòng liên hệ Quản trị viên hoặc cấu hình lại AI trong trang cài đặt.',
                'error' => $e->getMessage()
            ], 503);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Lỗi xử lý tóm tắt AI: ' . $e->getMessage(),
                'error' => $e->getMessage()
            ], 500);
        }
    }
}

