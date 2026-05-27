import { Info, ArrowUp } from "lucide-react";
import { cn } from "@/src/lib/utils";

interface SelectedEntity {
  id: number;
  name: string;
  type: "keyword" | "author";
}

interface TrendStatsGridProps {
  activeStats: {
    growth: string;
    total: string;
    impact: string;
    citations?: string;
    hIndex?: number;
    i10Index?: number;
    coAuthorsCount?: number;
    trendingPapersCount?: number;
    topCollaborators?: string;
    papersCitations?: { id: number; title: string; citations_count: number; published_year: number }[];
  };
  loading?: boolean;
  selectedEntity?: SelectedEntity | null;
}

export function TrendStatsGrid({ activeStats, loading, selectedEntity }: TrendStatsGridProps) {
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

  const isAuthor = selectedEntity?.type === "author";

  const statsConfig = isAuthor
    ? [
        { 
          label: "Tổng số trích dẫn", 
          value: Number(activeStats.citations || 0).toLocaleString(), 
          desc: `i10-Index: ${activeStats.i10Index || 0} | H-Index: ${activeStats.hIndex || 0}`, 
          color: "text-tertiary",
          showTooltip: true
        },
        { 
          label: "Công bộ khoa học", 
          value: activeStats.total, 
          desc: `Có ${activeStats.trendingPapersCount || 0} bài nổi bật | TB ${activeStats.impact}/bài`, 
          color: "text-primary",
          showTooltip: false
        },
        { 
          label: "Mạng lưới hợp tác", 
          value: `${activeStats.coAuthorsCount || 0} đồng tác giả`, 
          desc: `Cộng tác: ${activeStats.topCollaborators || "Không có"}`, 
          color: "text-secondary",
          showTooltip: false
        },
      ]
    : [
        { label: "Tỷ lệ tăng trưởng", value: activeStats.growth, desc: "Năm gần nhất", color: "text-tertiary", showTooltip: false },
        { label: "Tổng số ấn phẩm", value: activeStats.total, desc: "Tấm lọc đã chọn", color: "text-primary", showTooltip: false },
        { label: "Ảnh hưởng TB (Citations/Paper)", value: activeStats.impact, desc: "Chỉ số trích dẫn trung bình", color: "text-secondary", showTooltip: false },
      ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {statsConfig.map((stat, i) => (
        <div key={i} className="glass-panel p-6 rounded-xl relative overflow-hidden group border-t border-white/5">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary/30 to-transparent opacity-50" />
          <div className="flex justify-between items-center mb-1">
            <span className="font-mono text-[10px] text-on-surface-variant uppercase tracking-widest">{stat.label}</span>
            <div className="relative group/tooltip">
              <Info className="w-3 h-3 text-outline-variant cursor-help" />
              {stat.showTooltip && activeStats.papersCitations && activeStats.papersCitations.length > 0 && (
                <div className="absolute right-0 top-6 w-80 p-4 bg-[#18181b]/95 backdrop-blur-md border border-white/10 rounded-xl shadow-2xl opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all duration-200 z-50 pointer-events-none text-left">
                  <h5 className="font-mono text-[9px] text-on-surface-variant uppercase tracking-wider mb-2 border-b border-white/5 pb-1">
                    Chi tiết trích dẫn từng bài
                  </h5>
                  <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                    {activeStats.papersCitations.map((paper: any) => (
                      <div key={paper.id} className="flex justify-between items-start gap-3 text-[10px]">
                        <span className="text-on-surface-variant line-clamp-1 flex-1 font-sans">
                          {paper.title}
                        </span>
                        <span className="font-mono text-tertiary font-bold shrink-0">
                          {paper.citations_count.toLocaleString()} lượt
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
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
