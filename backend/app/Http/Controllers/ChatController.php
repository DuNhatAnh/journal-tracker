<?php

namespace App\Http\Controllers;

use App\Http\Requests\ChatRequest;
use App\Interfaces\RagServiceInterface;
use Illuminate\Http\JsonResponse;

class ChatController extends Controller
{
    public function __construct(
        private readonly RagServiceInterface $ragService
    ) {}

    /**
     * Handle the chat request.
     */
    public function chat(ChatRequest $request): JsonResponse
    {
        $validated = $request->validated();
        $question = $validated['question'];
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
