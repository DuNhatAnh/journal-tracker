import { useEffect, useState, useMemo } from "react";
import { Download, Bell } from "lucide-react";
import { Navigate } from "react-router-dom";
import { api } from "@/src/lib/api";

import { TrendStatsGrid } from "./components/TrendStatsGrid";
import { AiInsightCard } from "./components/AiInsightCard";
import { PublicationVelocity } from "./components/PublicationVelocity";
import { CoAuthorNetwork } from "./components/CoAuthorNetwork";
import { JournalBenchmark } from "./components/JournalBenchmark";
import { RepresentativePublications } from "./components/RepresentativePublications";
import { TrendsSidebar } from "./components/TrendsSidebar";
import { PaperQuickViewModal } from "./components/PaperQuickViewModal";

interface TrendRecord {
  id: number;
  year: number;
  paper_count: number;
  citation_count: number;
  growth_rate: number;
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

  const [trendingList, setTrendingList] = useState<TrendingTopic[]>([]);
  const [selectedKeywordId, setSelectedKeywordId] = useState<number | null>(null);
  const [selectedDetail, setSelectedDetail] = useState<KeywordDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Bookmarks state
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<number>>(new Set());
  const [bookmarkLoadingIds, setBookmarkLoadingIds] = useState<Set<number>>(new Set());
  const [selectedPaper, setSelectedPaper] = useState<any | null>(null);

  // Followed journals state
  const [followedJournalIds, setFollowedJournalIds] = useState<Set<number>>(new Set());
  const [followingJournalLoadingIds, setFollowingJournalLoadingIds] = useState<Set<number>>(new Set());

  // Time slider filter state
  const [startYear, setStartYear] = useState(2020);
  const [endYear, setEndYear] = useState(2026);

  // Fetch initial top trending topics list
  useEffect(() => {
    api.get<any>("/trends/trending")
      .then(res => {
        const list = res.trending || [];
        setTrendingList(list);
        
        if (list.length > 0) {
          const firstTopic = list[0];
          setSelectedKeywordId(firstTopic.keyword_id);
          
          if (res.details) {
            setSelectedDetail(res.details);
          } else {
            fetchDetail(firstTopic.keyword_id);
          }
        }
        setLoading(false);
      })
      .catch(err => {
        console.error("Lỗi tải danh mục xu hướng", err);
        setLoading(false);
      });

    // Load following status for journals
    api.get<any>("/following/status")
      .then(res => {
        if (res.journals) {
          setFollowedJournalIds(new Set(res.journals.map((j: any) => j.id)));
        }
      })
      .catch(err => {
        console.error("Lỗi lấy thông tin follow journals:", err);
      });

    // Load bookmarked papers
    api.get<any>("/dashboard/bookmarks")
      .then(res => {
        if (res.bookmarked_paper_ids) {
          setBookmarkedIds(new Set(res.bookmarked_paper_ids));
        }
      })
      .catch(err => {
        console.error("Lỗi lấy thông tin bookmark:", err);
      });
  }, []);

  // Update year range dynamically when details change
  useEffect(() => {
    if (selectedDetail?.trends && selectedDetail.trends.length > 0) {
      const years = selectedDetail.trends.map(t => t.year);
      setStartYear(Math.min(...years));
      setEndYear(Math.max(...years));
    }
  }, [selectedDetail]);

  const fetchDetail = (keywordId: number) => {
    setLoadingDetail(true);
    api.get<any>(`/trends/${keywordId}/history`)
      .then(res => {
        setSelectedDetail(res);
        setLoadingDetail(false);
      })
      .catch(err => {
        console.error("Lỗi tải chi tiết xu hướng chủ đề", err);
        setLoadingDetail(false);
      });
  };

  const handleSelectKeyword = (keywordId: number) => {
    if (keywordId === selectedKeywordId) return;
    setSelectedKeywordId(keywordId);
    fetchDetail(keywordId);
  };

  // Toggle follow/unfollow recommended journal
  const handleToggleFollowJournal = async (journalId: number) => {
    if (followingJournalLoadingIds.has(journalId)) return;
    const isFollowing = followedJournalIds.has(journalId);
    setFollowingJournalLoadingIds(prev => new Set(prev).add(journalId));
    try {
      if (isFollowing) {
        await api.delete(`/following/journals/${journalId}`);
        setFollowedJournalIds(prev => {
          const s = new Set(prev);
          s.delete(journalId);
          return s;
        });
      } else {
        await api.post("/following/journals", { journal_id: journalId });
        setFollowedJournalIds(prev => new Set(prev).add(journalId));
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
        setBookmarkedIds(prev => {
          const s = new Set(prev);
          s.delete(paperId);
          return s;
        });
      } else {
        await api.post("/bookmarks", { paper_id: paperId });
        setBookmarkedIds(prev => new Set(prev).add(paperId));
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

  // Filter trends based on startYear and endYear
  const filteredTrends = useMemo(() => {
    if (!selectedDetail?.trends) return [];
    return selectedDetail.trends.filter(t => t.year >= startYear && t.year <= endYear);
  }, [selectedDetail, startYear, endYear]);

  const activeStats = useMemo(() => {
    if (filteredTrends.length === 0) {
      return { growth: "+0%", total: "0", impact: "0.0" };
    }
    const latest = filteredTrends[filteredTrends.length - 1];
    const growth = latest ? (latest.growth_rate >= 0 ? `+${latest.growth_rate}%` : `${latest.growth_rate}%`) : "+0%";
    const totalPapers = filteredTrends.reduce((sum, t) => sum + (t.paper_count ?? 0), 0);
    const totalCitations = filteredTrends.reduce((sum, t) => sum + (t.citation_count ?? 0), 0);
    const impact = totalPapers > 0 
      ? (Math.round((totalCitations / totalPapers) * 10) / 10).toFixed(1)
      : "0.0";
    return { growth, total: String(totalPapers), impact };
  }, [filteredTrends]);

  const velocityChartData = useMemo(() => {
    const categories = filteredTrends.map(t => String(t.year));
    const series = [{
      name: "Số lượng công bố",
      data: filteredTrends.map(t => t.paper_count)
    }];
    return { categories, series };
  }, [filteredTrends]);

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

    if (growth > 15 && ratio > 8 && totalPapers < 25) {
      level = "Khoảng trống Vàng (Đại dương xanh)";
      message = `Chủ đề "${selectedDetail?.keyword?.name}" đang có tốc độ tăng trưởng cao (${growth}%) và chỉ số trích dẫn ấn tượng (trung bình ${ratio.toFixed(1)} trích dẫn/bài), trong khi số lượng công bố trong giai đoạn này còn hạn chế (${totalPapers} bài). Đây là khoảng trống nghiên cứu cực kỳ tiềm năng để triển khai đề tài mới mà ít bị cạnh tranh.`;
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

    return { level, message, color, bg };
  }, [filteredTrends, selectedDetail]);

  const coOccurringKeywords = useMemo(() => {
    return selectedDetail?.coOccurring || [];
  }, [selectedDetail]);

  const topicName = selectedDetail?.keyword?.name || (loading ? "Đang tải chủ đề..." : "Chưa chọn chủ đề");

  return (
    <div className="space-y-8 pb-20 relative animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-1 rounded-full bg-tertiary/10 border border-tertiary/20 text-tertiary font-mono text-[10px] uppercase tracking-widest">Phân tích xu hướng</span>
            <span className="text-on-surface-variant text-[10px] uppercase tracking-widest">• Lịch sử xuất bản</span>
          </div>
          <h2 className="font-display text-4xl font-bold text-on-surface">{topicName}</h2>
          <p className="text-on-surface-variant mt-1 max-w-2xl text-sm">
            Phân tích tốc độ xuất bản, gợi ý tạp chí tối ưu, và trực quan hóa mạng lưới đồng tác giả cùng chỉ số H-index.
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

          <button className="flex items-center gap-2 px-4 py-2 glass-panel rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-white/5 transition-all">
            <Download className="w-4 h-4" /> Xuất báo cáo
          </button>
          <button className="flex items-center gap-2 px-4 py-2 gradient-btn rounded-xl text-xs font-bold uppercase tracking-widest text-on-primary">
            <Bell className="w-4 h-4 fill-current" /> Tạo cảnh báo
          </button>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 relative">
        {/* Left Column (Main detailed contents) */}
        <div className="lg:col-span-8 space-y-8 relative">
          {/* Stats Grid */}
          <TrendStatsGrid activeStats={activeStats} loading={loadingDetail || loading} />

          {/* AI Research Gap Insight Card */}
          <AiInsightCard insight={researchGapInsight} loading={loadingDetail || loading} />

          {/* Publication Velocity Chart */}
          <PublicationVelocity 
            categories={velocityChartData.categories}
            series={velocityChartData.series}
            loading={loadingDetail || loading}
          />

          {/* Co-authorship Network Graph */}
          <CoAuthorNetwork keywordId={selectedKeywordId} />

          {/* Recommended Journals */}
          <JournalBenchmark 
            keywordId={selectedKeywordId}
            followedJournalIds={followedJournalIds}
            followingJournalLoadingIds={followingJournalLoadingIds}
            onToggleFollow={handleToggleFollowJournal}
          />

          {/* Representative Publications */}
          <RepresentativePublications 
            keywordId={selectedKeywordId}
            onSelectPaper={setSelectedPaper}
            startYear={startYear}
            endYear={endYear}
          />
        </div>

        {/* Right Column (Emerging Entities selection sidebar) */}
        <TrendsSidebar 
          trendingList={trendingList}
          selectedKeywordId={selectedKeywordId}
          onSelectKeyword={handleSelectKeyword}
          coOccurringKeywords={coOccurringKeywords}
          loading={loading}
        />
      </div>

      {/* Quick View Paper Abstract Modal with Citation Block */}
      {selectedPaper && (
        <PaperQuickViewModal 
          paper={selectedPaper}
          onClose={() => setSelectedPaper(null)}
          bookmarkedIds={bookmarkedIds}
          bookmarkLoadingIds={bookmarkLoadingIds}
          onToggleBookmark={handleToggleBookmark}
        />
      )}
    </div>
  );
}
