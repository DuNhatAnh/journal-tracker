import React, { useState } from "react";
import { Filter, History, Info, X, User, Book } from "lucide-react";
import { AutocompleteInput } from "@/src/components/ui/AutocompleteInput";
import { api } from "@/src/lib/api";

interface SearchFiltersProps {
  year: string;
  setYear: (y: string) => void;
  author: string;
  setAuthor: (a: string) => void;
  journal: string;
  setJournal: (j: string) => void;
  keyword: string;
  setKeyword: (k: string) => void;
  history: string[];
  onSearchFromHistory: (query: string) => void;
  onResetFilters: () => void;
  onApplyFilters: () => void;
  fetchAuthorSuggestions: (query: string) => Promise<any[]>;
  fetchJournalSuggestions: (query: string) => Promise<any[]>;
}

export function SearchFilters({
  year,
  setYear,
  author,
  setAuthor,
  journal,
  setJournal,
  keyword,
  setKeyword,
  history,
  onSearchFromHistory,
  onResetFilters,
  onApplyFilters,
  fetchAuthorSuggestions,
  fetchJournalSuggestions,
}: SearchFiltersProps) {
  const [keywordInput, setKeywordInput] = useState("");

  const fetchKeywordSuggestions = async (query: string) => {
    try {
      const res = await api.get<{ data: any[] }>(
        `/keywords?q=${encodeURIComponent(query)}&per_page=5`
      );
      return res.data || [];
    } catch {
      return [];
    }
  };

  const handleKeywordSelect = (item: any) => {
    let currentKws = keyword
      .split(",")
      .map((k) => k.trim())
      .filter(Boolean);
    if (!currentKws.includes(item.name)) {
      currentKws.push(item.name);
    }
    setKeyword(currentKws.join(","));
    setKeywordInput("");
  };

  const handleRemoveKeyword = (kwName: string) => {
    let currentKws = keyword
      .split(",")
      .map((k) => k.trim())
      .filter(Boolean);
    currentKws = currentKws.filter((k) => k !== kwName);
    setKeyword(currentKws.join(","));
  };

  return (
    <aside className="lg:col-span-3 space-y-6 sticky top-[100px] self-start order-2 lg:order-2">
      <div className="glass-panel p-6 rounded-2xl space-y-8">
        <div className="flex justify-between items-center">
          <h3 className="font-display font-bold text-lg flex items-center gap-2">
            <Filter className="w-4 h-4 text-primary" /> BỘ LỌC
          </h3>
          <button
            onClick={onResetFilters}
            className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant hover:text-primary transition-colors"
          >
            ĐẶT LẠI
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <h4 className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-2">
              NĂM XUẤT BẢN
            </h4>
            <select
              value={year}
              onChange={(e) => setYear(e.target.value)}
              className="w-full bg-surface-container-high border border-white/10 rounded-full p-2.5 px-4 text-sm outline-none focus:border-primary/50"
            >
              <option value="">Tất cả các năm</option>
              {[2024, 2023, 2022, 2021, 2020, 2019, 2018].map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>

          <div>
            <h4 className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-2">
              TÁC GIẢ
            </h4>
            <AutocompleteInput
              value={author}
              onChange={setAuthor}
              fetchSuggestions={fetchAuthorSuggestions}
              placeholder="Nhập tên tác giả..."
              inputClassName="pl-4 bg-surface-container-high"
              onSelect={(item) => {
                setAuthor(item.name);
              }}
              renderSuggestion={(item) => (
                <span className="font-medium text-on-surface flex items-center gap-2">
                  <User className="w-3.5 h-3.5 text-primary" /> {item.name}
                </span>
              )}
            />
          </div>

          <div>
            <h4 className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-2">
              TẠP CHÍ
            </h4>
            <AutocompleteInput
              value={journal}
              onChange={setJournal}
              fetchSuggestions={fetchJournalSuggestions}
              placeholder="Nhập tên tạp chí..."
              inputClassName="pl-4 bg-surface-container-high"
              onSelect={(item) => {
                setJournal(item.name);
              }}
              renderSuggestion={(item) => (
                <span className="font-medium text-on-surface flex items-center gap-2">
                  <Book className="w-3.5 h-3.5 text-tertiary" /> {item.name}
                </span>
              )}
            />
          </div>

          <div>
            <h4 className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-3">
              CHỦ ĐỀ TỪ KHÓA
            </h4>
            <AutocompleteInput
              value={keywordInput}
              onChange={setKeywordInput}
              fetchSuggestions={fetchKeywordSuggestions}
              placeholder="Tìm và thêm chủ đề..."
              inputClassName="pl-4 bg-surface-container-high mb-3"
              onSelect={handleKeywordSelect}
              renderSuggestion={(item) => (
                <span className="font-medium text-on-surface flex items-center justify-between w-full">
                  <span>
                    <span className="text-secondary">#</span> {item.name}
                  </span>
                  <span className="text-xs text-on-surface-variant">
                    {item.papers_count}
                  </span>
                </span>
              )}
            />
            <div
              className="flex flex-wrap gap-2 max-h-48 overflow-y-auto"
              style={{ scrollbarWidth: "thin" }}
            >
              {keyword
                .split(",")
                .map((k) => k.trim())
                .filter(Boolean)
                .map((kwName) => (
                  <button
                    key={kwName}
                    onClick={() => handleRemoveKeyword(kwName)}
                    className="text-xs px-2.5 py-1.5 rounded-lg border bg-primary/20 border-primary text-primary transition-all text-left flex items-center gap-1.5 group"
                  >
                    {kwName} <X className="w-3 h-3 group-hover:text-error" />
                  </button>
                ))}
            </div>
          </div>

          <button
            onClick={onApplyFilters}
            className="w-full py-2.5 bg-primary text-white text-xs font-bold rounded-full hover:bg-primary/90 transition shadow-[0_0_15px_rgba(37,99,235,0.3)]"
          >
            ÁP DỤNG LỌC
          </button>
        </div>

        <div className="space-y-4 pt-4 border-t border-white/5">
          <h4 className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant flex items-center gap-2">
            <History className="w-3 h-3" /> LỊCH SỬ TÌM KIẾM
          </h4>
          {history.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {history.map((h, i) => (
                <button
                  key={i}
                  onClick={() => onSearchFromHistory(h)}
                  className="px-2 py-1 bg-surface-container-high border border-white/5 rounded text-xs text-on-surface-variant hover:text-primary hover:border-primary/30 transition-all text-left"
                >
                  {h}
                </button>
              ))}
            </div>
          ) : (
            <p className="text-xs text-on-surface-variant">Chưa có lịch sử</p>
          )}
        </div>

        <div className="space-y-4 pt-4 border-t border-white/5">
          <h4 className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant flex items-center gap-2 text-tertiary">
            <Info className="w-3 h-3" /> MẸO BOOLEAN
          </h4>
          <ul className="text-xs text-on-surface-variant space-y-2 leading-relaxed">
            <li>
              <strong className="text-on-surface">"Cụm từ"</strong>: Tìm chính xác cụm
              từ.
            </li>
            <li>
              <strong className="text-tertiary">AND</strong>: Chứa cả hai từ khóa.
            </li>
            <li>
              <strong className="text-tertiary">OR</strong>: Chứa một trong hai.
            </li>
            <li>
              <strong className="text-error">NOT</strong>: Loại trừ từ khóa.
            </li>
          </ul>
        </div>
      </div>
    </aside>
  );
}
