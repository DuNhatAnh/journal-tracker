import React, { useState } from "react";
import { X, ArrowRight, AlertTriangle, Trash2 } from "lucide-react";
import { KeywordItem } from "../../types";
import { AutocompleteInput } from "@/src/components/ui/AutocompleteInput";
import { api } from "@/src/lib/api";

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
  }, [defaultTarget, isOpen]);

  if (!isOpen) return null;

  const fetchKeywordSuggestions = async (query: string): Promise<KeywordItem[]> => {
    try {
      const response = await api.get<{ data: KeywordItem[] }>(
        `/keywords?q=${encodeURIComponent(query)}&per_page=10`
      );
      return response?.data || [];
    } catch {
      return [];
    }
  };

  const handleSelectTarget = (item: KeywordItem) => {
    setTargetKeyword(item);
    setTargetInput(item.name);
    // Remove if it exists in sources
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

  const handleMerge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetKeyword) {
      setError("Vui lòng chọn từ khóa đích (giữ lại).");
      return;
    }
    if (sourceKeywords.length === 0) {
      setError("Vui lòng chọn ít nhất một từ khóa nguồn (bị gộp).");
      return;
    }

    if (
      !window.confirm(
        `Bạn có chắc chắn muốn gộp ${sourceKeywords.length} từ khóa nguồn vào từ khóa "${targetKeyword.name}"?\n` +
          `Các từ khóa nguồn sẽ bị XÓA VĨNH VIỄN và hành động này không thể hoàn tác.`
      )
    ) {
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      await api.post("/admin/keywords/merge", {
        target_id: targetKeyword.id,
        source_ids: sourceKeywords.map((k) => k.id),
        merge_reason: mergeReason.trim() || null,
      });

      onMerged();
      onClose();
    } catch (err: any) {
      setError(err.message || "Gộp từ khóa thất bại.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-fade-in">
      <div className="glass-panel w-full max-w-2xl bg-surface border border-white/10 rounded-2xl overflow-hidden shadow-2xl relative flex flex-col max-h-[90vh]">
        <header className="px-6 py-4 border-b border-white/5 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-warning" />
            <h3 className="font-display font-bold text-on-surface text-lg">Gộp các từ khóa trùng lặp</h3>
          </div>
          <button
            onClick={onClose}
            className="text-on-surface-variant hover:text-on-surface transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </header>

        <form onSubmit={handleMerge} className="p-6 space-y-6 overflow-y-auto flex-1">
          {error && (
            <div className="p-3 text-xs bg-error-container/20 border border-error/40 text-error rounded-xl font-medium">
              ⚠️ {error}
            </div>
          )}

          <div className="p-4 rounded-xl bg-warning/10 border border-warning/20 text-warning text-xs space-y-3">
            <div>
              <p className="font-bold flex items-center gap-1.5">💡 Gợi ý - Khi nào nên gộp từ khóa?</p>
              <ul className="list-disc list-inside mt-1.5 space-y-1 opacity-90">
                <li><span className="font-semibold">Sai chính tả / Lỗi đánh máy:</span> "machin learning" ➔ "machine learning"</li>
                <li><span className="font-semibold">Từ viết tắt vs Tên đầy đủ:</span> "AI" ➔ "Artificial Intelligence"</li>
                <li><span className="font-semibold">Khác biệt số ít / số nhiều:</span> "neural network" ➔ "neural networks"</li>
                <li><span className="font-semibold">Khác biệt ngôn ngữ (Đồng nghĩa):</span> "Trí tuệ nhân tạo" ➔ "Artificial Intelligence"</li>
              </ul>
            </div>
            <div className="border-t border-warning/20 pt-2">
              <p className="font-bold flex items-center gap-1.5">⚠️ Lưu ý hệ quả:</p>
              <ul className="list-disc list-inside mt-1.5 space-y-1 opacity-90">
                <li>Toàn bộ bài viết thuộc từ khóa nguồn sẽ chuyển sang từ khóa đích.</li>
                <li>Người dùng đang theo dõi từ khóa nguồn sẽ tự động chuyển sang theo dõi từ khóa đích.</li>
                <li>Dữ liệu biểu đồ xu hướng sẽ được tự động cộng dồn và tính toán lại.</li>
              </ul>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative">
            {/* Cột 1: Từ khóa Đích (Target) */}
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
                    <span className="text-xs text-on-surface-variant">({item.papers_count} bài)</span>
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

            {/* Icon hướng gộp ở giữa */}
            <div className="hidden md:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/5 border border-white/10 items-center justify-center pointer-events-none">
              <ArrowRight className="w-4 h-4 text-on-surface-variant" />
            </div>

            {/* Cột 2: Từ khóa Nguồn (Sources) */}
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
                    <span className="text-xs text-on-surface-variant">({item.papers_count} bài)</span>
                  </>
                )}
              />

              <div className="space-y-2 mt-2">
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
              Lý do gộp <span className="font-normal normal-case text-on-surface-variant/60">(không bắt buộc)</span>
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

          <div className="pt-4 flex justify-end gap-3 border-t border-white/5 flex-shrink-0">
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
              disabled={isSubmitting || !targetKeyword || sourceKeywords.length === 0}
              className="px-5 py-2.5 rounded-xl bg-error text-white hover:bg-error/80 font-bold text-xs uppercase tracking-wider hover:shadow-lg hover:shadow-error/30 transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isSubmitting ? (
                "Đang xử lý..."
              ) : (
                <>
                  <Trash2 className="w-4 h-4" /> Tiến hành gộp
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
