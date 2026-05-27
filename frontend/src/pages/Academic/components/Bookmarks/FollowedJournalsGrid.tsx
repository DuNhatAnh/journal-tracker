import React from "react";
import { X } from "lucide-react";

interface Journal {
  id: number;
  name: string;
}

interface FollowedJournalsGridProps {
  journals: Journal[];
  loading: boolean;
  onDeleteJournal: (id: number, name: string) => void;
}

export function FollowedJournalsGrid({
  journals,
  loading,
  onDeleteJournal,
}: FollowedJournalsGridProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="glass-panel p-6 rounded-2xl flex flex-col h-[160px] gap-4 border border-white/10 animate-pulse relative overflow-hidden bg-surface-container/30"
          >
            <div
              className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/5 to-transparent animate-[shimmer_1.5s_infinite]"
              style={{ animationDelay: `${i * 0.08}s` }}
            />
            <div className="flex justify-between items-start">
              <div className="h-5 bg-white/10 rounded w-16" />
              <div className="w-5 h-5 bg-white/10 rounded-full" />
            </div>
            <div className="space-y-2 mt-auto">
              <div className="h-5 bg-white/10 rounded w-full" />
              <div className="h-5 bg-white/8 rounded w-2/3" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!journals || journals.length === 0) {
    return (
      <div className="text-center py-20 text-on-surface-variant">
        Bạn chưa theo dõi tạp chí nào. Hãy khám phá và theo dõi các tạp chí trong ngành.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6 animate-in fade-in duration-300">
      {journals.map((journal) => (
        <div
          key={journal.id}
          className="glass-panel p-6 rounded-2xl flex flex-col h-[160px] gap-4 border border-white/10 hover:border-primary/30 transition-all group bg-surface-container/30 text-left"
        >
          <div className="flex justify-between items-start">
            <span className="px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest border bg-tertiary/10 text-tertiary border-tertiary/20">
              Tạp chí
            </span>
            <button
              onClick={() => onDeleteJournal(journal.id, journal.name)}
              className="p-1.5 rounded-full hover:bg-error/10 text-on-surface-variant hover:text-error transition-colors shrink-0 cursor-pointer"
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
  );
}
