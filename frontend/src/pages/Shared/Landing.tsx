import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { 
  ArrowRight, Search, Users, Database, 
  Sparkles, AlertTriangle, Zap, Activity, 
  BookOpenText, LineChart, BellRing, Bookmark,
  GraduationCap, Settings, UserPlus
} from "lucide-react";
import { Logo } from "@/src/components/shared/Logo";
import { ThemeToggle } from "@/src/components/shared/ThemeToggle";

export default function Landing() {
  const token = localStorage.getItem("token");
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTopic, setActiveTopic] = useState("dl");

  // Real Computer Science publication volume trends data (mượt mà với đường cong Q và T)
  const topicsData: Record<string, {
    color: string;
    linePath: string;
    areaPath: string;
    points: { year: number; val: number; x: number; y: number }[];
  }> = {
    dl: {
      color: "#2563EB", // Primary Blue
      linePath: "M 0,162 Q 250,145 500,95 T 1000,32",
      areaPath: "M 0,162 Q 250,145 500,95 T 1000,32 L 1000,200 L 0,200 Z",
      points: [
        { year: 2020, val: 12400, x: 0, y: 162 },
        { year: 2022, val: 24500, x: 500, y: 95 },
        { year: 2026, val: 56200, x: 1000, y: 32 },
      ]
    },
    cyber: {
      color: "#0891B2", // Secondary Cyan
      linePath: "M 0,145 Q 250,135 500,118 T 1000,75",
      areaPath: "M 0,145 Q 250,135 500,118 T 1000,75 L 1000,200 L 0,200 Z",
      points: [
        { year: 2020, val: 8200, x: 0, y: 145 },
        { year: 2022, val: 14800, x: 500, y: 118 },
        { year: 2026, val: 29800, x: 1000, y: 75 },
      ]
    },
    cloud: {
      color: "#059669", // Tertiary Emerald
      linePath: "M 0,175 Q 250,158 500,132 T 1000,105",
      areaPath: "M 0,175 Q 250,158 500,132 T 1000,105 L 1000,200 L 0,200 Z",
      points: [
        { year: 2020, val: 4100, x: 0, y: 175 },
        { year: 2022, val: 9200, x: 500, y: 132 },
        { year: 2026, val: 18400, x: 1000, y: 105 },
      ]
    }
  };

  const activeTopicData = topicsData[activeTopic] || topicsData.dl;

  useEffect(() => {
    if (token) {
      navigate("/dashboard", { replace: true });
    }
  }, [token, navigate]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  // Typing Effect Hook for search placeholder
  const placeholderPhrases = [
    "How can we help you?",
    "Bạn muốn tìm xu hướng AI mới nhất?",
    "Tìm kiếm bài báo khoa học theo từ khóa...",
    "Khám phá chủ đề Computer Science nổi bật...",
    "Tìm kiếm theo Tác giả hoặc Tạp chí..."
  ];

  const [placeholder, setPlaceholder] = useState("");
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const currentPhrase = placeholderPhrases[phraseIndex];
    let timer: any;

    if (isDeleting) {
      timer = setTimeout(() => {
        setPlaceholder(currentPhrase.substring(0, charIndex - 1));
        setCharIndex((prev) => prev - 1);
      }, 30);
    } else {
      timer = setTimeout(() => {
        setPlaceholder(currentPhrase.substring(0, charIndex + 1));
        setCharIndex((prev) => prev + 1);
      }, 70);
    }

    if (!isDeleting && charIndex === currentPhrase.length) {
      timer = setTimeout(() => setIsDeleting(true), 2500);
    } else if (isDeleting && charIndex === 0) {
      setIsDeleting(false);
      setPhraseIndex((prev) => (prev + 1) % placeholderPhrases.length);
    }

    return () => clearTimeout(timer);
  }, [charIndex, isDeleting, phraseIndex]);

  return (
    <div className="min-h-screen bg-background text-on-background font-sans selection:bg-primary/30 selection:text-primary overflow-x-hidden relative flex flex-col justify-between scroll-smooth transition-colors duration-500">

      {/* ═══════════════════════════════════════════════════════════
           ANIMATED AURORA MESH GRADIENT BACKGROUND
           6 glowing orbs mỗi cái chuyển động độc lập theo keyframe
           riêng, tạo hiệu ứng aurora mesh cực kỳ đẹp mắt và thư giãn
      ═══════════════════════════════════════════════════════════ */}
      <style>{`
        /* ── Animation keyframes cho 6 Aurora Orbs ── */
        @keyframes aurora-1 {
          0%   { transform: translate(0%, 0%)    scale(1);    }
          25%  { transform: translate(18%, -12%) scale(1.15); }
          50%  { transform: translate(30%, 8%)   scale(0.9);  }
          75%  { transform: translate(10%, 20%)  scale(1.1);  }
          100% { transform: translate(0%, 0%)    scale(1);    }
        }
        @keyframes aurora-2 {
          0%   { transform: translate(0%, 0%)     scale(1);    }
          33%  { transform: translate(-20%, 15%)  scale(1.2);  }
          66%  { transform: translate(15%, -20%)  scale(0.85); }
          100% { transform: translate(0%, 0%)     scale(1);    }
        }
        @keyframes aurora-3 {
          0%   { transform: translate(0%, 0%)    scale(0.95); }
          20%  { transform: translate(25%, 15%)  scale(1.1);  }
          40%  { transform: translate(-10%, 25%) scale(1.2);  }
          60%  { transform: translate(-25%, -5%) scale(0.9);  }
          80%  { transform: translate(10%, -20%) scale(1.05); }
          100% { transform: translate(0%, 0%)    scale(0.95); }
        }
        @keyframes aurora-4 {
          0%   { transform: translate(0%, 0%)    scale(1);    }
          30%  { transform: translate(-15%, -18%) scale(1.3); }
          60%  { transform: translate(20%, -10%)  scale(0.8); }
          100% { transform: translate(0%, 0%)    scale(1);    }
        }
        @keyframes aurora-5 {
          0%   { transform: translate(0%, 0%)   scale(1.1);  }
          40%  { transform: translate(-20%, 20%) scale(0.85); }
          80%  { transform: translate(15%, -15%) scale(1.2);  }
          100% { transform: translate(0%, 0%)   scale(1.1);  }
        }
        @keyframes aurora-6 {
          0%   { transform: translate(0%, 0%)    scale(1);    }
          25%  { transform: translate(22%, -8%)  scale(0.9);  }
          50%  { transform: translate(-8%, 22%)  scale(1.15); }
          75%  { transform: translate(-18%, -15%) scale(0.95);}
          100% { transform: translate(0%, 0%)    scale(1);    }
        }
        .aurora-orb-1 { animation: aurora-1 26s ease-in-out infinite; }
        .aurora-orb-2 { animation: aurora-2 32s ease-in-out infinite; }
        .aurora-orb-3 { animation: aurora-3 40s ease-in-out infinite; }
        .aurora-orb-4 { animation: aurora-4 22s ease-in-out infinite; }
        .aurora-orb-5 { animation: aurora-5 35s ease-in-out infinite; }
        .aurora-orb-6 { animation: aurora-6 28s ease-in-out infinite; }

        /* ── Utility animations giữ nguyên cho các phần khác ── */
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50%       { transform: translateY(-15px) rotate(2deg); }
        }
        @keyframes gradient-x {
          0%, 100% { background-position: 0% 50%; }
          50%      { background-position: 100% 50%; }
        }
        .animate-float        { animation: float 6s ease-in-out infinite; }
        .bg-gradient-animate  { background-size: 200% 200%; animation: gradient-x 15s ease infinite; }
      `}</style>

      {/* Aurora Mesh Gradient — 6 orbs phủ toàn màn hình, luôn nằm dưới cùng */}
      <div aria-hidden="true" className="fixed inset-0 overflow-hidden pointer-events-none" style={{ zIndex: -1 }}>
        {/* Orb 1 — Slate Blue: top-left lớn, primary */}
        <div className="aurora-orb-1 absolute -top-[30%] -left-[15%]
          w-[70vw] h-[70vw] max-w-[800px] max-h-[800px] rounded-full
          bg-[radial-gradient(ellipse_at_center,_rgba(37,99,235,0.18)_0%,_transparent_70%)]
          blur-[90px]" />

        {/* Orb 2 — Teal / Cyan: top-right, secondary */}
        <div className="aurora-orb-2 absolute -top-[10%] -right-[20%]
          w-[65vw] h-[65vw] max-w-[750px] max-h-[750px] rounded-full
          bg-[radial-gradient(ellipse_at_center,_rgba(8,145,178,0.15)_0%,_transparent_70%)]
          blur-[110px]" />

        {/* Orb 3 — Indigo / Violet: center, depth */}
        <div className="aurora-orb-3 absolute top-[25%] left-[25%]
          w-[55vw] h-[55vw] max-w-[650px] max-h-[650px] rounded-full
          bg-[radial-gradient(ellipse_at_center,_rgba(99,102,241,0.1)_0%,_transparent_65%)]
          blur-[100px]" />

        {/* Orb 4 — Emerald Green: bottom-left, tertiary accent */}
        <div className="aurora-orb-4 absolute -bottom-[20%] -left-[10%]
          w-[60vw] h-[60vw] max-w-[700px] max-h-[700px] rounded-full
          bg-[radial-gradient(ellipse_at_center,_rgba(5,150,105,0.1)_0%,_transparent_68%)]
          blur-[120px]" />

        {/* Orb 5 — Slate / Steel: bottom-right, neutral cool tone */}
        <div className="aurora-orb-5 absolute -bottom-[15%] -right-[15%]
          w-[58vw] h-[58vw] max-w-[680px] max-h-[680px] rounded-full
          bg-[radial-gradient(ellipse_at_center,_rgba(100,116,139,0.12)_0%,_transparent_70%)]
          blur-[130px]" />

        {/* Orb 6 — Sky Blue: mid-right, fill gaps */}
        <div className="aurora-orb-6 absolute top-[50%] right-[10%]
          w-[45vw] h-[45vw] max-w-[550px] max-h-[550px] rounded-full
          bg-[radial-gradient(ellipse_at_center,_rgba(56,189,248,0.08)_0%,_transparent_65%)]
          blur-[100px]" />
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
                  className="flex items-center gap-2 bg-primary text-on-primary px-4 py-2 rounded-xl font-bold text-sm transition-all hover:brightness-110 active:scale-95 shadow-sm"
                >
                  <UserPlus className="w-4 h-4" />
                  Đăng ký
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* 2. Hero Section - Centered Layout */}
      <section className="relative z-10 max-w-6xl mx-auto w-full pt-32 md:pt-40 pb-20 px-6 md:px-12 flex flex-col items-center text-center">
        
        <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-secondary/10 border border-secondary/20 text-secondary text-xs sm:text-sm font-bold uppercase tracking-wider shadow-sm mb-8">
          <Database className="w-4 h-4" /> Đồng bộ Metadata từ OpenAlex
        </div>

        <h1 className="font-display text-4xl sm:text-5xl md:text-7xl font-extrabold tracking-tight leading-[1.15] text-on-surface mb-6">
          Scientific Journal Publication <br />
          <span className="bg-gradient-to-r from-primary via-tertiary to-secondary bg-clip-text text-transparent bg-gradient-animate pb-2">Trend Tracking System</span>
        </h1>
        
        <p className="text-base sm:text-lg md:text-xl text-on-surface-variant leading-relaxed max-w-3xl mb-12">
          Hệ thống theo dõi xu hướng xuất bản học thuật. <strong className="text-on-surface">Tìm kiếm và phân tích trực quan</strong> hàng ngàn bài báo Khoa học Máy tính (Computer Science) theo thời gian thực.
        </p>

        {/* BIG Dynamic Search Bar */}
        <form onSubmit={handleSearch} className="w-full max-w-3xl relative group mb-20">
          <div className="absolute -inset-1 bg-gradient-to-r from-primary via-secondary to-tertiary rounded-3xl blur opacity-30 group-hover:opacity-60 transition duration-500 bg-gradient-animate"></div>
          <div className="relative flex items-center bg-surface border-2 border-outline-variant/50 backdrop-blur-2xl rounded-3xl p-2 pl-6 shadow-2xl">
            <Search className="w-7 h-7 text-primary" />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={placeholder} 
              className="flex-1 bg-transparent border-none text-on-surface px-5 py-5 outline-none placeholder:text-on-surface-variant/70 font-semibold text-lg sm:text-xl w-full" 
            />
            <button 
              type="submit"
              className="hidden sm:flex items-center gap-3 bg-gradient-to-r from-primary to-secondary hover:brightness-110 text-on-primary px-10 py-5 rounded-2xl font-bold uppercase tracking-widest text-sm transition-all active:scale-95 shadow-lg shrink-0 cursor-pointer"
            >
              Khám Phá <ArrowRight className="w-5 h-5" />
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
          <div className="glass-panel p-6 rounded-3xl bg-surface-container-high/80 border border-outline-variant relative overflow-hidden shadow-2xl flex flex-col justify-between min-h-[380px]">
            {/* Animated Wave Background */}
            <div className="absolute inset-0 pointer-events-none opacity-20 z-0 overflow-hidden">
              <svg className="absolute w-[200%] h-full top-0 left-0 animate-wave-flow" viewBox="0 0 1200 400" preserveAspectRatio="none">
                <path d="M0,150 C150,200 350,100 500,150 C650,200 850,100 1000,150 C1150,200 1250,150 1300,150 L1300,400 L0,400 Z" fill="url(#waveGrad1)" />
                <path d="M0,180 C200,120 400,220 600,180 C800,140 1000,220 1200,180 L1200,400 L0,400 Z" fill="url(#waveGrad2)" />
              </svg>
              <svg className="absolute w-[200%] h-full top-0 left-0 animate-wave-flow-slow" viewBox="0 0 1200 400" preserveAspectRatio="none">
                <path d="M0,220 C300,180 500,260 800,220 C1100,180 1200,240 1300,220 L1300,400 L0,400 Z" fill="url(#waveGrad3)" />
              </svg>
              <defs>
                <linearGradient id="waveGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="transparent" />
                </linearGradient>
                <linearGradient id="waveGrad2" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="var(--secondary)" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="transparent" />
                </linearGradient>
                <linearGradient id="waveGrad3" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="var(--tertiary)" stopOpacity="0.15" />
                  <stop offset="100%" stopColor="transparent" />
                </linearGradient>
              </defs>
            </div>

            <style>{`
              @keyframes waveFlow {
                0% { transform: translateX(0) translateY(0); }
                50% { transform: translateX(-25%) translateY(10px); }
                100% { transform: translateX(0) translateY(0); }
              }
              @keyframes waveFlowSlow {
                0% { transform: translateX(-15%) translateY(5px); }
                50% { transform: translateX(10%) translateY(-5px); }
                100% { transform: translateX(-15%) translateY(5px); }
              }
              .animate-wave-flow { animation: waveFlow 18s ease-in-out infinite; }
              .animate-wave-flow-slow { animation: waveFlowSlow 25s ease-in-out infinite; }
            `}</style>

            <div className="relative z-10 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/5 pb-4">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-secondary animate-pulse" />
                  <h3 className="text-lg font-bold text-on-surface">Xu hướng công bố khoa học</h3>
                </div>
                {/* Topic Selector Tabs */}
                <div className="flex items-center gap-1.5 bg-white/5 p-1 rounded-xl border border-white/5">
                  {[
                    { id: "dl", label: "Trí tuệ nhân tạo", color: "text-primary" },
                    { id: "cyber", label: "An ninh mạng", color: "text-secondary" },
                    { id: "cloud", label: "Điện toán đám mây", color: "text-tertiary" },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveTopic(tab.id)}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                        activeTopic === tab.id
                          ? "bg-white/10 text-on-surface shadow-sm"
                          : "text-on-surface-variant hover:text-on-surface"
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Dynamic Interactive SVG Chart */}
              <div className="w-full h-44 relative mt-2">
                <svg className="w-full h-full overflow-visible" viewBox="0 0 1000 200" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="chartAreaGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={activeTopicData.color} stopOpacity="0.35" />
                      <stop offset="100%" stopColor={activeTopicData.color} stopOpacity="0.0" />
                    </linearGradient>
                  </defs>
                  
                  {/* Grid Lines */}
                  <line x1="0" y1="50" x2="1000" y2="50" stroke="currentColor" strokeOpacity="0.05" strokeWidth="1" strokeDasharray="4 4" className="text-on-surface" />
                  <line x1="0" y1="100" x2="1000" y2="100" stroke="currentColor" strokeOpacity="0.05" strokeWidth="1" strokeDasharray="4 4" className="text-on-surface" />
                  <line x1="0" y1="150" x2="1000" y2="150" stroke="currentColor" strokeOpacity="0.05" strokeWidth="1" strokeDasharray="4 4" className="text-on-surface" />
                  
                  {/* Filled Area */}
                  <path
                    d={activeTopicData.areaPath}
                    fill="url(#chartAreaGrad)"
                    className="transition-all duration-700 ease-in-out"
                  />
                  
                  {/* Smooth Trend Line */}
                  <path
                    d={activeTopicData.linePath}
                    fill="none"
                    stroke={activeTopicData.color}
                    strokeWidth="3.5"
                    className="transition-all duration-700 ease-in-out"
                  />
                  
                  {/* Interactive/Highlight Circles */}
                  {activeTopicData.points.map((pt, i) => (
                    <g key={i} className="group/node cursor-pointer">
                      <circle
                        cx={pt.x}
                        cy={pt.y}
                        r="5"
                        fill={activeTopicData.color}
                        stroke="var(--surface)"
                        strokeWidth="2.5"
                        className="transition-all duration-300 group-hover/node:r-7"
                      />
                      <circle
                        cx={pt.x}
                        cy={pt.y}
                        r="14"
                        fill={activeTopicData.color}
                        fillOpacity="0"
                        className="group-hover/node:fill-opacity-10 transition-all duration-300"
                      />
                      {/* Tooltip on Hover */}
                      <foreignObject
                        x={pt.x - 50}
                        y={pt.y - 45}
                        width="100"
                        height="35"
                        className="opacity-0 group-hover/node:opacity-100 transition-opacity duration-200 pointer-events-none"
                      >
                        <div className="bg-surface-container border border-outline-variant/50 rounded-lg p-1 text-center shadow-lg">
                          <p className="text-[9px] font-black text-on-surface leading-none">{pt.val} bài</p>
                          <p className="text-[7px] text-on-surface-variant font-mono leading-none mt-0.5">{pt.year}</p>
                        </div>
                      </foreignObject>
                    </g>
                  ))}
                </svg>
              </div>

              <div className="flex justify-between text-[10px] font-mono text-on-surface-variant/80 border-t border-white/5 pt-3">
                {activeTopicData.points.map((pt, i) => (
                  <span key={i}>Năm {pt.year}</span>
                ))}
              </div>


            </div>
          </div>
        </div>
      </section>

      {/* 4.5 Network Visualization Showcase Section */}
      <section className="relative z-10 max-w-7xl mx-auto w-full px-6 md:px-12 py-24 border-t border-outline-variant">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left: Content Description */}
          <div className="lg:col-span-5 space-y-6 text-left">
            <span className="text-sm font-bold uppercase tracking-wider text-tertiary">Mạng Lưới Tri Thức</span>
            <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-on-surface leading-tight">
              Khám phá mối tương quan học thuật 3D
            </h2>
            <p className="text-on-surface-variant text-base leading-relaxed">
              SciTrend mô hình hóa hàng ngàn bài báo khoa học và mối liên kết đồng tác giả, trích dẫn, và tạp chí xuất bản. Nhờ đó, giảng viên và nhà nghiên cứu có thể phát hiện các khoảng trống nghiên cứu (Research Gaps) và cơ hội hợp tác mới một cách khách quan.
            </p>
            <div className="pt-2 flex flex-wrap gap-2.5">
              <span className="px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-semibold text-on-surface-variant">
                # Mạng lưới đồng tác giả
              </span>
              <span className="px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-semibold text-on-surface-variant">
                # Tương quan trích dẫn
              </span>
              <span className="px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-semibold text-on-surface-variant">
                # Xu hướng nổi bật CS
              </span>
            </div>
          </div>

          {/* Right: Network visualization mockup */}
          <div className="lg:col-span-7 relative group">
            {/* Glowing blur background */}
            <div className="absolute -inset-4 bg-gradient-to-r from-tertiary via-secondary to-primary rounded-3xl blur-2xl opacity-20 group-hover:opacity-45 transition duration-700"></div>
            
            <div className="relative glass-panel rounded-3xl border border-white/10 overflow-hidden shadow-2xl bg-surface-container-high/40">
              <img 
                src="/scientific_trends_visualization.png" 
                alt="Scientific Trends Network Visualization" 
                className="w-full h-auto object-cover opacity-90 group-hover:scale-[1.01] transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-transparent to-transparent flex items-end p-6">
                <div className="text-left">
                  <p className="text-xs font-mono text-tertiary uppercase tracking-widest">SciTrend Analytics Engine</p>
                  <p className="text-sm font-bold text-white mt-1">Trực quan hóa mạng lưới liên kết học thuật đa chiều</p>
                </div>
              </div>
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
            Cập nhật những công nghệ đột phá trong lĩnh vực Computer Science (Khoa học Máy tính).
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
        <p className="mb-2"><strong>Dữ liệu:</strong> Metadata được trích xuất từ OpenAlex thông qua API công khai.</p>
        <p>&copy; {new Date().getFullYear()} Scientific Journal Publication Trend Tracking System.</p>
      </footer>
    </div>
  );
}
