import React from "react";

interface Author {
  id: number;
  name: string;
}

interface Paper {
  id: number;
  title: string;
  abstract: string;
  published_year: number;
  citations_count: number;
  source: string;
  doi?: string;
  authors: Author[];
  keywords?: { id: number; name: string }[];
  journal?: { id: number; name: string };
}

interface PriorDerivativeWorksTableProps {
  activeSubView: "prior" | "derivative";
  papers: Paper[];
  selectedPaper: Paper | null;
  defaultPaper: Paper | null;
  onSelectPaper: (paper: Paper) => void;
}

export const PriorDerivativeWorksTable: React.FC<PriorDerivativeWorksTableProps> = ({
  activeSubView,
  papers,
  selectedPaper,
  defaultPaper,
  onSelectPaper,
}) => {
  return (
    <div className="glass-panel p-6 rounded-3xl border border-outline-variant/30 h-[720px] relative bg-surface-container-low/40 overflow-y-auto flex flex-col space-y-4 animate-fade-in select-none">
      <div className="space-y-1">
        <h4 className="text-sm font-black text-on-surface">
          {activeSubView === "prior" ? "📚 Các công trình tiền đề (Prior Works)" : "🚀 Các công trình kế thừa & phát triển (Derivative Works)"}
        </h4>
        <p className="text-xs text-on-surface-variant">
          {activeSubView === "prior" 
            ? "Danh sách các bài báo quan trọng đặt nền móng cho lĩnh vực này (năm cũ, sắp xếp theo trích dẫn giảm dần)."
            : "Danh sách các nghiên cứu phát triển mới, bài khảo sát (Survey) tổng hợp trong lĩnh vực này (năm mới, sắp xếp theo trích dẫn giảm dần)."
          }
        </p>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-outline-variant/30 min-h-0 flex-1 bg-surface-container-low/20">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-surface-container-high text-on-surface-variant border-b border-outline-variant/20 font-bold">
              <th className="p-3 w-7/12">Tiêu đề bài báo</th>
              <th className="p-3">Tác giả</th>
              <th className="p-3 w-16 text-center">Năm</th>
              <th className="p-3 w-24 text-center">Trích dẫn</th>
            </tr>
          </thead>
          <tbody>
            {papers.length === 0 ? (
              <tr>
                <td colSpan={4} className="p-8 text-center text-on-surface-variant font-medium">
                  Không tìm thấy công trình phù hợp với bộ lọc hiện tại.
                </td>
              </tr>
            ) : (
              papers.map((paper) => (
                <tr 
                  key={paper.id} 
                  onClick={() => onSelectPaper(paper)}
                  className={`border-b border-outline-variant/15 hover:bg-surface-container/50 transition-all cursor-pointer ${
                    (selectedPaper || defaultPaper)?.id === paper.id ? "bg-primary/5 text-primary font-semibold border-l-2 border-l-primary" : ""
                  }`}
                >
                  <td className="p-3 font-bold pr-6">
                    <p className="line-clamp-2 leading-tight">{paper.title}</p>
                  </td>
                  <td className="p-3 truncate max-w-[150px]">
                    {paper.authors.map(a => a.name).join(", ") || "Nhiều tác giả"}
                  </td>
                  <td className="p-3 text-center font-medium">
                    {paper.published_year}
                  </td>
                  <td className="p-3 text-center font-black text-secondary">
                    🔥 {paper.citations_count}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
