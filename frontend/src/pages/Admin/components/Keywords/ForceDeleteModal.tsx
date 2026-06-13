import React, { useState } from "react";
import { AlertTriangle, Lock, X } from "lucide-react";

interface ForceDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  keywordName: string;
  onConfirm: (password: string) => Promise<void>;
}

export default function ForceDeleteModal({ isOpen, onClose, keywordName, onConfirm }: ForceDeleteModalProps) {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) return;
    
    setLoading(true);
    try {
      await onConfirm(password);
      setPassword("");
      onClose();
    } catch (error) {
      // Error is handled by the parent
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
      <div 
        className="bg-surface border border-error/30 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-error/10 border-b border-error/20">
          <h3 className="text-lg font-bold text-error flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            Cảnh Báo Xóa Vĩnh Viễn
          </h3>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-error hover:bg-error/20 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          <p className="text-on-surface leading-relaxed mb-4 text-center">
            Bạn đang chuẩn bị xóa vĩnh viễn từ khóa:
            <br />
            <span className="inline-block mt-2 font-bold text-xl text-error bg-error/10 px-4 py-1.5 rounded-lg">
              {keywordName}
            </span>
          </p>
          
          <div className="bg-warning/10 border border-warning/20 p-4 rounded-xl text-warning text-sm mb-6">
            <strong>LƯU Ý:</strong> Hành động này không thể hoàn tác. Mọi liên kết, dữ liệu phân tích liên quan đến từ khóa này sẽ bị xóa khỏi cơ sở dữ liệu vĩnh viễn!
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-bold text-on-surface-variant flex items-center gap-1.5">
                <Lock className="w-4 h-4" />
                Xác thực mật khẩu Admin
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Nhập mật khẩu của bạn..."
                className="w-full px-4 py-3 bg-background border border-white/10 rounded-xl text-on-surface focus:outline-none focus:border-error focus:ring-1 focus:ring-error transition-all"
                required
                autoFocus
              />
            </div>

            <div className="pt-2 flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-on-surface font-bold transition-all"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={loading || !password}
                className="flex-1 px-4 py-3 rounded-xl bg-error hover:bg-error/90 text-white font-bold transition-all disabled:opacity-50 flex justify-center items-center gap-2 shadow-lg shadow-error/20"
              >
                {loading ? "Đang xử lý..." : "Chắc chắn Xóa"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
