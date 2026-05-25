import React from "react";
import { X, Settings, Link as LinkIcon } from "lucide-react";

type SourceModalProps = {
  isModalOpen: boolean;
  modalType: "add" | "edit";
  formData: { name: string; api_url: string };
  setFormData: React.Dispatch<React.SetStateAction<{ name: string; api_url: string }>>;
  handleCloseModal: () => void;
  handleSubmitSource: (e: React.FormEvent) => Promise<void>;
};

export default function SourceModal({
  isModalOpen,
  modalType,
  formData,
  setFormData,
  handleCloseModal,
  handleSubmitSource,
}: SourceModalProps) {
  if (!isModalOpen) return null;

  return (
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
  );
}
