<?php

namespace App\DTOs;

class Citation
{
    public function __construct(
        public readonly int $paperId,
        public readonly string $title,
        public readonly ?int $publishedYear,
        public readonly ?string $doi,
    ) {}
}
