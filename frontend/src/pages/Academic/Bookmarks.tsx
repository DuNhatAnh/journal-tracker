import { useState, useEffect, useCallback } from "react";
import { BookmarkX, ArrowRight, ExternalLink, Loader2, Edit3, Save, X } from "lucide-react";
import { cn } from "@/src/lib/utils";
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

export default function Bookmarks() {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editNote, setEditNote] = useState("");
  
  const [data, setData] = useState<Bookmark[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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

  useEffect(() => {
    fetchBookmarks();
  }, [fetchBookmarks]);

  const deleteBookmark = async (id: number) => {
    try {
      await api.delete(`/bookmarks/${id}`);
      fetchBookmarks();
    } catch (err) {
      console.error(err);
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

  return (
    <div className="space-y-12 pb-20">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h2 className="font-display text-4xl font-bold text-on-surface">Dấu trang</h2>
          <p className="text-on-surface-variant mt-2">Quản lý các bài báo học thuật đã lưu và ghi chú cá nhân.</p>
        </div>
        <div className="flex p-1 bg-surface-container-low border border-white/5 rounded-xl">
           <button className="px-6 py-2.5 rounded-lg bg-primary text-on-primary text-xs font-bold uppercase tracking-widest shadow-lg">Bài báo đã lưu</button>
        </div>
      </header>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : data?.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
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
                <button 
                  onClick={() => deleteBookmark(bookmark.id)}
                  className="text-on-surface-variant hover:text-error transition-colors p-1"
                >
                  <BookmarkX className="w-5 h-5" />
                </button>
              </div>

              <h3 className="font-display text-xl font-bold leading-tight mb-4 group-hover:text-primary transition-colors">{bookmark.paper.title}</h3>
              
              {/* Note section */}
              <div className="mb-6 flex-1 flex flex-col">
                {editingId === bookmark.id ? (
                  <div className="space-y-2 flex-1">
                    <textarea 
                      value={editNote}
                      onChange={(e) => setEditNote(e.target.value)}
                      className="w-full h-full min-h-[80px] bg-surface-container-high border border-white/10 rounded-lg p-3 text-sm text-on-surface focus:outline-none focus:border-primary/50"
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
                <button className="flex items-center gap-1 text-primary text-[10px] font-bold uppercase tracking-widest hover:text-tertiary transition-all">
                  Xem <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 text-on-surface-variant">
          Bạn chưa lưu bài báo nào. Hãy sử dụng thanh tìm kiếm để khám phá.
        </div>
      )}
    </div>
  );
}
