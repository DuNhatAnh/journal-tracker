<?php

namespace App\Http\Controllers;

use App\Http\Requests\ChatRequest;
use App\Interfaces\RagServiceInterface;
use Illuminate\Http\JsonResponse;

class ChatController extends Controller
{
    public function __construct(
        private readonly RagServiceInterface $ragService,
        private readonly \App\Interfaces\LlmServiceInterface $llmService
    ) {}

    /**
     * Handle the chat request.
     */
    public function chat(ChatRequest $request): JsonResponse
    {
        $validated = $request->validated();
        $question = $validated['question'];
        $paperId = $validated['paper_id'] ?? null;

        if ($paperId) {
            $paper = \App\Models\ResearchPaper::with('authors')->findOrFail($paperId);
            $chunks = \App\Models\PaperChunk::where('paper_id', $paperId)->get();
            
            $contextText = "";
            foreach ($chunks as $chunk) {
                $contextText .= $chunk->content . "\n\n";
            }
            if (empty($contextText)) {
                $contextText = "Tiêu đề: " . $paper->title . "\nTóm tắt (Abstract): " . $paper->abstract;
            }

            $prompt = "Bạn là trợ lý AI thông minh tích hợp trên SciTrend. Hãy trả lời câu hỏi của người dùng dựa vào ngữ cảnh của bài báo khoa học sau đây:\n\n"
                . "--- BẮT ĐẦU NGỮ CẢNH ---\n"
                . "Tiêu đề bài báo: " . $paper->title . "\n"
                . "Tác giả: " . $paper->authors->pluck('name')->implode(', ') . "\n"
                . "Năm xuất bản: " . $paper->published_year . "\n\n"
                . "Nội dung bài báo / các đoạn trích dẫn:\n"
                . $contextText . "\n"
                . "--- KẾT THÚC NGỮ CẢNH ---\n\n"
                . "Hãy trả lời câu hỏi sau bằng tiếng Việt một cách chi tiết, chính xác, khách quan dựa trên thông tin được cung cấp ở trên. Nếu thông tin cung cấp không đủ hoặc không liên quan đến câu hỏi, hãy khéo léo thông báo và trả lời tốt nhất có thể dựa vào kiến thức của bạn:\n\n"
                . "Câu hỏi: " . $question;

            $aiResponse = $this->llmService->generate($prompt);

            return response()->json([
                'success' => true,
                'data' => [
                    'answer' => $aiResponse->content,
                    'citations' => [
                        [
                            'paperId' => $paper->id,
                            'title' => $paper->title,
                            'publishedYear' => $paper->published_year,
                            'doi' => $paper->doi,
                        ]
                    ],
                    'hasContext' => true,
                    'maxSimilarity' => 1.0,
                    'retrievedChunks' => count($chunks),
                    'usedTopK' => count($chunks),
                    'usedThreshold' => 0.0,
                ]
            ]);
        }

        $scope = $validated['scope'] ?? 'all';
        $userId = auth()->id();

        $ragResponse = $this->ragService->generateAnswer(
            question: $question,
            topK: null,
            threshold: null,
            scope: $scope,
            userId: $userId
        );

        $citationsArray = array_map(function ($citation) {
            return [
                'paperId' => $citation->paperId,
                'title' => $citation->title,
                'publishedYear' => $citation->publishedYear,
                'doi' => $citation->doi,
            ];
        }, $ragResponse->citations);

        return response()->json([
            'success' => true,
            'data' => [
                'answer' => $ragResponse->answer,
                'citations' => $citationsArray,
                'hasContext' => $ragResponse->hasContext,
                'maxSimilarity' => $ragResponse->maxSimilarity,
                'retrievedChunks' => $ragResponse->retrievedChunks,
                'usedTopK' => $ragResponse->usedTopK,
                'usedThreshold' => $ragResponse->usedThreshold,
            ]
        ]);
    }
}
