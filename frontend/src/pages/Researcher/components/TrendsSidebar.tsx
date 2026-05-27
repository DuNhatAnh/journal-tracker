import { useState } from "react";
import { Search, Tag, Loader2 } from "lucide-react";
import { cn } from "@/src/lib/utils";
import { api } from "@/src/lib/api";

interface TrendingTopic {
  id: number;
  keyword_id: number;
  paper_count: number;
  growth_rate: number;
  keyword?: { id: number; name: string };
}

interface CoOccurringKeyword {
  id: number;
  name: string;
  count: number;
}

interface TrendsSidebarProps {
  trendingList: TrendingTopic[];
  selectedKeywordId: number | null;
  onSelectKeyword: (keywordId: number) => void;
  coOccurringKeywords: CoOccurringKeyword[];
  loading?: boolean;
}

export function TrendsSidebar({
  trendingList,
  selectedKeywordId,
  onSelectKeyword,
  coOccurringKeywords,
  loading
}: TrendsSidebarProps) {
  const [keywordSearchQuery, setKeywordSearchQuery] = useState("");
  const [keywordSearchResults, setKeywordSearchResults] = useState<any[]>([]);
  const [isKeywordSearching, setIsKeywordSearching] = useState(false);

  // Search keyword in database
  const handleKeywordSearch = async (val: string) => {
    setKeywordSearchQuery(val);
    if (!val.trim()) {
      setKeywordSearchResults([]);
      return;
    }
    setIsKeywordSearching(true);
    try {
      const res = await api.get<any>(`/keywords?q=${encodeURIComponent(val)}`);
      setKeywordSearchResults(res.data || []);
    } catch (err) {
      console.error("Lỗi tìm kiếm từ khóa:", err);
    } finally {
      setIsKeywordSearching(false);
    }
  };

  if (loading) {
    return (
      <div className="lg:col-span-4 space-y-6">
        <div className="glass-panel p-6 rounded-2xl flex flex-col min-h-[500px] animate-pulse border border-white/5">
          <div className="space-y-2 mb-6">
            <div className="h-6 w-44 bg-white/15 rounded" />
            <div className="h-3.5 w-64 bg-white/10 rounded mt-1" />
          </div>
          
          <div className="h-10 w-full bg-white/5 border border-white/10 rounded-xl mb-6" />
          
          <div className="flex-1 flex flex-col gap-4">
            <div className="h-3 w-36 bg-white/10 rounded mb-1" />
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-[68px] bg-white/5 border border-white/10 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="lg:col-span-4 space-y-6">
      <div className="glass-panel p-6 rounded-2xl flex flex-col min-h-[500px]">
        <div className="space-y-1 mb-6">
          <h3 className="font-display text-xl font-bold">Tìm kiếm & Xu hướng</h3>
          <p className="text-xs text-on-surface-variant">Chọn từ danh mục mới nổi hoặc tìm kiếm từ khóa học thuật tùy chỉnh.</p>
        </div>
        
        {/* Custom Keyword Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-outline" />
          <input 
            type="text"
            value={keywordSearchQuery}
            onChange={(e) => handleKeywordSearch(e.target.value)}
            placeholder="Tìm kiếm chủ đề khác..."
            className="w-full bg-surface-container/60 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-xs text-on-surface focus:outline-none focus:border-primary/50 transition-all placeholder:text-outline-variant"
          />
          {keywordSearchResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-surface-container border border-white/10 rounded-xl max-h-48 overflow-y-auto z-30 shadow-2xl">
              {keywordSearchResults.map(kw => (
                <div 
                  key={`search-kw-${kw.id}`}
                  onClick={() => {
                    onSelectKeyword(kw.id);
                    setKeywordSearchQuery("");
                    setKeywordSearchResults([]);
                  }}
                  className="px-4 py-2 hover:bg-white/5 cursor-pointer text-xs font-bold truncate text-on-surface"
                >
                  #{kw.name} <span className="text-[10px] text-on-surface-variant font-normal">({kw.papers_count} bài)</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Topic list */}
        <div className="flex-1 flex flex-col gap-4">
          <span className="text-[9px] font-bold text-on-surface-variant uppercase tracking-widest mb-1 block">Thực thể mới nổi hot nhất</span>
          {trendingList.map((item) => {
            const isActive = item.keyword_id === selectedKeywordId;
            return (
              <div 
                key={item.id} 
                onClick={() => onSelectKeyword(item.keyword_id)}
                className={cn(
                  "p-4 rounded-xl border-2 flex justify-between items-center cursor-pointer transition-all hover:bg-white/5 select-none",
                  isActive 
                    ? "border-primary bg-primary/5 shadow-[0_0_12px_rgba(59,130,246,0.15)]" 
                    : "border-outline-variant/20 bg-surface-container/20"
                )}
              >
                <div className="flex-1 min-w-0 pr-2">
                  <span className={cn("text-sm font-bold truncate block", isActive ? "text-primary" : "text-on-surface")}>
                    {item.keyword?.name || "Chủ đề"}
                  </span>
                  <span className="text-[10px] text-on-surface-variant font-mono block mt-0.5">
                    Lượng xuất bản năm nay: {item.paper_count}
                  </span>
                </div>
                <span className="bg-tertiary-container/10 text-tertiary text-[10px] font-bold px-2 py-0.5 rounded border border-tertiary/20 flex items-center gap-0.5">
                  {item.growth_rate >= 0 ? `+${item.growth_rate}` : item.growth_rate}%
                </span>
              </div>
            );
          })}
          {trendingList.length === 0 && (
            <p className="text-xs text-on-surface-variant text-center py-8 font-mono">Chưa có dữ liệu xu hướng.</p>
          )}
        </div>
      </div>

      {/* Sub-topics (Keyword co-occurrence) */}
      {coOccurringKeywords.length > 0 && (
        <div className="glass-panel p-6 rounded-2xl space-y-4">
          <div className="space-y-1">
            <h3 className="font-display text-sm font-bold flex items-center gap-2 text-on-surface">
              <Tag className="w-4 h-4 text-secondary" /> Chủ đề con đồng xuất hiện
            </h3>
            <p className="text-[10px] text-on-surface-variant">Các từ khóa thường đi kèm trong các công bố xuất sắc.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {coOccurringKeywords.map(kw => (
              <button 
                key={`co-${kw.id}`}
                onClick={() => onSelectKeyword(kw.id)}
                className="px-2.5 py-1.5 rounded-xl bg-secondary-container/20 text-secondary border border-secondary/30 hover:border-secondary hover:bg-secondary-container/30 transition-all text-xs flex items-center gap-1.5 font-bold"
              >
                #{kw.name} <span className="opacity-60 text-[9px]">({kw.count})</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
