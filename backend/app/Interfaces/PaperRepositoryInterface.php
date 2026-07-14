<?php

namespace App\Interfaces;

use Illuminate\Support\Collection;

interface PaperRepositoryInterface
{
    /**
     * Get papers by their IDs.
     *
     * @param array $paperIds
     * @return Collection
     */
    public function getByIds(array $paperIds): Collection;
}
