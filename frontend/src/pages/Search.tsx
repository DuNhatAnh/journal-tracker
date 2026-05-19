import { Filter, Search as SearchIcon, ChevronLeft, ChevronRight, Bookmark, Lock, Quote } from "lucide-react";
import { cn } from "@/src/lib/utils";

export default function Search() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pb-20">
      <aside className="lg:col-span-3 space-y-6 sticky top-[100px] self-start">
        <div className="glass-panel p-6 rounded-2xl space-y-8">
           <div className="flex justify-between items-center">
             <h3 className="font-display font-bold text-lg flex items-center gap-2"><Filter className="w-4 h-4 text-primary" /> Lọc</h3>
             <button className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant hover:text-primary transition-colors">Đặt lại</button>
           </div>

           <div className="space-y-4">
             <h4 className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Năm xuất bản</h4>
             <div className="flex items-center gap-2">
               <div className="flex-1 glass-panel p-2 rounded text-center text-xs">2018</div>
               <span className="text-outline-variant">-</span>
               <div className="flex-1 glass-panel p-2 rounded text-center text-xs">2024</div>
             </div>
             <div className="h-1 bg-surface-container-high rounded-full relative">
               <div className="absolute left-[30%] right-0 h-full bg-primary rounded-full" />
               <div className="absolute left-[30%] top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-primary shadow-lg shadow-primary/30 cursor-pointer" />
             </div>
           </div>

           <div className="space-y-4">
             <h4 className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Lĩnh vực nghiên cứu</h4>
             <select className="w-full bg-surface-container-high border border-white/10 rounded-lg p-2.5 text-sm">
               <option>Khoa học máy tính</option>
               <option>Vật lý lượng tử</option>
             </select>
           </div>
        </div>
      </aside>

      <div className="lg:col-span-9 space-y-8">
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-end border-b border-white/5 pb-6 gap-4">
          <div>
            <p className="text-[10px] font-mono text-on-surface-variant uppercase tracking-widest mb-1">Hiển thị 1.248 kết quả</p>
            <h2 className="font-display text-3xl font-bold">Kết quả cho <span className="gradient-text">"Học máy trong tính toán lượng tử"</span></h2>
          </div>
          <div className="flex items-center gap-2 glass-panel p-1 rounded-lg">
            <span className="text-[10px] font-bold uppercase tracking-widest px-3 text-on-surface-variant">Sắp xếp:</span>
            <select className="bg-transparent border-none text-xs font-bold text-primary focus:ring-0">
               <option>Độ liên quan</option>
               <option>Trích dẫn nhiều nhất</option>
            </select>
          </div>
        </header>

        <div className="space-y-6">
          {[
            { tag: "Trích dẫn cao", title: "Ưu thế lượng tử sử dụng bộ xử lý siêu dẫn có thể lập trình", source: "Nature | 2019", authors: "Frank Arute, Kunal Arya, Ryan Babbush et al.", abstract: "Lời hứa của máy tính lượng tử là một số nhiệm vụ tính toán nhất định có thể được thực hiện nhanh hơn theo cấp số nhân trên bộ xử lý lượng tử so với bộ xử lý cổ điển...", citations: "8.432", access: "Truy cập mở" },
            { tag: "", title: "Học máy cho vật chất lượng tử: Ứng dụng cho kính Spin", source: "Science | 2017", authors: "Giuseppe Carleo, Matthias Troyer", abstract: "Chúng tôi giới thiệu một biểu diễn của các trạng thái lượng tử nhiều vật dựa trên mạng thần kinh nhân tạo. Chúng tôi chỉ ra rằng các mạng này có thể mô tả hiệu quả các trạng thái nhiều vật...", citations: "4.102", access: "" }
          ].map((paper, i) => (
            <article key={i} className="glass-panel p-8 rounded-2xl relative overflow-hidden group hover:border-primary/30 transition-all">
              {paper.tag && <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-tertiary to-transparent" />}
              <div className="flex justify-between items-start gap-4 mb-2">
                <div className="flex flex-col gap-3">
                  {paper.tag && <span className="w-fit bg-tertiary/10 text-tertiary text-[10px] font-bold px-2 py-0.5 rounded border border-tertiary/20 uppercase tracking-widest">{paper.tag}</span>}
                  <h3 className="font-display text-2xl font-bold leading-tight group-hover:text-primary transition-colors cursor-pointer">{paper.title}</h3>
                </div>
                <button className="p-2 rounded-full hover:bg-white/5 text-on-surface-variant hover:text-tertiary transition-colors"><Bookmark className="w-5 h-5" /></button>
              </div>
              <p className="text-sm text-secondary font-medium mb-4">{paper.authors} • <span className="text-on-surface">{paper.source}</span></p>
              <p className="text-on-surface-variant text-sm line-clamp-3 mb-6 leading-relaxed">{paper.abstract}</p>
              
              <div className="flex flex-wrap items-center gap-6 pt-6 border-t border-white/5">
                 <div className="flex items-center gap-6 mr-auto">
                    <span className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant"><Quote className="w-3 h-3" /> {paper.citations} Trích dẫn</span>
                    {paper.access && <span className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-primary"><Lock className="w-3 h-3" /> {paper.access}</span>}
                 </div>
                 <button className="px-4 py-2 rounded-lg border border-white/10 text-[10px] font-bold uppercase tracking-widest hover:bg-white/5 transition-all">Xem chi tiết</button>
                 <button className="px-4 py-2 rounded-lg gradient-btn text-[10px] font-bold uppercase tracking-widest text-white">Tải xuống PDF</button>
              </div>
            </article>
          ))}
        </div>

        <div className="flex justify-center items-center gap-2 pt-8">
           <button className="p-2 rounded border border-white/10 hover:bg-white/5"><ChevronLeft className="w-4 h-4" /></button>
           {[1, 2, 3, '...', 125].map((p, i) => (
             <button key={i} className={cn("w-10 h-10 rounded text-xs font-bold", p === 1 ? "bg-primary/20 text-primary border border-primary/30" : "hover:bg-white/5")}>{p}</button>
           ))}
           <button className="p-2 rounded border border-white/10 hover:bg-white/5"><ChevronRight className="w-4 h-4" /></button>
        </div>
      </div>
    </div>
  );
}
