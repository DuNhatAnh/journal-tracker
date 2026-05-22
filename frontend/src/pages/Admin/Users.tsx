import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { Users, UserPlus, Search, Edit2, Trash2, X, ShieldAlert, Mail, User as UserIcon, Lock, Shield, TrendingUp, BookOpen, GraduationCap, ChevronLeft, ChevronRight } from "lucide-react";
import { api } from "@/src/lib/api";

type UserItem = {
  id: number;
  name: string;
  email: string;
  role: string;
  created_at: string;
};

const ROLE_CONFIG: Record<string, { label: string; icon: React.ElementType; color: string; bg: string; border: string }> = {
  admin:      { label: "Admin",       icon: Shield,       color: "text-error",     bg: "bg-error/10",     border: "border-error/20" },
  researcher: { label: "Researcher",  icon: TrendingUp,   color: "text-primary",   bg: "bg-primary/10",   border: "border-primary/20" },
  lecturer:   { label: "Giảng viên",  icon: BookOpen,     color: "text-secondary", bg: "bg-secondary/10", border: "border-secondary/20" },
  student:    { label: "Sinh viên",   icon: GraduationCap,color: "text-tertiary",  bg: "bg-tertiary/10",  border: "border-tertiary/20" },
};

export default function AdminUsers() {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

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

  const currentUserStr = localStorage.getItem("user");
  const currentUser = currentUserStr ? JSON.parse(currentUserStr) : null;

  useEffect(() => {
    if (currentUser?.role === "admin") {
      loadUsers();
    }
  }, []);

  if (currentUser?.role !== "admin") {
    return <Navigate to="/dashboard" replace />;
  }

  const loadUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get<UserItem[]>("/admin/users");
      setUsers(response || []);
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
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (user: UserItem) => {
    setModalType("edit");
    setSelectedUser(user);
    setFormData({ name: user.name, email: user.email, password: "", role: user.role });
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
    setError(null);

    try {
      if (modalType === "add") {
        await api.post("/admin/users", formData);
      } else if (modalType === "edit" && selectedUser) {
        // Exclude password if empty during edit
        const payload: Record<string, any> = {
          name: formData.name,
          email: formData.email,
          role: formData.role,
        };
        await api.put(`/admin/users/${selectedUser.id}`, payload);
      }
      setIsModalOpen(false);
      await loadUsers();
    } catch (err: any) {
      setError(err.message || "Lỗi khi lưu thông tin người dùng.");
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

  // Filter & Search
  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === "all" || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

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
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Object.entries(ROLE_CONFIG).map(([role, cfg]) => {
          const count = users.filter(u => u.role === role).length;
          return (
            <div key={role} className={`glass-panel rounded-2xl p-4 border ${cfg.border} bg-surface flex items-center gap-3`}>
              <div className={`p-2.5 rounded-xl ${cfg.bg}`}>
                <cfg.icon className={`w-4 h-4 ${cfg.color}`} />
              </div>
              <div>
                <p className={`text-xl font-black font-display ${cfg.color}`}>{loading ? "—" : count}</p>
                <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">{cfg.label}</p>
              </div>
            </div>
          );
        })}
      </div>

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
      {loading ? (
        <div className="space-y-4">
          <div className="h-16 rounded-xl bg-white/5 animate-pulse" />
          <div className="h-16 rounded-xl bg-white/5 animate-pulse" />
          <div className="h-16 rounded-xl bg-white/5 animate-pulse" />
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-surface p-12 text-center text-on-surface-variant">
          <p className="text-lg font-semibold text-on-surface">Không tìm thấy người dùng nào.</p>
          <p className="mt-2 text-sm">Hãy thử thay đổi từ khóa tìm kiếm hoặc bộ lọc.</p>
        </div>
      ) : (
        <div className="glass-panel rounded-2xl overflow-hidden shadow-lg border border-white/10 bg-surface">
          {/* Table header with total count */}
          <div className="px-6 py-3 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
            <span className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">
              {filteredUsers.length} / {users.length} người dùng
            </span>
            {searchQuery || roleFilter !== "all" ? (
              <button
                onClick={() => { setSearchQuery(""); setRoleFilter("all"); }}
                className="text-[10px] font-bold text-primary hover:text-primary/70 uppercase tracking-widest transition-colors"
              >
                Xóa bộ lọc
              </button>
            ) : null}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/5 bg-white/[0.02] text-xs font-bold uppercase tracking-widest text-on-surface-variant">
                  <th className="px-6 py-4">Họ và tên</th>
                  <th className="px-6 py-4">Email</th>
                  <th className="px-6 py-4">Vai trò</th>
                  <th className="px-6 py-4">Ngày tạo</th>
                  <th className="px-6 py-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-sm">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-white/[0.01] transition-all">
                    <td className="px-6 py-4 font-bold text-on-surface">{user.name}</td>
                    <td className="px-6 py-4 text-on-surface-variant">{user.email}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          user.role === "admin"
                            ? "bg-error/15 text-error border border-error/20"
                            : user.role === "researcher"
                            ? "bg-primary/15 text-primary border border-primary/20"
                            : user.role === "lecturer"
                            ? "bg-secondary/15 text-secondary border border-secondary/20"
                            : "bg-tertiary/15 text-tertiary border border-tertiary/20"
                        }`}
                      >
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-on-surface-variant">
                      {new Date(user.created_at).toLocaleDateString("vi-VN")}
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button
                        onClick={() => handleOpenEditModal(user)}
                        className="p-2 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-all"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteUser(user.id)}
                        disabled={user.id === currentUser.id}
                        className="p-2 rounded-lg bg-error/10 text-error hover:bg-error/20 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-background/80 backdrop-blur-md" onClick={handleCloseModal} />

          {/* Modal Container */}
          <div className="glass-panel-intense rounded-3xl p-8 max-w-md w-full relative z-10 space-y-6 shadow-2xl animate-in fade-in-50 zoom-in-95">
            <header className="flex justify-between items-center">
              <h3 className="font-display text-2xl font-bold">
                {modalType === "add" ? "Thêm người dùng mới" : "Chỉnh sửa người dùng"}
              </h3>
              <button onClick={handleCloseModal} className="p-1.5 rounded-full hover:bg-white/5 transition-all text-on-surface-variant hover:text-on-surface">
                <X className="w-5 h-5" />
              </button>
            </header>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Họ và tên</label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant" />
                  <input
                    type="text"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full pl-11 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-on-surface placeholder:text-on-surface-variant focus:border-primary/50 transition-all outline-none"
                    placeholder="Nguyễn Văn A"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Email</label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant" />
                  <input
                    type="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full pl-11 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-on-surface placeholder:text-on-surface-variant focus:border-primary/50 transition-all outline-none"
                    placeholder="email@domain.com"
                  />
                </div>
              </div>

              {modalType === "add" && (
                <div className="space-y-1">
                  <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Mật khẩu</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant" />
                    <input
                      type="password"
                      name="password"
                      required
                      value={formData.password}
                      onChange={handleInputChange}
                      className="w-full pl-11 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-on-surface placeholder:text-on-surface-variant focus:border-primary/50 transition-all outline-none"
                      placeholder="Tối thiểu 8 ký tự"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Vai trò</label>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-on-surface focus:border-primary/50 transition-all outline-none"
                >
                  <option value="student" className="bg-surface">Sinh viên (Student)</option>
                  <option value="lecturer" className="bg-surface">Giảng viên (Lecturer)</option>
                  <option value="researcher" className="bg-surface">Nhà nghiên cứu (Researcher)</option>
                  <option value="admin" className="bg-surface">Quản trị viên (Admin)</option>
                </select>
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
                  {modalType === "add" ? "Thêm" : "Lưu thay đổi"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
