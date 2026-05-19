import { Edit2, Share2, TrendingUp, Bookmark, Eye, Star, Plus, Check, X } from "lucide-react";
import { cn } from "@/src/lib/utils";

export default function Profile() {
  return (
    <div className="space-y-12 pb-20">
      <section className="relative group">
         <div className="absolute inset-0 bg-primary/5 rounded-[2.5rem] blur-3xl" />
         <div className="glass-panel p-10 rounded-3xl relative overflow-hidden flex flex-col md:flex-row items-center md:items-start gap-10">
            <div className="relative">
              <div className="w-40 h-40 rounded-full overflow-hidden border-4 border-primary/20 shadow-2xl ring-4 ring-white/5">
                 <img src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=2576&auto=format&fit=crop" alt="Profile" className="w-full h-full object-cover" />
              </div>
              <button className="absolute bottom-1 right-1 w-10 h-10 rounded-full bg-surface-bright border border-white/10 flex items-center justify-center text-primary shadow-xl hover:scale-110 active:scale-95 transition-all">
                <Edit2 className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 text-center md:text-left space-y-6">
               <div className="space-y-1">
                 <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                   <h2 className="font-display text-4xl font-bold">TS. Elena Rostova</h2>
                   <span className="px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 text-[10px] font-bold tracking-widest uppercase">Nhà nghiên cứu đã xác minh</span>
                 </div>
                 <p className="text-on-surface-variant font-mono text-sm">elena.rostova@academic-insight.edu</p>
               </div>
               
               <p className="text-on-surface-variant text-lg leading-relaxed max-w-3xl">
                 Nhà khoa học dữ liệu cao cấp chuyên về kiến trúc thần kinh và dịch tễ học dự đoán. Đam mê tận dụng các mô hình nền tảng cho kết quả sức khỏe toàn cầu và suy luận đa phương thức.
               </p>

               <div className="flex flex-wrap justify-center md:justify-start gap-4">
                  <button className="gradient-btn px-8 py-3 rounded-xl text-xs font-bold uppercase tracking-widest text-white shadow-xl">Chỉnh sửa hồ sơ nghiên cứu</button>
                  <button className="glass-panel px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-widest flex items-center gap-2 hover:bg-white/5 transition-all"><Share2 className="w-4 h-4" /> Chia sẻ bảng điều khiển</button>
               </div>
            </div>
         </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-8 space-y-10">
           <h3 className="font-display text-2xl font-bold flex items-center gap-3">
             <TrendingUp className="w-6 h-6 text-tertiary" /> Tổng quan hoạt động
           </h3>
           
           <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
             {[
               { label: "Bài báo đã đọc", value: 142, icon: Eye, color: "text-primary" },
               { label: "Dấu trang", value: 89, icon: Bookmark, color: "text-secondary" },
               { label: "Đã theo dõi", value: 34, icon: Star, color: "text-tertiary" },
               { label: "Ảnh hưởng", value: 4.8, icon: TrendingUp, color: "text-error" },
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
              <div className="space-y-4">
                 {[
                   { label: "Đã đánh dấu", title: '"Trường bức xạ thần kinh cho tổng hợp hình ảnh thưa thớt"', time: "2 giờ trước", icon: Bookmark, color: "bg-primary/20 text-primary border-primary/30" },
                   { label: "Đã đọc", title: '"Mô hình dịch tễ học thông qua mạng thần kinh biểu đồ"', time: "Hôm qua", icon: Eye, color: "bg-secondary-container/30 text-secondary border-secondary/30" }
                 ].map((item, i) => (
                   <div key={i} className="p-4 rounded-xl hover:bg-white/5 transition-all flex items-start gap-4 group cursor-pointer border border-transparent hover:border-white/5">
                      <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center border flex-shrink-0", item.color)}><item.icon className="w-5 h-5" /></div>
                      <div>
                        <p className="group-hover:text-primary transition-colors font-medium"><strong>{item.label}</strong> <span className="text-on-surface tracking-tight">{item.title}</span></p>
                        <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mt-1">{item.time}</p>
                      </div>
                   </div>
                 ))}
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
                 {['Học máy', 'Dịch tễ học', 'Mô hình dự đoán', 'Mạng biểu đồ', 'Khoa học dữ liệu'].map((tag, i) => (
                   <div key={i} className="group flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 hover:border-primary/50 bg-white/5 hover:bg-primary/10 transition-all cursor-pointer">
                      <span className="text-xs font-bold text-on-surface transition-colors group-hover:text-primary">{tag}</span>
                      <X className="w-3 h-3 text-on-surface-variant opacity-0 group-hover:opacity-100 transition-opacity" />
                   </div>
                 ))}
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
  );
}
