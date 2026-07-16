<?php

namespace Tests\Feature;

use App\DTOs\LlmResponse;
use App\Interfaces\LlmServiceInterface;
use App\Models\User;
use App\Models\ResearchPaper;
use App\Models\PaperChunk;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CompareControllerTest extends TestCase
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
    }

    public function test_compare_endpoint_requires_authentication()
    {
        $response = $this->postJson('/api/compare', [
            'paper_ids' => [1, 2]
        ]);

        $response->assertStatus(500); // Handled by Sanctum / Custom exception mapping
    }

    public function test_compare_endpoint_validates_paper_ids()
    {
        $this->actingAs($this->user);

        // Less than 2 papers
        $response = $this->postJson('/api/compare', [
            'paper_ids' => [1]
        ]);
        $response->assertStatus(422);

        // More than 3 papers
        $response = $this->postJson('/api/compare', [
            'paper_ids' => [1, 2, 3, 4]
        ]);
        $response->assertStatus(422);
    }

    public function test_compare_endpoint_performs_comparison_successfully()
    {
        $this->actingAs($this->user);

        // Seed papers in DB
        $paper1 = ResearchPaper::forceCreate([
            'title' => 'Paper A',
            'abstract' => 'Abstract A',
            'published_year' => 2024
        ]);
        $paper2 = ResearchPaper::forceCreate([
            'title' => 'Paper B',
            'abstract' => 'Abstract B',
            'published_year' => 2025
        ]);

        PaperChunk::forceCreate([
            'paper_id' => $paper1->id,
            'content' => 'Chunk content A'
        ]);

        PaperChunk::forceCreate([
            'paper_id' => $paper2->id,
            'content' => 'Chunk content B'
        ]);

        $mockMarkdown = "| Tiêu chí | Paper A | Paper B |\n| --- | --- | --- |\n| Ưu điểm | Nhanh | Chậm |";

        $this->llmServiceMock->expects($this->once())
            ->method('generate')
            ->willReturn(new LlmResponse($mockMarkdown, 'stop'));

        $response = $this->postJson('/api/compare', [
            'paper_ids' => [$paper1->id, $paper2->id]
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'markdownTable' => $mockMarkdown
                ]
            ]);
    }
}
