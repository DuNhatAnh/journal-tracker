import React from "react";
import { Search, User, Book, Bot, List, Network, UploadCloud, Loader2 } from "lucide-react";
import { cn } from "@/src/lib/utils";
import { AutocompleteInput } from "@/src/components/ui/AutocompleteInput";
import toast from "react-hot-toast";

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
  // New props
  searchMode: "keyword" | "semantic";
  onSearchModeChange: (mode: "keyword" | "semantic") => void;
  viewMode: "list" | "tree";
  onViewModeChange: (mode: "list" | "tree") => void;
  onDraftFileSelect?: (file: File) => void;
  draftLoading?: boolean;
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
  searchMode,
  onSearchModeChange,
  viewMode,
  onViewModeChange,
  onDraftFileSelect,
  draftLoading,
}: SearchHeaderProps) {
  const userStr = typeof window !== "undefined" ? localStorage.getItem("user") : null;
  const user = userStr ? JSON.parse(userStr) : null;
  const role = user?.role || "student";
  const isResearcher = role === "researcher" || role === "admin";

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== "text/plain" && file.type !== "application/pdf") {
        toast.error("Chỉ chấp nhận file định dạng .txt hoặc .pdf");
        return;
      }
      if (onDraftFileSelect) {
        onDraftFileSelect(file);
      }
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const selectedKeywords = keyword
    .split(",")
    .map((k) => k.trim())
    .filter(Boolean);

  return (
    <header className="bg-transparent">
      {/* Title Section */}
      <div className="w-full mb-5">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs font-semibold text-primary mb-2">
          {searchMode === "keyword" 
            ? `Tìm thấy ${totalResults.toLocaleString()} bài báo khoa học` 
            : "Kết quả đối chiếu ngữ nghĩa"}
        </div>
        {q ? (
          <h2 className="font-display text-3xl font-bold break-words">
            Kết quả cho <span className="gradient-text">"{q}"</span>
          </h2>
        ) : (
          <h2 className="font-display text-3xl font-bold">
            Khám phá <span className="gradient-text">bài báo khoa học</span>
          </h2>
        )}
      </div>
        
      {/* Controls Container */}
      <div className="flex flex-wrap items-center justify-start gap-3 w-full mb-4">
        {/* Tab 1: Search Mode Switcher (Only visible to researchers) */}
        {isResearcher && (
          <div className="flex gap-1.5 p-1 bg-surface-container rounded-2xl border border-outline-variant/30">
            <button
              type="button"
              onClick={() => onSearchModeChange("keyword")}
              className={cn(
                "py-1.5 px-3.5 rounded-xl text-[10px] font-black uppercase tracking-wide transition-all cursor-pointer flex items-center gap-1.5",
                searchMode === "keyword"
                  ? "bg-primary text-on-primary shadow-md"
                  : "text-on-surface-variant hover:text-on-surface"
              )}
            >
              <Search className="w-3.5 h-3.5" />
              Từ khóa
            </button>
            <button
              type="button"
              onClick={() => onSearchModeChange("semantic")}
              className={cn(
                "py-1.5 px-3.5 rounded-xl text-[10px] font-black uppercase tracking-wide transition-all cursor-pointer flex items-center gap-1.5",
                searchMode === "semantic"
                  ? "bg-primary text-on-primary shadow-md"
                  : "text-on-surface-variant hover:text-on-surface"
              )}
            >
              <Bot className="w-3.5 h-3.5" />
              Ngữ nghĩa
            </button>
          </div>
        )}

        {/* Upload draft button */}
        {isResearcher && searchMode === "semantic" && onDraftFileSelect && (
          <div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".txt,.pdf"
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={draftLoading}
              className="py-2 px-3.5 rounded-2xl text-[10px] font-black uppercase tracking-wide transition-all cursor-pointer flex items-center gap-1.5 bg-secondary hover:bg-secondary/90 text-white shadow-md disabled:opacity-50 active:scale-98"
            >
              {draftLoading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <UploadCloud className="w-3.5 h-3.5" />
              )}
              {draftLoading ? "Đang xử lý..." : "Tải nháp đối chiếu (PDF/TXT)"}
            </button>
          </div>
        )}

        {/* Tab 2: Layout Style Switcher OR Sorting select */}
        {(!isResearcher || searchMode === "keyword") ? (
          <div className="flex items-center gap-1.5 bg-surface-container py-1.5 px-3.5 rounded-2xl border border-outline-variant/30">
            <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mr-1">
              Sắp xếp:
            </span>
            <select
              value={sort}
              onChange={(e) => onSortChange(e.target.value)}
              className="bg-transparent border-none text-[10px] font-black uppercase tracking-wide text-primary focus:ring-0 outline-none cursor-pointer p-0"
            >
              <option value="relevance">Độ liên quan / Mới nhất</option>
              <option value="citations">Trích dẫn nhiều nhất</option>
            </select>
          </div>
        ) : (
          <div className="flex gap-1.5 p-1 bg-surface-container rounded-2xl border border-outline-variant/30">
            <button
              type="button"
              onClick={() => onViewModeChange("list")}
              className={cn(
                "py-1.5 px-3.5 rounded-xl text-[10px] font-black uppercase tracking-wide transition-all cursor-pointer flex items-center gap-1.5",
                viewMode === "list"
                  ? "bg-secondary text-on-secondary shadow-md"
                  : "text-on-surface-variant hover:text-on-surface"
              )}
            >
              <List className="w-3.5 h-3.5" />
              Danh sách
            </button>
            <button
              type="button"
              onClick={() => onViewModeChange("tree")}
              className={cn(
                "py-1.5 px-3.5 rounded-xl text-[10px] font-black uppercase tracking-wide transition-all cursor-pointer flex items-center gap-1.5",
                viewMode === "tree"
                  ? "bg-secondary text-on-secondary shadow-md"
                  : "text-on-surface-variant hover:text-on-surface"
              )}
            >
              <Network className="w-3.5 h-3.5" />
              Dạng cây
            </button>
          </div>
        )}
      </div>

      <div className="w-full z-20">
        <AutocompleteInput
          value={searchInput}
          onChange={setSearchInput}
          icon={<Search className="w-4 h-4" />}
          placeholder={
            searchMode === "semantic"
              ? "Nhập ý tưởng nghiên cứu, câu hỏi khoa học hoặc một đoạn abstract để đối chiếu ngữ nghĩa..."
              : 'Tìm kiếm (Hỗ trợ AND, OR, NOT, "cụm từ") hoặc nhập để tìm...'
          }
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
