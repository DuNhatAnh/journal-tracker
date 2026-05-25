import React from "react";
import { Users, FileText, Database, RefreshCw, Activity, TrendingUp } from "lucide-react";
import { AdminStats } from "../../types";

type StatCardsProps = {
  stats: AdminStats | null;
  loading: boolean;
};

export default function StatCards({ stats, loading }: StatCardsProps) {
  const statCards = stats
    ? [
        { label: "Tổng người dùng", value: stats.total_users, icon: Users, color: "text-primary", bg: "bg-primary/10", border: "border-primary/20" },
        { label: "Bài báo khoa học", value: stats.total_papers.toLocaleString("vi-VN"), icon: FileText, color: "text-secondary", bg: "bg-secondary/10", border: "border-secondary/20" },
        { label: "Tạp chí (Journals)", value: stats.total_journals, icon: Database, color: "text-amber-400", bg: "bg-amber-400/10", border: "border-amber-400/20" },
        { label: "Từ khóa (Keywords)", value: stats.total_keywords.toLocaleString("vi-VN"), icon: TrendingUp, color: "text-primary", bg: "bg-primary/10", border: "border-primary/20" },
        { label: "Nguồn API (Đang bật)", value: `${stats.active_api_sources} / ${stats.total_api_sources}`, icon: RefreshCw, color: "text-tertiary", bg: "bg-tertiary/10", border: "border-tertiary/20" },
        { label: "Tổng lượt đồng bộ", value: stats.total_sync_logs, icon: Activity, color: "text-secondary", bg: "bg-secondary/10", border: "border-secondary/20" },
      ]
    : [];

  if (loading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-28 rounded-2xl bg-white/5 animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
      {statCards.map((card) => (
        <div key={card.label} className={`glass-panel rounded-2xl p-5 border ${card.border} bg-surface flex items-start gap-4`}>
          <div className={`p-3 rounded-xl ${card.bg}`}>
            <card.icon className={`w-5 h-5 ${card.color}`} />
          </div>
          <div>
            <p className="text-2xl font-black font-display text-on-surface">{card.value}</p>
            <p className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider mt-0.5">{card.label}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
