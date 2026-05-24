import { useEffect, useState, useCallback } from "react";
import { Navigate } from "react-router-dom";
import toast from "react-hot-toast";
import { api } from "@/src/lib/api";

import { PaperDetail } from "./types";
import { useBookmark } from "../../hooks/useBookmark";

import { PaperDetailModal } from "./components/PaperDetailModal";
import { JournalDetailModal } from "./components/JournalDetailModal";
import { AiReviewModal } from "./components/AiReviewModal";
import { HeroSection } from "./components/HeroSection";
import { StatsGrid } from "./components/StatsGrid";
import { TrendingTopics } from "./components/TrendingTopics";
import { RecentPapers } from "./components/RecentPapers";
import { AiInsightsWidget, TopicsDistributionWidget } from "./components/ResearcherWidgets";
import { MyLibraryWidget, SearchTipsWidget } from "./components/StudentWidgets";
import { TopJournalsList } from "./components/TopJournalsList";

export default function Dashboard() {
  const [selectedPaper, setSelectedPaper] = useState<PaperDetail | null>(null);
  const [selectedJournal, setSelectedJournal] = useState<any | null>(null);
  const [showAiReview, setShowAiReview] = useState(false);
  const [aiReviewPapers, setAiReviewPapers] = useState<PaperDetail[]>([]);
  
  const [followedJournalIds, setFollowedJournalIds] = useState<Set<number>>(new Set());
  const [followingJournalIds, setFollowingJournalIds] = useState<Set<number>>(new Set());
  
  const [followedKeywordIds, setFollowedKeywordIds] = useState<Set<number>>(new Set());
  const [followingKeywordIds, setFollowingKeywordIds] = useState<Set<number>>(new Set());
  
  const [readPaperIds, setReadPaperIds] = useState<Set<number>>(() => {
    try {
      const stored = localStorage.getItem('readPapers');
      return new Set(stored ? JSON.parse(stored) : []);
    } catch {
      return new Set();
    }
  });

  const { bookmarkedIds, loadingIds, bookmark, setBookmarkedIds } = useBookmark();

  const handlePaperClick = useCallback((paper: PaperDetail) => {
    setSelectedPaper(paper);
    setReadPaperIds(prev => {
      if (prev.has(paper.id)) return prev;
      const next = new Set(prev).add(paper.id);
      localStorage.setItem('readPapers', JSON.stringify(Array.from(next)));
      return next;
    });
  }, []);

  const loadFollowedKeywords = useCallback(async () => {
    try {
      const res = await api.get<{ keywords: { id: number }[] }>('/following/status');
      const ids = new Set<number>(res.keywords?.map((k: any) => k.id) ?? []);
      setFollowedKeywordIds(ids);
    } catch { /* silent */ }
  }, []);

  const toggleFollowKeyword = async (keywordId: number, keywordName: string) => {
    if (followingKeywordIds.has(keywordId)) return;
    setFollowingKeywordIds(prev => new Set(prev).add(keywordId));
    const isFollowed = followedKeywordIds.has(keywordId);
    try {
      if (isFollowed) {
        await api.delete(`/following/keywords/${keywordId}`);
        setFollowedKeywordIds(prev => { const s = new Set(prev); s.delete(keywordId); return s; });
        toast.success(`Đã hủy lưu từ khóa "${keywordName}"`);
      } else {
        await api.post(`/following/keywords`, { keyword_id: keywordId });
        setFollowedKeywordIds(prev => { const s = new Set(prev).add(keywordId); return s; });
        toast.success(`Đã lưu từ khóa "${keywordName}"!`);
      }
    } catch { toast.error('Không thể thực hiện thao tác này.'); }
    finally { setFollowingKeywordIds(prev => { const s = new Set(prev); s.delete(keywordId); return s; }); }
  };

  const loadFollowedJournals = useCallback(async () => {
    try {
      const res = await api.get<{ data: { id: number }[] }>('/journals/feed');
      const ids = new Set<number>((res as any).followed_journals?.map((j: any) => j.id) ?? []);
      setFollowedJournalIds(ids);
    } catch { /* silent */ }
  }, []);

  const toggleFollowJournal = async (journalId: number, journalName: string) => {
    if (followingJournalIds.has(journalId)) return;
    setFollowingJournalIds(prev => new Set(prev).add(journalId));
    const isFollowed = followedJournalIds.has(journalId);
    try {
      if (isFollowed) {
        await api.delete(`/journals/${journalId}/follow`);
        setFollowedJournalIds(prev => { const s = new Set(prev); s.delete(journalId); return s; });
        toast.success(`Đã bỏ theo dõi ${journalName}`);
      } else {
        await api.post(`/journals/${journalId}/follow`, {});
        setFollowedJournalIds(prev => { const s = new Set(prev).add(journalId); return s; });
        toast.success(`Đang theo dõi ${journalName}!`);
      }
    } catch { toast.error('Không thể thực hiện thao tác này.'); }
    finally { setFollowingJournalIds(prev => { const s = new Set(prev); s.delete(journalId); return s; }); }
  };

  const currentUserStr = localStorage.getItem("user");
  const currentUser = currentUserStr ? JSON.parse(currentUserStr) : null;
  const role = currentUser?.role || "student";
  const isResearcher = role === "researcher" || role === "admin";
  
  if (role === "admin") {
    return <Navigate to="/admin/dashboard" replace />;
  }

  useEffect(() => {
    // Fetch common data (bookmarks, followed statuses)
    api.get<any>('/dashboard/bookmarks')
       .then(res => {
         if (res.bookmarked_paper_ids) {
           setBookmarkedIds(new Set(res.bookmarked_paper_ids));
         }
       })
       .catch(err => console.error("Lỗi tải bookmarks", err));

    loadFollowedJournals();
    loadFollowedKeywords();
  }, [loadFollowedJournals, loadFollowedKeywords, setBookmarkedIds]);

  return (
    <div className="space-y-12 pb-20">
      {/* Modals */}
      {selectedPaper && (
        <PaperDetailModal
          paper={selectedPaper}
          onClose={() => setSelectedPaper(null)}
          bookmarkedIds={bookmarkedIds}
          loadingIds={loadingIds}
          bookmark={bookmark}
          followedKeywordIds={followedKeywordIds}
          followingKeywordIds={followingKeywordIds}
          toggleFollowKeyword={toggleFollowKeyword}
        />
      )}

      {selectedJournal && (
        <JournalDetailModal
          journal={selectedJournal}
          onClose={() => setSelectedJournal(null)}
        />
      )}

      {showAiReview && (
        <AiReviewModal 
          papers={aiReviewPapers} 
          onClose={() => setShowAiReview(false)} 
        />
      )}

      {/* Hero Section */}
      <HeroSection />

      {/* Stats Grid */}
      <StatsGrid />

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column */}
        <div className="lg:col-span-8 space-y-8">
          <TrendingTopics isResearcher={isResearcher} />

          <RecentPapers 
            readPaperIds={readPaperIds}
            onPaperClick={handlePaperClick}
            bookmarkedIds={bookmarkedIds}
            loadingIds={loadingIds}
            bookmark={bookmark}
          />
        </div>

        {/* Right Column */}
        <div className="lg:col-span-4 space-y-8">
          {isResearcher && (
            <AiInsightsWidget 
              onSelectPaper={setSelectedPaper}
              onOpenAiReview={(papers) => {
                setAiReviewPapers(papers);
                setShowAiReview(true);
              }}
            />
          )}

          {!isResearcher && (
            <>
              <MyLibraryWidget 
                bookmarkedIds={bookmarkedIds}
                onSelectPaper={setSelectedPaper}
              />
              <SearchTipsWidget />
            </>
          )}

          <TopJournalsList 
            isResearcher={isResearcher}
            onSelectJournal={setSelectedJournal}
            followedJournalIds={followedJournalIds}
            followingJournalIds={followingJournalIds}
            toggleFollowJournal={toggleFollowJournal}
          />

          {isResearcher && (
            <TopicsDistributionWidget />
          )}
        </div>
      </div>
    </div>
  );
}
