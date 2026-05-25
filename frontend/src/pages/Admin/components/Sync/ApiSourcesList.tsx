import React from "react";
import { Settings, Play, Edit2, Trash2 } from "lucide-react";
import { ApiSource } from "../../types";

type SyncParams = {
  domain: string;
  field: string;
  pages: number;
  yearFrom: string;
  yearTo: string;
};

type ApiSourcesListProps = {
  sources: ApiSource[];
  loadingSources: boolean;
  syncParams: Record<number, SyncParams>;
  handleParamChange: (sourceId: number, field: string, value: any) => void;
  handleOpenEditModal: (source: ApiSource) => void;
  handleDeleteSource: (id: number, name: string) => void;
  handleTriggerSync: (sourceId: number, sourceName: string) => void;
};

export default function ApiSourcesList({
  sources,
  loadingSources,
  syncParams,
  handleParamChange,
  handleOpenEditModal,
  handleDeleteSource,
  handleTriggerSync,
}: ApiSourcesListProps) {
  return (
    <div className="space-y-6">
      <h3 className="font-display text-xl font-bold flex items-center gap-3">
        <Settings className="w-5 h-5 text-primary" /> Nguồn dữ liệu kết nối
      </h3>

      {loadingSources ? (
        <div className="h-40 rounded-2xl bg-white/5 animate-pulse" />
      ) : sources.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-surface p-8 text-center text-on-surface-variant">
          Không có nguồn dữ liệu nào được đăng ký.
        </div>
      ) : (
        <div className="space-y-6">
          {sources.map((source) => {
            const params = syncParams[source.id] || { domain: "Computer Science", field: "", pages: 50, yearFrom: "2023", yearTo: "2026" };
            return (
              <div key={source.id} className="glass-panel p-6 rounded-2xl bg-surface space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-display text-lg font-bold text-on-surface flex items-center gap-2">
                      {source.name}
                      <span className="inline-block w-2.5 h-2.5 rounded-full bg-tertiary" />
                    </h4>
                    <span className="font-mono text-xs text-on-surface-variant break-all">{source.api_url}</span>
                    
                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={() => handleOpenEditModal(source)}
                        className="p-1.5 rounded-md text-on-surface-variant hover:text-primary hover:bg-primary/10 transition-colors"
                        title="Chỉnh sửa nguồn"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteSource(source.id, source.name)}
                        className="p-1.5 rounded-md text-on-surface-variant hover:text-error hover:bg-error/10 transition-colors"
                        title="Xóa nguồn"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  
                  {/* Active badge - display only, no toggle */}
                  <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold uppercase bg-tertiary/10 text-tertiary">
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-tertiary animate-pulse" />
                    Đang hoạt động
                  </span>
                </div>

                <div className="border-t border-white/5 pt-4 space-y-4">
                  <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Đồng bộ thủ công</p>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Lĩnh vực (Domain)</label>
                      <input
                        type="text"
                        value={params.domain}
                        disabled
                        title="Nguyên tắc hệ thống mới: Cập nhật mặc định Khóa luôn ở Khoa học máy tính"
                        className="w-full px-3 py-2 text-xs rounded-lg bg-surface-container border border-white/10 text-on-surface-variant cursor-not-allowed outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Từ khóa</label>
                      <input
                        type="text"
                        value={params.field}
                        onChange={(e) => handleParamChange(source.id, "field", e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-lg bg-white/5 border border-white/10 text-on-surface outline-none focus:border-primary/50"
                        placeholder="deep learning"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Khoảng năm xuất bản</label>
                      <div className="flex items-center gap-2">
                        <select
                          value={params.yearFrom}
                          onChange={(e) => handleParamChange(source.id, "yearFrom", e.target.value)}
                          className="flex-1 px-3 py-[9px] text-xs rounded-lg bg-white/5 border border-white/10 text-on-surface outline-none focus:border-primary/50 cursor-pointer"
                        >
                          {Array.from({ length: 15 }).map((_, i) => {
                            const y = 2026 - i;
                            return <option key={y} value={y} className="bg-surface text-on-surface">{y}</option>;
                          })}
                        </select>
                        <span className="text-on-surface-variant text-[10px] font-bold uppercase">đến</span>
                        <select
                          value={params.yearTo}
                          onChange={(e) => handleParamChange(source.id, "yearTo", e.target.value)}
                          className="flex-1 px-3 py-[9px] text-xs rounded-lg bg-white/5 border border-white/10 text-on-surface outline-none focus:border-primary/50 cursor-pointer"
                        >
                          {Array.from({ length: 15 }).map((_, i) => {
                            const y = 2026 - i;
                            return <option key={y} value={y} className="bg-surface text-on-surface">{y}</option>;
                          })}
                        </select>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Số lượng bài</label>
                      <select
                        value={params.pages}
                        onChange={(e) => handleParamChange(source.id, "pages", parseInt(e.target.value) || 50)}
                        className="w-full px-3 py-[9px] text-xs rounded-lg bg-white/5 border border-white/10 text-on-surface outline-none focus:border-primary/50 cursor-pointer"
                      >
                        <option value="50" className="bg-surface text-on-surface">50 bài</option>
                        <option value="100" className="bg-surface text-on-surface">100 bài</option>
                        <option value="150" className="bg-surface text-on-surface">150 bài</option>
                        <option value="200" className="bg-surface text-on-surface">200 bài</option>
                        <option value="300" className="bg-surface text-on-surface">300 bài</option>
                        <option value="500" className="bg-surface text-on-surface">500 bài</option>
                        <option value="1000" className="bg-surface text-on-surface">1000 bài</option>
                      </select>
                    </div>
                  </div>

                  <button
                    onClick={() => handleTriggerSync(source.id, source.name)}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary text-on-primary font-bold text-xs uppercase tracking-widest hover:bg-primary-container transition-all"
                  >
                    <Play className="w-4 h-4" /> Thực hiện đồng bộ ngay
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
