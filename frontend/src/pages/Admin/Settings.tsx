import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { Save, SlidersHorizontal, Loader2, Info, UserCheck, BookOpen } from "lucide-react";
import { api } from "@/src/lib/api";
import toast from "react-hot-toast";

type SystemSettings = {
  allow_registration: boolean;
  student_bookmark_limit: number;
  lecturer_bookmark_limit: number;
  researcher_bookmark_limit: number;
};

const roles = [
  { key: "student_bookmark_limit" as const, label: "Sinh viên", color: "text-tertiary" },
  { key: "lecturer_bookmark_limit" as const, label: "Giảng viên", color: "text-secondary" },
  { key: "researcher_bookmark_limit" as const, label: "Nhà nghiên cứu", color: "text-primary" },
];

export default function AdminSettings() {
  const [settings, setSettings] = useState<SystemSettings>({
    allow_registration: true,
    student_bookmark_limit: 50,
    lecturer_bookmark_limit: 200,
    researcher_bookmark_limit: 0,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [reason, setReason] = useState("");

  const currentUserStr = localStorage.getItem("user");
  const currentUser = currentUserStr ? JSON.parse(currentUserStr) : null;

  useEffect(() => {
    if (currentUser?.role === "admin") fetchSettings();
  }, []);

  if (currentUser?.role !== "admin") return <Navigate to="/dashboard" replace />;

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const response = await api.get<{ settings: SystemSettings }>("/admin/settings");
      if (response?.settings) setSettings(response.settings);
    } catch (err: any) {
      toast.error(err.message || "Không thể tải cấu hình hệ thống.", { position: "top-center" });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      toast.error("Vui lòng nhập lý do thay đổi cấu hình.", { position: "top-center" });
      return;
    }
    setSaving(true);
    try {
      await api.put("/admin/settings", { ...settings, reason });
      toast.success("Đã lưu cấu hình hệ thống!", { position: "top-center" });
      setReason("");
    } catch (err: any) {
      toast.error(err.message || "Lỗi lưu cấu hình.", { position: "top-center" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="flex items-center gap-3 pb-4 border-b border-white/5">
        <div className="p-2.5 rounded-xl bg-primary/10">
          <SlidersHorizontal className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h2 className="font-display text-2xl font-bold text-on-surface leading-tight">Cấu hình hệ thống</h2>
          <p className="text-xs text-on-surface-variant mt-0.5">Cài đặt vận hành toàn cục của nền tảng</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Side: Settings Form */}
        <div className="lg:col-span-7 space-y-6">
          {loading ? (
            <div className="h-72 rounded-2xl bg-white/5 animate-pulse" />
          ) : (
            <form onSubmit={handleSave} className="space-y-4">
              {/* Registration toggle */}
              <div className="glass-panel bg-surface border border-white/10 rounded-2xl p-5 flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-bold text-on-surface">Cho phép đăng ký tài khoản</p>
                  <p className="text-xs text-on-surface-variant mt-0.5">Tắt để ngừng nhận thành viên mới</p>
                </div>
                <button
                  type="button"
                  onClick={() => setSettings(prev => ({ ...prev, allow_registration: !prev.allow_registration }))}
                  className={`relative w-11 h-6 rounded-full flex-shrink-0 transition-colors duration-300 cursor-pointer ${
                    settings.allow_registration ? "bg-primary" : "bg-white/10"
                  }`}
                >
                  <span
                    className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all duration-300 ${
                      settings.allow_registration ? "left-6" : "left-1"
                    }`}
                  />
                </button>
              </div>

              {/* Bookmark limits */}
              <div className="glass-panel bg-surface border border-white/10 rounded-2xl p-5 space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-white/5">
                  <UserCheck className="w-4 h-4 text-secondary" />
                  <span className="text-xs font-bold text-on-surface uppercase tracking-wider">Hạn mức bookmark theo vai trò</span>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  {roles.map(({ key, label, color }) => (
                    <div key={key} className="space-y-2">
                      <label className={`text-[11px] font-bold ${color} block`}>{label}</label>
                      <input
                        type="number"
                        min="0"
                        value={settings[key]}
                        onChange={(e) =>
                          setSettings(prev => ({ ...prev, [key]: Math.max(0, parseInt(e.target.value) || 0) }))
                        }
                        className="w-full px-3 py-2 rounded-xl bg-background border border-white/10 text-on-surface text-sm font-semibold outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all"
                      />
                      <span className="text-[10px] text-on-surface-variant/70 block">
                        {settings[key] === 0 ? "Không giới hạn" : `${settings[key]} bài`}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="flex items-start gap-2 p-3 rounded-xl bg-primary/5 border border-primary/10">
                  <Info className="w-3.5 h-3.5 text-primary flex-shrink-0 mt-0.5" />
                  <p className="text-[11px] text-on-surface-variant leading-relaxed">
                    Nhập <b className="text-primary">0</b> để cho phép lưu không giới hạn.
                  </p>
                </div>
              </div>

              {/* Reason for change */}
              <div className="glass-panel bg-surface border border-white/10 rounded-2xl p-5 space-y-3">
                <div className="flex items-center gap-2 pb-2 border-b border-white/5">
                  <span className="text-xs font-bold text-on-surface uppercase tracking-wider">Lý do thay đổi cấu hình</span>
                </div>
                <textarea
                  required
                  rows={3}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Nhập lý do thay đổi để thông báo cho người dùng (bắt buộc)..."
                  className="w-full px-4 py-3 rounded-xl bg-background border border-white/10 text-on-surface text-sm outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all resize-none placeholder:text-on-surface-variant/50"
                />
              </div>

              {/* Save */}
              <button
                type="submit"
                disabled={saving}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-primary text-on-primary font-bold text-xs uppercase tracking-widest hover:bg-primary-container hover:shadow-lg hover:shadow-primary/30 transition-all cursor-pointer active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Đang lưu...</>
                ) : (
                  <><Save className="w-4 h-4" /> Lưu cấu hình</>
                )}
              </button>
            </form>
          )}
        </div>

        {/* Right Side: Guide / Instructions Panel */}
        <div className="lg:col-span-5 space-y-6 sticky top-[100px] self-start">
          <div className="glass-panel bg-surface border border-white/10 rounded-2xl p-6 space-y-6 text-left hover:border-primary/20 transition-all duration-300">
            <div className="flex items-center gap-2 pb-3 border-b border-white/5">
              <BookOpen className="w-5 h-5 text-primary" />
              <span className="font-display font-bold text-base text-on-surface uppercase tracking-wider">Hướng dẫn vận hành</span>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-xs font-bold text-secondary uppercase tracking-widest">
                  <span className="w-1.5 h-1.5 rounded-full bg-secondary" />
                  Đăng ký tài khoản
                </div>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  Bật/tắt khả năng đăng ký tài khoản mới trên hệ thống. Khi tắt, người dùng mới sẽ không thể đăng ký thành viên, tuy nhiên các tài khoản đã tồn tại vẫn có thể đăng nhập bình thường.
                </p>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-xs font-bold text-tertiary uppercase tracking-widest">
                  <span className="w-1.5 h-1.5 rounded-full bg-tertiary" />
                  Hạn mức Bookmark
                </div>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  Quy định số lượng bài viết tối đa mà mỗi nhóm vai trò được phép lưu trữ trong tài khoản của mình. 
                  Nhập <b className="text-primary">0</b> để cho phép lưu trữ không giới hạn đối với vai trò đó.
                </p>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-xs font-bold text-primary uppercase tracking-widest">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                  Ràng buộc thay đổi & Thông báo
                </div>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  Mỗi khi thay đổi hạn mức, bạn bắt buộc phải nhập lý do thay đổi cụ thể (tối thiểu 5 ký tự). 
                  Hệ thống sẽ tự động tạo thông báo gửi trực tiếp đến trang thông báo của các thành viên thuộc nhóm vai trò bị ảnh hưởng để bảo đảm tính rõ ràng và minh bạch.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
