import { X, Loader2, ExternalLink } from "lucide-react";
import toast from "react-hot-toast";
import { cn, cleanTitle } from "@/src/lib/utils";

interface PaperQuickViewModalProps {
  paper: any;
  onClose: () => void;
  bookmarkedIds: Set<number>;
  bookmarkLoadingIds: Set<number>;
  onToggleBookmark: (paperId: number) => void;
}

export function PaperQuickViewModal({
  paper,
  onClose,
  bookmarkedIds,
  bookmarkLoadingIds,
  onToggleBookmark
}: PaperQuickViewModalProps) {
  const isBookmarked = bookmarkedIds.has(paper.id);
  const isBookmarkLoading = bookmarkLoadingIds.has(paper.id);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="glass-panel w-full max-w-3xl rounded-2xl border border-white/10 p-8 shadow-2xl relative max-h-[85vh] overflow-y-auto">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/5 text-on-surface-variant hover:text-on-surface transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
        
        <div className="space-y-6">
          <div>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary mb-3">
              {(paper.journal?.name || paper.source || "").toUpperCase()}
            </span>
            <h2 className="font-display text-2xl sm:text-3xl font-bold leading-tight text-on-surface">{cleanTitle(paper.title)}</h2>
          </div>
          
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-on-surface-variant border-y border-white/5 py-4 font-mono">
            <div>
              <span className="font-bold text-on-surface">Tác giả:</span> {paper.authors?.map((a: any) => a.name).join(", ") || "N/A"}
            </div>
            <div>
              <span className="font-bold text-on-surface">Tạp chí:</span> {paper.journal?.name || paper.source || "N/A"}
            </div>
            <div>
              <span className="font-bold text-on-surface">Năm:</span> {paper.published_year}
            </div>
            <div>
              <span className="font-bold text-on-surface">Trích dẫn:</span> {paper.citations_count}
            </div>
          </div>
          
          <div className="space-y-3">
            <h4 className="text-sm font-bold uppercase tracking-widest text-primary">Tóm tắt (Abstract)</h4>
            <p className="text-on-surface-variant text-sm leading-relaxed whitespace-pre-line">
              {paper.abstract || "Không có tóm tắt cho bài báo này."}
            </p>
          </div>

          {paper.keywords && paper.keywords.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-bold uppercase tracking-widest text-secondary">Từ khóa</h4>
              <div className="flex flex-wrap gap-2">
                {paper.keywords.map((kw: any) => (
                  <span key={kw.id} className="text-xs bg-white/5 border border-white/10 px-2.5 py-1 rounded-lg">
                    {kw.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Citation block */}
          <div className="space-y-3 p-4 bg-surface-container/40 rounded-xl border border-white/5">
            <h4 className="text-xs font-bold uppercase tracking-widest text-tertiary">Trích dẫn học thuật</h4>
            <div className="space-y-3 text-xs">
              <div>
                <span className="text-[10px] text-on-surface-variant uppercase tracking-widest font-mono block mb-1">Định dạng APA</span>
                <div className="flex gap-2 items-start bg-black/20 p-2.5 rounded border border-white/5">
                  <p className="flex-1 font-mono text-[11px] leading-relaxed text-on-surface-variant select-all">
                    {cleanTitle(paper.authors?.map((a: any) => a.name).join(", "))} ({paper.published_year}). {cleanTitle(paper.title)}. {paper.journal?.name || paper.source}. {paper.doi ? `DOI: https://doi.org/${paper.doi}` : ""}
                  </p>
                  <button 
                    onClick={() => {
                      const apa = `${paper.authors?.map((a: any) => a.name).join(", ")} (${paper.published_year}). ${cleanTitle(paper.title)}. ${paper.journal?.name || paper.source}.${paper.doi ? ` DOI: https://doi.org/${paper.doi}` : ""}`;
                      navigator.clipboard.writeText(apa);
                      toast.success("Đã copy trích dẫn APA!");
                    }}
                    className="text-[9px] bg-white/5 hover:bg-white/10 border border-white/10 px-2 py-1 rounded font-bold uppercase tracking-wider text-on-surface shrink-0"
                  >
                    Copy
                  </button>
                </div>
              </div>
              
              <div>
                <span className="text-[10px] text-on-surface-variant uppercase tracking-widest font-mono block mb-1">Định dạng BibTeX</span>
                <div className="flex gap-2 items-start bg-black/20 p-2.5 rounded border border-white/5">
                  <pre className="flex-1 font-mono text-[10px] leading-relaxed text-on-surface-variant overflow-x-auto select-all">
{`@article{paper_${paper.id},
  title = {${cleanTitle(paper.title)}},
  author = {${paper.authors?.map((a: any) => a.name).join(" and ")}},
  journal = {${paper.journal?.name || paper.source}},
  year = {${paper.published_year}}${paper.doi ? `,\n  doi = {${paper.doi}}` : ""}
}`}
                  </pre>
                  <button 
                    onClick={() => {
                      const bib = `@article{paper_${paper.id},\n  title = {${cleanTitle(paper.title)}},\n  author = {${paper.authors?.map((a: any) => a.name).join(" and ")}},\n  journal = {${paper.journal?.name || paper.source}},\n  year = {${paper.published_year}}${paper.doi ? `,\n  doi = {${paper.doi}}` : ""}\n}`;
                      navigator.clipboard.writeText(bib);
                      toast.success("Đã copy BibTeX!");
                    }}
                    className="text-[9px] bg-white/5 hover:bg-white/10 border border-white/10 px-2 py-1 rounded font-bold uppercase tracking-wider text-on-surface shrink-0"
                  >
                    Copy
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex justify-end gap-4 pt-4 border-t border-white/5">
            <button 
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-white/10 text-xs font-bold uppercase tracking-widest hover:bg-white/5 transition-all text-on-surface"
            >
              Đóng
            </button>
            <button
              disabled={isBookmarkLoading}
              onClick={() => onToggleBookmark(paper.id)}
              className={cn(
                "px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all",
                isBookmarked
                  ? "bg-tertiary/20 text-tertiary border border-tertiary/30 hover:bg-tertiary/30"
                  : "bg-secondary/10 border border-secondary/20 text-secondary hover:bg-secondary/20"
              )}
            >
              {isBookmarkLoading ? (
                <span className="flex items-center gap-1"><Loader2 className="w-3.5 h-3.5 animate-spin" /> Đang xử lý...</span>
              ) : isBookmarked ? (
                "Hủy lưu bài báo"
              ) : (
                "Lưu bài báo"
              )}
            </button>
            {paper.doi && (
              <a 
                href={`https://doi.org/${paper.doi}`} 
                target="_blank" 
                rel="noopener noreferrer"
                className="px-5 py-2.5 rounded-xl gradient-btn text-xs font-bold uppercase tracking-widest text-white flex items-center gap-2"
              >
                Xem Nguồn Gốc <ExternalLink className="w-4 h-4" />
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
