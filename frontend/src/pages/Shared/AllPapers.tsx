import { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { ChevronLeft, ChevronRight, Loader2, Quote, Bookmark, BookmarkPlus, ExternalLink, X, ArrowLeft, Filter } from "lucide-react";
import { cn, cleanTitle } from "@/src/lib/utils";
import { api } from "@/src/lib/api";
import toast from "react-hot-toast";

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

interface PaginatedResponse {
  data: Paper[];
  total: number;
  last_page: number;
}

export default function AllPapers() {
  const [searchParams, setSearchParams] = useSearchParams();
  const pageParam = parseInt(searchParams.get("page") || "1", 10);
  const yearParam = searchParams.get("year") || "";
  const authorParam = searchParams.get("author") || "";
  const sortParam = searchParams.get("sort") || "relevance";
  const viewParam = searchParams.get("view") || "papers";

  const [year, setYear] = useState<string>(yearParam);
  const [author, setAuthor] = useState<string>(authorParam);
  const [sort, setSort] = useState<string>(sortParam);

  const [data, setData] = useState<PaginatedResponse | null>(null);
  const [topicsData, setTopicsData] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPaper, setSelectedPaper] = useState<Paper | null>(null);
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<number>>(new Set());
  const [bookmarkLoadingIds, setBookmarkLoadingIds] = useState<Set<number>>(new Set());

  // Fetch bookmarked paper IDs on mount
  useEffect(() => {
    api.get<{data: any[]}>('/bookmarks')
      .then(res => {
        if (res.data) {
          const ids = res.data.map(b => b.paper_id);
          setBookmarkedIds(new Set(ids));
        }
      })
      .catch(err => console.error(err));
  }, []);

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

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        if (viewParam === "topics") {
          const res = await api.get<any>(`/keywords?page=${pageParam}`);
          setTopicsData(res);
        } else {
          let url = `/papers/search?page=${pageParam}`;
          if (yearParam) url += `&year=${yearParam}`;
          if (authorParam) url += `&author=${encodeURIComponent(authorParam)}`;
          if (sortParam) url += `&sort=${sortParam}`;
          const res = await api.get<PaginatedResponse>(url);
          setData(res);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [pageParam, yearParam, authorParam, sortParam, viewParam]);

  const handlePageChange = (newPage: number) => {
    if (viewParam === "topics") {
      if (newPage < 1 || newPage > (topicsData?.last_page || 1)) return;
      setSearchParams({ view: "topics", page: newPage.toString() });
    } else {
      if (newPage < 1 || newPage > (data?.last_page || 1)) return;
      setSearchParams({ year: yearParam, author: authorParam, sort: sortParam, page: newPage.toString() });
    }
  };

  const handleApplyFilter = () => {
    setSearchParams({ year, author, sort, page: "1" });
  };

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newSort = e.target.value;
    setSort(newSort);
    setSearchParams({ year: yearParam, author: authorParam, sort: newSort, page: "1" });
  };

  return (
    <div className="pb-20 space-y-6 pt-4">
      <Link 
        to="/dashboard" 
        className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 text-xs font-bold uppercase tracking-widest text-on-surface-variant hover:text-primary hover:border-primary/30 transition-all mb-4"
      >
        <ArrowLeft className="w-4 h-4" /> Quay lại Bảng điều khiển
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Main List */}
        <div className="lg:col-span-9 space-y-8 order-1">
          <header className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-8">
            <div>
              <p className="text-[10px] font-mono text-on-surface-variant uppercase tracking-widest mb-2">
                {viewParam === "topics" ? `TỔNG CỘNG: ${topicsData?.total || 0} CHỦ ĐỀ` : `KIẾN THỨC: ${data?.total || 0} BÀI BÁO`}
              </p>
              <h2 className="font-display text-3xl sm:text-4xl font-bold">
                {viewParam === "topics" ? "Thư viện Chủ đề" : yearParam ? `Ấn phẩm năm ${yearParam}` : "Tất cả bài báo nghiên cứu"}
              </h2>
            </div>
            
            {viewParam !== "topics" && (
              <div className="flex items-center gap-2 shrink-0 bg-surface-container-high px-4 py-2 rounded-full border border-white/5">
                <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">SẮP XẾP:</span>
                <select value={sort} onChange={handleSortChange} className="bg-transparent border-none text-xs font-bold text-primary focus:ring-0 outline-none cursor-pointer">
                   <option value="relevance">Mới nhất</option>
                   <option value="citations">Trích dẫn nhiều nhất</option>
                </select>
              </div>
            )}
          </header>

          {isLoading ? (
            <div className="flex justify-center items-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : viewParam === "topics" ? (
            topicsData?.data && topicsData.data.length > 0 ? (
              <div className="flex flex-wrap gap-3">
                {topicsData.data.map((topic: any) => (
                  <Link 
                    key={topic.id} 
                    to={`/search?q=${encodeURIComponent(topic.name)}`}
                    className="glass-panel px-4 py-3 rounded-xl border border-white/10 hover:border-primary/50 transition-all group flex items-center gap-3"
                  >
                    <span className="font-medium text-sm group-hover:text-primary transition-colors">{topic.name}</span>
                    <span className="bg-white/5 px-2 py-0.5 rounded-full text-[10px] font-mono text-on-surface-variant">{topic.papers_count} bài</span>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-20 text-on-surface-variant">
                Không có chủ đề nào.
              </div>
            )
          ) : data?.data && data.data.length > 0 ? (
            <div className="space-y-6">
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
                      <div className="absolute bottom-full right-0 mb-2 px-2.5 py-1 text-[10px] font-bold text-on-surface bg-surface-container-high rounded-lg opacity-0 pointer-events-none group-hover/tooltip:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10 shadow-xl border border-outline-variant/30">
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
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="text-center py-20 text-on-surface-variant">
              Không tìm thấy bài báo nào phù hợp với bộ lọc.
            </div>
          )}

          {viewParam === "topics" ? (
            topicsData?.last_page && topicsData.last_page > 1 && (
              <div className="flex justify-center items-center gap-2 pt-8">
                 <button 
                   onClick={() => handlePageChange(pageParam - 1)}
                   disabled={pageParam === 1}
                   className="p-2 rounded border border-white/10 hover:bg-white/5 disabled:opacity-50 transition-colors"
                 >
                   <ChevronLeft className="w-4 h-4" />
                 </button>
                 <span className="text-xs font-bold text-on-surface-variant px-4">
                   Trang {pageParam} / {topicsData.last_page}
                 </span>
                 <button 
                   onClick={() => handlePageChange(pageParam + 1)}
                   disabled={pageParam === topicsData.last_page}
                   className="p-2 rounded border border-white/10 hover:bg-white/5 disabled:opacity-50 transition-colors"
                 >
                   <ChevronRight className="w-4 h-4" />
                 </button>
              </div>
            )
          ) : (
            data?.last_page && data.last_page > 1 && (
              <div className="flex justify-center items-center gap-2 pt-8">
                 <button 
                   onClick={() => handlePageChange(pageParam - 1)}
                   disabled={pageParam === 1}
                   className="p-2 rounded border border-white/10 hover:bg-white/5 disabled:opacity-50 transition-colors"
                 >
                   <ChevronLeft className="w-4 h-4" />
                 </button>
                 <span className="text-xs font-bold text-on-surface-variant px-4">
                   Trang {pageParam} / {data.last_page}
                 </span>
                 <button 
                   onClick={() => handlePageChange(pageParam + 1)}
                   disabled={pageParam === data.last_page}
                   className="p-2 rounded border border-white/10 hover:bg-white/5 disabled:opacity-50 transition-colors"
                 >
                   <ChevronRight className="w-4 h-4" />
                 </button>
              </div>
            )
          )}
        </div>

        {/* Sidebar Filters */}
        {viewParam !== "topics" && (
          <aside className="lg:col-span-3 space-y-6 sticky top-[100px] self-start order-2">
          <div className="glass-panel p-6 rounded-2xl space-y-8">
             <div className="flex justify-between items-center">
               <h3 className="font-display font-bold text-lg flex items-center gap-2"><Filter className="w-4 h-4 text-primary" /> BỘ LỌC</h3>
               <button 
                 onClick={() => { setYear(""); setAuthor(""); setSort("relevance"); setSearchParams({ page: "1" }); }}
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
                   className="w-full bg-surface-container-high border border-white/10 rounded-full p-2.5 px-4 text-sm outline-none focus:border-primary/50 text-on-surface"
                 >
                   <option value="">Tất cả các năm</option>
                   {[2026, 2025, 2024, 2023, 2022, 2021, 2020].map(y => (
                     <option key={y} value={y}>{y}</option>
                   ))}
                 </select>
               </div>

               <div>
                 <h4 className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-2">TÁC GIẢ</h4>
                 <input 
                   type="text"
                   value={author}
                   placeholder="Nhập tên tác giả..."
                   onChange={(e) => setAuthor(e.target.value)}
                   className="w-full bg-surface-container-high border border-white/10 rounded-full p-2.5 px-4 text-sm outline-none focus:border-primary/50 placeholder:text-outline-variant text-on-surface"
                 />
               </div>

               <button onClick={handleApplyFilter} className="w-full py-2.5 bg-primary text-white text-xs font-bold rounded-full hover:bg-primary/90 transition shadow-[0_0_15px_rgba(37,99,235,0.3)]">
                 ÁP DỤNG LỌC
               </button>
             </div>
          </div>
        </aside>
        )}
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
                    {selectedPaper.keywords.map((kw) => (
                      <span 
                        key={kw.id} 
                        className="text-xs px-2.5 py-1 rounded-full border bg-primary/10 text-primary border-primary/20"
                      >
                        #{kw.name}
                      </span>
                    ))}
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
                  href={selectedPaper.doi ? (selectedPaper.doi.startsWith("http") ? selectedPaper.doi : `https://doi.org/${selectedPaper.doi}`) : "#"} 
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
