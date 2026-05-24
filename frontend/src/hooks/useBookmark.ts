import { useState, useCallback } from "react";
import toast from "react-hot-toast";
import { api } from "../lib/api";

export function useBookmark() {
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<number>>(new Set());
  const [loadingIds, setLoadingIds] = useState<Set<number>>(new Set());

  const bookmark = useCallback(async (paperId: number) => {
    if (loadingIds.has(paperId)) return;
    const isBookmarked = bookmarkedIds.has(paperId);
    setLoadingIds(prev => new Set(prev).add(paperId));
    try {
      if (isBookmarked) {
        await api.delete(`/bookmarks/paper/${paperId}`);
        setBookmarkedIds(prev => {
          const s = new Set(prev);
          s.delete(paperId);
          return s;
        });
        toast.success("Đã hủy lưu bài báo!");
      } else {
        await api.post('/bookmarks', { paper_id: paperId });
        setBookmarkedIds(prev => new Set(prev).add(paperId));
        toast.success("Lưu bài báo thành công!");
      }
    } catch {
      toast.error("Thao tác thất bại. Vui lòng thử lại.");
    } finally {
      setLoadingIds(prev => { const s = new Set(prev); s.delete(paperId); return s; });
    }
  }, [bookmarkedIds, loadingIds]);

  return { bookmarkedIds, loadingIds, bookmark, setBookmarkedIds };
}
