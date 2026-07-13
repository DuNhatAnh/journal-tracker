<?php

namespace App\Interfaces;

use App\DTOs\LlmResponse;
use App\Exceptions\AiServiceException;

interface LlmServiceInterface
{
    /**
     * Gửi prompt và nhận về kết quả từ LLM.
     *
     * @param string $prompt
     * @return LlmResponse
     * @throws AiServiceException
     */
    public function generate(string $prompt): LlmResponse;
}
