import { LayoutDashboard, Search, TrendingUp, Bookmark, Users, Bell, Settings, LogOut, Tag, RefreshCw, SlidersHorizontal, Cpu } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/src/lib/utils";
import { Logo } from "@/src/components/shared/Logo";
import { ThemeToggle } from "@/src/components/shared/ThemeToggle";
import { useEffect } from "react";
import { useApiQuery } from "../../hooks/useApiQuery";


export function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();

  const userStr = localStorage.getItem("user");
  const user = userStr ? JSON.parse(userStr) : null;
  const role = user?.role || "student";

  const { data: countData, refetch } = useApiQuery<{ count: number }>("/notifications/unread-count", {
    enabled: !!localStorage.getItem("token"),
  });

  useEffect(() => {
    const handleUpdate = () => {
      refetch();
    };
    window.addEventListener("notifications-updated", handleUpdate);
    return () => {
      window.removeEventListener("notifications-updated", handleUpdate);
    };
  }, [refetch]);

  const adminSections = [
    {
      title: "TỔNG QUAN",
      items: [
        { icon: LayoutDashboard, label: "Bảng điều khiển", path: "/admin/dashboard" },
      ]
    },
    {
      title: "QUẢN LÝ DỮ LIỆU",
      items: [
        { icon: RefreshCw, label: "Đồng bộ API", path: "/admin/sync" },
        { icon: Tag, label: "Quản lý từ khóa", path: "/admin/keywords" },
      ]
    },
    {
      title: "HỆ THỐNG & CẤU HÌNH",
      items: [
        { icon: Users, label: "Quản lý người dùng", path: "/admin/users" },
        { icon: SlidersHorizontal, label: "Cấu hình chung", path: "/admin/settings" },
        { icon: Cpu, label: "Cấu hình AI (LLM)", path: "/admin/settings/ai" },
      ]
    }
  ];

  const regularSections = [
    {
      title: "TỔNG QUAN",
      items: [
        { icon: LayoutDashboard, label: "Bảng điều khiển", path: "/dashboard" },
        { icon: Search, label: "Khám phá bài báo", path: "/search" },
        ...(role === "researcher" ? [{ icon: TrendingUp, label: "Xu hướng nghiên cứu", path: "/trending" }] : []),
      ]
    },
    {
      title: "THƯ VIỆN",
      items: [
        ...(role === "researcher" ? [{ icon: Users, label: "Đang theo dõi", path: "/following" }] : []),
        { icon: Bookmark, label: "Đã lưu", path: "/bookmarks" },
        { icon: Bell, label: "Thông báo", path: "/notifications" },
      ]
    }
  ];

  const sections = role === "admin" ? adminSections : regularSections;

  const hotTrends = ["Computer science", "Computer security", "Knowledge management"];

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

      <div className="flex-1 px-3 space-y-6 overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-white/10 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-white/20">
        {sections.map((section, idx) => (
          <div key={idx} className="space-y-1">
            <h3 className="px-4 text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-2">
              {section.title}
            </h3>
            {section.items.map((item) => {
              const isActive = location.pathname === item.path;
              const hasBadge = item.label === "Thông báo" && countData && countData.count > 0;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    "group flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200",
                    isActive 
                      ? "bg-secondary-container/30 text-on-secondary-container border-l-4 border-tertiary shadow-sm" 
                      : "text-on-surface-variant hover:text-on-surface hover:bg-white/5"
                  )}
                >
                  <item.icon className={cn("w-4 h-4", isActive ? "text-tertiary" : "group-hover:text-primary")} />
                  <span className="font-display text-sm font-medium tracking-wide flex-1 text-left">{item.label}</span>
                  {hasBadge && (
                    <span className="px-1.5 py-0.5 rounded-full bg-error text-white font-bold text-[9px] min-w-5 h-5 flex items-center justify-center shadow-lg shadow-error/20 animate-pulse">
                      {countData.count > 99 ? "99+" : countData.count}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        ))}

        {role !== "admin" && (
          <>
            <div className="space-y-1">
              <h3 className="px-4 text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-2 flex items-center gap-2">
                <TrendingUp className="w-3 h-3" /> XU HƯỚNG HOT
              </h3>
              <div className="px-2">
                {hotTrends.map((trend, idx) => (
                  <Link
                    key={idx}
                    to={`/search?q=${encodeURIComponent(trend)}`}
                    className="group flex items-center gap-3 px-2 py-2 rounded-lg text-on-surface-variant hover:text-primary hover:bg-white/5 transition-all duration-200"
                  >
                    <span className="text-tertiary font-bold text-lg leading-none opacity-70 group-hover:opacity-100 transition-opacity">#</span>
                    <span className="font-medium text-sm truncate">{trend}</span>
                  </Link>
                ))}
              </div>
            </div>
          </>
        )}
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
            <div className="w-8 h-8 rounded-full border border-white/10 overflow-hidden bg-primary/10 flex items-center justify-center font-bold text-xs text-primary flex-shrink-0">
              {user?.avatar ? (
                <img src={user.avatar.startsWith('http') ? user.avatar : `/api/storage/${user.avatar.replace('/storage/', '').replace(/^\//, '')}`} alt="Avatar" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
              ) : (
                user?.name ? user.name.substring(0, 2).toUpperCase() : "U"
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-on-surface truncate">{user?.name || "Người dùng"}</p>
              <p className="text-[9px] font-medium text-on-surface-variant truncate">{user?.academic_title || getRoleLabel(role)}</p>
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
