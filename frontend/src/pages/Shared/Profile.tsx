import { Edit2, TrendingUp, Bookmark, Eye, Star, Plus, X, MapPin, Globe, Phone, Calendar, Loader2, Save, Palette, Trash2 } from "lucide-react";
import { cn } from "@/src/lib/utils";
import { useState, useEffect, useCallback, useRef } from "react";
import { api } from "@/src/lib/api";
import { useBlocker } from "react-router-dom";
import toast from "react-hot-toast";

type UserProfile = {
  name: string;
  email: string;
  avatar: string | null;
  academic_title: string | null;
  dob: string | null;
  phone: string | null;
  gender: string | null;
  institution: string | null;
  bio: string | null;
  website: string | null;
  role: string;
};

type EditableFields = {
  name: string;
  email: string;
  academic_title: string;
  dob: string;
  phone: string;
  gender: string;
  institution: string;
  bio: string;
  website: string;
};

const roleLabelMap: Record<string, string> = {
  admin: "Quản trị viên",
  researcher: "Nhà nghiên cứu",
  lecturer: "Giảng viên",
  student: "Sinh viên",
};

function userToEditable(user: UserProfile): EditableFields {
  return {
    name: user.name || "",
    email: user.email || "",
    academic_title: user.academic_title || "",
    dob: user.dob || "",
    phone: user.phone || "",
    gender: user.gender || "",
    institution: user.institution || "",
    bio: user.bio || "",
    website: user.website || "",
  };
}

export default function Profile() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingAvatar, setDeletingAvatar] = useState(false);
  const [form, setForm] = useState<EditableFields>({
    name: "", email: "", academic_title: "", dob: "", phone: "", gender: "", institution: "", bio: "", website: "",
  });
  const [originalForm, setOriginalForm] = useState<EditableFields>({
    name: "", email: "", academic_title: "", dob: "", phone: "", gender: "", institution: "", bio: "", website: "",
  });
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  const hasChanges = editing && (
    JSON.stringify(form) !== JSON.stringify(originalForm) || avatarFile !== null
  );

  // Block navigation when there are unsaved changes
  const blocker = useBlocker(hasChanges);

  // Also warn on browser tab close / refresh
  useEffect(() => {
    if (!hasChanges) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [hasChanges]);

  const loadUser = useCallback(async () => {
    try {
      const res = await api.get<UserProfile>("/me");
      setUser(res);
      const editable = userToEditable(res);
      setForm(editable);
      setOriginalForm(editable);
    } catch (e) {
      console.error("Failed to load profile", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  const handleStartEdit = () => {
    if (user) {
      const editable = userToEditable(user);
      setForm(editable);
      setOriginalForm(editable);
      setAvatarFile(null);
      setAvatarPreview(null);
    }
    setEditing(true);
  };

  const handleCancelEdit = () => {
    if (user) {
      setForm(userToEditable(user));
    }
    setAvatarFile(null);
    setAvatarPreview(null);
    setEditing(false);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const formData = new FormData();
      Object.entries(form).forEach(([key, value]) => {
        if (value) formData.append(key, value);
      });
      if (avatarFile) {
        formData.append("avatar", avatarFile);
      }
      const res = await api.post<UserProfile>("/profile", formData);
      setUser(res);
      const editable = userToEditable(res);
      setForm(editable);
      setOriginalForm(editable);
      setAvatarFile(null);
      setAvatarPreview(null);
      setEditing(false);
      localStorage.setItem("user", JSON.stringify(res));
      toast.success("Đã cập nhật hồ sơ thành công.", { position: "top-center" });
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Có lỗi xảy ra khi lưu hồ sơ.", { position: "top-center" });
    } finally {
      setSaving(false);
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
    if (!user?.avatar && !avatarPreview) return;
    if (avatarPreview && !user?.avatar) {
      setAvatarFile(null);
      setAvatarPreview(null);
      return;
    }
    try {
      setDeletingAvatar(true);
      const res = await api.delete<any>('/avatar');
      setUser(res);
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-on-surface-variant">Không thể tải thông tin hồ sơ.</p>
      </div>
    );
  }

  const initials = user.name ? user.name.substring(0, 2).toUpperCase() : "U";
  const avatarSrc = avatarPreview || (user.avatar ? `/api/storage/${user.avatar.replace(/^\/?(storage\/)?/, '')}` : null);

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return null;
    try {
      return new Date(dateStr).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
    } catch {
      return dateStr;
    }
  };

  const infoItems = [
    { icon: MapPin, label: "Cơ quan", value: user.institution },
    { icon: Phone, label: "Điện thoại", value: user.phone },
    { icon: Calendar, label: "Ngày sinh", value: formatDate(user.dob) },
    { icon: Globe, label: "Website", value: user.website, isLink: true },
  ].filter(item => item.value);

  const inputCls = "w-full bg-surface-container-low border border-white/10 rounded-xl px-4 py-3 text-sm focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all";

  return (
    <>
      {/* Unsaved changes modal */}
      {blocker.state === "blocked" && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => blocker.reset()}>
          <div className="glass-panel p-8 rounded-2xl max-w-md w-full mx-4 space-y-6 border border-white/10 shadow-2xl" onClick={e => e.stopPropagation()}>
            <h3 className="font-display text-xl font-bold">Thay đổi chưa được lưu</h3>
            <p className="text-on-surface-variant text-sm leading-relaxed">
              Bạn có thay đổi chưa lưu. Bạn muốn lưu trước khi rời đi không?
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => blocker.proceed()}
                className="px-6 py-3 glass-panel rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-white/5 transition-all text-on-surface-variant"
              >
                Không lưu
              </button>
              <button
                onClick={() => blocker.reset()}
                className="px-6 py-3 glass-panel rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-white/5 transition-all text-on-surface-variant"
              >
                Ở lại
              </button>
              <button
                onClick={async () => {
                  await handleSave();
                  blocker.proceed();
                }}
                className="px-6 py-3 gradient-btn rounded-xl text-[10px] font-bold uppercase tracking-widest text-white shadow-xl"
              >
                Lưu & rời đi
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-12 pb-20">
        {/* Hero section */}
        <section className="relative group">
          <div className="absolute inset-0 bg-primary/5 rounded-[2.5rem] blur-3xl" />
          <div className="glass-panel p-10 rounded-3xl relative overflow-hidden flex flex-col md:flex-row items-center md:items-start gap-10">
            {/* Avatar */}
            <div className="relative">
              <div className={cn(
                "w-40 h-40 rounded-full overflow-hidden border-4 border-primary/20 shadow-2xl ring-4 ring-white/5",
                editing && "cursor-pointer"
              )}>
                {editing && (
                  <input type="file" accept="image/*" onChange={handleAvatarChange} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
                )}
                {avatarSrc ? (
                  <img
                    src={avatarSrc}
                    alt="Profile"
                    className="w-full h-full object-cover"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-primary font-bold text-5xl bg-primary/10">
                    {initials}
                  </div>
                )}
                {editing && (
                  <div className="absolute inset-0 bg-black/60 opacity-0 hover:opacity-100 flex items-center justify-center transition-opacity pointer-events-none">
                    <Palette className="w-8 h-8 text-white" />
                  </div>
                )}
              </div>
              {editing && (avatarPreview || user.avatar) && (
                <button
                  type="button"
                  onClick={handleDeleteAvatar}
                  disabled={deletingAvatar}
                  className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-error/90 border border-error/30 flex items-center justify-center text-white shadow-xl hover:scale-110 active:scale-95 transition-all disabled:opacity-50"
                >
                  {deletingAvatar ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                </button>
              )}
              {!editing && (
                <button
                  onClick={handleStartEdit}
                  className="absolute bottom-1 right-1 w-10 h-10 rounded-full bg-surface-bright border border-white/10 flex items-center justify-center text-primary shadow-xl hover:scale-110 active:scale-95 transition-all"
                >
                  <Edit2 className="w-5 h-5" />
                </button>
              )}
            </div>

            {/* Info / Edit form */}
            <div className="flex-1 text-center md:text-left space-y-6 w-full">
              {!editing ? (
                <>
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                      <h2 className="font-display text-4xl font-bold">
                        {user.academic_title ? `${user.academic_title} ${user.name}` : user.name}
                      </h2>
                      <span className="px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 text-[10px] font-bold tracking-widest uppercase">
                        {roleLabelMap[user.role] || user.role}
                      </span>
                      {user.gender && (
                        <span className="px-3 py-1 rounded-full bg-secondary-container/20 text-secondary border border-secondary/20 text-[10px] font-bold tracking-widest uppercase">
                          {user.gender}
                        </span>
                      )}
                    </div>
                    <p className="text-on-surface-variant font-mono text-sm">{user.email}</p>
                  </div>

                  {user.bio && (
                    <p className="text-on-surface-variant text-lg leading-relaxed max-w-3xl">
                      {user.bio}
                    </p>
                  )}

                  <div className="flex flex-wrap justify-center md:justify-start gap-4">
                    <button
                      onClick={handleStartEdit}
                      className="gradient-btn px-8 py-3 rounded-xl text-xs font-bold uppercase tracking-widest text-white shadow-xl flex items-center gap-2"
                    >
                      <Edit2 className="w-4 h-4" /> Chỉnh sửa hồ sơ
                    </button>
                  </div>
                </>
              ) : (
                /* Edit mode form */
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-left">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant pl-1">Họ tên</label>
                    <input value={form.name} onChange={e => setForm({...form, name: e.target.value})} className={inputCls} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant pl-1">Email</label>
                    <input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} className={inputCls} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant pl-1">Chức danh học thuật</label>
                    <input value={form.academic_title} onChange={e => setForm({...form, academic_title: e.target.value})} className={inputCls} placeholder="VD: TS., PGS., GS..." />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant pl-1">Ngày sinh</label>
                    <input type="date" value={form.dob} onChange={e => setForm({...form, dob: e.target.value})} className={inputCls} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant pl-1">Số điện thoại</label>
                    <input type="tel" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} className={inputCls} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant pl-1">Giới tính</label>
                    <select value={form.gender} onChange={e => setForm({...form, gender: e.target.value})} className={cn(inputCls, "appearance-none")}>
                      <option value="">Chọn giới tính</option>
                      <option value="Nam">Nam</option>
                      <option value="Nữ">Nữ</option>
                      <option value="Khác">Khác</option>
                    </select>
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant pl-1">Cơ quan / Trường học</label>
                    <input value={form.institution} onChange={e => setForm({...form, institution: e.target.value})} className={inputCls} placeholder="Đại học Quốc gia, Viện Khoa học..." />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant pl-1">Website / Link cá nhân</label>
                    <input type="url" value={form.website} onChange={e => setForm({...form, website: e.target.value})} className={inputCls} placeholder="https://..." />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant pl-1">Tiểu sử</label>
                    <textarea value={form.bio} onChange={e => setForm({...form, bio: e.target.value})} rows={3} className={cn(inputCls, "resize-none")} placeholder="Giới thiệu ngắn gọn về bản thân..." />
                  </div>

                  {/* Action buttons */}
                  <div className="md:col-span-2 flex justify-end gap-4 pt-2">
                    <button
                      onClick={handleCancelEdit}
                      className="px-8 py-3 glass-panel rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-white/5 transition-all text-on-surface-variant"
                    >
                      Hủy bỏ
                    </button>
                    <button
                      disabled={!hasChanges || saving}
                      onClick={handleSave}
                      className={cn(
                        "px-8 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 transition-all",
                        hasChanges
                          ? "gradient-btn text-white shadow-xl"
                          : "bg-white/5 text-on-surface-variant/50 cursor-not-allowed border border-white/5"
                      )}
                    >
                      {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                      <Save className="w-4 h-4" />
                      Áp dụng thay đổi
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Personal info section - only show in view mode */}
        {!editing && infoItems.length > 0 && (
          <section className="glass-panel p-8 rounded-2xl space-y-6">
            <h3 className="font-display text-xl font-bold">Thông tin cá nhân</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {infoItems.map((item, i) => (
                <div key={i} className="flex items-center gap-4 p-4 rounded-xl bg-white/[0.02] border border-white/5">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">
                    <item.icon className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">{item.label}</p>
                    {item.isLink ? (
                      <a href={item.value!} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline">
                        {item.value}
                      </a>
                    ) : (
                      <p className="text-sm font-medium">{item.value}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Activity overview */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-8 space-y-10">
            <h3 className="font-display text-2xl font-bold flex items-center gap-3">
              <TrendingUp className="w-6 h-6 text-tertiary" /> Tổng quan hoạt động
            </h3>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "Bài báo đã đọc", value: "—", icon: Eye, color: "text-primary" },
                { label: "Đã lưu", value: "—", icon: Bookmark, color: "text-secondary" },
                { label: "Đang theo dõi", value: "—", icon: Star, color: "text-tertiary" },
                { label: "Ảnh hưởng", value: "—", icon: TrendingUp, color: "text-error" },
              ].map((stat, i) => (
                <div key={i} className="glass-panel p-6 rounded-2xl hover:border-white/20 transition-all group">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-4">{stat.label}</p>
                  <div className="flex items-baseline justify-between">
                    <span className="text-3xl font-black">{stat.value}</span>
                    <stat.icon className={cn("w-5 h-5", stat.color)} />
                  </div>
                </div>
              ))}
            </div>

            <div className="glass-panel rounded-2xl p-8 space-y-6">
              <h4 className="font-display text-xl font-bold">Tương tác gần đây</h4>
              <div className="flex items-center justify-center py-8 text-on-surface-variant text-sm">
                Chưa có hoạt động nào gần đây.
              </div>
            </div>
          </div>

          <aside className="lg:col-span-4 space-y-8">
            <h3 className="font-display text-2xl font-bold flex items-center gap-3">
              <Plus className="w-6 h-6 text-primary" /> Sở thích nghiên cứu
            </h3>
            <div className="glass-panel p-8 rounded-2xl h-full flex flex-col">
              <p className="text-on-surface-variant text-sm mb-8 leading-relaxed">Những chủ đề này thúc đẩy các đề xuất và luồng khám phá cá nhân hóa của Động cơ Thông tin chuyên sâu dành cho bạn.</p>

              <div className="flex flex-wrap gap-2 mb-10">
                <button className="px-4 py-2 rounded-full border border-dashed border-white/20 text-on-surface-variant hover:text-primary hover:border-primary text-xs font-bold transition-all">+ Thêm chủ đề</button>
              </div>

              <div className="mt-auto pt-8 border-t border-white/5 flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Động cơ Khám phá</span>
                <div className="flex items-center gap-3 bg-white/5 px-4 py-2 rounded-full border border-white/5">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-primary">Đang hoạt động</span>
                  <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </>
  );
}
