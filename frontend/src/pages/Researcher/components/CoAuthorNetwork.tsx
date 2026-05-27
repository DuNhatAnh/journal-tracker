import { useEffect, useState } from "react";
import { Users, Loader2 } from "lucide-react";
import { useApiQuery } from "../../../hooks/useApiQuery";

export interface AuthorNode {
  id: number;
  name: string;
  papers_count: number;
  h_index: number;
  cluster?: number;
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
}

export interface CoAuthorLink {
  source: number;
  target: number;
  weight: number;
}

interface SelectedEntity {
  id: number;
  name: string;
  type: "keyword" | "author";
}

interface CoAuthorNetworkProps {
  selectedEntity: SelectedEntity | null;
  onSelectAuthor?: (authorId: number, name?: string) => void;
}

export function CoAuthorNetwork({ selectedEntity, onSelectAuthor }: CoAuthorNetworkProps) {
  const [networkNodes, setNetworkNodes] = useState<AuthorNode[]>([]);
  const [networkLinks, setNetworkLinks] = useState<CoAuthorLink[]>([]);
  const [hoveredNode, setHoveredNode] = useState<AuthorNode | null>(null);
  const [selectedAuthor, setSelectedAuthor] = useState<AuthorNode | null>(null);

  const networkUrl = selectedEntity
    ? (selectedEntity.type === "author"
        ? `/trends/author/${selectedEntity.id}/network`
        : `/trends/${selectedEntity.id}/network`)
    : "";

  // useApiQuery for network data
  const { data, loading } = useApiQuery<any>(
    networkUrl,
    { enabled: !!networkUrl }
  );

  // Run simulation layout when network data loads or changes
  useEffect(() => {
    if (!selectedEntity || !data) {
      setNetworkNodes([]);
      setNetworkLinks([]);
      setSelectedAuthor(null);
      return;
    }

    const nodes = data.nodes || [];
    const links = data.links || [];
    
    // Copy nodes to avoid mutating state
    const simulationNodes: AuthorNode[] = nodes.map((n: any, idx: number) => ({
      ...n,
      cluster: idx % 4,
      x: 250 + Math.cos((idx / nodes.length) * 2 * Math.PI) * 120,
      y: 200 + Math.sin((idx / nodes.length) * 2 * Math.PI) * 120,
      vx: 0,
      vy: 0,
    }));

    const width = 500;
    const height = 400;

    // Run force-directed layout simulation for 220 ticks for better convergence
    for (let tick = 0; tick < 220; tick++) {
      // 1. Repulsion between nodes & Collision avoidance
      for (let i = 0; i < simulationNodes.length; i++) {
        for (let j = i + 1; j < simulationNodes.length; j++) {
          const n1 = simulationNodes[i];
          const n2 = simulationNodes[j];
          const dx = n2.x! - n1.x!;
          const dy = n2.y! - n1.y!;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          
          const r1 = 8 + Math.min(10, n1.papers_count * 1.5);
          const r2 = 8 + Math.min(10, n2.papers_count * 1.5);
          const minDist = r1 + r2 + 40; // Avoid overlap and leave room for labels
          
          if (dist < minDist) {
            // Strong push if overlapping
            const force = (minDist - dist) / dist * 0.55;
            n1.vx! -= dx * force;
            n1.vy! -= dy * force;
            n2.vx! += dx * force;
            n2.vy! += dy * force;
          } else if (dist < 140) {
            // Gentle general repulsion to spread nodes out across the canvas
            const force = (140 - dist) / dist * 0.15;
            n1.vx! -= dx * force;
            n1.vy! -= dy * force;
            n2.vx! += dx * force;
            n2.vy! += dy * force;
          }
        }
      }

      // 2. Attraction along links
      links.forEach((link: any) => {
        const sourceNode = simulationNodes.find(n => n.id === link.source);
        const targetNode = simulationNodes.find(n => n.id === link.target);
        if (sourceNode && targetNode) {
          const dx = targetNode.x! - sourceNode.x!;
          const dy = targetNode.y! - sourceNode.y!;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          const desiredDist = 120; // Increased distance between linked nodes
          const force = (dist - desiredDist) / dist * 0.055; // Gentler attraction force
          sourceNode.vx! += dx * force;
          sourceNode.vy! += dy * force;
          targetNode.vx! -= dx * force;
          targetNode.vy! -= dy * force;
        }
      });

      // 3. Gentle gravity towards center (avoids clustering at the absolute center)
      simulationNodes.forEach(node => {
        const dx = width / 2 - node.x!;
        const dy = height / 2 - node.y!;
        node.vx! += dx * 0.007; // Gentle central force
        node.vy! += dy * 0.007;

        node.x! += node.vx!;
        node.y! += node.vy!;

        // Apply friction
        node.vx! *= 0.75;
        node.vy! *= 0.75;

        // Boundary constraint (keep nodes fully inside the 500x400 SVG container)
        const r = 8 + Math.min(10, node.papers_count * 1.5);
        if (node.x! < r + 20) { node.x! = r + 20; node.vx! = 0; }
        if (node.x! > width - r - 20) { node.x! = width - r - 20; node.vx! = 0; }
        if (node.y! < r + 20) { node.y! = r + 20; node.vy! = 0; }
        if (node.y! > height - r - 35) { node.y! = height - r - 35; node.vy! = 0; } // Extra padding for text label
      });
    }

    setNetworkNodes(simulationNodes);
    setNetworkLinks(links);
    setSelectedAuthor(null);
  }, [selectedEntity, data]);

  const isConnected = (id1: number, id2: number) => {
    if (id1 === id2) return true;
    return networkLinks.some(l => 
      (l.source === id1 && l.target === id2) || (l.source === id2 && l.target === id1)
    );
  };

  // Helper to compute optimal tooltip position (avoiding highlighted nodes & hovered self)
  const getOptimalTooltipPosition = (node: AuthorNode) => {
    const W = 200; // Tooltip width
    const H = 96;  // Tooltip actual height (including padding/margins)
    const nodeRadius = 8 + Math.min(10, node.papers_count * 1.5);
    const padding = 18; // Increased padding to prevent overlap

    // Find all highlighted (connected) nodes
    const highlightedNodes = networkNodes.filter(n => isConnected(node.id, n.id));

    // Candidate positions (top-left of the tooltip relative to container)
    const candidates = [
      {
        dir: "above",
        x: node.x! - W / 2,
        y: node.y! - nodeRadius - H - padding
      },
      {
        dir: "below",
        x: node.x! - W / 2,
        y: node.y! + nodeRadius + padding
      },
      {
        dir: "left",
        x: node.x! - nodeRadius - W - padding,
        y: node.y! - H / 2
      },
      {
        dir: "right",
        x: node.x! + nodeRadius + padding,
        y: node.y! - H / 2
      }
    ];

    let bestCandidate = candidates[0];
    let bestScore = Infinity;

    candidates.forEach(c => {
      // Clamp coordinates to container boundaries [0, 500] and [0, 400] first
      const clampedX = Math.min(500 - W - 10, Math.max(10, c.x));
      const clampedY = Math.min(400 - H - 10, Math.max(10, c.y));

      let overlapCount = 0;
      let minDistance = Infinity;

      const xMin = clampedX;
      const xMax = clampedX + W;
      const yMin = clampedY;
      const yMax = clampedY + H;

      // We must NEVER overlap the hovered node itself, and avoid highlighted neighbors
      const checkNodes = [...highlightedNodes];
      if (!checkNodes.some(n => n.id === node.id)) {
        checkNodes.push(node);
      }

      checkNodes.forEach(hn => {
        const isHoveredSelf = hn.id === node.id;
        const hnRadius = 8 + Math.min(10, hn.papers_count * 1.5);
        
        // Closest point on tooltip rectangle to the node center
        const closestX = Math.max(xMin, Math.min(hn.x!, xMax));
        const closestY = Math.max(yMin, Math.min(hn.y!, yMax));
        
        const dx = hn.x! - closestX;
        const dy = hn.y! - closestY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist < minDistance) {
          minDistance = dist;
        }

        // Overlap threshold (extra safety margin for hovered self to absolutely prevent occlusion)
        const threshold = isHoveredSelf ? hnRadius + 14 : hnRadius + 6;
        if (dist < threshold) {
          // Hovered node overlap gets a massive penalty
          overlapCount += isHoveredSelf ? 50 : 1;
        }
      });

      // Score: prioritize min overlap count, then proximity
      const score = (overlapCount * 100000) - minDistance;

      if (score < bestScore) {
        bestScore = score;
        bestCandidate = { ...c, x: clampedX, y: clampedY };
      }
    });

    return { left: bestCandidate.x, top: bestCandidate.y };
  };

  const getClusterColor = (clusterId: number) => {
    const colors = [
      { stroke: "#10B981", fill: "rgba(16, 185, 129, 0.15)", bg: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
      { stroke: "#8B5CF6", fill: "rgba(139, 92, 246, 0.15)", bg: "bg-violet-500/10 text-violet-400 border-violet-500/20" },
      { stroke: "#06B6D4", fill: "rgba(6, 182, 212, 0.15)", bg: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20" },
      { stroke: "#F59E0B", fill: "rgba(245, 158, 11, 0.15)", bg: "bg-amber-500/10 text-amber-400 border-amber-500/20" }
    ];
    return colors[clusterId % colors.length];
  };

  return (
    <div className="glass-panel p-6 rounded-2xl flex flex-col relative min-h-[450px]">
      <div className="space-y-1 mb-6">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-primary" />
          <h3 className="font-display text-xl font-bold">Mạng lưới đồng tác giả (VOSviewer Clusters)</h3>
        </div>
        <p className="text-xs text-on-surface-variant">
          Trực quan hóa nhóm hợp tác của Top 15 tác giả hàng đầu. Nhấp chọn tác giả để xem chi tiết đồng tác giả và các bài báo.
        </p>
      </div>

      <div className="relative border border-white/5 rounded-xl bg-surface-container/20 h-[400px] overflow-hidden flex items-center justify-center">
        {loading ? (
          <div className="flex flex-col items-center gap-2 text-on-surface-variant font-mono text-xs uppercase tracking-widest animate-pulse">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
            Đang tính toán sơ đồ mạng lưới...
          </div>
        ) : networkNodes.length > 0 ? (
          <svg viewBox="0 0 500 400" className="w-full h-full select-none">
            {/* Draw links */}
            {networkLinks.map((link, idx) => {
              const sourceNode = networkNodes.find(n => n.id === link.source);
              const targetNode = networkNodes.find(n => n.id === link.target);
              if (!sourceNode || !targetNode) return null;
              
              const isLinkHighlighted = selectedAuthor
                ? (link.source === selectedAuthor.id || link.target === selectedAuthor.id)
                : hoveredNode 
                  ? (link.source === hoveredNode.id || link.target === hoveredNode.id)
                  : false;

              return (
                <line
                  key={`link-${idx}`}
                  x1={sourceNode.x}
                  y1={sourceNode.y}
                  x2={targetNode.x}
                  y2={targetNode.y}
                  stroke={isLinkHighlighted ? "var(--primary)" : "rgba(148, 163, 184, 0.15)"}
                  strokeWidth={1.5 + Math.min(3, link.weight)}
                  strokeOpacity={selectedAuthor || hoveredNode ? (isLinkHighlighted ? 0.85 : 0.05) : 0.4}
                  className="transition-all duration-300"
                />
              );
            })}

            {/* Draw nodes */}
            {networkNodes.map((node) => {
              const isSelected = selectedAuthor?.id === node.id;
              const isNodeHighlighted = selectedAuthor
                ? (isSelected || isConnected(selectedAuthor.id, node.id))
                : hoveredNode 
                  ? isConnected(hoveredNode.id, node.id)
                  : true;
              
              const isHovered = hoveredNode?.id === node.id;
              const baseRadius = 8 + Math.min(10, node.papers_count * 1.5);
              const radius = isHovered || isSelected ? baseRadius * 1.25 : baseRadius;

              const clusterStyle = getClusterColor(node.cluster ?? 0);
              const nodeColor = isHovered || isSelected ? "var(--tertiary)" : clusterStyle.stroke;

              return (
                <g 
                  key={`node-${node.id}`}
                  onMouseEnter={() => setHoveredNode(node)}
                  onMouseLeave={() => setHoveredNode(null)}
                  onClick={() => setSelectedAuthor(selectedAuthor?.id === node.id ? null : node)}
                  className="cursor-pointer"
                >
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r={radius}
                    fill={nodeColor}
                    fillOpacity={isNodeHighlighted ? 0.95 : 0.15}
                    stroke={isHovered || isSelected ? "var(--tertiary)" : "var(--outline)"}
                    strokeWidth={isHovered || isSelected ? 2.5 : 1.5}
                    className="transition-all duration-300"
                  />
                  <text
                    x={node.x}
                    y={node.y! + radius + 12}
                    textAnchor="middle"
                    fill="var(--on-surface)"
                    fillOpacity={isNodeHighlighted ? 0.9 : 0.2}
                    fontSize="8px"
                    fontFamily="JetBrains Mono, monospace"
                    className="pointer-events-none transition-all duration-300 font-bold"
                  >
                    {node.name.split(' ').pop()}
                  </text>
                </g>
              );
            })}
          </svg>
        ) : (
          <p className="text-xs text-on-surface-variant font-mono">Không đủ liên kết tác giả để lập sơ đồ mạng lưới.</p>
        )}

        {/* Tooltip positioned dynamically */}
        {!loading && hoveredNode && (
          <div 
            className="absolute glass-panel p-3.5 rounded-xl shadow-2xl pointer-events-none border border-primary/30 z-10 animate-fade-in w-[200px]"
            style={{ 
              left: `${getOptimalTooltipPosition(hoveredNode).left}px`, 
              top: `${getOptimalTooltipPosition(hoveredNode).top}px` 
            }}
          >
            <p className="font-display text-xs font-black text-on-surface border-b border-white/10 pb-1.5 mb-1.5 truncate">
              {hoveredNode.name}
            </p>
            <div className="space-y-1.5 text-[9px] text-on-surface-variant font-mono uppercase tracking-wider">
              <div className="flex justify-between gap-4">
                <span>{selectedEntity?.type === "author" ? "Số bài viết:" : "Ấn phẩm chủ đề:"}</span>
                <span className="text-primary font-bold">{hoveredNode.papers_count} bài</span>
              </div>
              <div className="flex justify-between gap-4">
                <span>Chỉ số H-Index:</span>
                <span className="text-tertiary font-bold">H-{hoveredNode.h_index}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Selected Author Detail Card */}
      {!loading && selectedAuthor && (
        <div className="mt-4 p-4 rounded-xl border border-primary/30 bg-primary/5 animate-fade-in relative">
          <button 
            onClick={() => setSelectedAuthor(null)}
            className="absolute top-2 right-2 text-on-surface-variant hover:text-on-surface text-xs font-bold"
          >
            Hủy chọn
          </button>
          <h4 className="font-display text-sm font-black text-on-surface mb-2 flex items-center gap-2">
            <Users className="w-4 h-4 text-primary" /> {selectedAuthor.name}
          </h4>
          <div className="grid grid-cols-2 gap-4 text-xs font-mono mb-3">
            <div className="bg-surface-container/30 p-2.5 rounded border border-white/5">
              <span className="text-[10px] text-on-surface-variant uppercase tracking-widest block mb-0.5">
                {selectedEntity?.type === "author" ? "Số bài viết" : "Ấn phẩm chủ đề"}
              </span>
              <span className="text-primary font-bold text-sm">{selectedAuthor.papers_count} bài viết</span>
            </div>
            <div className="bg-surface-container/30 p-2.5 rounded border border-white/5">
              <span className="text-[10px] text-on-surface-variant uppercase tracking-widest block mb-0.5">Chỉ số H-Index</span>
              <span className="text-tertiary font-bold text-sm">H-{selectedAuthor.h_index}</span>
            </div>
          </div>
          
          {/* Co-authors list */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest block">Đồng tác giả liên kết:</span>
            <div className="flex flex-wrap gap-1.5">
              {networkNodes
                .filter(n => n.id !== selectedAuthor.id && isConnected(selectedAuthor.id, n.id))
                .map(n => (
                  <span 
                    key={n.id} 
                    onClick={() => setSelectedAuthor(n)}
                    className="px-2 py-0.5 rounded bg-white/5 border border-white/10 hover:border-primary/45 hover:text-primary transition-all cursor-pointer text-[10px]"
                  >
                    {n.name}
                  </span>
                ))
              }
              {networkNodes.filter(n => n.id !== selectedAuthor.id && isConnected(selectedAuthor.id, n.id)).length === 0 && (
                <span className="text-[10px] text-on-surface-variant italic">Không có đồng tác giả nào trong nhóm 15 người đứng đầu.</span>
              )}
            </div>
          </div>
          
          {onSelectAuthor && (
            <button
              onClick={() => {
                onSelectAuthor(selectedAuthor.id, selectedAuthor.name);
                setSelectedAuthor(null);
              }}
              className="mt-4 w-full py-2 bg-primary hover:bg-primary/95 text-on-primary rounded-xl text-xs font-bold uppercase tracking-widest transition-all cursor-pointer text-center"
            >
              Phân tích xu hướng tác giả
            </button>
          )}
        </div>
      )}
    </div>
  );
}
