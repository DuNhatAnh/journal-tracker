import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { UserPlus, Search } from "lucide-react";
import { api } from "@/src/lib/api";
import { UserItem } from "./types";
import UsersStats from "./components/Users/UsersStats";
import UsersTable from "./components/Users/UsersTable";
import UserModal from "./components/Users/UserModal";

export default function AdminUsers() {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [stats, setStats] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<"add" | "edit">("add");
  const [selectedUser, setSelectedUser] = useState<UserItem | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "student",
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [modalSuccess, setModalSuccess] = useState<string | null>(null);

  const currentUserStr = localStorage.getItem("user");
  const currentUser = currentUserStr ? JSON.parse(currentUserStr) : null;

  useEffect(() => {
    if (currentUser?.role === "admin") {
      const delayDebounceFn = setTimeout(() => {
        loadUsers();
      }, 300); // 300ms debounce
      return () => clearTimeout(delayDebounceFn);
    }
  }, [currentPage, searchQuery, roleFilter]);

  if (currentUser?.role !== "admin") {
    return <Navigate to="/dashboard" replace />;
  }

  const loadUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const queryParams = new URLSearchParams({
        page: currentPage.toString(),
        search: searchQuery,
        role: roleFilter
      });
      const response = await api.get<any>(`/admin/users?${queryParams.toString()}`);
      if (response && response.users) {
        setUsers(response.users.data || []);
        setTotalPages(response.users.last_page || 1);
        setTotalUsers(response.users.total || 0);
        setStats(response.stats || {});
      } else {
        // Fallback for unexpected response structure
        setUsers(response || []);
        setTotalPages(1);
        setTotalUsers(response.length || 0);
      }
    } catch (err: any) {
      setError(err.message || "Không thể tải danh sách người dùng.");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAddModal = () => {
    setModalType("add");
    setSelectedUser(null);
    setFormData({ name: "", email: "", password: "", role: "student" });
    setModalError(null);
    setModalSuccess(null);
    setIsSubmitting(false);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (user: UserItem) => {
    setModalType("edit");
    setSelectedUser(user);
    setFormData({ name: user.name, email: user.email, password: "", role: user.role });
    setModalError(null);
    setModalSuccess(null);
    setIsSubmitting(false);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);
    setModalSuccess(null);
    setIsSubmitting(true);

    try {
      if (modalType === "add") {
        await api.post("/admin/users", formData);
        setModalSuccess("Thêm người dùng mới thành công!");
      } else if (modalType === "edit" && selectedUser) {
        // Exclude password if empty during edit
        const payload: Record<string, any> = {
          name: formData.name,
          email: formData.email,
          role: formData.role,
        };
        await api.put(`/admin/users/${selectedUser.id}`, payload);
        setModalSuccess("Cập nhật thông tin người dùng thành công!");
      }
      
      setTimeout(async () => {
        setIsModalOpen(false);
        setModalSuccess(null);
        await loadUsers();
      }, 1500);
    } catch (err: any) {
      let errMsg = "Có lỗi xảy ra khi lưu thông tin người dùng.";
      if (err.response?.data?.errors) {
        const validationErrors = err.response.data.errors;
        const messages = Object.values(validationErrors).flat();
        if (messages.length > 0) {
          errMsg = messages.join(" ");
        }
      } else if (err.response?.data?.message) {
        errMsg = err.response.data.message;
      } else if (err.message) {
        errMsg = err.message;
      }
      setModalError(errMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteUser = async (id: number) => {
    if (id === currentUser.id) {
      alert("Bạn không thể tự xóa tài khoản của chính mình!");
      return;
    }

    if (!window.confirm("Bạn có chắc chắn muốn xóa người dùng này? Hành động này không thể hoàn tác.")) {
      return;
    }

    setError(null);
    try {
      await api.delete(`/admin/users/${id}`);
      await loadUsers();
    } catch (err: any) {
      setError(err.message || "Lỗi khi xóa người dùng.");
    }
  };

  // When search or filter changes, we want to reset to page 1
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  const handleRoleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setRoleFilter(e.target.value);
    setCurrentPage(1);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-end border-b border-white/5 pb-6 gap-4">
        <div>
          <h2 className="font-display text-4xl font-bold text-on-surface">Quản lý người dùng</h2>
          <p className="text-on-surface-variant mt-2 font-medium">
            Quản trị viên có thể thêm, sửa đổi vai trò hoặc vô hiệu hóa tài khoản trong hệ thống.
          </p>
        </div>
        <button
          onClick={handleOpenAddModal}
          className="flex items-center gap-2 px-5 py-3 rounded-xl bg-primary text-on-primary font-bold text-xs uppercase tracking-widest hover:bg-primary-container hover:shadow-lg hover:shadow-primary/30 transition-all active:scale-95"
        >
          <UserPlus className="w-4 h-4" /> Thêm người dùng
        </button>
      </header>

      {/* Stats Summary Row */}
      <UsersStats stats={stats} loading={loading} />

      {error && (
        <div className="p-4 rounded-xl bg-error-container/20 border border-error/40 text-error text-sm font-medium">
          {error}
        </div>
      )}

      {/* Search & Filter Bar */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant" />
          <input
            type="text"
            placeholder="Tìm theo tên hoặc email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 rounded-xl bg-surface border border-white/10 text-on-surface placeholder:text-on-surface-variant focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all outline-none"
          />
        </div>

        <div className="w-full md:w-60">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-surface border border-white/10 text-on-surface focus:border-primary/50 transition-all outline-none"
          >
            <option value="all">Tất cả vai trò</option>
            <option value="admin">Quản trị viên (Admin)</option>
            <option value="researcher">Nhà nghiên cứu (Researcher)</option>
            <option value="lecturer">Giảng viên (Lecturer)</option>
            <option value="student">Sinh viên (Student)</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <UsersTable
        users={users}
        loading={loading}
        searchQuery={searchQuery}
        roleFilter={roleFilter}
        currentUser={currentUser}
        totalUsers={totalUsers}
        totalPages={totalPages}
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        setSearchQuery={setSearchQuery}
        setRoleFilter={setRoleFilter}
        handleOpenEditModal={handleOpenEditModal}
        handleDeleteUser={handleDeleteUser}
      />

      {/* Add/Edit Modal */}
      <UserModal
        isModalOpen={isModalOpen}
        modalType={modalType}
        formData={formData}
        handleInputChange={handleInputChange}
        handleCloseModal={handleCloseModal}
        handleSubmit={handleSubmit}
        isSubmitting={isSubmitting}
        modalError={modalError}
        modalSuccess={modalSuccess}
      />
    </div>
  );
}
