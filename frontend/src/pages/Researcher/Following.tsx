import { useState, useEffect, useCallback } from "react";
import { Activity, Clock, Quote, ArrowRight, Bell, Loader2, BookOpen, ExternalLink, BellOff } from "lucide-react";
import { api } from "@/src/lib/api";
import { cn } from "@/src/lib/utils";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";

interface FeedPaper {
  id: number;
  title: string;
  abstract?: string;
  published_year: number;
  citations: number;
  doi?: string;
  journal_name: string;
  journal_id: number;
  keywords: string[];
  authors: string;
}

interface FollowedJournal {
  id: number;
  name: string;
  field: string;
  papers_count: number;
}

export default function Following() {
  const [papers, setPapers] = useState<FeedPaper[]>([]);
  const [followedJournals, setFollowedJournals] = useState<FollowedJournal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [unfollowingIds, setUnfollowingIds] = useState<Set<number>>(new Set());

  const loadFeed = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await api.get<any>("/journals/feed");
      setPapers(res.papers || []);
      setFollowedJournals(res.followed_journals || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFeed();
  }, [loadFeed]);

  const handleUnfollow = async (journalId: number, journalName: string) => {
    if (unfollowingIds.has(journalId)) return;
    setUnfollowingIds(prev => new Set(prev).add(journalId));
    try {
      await api.delete(`/journals/${journalId}/follow`);
      toast.success(`Đã bỏ theo dõi ${journalName}`);
      await loadFeed();
    } catch {
      toast.error("Không thể bỏ theo dõi tạp chí này.");
    } finally {
      setUnfollowingIds(prev => { const s = new Set(prev); s.delete(journalId); return s; });
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pb-20">
      {/* Left: Paper feed */}
      <div className="lg:col-span-8 space-y-8">
        <header className="flex justify-between items-end mb-4">
          <div>
            <h2 className="font-display text-4xl font-bold">Cơ chế Theo dõi</h2>
            <p className="text-on-surface-variant mt-1">Bài báo mới nhất từ các tạp chí bạn đang theo dõi.</p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 glass-panel rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-white/5 transition-all text-on-surface">
            <Activity className="w-4 h-4 text-tertiary" /> Bảng tin trực tiếp
          </button>
        </header>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : papers.length === 0 ? (
          /* Empty state */
          <div className="flex flex-col items-center justify-center py-24 text-center space-y-6">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
              <Bell className="w-10 h-10 text-primary/50" />
            </div>
            <div>
              <h3 className="font-display text-2xl font-bold text-on-surface mb-2">Chưa có bài báo nào</h3>
              <p className="text-on-surface-variant max-w-md">
                Hãy theo dõi một tạp chí để bắt đầu nhận bài báo mới nhất từ các nguồn bạn quan tâm.
              </p>
            </div>
            <Link
              to="/dashboard"
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-on-primary font-bold text-sm hover:opacity-90 transition-all"
            >
              <BookOpen className="w-4 h-4" /> Khám phá tạp chí hàng đầu
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            <h3 className="font-display text-xl font-bold flex items-center gap-3">
              <Activity className="w-5 h-5 text-primary" /> Mới nhất từ tạp chí đang theo dõi
            </h3>

            {papers.map((paper) => (
              <article key={paper.id} className="glass-panel p-8 rounded-2xl relative group hover:bg-white/[0.02] transition-all">
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-[10px] font-bold uppercase tracking-widest bg-primary/10 text-primary px-2 py-0.5 rounded border border-primary/20">
                    {paper.journal_name}
                  </span>
                  <span className="flex items-center gap-1 text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">
                    <Clock className="w-3 h-3" /> {paper.published_year}
                  </span>
                </div>

                <h4 className="font-display text-xl font-bold mb-3 group-hover:text-primary transition-colors leading-snug">
                  {paper.title}
                </h4>

                {paper.abstract && (
                  <p className="text-sm text-on-surface-variant leading-relaxed mb-5 line-clamp-3">
                    {paper.abstract}
                  </p>
                )}

                {paper.keywords.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-5">
                    {paper.keywords.slice(0, 4).map((kw) => (
                      <span key={kw} className="text-[10px] bg-surface-container-high px-2 py-0.5 rounded text-on-surface-variant border border-white/5">
                        {kw}
                      </span>
                    ))}
                  </div>
                )}

                <div className="flex items-center justify-between pt-5 border-t border-white/5">
                  <div className="flex items-center gap-6">
                    <span className="text-[10px] font-bold text-tertiary uppercase tracking-widest truncate max-w-[200px]">
                      {paper.authors}
                    </span>
                    <span className="flex items-center gap-1.5 text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">
                      <Quote className="w-3 h-3" /> {paper.citations} Trích dẫn
                    </span>
                  </div>
                  {paper.doi && (
                    <a
                      href={`https://doi.org/${paper.doi}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-primary text-[10px] font-bold uppercase tracking-widest hover:text-tertiary transition-all"
                      onClick={e => e.stopPropagation()}
                    >
                      Xem bài <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      {/* Right: Followed journals sidebar */}
      <div className="lg:col-span-4 space-y-6">
        <div className="glass-panel rounded-2xl p-6 space-y-4">
          <h3 className="font-display text-lg font-bold flex items-center gap-2">
            <Bell className="w-5 h-5 text-primary" /> Tạp chí đang theo dõi
            <span className="ml-auto text-xs font-bold bg-primary/10 text-primary px-2 py-0.5 rounded">
              {followedJournals.length}
            </span>
          </h3>

          {followedJournals.length === 0 ? (
            <div className="text-center py-8 space-y-3">
              <BellOff className="w-8 h-8 text-on-surface-variant/30 mx-auto" />
              <p className="text-xs text-on-surface-variant">
                Chưa theo dõi tạp chí nào.{" "}
                <Link to="/dashboard" className="text-primary hover:underline">
                  Khám phá ngay
                </Link>
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {followedJournals.map((journal) => (
                <div
                  key={journal.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-surface-container/30 border border-white/5 group hover:border-primary/20 transition-all"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-on-surface truncate">{journal.name}</p>
                    <p className="text-[10px] text-on-surface-variant">{journal.papers_count} bài báo</p>
                  </div>
                  <button
                    onClick={() => handleUnfollow(journal.id, journal.name)}
                    disabled={unfollowingIds.has(journal.id)}
                    title="Bỏ theo dõi"
                    className="ml-2 p-1.5 rounded-lg text-on-surface-variant hover:text-error hover:bg-error/10 transition-all flex-shrink-0"
                  >
                    {unfollowingIds.has(journal.id)
                      ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      : <BellOff className="w-3.5 h-3.5" />
                    }
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="glass-panel rounded-2xl p-6 space-y-3">
          <h3 className="font-display text-base font-bold text-on-surface-variant uppercase tracking-widest text-xs">Gợi ý cho bạn</h3>
          <p className="text-xs text-on-surface-variant leading-relaxed">
            Vào trang <Link to="/dashboard" className="text-primary hover:underline font-bold">Tổng quan</Link> và nhấn biểu tượng <Bell className="w-3 h-3 inline text-primary" /> bên cạnh tạp chí để bắt đầu theo dõi.
          </p>
          <Link
            to="/dashboard"
            className="flex items-center gap-2 text-primary text-xs font-bold uppercase tracking-widest hover:text-tertiary transition-colors"
          >
            Xem tạp chí hàng đầu <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </div>
    </div>
  );
}
