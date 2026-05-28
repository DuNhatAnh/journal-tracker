import React, { useState } from "react";
import { X, CheckCircle2, XCircle, AlertCircle, Loader2, Search, StopCircle, RefreshCw, AlertTriangle, Zap } from "lucide-react";
import { SyncLog } from "../../types";

type SyncDetailModalProps = {
  isOpen: boolean;
  onClose: () => void;
  log: SyncLog | null;
  handleCancelSync: (logId: number) => void;
};

export default function SyncDetailModal({
  isOpen,
  onClose,
  log,
  handleCancelSync,
}: SyncDetailModalProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "success" | "skipped" | "failed">("all");

  if (!isOpen || !log) return null;

  const progressDetails = log.progress_details || {
    total_expected: 0,
    items: [],
    summary: { success: 0, skipped: 0, failed: 0 }
  };

  const { items = [], total_expected = 0, summary = { success: 0, skipped: 0, failed: 0 } } = progressDetails;

  const processedCount = summary.success + summary.skipped + summary.failed;
  const percentCompleted = total_expected > 0 ? Math.min(100, Math.round((processedCount / total_expected) * 100)) : 0;

  // Filter items
  const filteredItems = items.filter((item: any) => {
    const matchesSearch = (item.title || "").toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter =
      statusFilter === "all" ||
      (statusFilter === "success" && item.status === "success") ||
      (statusFilter === "skipped" && item.status === "skipped") ||
      (statusFilter === "failed" && item.status === "failed");
    return matchesSearch && matchesFilter;
  });

  // Calculate unique failure/skip reasons for the summary section
  const reasonStats: Record<string, { count: number; status: string }> = {};
  items.forEach((item: any) => {
    if (item.status !== "success" && item.reason) {
      if (!reasonStats[item.reason]) {
        reasonStats[item.reason] = { count: 0, status: item.status };
      }
      reasonStats[item.reason].count++;
    }
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-fade-in">
      <style>{`
        @keyframes energy-flow {
          0% { background-position: 0 0; }
          100% { background-position: 30px 0; }
        }
        .energy-shimmer-bg {
          background-image: linear-gradient(
            45deg,
            rgba(255, 255, 255, 0.2) 25%,
            transparent 25%,
            transparent 50%,
            rgba(255, 255, 255, 0.2) 50%,
            rgba(255, 255, 255, 0.2) 75%,
            transparent 75%,
            transparent
          );
          background-size: 30px 30px;
          animation: energy-flow 1.2s linear infinite;
        }
      `}</style>
      <div className="glass-panel w-full max-w-2xl bg-surface border border-white/10 rounded-2xl flex flex-col max-h-[85vh] shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/5">
          <div>
            <h3 className="font-display text-xl font-bold text-on-surface flex items-center gap-2">
              Tiến trình đồng bộ {log.api_source?.name || `Nguồn #${log.api_source_id}`}
            </h3>
            <p className="text-xs text-on-surface-variant mt-1">
              Bắt đầu lúc: {new Date(log.created_at).toLocaleString("vi-VN")}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-on-surface-variant hover:text-on-surface transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 custom-scrollbar">
          {/* Status Alert Banners */}
          {(log.status === "completed" || log.status === "success") && (
            <div className="p-4 rounded-xl bg-tertiary/10 border border-tertiary/20 text-tertiary flex items-start gap-3 animate-in fade-in slide-in-from-top-4 duration-300">
              <CheckCircle2 className="w-5 h-5 mt-0.5 flex-shrink-0" />
              <div>
                <h5 className="font-bold text-sm">Đồng bộ hoàn tất thành công!</h5>
                <p className="text-xs text-tertiary/80 mt-1 leading-relaxed">
                  Đã hoàn tất xử lý {total_expected} bài báo khoa học. Hệ thống đã thêm mới/cập nhật {summary.success} bài và bỏ qua {summary.skipped} bài trùng khớp dữ liệu.
                </p>
              </div>
            </div>
          )}

          {log.status === "failed" && (
            <div className="p-4 rounded-xl bg-error/10 border border-error/20 text-error flex items-start gap-3 animate-in fade-in slide-in-from-top-4 duration-300">
              <XCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
              <div>
                <h5 className="font-bold text-sm">Đồng bộ thất bại!</h5>
                <p className="text-xs text-error/80 mt-1 leading-relaxed">
                  Tiến trình đồng bộ đã dừng lại do lỗi: {log.error_message || "Lỗi không xác định."}
                </p>
              </div>
            </div>
          )}

          {log.status === "cancelled" && (
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-start gap-3 animate-in fade-in slide-in-from-top-4 duration-300">
              <StopCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
              <div>
                <h5 className="font-bold text-sm">Đồng bộ đã bị hủy!</h5>
                <p className="text-xs text-amber-500/80 mt-1 leading-relaxed">
                  Tiến trình đồng bộ đã bị dừng lại bởi quản trị viên.
                </p>
              </div>
            </div>
          )}

          {/* Status and Progress Bar */}
          <div className="space-y-3">
            <div className="flex justify-between items-center text-sm font-semibold">
              <span className="flex items-center gap-2">
                Trạng thái: 
                <span
                  className={`inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    log.status === "completed" || log.status === "success"
                      ? "bg-tertiary/15 text-tertiary"
                      : log.status === "failed"
                      ? "bg-error/15 text-error"
                      : log.status === "cancelled"
                      ? "bg-amber-500/15 text-amber-400"
                      : "bg-secondary/15 text-secondary animate-pulse"
                  }`}
                >
                  {log.status === "completed" || log.status === "success" ? (
                    "Thành công"
                  ) : log.status === "failed" ? (
                    "Lỗi"
                  ) : log.status === "cancelled" ? (
                    "Đã hủy"
                  ) : (
                    <span className="flex items-center gap-1">
                      <RefreshCw className="w-3 h-3 animate-spin" /> Đang chạy
                    </span>
                  )}
                </span>
              </span>
              <span className="text-on-surface-variant font-mono flex items-center gap-1.5">
                {log.status === "running" && (
                  <Zap className="w-3.5 h-3.5 text-emerald-400 fill-emerald-400/20 animate-pulse" />
                )}
                {processedCount} / {total_expected} bài báo ({percentCompleted}%)
              </span>
            </div>

            {/* Energy Charging Progress Bar Capsule */}
            <div className="relative w-full h-6 bg-white/5 border border-white/10 rounded-2xl p-[3px] flex items-center overflow-hidden shadow-inner">
              {/* Outer Energy Glow for running syncs */}
              {log.status === "running" && (
                <div className="absolute inset-0 bg-emerald-400/5 blur-sm rounded-2xl animate-pulse" />
              )}
              
              <div
                className={`h-full rounded-xl transition-all duration-500 ease-out relative overflow-hidden flex items-center ${
                  log.status === "failed" 
                    ? "bg-gradient-to-r from-red-600 via-rose-500 to-red-500 shadow-[0_0_12px_rgba(239,68,68,0.5)]" 
                    : log.status === "cancelled" 
                    ? "bg-gradient-to-r from-amber-600 via-yellow-500 to-amber-500 shadow-[0_0_12px_rgba(245,158,11,0.5)]" 
                    : "bg-gradient-to-r from-emerald-400 via-teal-500 to-cyan-400 shadow-[0_0_15px_rgba(52,211,153,0.6)]"
                }`}
                style={{ width: `${percentCompleted}%` }}
              >
                {/* 3D Glossy reflection line */}
                <div className="absolute inset-x-0 top-0 h-[30%] bg-white/20 rounded-t-xl" />

                {/* Shimmer animation stripes */}
                {log.status === "running" && (
                  <div className="absolute inset-0 energy-shimmer-bg opacity-25" />
                )}

                {/* Charging light tip (glow dot) at the leading edge */}
                {log.status === "running" && percentCompleted > 0 && (
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 mr-0.5 rounded-full bg-white shadow-[0_0_8px_#fff,0_0_15px_#10b981] flex items-center justify-center">
                    <span className="absolute w-full h-full rounded-full bg-emerald-400 animate-ping opacity-60" />
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-tertiary/5 border border-tertiary/10 text-center">
              <span className="block text-[10px] font-bold text-tertiary uppercase tracking-wider">Mới / Cập nhật</span>
              <span className="block text-2xl font-bold text-on-surface mt-1">{summary.success}</span>
            </div>
            <div className="p-4 rounded-xl bg-white/5 border border-white/5 text-center">
              <span className="block text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Trùng khớp</span>
              <span className="block text-2xl font-bold text-on-surface mt-1">{summary.skipped}</span>
            </div>
            <div className="p-4 rounded-xl bg-error/5 border border-error/10 text-center">
              <span className="block text-[10px] font-bold text-error uppercase tracking-wider">Thất bại</span>
              <span className="block text-2xl font-bold text-on-surface mt-1">{summary.failed}</span>
            </div>
          </div>

          {/* Filter & Search Bar */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="w-4 h-4 text-on-surface-variant absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Tìm kiếm bài báo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-white/5 border border-white/10 text-on-surface outline-none focus:border-primary/50"
              />
            </div>
            <div className="flex gap-1 bg-white/5 p-1 rounded-xl border border-white/5">
              {(["all", "success", "skipped", "failed"] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setStatusFilter(filter)}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all capitalize ${
                    statusFilter === filter
                      ? "bg-primary text-on-primary shadow-lg"
                      : "text-on-surface-variant hover:text-on-surface"
                  }`}
                >
                  {filter === "all" ? "Tất cả" : filter === "success" ? "Thành công" : filter === "skipped" ? "Trùng" : "Lỗi"}
                </button>
              ))}
            </div>
          </div>

          {/* Item Progress List */}
          <div className="space-y-2 max-h-[250px] overflow-y-auto pr-1 border border-white/5 bg-white/5 p-3 rounded-xl custom-scrollbar">
            {filteredItems.length === 0 ? (
              <div className="text-center text-xs text-on-surface-variant py-8">
                {items.length === 0 ? "Không có dữ liệu bài báo được xử lý." : "Không có bài báo nào khớp với bộ lọc."}
              </div>
            ) : (
              filteredItems.map((item: any, idx: number) => (
                <div key={idx} className="flex items-start gap-3 p-2.5 rounded-lg bg-surface border border-white/5 hover:border-white/10 transition-all">
                  <div className="mt-0.5">
                    {item.status === "success" ? (
                      <CheckCircle2 className="w-4 h-4 text-tertiary flex-shrink-0" />
                    ) : item.status === "skipped" ? (
                      <AlertCircle className="w-4 h-4 text-on-surface-variant flex-shrink-0" />
                    ) : item.status === "failed" ? (
                      <XCircle className="w-4 h-4 text-error flex-shrink-0" />
                    ) : (
                      <Loader2 className="w-4 h-4 text-secondary animate-spin flex-shrink-0" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-on-surface leading-normal truncate" title={item.title}>
                      {item.title}
                    </p>
                    {item.reason && (
                      <span className={`inline-block text-[9px] font-medium mt-1 ${
                        item.status === "success"
                          ? "text-tertiary"
                          : item.status === "skipped"
                          ? "text-on-surface-variant"
                          : "text-error"
                      }`}>
                        {item.reason}
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Summary of Issues Section */}
          {Object.keys(reasonStats).length > 0 && (
            <div className="space-y-2 border border-white/5 bg-white/5 p-4 rounded-xl">
              <h4 className="text-xs font-bold text-on-surface flex items-center gap-2 uppercase tracking-wider">
                <AlertTriangle className="w-4 h-4 text-amber-500" /> Thống kê lý do không đồng bộ được
              </h4>
              <div className="divide-y divide-white/5">
                {Object.entries(reasonStats).map(([reason, stat]) => (
                  <div key={reason} className="py-2.5 flex items-center justify-between text-xs">
                    <span className="text-on-surface-variant font-medium pr-4">{reason}</span>
                    <span className={`font-mono font-bold px-2 py-0.5 rounded text-[10px] ${
                      stat.status === "skipped" 
                        ? "bg-white/10 text-on-surface" 
                        : "bg-error/15 text-error"
                    }`}>
                      {stat.count} bài
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-white/5 flex gap-3 justify-end bg-white/5">
          {log.status === "running" && (
            <button
              onClick={() => handleCancelSync(log.id)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-error/15 text-error font-bold text-xs uppercase tracking-widest hover:bg-error/30 transition-all"
            >
              <StopCircle className="w-4 h-4" /> Hủy đồng bộ
            </button>
          )}
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-on-surface font-bold text-xs uppercase tracking-widest hover:bg-white/10 transition-all"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
