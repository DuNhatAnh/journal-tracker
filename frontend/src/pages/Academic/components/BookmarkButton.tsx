import { Loader2, BookmarkCheck, BookmarkPlus } from "lucide-react";
import { cn } from "../../../lib/utils";

interface BookmarkButtonProps {
  paperId: number;
  bookmarkedIds: Set<number>;
  loadingIds: Set<number>;
  bookmark: (id: number) => void;
  className?: string;
}

export function BookmarkButton({ paperId, bookmarkedIds, loadingIds, bookmark, className }: BookmarkButtonProps) {
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
