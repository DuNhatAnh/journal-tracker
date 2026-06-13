import React, { useState } from "react";
import { X, ArrowRight, AlertTriangle, Trash2, Loader2, CheckCircle2 } from "lucide-react";
import { KeywordItem } from "../../types";
import { AutocompleteInput } from "@/src/components/ui/AutocompleteInput";
import { api } from "@/src/lib/api";
import toast from "react-hot-toast";

type MergeKeywordsModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onMerged: () => void;
  defaultTarget?: KeywordItem | null;
};

export default function MergeKeywordsModal({
  isOpen,
  onClose,
  onMerged,
  defaultTarget,
}: MergeKeywordsModalProps) {
  const [targetKeyword, setTargetKeyword] = useState<KeywordItem | null>(defaultTarget || null);
  const [sourceKeywords, setSourceKeywords] = useState<KeywordItem[]>([]);
  const [targetInput, setTargetInput] = useState(defaultTarget ? defaultTarget.name : "");
  const [sourceInput, setSourceInput] = useState("");
  const [mergeReason, setMergeReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Bước xác nhận inline — thay thế window.confirm bị browser block trong overlay
  const [showConfirm, setShowConfirm] = useState(false);

  React.useEffect(() => {
    if (defaultTarget) {
      setTargetKeyword(defaultTarget);
      setTargetInput(defaultTarget.name);
    } else {
      setTargetKeyword(null);
      setTargetInput("");
    }
    setSourceKeywords([]);
    setSourceInput("");
    setMergeReason("");
    setError(null);
    setShowConfirm(false);
  }, [defaultTarget, isOpen]);

  if (!isOpen) return null;

  const fetchKeywordSuggestions = async (query: string): Promise<KeywordItem[]> => {
    try {
      const response = await api.get<{ data: KeywordItem[] }>(
        `/admin/keywords?q=${encodeURIComponent(query)}&per_page=10&status=active`
      );
      return response?.data || [];
    } catch {
      return [];
    }
  };

  const handleSelectTarget = (item: KeywordItem) => {
    setTargetKeyword(item);
    setTargetInput(item.name);
    setSourceKeywords((prev) => prev.filter((k) => k.id !== item.id));
  };

  const handleSelectSource = (item: KeywordItem) => {
    if (targetKeyword && item.id === targetKeyword.id) {
      setError("Từ khóa nguồn không được trùng với từ khóa đích.");
      setSourceInput("");
      return;
    }
    if (sourceKeywords.some((k) => k.id === item.id)) {
      setError("Từ khóa nguồn đã được chọn.");
      setSourceInput("");
      return;
    }
    setError(null);
    setSourceKeywords((prev) => [...prev, item]);
    setSourceInput("");
  };

  const handleRemoveSource = (id: number) => {
    setSourceKeywords((prev) => prev.filter((k) => k.id !== id));
  };

  // Bước 1: validate → chuyển sang màn hình xác nhận inline
  const handleRequestConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetKeyword) {
      setError("Vui lòng chọn từ khóa đích (giữ lại).");
      return;
    }
    if (sourceKeywords.length === 0) {
      setError("Vui lòng chọn ít nhất một từ khóa nguồn (bị gộp).");
      return;
    }
    setError(null);
    setShowConfirm(true);
  };

  // Bước 2: gọi API sau khi user bấm "Xác nhận gộp"
  const handleConfirmedMerge = async () => {
    if (!targetKeyword) return;

    setIsSubmitting(true);
    const loadingToast = toast.loading(
      `Đang gộp ${sourceKeywords.length} từ khóa vào "${targetKeyword.name}"...`
    );

    try {
      await api.post("/admin/keywords/merge", {
        target_id: targetKeyword.id,
        source_ids: sourceKeywords.map((k) => k.id),
        merge_reason: mergeReason.trim() || null,
      });

      toast.success(
        `✅ Gộp thành công! ${sourceKeywords.length} từ khóa đã được gộp vào "${targetKeyword.name}".`,
        { id: loadingToast, duration: 5000 }
      );
      onMerged();
      onClose();
    } catch (err: any) {
      const errMsg = err.message || "Gộp từ khóa thất bại. Vui lòng thử lại.";
      toast.error(`❌ ${errMsg}`, { id: loadingToast, duration: 6000 });
      setError(errMsg);
      setShowConfirm(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-fade-in">
      <div className="glass-panel w-full max-w-2xl bg-surface border border-white/10 rounded-2xl overflow-hidden shadow-2xl relative flex flex-col max-h-[90vh]">

        {/* Header */}
        <header className="px-6 py-4 border-b border-white/5 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-warning" />
            <h3 className="font-display font-bold text-on-surface text-lg">
              {showConfirm ? "Xác nhận gộp từ khóa" : "Gộp các từ khóa trùng lặp"}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="text-on-surface-variant hover:text-on-surface transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </header>

        {/* ── Màn hình xác nhận inline (Bước 2) ── */}
        {showConfirm ? (
          <div className="p-6 space-y-6 overflow-y-auto flex-1">
            <div className="p-5 rounded-xl bg-error/10 border border-error/30 space-y-4">
              <p className="text-sm font-bold text-error flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                Hành động này không thể hoàn tác!
              </p>

              <div className="space-y-1">
                <p className="text-xs text-on-surface-variant">Bạn sắp gộp <span className="font-bold text-on-surface">{sourceKeywords.length} từ khóa</span> vào từ khóa đích:</p>
                <div className="px-3 py-2 rounded-lg bg-primary/10 border border-primary/20 flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-primary">{targetKeyword?.name}</span>
                  <span className="text-xs text-on-surface-variant">({targetKeyword?.papers_count} bài hiện tại)</span>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Từ khóa sẽ bị xóa (nguồn):</p>
                <div className="flex flex-wrap gap-2">
                  {sourceKeywords.map((kw) => (
                    <span
                      key={kw.id}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-error/10 border border-error/20 text-error"
                    >
                      <Trash2 className="w-3 h-3" />
                      {kw.name} ({kw.papers_count} bài)
                    </span>
                  ))}
                </div>
              </div>

              {mergeReason && (
                <div className="text-xs text-on-surface-variant border-t border-white/10 pt-3">
                  <span className="font-semibold">Lý do gộp: </span>{mergeReason}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirm(false)}
                disabled={isSubmitting}
                className="px-5 py-2.5 rounded-xl border border-white/10 text-on-surface hover:bg-white/5 font-bold text-xs uppercase tracking-wider transition-all disabled:opacity-50"
              >
                ← Quay lại
              </button>
              <button
                type="button"
                onClick={handleConfirmedMerge}
                disabled={isSubmitting}
                className="px-6 py-2.5 rounded-xl bg-error text-white hover:bg-error/80 font-bold text-xs uppercase tracking-wider hover:shadow-lg hover:shadow-error/30 transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-2 min-w-[180px] justify-center"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Đang xử lý...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    Xác nhận gộp
                  </>
                )}
              </button>
            </div>
          </div>
        ) : (
          /* ── Form chính (Bước 1) ── */
          <form onSubmit={handleRequestConfirm} className="p-6 space-y-6 overflow-y-auto flex-1">
            {error && (
              <div className="p-3 text-xs bg-error/10 border border-error/40 text-error rounded-xl font-medium">
                ⚠️ {error}
              </div>
            )}

            {/* Hướng dẫn */}
            <div className="p-4 rounded-xl bg-warning/10 border border-warning/20 text-warning text-xs space-y-3">
              <div>
                <p className="font-bold">💡 Khi nào nên gộp từ khóa?</p>
                <ul className="list-disc list-inside mt-1.5 space-y-1 opacity-90">
                  <li><span className="font-semibold">Sai chính tả:</span> "machin learning" ➔ "machine learning"</li>
                  <li><span className="font-semibold">Viết tắt vs đầy đủ:</span> "AI" ➔ "Artificial Intelligence"</li>
                  <li><span className="font-semibold">Số ít / số nhiều:</span> "neural network" ➔ "neural networks"</li>
                  <li><span className="font-semibold">Đồng nghĩa:</span> "Trí tuệ nhân tạo" ➔ "Artificial Intelligence"</li>
                </ul>
              </div>
              <div className="border-t border-warning/20 pt-2">
                <p className="font-bold">⚠️ Hệ quả sau khi gộp:</p>
                <ul className="list-disc list-inside mt-1.5 space-y-1 opacity-90">
                  <li>Toàn bộ bài viết của từ khóa nguồn sẽ chuyển sang từ khóa đích.</li>
                  <li>Người đang follow từ khóa nguồn sẽ tự động chuyển sang follow từ khóa đích.</li>
                  <li>Dữ liệu xu hướng sẽ được tính toán lại.</li>
                </ul>
              </div>
            </div>

            {/* Grid chọn từ khóa */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative">
              {/* Cột trái: Từ khóa Đích */}
              <div className="space-y-3">
                <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest block">
                  Từ khóa đích (Giữ lại)
                </label>
                <AutocompleteInput<KeywordItem>
                  value={targetInput}
                  onChange={(val) => {
                    setTargetInput(val);
                    if (!val) setTargetKeyword(null);
                  }}
                  onSelect={handleSelectTarget}
                  fetchSuggestions={fetchKeywordSuggestions}
                  placeholder="Tìm từ khóa đích..."
                  renderSuggestion={(item) => (
                    <>
                      <span className="font-bold">{item.name}</span>
                      <span className="text-xs text-on-surface-variant ml-1">({item.papers_count} bài)</span>
                    </>
                  )}
                />
                {targetKeyword && (
                  <div className="p-4 rounded-xl border border-primary/20 bg-primary/5 space-y-1">
                    <p className="text-xs text-on-surface-variant">Đã chọn làm đích:</p>
                    <p className="font-bold text-primary text-sm">{targetKeyword.name}</p>
                    <p className="text-[10px] text-on-surface-variant">
                      Số bài hiện tại: {targetKeyword.papers_count} bài
                    </p>
                  </div>
                )}
              </div>

              {/* Mũi tên ở giữa */}
              <div className="hidden md:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/5 border border-white/10 items-center justify-center pointer-events-none">
                <ArrowRight className="w-4 h-4 text-on-surface-variant" />
              </div>

              {/* Cột phải: Từ khóa Nguồn */}
              <div className="space-y-3">
                <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest block">
                  Từ khóa nguồn (Bị gộp)
                </label>
                <AutocompleteInput<KeywordItem>
                  value={sourceInput}
                  onChange={setSourceInput}
                  onSelect={handleSelectSource}
                  fetchSuggestions={fetchKeywordSuggestions}
                  placeholder="Tìm và thêm từ khóa nguồn..."
                  renderSuggestion={(item) => (
                    <>
                      <span className="font-bold">{item.name}</span>
                      <span className="text-xs text-on-surface-variant ml-1">({item.papers_count} bài)</span>
                    </>
                  )}
                />
                <div className="space-y-2">
                  <span className="text-xs font-bold text-on-surface-variant">
                    Đã chọn ({sourceKeywords.length}):
                  </span>
                  {sourceKeywords.length === 0 ? (
                    <p className="text-xs text-on-surface-variant/50 italic">
                      Chưa có từ khóa nguồn nào được chọn.
                    </p>
                  ) : (
                    <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto p-1">
                      {sourceKeywords.map((kw) => (
                        <span
                          key={kw.id}
                          className="inline-flex items-center gap-1.5 pl-3 pr-2 py-1 rounded-full text-xs font-medium bg-white/5 border border-white/10 text-on-surface hover:border-error/30 hover:bg-error/5 transition-all"
                        >
                          {kw.name}
                          <button
                            type="button"
                            onClick={() => handleRemoveSource(kw.id)}
                            className="p-0.5 rounded-full hover:bg-white/10 text-on-surface-variant hover:text-error transition-colors"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Lý do gộp */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest block">
                Lý do gộp{" "}
                <span className="font-normal normal-case text-on-surface-variant/60">(không bắt buộc)</span>
              </label>
              <textarea
                value={mergeReason}
                onChange={(e) => setMergeReason(e.target.value)}
                rows={2}
                maxLength={500}
                placeholder="Ví dụ: Từ viết tắt của Artificial Intelligence, gộp để thống nhất từ khóa..."
                className="w-full px-4 py-3 rounded-xl bg-surface/50 border border-white/10 text-on-surface placeholder:text-on-surface-variant/40 focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all outline-none resize-none text-sm"
              />
              <p className="text-right text-[10px] text-on-surface-variant/50">{mergeReason.length}/500</p>
            </div>

            {/* Actions */}
            <div className="pt-2 flex justify-end gap-3 border-t border-white/5">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl border border-white/10 text-on-surface hover:bg-white/5 font-bold text-xs uppercase tracking-wider transition-all"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={!targetKeyword || sourceKeywords.length === 0}
                className="px-5 py-2.5 rounded-xl bg-error text-white hover:bg-error/80 font-bold text-xs uppercase tracking-wider hover:shadow-lg hover:shadow-error/30 transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-2 min-w-[160px] justify-center"
              >
                <Trash2 className="w-4 h-4" />
                Tiến hành gộp
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
