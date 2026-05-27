<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Cache;
use App\Models\ResearchPaper;
use App\Models\Keyword;

class WarmDashboardStats extends Command
{
    protected $signature = 'dashboard:warm-stats';

    protected $description = 'Warm/recalculate the general dashboard stats cache';

    public function handle(): void
    {
        $this->info("🔄 Warming general dashboard stats cache...");

        $yesterday = now()->subDay();

        $total_papers = \App\Models\SystemCounter::getValue('total_papers');
        if ($total_papers === 0) {
            $total_papers = ResearchPaper::count();
            \App\Models\SystemCounter::updateOrCreate(['key' => 'total_papers'], ['value' => $total_papers]);
        }
        $papers_new = ResearchPaper::where('created_at', '>=', $yesterday)->count();
        $papers_prev = max(1, $total_papers - $papers_new);
        $papers_percent = $papers_new > 0 ? round(($papers_new / $papers_prev) * 100, 1) : 0;

        $total_keywords = \App\Models\SystemCounter::getValue('total_keywords');
        if ($total_keywords === 0) {
            $total_keywords = Keyword::count();
            \App\Models\SystemCounter::updateOrCreate(['key' => 'total_keywords'], ['value' => $total_keywords]);
        }
        $keywords_new = Keyword::where('created_at', '>=', $yesterday)->count();
        $keywords_prev = max(1, $total_keywords - $keywords_new);
        $keywords_percent = $keywords_new > 0 ? round(($keywords_new / $keywords_prev) * 100, 1) : 0;

        $papers_this_year = ResearchPaper::where('published_year', now()->year)->count();
        $papers_this_year_new = ResearchPaper::where('published_year', now()->year)->where('created_at', '>=', $yesterday)->count();

        $stats = [
            'total_papers'         => $total_papers,
            'papers_percent'       => $papers_percent > 0 ? "+{$papers_percent}%" : "0%",
            'total_keywords'       => $total_keywords,
            'keywords_percent'     => $keywords_percent > 0 ? "+{$keywords_percent}%" : "0%",
            'papers_this_year'     => $papers_this_year,
            'papers_this_year_new' => $papers_this_year_new,
        ];

        // Put the stats into cache (dash.stats_v4) for 30 minutes (1800s)
        Cache::put('dash.stats_v4', $stats, 1800);

        $this->info("✅ General dashboard stats cache warmed successfully!");
        $this->line(json_encode($stats, JSON_PRETTY_PRINT));
    }
}
