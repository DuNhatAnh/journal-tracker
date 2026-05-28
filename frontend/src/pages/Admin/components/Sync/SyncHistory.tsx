import React from "react";
import { Calendar, RotateCw, StopCircle, CheckCircle2, XCircle, Search } from "lucide-react";
import { SyncLog } from "../../types";

type SyncHistoryProps = {
  logs: SyncLog[];
  loadingLogs: boolean;
  logsPagination: { current: number; last: number; total?: number };
  loadLogs: (page: number) => void;
  handleCancelSync: (logId: number) => void;
  handleViewDetails: (log: SyncLog) => void;
};

export default function SyncHistory({
  logs,
  loadingLogs,
  logsPagination,
  loadLogs,
  handleCancelSync,
  handleViewDetails,
}: SyncHistoryProps) {
  return (
    <div className="glass-panel p-6 rounded-2xl bg-surface space-y-6 h-full flex flex-col">
      <div className="flex items-center justify-between">
        <h3 className="font-display font-bold text-lg flex items-center gap-2">
          <Calendar className="w-5 h-5 text-secondary" /> Lịch sử đồng bộ
          {logsPagination.total !== undefined && logsPagination.total > 0 && (
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-secondary/15 text-secondary">
              {logsPagination.total}
            </span>
          )}
        </h3>
        <button
          onClick={() => loadLogs(1)}
          disabled={loadingLogs}
          className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-on-surface-variant hover:text-on-surface transition-all disabled:opacity-40"
        >
          <RotateCw className={`w-4 h-4 ${loadingLogs ? "animate-spin" : ""}`} />
        </button>
      </div>

      {loadingLogs && logs.length === 0 ? (
        <div className="space-y-4 flex-1">
          <div className="h-14 rounded-xl bg-white/5 animate-pulse" />
          <div className="h-14 rounded-xl bg-white/5 animate-pulse" />
          <div className="h-14 rounded-xl bg-white/5 animate-pulse" />
        </div>
      ) : logs.length === 0 ? (
        <div className="text-center text-sm text-on-surface-variant py-10 flex-1">
          Chưa có dữ liệu đồng bộ nào.
        </div>
      ) : (
        <div className="space-y-4 flex-1 overflow-y-auto max-h-[550px] pr-2 custom-scrollbar">
          {logs.map((log) => (
            <div key={log.id} className="p-4 rounded-xl bg-white/5 border border-white/5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-on-surface">
                  {log.api_source?.name || `Nguồn #${log.api_source_id}`}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleViewDetails(log)}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-primary/10 text-primary hover:bg-primary/20 transition-all cursor-pointer"
                    title="Xem chi tiết tiến trình"
                  >
                    Xem tiến trình
                  </button>

                  {log.status === "running" && (
                    <button
                      onClick={() => handleCancelSync(log.id)}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-error/15 text-error hover:bg-error/30 transition-all cursor-pointer"
                      title="Hủy tiến trình"
                    >
                      <StopCircle className="w-3 h-3" /> Hủy
                    </button>
                  )}
                  
                  <span
                    className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
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
                      <span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Thành công</span>
                    ) : log.status === "failed" ? (
                      <span className="flex items-center gap-1"><XCircle className="w-3 h-3" /> Lỗi</span>
                    ) : log.status === "cancelled" ? (
                      <span className="flex items-center gap-1"><StopCircle className="w-3 h-3" /> Đã hủy</span>
                    ) : (
                      <span className="flex items-center gap-1"><RotateCw className="w-3 h-3 animate-spin" /> Đang chạy</span>
                    )}
                  </span>
                </div>
              </div>

              {(() => {
                const progressDetails = log.progress_details || {};
                const totalExpected = progressDetails.total_expected || 0;
                const summary = progressDetails.summary || { success: 0, skipped: 0, failed: 0 };
                const successCount = summary.success || 0;
                const skippedCount = summary.skipped || 0;
                const failedCount = summary.failed || 0;
                
                return (
                  <div className="flex justify-between items-center text-xs text-on-surface-variant font-medium">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span>Đồng bộ: {totalExpected || log.papers_synced} bài</span>
                      {totalExpected > 0 && (
                        <span className="text-[10px] text-on-surface-variant/80">
                          (
                          <span className="text-tertiary font-semibold">{successCount} thành công</span>
                          {skippedCount > 0 && <span className="text-on-surface-variant/70 font-semibold">, {skippedCount} trùng</span>}
                          {failedCount > 0 && <span className="text-error font-semibold">, {failedCount} lỗi</span>}
                          )
                        </span>
                      )}
                    </div>
                    <span className="flex-shrink-0">{new Date(log.created_at).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })} - {new Date(log.created_at).toLocaleDateString("vi-VN")}</span>
                  </div>
                );
              })()}

              {log.error_message && log.status !== "running" && (
                <p className="text-[10px] text-error bg-error-container/10 p-2 rounded border border-error/20 font-mono break-words mt-2">
                  {log.error_message}
                </p>
              )}
              {log.status === "running" && log.error_message && (
                <div className="flex items-center gap-2 mt-2 bg-secondary/10 p-2.5 rounded-lg border border-secondary/20">
                  <RotateCw className="w-3.5 h-3.5 text-secondary animate-spin flex-shrink-0" />
                  <p className="text-[11px] font-medium text-secondary truncate" title={log.error_message}>
                    {log.error_message}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {logsPagination.last > 1 && (
        <div className="flex items-center justify-between border-t border-white/5 pt-4">
          <button
            disabled={logsPagination.current <= 1 || loadingLogs}
            onClick={() => loadLogs(logsPagination.current - 1)}
            className="px-3 py-1.5 rounded-lg border border-white/10 text-[10px] font-bold uppercase tracking-widest hover:bg-white/5 disabled:opacity-40"
          >
            Trước
          </button>
          <span className="text-xs text-on-surface-variant font-semibold">
            Trang {logsPagination.current} / {logsPagination.last}
          </span>
          <button
            disabled={logsPagination.current >= logsPagination.last || loadingLogs}
            onClick={() => loadLogs(logsPagination.current + 1)}
            className="px-3 py-1.5 rounded-lg border border-white/10 text-[10px] font-bold uppercase tracking-widest hover:bg-white/5 disabled:opacity-40"
          >
            Sau
          </button>
        </div>
      )}
    </div>
  );
}
