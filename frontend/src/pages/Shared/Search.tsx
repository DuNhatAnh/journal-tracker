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
import { Bot, Sparkles, GitBranch, Loader2 } from "lucide-react";
import { motion } from "framer-motion";

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
        />
      )}
    </div>
  );
}
