import React, { useRef, useEffect, useState } from "react";
import { Network, Info, SlidersHorizontal } from "lucide-react";
import { GraphControlPanel } from "./GraphControlPanel";
import { GraphCenterButton } from "./GraphCenterButton";
import { GraphNodeTooltip } from "./GraphNodeTooltip";

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

interface GraphLink {
  source: string;
  target: string;
}

interface SemanticGraphViewProps {
  semanticNodes: GraphNode[];
  setSemanticNodes: React.Dispatch<React.SetStateAction<GraphNode[]>>;
  semanticLinks: GraphLink[];
  selectedPaper: Paper | null;
  defaultPaper: Paper | null;
  setSelectedPaper: (paper: Paper | null) => void;
  hoveredNodeId: string | null;
  setHoveredNodeId: (id: string | null) => void;
  minYearFilter: number;
  setMinYearFilter: (y: number) => void;
  minCitationsFilter: number;
  setMinCitationsFilter: (c: number) => void;
  zoom: number;
  setZoom: (z: number) => void;
  pan: { x: number; y: number };
  setPan: (p: { x: number; y: number }) => void;
  isPanning: boolean;
  setIsPanning: (p: boolean) => void;
  startPan: { x: number; y: number };
  setStartPan: (p: { x: number; y: number }) => void;
  draggedNode: string | null;
  setDraggedNode: (n: string | null) => void;
  handleExpandNode: (node: GraphNode) => void;
  q: string;
  year: string;
  author: string;
  journal: string;
  keyword: string;
  sort: string;
  setSearchParams: any;
  setSearchInput: any;
  simTrigger: number;
  setSimTrigger: React.Dispatch<React.SetStateAction<number>>;
  filteredNodes: GraphNode[];
  filteredLinks: GraphLink[];
}

export const SemanticGraphView: React.FC<SemanticGraphViewProps> = ({
  semanticNodes,
  setSemanticNodes,
  semanticLinks,
  selectedPaper,
  defaultPaper,
  setSelectedPaper,
  hoveredNodeId,
  setHoveredNodeId,
  minYearFilter,
  setMinYearFilter,
  minCitationsFilter,
  setMinCitationsFilter,
  zoom,
  setZoom,
  pan,
  setPan,
  isPanning,
  setIsPanning,
  startPan,
  setStartPan,
  draggedNode,
  setDraggedNode,
  handleExpandNode,
  q,
  year,
  author,
  journal,
  keyword,
  sort,
  setSearchParams,
  setSearchInput,
  simTrigger,
  setSimTrigger,
  filteredNodes,
  filteredLinks,
}) => {
  const canvasRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const legendRef = useRef<HTMLDivElement>(null);
  const toggleBtnRef = useRef<HTMLButtonElement>(null);
  const [showLegend, setShowLegend] = useState(false);

  const controlsRef = useRef<HTMLDivElement>(null);
  const controlsToggleBtnRef = useRef<HTMLButtonElement>(null);
  const [showControls, setShowControls] = useState(false);

  // Click outside to close Legend or Controls Popups
  useEffect(() => {
    if (!showLegend && !showControls) return;

    const handleOutsideClick = (event: MouseEvent) => {
      const target = event.target as Node;
      if (showLegend) {
        if (
          legendRef.current && 
          !legendRef.current.contains(target) &&
          toggleBtnRef.current &&
          !toggleBtnRef.current.contains(target)
        ) {
          setShowLegend(false);
        }
      }
      if (showControls) {
        if (
          controlsRef.current && 
          !controlsRef.current.contains(target) &&
          controlsToggleBtnRef.current &&
          !controlsToggleBtnRef.current.contains(target)
        ) {
          setShowControls(false);
        }
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [showLegend, showControls]);

  // Live Force-Directed Simulation Loop with Alpha Decay Damping
  useEffect(() => {
    if (semanticNodes.length === 0) return;

    let animationFrameId: number;
    let alpha = 1.0;

    const tick = () => {
      if (alpha < 0.005) {
        return; // Simulation stabilized, stop running to save CPU
      }

      setSemanticNodes(prevNodes => {
        if (prevNodes.length === 0) return prevNodes;

        // Copy nodes to update positions
        const nodes = prevNodes.map(n => ({ ...n }));
        const nodeMap = new Map(nodes.map(n => [n.id, n]));

        const width = containerRef.current?.clientWidth || 800;
        const height = 720;
        const centerX = width / 2;
        const centerY = height / 2;

        // 1. Repulsion between all node pairs (Coulomb force) - Increased coefficient to 0.28
        for (let i = 0; i < nodes.length; i++) {
          const nodeA = nodes[i];
          for (let j = i + 1; j < nodes.length; j++) {
            const nodeB = nodes[j];
            const dx = nodeB.x - nodeA.x;
            const dy = nodeB.y - nodeA.y;
            const dist = Math.sqrt(dx * dx + dy * dy) || 1;
            
            // Define minimum distance based on node types - Increased non-paper repulsion to 160
            const minRelatedDist = nodeA.type === "paper" || nodeB.type === "paper" ? 180 : 160;
            if (dist < minRelatedDist) {
              // Repulsive force proportional to how close they are
              const force = (minRelatedDist - dist) * 0.28 * alpha;
              const fx = (dx / dist) * force;
              const fy = (dy / dist) * force;
              
              if (nodeA.type !== "root" && nodeA.id !== draggedNode) {
                nodeA.x -= fx;
                nodeA.y -= fy;
              }
              if (nodeB.type !== "root" && nodeB.id !== draggedNode) {
                nodeB.x += fx;
                nodeB.y += fy;
              }
            }
          }
        }

        // 2. Attraction along connected links (Spring force) - Increased coefficient to 0.15
        filteredLinks.forEach(link => {
          const srcId = typeof link.source === "object" ? (link.source as any).id : link.source;
          const tgtId = typeof link.target === "object" ? (link.target as any).id : link.target;
          
          const nodeA = nodeMap.get(srcId);
          const nodeB = nodeMap.get(tgtId);
          if (!nodeA || !nodeB) return;

          const dx = nodeB.x - nodeA.x;
          const dy = nodeB.y - nodeA.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;

          const targetDist = nodeA.type === "root" || nodeB.type === "root" ? 140 : 100;
          if (dist > targetDist) {
            // Spring force pulling connected nodes closer
            const force = (dist - targetDist) * 0.15 * alpha;
            const fx = (dx / dist) * force;
            const fy = (dy / dist) * force;

            if (nodeA.type !== "root" && nodeA.id !== draggedNode) {
              nodeA.x += fx;
              nodeA.y += fy;
            }
            if (nodeB.type !== "root" && nodeB.id !== draggedNode) {
              nodeB.x -= fx;
              nodeB.y -= fy;
            }
          }
        });

        // 3. Gravity pulling nodes toward the root node coordinates (symmetrical clustering)
        const rootNode = nodes.find(n => n.type === "root");
        const gravityCenterX = rootNode ? rootNode.x : centerX;
        const gravityCenterY = rootNode ? rootNode.y : centerY;

        nodes.forEach(node => {
          if (node.type === "root" || node.id === draggedNode) return;
          const dx = gravityCenterX - node.x;
          const dy = gravityCenterY - node.y;
          // Soft gravity pull
          node.x += dx * 0.045 * alpha;
          node.y += dy * 0.045 * alpha;
        });

        // 4. Boundary Constraint Clamping (Defensive design)
        nodes.forEach(node => {
          if (node.type === "root") return; // Keep root fixed at center
          node.x = Math.max(30, Math.min(width - 30, node.x));
          node.y = Math.max(30, Math.min(height - 30, node.y));
        });

        return nodes;
      });

      // Decay the alpha parameter to stabilize the graph over time - Increased decay rate to 0.965
      alpha *= 0.965;
      animationFrameId = requestAnimationFrame(tick);
    };

    animationFrameId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [semanticLinks, minYearFilter, minCitationsFilter, draggedNode, semanticNodes.length, simTrigger]);

  const mapNodeMetadataToPaper = (meta: NodeMetadata): Paper => {
    return {
      id: meta.id,
      title: meta.title,
      abstract: meta.abstract,
      published_year: meta.publishedYear,
      citations_count: meta.citationsCount,
      source: "",
      doi: meta.doi || undefined,
      authors: meta.authors.map((name, index) => ({ id: index, name })),
      keywords: [],
      journal: undefined
    };
  };

  const isLinkRelated = (link: GraphLink) => {
    if (!selectedPaper) return true;
    const selNodeId = "paper_" + selectedPaper.id;
    const srcId = typeof link.source === "object" ? (link.source as any).id : link.source;
    const tgtId = typeof link.target === "object" ? (link.target as any).id : link.target;
    return srcId === selNodeId || tgtId === selNodeId;
  };

  // Mouse drag and pan canvas event handlers
  const handleNodeMouseDown = (e: React.MouseEvent, node: GraphNode) => {
    e.stopPropagation();
    setDraggedNode(node.id);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (draggedNode && canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      const x = (e.clientX - rect.left - pan.x) / zoom;
      const y = (e.clientY - rect.top - pan.y) / zoom;
      setSemanticNodes(prev => prev.map(n => n.id === draggedNode ? { ...n, x, y } : n));
    } else if (isPanning) {
      setPan({
        x: e.clientX - startPan.x,
        y: e.clientY - startPan.y
      });
    }
  };

  const handleMouseUp = () => {
    setDraggedNode(null);
    setIsPanning(false);
  };

  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0) {
      setIsPanning(true);
      setStartPan({
        x: e.clientX - pan.x,
        y: e.clientY - pan.y
      });
    }
  };

  return (
    <div 
      ref={containerRef}
      className="glass-panel rounded-3xl overflow-hidden border border-outline-variant/30 h-[720px] relative bg-surface-container-low/40 select-none cursor-grab active:cursor-grabbing"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onMouseDown={handleCanvasMouseDown}
    >
      {semanticNodes.length > 0 && showControls && (
        <GraphControlPanel
          zoom={zoom}
          setZoom={setZoom}
          minYearFilter={minYearFilter}
          setMinYearFilter={setMinYearFilter}
          minCitationsFilter={minCitationsFilter}
          setMinCitationsFilter={setMinCitationsFilter}
          containerRef={controlsRef}
        />
      )}

      {semanticNodes.length === 0 ? (
        <div className="w-full h-full flex flex-col items-center justify-center text-center p-8 space-y-4">
          <div className="w-16 h-16 rounded-3xl bg-secondary/10 border border-secondary/20 flex items-center justify-center text-secondary">
            <Network className="w-8 h-8 animate-pulse" />
          </div>
          <div className="space-y-1 max-w-sm">
            <h4 className="text-sm font-bold text-on-surface">Không có dữ liệu đồ thị</h4>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              Nhập từ khóa tìm kiếm học thuật và chọn chế độ tìm kiếm tương đồng để vẽ sơ đồ mạng lưới.
            </p>
          </div>
        </div>
      ) : (
        <svg
          ref={canvasRef}
          className="w-full h-full animate-fade-in"
          style={{ cursor: draggedNode ? "grabbing" : isPanning ? "grabbing" : "grab" }}
          onClick={() => setSelectedPaper(null)}
        >
          <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
            
            {/* Draw Links */}
            {filteredLinks.map((link, idx) => {
              const sourceNode = semanticNodes.find(n => n.id === (typeof link.source === "object" ? (link.source as any).id : link.source));
              const targetNode = semanticNodes.find(n => n.id === (typeof link.target === "object" ? (link.target as any).id : link.target));
              if (!sourceNode || !targetNode) return null;
              
              const isPaperLink = targetNode.type === "paper";
              const isRelated = isLinkRelated(link);
              
              const strokeColor = isPaperLink ? "#f97316" : "#0284c7";
              const strokeWidth = isRelated 
                ? (isPaperLink ? 2.5 : 4) 
                : (isPaperLink ? 1 : 1.5);

              // Focus dimming and selection logic
              const srcId = typeof link.source === "object" ? (link.source as any).id : link.source;
              const tgtId = typeof link.target === "object" ? (link.target as any).id : link.target;

              let opacity = 0.45;
              if (selectedPaper) {
                const selNodeId = "paper_" + selectedPaper.id;
                opacity = (srcId === selNodeId || tgtId === selNodeId) ? 0.85 : 0.08;
              } else if (hoveredNodeId) {
                opacity = (srcId === hoveredNodeId || tgtId === hoveredNodeId) ? 0.85 : 0.08;
              }

              return (
                <line
                  key={`link-${idx}`}
                  x1={sourceNode.x}
                  y1={sourceNode.y}
                  x2={targetNode.x}
                  y2={targetNode.y}
                  stroke={strokeColor}
                  strokeWidth={strokeWidth}
                  strokeDasharray={isPaperLink ? "4 4" : "none"}
                  opacity={opacity}
                  className="transition-opacity duration-300"
                />
              );
            })}

            {/* Draw Nodes */}
            {filteredNodes.map((node) => {
              const isSelected = selectedPaper 
                ? "paper_" + selectedPaper.id === node.id
                : (defaultPaper ? "paper_" + defaultPaper.id === node.id : false);
              
              let circleColor = "fill-emerald-500";
              let strokeColor = "stroke-emerald-600/30";
              
              if (node.type === "topic") {
                circleColor = "fill-sky-500";
                strokeColor = "stroke-sky-600/30";
              } else if (node.type === "paper" && node.metadata) {
                const yr = node.metadata.publishedYear || 2020;
                if (yr >= 2024) {
                  circleColor = "fill-rose-600";
                  strokeColor = "stroke-rose-700/30";
                } else if (yr >= 2020) {
                  circleColor = "fill-orange-500";
                  strokeColor = "stroke-orange-600/30";
                } else if (yr >= 2015) {
                  circleColor = "fill-amber-500";
                  strokeColor = "stroke-amber-600/30";
                } else {
                  circleColor = "fill-amber-300";
                  strokeColor = "stroke-amber-400/30";
                }
              } else if (node.type === "paper") {
                circleColor = "fill-orange-500";
                strokeColor = "stroke-orange-600/30";
              }

              let isRelated = true;
              if (selectedPaper) {
                const selNodeId = "paper_" + selectedPaper.id;
                if (node.id === selNodeId) {
                  isRelated = true;
                } else {
                  isRelated = semanticLinks.some(l => {
                    const srcId = typeof l.source === "object" ? (l.source as any).id : l.source;
                    const tgtId = typeof l.target === "object" ? (l.target as any).id : l.target;
                    return (srcId === selNodeId && tgtId === node.id) || (tgtId === selNodeId && srcId === node.id);
                  });
                }
              }
              
              // Focus dimming for nodes
              let nodeOpacity = 1.0;
              if (selectedPaper) {
                nodeOpacity = isRelated ? 1.0 : 0.2;
              } else if (hoveredNodeId) {
                const isNodeRelatedToHover = node.id === hoveredNodeId || semanticLinks.some(l => {
                  const sId = typeof l.source === "object" ? (l.source as any).id : l.source;
                  const tId = typeof l.target === "object" ? (l.target as any).id : l.target;
                  return (sId === hoveredNodeId && tId === node.id) || (tId === hoveredNodeId && sId === node.id);
                });
                nodeOpacity = isNodeRelatedToHover ? 1.0 : 0.15;
              }

              // Calculate dynamic node radius based on citation count (for papers)
              const nodeRadius = node.type === "paper"
                ? (12 + Math.min(10, (node.metadata?.citationsCount || 0) / 10))
                : node.val;

              // Adjust label margin dynamically based on node radius to avoid text overlapping circle
              const labelOffset = nodeRadius + 8;

              return (
                <g
                  key={node.id}
                  transform={`translate(${node.x}, ${node.y})`}
                  className="cursor-pointer pointer-events-auto transition-opacity duration-300"
                  style={{ opacity: nodeOpacity }}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (e.ctrlKey || e.metaKey || e.shiftKey) {
                      e.preventDefault();
                      setSearchInput(node.label);
                      setSearchParams({ q: node.label, mode: "semantic", view: "tree", year, author, journal, keyword, sort, page: "1" });
                      return;
                    }
                    if (node.type === "paper" && node.metadata) {
                      setSelectedPaper(mapNodeMetadataToPaper(node.metadata));
                    } else if (node.type === "topic") {
                      setSelectedPaper(null);
                      handleExpandNode(node);
                    } else if (node.type === "root") {
                      setSelectedPaper(null);
                    }
                  }}
                  onMouseDown={(e) => handleNodeMouseDown(e, node)}
                  onMouseEnter={() => setHoveredNodeId(node.id)}
                  onMouseLeave={() => setHoveredNodeId(null)}
                >
                  {(node.type === "root" || isSelected) && (
                    <circle
                      r={nodeRadius + 8}
                      className={`fill-none ${node.type === "root" ? "stroke-emerald-500/20" : "stroke-sky-500/40"} stroke-[3px] animate-ping`}
                    />
                  )}

                  <circle
                    r={nodeRadius}
                    className={`${circleColor} ${strokeColor} stroke-[3px] shadow-lg hover:scale-115 transition-transform duration-200`}
                  />

                  <text
                    x={0}
                    y={nodeRadius + 13}
                    textAnchor="middle"
                    className={`pointer-events-none select-none text-[8.5px] font-black fill-on-surface/90 transition-opacity duration-300 ${
                      node.type !== "paper" || hoveredNodeId === node.id || isSelected
                        ? "opacity-100"
                        : "opacity-0"
                    }`}
                    style={{
                      textShadow: "0 1px 2px #ffffff, -1.5px -1.5px 0 #ffffff, 1.5px -1.5px 0 #ffffff, -1.5px 1.5px 0 #ffffff, 1.5px 1.5px 0 #ffffff"
                    }}
                  >
                    {node.label.length > 22
                      ? node.label.substring(0, 19) + "..."
                      : node.label}
                  </text>
                </g>
              );
            })}

          </g>
        </svg>
      )}

      {/* Legend popup card shown above the buttons when showLegend is true */}
      {semanticNodes.length > 0 && showLegend && (
        <div 
          ref={legendRef}
          onMouseDown={(e) => e.stopPropagation()}
          className="absolute bottom-14 left-4 bg-surface-container-high/95 backdrop-blur-md p-4 rounded-3xl border border-outline-variant/35 shadow-2xl text-[10px] text-on-surface-variant font-semibold pointer-events-auto flex flex-col gap-3.5 w-72 animate-in fade-in slide-in-from-bottom-3 duration-200 z-30"
        >
          {/* Legend section */}
          <div className="space-y-2">
            <span className="text-[9px] font-black text-on-surface-variant uppercase tracking-wider block">Chú giải màu sắc:</span>
            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 border border-emerald-600/30 flex-shrink-0" />
                <span className="text-[9px] leading-none">Ý tưởng tìm kiếm</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-sky-500 border border-sky-600/30 flex-shrink-0" />
                <span className="text-[9px] leading-none">Chủ đề khoa học</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-600 border border-rose-700/30 flex-shrink-0" />
                <span className="text-[9px] leading-none">Bài báo (≥ 2024)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-orange-500 border border-orange-600/30 flex-shrink-0" />
                <span className="text-[9px] leading-none">Bài báo (2020 - 2023)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 border border-amber-600/30 flex-shrink-0" />
                <span className="text-[9px] leading-none">Bài báo (2015 - 2019)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-300 border border-amber-400/30 flex-shrink-0" />
                <span className="text-[9px] leading-none">Bài báo (&lt; 2015)</span>
              </div>
            </div>
          </div>

          <div className="h-px bg-outline-variant/20" />

          {/* Interaction Guide */}
          <div className="space-y-1.5 text-[9px] text-on-surface-variant font-medium leading-relaxed">
            <span className="text-[9px] font-black text-on-surface-variant uppercase tracking-wider block mb-1">Cách tương tác:</span>
            <div className="flex items-start gap-1">
              <span>🖱️</span>
              <span>Kéo thả nút để thay đổi vị trí đồ thị.</span>
            </div>
            <div className="flex items-start gap-1">
              <span>🎯</span>
              <span><strong>Ctrl+Click</strong> làm trung tâm tìm kiếm mới.</span>
            </div>
            <div className="flex items-start gap-1">
              <span>🌿</span>
              <span>Click nút <strong>Chủ đề</strong> để xem các bài báo liên quan.</span>
            </div>
          </div>
        </div>
      )}

      {/* Unified controls row at the bottom left */}
      {semanticNodes.length > 0 && (
        <div 
          onMouseDown={(e) => e.stopPropagation()}
          className="absolute bottom-4 left-4 z-20 flex gap-2 pointer-events-auto items-center"
        >
          {/* Reset Origin Button */}
          <GraphCenterButton
            onReset={() => {
              setPan({ x: 0, y: 0 });
              setZoom(1);
              setSimTrigger(prev => prev + 1);
            }}
          />

          {/* Legend Toggle Button */}
          <button
            ref={toggleBtnRef}
            type="button"
            onClick={() => {
              setShowLegend(prev => !prev);
              setShowControls(false);
            }}
            className={`w-8 h-8 rounded-full border border-outline-variant/30 shadow-md flex items-center justify-center transition-all cursor-pointer active:scale-90 relative group ${
              showLegend
                ? "bg-primary text-white border-primary hover:bg-primary"
                : "bg-surface-container-high/90 hover:bg-surface-container-highest text-on-surface hover:text-primary"
            }`}
          >
            <Info className="w-4 h-4" />
            
            {/* Tooltip */}
            <span className="absolute bottom-full left-0 mb-2 px-2.5 py-1 text-[9px] font-black uppercase tracking-wider text-white bg-on-surface rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap shadow-lg">
              Chú giải & Hướng dẫn
            </span>
          </button>

          {/* Controls/Filters Toggle Button */}
          <button
            ref={controlsToggleBtnRef}
            type="button"
            onClick={() => {
              setShowControls(prev => !prev);
              setShowLegend(false);
            }}
            className={`w-8 h-8 rounded-full border border-outline-variant/30 shadow-md flex items-center justify-center transition-all cursor-pointer active:scale-90 relative group ${
              showControls
                ? "bg-primary text-white border-primary hover:bg-primary"
                : "bg-surface-container-high/90 hover:bg-surface-container-highest text-on-surface hover:text-primary"
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            
            {/* Tooltip */}
            <span className="absolute bottom-full left-0 mb-2 px-2.5 py-1 text-[9px] font-black uppercase tracking-wider text-white bg-on-surface rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap shadow-lg">
              Bộ lọc & Thu phóng
            </span>
          </button>
        </div>
      )}

      <GraphNodeTooltip
        hoveredNodeId={hoveredNodeId}
        semanticNodes={semanticNodes}
      />
    </div>
  );
};
