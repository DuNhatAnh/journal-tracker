import React, { useState, useEffect } from "react";
import { Mail, Lock, ArrowRight, Chrome, ArrowLeft } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import { Logo } from "@/src/components/shared/Logo";
import { ThemeToggle } from "@/src/components/shared/ThemeToggle";
import { api } from "@/src/lib/api";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      navigate("/dashboard", { replace: true });
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const errorParam = params.get("error");
    if (errorParam) {
      setError(errorParam);
    }
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await api.post<{ token: string; user: any }>("/login", {
        email,
        password,
      });
      
      const role = response.user?.role;
      if (role !== "lecturer" && role !== "student" && role !== "researcher" && role !== "admin") {
        setError("Tài khoản không có quyền truy cập ứng dụng.");
        return;
      }
      
      localStorage.setItem("token", response.token);
      localStorage.setItem("user", JSON.stringify(response.user));
      navigate("/dashboard");
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Email hoặc mật khẩu không chính xác.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    const redirectUrl = window.location.origin.includes(':3000')
      ? window.location.origin.replace(':3000', ':8000') + '/api/auth/google/redirect'
      : '/api/auth/google/redirect';
    window.location.href = redirectUrl;
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 relative overflow-hidden transition-colors duration-500">
      <div className="absolute top-6 left-6 z-50">
        <Link to="/" className="flex items-center gap-2 text-xs font-semibold text-on-surface-variant hover:text-primary transition-colors bg-surface-container-low/50 hover:bg-surface-container-high/50 border border-outline-variant/30 px-3.5 py-2.5 rounded-xl backdrop-blur-md">
          <ArrowLeft className="w-4 h-4" /> Quay về Trang chủ
        </Link>
      </div>

      <div className="absolute top-6 right-6 z-50">
        <ThemeToggle />
      </div>
      
      {/* Background Decor */}
      <div className="absolute top-[-10%] right-[-5%] w-[50%] h-[50%] bg-primary/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-5%] w-[40%] h-[40%] bg-secondary/10 rounded-full blur-[120px] pointer-events-none" />
      
      {/* Main Column: Login Form (Always centered) */}
      <div className="w-full max-w-sm space-y-8 relative z-10">
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center mb-2">
            <Logo size={80} />
          </div>
          <h1 className="font-display text-4xl font-black text-primary tracking-tighter uppercase">SciTrend</h1>
          <p className="text-on-surface-variant font-medium text-center">Hệ Thống Theo Dõi Xu Hướng Xuất Bản Tạp Chí Khoa Học</p>
        </div>

        <div className="relative">
          <form onSubmit={handleLogin} className="glass-panel p-8 rounded-2xl space-y-6">
            {error && (
              <div className="p-3 text-xs bg-error-container/30 border border-error/50 text-error rounded-xl font-medium animate-shake">
                ⚠️ {error}
              </div>
            )}

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="font-mono text-[10px] text-on-surface-variant uppercase tracking-widest pl-1">Định danh</label>
                <div className="relative group">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-outline group-focus-within:text-primary transition-colors" />
                  <input 
                    type="email" 
                    required
                    placeholder="name@university.edu" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-surface-container-low/50 border-2 border-outline-variant/30 rounded-xl py-3 pl-10 pr-4 text-on-surface focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all font-sans"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="font-mono text-[10px] text-on-surface-variant uppercase tracking-widest pl-1">Mã bảo mật</label>
                <div className="relative group">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-outline group-focus-within:text-primary transition-colors" />
                  <input 
                    type="password" 
                    required
                    placeholder="••••••••••••" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-surface-container-low/50 border-2 border-outline-variant/30 rounded-xl py-3 pl-10 pr-4 text-on-surface focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all font-sans"
                  />
                </div>
              </div>
            </div>

            <button 
              type="submit"
              disabled={loading}
              className="w-full gradient-btn py-4 rounded-xl font-display font-bold uppercase tracking-widest text-on-primary flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Đang truy cập..." : "Truy cập hệ thống"}
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/5" /></div>
              <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-widest"><span className="bg-surface px-2 text-on-surface-variant">Đăng nhập liên kết</span></div>
            </div>

            <button 
              type="button" 
              onClick={handleGoogleLogin}
              className="w-full bg-white/5 border border-white/10 py-3 rounded-xl font-display text-xs font-bold uppercase tracking-widest hover:bg-white/10 transition-all flex items-center justify-center gap-2"
            >
              <Chrome className="w-4 h-4" /> Đăng nhập bằng Google
            </button>

            <div className="text-center text-sm text-on-surface-variant mt-4">
              Chưa có tài khoản?{' '}
              <Link to="/register" className="font-semibold text-primary hover:text-primary/80 transition-colors">
                Đăng ký ngay
              </Link>
            </div>
          </form>

          {/* Guide Card (Floating next to the form on large screens, stacked below on mobile) */}
          <div className="w-full lg:w-[320px] xl:w-[350px] mt-8 lg:mt-0 lg:absolute lg:left-[calc(100%+32px)] lg:top-1/2 lg:-translate-y-1/2 z-10">
            <div className="glass-panel p-8 rounded-2xl space-y-6 text-left border border-white/5 bg-white/[0.02] shadow-xl h-fit">
              <h3 className="font-display text-xs font-bold text-primary uppercase tracking-widest flex items-center gap-1.5 border-b border-white/5 pb-4">
                💡 Bạn nên chọn vai trò nào?
              </h3>
              <div className="space-y-5 text-xs text-on-surface-variant leading-relaxed">
                <div className="space-y-1">
                  <span className="font-bold text-secondary flex items-center gap-1.5">👨‍🎓 Sinh viên:</span>
                  <p className="pl-6 text-on-surface-variant">Dành cho các bạn tìm tài liệu học tập, làm tiểu luận. Bạn có thể tìm kiếm, xem và lưu trữ các bài báo yêu thích.</p>
                </div>
                <div className="space-y-1">
                  <span className="font-bold text-secondary flex items-center gap-1.5">👩‍🏫 Giảng viên:</span>
                  <p className="pl-6 text-on-surface-variant">Dành cho thầy cô giáo. Giúp tìm tài liệu giảng dạy nhanh chóng và lưu các bài báo chuyên ngành.</p>
                </div>
                <div className="space-y-1">
                  <span className="font-bold text-primary flex items-center gap-1.5">🔬 Nhà nghiên cứu:</span>
                  <p className="pl-6 text-on-surface-variant">Bản nâng cao có thêm tính năng xem **Xu hướng (Trending)** đề tài "hot" trên thế giới và **Theo dõi (Following)** các tác giả/tạp chí bạn quan tâm.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
