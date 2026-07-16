import React, { useState, useEffect } from "react";
import { BookOpen, Sparkles, RefreshCw, Copy, Check, Loader2, GitBranch } from "lucide-react";
import { api } from "@/src/lib/api";
import { formatAPA, formatBibTeX } from "@/src/lib/citationUtils";
import toast from "react-hot-toast";

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
  url?: string;
  authors: Author[];
  keywords?: { id: number; name: string }[];
  journal?: { id: number; name: string };
}

interface PaperDetailsSidebarProps {
  paperToShow: Paper | null;
  bookmarkedIds: Set<number>;
  bookmarkLoadingIds: Set<number>;
  onBookmark: (paperId: number) => void;
  onExploreFromSeed?: (paperId: number) => void;
  isInComparison?: boolean;
  onToggleComparison?: () => void;
}

export const PaperDetailsSidebar: React.FC<PaperDetailsSidebarProps> = ({
  paperToShow,
  bookmarkedIds,
  bookmarkLoadingIds,
  onBookmark,
  onExploreFromSeed,
  isInComparison = false,
  onToggleComparison,
}) => {
  const [summary, setSummary] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [copiedAPA, setCopiedAPA] = useState(false);
  const [copiedBib, setCopiedBib] = useState(false);
  const [summariesCache, setSummariesCache] = useState<Record<number, any>>({});
  const [selectedVersion, setSelectedVersion] = useState<number>(-1);

  // Q&A Chat states
  const [activeTab, setActiveTab] = useState<"details" | "chat">("details");
  const [chatMessages, setChatMessages] = useState<Array<{ sender: "user" | "ai"; text: string }>>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);

  useEffect(() => {
    setActiveTab("details");
    setChatMessages([]);
    setChatInput("");
  }, [paperToShow?.id]);

  const checkExistingSummary = async (id: number) => {
    try {
      const res = await api.post<{
        success: boolean;
        cached: boolean;
        data?: any;
      }>("/dashboard/ai-summary", {
        paper_id: id,
        title: "check",
        abstract: "check",
        check_only: true
      });
      if (res.success && res.cached && res.data) {
        setSummary(res.data);
        setSelectedVersion(-1);
        setSummariesCache(prev => ({
          ...prev,
          [id]: res.data
        }));
      } else {
        setSummary(null);
        setSelectedVersion(-1);
      }
    } catch (e) {
      setSummary(null);
      setSelectedVersion(-1);
    }
  };

  useEffect(() => {
    if (paperToShow) {
      if (summariesCache[paperToShow.id]) {
        setSummary(summariesCache[paperToShow.id]);
        setSelectedVersion(-1);
      } else {
        setSummary(null);
        setSelectedVersion(-1);
        checkExistingSummary(paperToShow.id);
      }
    }
  }, [paperToShow]);

  const handleFetchSummary = async (force: boolean = false) => {
    if (!paperToShow) return;
    setLoading(true);
    try {
      const res = await api.post<{
        success: boolean;
        data: any;
      }>("/dashboard/ai-summary", {
        paper_id: paperToShow.id,
        title: paperToShow.title,
        abstract: paperToShow.abstract,
        force_refresh: force
      });

      if (res.success && res.data) {
        setSummary(res.data);
        setSelectedVersion(-1);
        setSummariesCache(prev => ({
          ...prev,
          [paperToShow.id]: res.data
        }));
        toast.success(force ? "Đã cập nhật tóm tắt mới!" : "Đã tạo tóm tắt thành công!");
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Không thể tạo tóm tắt.");
    } finally {
      setLoading(false);
    }
  };

  const getDisplayedSummary = () => {
    if (!summary) return null;
    if (selectedVersion === -1) {
      return {
        tldr: summary.tldr,
        insights: summary.insights ? (typeof summary.insights === "string" ? JSON.parse(summary.insights) : summary.insights) : []
      };
    }
    const historyItem = summary.history?.[selectedVersion];
    if (historyItem) {
      return {
        tldr: historyItem.tldr,
        insights: historyItem.insights ? (typeof historyItem.insights === "string" ? JSON.parse(historyItem.insights) : historyItem.insights) : []
      };
    }
    return null;
  };

  const displayedSummary = getDisplayedSummary();

  if (!paperToShow) {
    return (
      <div className="lg:col-span-3 w-full glass-panel p-8 rounded-3xl border border-outline-variant/30 bg-surface-container-low/40 flex flex-col items-center justify-center text-center space-y-4 h-[780px] order-2 lg:order-2">
        <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
          <BookOpen className="w-6 h-6 animate-pulse" />
        </div>
        <div className="space-y-1 max-w-xs">
          <h4 className="text-xs font-black text-on-surface uppercase tracking-wider">Chi tiết bài báo</h4>
          <p className="text-[11px] text-on-surface-variant leading-relaxed">
            Chọn một bài báo trên danh sách hoặc đồ thị để xem tóm tắt thông minh và các thông tin liên quan.
          </p>
        </div>
      </div>
    );
  }

  const isBookmarked = bookmarkedIds.has(paperToShow.id);
  const isBookmarkLoading = bookmarkLoadingIds.has(paperToShow.id);

  const handleCopyAPA = () => {
    const apa = formatAPA({
      id: paperToShow.id,
      title: paperToShow.title,
      published_year: paperToShow.published_year,
      citations_count: paperToShow.citations_count,
      authors: paperToShow.authors,
      journal: paperToShow.journal ? { name: paperToShow.journal.name } : undefined
    });
    navigator.clipboard.writeText(apa);
    setCopiedAPA(true);
    toast.success("Đã sao chép định dạng APA!");
    setTimeout(() => setCopiedAPA(false), 2000);
  };

  const handleCopyBib = () => {
    const bib = formatBibTeX({
      id: paperToShow.id,
      title: paperToShow.title,
      published_year: paperToShow.published_year,
      citations_count: paperToShow.citations_count,
      doi: paperToShow.doi,
      authors: paperToShow.authors,
      journal: paperToShow.journal ? { name: paperToShow.journal.name } : undefined
    });
    navigator.clipboard.writeText(bib);
    setCopiedBib(true);
    toast.success("Đã sao chép định dạng BibTeX!");
    setTimeout(() => setCopiedBib(false), 2000);
  };

  const handleChatSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || chatLoading || !paperToShow) return;

    const userQuestion = chatInput.trim();
    setChatMessages(prev => [...prev, { sender: "user", text: userQuestion }]);
    setChatInput("");
    setChatLoading(true);

    try {
      const response = await api.post<{
        success: boolean;
        data: {
          answer: string;
        };
        error?: string;
      }>("/chat", {
        question: userQuestion,
        paper_id: paperToShow.id
      });

      if (response.success && response.data) {
        setChatMessages(prev => [...prev, { sender: "ai", text: response.data.answer }]);
      } else {
        setChatMessages(prev => [...prev, { sender: "ai", text: response.error || "Có lỗi xảy ra khi xử lý câu hỏi của bạn." }]);
      }
    } catch (err: any) {
      console.error(err);
      setChatMessages(prev => [...prev, { sender: "ai", text: err.message || "Lỗi kết nối tới dịch vụ AI hỏi đáp." }]);
    } finally {
      setChatLoading(false);
      setTimeout(() => {
        const container = document.getElementById("chat-messages-container");
        if (container) {
          container.scrollTop = container.scrollHeight;
        }
      }, 50);
    }
  };

  return (
    <div className="lg:col-span-3 w-full glass-panel p-6 rounded-3xl border border-outline-variant/35 bg-surface-container-low/40 space-y-4 animate-fade-in flex flex-col h-[780px] overflow-hidden order-2 lg:order-2">
      {/* Title & Metadata Header */}
      <div className="space-y-2.5 shrink-0">
        <span className="text-[9px] bg-primary/10 text-primary border border-primary/20 px-2.5 py-0.5 rounded-full font-black uppercase tracking-wider">
          Bài báo đang xem
        </span>
        <h3 className="text-sm font-extrabold text-on-surface leading-snug line-clamp-2">
          {paperToShow.title}
        </h3>
        <div className="flex flex-wrap gap-1.5 text-[9px] font-bold text-on-surface-variant">
          <span className="bg-surface-container-highest px-2 py-0.5 rounded-md">
            📅 {paperToShow.published_year}
          </span>
          <span className="bg-surface-container-highest px-2 py-0.5 rounded-md text-secondary">
            🔥 {paperToShow.citations_count} trích dẫn
          </span>
        </div>
      </div>

      <div className="h-px bg-outline-variant/20 shrink-0" />

      {/* Tab Selector */}
      <div className="flex gap-1.5 p-1 bg-surface-container rounded-2xl border border-outline-variant/30 select-none shrink-0">
        <button
          type="button"
          onClick={() => setActiveTab("details")}
          className={`flex-1 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wide transition-all cursor-pointer text-center ${
            activeTab === "details"
              ? "bg-primary text-white shadow-sm"
              : "text-on-surface-variant hover:text-on-surface"
          }`}
        >
          📄 Chi tiết bài báo
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("chat")}
          className={`flex-1 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wide transition-all cursor-pointer text-center ${
            activeTab === "chat"
              ? "bg-primary text-white shadow-sm"
              : "text-on-surface-variant hover:text-on-surface"
          }`}
        >
          💬 Hỏi đáp AI
        </button>
      </div>

      {activeTab === "details" ? (
        /* Details Tab Content */
        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
          {/* Authors & Journal */}
          <div className="space-y-2 text-xs">
            <div className="space-y-0.5">
              <span className="text-[9px] font-bold text-on-surface-variant uppercase tracking-wider">Tác giả:</span>
              <p className="font-bold text-on-surface leading-normal text-xs text-wrap">
                {paperToShow.authors?.map(a => a.name).join(", ") || "Nhiều tác giả"}
              </p>
            </div>
            {paperToShow.journal && (
              <div className="space-y-0.5">
                <span className="text-[9px] font-bold text-on-surface-variant uppercase tracking-wider">Tạp chí:</span>
                <p className="font-bold text-primary leading-normal text-xs">
                  🏢 {paperToShow.journal.name}
                </p>
              </div>
            )}
          </div>

          <div className="h-px bg-outline-variant/20" />

          {/* AI Summary Section */}
          <div className="bg-primary/5 rounded-2xl p-4 border border-primary/10 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black text-primary uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" /> Trợ lý tóm tắt AI
              </span>
              {summary && !loading && (
                <button
                  type="button"
                  onClick={() => handleFetchSummary(true)}
                  className="text-on-surface-variant hover:text-primary transition-colors cursor-pointer"
                  title="Làm mới tóm tắt"
                >
                  <RefreshCw className="w-3 h-3" />
                </button>
              )}
            </div>

            {summary && summary.history && summary.history.length > 0 && !loading && (
              <div className="flex items-center justify-between text-[10px] bg-primary/10 border border-primary/20 px-3 py-1.5 rounded-xl">
                <span className="font-bold text-primary">Lịch sử tóm tắt:</span>
                <select
                  value={selectedVersion}
                  onChange={(e) => setSelectedVersion(Number(e.target.value))}
                  className="bg-surface-container-highest px-2 py-0.5 rounded border border-outline-variant/35 text-[9px] font-bold text-on-surface focus:outline-none cursor-pointer"
                >
                  <option value="-1">Mới nhất ({summary.created_at || 'Không rõ'})</option>
                  {summary.history.map((h: any, idx: number) => (
                    <option key={idx} value={idx}>
                      Bản cũ #{summary.history.length - idx} ({h.created_at || 'Không rõ'})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {loading ? (
              <div className="flex flex-col items-center justify-center py-4 space-y-2">
                <Loader2 className="w-5 h-5 animate-spin text-primary" />
                <span className="text-[9px] font-bold text-primary/75">AI đang tổng hợp nội dung...</span>
              </div>
            ) : displayedSummary ? (
              <div className="space-y-3 text-xs animate-fade-in">
                <div className="space-y-1">
                  <span className="text-[9px] font-black text-on-surface-variant uppercase tracking-wider">TL;DR:</span>
                  <p className="text-on-surface leading-relaxed font-semibold italic text-justify">
                    "{displayedSummary.tldr}"
                  </p>
                </div>
                <div className="space-y-1">
                  <span className="text-[9px] font-black text-on-surface-variant uppercase tracking-wider">Insights:</span>
                  <ul className="list-disc pl-4 space-y-1 text-on-surface-variant leading-relaxed text-justify">
                    {displayedSummary.insights.map((insight: string, idx: number) => (
                      <li key={idx}>{insight}</li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => handleFetchSummary(false)}
                className="w-full py-2 rounded-xl text-[10px] font-black bg-primary text-white hover:bg-primary/95 transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
              >
                <Sparkles className="w-3 h-3" /> Tạo tóm tắt thông minh
              </button>
            )}
          </div>

          <div className="h-px bg-outline-variant/20" />

          {/* Abstract */}
          <div className="space-y-1.5 pr-1">
            <span className="text-[9px] font-bold text-on-surface-variant uppercase tracking-wider">Tóm tắt (Abstract):</span>
            <p className="text-xs text-on-surface-variant leading-relaxed text-justify font-normal whitespace-pre-line">
              {paperToShow.abstract || "Bài báo này chưa có dữ liệu tóm tắt Abstract."}
            </p>
          </div>

          <div className="h-px bg-outline-variant/20" />

          {/* Citation Copy Actions */}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={handleCopyAPA}
              className="py-2 rounded-xl border border-outline-variant/35 hover:border-primary/45 hover:text-primary transition-all text-[10px] font-black uppercase tracking-wider text-on-surface flex items-center justify-center gap-1.5 cursor-pointer bg-surface-container-low"
            >
              {copiedAPA ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              <span>Sao chép APA</span>
            </button>
            <button
              type="button"
              onClick={handleCopyBib}
              className="py-2 rounded-xl border border-outline-variant/35 hover:border-primary/45 hover:text-primary transition-all text-[10px] font-black uppercase tracking-wider text-on-surface flex items-center justify-center gap-1.5 cursor-pointer bg-surface-container-low"
            >
              {copiedBib ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              <span>Sao chép BibTeX</span>
            </button>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2 pt-1">
            {paperToShow.url && (
              <a
                href={paperToShow.url}
                target="_blank"
                rel="noopener noreferrer"
                download={paperToShow.url.toLowerCase().includes('.pdf') ? true : undefined}
                className="w-full py-2.5 rounded-2xl text-xs font-bold bg-primary text-white hover:bg-primary/90 transition-all flex items-center justify-center gap-1.5 shadow-sm active:scale-98 shadow-[0_0_12px_rgba(37,99,235,0.25)]"
              >
                <span>{paperToShow.url.toLowerCase().includes('.pdf') ? '📄 Tải xuống PDF' : '📎 Xem bài báo'}</span>
              </a>
            )}
            {onExploreFromSeed && paperToShow && (
              <button
                type="button"
                onClick={() => onExploreFromSeed(paperToShow.id)}
                className="w-full py-2.5 rounded-2xl text-xs font-bold bg-secondary text-white hover:bg-secondary/90 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm active:scale-98"
              >
                <GitBranch className="w-3.5 h-3.5" />
                <span>Vẽ bản đồ từ bài báo này</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => onBookmark(paperToShow.id)}
              disabled={isBookmarkLoading}
              className={`w-full py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm active:scale-98 ${isBookmarked
                ? "bg-surface-container-highest border border-outline text-on-surface hover:bg-surface-container-high"
                : "bg-primary text-white hover:bg-primary/90"
                }`}
            >
              <span>{isBookmarked ? "⭐️ Đã lưu bài báo" : "☆ Lưu bài báo này"}</span>
            </button>

            {onToggleComparison && (
              <button
                type="button"
                onClick={onToggleComparison}
                className={`w-full py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm active:scale-98 border ${
                  isInComparison
                    ? "bg-warning/25 border-warning text-warning hover:bg-warning/35"
                    : "bg-surface-container hover:bg-surface-container-high border-outline-variant/35 text-on-surface hover:text-primary"
                }`}
              >
                <span>{isInComparison ? "⚖️ Đã thêm vào so sánh (Click để xóa)" : "⚖️ So sánh bài báo này"}</span>
              </button>
            )}

            {paperToShow.doi && (
              <a
                href={`https://doi.org/${paperToShow.doi}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2.5 rounded-2xl text-xs font-bold bg-surface-container hover:bg-surface-container-high border border-outline-variant/35 text-on-surface transition-all flex items-center justify-center gap-1.5 shadow-sm hover:text-primary active:scale-98"
              >
                <span>🔗 Mở liên kết DOI</span>
              </a>
            )}
          </div>
        </div>
      ) : (
        /* Q&A Chat Tab Content */
        <div className="flex-1 flex flex-col min-h-0 space-y-4">
          <div className="flex-1 overflow-y-auto space-y-3.5 pr-1" id="chat-messages-container">
            {chatMessages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-4 space-y-3 opacity-75">
                <div className="w-10 h-10 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                  <Sparkles className="w-5 h-5 animate-pulse" />
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-black text-on-surface-variant uppercase tracking-wider">Hỏi đáp với AI</span>
                  <p className="text-[10.5px] text-on-surface-variant leading-relaxed">
                    Hãy hỏi tôi bất kỳ điều gì về phương pháp, kết quả, hoặc đóng góp của bài báo này!
                  </p>
                </div>
              </div>
            ) : (
              chatMessages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex flex-col max-w-[85%] ${
                    msg.sender === "user" ? "ml-auto items-end" : "mr-auto items-start"
                  }`}
                >
                  <span className="text-[8px] font-bold text-on-surface-variant uppercase tracking-wider mb-0.5">
                    {msg.sender === "user" ? "Bạn" : "Trợ lý AI"}
                  </span>
                  <div
                    className={`p-3 rounded-2xl text-[11px] leading-relaxed text-justify whitespace-pre-line ${
                      msg.sender === "user"
                        ? "bg-primary text-white rounded-tr-none"
                        : "bg-surface-container-high border border-outline-variant/35 text-on-surface rounded-tl-none font-medium"
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              ))
            )}
            {chatLoading && (
              <div className="flex flex-col items-start max-w-[85%] mr-auto">
                <span className="text-[8px] font-bold text-on-surface-variant uppercase tracking-wider mb-0.5">
                  Trợ lý AI
                </span>
                <div className="p-3 rounded-2xl bg-surface-container-high border border-outline-variant/35 text-on-surface rounded-tl-none font-medium flex items-center gap-2">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
                  <span className="text-[10px] font-bold text-primary/75">Đang suy nghĩ...</span>
                </div>
              </div>
            )}
          </div>

          <form
            onSubmit={handleChatSend}
            className="flex items-center gap-2 pt-2 border-t border-outline-variant/20 shrink-0"
          >
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Nhập câu hỏi của bạn..."
              disabled={chatLoading}
              className="flex-1 bg-surface-container px-3.5 py-2 rounded-2xl text-xs text-on-surface border border-outline-variant/30 focus:outline-none focus:border-primary/50 transition-all font-semibold"
            />
            <button
              type="submit"
              disabled={chatLoading || !chatInput.trim()}
              className="px-4 py-2 bg-primary text-white text-xs font-black uppercase tracking-wider rounded-2xl hover:bg-primary/95 transition-all shadow-sm disabled:opacity-50 cursor-pointer flex items-center justify-center gap-1 shrink-0"
            >
              Gửi
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
