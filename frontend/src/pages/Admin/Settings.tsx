import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { Save, SlidersHorizontal, Loader2, Info, UserCheck } from "lucide-react";
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
      toast.error(err.message || "Không thể tải cấu hình hệ thống.");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put("/admin/settings", settings);
      toast.success("Đã lưu cấu hình hệ thống!");
    } catch (err: any) {
      toast.error(err.message || "Lỗi lưu cấu hình.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-xl mr-auto space-y-6 pb-16">
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
  );
}
