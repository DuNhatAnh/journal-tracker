import React from "react";
import { Plus, Tag, BookOpen, Users, Loader2, X } from "lucide-react";
import { cn } from "@/src/lib/utils";

interface Keyword {
  id: number;
  name: string;
  slug?: string;
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

interface FollowingSidebarProps {
  keywords: Keyword[];
  journals: Journal[];
  authors: Author[];
  isStatusLoading: boolean;
  activeTab: "keyword" | "journal" | "author";
  setActiveTab: (tab: "keyword" | "journal" | "author") => void;
  onUnfollow: (id: number, type: "keyword" | "journal" | "author") => void;
  onOpenAddModal: () => void;
}

export function FollowingSidebar({
  keywords,
  journals,
  authors,
  isStatusLoading,
  activeTab,
  setActiveTab,
  onUnfollow,
  onOpenAddModal,
}: FollowingSidebarProps) {
  const getActiveList = () => {
    if (activeTab === "keyword") return keywords;
    if (activeTab === "journal") return journals;
    return authors;
  };

  return (
    <aside className="lg:col-span-4 space-y-6">
      <div className="glass-panel p-6 rounded-2xl space-y-6">
        <div className="flex justify-between items-center">
          <h3 className="font-display font-bold">Quản lý theo dõi</h3>
          <button 
            onClick={onOpenAddModal}
            className="p-1 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-all cursor-pointer"
            title="Theo dõi thêm"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
        
        <div className="flex border-b border-white/5">
          <button 
            onClick={() => setActiveTab("keyword")}
            className={cn(
              "flex-1 pb-3 text-[10px] font-bold uppercase tracking-widest transition-all cursor-pointer", 
              activeTab === "keyword" ? "border-b-2 border-primary text-primary" : "text-on-surface-variant hover:text-on-surface"
            )}
          >
            Chủ đề ({keywords.length})
          </button>
          <button 
            onClick={() => setActiveTab("journal")}
            className={cn(
              "flex-1 pb-3 text-[10px] font-bold uppercase tracking-widest transition-all cursor-pointer", 
              activeTab === "journal" ? "border-b-2 border-primary text-primary" : "text-on-surface-variant hover:text-on-surface"
            )}
          >
            Tạp chí ({journals.length})
          </button>
          <button 
            onClick={() => setActiveTab("author")}
            className={cn(
              "flex-1 pb-3 text-[10px] font-bold uppercase tracking-widest transition-all cursor-pointer", 
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
                  <span className="text-sm font-bold text-on-surface group-hover:text-primary transition-colors truncate text-left">
                    {item.name}
                  </span>
                </div>
                <button 
                  onClick={() => onUnfollow(item.id, activeTab)}
                  className="p-1 rounded hover:bg-white/10 text-on-surface-variant hover:text-error transition-colors cursor-pointer"
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
  );
}
