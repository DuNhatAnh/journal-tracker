import React from "react";

interface GraphControlPanelProps {
  zoom: number;
  setZoom: (z: number) => void;
  minYearFilter: number;
  setMinYearFilter: (y: number) => void;
  minCitationsFilter: number;
  setMinCitationsFilter: (c: number) => void;
  colorMode: "year" | "topic" | "monochrome";
  setColorMode: (mode: "year" | "topic" | "monochrome") => void;
  sizeMode: "citations" | "uniform";
  setSizeMode: (mode: "citations" | "uniform") => void;
  containerRef?: React.RefObject<HTMLDivElement | null>;
}

export const GraphControlPanel: React.FC<GraphControlPanelProps> = ({
  zoom,
  setZoom,
  minYearFilter,
  setMinYearFilter,
  minCitationsFilter,
  setMinCitationsFilter,
  colorMode,
  setColorMode,
  sizeMode,
  setSizeMode,
  containerRef,
}) => {
  return (
    <div 
      ref={containerRef}
      onMouseDown={(e) => e.stopPropagation()}
      className="absolute bottom-14 left-4 z-30 bg-surface-container-high/95 backdrop-blur-md p-4 rounded-3xl border border-outline-variant/35 shadow-2xl flex flex-col gap-3.5 w-64 pointer-events-auto animate-in fade-in slide-in-from-bottom-3 duration-200"
    >
      {/* Zoom Slider */}
      <div className="flex items-center justify-between gap-2">
        <span className="text-[9px] font-black text-on-surface-variant uppercase tracking-wider">Thu phóng:</span>
        <div className="flex items-center gap-2">
          <input
            type="range"
            min="0.3"
            max="2.0"
            step="0.05"
            value={zoom}
            onChange={(e) => setZoom(parseFloat(e.target.value))}
            className="w-24 h-1.5 bg-surface-container-highest rounded-lg appearance-none cursor-pointer accent-primary"
          />
          <span className="text-[9px] font-black text-on-surface w-8 text-right">{Math.round(zoom * 100)}%</span>
        </div>
      </div>

      <div className="h-px bg-outline-variant/20" />

      {/* Year Filter Slider */}
      <div className="flex items-center justify-between gap-2">
        <span className="text-[9px] font-black text-on-surface-variant uppercase tracking-wider">Năm tối thiểu:</span>
        <div className="flex items-center gap-2">
          <input
            type="range"
            min="2000"
            max="2026"
            step="1"
            value={minYearFilter}
            onChange={(e) => setMinYearFilter(parseInt(e.target.value))}
            className="w-24 h-1.5 bg-surface-container-highest rounded-lg appearance-none cursor-pointer accent-primary"
          />
          <span className="text-[9px] font-black text-on-surface w-8 text-right">{minYearFilter}</span>
        </div>
      </div>

      <div className="h-px bg-outline-variant/20" />

      {/* Citations Filter Slider */}
      <div className="flex items-center justify-between gap-2">
        <span className="text-[9px] font-black text-on-surface-variant uppercase tracking-wider">Trích dẫn tối thiểu:</span>
        <div className="flex items-center gap-2">
          <input
            type="range"
            min="0"
            max="200"
            step="5"
            value={minCitationsFilter}
            onChange={(e) => setMinCitationsFilter(parseInt(e.target.value))}
            className="w-24 h-1.5 bg-surface-container-highest rounded-lg appearance-none cursor-pointer accent-primary"
          />
          <span className="text-[9px] font-black text-on-surface w-8 text-right">{minCitationsFilter}+</span>
        </div>
      </div>

      <div className="h-px bg-outline-variant/20" />

      {/* Color Mode Selector */}
      <div className="flex flex-col gap-1.5">
        <span className="text-[9px] font-black text-on-surface-variant uppercase tracking-wider">Màu sắc Node:</span>
        <div className="grid grid-cols-3 gap-1 bg-surface-container-highest p-0.5 rounded-xl border border-outline-variant/20 text-center select-none text-[8.5px] font-bold">
          <button
            type="button"
            onClick={() => setColorMode("year")}
            className={`py-1 rounded-lg transition-all cursor-pointer ${
              colorMode === "year"
                ? "bg-primary text-white"
                : "text-on-surface-variant hover:text-on-surface"
            }`}
          >
            Theo Năm
          </button>
          <button
            type="button"
            onClick={() => setColorMode("topic")}
            className={`py-1 rounded-lg transition-all cursor-pointer ${
              colorMode === "topic"
                ? "bg-primary text-white"
                : "text-on-surface-variant hover:text-on-surface"
            }`}
          >
            Chủ Đề
          </button>
          <button
            type="button"
            onClick={() => setColorMode("monochrome")}
            className={`py-1 rounded-lg transition-all cursor-pointer ${
              colorMode === "monochrome"
                ? "bg-primary text-white"
                : "text-on-surface-variant hover:text-on-surface"
            }`}
          >
            Đơn Sắc
          </button>
        </div>
      </div>

      <div className="h-px bg-outline-variant/20" />

      {/* Size Mode Selector */}
      <div className="flex flex-col gap-1.5">
        <span className="text-[9px] font-black text-on-surface-variant uppercase tracking-wider">Kích thước Node:</span>
        <div className="grid grid-cols-2 gap-1 bg-surface-container-highest p-0.5 rounded-xl border border-outline-variant/20 text-center select-none text-[8.5px] font-bold">
          <button
            type="button"
            onClick={() => setSizeMode("citations")}
            className={`py-1 rounded-lg transition-all cursor-pointer ${
              sizeMode === "citations"
                ? "bg-primary text-white"
                : "text-on-surface-variant hover:text-on-surface"
            }`}
          >
            Theo Trích Dẫn
          </button>
          <button
            type="button"
            onClick={() => setSizeMode("uniform")}
            className={`py-1 rounded-lg transition-all cursor-pointer ${
              sizeMode === "uniform"
                ? "bg-primary text-white"
                : "text-on-surface-variant hover:text-on-surface"
            }`}
          >
            Đồng Đều
          </button>
        </div>
      </div>
    </div>
  );
};
