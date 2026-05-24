import { useState, useEffect, useCallback } from "react";
import { BookmarkX, ArrowRight, ExternalLink, Loader2, Edit3, Save, X, Download } from "lucide-react";
import toast from "react-hot-toast";
import { cn, cleanTitle } from "@/src/lib/utils";
import { api } from "@/src/lib/api";

interface Bookmark {
  id: number;
  note: string | null;
  paper: {
    id: number;
    title: string;
    abstract: string;
    source: string;
    published_year: number;
    keywords: { name: string }[];
    journal?: { name: string };
  };
}

interface Keyword {
  id: number;
  name: string;
  slug: string;
}

export default function Bookmarks() {
  const userStr = localStorage.getItem("user");
  const user = userStr ? JSON.parse(userStr) : null;
  const role = user?.role || "student";
  const showExport = role === "researcher" || role === "admin";

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editNote, setEditNote] = useState("");
  
  const [data, setData] = useState<Bookmark[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  const [activeTab, setActiveTab] = useState<"papers" | "keywords" | "journals">("papers");
  const [followedKeywords, setFollowedKeywords] = useState<Keyword[]>([]);
  const [followedJournals, setFollowedJournals] = useState<any[]>([]);
  const [isKeywordsLoading, setIsKeywordsLoading] = useState(false);
  const [selectedPaper, setSelectedPaper] = useState<any | null>(null);
  const [bookmarkLoadingIds, setBookmarkLoadingIds] = useState<Set<number>>(new Set());

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const token = localStorage.getItem("token");
      const headers: HeadersInit = {};
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
      const response = await fetch("/api/bookmarks/export", {
        headers,
      });

      if (!response.ok) {
        throw new Error("Không thể xuất báo cáo.");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `bao_cao_dau_trang_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert("Lỗi khi xuất báo cáo");
    } finally {
      setIsExporting(false);
    }
  };

  const fetchBookmarks = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await api.get<{ data: Bookmark[] }>("/bookmarks");
      setData(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchFollowedData = useCallback(async () => {
    setIsKeywordsLoading(true);
    try {
      const res = await api.get<{ keywords: Keyword[], journals: any[] }>("/following/status");
      setFollowedKeywords(res.keywords || []);
      setFollowedJournals(res.journals || []);
    } catch (err) {
      console.error("Lỗi khi tải dữ liệu theo dõi:", err);
    } finally {
      setIsKeywordsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === "papers") {
      fetchBookmarks();
    } else {
      fetchFollowedData();
    }
  }, [activeTab, fetchBookmarks, fetchFollowedData]);

  const deleteKeyword = async (id: number, name: string) => {
    try {
      await api.delete(`/following/keywords/${id}`);
      fetchFollowedData();
      toast.success(`Đã hủy lưu từ khóa "${name}"!`);
    } catch (err) {
      console.error(err);
      toast.error("Lỗi khi hủy lưu từ khóa. Vui lòng thử lại.");
    }
  };

  const deleteJournal = async (id: number, name: string) => {
    try {
      await api.delete(`/following/journals/${id}`);
      fetchFollowedData();
      toast.success(`Đã hủy theo dõi tạp chí "${name}"!`);
    } catch (err) {
      console.error(err);
      toast.error("Lỗi khi hủy theo dõi tạp chí. Vui lòng thử lại.");
    }
  };

  const deleteBookmark = async (id: number) => {
    try {
      await api.delete(`/bookmarks/${id}`);
      fetchBookmarks();
      toast.success("Đã xóa bài báo khỏi danh sách lưu!");
    } catch (err) {
      console.error(err);
      toast.error("Lỗi khi xóa bài báo. Vui lòng thử lại.");
    }
  };

  const updateBookmark = async (id: number, note: string) => {
    try {
      await api.put(`/bookmarks/${id}`, { note });
      setEditingId(null);
      fetchBookmarks();
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleBookmarkInModal = async (paperId: number) => {
    if (bookmarkLoadingIds.has(paperId)) return;
    setBookmarkLoadingIds(prev => new Set(prev).add(paperId));
    try {
      await api.delete(`/bookmarks/paper/${paperId}`);
      toast.success("Đã hủy lưu bài báo!");
      setSelectedPaper(null);
      fetchBookmarks();
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

  return (
    <div className="space-y-12 pb-20">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h2 className="font-display text-4xl font-bold text-on-surface">Đã lưu</h2>
          <p className="text-on-surface-variant mt-2">Quản lý các bài báo học thuật đã lưu và ghi chú cá nhân.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex p-1 bg-surface-container-low border border-white/5 rounded-xl gap-1">
             <button 
               onClick={() => setActiveTab("papers")}
               className={cn(
                 "px-6 py-2.5 rounded-lg text-xs font-bold uppercase tracking-widest transition-all",
                 activeTab === "papers" ? "bg-primary text-on-primary shadow-lg" : "text-on-surface-variant hover:text-on-surface"
               )}
             >
               Bài báo đã lưu
             </button>
             <button 
               onClick={() => setActiveTab("keywords")}
               className={cn(
                 "px-6 py-2.5 rounded-lg text-xs font-bold uppercase tracking-widest transition-all",
                 activeTab === "keywords" ? "bg-primary text-on-primary shadow-lg" : "text-on-surface-variant hover:text-on-surface"
               )}
             >
               Chủ đề quan tâm
             </button>
             <button 
               onClick={() => setActiveTab("journals")}
               className={cn(
                 "px-6 py-2.5 rounded-lg text-xs font-bold uppercase tracking-widest transition-all",
                 activeTab === "journals" ? "bg-primary text-on-primary shadow-lg" : "text-on-surface-variant hover:text-on-surface"
               )}
             >
               Tạp chí
             </button>
          </div>
          {showExport && (
            <button 
               onClick={handleExport}
               disabled={isExporting}
               className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-surface-container-low border border-white/5 text-on-surface hover:bg-white/5 transition-all text-xs font-bold uppercase tracking-widest disabled:opacity-50"
            >
               {isExporting ? <Loader2 className="w-4 h-4 animate-spin text-primary" /> : <Download className="w-4 h-4 text-tertiary" />}
               Xuất báo cáo (CSV)
            </button>
          )}
        </div>
      </header>

      {activeTab === "papers" ? (
        isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : data?.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 animate-in fade-in duration-300">
            {data.map((bookmark: Bookmark) => (
              <div key={bookmark.id} className="glass-panel p-8 rounded-2xl relative group hover:-translate-y-1 transition-all duration-300 flex flex-col h-full border-t border-white/5">
                <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                
                <div className="flex justify-between items-start mb-6">
                  <span className={cn(
                    "px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest border",
                    bookmark.id % 2 === 0 ? "bg-secondary-container/20 text-secondary border-secondary/30" : "bg-primary/10 text-primary border-primary/20"
                  )}>
                    {bookmark.paper.keywords?.[0]?.name || "Nghiên cứu"}
                  </span>
                  <div className="relative group/tooltip">
                    <button 
                      onClick={() => deleteBookmark(bookmark.id)}
                      className="text-on-surface-variant hover:text-error transition-colors p-1"
                    >
                      <BookmarkX className="w-5 h-5" />
                    </button>
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-1 text-[10px] font-bold text-on-surface bg-surface-container-high rounded-lg opacity-0 pointer-events-none group-hover/tooltip:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10 shadow-xl border border-outline-variant/30">
                      Hủy lưu bài báo
                    </div>
                  </div>
                </div>

                <h3 className="font-display text-xl font-bold leading-tight mb-4 group-hover:text-primary transition-colors">{cleanTitle(bookmark.paper.title)}</h3>
                
                {/* Note section */}
                <div className="mb-6 flex-1 flex flex-col">
                  {editingId === bookmark.id ? (
                    <div className="space-y-2 flex-1 relative z-10">
                      <textarea 
                        value={editNote}
                        onChange={(e) => setEditNote(e.target.value)}
                        className="w-full min-h-[80px] bg-surface-container-high border border-white/10 rounded-lg p-3 text-sm text-on-surface focus:outline-none focus:border-primary/50 resize-y"
                        placeholder="Thêm ghi chú cá nhân..."
                      />
                      <div className="flex gap-2 justify-end">
                        <button onClick={() => setEditingId(null)} className="p-2 text-on-surface-variant hover:text-on-surface"><X className="w-4 h-4" /></button>
                        <button 
                          onClick={() => updateBookmark(bookmark.id, editNote)}
                          className="px-3 py-1.5 bg-primary/20 text-primary text-xs font-bold rounded flex items-center gap-2"
                        >
                          <Save className="w-3 h-3" /> Lưu
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="group/note relative flex-1 cursor-pointer bg-surface-container-low/30 rounded-lg p-4 border border-transparent hover:border-white/5 transition-all" onClick={() => { setEditingId(bookmark.id); setEditNote(bookmark.note || ""); }}>
                      <div className="absolute top-2 right-2 opacity-0 group-hover/note:opacity-100 transition-opacity text-tertiary">
                        <Edit3 className="w-3 h-3" />
                      </div>
                      {bookmark.note ? (
                        <p className="text-sm text-tertiary italic">"{bookmark.note}"</p>
                      ) : (
                        <p className="text-xs text-on-surface-variant/50 italic flex items-center gap-2"><Edit3 className="w-3 h-3" /> Nhấn để thêm ghi chú</p>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between pt-6 border-t border-white/5 mt-auto">
                  <div className="space-y-0.5">
                    <p className="text-[10px] font-bold text-tertiary uppercase tracking-widest">{bookmark.paper.journal?.name || bookmark.paper.source}</p>
                    <p className="text-[10px] font-medium text-outline-variant">{bookmark.paper.published_year}</p>
                  </div>
                   <button 
                     onClick={() => setSelectedPaper(bookmark.paper)}
                     className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-primary/25 bg-primary/5 text-primary text-[10px] font-bold uppercase tracking-widest hover:bg-primary/20 hover:border-primary/50 transition-all hover:scale-[1.03] active:scale-[0.97]"
                   >
                     Xem <ArrowRight className="w-3.5 h-3.5" />
                   </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 text-on-surface-variant">
            Bạn chưa lưu bài báo nào. Hãy sử dụng thanh tìm kiếm để khám phá.
          </div>
        )
      ) : activeTab === "keywords" ? (
        isKeywordsLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : followedKeywords.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 animate-in fade-in duration-300">
            {followedKeywords.map((kw) => (
              <div 
                key={kw.id} 
                className="glass-panel p-4 rounded-xl flex items-center justify-between gap-3 border border-white/10 hover:border-primary/30 transition-all group bg-surface-container/30"
              >
                <span className="font-display font-semibold text-sm text-on-surface truncate group-hover:text-primary transition-colors">
                  #{kw.name}
                </span>
                <button 
                  onClick={() => deleteKeyword(kw.id, kw.name)}
                  className="p-1.5 rounded-full hover:bg-error/10 text-on-surface-variant hover:text-error transition-colors shrink-0"
                  title="Hủy lưu chủ đề này"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 text-on-surface-variant">
            Bạn chưa lưu chủ đề/từ khóa nào. Hãy lưu các chủ đề quan tâm từ chi tiết bài báo.
          </div>
        )
      ) : (
        isKeywordsLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : followedJournals.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6 animate-in fade-in duration-300">
            {followedJournals.map((journal) => (
              <div 
                key={journal.id} 
                className="glass-panel p-6 rounded-2xl flex flex-col h-full gap-4 border border-white/10 hover:border-primary/30 transition-all group bg-surface-container/30"
              >
                <div className="flex justify-between items-start">
                  <span className="px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest border bg-tertiary/10 text-tertiary border-tertiary/20">
                    Tạp chí
                  </span>
                  <button 
                    onClick={() => deleteJournal(journal.id, journal.name)}
                    className="p-1.5 rounded-full hover:bg-error/10 text-on-surface-variant hover:text-error transition-colors shrink-0"
                    title="Hủy theo dõi tạp chí này"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <h3 className="font-display font-semibold text-lg text-on-surface group-hover:text-primary transition-colors line-clamp-2 mt-auto">
                  {journal.name}
                </h3>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 text-on-surface-variant">
            Bạn chưa theo dõi tạp chí nào. Hãy khám phá và theo dõi các tạp chí trong ngành.
          </div>
        )
      )}

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
                  {(selectedPaper.journal?.name || selectedPaper.source || "Nghiên cứu").toUpperCase()}
                </span>
                <h2 className="font-display text-2xl sm:text-3xl font-bold leading-tight text-on-surface">{cleanTitle(selectedPaper.title)}</h2>
              </div>
              
              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-on-surface-variant border-y border-white/5 py-4">
                <div>
                  <span className="font-bold text-on-surface">Tác giả:</span> {selectedPaper.authors?.map((a: any) => a.name).join(", ") || "N/A"}
                </div>
                <div>
                  <span className="font-bold text-on-surface">Tạp chí:</span> {selectedPaper.journal?.name || selectedPaper.source || "N/A"}
                </div>
                <div>
                  <span className="font-bold text-on-surface">Năm xuất bản:</span> {selectedPaper.published_year}
                </div>
                <div>
                  <span className="font-bold text-on-surface">Trích dẫn:</span> {selectedPaper.citations_count || 0}
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
                    {selectedPaper.keywords.map((kw: any, idx: number) => (
                      <span 
                        key={idx} 
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
                  onClick={() => handleToggleBookmarkInModal(selectedPaper.id)}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all bg-tertiary/20 text-tertiary border border-tertiary/30 hover:bg-tertiary/30"
                >
                  {bookmarkLoadingIds.has(selectedPaper.id) ? (
                    <span className="flex items-center gap-1"><Loader2 className="w-3.5 h-3.5 animate-spin" /> Đang xử lý...</span>
                  ) : (
                    "Hủy lưu bài báo"
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
