<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\User;
use App\Models\Bookmark;
use App\Models\ResearchPaper;
use App\Models\Notification;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class SendTrendingNotifications extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'papers:trending-notify';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Send weekly trending papers notifications to users';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Calculating trending papers...');

        // Get top 5 most bookmarked papers in the last 7 days
        $sevenDaysAgo = Carbon::now()->subDays(7);

        $trendingPaperIds = Bookmark::where('created_at', '>=', $sevenDaysAgo)
            ->select('paper_id', DB::raw('count(*) as total'))
            ->groupBy('paper_id')
            ->orderByDesc('total')
            ->limit(5)
            ->pluck('paper_id');

        if ($trendingPaperIds->isEmpty()) {
            $this->info('No trending papers found this week.');
            return;
        }

        $trendingPapers = ResearchPaper::whereIn('id', $trendingPaperIds)->get();

        if ($trendingPapers->isEmpty()) {
            $this->info('Trending papers no longer exist.');
            return;
        }

        // Notify users who have notify_trending enabled (default true)
        // Since we cannot query json column effectively across all DB types without specific syntax,
        // we fetch all users and check in PHP (or we can use JSON query if Postgres/MySQL is guaranteed).
        // Since this is a small-medium app, we can fetch users in chunks.
        
        $paperTitles = $trendingPapers->pluck('title')->map(fn($t) => "- {$t}")->implode("\n");
        $topPaper = $trendingPapers->first();
        
        $this->info('Sending notifications to users...');

        User::chunk(100, function ($users) use ($topPaper, $paperTitles, $trendingPaperIds) {
            foreach ($users as $user) {
                $settings = $user->settings ?? [];
                $notifyTrending = $settings['notify_trending'] ?? true;

                if ($notifyTrending) {
                    Notification::create([
                        'user_id' => $user->id,
                        'title'   => 'Xu hướng nghiên cứu tuần này',
                        'content' => "Bài báo \"{$topPaper->title}\" và các bài báo khác đang nhận được nhiều sự quan tâm tuần này. Khám phá ngay!",
                        'type'    => 'trend',
                        'data'    => [
                            'filter_type'  => 'trending',
                            'filter_value' => true
                        ]
                    ]);
                }
            }
        });

        $this->info('Trending notifications sent successfully!');
    }
}
