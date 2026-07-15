import React, { useState, useEffect } from "react";
import { Settings, Play, Edit2, Trash2, Loader2, Info } from "lucide-react";
import { ApiSource } from "../../types";
import { api } from "@/src/lib/api";

type SyncParams = {
  domain: string;
  field: string;
  pages: number;
  yearFrom: string;
  yearTo: string;
  startPage: number;
};

type ApiSourcesListProps = {
  sources: ApiSource[];
  loadingSources: boolean;
  syncParams: Record<number, SyncParams>;
  loadingSyncSourceId: number | null;
  handleParamChange: (sourceId: number, field: string, value: any) => void;
  handleOpenEditModal: (source: ApiSource) => void;
  handleDeleteSource: (id: number, name: string) => void;
  handleTriggerSync: (sourceId: number, sourceName: string) => void;
};

export default function ApiSourcesList({
  sources,
  loadingSources,
  syncParams,
  loadingSyncSourceId,
  handleParamChange,
  handleOpenEditModal,
  handleDeleteSource,
  handleTriggerSync,
}: ApiSourcesListProps) {
  const [activeSuggestSourceId, setActiveSuggestSourceId] = useState<number | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [touchedSources, setTouchedSources] = useState<Record<number, boolean>>({});

  const fetchSuggestions = async (q: string) => {
    setLoadingSuggestions(true);
    try {
      const response = await api.get<{ data: { name: string }[] }>(`/keywords?q=${encodeURIComponent(q)}&per_page=8`);
      if (response && response.data) {
        setSuggestions(response.data.map(k => k.name));
      } else {
        setSuggestions([]);
      }
    } catch (err) {
      setSuggestions([]);
    } finally {
      setLoadingSuggestions(false);
    }
  };

  const activeKeyword = activeSuggestSourceId !== null ? (syncParams[activeSuggestSourceId]?.field || "") : "";

  useEffect(() => {
    if (activeSuggestSourceId === null) return;
    const delayDebounce = setTimeout(() => {
      fetchSuggestions(activeKeyword);
    }, 300);
    return () => clearTimeout(delayDebounce);
  }, [activeKeyword, activeSuggestSourceId]);

  const handleInputBlur = (sourceId: number) => {
    setTimeout(() => {
      setActiveSuggestSourceId(null);
    }, 200);
  };

  const handleSelectSuggestion = (sourceId: number, value: string) => {
    handleParamChange(sourceId, "field", value);
    setActiveSuggestSourceId(null);
  };
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
            const params = syncParams[source.id] || { domain: "Computer Science", field: "", pages: 50, yearFrom: "2023", yearTo: "2026", startPage: 1 };
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
                        className="w-full px-3 py-2 text-xs rounded-lg bg-surface-container border border-outline text-on-surface-variant cursor-not-allowed outline-none"
                      />
                    </div>

                    <div className="space-y-1 relative">
                      <div className="flex items-center gap-1.5">
                        <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Từ khóa</label>
                        <div className="relative group/tooltip flex items-center justify-center">
                          <Info className="w-3.5 h-3.5 text-on-surface-variant/70 cursor-help hover:text-primary transition-colors" />
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-2.5 bg-surface border border-outline-variant/30 rounded-lg shadow-xl opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all duration-200 z-50 text-[10px] text-on-surface-variant leading-relaxed pointer-events-none">
                            💡 <span className="font-semibold text-primary">Lưu ý:</span> Nếu không chọn hoặc nhập từ khóa, hệ thống sẽ tải theo nguyên tắc: từ các khái niệm hàng đầu đến bài báo được trích dẫn nhiều nhất và các bài báo gần đây mà không cần lọc theo từ khóa.
                          </div>
                        </div>
                      </div>
                      <input
                        type="text"
                        value={params.field}
                        onFocus={() => {
                          setActiveSuggestSourceId(source.id);
                          setTouchedSources(prev => ({ ...prev, [source.id]: true }));
                        }}
                        onBlur={() => handleInputBlur(source.id)}
                        onChange={(e) => handleParamChange(source.id, "field", e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-lg bg-surface-container border border-outline text-on-surface outline-none focus:border-primary/50"
                        placeholder="Ví dụ: deep learning, machine learning..."
                      />

                      {/* Autocomplete Dropdown */}
                      {activeSuggestSourceId === source.id && (suggestions.length > 0 || loadingSuggestions) && (
                        <div className="absolute left-0 right-0 top-full mt-1.5 z-20 rounded-xl border border-white/10 bg-surface/95 backdrop-blur-md shadow-2xl overflow-hidden max-h-48 overflow-y-auto custom-scrollbar animate-in fade-in slide-in-from-top-2 duration-150">
                          {loadingSuggestions && suggestions.length === 0 ? (
                            <div className="p-3 text-[11px] text-on-surface-variant flex items-center gap-2">
                              <Loader2 className="w-3 h-3 animate-spin text-primary" />
                              Đang tải gợi ý...
                            </div>
                          ) : (
                            <div className="py-1">
                              {suggestions.map((suggestion, index) => (
                                <button
                                  key={index}
                                  type="button"
                                  onClick={() => handleSelectSuggestion(source.id, suggestion)}
                                  className="w-full text-left px-4 py-2 text-xs text-on-surface hover:bg-primary/10 transition-colors font-medium cursor-pointer"
                                >
                                  {suggestion}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Khoảng năm xuất bản</label>
                      <div className="flex items-center gap-2">
                        <select
                          value={params.yearFrom}
                          onChange={(e) => handleParamChange(source.id, "yearFrom", e.target.value)}
                          className="flex-1 px-3 py-[9px] text-xs rounded-lg bg-surface-container border border-outline text-on-surface outline-none focus:border-primary/50 cursor-pointer"
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
                          className="flex-1 px-3 py-[9px] text-xs rounded-lg bg-surface-container border border-outline text-on-surface outline-none focus:border-primary/50 cursor-pointer"
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
                        className="w-full px-3 py-[9px] text-xs rounded-lg bg-surface-container border border-outline text-on-surface outline-none focus:border-primary/50 cursor-pointer"
                      >
                        <option value="25" className="bg-surface text-on-surface">25 bài</option>
                        <option value="50" className="bg-surface text-on-surface">50 bài</option>
                        <option value="100" className="bg-surface text-on-surface">100 bài</option>
                        <option value="125" className="bg-surface text-on-surface">125 bài</option>
                        <option value="150" className="bg-surface text-on-surface">150 bài</option>
                        <option value="200" className="bg-surface text-on-surface">200 bài</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Trang bắt đầu</label>
                      <input
                        type="number"
                        min="1"
                        max="1000"
                        value={params.startPage || 1}
                        onChange={(e) => handleParamChange(source.id, "startPage", Math.max(1, parseInt(e.target.value) || 1))}
                        className="w-full px-3 py-2 text-xs rounded-lg bg-surface-container border border-outline text-on-surface outline-none focus:border-primary/50"
                      />
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      handleTriggerSync(source.id, source.name);
                    }}
                    disabled={loadingSyncSourceId !== null}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary text-on-primary font-bold text-xs uppercase tracking-widest hover:bg-primary-container transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loadingSyncSourceId === source.id ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" /> Đang kích hoạt...
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4" /> Thực hiện đồng bộ ngay
                      </>
                    )}
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
