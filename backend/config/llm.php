<?php

return [
    'drivers' => [
        'gemini' => [
            'default_chat_model' => 'gemini-2.5-flash',
            'default_embedding_model' => 'text-embedding-004',
            'chat_models' => [
                'gemini-1.5-pro',
                'gemini-1.5-flash',
                'gemini-2.5-flash',
            ],
            'embedding_models' => [
                'text-embedding-004',
            ],
        ],
        'ollama' => [
            'default_chat_model' => 'llama3',
            'default_embedding_model' => 'nomic-embed-text',
            'chat_models' => [
                'llama3',
                'mistral',
            ],
            'embedding_models' => [
                'nomic-embed-text',
            ],
        ],
    ],
];
