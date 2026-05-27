import { User, Bell, Palette, ShieldCheck, Mail, Lock, Smartphone, Github, Loader2, Trash2 } from "lucide-react";
import { cn } from "@/src/lib/utils";
import { useState, useEffect } from "react";
import { api } from "@/src/lib/api";
import toast from "react-hot-toast";

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
  const [profile, setProfile] = useState({
    name: "",
    academic_title: "",
    email: "",
    dob: "",
    phone: "",
    gender: "",
    institution: "",
    bio: "",
    website: "",
    avatar: ""
  });
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  
  const [passwords, setPasswords] = useState({
    current_password: "",
    password: "",
    password_confirmation: ""
  });
  const [savingPassword, setSavingPassword] = useState(false);
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingAvatar, setDeletingAvatar] = useState(false);

  const tabs = [
    { icon: User, label: "Tài khoản" },
    { icon: ShieldCheck, label: "Bảo mật" },
  ];

  useEffect(() => {
    loadSettings();
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const res = await api.get<any>("/me");
      const u = res;
      setProfile({
        name: u.name || "",
        academic_title: u.academic_title || "",
        email: u.email || "",
        dob: u.dob || "",
        phone: u.phone || "",
        gender: u.gender || "",
        institution: u.institution || "",
        bio: u.bio || "",
        website: u.website || "",
        avatar: u.avatar || ""
      });
      localStorage.setItem("user", JSON.stringify(u));
    } catch (e) {
      console.error("Failed to load profile", e);
    }
  };

  const loadSettings = async () => {
    try {
      setLoading(true);
      const res = await api.get<NotificationSettings>("/settings");
      setSettings(res);
    } catch (err: any) {
      toast.error("Không thể tải cài đặt. Vui lòng thử lại sau.", { position: "top-center" });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    try {
      setSaving(true);
      await api.put("/settings", settings);
      toast.success("Đã lưu cài đặt thành công.", { position: "top-center" });
    } catch (err: any) {
      toast.error("Có lỗi xảy ra khi lưu cài đặt.", { position: "top-center" });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveProfile = async () => {
    try {
      setSaving(true);
      
      const formData = new FormData();
      Object.entries(profile).forEach(([key, value]) => {
        if (value && key !== 'avatar') formData.append(key, value);
      });
      
      if (avatarFile) {
        formData.append("avatar", avatarFile);
      }
      
      const res = await api.post<any>("/profile", formData);
      
      localStorage.setItem("user", JSON.stringify(res));
      toast.success("Đã cập nhật hồ sơ thành công.", { position: "top-center" });
      setTimeout(() => window.location.reload(), 1500); // Reload to update Sidebar avatar & name
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Có lỗi xảy ra khi lưu hồ sơ.", { position: "top-center" });
    } finally {
      setSaving(false);
    }
  };

  const handleSavePassword = async () => {
    if (passwords.password !== passwords.password_confirmation) {
      toast.error("Mật khẩu mới không khớp.", { position: "top-center" });
      return;
    }
    try {
      setSavingPassword(true);
      await api.post("/password", passwords);
      toast.success("Đổi mật khẩu thành công.", { position: "top-center" });
      setPasswords({
        current_password: "",
        password: "",
        password_confirmation: ""
      });
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Có lỗi xảy ra khi đổi mật khẩu.", { position: "top-center" });
    } finally {
      setSavingPassword(false);
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleDeleteAvatar = async () => {
    if (!profile.avatar && !avatarPreview) return;
    // Nếu chưa lưu (chỉ preview mới chọn), chỉ xóa local
    if (avatarPreview && !profile.avatar) {
      setAvatarFile(null);
      setAvatarPreview(null);
      return;
    }
    try {
      setDeletingAvatar(true);
      const res = await api.delete<any>('/avatar');
      setProfile(prev => ({ ...prev, avatar: '' }));
      setAvatarFile(null);
      setAvatarPreview(null);
      localStorage.setItem('user', JSON.stringify(res));
      toast.success('Đã xóa ảnh đại diện.', { position: 'top-center' });
    } catch {
      toast.error('Không thể xóa ảnh. Vui lòng thử lại.', { position: 'top-center' });
    } finally {
      setDeletingAvatar(false);
    }
  };

  const renderProfileTab = () => (
    <div className="space-y-8">
      <section className="glass-panel p-10 rounded-2xl space-y-10">
        <header className="border-b border-white/5 pb-6">
          <h3 className="font-display text-2xl font-bold">Thông tin hồ sơ</h3>
        </header>

        <div className="flex flex-col md:flex-row gap-10">
          {/* Avatar + nút xóa */}
          <div className="flex flex-col items-center gap-3 flex-shrink-0">
            <div className="w-32 h-32 rounded-2xl overflow-hidden border-2 border-white/10 group cursor-pointer relative bg-surface-container">
              <input type="file" accept="image/*" onChange={handleAvatarChange} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
              {(avatarPreview || profile.avatar) ? (
                <img
                  src={avatarPreview || `/api/storage/${profile.avatar.replace(/^\/?(storage\/)?/, '')}`}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-primary font-bold text-4xl bg-primary/10">
                  {profile.name ? profile.name.substring(0, 2).toUpperCase() : "U"}
                </div>
              )}
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity pointer-events-none">
                <Palette className="w-6 h-6 text-white" />
              </div>
            </div>
            {(avatarPreview || profile.avatar) && (
              <button
                type="button"
                onClick={handleDeleteAvatar}
                disabled={deletingAvatar}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest text-error border border-error/30 bg-error/5 hover:bg-error/15 transition-all disabled:opacity-50"
              >
                {deletingAvatar ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                Xóa ảnh
              </button>
            )}
          </div>
          
          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant pl-1">Họ tên</label>
              <input value={profile.name} onChange={e => setProfile({...profile, name: e.target.value})} className="w-full bg-surface-container-low border border-white/10 rounded-xl px-4 py-3 text-sm focus:ring-1 focus:ring-primary focus:border-primary outline-none" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant pl-1">Email</label>
              <input type="email" value={profile.email} onChange={e => setProfile({...profile, email: e.target.value})} className="w-full bg-surface-container-low border border-white/10 rounded-xl px-4 py-3 text-sm focus:ring-1 focus:ring-primary focus:border-primary outline-none" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant pl-1">Chức danh học thuật</label>
              <input value={profile.academic_title} onChange={e => setProfile({...profile, academic_title: e.target.value})} className="w-full bg-surface-container-low border border-white/10 rounded-xl px-4 py-3 text-sm focus:ring-1 focus:ring-primary focus:border-primary outline-none" placeholder="VD: Nhà nghiên cứu, Giảng viên..." />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant pl-1">Ngày sinh</label>
              <input type="date" value={profile.dob} onChange={e => setProfile({...profile, dob: e.target.value})} className="w-full bg-surface-container-low border border-white/10 rounded-xl px-4 py-3 text-sm focus:ring-1 focus:ring-primary focus:border-primary outline-none" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant pl-1">Số điện thoại</label>
              <input type="tel" value={profile.phone} onChange={e => setProfile({...profile, phone: e.target.value})} className="w-full bg-surface-container-low border border-white/10 rounded-xl px-4 py-3 text-sm focus:ring-1 focus:ring-primary focus:border-primary outline-none" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant pl-1">Giới tính</label>
              <select value={profile.gender} onChange={e => setProfile({...profile, gender: e.target.value})} className="w-full bg-surface-container-low border border-white/10 rounded-xl px-4 py-3 text-sm focus:ring-1 focus:ring-primary focus:border-primary outline-none appearance-none">
                <option value="">Chọn giới tính</option>
                <option value="Nam">Nam</option>
                <option value="Nữ">Nữ</option>
                <option value="Khác">Khác</option>
              </select>
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant pl-1">Cơ quan / Trường học</label>
              <input value={profile.institution} onChange={e => setProfile({...profile, institution: e.target.value})} className="w-full bg-surface-container-low border border-white/10 rounded-xl px-4 py-3 text-sm focus:ring-1 focus:ring-primary focus:border-primary outline-none" placeholder="Đại học Quốc gia, Viện Khoa học..." />
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant pl-1">Website / Link cá nhân</label>
              <input type="url" value={profile.website} onChange={e => setProfile({...profile, website: e.target.value})} className="w-full bg-surface-container-low border border-white/10 rounded-xl px-4 py-3 text-sm focus:ring-1 focus:ring-primary focus:border-primary outline-none" placeholder="https://..." />
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant pl-1">Tiểu sử</label>
              <textarea value={profile.bio} onChange={e => setProfile({...profile, bio: e.target.value})} rows={3} className="w-full bg-surface-container-low border border-white/10 rounded-xl px-4 py-3 text-sm focus:ring-1 focus:ring-primary focus:border-primary outline-none resize-none" placeholder="Giới thiệu ngắn gọn về bản thân..." />
            </div>
          </div>
        </div>
      </section>

      <div className="flex justify-end gap-4 pt-4">
        <button onClick={loadProfile} className="px-10 py-4 glass-panel rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-white/5 transition-all text-on-surface-variant">Hủy bỏ</button>
        <button disabled={saving} onClick={handleSaveProfile} className="px-10 py-4 gradient-btn rounded-xl text-[10px] font-bold uppercase tracking-widest text-white shadow-2xl flex items-center gap-2">
          {saving && <Loader2 className="w-4 h-4 animate-spin" />}
          Áp dụng thay đổi
        </button>
      </div>
    </div>
  );

  const renderSecurityTab = () => (
    <div className="space-y-8">
      <section className="glass-panel p-10 rounded-2xl space-y-10">
        <header className="border-b border-white/5 pb-6">
          <h3 className="font-display text-2xl font-bold">Đổi mật khẩu</h3>
          <p className="text-on-surface-variant text-sm mt-2">Bảo vệ tài khoản của bạn bằng mật khẩu mạnh.</p>
        </header>

        <div className="space-y-6 max-w-md">
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant pl-1 flex items-center gap-2">
              <Lock className="w-3 h-3" /> Mật khẩu hiện tại
            </label>
            <input 
              type="password" 
              value={passwords.current_password} 
              onChange={e => setPasswords({...passwords, current_password: e.target.value})} 
              className="w-full bg-surface-container-low border border-white/10 rounded-xl px-4 py-3 text-sm focus:ring-1 focus:ring-primary focus:border-primary outline-none" 
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant pl-1">Mật khẩu mới</label>
            <input 
              type="password" 
              value={passwords.password} 
              onChange={e => setPasswords({...passwords, password: e.target.value})} 
              className="w-full bg-surface-container-low border border-white/10 rounded-xl px-4 py-3 text-sm focus:ring-1 focus:ring-primary focus:border-primary outline-none" 
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant pl-1">Xác nhận mật khẩu mới</label>
            <input 
              type="password" 
              value={passwords.password_confirmation} 
              onChange={e => setPasswords({...passwords, password_confirmation: e.target.value})} 
              className="w-full bg-surface-container-low border border-white/10 rounded-xl px-4 py-3 text-sm focus:ring-1 focus:ring-primary focus:border-primary outline-none" 
            />
          </div>
        </div>
      </section>

      <div className="flex justify-end gap-4 pt-4">
        <button 
          onClick={() => setPasswords({ current_password: "", password: "", password_confirmation: "" })}
          className="px-10 py-4 glass-panel rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-white/5 transition-all text-on-surface-variant"
        >
          Hủy bỏ
        </button>
        <button 
          disabled={savingPassword || !passwords.current_password || !passwords.password} 
          onClick={handleSavePassword} 
          className="px-10 py-4 gradient-btn rounded-xl text-[10px] font-bold uppercase tracking-widest text-white shadow-2xl flex items-center gap-2 disabled:opacity-50"
        >
          {savingPassword && <Loader2 className="w-4 h-4 animate-spin" />}
          Cập nhật mật khẩu
        </button>
      </div>
    </div>
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
        {activeTab === "Bảo mật" && renderSecurityTab()}
      </div>
    </div>
  );
}
