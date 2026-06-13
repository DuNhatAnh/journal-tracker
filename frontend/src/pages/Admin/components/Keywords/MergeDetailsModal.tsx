import React, { useState, useEffect } from "react";
import { X, Loader2, GitMerge, Tag, FileText, Users, AlertTriangle } from "lucide-react";
import { api } from "@/src/lib/api";

interface MergeDetailsModalProps {
  keywordId: number | null;
  onClose: () => void;
}

interface MergeDetails {
  source: {
    id: number;
    name: string;
    slug: string;
  };
  target: {
    id: number;
    name: string;
    slug: string;
    current_papers_count: number;
  };
  merge_reason: string | null;
  papers_moved: number;
  users_moved: number;
  has_logs: boolean;
}

export default function MergeDetailsModal({ keywordId, onClose }: MergeDetailsModalProps) {
  const [loading, setLoading] = useState(true);
  const [details, setDetails] = useState<MergeDetails | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (keywordId) {
      loadDetails();
    }
  }, [keywordId]);

  const loadDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get(`/admin/keywords/${keywordId}/merge-details`);
      setDetails(res as any);
    } catch (error: any) {
      setError(error?.response?.data?.message || "Không thể tải chi tiết gộp.");
    } finally {
      setLoading(false);
    }
  };

  if (!keywordId) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-surface border border-white/10 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-white/[0.02]">
          <h3 className="text-lg font-bold text-on-surface flex items-center gap-2">
            <GitMerge className="w-5 h-5 text-secondary" />
            Chi tiết Lịch sử Gộp
          </h3>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-white/10 text-on-surface-variant transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-10 text-on-surface-variant">
              <Loader2 className="w-8 h-8 animate-spin text-secondary mb-4" />
              <p>Đang tải dữ liệu...</p>
            </div>
          ) : error ? (
            <div className="p-4 rounded-xl bg-error/10 border border-error/20 text-error flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <p className="text-sm">{error}</p>
            </div>
          ) : details ? (
            <div className="space-y-6">
              {/* Flow Source -> Target */}
              <div className="flex items-center justify-between gap-4 p-4 rounded-xl bg-white/[0.03] border border-white/5">
                <div className="flex-1 text-center">
                  <div className="text-xs text-on-surface-variant mb-1 uppercase font-bold tracking-wider">Từ khóa nguồn (Đã gộp)</div>
                  <div className="font-bold text-error text-lg truncate px-2" title={details.source.name}>
                    {details.source.name}
                  </div>
                  <div className="text-xs text-on-surface-variant mt-1">ID: {details.source.id}</div>
                </div>
                
                <div className="shrink-0 flex items-center justify-center">
                  <div className="w-10 h-10 rounded-full bg-secondary/20 flex items-center justify-center text-secondary">
                    <GitMerge className="w-5 h-5" />
                  </div>
                </div>

                <div className="flex-1 text-center">
                  <div className="text-xs text-on-surface-variant mb-1 uppercase font-bold tracking-wider">Từ khóa đích (Hiện tại)</div>
                  <div className="font-bold text-success text-lg truncate px-2" title={details.target.name}>
                    {details.target.name}
                  </div>
                  <div className="text-xs text-on-surface-variant mt-1">ID: {details.target.id}</div>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-primary/5 border border-primary/10">
                  <div className="flex items-center gap-2 text-primary mb-2">
                    <FileText className="w-4 h-4" />
                    <span className="font-bold text-sm">Bài viết đã chuyển</span>
                  </div>
                  <div className="text-2xl font-black text-on-surface">
                    {details.has_logs ? details.papers_moved : "Không rõ"}
                  </div>
                  {!details.has_logs && (
                    <p className="text-[10px] text-on-surface-variant mt-1">Gộp trước khi có hệ thống log</p>
                  )}
                </div>

                <div className="p-4 rounded-xl bg-tertiary/5 border border-tertiary/10">
                  <div className="flex items-center gap-2 text-tertiary mb-2">
                    <Tag className="w-4 h-4" />
                    <span className="font-bold text-sm">Tổng bài ở đích</span>
                  </div>
                  <div className="text-2xl font-black text-on-surface">
                    {details.target.current_papers_count}
                  </div>
                </div>
              </div>

              {/* Reason */}
              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
                <div className="text-xs text-on-surface-variant font-bold uppercase tracking-wider mb-2">Lý do gộp</div>
                <div className="text-sm text-on-surface leading-relaxed">
                  {details.merge_reason || <span className="italic text-on-surface-variant/50">Không có lý do được ghi lại.</span>}
                </div>
              </div>
            </div>
          ) : null}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-white/5 bg-white/[0.01] flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-on-surface font-bold transition-all"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
