import { Link } from "react-router-dom";
import { DashboardData } from "../types";
import { useApiQuery } from "../../../hooks/useApiQuery";
import { cn } from "../../../lib/utils";

interface StatsApiResponse {
  stats: {
    total_papers: number;
    papers_percent: string;
    total_keywords: number;
    keywords_percent: string;
    papers_this_year: number;
    papers_this_year_new: number;
    total_bookmarks: number;
    bookmarks_new: number;
  };
  stats_updated_at: string;
}

export function StatsGrid() {
  const { data, loading } = useApiQuery<StatsApiResponse>('/dashboard/stats');

  if (loading || !data) return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 animate-pulse">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="glass-panel p-6 rounded-xl">
          <div className="h-3 w-24 bg-white/10 rounded mb-3" />
          <div className="h-8 w-16 bg-white/20 rounded" />
        </div>
      ))}
    </div>
  );

  const { stats: s, stats_updated_at: updatedAt } = data;
  const stats = [
    { label: "Tổng số Bài báo", value: String(s.total_papers || 0), trend: s.papers_percent || "0%" },
    { label: "Từ khóa / Chủ đề", value: String(s.total_keywords || 0), trend: s.keywords_percent || "0%" },
    { label: "Năm nay", value: String(s.papers_this_year || 0), trend: `+${s.papers_this_year_new || 0} mới` },
    { label: "Đã lưu", value: String(s.total_bookmarks || 0), trend: `+${s.bookmarks_new || 0} mới` }
  ];

  const currentUserStr = localStorage.getItem("user");
  const currentUser = currentUserStr ? JSON.parse(currentUserStr) : null;
  const role = currentUser?.role || "student";
  const isResearcher = role === "researcher" || role === "admin";

  if (!stats) return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 animate-pulse">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="glass-panel p-6 rounded-xl">
          <div className="h-3 w-24 bg-white/10 rounded mb-3" />
          <div className="h-8 w-16 bg-white/20 rounded" />
        </div>
      ))}
    </div>
  );

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {stats.map((stat, i) => {
          const isNegative = stat.trend.startsWith('-');
          const trendColor = (i === 0 || i === 1) ? (isNegative ? 'text-error' : 'text-tertiary') : 'text-tertiary';
          
          const content = (
            <>
              <p className="font-display text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-1 group-hover:text-primary transition-colors">{stat.label}</p>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-on-surface tracking-tighter">{stat.value}</span>
                <span className={cn("text-xs font-mono font-bold", trendColor)}>{stat.trend}</span>
              </div>
            </>
          );

          if (i === 0) {
            return (
              <Link key={i} to="/papers" className="glass-panel p-6 rounded-xl relative group overflow-hidden hover:border-primary/40 transition-all cursor-pointer block">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                {content}
              </Link>
            );
          }

          if (i === 1) {
            const dest = isResearcher ? "/trending" : "/papers?view=topics";
            return (
              <Link key={i} to={dest} className="glass-panel p-6 rounded-xl relative group overflow-hidden hover:border-primary/40 transition-all cursor-pointer block">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                {content}
              </Link>
            );
          }

          if (i === 2) {
            return (
              <Link key={i} to={`/papers?year=${new Date().getFullYear()}`} className="glass-panel p-6 rounded-xl relative group overflow-hidden hover:border-primary/40 transition-all cursor-pointer block">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                {content}
              </Link>
            );
          }

          if (i === 3) {
            return (
              <Link key={i} to="/bookmarks" className="glass-panel p-6 rounded-xl relative group overflow-hidden hover:border-primary/40 transition-all cursor-pointer block">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                {content}
              </Link>
            );
          }

          return (
            <div key={i} className="glass-panel p-6 rounded-xl hover:bg-white/5 transition-all group">
              {content}
            </div>
          );
        })}
      </div>
      {updatedAt && (
        <p className="text-right text-[10px] text-on-surface-variant/60 font-mono pr-2">
          Cập nhật: {updatedAt}
        </p>
      )}
    </div>
  );
}
