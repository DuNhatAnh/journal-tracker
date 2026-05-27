import { useMemo } from "react";
import { BookOpen, ArrowUp, Loader2 } from "lucide-react";
import { cleanTitle } from "@/src/lib/utils";
import { useApiQuery } from "../../../hooks/useApiQuery";

interface SelectedEntity {
  id: number;
  name: string;
  type: "keyword" | "author";
}

interface RepresentativePublicationsProps {
  selectedEntity: SelectedEntity | null;
  onSelectPaper: (paper: any) => void;
  startYear: number;
  endYear: number;
}

export function RepresentativePublications({
  selectedEntity,
  onSelectPaper,
  startYear,
  endYear
}: RepresentativePublicationsProps) {
  const papersUrl = selectedEntity
    ? (selectedEntity.type === "author"
        ? `/trends/author/${selectedEntity.id}/papers`
        : `/trends/${selectedEntity.id}/papers`)
    : "";

  // useApiQuery for representative papers
  const { data: rawPapersData, loading } = useApiQuery<any[]>(
    papersUrl,
    { enabled: !!papersUrl }
  );

  const rawPapers = rawPapersData || [];

  const filteredPapers = useMemo(() => {
    return rawPapers.filter(p => p.published_year >= startYear && p.published_year <= endYear);
  }, [rawPapers, startYear, endYear]);

  return (
    <div className="space-y-4 min-h-[180px]">
      <div className="flex items-center gap-2">
        <BookOpen className="w-5 h-5 text-primary" />
        <h3 className="font-display text-xl font-bold">
          Ấn phẩm tiêu biểu nổi bật {!loading && `(${filteredPapers.length})`}
        </h3>
      </div>
      
      {loading ? (
        <div className="glass-panel p-6 rounded-xl border border-white/5 flex flex-col items-center justify-center h-32 font-mono text-xs uppercase tracking-widest text-on-surface-variant animate-pulse">
          <Loader2 className="w-6 h-6 text-primary animate-spin mb-2" />
          Đang tải danh sách ấn phẩm nổi bật...
        </div>
      ) : (
        <div className="space-y-4">
          {filteredPapers.length > 0 ? (
            filteredPapers.map((paper: any) => (
              <article key={paper.id} className="glass-panel p-6 rounded-xl border border-white/5 hover:bg-white/[0.01] transition-all flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex-1 min-w-0 pr-4">
                  <h4 
                    onClick={() => onSelectPaper(paper)}
                    className="font-display font-bold text-on-surface hover:text-primary transition-colors cursor-pointer text-base line-clamp-1 leading-snug"
                  >
                    {cleanTitle(paper.title)}
                  </h4>
                  <p className="text-xs text-on-surface-variant mt-1.5 line-clamp-1">
                    Tác giả: {paper.authors?.map((a: any) => a.name).join(", ") || "Chưa rõ"}
                  </p>
                  <div className="flex items-center gap-4 mt-2 font-mono text-[9px] text-on-surface-variant uppercase tracking-wider">
                    <span className="text-tertiary font-bold">{paper.journal?.name || paper.source}</span>
                    <span>Năm: {paper.published_year}</span>
                    <span className="flex items-center gap-0.5"><ArrowUp className="w-2.5 h-2.5" /> {paper.citations_count} trích dẫn</span>
                  </div>
                </div>
                <button 
                  onClick={() => onSelectPaper(paper)}
                  className="px-3.5 py-1.5 border border-primary/25 bg-primary/5 rounded-lg text-[10px] font-bold uppercase tracking-widest text-primary hover:bg-primary/20 hover:border-primary/50 hover:scale-[1.03] active:scale-[0.97] transition-all shrink-0 self-start md:self-center"
                >
                  Xem chi tiết
                </button>
              </article>
            ))
          ) : (
            <p className="text-xs text-on-surface-variant text-center py-6 font-mono border border-dashed border-outline-variant/30 rounded-xl bg-white/5">Chưa có bài báo tiêu biểu nào trong khoảng thời gian đã lọc.</p>
          )}
        </div>
      )}
    </div>
  );
}
