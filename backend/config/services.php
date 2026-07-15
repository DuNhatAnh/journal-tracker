<?php

return [
    'openalex' => [
        'base_url' => env('OPENALEX_BASE_URL', 'https://api.openalex.org'),
        'email'    => env('OPENALEX_EMAIL', 'admin@example.com'),
    ],

    'semantic_scholar' => [
        'base_url' => env('SEMANTIC_SCHOLAR_BASE_URL', 'https://api.semanticscholar.org/graph/v1'),
        'api_key'  => env('SEMANTIC_SCHOLAR_API_KEY'),
    ],

    'crossref' => [
        'base_url' => env('CROSSREF_BASE_URL', 'https://api.crossref.org'),
        'mailto'   => env('CROSSREF_MAILTO'),
    ],

    'google' => [
        'client_id'     => env('GOOGLE_CLIENT_ID'),
        'client_secret' => env('GOOGLE_CLIENT_SECRET'),
        'redirect'      => env('GOOGLE_REDIRECT_URI'),
    ],

    'gemini' => [
        'api_key' => env('GEMINI_API_KEY'),
        'embedding_model' => env('GEMINI_EMBEDDING_MODEL', 'gemini-embedding-001'),
        'chat_model' => env('GEMINI_CHAT_MODEL', 'gemini-2.5-flash'),
        'embedding_dimensions' => env('GEMINI_EMBEDDING_DIMENSIONS', 768),
    ],

    'ollama' => [
        'base_url' => env('OLLAMA_BASE_URL', 'http://host.docker.internal:11434'),
        'embedding_model' => env('OLLAMA_EMBEDDING_MODEL', 'nomic-embed-text'),
        'chat_model' => env('OLLAMA_CHAT_MODEL', 'qwen2.5:3b'),
    ],

    'ai' => [
        'driver' => env('AI_DRIVER', 'gemini'),
    ],
];
