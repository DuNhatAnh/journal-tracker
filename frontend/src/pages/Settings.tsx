import { User, Bell, Palette, ShieldCheck, Mail, Lock, Smartphone, Github } from "lucide-react";
import { cn } from "@/src/lib/utils";

export default function Settings() {
  return (
    <div className="flex flex-col md:flex-row gap-12 pb-20">
      <aside className="w-full md:w-64 space-y-8 flex-shrink-0">
         <div>
           <h2 className="font-display text-4xl font-bold">Cài đặt</h2>
           <p className="text-on-surface-variant mt-2 font-medium">Quản lý tùy chọn.</p>
         </div>

         <nav className="flex md:flex-col overflow-x-auto gap-2">
            {[
              { icon: User, label: "Tài khoản", active: true },
              { icon: Bell, label: "Thông báo", active: false },
              { icon: Palette, label: "Giao diện", active: false },
              { icon: ShieldCheck, label: "Bảo mật", active: false },
            ].map((item, i) => (
              <button key={i} className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all whitespace-nowrap",
                item.active ? "bg-primary-container/20 text-primary border border-primary/30 shadow-lg" : "text-on-surface-variant hover:bg-white/5"
              )}>
                <item.icon className="w-5 h-5" />
                <span className="text-sm font-bold uppercase tracking-widest">{item.label}</span>
              </button>
            ))}
         </nav>
      </aside>

      <div className="flex-1 max-w-4xl space-y-8">
         <section className="glass-panel p-10 rounded-2xl space-y-10">
            <header className="border-b border-white/5 pb-6">
               <h3 className="font-display text-2xl font-bold">Thông tin hồ sơ</h3>
            </header>

            <div className="flex flex-col sm:flex-row gap-10">
               <div className="w-32 h-32 rounded-2xl overflow-hidden border-2 border-white/10 group cursor-pointer relative">
                  <img src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=2576&auto=format&fit=crop" className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                    <Palette className="w-6 h-6 text-white" />
                  </div>
               </div>
               
               <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant pl-1">Họ tên</label>
                    <input className="w-full bg-surface-container-low border border-white/10 rounded-xl px-4 py-3 text-sm focus:ring-1 focus:ring-primary focus:border-primary outline-none" value="Elena Rostova" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant pl-1">Chức danh học thuật</label>
                    <input className="w-full bg-surface-container-low border border-white/10 rounded-xl px-4 py-3 text-sm focus:ring-1 focus:ring-primary focus:border-primary outline-none" value="Nhà khoa học dữ liệu cao cấp" />
                  </div>
               </div>
            </div>
         </section>

         <section className="glass-panel p-10 rounded-2xl space-y-10">
            <header className="border-b border-white/5 pb-6">
               <h3 className="font-display text-2xl font-bold">Bảo mật & Xác thực</h3>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
               <div className="space-y-6">
                  <h4 className="text-sm font-bold uppercase tracking-widest text-tertiary">Đổi mật khẩu</h4>
                  <div className="space-y-4">
                    <input type="password" placeholder="Mã hiện tại" className="w-full bg-surface-container-low border border-white/10 rounded-xl px-4 py-3 text-sm" />
                    <input type="password" placeholder="Mã mới" className="w-full bg-surface-container-low border border-white/10 rounded-xl px-4 py-3 text-sm" />
                    <button className="px-6 py-3 rounded-xl border border-tertiary text-tertiary text-[10px] font-bold uppercase tracking-widest hover:bg-tertiary/10 transition-all self-start">Xoay vòng thông tin xác thực</button>
                  </div>
               </div>

               <div className="space-y-6">
                  <h4 className="text-sm font-bold uppercase tracking-widest text-primary">Yếu tố thứ hai</h4>
                  <p className="text-sm text-on-surface-variant">Thêm một lớp bảo mật sinh trắc học hoặc mã thông báo bổ sung.</p>
                  <div className="flex items-center justify-between p-5 rounded-2xl border border-white/5 bg-white/5">
                    <div className="flex items-center gap-4">
                       <Smartphone className="w-5 h-5 text-outline" />
                       <span className="text-sm font-bold">Ứng dụng xác thực</span>
                    </div>
                    <div className="w-12 h-6 bg-primary rounded-full relative flex items-center px-1">
                      <div className="w-4 h-4 bg-white rounded-full translate-x-6" />
                    </div>
                  </div>
               </div>
            </div>
         </section>

         <div className="flex justify-end gap-4 pt-4">
            <button className="px-10 py-4 glass-panel rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-white/5 transition-all text-on-surface-variant">Hủy bỏ</button>
            <button className="px-10 py-4 gradient-btn rounded-xl text-[10px] font-bold uppercase tracking-widest text-white shadow-2xl">Áp dụng thay đổi</button>
         </div>
      </div>
    </div>
  );
}
