import React from "react";
import { BookmarkX, Edit3, X, Save, ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { cn, cleanTitle } from "@/src/lib/utils";

interface Bookmark {
  id: number;
  note: string | null;
  paper: {
    id: number;
    title: string;
    abstract: string;
    source: string;
    published_year: number;
    keywords: { name: string }[];
    journal?: { name: string };
  };
}

interface BookmarkedPapersListProps {
  bookmarks: Bookmark[];
  loading: boolean;
  editingId: number | null;
  setEditingId: (id: number | null) => void;
  editNote: string;
  setEditNote: (note: string) => void;
  onUpdateNote: (bookmarkId: number, note: string) => void;
  onDeleteBookmark: (bookmarkId: number) => void;
  onSelectPaper: (paper: any) => void;
  page: number;
  lastPage: number;
  onPageChange: (p: number) => void;
}

export function BookmarkedPapersList({
  bookmarks,
  loading,
  editingId,
  setEditingId,
  editNote,
  setEditNote,
  onUpdateNote,
  onDeleteBookmark,
  onSelectPaper,
  page,
  lastPage,
  onPageChange,
}: BookmarkedPapersListProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="glass-panel p-8 rounded-2xl relative overflow-hidden animate-pulse flex flex-col h-[320px]"
          >
            <div
              className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/5 to-transparent animate-[shimmer_1.5s_infinite]"
              style={{ animationDelay: `${i * 0.1}s` }}
            />
            <div className="flex justify-between items-start mb-6">
              <div className="h-5 bg-white/10 rounded w-20" />
              <div className="w-6 h-6 bg-white/10 rounded-full" />
            </div>
            <div className="space-y-2 flex-1 mb-4">
              <div className="h-6 bg-white/10 rounded-lg w-full" />
              <div className="h-6 bg-white/8 rounded-lg w-4/5" />
            </div>
            <div className="h-16 bg-white/5 rounded-lg w-full mb-6" />
            <div className="flex items-center justify-between pt-6 border-t border-white/5 mt-auto">
              <div className="space-y-1">
                <div className="h-3 bg-white/8 rounded w-24" />
                <div className="h-2.5 bg-white/6 rounded w-12" />
              </div>
              <div className="h-8 bg-primary/20 rounded-lg w-20" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!bookmarks || bookmarks.length === 0) {
    return (
      <div className="text-center py-20 text-on-surface-variant">
        Bạn chưa lưu bài báo nào. Hãy sử dụng thanh tìm kiếm để khám phá.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 animate-in fade-in duration-300">
        {bookmarks.map((bookmark) => (
          <div
            key={bookmark.id}
            className="glass-panel p-8 rounded-2xl relative group hover:-translate-y-1 transition-all duration-300 flex flex-col h-full border-t border-white/5"
          >
            <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

            <div className="flex justify-between items-start mb-6">
              <span
                className={cn(
                  "px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest border",
                  bookmark.id % 2 === 0
                    ? "bg-secondary-container/20 text-secondary border-secondary/30"
                    : "bg-primary/10 text-primary border-primary/20"
                )}
              >
                {bookmark.paper.keywords?.[0]?.name || "Nghiên cứu"}
              </span>
              <div className="relative group/tooltip">
                <button
                  onClick={() => onDeleteBookmark(bookmark.id)}
                  className="text-on-surface-variant hover:text-error transition-colors p-1 cursor-pointer"
                >
                  <BookmarkX className="w-5 h-5" />
                </button>
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-1 text-[10px] font-bold text-on-surface bg-surface-container-high rounded-lg opacity-0 pointer-events-none group-hover/tooltip:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10 shadow-xl border border-outline-variant/30">
                  Hủy lưu bài báo
                </div>
              </div>
            </div>

            <h3
              onClick={() => onSelectPaper(bookmark.paper)}
              className="font-display text-xl font-bold leading-tight mb-4 group-hover:text-primary transition-colors cursor-pointer text-left line-clamp-2"
            >
              {cleanTitle(bookmark.paper.title)}
            </h3>

            {/* Note section */}
            <div className="mb-6 flex-1 flex flex-col">
              {editingId === bookmark.id ? (
                <div className="space-y-2 flex-1 relative z-10 text-left">
                  <textarea
                    value={editNote}
                    onChange={(e) => setEditNote(e.target.value)}
                    className="w-full min-h-[80px] bg-surface-container-high border border-white/10 rounded-lg p-3 text-sm text-on-surface focus:outline-none focus:border-primary/50 resize-y"
                    placeholder="Thêm ghi chú cá nhân..."
                  />
                  <div className="flex gap-2 justify-end">
                    <button
                      onClick={() => setEditingId(null)}
                      className="p-2 text-on-surface-variant hover:text-on-surface cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onUpdateNote(bookmark.id, editNote)}
                      className="px-3 py-1.5 bg-primary/20 text-primary text-xs font-bold rounded flex items-center gap-2 cursor-pointer hover:bg-primary/30 transition-all"
                    >
                      <Save className="w-3 h-3" /> Lưu
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  className="group/note relative flex-1 cursor-pointer bg-surface-container-low/30 rounded-lg p-4 border border-transparent hover:border-white/5 transition-all text-left"
                  onClick={() => {
                    setEditingId(bookmark.id);
                    setEditNote(bookmark.note || "");
                  }}
                >
                  <div className="absolute top-2 right-2 opacity-0 group-hover/note:opacity-100 transition-opacity text-tertiary">
                    <Edit3 className="w-3 h-3" />
                  </div>
                  {bookmark.note ? (
                    <p className="text-sm text-tertiary italic">"{bookmark.note}"</p>
                  ) : (
                    <p className="text-xs text-on-surface-variant/50 italic flex items-center gap-2">
                      <Edit3 className="w-3 h-3" /> Nhấn để thêm ghi chú
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-6 border-t border-white/5 mt-auto">
              <div className="space-y-0.5 text-left overflow-hidden mr-2">
                <p className="text-[10px] font-bold text-tertiary uppercase tracking-widest truncate">
                  {bookmark.paper.journal?.name || bookmark.paper.source}
                </p>
                <p className="text-[10px] font-medium text-outline-variant">
                  {bookmark.paper.published_year}
                </p>
              </div>
              <button
                onClick={() => onSelectPaper(bookmark.paper)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-primary/25 bg-primary/5 text-primary text-[10px] font-bold uppercase tracking-widest hover:bg-primary/20 hover:border-primary/50 transition-all hover:scale-[1.03] active:scale-[0.97] cursor-pointer shrink-0"
              >
                Xem <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {lastPage > 1 && (
        <div className="flex justify-center items-center gap-2 pt-8">
          <button
            onClick={() => onPageChange(page - 1)}
            disabled={page === 1}
            className="p-2 rounded border border-white/10 hover:bg-white/5 disabled:opacity-50 cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-xs font-bold text-on-surface-variant px-4">
            Trang {page} / {lastPage}
          </span>
          <button
            onClick={() => onPageChange(page + 1)}
            disabled={page === lastPage}
            className="p-2 rounded border border-white/10 hover:bg-white/5 disabled:opacity-50 cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
