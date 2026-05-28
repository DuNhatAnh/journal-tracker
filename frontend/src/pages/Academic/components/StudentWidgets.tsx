import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { BookMarked, Search, ArrowRight, Lightbulb } from "lucide-react";
import { DashboardData, PaperDetail } from "../types";
import { api } from "@/src/lib/api";

interface MyLibraryWidgetProps {
  bookmarkedIds: Set<number>;
  onSelectPaper: (paper: PaperDetail) => void;
}

export function MyLibraryWidget({ bookmarkedIds, onSelectPaper }: MyLibraryWidgetProps) {
  const [savedPapers, setSavedPapers] = useState<DashboardData['recentPapers'] | null>(null);

  useEffect(() => {
    api.get<{data: any[]}>('/bookmarks')
      .then(res => {
        const mapped = (res.data || []).map(b => {
          const p = b.paper;
          return {
            id: p.id,
            title: p.title,
            journal: p.journal?.name || "Khác",
            authors: p.authors?.map((a: any) => a.name).join(", ") || "Chưa rõ tác giả",
            time: `${p.published_year ?? ""}`,
            impact: p.citations_count ? Math.round((p.citations_count / 10) * 10) / 10 : 0,
            citations: p.citations_count ?? 0,
            doi: p.doi ?? null,
            abstract: p.abstract ?? null,
            keywords: (p.keywords || []).map((k: any) => ({ id: k.id, name: k.name })),
          };
        });
        setSavedPapers(mapped);
      })
      .catch(err => console.error(err));
  }, []);

  if (!savedPapers) return (
    <section className="glass-panel p-6 rounded-xl animate-pulse">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-5 h-5 rounded-full bg-white/20" />
        <div className="h-5 w-32 bg-white/20 rounded" />
      </div>
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-12 bg-white/5 rounded-xl border border-white/10" />
        ))}
      </div>
    </section>
  );

  const topSaved = savedPapers.slice(0, 3);

  return (
    <section className="glass-panel p-6 rounded-xl">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 text-primary">
          <BookMarked className="w-5 h-5" />
          <h3 className="font-display font-bold">Thư viện của tôi</h3>
        </div>
        <span className="text-xs font-mono bg-primary/10 text-primary px-2 py-0.5 rounded-full">{bookmarkedIds.size} bài</span>
      </div>
      
      {topSaved.length > 0 ? (
        <div className="space-y-3">
          <p className="text-[10px] uppercase tracking-widest text-on-surface-variant font-bold mb-2">Đã lưu gần đây</p>
          {topSaved.map(paper => (
            <div 
              key={paper.id}
              onClick={() => onSelectPaper(paper)}
              className="p-3 rounded-lg border border-outline-variant/30 hover:border-primary/50 hover:bg-white/5 transition-all cursor-pointer group"
            >
              <h5 className="text-xs font-bold truncate group-hover:text-primary transition-colors">{paper.title}</h5>
              <p className="text-[10px] text-on-surface-variant mt-1 truncate">{paper.journal}</p>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-6 px-4 border border-dashed border-outline-variant/50 rounded-xl bg-white/5">
          <p className="text-sm text-on-surface-variant mb-2">Thư viện trống</p>
          <p className="text-xs text-on-surface-variant/70">Bấm biểu tượng Bookmark trên các bài báo để lưu lại đọc sau.</p>
        </div>
      )}
    </section>
  );
}

export function SearchTipsWidget() {
  return (
    <section className="glass-panel p-6 rounded-xl relative overflow-hidden group">
      <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-tertiary/10 rounded-full blur-2xl group-hover:bg-tertiary/20 transition-colors" />
      <div className="flex items-center gap-2 text-tertiary mb-3">
        <Lightbulb className="w-5 h-5" />
        <h3 className="font-display font-bold">Mẹo tìm kiếm</h3>
      </div>
      <ul className="space-y-3 text-sm text-on-surface-variant">
        <li className="flex items-start gap-2">
          <ArrowRight className="w-4 h-4 text-tertiary/70 shrink-0 mt-0.5" />
          <span>Sử dụng dấu ngoặc kép <code className="bg-black/20 px-1 rounded text-primary">"machine learning"</code> để tìm cụm từ chính xác.</span>
        </li>
        <li className="flex items-start gap-2">
          <ArrowRight className="w-4 h-4 text-tertiary/70 shrink-0 mt-0.5" />
          <span>Kết hợp bộ lọc năm xuất bản và tạp chí uy tín (Q1/Q2) để tìm tài liệu tham khảo tốt.</span>
        </li>
        <li className="flex items-start gap-2">
          <ArrowRight className="w-4 h-4 text-tertiary/70 shrink-0 mt-0.5" />
          <span>Lưu các bài báo hay để hệ thống tự động học sở thích và gợi ý chuẩn xác hơn cho bạn.</span>
        </li>
      </ul>
      <Link 
        to="/search" 
        className="w-full mt-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-xs font-bold uppercase tracking-widest transition-colors flex items-center justify-center gap-2 block text-center text-on-surface hover:text-primary"
      >
        Đến trang Tìm kiếm <Search className="w-3 h-3" />
      </Link>
    </section>
  );
}
