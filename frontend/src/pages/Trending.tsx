import { useEffect, useState } from "react";
import Chart from "react-apexcharts";
import { Download, Bell, ArrowUp, Info } from "lucide-react";
import { cn } from "@/src/lib/utils";

import { api } from "@/src/lib/api";

interface TrendingData {
  topic: string;
  stats: { growth: string; total: string; impact: string };
  velocity: number[];
  entities: { name: string; growth: number }[];
}

export default function Trending() {
  const [data, setData] = useState<TrendingData | null>(null);

  useEffect(() => {
    api.get<any>("/trends/trending")
      .then(res => {
        const list = res.trending || [];
        const topTrend = list[0];
        
        const topic = topTrend?.keyword?.name || "Chưa có chủ đề nổi bật";
        
        const growth = topTrend ? `+${topTrend.growth_rate}%` : "+0%";
        const total = topTrend ? String(topTrend.paper_count) : "0";
        const impact = topTrend && topTrend.paper_count > 0 
          ? String(Math.round((topTrend.citation_count / topTrend.paper_count) * 10) / 10) 
          : "0.0";

        const entities = list.map((item: any) => ({
          name: item.keyword?.name || "Chủ đề",
          growth: item.growth_rate || 0,
        }));

        setData({
          topic,
          stats: { growth, total, impact },
          velocity: [30, 40, 35, 50, 45, 60, 55, 70, 65, 80, 75, 90], // default sparkline velocity
          entities,
        });
      })
      .catch(err => {
        console.error("Lỗi tải thông tin xu hướng", err);
      });
  }, []);

  if (!data) return <div className="p-8 text-on-surface-variant uppercase font-mono animate-pulse">Đang phân tích các mẫu gia tốc...</div>;

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-1 rounded-full bg-tertiary/10 border border-tertiary/20 text-tertiary font-mono text-[10px] uppercase tracking-widest">Phân tích chủ đề</span>
            <span className="text-on-surface-variant text-[10px] uppercase tracking-widest">• 12 tháng qua</span>
          </div>
          <h2 className="font-display text-4xl font-bold text-on-surface">{data.topic}</h2>
          <p className="text-on-surface-variant mt-1 max-w-2xl text-sm">
            Phân tích sự gia tốc của các ấn phẩm và sự xuất hiện từ khóa trong nghiên cứu mô hình nền tảng.
          </p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-4 py-2 glass-panel rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-white/5 transition-all">
            <Download className="w-4 h-4" /> Xuất báo cáo
          </button>
          <button className="flex items-center gap-2 px-4 py-2 gradient-btn rounded-xl text-xs font-bold uppercase tracking-widest text-on-primary">
            <Bell className="w-4 h-4 fill-current" /> Tạo cảnh báo
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: "Tỷ lệ tăng trưởng", value: data.stats.growth, desc: "so với năm trước", color: "text-tertiary" },
          { label: "Tổng số ấn phẩm", value: data.stats.total, desc: "Trên 45 tạp chí lớn", color: "text-primary" },
          { label: "Ảnh hưởng TB", value: data.stats.impact, desc: "Top 5% của lĩnh vực", color: "text-secondary" },
        ].map((stat, i) => (
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

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Publication Velocity Chart */}
        <div className="lg:col-span-8 glass-panel p-6 rounded-2xl flex flex-col min-h-[400px]">
          <div className="flex justify-between items-center mb-8">
            <div className="space-y-1">
              <h3 className="font-display text-xl font-bold">Tốc độ xuất bản</h3>
              <p className="text-xs text-on-surface-variant">Khối lượng bài viết bình duyệt hàng tháng.</p>
            </div>
            <div className="flex gap-2">
              {['1N', '3N', '5N'].map(t => (
                <button key={t} className="px-3 py-1 rounded bg-surface-bright text-on-surface font-mono text-[10px] border border-white/5 hover:bg-white/10 transition-colors">
                  {t}
                </button>
              ))}
            </div>
          </div>
          
          <div className="flex-1">
            <Chart
              options={{
                chart: { 
                  id: "publication-velocity-chart",
                  toolbar: { show: false },
                  animations: { enabled: true, easing: 'easeinout', speed: 800 },
                  background: 'transparent',
                },
                stroke: { curve: 'smooth', width: 4, colors: ['#3B82F6'] },
                grid: { borderColor: 'rgba(255,255,255,0.05)', strokeDashArray: 4 },
                xaxis: {
                  categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
                  labels: { style: { colors: '#9CA3AF', fontSize: '10px', fontFamily: 'JetBrains Mono' } },
                  axisBorder: { show: false },
                  axisTicks: { show: false },
                },
                yaxis: {
                  labels: { style: { colors: '#9CA3AF', fontSize: '10px', fontFamily: 'JetBrains Mono' } }
                },
                fill: {
                  type: 'gradient',
                  gradient: { shadeIntensity: 0, opacityFrom: 0.3, opacityTo: 0, stops: [0, 90, 100] }
                },
                tooltip: { theme: 'dark' },
              }}
              series={[{ name: "Publications", data: data.velocity }]}
              type="area"
              height={300}
            />
          </div>
        </div>

        {/* Emerging Entities Bar Chart */}
        <div className="lg:col-span-4 glass-panel p-6 rounded-2xl flex flex-col">
          <div className="space-y-1 mb-8">
            <h3 className="font-display text-xl font-bold">Thực thể mới nổi</h3>
            <p className="text-xs text-on-surface-variant">Từ khóa có gia tốc tần suất cao nhất.</p>
          </div>
          
          <div className="flex-1 flex flex-col gap-6">
            {data.entities.map((item, i) => (
              <div key={i} className="space-y-2">
                <div className="flex justify-between items-end">
                  <span className="text-sm font-bold text-on-surface">{item.name}</span>
                  <span className="font-mono text-[10px] text-tertiary">+{item.growth}%</span>
                </div>
                <div className="w-full h-1.5 bg-surface-container-highest rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-secondary to-primary shadow-[0_0_8px_rgba(208,188,255,0.5)] transition-all duration-1000"
                    style={{ width: `${Math.min(100, item.growth / 2.5)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
          
          <button className="mt-8 w-full py-3 rounded-xl border border-white/10 text-on-surface-variant font-display text-[10px] font-bold uppercase tracking-widest hover:bg-white/5 hover:text-on-surface transition-all">
            Xem biểu đồ thực thể đầy đủ
          </button>
        </div>
      </div>
    </div>
  );
}
