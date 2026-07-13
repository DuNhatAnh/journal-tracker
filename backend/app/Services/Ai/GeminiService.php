<?php

namespace App\Services\Ai;

use App\DTOs\LlmResponse;
use App\Exceptions\AiServiceException;
use App\Interfaces\EmbeddingServiceInterface;
use App\Interfaces\LlmServiceInterface;
use GuzzleHttp\Client;
use GuzzleHttp\Exception\GuzzleException;
use Illuminate\Support\Facades\Config;
use Throwable;

class GeminiService implements EmbeddingServiceInterface, LlmServiceInterface
{
    private Client $client;
    private string $apiKey;
    private string $embeddingModel;
    private string $chatModel;
    private int $embeddingDimensions;

    public function __construct(Client $client)
    {
        $this->client = $client;
        $this->apiKey = Config::get('services.gemini.api_key', '');
        $this->embeddingModel = Config::get('services.gemini.embedding_model', 'gemini-embedding-001');
        $this->chatModel = Config::get('services.gemini.chat_model', 'gemini-2.5-flash');
        $this->embeddingDimensions = (int) Config::get('services.gemini.embedding_dimensions', 768);

        if (empty($this->apiKey)) {
            throw new AiServiceException('Gemini API key is not configured.');
        }
    }

    /**
     * @inheritDoc
     */
    public function getEmbedding(string $text): array
    {
        try {
            $url = "https://generativelanguage.googleapis.com/v1beta/models/{$this->embeddingModel}:embedContent";

            $response = $this->client->post($url, [
                'headers' => [
                    'x-goog-api-key' => $this->apiKey,
                    'Content-Type' => 'application/json',
                ],
                'json' => [
                    'model' => "models/{$this->embeddingModel}",
                    'content' => [
                        'parts' => [
                            ['text' => $text]
                        ]
                    ],
                    'taskType' => 'RETRIEVAL_DOCUMENT',
                    'outputDimensionality' => $this->embeddingDimensions
                ]
            ]);

            $data = json_decode($response->getBody()->getContents(), true);

            if (!isset($data['embedding']['values'])) {
                throw new AiServiceException('Invalid response from Gemini API: Missing embedding values.');
            }

            $vector = $data['embedding']['values'];

            if (count($vector) !== $this->embeddingDimensions) {
                throw new AiServiceException("Vector dimension mismatch. Expected {$this->embeddingDimensions}, got " . count($vector));
            }

            return $vector;

        } catch (GuzzleException $e) {
            throw new AiServiceException('HTTP Error while calling Gemini API: ' . $e->getMessage(), $e->getCode(), $e);
        } catch (Throwable $e) {
            if ($e instanceof AiServiceException) {
                throw $e;
            }
            throw new AiServiceException('Error processing Gemini API response: ' . $e->getMessage(), 0, $e);
        }
    }

    /**
     * @inheritDoc
     */
    public function getEmbeddings(array $texts): array
    {
        if (empty($texts)) {
            return [];
        }

        $allEmbeddings = [];
        $chunks = array_chunk($texts, 100);
        $url = "https://generativelanguage.googleapis.com/v1beta/models/{$this->embeddingModel}:batchEmbedContents";

        foreach ($chunks as $chunk) {
            $requests = [];
            foreach ($chunk as $text) {
                $requests[] = [
                    'model' => "models/{$this->embeddingModel}",
                    'content' => [
                        'parts' => [
                            ['text' => $text]
                        ]
                    ],
                    'taskType' => 'RETRIEVAL_DOCUMENT',
                    'outputDimensionality' => $this->embeddingDimensions
                ];
            }

            try {
                $response = $this->client->post($url, [
                    'headers' => [
                        'x-goog-api-key' => $this->apiKey,
                        'Content-Type' => 'application/json',
                    ],
                    'json' => [
                        'requests' => $requests
                    ]
                ]);

                $data = json_decode($response->getBody()->getContents(), true);

                if (!isset($data['embeddings']) || !is_array($data['embeddings'])) {
                    throw new AiServiceException('Invalid response from Gemini batch API: Missing embeddings array.');
                }

                foreach ($data['embeddings'] as $index => $emb) {
                    if (!isset($emb['values'])) {
                        throw new AiServiceException("Invalid response from Gemini batch API: Missing values at index {$index}.");
                    }
                    $vector = $emb['values'];
                    
                    if (count($vector) !== $this->embeddingDimensions) {
                        throw new AiServiceException("Vector dimension mismatch in batch. Expected {$this->embeddingDimensions}, got " . count($vector));
                    }
                    
                    $allEmbeddings[] = $vector;
                }
            } catch (GuzzleException $e) {
                throw new AiServiceException('HTTP Error while calling Gemini Batch API: ' . $e->getMessage(), $e->getCode(), $e);
            } catch (Throwable $e) {
                if ($e instanceof AiServiceException) {
                    throw $e;
                }
                throw new AiServiceException('Error processing Gemini Batch API response: ' . $e->getMessage(), 0, $e);
            }
        }

        if (count($allEmbeddings) !== count($texts)) {
            throw new AiServiceException('Mismatch between input texts count and returned embeddings count from Gemini API.');
        }

        return $allEmbeddings;
    }

    /**
     * @inheritDoc
     */
    public function generate(string $prompt): LlmResponse
    {
        try {
            $url = "https://generativelanguage.googleapis.com/v1beta/models/{$this->chatModel}:generateContent";

            $response = $this->client->post($url, [
                'headers' => [
                    'x-goog-api-key' => $this->apiKey,
                    'Content-Type' => 'application/json',
                ],
                'json' => [
                    'contents' => [
                        [
                            'role' => 'user',
                            'parts' => [
                                ['text' => $prompt]
                            ]
                        ]
                    ]
                ]
            ]);

            $data = json_decode($response->getBody()->getContents(), true);

            if (!isset($data['candidates'][0]['content']['parts'][0]['text'])) {
                throw new AiServiceException('Invalid response from Gemini generate API: Missing content text.');
            }

            $content = $data['candidates'][0]['content']['parts'][0]['text'];
            $finishReason = $data['candidates'][0]['finishReason'] ?? null;

            return new LlmResponse($content, $finishReason);

        } catch (GuzzleException $e) {
            throw new AiServiceException('HTTP Error while calling Gemini generate API: ' . $e->getMessage(), $e->getCode(), $e);
        } catch (Throwable $e) {
            if ($e instanceof AiServiceException) {
                throw $e;
            }
            throw new AiServiceException('Error processing Gemini generate API response: ' . $e->getMessage(), 0, $e);
        }
    }
}
