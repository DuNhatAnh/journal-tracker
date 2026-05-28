import { CheckCircle2, Trash2 } from "lucide-react";

interface NotificationHeaderProps {
  onMarkAllRead: () => void;
  disableMarkAll: boolean;
  onDeleteRead: () => void;
  disableDeleteRead: boolean;
  
  selectionMode: boolean;
  selectedCount: number;
  onToggleSelectionMode: () => void;
  onDeleteSelected: () => void;
  onSelectAll?: () => void;
}

export function NotificationHeader({
  onMarkAllRead,
  disableMarkAll,
  onDeleteRead,
  disableDeleteRead,
  selectionMode,
  selectedCount,
  onToggleSelectionMode,
  onDeleteSelected,
  onSelectAll
}: NotificationHeaderProps) {
  return (
    <header className="flex flex-col md:flex-row justify-between items-start md:items-end border-b border-white/5 pb-8 gap-4">
      <div>
        <h2 className="font-display text-4xl font-bold text-on-surface">Thông báo</h2>
        <p className="text-on-surface-variant mt-2 font-medium">Cập nhật các xu hướng nghiên cứu mới nhất và cảnh báo hệ thống.</p>
      </div>
      <div className="flex flex-wrap gap-3">
        {selectionMode ? (
          <>
            <button
              onClick={onSelectAll}
              className="px-5 py-2.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-widest hover:bg-primary/20 transition-all"
            >
              Chọn tất cả
            </button>
            <button
              onClick={onToggleSelectionMode}
              className="px-5 py-2.5 rounded-full bg-white/5 text-on-surface text-[10px] font-bold uppercase tracking-widest hover:bg-white/10 transition-all"
            >
              Hủy chọn
            </button>
            <button
              onClick={onDeleteSelected}
              disabled={selectedCount === 0}
              className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-error text-white text-[10px] font-bold uppercase tracking-widest hover:bg-error/90 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-error/25"
            >
              <Trash2 className="w-4 h-4" /> Xóa {selectedCount > 0 ? `${selectedCount} mục` : ""}
            </button>
          </>
        ) : (
          <>
            <button
              onClick={onMarkAllRead}
              disabled={disableMarkAll}
              className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-widest hover:bg-primary/20 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <CheckCircle2 className="w-4 h-4" /> Đánh dấu tất cả đã đọc
            </button>
            <button
              onClick={onToggleSelectionMode}
              disabled={disableDeleteRead}
              className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-surface-container-high border border-white/10 text-on-surface text-[10px] font-bold uppercase tracking-widest hover:bg-white/10 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <CheckCircle2 className="w-4 h-4" /> Chọn nhiều
            </button>
            <button
              onClick={onDeleteRead}
              disabled={disableDeleteRead}
              className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-error/10 text-error text-[10px] font-bold uppercase tracking-widest hover:bg-error/20 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Trash2 className="w-4 h-4" /> Xóa tin đã đọc
            </button>
          </>
        )}
      </div>
    </header>
  );
}
