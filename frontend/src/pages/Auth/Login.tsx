import React from "react";
import { Mail, Lock, ArrowRight, Github } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import { Logo } from "@/src/components/shared/Logo";
import { ThemeToggle } from "@/src/components/shared/ThemeToggle";

import { useState } from "react";
import { api } from "@/src/lib/api";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 relative overflow-hidden transition-colors duration-500">
      <div className="absolute top-6 right-6 z-50">
        <ThemeToggle />
      </div>
      
      {/* Background Decor */}
      <div className="absolute top-[-10%] right-[-5%] w-[50%] h-[50%] bg-primary/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-5%] w-[40%] h-[40%] bg-secondary/10 rounded-full blur-[120px] pointer-events-none" />
      
      <div className="w-full max-w-sm space-y-12 relative z-10">
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center mb-2">
            <Logo size={100} />
          </div>
          <h1 className="font-display text-4xl font-black text-primary tracking-tighter uppercase">SciTrend</h1>
          <p className="text-on-surface-variant font-medium text-center">Hệ Thống Theo Dõi Xu Hướng Xuất Bản Tạp Chí Khoa Học</p>
        </div>

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
            onClick={() => setError("Phương thức đăng nhập SSO chưa được hỗ trợ.")}
            className="w-full bg-white/5 border border-white/10 py-3 rounded-xl font-display text-xs font-bold uppercase tracking-widest hover:bg-white/10 transition-all flex items-center justify-center gap-2"
          >
            <Github className="w-4 h-4" /> SSO Học thuật
          </button>

          <div className="text-center text-sm text-on-surface-variant mt-4">
            Chưa có tài khoản?{' '}
            <Link to="/register" className="font-semibold text-primary hover:text-primary/80 transition-colors">
              Đăng ký ngay
            </Link>
          </div>
        </form>

        {/* Removed footer info */}
      </div>
    </div>
  );
}
