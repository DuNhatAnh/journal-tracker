import React, { useState } from "react";
import { X, FileSpreadsheet, FileText, Download, Loader2, FileCheck2, Filter } from "lucide-react";
import toast from "react-hot-toast";

interface ExportTrendReportModalProps {
  onClose: () => void;
  user: any;
  selectedEntity: { id: number; name: string; type: "keyword" | "author" } | null;
  selectedDetail: any;
  startYear: number;
  endYear: number;
  activeStats: any;
  researchGapInsight: any;
  coOccurringKeywords: any[];
}

interface FilterState {
  format: "csv" | "html";
  title: string;
  organization: string;
  includeStats: boolean;
  includeInsight: boolean;
  includeTable: boolean;
  includeCollaborators: boolean;
}

export function ExportTrendReportModal({
  onClose,
  user,
  selectedEntity,
  selectedDetail,
  startYear,
  endYear,
  activeStats,
  researchGapInsight,
  coOccurringKeywords,
}: ExportTrendReportModalProps) {
  const [filters, setFilters] = useState<FilterState>({
    format: "html",
    title: `Báo cáo Phân tích Xu hướng: ${selectedEntity?.name || "Chủ đề"}`,
    organization: user?.affiliation || "Viện Nghiên cứu Khoa học",
    includeStats: true,
    includeInsight: true,
    includeTable: true,
    includeCollaborators: true,
  });

  const [isExporting, setIsExporting] = useState(false);

  if (!selectedEntity || !selectedDetail) return null;

  const handleExport = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsExporting(true);

    try {
      // Filter the trends based on year selection
      const trendsList = (selectedDetail.trends || []).filter(
        (t: any) => t.year >= startYear && t.year <= endYear
      );

      if (filters.format === "csv") {
        // Generate CSV file locally
        let csvContent = "\uFEFF"; // UTF-8 BOM
        csvContent += `Báo cáo Phân tích Xu hướng: ${selectedEntity.name}\n`;
        csvContent += `Loại thực thể: ${selectedEntity.type === "author" ? "Tác giả" : "Từ khóa chủ đề"}\n`;
        csvContent += `Giai đoạn: ${startYear} - ${endYear}\n`;
        csvContent += `Người lập: ${user?.name || "Nhà nghiên cứu"}\n`;
        csvContent += `Ngày lập: ${new Date().toLocaleDateString("vi-VN")}\n\n`;

        // Stats Overview
        csvContent += "Chỉ số tổng quan\n";
        csvContent += `Tổng công bố;Tốc độ tăng trưởng;Điểm tác động (Trích dẫn trung bình);Tổng lượt trích dẫn\n`;
        csvContent += `${activeStats.total};${activeStats.growth};${activeStats.impact};${activeStats.citations}\n\n`;

        // Yearly data
        csvContent += "Số liệu chi tiết qua các năm\n";
        csvContent += "Năm;Số lượng bài báo;Số lượt trích dẫn;Tốc độ tăng trưởng (%)\n";
        trendsList.forEach((t: any) => {
          csvContent += `${t.year};${t.paper_count};${t.citation_count};${t.growth_rate}%\n`;
        });

        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `bao_cao_xu_huong_${selectedEntity.name.toLowerCase().replace(/\s+/g, "_")}_${new Date().toISOString().slice(0, 10)}.csv`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
        toast.success("Tải báo cáo CSV thành công!");
        onClose();
      } else {
        // Generate Print-ready HTML Report
        const printWindow = window.open("", "_blank");
        if (!printWindow) {
          toast.error("Trình duyệt đã chặn cửa sổ pop-up. Vui lòng cho phép popup để xem bản in.");
          setIsExporting(false);
          return;
        }

        // Yearly table html rows
        const tableRowsHtml = trendsList
          .map(
            (t: any) => `
          <tr class="border-b border-slate-200">
            <td class="py-2.5 px-4 font-semibold text-slate-800">${t.year}</td>
            <td class="py-2.5 px-4">${t.paper_count}</td>
            <td class="py-2.5 px-4">${t.citation_count}</td>
            <td class="py-2.5 px-4 font-semibold ${t.growth_rate >= 0 ? "text-emerald-600" : "text-rose-600"}">${t.growth_rate >= 0 ? "+" : ""}${t.growth_rate}%</td>
          </tr>
        `
          )
          .join("");

        // Collaborators or Co-occurring list
        let secondaryListHtml = "";
        if (selectedEntity.type === "author" && filters.includeCollaborators) {
          const list = selectedDetail.top_collaborators || [];
          secondaryListHtml = `
            <div class="section-box">
              <h3 class="section-title">Mạng lưới đồng tác giả chính</h3>
              <p class="text-sm">${list.join(", ") || "Không có đồng tác giả tiêu biểu được ghi nhận"}</p>
            </div>
          `;
        } else if (selectedEntity.type === "keyword" && filters.includeCollaborators) {
          const list = coOccurringKeywords.slice(0, 10).map((k: any) => k.name) || [];
          secondaryListHtml = `
            <div class="section-box">
              <h3 class="section-title">Chủ đề đồng xuất hiện nổi bật (Co-occurring keywords)</h3>
              <p class="text-sm">${list.join(", ") || "Không ghi nhận từ khóa đồng xuất hiện"}</p>
            </div>
          `;
        }

        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>${filters.title}</title>
              <meta charset="utf-8">
              <style>
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
                body {
                  font-family: 'Inter', sans-serif;
                  color: #1e293b;
                  line-height: 1.6;
                  background-color: #ffffff;
                  margin: 0;
                  padding: 40px;
                }
                .container {
                  max-width: 900px;
                  margin: 0 auto;
                }
                .header {
                  display: flex;
                  justify-content: space-between;
                  align-items: flex-start;
                  border-bottom: 3px double #cbd5e1;
                  padding-bottom: 20px;
                  margin-bottom: 30px;
                }
                .header-left h1 {
                  font-size: 22px;
                  font-weight: 700;
                  margin: 0 0 8px 0;
                  color: #0f172a;
                  text-transform: uppercase;
                }
                .header-left p {
                  margin: 0;
                  font-size: 14px;
                  color: #64748b;
                }
                .header-right {
                  text-align: right;
                  font-size: 13px;
                  color: #475569;
                }
                .stats-grid {
                  display: grid;
                  grid-template-columns: repeat(4, 1fr);
                  gap: 16px;
                  margin-bottom: 30px;
                }
                .stat-card {
                  background-color: #f8fafc;
                  border: 1px solid #e2e8f0;
                  border-radius: 8px;
                  padding: 14px;
                  text-align: center;
                }
                .stat-label {
                  font-size: 11px;
                  color: #64748b;
                  font-weight: 600;
                  text-transform: uppercase;
                  letter-spacing: 0.05em;
                  margin-bottom: 4px;
                }
                .stat-value {
                  font-size: 20px;
                  font-weight: 700;
                  color: #2563eb;
                }
                .section-box {
                  margin-bottom: 30px;
                  page-break-inside: avoid;
                }
                .section-title {
                  font-size: 15px;
                  font-weight: 700;
                  color: #0f172a;
                  border-left: 4px solid #2563eb;
                  padding-left: 10px;
                  margin-top: 0;
                  margin-bottom: 12px;
                  text-transform: uppercase;
                }
                .insight-box {
                  background-color: #f0fdf4;
                  border: 1px solid #bbf7d0;
                  border-radius: 8px;
                  padding: 16px;
                  margin-bottom: 30px;
                  page-break-inside: avoid;
                }
                .insight-title {
                  font-weight: 700;
                  color: #166534;
                  font-size: 13px;
                  text-transform: uppercase;
                  margin-bottom: 6px;
                }
                .insight-desc {
                  font-size: 13px;
                  color: #14532d;
                  margin: 0;
                }
                table {
                  width: 100%;
                  border-collapse: collapse;
                  margin-bottom: 30px;
                }
                th {
                  border-bottom: 2px solid #cbd5e1;
                  color: #334155;
                  font-weight: 700;
                  background-color: #f1f5f9;
                }
                td, th {
                  padding: 10px 14px;
                  text-align: left;
                  font-size: 13px;
                }
                tr {
                  border-bottom: 1px solid #e2e8f0;
                  page-break-inside: avoid;
                }
                .footer-sign {
                  margin-top: 60px;
                  display: flex;
                  justify-content: space-between;
                  page-break-inside: avoid;
                }
                .sign-box {
                  text-align: center;
                  width: 250px;
                }
                .sign-title {
                  font-size: 13px;
                  font-weight: 600;
                  margin-bottom: 50px;
                }
                .sign-name {
                  font-size: 13px;
                  font-weight: 700;
                  color: #0f172a;
                  border-top: 1px solid #cbd5e1;
                  padding-top: 6px;
                }
                @media print {
                  body {
                    padding: 0;
                  }
                }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <div class="header-left">
                    <h1>${filters.title}</h1>
                    <p>Đơn vị nghiên cứu: ${filters.organization}</p>
                  </div>
                  <div class="header-right">
                    <p><strong>Người lập báo cáo:</strong> ${user?.name || "Nhà nghiên cứu"}</p>
                    <p><strong>Ngày xuất bản:</strong> ${new Date().toLocaleDateString("vi-VN")}</p>
                    <p><strong>Giai đoạn:</strong> ${startYear} - ${endYear}</p>
                  </div>
                </div>

                ${
                  filters.includeStats
                    ? `
                  <div class="stats-grid">
                    <div class="stat-card">
                      <div class="stat-label">Tổng bài báo công bố</div>
                      <div class="stat-value">${activeStats.total}</div>
                    </div>
                    <div class="stat-card">
                      <div class="stat-label">Tổng lượt trích dẫn</div>
                      <div class="stat-value">${activeStats.citations}</div>
                    </div>
                    <div class="stat-card">
                      <div class="stat-label">Điểm tác động (TB/Bài)</div>
                      <div class="stat-value">${activeStats.impact}</div>
                    </div>
                    <div class="stat-card">
                      <div class="stat-label">Tốc độ tăng trưởng</div>
                      <div class="stat-value">${activeStats.growth}</div>
                    </div>
                  </div>
                `
                    : ""
                }

                ${
                  filters.includeInsight && researchGapInsight
                    ? `
                  <div class="insight-box">
                    <div class="insight-title">Đánh giá xu hướng từ AI: ${researchGapInsight.level}</div>
                    <p class="insight-desc">${researchGapInsight.message}</p>
                  </div>
                `
                    : ""
                }

                ${
                  filters.includeTable
                    ? `
                  <div class="section-box">
                    <h3 class="section-title">Số liệu phát triển qua các năm</h3>
                    <table>
                      <thead>
                        <tr>
                          <th class="py-2 px-4">Năm học thuật</th>
                          <th class="py-2 px-4">Số lượng bài công bố</th>
                          <th class="py-2 px-4">Số lượt trích dẫn</th>
                          <th class="py-2 px-4">Tốc độ tăng trưởng</th>
                        </tr>
                      </thead>
                      <tbody>
                        ${tableRowsHtml}
                      </tbody>
                    </table>
                  </div>
                `
                    : ""
                }

                ${secondaryListHtml}

                <div class="footer-sign">
                  <div class="sign-box">
                    <div class="sign-title">XÁC NHẬN CỦA ĐƠN VỊ KHOA HỌC</div>
                    <div style="height: 50px;"></div>
                    <div class="sign-name">Trưởng phòng QLKH / Đơn vị</div>
                  </div>
                  <div class="sign-box">
                    <div class="sign-title">NGƯỜI LẬP BÁO CÁO</div>
                    <div style="font-style: italic; font-size: 11px; margin-bottom: 30px;">(Ký và ghi rõ họ tên)</div>
                    <div class="sign-name">${user?.name || "Nhà nghiên cứu"}</div>
                  </div>
                </div>
              </div>
              <script>
                window.onload = function() {
                  window.print();
                }
              </script>
            </body>
          </html>
        `);
        printWindow.document.close();
        toast.success("Báo cáo xu hướng đã được tạo!");
        onClose();
      }
    } catch (err) {
      console.error(err);
      toast.error("Gặp sự cố khi kết xuất báo cáo xu hướng");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4">
      <div className="w-full max-w-xl bg-surface border border-outline/30 rounded-2xl shadow-2xl glass-panel-intense overflow-hidden">
        
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-outline/20">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/20 text-primary">
              <FileCheck2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-display text-lg font-bold text-on-surface">Xuất báo cáo xu hướng</h3>
              <p className="text-xs text-on-surface-variant">Lập tài liệu phân tích xu hướng cho chủ đề học thuật</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-outline/20 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleExport} className="p-6 space-y-6">
          
          {/* Format selection */}
          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => setFilters((p) => ({ ...p, format: "html" }))}
              className={`flex items-center gap-3 p-3.5 rounded-xl border transition-all cursor-pointer text-left ${
                filters.format === "html"
                  ? "bg-primary/5 border-primary shadow-sm"
                  : "bg-surface-container-low border-outline/20 hover:bg-outline/5"
              }`}
            >
              <FileText className={`w-5 h-5 ${filters.format === "html" ? "text-primary" : "text-on-surface-variant"}`} />
              <div>
                <h4 className="text-xs font-bold text-on-surface">Bản in HTML / PDF</h4>
                <p className="text-[10px] text-on-surface-variant mt-0.5">Trang trọng, kèm thống kê & nhận định</p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setFilters((p) => ({ ...p, format: "csv" }))}
              className={`flex items-center gap-3 p-3.5 rounded-xl border transition-all cursor-pointer text-left ${
                filters.format === "csv"
                  ? "bg-primary/5 border-primary shadow-sm"
                  : "bg-surface-container-low border-outline/20 hover:bg-outline/5"
              }`}
            >
              <FileSpreadsheet className={`w-5 h-5 ${filters.format === "csv" ? "text-primary" : "text-on-surface-variant"}`} />
              <div>
                <h4 className="text-xs font-bold text-on-surface">Bảng tính CSV</h4>
                <p className="text-[10px] text-on-surface-variant mt-0.5">Dữ liệu thô phân tích năm học</p>
              </div>
            </button>
          </div>

          {/* Config fields */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5">Tiêu đề báo cáo</label>
              <input
                type="text"
                required
                value={filters.title}
                onChange={(e) => setFilters((p) => ({ ...p, title: e.target.value }))}
                className="w-full px-3.5 py-2 rounded-xl bg-surface-container-low border border-outline/30 focus:border-primary text-xs text-on-surface outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5">Tổ chức / Đơn vị</label>
              <input
                type="text"
                required
                value={filters.organization}
                onChange={(e) => setFilters((p) => ({ ...p, organization: e.target.value }))}
                className="w-full px-3.5 py-2 rounded-xl bg-surface-container-low border border-outline/30 focus:border-primary text-xs text-on-surface outline-none"
              />
            </div>
          </div>

          {/* Include Sections Toggles */}
          {filters.format === "html" && (
            <div className="bg-surface-container-lowest border border-outline/20 rounded-xl p-4 space-y-3">
              <div className="text-xs font-bold uppercase text-primary tracking-wider">Cấu trúc báo cáo</div>
              
              <div className="grid grid-cols-2 gap-3">
                <label className="flex items-center gap-2 text-xs text-on-surface cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={filters.includeStats}
                    onChange={(e) => setFilters((p) => ({ ...p, includeStats: e.target.checked }))}
                    className="accent-primary w-3.5 h-3.5 rounded"
                  />
                  <span>Chỉ số tổng quan</span>
                </label>

                <label className="flex items-center gap-2 text-xs text-on-surface cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={filters.includeInsight}
                    onChange={(e) => setFilters((p) => ({ ...p, includeInsight: e.target.checked }))}
                    className="accent-primary w-3.5 h-3.5 rounded"
                  />
                  <span>Nhận định xu hướng AI</span>
                </label>

                <label className="flex items-center gap-2 text-xs text-on-surface cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={filters.includeTable}
                    onChange={(e) => setFilters((p) => ({ ...p, includeTable: e.target.checked }))}
                    className="accent-primary w-3.5 h-3.5 rounded"
                  />
                  <span>Bảng số liệu các năm</span>
                </label>

                <label className="flex items-center gap-2 text-xs text-on-surface cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={filters.includeCollaborators}
                    onChange={(e) => setFilters((p) => ({ ...p, includeCollaborators: e.target.checked }))}
                    className="accent-primary w-3.5 h-3.5 rounded"
                  />
                  <span>{selectedEntity.type === "author" ? "Đồng tác giả" : "Từ khóa đồng xuất hiện"}</span>
                </label>
              </div>
            </div>
          )}

          {/* Time range preview */}
          <div className="text-xs text-on-surface-variant font-medium">
            Phạm vi thời gian xuất báo cáo: <span className="text-primary font-bold">{startYear} - {endYear}</span> (Theo bộ lọc hiện tại trên trang).
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-3 border-t border-outline/20 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 rounded-xl border border-outline/30 text-xs font-bold text-on-surface-variant cursor-pointer hover:bg-outline/5 transition-all"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isExporting}
              className="flex items-center justify-center gap-2 px-6 py-2 rounded-xl bg-primary text-on-primary hover:bg-primary/95 text-xs font-bold shadow-lg shadow-primary/20 disabled:opacity-50 cursor-pointer transition-all"
            >
              {isExporting ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-on-primary" />
              ) : (
                <Download className="w-3.5 h-3.5" />
              )}
              <span>{filters.format === "csv" ? "Tải xuống CSV" : "Xuất báo cáo PDF"}</span>
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
