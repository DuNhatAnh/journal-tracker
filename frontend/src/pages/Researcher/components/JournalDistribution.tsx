import { useMemo } from "react";
import Chart from "react-apexcharts";
import { PieChart, Loader2 } from "lucide-react";
import { useApiQuery } from "../../../hooks/useApiQuery";

interface JournalRecord {
  id: number;
  name: string;
  field: string;
  papers_count: number;
}

interface SelectedEntity {
  id: number;
  name: string;
  type: "keyword" | "author";
}

interface JournalDistributionProps {
  selectedEntity: SelectedEntity | null;
}

export function JournalDistribution({ selectedEntity }: JournalDistributionProps) {
  const journalsUrl = selectedEntity
    ? (selectedEntity.type === "author"
        ? `/trends/author/${selectedEntity.id}/journals`
        : `/trends/${selectedEntity.id}/journals`)
    : "";

  const { data: journals, loading } = useApiQuery<JournalRecord[]>(
    journalsUrl,
    { enabled: !!journalsUrl }
  );

  const chartData = useMemo(() => {
    if (!journals || journals.length === 0) return { series: [], labels: [] };
    const sorted = [...journals].sort((a, b) => b.papers_count - a.papers_count).slice(0, 5);
    const series = sorted.map(j => j.papers_count);
    const labels = sorted.map(j => j.name.split(' ').slice(0, 4).join(' ') + (j.name.split(' ').length > 4 ? '...' : ''));
    return { series, labels };
  }, [journals]);

  return (
    <div className="glass-panel p-6 rounded-2xl border border-white/5 h-full flex flex-col">
      <div className="flex items-center gap-2 mb-6">
        <div className="p-2 bg-secondary/10 rounded-lg">
          <PieChart className="w-5 h-5 text-secondary" />
        </div>
        <div>
          <h3 className="font-display text-lg font-bold text-on-surface">Phân bổ theo Tạp chí</h3>
          <p className="text-xs text-on-surface-variant font-mono mt-0.5 uppercase tracking-widest">
            Top 5 tạp chí có nhiều bài báo nhất
          </p>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center min-h-[250px]">
        {loading ? (
          <div className="flex flex-col items-center justify-center text-on-surface-variant animate-pulse">
            <Loader2 className="w-6 h-6 animate-spin mb-2" />
            <span className="text-xs font-mono uppercase tracking-widest">Đang tải dữ liệu...</span>
          </div>
        ) : chartData.series.length > 0 ? (
          <div className="w-full">
            <Chart
              options={{
                chart: { type: 'donut', background: 'transparent' },
                labels: chartData.labels,
                colors: ['#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444'],
                plotOptions: {
                  pie: {
                    donut: {
                      size: '70%',
                      labels: {
                        show: true,
                        name: { fontSize: '10px', fontFamily: 'JetBrains Mono', color: '#9CA3AF' },
                        value: { fontSize: '16px', fontWeight: 'bold', color: '#FFFFFF', formatter: (val) => val + ' bài' },
                        total: {
                          show: true,
                          showAlways: true,
                          label: 'Tổng (Top 5)',
                          fontSize: '10px',
                          fontFamily: 'JetBrains Mono',
                          color: '#9CA3AF',
                          formatter: function (w) {
                            return w.globals.seriesTotals.reduce((a: any, b: any) => a + b, 0) + ' bài';
                          }
                        }
                      }
                    }
                  }
                },
                dataLabels: { enabled: false },
                stroke: { show: false },
                legend: {
                  position: 'bottom',
                  fontSize: '11px',
                  fontFamily: 'JetBrains Mono',
                  labels: { colors: '#9CA3AF' },
                  markers: { size: 6, shape: "circle" }
                },
                tooltip: { theme: 'dark' }
              }}
              series={chartData.series}
              type="donut"
              height={300}
            />
          </div>
        ) : (
          <p className="text-xs text-on-surface-variant text-center font-mono border border-dashed border-outline-variant/30 rounded-xl bg-white/5 py-8 w-full">
            Không có dữ liệu phân bổ tạp chí.
          </p>
        )}
      </div>
    </div>
  );
}
