import React, { useState, useMemo } from "react";
import toast from "react-hot-toast";
import { Navigate } from "react-router-dom";
import { api } from "@/src/lib/api";
import { useApiQuery, queryCache } from "../../hooks/useApiQuery";

import { FollowingHeader } from "./components/Following/FollowingHeader";
import { FollowingFeedList } from "./components/Following/FollowingFeedList";
import { FollowingSidebar } from "./components/Following/FollowingSidebar";
import { FollowingAddModal } from "./components/Following/FollowingAddModal";
import { PaperQuickViewModal } from "./components/PaperQuickViewModal";

interface Keyword {
  id: number;
  name: string;
  slug?: string;
}

interface Journal {
  id: number;
  name: string;
  issn?: string;
  publisher?: string;
}

interface Author {
  id: number;
  name: string;
  affiliation?: string;
}

interface Paper {
  id: number;
  title: string;
  abstract: string;
  published_year: number;
  citations_count: number;
  source: string;
  doi?: string;
  url?: string;
  journal?: Journal;
  authors: Author[];
  keywords: Keyword[];
}

export default function Following() {
  const userStr = localStorage.getItem("user");
  const user = userStr ? JSON.parse(userStr) : null;
  const role = user?.role || "student";

  if (role !== "researcher" && role !== "admin") {
    return <Navigate to="/dashboard" replace />;
  }

  // Sidebar tabs state
  const [activeTab, setActiveTab] = useState<"keyword" | "journal" | "author">("keyword");
  const [feedPage, setFeedPage] = useState(1);
  const [selectedPaper, setSelectedPaper] = useState<Paper | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [bookmarkLoadingIds, setBookmarkLoadingIds] = useState<Set<number>>(new Set());

  // useApiQuery for follow statuses
  const { 
    data: statusData, 
    loading: isStatusLoading, 
    refetch: refetchStatus 
  } = useApiQuery<{ keywords: Keyword[]; journals: Journal[]; authors: Author[] }>("/following/status", { persist: true });

  const keywords = statusData?.keywords || [];
  const journals = statusData?.journals || [];
  const authors = statusData?.authors || [];

  // useApiQuery for feed papers
  const { 
    data: feedData, 
    loading: isFeedLoading, 
    refetch: refetchFeed 
  } = useApiQuery<any>(`/following/feed?page=${feedPage}`);

  const feedPapers = feedData?.data || [];
  const feedTotalPages = feedData?.last_page || 1;

  // useApiQuery for bookmarks status
  const { 
    data: bookmarksData, 
    setData: setBookmarksData 
  } = useApiQuery<any>("/dashboard/bookmarks", { persist: true });

  const bookmarkedIds = useMemo(() => {
    if (!bookmarksData?.bookmarked_paper_ids) return new Set<number>();
    return new Set<number>(bookmarksData.bookmarked_paper_ids);
  }, [bookmarksData]);

  // Helper clear cache function
  const clearFollowingCache = () => {
    for (const key of queryCache.keys()) {
      if (key.startsWith("/following/feed") || key.startsWith("/following/status")) {
        queryCache.delete(key);
      }
    }
  };

  // Handle follow addition
  const handleFollow = async (id: number, type: "keyword" | "journal" | "author") => {
    try {
      const body: any = {};
      body[`${type}_id`] = id;
      await api.post(`/following/${type}s`, body);
      
      // Evict caches
      clearFollowingCache();
      
      // Force immediate reload
      refetchStatus();
      setFeedPage(1);
      refetchFeed();
      
      toast.success("Đã theo dõi thành công!");
    } catch (err) {
      console.error("Lỗi khi thực hiện theo dõi:", err);
      toast.error("Không thể thực hiện theo dõi. Vui lòng thử lại.");
    }
  };

  // Handle unfollow
  const handleUnfollow = async (id: number, type: "keyword" | "journal" | "author") => {
    try {
      await api.delete(`/following/${type}s/${id}`);
      
      // Evict caches
      clearFollowingCache();
      
      // Force immediate reload
      refetchStatus();
      setFeedPage(1);
      refetchFeed();
      
      toast.success("Đã hủy theo dõi thành công!");
    } catch (err) {
      console.error("Lỗi khi hủy theo dõi:", err);
      toast.error("Không thể hủy theo dõi. Vui lòng thử lại.");
    }
  };

  // Helper check
  const isAlreadyFollowing = (id: number, type: "keyword" | "journal" | "author") => {
    if (type === "keyword") return keywords.some(k => k.id === id);
    if (type === "journal") return journals.some(j => j.id === id);
    if (type === "author") return authors.some(a => a.id === id);
    return false;
  };

  // Toggle bookmark
  const handleToggleBookmark = async (paperId: number) => {
    if (bookmarkLoadingIds.has(paperId)) return;
    const isBookmarked = bookmarkedIds.has(paperId);
    setBookmarkLoadingIds(prev => new Set(prev).add(paperId));
    try {
      if (isBookmarked) {
        await api.delete(`/bookmarks/paper/${paperId}`);
        const nextIds = new Set(bookmarkedIds);
        nextIds.delete(paperId);
        const updatedData = { bookmarked_paper_ids: Array.from(nextIds) };
        setBookmarksData(updatedData);
        toast.success("Đã hủy lưu bài báo!");
      } else {
        await api.post("/bookmarks", { paper_id: paperId });
        const nextIds = new Set(bookmarkedIds).add(paperId);
        const updatedData = { bookmarked_paper_ids: Array.from(nextIds) };
        setBookmarksData(updatedData);
        toast.success("Lưu bài báo thành công!");
      }
    } catch (err: any) {
      toast.error(err.message || "Lỗi thao tác bookmark.");
    } finally {
      setBookmarkLoadingIds(prev => {
        const s = new Set(prev);
        s.delete(paperId);
        return s;
      });
    }
  };

  const handleRefreshFeed = () => {
    queryCache.delete(`/following/feed?page=${feedPage}`);
    refetchFeed();
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pb-20">
      {/* Feed Column */}
      <div className="lg:col-span-8 space-y-8">
        <FollowingHeader isFeedLoading={isFeedLoading} onRefresh={handleRefreshFeed} />
        
        <FollowingFeedList
          feedPapers={feedPapers}
          isFeedLoading={isFeedLoading}
          bookmarkedIds={bookmarkedIds}
          bookmarkLoadingIds={bookmarkLoadingIds}
          onToggleBookmark={handleToggleBookmark}
          onSelectPaper={setSelectedPaper}
          feedPage={feedPage}
          feedTotalPages={feedTotalPages}
          onPageChange={setFeedPage}
        />
      </div>

      {/* Sidebar Column */}
      <FollowingSidebar
        keywords={keywords}
        journals={journals}
        authors={authors}
        isStatusLoading={isStatusLoading}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onUnfollow={handleUnfollow}
        onOpenAddModal={() => setIsModalOpen(true)}
      />

      {/* Quick View Paper Abstract Modal */}
      {selectedPaper && (
        <PaperQuickViewModal
          paper={selectedPaper}
          onClose={() => setSelectedPaper(null)}
          bookmarkedIds={bookmarkedIds}
          bookmarkLoadingIds={bookmarkLoadingIds}
          onToggleBookmark={handleToggleBookmark}
        />
      )}

      {/* Follow Modal Search and Add */}
      <FollowingAddModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onFollow={handleFollow}
        isAlreadyFollowing={isAlreadyFollowing}
      />
    </div>
  );
}
