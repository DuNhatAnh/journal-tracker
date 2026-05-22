import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { Settings, Play, CheckCircle2, XCircle, RotateCw, HelpCircle, Eye, Power, ToggleLeft, ToggleRight, Calendar } from "lucide-react";
import { api } from "@/src/lib/api";

type ApiSource = {
  id: number;
  name: string;
  api_url: string;
  is_active: boolean;
  config?: Record<string, any> | null;
  updated_at: string;
};

type SyncLog = {
  id: number;
  api_source_id: number;
  status: string;
  papers_synced: number;
  error_message: string | null;
  created_at: string;
  api_source?: ApiSource;
};

type PaginatedLogs = {
  data: SyncLog[];
  current_page: number;
  last_page: number;
  total: number;
};

export default function AdminSync() {
  const [sources, setSources] = useState<ApiSource[]>([]);
  const [logs, setLogs] = useState<SyncLog[]>([]);
  const [logsPagination, setLogsPagination] = useState({ current: 1, last: 1 });
  const [loadingSources, setLoadingSources] = useState(true);
  const [loadingLogs, setLoadingLogs] = useState(true);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Sync Form State
  const [syncParams, setSyncParams] = useState<Record<number, { field: string; pages: number }>>({});

  const currentUserStr = localStorage.getItem("user");
  const currentUser = currentUserStr ? JSON.parse(currentUserStr) : null;

  useEffect(() => {
    if (currentUser?.role === "admin") {
      loadSources();
      loadLogs(1);
    }
  }, []);

  if (currentUser?.role !== "admin") {
    return <Navigate to="/dashboard" replace />;
  }

  const loadSources = async () => {
    setLoadingSources(true);
    try {
      const response = await api.get<ApiSource[]>("/admin/api-sources");
      setSources(response || []);
      
      // Initialize sync params for each source
      const params: Record<number, { field: string; pages: number }> = {};
      (response || []).forEach((src) => {
        params[src.id] = { field: "deep learning", pages: 1 };
      });
      setSyncParams(params);
    } catch (err: any) {
      setActionError(err.message || "Không thể tải danh sách nguồn API.");
    } finally {
      setLoadingSources(false);
    }
  };

  const loadLogs = async (page: number = 1) => {
    setLoadingLogs(true);
    try {
      const response = await api.get<PaginatedLogs>(`/admin/sync-logs?page=${page}`);
      if (response && response.data) {
        setLogs(response.data);
        setLogsPagination({
          current: response.current_page,
          last: response.last_page,
        });
      }
    } catch (err: any) {
      // Quietly ignore or set log error
    } finally {
      setLoadingLogs(false);
    }
  };

  const handleToggleActive = async (source: ApiSource) => {
    setActionError(null);
    setActionSuccess(null);
    try {
      const updated = await api.put<ApiSource>(`/admin/api-sources/${source.id}`, {
        is_active: !source.is_active,
      });
      setActionSuccess(`Đã ${!source.is_active ? "kích hoạt" : "vô hiệu hóa"} nguồn ${source.name}.`);
      await loadSources();
    } catch (err: any) {
      setActionError(err.message || "Không thể cập nhật trạng thái nguồn API.");
    }
  };

  const handleParamChange = (sourceId: number, field: string, value: any) => {
    setSyncParams((prev) => ({
      ...prev,
      [sourceId]: {
        ...prev[sourceId],
        [field]: value,
      },
    }));
  };

  const handleTriggerSync = async (sourceId: number, sourceName: string) => {
    setActionError(null);
    setActionSuccess(null);
    const params = syncParams[sourceId] || { field: "deep learning", pages: 1 };

    try {
      const response = await api.post<{ message: string }>(`/admin/api-sources/${sourceId}/sync`, {
        field: params.field,
        pages: params.pages,
      });
      setActionSuccess(response.message || `Đã gửi yêu cầu đồng bộ nguồn ${sourceName}.`);
      // Refresh logs after brief delay
      setTimeout(() => loadLogs(1), 1000);
    } catch (err: any) {
      setActionError(err.message || "Lỗi khi kích hoạt đồng bộ.");
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pb-20 max-w-6xl mx-auto">
      {/* Left panel: Sources and triggers */}
      <div className="lg:col-span-7 space-y-8">
        <header className="border-b border-white/5 pb-6">
          <h2 className="font-display text-4xl font-bold text-on-surface">Cấu hình đồng bộ</h2>
          <p className="text-on-surface-variant mt-2 font-medium">
            Quản lý các nguồn dữ liệu học thuật quốc tế và kích hoạt đồng bộ hóa dữ liệu.
          </p>
        </header>

        {actionError && (
          <div className="p-4 rounded-xl bg-error-container/20 border border-error/40 text-error text-sm font-medium">
            {actionError}
          </div>
        )}

        {actionSuccess && (
          <div className="p-4 rounded-xl bg-tertiary-container/20 border border-tertiary/40 text-tertiary text-sm font-medium">
            {actionSuccess}
          </div>
        )}

        <div className="space-y-6">
          <h3 className="font-display text-xl font-bold flex items-center gap-3">
            <Settings className="w-5 h-5 text-primary" /> Nguồn dữ liệu kết nối
          </h3>

          {loadingSources ? (
            <div className="h-40 rounded-2xl bg-white/5 animate-pulse" />
          ) : sources.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-surface p-8 text-center text-on-surface-variant">
              Không có nguồn dữ liệu nào được đăng ký.
            </div>
          ) : (
            <div className="space-y-6">
              {sources.map((source) => {
                const params = syncParams[source.id] || { field: "deep learning", pages: 1 };
                return (
                  <div key={source.id} className="glass-panel p-6 rounded-2xl bg-surface space-y-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-display text-lg font-bold text-on-surface flex items-center gap-2">
                          {source.name}
                          <span className={`inline-block w-2.5 h-2.5 rounded-full ${source.is_active ? "bg-tertiary" : "bg-on-surface-variant/30"}`} />
                        </h4>
                        <span className="font-mono text-xs text-on-surface-variant">{source.api_url}</span>
                      </div>
                      
                      <button
                        onClick={() => handleToggleActive(source)}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition-all ${
                          source.is_active 
                            ? "bg-tertiary/10 text-tertiary hover:bg-tertiary/20" 
                            : "bg-on-surface-variant/10 text-on-surface-variant hover:bg-on-surface-variant/20"
                        }`}
                      >
                        {source.is_active ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
                        {source.is_active ? "Bật" : "Tắt"}
                      </button>
                    </div>

                    {source.is_active && (
                      <div className="border-t border-white/5 pt-4 space-y-4">
                        <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Đồng bộ thủ công</p>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Từ khóa tìm kiếm</label>
                            <input
                              type="text"
                              value={params.field}
                              onChange={(e) => handleParamChange(source.id, "field", e.target.value)}
                              className="w-full px-3 py-2 text-xs rounded-lg bg-white/5 border border-white/10 text-on-surface outline-none focus:border-primary/50"
                              placeholder="deep learning"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Số trang đồng bộ</label>
                            <input
                              type="number"
                              min="1"
                              max="10"
                              value={params.pages}
                              onChange={(e) => handleParamChange(source.id, "pages", parseInt(e.target.value) || 1)}
                              className="w-full px-3 py-2 text-xs rounded-lg bg-white/5 border border-white/10 text-on-surface outline-none focus:border-primary/50"
                            />
                          </div>
                        </div>

                        <button
                          onClick={() => handleTriggerSync(source.id, source.name)}
                          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary text-on-primary font-bold text-xs uppercase tracking-widest hover:bg-primary-container transition-all"
                        >
                          <Play className="w-4 h-4" /> Bắt đầu đồng bộ ngầm
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Right panel: History logs */}
      <div className="lg:col-span-5 space-y-6">
        <div className="glass-panel p-6 rounded-2xl bg-surface space-y-6 h-full flex flex-col">
          <div className="flex items-center justify-between">
            <h3 className="font-display font-bold text-lg flex items-center gap-2">
              <Calendar className="w-5 h-5 text-secondary" /> Lịch sử đồng bộ
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
            <div className="space-y-4 flex-1 overflow-y-auto max-h-[550px] pr-2">
              {logs.map((log) => (
                <div key={log.id} className="p-4 rounded-xl bg-white/5 border border-white/5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-on-surface">
                      {log.api_source?.name || `Nguồn #${log.api_source_id}`}
                    </span>
                    <span
                      className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                        log.status === "completed" || log.status === "success"
                          ? "bg-tertiary/15 text-tertiary"
                          : log.status === "failed"
                          ? "bg-error/15 text-error"
                          : "bg-secondary/15 text-secondary animate-pulse"
                      }`}
                    >
                      {log.status === "completed" || log.status === "success" ? (
                        <span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Thành công</span>
                      ) : log.status === "failed" ? (
                        <span className="flex items-center gap-1"><XCircle className="w-3 h-3" /> Lỗi</span>
                      ) : (
                        <span className="flex items-center gap-1"><RotateCw className="w-3 h-3 animate-spin" /> Đang chạy</span>
                      )}
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-xs text-on-surface-variant font-medium">
                    <span>Đồng bộ: {log.papers_synced} bài báo</span>
                    <span>{new Date(log.created_at).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })} - {new Date(log.created_at).toLocaleDateString("vi-VN")}</span>
                  </div>

                  {log.error_message && (
                    <p className="text-[10px] text-error bg-error-container/10 p-2 rounded border border-error/20 font-mono break-words">
                      {log.error_message}
                    </p>
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
      </div>
    </div>
  );
}
