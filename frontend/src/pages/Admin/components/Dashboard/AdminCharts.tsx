import React from "react";
import ReactApexChart from "react-apexcharts";
import { BarChart2, PieChart, AlignLeft } from "lucide-react";
import { ChartData } from "../../types";

type AdminChartsProps = {
  charts: ChartData | null;
  chartsLoading: boolean;
};

// ApexCharts common dark theme options
const chartBaseOptions = {
  chart: { background: "transparent", toolbar: { show: false }, animations: { enabled: true, speed: 800 } },
  theme: { mode: "dark" as const },
  grid: { borderColor: "rgba(255,255,255,0.07)", strokeDashArray: 4 },
  tooltip: {
    theme: "dark" as const,
    shared: true,
    intersect: false,
  },
};

export default function AdminCharts({ charts, chartsLoading }: AdminChartsProps) {
  const [yearRange, setYearRange] = React.useState<number>(10);

  // ── Chart 1: Papers per year (Bar) ──────────────────────────────────────
  const currentYear = new Date().getFullYear();
  const allYears = Array.from({ length: yearRange }, (_, i) => currentYear - (yearRange - 1) + i);
  const yearMap = Object.fromEntries((charts?.papers_per_year ?? []).map(d => [d.year, d.total]));
  const papersPerYearFilled = allYears.map(y => ({ year: y, total: yearMap[y] ?? 0 }));

  const papersBarOptions: ApexCharts.ApexOptions = {
    ...chartBaseOptions,
    chart: { ...chartBaseOptions.chart, type: "bar", id: "papers-per-year" },
    plotOptions: { bar: { borderRadius: 5, columnWidth: "50%" } },
    dataLabels: { enabled: false },
    xaxis: {
      categories: papersPerYearFilled.map(d => d.year.toString()),
      labels: { style: { colors: "#9ca3af", fontSize: "11px" } },
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    yaxis: { labels: { style: { colors: "#9ca3af", fontSize: "11px" } } },
    fill: {
      type: "gradient",
      gradient: { shade: "dark", type: "vertical", gradientToColors: ["#7c3aed"], stops: [0, 100] },
    },
    colors: ["#a78bfa"],
  };

  const papersBarSeries = [
    { name: "Số bài báo", data: papersPerYearFilled.map(d => d.total) },
  ];

  // ── Chart 2: Top Journals (Donut) ──────────────────────────────────────
  const journalDonutOptions: ApexCharts.ApexOptions = {
    ...chartBaseOptions,
    chart: { ...chartBaseOptions.chart, type: "donut", id: "top-journals" },
    labels: charts?.top_journals.map((d) => d.name) ?? [],
    colors: ["#7c3aed","#06b6d4","#10b981","#f59e0b","#ef4444","#8b5cf6","#3b82f6","#14b8a6","#f97316","#ec4899"],
    plotOptions: { pie: { donut: { size: "62%", labels: { show: true, name: { color: "#9ca3af" }, value: { color: "#1e293b", fontSize: "24px", fontWeight: "bold" }, total: { show: true, label: "Tổng bài", color: "#9ca3af", fontSize: "12px", fontWeight: "600" } } } } },
    dataLabels: { enabled: false },
    legend: { position: "bottom" as const, fontSize: "10px", labels: { colors: "#9ca3af" }, itemMargin: { horizontal: 6, vertical: 4 } },
    stroke: { width: 0 },
  };

  const journalDonutSeries = charts?.top_journals.map((d) => d.total) ?? [];

  // ── Chart 3: Top Keywords (Horizontal Bar) ──────────────────────────────
  const keywordsBarOptions: ApexCharts.ApexOptions = {
    ...chartBaseOptions,
    chart: { ...chartBaseOptions.chart, type: "bar", id: "top-keywords" },
    plotOptions: { bar: { borderRadius: 4, horizontal: true, barHeight: "65%",
      distributed: true,
    } },
    dataLabels: { enabled: true, style: { fontSize: "10px", colors: ["#fff"] }, formatter: (val: number) => val.toString() },
    xaxis: { labels: { style: { colors: "#9ca3af", fontSize: "10px" } }, axisBorder: { show: false }, axisTicks: { show: false } },
    yaxis: { labels: { style: { colors: "#d1d5db", fontSize: "10px", fontWeight: "600" }, maxWidth: 160 } },
    colors: ["#7c3aed","#8b5cf6","#a78bfa","#c4b5fd","#06b6d4","#0ea5e9","#10b981","#34d399","#f59e0b","#fbbf24","#ef4444","#f87171","#ec4899","#f472b6","#14b8a6"],
    legend: { show: false },
  };

  const keywordsBarSeries = [
    {
      name: "Số bài báo",
      data: charts?.top_keywords.map((d) => ({ x: d.name, y: d.total })) ?? [],
    },
  ];

  const ChartSkeleton = () => (
    <div className="h-64 rounded-2xl bg-white/5 animate-pulse" />
  );

  return (
    <section className="space-y-6">
      <h3 className="font-display text-xl font-bold text-on-surface flex items-center gap-2">
        <BarChart2 className="w-5 h-5 text-primary" />
        Biểu đồ phân tích dữ liệu học thuật
      </h3>

      {/* Chart 1: Papers per year — full width */}
      <div className="glass-panel rounded-2xl p-6 bg-surface border border-white/10 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-primary" />
            <h4 className="font-display font-bold text-base text-on-surface">Xu hướng bài báo theo năm</h4>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Phạm vi:</label>
            <select
              value={yearRange}
              onChange={(e) => setYearRange(Number(e.target.value))}
              className="bg-white/5 border border-white/10 rounded-lg px-2.5 py-1 text-xs font-bold text-on-surface outline-none focus:border-primary/50 transition-colors"
            >
              <option value={5} className="bg-background">5 năm gần nhất</option>
              <option value={10} className="bg-background">10 năm gần nhất</option>
              <option value={15} className="bg-background">15 năm gần nhất</option>
            </select>
          </div>
        </div>
        {chartsLoading ? (
          <ChartSkeleton />
        ) : papersPerYearFilled.some(d => d.total > 0) ? (
          <ReactApexChart
            options={papersBarOptions}
            series={papersBarSeries}
            type="bar"
            height={200}
          />
        ) : (
          <div className="h-64 flex items-center justify-center text-on-surface-variant text-sm">Chưa có dữ liệu bài báo.</div>
        )}
      </div>

      {/* Chart 2 + 3: Side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 2: Top Journals (Donut) */}
        <div className="glass-panel rounded-2xl p-6 bg-surface border border-white/10 space-y-4">
          <div className="flex items-center gap-2">
            <PieChart className="w-4 h-4 text-tertiary" />
            <h4 className="font-display font-bold text-base text-on-surface">Top 10 tạp chí hàng đầu</h4>
            <span className="ml-auto text-[10px] font-bold text-on-surface-variant uppercase tracking-widest bg-white/5 px-2 py-1 rounded-lg">Donut</span>
          </div>
          {chartsLoading ? (
            <ChartSkeleton />
          ) : journalDonutSeries.length > 0 ? (
            <ReactApexChart
              options={journalDonutOptions}
              series={journalDonutSeries}
              type="donut"
              height={280}
            />
          ) : (
            <div className="h-64 flex items-center justify-center text-on-surface-variant text-sm">Chưa có dữ liệu tạp chí.</div>
          )}
        </div>

        {/* Chart 3: Top Keywords (Horizontal Bar) */}
        <div className="glass-panel rounded-2xl p-6 bg-surface border border-white/10 space-y-4">
          <div className="flex items-center gap-2">
            <AlignLeft className="w-4 h-4 text-secondary" />
            <h4 className="font-display font-bold text-base text-on-surface">Top 15 từ khóa nổi bật</h4>
            <span className="ml-auto text-[10px] font-bold text-on-surface-variant uppercase tracking-widest bg-white/5 px-2 py-1 rounded-lg">Thanh ngang</span>
          </div>
          {chartsLoading ? (
            <ChartSkeleton />
          ) : (charts?.top_keywords?.length ?? 0) > 0 ? (
            <ReactApexChart
              options={keywordsBarOptions}
              series={keywordsBarSeries}
              type="bar"
              height={280}
            />
          ) : (
            <div className="h-64 flex items-center justify-center text-on-surface-variant text-sm">Chưa có dữ liệu từ khóa.</div>
          )}
        </div>
      </div>
    </section>
  );
}
