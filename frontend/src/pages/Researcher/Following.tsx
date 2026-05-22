import React, { useState, useEffect, useCallback } from "react";
import { Activity, Users, Plus, Tag, X, Clock, Quote, ArrowRight, Loader2, Search, BookOpen, ExternalLink, Bookmark } from "lucide-react";
import toast from "react-hot-toast";
import { cn } from "@/src/lib/utils";
import { api } from "@/src/lib/api";

interface Keyword {
  id: number;
  name: string;
  slug: string;
}

interface Journal {
  id: number;
  name: string;
  issn?: string;
  publisher?: string;
}

interface Author {
  id: number;
  name: string;
  affiliation?: string;
}

interface Paper {
  id: number;
  title: string;
  abstract: string;
  published_year: number;
  citations_count: number;
  source: string;
  doi?: string;
  url?: string;
  journal?: Journal;
  authors: Author[];
  keywords: Keyword[];
}

export default function Following() {
  // Sidebar tabs state
  const [activeTab, setActiveTab] = useState<"keyword" | "journal" | "author">("keyword");

  // Follow lists
  const [keywords, setKeywords] = useState<Keyword[]>([]);
  const [journals, setJournals] = useState<Journal[]>([]);
  const [authors, setAuthors] = useState<Author[]>([]);
  const [isStatusLoading, setIsStatusLoading] = useState(true);

  // Live feed
  const [feedPapers, setFeedPapers] = useState<Paper[]>([]);
  const [isFeedLoading, setIsFeedLoading] = useState(true);
  const [feedPage, setFeedPage] = useState(1);
  const [feedTotalPages, setFeedTotalPages] = useState(1);

  // Quick view paper modal
  const [selectedPaper, setSelectedPaper] = useState<Paper | null>(null);

  // Follow Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalSearchType, setModalSearchType] = useState<"keyword" | "journal" | "author">("keyword");
  const [modalSearchQuery, setModalSearchQuery] = useState("");
  const [modalSearchResults, setModalSearchResults] = useState<any[]>([]);
  const [isModalSearching, setIsModalSearching] = useState(false);
  const [modalError, setModalError] = useState("");

  // Fetch follow statuses
  const fetchStatus = useCallback(async () => {
    setIsStatusLoading(true);
    try {
      const res = await api.get<{ keywords: Keyword[]; journals: Journal[]; authors: Author[] }>("/following/status");
      setKeywords(res.keywords || []);
      setJournals(res.journals || []);
      setAuthors(res.authors || []);
    } catch (err) {
      console.error("Lỗi khi tải thông tin theo dõi:", err);
    } finally {
      setIsStatusLoading(false);
    }
  }, []);

  // Fetch feed papers
  const fetchFeed = useCallback(async (page = 1) => {
    setIsFeedLoading(true);
    try {
      const res = await api.get<any>(`/following/feed?page=${page}`);
      setFeedPapers(res.data || []);
      setFeedPage(res.current_page || 1);
      setFeedTotalPages(res.last_page || 1);
    } catch (err) {
      console.error("Lỗi khi tải bảng tin:", err);
    } finally {
      setIsFeedLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
    fetchFeed(1);
  }, [fetchStatus, fetchFeed]);

  // Handle follow addition
  const handleFollow = async (id: number, type: "keyword" | "journal" | "author") => {
    try {
      const body: any = {};
      body[`${type}_id`] = id;
      await api.post(`/following/${type}s`, body);
      fetchStatus();
      fetchFeed(1);
      // Remove followed item from search list
      setModalSearchResults(prev => prev.filter(item => item.id !== id));
      toast.success("Đã theo dõi thành công!");
    } catch (err) {
      console.error("Lỗi khi thực hiện theo dõi:", err);
      toast.error("Không thể thực hiện theo dõi. Vui lòng thử lại.");
    }
  };

  // Handle unfollow
  const handleUnfollow = async (id: number, type: "keyword" | "journal" | "author") => {
    try {
      await api.delete(`/following/${type}s/${id}`);
      fetchStatus();
      fetchFeed(1);
      toast.success("Đã hủy theo dõi thành công!");
    } catch (err) {
      console.error("Lỗi khi hủy theo dõi:", err);
      toast.error("Không thể hủy theo dõi. Vui lòng thử lại.");
    }
  };

  // Search to follow
  const handleSearchToFollow = async () => {
    if (!modalSearchQuery.trim()) {
      setModalSearchResults([]);
      return;
    }
    setIsModalSearching(true);
    setModalError("");
    try {
      const res = await api.get<any[]>(`/following/search?type=${modalSearchType}&q=${encodeURIComponent(modalSearchQuery)}`);
      setModalSearchResults(res || []);
    } catch (err) {
      console.error("Lỗi tìm kiếm:", err);
      setModalError("Không thể tìm thấy kết quả phù hợp hoặc xảy ra lỗi.");
    } finally {
      setIsModalSearching(false);
    }
  };

  // Handle keydown Enter in search input
  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSearchToFollow();
    }
  };

  // Helper check
  const isAlreadyFollowing = (id: number, type: "keyword" | "journal" | "author") => {
    if (type === "keyword") return keywords.some(k => k.id === id);
    if (type === "journal") return journals.some(j => j.id === id);
    if (type === "author") return authors.some(a => a.id === id);
    return false;
  };

  // Add bookmark
  const handleAddBookmark = async (paperId: number) => {
    try {
      await api.post("/bookmarks", { paper_id: paperId });
      toast.success("Đã lưu bài báo vào dấu trang thành công!");
    } catch (err: any) {
      toast.error(err.message || "Lỗi khi lưu dấu trang.");
    }
  };

  // Get active list for sidebar
  const getActiveList = () => {
    if (activeTab === "keyword") return keywords;
    if (activeTab === "journal") return journals;
    return authors;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pb-20">
      {/* Feed Column */}
      <div className="lg:col-span-8 space-y-8">
        <header className="flex justify-between items-end mb-4">
          <div>
            <h2 className="font-display text-4xl font-bold">Cơ chế Theo dõi</h2>
            <p className="text-on-surface-variant mt-1">Dòng ấn phẩm mới nhất được chọn lọc từ các nguồn được giám sát của bạn.</p>
          </div>
          <button 
            onClick={() => fetchFeed(1)}
            disabled={isFeedLoading}
            className="flex items-center gap-2 px-4 py-2 glass-panel rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-white/5 transition-all text-on-surface disabled:opacity-50"
          >
            {isFeedLoading ? (
              <Loader2 className="w-4 h-4 animate-spin text-primary" />
            ) : (
              <Activity className="w-4 h-4 text-tertiary" />
            )}
            Làm mới feed
          </button>
        </header>

        <div className="space-y-6">
          <h3 className="font-display text-xl font-bold flex items-center gap-3">
            <Users className="w-5 h-5 text-primary" /> Bảng tin cập nhật
          </h3>

          {isFeedLoading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : feedPapers.length > 0 ? (
            <div className="space-y-6">
              {feedPapers.map((paper: Paper) => (
                <article key={paper.id} className="glass-panel p-8 rounded-2xl relative group hover:bg-white/[0.02] transition-all">
                  <div className="absolute top-6 right-6 flex gap-2">
                    <button 
                      onClick={() => handleAddBookmark(paper.id)}
                      className="p-2 rounded-full hover:bg-white/5 text-on-surface-variant hover:text-tertiary transition-colors"
                      title="Lưu dấu trang"
                    >
                      <Bookmark className="w-5 h-5" />
                    </button>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-2 mb-4">
                    {paper.keywords?.slice(0, 3).map((kw) => (
                      <span key={kw.id} className="text-[10px] font-bold uppercase tracking-widest bg-secondary-container/20 text-secondary px-2.5 py-0.5 rounded border border-secondary/20">
                        {kw.name}
                      </span>
                    ))}
                    <span className="flex items-center gap-1 text-[10px] font-bold text-on-surface-variant uppercase tracking-widest ml-auto">
                      <Clock className="w-3 h-3" /> {paper.published_year}
                    </span>
                  </div>

                  <h4 
                    onClick={() => setSelectedPaper(paper)}
                    className="font-display text-2xl font-bold mb-4 pr-16 group-hover:text-primary transition-colors cursor-pointer leading-tight"
                  >
                    {paper.title}
                  </h4>
                  
                  <p className="text-sm text-secondary font-medium mb-4">
                    Tác giả: {paper.authors?.map(a => a.name).join(", ") || "Không có thông tin"}
                  </p>
                  
                  <p className="text-sm text-on-surface-variant leading-relaxed line-clamp-3 mb-6">
                    {paper.abstract || "Không có phần tóm tắt nội dung bài viết."}
                  </p>

                  <div className="flex items-center justify-between pt-6 border-t border-white/5">
                    <div className="flex items-center gap-6">
                      <span className="text-[10px] font-bold text-tertiary uppercase tracking-widest">
                        {paper.journal?.name || paper.source}
                      </span>
                      <span className="flex items-center gap-1.5 text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">
                        <Quote className="w-3 h-3" /> {paper.citations_count} Trích dẫn
                      </span>
                    </div>
                    <button 
                      onClick={() => setSelectedPaper(paper)}
                      className="flex items-center gap-1 text-primary text-[10px] font-bold uppercase tracking-widest hover:text-tertiary transition-all"
                    >
                      Xem nhanh <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </article>
              ))}

              {/* Feed Pagination */}
              {feedTotalPages > 1 && (
                <div className="flex justify-center items-center gap-2 pt-4">
                  <button 
                    onClick={() => fetchFeed(feedPage - 1)}
                    disabled={feedPage === 1 || isFeedLoading}
                    className="px-4 py-2 rounded-lg border border-white/10 text-xs font-bold uppercase tracking-widest hover:bg-white/5 disabled:opacity-50"
                  >
                    Trước
                  </button>
                  <span className="text-xs font-bold text-on-surface-variant px-4">
                    Trang {feedPage} / {feedTotalPages}
                  </span>
                  <button 
                    onClick={() => fetchFeed(feedPage + 1)}
                    disabled={feedPage === feedTotalPages || isFeedLoading}
                    className="px-4 py-2 rounded-lg border border-white/10 text-xs font-bold uppercase tracking-widest hover:bg-white/5 disabled:opacity-50"
                  >
                    Sau
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="glass-panel p-8 rounded-2xl text-center text-on-surface-variant">
              Không tìm thấy bài báo nào từ các nguồn theo dõi. Hãy bấm nút "+" ở thanh bên phải để theo dõi thêm Từ khóa, Tạp chí hoặc Tác giả mới.
            </div>
          )}
        </div>
      </div>

      {/* Sidebar Manage Follows Column */}
      <aside className="lg:col-span-4 space-y-6">
        <div className="glass-panel p-6 rounded-2xl space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="font-display font-bold">Quản lý theo dõi</h3>
            <button 
              onClick={() => {
                setModalSearchQuery("");
                setModalSearchResults([]);
                setModalError("");
                setIsModalOpen(true);
              }}
              className="p-1 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-all"
              title="Theo dõi thêm"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
          
          <div className="flex border-b border-white/5">
            <button 
              onClick={() => setActiveTab("keyword")}
              className={cn(
                "flex-1 pb-3 text-[10px] font-bold uppercase tracking-widest transition-all", 
                activeTab === "keyword" ? "border-b-2 border-primary text-primary" : "text-on-surface-variant hover:text-on-surface"
              )}
            >
              Chủ đề ({keywords.length})
            </button>
            <button 
              onClick={() => setActiveTab("journal")}
              className={cn(
                "flex-1 pb-3 text-[10px] font-bold uppercase tracking-widest transition-all", 
                activeTab === "journal" ? "border-b-2 border-primary text-primary" : "text-on-surface-variant hover:text-on-surface"
              )}
            >
              Tạp chí ({journals.length})
            </button>
            <button 
              onClick={() => setActiveTab("author")}
              className={cn(
                "flex-1 pb-3 text-[10px] font-bold uppercase tracking-widest transition-all", 
                activeTab === "author" ? "border-b-2 border-primary text-primary" : "text-on-surface-variant hover:text-on-surface"
              )}
            >
              Tác giả ({authors.length})
            </button>
          </div>

          <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
            {isStatusLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : getActiveList().length > 0 ? (
              getActiveList().map((item: any) => (
                <div key={item.id} className="flex justify-between items-center p-3 rounded-xl hover:bg-white/5 transition-all group">
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center shrink-0">
                      {activeTab === "keyword" && <Tag className="w-4 h-4 text-secondary" />}
                      {activeTab === "journal" && <BookOpen className="w-4 h-4 text-tertiary" />}
                      {activeTab === "author" && <Users className="w-4 h-4 text-primary" />}
                    </div>
                    <span className="text-sm font-bold text-on-surface group-hover:text-primary transition-colors truncate">
                      {item.name}
                    </span>
                  </div>
                  <button 
                    onClick={() => handleUnfollow(item.id, activeTab)}
                    className="p-1 rounded hover:bg-white/10 text-on-surface-variant hover:text-error transition-colors"
                    title="Hủy theo dõi"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))
            ) : (
              <p className="text-xs text-on-surface-variant text-center py-8">Chưa theo dõi mục nào</p>
            )}
          </div>
        </div>
      </aside>

      {/* Quick View Paper Abstract Modal */}
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
                <h2 className="font-display text-2xl sm:text-3xl font-bold leading-tight text-on-surface">{selectedPaper.title}</h2>
              </div>
              
              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-on-surface-variant border-y border-white/5 py-4">
                <div>
                  <span className="font-bold text-on-surface">Tác giả:</span> {selectedPaper.authors?.map(a => a.name).join(", ") || "N/A"}
                </div>
                <div>
                  <span className="font-bold text-on-surface">Tạp chí:</span> {selectedPaper.journal?.name || selectedPaper.source || "N/A"}
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
                  <h4 className="text-sm font-bold uppercase tracking-widest text-secondary">Từ khóa</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedPaper.keywords.map(kw => (
                      <span key={kw.id} className="text-xs bg-white/5 border border-white/10 px-2 py-1 rounded">
                        {kw.name}
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
                  onClick={() => {
                    handleAddBookmark(selectedPaper.id);
                    setSelectedPaper(null);
                  }}
                  className="px-5 py-2.5 rounded-xl bg-secondary/10 border border-secondary/20 text-xs font-bold uppercase tracking-widest text-secondary hover:bg-secondary/20 transition-all"
                >
                  Lưu dấu trang
                </button>
                {selectedPaper.doi && (
                  <a 
                    href={`https://doi.org/${selectedPaper.doi}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="px-5 py-2.5 rounded-xl gradient-btn text-xs font-bold uppercase tracking-widest text-white flex items-center gap-2"
                  >
                    Xem Nguồn Gốc <ExternalLink className="w-4 h-4" />
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Follow Modal Search and Add */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="glass-panel w-full max-w-xl rounded-2xl border border-white/10 p-6 shadow-2xl relative max-h-[80vh] flex flex-col">
            <header className="flex justify-between items-center mb-6">
              <h3 className="font-display text-xl font-bold">Theo dõi chủ đề & nguồn mới</h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-full hover:bg-white/5 text-on-surface-variant hover:text-on-surface transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </header>

            {/* Type selector */}
            <div className="flex gap-2 p-1 bg-surface-container-low border border-white/5 rounded-xl mb-4 shrink-0">
              <button 
                onClick={() => {
                  setModalSearchType("keyword");
                  setModalSearchResults([]);
                }}
                className={cn(
                  "flex-1 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all",
                  modalSearchType === "keyword" ? "bg-primary text-on-primary shadow-md" : "text-on-surface-variant hover:text-on-surface"
                )}
              >
                Chủ đề
              </button>
              <button 
                onClick={() => {
                  setModalSearchType("journal");
                  setModalSearchResults([]);
                }}
                className={cn(
                  "flex-1 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all",
                  modalSearchType === "journal" ? "bg-primary text-on-primary shadow-md" : "text-on-surface-variant hover:text-on-surface"
                )}
              >
                Tạp chí
              </button>
              <button 
                onClick={() => {
                  setModalSearchType("author");
                  setModalSearchResults([]);
                }}
                className={cn(
                  "flex-1 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all",
                  modalSearchType === "author" ? "bg-primary text-on-primary shadow-md" : "text-on-surface-variant hover:text-on-surface"
                )}
              >
                Tác giả
              </button>
            </div>

            {/* Search inputs */}
            <div className="flex gap-2 mb-4 shrink-0">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-outline" />
                <input 
                  type="text" 
                  value={modalSearchQuery}
                  onChange={(e) => setModalSearchQuery(e.target.value)}
                  onKeyDown={handleSearchKeyDown}
                  placeholder={
                    modalSearchType === "keyword" ? "Nhập tên chủ đề (ví dụ: machine learning)..." :
                    modalSearchType === "journal" ? "Nhập tên tạp chí (ví dụ: nature)..." :
                    "Nhập tên tác giả..."
                  }
                  className="w-full bg-surface-container border border-white/10 rounded-xl py-2 pl-10 pr-4 text-on-surface text-sm focus:outline-none focus:border-primary/50 transition-all placeholder:text-outline-variant"
                />
              </div>
              <button 
                onClick={handleSearchToFollow}
                disabled={isModalSearching}
                className="px-4 py-2 bg-primary text-on-primary rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-primary/95 transition-all disabled:opacity-50 shrink-0"
              >
                {isModalSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : "Tìm"}
              </button>
            </div>

            {/* Error Message */}
            {modalError && (
              <div className="text-error text-xs font-semibold mb-4 shrink-0">{modalError}</div>
            )}

            {/* Results scrollable area */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 min-h-[200px]">
              {isModalSearching ? (
                <div className="flex justify-center items-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              ) : modalSearchResults.length > 0 ? (
                modalSearchResults.map((item) => {
                  const following = isAlreadyFollowing(item.id, modalSearchType);
                  return (
                    <div key={item.id} className="flex justify-between items-center p-3 rounded-xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-all">
                      <div className="flex flex-col gap-1 overflow-hidden pr-4">
                        <span className="text-sm font-bold text-on-surface truncate">{item.name}</span>
                        {modalSearchType === "journal" && item.issn && (
                          <span className="text-[10px] text-on-surface-variant font-mono">ISSN: {item.issn}</span>
                        )}
                        {modalSearchType === "author" && item.affiliation && (
                          <span className="text-[10px] text-on-surface-variant truncate">{item.affiliation}</span>
                        )}
                      </div>
                      
                      {following ? (
                        <span className="text-[10px] font-bold text-success uppercase tracking-widest px-3 py-1.5 border border-success/30 rounded-lg bg-success/10 shrink-0">
                          Đang theo dõi
                        </span>
                      ) : (
                        <button 
                          onClick={() => handleFollow(item.id, modalSearchType)}
                          className="px-3 py-1.5 bg-primary/20 text-primary border border-primary/30 rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-primary hover:text-on-primary transition-all shrink-0"
                        >
                          Theo dõi
                        </button>
                      )}
                    </div>
                  );
                })
              ) : modalSearchQuery.trim() ? (
                <p className="text-xs text-on-surface-variant text-center py-12">Không tìm thấy kết quả</p>
              ) : (
                <p className="text-xs text-on-surface-variant text-center py-12">Nhập từ khóa và bấm Tìm kiếm</p>
              )}
            </div>

            <footer className="pt-4 border-t border-white/5 mt-4 shrink-0 flex justify-end">
              <button 
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-white/10 text-xs font-bold uppercase tracking-widest hover:bg-white/5 transition-all"
              >
                Đóng
              </button>
            </footer>
          </div>
        </div>
      )}
    </div>
  );
}
