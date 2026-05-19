<?php

namespace App\Services;

use App\Models\User;
use App\Models\ResearchPaper;
use App\Models\Notification;

class NotificationService
{
    /**
     * Check if a newly synced paper matches user followed keywords
     * and generate notifications.
     */
    public function notifyUsersForPaper(ResearchPaper $paper): void
    {
        // Pluck the IDs of all keywords associated with this paper
        $keywordIds = $paper->keywords()->pluck('keywords.id');

        if ($keywordIds->isEmpty()) {
            return;
        }

        // Find users who follow at least one of these keywords
        $users = User::whereHas('followedKeywords', function ($query) use ($keywordIds) {
            $query->whereIn('keywords.id', $keywordIds);
        })->get();

        foreach ($users as $user) {
            // Find which matching keywords this user is following
            $matchingKeywords = $user->followedKeywords()
                ->whereIn('keywords.id', $keywordIds)
                ->pluck('name')
                ->implode(', ');

            // Generate the notification
            Notification::create([
                'user_id' => $user->id,
                'title'   => 'Bài báo mới liên quan đến từ khóa của bạn',
                'content' => "Bài báo mới \"{$paper->title}\" đã được đồng bộ, phù hợp với các từ khóa bạn đang quan tâm: {$matchingKeywords}.",
                'type'    => 'info',
                'is_read' => false,
            ]);
        }
    }
}
