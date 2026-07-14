<?php

namespace App\DTOs;

class RetrievedContext
{
    /**
     * @param PaperContext[] $paperContexts
     */
    public function __construct(
        public readonly array $paperContexts
    ) {}
}
