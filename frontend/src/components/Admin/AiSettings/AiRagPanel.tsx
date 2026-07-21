import React, { memo } from "react";
import { Database, Play, Loader2, XCircle } from "lucide-react";

interface IndexingStats {
  total_papers: number;
  chunked_papers: number;
  unchunked_papers: number;
  total_chunks?: number;
  recent_activities?: { time: string, message: string, type: string }[];
  is_running?: boolean;
}

interface Props {
  indexingStats: IndexingStats | null;
  indexing: boolean;
  handleStartIndexing: () => void;
  handleStopIndexing: () => void;
  autoRefresh: boolean;
  setAutoRefresh: (val: boolean) => void;
  loading: boolean;
  onOpenChunkViewer?: () => void;
}

export const AiRagPanel = memo(function AiRagPanel({
  indexingStats, indexing,
  handleStartIndexing, handleStopIndexing, autoRefresh, setAutoRefresh, loading, onOpenChunkViewer
}: Props) {
  if (!indexingStats) return null;

  return (
    <div className="glass-panel p-6 rounded-2xl border border-outline-variant/30 flex flex-col h-full space-y-6">
      <div>
        <h2 className="text-lg font-bold text-on-surface flex items-center gap-2">
          <Database className="w-5 h-5 text-primary" /> Quản lý Dữ liệu RAG
        </h2>
        <p className="text-sm text-on-surface-variant mt-1">
          Tiến độ cắt bài báo thành các Chunk để nhúng Vector (AI Search).
        </p>
      </div>

      <div className="space-y-4">
        <div className="flex justify-between items-center text-sm">
          <span className="text-on-surface-variant">Tổng số bài báo gốc:</span>
          <span className="font-bold text-on-surface">{indexingStats.total_papers}</span>
        </div>
        <div className="flex justify-between items-center text-sm">
          <span className="text-on-surface-variant">Tổng số Chunks (đoạn nhỏ):</span>
          <span className="font-bold text-on-surface">{indexingStats.total_chunks || 0}</span>
        </div>
        <div className="flex justify-between items-center text-sm">
          <span className="text-green-500">Đã cắt thành công:</span>
          <div className="flex items-center gap-3">
            <span className="font-bold text-green-500">{indexingStats.chunked_papers}</span>
            <button 
              onClick={onOpenChunkViewer}
              className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-md hover:bg-primary/20 transition-colors font-medium"
            >
              Xem dữ liệu Vector
            </button>
          </div>
        </div>
        <div className="flex justify-between items-center text-sm">
          <span className="text-orange-500">Chưa được cắt:</span>
          <span className="font-bold text-orange-500">{indexingStats.unchunked_papers}</span>
        </div>

        <div className="w-full bg-surface-container rounded-full h-2.5 mt-2 overflow-hidden">
          <div
            className="bg-primary h-2.5 rounded-full transition-all duration-500"
            style={{ width: `${Math.min(100, (indexingStats.chunked_papers / Math.max(1, indexingStats.total_papers)) * 100)}%` }}
          ></div>
        </div>
      </div>

      <div className="pt-4 border-t border-outline-variant/20 space-y-3 mt-auto">
        <button
          onClick={handleStartIndexing}
          disabled={indexing || indexingStats.unchunked_papers === 0}
          className="w-full py-3 rounded-xl border-2 border-primary text-primary font-bold hover:bg-primary/10 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {indexing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
          {indexingStats.unchunked_papers === 0 ? "Đã cắt toàn bộ" : "Bắt đầu cắt (Chạy ngầm)"}
        </button>
        <button
          onClick={handleStopIndexing}
          disabled={indexing || !indexingStats.is_running}
          className="w-full py-3 rounded-xl border-2 border-error text-error font-bold hover:bg-error/10 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {indexing ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
          Hủy tiến trình (Xóa Hàng Đợi)
        </button>
        <button
          onClick={() => setAutoRefresh(!autoRefresh)}
          disabled={loading || indexingStats.unchunked_papers === 0}
          className="w-full py-2 text-sm text-primary hover:underline font-medium flex items-center justify-center gap-2"
        >
          {autoRefresh ? (
            <>
              <Loader2 className="w-3 h-3 animate-spin" /> Đang tự động làm mới... (Bấm để Dừng)
            </>
          ) : (
            "Bật tự động làm mới số liệu (3s)"
          )}
        </button>
      </div>

    </div>
  );
});
