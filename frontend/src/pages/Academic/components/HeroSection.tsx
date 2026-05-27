import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { DashboardData } from "../types";
import { api } from "@/src/lib/api";

export function HeroSection() {
  const [trendingTopics, setTrendingTopics] = useState<DashboardData['trendingTopics'] | null>(null);

  useEffect(() => {
    api.get<{trending_topics: any[]}>('/dashboard/trending')
      .then(res => {
        const mapped = (res.trending_topics || []).map(t => ({
          id: t.id,
          name: t.keyword?.name || "Chủ đề",
          papers: `${t.paper_count ?? 0}`,
          change: (t.growth_rate ?? 0) >= 0 ? `+${t.growth_rate}%` : `${t.growth_rate}%`,
          data: t.chart_data || [0, 0, 0, 0, 0, 0, 0]
        }));
        setTrendingTopics(mapped);
      })
      .catch(err => console.error(err));
  }, []);

  return (
    <section className="text-center space-y-6 py-8">
      <h2 className="font-display text-5xl md:text-6xl font-bold tracking-tight text-on-surface">
        Khám phá ranh giới tiên tiến của <span className="gradient-text">nghiên cứu.</span>
      </h2>
      <p className="max-w-2xl mx-auto text-on-surface-variant text-lg">
        Phân tích xu hướng, theo dõi trích dẫn và khám phá thông tin chuyên sâu trên hàng triệu bài báo học thuật ngay lập tức.
      </p>
      <div className="flex justify-center flex-wrap gap-4 pt-4 min-h-[28px]">
        {trendingTopics ? (
          <>
            <span className="font-mono text-[10px] text-on-surface-variant uppercase tracking-widest mt-1">Xu hướng:</span>
            {trendingTopics.slice(0, 3).map(t => (
              <Link
                key={t.id}
                to={`/search?q=${encodeURIComponent(t.name)}`}
                className="text-primary text-sm hover:text-tertiary transition-colors border-b border-primary/20 hover:border-tertiary/50"
              >
                {t.name}
              </Link>
            ))}
          </>
        ) : (
          <div className="flex gap-4 animate-pulse w-full justify-center">
            <div className="h-4 w-16 bg-white/10 rounded" />
            <div className="h-4 w-20 bg-white/10 rounded" />
            <div className="h-4 w-24 bg-white/10 rounded" />
          </div>
        )}
      </div>
    </section>
  );
}
