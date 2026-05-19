import { useEffect, useState } from "react";
import Chart from "react-apexcharts";
import { TrendingUp, ArrowUpRight, ArrowRight, BookmarkPlus, Filter, Sparkles, BookOpen, Quote, ChevronRight } from "lucide-react";
import { cn } from "@/src/lib/utils";

import { api } from "@/src/lib/api";

interface DashboardData {
  stats: { label: string; value: string; trend: string }[];
  trendingTopics: { id: number; name: string; papers: string; change: string; data: number[] }[];
  recentPapers: { id: number; title: string; journal: string; authors: string; time: string; impact: number; citations: number }[];
}

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);

  useEffect(() => {
    api.get<any>("/dashboard")
      .then(res => {
        const mappedStats = [
          { label: "Tổng số bài báo", value: String(res.stats?.total_papers ?? 0), trend: "Kho lưu trữ" },
          { label: "Số lượng từ khóa", value: String(res.stats?.total_keywords ?? 0), trend: "Theo dõi" },
          { label: "Ấn phẩm năm nay", value: String(res.stats?.papers_this_year ?? 0), trend: "Mới nhận" },
          { label: "Nguồn API kết nối", value: "2", trend: "Hoạt động" },
        ];

        const mappedTrending = (res.trending_topics || []).map((t: any) => ({
          id: t.id,
          name: t.keyword?.name || "Chủ đề",
          papers: `${t.paper_count ?? 0}`,
          change: `+${t.growth_rate ?? 0}%`,
          data: [10, 15, 12, 18, 25, 28, 35],
        }));

        const mappedRecent = (res.recent_papers || []).map((p: any) => ({
          id: p.id,
          title: p.title,
          journal: p.journal?.name || "Khác",
          authors: (p.authors || []).map((a: any) => a.name).join(", ") || "Chưa rõ tác giả",
          time: `${p.published_year ?? ""}`,
          impact: p.citations_count ? Math.round((p.citations_count / 10) * 10) / 10 : 0,
          citations: p.citations_count ?? 0,
        }));

        setData({
          stats: mappedStats,
          trendingTopics: mappedTrending,
          recentPapers: mappedRecent,
        });
      })
      .catch(err => {
        console.error("Lỗi tải thông tin dashboard", err);
      });
  }, []);

  if (!data) return <div className="p-8 text-on-surface-variant uppercase font-mono animate-pulse">Đang khởi tạo Động cơ Thông tin chuyên sâu...</div>;

  return (
    <div className="space-y-12 pb-20">
      {/* Hero Section */}
      <section className="text-center space-y-6 py-8">
        <h2 className="font-display text-5xl md:text-6xl font-bold tracking-tight text-on-surface">
          Khám phá ranh giới tiên tiến của <span className="gradient-text">nghiên cứu.</span>
        </h2>
        <p className="max-w-2xl mx-auto text-on-surface-variant text-lg">
          Phân tích xu hướng, theo dõi trích dẫn và khám phá thông tin chuyên sâu trên hàng triệu bài báo học thuật ngay lập tức.
        </p>
        <div className="flex justify-center gap-4 pt-4">
          <span className="font-mono text-[10px] text-on-surface-variant uppercase tracking-widest mt-1">Xu hướng:</span>
          {["Học máy lượng tử", "CRISPR ngoài mục tiêu", "Pin thể rắn"].map(t => (
            <button key={t} className="text-primary text-sm hover:text-tertiary transition-colors border-b border-primary/20 hover:border-tertiary/50">
              {t}
            </button>
          ))}
        </div>
      </section>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {data.stats.map((stat, i) => (
          <div key={i} className="glass-panel p-6 rounded-xl hover:bg-white/5 transition-all">
            <p className="font-display text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-1">{stat.label}</p>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-on-surface tracking-tighter">{stat.value}</span>
              <span className="text-tertiary text-xs font-mono font-bold">{stat.trend}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Trending Topics */}
        <div className="lg:col-span-8 space-y-8">
          <header className="flex justify-between items-end">
            <div>
              <h3 className="font-display text-2xl font-bold text-on-surface">Xu hướng nghiên cứu</h3>
              <p className="text-sm text-on-surface-variant">Thúc đẩy các lĩnh vực nghiên cứu trong chuyên môn của bạn.</p>
            </div>
            <button className="flex items-center gap-1 text-primary text-[10px] font-bold uppercase tracking-widest hover:text-tertiary transition-colors">
              Xem tất cả <ArrowRight className="w-3 h-3" />
            </button>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {data.trendingTopics.map((topic) => (
              <div key={topic.id} className="glass-panel p-6 rounded-xl relative group overflow-hidden hover:border-primary/40 transition-all cursor-pointer">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="flex justify-between items-start mb-4">
                   <h4 className="font-display text-lg font-bold leading-tight group-hover:text-primary transition-colors">{topic.name}</h4>
                   <span className="bg-tertiary-container/20 text-tertiary text-[10px] font-bold px-1.5 py-0.5 rounded border border-tertiary/20 flex items-center gap-0.5">
                    <TrendingUp className="w-2.5 h-2.5" /> {topic.change}
                   </span>
                </div>
                <p className="text-xs text-on-surface-variant mb-4">{topic.papers} bài báo mới trong tháng này</p>
                
                <div className="h-16">
                  <Chart
                    options={{
                      chart: { 
                        id: `trending-topic-${topic.id}`,
                        sparkline: { enabled: true }, 
                        animations: { speed: 500 } 
                      },
                      stroke: { curve: "smooth", width: 2, colors: ["#3B82F6"] },
                      fill: { type: "gradient", gradient: { shadeIntensity: 1, opacityFrom: 0.4, opacityTo: 0 } },
                      tooltip: { enabled: false },
                    }}
                    series={[{ data: topic.data }]}
                    type="area"
                    height={64}
                  />
                </div>
              </div>
            ))}
          </div>

          <section className="pt-4">
             <header className="flex justify-between items-end mb-6">
              <div>
                <h3 className="font-display text-2xl font-bold text-on-surface">Vừa xuất bản</h3>
                <p className="text-sm text-on-surface-variant">Các bổ sung mới nhất từ các tạp chí bạn theo dõi.</p>
              </div>
              <button className="glass-panel p-2 rounded-lg hover:bg-white/5 whitespace-nowrap">
                <Filter className="w-4 h-4 text-on-surface-variant" />
              </button>
            </header>

            <div className="glass-panel rounded-xl overflow-hidden divide-y divide-white/5">
              {data.recentPapers.map((paper) => (
                <div key={paper.id} className="p-6 hover:bg-white/5 transition-all group flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                       <span className="bg-primary/10 text-primary text-[10px] font-bold px-2 py-0.5 rounded border border-primary/20 uppercase tracking-widest">{paper.journal}</span>
                       <span className="text-[10px] text-on-surface-variant uppercase tracking-widest">{paper.time}</span>
                    </div>
                    <h4 className="font-display font-bold text-on-surface group-hover:text-primary transition-colors cursor-pointer">{paper.title}</h4>
                    <p className="text-sm text-on-surface-variant mt-1">{paper.authors}</p>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right hidden md:block">
                      <p className="text-[10px] font-bold text-primary uppercase tracking-widest">Ảnh hưởng: {paper.impact}</p>
                      <p className="text-[10px] text-on-surface-variant uppercase tracking-widest">{paper.citations} Trích dẫn</p>
                    </div>
                    <button className="w-10 h-10 rounded-full border-2 border-outline-variant/30 flex items-center justify-center text-on-surface-variant hover:text-tertiary hover:border-tertiary transition-colors bg-surface-container/50">
                       <BookmarkPlus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Right Column: AI Insights */}
        <div className="lg:col-span-4 space-y-8">
           <section className="glass-panel-intense rounded-2xl p-8 relative overflow-hidden group border-t-2 border-primary/50">
             <div className="absolute -right-4 -top-4 w-32 h-32 bg-primary/10 rounded-full blur-3xl pointer-events-none group-hover:bg-primary/20 transition-colors" />
             <div className="flex items-center gap-2 mb-6">
               <Sparkles className="w-6 h-6 text-primary" />
               <h3 className="font-display text-xl font-bold">Động cơ Thông tin chuyên sâu</h3>
             </div>
             <p className="text-sm text-on-surface-variant leading-relaxed mb-6">
               Dựa trên sự quan tâm của bạn về <strong>Vật lý lượng tử</strong>, chúng tôi đề xuất những văn bản nền tảng này cho bài đánh giá hiện tại của bạn.
             </p>
             <div className="space-y-4">
               {[
                 { title: "Sự mất kết hợp và sự xuất hiện của một thế giới cổ điển", author: "E. Joos et al.", match: "98%" },
                 { title: "Tính toán lượng tử và Thông tin lượng tử", author: "M. Nielsen", match: "94%" },
               ].map((rec, i) => (
                 <div key={i} className="p-4 rounded-xl bg-surface-container/30 border-2 border-outline-variant/30 hover:border-primary/30 transition-all cursor-pointer group">
                   <h5 className="text-sm font-bold leading-tight mb-2 group-hover:text-primary transition-colors">{rec.title}</h5>
                   <div className="flex justify-between items-center text-[10px] uppercase font-bold tracking-widest text-on-surface-variant">
                     <span>{rec.author}</span>
                     <span className="text-primary">{rec.match} Phù hợp</span>
                   </div>
                 </div>
               ))}
             </div>
             <button className="w-full mt-8 gradient-btn py-3 rounded-xl font-display text-xs font-bold uppercase tracking-widest text-white flex items-center justify-center gap-2">
               Tạo đánh giá <BookOpen className="w-4 h-4" />
             </button>
           </section>

           <section className="space-y-4">
             <h3 className="font-display text-xl font-bold px-2">Tạp chí hàng đầu</h3>
             <div className="space-y-3">
               {[
                 { name: "Nature", field: "Đa ngành", initial: "N", color: "bg-white text-black" },
                 { name: "Science", field: "Đa ngành", initial: "S", color: "bg-secondary-container text-on-secondary-container" },
                 { name: "Cell", field: "Khoa học đời sống", initial: "C", color: "bg-tertiary-container text-on-tertiary-container" },
               ].map((j, i) => (
                 <div key={i} className="glass-panel p-4 rounded-xl border-2 flex items-center gap-4 hover:bg-white/5 cursor-pointer group">
                    <div className={cn("w-12 h-12 rounded-lg flex items-center justify-center font-display font-black text-xl shadow-md", j.color)}>
                      {j.initial}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-on-surface leading-tight">{j.name}</h4>
                      <p className="text-xs text-on-surface-variant">{j.field}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-outline group-hover:text-primary transition-all" />
                 </div>
               ))}
             </div>
           </section>
        </div>
      </div>
    </div>
  );
}
