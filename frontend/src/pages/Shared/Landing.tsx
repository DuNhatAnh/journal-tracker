import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { 
  ArrowRight, Search, Users, Database, 
  Sparkles, AlertTriangle, Zap, Activity, 
  BookOpenText, LineChart, BellRing, Bookmark,
  GraduationCap, Settings
} from "lucide-react";
import { Logo } from "@/src/components/shared/Logo";
import { ThemeToggle } from "@/src/components/shared/ThemeToggle";

export default function Landing() {
  const token = localStorage.getItem("token");
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    <div className="min-h-screen bg-background text-on-background font-sans selection:bg-primary/30 selection:text-primary overflow-x-hidden relative flex flex-col justify-between scroll-smooth transition-colors duration-500">
      {/* --- CUSTOM ANIMATIONS --- */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-15px) rotate(2deg); }
        }
        @keyframes gradient-x {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        .animate-float { animation: float 6s ease-in-out infinite; }
        .bg-gradient-animate { background-size: 200% 200%; animation: gradient-x 15s ease infinite; }
      `}</style>

      {/* Background Glows (Adapts blending for light/dark mode automatically based on CSS setup or keeps it subtle) */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] max-w-[800px] max-h-[800px] bg-primary/10 blur-[120px] rounded-full animate-pulse duration-[8000ms]" />
        <div className="absolute top-[30%] right-[-10%] w-[40vw] h-[40vw] max-w-[600px] max-h-[600px] bg-tertiary/10 blur-[150px] rounded-full" />
      </div>

      {/* 1. Navigation Bar */}
      <header className="fixed top-0 left-0 right-0 z-50 px-6 md:px-12 py-4 bg-background/80 border-b border-outline-variant backdrop-blur-xl transition-colors duration-500">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="flex items-center justify-center p-2 rounded-xl bg-primary/10 border border-primary/20 group-hover:bg-primary/20 transition-all">
              <Logo size={28} />
            </div>
            <div>
              <span className="font-display text-lg font-black tracking-tight text-primary uppercase leading-none block">SciTrend</span>
              <span className="font-mono text-[8px] text-on-surface-variant tracking-widest uppercase mt-0.5 block">Hệ thống theo dõi xu hướng</span>
            </div>
          </Link>
          
          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-on-surface-variant">
            <a href="#problem" className="hover:text-primary transition-colors">Vấn đề</a>
            <a href="#features" className="hover:text-primary transition-colors">Giải pháp</a>
            <a href="#actors" className="hover:text-primary transition-colors">Đối tượng</a>
          </nav>

          <div className="flex items-center gap-4">
            {/* THÊM NÚT THEME TOGGLE */}
            <ThemeToggle />

            {token ? (
              <Link
                to="/dashboard"
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-on-primary font-bold text-xs uppercase tracking-wider hover:brightness-110 transition-all shadow-lg shadow-primary/20 active:scale-95"
              >
                Vào Dashboard <ArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <>
                <Link to="/login" className="hidden sm:block text-sm font-bold text-on-surface-variant hover:text-primary transition-colors px-3 py-2">
                  Đăng nhập
                </Link>
                <Link
                  to="/register"
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-on-primary font-bold text-xs uppercase tracking-wider hover:brightness-110 shadow-lg shadow-primary/20 transition-all active:scale-95"
                >
                  Đăng ký miễn phí
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* 2. Hero Section */}
      <section className="relative z-10 w-full pt-40 pb-20 flex flex-col items-center justify-center text-center px-4">
        
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/10 border border-secondary/20 text-secondary text-xs sm:text-sm font-bold uppercase tracking-wider mb-8 shadow-sm">
          <Database className="w-4 h-4" /> Đồng bộ Metadata từ OpenAlex & Semantic Scholar
        </div>

        <h1 className="max-w-5xl font-display text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight leading-[1.1] text-on-surface">
          Scientific Journal Publication <br className="hidden md:block" />
          <span className="bg-gradient-to-r from-primary via-tertiary to-secondary bg-clip-text text-transparent bg-gradient-animate">Trend Tracking System</span>
        </h1>
        
        <p className="mt-8 text-base sm:text-lg text-on-surface-variant max-w-3xl leading-relaxed mx-auto">
          Các nền tảng học thuật hiện nay chỉ hỗ trợ tìm kiếm bài báo. Chúng tôi mang đến giải pháp <strong className="text-on-surface">phân tích xu hướng công bố theo thời gian</strong> và trực quan hóa dữ liệu nghiên cứu chuyên sâu cho lĩnh vực Computer Science & AI.
        </p>

        {/* Dynamic Search Bar */}
        <form onSubmit={handleSearch} className="w-full max-w-2xl mx-auto mt-12 relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-primary via-secondary to-tertiary rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-500 bg-gradient-animate"></div>
          <div className="relative flex items-center bg-surface border border-outline-variant backdrop-blur-xl rounded-2xl p-2 pl-4 shadow-xl">
            <Search className="w-6 h-6 text-on-surface-variant" />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Nhập từ khóa nghiên cứu (VD: 'Machine Learning', 'Computer Vision')..." 
              className="flex-1 bg-transparent border-none text-on-surface px-4 py-3 outline-none placeholder:text-on-surface-variant/70 font-medium text-sm sm:text-base" 
            />
            <button 
              type="submit"
              className="hidden sm:flex items-center gap-2 bg-primary hover:brightness-110 text-on-primary px-8 py-3.5 rounded-xl font-bold uppercase tracking-widest text-xs transition-all active:scale-95 shadow-md"
            >
              Khám Phá <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      </section>

      {/* 3. Problem Grid (Bối cảnh & Vấn đề) */}
      <section id="problem" className="relative z-10 max-w-7xl mx-auto w-full px-6 md:px-12 py-24 border-t border-outline-variant">
        <div className="text-center space-y-4 max-w-3xl mx-auto mb-16">
          <span className="text-sm font-bold uppercase tracking-wider text-error">Bối Cảnh & Vấn Đề</span>
          <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-on-surface">
            Vì sao việc nghiên cứu ngày càng khó khăn?
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="glass-panel p-8 rounded-3xl bg-surface-container/60 border border-outline-variant hover:border-outline hover:shadow-lg transition-all">
            <div className="w-12 h-12 rounded-2xl bg-error/10 border border-error/20 flex items-center justify-center mb-6 text-error">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-on-surface mb-3">Quá tải bài báo khoa học</h3>
            <p className="text-sm text-on-surface-variant leading-relaxed">
              Khó theo dõi sự thay đổi và phát triển của các chủ đề nghiên cứu theo thời gian do số lượng bài báo khoa học ngày càng lớn và tăng lên mỗi ngày.
            </p>
          </div>

          <div className="glass-panel p-8 rounded-3xl bg-surface-container/60 border border-outline-variant hover:border-outline hover:shadow-lg transition-all">
            <div className="w-12 h-12 rounded-2xl bg-secondary/10 border border-secondary/20 flex items-center justify-center mb-6 text-secondary">
              <BookOpenText className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-on-surface mb-3">Thiếu tính trực quan hóa</h3>
            <p className="text-sm text-on-surface-variant leading-relaxed">
              Việc tìm kiếm bài báo hiện nay chủ yếu dựa trên keyword, đọc dạng danh sách văn bản, hoàn toàn chưa hỗ trợ phân tích xu hướng một cách trực quan.
            </p>
          </div>

          <div className="glass-panel p-8 rounded-3xl bg-surface-container/60 border border-outline-variant hover:border-outline hover:shadow-lg transition-all">
            <div className="w-12 h-12 rounded-2xl bg-tertiary/10 border border-tertiary/20 flex items-center justify-center mb-6 text-tertiary">
              <Activity className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-on-surface mb-3">Lãng phí thời gian</h3>
            <p className="text-sm text-on-surface-variant leading-relaxed">
              Giảng viên, sinh viên và nhà nghiên cứu mất nhiều thời gian, công sức để tự mình xác định các chủ đề đang nổi bật hoặc có tiềm năng nghiên cứu.
            </p>
          </div>
        </div>
      </section>

      {/* 4. Core Features & Solutions */}
      <section id="features" className="relative z-10 max-w-7xl mx-auto w-full px-6 md:px-12 py-24 border-t border-outline-variant">
        <div className="text-center space-y-4 max-w-3xl mx-auto mb-16">
          <span className="text-sm font-bold uppercase tracking-wider text-primary">Giải Pháp Công Nghệ</span>
          <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-on-surface">
            Theo dõi xu hướng chuyên sâu
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Feature List */}
          <div className="space-y-6">
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 text-primary">
                <LineChart className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-lg font-bold text-on-surface">Hiển thị biểu đồ & Dashboard</h4>
                <p className="text-sm text-on-surface-variant mt-1">Trực quan hóa xu hướng xuất bản theo từ khóa hoặc chủ đề theo thời gian thực.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 text-primary">
                <Search className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-lg font-bold text-on-surface">Tìm kiếm bài báo & Tạp chí</h4>
                <p className="text-sm text-on-surface-variant mt-1">Khám phá chi tiết các nghiên cứu theo từ khóa, tác giả hoặc tạp chí công bố.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 text-primary">
                <Bookmark className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-lg font-bold text-on-surface">Lưu bài báo & Theo dõi</h4>
                <p className="text-sm text-on-surface-variant mt-1">Lưu các bài báo hay và Đăng ký theo dõi các chủ đề/tạp chí bạn quan tâm.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 text-primary">
                <BellRing className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-lg font-bold text-on-surface">Thông báo tự động</h4>
                <p className="text-sm text-on-surface-variant mt-1">Hệ thống tự động thông báo khi có bài báo mới được xuất bản khớp với từ khóa bạn theo dõi.</p>
              </div>
            </div>
          </div>

          {/* Feature Mockup Card */}
          <div className="glass-panel p-6 rounded-3xl bg-surface-container-high/80 border border-outline-variant relative overflow-hidden shadow-2xl">
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary/20 blur-3xl rounded-full" />
            <h3 className="text-lg font-bold text-on-surface mb-6 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-secondary" /> Biểu đồ xu hướng (Mockup)
            </h3>
            
            {/* SVG Chart Mockup */}
            <div className="w-full h-48 relative">
              <svg className="w-full h-full overflow-visible" viewBox="0 0 1000 200" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="chartGlow2" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="currentColor" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="currentColor" stopOpacity="0.0" />
                  </linearGradient>
                </defs>
                <line x1="0" y1="50" x2="1000" y2="50" stroke="currentColor" strokeOpacity="0.1" strokeWidth="1" strokeDasharray="4 4" className="text-on-surface" />
                <line x1="0" y1="100" x2="1000" y2="100" stroke="currentColor" strokeOpacity="0.1" strokeWidth="1" strokeDasharray="4 4" className="text-on-surface" />
                <line x1="0" y1="150" x2="1000" y2="150" stroke="currentColor" strokeOpacity="0.1" strokeWidth="1" strokeDasharray="4 4" className="text-on-surface" />
                
                <path d="M 0 180 Q 200 170, 400 120 T 700 80 T 1000 20 L 1000 200 L 0 200 Z" fill="url(#chartGlow2)" className="text-primary" />
                <path d="M 0 180 Q 200 170, 400 120 T 700 80 T 1000 20" fill="none" stroke="currentColor" strokeWidth="3" className="text-primary" />
                
                <circle cx="400" cy="120" r="5" fill="currentColor" className="text-primary border-4 border-surface shadow-sm" />
                <circle cx="700" cy="80" r="5" fill="currentColor" className="text-primary border-4 border-surface shadow-sm" />
                <circle cx="1000" cy="20" r="6" fill="currentColor" className="text-secondary animate-pulse" />
              </svg>
            </div>
            <div className="flex justify-between text-[10px] font-mono text-on-surface-variant mt-2">
              <span>Năm 2020</span>
              <span>Năm 2022</span>
              <span>Năm 2024</span>
              <span>Hiện tại</span>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Actors (Đối tượng sử dụng) */}
      <section id="actors" className="relative z-10 max-w-7xl mx-auto w-full px-6 md:px-12 py-24 border-t border-outline-variant">
        <div className="text-center space-y-4 max-w-3xl mx-auto mb-16">
          <span className="text-sm font-bold uppercase tracking-wider text-secondary">Các Tác Nhân Chính</span>
          <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-on-surface">
            Nền tảng dành cho ai?
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Researcher */}
          <div className="glass-panel p-8 rounded-3xl bg-surface-container/60 border border-outline-variant flex flex-col items-center text-center shadow-md hover:shadow-xl hover:border-outline transition-all">
            <div className="w-16 h-16 rounded-full bg-secondary/10 border border-secondary/20 flex items-center justify-center mb-6 text-secondary">
              <Zap className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-on-surface mb-2">Nhà Nghiên Cứu (Researcher)</h3>
            <p className="text-sm text-on-surface-variant leading-relaxed">
              Phân tích xu hướng nghiên cứu chuyên sâu, theo dõi journal và keyword, khám phá các chủ đề mới nổi và xuất báo cáo thống kê.
            </p>
          </div>

          {/* Student / Lecturer */}
          <div className="glass-panel p-8 rounded-3xl bg-primary-container/20 border border-primary/20 flex flex-col items-center text-center relative overflow-hidden shadow-lg hover:shadow-xl hover:border-primary/40 transition-all">
            <div className="w-16 h-16 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center mb-6 relative z-10 text-primary">
              <GraduationCap className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-on-surface mb-2 relative z-10">Giảng Viên & Sinh Viên</h3>
            <p className="text-sm text-on-surface-variant leading-relaxed relative z-10">
              Tìm kiếm bài báo tham khảo, khám phá chủ đề phổ biến, lưu bài báo/keyword quan tâm và xem dashboard xu hướng cơ bản.
            </p>
          </div>

          {/* Admin */}
          <div className="glass-panel p-8 rounded-3xl bg-surface-container/60 border border-outline-variant flex flex-col items-center text-center shadow-md hover:shadow-xl hover:border-outline transition-all">
            <div className="w-16 h-16 rounded-full bg-tertiary/10 border border-tertiary/20 flex items-center justify-center mb-6 text-tertiary">
              <Settings className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-on-surface mb-2">Quản Trị Viên (Admin)</h3>
            <p className="text-sm text-on-surface-variant leading-relaxed">
              Quản lý tài khoản người dùng, cấu hình nguồn dữ liệu API học thuật, cập nhật dữ liệu đồng bộ và quản trị hệ thống.
            </p>
          </div>
        </div>
      </section>

      {/* 6. Footer CTA */}
      <section className="relative z-10 w-full bg-surface border-t border-outline-variant mt-12 py-24 px-6 text-center">
        <div className="max-w-4xl mx-auto space-y-8">
          <h2 className="font-display text-4xl sm:text-5xl font-extrabold text-on-surface">
            Bắt đầu khám phá xu hướng ngay hôm nay!
          </h2>
          <p className="text-on-surface-variant max-w-xl mx-auto text-base leading-relaxed">
            Tham gia nền tảng theo dõi xu hướng bài báo khoa học. 
            Cập nhật những công nghệ đột phá trong lĩnh vực Computer Science và AI.
          </p>

          <div className="pt-6">
            <Link
              to="/register"
              className="inline-flex items-center gap-3 px-8 py-4 rounded-xl bg-primary text-on-primary font-bold text-sm uppercase tracking-widest hover:brightness-110 shadow-lg shadow-primary/20 transition-all active:scale-95"
            >
              Đăng ký tài khoản miễn phí <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer Details */}
      <footer className="relative z-10 px-6 py-8 border-t border-outline-variant bg-surface-container text-center text-[10px] sm:text-xs text-on-surface-variant font-mono">
        <p className="mb-2"><strong>Dữ liệu:</strong> Metadata được trích xuất từ OpenAlex & Semantic Scholar thông qua API công khai.</p>
        <p>&copy; {new Date().getFullYear()} Scientific Journal Publication Trend Tracking System.</p>
      </footer>
    </div>
  );
}
