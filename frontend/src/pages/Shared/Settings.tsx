import { User, Bell, Palette, ShieldCheck, Mail, Lock, Smartphone, Github, Loader2, Trash2, Eye, EyeOff, Edit2 } from "lucide-react";
import { cn } from "@/src/lib/utils";
import { useState, useEffect, useCallback } from "react";
import { api } from "@/src/lib/api";
import { useBlocker } from "react-router-dom";
import toast from "react-hot-toast";

type NotificationSettings = {
  notify_journal: boolean;
  notify_keyword: boolean;
  notify_trending: boolean;
};

type ProfileData = {
  name: string;
  academic_title: string;
  email: string;
  dob: string;
  phone: string;
  gender: string;
  institution: string;
  bio: string;
  website: string;
  avatar: string;
};

export default function Settings() {
  const [activeTab, setActiveTab] = useState("Tài khoản");
  const [settings, setSettings] = useState<NotificationSettings>({
    notify_journal: true,
    notify_keyword: true,
    notify_trending: true,
  });
  const [profile, setProfile] = useState<ProfileData>({
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
  const [originalProfile, setOriginalProfile] = useState<ProfileData>({
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
  const [editingProfile, setEditingProfile] = useState(false);
  
  const [passwords, setPasswords] = useState({
    current_password: "",
    password: "",
    password_confirmation: ""
  });
  const [savingPassword, setSavingPassword] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingAvatar, setDeletingAvatar] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");

  // Check if profile has unsaved changes
  const profileHasChanges = editingProfile && (
    JSON.stringify(profile) !== JSON.stringify(originalProfile) || avatarFile !== null
  );

  // Show unsaved changes dialog
  const [showUnsavedModal, setShowUnsavedModal] = useState(false);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);

  // Block router navigation when there are unsaved changes
  const blocker = useBlocker(profileHasChanges);

  const confirmIfUnsaved = useCallback((action: () => void) => {
    if (profileHasChanges) {
      setPendingAction(() => action);
      setShowUnsavedModal(true);
    } else {
      action();
    }
  }, [profileHasChanges]);

  // Warn on browser tab close / refresh
  useEffect(() => {
    if (!profileHasChanges) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [profileHasChanges]);

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
      const profileData: ProfileData = {
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
      };
      setProfile(profileData);
      setOriginalProfile(profileData);
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

  const handleStartEdit = () => {
    setEditingProfile(true);
  };

  const handleCancelEdit = () => {
    setProfile(originalProfile);
    setAvatarFile(null);
    setAvatarPreview(null);
    setEditingProfile(false);
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
      
      const updatedProfile: ProfileData = {
        name: res.name || "",
        academic_title: res.academic_title || "",
        email: res.email || "",
        dob: res.dob || "",
        phone: res.phone || "",
        gender: res.gender || "",
        institution: res.institution || "",
        bio: res.bio || "",
        website: res.website || "",
        avatar: res.avatar || ""
      };
      setProfile(updatedProfile);
      setOriginalProfile(updatedProfile);
      setAvatarFile(null);
      setAvatarPreview(null);
      setEditingProfile(false);
      
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
    if (passwords.password === passwords.current_password) {
      toast.error("Mật khẩu mới không được trùng với mật khẩu hiện tại.", { position: "top-center" });
      return;
    }
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
      setOriginalProfile(prev => ({ ...prev, avatar: '' }));
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

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== "XOA TAI KHOAN") return;
    try {
      setDeletingAccount(true);
      await api.delete('/user/account');
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login?message=" + encodeURIComponent("Tài khoản của bạn đã được xoá vĩnh viễn.");
    } catch (err: any) {
      toast.error("Không thể xoá tài khoản. Vui lòng thử lại.", { position: "top-center" });
      setDeletingAccount(false);
      setShowDeleteModal(false);
    }
  };

  const inputCls = "w-full bg-surface-container-low border border-outline-variant/50 rounded-xl px-4 py-3 text-sm focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all";
  const readOnlyCls = "w-full bg-surface-dim/50 border border-outline-variant/30 rounded-xl px-4 py-3 text-sm font-medium text-on-surface outline-none cursor-default shadow-sm";

  const renderProfileTab = () => (
    <div className="space-y-8">
      <section className="glass-panel p-10 rounded-2xl space-y-10">
        <header className="border-b border-white/5 pb-6 flex items-center justify-between">
          <h3 className="font-display text-2xl font-bold">Thông tin hồ sơ</h3>
          {!editingProfile && (
            <button
              onClick={handleStartEdit}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest border border-primary/30 text-primary bg-primary/5 hover:bg-primary/15 transition-all"
            >
              <Edit2 className="w-3.5 h-3.5" />
              Chỉnh sửa
            </button>
          )}
        </header>

        <div className="flex flex-col md:flex-row gap-10">
          {/* Avatar + nút xóa */}
          <div className="flex flex-col items-center gap-3 flex-shrink-0">
            <div className={cn(
              "w-32 h-32 rounded-2xl overflow-hidden border-2 border-white/10 relative bg-surface-container",
              editingProfile ? "group cursor-pointer" : ""
            )}>
              {editingProfile && (
                <input type="file" accept="image/*" onChange={handleAvatarChange} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
              )}
              {(avatarPreview || profile.avatar) ? (
                <img
                  src={avatarPreview || `/api/storage/${profile.avatar.replace(/^\/?(storage\/)?/, '')}`}
                  className={cn("w-full h-full object-cover", editingProfile && "group-hover:scale-110 transition-transform")}
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-primary font-bold text-4xl bg-primary/10">
                  {profile.name ? profile.name.substring(0, 2).toUpperCase() : "U"}
                </div>
              )}
              {editingProfile && (
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity pointer-events-none">
                  <Palette className="w-6 h-6 text-white" />
                </div>
              )}
            </div>
            {editingProfile && (avatarPreview || profile.avatar) && (
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
              <input 
                value={profile.name} 
                onChange={e => setProfile({...profile, name: e.target.value})} 
                readOnly={!editingProfile}
                className={editingProfile ? inputCls : readOnlyCls} 
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant pl-1">Email</label>
              <input 
                type="email" 
                value={profile.email} 
                onChange={e => setProfile({...profile, email: e.target.value})} 
                readOnly={!editingProfile}
                className={editingProfile ? inputCls : readOnlyCls} 
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant pl-1">Chức danh học thuật</label>
              <input 
                value={profile.academic_title} 
                onChange={e => setProfile({...profile, academic_title: e.target.value})} 
                readOnly={!editingProfile}
                className={editingProfile ? inputCls : readOnlyCls} 
                placeholder={editingProfile ? "VD: Nhà nghiên cứu, Giảng viên..." : ""} 
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant pl-1">Ngày sinh</label>
              <input 
                type={editingProfile ? "date" : "text"}
                value={editingProfile ? profile.dob : (profile.dob ? new Date(profile.dob).toLocaleDateString("vi-VN") : "")} 
                onChange={e => setProfile({...profile, dob: e.target.value})} 
                readOnly={!editingProfile}
                className={editingProfile ? inputCls : readOnlyCls} 
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant pl-1">Số điện thoại</label>
              <input 
                type="tel" 
                value={profile.phone} 
                onChange={e => setProfile({...profile, phone: e.target.value})} 
                readOnly={!editingProfile}
                className={editingProfile ? inputCls : readOnlyCls} 
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant pl-1">Giới tính</label>
              {editingProfile ? (
                <select value={profile.gender} onChange={e => setProfile({...profile, gender: e.target.value})} className={cn(inputCls, "appearance-none")}>
                  <option value="">Chọn giới tính</option>
                  <option value="Nam">Nam</option>
                  <option value="Nữ">Nữ</option>
                  <option value="Khác">Khác</option>
                </select>
              ) : (
                <input value={profile.gender || ""} readOnly className={readOnlyCls} />
              )}
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant pl-1">Cơ quan / Trường học</label>
              <input 
                value={profile.institution} 
                onChange={e => setProfile({...profile, institution: e.target.value})} 
                readOnly={!editingProfile}
                className={editingProfile ? inputCls : readOnlyCls} 
                placeholder={editingProfile ? "Đại học Quốc gia, Viện Khoa học..." : ""} 
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant pl-1">Website / Link cá nhân</label>
              <input 
                type="url" 
                value={profile.website} 
                onChange={e => setProfile({...profile, website: e.target.value})} 
                readOnly={!editingProfile}
                className={editingProfile ? inputCls : readOnlyCls} 
                placeholder={editingProfile ? "https://..." : ""} 
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant pl-1">Tiểu sử</label>
              <textarea 
                value={profile.bio} 
                onChange={e => setProfile({...profile, bio: e.target.value})} 
                readOnly={!editingProfile}
                rows={3} 
                className={cn(editingProfile ? inputCls : readOnlyCls, "resize-none")} 
                placeholder={editingProfile ? "Giới thiệu ngắn gọn về bản thân..." : ""} 
              />
            </div>
          </div>
        </div>
      </section>

      {editingProfile && (
        <div className="flex justify-end gap-4 pt-4">
          <button onClick={handleCancelEdit} className="px-10 py-4 glass-panel rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-white/5 transition-all text-on-surface-variant">Hủy bỏ</button>
          <button 
            disabled={!profileHasChanges || saving} 
            onClick={handleSaveProfile} 
            className={cn(
              "px-10 py-4 rounded-xl text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 transition-all",
              profileHasChanges
                ? "gradient-btn text-white shadow-2xl"
                : "bg-white/5 text-on-surface-variant/50 cursor-not-allowed border border-white/5"
            )}
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            Áp dụng thay đổi
          </button>
        </div>
      )}
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
            <div className="relative">
              <input 
                type={showCurrentPassword ? "text" : "password"} 
                value={passwords.current_password} 
                onChange={e => setPasswords({...passwords, current_password: e.target.value})} 
                className="w-full bg-surface-container-low border border-white/10 rounded-xl px-4 py-3 pr-11 text-sm focus:ring-1 focus:ring-primary focus:border-primary outline-none" 
              />
              <button 
                type="button" 
                onClick={() => setShowCurrentPassword(!showCurrentPassword)} 
                className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface transition-colors p-1"
                tabIndex={-1}
              >
                {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant pl-1">Mật khẩu mới</label>
            <div className="relative">
              <input 
                type={showNewPassword ? "text" : "password"} 
                value={passwords.password} 
                onChange={e => setPasswords({...passwords, password: e.target.value})} 
                className="w-full bg-surface-container-low border border-white/10 rounded-xl px-4 py-3 pr-11 text-sm focus:ring-1 focus:ring-primary focus:border-primary outline-none" 
              />
              <button 
                type="button" 
                onClick={() => setShowNewPassword(!showNewPassword)} 
                className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface transition-colors p-1"
                tabIndex={-1}
              >
                {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant pl-1">Xác nhận mật khẩu mới</label>
            <div className="relative">
              <input 
                type={showConfirmPassword ? "text" : "password"} 
                value={passwords.password_confirmation} 
                onChange={e => setPasswords({...passwords, password_confirmation: e.target.value})} 
                className="w-full bg-surface-container-low border border-white/10 rounded-xl px-4 py-3 pr-11 text-sm focus:ring-1 focus:ring-primary focus:border-primary outline-none" 
              />
              <button 
                type="button" 
                onClick={() => setShowConfirmPassword(!showConfirmPassword)} 
                className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface transition-colors p-1"
                tabIndex={-1}
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
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

      <section className="glass-panel p-10 rounded-2xl border border-error/30 bg-error/5 mt-8">
        <header className="border-b border-error/20 pb-6 flex items-start justify-between">
          <div>
            <h3 className="font-display text-2xl font-bold text-error">Vùng nguy hiểm</h3>
            <p className="text-error/70 text-sm mt-2">Cảnh báo: Hành động này không thể hoàn tác.</p>
          </div>
        </header>
        <div className="pt-6 flex items-center justify-between">
          <div className="max-w-sm">
            <h4 className="font-bold text-on-surface">Xoá tài khoản vĩnh viễn</h4>
            <p className="text-on-surface-variant text-sm mt-1">Xoá toàn bộ thông tin cá nhân, lịch sử và các bài báo đã lưu của bạn khỏi hệ thống.</p>
          </div>
          <button 
            type="button"
            onClick={() => {
              setDeleteConfirmText("");
              setShowDeleteModal(true);
            }}
            className="px-6 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest text-error border border-error/30 hover:bg-error/10 flex items-center gap-2 shadow-lg transition-all"
          >
            <Trash2 className="w-4 h-4" />
            Xoá tài khoản
          </button>
        </div>
      </section>
    </div>
  );

  return (
    <>
      {/* Unsaved changes modal */}
      {(showUnsavedModal || blocker.state === "blocked") && (
        <div 
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm" 
          onClick={() => {
            if (blocker.state === "blocked") {
              blocker.reset();
            } else {
              setShowUnsavedModal(false);
            }
          }}
        >
          <div className="glass-panel p-8 rounded-2xl max-w-md w-full mx-4 space-y-6 border border-white/10 shadow-2xl" onClick={e => e.stopPropagation()}>
            <h3 className="font-display text-xl font-bold">Thay đổi chưa được lưu</h3>
            <p className="text-on-surface-variant text-sm leading-relaxed">
              Bạn có thay đổi hồ sơ chưa lưu. Bạn muốn lưu trước khi rời đi không?
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setProfile(originalProfile);
                  setAvatarFile(null);
                  setAvatarPreview(null);
                  setEditingProfile(false);
                  if (blocker.state === "blocked") {
                    blocker.proceed();
                  } else {
                    setShowUnsavedModal(false);
                    if (pendingAction) pendingAction();
                    setPendingAction(null);
                  }
                }}
                className="px-6 py-3 glass-panel rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-white/5 transition-all text-on-surface-variant"
              >
                Không lưu
              </button>
              <button
                onClick={() => {
                  if (blocker.state === "blocked") {
                    blocker.reset();
                  } else {
                    setShowUnsavedModal(false);
                    setPendingAction(null);
                  }
                }}
                className="px-6 py-3 glass-panel rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-white/5 transition-all text-on-surface-variant"
              >
                Ở lại
              </button>
              <button
                onClick={async () => {
                  await handleSaveProfile();
                  if (blocker.state === "blocked") {
                    blocker.proceed();
                  } else {
                    setShowUnsavedModal(false);
                    if (pendingAction) pendingAction();
                    setPendingAction(null);
                  }
                }}
                className="px-6 py-3 gradient-btn rounded-xl text-[10px] font-bold uppercase tracking-widest text-white shadow-xl"
              >
                Lưu & rời đi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Account Modal */}
      {showDeleteModal && (
        <div 
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={() => !deletingAccount && setShowDeleteModal(false)}
        >
          <div className="glass-panel p-8 rounded-2xl max-w-md w-full mx-4 space-y-6 border border-error/20 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 text-error">
              <Trash2 className="w-8 h-8 p-1.5 bg-error/10 rounded-lg" />
              <h3 className="font-display text-xl font-bold">Xác nhận xoá tài khoản</h3>
            </div>
            
            <div className="space-y-4">
              <p className="text-on-surface-variant text-sm leading-relaxed">
                Hành động này <strong className="text-error">không thể hoàn tác</strong>. Dữ liệu của bạn bao gồm bài viết đã lưu, lịch sử và thông tin cá nhân sẽ bị xoá vĩnh viễn khỏi hệ thống.
              </p>
              
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant pl-1">
                  Nhập <strong className="text-error">XOA TAI KHOAN</strong> để tiếp tục:
                </label>
                <input 
                  type="text"
                  name="confirm_delete_account_input"
                  id="confirm_delete_account_input"
                  autoComplete="off"
                  autoCorrect="off"
                  spellCheck="false"
                  value={deleteConfirmText}
                  onChange={e => setDeleteConfirmText(e.target.value)}
                  disabled={deletingAccount}
                  placeholder="XOA TAI KHOAN"
                  className="w-full bg-error/5 border border-error/20 rounded-xl px-4 py-3 text-sm focus:ring-1 focus:ring-error focus:border-error outline-none transition-all placeholder:text-error/30 text-error font-bold"
                />
              </div>
            </div>

            <div className="flex gap-3 justify-end pt-2">
              <button
                disabled={deletingAccount}
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteConfirmText("");
                }}
                className="px-6 py-3 glass-panel rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-white/5 transition-all text-on-surface-variant disabled:opacity-50"
              >
                Hủy bỏ
              </button>
              <button
                disabled={deletingAccount || deleteConfirmText !== "XOA TAI KHOAN"}
                onClick={handleDeleteAccount}
                className="px-6 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest text-white bg-error hover:bg-error/90 shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-all"
              >
                {deletingAccount ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                Xoá vĩnh viễn
              </button>
            </div>
          </div>
        </div>
      )}

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
                  onClick={() => confirmIfUnsaved(() => setActiveTab(item.label))}
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
    </>
  );
}
