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

class OllamaService implements EmbeddingServiceInterface, LlmServiceInterface
{
    private Client $client;
    private string $baseUrl;
    private string $embeddingModel;
    private string $chatModel;

    public function __construct(Client $client)
    {
        $this->client = $client;
        $this->baseUrl = Config::get('services.ollama.base_url', 'http://host.docker.internal:11434');
        $this->embeddingModel = Config::get('services.ollama.embedding_model', 'nomic-embed-text');
        $this->chatModel = Config::get('services.ollama.chat_model', 'qwen2.5:3b');
    }

    /**
     * @inheritDoc
     */
    public function getEmbedding(string $text): array
    {
        try {
            $url = rtrim($this->baseUrl, '/') . '/api/embeddings';

            $response = $this->client->post($url, [
                'json' => [
                    'model' => $this->embeddingModel,
                    'prompt' => $text,
                ]
            ]);

            $data = json_decode($response->getBody()->getContents(), true);

            if (!isset($data['embedding']) || !is_array($data['embedding'])) {
                throw new AiServiceException('Invalid response from Ollama API: Missing embedding array.');
            }

            return $data['embedding'];

        } catch (GuzzleException $e) {
            throw new AiServiceException('HTTP Error while calling Ollama Embedding API: ' . $e->getMessage(), $e->getCode(), $e);
        } catch (Throwable $e) {
            if ($e instanceof AiServiceException) {
                throw $e;
            }
            throw new AiServiceException('Error processing Ollama Embedding response: ' . $e->getMessage(), 0, $e);
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

        foreach ($texts as $text) {
            $allEmbeddings[] = $this->getEmbedding($text);
        }

        return $allEmbeddings;
    }

    /**
     * @inheritDoc
     */
    public function generate(string $prompt): LlmResponse
    {
        try {
            $url = rtrim($this->baseUrl, '/') . '/api/generate';

            $response = $this->client->post($url, [
                'json' => [
                    'model' => $this->chatModel,
                    'prompt' => $prompt,
                    'stream' => false,
                    'options' => [
                        'temperature' => 0.2
                    ]
                ]
            ]);

            $data = json_decode($response->getBody()->getContents(), true);

            if (!isset($data['response'])) {
                throw new AiServiceException('Invalid response from Ollama API: Missing response content.');
            }

            $content = $data['response'];
            
            return new LlmResponse($content, 'stop');

        } catch (GuzzleException $e) {
            throw new AiServiceException('HTTP Error while calling Ollama Generate API: ' . $e->getMessage(), $e->getCode(), $e);
        } catch (Throwable $e) {
            if ($e instanceof AiServiceException) {
                throw $e;
            }
            throw new AiServiceException('Error processing Ollama Generate response: ' . $e->getMessage(), 0, $e);
        }
    }
}
