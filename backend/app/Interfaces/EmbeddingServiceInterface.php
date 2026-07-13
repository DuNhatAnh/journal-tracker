<?php

namespace App\Interfaces;

use App\Exceptions\AiServiceException;

interface EmbeddingServiceInterface
{
    /**
     * Lấy Vector cho 1 chuỗi văn bản.
     *
     * @param string $text
     * @return list<float>
     * @throws AiServiceException
     */
    public function getEmbedding(string $text): array;

    /**
     * Lấy Vector cho nhiều chuỗi văn bản (Batch).
     *
     * @param list<string> $texts
     * @return list<list<float>>
     * @throws AiServiceException
     */
    public function getEmbeddings(array $texts): array;
}
