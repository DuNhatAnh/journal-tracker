import React from "react";
import { Target } from "lucide-react";

interface GraphCenterButtonProps {
  onReset: () => void;
}

export const GraphCenterButton: React.FC<GraphCenterButtonProps> = ({ onReset }) => {
  return (
    <button
      type="button"
      onClick={onReset}
      onMouseDown={(e) => e.stopPropagation()}
      className="w-8 h-8 rounded-full bg-surface-container-high/90 hover:bg-surface-container-highest border border-outline-variant/30 shadow-md flex items-center justify-center text-on-surface hover:text-primary transition-all cursor-pointer active:scale-90 relative group"
    >
      <Target className="w-4 h-4" />
      
      {/* Custom Tooltip */}
      <span className="absolute bottom-full left-0 mb-2 px-2.5 py-1 text-[9px] font-black uppercase tracking-wider text-white bg-on-surface rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap shadow-lg">
        Căn giữa đồ thị
      </span>
    </button>
  );
};
