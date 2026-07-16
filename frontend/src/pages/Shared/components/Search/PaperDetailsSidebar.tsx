import React from "react";
import { BookOpen } from "lucide-react";

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

  return (
    <div className="lg:col-span-3 w-full glass-panel p-6 rounded-3xl border border-outline-variant/35 bg-surface-container-low/40 space-y-5 animate-fade-in flex flex-col h-[780px] overflow-y-auto order-2 lg:order-2">
      <div className="space-y-2.5">
        <span className="text-[9px] bg-primary/10 text-primary border border-primary/20 px-2.5 py-0.5 rounded-full font-black uppercase tracking-wider">
          Bài báo đang xem
        </span>
        <h3 className="text-sm font-extrabold text-on-surface leading-snug line-clamp-4">
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
          <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Tác giả:</span>
          <p className="font-bold text-on-surface leading-normal text-xs text-wrap">
            {paperToShow.authors?.map(a => a.name).join(", ") || "Nhiều tác giả"}
          </p>
        </div>
        {paperToShow.journal && (
          <div className="space-y-0.5">
            <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Tạp chí:</span>
            <p className="font-bold text-primary leading-normal text-xs">
              🏢 {paperToShow.journal.name}
            </p>
          </div>
        )}
      </div>

      <div className="h-px bg-outline-variant/20" />

      {/* Abstract */}
      <div className="space-y-1.5 flex-1 min-h-0 overflow-y-auto pr-1">
        <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Tóm tắt (Abstract):</span>
        <p className="text-xs text-on-surface-variant leading-relaxed text-justify font-normal whitespace-pre-line max-h-[380px] overflow-y-auto pr-1">
          {paperToShow.abstract || "Bài báo này chưa có dữ liệu tóm tắt Abstract."}
        </p>
      </div>

      <div className="h-px bg-outline-variant/20" />

      {/* Action Buttons */}
      <div className="space-y-2 pt-1 mt-auto">
        {/* Bookmark Action */}
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

        {/* DOI / External Link */}
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

        {/* Direct PDF or landing page link */}
        {paperToShow.url && (
          <a
            href={paperToShow.url}
            target="_blank"
            rel="noopener noreferrer"
            download={paperToShow.url.toLowerCase().includes('.pdf') ? true : undefined}
            className="w-full py-2.5 rounded-2xl text-xs font-bold bg-primary text-white hover:bg-primary/90 transition-all flex items-center justify-center gap-1.5 shadow-sm active:scale-98 shadow-[0_0_12px_rgba(37,99,235,0.25)]"
          >
            <span>{paperToShow.url.toLowerCase().includes('.pdf') ? '📄 Tải xuống PDF' : '📎 Xem bài báo'}</span>
          </a>
        )}
      </div>
    </div>
  );
};
