import { LayoutDashboard, Search, TrendingUp, Bookmark, Users, Bell, Settings, ChevronRight, LogOut } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/src/lib/utils";
import { Logo } from "@/src/components/Logo";
import { ThemeToggle } from "@/src/components/ThemeToggle";


export function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();

  const userStr = localStorage.getItem("user");
  const user = userStr ? JSON.parse(userStr) : null;
  const role = user?.role || "student";

  const adminItems = [
    { icon: LayoutDashboard, label: "Bảng điều khiển", path: "/dashboard" },
    { icon: Users, label: "Quản lý người dùng", path: "/admin/users" },
    { icon: Settings, label: "Đồng bộ API", path: "/admin/sync" },
  ];

  const regularItems = [
    { icon: LayoutDashboard, label: "Bảng điều khiển", path: "/dashboard" },
    { icon: Search, label: "Khám phá bài báo", path: "/search" },
    { icon: TrendingUp, label: "Xu hướng nghiên cứu", path: "/trending" },
    { icon: Bookmark, label: "Dấu trang", path: "/bookmarks" },
    { icon: Users, label: "Đang theo dõi", path: "/following" },
    { icon: Bell, label: "Thông báo", path: "/notifications" },
  ];

  const items = role === "admin" ? adminItems : regularItems;

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const getRoleLabel = (roleStr: string) => {
    switch (roleStr) {
      case "admin": return "Quản trị viên";
      case "researcher": return "Nhà nghiên cứu";
      case "lecturer": return "Giảng viên";
      default: return "Sinh viên";
    }
  };

  return (
    <nav className="hidden md:flex flex-col h-screen sticky left-0 top-0 w-64 bg-surface-container/70 backdrop-blur-xl border-r border-white/10 z-50">
      <div className="px-6 py-8">
        <Link to="/" className="flex items-center gap-3 hover:opacity-90 transition-opacity">
          <div className="flex items-center justify-center">
            <Logo size={40} />
          </div>
          <div>
            <h1 className="font-display text-2xl font-black text-primary tracking-tight leading-none uppercase">SciTrend</h1>
            <p className="font-mono text-[10px] text-tertiary uppercase tracking-widest mt-1">Hệ Thống Theo Dõi Xu Hướng</p>
          </div>
        </Link>
      </div>

      <div className="flex-1 px-3 space-y-1">
        {items.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "group flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200",
                isActive 
                  ? "bg-secondary-container/30 text-on-secondary-container border-l-4 border-tertiary shadow-sm" 
                  : "text-on-surface-variant hover:text-on-surface hover:bg-white/5"
              )}
            >
              <item.icon className={cn("w-5 h-5", isActive ? "text-tertiary" : "group-hover:text-primary")} />
              <span className="font-display text-sm font-semibold tracking-wide uppercase">{item.label}</span>
            </Link>
          );
        })}
      </div>

      <div className="px-3 pb-6 mt-auto space-y-4">
        <div className="px-4 flex items-center justify-between">
          <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Chế độ hiển thị</span>
          <ThemeToggle />
        </div>

        <div className="space-y-1">
          {role !== "admin" && (
            <Link
              to="/settings"
              className={cn(
                "group flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200",
                location.pathname === "/settings" 
                  ? "bg-secondary-container/30 text-on-secondary-container border-l-4 border-tertiary shadow-sm" 
                  : "text-on-surface-variant hover:text-on-surface hover:bg-white/5"
              )}
            >
              <Settings className="w-5 h-5 group-hover:text-primary transition-colors" />
              <span className="font-display text-sm font-semibold tracking-wide uppercase">Hồ sơ & Cài đặt</span>
            </Link>
          )}

          <div className="pt-4 border-t border-white/5 px-2 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full border border-white/10 overflow-hidden bg-primary/10 flex items-center justify-center font-bold text-xs text-primary">
              {user?.name ? user.name.substring(0, 2).toUpperCase() : "U"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-on-surface truncate">{user?.name || "Người dùng"}</p>
              <p className="text-[9px] font-medium text-on-surface-variant truncate">{getRoleLabel(role)}</p>
            </div>
            <button 
              onClick={handleLogout}
              className="text-on-surface-variant hover:text-error transition-colors p-2"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
