<?php

namespace App\Services;

use App\DTOs\RetrievedContext;
use App\Interfaces\PromptBuilderInterface;

class PromptBuilderService implements PromptBuilderInterface
{
    /**
     * @inheritDoc
     */
    public function buildPrompt(RetrievedContext $context): string
    {
        $template = config('rag.system_prompt_template');
        
        if (empty($context->paperContexts)) {
            return str_replace('%context%', '', $template);
        }

        $contextStringParts = [];

        foreach ($context->paperContexts as $paperContext) {
            $citation = $paperContext->citation;
            
            $yearStr = $citation->publishedYear ? "({$citation->publishedYear})" : "(Unknown Year)";
            $titleLine = "[Paper {$citation->paperId}] Title: {$citation->title} {$yearStr}";
            
            if ($citation->doi) {
                $titleLine .= " | DOI: {$citation->doi}";
            }
            
            $contextStringParts[] = $titleLine;

            foreach ($paperContext->chunks as $chunk) {
                $contextStringParts[] = "- Chunk: " . trim($chunk->content);
            }
            
            $contextStringParts[] = ""; // Empty line between papers
        }

        $contextString = trim(implode("\n", $contextStringParts));
        
        return str_replace('%context%', $contextString, $template);
    }
}
