<?php

namespace App\Services;

use App\Models\User;
use App\Models\ResearchPaper;
use App\Models\Notification;

class NotificationService
{
    /**
     * Group notifications for a batch of newly synced papers.
     */
    public function notifyBatch(array $paperIds): void
    {
        if (empty($paperIds)) return;

        // Fetch papers with their relationships
        $papers = ResearchPaper::with(['keywords', 'journal', 'authors'])
            ->whereIn('id', $paperIds)
            ->get();

        if ($papers->isEmpty()) return;

        $journalIds = [];
        $keywordIds = [];
        $authorIds = [];
        
        foreach ($papers as $paper) {
            if ($paper->journal_id) {
                $journalIds[] = $paper->journal_id;
            }
            foreach ($paper->keywords as $keyword) {
                $keywordIds[] = $keyword->id;
            }
            foreach ($paper->authors as $author) {
                $authorIds[] = $author->id;
            }
        }

        $journalIds = array_unique($journalIds);
        $keywordIds = array_unique($keywordIds);
        $authorIds = array_unique($authorIds);

        // Fetch users who are interested in these journals, keywords, or authors,
        // and who have not disabled these notifications.
        $users = User::with(['followedJournals', 'followedKeywords', 'followedAuthors'])
            ->where(function ($query) use ($journalIds, $keywordIds, $authorIds) {
                if (!empty($journalIds)) {
                    $query->orWhereHas('followedJournals', function ($q) use ($journalIds) {
                        $q->whereIn('journals.id', $journalIds);
                    });
                }
                if (!empty($keywordIds)) {
                    $query->orWhereHas('followedKeywords', function ($q) use ($keywordIds) {
                        $q->whereIn('keywords.id', $keywordIds);
                    });
                }
                if (!empty($authorIds)) {
                    $query->orWhereHas('followedAuthors', function ($q) use ($authorIds) {
                        $q->whereIn('authors.id', $authorIds);
                    });
                }
            })
            ->get();

        foreach ($users as $user) {
            $settings = $user->settings ?? [];
            $notifyJournal = $settings['notify_journal'] ?? true;
            $notifyKeyword = $settings['notify_keyword'] ?? true;
            $notifyAuthor = $settings['notify_author'] ?? true;

            // 1. Process Journals
            if ($notifyJournal && !empty($journalIds)) {
                $userFollowedJournalIds = $user->followedJournals->pluck('id')->toArray();
                $matchedJournalIds = array_intersect($journalIds, $userFollowedJournalIds);
                
                if (!empty($matchedJournalIds)) {
                    $matchedPapers = $papers->filter(fn($p) => in_array($p->journal_id, $matchedJournalIds));
                    if ($matchedPapers->isNotEmpty()) {
                        $paperCount = $matchedPapers->count();
                        $journalNames = $user->followedJournals->whereIn('id', $matchedJournalIds)->pluck('name')->toArray();
                        $journalNamesStr = implode(', ', $journalNames);
                        
                        Notification::create([
                            'user_id' => $user->id,
                            'title'   => 'Bài báo mới từ tạp chí bạn quan tâm',
                            'content' => "Tạp chí {$journalNamesStr} vừa có {$paperCount} bài báo mới được cập nhật.",
                            'type'    => 'publication',
                            'data'    => [
                                'filter_type'  => 'journals',
                                'filter_value' => $journalNames
                            ]
                        ]);
                    }
                }
            }

            // 2. Process Keywords
            if ($notifyKeyword && !empty($keywordIds)) {
                $userFollowedKeywordIds = $user->followedKeywords->pluck('id')->toArray();
                $matchedKeywordIds = array_intersect($keywordIds, $userFollowedKeywordIds);
                
                if (!empty($matchedKeywordIds)) {
                    $matchedPapersCount = 0;
                    foreach ($papers as $paper) {
                        $paperKeywordIds = $paper->keywords->pluck('id')->toArray();
                        if (!empty(array_intersect($paperKeywordIds, $matchedKeywordIds))) {
                            $matchedPapersCount++;
                        }
                    }

                    if ($matchedPapersCount > 0) {
                        $keywordNames = $user->followedKeywords->whereIn('id', $matchedKeywordIds)->pluck('name')->toArray();
                        $keywordNamesStr = implode(', ', $keywordNames);
                        
                        Notification::create([
                            'user_id' => $user->id,
                            'title'   => 'Bài báo mới thuộc chủ đề bạn quan tâm',
                            'content' => "Chủ đề {$keywordNamesStr} vừa có {$matchedPapersCount} bài báo mới được cập nhật.",
                            'type'    => 'publication',
                            'data'    => [
                                'filter_type'  => 'keywords',
                                'filter_value' => $keywordNames
                            ]
                        ]);
                    }
                }
            }

            // 3. Process Authors
            if ($notifyAuthor && !empty($authorIds)) {
                $userFollowedAuthorIds = $user->followedAuthors->pluck('id')->toArray();
                $matchedAuthorIds = array_intersect($authorIds, $userFollowedAuthorIds);
                
                if (!empty($matchedAuthorIds)) {
                    $matchedPapersCount = 0;
                    foreach ($papers as $paper) {
                        $paperAuthorIds = $paper->authors->pluck('id')->toArray();
                        if (!empty(array_intersect($paperAuthorIds, $matchedAuthorIds))) {
                            $matchedPapersCount++;
                        }
                    }

                    if ($matchedPapersCount > 0) {
                        $authorNames = $user->followedAuthors->whereIn('id', $matchedAuthorIds)->pluck('name')->toArray();
                        $authorNamesStr = implode(', ', $authorNames);
                        
                        Notification::create([
                            'user_id' => $user->id,
                            'title'   => 'Bài báo mới từ tác giả bạn quan tâm',
                            'content' => "Tác giả {$authorNamesStr} vừa có {$matchedPapersCount} bài báo mới được cập nhật.",
                            'type'    => 'publication',
                            'data'    => [
                                'filter_type'  => 'authors',
                                'filter_value' => $authorNames
                            ]
                        ]);
                    }
                }
            }
        }
    }
}
