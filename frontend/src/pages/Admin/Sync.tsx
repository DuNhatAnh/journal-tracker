import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { Settings, Play, CheckCircle2, XCircle, RotateCw, Calendar, Plus, Edit2, Trash2, X, Link as LinkIcon, ToggleLeft, ToggleRight, Lock, StopCircle } from "lucide-react";
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
  const [syncParams, setSyncParams] = useState<Record<number, { domain: string; field: string; pages: number; yearFrom: string; yearTo: string }>>({});

  // Modal State for CRUD API Sources
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<"add" | "edit">("add");
  const [selectedSource, setSelectedSource] = useState<ApiSource | null>(null);
  const [formData, setFormData] = useState({ name: "", api_url: "" });

  const currentUserStr = localStorage.getItem("user");
  const currentUser = currentUserStr ? JSON.parse(currentUserStr) : null;

  useEffect(() => {
    if (currentUser?.role === "admin") {
      loadSources();
      loadLogs(1);
    }
  }, []);

  // Auto-polling when there is a running sync task
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (logs.some((log) => log.status === "running")) {
      interval = setInterval(() => {
        loadLogs(logsPagination.current);
      }, 3000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [logs, logsPagination.current]);

  if (currentUser?.role !== "admin") {
    return <Navigate to="/dashboard" replace />;
  }

  const loadSources = async () => {
    setLoadingSources(true);
    try {
      const response = await api.get<ApiSource[]>("/admin/api-sources");
      setSources(response || []);
      
      // Initialize sync params for each source
      const params: Record<number, { domain: string; field: string; pages: number; yearFrom: string; yearTo: string }> = {};
      (response || []).forEach((src) => {
        params[src.id] = { domain: "Computer Science", field: "", pages: 50, yearFrom: "2023", yearTo: "2026" };
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

  const handleOpenAddModal = () => {
    setModalType("add");
    setSelectedSource(null);
    setFormData({ name: "", api_url: "" });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (source: ApiSource) => {
    setModalType("edit");
    setSelectedSource(source);
    setFormData({ name: source.name, api_url: source.api_url });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleSubmitSource = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionError(null);
    setActionSuccess(null);

    try {
      if (modalType === "add") {
        await api.post("/admin/api-sources", { ...formData, is_active: true });
        setActionSuccess("Đã thêm nguồn dữ liệu API mới thành công.");
      } else if (modalType === "edit" && selectedSource) {
        await api.put(`/admin/api-sources/${selectedSource.id}`, formData);
        setActionSuccess("Đã cập nhật nguồn dữ liệu API thành công.");
      }
      setIsModalOpen(false);
      await loadSources();
    } catch (err: any) {
      setActionError(err.message || "Lỗi khi lưu thông tin nguồn API.");
    }
  };

  const handleDeleteSource = async (id: number, name: string) => {
    if (!window.confirm(`Bạn có chắc muốn xóa nguồn API ${name}? Toàn bộ lịch sử đồng bộ của nguồn này cũng có thể bị ảnh hưởng.`)) {
      return;
    }
    setActionError(null);
    try {
      await api.delete(`/admin/api-sources/${id}`);
      setActionSuccess(`Đã xóa nguồn API ${name}.`);
      await loadSources();
    } catch (err: any) {
      setActionError(err.message || "Lỗi khi xóa nguồn API.");
    }
  };

  const handleTriggerSync = async (sourceId: number, sourceName: string) => {
    setActionError(null);
    setActionSuccess(null);
    const params = syncParams[sourceId] || { domain: "Computer Science", field: "", pages: 50, yearFrom: "2023", yearTo: "2026" };
    const combinedQuery = params.domain ? `${params.domain} ${params.field}`.trim() : params.field;
    
    // Validate years
    if (parseInt(params.yearFrom) > parseInt(params.yearTo)) {
      setActionError("Năm bắt đầu không được lớn hơn năm kết thúc.");
      return;
    }

    try {
      const response = await api.post<{ message: string }>(`/admin/api-sources/${sourceId}/sync`, {
        field: combinedQuery,
        pages: params.pages,
        years: `${params.yearFrom}-${params.yearTo}`,
      });
      setActionSuccess(response.message || `Đã gửi yêu cầu đồng bộ nguồn ${sourceName}.`);
      // Refresh logs after brief delay
      setTimeout(() => loadLogs(1), 1000);
    } catch (err: any) {
      setActionError(err.message || "Lỗi khi kích hoạt đồng bộ.");
    }
  };

  const handleCancelSync = async (logId: number) => {
    if (!window.confirm("Bạn có chắc muốn hủy tiến trình đồng bộ đang chạy?")) return;
    setActionError(null);
    try {
      const response = await api.post<{ message: string }>(`/admin/sync-logs/${logId}/cancel`);
      setActionSuccess(response.message || "Đã hủy tiến trình đồng bộ.");
      setTimeout(() => loadLogs(logsPagination.current), 500);
    } catch (err: any) {
      setActionError(err.message || "Lỗi khi hủy tiến trình.");
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pb-20 max-w-6xl mx-auto">
      {/* Left panel: Sources and triggers */}
      <div className="lg:col-span-7 space-y-8">
        <header className="flex justify-between items-end border-b border-white/5 pb-6">
          <div>
            <h2 className="font-display text-4xl font-bold text-on-surface">Cấu hình đồng bộ</h2>
            <p className="text-on-surface-variant mt-2 font-medium">
              Quản lý các nguồn dữ liệu học thuật quốc tế và kích hoạt đồng bộ hóa dữ liệu.
            </p>
          </div>
          <button
            onClick={handleOpenAddModal}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary/20 text-primary font-bold text-xs uppercase tracking-widest hover:bg-primary/30 transition-all"
          >
            <Plus className="w-4 h-4" /> Thêm nguồn
          </button>
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
                const params = syncParams[source.id] || { domain: "Computer Science", field: "", pages: 50, yearFrom: "2023", yearTo: "2026" };
                return (
                  <div key={source.id} className="glass-panel p-6 rounded-2xl bg-surface space-y-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-display text-lg font-bold text-on-surface flex items-center gap-2">
                          {source.name}
                          <span className="inline-block w-2.5 h-2.5 rounded-full bg-tertiary" />
                        </h4>
                        <span className="font-mono text-xs text-on-surface-variant break-all">{source.api_url}</span>
                        
                        <div className="flex gap-2 mt-3">
                          <button
                            onClick={() => handleOpenEditModal(source)}
                            className="p-1.5 rounded-md text-on-surface-variant hover:text-primary hover:bg-primary/10 transition-colors"
                            title="Chỉnh sửa nguồn"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteSource(source.id, source.name)}
                            className="p-1.5 rounded-md text-on-surface-variant hover:text-error hover:bg-error/10 transition-colors"
                            title="Xóa nguồn"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                      
                      {/* Active badge - display only, no toggle */}
                      <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold uppercase bg-tertiary/10 text-tertiary">
                        <span className="inline-block w-1.5 h-1.5 rounded-full bg-tertiary animate-pulse" />
                        Đang hoạt động
                      </span>
                    </div>

                    {(
                      <div className="border-t border-white/5 pt-4 space-y-4">
                        <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Đồng bộ thủ công</p>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Lĩnh vực (Domain)</label>
                            <input
                              type="text"
                              value={params.domain}
                              disabled
                              title="Nguyên tắc hệ thống mới: Cập nhật mặc định Khóa luôn ở Khoa học máy tính"
                              className="w-full px-3 py-2 text-xs rounded-lg bg-surface-container border border-white/10 text-on-surface-variant cursor-not-allowed outline-none"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Từ khóa</label>
                            <input
                              type="text"
                              value={params.field}
                              onChange={(e) => handleParamChange(source.id, "field", e.target.value)}
                              className="w-full px-3 py-2 text-xs rounded-lg bg-white/5 border border-white/10 text-on-surface outline-none focus:border-primary/50"
                              placeholder="deep learning"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Khoảng năm xuất bản</label>
                            <div className="flex items-center gap-2">
                              <select
                                value={params.yearFrom}
                                onChange={(e) => handleParamChange(source.id, "yearFrom", e.target.value)}
                                className="flex-1 px-3 py-[9px] text-xs rounded-lg bg-white/5 border border-white/10 text-on-surface outline-none focus:border-primary/50 cursor-pointer"
                              >
                                {Array.from({ length: 15 }).map((_, i) => {
                                  const y = 2026 - i;
                                  return <option key={y} value={y} className="bg-surface text-on-surface">{y}</option>;
                                })}
                              </select>
                              <span className="text-on-surface-variant text-[10px] font-bold uppercase">đến</span>
                              <select
                                value={params.yearTo}
                                onChange={(e) => handleParamChange(source.id, "yearTo", e.target.value)}
                                className="flex-1 px-3 py-[9px] text-xs rounded-lg bg-white/5 border border-white/10 text-on-surface outline-none focus:border-primary/50 cursor-pointer"
                              >
                                {Array.from({ length: 15 }).map((_, i) => {
                                  const y = 2026 - i;
                                  return <option key={y} value={y} className="bg-surface text-on-surface">{y}</option>;
                                })}
                              </select>
                            </div>
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Số lượng bài</label>
                            <select
                              value={params.pages}
                              onChange={(e) => handleParamChange(source.id, "pages", parseInt(e.target.value) || 50)}
                              className="w-full px-3 py-[9px] text-xs rounded-lg bg-white/5 border border-white/10 text-on-surface outline-none focus:border-primary/50 cursor-pointer"
                            >
                              <option value="50" className="bg-surface text-on-surface">50 bài</option>
                              <option value="100" className="bg-surface text-on-surface">100 bài</option>
                              <option value="150" className="bg-surface text-on-surface">150 bài</option>
                              <option value="200" className="bg-surface text-on-surface">200 bài</option>
                              <option value="300" className="bg-surface text-on-surface">300 bài</option>
                              <option value="500" className="bg-surface text-on-surface">500 bài</option>
                              <option value="1000" className="bg-surface text-on-surface">1000 bài</option>
                            </select>
                          </div>
                        </div>

                        <button
                          onClick={() => handleTriggerSync(source.id, source.name)}
                          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary text-on-primary font-bold text-xs uppercase tracking-widest hover:bg-primary-container transition-all"
                        >
                          <Play className="w-4 h-4" /> Thực hiện đồng bộ ngay
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
                    <div className="flex items-center gap-2">
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

                  <div className="flex justify-between items-center text-xs text-on-surface-variant font-medium">
                    <span>Đồng bộ: {log.papers_synced} bài báo</span>
                    <span>{new Date(log.created_at).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })} - {new Date(log.created_at).toLocaleDateString("vi-VN")}</span>
                  </div>

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
      </div>
      {/* Add/Edit API Source Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-background/80 backdrop-blur-md" onClick={handleCloseModal} />

          <div className="glass-panel-intense rounded-3xl p-8 max-w-md w-full relative z-10 space-y-6 shadow-2xl animate-in fade-in-50 zoom-in-95">
            <header className="flex justify-between items-center">
              <h3 className="font-display text-2xl font-bold">
                {modalType === "add" ? "Thêm nguồn API mới" : "Chỉnh sửa nguồn API"}
              </h3>
              <button onClick={handleCloseModal} className="p-1.5 rounded-full hover:bg-white/5 transition-all text-on-surface-variant hover:text-on-surface">
                <X className="w-5 h-5" />
              </button>
            </header>

            <form onSubmit={handleSubmitSource} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Tên nguồn cung cấp</label>
                <div className="relative">
                  <Settings className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant" />
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full pl-11 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-on-surface placeholder:text-on-surface-variant focus:border-primary/50 transition-all outline-none"
                    placeholder="VD: OpenAlex"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">URL Endpoint</label>
                <div className="relative">
                  <LinkIcon className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant" />
                  <input
                    type="url"
                    required
                    value={formData.api_url}
                    onChange={(e) => setFormData({ ...formData, api_url: e.target.value })}
                    className="w-full pl-11 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-on-surface placeholder:text-on-surface-variant focus:border-primary/50 transition-all outline-none"
                    placeholder="https://api.example.com/v1"
                  />
                </div>
                <p className="text-[10px] text-on-surface-variant px-1 mt-1">Đảm bảo URL trả về đúng cấu trúc chuẩn của hệ thống đồng bộ.</p>
              </div>

              <div className="pt-4 flex gap-4">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 py-3.5 rounded-xl border border-white/10 text-on-surface font-bold text-xs uppercase tracking-widest hover:bg-white/5 transition-all"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3.5 rounded-xl bg-primary text-on-primary font-bold text-xs uppercase tracking-widest hover:bg-primary-container transition-all"
                >
                  {modalType === "add" ? "Thêm nguồn" : "Lưu thay đổi"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
