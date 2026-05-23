import { useEffect, useState, useCallback } from "react";
import { Link, Navigate } from "react-router-dom";
import { createPortal } from "react-dom";
import toast from "react-hot-toast";
import Chart from "react-apexcharts";
import { TrendingUp, ArrowRight, BookmarkPlus, BookmarkCheck, Filter, Sparkles, BookOpen, ChevronRight, X, ExternalLink, Quote, BookMarked, CalendarDays, Users, Loader2, Bot, Bell, BellOff, Library, Lightbulb, Search } from "lucide-react";
import { cn, cleanTitle } from "@/src/lib/utils";
import { api } from "@/src/lib/api";

interface PaperDetail {
  id: number;
  title: string;
  journal: string;
  authors: string;
  time: string;
  impact: number;
  citations: number;
  doi?: string;
  abstract?: string;
  keywords?: { id: number; name: string }[];
}

interface DashboardData {
  stats: { label: string; value: string; trend: string }[];
  trendingTopics: { id: number; name: string; papers: string; change: string; data: number[] }[];
  recentPapers: PaperDetail[];
  recommendedPapers: (PaperDetail & { match: string })[];
  topJournals: { id: number; name: string; field: string; initial: string; color: string; issn?: string; issn_note?: string; source_type?: string; publisher?: string; url?: string; papers_count?: number; impact_factor?: number; source?: string }[];
  fieldsDistribution: { name: string; value: number }[];
  topJournalsUpdatedAt?: string;
  recentPapersUpdatedAt?: string;
}

function useBookmark() {
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

function BookmarkButton({ paperId, bookmarkedIds, loadingIds, bookmark, className }: {
  paperId: number;
  bookmarkedIds: Set<number>;
  loadingIds: Set<number>;
  bookmark: (id: number) => void;
  className?: string;
}) {
  const saved = bookmarkedIds.has(paperId);
  const loading = loadingIds.has(paperId);
  return (
    <div className="relative group/tooltip">
      <button
        disabled={loading}
        onClick={e => { e.stopPropagation(); bookmark(paperId); }}
        className={cn(
          "transition-all flex items-center justify-center gap-2 font-bold",
          saved ? "text-tertiary" : "text-on-surface-variant hover:text-tertiary",
          className
        )}
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <BookmarkCheck className="w-4 h-4" /> : <BookmarkPlus className="w-4 h-4" />}
      </button>
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-1 text-[10px] font-bold text-on-surface bg-surface-container-high rounded-lg opacity-0 pointer-events-none group-hover/tooltip:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10 shadow-xl border border-outline-variant/30">
        {saved ? "Hủy lưu bài báo" : "Lưu bài báo ngay"}
      </div>
    </div>
  );
}

function PaperDetailModal({ paper, onClose, bookmarkedIds, loadingIds, bookmark, followedKeywordIds, followingKeywordIds, toggleFollowKeyword }: {
  paper: PaperDetail;
  onClose: () => void;
  bookmarkedIds: Set<number>;
  loadingIds: Set<number>;
  bookmark: (id: number) => void;
  followedKeywordIds: Set<number>;
  followingKeywordIds: Set<number>;
  toggleFollowKeyword: (id: number, name: string) => void;
}) {
  const saved = bookmarkedIds.has(paper.id);
  const loading = loadingIds.has(paper.id);

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-6"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-t-2xl md:rounded-2xl bg-surface-container border border-outline-variant/30 shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-surface-container/95 backdrop-blur-md border-b border-outline-variant/20 p-6 flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-primary/10 text-primary text-[10px] font-bold px-2 py-0.5 rounded border border-primary/20 uppercase tracking-widest">
                {paper.journal}
              </span>
              <span className="text-[10px] text-on-surface-variant uppercase tracking-widest flex items-center gap-1">
                <CalendarDays className="w-3 h-3" /> {paper.time}
              </span>
            </div>
            <h2 className="font-display text-lg font-bold text-on-surface leading-snug">{cleanTitle(paper.title)}</h2>
          </div>
          <button
            id="paper-detail-close-btn"
            onClick={onClose}
            className="w-9 h-9 flex-shrink-0 flex items-center justify-center rounded-full border border-outline-variant/30 text-on-surface-variant hover:text-on-surface hover:bg-white/5 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          <div className="flex items-start gap-3">
            <Users className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-1">Tác giả</p>
              <p className="text-sm text-on-surface">{paper.authors || "Chưa rõ tác giả"}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="glass-panel p-4 rounded-xl">
              <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-1 flex items-center gap-1">
                <Quote className="w-3 h-3" /> Trích dẫn
              </p>
              <p className="text-2xl font-bold text-on-surface">{paper.citations.toLocaleString()}</p>
            </div>
            <div className="glass-panel p-4 rounded-xl">
              <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-1 flex items-center gap-1">
                <BookMarked className="w-3 h-3" /> Chỉ số ảnh hưởng
              </p>
              <p className="text-2xl font-bold text-primary">{paper.impact}</p>
            </div>
          </div>

          {paper.keywords && paper.keywords.length > 0 && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-2">Từ khóa (Chủ đề)</p>
              <div className="flex flex-wrap gap-2">
                {paper.keywords.map((kw) => {
                  const isFollowed = followedKeywordIds.has(kw.id);
                  const isBtnLoading = followingKeywordIds.has(kw.id);
                  return (
                    <span 
                      key={kw.id} 
                      className={cn(
                        "text-xs px-2.5 py-1 rounded-full border flex items-center gap-1.5 transition-all select-none",
                        isFollowed 
                          ? "bg-secondary/15 text-secondary border-secondary/30" 
                          : "bg-primary/10 text-primary border-primary/20"
                      )}
                    >
                      #{kw.name}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFollowKeyword(kw.id, kw.name);
                        }}
                        disabled={isBtnLoading}
                        className="hover:scale-110 active:scale-95 transition-all ml-1 p-0.5 rounded-full hover:bg-white/10"
                        title={isFollowed ? "Hủy lưu chủ đề này" : "Lưu chủ đề này"}
                      >
                        {isBtnLoading ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : isFollowed ? (
                          <X className="w-3 h-3 text-secondary hover:text-error" />
                        ) : (
                          <BookmarkPlus className="w-3 h-3 hover:text-tertiary" />
                        )}
                      </button>
                    </span>
                  );
                })}
              </div>
            </div>
          )}

          {paper.abstract && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-2">Tóm tắt (Abstract)</p>
              <p className="text-sm text-on-surface-variant leading-relaxed line-clamp-6">{paper.abstract}</p>
            </div>
          )}

          {paper.doi && (
            <a
              href={paper.doi.startsWith("http") ? paper.doi : `https://doi.org/${paper.doi}`}
              target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-primary hover:text-tertiary transition-colors font-mono break-all"
            >
              <ExternalLink className="w-4 h-4 flex-shrink-0" />
              {paper.doi}
            </a>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-surface-container/95 backdrop-blur-md border-t border-outline-variant/20 p-4">
          <button
            id="paper-detail-bookmark-btn"
            disabled={loading}
            onClick={() => bookmark(paper.id)}
            className={cn(
              "w-full py-2.5 rounded-xl font-display text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-all",
              saved ? "bg-tertiary/20 text-tertiary border border-tertiary/30 hover:bg-tertiary/30" : "gradient-btn text-white"
            )}
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <BookmarkCheck className="w-4 h-4" /> : <BookmarkPlus className="w-4 h-4" />}
            {saved ? "Hủy lưu bài báo" : "Lưu bài báo"}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

function JournalDetailModal({ journal, onClose }: { journal: NonNullable<DashboardData['topJournals'][0]>; onClose: () => void }) {
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-6"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl bg-surface-container border border-outline-variant/30 shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-surface-container/95 backdrop-blur-md border-b border-outline-variant/20 p-6 flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl flex items-center justify-center font-display font-black text-2xl shadow-md flex-shrink-0 bg-[#0a0a0a] text-white border border-white/10">
              {journal.initial}
            </div>
            <div>
              <h2 className="font-display text-xl font-bold text-on-surface leading-tight">{journal.name}</h2>
              <p className="text-sm text-on-surface-variant mt-1">{journal.field}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-9 h-9 flex-shrink-0 flex items-center justify-center rounded-full border border-outline-variant/30 text-on-surface-variant hover:text-on-surface hover:bg-white/5 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Giải thích tiêu chí xếp hạng */}
          <div className="bg-primary/10 border border-primary/20 rounded-xl p-4 flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold text-primary mb-1">Cơ sở đánh giá xếp hạng</p>
              <p className="text-[11px] text-on-surface-variant leading-relaxed">
                Được công nhận là <strong>Tạp chí hàng đầu</strong> dựa trên chỉ số ảnh hưởng (Impact Factor) toàn cầu được trích xuất từ <strong>{journal.source || 'Hệ thống đánh giá độc lập'}</strong> kết hợp với dữ liệu phân tích thống kê trên SciTrend.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="glass-panel p-4 rounded-xl flex flex-col justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-0.5">Impact Factor</p>
                <p className="text-[9px] text-on-surface-variant/60 leading-tight mb-2">Chỉ số ảnh hưởng học thuật toàn cầu</p>
              </div>
              <p className="text-2xl font-bold text-primary">{journal.impact_factor || "N/A"}</p>
            </div>
            <div className="glass-panel p-4 rounded-xl flex flex-col justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-0.5">Chỉ số ISSN</p>
                <p className="text-[9px] text-on-surface-variant/60 leading-tight mb-2">Mã số chuẩn quốc tế định danh các xuất bản phẩm nhiều kỳ.</p>
              </div>
              {journal.issn ? (
                <p className="text-lg font-bold text-on-surface font-mono">{journal.issn}</p>
              ) : (
                <div className="space-y-1">
                  <p className="text-xs font-bold text-on-surface-variant/50 italic">Chưa có ISSN</p>
                  {journal.issn_note && (
                    <p className="text-[10px] leading-snug text-amber-400/80 bg-amber-400/10 border border-amber-400/20 rounded-lg px-2 py-1">
                      {journal.issn_note}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-1">Số bài báo đã thống kê</p>
                <p className="text-sm text-on-surface font-medium">{journal.papers_count?.toLocaleString() || 0} bài báo</p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-1">Nguồn đánh giá</p>
                <p className="text-sm text-primary font-medium">{journal.source || "N/A"}</p>
              </div>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-1">Nhà xuất bản</p>
              <p className="text-sm text-on-surface font-medium">{journal.publisher || "Chưa rõ nhà xuất bản"}</p>
            </div>
            
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-1">Trang chủ Tạp chí</p>
              {journal.url ? (
                <a
                  href={journal.url.startsWith("http") ? journal.url : `https://${journal.url}`}
                  target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-primary hover:text-tertiary transition-colors font-mono break-all"
                >
                  <ExternalLink className="w-4 h-4 flex-shrink-0" />
                  {journal.url}
                </a>
              ) : (
                <p className="text-sm text-on-surface-variant italic">Chưa có thông tin đường dẫn</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

function AiReviewModal({ papers, onClose }: { papers: PaperDetail[]; onClose: () => void }) {
  const [analyzing, setAnalyzing] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setAnalyzing(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} />
      <div className="bg-surface-container relative w-full max-w-2xl rounded-3xl border border-outline-variant/30 shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in zoom-in duration-300">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/5 flex justify-between items-center bg-surface sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-display font-bold text-lg">AI Phân tích Chuyên sâu</h2>
              <p className="text-xs text-on-surface-variant">Tổng hợp Literature Review tự động</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <X className="w-5 h-5 text-on-surface-variant" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto">
          {analyzing ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <Loader2 className="w-10 h-10 text-primary animate-spin" />
              <p className="text-sm text-on-surface-variant animate-pulse font-mono">Đang tổng hợp thông tin từ {papers.length} bài báo...</p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="glass-panel p-4 rounded-xl border border-primary/20">
                <h4 className="text-sm font-bold text-primary mb-2 flex items-center gap-2"><Sparkles className="w-4 h-4"/> Tổng quan Nghiên cứu</h4>
                <p className="text-sm text-on-surface leading-relaxed">
                  Dựa trên {papers.length} bài báo học thuật hàng đầu được đề xuất, xu hướng chung tập trung vào việc tối ưu hóa hiệu suất và ứng dụng các thuật toán máy học mới trong thực tiễn.
                </p>
              </div>

              <div>
                <h4 className="text-sm font-bold text-on-surface mb-3 flex items-center gap-2"><BookMarked className="w-4 h-4 text-tertiary"/> Điểm Tương Đồng</h4>
                <ul className="space-y-2">
                  {papers.map((p, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-on-surface-variant">
                      <div className="w-1.5 h-1.5 rounded-full bg-tertiary mt-2 shrink-0" />
                      <span>Bài viết <strong>"{p.title}"</strong> cũng nhấn mạnh vào việc phân tích dữ liệu quy mô lớn, tương tự các nghiên cứu gần đây trong lĩnh vực.</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h4 className="text-sm font-bold text-on-surface mb-3 flex items-center gap-2"><TrendingUp className="w-4 h-4 text-secondary"/> Định Hướng Mới</h4>
                <p className="text-sm text-on-surface-variant leading-relaxed p-4 bg-white/5 rounded-lg border border-white/5">
                  Các nghiên cứu này mở ra hướng đi mới trong việc ứng dụng AI để tự động hóa các quy trình đánh giá dữ liệu, giúp giảm thiểu sai sót do yếu tố con người. Bạn nên xem xét áp dụng các mô hình học sâu (Deep Learning) như được đề cập trong các bài báo này vào đề tài của mình.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {!analyzing && (
          <div className="px-6 py-4 border-t border-white/5 flex justify-end gap-3 bg-surface sticky bottom-0">
            <button className="px-4 py-2 text-sm font-bold rounded-lg border border-outline-variant/30 hover:bg-white/5 transition-colors">
              Lưu bản nháp
            </button>
            <button className="px-4 py-2 text-sm font-bold rounded-lg gradient-btn text-white flex items-center gap-2">
              <Quote className="w-4 h-4" /> Trích xuất trích dẫn
            </button>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [showAllJournals, setShowAllJournals] = useState(false);
  const [selectedPaper, setSelectedPaper] = useState<PaperDetail | null>(null);
  const [selectedJournal, setSelectedJournal] = useState<NonNullable<DashboardData['topJournals'][0]> | null>(null);
  const [followedJournalIds, setFollowedJournalIds] = useState<Set<number>>(new Set());
  const [followingJournalIds, setFollowingJournalIds] = useState<Set<number>>(new Set());
  const [followedKeywordIds, setFollowedKeywordIds] = useState<Set<number>>(new Set());
  const [followingKeywordIds, setFollowingKeywordIds] = useState<Set<number>>(new Set());

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
  const [showAiReview, setShowAiReview] = useState(false);
  const { bookmarkedIds, loadingIds, bookmark, setBookmarkedIds } = useBookmark();

  // Redirect admin to their own dashboard
  const currentUserStr = localStorage.getItem("user");
  const currentUser = currentUserStr ? JSON.parse(currentUserStr) : null;
  const role = currentUser?.role || "student";
  const isResearcher = role === "researcher" || role === "admin";
  if (role === "admin") {
    return <Navigate to="/admin/dashboard" replace />;
  }

  useEffect(() => {
    // Gọi song song 2 APIs để giảm thời gian chờ tổng cộng
    Promise.all([
      api.get<any>('/dashboard'),
      loadFollowedJournals(),
    ])
      .then(([res]) => {
        const mappedStats = [
          { label: "Tổng số bài báo", value: String(res.stats?.total_papers ?? 0), trend: "Kho lưu trữ" },
          { label: "Số lượng từ khóa", value: String(res.stats?.total_keywords ?? 0), trend: "Theo dõi" },
          { label: "Ấn phẩm năm nay", value: String(res.stats?.papers_this_year ?? 0), trend: "Mới nhận" },
          { label: "Bài báo đã lưu", value: String(res.stats?.total_bookmarks ?? 0), trend: "Bộ sưu tập" },
        ];

        const mappedTrending = (res.trending_topics || []).map((t: any) => {
          const rate = t.growth_rate ?? 0;
          return {
            id: t.id,
            name: t.keyword?.name || "Chủ đề",
            papers: `${t.paper_count ?? 0}`,
            change: rate >= 0 ? `+${rate}%` : `${rate}%`,
            data: t.chart_data || [0, 0, 0, 0, 0, 0, 0],
          };
        });

        const mappedRecent = (res.recent_papers || []).map((p: any) => ({
          id: p.id,
          title: p.title,
          journal: p.journal?.name || "Khác",
          authors: (p.authors || []).map((a: any) => a.name).join(", ") || "Chưa rõ tác giả",
          time: `${p.published_year ?? ""}`,
          impact: p.citations_count ? Math.round((p.citations_count / 10) * 10) / 10 : 0,
          citations: p.citations_count ?? 0,
          doi: p.doi ?? null,
          abstract: p.abstract ?? null,
          keywords: (p.keywords || []).map((k: any) => ({ id: k.id, name: k.name })),
        }));

        setData({
          stats: mappedStats,
          trendingTopics: mappedTrending,
          recentPapers: mappedRecent,
          recommendedPapers: res.recommended_papers || [],
          topJournals: res.top_journals || [],
          fieldsDistribution: res.fields_distribution || [],
          topJournalsUpdatedAt: res.top_journals_updated_at || "",
          recentPapersUpdatedAt: res.recent_papers_updated_at || "",
        });

        if (res.bookmarked_paper_ids) {
          setBookmarkedIds(new Set(res.bookmarked_paper_ids));
        }
      })
      .catch(err => {
        console.error("Lỗi tải thông tin dashboard", err);
      });
    loadFollowedJournals();
    loadFollowedKeywords();
  }, [loadFollowedJournals, loadFollowedKeywords]);

  if (!data) return (
    <div className="space-y-8 pb-20 animate-pulse">
      {/* Stats skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="glass-panel p-6 rounded-xl">
            <div className="h-3 w-24 bg-white/10 rounded mb-3" />
            <div className="h-8 w-16 bg-white/20 rounded" />
          </div>
        ))}
      </div>
      {/* Trending skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="glass-panel p-6 rounded-xl h-40">
            <div className="h-4 w-32 bg-white/10 rounded mb-4" />
            <div className="h-3 w-20 bg-white/10 rounded mb-6" />
            <div className="h-16 bg-white/5 rounded" />
          </div>
        ))}
      </div>
      {/* Papers skeleton */}
      <div className="glass-panel rounded-xl overflow-hidden divide-y divide-white/5">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="p-6 flex gap-4">
            <div className="flex-1 space-y-2">
              <div className="h-3 w-24 bg-white/10 rounded" />
              <div className="h-4 w-full bg-white/15 rounded" />
              <div className="h-3 w-48 bg-white/10 rounded" />
            </div>
            <div className="w-10 h-10 rounded-full bg-white/10" />
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="space-y-12 pb-20">
      {/* Paper Detail Modal */}
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

      {/* Journal Detail Modal */}
      {selectedJournal && (
        <JournalDetailModal
          journal={selectedJournal}
          onClose={() => setSelectedJournal(null)}
        />
      )}

      {showAiReview && data && (
        <AiReviewModal 
          papers={data.recommendedPapers} 
          onClose={() => setShowAiReview(false)} 
        />
      )}

      {/* Hero Section */}
      <section className="text-center space-y-6 py-8">
        <h2 className="font-display text-5xl md:text-6xl font-bold tracking-tight text-on-surface">
          Khám phá ranh giới tiên tiến của <span className="gradient-text">nghiên cứu.</span>
        </h2>
        <p className="max-w-2xl mx-auto text-on-surface-variant text-lg">
          Phân tích xu hướng, theo dõi trích dẫn và khám phá thông tin chuyên sâu trên hàng triệu bài báo học thuật ngay lập tức.
        </p>
        <div className="flex justify-center flex-wrap gap-4 pt-4">
          <span className="font-mono text-[10px] text-on-surface-variant uppercase tracking-widest mt-1">Xu hướng:</span>
          {data.trendingTopics.slice(0, 3).map(t => (
            <button key={t.id} className="text-primary text-sm hover:text-tertiary transition-colors border-b border-primary/20 hover:border-tertiary/50">
              {t.name}
            </button>
          ))}
        </div>
      </section>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {data.stats.map((stat, i) => (
          <div key={i} className="glass-panel p-6 rounded-xl hover:bg-white/5 transition-all">
            <p className="font-display text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-1">{stat.label}</p>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-on-surface tracking-tighter">{stat.value}</span>
              <span className="text-tertiary text-xs font-mono font-bold">{stat.trend}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column */}
        <div className="lg:col-span-8 space-y-8">
          <header className="flex justify-between items-end">
            <div>
              <h3 className="font-display text-2xl font-bold text-on-surface">Xu hướng nghiên cứu</h3>
              <p className="text-sm text-on-surface-variant">Thúc đẩy các lĩnh vực nghiên cứu trong chuyên môn của bạn.</p>
            </div>
            <Link to="/trending" className="flex items-center gap-1 text-primary text-[10px] font-bold uppercase tracking-widest hover:text-tertiary transition-colors">
              Xem tất cả <ArrowRight className="w-3 h-3" />
            </Link>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {data.trendingTopics.map((topic) => (
              <div key={topic.id} className="glass-panel p-6 rounded-xl relative group overflow-hidden hover:border-primary/40 transition-all cursor-pointer">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="flex justify-between items-start mb-4">
                   <h4 className="font-display text-lg font-bold leading-tight group-hover:text-primary transition-colors">{topic.name}</h4>
                   <span className="bg-tertiary-container/20 text-tertiary text-[10px] font-bold px-1.5 py-0.5 rounded border border-tertiary/20 flex items-center gap-0.5">
                    <TrendingUp className="w-2.5 h-2.5" /> {topic.change}
                   </span>
                </div>
                <p className="text-xs text-on-surface-variant mb-4">{topic.papers} bài báo mới trong tháng này</p>
                <div className="h-16">
                  <Chart
                    options={{
                      chart: { id: `trending-topic-${topic.id}`, sparkline: { enabled: true }, animations: { speed: 500 } },
                      stroke: { curve: "smooth", width: 2, colors: ["#3B82F6"] },
                      fill: { type: "gradient", gradient: { shadeIntensity: 1, opacityFrom: 0.4, opacityTo: 0 } },
                      tooltip: { enabled: false },
                    }}
                    series={[{ data: topic.data }]}
                    type="area"
                    height={64}
                  />
                </div>
              </div>
            ))}
          </div>

          <section className="pt-4">
            <header className="flex justify-between items-end mb-6">
              <div>
                <div className="flex items-baseline gap-3">
                  <h3 className="font-display text-2xl font-bold text-on-surface">Vừa xuất bản</h3>
                  {data.recentPapersUpdatedAt && (
                    <span className="text-[10px] text-on-surface-variant/60 font-mono">
                      Cập nhật: {data.recentPapersUpdatedAt}
                    </span>
                  )}
                </div>
                <p className="text-sm text-on-surface-variant">Các bổ sung mới nhất trên hệ thống.</p>
              </div>
              <span className="text-[10px] font-mono text-on-surface-variant/50 uppercase tracking-widest">
                {data.recentPapers.length} bài báo
              </span>
            </header>

            <div className="glass-panel rounded-xl overflow-hidden divide-y divide-white/5">
              {data.recentPapers.map((paper) => (
                <div
                  key={paper.id}
                  id={`paper-row-${paper.id}`}
                  className="p-6 hover:bg-white/5 transition-all group flex flex-col md:flex-row gap-4 justify-between items-start md:items-center cursor-pointer"
                  onClick={() => setSelectedPaper(paper)}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                       <span className="bg-primary/10 text-primary text-[10px] font-bold px-2 py-0.5 rounded border border-primary/20 uppercase tracking-widest">{paper.journal}</span>
                       <span className="text-[10px] text-on-surface-variant uppercase tracking-widest">{paper.time}</span>
                    </div>
                    <h4 className="font-display font-bold text-on-surface group-hover:text-primary transition-colors">{paper.title}</h4>
                    <p className="text-sm text-on-surface-variant mt-1">{paper.authors}</p>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right hidden md:block">
                      <p className="text-[10px] font-bold text-primary uppercase tracking-widest">Ảnh hưởng: {paper.impact}</p>
                      <p className="text-[10px] text-on-surface-variant uppercase tracking-widest">{paper.citations} Trích dẫn</p>
                    </div>
                    <BookmarkButton
                      paperId={paper.id}
                      bookmarkedIds={bookmarkedIds}
                      loadingIds={loadingIds}
                      bookmark={bookmark}
                      className="w-10 h-10 rounded-full border-2 border-outline-variant/30 bg-surface-container/50 hover:border-tertiary"
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>

        </div>

        {/* Right Column */}
        <div className="lg:col-span-4 space-y-8">
           {isResearcher && (
             <section className="glass-panel-intense rounded-2xl p-8 relative overflow-hidden group border-t-2 border-primary/50">
               <div className="absolute -right-4 -top-4 w-32 h-32 bg-primary/10 rounded-full blur-3xl pointer-events-none group-hover:bg-primary/20 transition-colors" />
               <div className="flex items-center gap-2 mb-6">
                 <Sparkles className="w-6 h-6 text-primary" />
                 <h3 className="font-display text-xl font-bold">Động cơ Thông tin chuyên sâu</h3>
               </div>
               <p className="text-sm text-on-surface-variant leading-relaxed mb-6">
                 Dựa trên mối quan tâm nghiên cứu của bạn, chúng tôi đề xuất những bài báo học thuật nổi bật sau cho quá trình đánh giá và nghiên cứu của bạn.
               </p>
               <div className="space-y-4">
                 {data.recommendedPapers.map((rec) => (
                   <div key={rec.id} onClick={() => setSelectedPaper(rec)} className="p-4 rounded-xl bg-surface-container/30 border-2 border-outline-variant/30 hover:border-primary/30 transition-all cursor-pointer group">
                     <h5 className="text-sm font-bold leading-tight mb-2 group-hover:text-primary transition-colors">{rec.title}</h5>
                     <div className="flex justify-between items-center text-[10px] uppercase font-bold tracking-widest text-on-surface-variant">
                       <span className="truncate max-w-[200px]">{rec.authors}</span>
                       <span className="text-primary">{rec.match} Phù hợp</span>
                     </div>
                   </div>
                 ))}
                 {data.recommendedPapers.length === 0 && (
                   <p className="text-xs text-on-surface-variant text-center py-4">Chưa có bài viết gợi ý nào mới.</p>
                 )}
               </div>
                <button
                  onClick={() => setShowAiReview(true)}
                  disabled={data.recommendedPapers.length === 0}
                  className="w-full mt-8 gradient-btn py-3 rounded-xl font-display text-xs font-bold uppercase tracking-widest text-white flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                  Tạo đánh giá <BookOpen className="w-4 h-4" />
                </button>
             </section>
           )}

           {/* ── STUDENT-ONLY WIDGETS ──────────────────────────────────────── */}
           {!isResearcher && (
             <>
               {/* Widget 1: Tủ sách của tôi */}
               <section className="glass-panel-intense rounded-2xl p-6 relative overflow-hidden border-t-2 border-tertiary/50">
                 <div className="absolute -left-6 -top-6 w-28 h-28 bg-tertiary/10 rounded-full blur-3xl pointer-events-none" />
                 <div className="flex items-center justify-between mb-5">
                   <div className="flex items-center gap-2">
                     <Library className="w-5 h-5 text-tertiary" />
                     <h3 className="font-display text-lg font-bold">Tủ sách của tôi</h3>
                   </div>
                   <Link
                     to="/bookmarks"
                     className="text-[10px] font-bold uppercase tracking-widest text-tertiary hover:text-primary transition-colors flex items-center gap-1"
                   >
                     Xem tất cả <ArrowRight className="w-3 h-3" />
                   </Link>
                 </div>

                 {bookmarkedIds.size > 0 ? (
                   <div className="space-y-3">
                     {data.recentPapers
                       .filter(p => bookmarkedIds.has(p.id))
                       .slice(0, 2)
                       .map(paper => (
                         <div
                           key={paper.id}
                           onClick={() => setSelectedPaper(paper)}
                           className="flex items-start gap-3 p-3 rounded-xl bg-surface-container/30 border border-outline-variant/20 hover:border-tertiary/40 hover:bg-white/5 transition-all cursor-pointer group"
                         >
                           <div className="w-8 h-8 rounded-lg bg-tertiary/15 flex items-center justify-center flex-shrink-0 mt-0.5">
                             <BookmarkCheck className="w-4 h-4 text-tertiary" />
                           </div>
                           <div className="flex-1 min-w-0">
                             <p className="text-xs font-bold text-on-surface leading-snug group-hover:text-tertiary transition-colors line-clamp-2">
                               {paper.title}
                             </p>
                             <p className="text-[10px] text-on-surface-variant mt-1 truncate">{paper.journal} · {paper.time}</p>
                           </div>
                         </div>
                       ))
                     }
                     {data.recentPapers.filter(p => bookmarkedIds.has(p.id)).length === 0 && (
                       <div className="text-center py-6 space-y-3">
                         <BookmarkPlus className="w-8 h-8 text-on-surface-variant/40 mx-auto" />
                         <p className="text-xs text-on-surface-variant">Hãy lưu bài báo bạn quan tâm để xem lại ở đây.</p>
                       </div>
                     )}
                   </div>
                 ) : (
                   <div className="text-center py-8 space-y-3">
                     <div className="w-14 h-14 rounded-full bg-tertiary/10 flex items-center justify-center mx-auto">
                       <BookmarkPlus className="w-7 h-7 text-tertiary/60" />
                     </div>
                     <p className="text-sm font-bold text-on-surface">Tủ sách trống</p>
                     <p className="text-xs text-on-surface-variant leading-relaxed">
                       Bấm nút <BookmarkPlus className="w-3 h-3 inline text-tertiary" /> trên bất kỳ bài báo nào để lưu vào tủ sách của bạn.
                     </p>
                   </div>
                 )}

                 {/* Quick stats */}
                 <div className="mt-5 pt-4 border-t border-outline-variant/20 grid grid-cols-2 gap-3">
                   <div className="text-center p-3 rounded-xl bg-surface-container/50">
                     <p className="text-2xl font-bold text-tertiary">{bookmarkedIds.size}</p>
                     <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mt-0.5">Đã lưu</p>
                   </div>
                   <div className="text-center p-3 rounded-xl bg-surface-container/50">
                     <p className="text-2xl font-bold text-primary">{data.recentPapers.length}</p>
                     <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mt-0.5">Bài mới</p>
                   </div>
                 </div>
               </section>

               {/* Widget 2: Mẹo tìm kiếm học thuật */}
               <section className="glass-panel rounded-2xl p-6 border-t-2 border-secondary/40">
                 <div className="flex items-center gap-2 mb-5">
                   <div className="w-8 h-8 rounded-lg bg-secondary/15 flex items-center justify-center">
                     <Lightbulb className="w-4 h-4 text-secondary" />
                   </div>
                   <h3 className="font-display text-lg font-bold">Mẹo tìm kiếm học thuật</h3>
                 </div>

                 <div className="space-y-3">
                   {[
                     { op: "AND", desc: "Kết hợp nhiều từ khóa cùng lúc", example: "AI AND healthcare", color: "text-primary bg-primary/10 border-primary/20" },
                     { op: "OR", desc: "Mở rộng kết quả tìm kiếm", example: "deep learning OR neural network", color: "text-secondary bg-secondary/10 border-secondary/20" },
                     { op: "NOT", desc: "Loại trừ từ không mong muốn", example: "blockchain NOT bitcoin", color: "text-tertiary bg-tertiary/10 border-tertiary/20" },
                     { op: `" "`, desc: 'Tìm cụm từ chính xác', example: `"machine learning"`, color: "text-on-surface bg-white/5 border-outline-variant/30" },
                   ].map((tip) => (
                     <div key={tip.op} className="p-3 rounded-xl bg-surface-container/30 border border-outline-variant/20 hover:bg-white/5 transition-colors">
                       <div className="flex items-center gap-2 mb-1.5">
                         <span className={cn("text-[10px] font-black px-2 py-0.5 rounded border font-mono uppercase tracking-widest", tip.color)}>
                           {tip.op || '" "'}
                         </span>
                         <p className="text-xs text-on-surface font-bold">{tip.desc}</p>
                       </div>
                       <p className="text-[10px] font-mono text-on-surface-variant pl-1 italic">Ví dụ: {tip.example}</p>
                     </div>
                   ))}
                 </div>

                 <Link
                   to="/search"
                   className="mt-5 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 border-secondary/30 text-secondary text-xs font-bold uppercase tracking-widest hover:bg-secondary/10 transition-all"
                 >
                   <Search className="w-4 h-4" />
                   Thử tìm kiếm ngay
                 </Link>
               </section>
             </>
           )}

            <section className="space-y-4">
              <div className="flex items-baseline justify-between px-2">
                <h3 className="font-display text-xl font-bold text-on-surface">Tạp chí hàng đầu</h3>
                {data.topJournalsUpdatedAt && (
                  <span className="text-[10px] text-on-surface-variant/60 font-mono">
                    Cập nhật: {data.topJournalsUpdatedAt}
                  </span>
                )}
              </div>
              
              <div 
                className={cn(
                  "space-y-3 transition-all duration-300",
                  showAllJournals ? "max-h-[290px] overflow-y-auto pr-1.5 scroll-smooth" : ""
                )}
                style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.15) transparent' }}
              >
                {(showAllJournals ? data.topJournals : data.topJournals.slice(0, 3)).map((j) => (
                  <div
                    key={j.id}
                    onClick={() => setSelectedJournal(j)}
                    className="glass-panel p-4 rounded-xl border-2 flex items-center gap-4 hover:bg-white/5 transition-all group cursor-pointer"
                  >
                     <div className="w-12 h-12 rounded-lg flex items-center justify-center font-display font-black text-xl shadow-md bg-[#0a0a0a] text-white border border-white/10">
                       {j.initial}
                     </div>
                     <div className="flex-1 min-w-0">
                       <h4 className="font-bold text-on-surface leading-tight truncate group-hover:text-primary transition-colors">{j.name}</h4>
                       <p className="text-xs text-on-surface-variant">{j.field}</p>
                     </div>
                     {isResearcher && (
                       <button
                         onClick={(e) => {
                           e.stopPropagation();
                           toggleFollowJournal(j.id, j.name);
                         }}
                         disabled={followingJournalIds.has(j.id)}
                         title={followedJournalIds.has(j.id) ? 'Bỏ theo dõi' : 'Theo dõi tạp chí'}
                         className={cn(
                           "flex-shrink-0 p-2 rounded-lg transition-all",
                           followedJournalIds.has(j.id)
                             ? "text-primary bg-primary/10 hover:bg-error/10 hover:text-error"
                             : "text-on-surface-variant hover:text-primary hover:bg-primary/10"
                         )}
                       >
                         {followingJournalIds.has(j.id)
                           ? <Loader2 className="w-4 h-4 animate-spin" />
                           : followedJournalIds.has(j.id)
                             ? <BellOff className="w-4 h-4" />
                             : <Bell className="w-4 h-4" />
                         }
                       </button>
                     )}
                  </div>
                ))}
                {data.topJournals.length === 0 && (
                  <p className="text-xs text-on-surface-variant text-center py-4">Không có tạp chí nào.</p>
                )}
              </div>

              {data.topJournals.length > 3 && (
                <button
                  onClick={() => setShowAllJournals(!showAllJournals)}
                  className="w-full text-center py-2.5 text-[10px] font-bold uppercase tracking-widest text-primary hover:text-tertiary transition-all border border-dashed border-primary/20 rounded-xl hover:border-tertiary/40 bg-primary/5 hover:bg-tertiary/5 mt-2 flex items-center justify-center gap-1.5"
                >
                  {showAllJournals ? "Thu gọn bảng xếp hạng" : `Xem bảng xếp hạng đầy đủ (Top ${data.topJournals.length})`}
                  <ChevronRight className={cn("w-3.5 h-3.5 transition-transform duration-300", showAllJournals ? "rotate-90" : "")} />
                </button>
              )}
            </section>

           {isResearcher && (
             <section className="space-y-4">
               <h3 className="font-display text-xl font-bold px-2">Phân bổ Chủ đề (Topics)</h3>
               {data.fieldsDistribution.length > 0 ? (
                 <div className="glass-panel p-6 rounded-xl border-2 h-72 flex items-center justify-center">
                   <Chart
                      options={{
                        chart: { id: "fields-distribution-donut", type: "donut", background: "transparent", foreColor: "var(--on-surface)", toolbar: { show: false } },
                        labels: data.fieldsDistribution.map(f => f.name),
                        colors: ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6"],
                        stroke: { show: false },
                        legend: { position: "bottom", labels: { colors: "var(--on-surface-variant)" }, markers: { radius: 12 } as any },
                        dataLabels: { enabled: false },
                        plotOptions: {
                          pie: {
                            donut: {
                              size: "70%",
                              labels: {
                                show: true,
                                name: { show: true, fontSize: "12px", fontFamily: "inherit", color: "var(--on-surface-variant)" },
                                value: { show: true, fontSize: "20px", fontFamily: "inherit", fontWeight: "bold", color: "var(--on-surface)" },
                                total: { show: true, label: "Tổng cộng", color: "var(--on-surface-variant)", formatter: () => String(data.fieldsDistribution.reduce((acc, curr) => acc + curr.value, 0)) },
                              },
                            },
                          },
                        },
                      }}
                      series={data.fieldsDistribution.map(f => f.value)}
                      type="donut"
                      width="100%"
                      height="100%"
                    />
                 </div>
               ) : (
                 <p className="text-xs text-on-surface-variant text-center py-4">Chưa có dữ liệu phân bổ.</p>
               )}
             </section>
           )}
        </div>
      </div>
    </div>
  );
}
