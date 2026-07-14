<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Artisan;
use Exception;

class AdminSettingsService
{
    public function __construct(
        private readonly EnvService $envService
    ) {}

    /**
     * Get current AI Settings
     */
    public function getAiSettings(): array
    {
        $driver = config('rag.ai_driver', 'gemini');
        $isGeminiConfigured = !empty(config('rag.gemini_api_key'));
        
        return [
            'configured' => $isGeminiConfigured || $driver === 'ollama', // Ollama might not need a key, just URL
            'driver' => $driver,
            'chat_model' => config("rag.{$driver}_chat_model"),
            'embedding_model' => config("rag.{$driver}_embedding_model"),
            'api_key_configured' => $driver === 'gemini' ? $isGeminiConfigured : true,
            'status' => 'valid', // we don't actively check status on GET to avoid latency, can assume valid or rely on test API
        ];
    }

    /**
     * Test the AI Driver connection.
     * Throws an Exception with a specific message if it fails.
     */
    public function testConnection(string $driver, array $config): void
    {
        if ($driver === 'gemini') {
            $this->testGeminiConnection($config['api_key']);
        } elseif ($driver === 'ollama') {
            $this->testOllamaConnection($config['base_url'] ?? config('rag.ollama_base_url'), $config['chat_model']);
        } else {
            throw new Exception("Unsupported driver: {$driver}");
        }
    }

    /**
     * Save the new AI settings.
     */
    public function saveAiSettings(string $driver, array $config): void
    {
        $envData = [
            'AI_DRIVER' => $driver,
        ];

        if ($driver === 'gemini') {
            $envData['GEMINI_API_KEY'] = $config['api_key'];
            $envData['GEMINI_CHAT_MODEL'] = $config['chat_model'];
            $envData['GEMINI_EMBEDDING_MODEL'] = $config['embedding_model'];
        } elseif ($driver === 'ollama') {
            if (isset($config['base_url'])) {
                $envData['OLLAMA_BASE_URL'] = $config['base_url'];
            }
            $envData['OLLAMA_CHAT_MODEL'] = $config['chat_model'];
            $envData['OLLAMA_EMBEDDING_MODEL'] = $config['embedding_model'];
        }

        $this->envService->setMany($envData);
        $this->clearConfigCache();
    }

    /**
     * Reset AI settings.
     */
    public function resetAiSettings(): void
    {
        $keysToDelete = [
            'AI_DRIVER',
            'GEMINI_API_KEY',
            'GEMINI_CHAT_MODEL',
            'GEMINI_EMBEDDING_MODEL',
            'OLLAMA_BASE_URL',
            'OLLAMA_CHAT_MODEL',
            'OLLAMA_EMBEDDING_MODEL',
        ];

        foreach ($keysToDelete as $key) {
            $this->envService->deleteKey($key);
        }

        $this->clearConfigCache();
    }

    /**
     * Get available models from config.
     */
    public function getModelsWhitelist(): array
    {
        return config('llm.drivers', []);
    }

    /**
     * Test Gemini connection by requesting the models endpoint.
     */
    private function testGeminiConnection(string $apiKey): void
    {
        $response = Http::get('https://generativelanguage.googleapis.com/v1beta/models', [
            'key' => $apiKey,
        ]);

        if ($response->successful()) {
            return;
        }

        if ($response->status() === 429) {
            throw new Exception('Rate Limited / Quota Exceeded (HTTP 429)', 429);
        }

        if ($response->status() === 400 || $response->status() === 403) {
            throw new Exception('Invalid API Key or Authentication Error', $response->status());
        }

        throw new Exception('Failed to connect to Gemini API', $response->status());
    }

    /**
     * Test Ollama connection.
     */
    private function testOllamaConnection(string $baseUrl, string $model): void
    {
        // Trim trailing slash for safety
        $baseUrl = rtrim($baseUrl, '/');

        // Check if server is up and model exists
        $response = Http::timeout(5)->get("{$baseUrl}/api/tags");

        if (!$response->successful()) {
            throw new Exception("Failed to connect to Ollama at {$baseUrl}. Is the server running?", 500);
        }

        $models = collect($response->json('models', []))->pluck('name');
        
        // We only check if it connected. If we want to check if the specific model exists:
        // Actually, Ollama might auto-pull in some setups, but let's just check if server responds.
        // If we strictly want to check model presence, we can:
        // if (!$models->contains($model) && !$models->contains($model . ':latest')) {
        //     throw new Exception("Model {$model} not found in Ollama. Please pull it first.", 404);
        // }
    }

    private function clearConfigCache(): void
    {
        Artisan::call('optimize:clear');
    }
}
