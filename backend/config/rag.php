<?php

return [
    'default_top_k' => 5,
    'default_min_similarity' => 0.7,
    'max_top_k' => 20,
    
    // System Prompt Template
    // %context% will be replaced by the PromptBuilder
    'system_prompt_template' => "Chỉ sử dụng các thông tin được cung cấp trong Context dưới đây để trả lời. Nếu không có thông tin, hãy nói 'Tôi không tìm thấy thông tin'. Tuyệt đối không tự bịa thông tin.\n\n--- CONTEXT ---\n%context%\n--- END CONTEXT ---",
];
