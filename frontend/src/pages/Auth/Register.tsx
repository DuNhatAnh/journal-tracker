import React, { useState, useEffect } from "react";
import { Mail, Lock, User, ChevronLeft, ArrowLeft, Eye, EyeOff } from "lucide-react";
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
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      navigate("/dashboard", { replace: true });
    }
  }, [navigate]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await api.post<{ message: string }>("/register", {
        name,
        email,
        password,
        password_confirmation: passwordConfirmation,
        role,
      });

      setSuccess(true);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Không thể đăng ký vào lúc này.");
    } finally {
      setLoading(false);
    }
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

      <div className="absolute top-[-10%] right-[-5%] w-[50%] h-[50%] bg-primary/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-5%] w-[40%] h-[40%] bg-secondary/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Main Column: Register Form (Always centered) */}
      <div className="w-full max-w-sm space-y-8 relative z-10">
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center mb-2">
            <Logo size={80} />
          </div>
          <h1 className="font-display text-4xl font-black text-primary tracking-tighter uppercase">SciTrend</h1>
          <p className="text-on-surface-variant font-medium text-center">Tạo tài khoản mới để theo dõi xu hướng xuất bản.</p>
        </div>

        {success ? (
          <div className="glass-panel p-8 rounded-2xl space-y-6 text-center animate-fade-in">
            <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto text-primary mb-4">
              <Mail className="w-8 h-8" />
            </div>
            <h2 className="font-display text-2xl font-bold text-on-surface">Đăng ký thành công!</h2>
            <p className="text-on-surface-variant text-sm leading-relaxed">
              Một email xác thực đã được gửi đến hòm thư <span className="font-bold text-primary">{email}</span>. 
              Vui lòng kiểm tra email và bấm vào đường dẫn đính kèm để kích hoạt tài khoản của bạn.
            </p>
            <div className="pt-4">
              <Link to="/login" className="gradient-btn py-3 px-6 rounded-xl font-display font-bold text-sm uppercase tracking-widest text-on-primary inline-flex items-center gap-2 group">
                Đi tới trang Đăng nhập
                <ArrowLeft className="w-4 h-4 rotate-180 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleRegister} className="glass-panel p-8 rounded-2xl space-y-6" autoComplete="off">
            {error && (
              <div className="p-3 text-xs bg-error-container/30 border border-error/50 text-error rounded-xl font-medium animate-shake">
                ⚠️ {error}
              </div>
            )}

            <div className="space-y-4">
             <div className="space-y-2">
                  <label className="font-mono text-[10px] text-on-surface-variant uppercase tracking-widest pl-1">Mật khẩu</label>
                  <div className="relative group">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-outline group-focus-within:text-primary transition-colors" />
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      autoComplete="new-password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-surface-container-low/50 border-2 border-outline-variant/30 rounded-xl py-3 pl-10 pr-10 text-on-surface focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all font-sans"
                    />
                    <button
                      type="button"
                      tabIndex={-1}
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface transition-colors cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

              <div className="space-y-2">
                <label className="font-mono text-[10px] text-on-surface-variant uppercase tracking-widest pl-1">Email</label>
                <div className="relative group">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-outline group-focus-within:text-primary transition-colors" />
                  <input
                    type="email"
                    required
                    autoComplete="off"
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
                      autoComplete="new-password"
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
                      type={showConfirmPassword ? "text" : "password"}
                      required
                      autoComplete="new-password"
                      placeholder="••••••••"
                      value={passwordConfirmation}
                      onChange={(e) => setPasswordConfirmation(e.target.value)}
                      className="w-full bg-surface-container-low/50 border-2 border-outline-variant/30 rounded-xl py-3 pl-10 pr-10 text-on-surface focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all font-sans"
                    />
                    <button
                      type="button"
                      tabIndex={-1}
                      onClick={() => setShowConfirmPassword((prev) => !prev)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface transition-colors cursor-pointer"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
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
                  <option value="researcher">Nhà nghiên cứu</option>
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
        )}

        {/* Guide Card (Floating next to the form on large screens, stacked below on mobile) */}
        <div className="w-full lg:w-[320px] xl:w-[350px] mt-8 lg:mt-0 lg:absolute lg:left-[calc(100%+32px)] lg:top-1/2 lg:-translate-y-1/2 z-10">
          <div className="glass-panel p-6 rounded-2xl space-y-6 text-left border border-white/5 bg-white/[0.02] shadow-xl h-fit">
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
  );
}
