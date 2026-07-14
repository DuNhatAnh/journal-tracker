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
        $this->app->singleton(\App\Interfaces\EmbeddingServiceInterface::class, \App\Services\Ai\GeminiService::class);
        $this->app->singleton(\App\Interfaces\LlmServiceInterface::class, \App\Services\Ai\GeminiService::class);
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
