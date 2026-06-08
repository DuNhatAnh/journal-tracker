import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { Search, Tag, RefreshCw, Trash2, Edit2, Merge, ChevronLeft, ChevronRight, RotateCcw } from "lucide-react";
import { api } from "@/src/lib/api";
import { KeywordItem, PaginatedKeywords } from "./types";
import KeywordModal from "./components/Keywords/KeywordModal";
import MergeKeywordsModal from "./components/Keywords/MergeKeywordsModal";
import toast from "react-hot-toast";

export default function AdminKeywords() {
  const [keywords, setKeywords] = useState<KeywordItem[]>([]);
  const [pagination, setPagination] = useState({ current: 1, last: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [sortBy, setSortBy] = useState("papers_count_desc");
  const [statusFilter, setStatusFilter] = useState("active");

  // Modals state
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedKeyword, setSelectedKeyword] = useState<KeywordItem | null>(null);

  const [isMergeOpen, setIsMergeOpen] = useState(false);
  const [mergeTargetKeyword, setMergeTargetKeyword] = useState<KeywordItem | null>(null);

  const currentUserStr = localStorage.getItem("user");
  const currentUser = currentUserStr ? JSON.parse(currentUserStr) : null;

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    if (currentUser?.role === "admin") {
      loadKeywords(1);
    }
  }, [debouncedSearch, sortBy, statusFilter]);

  if (currentUser?.role !== "admin") {
    return <Navigate to="/dashboard" replace />;
  }

  const loadKeywords = async (page: number = 1) => {
    setLoading(true);
    try {
      const response = await api.get<PaginatedKeywords>(
        `/admin/keywords?page=${page}&q=${encodeURIComponent(debouncedSearch)}&sort_by=${sortBy}&per_page=15&status=${statusFilter}`
      );
      if (response) {
        setKeywords(response.data || []);
        setPagination({
          current: response.current_page,
          last: response.last_page,
          total: response.total || 0,
        });
      }
    } catch (err: any) {
      toast.error(err.message || "Lỗi tải danh sách từ khóa.");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenEdit = (keyword: KeywordItem) => {
    setSelectedKeyword(keyword);
    setIsEditOpen(true);
  };

  const handleUpdateKeyword = async (newName: string) => {
    if (!selectedKeyword) return;
    try {
      await api.put(`/admin/keywords/${selectedKeyword.id}`, { name: newName });
      toast.success("Cập nhật từ khóa thành công!");
      loadKeywords(pagination.current);
    } catch (err: any) {
      toast.error(err.message || "Cập nhật thất bại.");
      throw err;
    }
  };

  const handleDeleteKeyword = async (id: number, name: string) => {
    if (
      !window.confirm(
        `Bạn có chắc chắn muốn xóa từ khóa "${name}"? Từ khóa sẽ được đưa vào thùng rác.`
      )
    ) {
      return;
    }

    try {
      await api.delete(`/admin/keywords/${id}`);
      toast.success(`Đã xóa từ khóa "${name}"!`);
      // Reload on previous page if current page becomes empty
      const isLastItemOnPage = keywords.length === 1 && pagination.current > 1;
      loadKeywords(isLastItemOnPage ? pagination.current - 1 : pagination.current);
    } catch (err: any) {
      toast.error(err.message || "Xóa từ khóa thất bại.");
    }
  };

  const handleRestoreKeyword = async (id: number, name: string) => {
    try {
      await api.post(`/admin/keywords/${id}/restore`);
      toast.success(`Đã khôi phục từ khóa "${name}"!`);
      const isLastItemOnPage = keywords.length === 1 && pagination.current > 1;
      loadKeywords(isLastItemOnPage ? pagination.current - 1 : pagination.current);
    } catch (err: any) {
      toast.error(err.message || "Khôi phục thất bại.");
    }
  };

  const handleForceDeleteKeyword = async (id: number, name: string) => {
    if (
      !window.confirm(
        `CẢNH BÁO MẤT DỮ LIỆU!\nBạn có chắc chắn muốn xóa VĨNH VIỄN từ khóa "${name}"? Hành động này sẽ xóa toàn bộ liên kết với bài viết và không thể khôi phục.`
      )
    ) {
      return;
    }

    try {
      await api.delete(`/admin/keywords/${id}/force`);
      toast.success(`Đã xóa vĩnh viễn từ khóa "${name}"!`);
      const isLastItemOnPage = keywords.length === 1 && pagination.current > 1;
      loadKeywords(isLastItemOnPage ? pagination.current - 1 : pagination.current);
    } catch (err: any) {
      toast.error(err.message || "Xóa vĩnh viễn thất bại.");
    }
  };

  const handleRecalculateTrends = async (id: number, name: string) => {
    const loadingToast = toast.loading(`Đang tính toán lại xu hướng cho "${name}"...`);
    try {
      await api.post(`/admin/keywords/${id}/recalculate-trends`);
      toast.success(`Cập nhật dữ liệu xu hướng cho "${name}" thành công!`, { id: loadingToast });
    } catch (err: any) {
      toast.error(err.message || "Lỗi xử lý.", { id: loadingToast });
    }
  };

  const handleOpenMerge = (keyword?: KeywordItem) => {
    if (keyword) {
      setMergeTargetKeyword(keyword);
    } else {
      setMergeTargetKeyword(null);
    }
    setIsMergeOpen(true);
  };

  const handleMerged = () => {
    toast.success("Gộp các từ khóa thành công!");
    loadKeywords(1);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20">
      {/* Header */}
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-end border-b border-white/5 pb-6 gap-4">
        <div>
          <h2 className="font-display text-4xl font-bold text-on-surface">Quản lý từ khóa</h2>
          <p className="text-on-surface-variant mt-2 font-medium">
            Quản trị từ khóa khoa học, gộp các từ khóa trùng lặp ngữ nghĩa hoặc dọn dẹp từ khóa rác.
          </p>
        </div>
        <button
          onClick={() => handleOpenMerge()}
          className="flex items-center gap-2 px-5 py-3 rounded-xl bg-primary text-on-primary font-bold text-xs uppercase tracking-widest hover:bg-primary-container hover:shadow-lg hover:shadow-primary/30 transition-all active:scale-95"
        >
          <Merge className="w-4 h-4" /> Gộp từ khóa
        </button>
      </header>

      {/* Mini Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="glass-panel p-6 bg-surface border border-white/10 rounded-2xl flex items-center gap-4">
          <div className="p-3 rounded-xl bg-primary/10 text-primary">
            <Tag className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-on-surface-variant font-bold uppercase tracking-wider">
              Tổng số từ khóa
            </p>
            <h3 className="text-2xl font-bold text-on-surface mt-1">
              {loading && pagination.total === 0 ? "..." : pagination.total.toLocaleString("vi-VN")}
            </h3>
          </div>
        </div>
      </div>

      {/* Tool bar: Filter, Search & Sort */}
      <div className="flex flex-col md:flex-row gap-4">
        {/* Status Filter Tabs */}
        <div className="flex p-1 rounded-xl bg-surface border border-white/10 w-full md:w-auto">
          <button
            onClick={() => { setStatusFilter("active"); setPagination(p => ({...p, current: 1})); }}
            className={`flex-1 px-4 py-2 text-sm font-bold rounded-lg transition-all ${
              statusFilter === "active"
                ? "bg-primary/20 text-primary"
                : "text-on-surface-variant hover:text-on-surface hover:bg-white/5"
            }`}
          >
            Đang hoạt động
          </button>
          <button
            onClick={() => { setStatusFilter("trashed"); setPagination(p => ({...p, current: 1})); }}
            className={`flex-1 px-4 py-2 text-sm font-bold rounded-lg transition-all ${
              statusFilter === "trashed"
                ? "bg-error/20 text-error"
                : "text-on-surface-variant hover:text-on-surface hover:bg-white/5"
            }`}
          >
            Thùng rác
          </button>
        </div>

        <div className="flex-1 relative">
          <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant" />
          <input
            type="text"
            placeholder="Tìm theo tên từ khóa hoặc slug..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 rounded-xl bg-surface border border-white/10 text-on-surface placeholder:text-on-surface-variant focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all outline-none"
          />
        </div>

        <div className="w-full md:w-64">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-surface border border-white/10 text-on-surface focus:border-primary/50 transition-all outline-none"
          >
            <option value="papers_count_desc">Số bài viết nhiều nhất</option>
            <option value="papers_count_asc">Số bài viết ít nhất</option>
            <option value="name_asc">Tên từ khóa (A - Z)</option>
            <option value="name_desc">Tên từ khóa (Z - A)</option>
            <option value="created_at_desc">Mới được thêm</option>
            <option value="created_at_asc">Cũ nhất</option>
          </select>
        </div>
      </div>

      {/* Table view */}
      {loading && keywords.length === 0 ? (
        <div className="space-y-4">
          <div className="h-16 rounded-xl bg-white/5 animate-pulse" />
          <div className="h-16 rounded-xl bg-white/5 animate-pulse" />
          <div className="h-16 rounded-xl bg-white/5 animate-pulse" />
        </div>
      ) : keywords.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-surface p-12 text-center text-on-surface-variant">
          <p className="text-lg font-semibold text-on-surface">Không tìm thấy từ khóa nào.</p>
          <p className="mt-2 text-sm">Hãy thử thay đổi từ khóa tìm kiếm hoặc bộ lọc.</p>
        </div>
      ) : (
        <div className="glass-panel rounded-2xl overflow-hidden shadow-lg border border-white/10 bg-surface">
          <div className="px-6 py-3 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
            <span className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">
              Hiển thị {keywords.length} từ khóa (Trang {pagination.current} / {pagination.last})
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/5 bg-white/[0.02] text-xs font-bold uppercase tracking-widest text-on-surface-variant">
                  <th className="px-6 py-4">Từ khóa</th>
                  <th className="px-6 py-4">Slug</th>
                  <th className="px-6 py-4 text-center">Số bài viết</th>
                  <th className="px-6 py-4">Ngày tạo</th>
                  <th className="px-6 py-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-sm">
                {keywords.map((kw) => (
                  <tr key={kw.id} className="hover:bg-white/[0.01] transition-all">
                    <td className="px-6 py-4 font-bold text-on-surface">{kw.name}</td>
                    <td className="px-6 py-4 text-on-surface-variant font-mono text-xs">{kw.slug}</td>
                    <td className="px-6 py-4 text-center">
                      <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-bold bg-primary/10 text-primary border border-primary/20">
                        {kw.papers_count} bài
                      </span>
                    </td>
                    <td className="px-6 py-4 text-on-surface-variant">
                      {new Date(kw.created_at).toLocaleDateString("vi-VN")}
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      {statusFilter === "trashed" ? (
                        <>
                          <button
                            onClick={() => handleRestoreKeyword(kw.id, kw.name)}
                            className="p-2 rounded-lg bg-success/10 text-success hover:bg-success/20 transition-all inline-flex"
                            title="Khôi phục từ khóa"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleForceDeleteKeyword(kw.id, kw.name)}
                            className="p-2 rounded-lg bg-error/10 text-error hover:bg-error/20 transition-all inline-flex"
                            title="Xóa vĩnh viễn"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => handleOpenEdit(kw)}
                            className="p-2 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-all inline-flex"
                            title="Chỉnh sửa từ khóa"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleOpenMerge(kw)}
                            className="p-2 rounded-lg bg-secondary/10 text-secondary hover:bg-secondary/20 transition-all inline-flex"
                            title="Dùng làm từ khóa đích để gộp"
                          >
                            <Merge className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleRecalculateTrends(kw.id, kw.name)}
                            className="p-2 rounded-lg bg-tertiary/10 text-tertiary hover:bg-tertiary/20 transition-all inline-flex"
                            title="Tính toán lại xu hướng"
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteKeyword(kw.id, kw.name)}
                            className="p-2 rounded-lg bg-error/10 text-error hover:bg-error/20 transition-all inline-flex"
                            title="Chuyển vào thùng rác"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination controls */}
          {pagination.last > 1 && (
            <div className="px-6 py-4 border-t border-white/5 bg-white/[0.01] flex items-center justify-between gap-4">
              <span className="text-xs text-on-surface-variant font-medium">
                Tổng cộng {pagination.total.toLocaleString("vi-VN")} từ khóa
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => loadKeywords(pagination.current - 1)}
                  disabled={pagination.current === 1 || loading}
                  className="p-2 rounded-lg bg-white/5 border border-white/5 hover:bg-white/10 text-on-surface disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-xs font-bold text-on-surface px-3">
                  Trang {pagination.current} / {pagination.last}
                </span>
                <button
                  onClick={() => loadKeywords(pagination.current + 1)}
                  disabled={pagination.current === pagination.last || loading}
                  className="p-2 rounded-lg bg-white/5 border border-white/5 hover:bg-white/10 text-on-surface disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Keyword Edit Modal */}
      <KeywordModal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        keyword={selectedKeyword}
        onSave={handleUpdateKeyword}
      />

      {/* Keyword Merge Modal */}
      <MergeKeywordsModal
        isOpen={isMergeOpen}
        onClose={() => setIsMergeOpen(false)}
        onMerged={handleMerged}
        defaultTarget={mergeTargetKeyword}
      />
    </div>
  );
}
