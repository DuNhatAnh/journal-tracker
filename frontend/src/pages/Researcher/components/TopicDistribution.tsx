import Chart from "react-apexcharts";
import { Loader2, PieChart } from "lucide-react";

interface CoOccurringKeyword {
  id: number;
  name: string;
  count: number;
}

interface TopicDistributionProps {
  keywords: CoOccurringKeyword[];
  loading?: boolean;
  type: "keyword" | "author";
}

export function TopicDistribution({ keywords, loading, type }: TopicDistributionProps) {
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

  const chartData = keywords.slice(0, 6);
  const series = chartData.map(k => k.count);
  const labels = chartData.map(k => `#${k.name}`);

  const title = type === "author" ? "Chủ đề nghiên cứu chính" : "Chủ đề đồng xuất hiện";
  const subtitle = type === "author" 
    ? "Tỷ lệ các từ khóa chủ đề trong các công trình công bố."
    : "Các từ khóa thường đi kèm trong cùng công bố.";

  return (
    <div className="glass-panel p-6 rounded-2xl flex flex-col min-h-[380px]">
      <div className="flex items-center gap-2 mb-6">
        <PieChart className="w-5 h-5 text-secondary" />
        <div className="space-y-1 text-left">
          <h3 className="font-display text-xl font-bold text-on-surface">{title}</h3>
          <p className="text-xs text-on-surface-variant">{subtitle}</p>
        </div>
      </div>
      
      <div className="flex-1 flex items-center justify-center">
        {series.length > 0 ? (
          <div className="w-full">
            <Chart
              options={{
                chart: {
                  id: "topic-distribution-chart",
                  background: 'transparent',
                  toolbar: { show: false }
                },
                labels: labels,
                colors: ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#6B7280'],
                stroke: type === "keyword" ? { show: true, width: 2 } : { show: false },
                ...(type === "keyword" && {
                  fill: { opacity: 0.2 },
                  markers: { size: 4, hover: { size: 6 } },
                }),
                legend: {
                  position: 'bottom',
                  fontSize: '11px',
                  fontFamily: 'Inter, sans-serif',
                  labels: { colors: '#9CA3AF' },
                  markers: { size: 6 }
                },
                yaxis: type === "keyword" ? { show: false } : undefined,
                dataLabels: {
                  enabled: type !== "keyword",
                  style: { fontSize: '10px', fontFamily: 'JetBrains Mono', fontWeight: 'bold' }
                },
                tooltip: { theme: 'dark' }
              }}
              series={type === "keyword" ? [{ name: 'Số lần đồng xuất hiện', data: series }] : series}
              type={type === "keyword" ? "radar" : "donut"}
              width="100%"
              height={280}
            />
          </div>
        ) : (
          <p className="text-center text-xs text-on-surface-variant py-8 font-mono">Chưa có dữ liệu phân bố chủ đề.</p>
        )}
      </div>
    </div>
  );
}
