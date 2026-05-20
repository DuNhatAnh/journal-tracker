import { Activity, Users, Plus, Tag, X, Clock, Quote, Eye, ArrowRight } from "lucide-react";
import { cn } from "@/src/lib/utils";

export default function Following() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pb-20">
      <div className="lg:col-span-8 space-y-8">
         <header className="flex justify-between items-end mb-4">
           <div>
             <h2 className="font-display text-4xl font-bold">Cơ chế Theo dõi</h2>
             <p className="text-on-surface-variant mt-1">Dòng ấn phẩm mới nhất được chọn lọc từ các nguồn được giám sát của bạn.</p>
           </div>
           <button className="flex items-center gap-2 px-4 py-2 glass-panel rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-white/5 transition-all text-on-surface">
              <Activity className="w-4 h-4 text-tertiary" /> Bảng tin trực tiếp
           </button>
         </header>

         <div className="space-y-6">
           <h3 className="font-display text-xl font-bold flex items-center gap-3"><Users className="w-5 h-5 text-primary" /> Mới nhất từ người theo dõi</h3>
           
           {[
             { topic: "NLP Lượng tử", title: "Cơ chế chú ý trong các biểu diễn lượng tử đa chiều", time: "2 giờ trước", journal: "J. Quantum Info.", citations: 0, new: true },
             { topic: "Nature Mach. Int.", title: "Hành vi mới nổi trong LLM đa tác nhân trong quá trình đàm phán đối nghịch", time: "5 giờ trước", journal: "Nature Machine Intelligence", citations: 2, new: true }
           ].map((item, i) => (
             <article key={i} className="glass-panel p-8 rounded-2xl relative group hover:bg-white/[0.02] transition-all">
                <div className="absolute top-6 right-6 flex gap-2">
                   {item.new && <span className="bg-primary/20 text-primary text-[10px] font-bold px-2 py-0.5 rounded shadow-[0_0_10px_rgba(208,188,255,0.3)] border border-primary/30 uppercase tracking-widest">Mới</span>}
                </div>
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-[10px] font-bold uppercase tracking-widest bg-secondary-container/30 text-secondary px-2 py-0.5 rounded border border-secondary/30">{item.topic}</span>
                  <span className="flex items-center gap-1 text-[10px] font-bold text-on-surface-variant uppercase tracking-widest"><Clock className="w-3 h-3" /> {item.time}</span>
                </div>
                <h4 className="font-display text-2xl font-bold mb-4 pr-16 group-hover:text-primary transition-colors">{item.title}</h4>
                <p className="text-sm text-on-surface-variant leading-relaxed mb-6">Bài báo này đề xuất một khung mới để tích hợp các cơ chế chú ý trong các mô hình, chứng minh việc giảm 40% độ phức tạp của cổng...</p>
                <div className="flex items-center justify-between pt-6 border-t border-white/5">
                   <div className="flex items-center gap-6">
                      <span className="text-[10px] font-bold text-tertiary uppercase tracking-widest">{item.journal}</span>
                      <span className="flex items-center gap-1.5 text-[10px] font-bold text-on-surface-variant uppercase tracking-widest"><Quote className="w-3 h-3" /> {item.citations} Trích dẫn</span>
                   </div>
                   <button className="flex items-center gap-1 text-primary text-[10px] font-bold uppercase tracking-widest hover:text-tertiary transition-all">Xem nhanh <ArrowRight className="w-3 h-3" /></button>
                </div>
             </article>
           ))}
         </div>
      </div>

      <aside className="lg:col-span-4 space-y-6">
        <div className="glass-panel p-6 rounded-2xl space-y-6">
           <div className="flex justify-between items-center">
              <h3 className="font-display font-bold">Quản lý theo dõi</h3>
              <button className="p-1 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-all"><Plus className="w-4 h-4" /></button>
           </div>
           
           <div className="flex border-b border-white/5">
             {['Chủ đề (12)', 'Tạp chí (5)', 'Tác giả (28)'].map((t, i) => (
               <button key={i} className={cn("flex-1 pb-3 text-[10px] font-bold uppercase tracking-widest transition-all", i === 0 ? "border-b-2 border-primary text-primary" : "text-on-surface-variant hover:text-on-surface")}>{t}</button>
             ))}
           </div>

           <div className="space-y-2">
             {['NLP Lượng tử', 'Học máy đối nghịch', 'Tính toán mô phỏng hệ thần kinh'].map((tag, i) => (
               <div key={i} className="flex justify-between items-center p-3 rounded-xl hover:bg-white/5 transition-all group">
                 <div className="flex items-center gap-3">
                   <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center"><Tag className="w-4 h-4 text-secondary" /></div>
                   <span className="text-sm font-bold text-on-surface group-hover:text-primary transition-colors">{tag}</span>
                 </div>
                 <X className="w-4 h-4 text-on-surface-variant opacity-40 hover:opacity-100 cursor-pointer" />
               </div>
             ))}
           </div>
        </div>
      </aside>
    </div>
  );
}
