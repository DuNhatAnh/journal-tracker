import { useEffect } from "react";
import { createPortal } from "react-dom";
import { X, Sparkles, ExternalLink } from "lucide-react";
import { DashboardData } from "../types";

interface JournalDetailModalProps {
  journal: NonNullable<DashboardData['topJournals'][0]>;
  onClose: () => void;
}

export function JournalDetailModal({ journal, onClose }: JournalDetailModalProps) {
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-6"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl bg-surface-container border border-outline-variant/30 shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-surface-container/95 backdrop-blur-md border-b border-outline-variant/20 p-6 flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl flex items-center justify-center font-display font-black text-2xl shadow-md flex-shrink-0 bg-[#0a0a0a] text-white border border-white/10">
              {journal.initial}
            </div>
            <div>
              <h2 className="font-display text-xl font-bold text-on-surface leading-tight">{journal.name}</h2>
              <p className="text-sm text-on-surface-variant mt-1">{journal.field}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-9 h-9 flex-shrink-0 flex items-center justify-center rounded-full border border-outline-variant/30 text-on-surface-variant hover:text-on-surface hover:bg-white/5 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Giải thích tiêu chí xếp hạng */}
          <div className="bg-primary/10 border border-primary/20 rounded-xl p-4 flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold text-primary mb-1">Cơ sở đánh giá xếp hạng</p>
              <p className="text-[11px] text-on-surface-variant leading-relaxed">
                Được công nhận là <strong>Tạp chí hàng đầu</strong> dựa trên chỉ số ảnh hưởng (Impact Factor) toàn cầu được trích xuất từ <strong>{journal.source || 'Hệ thống đánh giá độc lập'}</strong> kết hợp với dữ liệu phân tích thống kê trên SciTrend.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="glass-panel p-4 rounded-xl flex flex-col justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-0.5">Impact Factor</p>
                <p className="text-[9px] text-on-surface-variant/60 leading-tight mb-2">Chỉ số ảnh hưởng học thuật toàn cầu</p>
              </div>
              <p className="text-2xl font-bold text-primary">{journal.impact_factor || "N/A"}</p>
            </div>
            <div className="glass-panel p-4 rounded-xl flex flex-col justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-0.5">Chỉ số ISSN</p>
                <p className="text-[9px] text-on-surface-variant/60 leading-tight mb-2">Mã số chuẩn quốc tế định danh các xuất bản phẩm nhiều kỳ.</p>
              </div>
              {journal.issn ? (
                <p className="text-lg font-bold text-on-surface font-mono">{journal.issn}</p>
              ) : (
                <div className="space-y-1">
                  <p className="text-xs font-bold text-on-surface-variant/50 italic">Chưa có ISSN</p>
                  {journal.issn_note && (
                    <p className="text-[10px] leading-snug text-amber-400/80 bg-amber-400/10 border border-amber-400/20 rounded-lg px-2 py-1">
                      {journal.issn_note}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-1">Số bài báo đã thống kê</p>
                <p className="text-sm text-on-surface font-medium">{journal.papers_count?.toLocaleString() || 0} bài báo</p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-1">Nguồn đánh giá</p>
                <p className="text-sm text-primary font-medium">{journal.source || "N/A"}</p>
              </div>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-1">Nhà xuất bản</p>
              <p className="text-sm text-on-surface font-medium">{journal.publisher || "Chưa rõ nhà xuất bản"}</p>
            </div>
            
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-1">Trang chủ Tạp chí</p>
              {journal.url ? (
                <a
                  href={journal.url.startsWith("http") ? journal.url : `https://${journal.url}`}
                  target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-primary hover:text-tertiary transition-colors font-mono break-all"
                >
                  <ExternalLink className="w-4 h-4 flex-shrink-0" />
                  {journal.url}
                </a>
              ) : (
                <p className="text-sm text-on-surface-variant italic">Chưa có thông tin đường dẫn</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
