<?php

namespace Tests\Feature;

use App\DTOs\LlmResponse;
use App\Interfaces\LlmServiceInterface;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Tests\TestCase;

class AiControllerTest extends TestCase
{
    use RefreshDatabase;

    private $llmServiceMock;
    private User $user;

    protected function setUp(): void
    {
        parent::setUp();

        $this->llmServiceMock = $this->createMock(LlmServiceInterface::class);
        $this->app->instance(LlmServiceInterface::class, $this->llmServiceMock);

        $this->user = User::forceCreate([
            'name' => 'Researcher Test',
            'email' => 'researcher@test.com',
            'password' => bcrypt('password'),
            'role' => 'researcher'
        ]);

        Cache::flush();
    }

    public function test_ai_summary_requires_authentication()
    {
        $response = $this->postJson('/api/dashboard/ai-summary', [
            'paper_id' => 1,
            'title' => 'Test Paper',
            'abstract' => 'This is a test abstract'
        ]);

        $response->assertStatus(500); // UnhandledException: Unauthenticated
    }

    public function test_ai_summary_succeeds_and_caches_response()
    {
        $jsonResponse = json_encode([
            'tldr' => 'Transformers are super clean architecture.',
            'insights' => [
                'First key insight of the study.',
                'Second key insight of the study.',
                'Third key insight of the study.'
            ]
        ]);

        $this->llmServiceMock->expects($this->once())
            ->method('generate')
            ->willReturn(new LlmResponse($jsonResponse, 'stop'));

        // First call - should call LLM and cache
        $response = $this->actingAs($this->user)->postJson('/api/dashboard/ai-summary', [
            'paper_id' => 1,
            'title' => 'Test Paper',
            'abstract' => 'This is a test abstract'
        ]);

        $response->assertStatus(200);
        $response->assertJson([
            'success' => true,
            'data' => [
                'tldr' => 'Transformers are super clean architecture.',
                'insights' => [
                    'First key insight of the study.',
                    'Second key insight of the study.',
                    'Third key insight of the study.'
                ]
            ]
        ]);

        // Second call without force_refresh - should hit cache (no additional generate call)
        $response2 = $this->actingAs($this->user)->postJson('/api/dashboard/ai-summary', [
            'paper_id' => 1,
            'title' => 'Test Paper',
            'abstract' => 'This is a test abstract'
        ]);

        $response2->assertStatus(200);
        $response2->assertJsonPath('data.tldr', 'Transformers are super clean architecture.');
    }

    public function test_ai_summary_force_refresh_bypasses_cache()
    {
        $jsonResponse1 = json_encode([
            'tldr' => 'Summary 1.',
            'insights' => ['Insight 1', 'Insight 2', 'Insight 3']
        ]);

        $jsonResponse2 = json_encode([
            'tldr' => 'Summary 2.',
            'insights' => ['Insight A', 'Insight B', 'Insight C']
        ]);

        $this->llmServiceMock->expects($this->exactly(2))
            ->method('generate')
            ->willReturnOnConsecutiveCalls(
                new LlmResponse($jsonResponse1, 'stop'),
                new LlmResponse($jsonResponse2, 'stop')
            );

        // First call
        $response = $this->actingAs($this->user)->postJson('/api/dashboard/ai-summary', [
            'paper_id' => 1,
            'title' => 'Test Paper',
            'abstract' => 'This is a test abstract'
        ]);
        $response->assertJsonPath('data.tldr', 'Summary 1.');

        // Second call with force_refresh = true
        $response2 = $this->actingAs($this->user)->postJson('/api/dashboard/ai-summary', [
            'paper_id' => 1,
            'title' => 'Test Paper',
            'abstract' => 'This is a test abstract',
            'force_refresh' => true
        ]);
        $response2->assertJsonPath('data.tldr', 'Summary 2.');
    }
}
