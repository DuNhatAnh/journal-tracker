import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { api } from "../../../lib/api";
import { Database, Loader2, X, ChevronLeft, ChevronRight, ArrowLeft } from "lucide-react";

interface AiChunkViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ChunkedPaper {
  id: number;
  title: string;
  chunk_count: number;
}

interface PaperChunk {
  id: number;
  chunk_index: number;
  chunk_text: string;
  embedding_preview: number[];
  embedding_dimensions: number;
}

export const AiChunkViewerModal: React.FC<AiChunkViewerModalProps> = ({ isOpen, onClose }) => {
  const [allPapers, setAllPapers] = useState<ChunkedPaper[]>([]);
  const [loadingPapers, setLoadingPapers] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [selectedPaper, setSelectedPaper] = useState<ChunkedPaper | null>(null);
  const [chunks, setChunks] = useState<PaperChunk[]>([]);
  const [loadingChunks, setLoadingChunks] = useState(false);

  useEffect(() => {
    if (isOpen && !selectedPaper) {
      fetchPapers();
    }
  }, [isOpen, page, selectedPaper]);

  const fetchPapers = async () => {
    setLoadingPapers(true);
    try {
      const response: any = await api.get(`/admin/settings/ai/chunked-papers`);
      if (response && Array.isArray(response)) {
        setAllPapers(response);
        setTotalPages(Math.ceil(response.length / 5) || 1);
        setPage(1);
      }
    } catch (error) {
      console.error("Failed to fetch chunked papers:", error);
    } finally {
      setLoadingPapers(false);
    }
  };

  const handleSelectPaper = async (paper: ChunkedPaper) => {
    setSelectedPaper(paper);
    setLoadingChunks(true);
    try {
      const response: any = await api.get(`/admin/settings/ai/paper-chunks/${paper.id}`);
      setChunks(response || []);
    } catch (error) {
      console.error("Failed to fetch paper chunks:", error);
    } finally {
      setLoadingChunks(false);
    }
  };

  const handleBack = () => {
    setSelectedPaper(null);
    setChunks([]);
  };

  if (!isOpen) return null;

  const modalContent = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-surface border border-outline-variant/30 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-outline-variant/20 flex items-center justify-between bg-surface-container/30">
          <div className="flex items-center gap-3">
            {selectedPaper ? (
              <button 
                onClick={handleBack}
                className="p-1.5 hover:bg-surface-variant rounded-full transition-colors text-on-surface-variant"
                title="Quay lại danh sách"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            ) : (
              <Database className="w-5 h-5 text-primary" />
            )}
            <h2 className="text-lg font-bold text-on-surface">
              {selectedPaper ? "Chi tiết Vector của Bài báo" : "Dữ liệu Vector Mới Nhất"}
            </h2>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 hover:bg-surface-variant rounded-full text-on-surface-variant transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {selectedPaper ? (
            // View 2: Chunks List
            <div className="space-y-6">
              <div className="bg-primary/10 p-4 rounded-xl border border-primary/20">
                <h3 className="font-bold text-primary text-lg">{selectedPaper.title}</h3>
                <p className="text-sm text-on-surface-variant mt-1">
                  Đã chia thành <strong>{selectedPaper.chunk_count}</strong> chunks.
                </p>
              </div>

              {loadingChunks ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : (
                <div className="space-y-4">
                  {chunks.map((chunk) => (
                    <div key={chunk.id} className="bg-surface-container rounded-xl p-4 border border-outline-variant/30 hover:border-primary/50 transition-colors">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="bg-primary text-on-primary text-xs font-bold px-2 py-1 rounded-md">
                          Chunk {chunk.chunk_index}
                        </span>
                        <span className="text-xs text-on-surface-variant">Vector {chunk.embedding_dimensions} chiều</span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Văn bản</span>
                          <div className="text-sm text-on-surface bg-surface p-3 rounded-lg border border-outline-variant/20 h-32 overflow-y-auto">
                            {chunk.chunk_text}
                          </div>
                        </div>
                        
                        <div className="space-y-1">
                          <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Vector (Preview)</span>
                          <div className="text-sm font-mono text-primary bg-surface p-3 rounded-lg border border-outline-variant/20 h-32 overflow-y-auto break-all">
                            [{chunk.embedding_preview?.join(", ")} ...]
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            // View 1: Papers List
            <div className="space-y-4 h-full flex flex-col">
              {loadingPapers ? (
                <div className="flex-1 flex justify-center items-center">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : allPapers.length > 0 ? (
                <>
                  <div className="flex-1 space-y-3">
                    {allPapers.slice((page - 1) * 5, page * 5).map(paper => (
                      <div 
                        key={paper.id} 
                        onClick={() => handleSelectPaper(paper)}
                        className="bg-surface-container hover:bg-surface-variant p-4 rounded-xl border border-outline-variant/30 cursor-pointer transition-all flex items-center justify-between group"
                      >
                        <div className="pr-4">
                          <h3 className="font-bold text-on-surface line-clamp-1 group-hover:text-primary transition-colors">
                            {paper.title}
                          </h3>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <span className="text-sm bg-primary/10 text-primary px-3 py-1 rounded-full font-medium">
                            {paper.chunk_count} Chunks
                          </span>
                          <ChevronRight className="w-5 h-5 text-on-surface-variant group-hover:text-primary transition-colors" />
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between pt-4 border-t border-outline-variant/20">
                      <button 
                        disabled={page === 1}
                        onClick={() => setPage(p => p - 1)}
                        className="p-2 rounded-lg hover:bg-surface-variant disabled:opacity-50 transition-colors flex items-center gap-1 text-sm font-medium"
                      >
                        <ChevronLeft className="w-4 h-4" /> Trước
                      </button>
                      <span className="text-sm text-on-surface-variant font-medium">
                        Trang {page} / {totalPages}
                      </span>
                      <button 
                        disabled={page === totalPages}
                        onClick={() => setPage(p => p + 1)}
                        className="p-2 rounded-lg hover:bg-surface-variant disabled:opacity-50 transition-colors flex items-center gap-1 text-sm font-medium"
                      >
                        Sau <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-on-surface-variant">
                  <Database className="w-12 h-12 mb-3 opacity-20" />
                  <p>Chưa có bài báo nào được cắt chunk.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
