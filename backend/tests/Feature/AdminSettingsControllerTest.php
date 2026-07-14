<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Artisan;
use App\Models\User;
use Tests\TestCase;

class AdminSettingsControllerTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;

    protected function setUp(): void
    {
        parent::setUp();
        
        // Ensure test config for LLM exists
        config(['llm.drivers' => [
            'gemini' => [
                'default_chat_model' => 'gemini-test',
                'default_embedding_model' => 'embed-test',
                'chat_models' => ['gemini-test'],
                'embedding_models' => ['embed-test'],
            ],
            'ollama' => [
                'default_chat_model' => 'llama-test',
                'default_embedding_model' => 'embed-test',
                'chat_models' => ['llama-test'],
                'embedding_models' => ['embed-test'],
            ]
        ]]);

        $this->admin = User::forceCreate([
            'name' => 'Admin Test',
            'email' => 'admin@test.com',
            'password' => bcrypt('password'),
            'role' => 'admin'
        ]);
    }

    public function test_get_models_whitelist()
    {
        $response = $this->actingAs($this->admin)->getJson('/api/admin/settings/ai/models');

        $response->assertStatus(200)
                 ->assertJsonStructure([
                     'gemini' => ['default_chat_model', 'chat_models', 'embedding_models'],
                     'ollama' => ['default_chat_model', 'chat_models', 'embedding_models'],
                 ]);
    }

    public function test_get_current_ai_settings_hides_api_key()
    {
        config(['rag.ai_driver' => 'gemini']);
        config(['rag.gemini_api_key' => 'AIza-secret']);

        $response = $this->actingAs($this->admin)->getJson('/api/admin/settings/ai');

        $response->assertStatus(200)
                 ->assertJson([
                     'driver' => 'gemini',
                     'api_key_configured' => true,
                     'configured' => true
                 ])
                 ->assertJsonMissing(['api_key' => 'AIza-secret']);
    }

    public function test_update_settings_validates_models_against_whitelist()
    {
        $response = $this->actingAs($this->admin)->postJson('/api/admin/settings/ai', [
            'driver' => 'gemini',
            'api_key' => 'AIza123',
            'chat_model' => 'invalid-model',
            'embedding_model' => 'invalid-embed'
        ]);

        $response->assertStatus(422)
                 ->assertJsonStructure(['error' => ['details' => ['chat_model', 'embedding_model']]]);
    }

    public function test_update_settings_sanitizes_api_key_and_tests_connection()
    {
        // Mock successful Gemini response
        Http::fake([
            'generativelanguage.googleapis.com/*' => Http::response(['models' => []], 200)
        ]);

        $response = $this->actingAs($this->admin)->postJson('/api/admin/settings/ai', [
            'driver' => 'gemini',
            'api_key' => '   AIza123   ', // spaces will be trimmed
            'chat_model' => 'gemini-test',
            'embedding_model' => 'embed-test'
        ]);

        $response->assertStatus(200);

        Http::assertSent(function ($request) {
            return $request->url() == 'https://generativelanguage.googleapis.com/v1beta/models?key=AIza123';
        });
    }

    public function test_test_connection_endpoint_returns_429_on_quota_exceeded()
    {
        Http::fake([
            'generativelanguage.googleapis.com/*' => Http::response([], 429)
        ]);

        $response = $this->actingAs($this->admin)->postJson('/api/admin/settings/ai/test', [
            'driver' => 'gemini',
            'api_key' => 'AIza123',
            'chat_model' => 'gemini-test',
            'embedding_model' => 'embed-test'
        ]);

        $response->assertStatus(429)
                 ->assertJsonFragment([
                     'status' => 'invalid',
                     'message' => 'Rate Limited / Quota Exceeded (HTTP 429)'
                 ]);
    }

    public function test_reset_ai_settings()
    {
        $response = $this->actingAs($this->admin)->deleteJson('/api/admin/settings/ai');

        $response->assertStatus(200);
        // We'd ideally mock EnvService or check file, but controller response is fine for now
    }
}
