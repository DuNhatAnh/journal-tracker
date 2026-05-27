import { useEffect, useState, useMemo } from "react";
import Chart from "react-apexcharts";
import { Download, Bell, ArrowUp, Info, Users, Award, BookOpen, X, Search, Loader2, Bookmark, BookmarkPlus, BookmarkCheck, ExternalLink, CalendarDays, Quote, Tag } from "lucide-react";
import { Navigate } from "react-router-dom";
import toast from "react-hot-toast";
import { cn, cleanTitle } from "@/src/lib/utils";
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
  cluster?: number;
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
  const userStr = localStorage.getItem("user");
  const user = userStr ? JSON.parse(userStr) : null;
  const role = user?.role || "student";

  if (role !== "researcher" && role !== "admin") {
    return <Navigate to="/dashboard" replace />;
  }

  const [trendingList, setTrendingList] = useState<TrendingTopic[]>([]);
  const [selectedKeywordId, setSelectedKeywordId] = useState<number | null>(null);
  const [selectedDetail, setSelectedDetail] = useState<KeywordDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const [networkNodes, setNetworkNodes] = useState<AuthorNode[]>([]);
  const [hoveredNode, setHoveredNode] = useState<AuthorNode | null>(null);
  const [selectedAuthor, setSelectedAuthor] = useState<AuthorNode | null>(null);

  // Bookmarks state
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<number>>(new Set());
  const [bookmarkLoadingIds, setBookmarkLoadingIds] = useState<Set<number>>(new Set());
  const [selectedPaper, setSelectedPaper] = useState<any | null>(null);

  // Followed journals state
  const [followedJournalIds, setFollowedJournalIds] = useState<Set<number>>(new Set());
  const [followingJournalLoadingIds, setFollowingJournalLoadingIds] = useState<Set<number>>(new Set());

  // Time slider filter state
  const [startYear, setStartYear] = useState(2020);
  const [endYear, setEndYear] = useState(2026);

  // Keyword search state
  const [keywordSearchQuery, setKeywordSearchQuery] = useState("");
  const [keywordSearchResults, setKeywordSearchResults] = useState<any[]>([]);
  const [isKeywordSearching, setIsKeywordSearching] = useState(false);

  // Journal benchmark toggle
  const [isComparing, setIsComparing] = useState(false);

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

    // Load following status for journals
    api.get<any>("/following/status")
      .then(res => {
        if (res.journals) {
          setFollowedJournalIds(new Set(res.journals.map((j: any) => j.id)));
        }
      })
      .catch(err => {
        console.error("Lỗi lấy thông tin follow journals:", err);
      });

    // Load bookmarked papers
    api.get<any>("/dashboard/bookmarks")
      .then(res => {
        if (res.bookmarked_paper_ids) {
          setBookmarkedIds(new Set(res.bookmarked_paper_ids));
        }
      })
      .catch(err => {
        console.error("Lỗi lấy thông tin bookmark:", err);
      });
  }, []);

  // Update year range dynamically when details change
  useEffect(() => {
    if (selectedDetail?.trends && selectedDetail.trends.length > 0) {
      const years = selectedDetail.trends.map(t => t.year);
      setStartYear(Math.min(...years));
      setEndYear(Math.max(...years));
    }
    setSelectedAuthor(null); // Clear selected author on topic change
  }, [selectedDetail]);

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

  // Search keyword in database
  const handleKeywordSearch = async (val: string) => {
    setKeywordSearchQuery(val);
    if (!val.trim()) {
      setKeywordSearchResults([]);
      return;
    }
    setIsKeywordSearching(true);
    try {
      const res = await api.get<any>(`/keywords?q=${encodeURIComponent(val)}`);
      setKeywordSearchResults(res.data || []);
    } catch (err) {
      console.error("Lỗi tìm kiếm từ khóa:", err);
    } finally {
      setIsKeywordSearching(false);
    }
  };

  // Toggle follow/unfollow recommended journal
  const handleToggleFollowJournal = async (journalId: number) => {
    if (followingJournalLoadingIds.has(journalId)) return;
    const isFollowing = followedJournalIds.has(journalId);
    setFollowingJournalLoadingIds(prev => new Set(prev).add(journalId));
    try {
      if (isFollowing) {
        await api.delete(`/following/journals/${journalId}`);
        setFollowedJournalIds(prev => {
          const s = new Set(prev);
          s.delete(journalId);
          return s;
        });
        toast.success("Đã hủy theo dõi tạp chí!");
      } else {
        await api.post("/following/journals", { journal_id: journalId });
        setFollowedJournalIds(prev => new Set(prev).add(journalId));
        toast.success("Theo dõi tạp chí thành công!");
      }
    } catch (err: any) {
      toast.error(err.message || "Lỗi thao tác theo dõi.");
    } finally {
      setFollowingJournalLoadingIds(prev => {
        const s = new Set(prev);
        s.delete(journalId);
        return s;
      });
    }
  };

  // Toggle bookmark paper
  const handleToggleBookmark = async (paperId: number) => {
    if (bookmarkLoadingIds.has(paperId)) return;
    const isBookmarked = bookmarkedIds.has(paperId);
    setBookmarkLoadingIds(prev => new Set(prev).add(paperId));
    try {
      if (isBookmarked) {
        await api.delete(`/bookmarks/paper/${paperId}`);
        setBookmarkedIds(prev => {
          const s = new Set(prev);
          s.delete(paperId);
          return s;
        });
        toast.success("Đã hủy lưu bài báo!");
      } else {
        await api.post("/bookmarks", { paper_id: paperId });
        setBookmarkedIds(prev => new Set(prev).add(paperId));
        toast.success("Lưu bài báo thành công!");
      }
    } catch (err: any) {
      toast.error(err.message || "Lỗi thao tác bookmark.");
    } finally {
      setBookmarkLoadingIds(prev => {
        const s = new Set(prev);
        s.delete(paperId);
        return s;
      });
    }
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
      cluster: idx % 4,
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

  // Filter trends based on startYear and endYear
  const filteredTrends = useMemo(() => {
    if (!selectedDetail?.trends) return [];
    return selectedDetail.trends.filter(t => t.year >= startYear && t.year <= endYear);
  }, [selectedDetail, startYear, endYear]);

  // Filter papers based on startYear and endYear
  const filteredPapers = useMemo(() => {
    if (!selectedDetail?.papers) return [];
    return selectedDetail.papers.filter(p => p.published_year >= startYear && p.published_year <= endYear);
  }, [selectedDetail, startYear, endYear]);

  const activeStats = useMemo(() => {
    if (filteredTrends.length === 0) {
      return { growth: "+0%", total: "0", impact: "0.0" };
    }
    const latest = filteredTrends[filteredTrends.length - 1];
    const growth = latest ? (latest.growth_rate >= 0 ? `+${latest.growth_rate}%` : `${latest.growth_rate}%`) : "+0%";
    const totalPapers = filteredTrends.reduce((sum, t) => sum + (t.paper_count ?? 0), 0);
    const totalCitations = filteredTrends.reduce((sum, t) => sum + (t.citation_count ?? 0), 0);
    const impact = totalPapers > 0 
      ? (Math.round((totalCitations / totalPapers) * 10) / 10).toFixed(1)
      : "0.0";
    return { growth, total: String(totalPapers), impact };
  }, [filteredTrends]);

  const velocityChartData = useMemo(() => {
    const categories = filteredTrends.map(t => String(t.year));
    const series = [{
      name: "Số lượng công bố",
      data: filteredTrends.map(t => t.paper_count)
    }];
    return { categories, series };
  }, [filteredTrends]);

  const getClusterColor = (clusterId: number) => {
    const colors = [
      { stroke: "#10B981", fill: "rgba(16, 185, 129, 0.15)", bg: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
      { stroke: "#8B5CF6", fill: "rgba(139, 92, 246, 0.15)", bg: "bg-violet-500/10 text-violet-400 border-violet-500/20" },
      { stroke: "#06B6D4", fill: "rgba(6, 182, 212, 0.15)", bg: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20" },
      { stroke: "#F59E0B", fill: "rgba(245, 158, 11, 0.15)", bg: "bg-amber-500/10 text-amber-400 border-amber-500/20" }
    ];
    return colors[clusterId % colors.length];
  };

  const researchGapInsight = useMemo(() => {
    if (filteredTrends.length === 0) return null;
    const totalPapers = filteredTrends.reduce((sum, t) => sum + (t.paper_count ?? 0), 0);
    const totalCitations = filteredTrends.reduce((sum, t) => sum + (t.citation_count ?? 0), 0);
    const latest = filteredTrends[filteredTrends.length - 1];
    const growth = latest ? latest.growth_rate : 0;
    const ratio = totalPapers > 0 ? totalCitations / totalPapers : 0;

    let level = "Phát triển ổn định";
    let message = "";
    let color = "text-on-surface";
    let bg = "bg-surface-container/30 border border-white/5";

    if (growth > 15 && ratio > 8 && totalPapers < 25) {
      level = "Khoảng trống Vàng (Đại dương xanh)";
      message = `Chủ đề "${selectedDetail?.keyword?.name}" đang có tốc độ tăng trưởng cao (${growth}%) và chỉ số trích dẫn ấn tượng (trung bình ${ratio.toFixed(1)} trích dẫn/bài), trong khi số lượng công bố trong giai đoạn này còn hạn chế (${totalPapers} bài). Đây là khoảng trống nghiên cứu cực kỳ tiềm năng để triển khai đề tài mới mà ít bị cạnh tranh.`;
      color = "text-emerald-400";
      bg = "bg-emerald-500/10 border border-emerald-500/20";
    } else if (ratio > 12) {
      level = "Tác động cao (Ngách chất lượng)";
      message = `Chủ đề này có chất lượng trích dẫn rất cao (trung bình ${ratio.toFixed(1)} trích dẫn/bài). Các nghiên cứu ở đây tập trung vào chiều sâu và có sức ảnh hưởng học thuật lớn. Gợi ý tập trung vào cải tiến chất lượng hơn là số lượng công bố.`;
      color = "text-cyan-400";
      bg = "bg-cyan-500/10 border border-cyan-500/20";
    } else if (growth > 20) {
      level = "Xu hướng bùng nổ (Hot Trend)";
      message = `Chủ đề đang tăng trưởng rất nhanh ở mức ${growth}%. Số lượng ấn phẩm đang tăng mạnh. Thích hợp cho các nghiên cứu ứng dụng thực tiễn nhanh để bắt kịp làn sóng công nghệ mới.`;
      color = "text-amber-400";
      bg = "bg-amber-500/10 border border-amber-500/20";
    } else {
      level = "Phát triển ổn định";
      message = `Lĩnh vực này đã đi vào giai đoạn ổn định về cả số lượng công bố và lượt trích dẫn. Phù hợp cho các nghiên cứu mang tính hệ thống hóa hoặc tích hợp liên ngành để tạo đột phá mới.`;
      color = "text-on-surface-variant";
      bg = "bg-surface-container/30 border border-white/5";
    }

    return { level, message, color, bg };
  }, [filteredTrends, selectedDetail]);

  const coOccurringKeywords = useMemo(() => {
    if (!selectedDetail?.papers) return [];
    const counts: { [key: string]: { id: number; count: number } } = {};
    selectedDetail.papers.forEach((paper: any) => {
      if (paper.keywords) {
        paper.keywords.forEach((kw: any) => {
          if (kw.id !== selectedKeywordId) {
            if (!counts[kw.name]) {
              counts[kw.name] = { id: kw.id, count: 0 };
            }
            counts[kw.name].count++;
          }
        });
      }
    });
    return Object.entries(counts)
      .map(([name, val]) => ({ name, id: val.id, count: val.count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
  }, [selectedDetail, selectedKeywordId]);

  const journalChartData = useMemo(() => {
    if (!selectedDetail?.journals) return { categories: [], series: [] };
    const categories = selectedDetail.journals.map(j => j.name.split(' ').slice(0, 3).join(' '));
    const series = [
      {
        name: "Chỉ số H-Index",
        data: selectedDetail.journals.map(j => j.h_index)
      },
      {
        name: "Số bài viết chủ đề",
        data: selectedDetail.journals.map(j => j.papers_count)
      }
    ];
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
        <div className="flex flex-wrap items-center gap-3">
          {/* Time Selector Dropdowns */}
          <div className="flex items-center gap-2 bg-white/5 border border-white/10 px-3 py-2 rounded-xl text-xs font-bold uppercase tracking-wider">
            <span className="text-on-surface-variant font-mono">Thời gian:</span>
            <select 
              value={startYear}
              onChange={(e) => setStartYear(Number(e.target.value))}
              className="bg-transparent text-on-surface focus:outline-none cursor-pointer"
            >
              {selectedDetail?.trends.map(t => (
                <option key={`start-${t.year}`} value={t.year} disabled={t.year > endYear} className="bg-surface-container text-on-surface">
                  {t.year}
                </option>
              ))}
            </select>
            <span className="text-outline-variant">—</span>
            <select 
              value={endYear}
              onChange={(e) => setEndYear(Number(e.target.value))}
              className="bg-transparent text-on-surface focus:outline-none cursor-pointer"
            >
              {selectedDetail?.trends.map(t => (
                <option key={`end-${t.year}`} value={t.year} disabled={t.year < startYear} className="bg-surface-container text-on-surface">
                  {t.year}
                </option>
              ))}
            </select>
          </div>

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
              { label: "Tổng số ấn phẩm", value: activeStats.total, desc: "Tầm lọc đã chọn", color: "text-primary" },
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

          {/* AI Research Gap Insight Card */}
          {researchGapInsight && (
            <div className={cn("p-5 rounded-2xl flex items-start gap-4 transition-all shadow-md", researchGapInsight.bg)}>
              <Info className={cn("w-5 h-5 shrink-0 mt-0.5", researchGapInsight.color)} />
              <div className="space-y-1">
                <h4 className={cn("font-display text-sm font-black uppercase tracking-wider", researchGapInsight.color)}>
                  AI Insight: {researchGapInsight.level}
                </h4>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  {researchGapInsight.message}
                </p>
              </div>
            </div>
          )}

          {/* Publication Velocity Chart */}
          <div className="glass-panel p-6 rounded-2xl flex flex-col min-h-[380px]">
            <div className="flex justify-between items-center mb-6">
              <div className="space-y-1">
                <h3 className="font-display text-xl font-bold">Tốc độ xuất bản</h3>
                <p className="text-xs text-on-surface-variant">Khối lượng bài viết công bố qua các năm lọc.</p>
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
                <h3 className="font-display text-xl font-bold">Mạng lưới đồng tác giả (VOSviewer Clusters)</h3>
              </div>
              <p className="text-xs text-on-surface-variant">
                Trực quan hóa nhóm hợp tác của Top 15 tác giả hàng đầu. Nhấp chọn tác giả để xem chi tiết đồng tác giả và các bài báo.
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

            {/* Selected Author Detail Card */}
            {selectedAuthor && (
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
                    <span className="text-[10px] text-on-surface-variant uppercase tracking-widest block mb-0.5">Ấn phẩm chủ đề</span>
                    <span className="text-primary font-bold text-sm">{selectedAuthor.papers_count} bài viết</span>
                  </div>
                  <div className="bg-surface-container/30 p-2.5 rounded border border-white/5">
                    <span className="text-[10px] text-on-surface-variant uppercase tracking-widest block mb-0.5">Chỉ số H-Index</span>
                    <span className="text-tertiary font-bold text-sm">H-{selectedAuthor.h_index}</span>
                  </div>
                </div>
                
                {/* Co-authors of this author list */}
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
              </div>
            )}
          </div>

          {/* Recommended Journals */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-tertiary" />
                <h3 className="font-display text-xl font-bold">Tạp chí khuyên dùng tối ưu</h3>
              </div>
              <button 
                onClick={() => setIsComparing(!isComparing)}
                className="text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 border border-white/10 rounded-lg hover:bg-white/5 transition-all text-on-surface"
              >
                {isComparing ? "Xem dạng thẻ" : "So sánh tạp chí"}
              </button>
            </div>
            
            {isComparing ? (
              <div className="glass-panel p-6 rounded-2xl">
                <h4 className="font-display text-sm font-bold text-on-surface mb-4">So sánh H-Index & Số bài viết tạp chí gợi ý</h4>
                <Chart
                  options={{
                    chart: { id: "journal-comparison-chart", toolbar: { show: false }, background: 'transparent' },
                    plotOptions: { bar: { horizontal: false, columnWidth: '45%', borderRadius: 4 } },
                    dataLabels: { enabled: false },
                    stroke: { show: true, width: 2, colors: ['transparent'] },
                    xaxis: {
                      categories: journalChartData.categories,
                      labels: { style: { colors: '#9CA3AF', fontSize: '9px', fontFamily: 'JetBrains Mono' } }
                    },
                    yaxis: {
                      labels: { style: { colors: '#9CA3AF', fontSize: '9px', fontFamily: 'JetBrains Mono' } }
                    },
                    fill: { opacity: 0.95, colors: ['#8B5CF6', '#3B82F6'] },
                    tooltip: { theme: 'dark' },
                    grid: { borderColor: 'rgba(255,255,255,0.05)', strokeDashArray: 4 }
                  }}
                  series={journalChartData.series}
                  type="bar"
                  height={240}
                />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {selectedDetail?.journals && selectedDetail.journals.length > 0 ? (
                  selectedDetail.journals.map((journal) => {
                    const isFollowing = followedJournalIds.has(journal.id);
                    const isBtnLoading = followingJournalLoadingIds.has(journal.id);
                    return (
                      <div key={journal.id} className="glass-panel p-5 rounded-xl border border-white/5 hover:border-tertiary/40 transition-all flex flex-col justify-between h-44">
                        <div>
                          <div className="flex justify-between items-start mb-2 gap-2">
                            <span className="bg-tertiary/10 text-tertiary text-[9px] font-bold px-2 py-0.5 rounded border border-tertiary/20 uppercase tracking-wider shrink-0">
                              H-Index: {journal.h_index}
                            </span>
                            <button 
                              onClick={() => handleToggleFollowJournal(journal.id)}
                              disabled={isBtnLoading}
                              className={cn(
                                "px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider transition-all border shrink-0",
                                isFollowing 
                                  ? "bg-success/15 border-success/30 text-success" 
                                  : "bg-primary/10 border-primary/20 text-primary hover:bg-primary/20"
                              )}
                            >
                              {isBtnLoading ? "..." : isFollowing ? "Đang theo dõi" : "Theo dõi"}
                            </button>
                          </div>
                          <h4 className="font-display font-bold text-on-surface text-sm line-clamp-2 leading-tight">
                            {journal.name}
                          </h4>
                        </div>
                        <div className="flex justify-between items-center text-[10px] text-on-surface-variant font-mono uppercase tracking-widest mt-2">
                          <span className="truncate max-w-[100px]">{journal.field}</span>
                          <span className="text-primary font-bold">{journal.papers_count} Bài viết</span>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-xs text-on-surface-variant col-span-3 text-center py-6 font-mono">Chưa có tạp chí gợi ý cho từ khóa này.</p>
                )}
              </div>
            )}
          </div>

          {/* Representative Publications */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-primary" />
              <h3 className="font-display text-xl font-bold">Ấn phẩm tiêu biểu nổi bật ({filteredPapers.length})</h3>
            </div>
            <div className="space-y-4">
              {filteredPapers.length > 0 ? (
                filteredPapers.map((paper: any) => (
                  <article key={paper.id} className="glass-panel p-6 rounded-xl border border-white/5 hover:bg-white/[0.01] transition-all flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex-1 min-w-0 pr-4">
                      <h4 
                        onClick={() => setSelectedPaper(paper)}
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
                      onClick={() => setSelectedPaper(paper)}
                      className="px-3.5 py-1.5 border border-primary/25 bg-primary/5 rounded-lg text-[10px] font-bold uppercase tracking-widest text-primary hover:bg-primary/20 hover:border-primary/50 hover:scale-[1.03] active:scale-[0.97] transition-all shrink-0 self-start md:self-center"
                    >
                      Xem chi tiết
                    </button>
                  </article>
                ))
              ) : (
                <p className="text-xs text-on-surface-variant text-center py-6 font-mono">Chưa có bài báo tiêu biểu nào trong khoảng thời gian đã lọc.</p>
              )}
            </div>
          </div>
        </div>

        {/* Right Column (Emerging Entities selection sidebar) */}
        <div className="lg:col-span-4 space-y-6">
          <div className="glass-panel p-6 rounded-2xl flex flex-col min-h-[500px]">
            <div className="space-y-1 mb-6">
              <h3 className="font-display text-xl font-bold">Tìm kiếm & Xu hướng</h3>
              <p className="text-xs text-on-surface-variant">Chọn từ danh mục mới nổi hoặc tìm kiếm từ khóa học thuật tùy chỉnh.</p>
            </div>
            
            {/* Custom Keyword Search */}
            <div className="relative mb-6">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-outline" />
              <input 
                type="text"
                value={keywordSearchQuery}
                onChange={(e) => handleKeywordSearch(e.target.value)}
                placeholder="Tìm kiếm chủ đề khác..."
                className="w-full bg-surface-container/60 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-xs text-on-surface focus:outline-none focus:border-primary/50 transition-all placeholder:text-outline-variant"
              />
              {keywordSearchResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-surface-container border border-white/10 rounded-xl max-h-48 overflow-y-auto z-30 shadow-2xl">
                  {keywordSearchResults.map(kw => (
                    <div 
                      key={`search-kw-${kw.id}`}
                      onClick={() => {
                        handleSelectKeyword(kw.id);
                        setKeywordSearchQuery("");
                        setKeywordSearchResults([]);
                      }}
                      className="px-4 py-2 hover:bg-white/5 cursor-pointer text-xs font-bold truncate text-on-surface"
                    >
                      #{kw.name} <span className="text-[10px] text-on-surface-variant font-normal">({kw.papers_count} bài)</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Topic list */}
            <div className="flex-1 flex flex-col gap-4">
              <span className="text-[9px] font-bold text-on-surface-variant uppercase tracking-widest mb-1 block">Thực thể mới nổi hot nhất</span>
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
                      {item.growth_rate >= 0 ? `+${item.growth_rate}` : item.growth_rate}%
                    </span>
                  </div>
                );
              })}
              {trendingList.length === 0 && (
                <p className="text-xs text-on-surface-variant text-center py-8 font-mono">Chưa có dữ liệu xu hướng.</p>
              )}
            </div>
          </div>

          {/* Sub-topics (Keyword co-occurrence) */}
          {coOccurringKeywords.length > 0 && (
            <div className="glass-panel p-6 rounded-2xl space-y-4">
              <div className="space-y-1">
                <h3 className="font-display text-sm font-bold flex items-center gap-2 text-on-surface">
                  <Tag className="w-4 h-4 text-secondary" /> Chủ đề con đồng xuất hiện
                </h3>
                <p className="text-[10px] text-on-surface-variant">Các từ khóa thường đi kèm trong các công bố xuất sắc.</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {coOccurringKeywords.map(kw => (
                  <button 
                    key={`co-${kw.id}`}
                    onClick={() => handleSelectKeyword(kw.id)}
                    className="px-2.5 py-1.5 rounded-xl bg-secondary-container/20 text-secondary border border-secondary/30 hover:border-secondary hover:bg-secondary-container/30 transition-all text-xs flex items-center gap-1.5 font-bold"
                  >
                    #{kw.name} <span className="opacity-60 text-[9px]">({kw.count})</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Quick View Paper Abstract Modal with Citation Block */}
      {selectedPaper && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="glass-panel w-full max-w-3xl rounded-2xl border border-white/10 p-8 shadow-2xl relative max-h-[85vh] overflow-y-auto">
            <button 
              onClick={() => setSelectedPaper(null)}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/5 text-on-surface-variant hover:text-on-surface transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            
            <div className="space-y-6">
              <div>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary mb-3">
                  {(selectedPaper.journal?.name || selectedPaper.source || "").toUpperCase()}
                </span>
                <h2 className="font-display text-2xl sm:text-3xl font-bold leading-tight text-on-surface">{cleanTitle(selectedPaper.title)}</h2>
              </div>
              
              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-on-surface-variant border-y border-white/5 py-4 font-mono">
                <div>
                  <span className="font-bold text-on-surface">Tác giả:</span> {selectedPaper.authors?.map((a: any) => a.name).join(", ") || "N/A"}
                </div>
                <div>
                  <span className="font-bold text-on-surface">Tạp chí:</span> {selectedPaper.journal?.name || selectedPaper.source || "N/A"}
                </div>
                <div>
                  <span className="font-bold text-on-surface">Năm:</span> {selectedPaper.published_year}
                </div>
                <div>
                  <span className="font-bold text-on-surface">Trích dẫn:</span> {selectedPaper.citations_count}
                </div>
              </div>
              
              <div className="space-y-3">
                <h4 className="text-sm font-bold uppercase tracking-widest text-primary">Tóm tắt (Abstract)</h4>
                <p className="text-on-surface-variant text-sm leading-relaxed whitespace-pre-line">
                  {selectedPaper.abstract || "Không có tóm tắt cho bài báo này."}
                </p>
              </div>

              {selectedPaper.keywords && selectedPaper.keywords.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-bold uppercase tracking-widest text-secondary">Từ khóa</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedPaper.keywords.map((kw: any) => (
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
                        {cleanTitle(selectedPaper.authors?.map((a: any) => a.name).join(", "))} ({selectedPaper.published_year}). {cleanTitle(selectedPaper.title)}. {selectedPaper.journal?.name || selectedPaper.source}. {selectedPaper.doi ? `DOI: https://doi.org/${selectedPaper.doi}` : ""}
                      </p>
                      <button 
                        onClick={() => {
                          const apa = `${selectedPaper.authors?.map((a: any) => a.name).join(", ")} (${selectedPaper.published_year}). ${cleanTitle(selectedPaper.title)}. ${selectedPaper.journal?.name || selectedPaper.source}.${selectedPaper.doi ? ` DOI: https://doi.org/${selectedPaper.doi}` : ""}`;
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
{`@article{paper_${selectedPaper.id},
  title = {${cleanTitle(selectedPaper.title)}},
  author = {${selectedPaper.authors?.map((a: any) => a.name).join(" and ")}},
  journal = {${selectedPaper.journal?.name || selectedPaper.source}},
  year = {${selectedPaper.published_year}}${selectedPaper.doi ? `,\n  doi = {${selectedPaper.doi}}` : ""}
}`}
                      </pre>
                      <button 
                        onClick={() => {
                          const bib = `@article{paper_${selectedPaper.id},\n  title = {${cleanTitle(selectedPaper.title)}},\n  author = {${selectedPaper.authors?.map((a: any) => a.name).join(" and ")}},\n  journal = {${selectedPaper.journal?.name || selectedPaper.source}},\n  year = {${selectedPaper.published_year}}${selectedPaper.doi ? `,\n  doi = {${selectedPaper.doi}}` : ""}\n}`;
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
                  onClick={() => setSelectedPaper(null)}
                  className="px-5 py-2.5 rounded-xl border border-white/10 text-xs font-bold uppercase tracking-widest hover:bg-white/5 transition-all text-on-surface"
                >
                  Đóng
                </button>
                <button
                  disabled={bookmarkLoadingIds.has(selectedPaper.id)}
                  onClick={() => handleToggleBookmark(selectedPaper.id)}
                  className={cn(
                    "px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all",
                    bookmarkedIds.has(selectedPaper.id)
                      ? "bg-tertiary/20 text-tertiary border border-tertiary/30 hover:bg-tertiary/30"
                      : "bg-secondary/10 border border-secondary/20 text-secondary hover:bg-secondary/20"
                  )}
                >
                  {bookmarkLoadingIds.has(selectedPaper.id) ? (
                    <span className="flex items-center gap-1"><Loader2 className="w-3.5 h-3.5 animate-spin" /> Đang xử lý...</span>
                  ) : bookmarkedIds.has(selectedPaper.id) ? (
                    "Hủy lưu bài báo"
                  ) : (
                    "Lưu bài báo"
                  )}
                </button>
                {selectedPaper.doi && (
                  <a 
                    href={`https://doi.org/${selectedPaper.doi}`} 
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
      )}
    </div>
  );
}
