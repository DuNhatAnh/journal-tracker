import React from "react";
import { Search, User, Book } from "lucide-react";
import { cn } from "@/src/lib/utils";
import { AutocompleteInput } from "@/src/components/ui/AutocompleteInput";

interface SearchHeaderProps {
  searchInput: string;
  setSearchInput: (val: string) => void;
  onSearchSubmit: () => void;
  topKeywords: any[];
  keyword: string;
  onKeywordToggle: (keywordName: string) => void;
  sort: string;
  onSortChange: (sortVal: string) => void;
  totalResults: number;
  q: string;
  fetchGlobalSuggestions: (query: string) => Promise<any[]>;
  onSelectSuggestion: (item: any) => void;
}

export function SearchHeader({
  searchInput,
  setSearchInput,
  onSearchSubmit,
  topKeywords,
  keyword,
  onKeywordToggle,
  sort,
  onSortChange,
  totalResults,
  q,
  fetchGlobalSuggestions,
  onSelectSuggestion,
}: SearchHeaderProps) {
  const selectedKeywords = keyword
    .split(",")
    .map((k) => k.trim())
    .filter(Boolean);

  return (
    <header className="bg-transparent">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs font-semibold text-primary mb-2">
            Tìm thấy {totalResults.toLocaleString()} bài báo khoa học
          </div>
          {q ? (
            <h2 className="font-display text-3xl font-bold">
              Kết quả cho <span className="gradient-text">"{q}"</span>
            </h2>
          ) : (
            <h2 className="font-display text-3xl font-bold">
              Khám phá <span className="gradient-text">bài báo mới nhất</span>
            </h2>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
            SẮP XẾP:
          </span>
          <select
            value={sort}
            onChange={(e) => onSortChange(e.target.value)}
            className="bg-transparent border-none text-xs font-bold text-primary focus:ring-0 outline-none"
          >
            <option value="relevance">Độ liên quan / Mới nhất</option>
            <option value="citations">Trích dẫn nhiều nhất</option>
          </select>
        </div>
      </div>

      <div className="w-full z-20">
        <AutocompleteInput
          value={searchInput}
          onChange={setSearchInput}
          icon={<Search className="w-4 h-4" />}
          placeholder='Tìm kiếm (Hỗ trợ AND, OR, NOT, "cụm từ") hoặc nhập để tìm...'
          fetchSuggestions={fetchGlobalSuggestions}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              onSearchSubmit();
            }
          }}
          onSelect={(item) => {
            onSelectSuggestion(item);
          }}
          renderSuggestion={(item) => {
            if (item._type === "keyword") {
              return (
                <>
                  <span className="font-medium text-on-surface flex items-center gap-2">
                    <span className="text-secondary">#</span> {item.name}
                  </span>
                  <span className="text-xs text-on-surface-variant bg-surface-container px-2 py-0.5 rounded-full">
                    Chủ đề
                  </span>
                </>
              );
            }
            if (item._type === "author") {
              return (
                <>
                  <span className="font-medium text-on-surface flex items-center gap-2">
                    <User className="w-3.5 h-3.5 text-primary" /> {item.name}
                  </span>
                  <span className="text-xs text-on-surface-variant bg-surface-container px-2 py-0.5 rounded-full">
                    Tác giả
                  </span>
                </>
              );
            }
            return (
              <>
                <span className="font-medium text-on-surface flex items-center gap-2">
                  <Book className="w-3.5 h-3.5 text-tertiary" /> {item.name}
                </span>
                <span className="text-xs text-on-surface-variant bg-surface-container px-2 py-0.5 rounded-full">
                  Tạp chí
                </span>
              </>
            );
          }}
          footer={
            <button
              onClick={onSearchSubmit}
              className="w-full text-left px-4 py-2.5 hover:bg-white/5 text-sm flex items-center gap-2 text-primary font-medium"
            >
              <Search className="w-4 h-4" /> Tìm kiếm "{searchInput}" trong toàn bộ dữ liệu
            </button>
          }
        />
      </div>

      {/* Quick Suggestions for Topics */}
      {topKeywords.length > 0 && (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mr-2">
            GỢI Ý NHANH:
          </span>
          {topKeywords.slice(0, 5).map((kw) => {
            const isSelected = selectedKeywords.includes(kw.name);
            return (
              <button
                key={kw.id}
                onClick={() => onKeywordToggle(kw.name)}
                className={cn(
                  "text-xs px-3 py-1.5 rounded-full border transition-all flex items-center gap-1.5",
                  isSelected
                    ? "bg-primary/20 border-primary text-primary"
                    : "bg-surface-container border-white/10 hover:border-primary/50 hover:text-primary text-on-surface-variant"
                )}
              >
                #{kw.name} <span className="opacity-50">({kw.papers_count})</span>
              </button>
            );
          })}
        </div>
      )}
    </header>
  );
}
