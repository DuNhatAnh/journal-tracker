import { useEffect, useState, useMemo } from "react";
import Chart from "react-apexcharts";
import { Download, Bell, ArrowUp, Info, Users, Award, BookOpen } from "lucide-react";
import { cn } from "@/src/lib/utils";
import { api } from "@/src/lib/api";

interface TrendRecord {
  id: number;
  year: number;
  paper_count: number;
  citation_count: number;
  growth_rate: number;
}

interface JournalRecord {
  id: number;
  name: string;
  field: string;
  h_index: number;
  papers_count: number;
}

interface AuthorNode {
  id: number;
  name: string;
  papers_count: number;
  h_index: number;
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
}

interface CoAuthorLink {
  source: number;
  target: number;
  weight: number;
}

interface KeywordDetail {
  keyword: { id: number; name: string };
  trends: TrendRecord[];
  journals: JournalRecord[];
  papers: any[];
  network: {
    nodes: AuthorNode[];
    links: CoAuthorLink[];
  };
}

interface TrendingTopic {
  id: number;
  keyword_id: number;
  paper_count: number;
  growth_rate: number;
  keyword?: { id: number; name: string };
}

export default function Trending() {
  const [trendingList, setTrendingList] = useState<TrendingTopic[]>([]);
  const [selectedKeywordId, setSelectedKeywordId] = useState<number | null>(null);
  const [selectedDetail, setSelectedDetail] = useState<KeywordDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const [networkNodes, setNetworkNodes] = useState<AuthorNode[]>([]);
  const [hoveredNode, setHoveredNode] = useState<AuthorNode | null>(null);

  // Fetch initial top trending topics list
  useEffect(() => {
    api.get<any>("/trends/trending")
      .then(res => {
        const list = res.trending || [];
        setTrendingList(list);
        
        if (list.length > 0) {
          const firstTopic = list[0];
          setSelectedKeywordId(firstTopic.keyword_id);
          
          if (res.details) {
            setSelectedDetail(res.details);
          } else {
            // Fallback fetch if not eager loaded
            fetchDetail(firstTopic.keyword_id);
          }
        }
        setLoading(false);
      })
      .catch(err => {
        console.error("Lỗi tải danh mục xu hướng", err);
        setLoading(false);
      });
  }, []);

  const fetchDetail = (keywordId: number) => {
    setLoadingDetail(true);
    api.get<any>(`/trends/${keywordId}`)
      .then(res => {
        setSelectedDetail(res);
        setLoadingDetail(false);
      })
      .catch(err => {
        console.error("Lỗi tải chi tiết xu hướng chủ đề", err);
        setLoadingDetail(false);
      });
  };

  const handleSelectKeyword = (keywordId: number) => {
    if (keywordId === selectedKeywordId) return;
    setSelectedKeywordId(keywordId);
    fetchDetail(keywordId);
  };

  // Compute force layout once details are loaded
  useEffect(() => {
    if (!selectedDetail?.network?.nodes) {
      setNetworkNodes([]);
      return;
    }
    
    // Copy nodes to avoid mutating state
    const nodes: AuthorNode[] = selectedDetail.network.nodes.map((n, idx) => ({
      ...n,
      x: 250 + Math.cos((idx / selectedDetail.network.nodes.length) * 2 * Math.PI) * 120,
      y: 200 + Math.sin((idx / selectedDetail.network.nodes.length) * 2 * Math.PI) * 120,
      vx: 0,
      vy: 0,
    }));

    const links = selectedDetail.network.links;
    const width = 500;
    const height = 400;

    // Run force-directed layout simulation for 220 ticks for better convergence
    for (let tick = 0; tick < 220; tick++) {
      // 1. Repulsion between nodes & Collision avoidance
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const n1 = nodes[i];
          const n2 = nodes[j];
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
      links.forEach((link) => {
        const sourceNode = nodes.find(n => n.id === link.source);
        const targetNode = nodes.find(n => n.id === link.target);
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
      nodes.forEach(node => {
        const dx = width / 2 - node.x!;
        const dy = height / 2 - node.y!;
        node.vx! += dx * 0.007; // Gentler central force
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

    setNetworkNodes(nodes);
  }, [selectedDetail]);

  const isConnected = (id1: number, id2: number) => {
    if (id1 === id2) return true;
    return selectedDetail?.network.links.some(l => 
      (l.source === id1 && l.target === id2) || (l.source === id2 && l.target === id1)
    ) ?? false;
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

  const activeStats = useMemo(() => {
    if (!selectedDetail?.trends || selectedDetail.trends.length === 0) {
      return { growth: "+0%", total: "0", impact: "0.0" };
    }
    const trends = selectedDetail.trends;
    const latest = trends[trends.length - 1];
    const growth = latest ? `+${latest.growth_rate}%` : "+0%";
    const totalPapers = trends.reduce((sum, t) => sum + (t.paper_count ?? 0), 0);
    const totalCitations = trends.reduce((sum, t) => sum + (t.citation_count ?? 0), 0);
    const impact = totalPapers > 0 
      ? (Math.round((totalCitations / totalPapers) * 10) / 10).toFixed(1)
      : "0.0";
    return { growth, total: String(totalPapers), impact };
  }, [selectedDetail]);

  const velocityChartData = useMemo(() => {
    if (!selectedDetail?.trends) return { categories: [], series: [] };
    const categories = selectedDetail.trends.map(t => String(t.year));
    const series = [{
      name: "Số lượng công bố",
      data: selectedDetail.trends.map(t => t.paper_count)
    }];
    return { categories, series };
  }, [selectedDetail]);

  if (loading) {
    return (
      <div className="p-8 text-on-surface-variant uppercase font-mono animate-pulse text-center">
        Đang phân tích xu hướng và tính toán chỉ số H-index...
      </div>
    );
  }

  const topicName = selectedDetail?.keyword?.name || "Chưa chọn chủ đề";

  return (
    <div className="space-y-8 pb-20 relative">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-1 rounded-full bg-tertiary/10 border border-tertiary/20 text-tertiary font-mono text-[10px] uppercase tracking-widest">Phân tích xu hướng</span>
            <span className="text-on-surface-variant text-[10px] uppercase tracking-widest">• Lịch sử xuất bản</span>
          </div>
          <h2 className="font-display text-4xl font-bold text-on-surface">{topicName}</h2>
          <p className="text-on-surface-variant mt-1 max-w-2xl text-sm">
            Phân tích tốc độ xuất bản, gợi ý tạp chí tối ưu, và trực quan hóa mạng lưới đồng tác giả cùng chỉ số H-index.
          </p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-4 py-2 glass-panel rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-white/5 transition-all">
            <Download className="w-4 h-4" /> Xuất báo cáo
          </button>
          <button className="flex items-center gap-2 px-4 py-2 gradient-btn rounded-xl text-xs font-bold uppercase tracking-widest text-on-primary">
            <Bell className="w-4 h-4 fill-current" /> Tạo cảnh báo
          </button>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 relative">
        {/* Left Column (Main detailed contents) */}
        <div className="lg:col-span-8 space-y-8 relative">
          {loadingDetail && (
            <div className="absolute inset-0 bg-background/60 backdrop-blur-sm flex items-center justify-center z-20 rounded-2xl">
              <div className="font-mono text-xs uppercase tracking-widest text-primary animate-pulse">
                Đang tải dữ liệu chi tiết chủ đề...
              </div>
            </div>
          )}

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { label: "Tỷ lệ tăng trưởng", value: activeStats.growth, desc: "Năm gần nhất", color: "text-tertiary" },
              { label: "Tổng số ấn phẩm", value: activeStats.total, desc: "Tất cả các năm", color: "text-primary" },
              { label: "Ảnh hưởng TB (Citations/Paper)", value: activeStats.impact, desc: "Chỉ số trích dẫn trung bình", color: "text-secondary" },
            ].map((stat, i) => (
              <div key={i} className="glass-panel p-6 rounded-xl relative overflow-hidden group border-t border-white/5">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary/30 to-transparent opacity-50" />
                <div className="flex justify-between items-center mb-1">
                  <span className="font-mono text-[10px] text-on-surface-variant uppercase tracking-widest">{stat.label}</span>
                  <Info className="w-3 h-3 text-outline-variant" />
                </div>
                <div className="text-4xl font-bold text-on-surface tracking-tighter mb-2">{stat.value}</div>
                <p className={cn("text-[10px] font-bold uppercase tracking-widest flex items-center gap-1", stat.color)}>
                  <ArrowUp className="w-2.5 h-2.5" /> {stat.desc}
                </p>
              </div>
            ))}
          </div>

          {/* Publication Velocity Chart */}
          <div className="glass-panel p-6 rounded-2xl flex flex-col min-h-[380px]">
            <div className="flex justify-between items-center mb-6">
              <div className="space-y-1">
                <h3 className="font-display text-xl font-bold">Tốc độ xuất bản</h3>
                <p className="text-xs text-on-surface-variant">Khối lượng bài viết công bố qua các năm.</p>
              </div>
            </div>
            
            <div className="flex-1">
              {velocityChartData.categories.length > 0 ? (
                <Chart
                  options={{
                    chart: { 
                      id: "publication-velocity-chart",
                      toolbar: { show: false },
                      animations: { enabled: true, speed: 500 },
                      background: 'transparent',
                    },
                    stroke: { curve: 'smooth' as const, width: 3, colors: ['#3B82F6'] },
                    grid: { borderColor: 'rgba(255,255,255,0.05)', strokeDashArray: 4 },
                    xaxis: {
                      categories: velocityChartData.categories,
                      labels: { style: { colors: '#9CA3AF', fontSize: '10px', fontFamily: 'JetBrains Mono' } },
                      axisBorder: { show: false },
                      axisTicks: { show: false },
                    },
                    yaxis: {
                      labels: { style: { colors: '#9CA3AF', fontSize: '10px', fontFamily: 'JetBrains Mono' } }
                    },
                    fill: {
                      type: 'gradient',
                      gradient: { shadeIntensity: 0, opacityFrom: 0.3, opacityTo: 0, stops: [0, 90, 100] }
                    },
                    tooltip: { theme: 'dark' },
                  }}
                  series={velocityChartData.series}
                  type="area"
                  height={280}
                />
              ) : (
                <p className="text-center text-xs text-on-surface-variant py-8">Chưa có dữ liệu biểu đồ.</p>
              )}
            </div>
          </div>

          {/* Co-authorship Network Graph */}
          <div className="glass-panel p-6 rounded-2xl flex flex-col relative">
            <div className="space-y-1 mb-6">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                <h3 className="font-display text-xl font-bold">Mạng lưới đồng tác giả</h3>
              </div>
              <p className="text-xs text-on-surface-variant">
                Trực quan hóa mối liên kết viết chung bài báo của Top 15 tác giả hàng đầu (Rê chuột lên hình tròn để xem H-index).
              </p>
            </div>

            <div className="relative border border-white/5 rounded-xl bg-surface-container/20 h-[400px] overflow-hidden flex items-center justify-center">
              {networkNodes.length > 0 ? (
                <svg viewBox="0 0 500 400" className="w-full h-full select-none">
                  {/* Draw links */}
                  {selectedDetail?.network.links.map((link, idx) => {
                    const sourceNode = networkNodes.find(n => n.id === link.source);
                    const targetNode = networkNodes.find(n => n.id === link.target);
                    if (!sourceNode || !targetNode) return null;
                    
                    const isHighlighted = hoveredNode 
                      ? (link.source === hoveredNode.id || link.target === hoveredNode.id)
                      : false;

                    return (
                      <line
                        key={`link-${idx}`}
                        x1={sourceNode.x}
                        y1={sourceNode.y}
                        x2={targetNode.x}
                        y2={targetNode.y}
                        stroke={isHighlighted ? "var(--primary)" : "rgba(148, 163, 184, 0.5)"}
                        strokeWidth={1.5 + Math.min(3, link.weight)}
                        strokeOpacity={hoveredNode ? (isHighlighted ? 0.85 : 0.05) : 0.6}
                        className="transition-all duration-300"
                      />
                    );
                  })}

                  {/* Draw nodes */}
                  {networkNodes.map((node) => {
                    const isNodeHighlighted = hoveredNode 
                      ? isConnected(hoveredNode.id, node.id)
                      : true;
                    
                    const isHovered = hoveredNode?.id === node.id;
                    const baseRadius = 8 + Math.min(10, node.papers_count * 1.5);
                    const radius = isHovered ? baseRadius * 1.2 : baseRadius;

                    return (
                      <g 
                        key={`node-${node.id}`}
                        onMouseEnter={() => setHoveredNode(node)}
                        onMouseLeave={() => setHoveredNode(null)}
                        className="cursor-pointer"
                      >
                        <circle
                          cx={node.x}
                          cy={node.y}
                          r={radius}
                          fill={isHovered ? "var(--tertiary)" : "var(--primary)"}
                          fillOpacity={isNodeHighlighted ? 1 : 0.25}
                          stroke={isHovered ? "var(--tertiary)" : "var(--outline)"}
                          strokeWidth={isHovered ? 2.5 : 1.5}
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
                          className="pointer-events-none transition-all duration-300"
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

              {/* Tooltip positioned dynamically to avoid overlapping bright nodes */}
              {hoveredNode && (
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
                      <span>Ấn phẩm chủ đề:</span>
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
          </div>

          {/* Recommended Journals */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-tertiary" />
              <h3 className="font-display text-xl font-bold">Tạp chí khuyên dùng tối ưu</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {selectedDetail?.journals && selectedDetail.journals.length > 0 ? (
                selectedDetail.journals.map((journal) => (
                  <div key={journal.id} className="glass-panel p-5 rounded-xl border border-white/5 hover:border-tertiary/40 transition-all flex flex-col justify-between h-40">
                    <div>
                      <div className="flex justify-between items-start mb-2">
                        <span className="bg-tertiary/10 text-tertiary text-[9px] font-bold px-2 py-0.5 rounded border border-tertiary/20 uppercase tracking-wider">
                          H-Index: {journal.h_index}
                        </span>
                      </div>
                      <h4 className="font-display font-bold text-on-surface text-sm line-clamp-2 leading-tight">
                        {journal.name}
                      </h4>
                    </div>
                    <div className="flex justify-between items-center text-[10px] text-on-surface-variant font-mono uppercase tracking-widest">
                      <span>{journal.field}</span>
                      <span className="text-primary font-bold">{journal.papers_count} Bài viết</span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-on-surface-variant col-span-3 text-center py-6 font-mono">Chưa có tạp chí gợi ý cho từ khóa này.</p>
              )}
            </div>
          </div>
        </div>

        {/* Right Column (Emerging Entities selection sidebar) */}
        <div className="lg:col-span-4 space-y-6">
          <div className="glass-panel p-6 rounded-2xl flex flex-col min-h-[500px]">
            <div className="space-y-1 mb-6">
              <h3 className="font-display text-xl font-bold">Thực thể mới nổi</h3>
              <p className="text-xs text-on-surface-variant">Top 10 từ khóa có Điểm Nổi bật (Prominence Score) cao nhất.</p>
            </div>
            
            <div className="flex-1 flex flex-col gap-4">
              {trendingList.map((item) => {
                const isActive = item.keyword_id === selectedKeywordId;
                return (
                  <div 
                    key={item.id} 
                    onClick={() => handleSelectKeyword(item.keyword_id)}
                    className={cn(
                      "p-4 rounded-xl border-2 flex justify-between items-center cursor-pointer transition-all hover:bg-white/5 select-none",
                      isActive 
                        ? "border-primary bg-primary/5 shadow-[0_0_12px_rgba(59,130,246,0.15)]" 
                        : "border-outline-variant/20 bg-surface-container/20"
                    )}
                  >
                    <div className="flex-1 min-w-0 pr-2">
                      <span className={cn("text-sm font-bold truncate block", isActive ? "text-primary" : "text-on-surface")}>
                        {item.keyword?.name || "Chủ đề"}
                      </span>
                      <span className="text-[10px] text-on-surface-variant font-mono block mt-0.5">
                        Lượng xuất bản năm nay: {item.paper_count}
                      </span>
                    </div>
                    <span className="bg-tertiary-container/10 text-tertiary text-[10px] font-bold px-2 py-0.5 rounded border border-tertiary/20 flex items-center gap-0.5">
                      +{item.growth_rate}%
                    </span>
                  </div>
                );
              })}
              {trendingList.length === 0 && (
                <p className="text-xs text-on-surface-variant text-center py-8 font-mono">Chưa có dữ liệu xu hướng.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
