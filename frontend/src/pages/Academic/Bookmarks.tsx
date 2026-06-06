import { useState, useEffect, useRef } from "react";
import toast from "react-hot-toast";
import { api } from "@/src/lib/api";
import { useApiQuery, queryCache } from "../../hooks/useApiQuery";
import { BookmarksHeader } from "./components/Bookmarks/BookmarksHeader";
import { BookmarkedPapersList } from "./components/Bookmarks/BookmarkedPapersList";
import { FollowedKeywordsGrid } from "./components/Bookmarks/FollowedKeywordsGrid";
import { FollowedJournalsGrid } from "./components/Bookmarks/FollowedJournalsGrid";
import { BookmarkPaperDetailModal } from "./components/Bookmarks/BookmarkPaperDetailModal";
import { ExportReportModal } from "./components/Bookmarks/ExportReportModal";

export default function Bookmarks() {
  const userStr = localStorage.getItem("user");
  const user = userStr ? JSON.parse(userStr) : null;
  const role = user?.role || "student";
  const showExport = role === "researcher" || role === "admin";

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editNote, setEditNote] = useState("");
  const [page, setPage] = useState(1);
  const [isExporting, setIsExporting] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"papers" | "keywords" | "journals">("papers");
  const [selectedPaper, setSelectedPaper] = useState<any | null>(null);
  const [bookmarkLoadingIds, setBookmarkLoadingIds] = useState<Set<number>>(new Set());
  const bookmarksTopRef = useRef<HTMLDivElement>(null);

  // Scroll to top when page changes
  useEffect(() => {
    const timer = setTimeout(() => {
      bookmarksTopRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 120);
    return () => clearTimeout(timer);
  }, [page]);

  // useApiQuery for bookmarks papers
  const { 
    data: apiBookmarksData, 
    loading: isBookmarksLoading, 
    setData: setApiBookmarksData,
    refetch: refetchBookmarks 
  } = useApiQuery<any>(
    `/bookmarks?page=${page}&per_page=5`,
    { enabled: activeTab === "papers", staleTime: 0, ttl: 0 }
  );

  // useApiQuery for followed status (keywords and journals)
  const { 
    data: apiFollowedData, 
    loading: isFollowedLoading, 
    setData: setApiFollowedData,
    refetch: refetchFollowedData 
  } = useApiQuery<any>(
    "/following/status",
    { enabled: activeTab !== "papers", staleTime: 0, ttl: 0 }
  );

  const followedKeywords = apiFollowedData?.keywords || [];
  const followedJournals = apiFollowedData?.journals || [];

  const handleExport = () => {
    setIsExportModalOpen(true);
  };

  const deleteKeyword = async (id: number, name: string) => {
    try {
      await api.delete(`/following/keywords/${id}`);
      if (apiFollowedData) {
        const updatedKeywords = followedKeywords.filter((kw: any) => kw.id !== id);
        const updatedData = { ...apiFollowedData, keywords: updatedKeywords };
        setApiFollowedData(updatedData);
        queryCache.set("/following/status", updatedData);
      }
      toast.success(`Đã hủy lưu từ khóa "${name}"!`);
      refetchFollowedData();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Lỗi khi hủy lưu từ khóa. Vui lòng thử lại.");
    }
  };

  const deleteJournal = async (id: number, name: string) => {
    try {
      await api.delete(`/following/journals/${id}`);
      if (apiFollowedData) {
        const updatedJournals = followedJournals.filter((j: any) => j.id !== id);
        const updatedData = { ...apiFollowedData, journals: updatedJournals };
        setApiFollowedData(updatedData);
        queryCache.set("/following/status", updatedData);
      }
      toast.success(`Đã hủy theo dõi tạp chí "${name}"!`);
      refetchFollowedData();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Lỗi khi hủy theo dõi tạp chí. Vui lòng thử lại.");
    }
  };

  const deleteBookmark = async (id: number) => {
    try {
      await api.delete(`/bookmarks/${id}`);
      if (apiBookmarksData) {
        const updatedList = apiBookmarksData.data.filter((b: any) => b.id !== id);
        const updatedData = {
          ...apiBookmarksData,
          data: updatedList,
          total: Math.max(0, apiBookmarksData.total - 1)
        };
        setApiBookmarksData(updatedData);
        queryCache.set(`/bookmarks?page=${page}&per_page=5`, updatedData);
      }
      toast.success("Đã xóa bài báo khỏi danh sách lưu!");
      if (apiBookmarksData?.data?.length === 1 && page > 1) {
        setPage(prev => prev - 1);
      } else {
        refetchBookmarks();
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Lỗi khi xóa bài báo. Vui lòng thử lại.");
    }
  };

  const updateBookmark = async (id: number, note: string) => {
    try {
      await api.put(`/bookmarks/${id}`, { note });
      setEditingId(null);
      if (apiBookmarksData) {
        const updatedList = apiBookmarksData.data.map((b: any) => 
          b.id === id ? { ...b, note } : b
        );
        const updatedData = { ...apiBookmarksData, data: updatedList };
        setApiBookmarksData(updatedData);
        queryCache.set(`/bookmarks?page=${page}&per_page=5`, updatedData);
      }
      toast.success("Đã cập nhật ghi chú!");
      refetchBookmarks();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Không thể lưu ghi chú. Vui lòng thử lại.");
    }
  };

  const handleToggleBookmarkInModal = async (paperId: number) => {
    if (bookmarkLoadingIds.has(paperId)) return;
    setBookmarkLoadingIds(prev => new Set(prev).add(paperId));
    try {
      await api.delete(`/bookmarks/paper/${paperId}`);
      toast.success("Đã hủy lưu bài báo!");
      setSelectedPaper(null);
      if (apiBookmarksData) {
        const updatedList = apiBookmarksData.data.filter((b: any) => b.paper.id !== paperId);
        const updatedData = {
          ...apiBookmarksData,
          data: updatedList,
          total: Math.max(0, apiBookmarksData.total - 1)
        };
        setApiBookmarksData(updatedData);
        queryCache.set(`/bookmarks?page=${page}&per_page=5`, updatedData);
      }
      if (apiBookmarksData?.data?.length === 1 && page > 1) {
        setPage(prev => prev - 1);
      } else {
        refetchBookmarks();
      }
    } catch (err: any) {
      toast.error(err.message || "Thao tác thất bại. Vui lòng thử lại.");
    } finally {
      setBookmarkLoadingIds(prev => {
        const s = new Set(prev);
        s.delete(paperId);
        return s;
      });
    }
  };

  const totalSaved = apiBookmarksData?.total || 0;
  const bookmarkLimit = apiBookmarksData?.bookmark_limit || 0;
  const isLimitExceeded = bookmarkLimit > 0 && totalSaved > bookmarkLimit;

  return (
    <div ref={bookmarksTopRef} className="space-y-8 pb-20">
      <BookmarksHeader
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        totalPapers={apiBookmarksData?.total}
        bookmarkLimit={apiBookmarksData?.bookmark_limit}
        showExport={showExport}
        isExporting={isExporting}
        onExport={handleExport}
      />

      {/* Subtle warning banner if limit exceeded */}
      {activeTab === "papers" && isLimitExceeded && (
        <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-error/10 border border-error/20 text-error text-xs font-semibold max-w-4xl animate-fade-in">
          <span className="text-sm">⚠️</span>
          <span>
            Tài khoản đang lưu <b>{totalSaved}</b> bài báo, vượt hạn mức của hệ thống (<b>{bookmarkLimit}</b> bài). Vui lòng xóa bớt tài liệu cũ để có thể lưu thêm bài mới.
          </span>
        </div>
      )}

      {activeTab === "papers" && (
        <BookmarkedPapersList
          bookmarks={apiBookmarksData?.data || []}
          loading={isBookmarksLoading}
          editingId={editingId}
          setEditingId={setEditingId}
          editNote={editNote}
          setEditNote={setEditNote}
          onUpdateNote={updateBookmark}
          onDeleteBookmark={deleteBookmark}
          onSelectPaper={setSelectedPaper}
          page={page}
          lastPage={apiBookmarksData?.last_page || 1}
          onPageChange={setPage}
        />
      )}

      {activeTab === "keywords" && (
        <FollowedKeywordsGrid
          keywords={followedKeywords}
          loading={isFollowedLoading}
          onDeleteKeyword={deleteKeyword}
        />
      )}

      {activeTab === "journals" && (
        <FollowedJournalsGrid
          journals={followedJournals}
          loading={isFollowedLoading}
          onDeleteJournal={deleteJournal}
        />
      )}

      {selectedPaper && (
        <BookmarkPaperDetailModal
          paper={selectedPaper}
          onClose={() => setSelectedPaper(null)}
          bookmarkLoadingIds={bookmarkLoadingIds}
          onToggleBookmark={handleToggleBookmarkInModal}
        />
      )}

      {isExportModalOpen && (
        <ExportReportModal
          onClose={() => setIsExportModalOpen(false)}
          token={localStorage.getItem("token")}
          user={user}
        />
      )}
    </div>
  );
}
