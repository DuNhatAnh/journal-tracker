import { Link } from "react-router-dom";
import { ArrowRight, Info, Check } from "lucide-react";
import { DashboardData } from "../types";
import { useApiQuery } from "../../../hooks/useApiQuery";

interface TopJournalsListProps {
  isResearcher: boolean;
  onSelectJournal: (journal: NonNullable<DashboardData['topJournals'][0]>) => void;
  followedJournalIds: Set<number>;
  followingJournalIds: Set<number>;
  toggleFollowJournal: (id: number, name: string) => void;
}

export function TopJournalsList({
  isResearcher,
  onSelectJournal,
  followedJournalIds,
  followingJournalIds,
  toggleFollowJournal
}: TopJournalsListProps) {
  const { data: apiData, loading } = useApiQuery<{top_journals: DashboardData['topJournals'], top_journals_updated_at: string}>('/dashboard/journals');

  const data = apiData ? {
    journals: apiData.top_journals,
    updatedAt: apiData.top_journals_updated_at
  } : null;

  if (loading || !data) return (
    <section className="space-y-4">
      <header className="flex justify-between items-end px-2">
        <div>
          <h3 className="font-display text-xl font-bold">Các Tạp chí Nổi bật</h3>
          <p className="text-[10px] text-on-surface-variant/60 font-mono mt-1">Đang tải...</p>
        </div>
      </header>
      <div className="glass-panel rounded-xl overflow-hidden divide-y divide-white/5 animate-pulse">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="p-4 flex gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10" />
            <div className="flex-1 space-y-2 py-1">
              <div className="h-3 w-3/4 bg-white/10 rounded" />
              <div className="h-2 w-1/2 bg-white/10 rounded" />
            </div>
          </div>
        ))}
      </div>
    </section>
  );

  const { journals, updatedAt } = data;

  return (
    <section className="space-y-4">
      <header className="flex justify-between items-end px-2">
        <div>
          <h3 className="font-display text-xl font-bold">Các Tạp chí Nổi bật</h3>
          {updatedAt && (
            <p className="text-[10px] text-on-surface-variant/60 font-mono mt-1">
              Cập nhật: {updatedAt}
            </p>
          )}
        </div>
        {isResearcher && (
          <Link to="/journals" className="flex items-center gap-1 text-primary text-[10px] font-bold uppercase tracking-widest hover:text-tertiary transition-colors">
            Tất cả <ArrowRight className="w-3 h-3" />
          </Link>
        )}
      </header>
      <div className="glass-panel rounded-xl overflow-y-auto max-h-[500px] divide-y divide-white/5">
        {journals.map((journal) => {
          const isFollowed = followedJournalIds.has(journal.id);
          const isFollowing = followingJournalIds.has(journal.id);
          return (
            <div key={journal.id} className="p-4 hover:bg-white/5 transition-all group flex items-start gap-4">
              <div className={`w-12 h-12 shrink-0 rounded-xl flex items-center justify-center font-display font-bold text-xl shadow-inner ${journal.color}`}>
                {journal.initial}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <h5
                    className="font-bold text-sm leading-tight mb-1 truncate cursor-pointer group-hover:text-primary transition-colors"
                    onClick={() => onSelectJournal(journal)}
                  >
                    {journal.name}
                  </h5>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFollowJournal(journal.id, journal.name);
                    }}
                    disabled={isFollowing}
                    className={`shrink-0 h-6 px-2 rounded-full text-[9px] font-bold uppercase tracking-widest border transition-all flex items-center gap-1
                      ${isFollowed
                        ? 'bg-primary/20 text-primary border-primary/30 hover:bg-error/20 hover:text-error hover:border-error/30 group-hover:content-["Hủy"]'
                        : 'bg-surface-container hover:bg-primary hover:text-white border-outline-variant/30 hover:border-primary'}
                      ${isFollowing ? 'opacity-50 cursor-not-allowed' : ''}
                    `}
                    title={isFollowed ? "Hủy theo dõi" : "Theo dõi"}
                  >
                    {isFollowing ? (
                      <span className="animate-pulse">...</span>
                    ) : isFollowed ? (
                      <>
                        <Check className="w-2.5 h-2.5" />
                        <span>Đã lưu</span>
                      </>
                    ) : (
                      'Theo dõi'
                    )}
                  </button>
                </div>
                <div className="flex items-center gap-2 text-[10px] text-on-surface-variant">
                  <span className="truncate">{journal.field}</span>
                  <span>•</span>
                  <span>IF: <span className="font-mono text-tertiary font-bold">{journal.impact_factor}</span></span>
                </div>
                {journal.issn && (
                  <div className="flex items-center gap-1 mt-1 text-[9px] text-on-surface-variant/60 font-mono">
                    <Info className="w-3 h-3" /> ISSN: {journal.issn}
                  </div>
                )}
                {!journal.issn && journal.issn_note && (
                  <div className="flex items-center gap-1 mt-1 text-[9px] text-on-surface-variant/60 font-mono italic">
                    <Info className="w-3 h-3" /> {journal.issn_note}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
