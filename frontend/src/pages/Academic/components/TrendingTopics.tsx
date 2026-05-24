import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Chart from "react-apexcharts";
import { ArrowRight, TrendingUp } from "lucide-react";
import { cn } from "../../../lib/utils";
import { DashboardData } from "../types";
import { api } from "@/src/lib/api";

interface TrendingTopicsProps {
  isResearcher: boolean;
}

export function TrendingTopics({ isResearcher }: TrendingTopicsProps) {
  const [data, setData] = useState<{topics: DashboardData['trendingTopics'], latestYear: number, updatedAt: string} | null>(null);

  useEffect(() => {
    api.get<{trending_topics: any[], latest_year: number, trending_topics_updated_at: string}>('/dashboard/trending')
      .then(res => {
        const mapped = (res.trending_topics || []).map(t => ({
          id: t.id,
          name: t.keyword?.name || "Chủ đề",
          papers: `${t.paper_count ?? 0}`,
          change: (t.growth_rate ?? 0) >= 0 ? `+${t.growth_rate}%` : `${t.growth_rate}%`,
          data: t.chart_data || [0, 0, 0, 0, 0, 0, 0]
        }));
        setData({ topics: mapped, latestYear: res.latest_year, updatedAt: res.trending_topics_updated_at });
      })
      .catch(err => console.error(err));
  }, []);

  if (!data) return (
    <>
      <header className="flex justify-between items-end mb-6">
        <div>
          <h3 className="font-display text-2xl font-bold text-on-surface">Xu hướng nghiên cứu</h3>
          <p className="text-sm text-on-surface-variant">Thúc đẩy các lĩnh vực nghiên cứu trong chuyên môn của bạn.</p>
        </div>
      </header>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-pulse">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="glass-panel p-6 rounded-xl h-40">
            <div className="h-4 w-32 bg-white/10 rounded mb-4" />
            <div className="h-3 w-20 bg-white/10 rounded mb-6" />
            <div className="h-16 bg-white/5 rounded" />
          </div>
        ))}
      </div>
    </>
  );

  const { topics, latestYear, updatedAt } = data;

  return (
    <>
      <header className="flex justify-between items-end mb-6">
        <div>
          <h3 className="font-display text-2xl font-bold text-on-surface">Xu hướng nghiên cứu</h3>
          <p className="text-sm text-on-surface-variant">Thúc đẩy các lĩnh vực nghiên cứu trong chuyên môn của bạn.</p>
          {updatedAt && (
            <p className="text-[10px] text-on-surface-variant/60 font-mono mt-1">
              Cập nhật: {updatedAt}
            </p>
          )}
        </div>
        {isResearcher && (
          <Link to="/trending" className="flex items-center gap-1 text-primary text-[10px] font-bold uppercase tracking-widest hover:text-tertiary transition-colors">
            Xem tất cả <ArrowRight className="w-3 h-3" />
          </Link>
        )}
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {topics.map((topic) => {
          const isNegative = topic.change.startsWith("-");
          const strokeColor = isNegative ? "#EF4444" : "#3B82F6";
          const categories = Array.from({ length: 7 }, (_, i) => latestYear - 6 + i);

          return (
            <div key={topic.id} className="glass-panel p-6 rounded-xl relative group overflow-hidden hover:border-primary/40 transition-all cursor-pointer">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="flex flex-col items-start gap-2 mb-4">
                <h4 className="font-display text-lg font-bold leading-tight group-hover:text-primary transition-colors line-clamp-2">{topic.name}</h4>
                <span className={cn(
                  "text-[10px] font-bold px-1.5 py-0.5 rounded border flex items-center gap-0.5 w-fit",
                  isNegative ? "bg-error/20 text-error border-error/30" : "bg-tertiary-container/20 text-tertiary border-tertiary/20"
                )}>
                  <TrendingUp className={cn("w-2.5 h-2.5", isNegative && "rotate-180")} /> {topic.change}
                </span>
              </div>
              <p className="text-xs text-on-surface-variant mb-4">{topic.papers} bài báo mới trong năm {latestYear}</p>
              <div className="h-16">
                <Chart
                  options={{
                    chart: { id: `trending-topic-${topic.id}`, sparkline: { enabled: true }, animations: { speed: 500 } },
                    stroke: { curve: "smooth", width: 2, colors: [strokeColor] },
                    fill: { type: "gradient", gradient: { shadeIntensity: 1, opacityFrom: 0.4, opacityTo: 0, colorStops: [{ offset: 0, color: strokeColor, opacity: 0.4 }, { offset: 100, color: strokeColor, opacity: 0 }] } },
                    tooltip: { 
                      enabled: true, 
                      theme: 'dark',
                      y: { title: { formatter: () => 'Bài báo:' } }
                    },
                    xaxis: {
                      categories: categories,
                      labels: { show: false },
                      axisBorder: { show: false },
                      axisTicks: { show: false },
                      crosshairs: { show: false },
                      tooltip: { enabled: false }
                    }
                  }}
                  series={[{ data: topic.data }]}
                  type="area"
                  height={64}
                />
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
