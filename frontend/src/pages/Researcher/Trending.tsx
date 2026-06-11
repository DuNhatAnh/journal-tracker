import { useEffect, useState, useMemo, useRef } from "react";
import { Download, Bell, BellOff } from "lucide-react";
import { Navigate } from "react-router-dom";
import toast from "react-hot-toast";
import { api } from "@/src/lib/api";
import { useApiQuery, queryCache } from "../../hooks/useApiQuery";

import { TrendStatsGrid } from "./components/TrendStatsGrid";
import { AiInsightCard } from "./components/AiInsightCard";
import { PublicationVelocity } from "./components/PublicationVelocity";
import { TopicDistribution } from "./components/TopicDistribution";
import { CoAuthorNetwork } from "./components/CoAuthorNetwork";
import { JournalBenchmark } from "./components/JournalBenchmark";
import { JournalDistribution } from "./components/JournalDistribution";
import { RepresentativePublications } from "./components/RepresentativePublications";
import { TrendsSidebar } from "./components/TrendsSidebar";
import { PaperQuickViewModal } from "./components/PaperQuickViewModal";
import { ExportTrendReportModal } from "./components/ExportTrendReportModal";

interface TrendRecord {
  id: number;
  year: number;
  paper_count: number;
  citation_count: number;
  growth_rate: number;
}

interface SelectedEntity {
  id: number;
  name: string;
  type: "keyword" | "author";
}

interface KeywordDetail {
  keyword: { id: number; name: string };
  trends: TrendRecord[];
  coOccurring: any[];
}

interface TrendingTopic {
  id: number;
  keyword_id: number;
  paper_count: number;
  growth_rate: number;
  keyword?: { id: number; name: string };
}

export default function Trending() {
  const userStr = localStorage.getItem("user");
  const user = userStr ? JSON.parse(userStr) : null;
  const role = user?.role || "student";

  if (role !== "researcher" && role !== "admin") {
    return <Navigate to="/dashboard" replace />;
  }

  // selected entity state
  const [selectedEntity, setSelectedEntity] = useState<SelectedEntity | null>(null);

  // useApiQuery for initial top trending topics list
  const { data: trendingData, loading: isTrendingLoading } = useApiQuery<any>("/trends/trending");
  const trendingList = trendingData?.trending || [];
  const trendingAuthors = trendingData?.trendingAuthors || [];
  const trendingPapers = trendingData?.trendingPapers || [];

  // useApiQuery for following status (journals)
  const { data: statusData, refetch: refetchStatus } = useApiQuery<any>("/following/status", { persist: true });

  const followedJournalIds = useMemo(() => {
    if (!statusData?.journals) return new Set<number>();
    return new Set<number>(statusData.journals.map((j: any) => j.id));
  }, [statusData]);

  const followedKeywordIds = useMemo(() => {
    if (!statusData?.keywords) return new Set<number>();
    return new Set<number>(statusData.keywords.map((k: any) => k.id));
  }, [statusData]);

  const followedAuthorIds = useMemo(() => {
    if (!statusData?.authors) return new Set<number>();
    return new Set<number>(statusData.authors.map((a: any) => a.id));
  }, [statusData]);

  // useApiQuery for bookmarks status
  const { data: bookmarksData, setData: setBookmarksData } = useApiQuery<any>("/dashboard/bookmarks", { persist: true });

  const bookmarkedIds = useMemo(() => {
    if (!bookmarksData?.bookmarked_paper_ids) return new Set<number>();
    return new Set<number>(bookmarksData.bookmarked_paper_ids);
  }, [bookmarksData]);

  // Set default selected entity and seed cache for details if present
  useEffect(() => {
    if (trendingData?.trending && trendingData.trending.length > 0 && selectedEntity === null) {
      const firstKeyword = trendingData.trending[0].keyword;
      const firstKeywordId = trendingData.trending[0].keyword_id;
      const firstKeywordName = firstKeyword?.name || "Chủ đề";
      setSelectedEntity({
        id: firstKeywordId,
        name: firstKeywordName,
        type: "keyword"
      });

      // Seed detail data if returned directly by /trends/trending
      if (trendingData.details) {
        const historyUrl = `/trends/${firstKeywordId}/history`;
        if (!queryCache.has(historyUrl)) {
          queryCache.set(historyUrl, trendingData.details);
        }
      }
    }
  }, [trendingData, selectedEntity]);

  const historyUrl = useMemo(() => {
    if (!selectedEntity) return "";
    return selectedEntity.type === "author"
      ? `/trends/author/${selectedEntity.id}/history`
      : `/trends/${selectedEntity.id}/history`;
  }, [selectedEntity]);

  // useApiQuery for history of selected entity
  const { data: selectedDetail, loading: loadingDetail } = useApiQuery<any>(
    historyUrl,
    { enabled: !!historyUrl }
  );

  // loading state
  const loading = isTrendingLoading;

  // Bookmarks details state
  const [bookmarkLoadingIds, setBookmarkLoadingIds] = useState<Set<number>>(new Set());
  const [followingJournalLoadingIds, setFollowingJournalLoadingIds] = useState<Set<number>>(new Set());
  const [followingKeywordLoadingIds, setFollowingKeywordLoadingIds] = useState<Set<number>>(new Set());
  const [followingAuthorLoadingIds, setFollowingAuthorLoadingIds] = useState<Set<number>>(new Set());
  const [selectedPaper, setSelectedPaper] = useState<any | null>(null);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  // Time slider filter state
  const [startYear, setStartYear] = useState(2020);
  const [endYear, setEndYear] = useState(2026);

  const chartContainerRef = useRef<HTMLDivElement>(null);

  // Handle scroll-to-zoom on the publication velocity chart
  useEffect(() => {
    const element = chartContainerRef.current;
    if (!element) return;

    const handleWheel = (e: WheelEvent) => {
      if (!selectedDetail?.trends || selectedDetail.trends.length === 0) return;

      const years = selectedDetail.trends.map((t: any) => t.year).sort((a: number, b: number) => a - b);
      if (years.length === 0) return;
      const minYear = years[0];
      const maxYear = years[years.length - 1];

      // Prevent page from scrolling vertically
      e.preventDefault();

      const direction = e.deltaY < 0 ? "in" : "out";
      const span = endYear - startYear;

      if (direction === "in") {
        if (span > 1) {
          if (span >= 3) {
            setStartYear((prev) => prev + 1);
            setEndYear((prev) => prev - 1);
          } else {
            // span is 2: narrow to 1 by shifting startYear
            setStartYear((prev) => prev + 1);
          }
        }
      } else {
        // Zoom out: widen range symmetrically or asymmetric if blocked
        const nextStart = Math.max(minYear, startYear - 1);
        const nextEnd = Math.min(maxYear, endYear + 1);
        setStartYear(nextStart);
        setEndYear(nextEnd);
      }
    };

    element.addEventListener("wheel", handleWheel, { passive: false });
    return () => {
      element.removeEventListener("wheel", handleWheel);
    };
  }, [selectedDetail, startYear, endYear]);

  // Update year range dynamically when details change to zoom into the 5 consecutive years with the highest publication volume
  useEffect(() => {
    if (selectedDetail?.trends && selectedDetail.trends.length > 0) {
      const years = selectedDetail.trends.map((t: any) => t.year);
      const minYear = Math.min(...years);
      const maxYear = Math.max(...years);

      if (maxYear - minYear < 4) {
        setStartYear(minYear);
        setEndYear(maxYear);
      } else {
        const yearMap: { [key: number]: number } = {};
        selectedDetail.trends.forEach((t: any) => {
          yearMap[t.year] = t.paper_count || 0;
        });

        let maxVolume = -1;
        let bestStart = minYear;
        let bestEnd = minYear + 4;

        for (let y = minYear; y <= maxYear - 4; y++) {
          let currentVolume = 0;
          for (let i = 0; i < 5; i++) {
            currentVolume += yearMap[y + i] || 0;
          }
          if (currentVolume > maxVolume) {
            maxVolume = currentVolume;
            bestStart = y;
            bestEnd = y + 4;
          }
        }

        setStartYear(bestStart);
        setEndYear(bestEnd);
      }
    }
  }, [selectedDetail]);

  const handleSelectKeyword = (keywordId: number, name?: string) => {
    if (selectedEntity?.type === "keyword" && selectedEntity.id === keywordId) return;
    let kwName = name;
    if (!kwName) {
      const found = trendingList.find((item: any) => item.keyword_id === keywordId);
      kwName = found?.keyword?.name || `Từ khóa #${keywordId}`;
    }
    setSelectedEntity({
      id: keywordId,
      name: kwName,
      type: "keyword"
    });
  };

  const handleSelectAuthor = (authorId: number, name?: string) => {
    if (selectedEntity?.type === "author" && selectedEntity.id === authorId) return;
    let authName = name;
    if (!authName) {
      const found = trendingAuthors.find((item: any) => item.id === authorId);
      authName = found?.name || `Tác giả #${authorId}`;
    }
    setSelectedEntity({
      id: authorId,
      name: authName,
      type: "author"
    });
  };

  // Toggle follow/unfollow recommended journal
  const handleToggleFollowJournal = async (journalId: number) => {
    if (followingJournalLoadingIds.has(journalId)) return;
    const isFollowing = followedJournalIds.has(journalId);
    setFollowingJournalLoadingIds(prev => new Set(prev).add(journalId));
    try {
      if (isFollowing) {
        await api.delete(`/following/journals/${journalId}`);
        // Evict following status cache
        queryCache.delete("/following/status");
        refetchStatus();
      } else {
        await api.post("/following/journals", { journal_id: journalId });
        // Evict following status cache
        queryCache.delete("/following/status");
        refetchStatus();
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setFollowingJournalLoadingIds(prev => {
        const s = new Set(prev);
        s.delete(journalId);
        return s;
      });
    }
  };

  // Toggle bookmark paper
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
      } else {
        await api.post("/bookmarks", { paper_id: paperId });
        const nextIds = new Set(bookmarkedIds).add(paperId);
        const updatedData = { bookmarked_paper_ids: Array.from(nextIds) };
        setBookmarksData(updatedData);
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setBookmarkLoadingIds(prev => {
        const s = new Set(prev);
        s.delete(paperId);
        return s;
      });
    }
  };

  const handleToggleAlert = async () => {
    if (!selectedEntity) return;
    const entityId = selectedEntity.id;
    const isKeyword = selectedEntity.type === "keyword";

    if (isKeyword) {
      if (followingKeywordLoadingIds.has(entityId)) return;
      const isFollowing = followedKeywordIds.has(entityId);
      setFollowingKeywordLoadingIds(prev => new Set(prev).add(entityId));
      try {
        if (isFollowing) {
          await api.delete(`/following/keywords/${entityId}`);
          queryCache.delete("/following/status");
          refetchStatus();
          toast.success(`Đã hủy nhận thông báo cho chủ đề "${selectedEntity.name}"`);
        } else {
          await api.post("/following/keywords", { keyword_id: entityId });
          queryCache.delete("/following/status");
          refetchStatus();
          toast.success(`Đã đăng ký nhận thông báo cho chủ đề "${selectedEntity.name}"!`);
        }
      } catch (err: any) {
        console.error(err);
        toast.error("Thao tác thất bại. Vui lòng thử lại.");
      } finally {
        setFollowingKeywordLoadingIds(prev => {
          const s = new Set(prev);
          s.delete(entityId);
          return s;
        });
      }
    } else {
      if (followingAuthorLoadingIds.has(entityId)) return;
      const isFollowing = followedAuthorIds.has(entityId);
      setFollowingAuthorLoadingIds(prev => new Set(prev).add(entityId));
      try {
        if (isFollowing) {
          await api.delete(`/following/authors/${entityId}`);
          queryCache.delete("/following/status");
          refetchStatus();
          toast.success(`Đã hủy nhận thông báo cho tác giả "${selectedEntity.name}"`);
        } else {
          await api.post("/following/authors", { author_id: entityId });
          queryCache.delete("/following/status");
          refetchStatus();
          toast.success(`Đã đăng ký nhận thông báo cho tác giả "${selectedEntity.name}"!`);
        }
      } catch (err: any) {
        console.error(err);
        toast.error("Thao tác thất bại. Vui lòng thử lại.");
      } finally {
        setFollowingAuthorLoadingIds(prev => {
          const s = new Set(prev);
          s.delete(entityId);
          return s;
        });
      }
    }
  };

  const isAlertActive = useMemo(() => {
    if (!selectedEntity) return false;
    return selectedEntity.type === "keyword"
      ? followedKeywordIds.has(selectedEntity.id)
      : followedAuthorIds.has(selectedEntity.id);
  }, [selectedEntity, followedKeywordIds, followedAuthorIds]);

  const isAlertLoading = useMemo(() => {
    if (!selectedEntity) return false;
    return selectedEntity.type === "keyword"
      ? followingKeywordLoadingIds.has(selectedEntity.id)
      : followingAuthorLoadingIds.has(selectedEntity.id);
  }, [selectedEntity, followingKeywordLoadingIds, followingAuthorLoadingIds]);

  // Filter trends based on startYear and endYear
  const filteredTrends = useMemo(() => {
    if (!selectedDetail?.trends) return [];
    return selectedDetail.trends.filter(t => t.year >= startYear && t.year <= endYear);
  }, [selectedDetail, startYear, endYear]);

  const activeStats = useMemo(() => {
    if (filteredTrends.length === 0) {
      return { 
        growth: "+0%", 
        total: "0", 
        impact: "0.0", 
        citations: "0",
        hIndex: 0,
        i10Index: 0,
        coAuthorsCount: 0,
        trendingPapersCount: 0,
        topCollaborators: "",
        papersCitations: []
      };
    }
    const latest = filteredTrends[filteredTrends.length - 1];
    const growth = latest ? (latest.growth_rate >= 0 ? `+${latest.growth_rate}%` : `${latest.growth_rate}%`) : "+0%";
    const totalPapers = filteredTrends.reduce((sum, t) => sum + (t.paper_count ?? 0), 0);
    const totalCitations = filteredTrends.reduce((sum, t) => sum + (t.citation_count ?? 0), 0);
    const impact = totalPapers > 0 
      ? (Math.round((totalCitations / totalPapers) * 10) / 10).toFixed(1)
      : "0.0";
    return { 
      growth, 
      total: String(totalPapers), 
      impact, 
      citations: String(totalCitations),
      hIndex: selectedDetail?.h_index || 0,
      i10Index: selectedDetail?.i10_index || 0,
      coAuthorsCount: selectedDetail?.co_authors_count || 0,
      trendingPapersCount: selectedDetail?.trending_papers_count || 0,
      topCollaborators: selectedDetail?.top_collaborators?.join(", ") || "Không có",
      papersCitations: selectedDetail?.papers_citations || []
    };
  }, [filteredTrends, selectedDetail]);

  const velocityChartData = useMemo(() => {
    const categories = filteredTrends.map(t => String(t.year));
    
    if (selectedEntity?.type === "author") {
      const series = [
        {
          name: "Số lượng bài báo",
          type: "column",
          data: filteredTrends.map(t => t.paper_count)
        },
        {
          name: "Số lượt trích dẫn",
          type: "line",
          data: filteredTrends.map(t => t.citation_count)
        }
      ];
      return { categories, series };
    } else {
      const series = [{
        name: "Số lượng công bố",
        type: "area",
        data: filteredTrends.map(t => t.paper_count)
      }];
      return { categories, series };
    }
  }, [filteredTrends, selectedEntity]);

  const researchGapInsight = useMemo(() => {
    if (filteredTrends.length === 0) return null;
    const totalPapers = filteredTrends.reduce((sum, t) => sum + (t.paper_count ?? 0), 0);
    const totalCitations = filteredTrends.reduce((sum, t) => sum + (t.citation_count ?? 0), 0);
    const latest = filteredTrends[filteredTrends.length - 1];
    const growth = latest ? latest.growth_rate : 0;
    const ratio = totalPapers > 0 ? totalCitations / totalPapers : 0;

    let level = "Phát triển ổn định";
    let message = "";
    let color = "text-on-surface";
    let bg = "bg-surface-container/30 border border-white/5";

    const isAuthor = selectedEntity?.type === "author";
    const displayName = selectedEntity?.name || "";

    if (isAuthor) {
      if (ratio > 15 && totalPapers > 5) {
        level = "Nhà nghiên cứu có tầm ảnh hưởng cực lớn";
        message = `Tác giả "${displayName}" có số lượng trích dẫn trung bình cực kỳ cao (${ratio.toFixed(1)} trích dẫn/bài) trên tổng số ${totalPapers} bài công bố. Các nghiên cứu của tác giả này có sức ảnh hưởng học thuật rất sâu rộng, là địa chỉ uy tín để tham khảo và hợp tác nghiên cứu.`;
        color = "text-emerald-400";
        bg = "bg-emerald-500/10 border border-emerald-500/20";
      } else if (growth > 30) {
        level = "Nhà nghiên cứu đang bùng nổ (Hot Emerging)";
        message = `Tác giả "${displayName}" đang có tốc độ tăng trưởng công bố vượt bậc (${growth}%) trong các năm gần đây. Tần suất xuất hiện và đóng góp khoa học của tác giả này đang tăng nhanh chóng, cho thấy năng lực nghiên cứu rất năng động.`;
        color = "text-amber-400";
        bg = "bg-amber-500/10 border border-amber-500/20";
      } else {
        level = "Hoạt động khoa học bền bỉ";
        message = `Tác giả "${displayName}" duy trì tần suất công bố và lượt trích dẫn ổn định trong giai đoạn qua (trung bình ${ratio.toFixed(1)} trích dẫn/bài). Các công trình tập trung vào tính hệ thống khoa học vững chắc.`;
        color = "text-on-surface-variant";
        bg = "bg-surface-container/30 border border-white/5";
      }
    } else {
      if (growth > 15 && ratio > 8 && totalPapers < 25) {
        level = "Khoảng trống Vàng (Đại dương xanh)";
        message = `Chủ đề "${displayName}" đang có tốc độ tăng trưởng cao (${growth}%) và chỉ số trích dẫn ấn tượng (trung bình ${ratio.toFixed(1)} trích dẫn/bài), trong khi số lượng công bố trong giai đoạn này còn hạn chế (${totalPapers} bài). Đây là khoảng trống nghiên cứu cực kỳ tiềm năng để triển khai đề tài mới mà ít bị cạnh tranh.`;
        color = "text-emerald-400";
        bg = "bg-emerald-500/10 border border-emerald-500/20";
      } else if (ratio > 12) {
        level = "Tác động cao (Ngách chất lượng)";
        message = `Chủ đề này có chất lượng trích dẫn rất cao (trung bình ${ratio.toFixed(1)} trích dẫn/bài). Các nghiên cứu ở đây tập trung vào chiều sâu và có sức ảnh hưởng học thuật lớn. Gợi ý tập trung vào cải tiến chất lượng hơn là số lượng công bố.`;
        color = "text-cyan-400";
        bg = "bg-cyan-500/10 border border-cyan-500/20";
      } else if (growth > 20) {
        level = "Xu hướng bùng nổ (Hot Trend)";
        message = `Chủ đề đang tăng trưởng rất nhanh ở mức ${growth}%. Số lượng ấn phẩm đang tăng mạnh. Thích hợp cho các nghiên cứu ứng dụng thực tiễn nhanh để bắt kịp làn sóng công nghệ mới.`;
        color = "text-amber-400";
        bg = "bg-amber-500/10 border border-amber-500/20";
      } else {
        level = "Phát triển ổn định";
        message = `Lĩnh vực này đã đi vào giai đoạn ổn định về cả số lượng công bố và lượt trích dẫn. Phù hợp cho các nghiên cứu mang tính hệ thống hóa hoặc tích hợp liên ngành để tạo đột phá mới.`;
        color = "text-on-surface-variant";
        bg = "bg-surface-container/30 border border-white/5";
      }
    }

    return { level, message, color, bg };
  }, [filteredTrends, selectedEntity, selectedDetail]);

  const coOccurringKeywords = useMemo(() => {
    return selectedDetail?.coOccurring || [];
  }, [selectedDetail]);

  const topicName = useMemo(() => {
    if (selectedDetail) {
      return selectedDetail.keyword?.name || selectedDetail.author?.name || "Chưa rõ";
    }
    return loading ? "Đang tải..." : "Chưa chọn thực thể";
  }, [selectedDetail, loading]);

  return (
    <div className="space-y-8 pb-20 relative animate-fade-in text-left">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-1 rounded-full bg-tertiary/10 border border-tertiary/20 text-tertiary font-mono text-[10px] uppercase tracking-widest">
              Phân tích xu hướng
            </span>
            {selectedEntity?.type === "author" ? (
              <span className="px-2.5 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary font-mono text-[10px] uppercase tracking-widest animate-pulse">
                Nhà nghiên cứu mới nổi
              </span>
            ) : (
              <span className="px-2.5 py-1 rounded-full bg-secondary/10 border border-secondary/20 text-secondary font-mono text-[10px] uppercase tracking-widest">
                Từ khóa chủ đề
              </span>
            )}
            <span className="text-on-surface-variant text-[10px] uppercase tracking-widest">• Lịch sử xuất bản</span>
          </div>
          <h2 className="font-display text-4xl font-bold text-on-surface">{topicName}</h2>
          <p className="text-on-surface-variant mt-1 max-w-2xl text-sm">
            {selectedEntity?.type === "author"
              ? "Phân tích hiệu suất công bố, tầm ảnh hưởng trích dẫn, mạng lưới cộng tác và tạp chí mục tiêu của nhà khoa học."
              : "Phân tích tốc độ xuất bản, gợi ý tạp chí tối ưu, và trực quan hóa mạng lưới đồng tác giả cùng chỉ số H-index."}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {/* Time Selector Dropdowns */}
          <div className="flex items-center gap-2 bg-white/5 border border-white/10 px-3 py-2 rounded-xl text-xs font-bold uppercase tracking-wider">
            <span className="text-on-surface-variant font-mono">Thời gian:</span>
            <select 
              value={startYear}
              disabled={loading || !selectedDetail}
              onChange={(e) => setStartYear(Number(e.target.value))}
              className="bg-transparent text-on-surface focus:outline-none cursor-pointer disabled:opacity-50"
            >
              {selectedDetail?.trends.map(t => (
                <option key={`start-${t.year}`} value={t.year} disabled={t.year > endYear} className="bg-surface-container text-on-surface">
                  {t.year}
                </option>
              )) || <option value="2020">2020</option>}
            </select>
            <span className="text-outline-variant">—</span>
            <select 
              value={endYear}
              disabled={loading || !selectedDetail}
              onChange={(e) => setEndYear(Number(e.target.value))}
              className="bg-transparent text-on-surface focus:outline-none cursor-pointer disabled:opacity-50"
            >
              {selectedDetail?.trends.map(t => (
                <option key={`end-${t.year}`} value={t.year} disabled={t.year < startYear} className="bg-surface-container text-on-surface">
                  {t.year}
                </option>
              )) || <option value="2026">2026</option>}
            </select>
          </div>

          <button
            onClick={() => setIsExportModalOpen(true)}
            disabled={loading || !selectedDetail}
            className="flex items-center gap-2 px-4 py-2 glass-panel rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-white/5 transition-all cursor-pointer disabled:opacity-50"
          >
            <Download className="w-4 h-4" /> Xuất báo cáo
          </button>
          {isAlertActive ? (
            <button
              onClick={handleToggleAlert}
              disabled={loading || !selectedDetail || isAlertLoading}
              className="flex items-center gap-2 px-4 py-2 glass-panel rounded-xl text-xs font-bold uppercase tracking-widest text-primary border border-primary/30 hover:bg-primary/5 transition-all cursor-pointer disabled:opacity-50"
            >
              <BellOff className="w-4 h-4 fill-current" /> Hủy thông báo
            </button>
          ) : (
            <button
              onClick={handleToggleAlert}
              disabled={loading || !selectedDetail || isAlertLoading}
              className="flex items-center gap-2 px-4 py-2 gradient-btn rounded-xl text-xs font-bold uppercase tracking-widest text-on-primary cursor-pointer disabled:opacity-50"
            >
              <Bell className="w-4 h-4 fill-current" /> Nhận thông báo
            </button>
          )}
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 relative">
        {/* Left Column (Main detailed contents) */}
        <div className="lg:col-span-8 space-y-8 relative">
          {/* Stats Grid */}
          <TrendStatsGrid activeStats={activeStats} loading={loadingDetail || loading} selectedEntity={selectedEntity} />

          {/* AI Research Gap Insight Card */}
          <AiInsightCard insight={researchGapInsight} loading={loadingDetail || loading} />

          {/* Publication Velocity Chart (Full-width for Keywords, Side-by-side for Authors) */}
          {selectedEntity?.type === "author" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div ref={chartContainerRef}>
                <PublicationVelocity 
                  categories={velocityChartData.categories}
                  series={velocityChartData.series}
                  loading={loadingDetail || loading}
                  selectedEntity={selectedEntity}
                />
              </div>
              <TopicDistribution 
                keywords={coOccurringKeywords}
                loading={loadingDetail || loading}
                type="author"
              />
            </div>
          ) : (
            <div className="space-y-6">
              <div ref={chartContainerRef}>
                <PublicationVelocity 
                  categories={velocityChartData.categories}
                  series={velocityChartData.series}
                  loading={loadingDetail || loading}
                  selectedEntity={selectedEntity}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <JournalDistribution selectedEntity={selectedEntity} />
                <TopicDistribution 
                  keywords={coOccurringKeywords}
                  loading={loadingDetail || loading}
                  type="keyword"
                />
              </div>
            </div>
          )}

          {/* Co-authorship Network Graph */}
          <CoAuthorNetwork selectedEntity={selectedEntity} onSelectAuthor={handleSelectAuthor} />

          {/* Recommended Journals */}
          <JournalBenchmark 
            selectedEntity={selectedEntity}
            followedJournalIds={followedJournalIds}
            followingJournalLoadingIds={followingJournalLoadingIds}
            onToggleFollow={handleToggleFollowJournal}
          />

          {/* Representative Publications */}
          <RepresentativePublications 
            selectedEntity={selectedEntity}
            onSelectPaper={setSelectedPaper}
            startYear={startYear}
            endYear={endYear}
          />
        </div>

        {/* Right Column (Emerging Entities selection sidebar) */}
        <TrendsSidebar 
          trendingList={trendingList}
          trendingAuthors={trendingAuthors}
          trendingPapers={trendingPapers}
          selectedEntity={selectedEntity}
          onSelectKeyword={handleSelectKeyword}
          onSelectAuthor={handleSelectAuthor}
          onSelectPaper={setSelectedPaper}
          coOccurringKeywords={coOccurringKeywords}
          loading={loading}
        />
      </div>

      {selectedPaper && (
        <PaperQuickViewModal 
          paper={selectedPaper}
          onClose={() => setSelectedPaper(null)}
          bookmarkedIds={bookmarkedIds}
          bookmarkLoadingIds={bookmarkLoadingIds}
          onToggleBookmark={handleToggleBookmark}
        />
      )}

      {isExportModalOpen && (
        <ExportTrendReportModal
          onClose={() => setIsExportModalOpen(false)}
          user={user}
          selectedEntity={selectedEntity}
          selectedDetail={selectedDetail}
          startYear={startYear}
          endYear={endYear}
          activeStats={activeStats}
          researchGapInsight={researchGapInsight}
          coOccurringKeywords={coOccurringKeywords}
        />
      )}
    </div>
  );
}
