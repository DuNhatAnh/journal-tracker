<?php

namespace App\Repositories;

use App\Interfaces\PaperRepositoryInterface;
use App\Models\ResearchPaper;
use Illuminate\Support\Collection;

class PaperRepository implements PaperRepositoryInterface
{
    /**
     * @inheritDoc
     */
    public function getByIds(array $paperIds): Collection
    {
        if (empty($paperIds)) {
            return collect();
        }

        return ResearchPaper::whereIn('id', $paperIds)
            ->select(['id', 'title', 'published_year', 'doi'])
            ->get();
    }
}
