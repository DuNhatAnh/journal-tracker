import { Outlet, Navigate, Link } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { TopNav } from "./TopNav";
import { Logo } from "./Logo";

export function Layout() {
  const token = localStorage.getItem("token");
  const userStr = localStorage.getItem("user");
  const user = userStr ? JSON.parse(userStr) : null;

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
