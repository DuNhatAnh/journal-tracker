import { Info } from "lucide-react";
import { cn } from "@/src/lib/utils";

interface AiInsightCardProps {
  insight: {
    level: string;
    message: string;
    color: string;
    bg: string;
  } | null;
  loading?: boolean;
}

export function AiInsightCard({ insight, loading }: AiInsightCardProps) {
  if (loading) {
    return (
      <div className="p-5 rounded-2xl flex items-start gap-4 transition-all bg-white/5 border border-white/10 animate-pulse h-[80px]">
        <div className="w-5 h-5 rounded-full bg-white/10 shrink-0" />
        <div className="space-y-2 flex-1">
          <div className="h-4 w-32 bg-white/15 rounded" />
          <div className="h-3 w-5/6 bg-white/10 rounded" />
        </div>
      </div>
    );
  }

  if (!insight) return null;

  return (
    <div className={cn("p-5 rounded-2xl flex items-start gap-4 transition-all shadow-md", insight.bg)}>
      <Info className={cn("w-5 h-5 shrink-0 mt-0.5", insight.color)} />
      <div className="space-y-1">
        <h4 className={cn("font-display text-sm font-black uppercase tracking-wider", insight.color)}>
          AI Insight: {insight.level}
        </h4>
        <p className="text-xs text-on-surface-variant leading-relaxed">
          {insight.message}
        </p>
      </div>
    </div>
  );
}
