import React from "react";
import { X, Loader2, ExternalLink } from "lucide-react";
import { cleanTitle } from "@/src/lib/utils";

interface Author {
  id: number;
  name: string;
}

interface Keyword {
  name: string;
}

interface Paper {
  id: number;
  title: string;
  abstract: string;
  source: string;
  published_year: number;
  citations_count?: number;
  doi?: string;
  authors: Author[];
  keywords: Keyword[];
  journal?: { name: string };
}

interface BookmarkPaperDetailModalProps {
  paper: Paper;
  onClose: () => void;
  bookmarkLoadingIds: Set<number>;
  onToggleBookmark: (paperId: number) => void;
}

export function BookmarkPaperDetailModal({
  paper,
  onClose,
  bookmarkLoadingIds,
  onToggleBookmark,
}: BookmarkPaperDetailModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="glass-panel w-full max-w-3xl rounded-2xl border border-white/10 p-8 shadow-2xl relative max-h-[85vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/5 text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="space-y-6">
          <div>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary mb-3">
              {(paper.journal?.name || paper.source || "Nghiên cứu").toUpperCase()}
            </span>
            <h2 className="font-display text-2xl sm:text-3xl font-bold leading-tight text-on-surface text-left">
              {cleanTitle(paper.title)}
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-on-surface-variant border-y border-white/5 py-4 text-left">
            <div>
              <span className="font-bold text-on-surface">Tác giả:</span>{" "}
              {paper.authors?.map((a: any) => a.name).join(", ") || "N/A"}
            </div>
            <div>
              <span className="font-bold text-on-surface">Tạp chí:</span>{" "}
              {paper.journal?.name || paper.source || "N/A"}
            </div>
            <div>
              <span className="font-bold text-on-surface">Năm xuất bản:</span>{" "}
              {paper.published_year}
            </div>
            <div>
              <span className="font-bold text-on-surface">Trích dẫn:</span>{" "}
              {paper.citations_count || 0}
            </div>
          </div>

          <div className="space-y-3 text-left">
            <h4 className="text-sm font-bold uppercase tracking-widest text-primary">
              Tóm tắt (Abstract)
            </h4>
            <p className="text-on-surface-variant text-sm leading-relaxed whitespace-pre-line">
              {paper.abstract || "Không có tóm tắt cho bài báo này."}
            </p>
          </div>

          {paper.keywords && paper.keywords.length > 0 && (
            <div className="space-y-2 text-left">
              <h4 className="text-sm font-bold uppercase tracking-widest text-secondary">
                Từ khóa (Chủ đề)
              </h4>
              <div className="flex flex-wrap gap-2">
                {paper.keywords.map((kw: any, idx: number) => (
                  <span
                    key={idx}
                    className="text-xs px-2.5 py-1 rounded-full border bg-primary/10 text-primary border-primary/20"
                  >
                    #{kw.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-4 pt-4 border-t border-white/5">
            <button
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-white/10 text-xs font-bold uppercase tracking-widest hover:bg-white/5 transition-all text-on-surface cursor-pointer"
            >
              Đóng
            </button>
            <button
              disabled={bookmarkLoadingIds.has(paper.id)}
              onClick={() => onToggleBookmark(paper.id)}
              className="px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all bg-tertiary/20 text-tertiary border border-tertiary/30 hover:bg-tertiary/30 cursor-pointer"
            >
              {bookmarkLoadingIds.has(paper.id) ? (
                <span className="flex items-center gap-1">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Đang xử lý...
                </span>
              ) : (
                "Hủy lưu bài báo"
              )}
            </button>
            <a
              href={
                paper.doi
                  ? paper.doi.startsWith("http")
                    ? paper.doi
                    : `https://doi.org/${paper.doi}`
                  : "#"
              }
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
