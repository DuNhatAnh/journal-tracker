<?php

namespace App\DTOs;

class LlmResponse
{
    /**
     * @param string $content Nội dung do LLM sinh ra
     * @param string|null $finishReason Trạng thái kết thúc (e.g. 'stop', 'length')
     */
    public function __construct(
        public readonly string $content,
        public readonly ?string $finishReason = null
    ) {}
}
