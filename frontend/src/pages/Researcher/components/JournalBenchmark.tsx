import { useState, useMemo } from "react";
import Chart from "react-apexcharts";
import { Award, Loader2 } from "lucide-react";
import { cn } from "@/src/lib/utils";
import { useApiQuery } from "../../../hooks/useApiQuery";

interface JournalRecord {
  id: number;
  name: string;
  field: string;
  h_index: number;
  papers_count: number;
}

interface JournalBenchmarkProps {
  keywordId: number | null;
  followedJournalIds: Set<number>;
  followingJournalLoadingIds: Set<number>;
  onToggleFollow: (journalId: number) => void;
}

export function JournalBenchmark({
  keywordId,
  followedJournalIds,
  followingJournalLoadingIds,
  onToggleFollow
}: JournalBenchmarkProps) {
  const [isComparing, setIsComparing] = useState(false);

  // useApiQuery for journals
  const { data: journalsData, loading } = useApiQuery<JournalRecord[]>(
    keywordId ? `/trends/${keywordId}/journals` : "",
    { enabled: !!keywordId }
  );

  const journals = journalsData || [];

  const journalChartData = useMemo(() => {
    if (!journals) return { categories: [], series: [] };
    const categories = journals.map(j => j.name.split(' ').slice(0, 3).join(' '));
    const series = [
      {
        name: "Chỉ số H-Index",
        data: journals.map(j => j.h_index)
      },
      {
        name: "Số bài viết chủ đề",
        data: journals.map(j => j.papers_count)
      }
    ];
    return { categories, series };
  }, [journals]);

  return (
    <div className="space-y-4 min-h-[220px] relative">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Award className="w-5 h-5 text-tertiary" />
          <h3 className="font-display text-xl font-bold">Tạp chí khuyên dùng tối ưu</h3>
        </div>
        <button 
          onClick={() => setIsComparing(!isComparing)}
          disabled={loading || journals.length === 0}
          className="text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 border border-white/10 rounded-lg hover:bg-white/5 transition-all text-on-surface disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isComparing ? "Xem dạng thẻ" : "So sánh tạp chí"}
        </button>
      </div>
      
      {loading ? (
        <div className="glass-panel p-6 rounded-2xl flex flex-col items-center justify-center h-44 font-mono text-xs uppercase tracking-widest text-on-surface-variant animate-pulse border border-white/5">
          <Loader2 className="w-6 h-6 text-tertiary animate-spin mb-2" />
          Đang tính toán H-Index tạp chí gợi ý...
        </div>
      ) : isComparing ? (
        <div className="glass-panel p-6 rounded-2xl">
          <h4 className="font-display text-sm font-bold text-on-surface mb-4">So sánh H-Index & Số bài viết tạp chí gợi ý</h4>
          <Chart
            options={{
              chart: { id: "journal-comparison-chart", toolbar: { show: false }, background: 'transparent' },
              plotOptions: { bar: { horizontal: false, columnWidth: '45%', borderRadius: 4 } },
              dataLabels: { enabled: false },
              stroke: { show: true, width: 2, colors: ['transparent'] },
              xaxis: {
                categories: journalChartData.categories,
                labels: { style: { colors: '#9CA3AF', fontSize: '9px', fontFamily: 'JetBrains Mono' } }
              },
              yaxis: {
                labels: { style: { colors: '#9CA3AF', fontSize: '9px', fontFamily: 'JetBrains Mono' } }
              },
              fill: { opacity: 0.95, colors: ['#8B5CF6', '#3B82F6'] },
              tooltip: { theme: 'dark' },
              grid: { borderColor: 'rgba(255,255,255,0.05)', strokeDashArray: 4 }
            }}
            series={journalChartData.series}
            type="bar"
            height={240}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {journals && journals.length > 0 ? (
            journals.map((journal) => {
              const isFollowing = followedJournalIds.has(journal.id);
              const isBtnLoading = followingJournalLoadingIds.has(journal.id);
              return (
                <div key={journal.id} className="glass-panel p-5 rounded-xl border border-white/5 hover:border-tertiary/40 transition-all flex flex-col justify-between h-44">
                  <div>
                    <div className="flex justify-between items-start mb-2 gap-2">
                      <span className="bg-tertiary/10 text-tertiary text-[9px] font-bold px-2 py-0.5 rounded border border-tertiary/20 uppercase tracking-wider shrink-0">
                        H-Index: {journal.h_index}
                      </span>
                      <button 
                        onClick={() => onToggleFollow(journal.id)}
                        disabled={isBtnLoading}
                        className={cn(
                          "px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider transition-all border shrink-0",
                          isFollowing 
                            ? "bg-success/15 border-success/30 text-success" 
                            : "bg-primary/10 border-primary/20 text-primary hover:bg-primary/20"
                        )}
                      >
                        {isBtnLoading ? "..." : isFollowing ? "Đang theo dõi" : "Theo dõi"}
                      </button>
                    </div>
                    <h4 className="font-display font-bold text-on-surface text-sm line-clamp-2 leading-tight">
                      {journal.name}
                    </h4>
                  </div>
                  <div className="flex justify-between items-center text-[10px] text-on-surface-variant font-mono uppercase tracking-widest mt-2">
                    <span className="truncate max-w-[100px]">{journal.field}</span>
                    <span className="text-primary font-bold">{journal.papers_count} Bài viết</span>
                  </div>
                </div>
              );
            })
          ) : (
            <p className="text-xs text-on-surface-variant col-span-3 text-center py-6 font-mono border border-dashed border-outline-variant/30 rounded-xl bg-white/5">Chưa có tạp chí gợi ý cho từ khóa này.</p>
          )}
        </div>
      )}
    </div>
  );
}
