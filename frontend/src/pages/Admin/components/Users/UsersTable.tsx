import React from "react";
import { Edit2, Trash2 } from "lucide-react";
import { UserItem } from "../../types";

type UsersTableProps = {
  users: UserItem[];
  filteredUsers: UserItem[];
  loading: boolean;
  searchQuery: string;
  roleFilter: string;
  currentUser: any;
  setSearchQuery: (query: string) => void;
  setRoleFilter: (role: string) => void;
  handleOpenEditModal: (user: UserItem) => void;
  handleDeleteUser: (id: number) => void;
};

export default function UsersTable({
  users,
  filteredUsers,
  loading,
  searchQuery,
  roleFilter,
  currentUser,
  setSearchQuery,
  setRoleFilter,
  handleOpenEditModal,
  handleDeleteUser,
}: UsersTableProps) {
  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-16 rounded-xl bg-white/5 animate-pulse" />
        <div className="h-16 rounded-xl bg-white/5 animate-pulse" />
        <div className="h-16 rounded-xl bg-white/5 animate-pulse" />
      </div>
    );
  }

  if (filteredUsers.length === 0) {
    return (
      <div className="rounded-2xl border border-white/10 bg-surface p-12 text-center text-on-surface-variant">
        <p className="text-lg font-semibold text-on-surface">Không tìm thấy người dùng nào.</p>
        <p className="mt-2 text-sm">Hãy thử thay đổi từ khóa tìm kiếm hoặc bộ lọc.</p>
      </div>
    );
  }

  return (
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
  );
}
