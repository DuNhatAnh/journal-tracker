<?php

namespace App\DTOs;

class PaperContext
{
    /**
     * @param Citation $citation
     * @param RetrievalResult[] $chunks
     */
    public function __construct(
        public readonly Citation $citation,
        public readonly array $chunks
    ) {}
}
