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
];
