<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

class AiController extends Controller
{
    public function review(Request $request)
    {
        $request->validate([
            'papers' => 'required|array|min:1',
        ]);

        $apiKey = env('GEMINI_API_KEY');
        if (empty($apiKey) || $apiKey === 'your-gemini-api-key') {
            return response()->json([
                'error' => 'Chưa cấu hình GEMINI_API_KEY trong file .env',
            ], 500);
        }

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
            $response = Http::timeout(30)->post('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=' . $apiKey, [
                'contents' => [
                    [
                        'parts' => [
                            ['text' => $prompt]
                        ]
                    ]
                ],
                'generationConfig' => [
                    'temperature' => 0.2,
                    'responseMimeType' => 'application/json',
                ]
            ]);

            if ($response->successful()) {
                $data = $response->json();
                $text = $data['candidates'][0]['content']['parts'][0]['text'] ?? null;

                if ($text) {
                    $jsonContent = json_decode($text, true);
                    if ($jsonContent && isset($jsonContent['overview'])) {
                        return response()->json($jsonContent);
                    }
                }
            }

            return response()->json([
                'error' => 'Lỗi khi gọi API AI hoặc parse kết quả.',
                'details' => $response->body()
            ], 500);
            
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Lỗi kết nối tới AI: ' . $e->getMessage()
            ], 500);
        }
    }
}
