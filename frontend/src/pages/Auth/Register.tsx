import React, { useState } from "react";
import { Mail, Lock, User, ChevronLeft } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import { Logo } from "@/src/components/shared/Logo";
import { ThemeToggle } from "@/src/components/shared/ThemeToggle";
import { api } from "@/src/lib/api";

export default function Register() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [role, setRole] = useState("lecturer");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await api.post<{ token: string; user: any }>("/register", {
        name,
        email,
        password,
        password_confirmation: passwordConfirmation,
        role,
      });

      localStorage.setItem("token", response.token);
      localStorage.setItem("user", JSON.stringify(response.user));
      navigate("/dashboard");
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Không thể đăng ký vào lúc này.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 relative overflow-hidden transition-colors duration-500">
      <div className="absolute top-6 right-6 z-50">
        <ThemeToggle />
      </div>

      <div className="absolute top-[-10%] right-[-5%] w-[50%] h-[50%] bg-primary/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-5%] w-[40%] h-[40%] bg-secondary/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-sm space-y-12 relative z-10">
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center mb-2">
            <Logo size={100} />
          </div>
          <h1 className="font-display text-4xl font-black text-primary tracking-tighter uppercase">SciTrend</h1>
          <p className="text-on-surface-variant font-medium text-center">Tạo tài khoản mới để theo dõi xu hướng xuất bản.</p>
        </div>

        <form onSubmit={handleRegister} className="glass-panel p-8 rounded-2xl space-y-6">
          {error && (
            <div className="p-3 text-xs bg-error-container/30 border border-error/50 text-error rounded-xl font-medium animate-shake">
              ⚠️ {error}
            </div>
          )}

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="font-mono text-[10px] text-on-surface-variant uppercase tracking-widest pl-1">Họ tên</label>
              <div className="relative group">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-outline group-focus-within:text-primary transition-colors" />
                <input
                  type="text"
                  required
                  placeholder="Nguyễn Văn A"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-surface-container-low/50 border-2 border-outline-variant/30 rounded-xl py-3 pl-10 pr-4 text-on-surface focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all font-sans"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="font-mono text-[10px] text-on-surface-variant uppercase tracking-widest pl-1">Email</label>
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

            <div className="grid gap-4">
              <div className="space-y-2">
                <label className="font-mono text-[10px] text-on-surface-variant uppercase tracking-widest pl-1">Mật khẩu</label>
                <div className="relative group">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-outline group-focus-within:text-primary transition-colors" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-surface-container-low/50 border-2 border-outline-variant/30 rounded-xl py-3 pl-10 pr-4 text-on-surface focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all font-sans"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="font-mono text-[10px] text-on-surface-variant uppercase tracking-widest pl-1">Xác nhận mật khẩu</label>
                <div className="relative group">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-outline group-focus-within:text-primary transition-colors" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={passwordConfirmation}
                    onChange={(e) => setPasswordConfirmation(e.target.value)}
                    className="w-full bg-surface-container-low/50 border-2 border-outline-variant/30 rounded-xl py-3 pl-10 pr-4 text-on-surface focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all font-sans"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="font-mono text-[10px] text-on-surface-variant uppercase tracking-widest pl-1">Vai trò</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full bg-surface-container-low/50 border-2 border-outline-variant/30 rounded-xl py-3 px-4 text-on-surface focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all font-sans"
              >
                <option value="lecturer">Giảng viên</option>
                <option value="student">Sinh viên</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full gradient-btn py-4 rounded-xl font-display font-bold uppercase tracking-widest text-on-primary flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Đang tạo tài khoản..." : "Tạo tài khoản"}
            <ChevronLeft className="w-4 h-4 -rotate-180" />
          </button>

          <div className="text-center text-sm text-on-surface-variant">
            Đã có tài khoản?{' '}
            <Link to="/login" className="font-semibold text-primary hover:text-primary/80 transition-colors">
              Đăng nhập ngay
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
