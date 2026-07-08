import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { api } from "@/src/lib/api";
import toast from "react-hot-toast";
import { useApiQuery, queryCache } from "../../hooks/useApiQuery";
import { SearchHeader } from "./components/Search/SearchHeader";
import { SearchFilters } from "./components/Search/SearchFilters";
import { SearchResultsList } from "./components/Search/SearchResultsList";
import { SearchPaperDetailModal } from "./components/Search/SearchPaperDetailModal";

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

export default function Search() {
  const [searchParams, setSearchParams] = useSearchParams();
  const q = searchParams.get("q") || "";
  const yearParam = searchParams.get("year");
  const authorParam = searchParams.get("author") || "";
  const journalParam = searchParams.get("journal") || "";
  const keywordParam = searchParams.get("keyword") || "";
  const sortParam = searchParams.get("sort") || "relevance";
  const pageParam = parseInt(searchParams.get("page") || "1", 10);

  const [year, setYear] = useState<string>(yearParam || "");
  const [author, setAuthor] = useState<string>(authorParam);
  const [journal, setJournal] = useState<string>(journalParam);
  const [keyword, setKeyword] = useState<string>(keywordParam);
  const [sort, setSort] = useState<string>(sortParam);
  const [history, setHistory] = useState<string[]>([]);
  const [searchInput, setSearchInput] = useState(q);
  const [selectedPaper, setSelectedPaper] = useState<Paper | null>(null);
  
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<number>>(new Set());
  const [bookmarkLoadingIds, setBookmarkLoadingIds] = useState<Set<number>>(new Set());
  const [followedKeywordIds, setFollowedKeywordIds] = useState<Set<number>>(new Set());
  const [followingKeywordIds, setFollowingKeywordIds] = useState<Set<number>>(new Set());

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

  // Save history and update searchInput
  useEffect(() => {
    if (q) {
      const saved = localStorage.getItem("search_history");
      let h = saved ? JSON.parse(saved) : [];
      h = [q, ...h.filter((item: string) => item !== q)].slice(0, 10);
      setHistory(h);
      localStorage.setItem("search_history", JSON.stringify(h));
    }
    setSearchInput(q);
  }, [q]);

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
      setSearchParams({ q: searchInput, year, author, journal, keyword: newKeyword, sort, page: "1" });
    } else if (item._type === 'author') {
      setAuthor(item.name);
      setSearchParams({ q: searchInput, year, author: item.name, journal, keyword, sort, page: "1" });
    } else if (item._type === 'journal') {
      setJournal(item.name);
      setSearchParams({ q: searchInput, year, author, journal: item.name, keyword, sort, page: "1" });
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
    setSearchParams({ q, year, author, journal, keyword: newKeyword, sort, page: "1" });
  };

  const handleApplyFilter = () => {
    setSearchParams({ q, year, author, journal, keyword, sort, page: "1" });
  };

  const handleResetFilters = () => {
    setYear("");
    setAuthor("");
    setJournal("");
    setKeyword("");
    setSort("relevance");
    setSearchParams({ q, page: "1" });
  };

  const handleSortChange = (newSort: string) => {
    setSort(newSort);
    setSearchParams({ q, year, author, journal, keyword, sort: newSort, page: "1" });
  };

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > (data?.last_page || 1)) return;
    setSearchParams({ q, year, author, journal, keyword, sort, page: newPage.toString() });
  };

  const handleSearchSubmit = () => {
    setSearchParams({ q: searchInput, year, author, journal, keyword, sort, page: "1" });
  };

  return (
    <div className="pb-20 space-y-6 pt-4">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Papers list & Header */}
        <div className="lg:col-span-9 space-y-8 order-1 lg:order-1">
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
          />

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

        {/* Sidebar Filters */}
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
          onSearchFromHistory={(query) => setSearchParams({ q: query, page: "1" })}
          onResetFilters={handleResetFilters}
          onApplyFilters={handleApplyFilter}
          fetchAuthorSuggestions={fetchAuthorSuggestions}
          fetchJournalSuggestions={fetchJournalSuggestions}
        />
      </div>

      {selectedPaper && (
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
