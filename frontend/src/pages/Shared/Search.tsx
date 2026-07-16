import React, { useState, useEffect, useRef, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { api } from "@/src/lib/api";
import toast from "react-hot-toast";
import { useApiQuery, queryCache } from "../../hooks/useApiQuery";
import { SearchHeader } from "./components/Search/SearchHeader";
import { SearchFilters } from "./components/Search/SearchFilters";
import { SearchResultsList } from "./components/Search/SearchResultsList";
import { SearchPaperDetailModal } from "./components/Search/SearchPaperDetailModal";
import { PaperDetailsSidebar } from "./components/Search/PaperDetailsSidebar";
import { PriorDerivativeWorksTable } from "./components/Search/PriorDerivativeWorksTable";
import { SemanticGraphView } from "./components/Search/SemanticGraphView";
import { Bot, Sparkles, GitBranch, Loader2, Scale, X } from "lucide-react";
import { motion } from "framer-motion";

const MarkdownCompareRenderer = ({ content }: { content: string }) => {
  const lines = content.split("\n");
  const elements: React.ReactNode[] = [];
  
  let inTable = false;
  let tableHeaders: string[] = [];
  let tableRows: string[][] = [];

  const parseTableRow = (line: string): string[] => {
    return line
      .split("|")
      .map(cell => cell.trim())
      .filter((_, idx, arr) => idx > 0 && idx < arr.length - 1);
  };

  const flushTable = (key: number) => {
    if (tableRows.length === 0) return null;
    
    const renderedTable = (
      <div key={`table-${key}`} className="overflow-x-auto my-6 border border-outline-variant/35 rounded-2xl bg-surface-container/30">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-outline-variant/35 bg-surface-container-high/50">
              {tableHeaders.map((h, i) => (
                <th key={i} className="p-3.5 font-black text-primary uppercase tracking-wide">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tableRows.map((row, rowIndex) => (
              <tr key={rowIndex} className="border-b border-outline-variant/20 last:border-none hover:bg-white/5 transition-all">
                {row.map((cell, cellIndex) => {
                  let isPro = cell.toLowerCase().includes("pros:") || cell.toLowerCase().includes("ưu điểm") || cell.toLowerCase().includes("vượt trội");
                  let isCon = cell.toLowerCase().includes("cons:") || cell.toLowerCase().includes("hạn chế") || cell.toLowerCase().includes("yếu");
                  
                  return (
                    <td key={cellIndex} className="p-3.5 leading-relaxed align-top text-on-surface font-medium">
                      {isPro ? (
                        <span className="inline-block px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 font-bold border border-emerald-500/20 text-[10.5px] mr-1">
                          {cell}
                        </span>
                      ) : isCon ? (
                        <span className="inline-block px-2.5 py-0.5 rounded-full bg-error/15 text-error font-bold border border-error/20 text-[10.5px] mr-1">
                          {cell}
                        </span>
                      ) : (
                        cell
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
    tableHeaders = [];
    tableRows = [];
    inTable = false;
    return renderedTable;
  };

  for (let idx = 0; idx < lines.length; idx++) {
    const line = lines[idx];
    
    if (line.trim().startsWith("|")) {
      if (line.includes("---")) {
        continue;
      }
      
      const parsed = parseTableRow(line);
      if (!inTable) {
        inTable = true;
        tableHeaders = parsed;
      } else {
        tableRows.push(parsed);
      }
    } else {
      if (inTable) {
        const table = flushTable(idx);
        if (table) elements.push(table);
      }
      
      const trimmed = line.trim();
      if (trimmed.startsWith("###")) {
        elements.push(
          <h4 key={idx} className="text-sm font-black text-primary mt-6 mb-2 uppercase tracking-wider">
            {trimmed.replace(/^###\s*/, "")}
          </h4>
        );
      } else if (trimmed.startsWith("##")) {
        elements.push(
          <h3 key={idx} className="text-base font-black text-secondary mt-8 mb-3 uppercase tracking-widest border-b border-outline-variant/35 pb-2">
            {trimmed.replace(/^##\s*/, "")}
          </h3>
        );
      } else if (trimmed.startsWith("#")) {
        elements.push(
          <h2 key={idx} className="text-lg font-black text-primary mt-8 mb-4 uppercase tracking-widest">
            {trimmed.replace(/^#\s*/, "")}
          </h2>
        );
      } else if (trimmed.startsWith("-") || trimmed.startsWith("*")) {
        elements.push(
          <li key={idx} className="text-xs text-on-surface-variant leading-relaxed ml-4 my-1.5 font-medium list-disc">
            {trimmed.replace(/^[-*]\s*/, "")}
          </li>
        );
      } else if (trimmed) {
        elements.push(
          <p key={idx} className="text-xs text-on-surface-variant leading-relaxed my-2.5 font-medium text-justify">
            {trimmed}
          </p>
        );
      }
    }
  }

  if (inTable) {
    const table = flushTable(lines.length);
    if (table) elements.push(table);
  }

  return <div className="space-y-1">{elements}</div>;
};

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

interface SearchResponse {
  data: Paper[];
  total: number;
  last_page: number;
}

interface NodeMetadata {
  id: number;
  title: string;
  publishedYear: number;
  citationsCount: number;
  doi: string | null;
  abstract: string;
  authors: string[];
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

export default function Search() {
  const [searchParams, setSearchParams] = useSearchParams();
  const q = searchParams.get("q") || "";
  const yearParam = searchParams.get("year");
  const authorParam = searchParams.get("author") || "";
  const journalParam = searchParams.get("journal") || "";
  const keywordParam = searchParams.get("keyword") || "";
  const sortParam = searchParams.get("sort") || "relevance";
  const pageParam = parseInt(searchParams.get("page") || "1", 10);
  
  // Fetch user role to restrict AI similarity matching feature to researchers & admin only
  const userStr = localStorage.getItem("user");
  const user = userStr ? JSON.parse(userStr) : null;
  const role = user?.role || "student";
  const isResearcher = role === "researcher" || role === "admin";

  // URL Mode & View states (forced to standard mode if not a researcher)
  const searchModeParam = (searchParams.get("mode") as "keyword" | "semantic") || "keyword";
  const viewModeParam = (searchParams.get("view") as "list" | "tree") || "list";
  const searchMode = isResearcher ? searchModeParam : "keyword";
  const viewMode = isResearcher ? viewModeParam : "list";

  const [year, setYear] = useState<string>(yearParam || "");
  const [author, setAuthor] = useState<string>(authorParam);
  const [journal, setJournal] = useState<string>(journalParam);
  const [keyword, setKeyword] = useState<string>(keywordParam);
  const [sort, setSort] = useState<string>(sortParam);
  const [history, setHistory] = useState<string[]>([]);
  const [searchInput, setSearchInput] = useState(q);
  const [selectedPaper, setSelectedPaper] = useState<Paper | null>(null);
  const [activeSubView, setActiveSubView] = useState<"graph" | "prior" | "derivative">("graph");
  
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<number>>(new Set());
  const [bookmarkLoadingIds, setBookmarkLoadingIds] = useState<Set<number>>(new Set());
  const [followedKeywordIds, setFollowedKeywordIds] = useState<Set<number>>(new Set());
  const [followingKeywordIds, setFollowingKeywordIds] = useState<Set<number>>(new Set());

  // Semantic search dynamic states
  const [semanticNodes, setSemanticNodes] = useState<GraphNode[]>([]);
  const [semanticLinks, setSemanticLinks] = useState<GraphLink[]>([]);
  const [semanticLoading, setSemanticLoading] = useState(false);

  // Canvas pan & zoom states
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [isPanning, setIsPanning] = useState(false);
  const [startPan, setStartPan] = useState({ x: 0, y: 0 });
  const [draggedNode, setDraggedNode] = useState<string | null>(null);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);

  // Graph filters
  const [minYearFilter, setMinYearFilter] = useState<number>(2000);
  const [minCitationsFilter, setMinCitationsFilter] = useState<number>(0);

  // Custom graph visual modes
  const [colorMode, setColorMode] = useState<"year" | "topic" | "monochrome">("year");
  const [sizeMode, setSizeMode] = useState<"citations" | "uniform">("citations");
  const [layoutMode, setLayoutMode] = useState<"force" | "timeline">("force");
  const [draftLoading, setDraftLoading] = useState(false);
  const [comparisonPapers, setComparisonPapers] = useState<Paper[]>([]);
  const [isComparing, setIsComparing] = useState(false);
  const [comparisonMarkdown, setComparisonMarkdown] = useState<string | null>(null);
  const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);

  const filteredNodes = useMemo(() => {
    return semanticNodes.filter(node => {
      if (node.type === "paper" && node.metadata) {
        const yearVal = node.metadata.publishedYear || 0;
        const citVal = node.metadata.citationsCount || 0;
        if (yearVal < minYearFilter) return false;
        if (citVal < minCitationsFilter) return false;
      }
      return true;
    });
  }, [semanticNodes, minYearFilter, minCitationsFilter]);

  const filteredLinks = useMemo(() => {
    const visibleNodeIds = new Set(filteredNodes.map(n => n.id));
    return semanticLinks.filter(link => {
      const srcId = typeof link.source === "object" ? (link.source as any).id : link.source;
      const tgtId = typeof link.target === "object" ? (link.target as any).id : link.target;
      return visibleNodeIds.has(srcId) && visibleNodeIds.has(tgtId);
    });
  }, [semanticLinks, filteredNodes]);

  // Map explore NodeMetadata back to standard Paper format for Result Card renderer
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

  // Convert all papers from semantic nodes to use inside standard card list
  const semanticPapers = useMemo(() => {
    return semanticNodes
      .filter(n => {
        if (n.type !== "paper" || !n.metadata) return false;
        const yearVal = n.metadata.publishedYear || 0;
        const citVal = n.metadata.citationsCount || 0;
        return yearVal >= minYearFilter && citVal >= minCitationsFilter;
      })
      .map(n => mapNodeMetadataToPaper(n.metadata!));
  }, [semanticNodes, minYearFilter, minCitationsFilter]);

  const [simTrigger, setSimTrigger] = useState(0);

  const defaultPaper = useMemo(() => {
    const firstPaperNode = filteredNodes.find(n => n.type === "paper" && n.metadata);
    return firstPaperNode ? mapNodeMetadataToPaper(firstPaperNode.metadata!) : null;
  }, [filteredNodes]);

  const priorPapers = useMemo(() => {
    return semanticPapers
      .filter(p => p.published_year <= 2020)
      .sort((a, b) => b.citations_count - a.citations_count);
  }, [semanticPapers]);

  const derivativePapers = useMemo(() => {
    return semanticPapers
      .filter(p => p.published_year >= 2023)
      .sort((a, b) => b.citations_count - a.citations_count);
  }, [semanticPapers]);

  // Execute semantic vector similarity search
  const executeSemanticSearch = async (queryStr: string) => {
    if (!queryStr.trim()) return;
    setSemanticLoading(true);
    try {
      const response = await api.post<{
        success: boolean;
        data: {
          nodes: any[];
          links: any[];
        };
      }>("/explore", { query: queryStr });

      if (response.success && response.data) {
        const width = 800;
        const height = 720;
        const formattedNodes = response.data.nodes.map((node: any, idx: number) => {
          const angle = (idx * 2 * Math.PI) / (response.data.nodes.length || 1);
          const radius = node.type === "root" ? 0 : (node.type === "topic" ? 110 : 210);
          return {
            ...node,
            x: width / 2 + Math.cos(angle) * radius,
            y: height / 2 + Math.sin(angle) * radius,
            vx: 0,
            vy: 0
          };
        });

        setSemanticNodes(formattedNodes);
        setSemanticLinks(response.data.links);
        setPan({ x: 0, y: 0 });
        setZoom(1);
        setActiveSubView("graph");
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Không thể thực hiện tìm kiếm tương đồng.");
    } finally {
      setSemanticLoading(false);
    }
  };

  // Expand tree nodes on-demand
  const handleExpandNode = async (node: GraphNode) => {
    if (node.type === "root") return;
    setSemanticLoading(true);
    try {
      const response = await api.post<{
        success: boolean;
        data: {
          nodes: any[];
          links: any[];
        };
      }>("/explore", { query: node.label });

      if (response.success && response.data) {
        setSemanticNodes(prevNodes => {
          const merged = [...prevNodes];
          response.data.nodes.forEach((n: any) => {
            const exists = merged.some(mn => mn.id === n.id);
            if (!exists) {
              const offsetAngle = Math.random() * 2 * Math.PI;
              const offsetRadius = n.type === "topic" ? 90 : 150;
              merged.push({
                ...n,
                x: node.x + Math.cos(offsetAngle) * offsetRadius,
                y: node.y + Math.sin(offsetAngle) * offsetRadius,
                vx: 0,
                vy: 0
              });
            }
          });
          return merged;
        });

        setSemanticLinks(prevLinks => {
          const merged = [...prevLinks];
          response.data.links.forEach((l: any) => {
            const src = l.source === "root" ? node.id : l.source;
            const linkExists = merged.some(ml => ml.source === src && ml.target === l.target);
            if (!linkExists) {
              merged.push({ source: src, target: l.target });
            }
          });
          return merged;
        });

        toast.success(`Đã mở rộng thêm các nhánh từ "${node.label}"`);
      }
    } catch (err: any) {
      console.error(err);
      toast.error("Không thể mở rộng chủ đề.");
    } finally {
      setSemanticLoading(false);
    }
  };

  const handleExploreFromSeed = async (paperId: number) => {
    setSemanticLoading(true);
    try {
      const response = await api.post<{
        success: boolean;
        data: {
          nodes: any[];
          links: any[];
        };
      }>("/explore", { paper_id: paperId });

      if (response.success && response.data) {
        const width = 800;
        const height = 720;
        const formattedNodes = response.data.nodes.map((node: any, idx: number) => {
          const angle = (idx * 2 * Math.PI) / (response.data.nodes.length || 1);
          const radius = node.type === "root" ? 0 : (node.type === "topic" ? 110 : 210);
          return {
            ...node,
            x: width / 2 + Math.cos(angle) * radius,
            y: height / 2 + Math.sin(angle) * radius,
            vx: 0,
            vy: 0
          };
        });

        setSemanticNodes(formattedNodes);
        setSemanticLinks(response.data.links);
        setPan({ x: 0, y: 0 });
        setZoom(1);
        setActiveSubView("graph");
        
        // Find seed paper metadata to select it
        const seedNode = response.data.nodes.find((n: any) => n.id === `paper_${paperId}`);
        if (seedNode && seedNode.metadata) {
          setSelectedPaper(mapNodeMetadataToPaper(seedNode.metadata));
        }
        
        toast.success("Đã vẽ sơ đồ tương đồng lấy bài báo làm gốc!");
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Không thể vẽ bản đồ từ bài báo này.");
    } finally {
      setSemanticLoading(false);
    }
  };



  // Dynamically build search URL
  let searchUrl = `/papers/search?page=${pageParam}`;
  if (q) searchUrl += `&q=${encodeURIComponent(q)}`;
  if (yearParam) searchUrl += `&year=${yearParam}`;
  if (authorParam) searchUrl += `&author=${encodeURIComponent(authorParam)}`;
  if (journalParam) searchUrl += `&journal=${encodeURIComponent(journalParam)}`;
  if (keywordParam) searchUrl += `&keyword=${encodeURIComponent(keywordParam)}`;
  if (sortParam) searchUrl += `&sort=${sortParam}`;

  const { data, loading: isLoading } = useApiQuery<SearchResponse>(searchUrl);

  const { data: keywordsData } = useApiQuery<{ data: any[] }>("/keywords?per_page=50");
  const topKeywords = keywordsData?.data || [];

  const { data: followingStatusData, setData: setFollowingStatusData } = useApiQuery<{ keywords: { id: number }[] }>('/following/status', { persist: true });
  
  useEffect(() => {
    if (followingStatusData?.keywords) {
      setFollowedKeywordIds(new Set(followingStatusData.keywords.map((k: any) => k.id)));
    }
  }, [followingStatusData]);

  const { data: bookmarksData, setData: setBookmarksData } = useApiQuery<any>("/dashboard/bookmarks", { persist: true });
  
  useEffect(() => {
    if (bookmarksData?.bookmarked_paper_ids) {
      setBookmarkedIds(new Set(bookmarksData.bookmarked_paper_ids));
    }
  }, [bookmarksData]);

  // Sync state with URL params
  useEffect(() => {
    setYear(yearParam || "");
    setAuthor(authorParam);
    setJournal(journalParam);
    setKeyword(keywordParam);
    setSort(sortParam);
  }, [yearParam, authorParam, journalParam, keywordParam, sortParam]);

  // Load history from local storage
  useEffect(() => {
    const saved = localStorage.getItem("search_history");
    if (saved) setHistory(JSON.parse(saved));
  }, []);

  // Save history, update searchInput & Trigger semantic search if needed
  useEffect(() => {
    if (q) {
      const saved = localStorage.getItem("search_history");
      let h = saved ? JSON.parse(saved) : [];
      h = [q, ...h.filter((item: string) => item !== q)].slice(0, 10);
      setHistory(h);
      localStorage.setItem("search_history", JSON.stringify(h));
    }
    setSearchInput(q);

    if (searchMode === "semantic" && q) {
      executeSemanticSearch(q);
    }
  }, [q, searchMode]);

  const toggleFollowKeyword = async (keywordId: number, keywordName: string) => {
    if (followingKeywordIds.has(keywordId)) return;
    setFollowingKeywordIds(prev => new Set(prev).add(keywordId));
    const isFollowed = followedKeywordIds.has(keywordId);
    try {
      if (isFollowed) {
        await api.delete(`/following/keywords/${keywordId}`);
        const newIds = new Set(followedKeywordIds);
        newIds.delete(keywordId);
        setFollowedKeywordIds(newIds);
        
        const updatedData = { keywords: Array.from(newIds).map((id: number) => ({ id })) };
        setFollowingStatusData(updatedData);
        queryCache.set("/following/status", updatedData);

        toast.success(`Đã hủy lưu từ khóa "${keywordName}"`);
      } else {
        await api.post(`/following/keywords`, { keyword_id: keywordId });
        const newIds = new Set(followedKeywordIds).add(keywordId);
        setFollowedKeywordIds(newIds);

        const updatedData = { keywords: Array.from(newIds).map((id: number) => ({ id })) };
        setFollowingStatusData(updatedData);
        queryCache.set("/following/status", updatedData);

        toast.success(`Đã lưu từ khóa "${keywordName}"!`);
      }
    } catch { 
      toast.error('Không thể thực hiện thao tác này.'); 
    } finally { 
      setFollowingKeywordIds(prev => { 
        const s = new Set(prev); 
        s.delete(keywordId); 
        return s; 
      }); 
    }
  };

  const handleBookmark = async (paperId: number) => {
    if (bookmarkLoadingIds.has(paperId)) return;
    const isBookmarked = bookmarkedIds.has(paperId);
    setBookmarkLoadingIds(prev => new Set(prev).add(paperId));
    try {
      if (isBookmarked) {
        await api.delete(`/bookmarks/paper/${paperId}`);
        const newIds = new Set(bookmarkedIds);
        newIds.delete(paperId);
        setBookmarkedIds(newIds);
        
        const updatedData = { bookmarked_paper_ids: Array.from(newIds) };
        setBookmarksData(updatedData);
        queryCache.set("/dashboard/bookmarks", updatedData);

        toast.success("Đã hủy lưu bài báo!");
      } else {
        await api.post("/bookmarks", { paper_id: paperId });
        const newIds = new Set(bookmarkedIds).add(paperId);
        setBookmarkedIds(newIds);

        const updatedData = { bookmarked_paper_ids: Array.from(newIds) };
        setBookmarksData(updatedData);
        queryCache.set("/dashboard/bookmarks", updatedData);

        toast.success("Lưu bài báo thành công!");
      }
    } catch (err: any) {
      toast.error(err.message || "Thao tác thất bại. Vui lòng thử lại.");
    } finally {
      setBookmarkLoadingIds(prev => {
        const s = new Set(prev);
        s.delete(paperId);
        return s;
      });
    }
  };

  const fetchGlobalSuggestions = async (query: string) => {
    try {
      const [kwRes, auRes, joRes] = await Promise.all([
        api.get<{ data: any[] }>(`/keywords?q=${encodeURIComponent(query)}&per_page=3`).then(r => r.data || []),
        api.get<any[]>(`/following/search?type=author&q=${encodeURIComponent(query)}`).then(r => r.slice(0, 3)),
        api.get<any[]>(`/following/search?type=journal&q=${encodeURIComponent(query)}`).then(r => r.slice(0, 3))
      ]);
      const results: any[] = [];
      kwRes.forEach((k: any) => results.push({ ...k, _type: 'keyword' }));
      auRes.forEach((a: any) => results.push({ ...a, _type: 'author' }));
      joRes.forEach((j: any) => results.push({ ...j, _type: 'journal' }));
      return results;
    } catch {
      return [];
    }
  };

  const fetchAuthorSuggestions = async (query: string) => {
    try {
      return await api.get<any[]>(`/following/search?type=author&q=${encodeURIComponent(query)}`);
    } catch { return []; }
  };

  const fetchJournalSuggestions = async (query: string) => {
    try {
      return await api.get<any[]>(`/following/search?type=journal&q=${encodeURIComponent(query)}`);
    } catch { return []; }
  };

  const handleSelectSuggestion = (item: any) => {
    if (item._type === 'keyword') {
      let currentKws = keyword.split(',').map(k => k.trim()).filter(Boolean);
      if (!currentKws.includes(item.name)) currentKws.push(item.name);
      const newKeyword = currentKws.join(',');
      setKeyword(newKeyword);
      setSearchParams({ q: searchInput, mode: searchMode, view: viewMode, year, author, journal, keyword: newKeyword, sort, page: "1" });
    } else if (item._type === 'author') {
      setAuthor(item.name);
      setSearchParams({ q: searchInput, mode: searchMode, view: viewMode, year, author: item.name, journal, keyword, sort, page: "1" });
    } else if (item._type === 'journal') {
      setJournal(item.name);
      setSearchParams({ q: searchInput, mode: searchMode, view: viewMode, year, author, journal: item.name, keyword, sort, page: "1" });
    }
    setSearchInput("");
  };

  const handleKeywordToggle = (keywordName: string) => {
    let currentKws = keyword.split(',').map(k => k.trim()).filter(Boolean);
    if (currentKws.includes(keywordName)) {
      currentKws = currentKws.filter(k => k !== keywordName);
    } else {
      currentKws.push(keywordName);
    }
    const newKeyword = currentKws.join(',');
    setKeyword(newKeyword);
    setSearchParams({ q, mode: searchMode, view: viewMode, year, author, journal, keyword: newKeyword, sort, page: "1" });
  };

  const handleApplyFilter = () => {
    setSearchParams({ q, mode: searchMode, view: viewMode, year, author, journal, keyword, sort, page: "1" });
  };

  const handleResetFilters = () => {
    setYear("");
    setAuthor("");
    setJournal("");
    setKeyword("");
    setSort("relevance");
    setSearchParams({ q, mode: searchMode, view: viewMode, page: "1" });
  };

  const handleSortChange = (newSort: string) => {
    setSort(newSort);
    setSearchParams({ q, mode: searchMode, view: viewMode, year, author, journal, keyword, sort: newSort, page: "1" });
  };

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > (data?.last_page || 1)) return;
    setSearchParams({ q, mode: searchMode, view: viewMode, year, author, journal, keyword, sort, page: newPage.toString() });
  };

  const handleSearchSubmit = () => {
    setSearchParams({ q: searchInput, mode: searchMode, view: viewMode, year, author, journal, keyword, sort, page: "1" });
  };

  const handleSearchModeChange = (mode: "keyword" | "semantic") => {
    setSearchParams({ q: searchInput, mode, view: viewMode, year, author, journal, keyword, sort, page: "1" });
  };

  const handleViewModeChange = (view: "list" | "tree") => {
    setSearchParams({ q: searchInput, mode: searchMode, view, year, author, journal, keyword, sort, page: "1" });
  };

  const loadPdfJs = (): Promise<any> => {
    return new Promise((resolve, reject) => {
      if ((window as any).pdfjsLib) {
        resolve((window as any).pdfjsLib);
        return;
      }
      const script = document.createElement("script");
      script.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.min.js";
      script.onload = () => {
        const pdfjsLib = (window as any).pdfjsLib;
        pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js";
        resolve(pdfjsLib);
      };
      script.onerror = () => reject(new Error("Không thể tải thư viện PDF.js từ CDN"));
      document.head.appendChild(script);
    });
  };

  const extractTextFromPdf = async (file: File): Promise<string> => {
    const pdfjsLib = await loadPdfJs();
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    
    let text = "";
    const numPages = Math.min(pdf.numPages, 10);
    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map((item: any) => item.str).join(" ");
      text += pageText + "\n\n";
    }
    return text;
  };

  const extractTextFromTxt = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string || "");
      reader.onerror = () => reject(new Error("Không thể đọc file TXT"));
      reader.readAsText(file);
    });
  };

  const handleDraftFileSelect = async (file: File) => {
    setDraftLoading(true);
    const toastId = toast.loading(`Đang đọc file ${file.name}...`);
    try {
      let text = "";
      if (file.type === "text/plain") {
        text = await extractTextFromTxt(file);
      } else if (file.type === "application/pdf") {
        text = await extractTextFromPdf(file);
      }

      if (!text.trim()) {
        throw new Error("Không thể trích xuất văn bản từ tài liệu này.");
      }

      const truncatedText = text.slice(0, 20000);
      toast.loading("Đang phân tích và đối chiếu tài liệu nháp...", { id: toastId });
      
      const response = await api.post<{
        success: boolean;
        data: {
          nodes: any[];
          links: any[];
        };
      }>("/explore", { query: truncatedText });

      if (response.success && response.data) {
        const width = 800;
        const height = 720;
        const formattedNodes = response.data.nodes.map((node: any, idx: number) => {
          const angle = (idx * 2 * Math.PI) / (response.data.nodes.length || 1);
          const radius = node.type === "root" ? 0 : (node.type === "topic" ? 110 : 210);
          return {
            ...node,
            x: width / 2 + Math.cos(angle) * radius,
            y: height / 2 + Math.sin(angle) * radius,
            vx: 0,
            vy: 0
          };
        });

        setSemanticNodes(formattedNodes);
        setSemanticLinks(response.data.links);
        setPan({ x: 0, y: 0 });
        setZoom(1);
        
        setSearchInput(`[Draft] ${file.name}`);
        setSearchParams({ q: `[Draft] ${file.name}`, mode: "semantic", view: viewMode, page: "1" });
        
        toast.success("Đối chiếu tài liệu nháp thành công!", { id: toastId });
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Lỗi khi xử lý file nháp.", { id: toastId });
    } finally {
      setDraftLoading(false);
    }
  };

  const handleToggleComparison = (paper: Paper) => {
    const exists = comparisonPapers.some(p => p.id === paper.id);
    if (exists) {
      setComparisonPapers(prev => prev.filter(p => p.id !== paper.id));
      toast.success(`Đã xóa "${paper.title.slice(0, 30)}..." khỏi danh sách so sánh.`);
    } else {
      if (comparisonPapers.length >= 3) {
        toast.error("Bạn chỉ có thể so sánh tối đa 3 bài báo cùng lúc.");
        return;
      }
      setComparisonPapers(prev => [...prev, paper]);
      toast.success(`Đã thêm "${paper.title.slice(0, 30)}..." vào danh sách so sánh.`);
    }
  };

  const handleTriggerComparison = async () => {
    if (comparisonPapers.length < 2) {
      toast.error("Cần ít nhất 2 bài báo để tiến hành so sánh.");
      return;
    }
    setIsComparing(true);
    setIsCompareModalOpen(true);
    setComparisonMarkdown(null);
    
    const toastId = toast.loading("AI đang tiến hành phân tích chéo và so sánh các bài báo...");
    try {
      const response = await api.post<{
        success: boolean;
        data: {
          markdownTable: string;
        };
        message?: string;
      }>("/compare", {
        paper_ids: comparisonPapers.map(p => p.id)
      });

      if (response.success && response.data) {
        setComparisonMarkdown(response.data.markdownTable);
        toast.success("Đối chiếu các bài báo thành công!", { id: toastId });
      } else {
        throw new Error(response.message || "Không thể so sánh các bài báo.");
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Lỗi khi gọi dịch vụ so sánh AI.", { id: toastId });
      setIsCompareModalOpen(false);
    } finally {
      setIsComparing(false);
    }
  };



  return (
    <div className="pb-2 space-y-6 pt-4">
      <SearchHeader
        searchInput={searchInput}
        setSearchInput={setSearchInput}
        onSearchSubmit={handleSearchSubmit}
        topKeywords={topKeywords}
        keyword={keyword}
        onKeywordToggle={handleKeywordToggle}
        sort={sort}
        onSortChange={handleSortChange}
        totalResults={data?.total || 0}
        q={q}
        fetchGlobalSuggestions={fetchGlobalSuggestions}
        onSelectSuggestion={handleSelectSuggestion}
        searchMode={searchMode}
        onSearchModeChange={handleSearchModeChange}
        viewMode={viewMode}
        onViewModeChange={handleViewModeChange}
        onDraftFileSelect={handleDraftFileSelect}
        draftLoading={draftLoading}
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Papers list & Header */}
        <div className="lg:col-span-9 space-y-8 order-1 lg:order-1">
          {searchMode === "semantic" && viewMode === "tree" ? (
            <div className="space-y-4 relative">
              {semanticLoading && (
                <div className="absolute inset-0 bg-surface-container-low/40 backdrop-blur-md z-50 rounded-3xl flex flex-col items-center justify-center space-y-4 animate-fade-in min-h-[720px]">
                  <div className="w-16 h-16 rounded-3xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                    <Loader2 className="w-8 h-8 animate-spin" />
                  </div>
                  <div className="space-y-1.5 text-center">
                    <h4 className="text-sm font-bold text-on-surface">Đang đối chiếu ngữ nghĩa tương đồng...</h4>
                    <p className="text-xs text-on-surface-variant max-w-xs px-4">
                      AI đang liên kết các vector tri thức để phác thảo sơ đồ mạng lưới các nghiên cứu.
                    </p>
                  </div>
                </div>
              )}
              {semanticNodes.length > 0 && (
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-outline-variant/20 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] bg-primary/10 text-primary border border-primary/20 px-2.5 py-0.5 rounded-full font-black uppercase tracking-wider">
                      Bản đồ tri thức
                    </span>
                    <h3 className="text-sm font-black text-on-surface line-clamp-1">
                      {q}
                    </h3>
                  </div>

                  {/* View subtabs */}
                  <div className="flex bg-surface-container rounded-2xl p-1 border border-outline-variant/30 select-none">
                    <button
                      type="button"
                      onClick={() => setActiveSubView("graph")}
                      className={`px-3 py-1 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                        activeSubView === "graph"
                          ? "bg-primary text-white shadow-sm"
                          : "text-on-surface-variant hover:text-on-surface"
                      }`}
                    >
                      🌳 Sơ đồ mạng lưới
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveSubView("prior")}
                      className={`px-3 py-1 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                        activeSubView === "prior"
                          ? "bg-primary text-white shadow-sm"
                          : "text-on-surface-variant hover:text-on-surface"
                      }`}
                    >
                      📚 Prior works (Tiền đề)
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveSubView("derivative")}
                      className={`px-3 py-1 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                        activeSubView === "derivative"
                          ? "bg-primary text-white shadow-sm"
                          : "text-on-surface-variant hover:text-on-surface"
                      }`}
                    >
                      🚀 Derivative works (Kế thừa)
                    </button>
                  </div>
                </div>
              )}

              {activeSubView === "graph" ? (
                <SemanticGraphView
                  semanticNodes={semanticNodes}
                  setSemanticNodes={setSemanticNodes}
                  semanticLinks={semanticLinks}
                  selectedPaper={selectedPaper}
                  defaultPaper={defaultPaper}
                  setSelectedPaper={setSelectedPaper}
                  hoveredNodeId={hoveredNodeId}
                  setHoveredNodeId={setHoveredNodeId}
                  minYearFilter={minYearFilter}
                  setMinYearFilter={setMinYearFilter}
                  minCitationsFilter={minCitationsFilter}
                  setMinCitationsFilter={setMinCitationsFilter}
                  zoom={zoom}
                  setZoom={setZoom}
                  pan={pan}
                  setPan={setPan}
                  isPanning={isPanning}
                  setIsPanning={setIsPanning}
                  startPan={startPan}
                  setStartPan={setStartPan}
                  draggedNode={draggedNode}
                  setDraggedNode={setDraggedNode}
                  handleExpandNode={handleExpandNode}
                  q={q}
                  year={year}
                  author={author}
                  journal={journal}
                  keyword={keyword}
                  sort={sort}
                  setSearchParams={setSearchParams}
                  setSearchInput={setSearchInput}
                  simTrigger={simTrigger}
                  setSimTrigger={setSimTrigger}
                  filteredNodes={filteredNodes}
                  filteredLinks={filteredLinks}
                  colorMode={colorMode}
                  setColorMode={setColorMode}
                  sizeMode={sizeMode}
                  setSizeMode={setSizeMode}
                  semanticPapers={semanticPapers}
                  layoutMode={layoutMode}
                  setLayoutMode={setLayoutMode}
                />
              ) : (
                <PriorDerivativeWorksTable
                  activeSubView={activeSubView}
                  papers={activeSubView === "prior" ? priorPapers : derivativePapers}
                  selectedPaper={selectedPaper}
                  defaultPaper={defaultPaper}
                  onSelectPaper={setSelectedPaper}
                />
              )}
            </div>
          ) : (
            searchMode === "semantic" && !q ? (
              <div className="space-y-8 animate-fade-in">
                {/* Onboarding Panel */}
                <div className="glass-panel p-6 rounded-3xl border border-outline-variant/30 bg-surface-container-low/40 space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary flex-shrink-0">
                      <Bot className="w-6 h-6 animate-pulse" />
                    </div>
                    <div className="space-y-1.5">
                      <h3 className="text-base font-bold text-on-surface">Tìm kiếm ngữ nghĩa tương đồng AI</h3>
                      <p className="text-xs text-on-surface-variant leading-relaxed">
                        Chế độ này đối chiếu toàn bộ ngữ cảnh, từ khóa học thuật và ý tưởng nghiên cứu trong câu hỏi của bạn với cơ sở dữ liệu bài báo khoa học. AI giúp bạn tìm thấy các kết quả liên quan mật thiết về mặt bản chất kể cả khi chúng sử dụng các từ đồng nghĩa khác biệt.
                      </p>
                    </div>
                  </div>

                  {/* Suggestion Prompts */}
                  <div className="space-y-3">
                    <h4 className="text-[10px] font-black text-on-surface-variant uppercase tracking-wider">Chọn nhanh một câu hỏi mẫu:</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {[
                        "Ứng dụng Học máy vào phát hiện bất thường trong giao thông thông minh",
                        "Tối ưu hóa mô hình ngôn ngữ lớn (LLM) để chạy trực tiếp trên thiết bị di động",
                        "Phương pháp thiết kế giao diện UI/UX thích ứng cho các ứng dụng đa màn hình",
                        "Tích hợp Federated Learning vào bảo mật hệ thống Internet of Things (IoT)"
                      ].map((prompt, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            setSearchInput(prompt);
                            setSearchParams({ q: prompt, mode: "semantic", view: viewMode, year, author, journal, keyword, sort, page: "1" });
                          }}
                          className="text-left p-3.5 rounded-2xl border border-outline-variant/20 bg-surface-container/50 hover:bg-surface-container-high hover:border-primary/45 hover:text-primary transition-all text-xs font-semibold text-on-surface-variant cursor-pointer flex items-center justify-between group"
                        >
                          <span className="truncate pr-2">{prompt}</span>
                          <span className="text-[10px] font-bold text-primary opacity-0 group-hover:opacity-100 transition-all shrink-0">Tìm ngay →</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Default Recent Feed */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between px-1">
                    <h4 className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                      Khám phá các bài báo khoa học mới nhất
                    </h4>
                    <span className="text-[10px] bg-secondary/10 text-secondary border border-secondary/20 px-2.5 py-0.5 rounded-full font-bold">
                      Cập nhật liên tục
                    </span>
                  </div>
                  <SearchResultsList
                    papers={data?.data || []}
                    loading={isLoading}
                    bookmarkedIds={bookmarkedIds}
                    bookmarkLoadingIds={bookmarkLoadingIds}
                    onBookmark={handleBookmark}
                    onSelectPaper={setSelectedPaper}
                    page={pageParam}
                    lastPage={data?.last_page || 1}
                    onPageChange={handlePageChange}
                    q={q}
                  />
                </div>
              </div>
            ) : (
              <SearchResultsList
                papers={searchMode === "semantic" ? semanticPapers : (data?.data || [])}
                loading={searchMode === "semantic" ? semanticLoading : isLoading}
                bookmarkedIds={bookmarkedIds}
                bookmarkLoadingIds={bookmarkLoadingIds}
                onBookmark={handleBookmark}
                onSelectPaper={setSelectedPaper}
                page={pageParam}
                lastPage={searchMode === "semantic" ? 1 : (data?.last_page || 1)}
                onPageChange={handlePageChange}
                q={q}
              />
            )
          )}
        </div>

        {/* Sidebar Filters or Paper Details Workspace */}
        {searchMode === "semantic" && viewMode === "tree" ? (
          <PaperDetailsSidebar
            paperToShow={selectedPaper || defaultPaper}
            bookmarkedIds={bookmarkedIds}
            bookmarkLoadingIds={bookmarkLoadingIds}
            onBookmark={handleBookmark}
            onExploreFromSeed={handleExploreFromSeed}
            isInComparison={(selectedPaper || defaultPaper) ? comparisonPapers.some(p => p.id === (selectedPaper || defaultPaper)!.id) : false}
            onToggleComparison={(selectedPaper || defaultPaper) ? () => handleToggleComparison(selectedPaper || defaultPaper!) : undefined}
          />
        ) : (
          <SearchFilters
            year={year}
            setYear={setYear}
            author={author}
            setAuthor={setAuthor}
            journal={journal}
            setJournal={setJournal}
            keyword={keyword}
            setKeyword={setKeyword}
            history={history}
            onSearchFromHistory={(query) => setSearchParams({ q: query, mode: searchMode, view: viewMode, page: "1" })}
            onResetFilters={handleResetFilters}
            onApplyFilters={handleApplyFilter}
            fetchAuthorSuggestions={fetchAuthorSuggestions}
            fetchJournalSuggestions={fetchJournalSuggestions}
          />
        )}
      </div>

      {selectedPaper && !(searchMode === "semantic" && viewMode === "tree") && (
        <SearchPaperDetailModal
          paper={selectedPaper}
          onClose={() => setSelectedPaper(null)}
          bookmarkedIds={bookmarkedIds}
          bookmarkLoadingIds={bookmarkLoadingIds}
          onBookmark={handleBookmark}
          followedKeywordIds={followedKeywordIds}
          followingKeywordIds={followingKeywordIds}
          onToggleFollowKeyword={toggleFollowKeyword}
          q={q}
          isInComparison={comparisonPapers.some(p => p.id === selectedPaper.id)}
          onToggleComparison={() => handleToggleComparison(selectedPaper)}
        />
      )}

      {/* Floating Comparison Tray */}
      {comparisonPapers.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 glass-panel px-6 py-4 rounded-3xl border border-outline-variant/35 bg-surface-container-low/85 backdrop-blur-md shadow-2xl flex flex-col md:flex-row items-center gap-4 max-w-[90vw] md:max-w-3xl animate-slide-up">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-warning/15 text-warning shrink-0">
              <Scale className="w-4 h-4" />
            </div>
            <div className="text-left shrink-0">
              <h5 className="text-[11px] font-black text-on-surface uppercase tracking-wider">Khay so sánh học thuật</h5>
              <p className="text-[10px] font-bold text-on-surface-variant">Đã chọn {comparisonPapers.length}/3 bài báo</p>
            </div>
          </div>

          {/* Selected Papers Tags */}
          <div className="flex flex-wrap gap-2 max-h-[80px] overflow-y-auto justify-center">
            {comparisonPapers.map(p => (
              <span key={p.id} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-container border border-outline-variant/35 text-[10px] font-bold text-on-surface-variant max-w-[150px]">
                <span className="truncate">{p.title}</span>
                <button
                  onClick={() => handleToggleComparison(p)}
                  className="hover:text-error transition-all cursor-pointer p-0.5 rounded-full hover:bg-white/10 shrink-0"
                >
                  <X className="w-2.5 h-2.5" />
                </button>
              </span>
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 shrink-0 w-full md:w-auto justify-end">
            <button
              onClick={() => setComparisonPapers([])}
              className="px-3.5 py-1.5 rounded-xl border border-outline-variant/35 text-[10px] font-black uppercase tracking-wider text-on-surface hover:bg-white/5 transition-all cursor-pointer"
            >
              Xóa hết
            </button>
            <button
              disabled={comparisonPapers.length < 2 || isComparing}
              onClick={handleTriggerComparison}
              className="px-4 py-1.5 rounded-xl bg-primary text-white text-[10px] font-black uppercase tracking-wider hover:bg-primary/95 transition-all cursor-pointer shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
            >
              So sánh ngay {isComparing && <Loader2 className="w-3 h-3 animate-spin" />}
            </button>
          </div>
        </div>
      )}

      {/* Comparison Results Modal */}
      {isCompareModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-surface-container-low border border-outline-variant/35 rounded-3xl w-full max-w-4xl p-6 shadow-2xl flex flex-col max-h-[85vh] animate-scale-up">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-outline-variant/20 shrink-0">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-2xl bg-primary/10 text-primary">
                  <Scale className="w-5 h-5 animate-pulse" />
                </div>
                <div className="text-left">
                  <h3 className="text-base font-black text-on-surface uppercase tracking-wider">
                    Bảng đối chiếu học thuật thông minh
                  </h3>
                  <p className="text-[10px] font-bold text-on-surface-variant">
                    Phân tích so sánh chéo bằng trợ lý AI địa phương (Ollama)
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsCompareModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-white/10 text-on-surface-variant hover:text-on-surface transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content Body */}
            <div className="flex-1 overflow-y-auto py-6 pr-1">
              {isComparing ? (
                <div className="h-64 flex flex-col items-center justify-center space-y-4">
                  <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                    <Loader2 className="w-6 h-6 animate-spin" />
                  </div>
                  <div className="text-center space-y-1.5">
                    <h4 className="text-xs font-bold text-on-surface">Đang tiến hành phân tích đối chiếu chéo...</h4>
                    <p className="text-[10px] text-on-surface-variant max-w-sm px-6 leading-relaxed font-semibold">
                      AI đang so sánh mục tiêu, phương pháp, ưu nhược điểm và kết quả của các bài báo đã chọn. Quá trình này chạy cục bộ và có thể mất vài giây.
                    </p>
                  </div>
                </div>
              ) : comparisonMarkdown ? (
                <div className="space-y-4">
                  {/* Header listing selected papers */}
                  <div className="flex flex-wrap gap-2.5 p-3 rounded-2xl bg-surface-container-high/40 border border-outline-variant/20">
                    <span className="text-[9px] bg-secondary/15 text-secondary border border-secondary/25 px-2 py-0.5 rounded-full font-black uppercase tracking-wider">
                      Các tài liệu được so sánh:
                    </span>
                    {comparisonPapers.map((p, idx) => (
                      <div key={p.id} className="text-[10.5px] font-black text-on-surface flex items-center gap-1">
                        <span className="text-primary">{idx + 1}.</span> {p.title} <span className="text-[9px] text-on-surface-variant font-bold">({p.published_year})</span>
                      </div>
                    ))}
                  </div>

                  {/* AI comparative results */}
                  <div className="text-left font-medium">
                    <MarkdownCompareRenderer content={comparisonMarkdown} />
                  </div>
                </div>
              ) : (
                <div className="text-center text-xs text-on-surface-variant">Không có dữ liệu so sánh.</div>
              )}
            </div>

            {/* Footer */}
            <div className="pt-4 border-t border-outline-variant/20 flex justify-end shrink-0">
              <button
                onClick={() => setIsCompareModalOpen(false)}
                className="px-5 py-2.5 bg-surface-container hover:bg-surface-container-high border border-outline-variant/35 text-on-surface text-xs font-black uppercase tracking-widest rounded-2xl shadow-sm transition-all cursor-pointer"
              >
                Đóng cửa sổ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
