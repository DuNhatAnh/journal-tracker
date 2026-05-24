import { useEffect, useState } from "react";
import { DashboardData, PaperDetail } from "../types";
import { BookmarkButton } from "./BookmarkButton";
import { api } from "@/src/lib/api";

interface RecentPapersProps {
  readPaperIds: Set<number>;
  onPaperClick: (paper: PaperDetail) => void;
  bookmarkedIds: Set<number>;
  loadingIds: Set<number>;
  bookmark: (id: number) => void;
}

export function RecentPapers({
  readPaperIds,
  onPaperClick,
  bookmarkedIds,
  loadingIds,
  bookmark
}: RecentPapersProps) {
  const [data, setData] = useState<{papers: DashboardData['recentPapers'], updatedAt: string} | null>(null);

  useEffect(() => {
    api.get<{recent_papers: any[], recent_papers_updated_at: string}>('/dashboard/recent')
      .then(res => {
        const mapped = (res.recent_papers || []).map(p => ({
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
        }));
        setData({ papers: mapped, updatedAt: res.recent_papers_updated_at });
      })
      .catch(err => console.error(err));
  }, []);

  if (!data) return (
    <section className="pt-4">
      <header className="flex justify-between items-end mb-6">
        <div>
          <h3 className="font-display text-2xl font-bold text-on-surface">Vừa xuất bản</h3>
          <p className="text-sm text-on-surface-variant">Các bổ sung mới nhất trên hệ thống.</p>
        </div>
      </header>
      <div className="glass-panel rounded-xl overflow-hidden divide-y divide-white/5 animate-pulse">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="p-6 flex gap-4">
            <div className="flex-1 space-y-2">
              <div className="h-3 w-24 bg-white/10 rounded" />
              <div className="h-4 w-full bg-white/15 rounded" />
              <div className="h-3 w-48 bg-white/10 rounded" />
            </div>
            <div className="w-10 h-10 rounded-full bg-white/10" />
          </div>
        ))}
      </div>
    </section>
  );

  const { papers, updatedAt } = data;

  return (
    <section className="pt-4">
      <header className="flex justify-between items-end mb-6">
        <div>
          <div className="flex items-baseline gap-3">
            <h3 className="font-display text-2xl font-bold text-on-surface">Vừa xuất bản</h3>
            {updatedAt && (
              <span className="text-[10px] text-on-surface-variant/60 font-mono">
                Cập nhật: {updatedAt}
              </span>
            )}
          </div>
          <p className="text-sm text-on-surface-variant">Các bổ sung mới nhất trên hệ thống.</p>
        </div>
        <span className="text-[10px] font-mono text-on-surface-variant/50 uppercase tracking-widest">
          {papers.length} bài báo
        </span>
      </header>

      <div className="glass-panel rounded-xl overflow-y-auto max-h-[650px] divide-y divide-white/5">
        {papers.map((paper) => {
          const isNew = !readPaperIds.has(paper.id);
          return (
            <div
              key={paper.id}
              id={`paper-row-${paper.id}`}
              className="p-6 hover:bg-white/5 transition-all group flex flex-col md:flex-row gap-4 justify-between items-start md:items-center cursor-pointer"
              onClick={() => onPaperClick(paper)}
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="bg-primary/10 text-primary text-[10px] font-bold px-2 py-0.5 rounded border border-primary/20 uppercase tracking-widest">{paper.journal}</span>
                  <span className="text-[10px] text-on-surface-variant uppercase tracking-widest">{paper.time}</span>
                  {isNew && (
                    <span className="bg-error/20 text-error text-[9px] font-bold px-1.5 py-0.5 rounded-full border border-error/30 uppercase tracking-widest animate-pulse">Mới</span>
                  )}
                </div>
                <h4 className="font-display font-bold text-on-surface group-hover:text-primary transition-colors">{paper.title}</h4>
                <p className="text-sm text-on-surface-variant mt-1">{paper.authors}</p>
              </div>
              <div className="flex items-center gap-6">
                <div className="text-right hidden md:block">
                  <p className="text-[10px] font-bold text-primary uppercase tracking-widest">Ảnh hưởng: {paper.impact}</p>
                  <p className="text-[10px] text-on-surface-variant uppercase tracking-widest">{paper.citations} Trích dẫn</p>
                </div>
                <BookmarkButton
                  paperId={paper.id}
                  bookmarkedIds={bookmarkedIds}
                  loadingIds={loadingIds}
                  bookmark={bookmark}
                  className="w-10 h-10 rounded-full border-2 border-outline-variant/30 bg-surface-container/50 hover:border-tertiary"
                />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
