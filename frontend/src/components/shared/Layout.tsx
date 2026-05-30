import { useState } from "react";
import { Outlet, Navigate, Link } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { TopNav } from "./TopNav";
import { Logo } from "./Logo";
import { api } from "../../lib/api";
import { GraduationCap, BookOpen, Award, ArrowRight } from "lucide-react";

export function Layout() {
  const token = localStorage.getItem("token");
  const userStr = localStorage.getItem("user");
  const user = userStr ? JSON.parse(userStr) : null;

  const [showRoleModal, setShowRoleModal] = useState(() => localStorage.getItem("show_role_selection") === "true");
  const [selectedRole, setSelectedRole] = useState("student");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRoleConfirm = async () => {
    setError(null);
    setSubmitting(true);
    try {
      const response = await api.post<{ user: any }>("/auth/select-role", {
        role: selectedRole,
      });

      localStorage.setItem("user", JSON.stringify(response.user));
      localStorage.removeItem("show_role_selection");
      setShowRoleModal(false);
      window.location.reload();
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Không thể thiết lập vai trò lúc này. Vui lòng thử lại.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  const role = user.role;
  if (role !== "lecturer" && role !== "student" && role !== "researcher" && role !== "admin") {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {showRoleModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-lg p-6">
          <div className="glass-panel p-8 rounded-3xl max-w-lg w-full space-y-6 border border-outline-variant/30 shadow-2xl relative z-10 animate-fade-in">
            <div className="text-center space-y-3">
              <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-primary/10 text-primary mb-2">
                <Logo size={48} />
              </div>
              <h2 className="font-display text-2xl font-bold text-on-surface">Chào mừng đến với SciTrend! 🎉</h2>
              <p className="text-sm text-on-surface-variant">
                Để tối ưu hóa trải nghiệm tìm kiếm và phân tích của bạn, vui lòng xác nhận vai trò của bạn trên hệ thống.
              </p>
            </div>

            {error && (
              <div className="p-3 text-xs bg-error-container/30 border border-error/50 text-error rounded-xl font-medium">
                ⚠️ {error}
              </div>
            )}

            <div className="grid gap-4">
              {/* Sinh viên */}
              <button
                type="button"
                onClick={() => setSelectedRole("student")}
                className={`flex gap-4 p-4 rounded-2xl border-2 text-left transition-all ${
                  selectedRole === "student"
                    ? "border-primary bg-primary/5 shadow-md shadow-primary/5"
                    : "border-outline-variant/30 bg-surface-container-low/50 hover:bg-surface-container-high/50"
                }`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  selectedRole === "student" ? "bg-primary/20 text-primary" : "bg-secondary/10 text-secondary"
                }`}>
                  <GraduationCap className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-on-surface text-sm">Sinh viên</h4>
                  <p className="text-xs text-on-surface-variant mt-1">Dành cho việc tìm kiếm tài liệu học tập, làm tiểu luận, lưu trữ bài báo yêu thích.</p>
                </div>
              </button>

              {/* Giảng viên */}
              <button
                type="button"
                onClick={() => setSelectedRole("lecturer")}
                className={`flex gap-4 p-4 rounded-2xl border-2 text-left transition-all ${
                  selectedRole === "lecturer"
                    ? "border-primary bg-primary/5 shadow-md shadow-primary/5"
                    : "border-outline-variant/30 bg-surface-container-low/50 hover:bg-surface-container-high/50"
                }`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  selectedRole === "lecturer" ? "bg-primary/20 text-primary" : "bg-secondary/10 text-secondary"
                }`}>
                  <BookOpen className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-on-surface text-sm">Giảng viên</h4>
                  <p className="text-xs text-on-surface-variant mt-1">Hỗ trợ tìm kiếm tài liệu giảng dạy, lưu bài báo chuyên ngành phục vụ bài giảng.</p>
                </div>
              </button>

              {/* Nhà nghiên cứu */}
              <button
                type="button"
                onClick={() => setSelectedRole("researcher")}
                className={`flex gap-4 p-4 rounded-2xl border-2 text-left transition-all ${
                  selectedRole === "researcher"
                    ? "border-primary bg-primary/5 shadow-md shadow-primary/5"
                    : "border-outline-variant/30 bg-surface-container-low/50 hover:bg-surface-container-high/50"
                }`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  selectedRole === "researcher" ? "bg-primary/20 text-primary" : "bg-primary/10 text-primary"
                }`}>
                  <Award className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-on-surface text-sm">Nhà nghiên cứu</h4>
                  <p className="text-xs text-on-surface-variant mt-1">Truy cập đầy đủ tính năng: Xem Xu hướng (Trending) bài báo khoa học và Theo dõi (Following) tác giả/journal.</p>
                </div>
              </button>
            </div>

            <button
              type="button"
              disabled={submitting}
              onClick={handleRoleConfirm}
              className="w-full gradient-btn py-4 rounded-xl font-display font-bold uppercase tracking-widest text-on-primary flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? "Đang xử lý..." : "Xác nhận vai trò"}
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      )}
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 relative h-full">
        <TopNav />
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-8 scroll-smooth relative z-10">
          {/* Ambient Background Globs */}
          <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 blur-[120px] rounded-full mix-blend-screen" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[30%] h-[50%] bg-secondary/10 blur-[100px] rounded-full mix-blend-screen" />
          </div>
          <div className="relative z-10 max-w-[1400px] mx-auto w-full min-h-[calc(100vh-10rem)] flex flex-col justify-between">
            <div className="flex-1">
              <Outlet />
            </div>
            
            {/* Footer */}
            <footer className="mt-16 border-t border-outline-variant/20 pt-8 pb-12 text-center md:text-left relative z-20">
              <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                <div className="space-y-2">
                  <div className="flex items-center justify-center md:justify-start gap-2">
                    <Logo size={24} className="text-primary" />
                    <span className="font-display font-bold text-lg tracking-wider text-primary">Sci<span className="text-on-surface">Trend</span></span>
                    <span className="text-[10px] bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded-full font-bold">v1.2.0</span>
                  </div>
                  <p className="text-xs text-on-surface-variant max-w-md">
                    Nền tảng phân tích xu hướng học thuật và theo dõi tạp chí khoa học thời gian thực.
                    Dữ liệu được cập nhật và đồng bộ liên tục từ các cơ sở dữ liệu mở toàn cầu.
                  </p>
                </div>
                <div className="flex flex-wrap justify-center md:justify-end gap-x-8 gap-y-4 text-xs font-bold text-on-surface-variant/80">
                  <Link to="/guide" className="hover:text-primary transition-colors">Hướng dẫn sử dụng</Link>
                  <Link to="/about" className="hover:text-primary transition-colors">Giới thiệu dự án</Link>
                  <a href="#privacy" className="hover:text-primary transition-colors">Điều khoản & Bảo mật</a>
                  <a href="mailto:support@scitrend.edu" className="hover:text-primary transition-colors">Hỗ trợ kỹ thuật</a>
                </div>
              </div>
              <div className="mt-8 pt-8 border-t border-outline-variant/10 flex flex-col md:flex-row justify-between items-center gap-4 text-[11px] text-on-surface-variant/60">
                <p>© 2026 SciTrend. Bảo lưu mọi quyền.</p>
                <p className="flex items-center gap-1.5">
                  Phát triển bởi <span className="text-on-surface font-semibold">Anh, Dũng, Bảo</span>
                </p>
              </div>
            </footer>
          </div>
        </main>
      </div>
    </div>
  );
}
