import { createPortal } from "react-dom";
import { X, CalendarDays, Users, Quote, BookMarked, BookmarkPlus, BookmarkCheck, Loader2, ExternalLink } from "lucide-react";
import { cn, cleanTitle } from "../../../lib/utils";
import { PaperDetail } from "../types";

interface PaperDetailModalProps {
  paper: PaperDetail;
  onClose: () => void;
  bookmarkedIds: Set<number>;
  loadingIds: Set<number>;
  bookmark: (id: number) => void;
  followedKeywordIds: Set<number>;
  followingKeywordIds: Set<number>;
  toggleFollowKeyword: (id: number, name: string) => void;
}

export function PaperDetailModal({
  paper,
  onClose,
  bookmarkedIds,
  loadingIds,
  bookmark,
  followedKeywordIds,
  followingKeywordIds,
  toggleFollowKeyword
}: PaperDetailModalProps) {
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
