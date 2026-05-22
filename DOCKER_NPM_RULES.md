# Quy tắc cài đặt thư viện khi dùng Docker

- **Cài đặt Package (NPM):** Khi cài thêm thư viện mới, BẮT BUỘC phải cài trực tiếp vào bên trong container (ví dụ: `docker exec journal-tracker-frontend npm install <tên-thư-viện>`) và khởi động lại container để tránh lỗi không nhận thư viện.
