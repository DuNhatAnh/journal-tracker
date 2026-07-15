import React from "react";

interface NodeMetadata {
  id: number;
  title: string;
  publishedYear: number;
  citationsCount: number;
  abstract: string;
  authors: string[];
  doi?: string;
}

interface GraphNode {
  id: string;
  label: string;
  type: "root" | "topic" | "paper";
  val: number;
  metadata?: NodeMetadata;
  x: number;
  y: number;
  vx: number;
  vy: number;
  fixed?: boolean;
}

interface GraphNodeTooltipProps {
  hoveredNodeId: string | null;
  semanticNodes: GraphNode[];
}

export const GraphNodeTooltip: React.FC<GraphNodeTooltipProps> = ({
  hoveredNodeId,
  semanticNodes,
}) => {
  if (!hoveredNodeId) return null;
  const node = semanticNodes.find(n => n.id === hoveredNodeId);
  if (!node) return null;

  return (
    <div className="absolute bottom-4 right-4 z-30 w-72 bg-surface-container-high/95 backdrop-blur-md p-4 rounded-2xl border border-outline-variant/40 shadow-xl space-y-3 pointer-events-none animate-fade-in flex flex-col">
      {node.type === "paper" && node.metadata ? (
        <>
          <div className="space-y-1">
            <span className="text-[9px] bg-primary/10 text-primary border border-primary/20 px-2.5 py-0.5 rounded-full font-black uppercase">
              Bài báo khoa học
            </span>
            <h4 className="text-xs font-bold text-on-surface line-clamp-2">
              {node.metadata.title}
            </h4>
            <p className="text-[10px] text-on-surface-variant font-medium">
              Tác giả: {node.metadata.authors?.join(', ') || "Nhiều tác giả"}
            </p>
          </div>
          <div className="flex gap-2 text-[9px] font-bold text-on-surface-variant">
            <span className="bg-surface-container-highest px-2 py-0.5 rounded-md">
              📅 {node.metadata.publishedYear || "N/A"}
            </span>
            <span className="bg-surface-container-highest px-2 py-0.5 rounded-md text-secondary">
              🔥 {node.metadata.citationsCount ?? 0} trích dẫn
            </span>
          </div>
          {node.metadata.abstract && (
            <div className="pt-1.5 border-t border-outline-variant/20">
              <p className="text-[10px] text-on-surface-variant leading-relaxed line-clamp-4 font-normal text-justify">
                {node.metadata.abstract}
              </p>
            </div>
          )}
        </>
      ) : (
        <>
          <div className="space-y-1">
            <span className="text-[9px] bg-secondary/10 text-secondary border border-secondary/20 px-2.5 py-0.5 rounded-full font-black uppercase">
              {node.type === "root" ? "Ý tưởng tìm kiếm" : "Chủ đề khoa học"}
            </span>
            <h4 className="text-xs font-bold text-on-surface">
              {node.label}
            </h4>
          </div>
          <p className="text-[10px] text-on-surface-variant leading-relaxed font-normal text-justify">
            {node.type === "root" 
              ? "Đây là từ khóa hoặc ý tưởng nghiên cứu cốt lõi bạn nhập vào để phân tích và vẽ sơ đồ tri thức."
              : "Một chủ đề khoa học liên quan trực tiếp đến từ khóa tìm kiếm của bạn. Nhấn Ctrl+Click để đặt làm trung tâm mới."
            }
          </p>
        </>
      )}
    </div>
  );
};
