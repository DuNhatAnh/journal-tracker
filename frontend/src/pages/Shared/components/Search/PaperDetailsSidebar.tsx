import React, { useState, useEffect } from "react";
import { BookOpen, Sparkles, RefreshCw, Copy, Check, Loader2 } from "lucide-react";
import { api } from "@/src/lib/api";
import { formatAPA, formatBibTeX } from "@/src/lib/citationUtils";
import toast from "react-hot-toast";

interface Author {
  id: number;
  name: string;
}

interface Paper {
  id: number;
  title: string;
  abstract: string;
  published_year: number;
  citations_count: number;
  source: string;
  doi?: string;
  authors: Author[];
  keywords?: { id: number; name: string }[];
  journal?: { id: number; name: string };
}

interface PaperDetailsSidebarProps {
  paperToShow: Paper | null;
  bookmarkedIds: Set<number>;
  bookmarkLoadingIds: Set<number>;
  onBookmark: (paperId: number) => void;
}

export const PaperDetailsSidebar: React.FC<PaperDetailsSidebarProps> = ({
  paperToShow,
  bookmarkedIds,
  bookmarkLoadingIds,
  onBookmark,
}) => {
  const [summary, setSummary] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [copiedAPA, setCopiedAPA] = useState(false);
  const [copiedBib, setCopiedBib] = useState(false);
  const [summariesCache, setSummariesCache] = useState<Record<number, any>>({});
  const [selectedVersion, setSelectedVersion] = useState<number>(-1);

  const checkExistingSummary = async (id: number) => {
    try {
      const res = await api.post<{
        success: boolean;
        cached: boolean;
        data?: any;
      }>("/dashboard/ai-summary", {
        paper_id: id,
        title: "check",
        abstract: "check",
        check_only: true
      });
      if (res.success && res.cached && res.data) {
        setSummary(res.data);
        setSummariesCache(prev => ({ ...prev, [id]: res.data }));
      }
    } catch (err) {
      console.error("Error checking summary cache", err);
    }
  };

  useEffect(() => {
    if (paperToShow) {
      if (summariesCache[paperToShow.id]) {
        setSummary(summariesCache[paperToShow.id]);
      } else {
        setSummary(null);
        checkExistingSummary(paperToShow.id);
      }
    } else {
      setSummary(null);
    }
  }, [paperToShow?.id]);

  useEffect(() => {
    setSelectedVersion(-1);
  }, [paperToShow?.id, summary]);

  const displayedSummary = !summary ? null : (
    selectedVersion === -1 ? summary : (summary.history?.[selectedVersion] || null)
  );

  if (!paperToShow) {
    return (
      <div className="lg:col-span-3 w-full glass-panel p-6 rounded-3xl border border-outline-variant/30 bg-surface-container-low/40 text-center space-y-4 order-2 lg:order-2 h-[780px] flex flex-col justify-center">
        <div className="w-12 h-12 rounded-2xl bg-secondary/10 border border-secondary/20 flex items-center justify-center text-secondary mx-auto">
          <BookOpen className="w-6 h-6 animate-pulse" />
        </div>
        <div className="space-y-1">
          <h4 className="text-sm font-bold text-on-surface">Chi tiết Bài báo Khoa học</h4>
          <p className="text-xs text-on-surface-variant leading-relaxed">
            Nhấp chuột vào một nút bài báo màu cam trên bản đồ để xem chi tiết tóm tắt Abstract khoa học và liên kết trích dẫn.
          </p>
        </div>
      </div>
    );
  }

  const isBookmarked = bookmarkedIds.has(paperToShow.id);
  const isBookmarkLoading = bookmarkLoadingIds.has(paperToShow.id);

  const handleFetchSummary = async (force = false) => {
    setLoading(true);
    try {
      const authorsStr = paperToShow.authors?.map(a => a.name).join(", ") || "Không rõ tác giả";
      const res = await api.post<{
        success: boolean;
        data: any;
        error?: string;
      }>("/dashboard/ai-summary", {
        paper_id: paperToShow.id,
        title: paperToShow.title,
        abstract: paperToShow.abstract,
        authors: authorsStr,
        force_refresh: force
      });
      if (res.success && res.data) {
        setSummary(res.data);
        setSummariesCache(prev => ({ ...prev, [paperToShow.id]: res.data }));
        toast.success(force ? "Đã làm mới tóm tắt AI!" : "Tạo tóm tắt AI thành công!");
      } else {
        toast.error(res.error || "Không thể lấy tóm tắt AI");
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Lỗi kết nối tới dịch vụ AI");
    } finally {
      setLoading(false);
    }
  };

  const handleCopyAPA = () => {
    const apa = formatAPA({
      id: paperToShow.id,
      title: paperToShow.title,
      published_year: paperToShow.published_year,
      citations_count: paperToShow.citations_count,
      doi: paperToShow.doi,
      authors: paperToShow.authors,
      journal: paperToShow.journal ? { name: paperToShow.journal.name } : undefined
    });
    navigator.clipboard.writeText(apa);
    setCopiedAPA(true);
    toast.success("Đã sao chép định dạng APA!");
    setTimeout(() => setCopiedAPA(false), 2000);
  };

  const handleCopyBib = () => {
    const bib = formatBibTeX({
      id: paperToShow.id,
      title: paperToShow.title,
      published_year: paperToShow.published_year,
      citations_count: paperToShow.citations_count,
      doi: paperToShow.doi,
      authors: paperToShow.authors,
      journal: paperToShow.journal ? { name: paperToShow.journal.name } : undefined
    });
    navigator.clipboard.writeText(bib);
    setCopiedBib(true);
    toast.success("Đã sao chép định dạng BibTeX!");
    setTimeout(() => setCopiedBib(false), 2000);
  };

  return (
    <div className="lg:col-span-3 w-full glass-panel p-6 rounded-3xl border border-outline-variant/35 bg-surface-container-low/40 space-y-4 animate-fade-in flex flex-col h-[780px] overflow-y-auto order-2 lg:order-2">
      <div className="space-y-2.5">
        <span className="text-[9px] bg-primary/10 text-primary border border-primary/20 px-2.5 py-0.5 rounded-full font-black uppercase tracking-wider">
          Bài báo đang xem
        </span>
        <h3 className="text-sm font-extrabold text-on-surface leading-snug line-clamp-3">
          {paperToShow.title}
        </h3>
        <div className="flex flex-wrap gap-1.5 text-[9px] font-bold text-on-surface-variant">
          <span className="bg-surface-container-highest px-2 py-0.5 rounded-md">
            📅 {paperToShow.published_year}
          </span>
          <span className="bg-surface-container-highest px-2 py-0.5 rounded-md text-secondary">
            🔥 {paperToShow.citations_count} trích dẫn
          </span>
        </div>
      </div>

      <div className="h-px bg-outline-variant/20" />

      {/* Authors & Journal */}
      <div className="space-y-2 text-xs">
        <div className="space-y-0.5">
          <span className="text-[9px] font-bold text-on-surface-variant uppercase tracking-wider">Tác giả:</span>
          <p className="font-bold text-on-surface leading-normal text-xs text-wrap">
            {paperToShow.authors?.map(a => a.name).join(", ") || "Nhiều tác giả"}
          </p>
        </div>
        {paperToShow.journal && (
          <div className="space-y-0.5">
            <span className="text-[9px] font-bold text-on-surface-variant uppercase tracking-wider">Tạp chí:</span>
            <p className="font-bold text-primary leading-normal text-xs">
              🏢 {paperToShow.journal.name}
            </p>
          </div>
        )}
      </div>

      <div className="h-px bg-outline-variant/20" />

      {/* AI Summary Section */}
      <div className="bg-primary/5 rounded-2xl p-4 border border-primary/10 space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-black text-primary uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" /> Trợ lý tóm tắt AI
          </span>
          {summary && !loading && (
            <button
              type="button"
              onClick={() => handleFetchSummary(true)}
              className="text-on-surface-variant hover:text-primary transition-colors cursor-pointer"
              title="Làm mới tóm tắt"
            >
              <RefreshCw className="w-3 h-3" />
            </button>
          )}
        </div>

        {summary && summary.history && summary.history.length > 0 && !loading && (
          <div className="flex items-center justify-between text-[10px] bg-primary/10 border border-primary/20 px-3 py-1.5 rounded-xl">
            <span className="font-bold text-primary">Lịch sử tóm tắt:</span>
            <select
              value={selectedVersion}
              onChange={(e) => setSelectedVersion(Number(e.target.value))}
              className="bg-surface-container-highest px-2 py-0.5 rounded border border-outline-variant/35 text-[9px] font-bold text-on-surface focus:outline-none cursor-pointer"
            >
              <option value="-1">Mới nhất ({summary.created_at || 'Không rõ'})</option>
              {summary.history.map((h: any, idx: number) => (
                <option key={idx} value={idx}>
                  Bản cũ #{summary.history.length - idx} ({h.created_at || 'Không rõ'})
                </option>
              ))}
            </select>
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-4 space-y-2">
            <Loader2 className="w-5 h-5 animate-spin text-primary" />
            <span className="text-[9px] font-bold text-primary/75">AI đang tổng hợp nội dung...</span>
          </div>
        ) : displayedSummary ? (
          <div className="space-y-3 text-xs animate-fade-in">
            <div className="space-y-1">
              <span className="text-[9px] font-black text-on-surface-variant uppercase tracking-wider">TL;DR:</span>
              <p className="text-on-surface leading-relaxed font-semibold italic text-justify">
                "{displayedSummary.tldr}"
              </p>
            </div>
            <div className="space-y-1">
              <span className="text-[9px] font-black text-on-surface-variant uppercase tracking-wider">Insights:</span>
              <ul className="list-disc pl-4 space-y-1 text-on-surface-variant leading-relaxed text-justify">
                {displayedSummary.insights.map((insight: string, idx: number) => (
                  <li key={idx}>{insight}</li>
                ))}
              </ul>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => handleFetchSummary(false)}
            className="w-full py-2 rounded-xl text-[10px] font-black bg-primary text-white hover:bg-primary/95 transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
          >
            <Sparkles className="w-3 h-3" /> Tạo tóm tắt thông minh
          </button>
        )}
      </div>

      <div className="h-px bg-outline-variant/20" />

      {/* Abstract */}
      <div className="space-y-1.5 pr-1">
        <span className="text-[9px] font-bold text-on-surface-variant uppercase tracking-wider">Tóm tắt (Abstract):</span>
        <p className="text-xs text-on-surface-variant leading-relaxed text-justify font-normal whitespace-pre-line">
          {paperToShow.abstract || "Bài báo này chưa có dữ liệu tóm tắt Abstract."}
        </p>
      </div>

      <div className="h-px bg-outline-variant/20" />

      {/* Citation Copy Actions */}
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={handleCopyAPA}
          className="py-2 rounded-xl border border-outline-variant/35 hover:border-primary/45 hover:text-primary transition-all text-[10px] font-black uppercase tracking-wider text-on-surface flex items-center justify-center gap-1.5 cursor-pointer bg-surface-container-low"
        >
          {copiedAPA ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
          <span>Sao chép APA</span>
        </button>
        <button
          type="button"
          onClick={handleCopyBib}
          className="py-2 rounded-xl border border-outline-variant/35 hover:border-primary/45 hover:text-primary transition-all text-[10px] font-black uppercase tracking-wider text-on-surface flex items-center justify-center gap-1.5 cursor-pointer bg-surface-container-low"
        >
          {copiedBib ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
          <span>Sao chép BibTeX</span>
        </button>
      </div>

      {/* Action Buttons */}
      <div className="space-y-2 pt-1">
        <button
          type="button"
          onClick={() => onBookmark(paperToShow.id)}
          disabled={isBookmarkLoading}
          className={`w-full py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm active:scale-98 ${isBookmarked
            ? "bg-surface-container-highest border border-outline text-on-surface hover:bg-surface-container-high"
            : "bg-primary text-white hover:bg-primary/90"
            }`}
        >
          <span>{isBookmarked ? "⭐️ Đã lưu bài báo" : "☆ Lưu bài báo này"}</span>
        </button>

        {paperToShow.doi && (
          <a
            href={`https://doi.org/${paperToShow.doi}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-2.5 rounded-2xl text-xs font-bold bg-surface-container hover:bg-surface-container-high border border-outline-variant/35 text-on-surface transition-all flex items-center justify-center gap-1.5 shadow-sm hover:text-primary active:scale-98"
          >
            <span>🔗 Mở liên kết DOI</span>
          </a>
        )}
      </div>
    </div>
  );
};
