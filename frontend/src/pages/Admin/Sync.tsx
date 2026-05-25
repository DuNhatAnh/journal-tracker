import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { Plus } from "lucide-react";
import { api } from "@/src/lib/api";
import { ApiSource, SyncLog, PaginatedLogs } from "./types";
import ApiSourcesList from "./components/Sync/ApiSourcesList";
import SyncHistory from "./components/Sync/SyncHistory";
import SourceModal from "./components/Sync/SourceModal";

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

        <ApiSourcesList 
          sources={sources}
          loadingSources={loadingSources}
          syncParams={syncParams}
          handleParamChange={handleParamChange}
          handleOpenEditModal={handleOpenEditModal}
          handleDeleteSource={handleDeleteSource}
          handleTriggerSync={handleTriggerSync}
        />
      </div>

      {/* Right panel: History logs */}
      <div className="lg:col-span-5 space-y-6">
        <SyncHistory 
          logs={logs}
          loadingLogs={loadingLogs}
          logsPagination={logsPagination}
          loadLogs={loadLogs}
          handleCancelSync={handleCancelSync}
        />
      </div>
      
      {/* Add/Edit API Source Modal */}
      <SourceModal 
        isModalOpen={isModalOpen}
        modalType={modalType}
        formData={formData}
        setFormData={setFormData}
        handleCloseModal={handleCloseModal}
        handleSubmitSource={handleSubmitSource}
      />
    </div>
  );
}
