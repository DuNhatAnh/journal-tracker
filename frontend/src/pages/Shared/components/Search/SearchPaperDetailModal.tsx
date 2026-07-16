import React from "react";
import { X, BookmarkPlus, Loader2, ExternalLink } from "lucide-react";
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
  authors: Author[];
  keywords?: { id: number; name: string }[];
  journal?: { id: number; name: string };
}

interface SearchPaperDetailModalProps {
  paper: Paper;
  onClose: () => void;
  bookmarkedIds: Set<number>;
  bookmarkLoadingIds: Set<number>;
  onBookmark: (id: number) => void;
  followedKeywordIds: Set<number>;
  followingKeywordIds: Set<number>;
  onToggleFollowKeyword: (id: number, name: string) => void;
  q?: string;
  isInComparison?: boolean;
  onToggleComparison?: () => void;
}

const HighlightText = ({ text, highlight }: { text: string; highlight?: string }) => {
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

export function SearchPaperDetailModal({
  paper,
  onClose,
  bookmarkedIds,
  bookmarkLoadingIds,
  onBookmark,
  followedKeywordIds,
  followingKeywordIds,
  onToggleFollowKeyword,
  q,
  isInComparison = false,
  onToggleComparison,
}: SearchPaperDetailModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="glass-panel w-full max-w-3xl rounded-2xl border border-white/10 p-8 shadow-2xl relative max-h-[85vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/5 text-on-surface-variant hover:text-on-surface transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="space-y-6">
          <div>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary mb-3">
              {(paper.journal?.name || paper.source).toUpperCase()}
            </span>
            <h2 className="font-display text-2xl sm:text-3xl font-bold leading-tight text-on-surface text-left">
              <HighlightText text={cleanTitle(paper.title)} highlight={q} />
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-on-surface-variant border-y border-white/5 py-4 text-left">
            <div>
              <span className="font-bold text-on-surface">Tác giả:</span>{" "}
              <HighlightText text={paper.authors?.map((a) => a.name).join(", ") || "N/A"} highlight={q} />
            </div>
            <div>
              <span className="font-bold text-on-surface">Tạp chí:</span>{" "}
              <HighlightText text={paper.journal?.name || paper.source || "N/A"} highlight={q} />
            </div>
            <div>
              <span className="font-bold text-on-surface">Năm xuất bản:</span>{" "}
              {paper.published_year}
            </div>
            <div>
              <span className="font-bold text-on-surface">Trích dẫn:</span>{" "}
              {paper.citations_count}
            </div>
          </div>

          <div className="space-y-3 text-left">
            <h4 className="text-sm font-bold uppercase tracking-widest text-primary">
              Tóm tắt (Abstract)
            </h4>
            <p className="text-on-surface-variant text-sm leading-relaxed whitespace-pre-line">
              <HighlightText text={paper.abstract || "Không có tóm tắt cho bài báo này."} highlight={q} />
            </p>
          </div>

          {paper.keywords && paper.keywords.length > 0 && (
            <div className="space-y-2 text-left">
              <h4 className="text-sm font-bold uppercase tracking-widest text-secondary">
                Từ khóa (Chủ đề)
              </h4>
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
                      #<HighlightText text={kw.name} highlight={q} />
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleFollowKeyword(kw.id, kw.name);
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

          <div className="flex flex-wrap justify-end gap-3 pt-4 border-t border-white/5">
            {onToggleComparison && (
              <button
                type="button"
                onClick={onToggleComparison}
                className={cn(
                  "px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all border",
                  isInComparison
                    ? "bg-warning/25 border-warning text-warning hover:bg-warning/35"
                    : "bg-surface-container hover:bg-surface-container-high border-white/10 text-on-surface hover:text-primary"
                )}
              >
                {isInComparison ? "⚖️ Đã thêm so sánh" : "⚖️ So sánh bài báo"}
              </button>
            )}
            <button
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-white/10 text-xs font-bold uppercase tracking-widest hover:bg-white/5 transition-all text-on-surface"
            >
              Đóng
            </button>
            <button
              disabled={bookmarkLoadingIds.has(paper.id)}
              onClick={() => onBookmark(paper.id)}
              className={cn(
                "px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all",
                bookmarkedIds.has(paper.id)
                  ? "bg-tertiary/20 text-tertiary border border-tertiary/30 hover:bg-tertiary/30"
                  : "bg-secondary/10 border border-secondary/20 text-secondary hover:bg-secondary/20"
              )}
            >
              {bookmarkLoadingIds.has(paper.id) ? (
                <span className="flex items-center gap-1">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Đang xử lý...
                </span>
              ) : bookmarkedIds.has(paper.id) ? (
                "Hủy lưu bài báo"
              ) : (
                "Lưu bài báo"
              )}
            </button>
            <a
              href={paper.doi ? `https://doi.org/${paper.doi}` : "#"}
              target="_blank"
              rel="noopener noreferrer"
              className="px-5 py-2.5 rounded-xl gradient-btn text-xs font-bold uppercase tracking-widest text-white flex items-center gap-2"
            >
              Xem Nguồn Gốc <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
