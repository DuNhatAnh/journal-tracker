import { User, Bell, Palette, ShieldCheck, Mail, Lock, Smartphone, Github, Loader2 } from "lucide-react";
import { cn } from "@/src/lib/utils";
import { useState, useEffect } from "react";
import { api } from "@/src/lib/api";

type NotificationSettings = {
  notify_journal: boolean;
  notify_keyword: boolean;
  notify_trending: boolean;
};

export default function Settings() {
  const [activeTab, setActiveTab] = useState("Tài khoản");
  const [settings, setSettings] = useState<NotificationSettings>({
    notify_journal: true,
    notify_keyword: true,
    notify_trending: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const tabs = [
    { icon: User, label: "Tài khoản" },
    { icon: Bell, label: "Thông báo" },
    { icon: Palette, label: "Giao diện" },
    { icon: ShieldCheck, label: "Bảo mật" },
  ];

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const res = await api.get<NotificationSettings>("/settings");
      setSettings(res.data);
    } catch (err: any) {
      setError("Không thể tải cài đặt. Vui lòng thử lại sau.");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccessMsg(null);
      await api.put("/settings", settings);
      setSuccessMsg("Đã lưu cài đặt thành công.");
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setError("Có lỗi xảy ra khi lưu cài đặt.");
    } finally {
      setSaving(false);
    }
  };

  const renderProfileTab = () => (
    <div className="space-y-8">
      <section className="glass-panel p-10 rounded-2xl space-y-10">
        <header className="border-b border-white/5 pb-6">
          <h3 className="font-display text-2xl font-bold">Thông tin hồ sơ</h3>
        </header>

        <div className="flex flex-col sm:flex-row gap-10">
          <div className="w-32 h-32 rounded-2xl overflow-hidden border-2 border-white/10 group cursor-pointer relative flex-shrink-0">
            <img src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=2576&auto=format&fit=crop" className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
              <Palette className="w-6 h-6 text-white" />
            </div>
          </div>
          
          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant pl-1">Họ tên</label>
              <input className="w-full bg-surface-container-low border border-white/10 rounded-xl px-4 py-3 text-sm focus:ring-1 focus:ring-primary focus:border-primary outline-none" defaultValue="Elena Rostova" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant pl-1">Chức danh học thuật</label>
              <input className="w-full bg-surface-container-low border border-white/10 rounded-xl px-4 py-3 text-sm focus:ring-1 focus:ring-primary focus:border-primary outline-none" defaultValue="Nhà khoa học dữ liệu cao cấp" />
            </div>
          </div>
        </div>
      </section>

      <div className="flex justify-end gap-4 pt-4">
        <button className="px-10 py-4 glass-panel rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-white/5 transition-all text-on-surface-variant">Hủy bỏ</button>
        <button className="px-10 py-4 gradient-btn rounded-xl text-[10px] font-bold uppercase tracking-widest text-white shadow-2xl">Áp dụng thay đổi</button>
      </div>
    </div>
  );

  const renderNotificationsTab = () => (
    <div className="space-y-8">
      <section className="glass-panel p-10 rounded-2xl space-y-10">
        <header className="border-b border-white/5 pb-6">
          <h3 className="font-display text-2xl font-bold">Tùy chọn Thông báo</h3>
          <p className="text-on-surface-variant text-sm mt-2">Quản lý cách bạn nhận được thông tin cập nhật từ hệ thống.</p>
        </header>

        {loading ? (
          <div className="flex items-center gap-2 text-on-surface-variant">
            <Loader2 className="w-5 h-5 animate-spin" /> Đang tải cài đặt...
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between p-5 rounded-2xl border border-white/5 bg-white/5">
              <div className="flex-1 pr-6">
                <h4 className="text-sm font-bold">Tạp chí đang theo dõi</h4>
                <p className="text-sm text-on-surface-variant mt-1">Nhận thông báo khi có bài báo mới từ các tạp chí bạn quan tâm.</p>
              </div>
              <button 
                onClick={() => setSettings(s => ({ ...s, notify_journal: !s.notify_journal }))}
                className={cn("w-12 h-6 rounded-full relative flex items-center px-1 transition-colors", settings.notify_journal ? "bg-primary" : "bg-surface-container-low border border-white/10")}
              >
                <div className={cn("w-4 h-4 bg-white rounded-full transition-transform", settings.notify_journal ? "translate-x-6" : "translate-x-0")} />
              </button>
            </div>

            <div className="flex items-center justify-between p-5 rounded-2xl border border-white/5 bg-white/5">
              <div className="flex-1 pr-6">
                <h4 className="text-sm font-bold">Chủ đề & Từ khóa</h4>
                <p className="text-sm text-on-surface-variant mt-1">Nhận thông báo khi có bài báo mới thuộc các chủ đề bạn đang theo dõi.</p>
              </div>
              <button 
                onClick={() => setSettings(s => ({ ...s, notify_keyword: !s.notify_keyword }))}
                className={cn("w-12 h-6 rounded-full relative flex items-center px-1 transition-colors", settings.notify_keyword ? "bg-primary" : "bg-surface-container-low border border-white/10")}
              >
                <div className={cn("w-4 h-4 bg-white rounded-full transition-transform", settings.notify_keyword ? "translate-x-6" : "translate-x-0")} />
              </button>
            </div>

            <div className="flex items-center justify-between p-5 rounded-2xl border border-white/5 bg-white/5">
              <div className="flex-1 pr-6">
                <h4 className="text-sm font-bold text-tertiary">Xu hướng Hàng tuần</h4>
                <p className="text-sm text-on-surface-variant mt-1">Nhận bản tin tóm tắt các bài báo đang được cộng đồng quan tâm nhất trong tuần.</p>
              </div>
              <button 
                onClick={() => setSettings(s => ({ ...s, notify_trending: !s.notify_trending }))}
                className={cn("w-12 h-6 rounded-full relative flex items-center px-1 transition-colors", settings.notify_trending ? "bg-tertiary" : "bg-surface-container-low border border-white/10")}
              >
                <div className={cn("w-4 h-4 bg-white rounded-full transition-transform", settings.notify_trending ? "translate-x-6" : "translate-x-0")} />
              </button>
            </div>
          </div>
        )}
        
        {error && <p className="text-error text-sm mt-4 font-medium">{error}</p>}
        {successMsg && <p className="text-primary text-sm mt-4 font-medium">{successMsg}</p>}
      </section>

      <div className="flex justify-end gap-4 pt-4">
        <button 
          onClick={loadSettings}
          className="px-10 py-4 glass-panel rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-white/5 transition-all text-on-surface-variant"
        >
          Hủy bỏ
        </button>
        <button 
          onClick={handleSaveSettings}
          disabled={saving || loading}
          className="px-10 py-4 gradient-btn rounded-xl text-[10px] font-bold uppercase tracking-widest text-white shadow-2xl disabled:opacity-50 flex items-center gap-2"
        >
          {saving && <Loader2 className="w-4 h-4 animate-spin" />}
          Áp dụng thay đổi
        </button>
      </div>
    </div>
  );

  const renderComingSoon = () => (
    <section className="glass-panel p-10 rounded-2xl flex flex-col items-center justify-center min-h-[400px] text-center">
      <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-6">
        <ShieldCheck className="w-10 h-10 text-on-surface-variant opacity-50" />
      </div>
      <h3 className="font-display text-2xl font-bold">Đang phát triển</h3>
      <p className="text-on-surface-variant mt-2 max-w-sm">Tính năng này đang được chúng tôi xây dựng và sẽ sớm ra mắt trong thời gian tới.</p>
    </section>
  );

  return (
    <div className="flex flex-col md:flex-row gap-12 pb-20">
      <aside className="w-full md:w-64 space-y-8 flex-shrink-0">
         <div>
           <h2 className="font-display text-4xl font-bold">Cài đặt</h2>
           <p className="text-on-surface-variant mt-2 font-medium">Quản lý tùy chọn.</p>
         </div>

         <nav className="flex md:flex-col overflow-x-auto gap-2">
            {tabs.map((item, i) => (
              <button 
                key={i} 
                onClick={() => setActiveTab(item.label)}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl transition-all whitespace-nowrap",
                  activeTab === item.label ? "bg-primary-container/20 text-primary border border-primary/30 shadow-lg" : "text-on-surface-variant hover:bg-white/5"
                )}
              >
                <item.icon className="w-5 h-5" />
                <span className="text-sm font-bold uppercase tracking-widest">{item.label}</span>
              </button>
            ))}
         </nav>
      </aside>

      <div className="flex-1 max-w-4xl">
        {activeTab === "Tài khoản" && renderProfileTab()}
        {activeTab === "Thông báo" && renderNotificationsTab()}
        {(activeTab === "Giao diện" || activeTab === "Bảo mật") && renderComingSoon()}
      </div>
    </div>
  );
}
