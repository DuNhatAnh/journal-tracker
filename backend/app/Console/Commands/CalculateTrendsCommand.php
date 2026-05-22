<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use App\Models\PublicationTrend;

class CalculateTrendsCommand extends Command
{
    protected $signature = 'trends:calculate';

    protected $description = 'Calculate annual publication and citation growth rates for keywords (bulk upsert)';

    public function handle(): void
    {
        $this->info("📈 Starting bulk trend calculations...");

        // 1. Fetch all aggregated data at once
        $aggregated = DB::table('keyword_paper')
            ->join('research_papers', 'keyword_paper.paper_id', '=', 'research_papers.id')
            ->selectRaw('keyword_paper.keyword_id, research_papers.published_year, COUNT(*) as count, SUM(research_papers.citations_count) as citations')
            ->groupBy('keyword_paper.keyword_id', 'research_papers.published_year')
            ->orderBy('keyword_paper.keyword_id')
            ->orderBy('research_papers.published_year')
            ->get()
            ->groupBy('keyword_id');

        $this->info("Found " . $aggregated->count() . " keywords with papers to process.");

        $recordsToUpsert = [];
        $now = now();

        foreach ($aggregated as $keywordId => $records) {
            $sortedRecords = $records->sortBy('published_year');
            $prevPaperCount = 0;

            foreach ($sortedRecords as $record) {
                $year = (int) $record->published_year;
                $paperCount = (int) $record->count;
                $citationCount = (int) ($record->citations ?? 0);

                // Calculate YoY Growth Rate
                $growthRate = 0.0;
                if ($prevPaperCount > 0) {
                    $growthRate = (($paperCount - $prevPaperCount) / $prevPaperCount) * 100.0;
                }

                $recordsToUpsert[] = [
                    'keyword_id'     => $keywordId,
                    'year'           => $year,
                    'paper_count'    => $paperCount,
                    'citation_count' => $citationCount,
                    'growth_rate'    => round($growthRate, 2),
                    'created_at'     => $now,
                    'updated_at'     => $now,
                ];

                $prevPaperCount = $paperCount;
            }
        }

        if (count($recordsToUpsert) > 0) {
            $this->info("Upserting " . count($recordsToUpsert) . " trend records into DB...");
            
            // Perform bulk upsert in chunks of 500 records
            foreach (array_chunk($recordsToUpsert, 500) as $chunk) {
                PublicationTrend::upsert(
                    $chunk,
                    ['keyword_id', 'year'],
                    ['paper_count', 'citation_count', 'growth_rate', 'updated_at']
                );
            }
            
            $this->info("✅ Successfully upserted trend records.");
        } else {
            $this->warn("⚠️ No trend records found to calculate.");
        }

        $this->info("✅ Trend calculation completed successfully!");
    }
}
