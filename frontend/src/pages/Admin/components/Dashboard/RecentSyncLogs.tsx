import React from "react";
import { Link } from "react-router-dom";
import { Activity, ArrowRight, CheckCircle2, XCircle, StopCircle, RotateCw } from "lucide-react";
import { AdminStats } from "../../types";

type RecentSyncLogsProps = {
  stats: AdminStats | null;
  loading: boolean;
};

export default function RecentSyncLogs({ stats, loading }: RecentSyncLogsProps) {
  return (
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
            <div key={log.id} className="flex items-center justify-between p-3.5 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 transition-colors">
              <div className="flex items-center gap-3">
                {log.status === "completed" || log.status === "success" ? (
                  <CheckCircle2 className="w-4 h-4 text-tertiary shrink-0" />
                ) : log.status === "failed" ? (
                  <XCircle className="w-4 h-4 text-error shrink-0" />
                ) : log.status === "cancelled" ? (
                  <StopCircle className="w-4 h-4 text-amber-400 shrink-0" />
                ) : (
                  <RotateCw className="w-4 h-4 text-secondary shrink-0 animate-spin" />
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
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                log.status === "completed" || log.status === "success"
                  ? "bg-tertiary/15 text-tertiary"
                  : log.status === "failed"
                  ? "bg-error/15 text-error"
                  : log.status === "cancelled"
                  ? "bg-amber-500/15 text-amber-400"
                  : "bg-secondary/15 text-secondary animate-pulse"
              }`}>
                {log.status === "completed" || log.status === "success" ? (
                  <><CheckCircle2 className="w-3 h-3" /> Thành công</>
                ) : log.status === "failed" ? (
                  <><XCircle className="w-3 h-3" /> Lỗi</>
                ) : log.status === "cancelled" ? (
                  <><StopCircle className="w-3 h-3" /> Đã hủy</>
                ) : (
                  <><RotateCw className="w-3 h-3 animate-spin" /> Đang chạy</>
                )}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-on-surface-variant text-center py-6">Chưa có lịch sử đồng bộ.</p>
      )}
    </div>
  );
}
