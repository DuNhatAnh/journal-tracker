<?php

namespace Tests\Feature;

use App\DTOs\Citation;
use App\DTOs\RagResponse;
use App\Interfaces\RagServiceInterface;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ChatControllerTest extends TestCase
{
    use RefreshDatabase;

    private $ragServiceMock;
    private $llmServiceMock;
    private User $user;

    protected function setUp(): void
    {
        parent::setUp();

        $this->ragServiceMock = $this->createMock(RagServiceInterface::class);
        $this->app->instance(RagServiceInterface::class, $this->ragServiceMock);

        $this->llmServiceMock = $this->createMock(\App\Interfaces\LlmServiceInterface::class);
        $this->app->instance(\App\Interfaces\LlmServiceInterface::class, $this->llmServiceMock);

        $this->user = User::forceCreate([
            'name' => 'Researcher Test',
            'email' => 'researcher@test.com',
            'password' => bcrypt('password'),
            'role' => 'researcher'
        ]);
    }

    public function test_chat_returns_successful_response()
    {
        $question = "What is transformer?";
        
        $ragResponse = new RagResponse(
            answer: "Transformers are AI models.",
            citations: [
                new Citation(1, "Attention Is All You Need", 2017, "10.1234/test")
            ],
            maxSimilarity: 0.95,
            retrievedChunks: 3,
            usedTopK: 5,
            usedThreshold: 0.7,
            hasContext: true
        );

        $this->ragServiceMock->expects($this->once())
            ->method('generateAnswer')
            ->with($question)
            ->willReturn($ragResponse);

        $response = $this->actingAs($this->user)->postJson('/api/chat', [
            'question' => $question
        ]);

        $response->assertStatus(200);
        $response->assertJson([
            'success' => true,
            'data' => [
                'answer' => "Transformers are AI models.",
                'hasContext' => true,
                'maxSimilarity' => 0.95,
                'retrievedChunks' => 3,
                'usedTopK' => 5,
                'usedThreshold' => 0.7,
            ]
        ]);
        
        $response->assertJsonCount(1, 'data.citations');
        $this->assertEquals('Attention Is All You Need', $response->json('data.citations.0.title'));
    }

    public function test_chat_requires_question()
    {
        $this->ragServiceMock->expects($this->never())->method('generateAnswer');

        $response = $this->actingAs($this->user)->postJson('/api/chat', []);

        $response->assertStatus(422);
        $response->assertJsonStructure(['error' => ['details' => ['question']]]);
        $response->assertJsonPath('error.code', 'VALIDATION_ERROR');
    }

    public function test_chat_question_must_be_at_least_3_chars()
    {
        $this->ragServiceMock->expects($this->never())->method('generateAnswer');

        $response = $this->actingAs($this->user)->postJson('/api/chat', [
            'question' => 'ab'
        ]);

        $response->assertStatus(422);
        $response->assertJsonStructure(['error' => ['details' => ['question']]]);
        $response->assertJsonPath('error.code', 'VALIDATION_ERROR');
    }

    public function test_chat_question_cannot_exceed_max_chars()
    {
        $response = $this->actingAs($this->user)->postJson('/api/chat', [
            'question' => str_repeat('a', 5001),
        ]);

        $response->assertStatus(422)
            ->assertJsonStructure(['error' => ['details' => ['question']]]);
    }

    public function test_chat_targeted_to_paper_id()
    {
        $paper = \App\Models\ResearchPaper::forceCreate([
            'title' => 'Attention Is All You Need',
            'abstract' => 'Transformer architecture abstract...',
            'published_year' => 2017,
            'citations_count' => 100,
            'source' => 'Semantic Scholar',
        ]);

        $chunk = \App\Models\PaperChunk::forceCreate([
            'paper_id' => $paper->id,
            'content' => 'This is a transformer chunk content.'
        ]);

        $this->llmServiceMock->expects($this->once())
            ->method('generate')
            ->with($this->callback(function ($prompt) use ($paper) {
                return str_contains($prompt, $paper->title) && str_contains($prompt, 'This is a transformer chunk content.');
            }))
            ->willReturn(new \App\DTOs\LlmResponse("According to the paper, transformer chunk content is here.", "stop"));

        $response = $this->actingAs($this->user)->postJson('/api/chat', [
            'question' => "What is the chunk content?",
            'paper_id' => $paper->id
        ]);

        $response->assertStatus(200);
        $response->assertJson([
            'success' => true,
            'data' => [
                'answer' => "According to the paper, transformer chunk content is here.",
                'hasContext' => true,
                'maxSimilarity' => 1.0,
                'retrievedChunks' => 1,
            ]
        ]);
        
        $response->assertJsonCount(1, 'data.citations');
        $this->assertEquals('Attention Is All You Need', $response->json('data.citations.0.title'));
    }
}
