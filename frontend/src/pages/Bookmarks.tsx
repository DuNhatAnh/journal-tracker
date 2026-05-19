import { BookmarkX, ArrowRight, ExternalLink } from "lucide-react";
import { cn } from "@/src/lib/utils";

const papers = [
  { id: 1, topic: "AI & ML", title: "Cơ chế chú ý là tất cả những gì bạn cần", abstract: "Chúng tôi đề xuất một kiến trúc mạng đơn giản mới, Transformer, dựa hoàn toàn trên các cơ chế chú ý...", source: "NeurIPS", meta: "2017 • Vaswani et al." },
  { id: 2, topic: "Tính toán lượng tử", title: "Ưu thế lượng tử sử dụng bộ xử lý siêu dẫn có thể lập trình", abstract: "Lời hứa của máy tính lượng tử là một số nhiệm vụ tính toán nhất định có thể được thực hiện nhanh hơn theo cấp số nhân...", source: "Nature", meta: "2019 • Arute et al." },
  { id: 3, topic: "Khoa học thần kinh", title: "Kết nối của não côn trùng", abstract: "Chúng tôi trình bày một sơ đồ kết nối hoàn chỉnh ở cấp độ khớp thần kinh của não ấu trùng Drosophila melanogaster...", source: "Science", meta: "2023 • Winding et al." },
  { id: 4, topic: "Tin sinh học", title: "Dự đoán cấu trúc protein chính xác cao với AlphaFold", abstract: "Protein rất thiết yếu cho sự sống, và hiểu được cấu trúc của chúng có thể tạo điều kiện cho sự hiểu biết cơ học...", source: "Nature", meta: "2021 • Jumper et al." },
];

export default function Bookmarks() {
  return (
    <div className="space-y-12 pb-20">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h2 className="font-display text-4xl font-bold text-on-surface">Dấu trang</h2>
          <p className="text-on-surface-variant mt-2">Quản lý các bài báo học thuật đã lưu và các từ khóa nghiên cứu đang theo dõi.</p>
        </div>
        <div className="flex p-1 bg-surface-container-low border border-white/5 rounded-xl">
           <button className="px-6 py-2.5 rounded-lg bg-primary text-on-primary text-xs font-bold uppercase tracking-widest shadow-lg">Bài báo đã lưu</button>
           <button className="px-6 py-2.5 rounded-lg text-on-surface-variant hover:text-on-surface text-xs font-bold uppercase tracking-widest transition-all">Từ khóa</button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {papers.map((paper) => (
          <div key={paper.id} className="glass-panel p-8 rounded-2xl relative group hover:-translate-y-1 transition-all duration-300 flex flex-col h-full border-t border-white/5">
            <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            
            <div className="flex justify-between items-start mb-6">
              <span className={cn(
                "px-2 px-1 rounded-md text-[10px] font-bold uppercase tracking-widest border",
                paper.id % 2 === 0 ? "bg-secondary-container/20 text-secondary border-secondary/30" : "bg-primary/10 text-primary border-primary/20"
              )}>
                {paper.topic}
              </span>
              <button className="text-on-surface-variant hover:text-error transition-colors p-1"><BookmarkX className="w-5 h-5" /></button>
            </div>

            <h3 className="font-display text-xl font-bold leading-tight mb-4 group-hover:text-primary transition-colors">{paper.title}</h3>
            <p className="text-on-surface-variant text-sm line-clamp-3 mb-8 flex-1">{paper.abstract}</p>

            <div className="flex items-center justify-between pt-6 border-t border-white/5">
              <div className="space-y-0.5">
                <p className="text-[10px] font-bold text-tertiary uppercase tracking-widest">{paper.source}</p>
                <p className="text-[10px] font-medium text-outline-variant">{paper.meta}</p>
              </div>
              <button className="flex items-center gap-1 text-primary text-[10px] font-bold uppercase tracking-widest hover:text-tertiary transition-all">
                Xem <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
