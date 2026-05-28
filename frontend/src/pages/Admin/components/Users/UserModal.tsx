import React from "react";
import { X, User as UserIcon, Mail, Lock, Loader2, CheckCircle2, AlertCircle } from "lucide-react";

type UserModalProps = {
  isModalOpen: boolean;
  modalType: "add" | "edit";
  formData: { name: string; email: string; password?: string; role: string };
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  handleCloseModal: () => void;
  handleSubmit: (e: React.FormEvent) => Promise<void>;
  isSubmitting: boolean;
  modalError: string | null;
  modalSuccess: string | null;
};

export default function UserModal({
  isModalOpen,
  modalType,
  formData,
  handleInputChange,
  handleCloseModal,
  handleSubmit,
  isSubmitting,
  modalError,
  modalSuccess,
}: UserModalProps) {
  if (!isModalOpen) return null;

  const isDisabled = isSubmitting || !!modalSuccess;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-background/80 backdrop-blur-md" onClick={isDisabled ? undefined : handleCloseModal} />

      {/* Modal Container */}
      <div className="glass-panel-intense rounded-3xl p-8 max-w-md w-full relative z-10 space-y-6 shadow-2xl animate-in fade-in-50 zoom-in-95">
        <header className="flex justify-between items-center">
          <h3 className="font-display text-2xl font-bold">
            {modalType === "add" ? "Thêm người dùng mới" : "Chỉnh sửa người dùng"}
          </h3>
          <button 
            onClick={handleCloseModal} 
            disabled={isDisabled}
            className="p-1.5 rounded-full hover:bg-white/5 transition-all text-on-surface-variant hover:text-on-surface disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <X className="w-5 h-5" />
          </button>
        </header>

        {modalError && (
          <div className="p-3.5 rounded-xl bg-error-container/20 border border-error/30 text-error text-xs flex items-center gap-2.5 animate-in fade-in slide-in-from-top-2 duration-200">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span className="font-medium">{modalError}</span>
          </div>
        )}

        {modalSuccess && (
          <div className="p-3.5 rounded-xl bg-tertiary-container/20 border border-tertiary/30 text-tertiary text-xs flex items-center gap-2.5 animate-in fade-in slide-in-from-top-2 duration-200">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <span className="font-medium">{modalSuccess}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Họ và tên</label>
            <div className="relative">
              <UserIcon className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant" />
              <input
                type="text"
                name="name"
                required
                disabled={isDisabled}
                value={formData.name}
                onChange={handleInputChange}
                className="w-full pl-11 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-on-surface placeholder:text-on-surface-variant focus:border-primary/50 transition-all outline-none disabled:opacity-50"
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
                disabled={isDisabled}
                value={formData.email}
                onChange={handleInputChange}
                className="w-full pl-11 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-on-surface placeholder:text-on-surface-variant focus:border-primary/50 transition-all outline-none disabled:opacity-50"
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
                  disabled={isDisabled}
                  value={formData.password}
                  onChange={handleInputChange}
                  className="w-full pl-11 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-on-surface placeholder:text-on-surface-variant focus:border-primary/50 transition-all outline-none disabled:opacity-50"
                  placeholder="Tối thiểu 8 ký tự"
                />
              </div>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Vai trò</label>
            <select
              name="role"
              disabled={isDisabled}
              value={formData.role}
              onChange={handleInputChange}
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-on-surface focus:border-primary/50 transition-all outline-none disabled:opacity-50"
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
              disabled={isDisabled}
              className="flex-1 py-3.5 rounded-xl border border-white/10 text-on-surface font-bold text-xs uppercase tracking-widest hover:bg-white/5 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isDisabled}
              className="flex-1 py-3.5 rounded-xl bg-primary text-on-primary font-bold text-xs uppercase tracking-widest hover:bg-primary-container transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Đang tạo...
                </>
              ) : modalType === "add" ? (
                "Thêm"
              ) : (
                "Lưu thay đổi"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
