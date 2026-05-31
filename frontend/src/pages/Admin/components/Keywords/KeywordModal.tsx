import React, { useState, useEffect } from "react";
import { X } from "lucide-react";
import { KeywordItem } from "../../types";

type KeywordModalProps = {
  isOpen: boolean;
  onClose: () => void;
  keyword: KeywordItem | null;
  onSave: (name: string) => Promise<void>;
};

export default function KeywordModal({ isOpen, onClose, keyword, onSave }: KeywordModalProps) {
  const [name, setName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (keyword) {
      setName(keyword.name);
      setError(null);
    }
  }, [keyword]);

  if (!isOpen || !keyword) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Tên từ khóa không được để trống.");
      return;
    }
    setError(null);
    setIsSubmitting(true);
    try {
      await onSave(name.trim());
      onClose();
    } catch (err: any) {
      setError(err.message || "Không thể cập nhật tên từ khóa.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-fade-in">
      <div className="glass-panel w-full max-w-md bg-surface border border-white/10 rounded-2xl overflow-hidden shadow-2xl relative">
        <header className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
          <h3 className="font-display font-bold text-on-surface text-lg">Chỉnh sửa từ khóa</h3>
          <button
            onClick={onClose}
            className="text-on-surface-variant hover:text-on-surface transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </header>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 text-xs bg-error-container/20 border border-error/40 text-error rounded-xl font-medium">
              ⚠️ {error}
            </div>
          )}

          <div className="space-y-2">
            <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">
              Tên từ khóa
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isSubmitting}
              className="w-full px-4 py-3 rounded-xl bg-background border border-white/10 text-on-surface focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all outline-none"
              placeholder="Nhập tên từ khóa mới..."
            />
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t border-white/5">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl border border-white/10 text-on-surface hover:bg-white/5 font-bold text-xs uppercase tracking-wider transition-all disabled:opacity-50"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl bg-primary text-on-primary hover:bg-primary-container font-bold text-xs uppercase tracking-wider hover:shadow-lg hover:shadow-primary/30 transition-all disabled:opacity-50"
            >
              {isSubmitting ? "Đang lưu..." : "Lưu thay đổi"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
