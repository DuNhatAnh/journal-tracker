import { Users, Sparkles, BookOpen, TrendingUp, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";

export default function About() {
  return (
    <div className="max-w-4xl mx-auto pb-20 space-y-10">
      {/* Header Section */}
      <div className="space-y-4 text-center md:text-left">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs font-bold text-primary uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5" />
          Giới thiệu dự án
        </div>
        <h2 className="font-display text-4xl md:text-5xl font-bold tracking-tight text-on-surface">
          Sci<span className="text-primary">Trend</span> là gì?
        </h2>
        <p className="text-lg text-on-surface-variant max-w-2xl font-medium leading-relaxed">
          Cửa sổ nhìn ra thế giới khoa học — Đơn giản, gần gũi và kết nối tri thức đến mọi người.
        </p>
      </div>

      {/* Main Vision */}
      <section className="glass-panel p-8 md:p-10 rounded-2xl space-y-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-2xl rounded-full" />
        <h3 className="font-display text-2xl font-bold text-primary flex items-center gap-2">
          <BookOpen className="w-6 h-6" /> Sứ mệnh của chúng tôi
        </h3>
        <p className="text-on-surface-variant leading-relaxed text-base">
          Hãy tưởng tượng thế giới nghiên cứu khoa học giống như một thư viện khổng lồ với hàng triệu cuốn sách mới xuất bản mỗi ngày. 
          Đối với người không có chuyên môn hoặc mới bắt đầu, việc tìm kiếm và hiểu được đâu là chủ đề đang được quan tâm, hay tạp chí nào uy tín giống như đi vào một mê cung không có lối ra.
        </p>
        <p className="text-on-surface-variant leading-relaxed text-base">
          <strong>SciTrend</strong> ra đời để làm chiếc "kính lúp" thông minh và người chỉ đường thân thiện cho bạn. 
          Chúng tôi tự động gom nhặt, sắp xếp các bài viết khoa học chất lượng trên toàn cầu và trình bày lại bằng giao diện trực quan, 
          dễ hiểu nhất, giúp tri thức khoa học không còn là thứ xa vời mà nằm ngay trong tầm tay bạn.
        </p>
      </section>

      {/* Core values in simple words */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="glass-panel p-6 md:p-8 rounded-2xl space-y-4">
          <div className="w-10 h-10 rounded-xl bg-secondary/15 flex items-center justify-center text-secondary">
            <TrendingUp className="w-5 h-5" />
          </div>
          <h4 className="font-display text-lg font-bold text-on-surface">Bắt kịp xu hướng cực nhanh</h4>
          <p className="text-sm text-on-surface-variant leading-relaxed">
            Giống như tab "Thịnh hành" trên YouTube hay mạng xã hội, SciTrend giúp bạn biết ngay chủ đề khoa học nào đang được thảo luận nhiều nhất hiện nay trên thế giới mà không cần đọc hàng ngàn bài báo.
          </p>
        </div>

        <div className="glass-panel p-6 md:p-8 rounded-2xl space-y-4">
          <div className="w-10 h-10 rounded-xl bg-tertiary/15 flex items-center justify-center text-tertiary">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h4 className="font-display text-lg font-bold text-on-surface">Biết ngay nguồn uy tín</h4>
          <p className="text-sm text-on-surface-variant leading-relaxed">
            Không còn bối rối trước những bài viết không rõ nguồn gốc. Chúng tôi xếp hạng và giải thích rõ ràng độ uy tín của từng tờ báo khoa học (tạp chí) bằng các từ ngữ đời thường, giúp bạn yên tâm tham khảo.
          </p>
        </div>
      </div>

      {/* The Team Section */}
      <section className="glass-panel p-8 md:p-10 rounded-2xl space-y-8">
        <div className="flex items-center gap-3 border-b border-white/5 pb-4">
          <Users className="w-6 h-6 text-primary" />
          <h3 className="font-display text-2xl font-bold text-on-surface">Đội ngũ phát triển</h3>
        </div>
        
        <p className="text-on-surface-variant leading-relaxed">
          Dự án được xây dựng và hoàn thiện bởi nhóm 3 thành viên đầy tâm huyết với mục tiêu phổ cập tri thức:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-2">
          {[
            { name: "Anh", role: "Lập trình viên Fullstack", desc: "Quản lý kiến trúc hệ thống và vận hành cơ sở dữ liệu." },
            { name: "Dũng", role: "Lập trình viên Fullstack", desc: "Xây dựng các luồng dữ liệu thông minh và tính năng tìm kiếm." },
            { name: "Bảo", role: "Lập trình viên Fullstack", desc: "Thiết kế và phát triển giao diện người dùng mượt mà, tối giản." }
          ].map((member, i) => (
            <div key={i} className="bg-white/5 border border-white/5 p-6 rounded-xl space-y-3 hover:border-primary/20 transition-colors">
              <div className="w-12 h-12 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-lg">
                {member.name.charAt(0)}
              </div>
              <div>
                <h4 className="font-bold text-on-surface">{member.name}</h4>
                <p className="text-[10px] text-primary uppercase font-bold tracking-wider mt-0.5">{member.role}</p>
              </div>
              <p className="text-xs text-on-surface-variant leading-relaxed">{member.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <div className="flex flex-col sm:flex-row items-center justify-between p-8 glass-panel rounded-2xl gap-6">
        <div>
          <h4 className="font-bold text-on-surface text-lg">Bạn đã sẵn sàng khám phá chưa?</h4>
          <p className="text-sm text-on-surface-variant mt-1">Đọc hướng dẫn sử dụng nhanh để bắt đầu ngay.</p>
        </div>
        <div className="flex gap-4">
          <Link to="/dashboard" className="px-6 py-3 rounded-xl border border-white/10 hover:bg-white/5 transition-all text-xs font-bold uppercase tracking-widest text-on-surface-variant">
            Về Trang chủ
          </Link>
          <Link to="/guide" className="px-6 py-3 rounded-xl gradient-btn transition-all text-xs font-bold uppercase tracking-widest text-white shadow-lg">
            Xem hướng dẫn sử dụng
          </Link>
        </div>
      </div>
    </div>
  );
}
