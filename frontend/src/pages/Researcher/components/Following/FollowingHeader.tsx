import React from "react";
import { Loader2, Activity } from "lucide-react";

interface FollowingHeaderProps {
  isFeedLoading: boolean;
  onRefresh: () => void;
}

export function FollowingHeader({ isFeedLoading, onRefresh }: FollowingHeaderProps) {
  return (
    <header className="flex justify-between items-end mb-4">
      <div>
        <h2 className="font-display text-4xl font-bold">Cơ chế Theo dõi</h2>
        <p className="text-on-surface-variant mt-1">
          Dòng ấn phẩm mới nhất được chọn lọc từ các nguồn được giám sát của bạn.
        </p>
      </div>
      <button 
        onClick={onRefresh}
        disabled={isFeedLoading}
        className="flex items-center gap-2 px-4 py-2 glass-panel rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-white/5 transition-all text-on-surface disabled:opacity-50"
      >
        {isFeedLoading ? (
          <Loader2 className="w-4 h-4 animate-spin text-primary" />
        ) : (
          <Activity className="w-4 h-4 text-tertiary" />
        )}
        Làm mới feed
      </button>
    </header>
  );
}
