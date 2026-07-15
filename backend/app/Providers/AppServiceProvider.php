<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use App\Interfaces\RetrievalServiceInterface;
use App\Services\RetrievalService;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register services.
     */
    public function register(): void
    {
        $this->app->singleton(\App\Interfaces\EmbeddingServiceInterface::class, function ($app) {
            $driver = config('services.ai.driver', 'gemini');
            return $driver === 'ollama'
                ? $app->make(\App\Services\Ai\OllamaService::class)
                : $app->make(\App\Services\Ai\GeminiService::class);
        });

        $this->app->singleton(\App\Interfaces\LlmServiceInterface::class, function ($app) {
            $driver = config('services.ai.driver', 'gemini');
            return $driver === 'ollama'
                ? $app->make(\App\Services\Ai\OllamaService::class)
                : $app->make(\App\Services\Ai\GeminiService::class);
        });
        $this->app->singleton(RetrievalServiceInterface::class, RetrievalService::class);
        $this->app->singleton(\App\Interfaces\PaperRepositoryInterface::class, \App\Repositories\PaperRepository::class);
        $this->app->singleton(\App\Interfaces\PromptBuilderInterface::class, \App\Services\PromptBuilderService::class);
        $this->app->singleton(\App\Interfaces\RagServiceInterface::class, \App\Services\RagService::class);

    }

    /**
     * Bootstrap services.
     */
    public function boot(): void
    {
        if (env('APP_URL')) {
            \Illuminate\Support\Facades\URL::forceRootUrl(env('APP_URL'));
        }
    }
}
