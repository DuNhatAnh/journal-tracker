import { Info, ArrowUp } from "lucide-react";
import { cn } from "@/src/lib/utils";

interface TrendStatsGridProps {
  activeStats: {
    growth: string;
    total: string;
    impact: string;
  };
  loading?: boolean;
}

export function TrendStatsGrid({ activeStats, loading }: TrendStatsGridProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="glass-panel p-6 rounded-xl border border-white/5 animate-pulse h-[116px] flex flex-col justify-between relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-white/5" />
            <div className="flex justify-between items-center">
              <div className="h-3.5 w-28 bg-white/10 rounded" />
              <div className="w-3.5 h-3.5 bg-white/5 rounded-full" />
            </div>
            <div className="h-8 w-20 bg-white/15 rounded mt-2" />
            <div className="h-3 w-16 bg-white/10 rounded mt-1" />
          </div>
        ))}
      </div>
    );
  }

  const statsConfig = [
    { label: "Tỷ lệ tăng trưởng", value: activeStats.growth, desc: "Năm gần nhất", color: "text-tertiary" },
    { label: "Tổng số ấn phẩm", value: activeStats.total, desc: "Tầm lọc đã chọn", color: "text-primary" },
    { label: "Ảnh hưởng TB (Citations/Paper)", value: activeStats.impact, desc: "Chỉ số trích dẫn trung bình", color: "text-secondary" },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {statsConfig.map((stat, i) => (
        <div key={i} className="glass-panel p-6 rounded-xl relative overflow-hidden group border-t border-white/5">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary/30 to-transparent opacity-50" />
          <div className="flex justify-between items-center mb-1">
            <span className="font-mono text-[10px] text-on-surface-variant uppercase tracking-widest">{stat.label}</span>
            <Info className="w-3 h-3 text-outline-variant" />
          </div>
          <div className="text-4xl font-bold text-on-surface tracking-tighter mb-2">{stat.value}</div>
          <p className={cn("text-[10px] font-bold uppercase tracking-widest flex items-center gap-1", stat.color)}>
            <ArrowUp className="w-2.5 h-2.5" /> {stat.desc}
          </p>
        </div>
      ))}
    </div>
  );
}
