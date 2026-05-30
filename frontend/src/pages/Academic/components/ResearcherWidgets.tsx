import { useEffect, useState } from "react";
import Chart from "react-apexcharts";
import { Sparkles, BookOpen } from "lucide-react";
import { DashboardData, PaperDetail } from "../types";
import { api } from "@/src/lib/api";

interface AiInsightsWidgetProps {
  onSelectPaper: (paper: PaperDetail) => void;
  onOpenAiReview: (papers: PaperDetail[]) => void;
}

export function AiInsightsWidget({ onSelectPaper, onOpenAiReview }: AiInsightsWidgetProps) {
  const [recommendedPapers, setRecommendedPapers] = useState<DashboardData['recommendedPapers'] | null>(null);

  useEffect(() => {
    api.get<{recommended_papers: DashboardData['recommendedPapers']}>('/dashboard/recommended')
      .then(res => setRecommendedPapers(res.recommended_papers))
      .catch(err => console.error(err));
  }, []);

  if (!recommendedPapers) return (
    <section className="glass-panel-intense rounded-2xl p-8 relative overflow-hidden group border-t-2 border-primary/50 animate-pulse">
      <div className="flex items-center gap-2 mb-6">
        <div className="w-6 h-6 rounded-full bg-white/20" />
        <div className="h-6 w-48 bg-white/20 rounded" />
      </div>
      <div className="h-4 w-full bg-white/10 rounded mb-2" />
      <div className="h-4 w-2/3 bg-white/10 rounded mb-6" />
      <div className="space-y-4">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="h-20 bg-white/5 rounded-xl border-2 border-outline-variant/30" />
        ))}
      </div>
      <div className="w-full mt-8 h-10 bg-white/10 rounded-xl" />
    </section>
  );

  return (
    <section className="glass-panel-intense rounded-2xl p-8 relative overflow-hidden group border-t-2 border-primary/50">
      <div className="absolute -right-4 -top-4 w-32 h-32 bg-primary/10 rounded-full blur-3xl pointer-events-none group-hover:bg-primary/20 transition-colors" />
      <div className="flex items-center gap-2 mb-6">
        <Sparkles className="w-6 h-6 text-primary" />
        <h3 className="font-display text-xl font-bold">Động cơ Thông tin chuyên sâu</h3>
      </div>
      <p className="text-sm text-on-surface-variant leading-relaxed mb-6">
        Dựa trên mối quan tâm nghiên cứu của bạn, chúng tôi đề xuất những bài báo học thuật nổi bật sau cho quá trình đánh giá và nghiên cứu của bạn.
      </p>
      <div className="space-y-4">
        {recommendedPapers.map((rec) => (
          <div key={rec.id} onClick={() => onSelectPaper(rec)} className="p-4 rounded-xl bg-surface-container/30 border-2 border-outline-variant/30 hover:border-primary/30 transition-all cursor-pointer group">
            <h5 className="text-sm font-bold leading-tight mb-2 group-hover:text-primary transition-colors">{rec.title}</h5>
            <div className="flex justify-between items-center text-[10px] uppercase font-bold tracking-widest text-on-surface-variant">
              <span className="truncate max-w-[200px]">{rec.authors}</span>
              <span className="text-primary">{rec.match} Phù hợp</span>
            </div>
          </div>
        ))}
        {recommendedPapers.length === 0 && (
          <div className="text-center py-6 px-4 border border-dashed border-outline-variant/30 rounded-xl space-y-2">
            <p className="text-xs text-on-surface font-semibold">Chưa có gợi ý cá nhân hóa</p>
            <p className="text-[11px] text-on-surface-variant leading-normal">
              Hãy theo dõi ít nhất một chủ đề, tác giả hoặc tạp chí để động cơ phân tích và đề xuất bài báo phù hợp với bạn.
            </p>
          </div>
        )}
      </div>
      <button
        onClick={() => onOpenAiReview(recommendedPapers)}
        disabled={recommendedPapers.length === 0}
        className="w-full mt-8 gradient-btn py-3 rounded-xl font-display text-xs font-bold uppercase tracking-widest text-white flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
        Tạo đánh giá <BookOpen className="w-4 h-4" />
      </button>
    </section>
  );
}

export function TopicsDistributionWidget() {
  const [distribution, setDistribution] = useState<DashboardData['fieldsDistribution'] | null>(null);

  useEffect(() => {
    api.get<{fields_distribution: DashboardData['fieldsDistribution']}>('/dashboard/fields')
      .then(res => setDistribution(res.fields_distribution))
      .catch(err => console.error(err));
  }, []);

  if (!distribution) return (
    <section className="space-y-4 animate-pulse">
      <h3 className="font-display text-xl font-bold px-2">Phân bổ Chủ đề (Topics)</h3>
      <div className="glass-panel p-6 rounded-xl border-2 h-72 flex items-center justify-center">
        <div className="w-40 h-40 rounded-full border-[16px] border-white/5" />
      </div>
    </section>
  );

  return (
    <section className="space-y-4">
      <h3 className="font-display text-xl font-bold px-2">Phân bổ Chủ đề (Topics)</h3>
      {distribution.length > 0 ? (
        <div className="glass-panel p-6 rounded-xl border-2 h-72 flex items-center justify-center">
          <Chart
            options={{
              chart: { id: "fields-distribution-donut", type: "donut", background: "transparent", foreColor: "var(--on-surface)", toolbar: { show: false } },
              labels: distribution.map(f => f.name),
              colors: ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6"],
              stroke: { show: false },
              legend: { position: "bottom", labels: { colors: "var(--on-surface-variant)" }, markers: { radius: 12 } as any },
              dataLabels: { enabled: false },
              plotOptions: {
                pie: {
                  donut: {
                    size: "70%",
                    labels: {
                      show: true,
                      name: { show: true, fontSize: "12px", fontFamily: "inherit", color: "var(--on-surface-variant)" },
                      value: { show: true, fontSize: "20px", fontFamily: "inherit", fontWeight: "bold", color: "var(--on-surface)" },
                      total: { show: true, label: "Tổng cộng", color: "var(--on-surface-variant)", formatter: () => String(distribution.reduce((acc, curr) => acc + curr.value, 0)) },
                    },
                  },
                },
              },
            }}
            series={distribution.map(f => f.value)}
            type="donut"
            width="100%"
            height="100%"
          />
        </div>
      ) : (
        <p className="text-xs text-on-surface-variant text-center py-4">Chưa có dữ liệu phân bổ.</p>
      )}
    </section>
  );
}
