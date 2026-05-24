import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Bot, Loader2, Sparkles, BookMarked, TrendingUp, Quote, X } from "lucide-react";
import { PaperDetail } from "../types";

interface AiReviewModalProps {
  papers: PaperDetail[];
  onClose: () => void;
}

export function AiReviewModal({ papers, onClose }: AiReviewModalProps) {
  const [analyzing, setAnalyzing] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setAnalyzing(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} />
      <div className="bg-surface-container relative w-full max-w-2xl rounded-3xl border border-outline-variant/30 shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in zoom-in duration-300">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/5 flex justify-between items-center bg-surface sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-display font-bold text-lg">AI Phân tích Chuyên sâu</h2>
              <p className="text-xs text-on-surface-variant">Tổng hợp Literature Review tự động</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <X className="w-5 h-5 text-on-surface-variant" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto">
          {analyzing ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <Loader2 className="w-10 h-10 text-primary animate-spin" />
              <p className="text-sm text-on-surface-variant animate-pulse font-mono">Đang tổng hợp thông tin từ {papers.length} bài báo...</p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="glass-panel p-4 rounded-xl border border-primary/20">
                <h4 className="text-sm font-bold text-primary mb-2 flex items-center gap-2"><Sparkles className="w-4 h-4"/> Tổng quan Nghiên cứu</h4>
                <p className="text-sm text-on-surface leading-relaxed">
                  Dựa trên {papers.length} bài báo học thuật hàng đầu được đề xuất, xu hướng chung tập trung vào việc tối ưu hóa hiệu suất và ứng dụng các thuật toán máy học mới trong thực tiễn.
                </p>
              </div>

              <div>
                <h4 className="text-sm font-bold text-on-surface mb-3 flex items-center gap-2"><BookMarked className="w-4 h-4 text-tertiary"/> Điểm Tương Đồng</h4>
                <ul className="space-y-2">
                  {papers.map((p, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-on-surface-variant">
                      <div className="w-1.5 h-1.5 rounded-full bg-tertiary mt-2 shrink-0" />
                      <span>Bài viết <strong>"{p.title}"</strong> cũng nhấn mạnh vào việc phân tích dữ liệu quy mô lớn, tương tự các nghiên cứu gần đây trong lĩnh vực.</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h4 className="text-sm font-bold text-on-surface mb-3 flex items-center gap-2"><TrendingUp className="w-4 h-4 text-secondary"/> Định Hướng Mới</h4>
                <p className="text-sm text-on-surface-variant leading-relaxed p-4 bg-white/5 rounded-lg border border-white/5">
                  Các nghiên cứu này mở ra hướng đi mới trong việc ứng dụng AI để tự động hóa các quy trình đánh giá dữ liệu, giúp giảm thiểu sai sót do yếu tố con người. Bạn nên xem xét áp dụng các mô hình học sâu (Deep Learning) như được đề cập trong các bài báo này vào đề tài của mình.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {!analyzing && (
          <div className="px-6 py-4 border-t border-white/5 flex justify-end gap-3 bg-surface sticky bottom-0">
            <button className="px-4 py-2 text-sm font-bold rounded-lg border border-outline-variant/30 hover:bg-white/5 transition-colors">
              Lưu bản nháp
            </button>
            <button className="px-4 py-2 text-sm font-bold rounded-lg gradient-btn text-white flex items-center gap-2">
              <Quote className="w-4 h-4" /> Trích xuất trích dẫn
            </button>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
