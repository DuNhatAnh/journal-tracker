import React from "react";
import { X } from "lucide-react";

interface Keyword {
  id: number;
  name: string;
}

interface FollowedKeywordsGridProps {
  keywords: Keyword[];
  loading: boolean;
  onDeleteKeyword: (id: number, name: string) => void;
}

export function FollowedKeywordsGrid({
  keywords,
  loading,
  onDeleteKeyword,
}: FollowedKeywordsGridProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {Array.from({ length: 10 }).map((_, i) => (
          <div
            key={i}
            className="glass-panel p-4 rounded-xl flex items-center justify-between animate-pulse h-12 bg-surface-container/30 border-white/10 relative overflow-hidden"
          >
            <div
              className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/5 to-transparent animate-[shimmer_1.5s_infinite]"
              style={{ animationDelay: `${i * 0.05}s` }}
            />
            <div className="h-4 bg-white/10 rounded w-2/3" />
            <div className="w-4 h-4 bg-white/10 rounded-full" />
          </div>
        ))}
      </div>
    );
  }

  if (!keywords || keywords.length === 0) {
    return (
      <div className="text-center py-20 text-on-surface-variant">
        Bạn chưa lưu chủ đề/từ khóa nào. Hãy lưu các chủ đề quan tâm từ chi tiết bài báo hoặc trang Theo dõi.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 animate-in fade-in duration-300">
      {keywords.map((kw) => (
        <div
          key={kw.id}
          className="glass-panel p-4 rounded-xl flex items-center justify-between gap-3 border border-white/10 hover:border-primary/30 transition-all group bg-surface-container/30"
        >
          <span className="font-display font-semibold text-sm text-on-surface truncate group-hover:text-primary transition-colors text-left">
            #{kw.name}
          </span>
          <button
            onClick={() => onDeleteKeyword(kw.id, kw.name)}
            className="p-1.5 rounded-full hover:bg-error/10 text-on-surface-variant hover:text-error transition-colors shrink-0 cursor-pointer"
            title="Hủy lưu chủ đề này"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}
