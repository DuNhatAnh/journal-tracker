<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register services.
     */
    public function register(): void
    {
        $this->app->singleton(\App\Interfaces\EmbeddingServiceInterface::class, \App\Services\Ai\GeminiService::class);
        $this->app->singleton(\App\Interfaces\LlmServiceInterface::class, \App\Services\Ai\GeminiService::class);
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
