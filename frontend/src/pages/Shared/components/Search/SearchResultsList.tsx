import React, { useState, useEffect, useRef } from "react";
import { Loader2, Bookmark, Quote, ChevronLeft, ChevronRight, ChevronUp } from "lucide-react";
import { cn, cleanTitle } from "@/src/lib/utils";

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
  url?: string;
  authors: Author[];
  keywords?: { id: number; name: string }[];
  journal?: { id: number; name: string };
}

interface SearchResultsListProps {
  papers: Paper[];
  loading: boolean;
  bookmarkedIds: Set<number>;
  bookmarkLoadingIds: Set<number>;
  onBookmark: (id: number) => void;
  onSelectPaper: (paper: Paper) => void;
  nextCursor?: string | null;
  prevCursor?: string | null;
  onCursorChange: (c: string | null) => void;
  q?: string;
}

const HighlightText = ({ text, highlight }: { text: string | null | undefined; highlight?: string }) => {
  // Guard: nếu text là null/undefined thì không render gì
  if (text == null) return <></>;
  if (!highlight || !highlight.trim()) {
    return <>{text}</>;
  }
  const regex = new RegExp(`(${highlight.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  const parts = text.split(regex);
  return (
    <>
      {parts.map((part, i) =>
        regex.test(part) ? (
          <mark key={i} className="bg-primary/30 text-primary font-bold rounded px-0.5">
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  );
};

export function SearchResultsList({
  papers,
  loading,
  bookmarkedIds,
  bookmarkLoadingIds,
  onBookmark,
  onSelectPaper,
  nextCursor,
  prevCursor,
  onCursorChange,
  q,
}: SearchResultsListProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      scrollRef.current?.scrollTo({ top: 0, behavior: "smooth" });
    }, 120);
    return () => clearTimeout(timer);
  }, [nextCursor, prevCursor]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    setShowScrollTop(el.scrollTop > el.scrollHeight * 0.4);
  };

  const handleScrollTop = () => {
    scrollRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (loading) {
    return (
      <div className="space-y-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="glass-panel p-8 rounded-2xl relative overflow-hidden animate-pulse"
          >
            {/* Shimmer overlay */}
            <div
              className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/5 to-transparent animate-[shimmer_1.5s_infinite]"
              style={{ animationDelay: `${i * 0.15}s` }}
            />
            {/* Title row */}
            <div className="flex justify-between items-start gap-4 mb-4">
              <div className="flex-1 space-y-2">
                <div className="h-6 bg-white/10 rounded-lg w-4/5" />
                <div className="h-6 bg-white/8 rounded-lg w-3/5" />
              </div>
              <div className="w-8 h-8 bg-white/10 rounded-full flex-shrink-0" />
            </div>
            {/* Author / source row */}
            <div className="h-4 bg-white/8 rounded w-2/5 mb-5" />
            {/* Abstract lines */}
            <div className="space-y-2 mb-7">
              <div className="h-3.5 bg-white/8 rounded w-full" />
              <div className="h-3.5 bg-white/8 rounded w-full" />
              <div className="h-3.5 bg-white/8 rounded w-3/4" />
            </div>
            {/* Footer row */}
            <div className="flex items-center justify-between pt-6 border-t border-white/5">
              <div className="h-3 bg-white/8 rounded w-24" />
              <div className="flex gap-3">
                <div className="h-8 bg-white/8 rounded-full w-28" />
                <div className="h-8 bg-primary/20 rounded-full w-28" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!papers || papers.length === 0) {
    return (
      <div className="text-center py-20 text-on-surface-variant">
        Không tìm thấy kết quả nào phù hợp. Thử thay đổi từ khóa hoặc loại bỏ bộ lọc.
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="relative space-y-6">
        <div
          ref={scrollRef}
          className="overflow-y-auto max-h-[700px] pr-2 space-y-6 scroll-smooth"
          style={{
            scrollbarWidth: "thin",
            scrollbarColor: "rgba(255,255,255,0.15) transparent",
          }}
          onScroll={handleScroll}
        >
          {papers.map((paper) => (
            <article
              key={paper.id}
              className="glass-panel p-8 rounded-2xl relative overflow-hidden group hover:border-primary/30 transition-all"
            >
              <div className="flex justify-between items-start gap-4 mb-2">
                <div className="flex flex-col gap-3">
                  <h3
                    onClick={() => onSelectPaper(paper)}
                    className="font-display text-2xl font-bold leading-tight group-hover:text-primary transition-colors cursor-pointer text-left"
                  >
                    <HighlightText text={cleanTitle(paper.title)} highlight={q} />
                  </h3>
                </div>
                <div className="relative group/tooltip">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onBookmark(paper.id);
                    }}
                    disabled={bookmarkLoadingIds.has(paper.id)}
                    className={cn(
                      "p-2 rounded-full hover:bg-white/5 transition-colors",
                      bookmarkedIds.has(paper.id)
                        ? "text-tertiary"
                        : "text-on-surface-variant hover:text-tertiary"
                    )}
                  >
                    {bookmarkLoadingIds.has(paper.id) ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : bookmarkedIds.has(paper.id) ? (
                      <Bookmark className="w-5 h-5 fill-current" />
                    ) : (
                      <Bookmark className="w-5 h-5" />
                    )}
                  </button>
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-1 text-[10px] font-bold text-on-surface bg-surface-container-high rounded-lg opacity-0 pointer-events-none group-hover/tooltip:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10 shadow-xl border border-outline-variant/30">
                    {bookmarkedIds.has(paper.id) ? "Hủy lưu bài báo" : "Lưu bài báo ngay"}
                  </div>
                </div>
              </div>
              <p className="text-sm text-secondary font-medium mb-4 text-left">
                <HighlightText text={paper.authors?.map((a) => a.name).join(", ") ?? ""} highlight={q} /> •{" "}
                <span className="text-on-surface">
                  <HighlightText text={paper.journal?.name || paper.source || ""} highlight={q} /> | {paper.published_year}
                </span>
              </p>
              <p className="text-on-surface-variant text-sm line-clamp-3 mb-4 leading-relaxed text-left">
                <HighlightText text={paper.abstract ?? ""} highlight={q} />
              </p>

              {paper.keywords && paper.keywords.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-6">
                  {paper.keywords.slice(0, 5).map((kw) => (
                    <span key={kw.id} className="text-[10px] px-2 py-1 rounded border border-white/10 bg-white/5 text-on-surface-variant">
                      #<HighlightText text={kw.name} highlight={q} />
                    </span>
                  ))}
                  {paper.keywords.length > 5 && (
                    <span className="text-[10px] px-2 py-1 text-on-surface-variant">
                      +{paper.keywords.length - 5} nữa
                    </span>
                  )}
                </div>
              )}

              <div className="flex flex-wrap items-center gap-6 pt-6 border-t border-white/5">
                <div className="flex items-center gap-6 mr-auto">
                  <span className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                    <Quote className="w-3 h-3" /> {paper.citations_count} TRÍCH DẪN
                  </span>
                </div>
                <button
                  onClick={() => onSelectPaper(paper)}
                  className="px-6 py-2.5 rounded-full border border-white/20 text-[10px] font-bold uppercase tracking-widest hover:bg-white/5 transition-all text-white"
                >
                  XEM CHI TIẾT
                </button>
                {/* PDF / Link button */}
                {(() => {
                  const paperLink = paper.url || (paper.doi ? `https://doi.org/${paper.doi}` : null);
                  const isPdf = paper.url?.toLowerCase().includes('.pdf');
                  const label = !paperLink
                    ? "KHÔNG CÓ LIÊN KẾT"
                    : isPdf
                    ? "TẢI XUỐNG PDF"
                      : paper.url
                        ? "XEM BÀI BÁO"
                        : "XEM NGUỒN (DOI)";

                  if (!paperLink) {
                    return (
                      <button
                        disabled
                        className="px-6 py-2.5 rounded-full bg-white/5 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/40 cursor-not-allowed border border-white/5"
                        title="Bài báo này không có đường dẫn truy cập"
                      >
                        {label}
                      </button>
                    );
                  }

                  return (
                    <a
                      href={paperLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-6 py-2.5 rounded-full bg-primary text-[10px] font-bold uppercase tracking-widest text-white shadow-[0_0_15px_rgba(37,99,235,0.3)] hover:bg-primary/90 transition inline-flex items-center gap-1.5"
                      title={isPdf ? "Tải xuống bài báo dạng PDF" : "Xem bài báo tại trang nguồn"}
                    >
                      {label}
                    </a>
                  );
                })()}
              </div>
            </article>
          ))}
        </div>
        {papers.length > 2 && (
          <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-background/90 to-transparent z-10" />
        )}
      </div>

      {(prevCursor || nextCursor) && (
        <div className="flex justify-center items-center gap-4 pt-8">
          <button
            onClick={() => prevCursor && onCursorChange(prevCursor)}
            disabled={!prevCursor}
            className="flex items-center gap-1 px-4 py-2 rounded border border-white/10 hover:bg-white/5 disabled:opacity-30 disabled:hover:bg-transparent transition-all"
          >
            <ChevronLeft className="w-4 h-4" />
            <span className="text-xs font-bold uppercase">Trang trước</span>
          </button>
          
          <button
            onClick={() => nextCursor && onCursorChange(nextCursor)}
            disabled={!nextCursor}
            className="flex items-center gap-1 px-4 py-2 rounded border border-white/10 hover:bg-white/5 disabled:opacity-30 disabled:hover:bg-transparent transition-all"
          >
            <span className="text-xs font-bold uppercase">Trang sau</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Nút cuộn lên đầu - chỉ hiện khi cuộn xuống gần cuối */}
      {showScrollTop && (
        <button
          onClick={handleScrollTop}
          className="fixed bottom-8 right-8 z-40 w-11 h-11 rounded-full bg-primary text-white shadow-lg shadow-primary/30 flex items-center justify-center hover:bg-primary/90 hover:scale-110 active:scale-95 transition-all duration-200 animate-in fade-in slide-in-from-bottom-4"
          title="Về bài báo đầu tiên"
        >
          <ChevronUp className="w-5 h-5" />
        </button>
      )}
    </div>
  );
}
