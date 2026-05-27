import Chart from "react-apexcharts";
import { Loader2 } from "lucide-react";

interface SelectedEntity {
  id: number;
  name: string;
  type: "keyword" | "author";
}

interface PublicationVelocityProps {
  categories: string[];
  series: {
    name: string;
    data: number[];
    type?: string;
  }[];
  loading?: boolean;
  selectedEntity?: SelectedEntity | null;
}

export function PublicationVelocity({ categories, series, loading, selectedEntity }: PublicationVelocityProps) {
  if (loading) {
    return (
      <div className="glass-panel p-6 rounded-2xl flex flex-col min-h-[380px] justify-between relative overflow-hidden animate-pulse border border-white/5">
        <div className="space-y-2">
          <div className="h-6 w-36 bg-white/15 rounded" />
          <div className="h-3.5 w-64 bg-white/10 rounded mt-1" />
        </div>
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      </div>
    );
  }

  const isAuthor = selectedEntity?.type === "author";
  const title = isAuthor ? "Năng suất & Ảnh hưởng học thuật" : "Tốc độ xuất bản";
  const subtitle = isAuthor 
    ? "Số lượng bài viết (cột) & Lượt trích dẫn tích lũy (đường) qua các năm."
    : "Khối lượng bài viết công bố qua các năm lọc.";

  return (
    <div className="glass-panel p-6 rounded-2xl flex flex-col min-h-[380px]">
      <div className="flex justify-between items-center mb-6">
        <div className="space-y-1 text-left">
          <h3 className="font-display text-xl font-bold">{title}</h3>
          <p className="text-xs text-on-surface-variant">{subtitle}</p>
        </div>
      </div>
      
      <div className="flex-1">
        {categories.length > 0 ? (
          <Chart
            options={{
              chart: { 
                id: "publication-velocity-chart",
                toolbar: { show: false },
                animations: { enabled: true, speed: 500 },
                background: 'transparent',
              },
              stroke: { 
                curve: 'smooth' as const, 
                width: isAuthor ? [0, 4] : 3, 
                colors: isAuthor ? ['#3B82F6', '#F59E0B'] : ['#3B82F6'] 
              },
              colors: isAuthor ? ['#3B82F6', '#F59E0B'] : ['#3B82F6'],
              grid: { borderColor: 'rgba(255,255,255,0.05)', strokeDashArray: 4 },
              xaxis: {
                categories: categories,
                labels: { style: { colors: '#9CA3AF', fontSize: '10px', fontFamily: 'JetBrains Mono' } },
                axisBorder: { show: false },
                axisTicks: { show: false },
              },
              yaxis: isAuthor 
                ? [
                    {
                      title: { text: "Số bài báo", style: { color: '#3B82F6', fontFamily: 'JetBrains Mono', fontSize: '9px', fontWeight: 'bold' } },
                      labels: { style: { colors: '#3B82F6', fontSize: '10px', fontFamily: 'JetBrains Mono' } }
                    },
                    {
                      opposite: true,
                      title: { text: "Lượt trích dẫn", style: { color: '#F59E0B', fontFamily: 'JetBrains Mono', fontSize: '9px', fontWeight: 'bold' } },
                      labels: { style: { colors: '#F59E0B', fontSize: '10px', fontFamily: 'JetBrains Mono' } }
                    }
                  ]
                : {
                    labels: { style: { colors: '#9CA3AF', fontSize: '10px', fontFamily: 'JetBrains Mono' } }
                  },
              fill: {
                type: isAuthor ? 'solid' : 'gradient',
                opacity: isAuthor ? [0.85, 1] : 1,
                gradient: isAuthor ? undefined : { shadeIntensity: 0, opacityFrom: 0.3, opacityTo: 0, stops: [0, 90, 100] }
              },
              tooltip: { theme: 'dark' },
            }}
            series={series}
            type={isAuthor ? "line" : "area"}
            height={280}
          />
        ) : (
          <p className="text-center text-xs text-on-surface-variant py-8">Chưa có dữ liệu biểu đồ.</p>
        )}
      </div>
    </div>
  );
}
