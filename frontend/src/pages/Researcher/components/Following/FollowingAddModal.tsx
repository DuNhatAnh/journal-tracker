import React, { useState } from "react";
import { X, Search, Loader2 } from "lucide-react";
import { cn } from "@/src/lib/utils";
import { api } from "@/src/lib/api";

interface FollowingAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  onFollow: (id: number, type: "keyword" | "journal" | "author") => Promise<void>;
  isAlreadyFollowing: (id: number, type: "keyword" | "journal" | "author") => boolean;
}

export function FollowingAddModal({
  isOpen,
  onClose,
  onFollow,
  isAlreadyFollowing,
}: FollowingAddModalProps) {
  const [modalSearchType, setModalSearchType] = useState<"keyword" | "journal" | "author">("keyword");
  const [modalSearchQuery, setModalSearchQuery] = useState("");
  const [modalSearchResults, setModalSearchResults] = useState<any[]>([]);
  const [isModalSearching, setIsModalSearching] = useState(false);
  const [modalError, setModalError] = useState("");

  if (!isOpen) return null;

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

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSearchToFollow();
    }
  };

  const handleFollowClick = async (id: number) => {
    await onFollow(id, modalSearchType);
    // Remove followed item from search list
    setModalSearchResults(prev => prev.filter(item => item.id !== id));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="glass-panel w-full max-w-xl rounded-2xl border border-white/10 p-6 shadow-2xl relative max-h-[80vh] flex flex-col">
        <header className="flex justify-between items-center mb-6">
          <h3 className="font-display text-xl font-bold">Theo dõi chủ đề & nguồn mới</h3>
          <button 
            onClick={onClose}
            className="p-1 rounded-full hover:bg-white/5 text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer"
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
              "flex-1 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all cursor-pointer",
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
              "flex-1 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all cursor-pointer",
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
              "flex-1 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all cursor-pointer",
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
              className="w-full bg-surface-container border border-white/10 rounded-xl py-2 pl-10 pr-4 text-on-surface text-sm focus:outline-none focus:border-primary/50 transition-all placeholder:text-outline-variant text-left"
            />
          </div>
          <button 
            onClick={handleSearchToFollow}
            disabled={isModalSearching}
            className="px-4 py-2 bg-primary text-on-primary rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-primary/95 transition-all disabled:opacity-50 shrink-0 cursor-pointer"
          >
            {isModalSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : "Tìm"}
          </button>
        </div>

        {/* Error Message */}
        {modalError && (
          <div className="text-error text-xs font-semibold mb-4 shrink-0 text-left">{modalError}</div>
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
                  <div className="flex flex-col gap-1 overflow-hidden pr-4 text-left">
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
                      onClick={() => handleFollowClick(item.id)}
                      className="px-3 py-1.5 bg-primary/20 text-primary border border-primary/30 rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-primary hover:text-on-primary transition-all shrink-0 cursor-pointer"
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
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-white/10 text-xs font-bold uppercase tracking-widest hover:bg-white/5 transition-all cursor-pointer"
          >
            Đóng
          </button>
        </footer>
      </div>
    </div>
  );
}
