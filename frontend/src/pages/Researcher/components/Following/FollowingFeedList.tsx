import React from "react";
import { Users, Clock, BookmarkPlus, BookmarkCheck, Loader2, Quote, ArrowRight } from "lucide-react";
import { cn, cleanTitle } from "@/src/lib/utils";

interface Paper {
  id: number;
  title: string;
  abstract: string;
  published_year: number;
  citations_count: number;
  source: string;
  doi?: string;
  url?: string;
  journal?: { id: number; name: string };
  authors: { id: number; name: string }[];
  keywords: { id: number; name: string }[];
}

interface FollowingFeedListProps {
  feedPapers: Paper[];
  isFeedLoading: boolean;
  bookmarkedIds: Set<number>;
  bookmarkLoadingIds: Set<number>;
  onToggleBookmark: (paperId: number) => void;
  onSelectPaper: (paper: Paper) => void;
  feedPage: number;
  feedTotalPages: number;
  onPageChange: (page: number) => void;
}

export function FollowingFeedList({
  feedPapers,
  isFeedLoading,
  bookmarkedIds,
  bookmarkLoadingIds,
  onToggleBookmark,
  onSelectPaper,
  feedPage,
  feedTotalPages,
  onPageChange,
}: FollowingFeedListProps) {
  if (isFeedLoading) {
    return (
      <div className="space-y-6">
        <h3 className="font-display text-xl font-bold flex items-center gap-3">
          <Users className="w-5 h-5 text-primary" /> Bảng tin cập nhật
        </h3>
        <div className="space-y-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div 
              key={i} 
              className="glass-panel p-8 rounded-2xl relative overflow-hidden animate-pulse flex flex-col h-[280px]"
            >
              <div
                className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/5 to-transparent animate-[shimmer_1.5s_infinite]"
                style={{ animationDelay: `${i * 0.1}s` }}
              />
              <div className="flex items-center gap-2 mb-4 pr-12">
                <div className="h-4 bg-white/10 rounded w-16" />
                <div className="h-4 bg-white/10 rounded w-16" />
              </div>
              <div className="space-y-2 mb-4">
                <div className="h-7 bg-white/10 rounded-lg w-full" />
                <div className="h-7 bg-white/8 rounded-lg w-3/4" />
              </div>
              <div className="h-4 bg-white/8 rounded w-48 mb-4" />
              <div className="space-y-1.5 mb-6">
                <div className="h-3.5 bg-white/5 rounded w-full" />
                <div className="h-3.5 bg-white/5 rounded w-5/6" />
              </div>
              <div className="flex items-center justify-between pt-6 border-t border-white/5 mt-auto">
                <div className="flex flex-wrap items-center gap-6">
                  <div className="h-3 bg-white/10 rounded w-28" />
                  <div className="h-3 bg-white/8 rounded w-12" />
                  <div className="h-3 bg-white/8 rounded w-16" />
                </div>
                <div className="h-4 bg-primary/20 rounded w-20" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h3 className="font-display text-xl font-bold flex items-center gap-3">
        <Users className="w-5 h-5 text-primary" /> Bảng tin cập nhật
      </h3>

      {feedPapers.length > 0 ? (
        <div className="space-y-6 animate-in fade-in duration-300">
          {feedPapers.map((paper: Paper) => (
            <article key={paper.id} className="glass-panel p-8 rounded-2xl relative group hover:bg-white/[0.02] transition-all">
              <div className="absolute top-6 right-6 flex gap-2">
                <div className="relative group/tooltip">
                  <button 
                    disabled={bookmarkLoadingIds.has(paper.id)}
                    onClick={() => onToggleBookmark(paper.id)}
                    className={cn(
                      "p-2 rounded-full hover:bg-white/5 transition-colors cursor-pointer",
                      bookmarkedIds.has(paper.id) 
                        ? "text-tertiary" 
                        : "text-on-surface-variant hover:text-tertiary"
                    )}
                  >
                    {bookmarkLoadingIds.has(paper.id) ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : bookmarkedIds.has(paper.id) ? (
                      <BookmarkCheck className="w-5 h-5" />
                    ) : (
                      <BookmarkPlus className="w-5 h-5" />
                    )}
                  </button>
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-1 text-[10px] font-bold text-on-surface bg-surface-container-high rounded-lg opacity-0 pointer-events-none group-hover/tooltip:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10 shadow-xl border border-outline-variant/30">
                    {bookmarkedIds.has(paper.id) ? "Hủy lưu bài báo" : "Lưu bài báo ngay"}
                  </div>
                </div>
              </div>
              
              <div className="flex flex-wrap items-center gap-2 mb-4 pr-12">
                {paper.keywords?.slice(0, 3).map((kw) => (
                  <span key={kw.id} className="text-[10px] font-bold uppercase tracking-widest bg-secondary-container/20 text-secondary px-2.5 py-0.5 rounded border border-secondary/20">
                    {kw.name}
                  </span>
                ))}
              </div>

              <h4 
                onClick={() => onSelectPaper(paper)}
                className="font-display text-2xl font-bold mb-4 pr-16 group-hover:text-primary transition-colors cursor-pointer leading-tight text-left"
              >
                {cleanTitle(paper.title)}
              </h4>
              
              <p className="text-sm text-secondary font-medium mb-4 text-left">
                Tác giả: {paper.authors?.map(a => a.name).join(", ") || "Không có thông tin"}
              </p>
              
              <p className="text-sm text-on-surface-variant leading-relaxed line-clamp-3 mb-6 text-left">
                {paper.abstract || "Không có phần tóm tắt nội dung bài viết."}
              </p>

              <div className="flex items-center justify-between pt-6 border-t border-white/5">
                <div className="flex flex-wrap items-center gap-6">
                  <span className="text-[10px] font-bold text-tertiary uppercase tracking-widest">
                    {paper.journal?.name || paper.source}
                  </span>
                  <span className="flex items-center gap-1 text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">
                    <Clock className="w-3 h-3" /> {paper.published_year}
                  </span>
                  <span className="flex items-center gap-1.5 text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">
                    <Quote className="w-3 h-3" /> {paper.citations_count} Trích dẫn
                  </span>
                </div>
                <button 
                  onClick={() => onSelectPaper(paper)}
                  className="flex items-center gap-1 text-primary text-[10px] font-bold uppercase tracking-widest hover:text-tertiary transition-all cursor-pointer"
                >
                  Xem nhanh <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </article>
          ))}

          {/* Feed Pagination */}
          {feedTotalPages > 1 && (
            <div className="flex justify-center items-center gap-2 pt-4">
              <button 
                onClick={() => onPageChange(feedPage - 1)}
                disabled={feedPage === 1 || isFeedLoading}
                className="px-4 py-2 rounded-lg border border-white/10 text-xs font-bold uppercase tracking-widest hover:bg-white/5 disabled:opacity-50 cursor-pointer"
              >
                Trước
              </button>
              <span className="text-xs font-bold text-on-surface-variant px-4">
                Trang {feedPage} / {feedTotalPages}
              </span>
              <button 
                onClick={() => onPageChange(feedPage + 1)}
                disabled={feedPage === feedTotalPages || isFeedLoading}
                className="px-4 py-2 rounded-lg border border-white/10 text-xs font-bold uppercase tracking-widest hover:bg-white/5 disabled:opacity-50 cursor-pointer"
              >
                Sau
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="glass-panel p-8 rounded-2xl text-center text-on-surface-variant">
          Không tìm thấy bài báo nào từ các nguồn theo dõi. Hãy bấm nút "+" ở thanh bên phải để theo dõi thêm Từ khóa, Tạp chí hoặc Tác giả mới.
        </div>
      )}
    </div>
  );
}
