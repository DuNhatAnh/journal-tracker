import React from "react";
import { Download, Loader2 } from "lucide-react";
import { cn } from "@/src/lib/utils";

interface BookmarksHeaderProps {
  activeTab: "papers" | "keywords" | "journals";
  setActiveTab: (tab: "papers" | "keywords" | "journals") => void;
  totalPapers?: number;
  showExport: boolean;
  isExporting: boolean;
  onExport: () => void;
}

export function BookmarksHeader({
  activeTab,
  setActiveTab,
  totalPapers,
  showExport,
  isExporting,
  onExport,
}: BookmarksHeaderProps) {
  return (
    <header className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-6">
      <div>
        <div className="flex items-center gap-4">
          <h2 className="font-display text-4xl font-bold text-on-surface">Đã lưu</h2>
          {activeTab === "papers" && totalPapers !== undefined && (
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs font-semibold text-primary">
              Tìm thấy {totalPapers} bài báo khoa học
            </div>
          )}
        </div>
        <p className="text-on-surface-variant mt-2 text-left">
          Quản lý các bài báo học thuật đã lưu và ghi chú cá nhân.
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
        <div className="flex p-1 bg-surface-container-low border border-white/5 rounded-xl gap-1 w-full sm:w-auto overflow-x-auto">
          <button
            onClick={() => setActiveTab("papers")}
            className={cn(
              "flex-1 sm:flex-initial px-6 py-2.5 rounded-lg text-xs font-bold uppercase tracking-widest transition-all whitespace-nowrap cursor-pointer",
              activeTab === "papers"
                ? "bg-primary text-on-primary shadow-lg"
                : "text-on-surface-variant hover:text-on-surface"
            )}
          >
            Bài báo đã lưu
          </button>
          <button
            onClick={() => setActiveTab("keywords")}
            className={cn(
              "flex-1 sm:flex-initial px-6 py-2.5 rounded-lg text-xs font-bold uppercase tracking-widest transition-all whitespace-nowrap cursor-pointer",
              activeTab === "keywords"
                ? "bg-primary text-on-primary shadow-lg"
                : "text-on-surface-variant hover:text-on-surface"
            )}
          >
            Chủ đề quan tâm
          </button>
          <button
            onClick={() => setActiveTab("journals")}
            className={cn(
              "flex-1 sm:flex-initial px-6 py-2.5 rounded-lg text-xs font-bold uppercase tracking-widest transition-all whitespace-nowrap cursor-pointer",
              activeTab === "journals"
                ? "bg-primary text-on-primary shadow-lg"
                : "text-on-surface-variant hover:text-on-surface"
            )}
          >
            Tạp chí
          </button>
        </div>
        {showExport && (
          <button
            onClick={onExport}
            disabled={isExporting}
            className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-surface-container-low border border-white/5 text-on-surface hover:bg-white/5 transition-all text-xs font-bold uppercase tracking-widest disabled:opacity-50 cursor-pointer w-full sm:w-auto"
          >
            {isExporting ? (
              <Loader2 className="w-4 h-4 animate-spin text-primary" />
            ) : (
              <Download className="w-4 h-4 text-tertiary" />
            )}
            Xuất báo cáo (CSV)
          </button>
        )}
      </div>
    </header>
  );
}
