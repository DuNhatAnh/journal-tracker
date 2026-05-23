import { BookOpen, Search, Bookmark, HelpCircle, CheckCircle, Home, FileText, Award } from "lucide-react";
import { Link } from "react-router-dom";

export default function Guide() {
  return (
    <div className="max-w-4xl mx-auto pb-20 space-y-10">
      {/* Header Section */}
      <div className="space-y-4 text-center md:text-left">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs font-bold text-primary uppercase tracking-wider">
          <HelpCircle className="w-3.5 h-3.5" />
          Cẩm nang sử dụng
        </div>
        <h2 className="font-display text-4xl md:text-5xl font-bold tracking-tight text-on-surface">
          Hướng dẫn <span className="text-primary">Trải nghiệm</span>
        </h2>
        <p className="text-lg text-on-surface-variant max-w-2xl font-medium leading-relaxed">
          Chỉ mất 3 phút đọc để bạn làm chủ toàn bộ tính năng và tự tin khám phá thế giới tri thức!
        </p>
      </div>

      {/* Main Steps */}
      <div className="space-y-6">
        {[
          {
            step: "Bước 1",
            title: "Khám phá Trang chủ (Bảng tin khoa học)",
            icon: Home,
            color: "text-primary bg-primary/10 border-primary/20",
            desc: "Khi đăng nhập thành công, bạn sẽ thấy ngay một bảng thống kê gọn gàng. Ở đây hiển thị các từ khóa đang 'nổi đình nổi đám' trong giới nghiên cứu (như những chủ đề hot trên mạng xã hội) và một vài con số thống kê thú vị. Đây là điểm khởi đầu tuyệt vời để biết thế giới hôm nay đang quan tâm đến công nghệ hay nghiên cứu nào."
          },
          {
            step: "Bước 2",
            title: "Tìm kiếm bài viết cực kỳ dễ dàng",
            icon: Search,
            color: "text-secondary bg-secondary/10 border-secondary/20",
            desc: "Ở trên cùng của màn hình luôn có một thanh tìm kiếm lớn. Bạn chỉ cần gõ bất cứ chủ đề nào mình tò mò (ví dụ: 'AI', 'môi trường', 'sức khỏe') và nhấn Enter. Hệ thống sẽ ngay lập tức lục tìm trong kho lưu trữ toàn cầu và liệt kê cho bạn các bài viết có liên quan, kèm theo tóm tắt ngắn để bạn quyết định xem có nên đọc hay không."
          },
          {
            step: "Bước 3",
            title: "Lưu lại bài viết hay vào 'Tủ sách cá nhân'",
            icon: Bookmark,
            color: "text-tertiary bg-tertiary/10 border-tertiary/20",
            desc: "Khi lướt thấy một bài viết thú vị nhưng chưa có thời gian đọc ngay, bạn chỉ cần nhấp vào biểu tượng hình chiếc ghim hoặc nút 'Lưu bài báo'. Bài viết đó sẽ được cất giữ cẩn thận trong 'Tủ sách của tôi' ở trang chủ, giúp bạn mở lại bất cứ khi nào cần mà không sợ bị quên tên hay thất lạc."
          },
          {
            step: "Bước 4",
            title: "Đọc thông tin và đánh giá các 'Tạp chí uy tín'",
            icon: Award,
            color: "text-warning bg-warning/10 border-warning/20",
            desc: "Tại phần 'Tạp chí hàng đầu', bạn sẽ thấy các tờ báo khoa học uy tín nhất. Khi nhấp vào một tạp chí, một bảng thông tin nhỏ sẽ hiện lên. Chúng tôi đã dịch các thuật ngữ phức tạp thành định nghĩa cực kỳ dễ hiểu. Ví dụ: chúng tôi giải thích rõ 'Chỉ số ảnh hưởng (Impact Factor)' là thang đo độ uy tín, hay 'ISSN' chính là số định danh duy nhất giống như mã vạch của tạp chí đó."
          }
        ].map((item, idx) => (
          <div key={idx} className="glass-panel p-6 md:p-8 rounded-2xl flex flex-col md:flex-row gap-6 items-start hover:border-white/10 transition-colors">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center border flex-shrink-0 ${item.color}`}>
              <item.icon className="w-6 h-6" />
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-[10px] bg-white/5 border border-white/10 px-2 py-0.5 rounded font-bold uppercase tracking-wider text-on-surface-variant">
                  {item.step}
                </span>
                <h3 className="font-display text-xl font-bold text-on-surface">{item.title}</h3>
              </div>
              <p className="text-sm text-on-surface-variant leading-relaxed">
                {item.desc}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* FAQs */}
      <section className="glass-panel p-8 md:p-10 rounded-2xl space-y-6">
        <h3 className="font-display text-2xl font-bold text-on-surface flex items-center gap-2">
          <BookOpen className="w-6 h-6 text-primary" /> Những thắc mắc thường gặp
        </h3>
        
        <div className="space-y-6 pt-2">
          <div className="space-y-2">
            <h4 className="font-bold text-on-surface text-base">Q: Tôi không phải là nhà khoa học, tôi có dùng được hệ thống này không?</h4>
            <p className="text-sm text-on-surface-variant leading-relaxed">
              <strong>Trả lời:</strong> Hoàn toàn được! SciTrend được thiết kế tối giản và trực quan để bất kỳ ai yêu thích tri thức, công nghệ hay đơn giản là muốn làm phong phú thêm hiểu biết của bản thân đều có thể dễ dàng sử dụng và tìm kiếm bài đọc.
            </p>
          </div>

          <div className="space-y-2 border-t border-white/5 pt-4">
            <h4 className="font-bold text-on-surface text-base">Q: Các chỉ số như "Chỉ số trích dẫn" và "Chỉ số ảnh hưởng" nghĩa là gì?</h4>
            <p className="text-sm text-on-surface-variant leading-relaxed">
              <strong>Trả lời:</strong> Nói một cách dễ hiểu nhất:
              <br />- <strong>Chỉ số trích dẫn (Citations):</strong> Cho biết có bao nhiêu nghiên cứu khác đã tham khảo và nhắc tới bài viết này. Bài viết càng hữu ích thì chỉ số này càng cao.
              <br />- <strong>Chỉ số ảnh hưởng (Impact Factor):</strong> Là điểm số uy tín của một tờ báo khoa học. Điểm càng cao chứng tỏ tờ báo đó đăng nhiều bài viết chất lượng và được giới chuyên môn tin tưởng lớn.
            </p>
          </div>
        </div>
      </section>

      {/* Next Steps */}
      <div className="flex flex-col sm:flex-row items-center justify-between p-8 glass-panel rounded-2xl gap-6">
        <div className="flex items-center gap-3">
          <CheckCircle className="w-10 h-10 text-success flex-shrink-0" />
          <div>
            <h4 className="font-bold text-on-surface text-lg">Bạn đã hiểu rõ cách hoạt động rồi chứ?</h4>
            <p className="text-sm text-on-surface-variant mt-1">Quay lại trang chủ và bắt đầu hành trình tìm kiếm tri thức của bạn.</p>
          </div>
        </div>
        <div className="flex gap-4">
          <Link to="/about" className="px-6 py-3 rounded-xl border border-white/10 hover:bg-white/5 transition-all text-xs font-bold uppercase tracking-widest text-on-surface-variant">
            Tìm hiểu về dự án
          </Link>
          <Link to="/dashboard" className="px-6 py-3 rounded-xl gradient-btn transition-all text-xs font-bold uppercase tracking-widest text-white shadow-lg">
            Đến Trang chủ ngay
          </Link>
        </div>
      </div>
    </div>
  );
}
