import React, { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { Filter, ChevronLeft, ChevronRight, Bookmark, BookmarkPlus, Lock, Quote, History, Info, Loader2, Search as SearchIcon, X, ExternalLink, User, Book } from "lucide-react";
import { cn, cleanTitle } from "@/src/lib/utils";
import { api } from "@/src/lib/api";
import toast from "react-hot-toast";
import { AutocompleteInput } from "@/src/components/ui/AutocompleteInput";

interface Author {
  id: number;
  name: string;
}

interface Paper {
  id: number;
  title: string;
  abstract: string;
  published_year: number;
  citations_count: number;
  source: string;
  doi?: string;
  authors: Author[];
  keywords?: { id: number; name: string }[];
}

interface SearchResponse {
  data: Paper[];
  total: number;
  last_page: number;
}

export default function Search() {
  const [searchParams, setSearchParams] = useSearchParams();
  const q = searchParams.get("q") || "";
  const yearParam = searchParams.get("year");
  const authorParam = searchParams.get("author") || "";
  const journalParam = searchParams.get("journal") || "";
  const keywordParam = searchParams.get("keyword") || "";
  const sortParam = searchParams.get("sort") || "relevance";
  const pageParam = parseInt(searchParams.get("page") || "1", 10);

  const [year, setYear] = useState<string>(yearParam || "");
  const [author, setAuthor] = useState<string>(authorParam);
  const [journal, setJournal] = useState<string>(journalParam);
  const [keyword, setKeyword] = useState<string>(keywordParam);
  const [keywordInput, setKeywordInput] = useState("");
  const [sort, setSort] = useState<string>(sortParam);
  const [history, setHistory] = useState<string[]>([]);
  const [topKeywords, setTopKeywords] = useState<{ id: number, name: string, papers_count: number }[]>([]);
  
  const [searchInput, setSearchInput] = useState(q);
  
  const [data, setData] = useState<SearchResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPaper, setSelectedPaper] = useState<Paper | null>(null);
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<number>>(new Set());
  const [bookmarkLoadingIds, setBookmarkLoadingIds] = useState<Set<number>>(new Set());
  const [followedKeywordIds, setFollowedKeywordIds] = useState<Set<number>>(new Set());
  const [followingKeywordIds, setFollowingKeywordIds] = useState<Set<number>>(new Set());

  // Fetch followed keyword IDs on mount
  const loadFollowedKeywords = useCallback(async () => {
    try {
      const res = await api.get<{ keywords: { id: number }[] }>('/following/status');
      const ids = new Set<number>(res.keywords?.map((k: any) => k.id) ?? []);
      setFollowedKeywordIds(ids);
    } catch { /* silent */ }
  }, []);

  const toggleFollowKeyword = async (keywordId: number, keywordName: string) => {
    if (followingKeywordIds.has(keywordId)) return;
    setFollowingKeywordIds(prev => new Set(prev).add(keywordId));
    const isFollowed = followedKeywordIds.has(keywordId);
    try {
      if (isFollowed) {
        await api.delete(`/following/keywords/${keywordId}`);
        setFollowedKeywordIds(prev => { const s = new Set(prev); s.delete(keywordId); return s; });
        toast.success(`Đã hủy lưu từ khóa "${keywordName}"`);
      } else {
        await api.post(`/following/keywords`, { keyword_id: keywordId });
        setFollowedKeywordIds(prev => { const s = new Set(prev).add(keywordId); return s; });
        toast.success(`Đã lưu từ khóa "${keywordName}"!`);
      }
    } catch { toast.error('Không thể thực hiện thao tác này.'); }
    finally { setFollowingKeywordIds(prev => { const s = new Set(prev); s.delete(keywordId); return s; }); }
  };

  // Fetch bookmarked paper IDs on mount
  useEffect(() => {
    api.get<any>("/dashboard")
      .then(res => {
        if (res.bookmarked_paper_ids) {
          setBookmarkedIds(new Set(res.bookmarked_paper_ids));
        }
      })
      .catch(err => {
        console.error("Lỗi lấy thông tin bookmark:", err);
      });
    loadFollowedKeywords();

    // Fetch top 50 keywords
    api.get<{ data: any[] }>("/keywords?per_page=50")
      .then(res => {
        if (res.data) setTopKeywords(res.data);
      })
      .catch(err => console.error(err));
  }, [loadFollowedKeywords]);

  const handleBookmark = async (paperId: number) => {
    if (bookmarkLoadingIds.has(paperId)) return;
    const isBookmarked = bookmarkedIds.has(paperId);
    setBookmarkLoadingIds(prev => new Set(prev).add(paperId));
    try {
      if (isBookmarked) {
        await api.delete(`/bookmarks/paper/${paperId}`);
        setBookmarkedIds(prev => {
          const s = new Set(prev);
          s.delete(paperId);
          return s;
        });
        toast.success("Đã hủy lưu bài báo!");
      } else {
        await api.post("/bookmarks", { paper_id: paperId });
        setBookmarkedIds(prev => new Set(prev).add(paperId));
        toast.success("Lưu bài báo thành công!");
      }
    } catch (err) {
      toast.error("Thao tác thất bại. Vui lòng thử lại.");
    } finally {
      setBookmarkLoadingIds(prev => {
        const s = new Set(prev);
        s.delete(paperId);
        return s;
      });
    }
  };

  // Load history from local storage
  useEffect(() => {
    const saved = localStorage.getItem("search_history");
    if (saved) setHistory(JSON.parse(saved));
  }, []);

  // Save history
  useEffect(() => {
    if (q) {
      const saved = localStorage.getItem("search_history");
      let h = saved ? JSON.parse(saved) : [];
      h = [q, ...h.filter((item: string) => item !== q)].slice(0, 10);
      setHistory(h);
      localStorage.setItem("search_history", JSON.stringify(h));
    }
    setSearchInput(q);
  }, [q]);

  // Quick Suggestions Fetchers
  const fetchGlobalSuggestions = async (query: string) => {
    try {
      const [kwRes, auRes, joRes] = await Promise.all([
        api.get<{ data: any[] }>(`/keywords?q=${encodeURIComponent(query)}&per_page=3`).then(r => r.data || []),
        api.get<any[]>(`/following/search?type=author&q=${encodeURIComponent(query)}`).then(r => r.slice(0, 3)),
        api.get<any[]>(`/following/search?type=journal&q=${encodeURIComponent(query)}`).then(r => r.slice(0, 3))
      ]);
      const results: any[] = [];
      kwRes.forEach((k: any) => results.push({ ...k, _type: 'keyword' }));
      auRes.forEach((a: any) => results.push({ ...a, _type: 'author' }));
      joRes.forEach((j: any) => results.push({ ...j, _type: 'journal' }));
      return results;
    } catch {
      return [];
    }
  };

  const fetchAuthorSuggestions = async (query: string) => {
    try {
      return await api.get<any[]>(`/following/search?type=author&q=${encodeURIComponent(query)}`);
    } catch { return []; }
  };

  const fetchJournalSuggestions = async (query: string) => {
    try {
      return await api.get<any[]>(`/following/search?type=journal&q=${encodeURIComponent(query)}`);
    } catch { return []; }
  };

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        let url = `/papers/search?page=${pageParam}`;
        if (q) url += `&q=${encodeURIComponent(q)}`;
        if (yearParam) url += `&year=${yearParam}`;
        if (authorParam) url += `&author=${encodeURIComponent(authorParam)}`;
        if (journalParam) url += `&journal=${encodeURIComponent(journalParam)}`;
        if (keywordParam) url += `&keyword=${encodeURIComponent(keywordParam)}`;
        if (sortParam) url += `&sort=${sortParam}`;
        
        const res = await api.get<SearchResponse>(url);
        setData(res);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [q, yearParam, authorParam, journalParam, keywordParam, sortParam, pageParam]);

  const handleApplyFilter = () => {
    setSearchParams({ q, year, author, journal, keyword, sort, page: "1" });
  };

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newSort = e.target.value;
    setSort(newSort);
    setSearchParams({ q, year, author, journal, keyword, sort: newSort, page: "1" });
  };

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > (data?.last_page || 1)) return;
    setSearchParams({ q, year, author, journal, keyword, sort, page: newPage.toString() });
  };

  return (
    <div className="pb-20 space-y-6 pt-4">
      {/* Grid: papers (left) + sidebar (right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Papers list & Header */}
        <div className="lg:col-span-9 space-y-8 order-1 lg:order-1">
          <header className="bg-transparent">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
              <div>
                <p className="text-[10px] font-mono text-on-surface-variant uppercase tracking-widest mb-1">
                  KIẾN THỨC: {data?.total || 0} BÀI BÁO
                </p>
                {q ? (
                  <h2 className="font-display text-3xl font-bold">Kết quả cho <span className="gradient-text">"{q}"</span></h2>
                ) : (
                  <h2 className="font-display text-3xl font-bold">Khám phá <span className="gradient-text">bài báo mới nhất</span></h2>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">SẮP XẾP:</span>
                <select value={sort} onChange={handleSortChange} className="bg-transparent border-none text-xs font-bold text-primary focus:ring-0 outline-none">
                   <option value="relevance">Độ liên quan / Mới nhất</option>
                   <option value="citations">Trích dẫn nhiều nhất</option>
                </select>
              </div>
            </div>
            <div className="w-full z-20">
              <AutocompleteInput
                value={searchInput}
                onChange={setSearchInput}
                icon={<SearchIcon className="w-4 h-4" />}
                placeholder='Tìm kiếm (Hỗ trợ AND, OR, NOT, "cụm từ") hoặc nhập để tìm...'
                fetchSuggestions={fetchGlobalSuggestions}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    setSearchParams({ q: searchInput, year, author, journal, keyword, sort, page: "1" });
                  }
                }}
                onSelect={(item) => {
                  if (item._type === 'keyword') {
                    let currentKws = keyword.split(',').map(k => k.trim()).filter(Boolean);
                    if (!currentKws.includes(item.name)) currentKws.push(item.name);
                    const newKeyword = currentKws.join(',');
                    setKeyword(newKeyword);
                    setSearchParams({ q: searchInput, year, author, journal, keyword: newKeyword, sort, page: "1" });
                  } else if (item._type === 'author') {
                    setAuthor(item.name);
                    setSearchParams({ q: searchInput, year, author: item.name, journal, keyword, sort, page: "1" });
                  } else if (item._type === 'journal') {
                    setJournal(item.name);
                    setSearchParams({ q: searchInput, year, author, journal: item.name, keyword, sort, page: "1" });
                  }
                  setSearchInput("");
                }}
                renderSuggestion={(item) => {
                  if (item._type === 'keyword') {
                    return (
                      <>
                        <span className="font-medium text-on-surface flex items-center gap-2">
                          <span className="text-secondary">#</span> {item.name}
                        </span>
                        <span className="text-xs text-on-surface-variant bg-surface-container px-2 py-0.5 rounded-full">Chủ đề</span>
                      </>
                    );
                  }
                  if (item._type === 'author') {
                    return (
                      <>
                        <span className="font-medium text-on-surface flex items-center gap-2">
                          <User className="w-3.5 h-3.5 text-primary" /> {item.name}
                        </span>
                        <span className="text-xs text-on-surface-variant bg-surface-container px-2 py-0.5 rounded-full">Tác giả</span>
                      </>
                    );
                  }
                  return (
                    <>
                      <span className="font-medium text-on-surface flex items-center gap-2">
                        <Book className="w-3.5 h-3.5 text-tertiary" /> {item.name}
                      </span>
                      <span className="text-xs text-on-surface-variant bg-surface-container px-2 py-0.5 rounded-full">Tạp chí</span>
                    </>
                  );
                }}
                footer={
                  <button
                    onClick={() => {
                      setSearchParams({ q: searchInput, year, author, journal, keyword, sort, page: "1" });
                    }}
                    className="w-full text-left px-4 py-2.5 hover:bg-white/5 text-sm flex items-center gap-2 text-primary font-medium"
                  >
                    <SearchIcon className="w-4 h-4" /> Tìm kiếm "{searchInput}" trong toàn bộ dữ liệu
                  </button>
                }
              />
            </div>
            
            {/* Quick Suggestions for Topics */}
            {topKeywords.length > 0 && (
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mr-2">GỢI Ý NHANH:</span>
                {topKeywords.slice(0, 5).map(kw => {
                  const isSelected = keyword.split(',').map(k => k.trim()).includes(kw.name);
                  return (
                    <button
                      key={kw.id}
                      onClick={() => {
                        let currentKws = keyword.split(',').map(k => k.trim()).filter(Boolean);
                        if (isSelected) {
                          currentKws = currentKws.filter(k => k !== kw.name);
                        } else {
                          currentKws.push(kw.name);
                        }
                        const newKeyword = currentKws.join(',');
                        setKeyword(newKeyword);
                        setSearchParams({ q, year, author, journal, keyword: newKeyword, sort, page: "1" });
                      }}
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

          {isLoading ? (
            <div className="flex justify-center items-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : data?.data && data.data.length > 0 ? (
            <div className="relative space-y-6">
              <div 
                className="overflow-y-auto max-h-[700px] pr-2 space-y-6 scroll-smooth"
                style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.15) transparent' }}
              >
                {data.data.map((paper: Paper) => (
                  <article key={paper.id} className="glass-panel p-8 rounded-2xl relative overflow-hidden group hover:border-primary/30 transition-all">
                    <div className="flex justify-between items-start gap-4 mb-2">
                      <div className="flex flex-col gap-3">
                        <h3 
                          onClick={() => setSelectedPaper(paper)}
                          className="font-display text-2xl font-bold leading-tight group-hover:text-primary transition-colors cursor-pointer"
                        >
                          {cleanTitle(paper.title)}
                        </h3>
                      </div>
                      <div className="relative group/tooltip">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleBookmark(paper.id);
                          }}
                          disabled={bookmarkLoadingIds.has(paper.id)}
                          className={cn(
                            "p-2 rounded-full hover:bg-white/5 transition-colors",
                            bookmarkedIds.has(paper.id) 
                              ? "text-tertiary" 
                              : "text-on-surface-variant hover:text-tertiary"
                          )}
                        >
                          {bookmarkLoadingIds.has(paper.id) ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                          ) : bookmarkedIds.has(paper.id) ? (
                            <Bookmark className="w-5 h-5 fill-current" />
                          ) : (
                            <Bookmark className="w-5 h-5" />
                          )}
                        </button>
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-1 text-[10px] font-bold text-on-surface bg-surface-container-high rounded-lg opacity-0 pointer-events-none group-hover/tooltip:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10 shadow-xl border border-outline-variant/30">
                          {bookmarkedIds.has(paper.id) ? "Hủy lưu bài báo" : "Lưu bài báo ngay"}
                        </div>
                      </div>
                    </div>
                    <p className="text-sm text-secondary font-medium mb-4">
                      {paper.authors?.map(a => a.name).join(", ")} • <span className="text-on-surface">{paper.source} | {paper.published_year}</span>
                    </p>
                    <p className="text-on-surface-variant text-sm line-clamp-3 mb-6 leading-relaxed">{paper.abstract}</p>
                    
                    <div className="flex flex-wrap items-center gap-6 pt-6 border-t border-white/5">
                       <div className="flex items-center gap-6 mr-auto">
                          <span className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant"><Quote className="w-3 h-3" /> {paper.citations_count} TRÍCH DẪN</span>
                       </div>
                       <button 
                         onClick={() => setSelectedPaper(paper)}
                         className="px-6 py-2.5 rounded-full border border-white/20 text-[10px] font-bold uppercase tracking-widest hover:bg-white/5 transition-all text-white"
                       >
                         XEM CHI TIẾT
                       </button>
                       <button className="px-6 py-2.5 rounded-full bg-primary text-[10px] font-bold uppercase tracking-widest text-white shadow-[0_0_15px_rgba(37,99,235,0.3)] hover:bg-primary/90 transition">
                         TẢI XUỐNG PDF
                       </button>
                    </div>
                  </article>
                ))}
              </div>
              {data.data.length > 2 && (
                <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-background/90 to-transparent z-10" />
              )}
            </div>
          ) : (
            <div className="text-center py-20 text-on-surface-variant">
              Không tìm thấy kết quả nào phù hợp. Thử thay đổi từ khóa hoặc loại bỏ bộ lọc.
            </div>
          )}

          {data?.last_page && data.last_page > 1 && (
            <div className="flex justify-center items-center gap-2 pt-8">
               <button 
                 onClick={() => handlePageChange(pageParam - 1)}
                 disabled={pageParam === 1}
                 className="p-2 rounded border border-white/10 hover:bg-white/5 disabled:opacity-50"
               >
                 <ChevronLeft className="w-4 h-4" />
               </button>
               <span className="text-xs font-bold text-on-surface-variant px-4">
                 Trang {pageParam} / {data.last_page}
               </span>
               <button 
                 onClick={() => handlePageChange(pageParam + 1)}
                 disabled={pageParam === data.last_page}
                 className="p-2 rounded border border-white/10 hover:bg-white/5 disabled:opacity-50"
               >
                 <ChevronRight className="w-4 h-4" />
               </button>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <aside className="lg:col-span-3 space-y-6 sticky top-[100px] self-start order-2 lg:order-2">
          <div className="glass-panel p-6 rounded-2xl space-y-8">
             <div className="flex justify-between items-center">
               <h3 className="font-display font-bold text-lg flex items-center gap-2"><Filter className="w-4 h-4 text-primary" /> BỘ LỌC</h3>
               <button 
                 onClick={() => { setYear(""); setAuthor(""); setJournal(""); setKeyword(""); setSort("relevance"); setSearchParams({ q, page: "1" }); }}
                 className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant hover:text-primary transition-colors"
               >
                 ĐẶT LẠI
               </button>
             </div>

             <div className="space-y-4">
               <div>
                 <h4 className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-2">NĂM XUẤT BẢN</h4>
                 <select 
                   value={year}
                   onChange={(e) => setYear(e.target.value)}
                   className="w-full bg-surface-container-high border border-white/10 rounded-full p-2.5 px-4 text-sm outline-none focus:border-primary/50"
                 >
                   <option value="">Tất cả các năm</option>
                   {[2024, 2023, 2022, 2021, 2020, 2019, 2018].map(y => (
                     <option key={y} value={y}>{y}</option>
                   ))}
                 </select>
               </div>

               <div>
                 <h4 className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-2">TÁC GIẢ</h4>
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
                  <h4 className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-2">TẠP CHÍ</h4>
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
                  <h4 className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-3">CHỦ ĐỀ TỪ KHÓA</h4>
                  <AutocompleteInput
                    value={keywordInput}
                    onChange={setKeywordInput}
                    fetchSuggestions={async (query) => {
                      const res = await api.get<{ data: any[] }>(`/keywords?q=${encodeURIComponent(query)}&per_page=5`);
                      return res.data || [];
                    }}
                    placeholder="Tìm và thêm chủ đề..."
                    inputClassName="pl-4 bg-surface-container-high mb-3"
                    onSelect={(item) => {
                      let currentKws = keyword.split(',').map(k => k.trim()).filter(Boolean);
                      if (!currentKws.includes(item.name)) currentKws.push(item.name);
                      setKeyword(currentKws.join(','));
                      setKeywordInput("");
                    }}
                    renderSuggestion={(item) => (
                      <span className="font-medium text-on-surface flex items-center justify-between w-full">
                        <span><span className="text-secondary">#</span> {item.name}</span>
                        <span className="text-xs text-on-surface-variant">{item.papers_count}</span>
                      </span>
                    )}
                  />
                  <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
                    {keyword.split(',').map(k => k.trim()).filter(Boolean).map(kwName => (
                      <button
                        key={kwName}
                        onClick={() => {
                          let currentKws = keyword.split(',').map(k => k.trim()).filter(Boolean);
                          currentKws = currentKws.filter(k => k !== kwName);
                          setKeyword(currentKws.join(','));
                        }}
                        className="text-xs px-2.5 py-1.5 rounded-lg border bg-primary/20 border-primary text-primary transition-all text-left flex items-center gap-1.5 group"
                      >
                        {kwName} <X className="w-3 h-3 group-hover:text-error" />
                      </button>
                    ))}
                  </div>
                </div>

                <button onClick={handleApplyFilter} className="w-full py-2.5 bg-primary text-white text-xs font-bold rounded-full hover:bg-primary/90 transition shadow-[0_0_15px_rgba(37,99,235,0.3)]">ÁP DỤNG LỌC</button>
             </div>
             
             <div className="space-y-4 pt-4 border-t border-white/5">
               <h4 className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant flex items-center gap-2"><History className="w-3 h-3" /> LỊCH SỬ TÌM KIẾM</h4>
               {history.length > 0 ? (
                 <div className="flex flex-wrap gap-2">
                   {history.map((h, i) => (
                     <button 
                       key={i}
                       onClick={() => setSearchParams({ q: h, page: "1" })}
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
               <h4 className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant flex items-center gap-2 text-tertiary"><Info className="w-3 h-3" /> MẸO BOOLEAN</h4>
               <ul className="text-xs text-on-surface-variant space-y-2 leading-relaxed">
                 <li><strong className="text-on-surface">"Cụm từ"</strong>: Tìm chính xác cụm từ.</li>
                 <li><strong className="text-tertiary">AND</strong>: Chứa cả hai từ khóa.</li>
                 <li><strong className="text-tertiary">OR</strong>: Chứa một trong hai.</li>
                 <li><strong className="text-error">NOT</strong>: Loại trừ từ khóa.</li>
               </ul>
             </div>
          </div>
        </aside>
      </div>

      {selectedPaper && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="glass-panel w-full max-w-3xl rounded-2xl border border-white/10 p-8 shadow-2xl relative max-h-[85vh] overflow-y-auto">
            <button 
              onClick={() => setSelectedPaper(null)}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/5 text-on-surface-variant hover:text-on-surface transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            
            <div className="space-y-6">
              <div>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary mb-3">
                  {selectedPaper.source.toUpperCase()}
                </span>
                <h2 className="font-display text-2xl sm:text-3xl font-bold leading-tight text-on-surface">{cleanTitle(selectedPaper.title)}</h2>
              </div>
              
              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-on-surface-variant border-y border-white/5 py-4">
                <div>
                  <span className="font-bold text-on-surface">Tác giả:</span> {selectedPaper.authors?.map(a => a.name).join(", ") || "N/A"}
                </div>
                <div>
                  <span className="font-bold text-on-surface">Tạp chí:</span> {selectedPaper.source || "N/A"}
                </div>
                <div>
                  <span className="font-bold text-on-surface">Năm xuất bản:</span> {selectedPaper.published_year}
                </div>
                <div>
                  <span className="font-bold text-on-surface">Trích dẫn:</span> {selectedPaper.citations_count}
                </div>
              </div>
              
              <div className="space-y-3">
                <h4 className="text-sm font-bold uppercase tracking-widest text-primary">Tóm tắt (Abstract)</h4>
                <p className="text-on-surface-variant text-sm leading-relaxed whitespace-pre-line">
                  {selectedPaper.abstract || "Không có tóm tắt cho bài báo này."}
                </p>
              </div>

              {selectedPaper.keywords && selectedPaper.keywords.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-bold uppercase tracking-widest text-secondary">Từ khóa (Chủ đề)</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedPaper.keywords.map((kw) => {
                      const isFollowed = followedKeywordIds.has(kw.id);
                      const isBtnLoading = followingKeywordIds.has(kw.id);
                      return (
                        <span 
                          key={kw.id} 
                          className={cn(
                            "text-xs px-2.5 py-1 rounded-full border flex items-center gap-1.5 transition-all select-none",
                            isFollowed 
                              ? "bg-secondary/15 text-secondary border-secondary/30" 
                              : "bg-primary/10 text-primary border-primary/20"
                          )}
                        >
                          #{kw.name}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleFollowKeyword(kw.id, kw.name);
                            }}
                            disabled={isBtnLoading}
                            className="hover:scale-110 active:scale-95 transition-all ml-1 p-0.5 rounded-full hover:bg-white/10"
                            title={isFollowed ? "Hủy lưu chủ đề này" : "Lưu chủ đề này"}
                          >
                            {isBtnLoading ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : isFollowed ? (
                              <X className="w-3 h-3 text-secondary hover:text-error" />
                            ) : (
                              <BookmarkPlus className="w-3 h-3 hover:text-tertiary" />
                            )}
                          </button>
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}
              
              <div className="flex justify-end gap-4 pt-4 border-t border-white/5">
                <button 
                  onClick={() => setSelectedPaper(null)}
                  className="px-5 py-2.5 rounded-xl border border-white/10 text-xs font-bold uppercase tracking-widest hover:bg-white/5 transition-all text-on-surface"
                >
                  Đóng
                </button>
                <button
                  disabled={bookmarkLoadingIds.has(selectedPaper.id)}
                  onClick={() => handleBookmark(selectedPaper.id)}
                  className={cn(
                    "px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all",
                    bookmarkedIds.has(selectedPaper.id)
                      ? "bg-tertiary/20 text-tertiary border border-tertiary/30 hover:bg-tertiary/30"
                      : "bg-secondary/10 border border-secondary/20 text-secondary hover:bg-secondary/20"
                  )}
                >
                  {bookmarkLoadingIds.has(selectedPaper.id) ? (
                    <span className="flex items-center gap-1"><Loader2 className="w-3.5 h-3.5 animate-spin" /> Đang xử lý...</span>
                  ) : bookmarkedIds.has(selectedPaper.id) ? (
                    "Hủy lưu bài báo"
                  ) : (
                    "Lưu bài báo"
                  )}
                </button>
                <a 
                  href={selectedPaper.doi ? `https://doi.org/${selectedPaper.doi}` : "#"} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="px-5 py-2.5 rounded-xl gradient-btn text-xs font-bold uppercase tracking-widest text-white flex items-center gap-2"
                >
                  Xem Nguồn Gốc <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
