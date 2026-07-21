<?php

return [
    'default_top_k' => 5,
    'default_min_similarity' => 0.55,
    'max_top_k' => 20,
    
    // System Prompt Template
    // %context% will be replaced by the PromptBuilder
    'system_prompt_template' => "Chỉ sử dụng các thông tin được cung cấp trong Context dưới đây để trả lời. Nếu không có thông tin, hãy nói 'Tôi không tìm thấy thông tin'. Tuyệt đối không tự bịa thông tin.\n\n--- CONTEXT ---\n%context%\n--- END CONTEXT ---",

    'ai_driver' => env('AI_DRIVER', 'gemini'),
    'gemini_api_key' => env('GEMINI_API_KEY'),
    'gemini_chat_model' => env('GEMINI_CHAT_MODEL', 'gemini-3.5-flash'),
    'gemini_embedding_model' => env('GEMINI_EMBEDDING_MODEL', 'text-embedding-004'),
    
    'ollama_base_url' => env('OLLAMA_BASE_URL', 'http://localhost:11434'),
    'ollama_chat_model' => env('OLLAMA_CHAT_MODEL', 'llama3'),
    'ollama_embedding_model' => env('OLLAMA_EMBEDDING_MODEL', 'nomic-embed-text'),
];
