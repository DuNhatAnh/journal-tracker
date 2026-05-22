import React, { useEffect, useState } from "react";
import { Navigate, Link } from "react-router-dom";
import ReactApexChart from "react-apexcharts";
import {
  Users,
  FileText,
  Database,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Clock,
  TrendingUp,
  Settings,
  ArrowRight,
  Activity,
  Shield,
  GraduationCap,
  BookOpen,
  UserCog,
  BarChart2,
  PieChart,
  AlignLeft,
} from "lucide-react";
import { api } from "@/src/lib/api";

type AdminStats = {
  total_users: number;
  total_papers: number;
  total_journals: number;
  total_keywords: number;
  total_api_sources: number;
  active_api_sources: number;
  total_sync_logs: number;
  last_sync_at: string | null;
  users_by_role: { role: string; count: number }[];
  recent_sync_logs: {
    id: number;
    status: string;
    papers_synced: number;
    created_at: string;
    api_source?: { name: string };
  }[];
};

type ChartData = {
  papers_per_year: { year: number; total: number }[];
  top_journals: { name: string; total: number }[];
  top_keywords: { name: string; total: number }[];
};

const roleConfig: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  admin: { label: "Quản trị viên", icon: Shield, color: "text-error" },
  researcher: { label: "Nhà nghiên cứu", icon: TrendingUp, color: "text-primary" },
  lecturer: { label: "Giảng viên", icon: BookOpen, color: "text-secondary" },
  student: { label: "Sinh viên", icon: GraduationCap, color: "text-tertiary" },
};

// ApexCharts common dark theme options
const chartBaseOptions = {
  chart: { background: "transparent", toolbar: { show: false }, animations: { enabled: true, speed: 800 } },
  theme: { mode: "dark" as const },
  grid: { borderColor: "rgba(255,255,255,0.07)", strokeDashArray: 4 },
  tooltip: { theme: "dark" as const },
};

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [charts, setCharts] = useState<ChartData | null>(null);
  const [loading, setLoading] = useState(true);
  const [chartsLoading, setChartsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const currentUserStr = localStorage.getItem("user");
  const currentUser = currentUserStr ? JSON.parse(currentUserStr) : null;

  useEffect(() => {
    if (currentUser?.role === "admin") {
      loadStats();
      loadCharts();
    }
  }, []);

  if (currentUser?.role !== "admin") {
    return <Navigate to="/dashboard" replace />;
  }

  const loadStats = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.get<AdminStats>("/admin/stats");
      setStats(data);
    } catch (err: any) {
      setError(err.message || "Không thể tải dữ liệu thống kê.");
    } finally {
      setLoading(false);
    }
  };

  const loadCharts = async () => {
    setChartsLoading(true);
    try {
      const data = await api.get<ChartData>("/admin/charts");
      setCharts(data);
    } catch {
      // Charts are optional, fail silently
    } finally {
      setChartsLoading(false);
    }
  };

  // ── Chart 1: Papers per year (Bar) ──────────────────────────────────────
  // Fill in any missing years with 0 so the chart always shows 10 bars
  const currentYear = new Date().getFullYear();
  const allYears = Array.from({ length: 10 }, (_, i) => currentYear - 9 + i);
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

  const statCards = stats
    ? [
        { label: "Tổng người dùng", value: stats.total_users, icon: Users, color: "text-primary", bg: "bg-primary/10", border: "border-primary/20" },
        { label: "Bài báo khoa học", value: stats.total_papers.toLocaleString("vi-VN"), icon: FileText, color: "text-secondary", bg: "bg-secondary/10", border: "border-secondary/20" },
        { label: "Tạp chí (Journals)", value: stats.total_journals, icon: Database, color: "text-amber-400", bg: "bg-amber-400/10", border: "border-amber-400/20" },
        { label: "Từ khóa (Keywords)", value: stats.total_keywords.toLocaleString("vi-VN"), icon: TrendingUp, color: "text-primary", bg: "bg-primary/10", border: "border-primary/20" },
        { label: "Nguồn API (Đang bật)", value: `${stats.active_api_sources} / ${stats.total_api_sources}`, icon: RefreshCw, color: "text-tertiary", bg: "bg-tertiary/10", border: "border-tertiary/20" },
        { label: "Tổng lượt đồng bộ", value: stats.total_sync_logs, icon: Activity, color: "text-secondary", bg: "bg-secondary/10", border: "border-secondary/20" },
      ]
    : [];

  const ChartSkeleton = () => (
    <div className="h-64 rounded-2xl bg-white/5 animate-pulse" />
  );

  return (
    <div className="max-w-6xl mx-auto space-y-10 pb-20">
      {/* Header */}
      <header className="border-b border-white/5 pb-6">
        <h2 className="font-display text-4xl font-bold text-on-surface">Tổng quan hệ thống</h2>
        <p className="text-on-surface-variant mt-2 font-medium">
          Theo dõi trạng thái toàn bộ hệ thống, xu hướng bài báo, tạp chí và từ khóa nổi bật.
        </p>
      </header>

      {error && (
        <div className="p-4 rounded-xl bg-error-container/20 border border-error/40 text-error text-sm font-medium">
          {error}
        </div>
      )}

      {/* Stat Cards */}
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-28 rounded-2xl bg-white/5 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {statCards.map((card) => (
            <div key={card.label} className={`glass-panel rounded-2xl p-5 border ${card.border} bg-surface flex items-start gap-4`}>
              <div className={`p-3 rounded-xl ${card.bg}`}>
                <card.icon className={`w-5 h-5 ${card.color}`} />
              </div>
              <div>
                <p className="text-2xl font-black font-display text-on-surface">{card.value}</p>
                <p className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider mt-0.5">{card.label}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── 3 Charts Section ─────────────────────────────────────── */}
      <section className="space-y-6">
        <h3 className="font-display text-xl font-bold text-on-surface flex items-center gap-2">
          <BarChart2 className="w-5 h-5 text-primary" />
          Biểu đồ phân tích dữ liệu học thuật
        </h3>

        {/* Chart 1: Papers per year — full width */}
        <div className="glass-panel rounded-2xl p-6 bg-surface border border-white/10 space-y-4">
          <div className="flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-primary" />
            <h4 className="font-display font-bold text-base text-on-surface">Xu hướng bài báo theo năm</h4>
            <span className="ml-auto text-[10px] font-bold text-on-surface-variant uppercase tracking-widest bg-white/5 px-2 py-1 rounded-lg">Biểu đồ cột</span>
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

      {/* ── Bottom Row: Role distribution + Sync logs ──────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* User Role Distribution */}
        <div className="lg:col-span-5 glass-panel rounded-2xl p-6 bg-surface border border-white/10 space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="font-display font-bold text-lg flex items-center gap-2">
              <UserCog className="w-5 h-5 text-primary" />
              Phân bổ vai trò người dùng
            </h3>
            <Link to="/admin/users" className="text-xs font-bold text-primary hover:text-primary/70 flex items-center gap-1 transition-colors">
              Quản lý <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-12 rounded-xl bg-white/5 animate-pulse" />
              ))}
            </div>
          ) : stats?.users_by_role && stats.users_by_role.length > 0 ? (
            <div className="space-y-3">
              {stats.users_by_role.map((item) => {
                const config = roleConfig[item.role] ?? { label: item.role, icon: Users, color: "text-on-surface-variant" };
                const total = stats.total_users || 1;
                const pct = Math.round((item.count / total) * 100);
                return (
                  <div key={item.role} className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <config.icon className={`w-4 h-4 ${config.color}`} />
                        <span className="text-sm font-semibold text-on-surface">{config.label}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-black ${config.color}`}>{item.count}</span>
                        <span className="text-xs text-on-surface-variant">({pct}%)</span>
                      </div>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-white/5 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${config.color.replace("text-", "bg-")}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-on-surface-variant text-center py-6">Chưa có dữ liệu người dùng.</p>
          )}
        </div>

        {/* Recent Sync Logs */}
        <div className="lg:col-span-7 glass-panel rounded-2xl p-6 bg-surface border border-white/10 space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="font-display font-bold text-lg flex items-center gap-2">
              <Activity className="w-5 h-5 text-secondary" />
              Lịch sử đồng bộ gần đây
            </h3>
            <Link to="/admin/sync" className="text-xs font-bold text-secondary hover:text-secondary/70 flex items-center gap-1 transition-colors">
              Cấu hình <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-14 rounded-xl bg-white/5 animate-pulse" />
              ))}
            </div>
          ) : stats?.recent_sync_logs && stats.recent_sync_logs.length > 0 ? (
            <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
              {stats.recent_sync_logs.map((log) => (
                <div key={log.id} className="flex items-center justify-between p-3.5 rounded-xl bg-white/5 border border-white/5">
                  <div className="flex items-center gap-3">
                    {log.status === "completed" || log.status === "success" ? (
                      <CheckCircle2 className="w-4 h-4 text-tertiary shrink-0" />
                    ) : log.status === "failed" ? (
                      <XCircle className="w-4 h-4 text-error shrink-0" />
                    ) : (
                      <Clock className="w-4 h-4 text-secondary shrink-0 animate-pulse" />
                    )}
                    <div>
                      <p className="text-sm font-bold text-on-surface leading-tight">
                        {log.api_source?.name ?? `Nguồn #${log.id}`}
                      </p>
                      <p className="text-[11px] text-on-surface-variant">
                        {log.papers_synced} bài báo •{" "}
                        {new Date(log.created_at).toLocaleString("vi-VN", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  </div>
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                    log.status === "completed" || log.status === "success"
                      ? "bg-tertiary/15 text-tertiary"
                      : log.status === "failed"
                      ? "bg-error/15 text-error"
                      : "bg-secondary/15 text-secondary"
                  }`}>
                    {log.status === "completed" || log.status === "success" ? "Thành công" : log.status === "failed" ? "Lỗi" : "Đang chạy"}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-on-surface-variant text-center py-6">Chưa có lịch sử đồng bộ.</p>
          )}
        </div>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link to="/admin/users" className="group glass-panel rounded-2xl p-6 bg-surface border border-white/10 flex items-center gap-5 hover:border-primary/40 hover:bg-primary/5 transition-all duration-300">
          <div className="p-4 rounded-xl bg-primary/10 group-hover:bg-primary/20 transition-colors">
            <Users className="w-6 h-6 text-primary" />
          </div>
          <div className="flex-1">
            <h4 className="font-display font-bold text-on-surface">Quản lý người dùng</h4>
            <p className="text-xs text-on-surface-variant mt-1">Thêm, sửa, xóa tài khoản và phân quyền vai trò.</p>
          </div>
          <ArrowRight className="w-5 h-5 text-on-surface-variant group-hover:text-primary group-hover:translate-x-1 transition-all" />
        </Link>

        <Link to="/admin/sync" className="group glass-panel rounded-2xl p-6 bg-surface border border-white/10 flex items-center gap-5 hover:border-secondary/40 hover:bg-secondary/5 transition-all duration-300">
          <div className="p-4 rounded-xl bg-secondary/10 group-hover:bg-secondary/20 transition-colors">
            <Settings className="w-6 h-6 text-secondary" />
          </div>
          <div className="flex-1">
            <h4 className="font-display font-bold text-on-surface">Cấu hình đồng bộ API</h4>
            <p className="text-xs text-on-surface-variant mt-1">Bật/tắt nguồn dữ liệu và kích hoạt đồng bộ thủ công.</p>
          </div>
          <ArrowRight className="w-5 h-5 text-on-surface-variant group-hover:text-secondary group-hover:translate-x-1 transition-all" />
        </Link>
      </div>
    </div>
  );
}
