# DB Naming Convention (Journal Tracker)

Quy tắc đặt tên bắt buộc cho CSDL dự án này:

- **Bảng chính (Main tables)**: Luôn dùng số nhiều (`users`, `research_papers`, `journals`, `keywords`...)
- **Foreign Keys**: Luôn dùng `tênđơn_id` (`paper_id`, `keyword_id`, `author_id`...)
- **BẢNG PIVOT (Ngoại lệ - Phải thuộc lòng):**
  - Bài báo + Tác giả: `paper_author`
  - Bài báo + Chủ đề: `keyword_paper`
  - Người dùng + Chủ đề: `user_keyword`

*Lưu ý: Không dùng quy tắc alphabet tự động của framework cho 3 bảng pivot trên để tránh lỗi SQL.*
