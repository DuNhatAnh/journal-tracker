import React, { useEffect, useState, Suspense } from "react";
import { Navigate, Link } from "react-router-dom";
import { Users, Settings, ArrowRight } from "lucide-react";
import { api } from "@/src/lib/api";
import { AdminStats, ChartData } from "./types";

// Import lightweight components normally
import StatCards from "./components/Dashboard/StatCards";
import RoleDistribution from "./components/Dashboard/RoleDistribution";
import RecentSyncLogs from "./components/Dashboard/RecentSyncLogs";

// Lazy load heavy components (ApexCharts)
const AdminCharts = React.lazy(() => import("./components/Dashboard/AdminCharts"));

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
      <StatCards stats={stats} loading={loading} />

      {/* Charts Section - Lazy Loaded */}
      <Suspense fallback={<div className="h-96 rounded-2xl bg-white/5 animate-pulse flex items-center justify-center text-on-surface-variant">Đang tải biểu đồ...</div>}>
        <AdminCharts charts={charts} chartsLoading={chartsLoading} />
      </Suspense>

      {/* Bottom Row: Role distribution + Sync logs */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <RoleDistribution stats={stats} loading={loading} />
        <RecentSyncLogs stats={stats} loading={loading} />
      </div>
    </div>
  );
}
