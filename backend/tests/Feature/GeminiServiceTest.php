<?php

namespace Tests\Feature;

use App\DTOs\LlmResponse;
use App\Exceptions\AiServiceException;
use App\Services\Ai\GeminiService;
use GuzzleHttp\Client;
use GuzzleHttp\Exception\ClientException;
use GuzzleHttp\Handler\MockHandler;
use GuzzleHttp\HandlerStack;
use GuzzleHttp\Psr7\Request;
use GuzzleHttp\Psr7\Response;
use Illuminate\Support\Facades\Config;
use Tests\TestCase;

class GeminiServiceTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        
        Config::set('services.gemini.api_key', 'fake-api-key');
        Config::set('services.gemini.embedding_model', 'gemini-embedding-001');
        Config::set('services.gemini.chat_model', 'gemini-2.5-flash');
        Config::set('services.gemini.embedding_dimensions', 768);
    }

    private function createGeminiServiceWithMock(array $responses): GeminiService
    {
        $mock = new MockHandler($responses);
        $handlerStack = HandlerStack::create($mock);
        $client = new Client(['handler' => $handlerStack]);

        return new GeminiService($client);
    }

    public function test_get_embedding_returns_correct_dimensions()
    {
        $fakeVector = array_fill(0, 768, 0.1);
        $responseBody = json_encode([
            'embedding' => [
                'values' => $fakeVector
            ]
        ]);

        $service = $this->createGeminiServiceWithMock([
            new Response(200, [], $responseBody)
        ]);

        $result = $service->getEmbedding('Test text');

        $this->assertIsArray($result);
        $this->assertCount(768, $result);
        $this->assertEquals($fakeVector, $result);
    }

    public function test_get_embeddings_automatically_chunks_requests_over_100()
    {
        $texts = array_fill(0, 150, 'Test text');

        $batch1Embeddings = [];
        for ($i = 0; $i < 100; $i++) {
            $batch1Embeddings[] = ['values' => array_fill(0, 768, 0.1)];
        }

        $batch2Embeddings = [];
        for ($i = 0; $i < 50; $i++) {
            $batch2Embeddings[] = ['values' => array_fill(0, 768, 0.2)];
        }

        $service = $this->createGeminiServiceWithMock([
            new Response(200, [], json_encode(['embeddings' => $batch1Embeddings])),
            new Response(200, [], json_encode(['embeddings' => $batch2Embeddings]))
        ]);

        $results = $service->getEmbeddings($texts);

        $this->assertIsArray($results);
        $this->assertCount(150, $results);
        $this->assertCount(768, $results[0]);
        $this->assertCount(768, $results[149]);
        $this->assertEquals(0.1, $results[0][0]);
        $this->assertEquals(0.2, $results[149][0]);
    }

    public function test_get_embeddings_throws_exception_if_missing_embeddings_field()
    {
        $this->expectException(AiServiceException::class);
        $this->expectExceptionMessage('Invalid response from Gemini batch API: Missing embeddings array.');

        $service = $this->createGeminiServiceWithMock([
            new Response(200, [], json_encode(['error' => 'Something went wrong']))
        ]);

        $service->getEmbeddings(['Test text']);
    }

    public function test_generate_returns_llm_response_with_content_and_finish_reason()
    {
        $responseBody = json_encode([
            'candidates' => [
                [
                    'content' => [
                        'parts' => [
                            ['text' => 'Generated text from Gemini']
                        ]
                    ],
                    'finishReason' => 'STOP'
                ]
            ]
        ]);

        $service = $this->createGeminiServiceWithMock([
            new Response(200, [], $responseBody)
        ]);

        $result = $service->generate('Hello, who are you?');

        $this->assertInstanceOf(LlmResponse::class, $result);
        $this->assertEquals('Generated text from Gemini', $result->content);
        $this->assertEquals('STOP', $result->finishReason);
    }

    public function test_http_401_or_429_is_converted_to_ai_service_exception()
    {
        $request = new Request('POST', 'test');
        $response401 = new Response(401, [], json_encode(['error' => ['message' => 'Unauthorized']]));

        $service = $this->createGeminiServiceWithMock([
            new ClientException('Unauthorized', $request, $response401)
        ]);

        $this->expectException(AiServiceException::class);
        $this->expectExceptionMessage('HTTP Error while calling Gemini API: Unauthorized');

        $service->getEmbedding('Test text');
    }
}
