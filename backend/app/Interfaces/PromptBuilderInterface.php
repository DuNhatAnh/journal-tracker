<?php

namespace App\Interfaces;

use App\DTOs\RetrievedContext;

interface PromptBuilderInterface
{
    /**
     * Build the final system prompt from the retrieved context.
     *
     * @param RetrievedContext $context
     * @return string
     */
    public function buildPrompt(RetrievedContext $context): string;
}
