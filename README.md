# 📚 Journal Tracker — Scientific Journal Publication Trend Tracking System

> **Lưu ý / Scope**: Hệ thống được thiết kế **chỉ giới hạn thu thập và phân tích các bài báo học thuật thuộc lĩnh vực Computer Science (Khoa học Máy tính)** thông qua OpenAlex API. Việc này giúp giảm độ phức tạp của hệ thống và tập trung vào dữ liệu của một chuyên ngành cụ thể.

---

## 📖 Bối Cảnh & Ý Nghĩa Dự Án (Introduction & Context)

Trong bối cảnh số lượng bài báo khoa học và journal học thuật ngày càng gia tăng, việc theo dõi xu hướng nghiên cứu, chủ đề nổi bật và sự phát triển của các lĩnh vực học thuật trở nên khó khăn đối với giảng viên, sinh viên và nhà nghiên cứu. Các nền tảng học thuật hiện nay chủ yếu hỗ trợ tìm kiếm bài báo thuần túy nhưng chưa tập trung nhiều vào việc phân tích xu hướng công bố theo thời gian và trực quan hóa dữ liệu nghiên cứu một cách sinh động.

### ⚠️ Những Vấn Đề Giải Quyết (Problems Addressed)
1. **Quá tải thông tin**: Khó theo dõi sự thay đổi và phát triển của các chủ đề nghiên cứu theo thời gian do số lượng bài báo khoa học ngày càng lớn và tăng lên mỗi ngày.
2. **Thiếu tính trực quan**: Việc tìm kiếm bài báo trên các nền tảng học thuật hiện nay chủ yếu dựa trên từ khóa dạng danh sách văn bản thô, chưa hỗ trợ phân tích xu hướng nghiên cứu trực quan bằng biểu đồ và đồ thị liên kết.
3. **Tốn thời gian & công sức**: Giảng viên, sinh viên và nhà nghiên cứu mất nhiều thời gian để tự mình tổng hợp các bài báo, xác định xem chủ đề nào đang nổi bật hoặc có tiềm năng để tiến hành đề tài nghiên cứu mới.

---

## 👥 Đối Tượng Sử Dụng & Ma Trận Tính Năng (User Roles & Feature Matrix)

Hệ thống được thiết kế và phân quyền chặt chẽ cho 3 đối tượng người dùng chính với các nhu cầu chuyên biệt:

### 1. 🧪 Nhà Nghiên Cứu (Researcher)
*   **Phân tích xu hướng nghiên cứu chuyên sâu**: Theo dõi và trực quan hóa tốc độ xuất bản (Publication Velocity) theo năm, phân bố chủ đề đồng xuất hiện (Topic Distribution) dưới dạng biểu đồ động.
*   **Mạng lưới liên kết học thuật**: Trực quan hóa mạng lưới đồng tác giả (Co-authorship network graph) dưới dạng sơ đồ nút (node graph) tương tác sinh động.
*   **Phân tích khoảng trống nghiên cứu (AI Research Gap Insight)**: Tự động đánh giá tiềm năng của từ khóa/chủ đề dựa trên các chỉ số thống kê thực tế (ví dụ: phát hiện các vùng *"Khoảng trống Vàng / Đại dương xanh"*, *"Ngách chất lượng / Tác động cao"*, *"Xu hướng bùng nổ"*).
*   **Tạo Literature Review bằng AI**: Tích hợp mô hình **Gemini AI (`gemini-2.5-flash`)** giúp đọc và tự động tổng hợp Literature Review bằng tiếng Việt từ danh sách các bài báo được chọn (bao gồm tóm tắt tổng quan, điểm tương đồng/đóng góp, định hướng nghiên cứu mới, tải bản nháp `.txt` và sao chép định dạng trích dẫn).
*   **Xuất báo cáo bài báo đã lưu**: Hỗ trợ xuất danh sách bài báo đã lưu ra file **CSV (UTF-8 BOM)** với khả năng tùy chọn linh hoạt các cột dữ liệu (Tiêu đề, tác giả, tạp chí, năm xuất bản, số trích dẫn, ghi chú cá nhân, URL/DOI...).
*   **Đăng ký nhận thông báo**: Đăng ký nhận thông báo hệ thống/email khi có ấn phẩm mới được xuất bản liên quan đến các từ khóa hoặc tác giả đang theo dõi.

### 2. 🎓 Giảng Viên & Sinh Viên (Lecturer & Student - Academic)
*   **Dashboard xu hướng cơ bản**: Xem tổng quan về các tạp chí hàng đầu và biểu đồ xu hướng xuất bản bài báo khoa học theo thời gian.
*   **Tìm kiếm & Tra cứu**: Công cụ tìm kiếm bài báo thông minh theo từ khóa, tác giả, tạp chí với dữ liệu được cập nhật từ OpenAlex API.
*   **Lưu trữ tài liệu học tập**: Lưu (bookmark) các bài báo khoa học quan tâm và thêm ghi chú cá nhân (personal note) cho từng tài liệu để phục vụ việc học tập và giảng dạy.
*   **Theo dõi & Thông báo**: Quản lý thông báo và cập nhật thông tin hồ sơ cá nhân, đổi mật khẩu.

### 3. 🛡️ Quản Trị Viên Hệ Thống (System Administrator)
*   **Quản lý người dùng**: Thêm, sửa, xóa, khóa/mở khóa tài khoản người dùng và gán vai trò tương ứng.
*   **Quản lý nguồn dữ liệu (API Sources)**: Cấu hình URL nguồn API học thuật, trạng thái hoạt động.
*   **Đồng bộ dữ liệu chủ động**: Kích hoạt tiến trình đồng bộ dữ liệu ngầm từ OpenAlex API cho các từ khóa/lĩnh vực (hỗ trợ phân trang, giới hạn năm xuất bản).
*   **Giám sát & Điều khiển**: Xem nhật ký đồng bộ (Sync Logs) thời gian thực và cho phép hủy tiến trình đồng bộ đang chạy (`cancelSync`).
*   **Quản lý & Gộp từ khóa trùng lặp (Keyword Merge & Unmerge)**:
    *   *Merge (Gộp từ khóa)*: Gộp các từ khóa viết tắt/đồng nghĩa (ví dụ: *AI* vào *Artificial Intelligence*). Hệ thống tự động chuyển toàn bộ bài báo và người theo dõi sang từ khóa đích, gửi thông báo hệ thống cho các thành viên và tính toán lại xu hướng tăng trưởng của từ khóa đích.
    *   *Unmerge (Khôi phục gộp)*: Sử dụng nhật ký lưu trữ `keyword_merge_logs` để khôi phục hoàn toàn dữ liệu quan hệ của từ khóa nguồn về trạng thái ban đầu trước khi gộp.
*   **Cấu hình giới hạn hệ thống**: Thiết lập giới hạn tối đa số lượng bài báo lưu trữ (bookmarks limit) cho từng vai trò người dùng (cấu hình lưu trữ động trong `system_settings.json`).

---

## 🏗️ Project Structure

```
journal-tracker/
├── backend/    ← Laravel 11 REST API (PHP 8.2+)
└── frontend/   ← React 18 SPA (Vite + Tailwind CSS)
```

---

## ⚙️ Tech Stack

| Layer      | Technology                              |
|------------|-----------------------------------------|
| Backend    | PHP 8.2+ / Laravel 11 / Sanctum         |
| AI Engine  | Google Gemini API (`gemini-2.5-flash`)  |
| HTTP Client| GuzzleHTTP (built-in Laravel)           |
| Queue/Cache| Redis                                   |
| Database   | Supabase (PostgreSQL)                   |
| Frontend   | React 18 + Vite + Tailwind CSS          |
| Charts     | ApexCharts                              |
| Routing    | React Router v6                         |
| API Client | Axios (with Bearer token interceptor)   |

---

## 🐳 Docker Setup (Khuyên dùng - Đã tối ưu siêu nhẹ)

Nếu bạn không muốn cài đặt thủ công PHP, Composer, Node.js và Redis trên máy local, bạn có thể chạy toàn bộ dự án chỉ bằng 1 câu lệnh Docker. 

### Các tối ưu hóa giúp hệ thống chạy nhẹ nhất:
- **Alpine Linux base images**: Sử dụng các phiên bản Alpine siêu nhỏ cho cả PHP, Node và Redis để giảm dung lượng đĩa và RAM tối đa.
- **Single Process Webserver**: Sử dụng máy chủ Web tích hợp của PHP qua `php artisan serve` bên trong container giúp loại bỏ sự cần thiết của container Nginx riêng biệt, tiết kiệm thêm dung lượng và CPU.
- **Predis Library**: Dùng Predis viết bằng PHP thay vì cài đặt và biên dịch thư viện C `php-redis`, giúp build container cực nhanh và gọn nhẹ.
- **Volume caching**: Tách rời `node_modules` và `vendor` bằng anonymous volumes để tránh xung đột hiệu năng ghi đĩa trên máy host (đặc biệt hữu ích trên Windows).

### Hướng dẫn chạy:

1. **Điền thông tin kết nối Supabase, Google Client & Gemini AI:**
   Sao chép file `backend/.env.example` thành `backend/.env` và cập nhật thông tin database kết nối tới Supabase của bạn (`DB_HOST`, `DB_DATABASE`, `DB_USERNAME`, `DB_PASSWORD`).
   Để sử dụng tính năng Đăng nhập bằng Google, điền thêm các khóa `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` và `GOOGLE_REDIRECT_URI`.
   Để sử dụng tính năng AI Literature Review, điền khóa `GEMINI_API_KEY`.

2. **Khởi động Docker Compose:**
   Tại thư mục gốc của dự án (`journal-tracker/`), chạy lệnh sau:
   ```powershell
   docker compose up --build
   ```
   *Hệ thống sẽ tự động sao chép .env, cài đặt toàn bộ PHP/Node dependencies và sinh `APP_KEY`.*

3. **Truy cập ứng dụng:**
   - **Frontend:** [http://localhost:3000](http://localhost:3000)
   - **Backend API:** [http://localhost:8000](http://localhost:8000)

4. **Các lệnh tiện ích:**
   ```powershell
   # Dừng dự án
   docker compose down
   
   # Chạy migrations trong container backend
   docker compose exec backend php artisan migrate
   
   # Seed dữ liệu mẫu vào database
   docker compose exec backend php artisan db:seed
   ```

---

## 🚀 Backend Setup (`backend/`)

Nếu muốn chạy thủ công bên ngoài Docker:

```powershell
cd backend

# 1. Cài PHP dependencies (yêu cầu PHP 8.2+)
composer install

# 2. Copy và cấu hình môi trường
cp .env.example .env
php artisan key:generate

# 3. Điền Supabase, Google & Gemini credentials vào .env
#    DB_HOST, DB_DATABASE, DB_USERNAME, DB_PASSWORD
#    GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI
#    GEMINI_API_KEY

# 4. Chạy migrations
php artisan migrate

# 5. Seed dữ liệu mẫu
php artisan db:seed

# 6. Khởi động API server (port 8000)
php artisan serve

# 7. Queue worker (cho background sync)
php artisan queue:work
```

**Các tài khoản mặc định sau khi seed:**

| Vai trò | Email | Mật khẩu |
|------|-------|---------|
| Admin | admin@journaltracker.app | `12345678` |
| Researcher | researcher@journaltracker.app | `12345678` |
| Lecturer | lecturer@journaltracker.app | `12345678` |
| Student | student@journaltracker.app | `12345678` |

---

## 🎨 Frontend Setup (`frontend/`)

```powershell
cd frontend

# 1. Cài Node dependencies
npm install

# 2. Tạo .env
cp .env.example .env

# 3. Chạy dev server (port 3000)
npm run dev
```

Vite dev proxy tự động forward `/api/*` → `http://localhost:8000` nên không cần cấu hình thêm.

Mở trình duyệt: **http://localhost:3000**

---

## 📁 Backend Structure (`backend/`)

```
backend/
├── app/
│   ├── Console/Commands/
│   │   └── SyncPapersCommand.php       ← php artisan papers:sync
│   ├── Http/
│   │   ├── Controllers/Api/
│   │   │   ├── Auth/AuthController.php ← POST /api/login, /register
│   │   │   ├── DashboardController.php ← GET /api/dashboard
│   │   │   ├── PaperController.php     ← GET /api/papers
│   │   │   ├── TrendController.php     ← GET /api/trends
│   │   │   ├── BookmarkController.php  ← /api/bookmarks CRUD
│   │   │   ├── JournalController.php
│   │   │   ├── KeywordController.php
│   │   │   ├── NotificationController.php
│   │   │   └── Admin/                  ← Admin-only controllers
│   │   └── Middleware/
│   │       └── RoleMiddleware.php
│   ├── Jobs/
│   │   └── SyncPapersFromApi.php       ← Background sync job
│   ├── Models/                         ← Eloquent models
│   └── Services/
│       └── OpenAlexService.php         ← Guzzle API calls
├── database/
│   ├── migrations/                     ← 11 tables
│   └── seeders/
├── routes/
│   ├── api.php                         ← Tất cả REST API routes
│   └── web.php
└── .env.example
```

---

## 📁 Frontend Structure (`frontend/`)

```
frontend/
├── src/
│   ├── api/
│   │   ├── axios.js        ← Axios instance + interceptors
│   │   └── services.js     ← Tất cả API functions (authApi, papersApi...)
│   ├── contexts/
│   │   └── AuthContext.jsx ← Login/logout state + localStorage token
│   ├── hooks/
│   │   └── useFetch.js     ← Generic data fetching hook
│   ├── components/
│   │   ├── layout/
│   │   │   └── AppLayout.jsx ← Sidebar + topbar layout
│   │   ├── charts/           ← Reusable chart components
│   │   └── ui/               ← Reusable UI components
│   ├── pages/
│   │   ├── Auth/           ← Login.jsx, Register.jsx
│   │   ├── Dashboard/      ← Dashboard.jsx
│   │   ├── Papers/         ← PapersList, PaperDetail, PapersSearch
│   │   ├── Trends/         ← TrendsOverview, TrendsTrending, TrendDetail
│   │   ├── Bookmarks/      ← BookmarksList.jsx
│   │   └── Admin/          ← Admin pages
│   ├── App.jsx             ← React Router routes
│   └── main.jsx            ← Entry point
├── index.html
├── package.json
├── vite.config.js          ← Proxy /api → localhost:8000
└── tailwind.config.js
```

---

## 🔌 API Endpoints

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| POST | `/api/login` | Đăng nhập, nhận token |
| POST | `/api/register` | Đăng ký tài khoản |
| GET | `/api/auth/google/redirect` | Chuyển hướng đăng nhập Google (SSO) |
| GET | `/api/auth/google/callback` | Xử lý callback xác thực từ Google |
| POST | `/api/logout` | Đăng xuất |
| GET | `/api/me` | Thông tin user hiện tại |
| GET | `/api/dashboard` | Stats + trending topics |
| GET | `/api/papers` | Danh sách bài báo (paginated) |
| GET | `/api/papers/search?q=` | Tìm kiếm bài báo |
| GET | `/api/papers/{id}` | Chi tiết bài báo |
| GET | `/api/trends` | Tổng quan xu hướng |
| GET | `/api/trends/trending` | Hot topics |
| GET | `/api/trends/{slug}` | Chi tiết keyword trend |
| GET | `/api/bookmarks` | Danh sách bookmark |
| POST | `/api/bookmarks` | Tạo bookmark |
| DELETE | `/api/bookmarks/{id}` | Xóa bookmark |

---

## 📜 Quy Quy Tắc Phát Triển Cho Developer (Developer Guidelines)

Để đảm bảo dự án hoạt động ổn định và tránh lỗi, vui lòng tuân thủ các quy tắc sau:

### 🗄️ 1. Quy tắc đặt tên và truy vấn CSDL (Database Naming & Query)
*Xem chi tiết tại [DATABASE_NAMING.md](file:///c:/Users/phamm/Full%20Projects/journal-tracker/DATABASE_NAMING.md)*:
- **Tên bảng chính (Main tables)**: Luôn dùng số nhiều (`users`, `research_papers`, `journals`, `keywords`...).
- **Khóa ngoại (Foreign Keys)**: Luôn dùng `tênđơn_id` (`paper_id`, `keyword_id`, `author_id`...).
- **Tên bảng Pivot (Bắt buộc)**:
  - Bài báo + Tác giả: `paper_author`
  - Bài báo + Chủ đề: `keyword_paper`
  - Người dùng + Chủ đề: `user_keyword`
  *(Không dùng quy tắc sắp xếp alphabet tự động của framework để tránh lỗi).*
- **Truy vấn Boolean trên PostgreSQL**:
  - KHÔNG dùng `where('is_active', true)` (Laravel tự dịch thành số `1` gây lỗi cú pháp Postgres).
  - **Bắt buộc dùng**: `whereRaw('is_active = true')` hoặc `where('is_active', '=', 'true')`.

### 📦 2. Cài đặt Package NPM khi chạy Docker
*Xem chi tiết tại [DOCKER_NPM_RULES.md](file:///c:/Users/phamm/Full%20Projects/journal-tracker/DOCKER_NPM_RULES.md)*:
- Khi cài thêm thư viện NPM mới, **BẮT BUỘC** phải cài trực tiếp vào bên trong container:
  ```powershell
  docker exec -it <container-id-frontend> npm install <tên-thư-viện>
  ```
  Sau đó khởi động lại container để đảm bảo hệ thống nhận thư viện mới một cách chính xác.

---

## 🛠️ Lệnh Tiện Ích (Useful Commands)

```powershell
# Đồng bộ thủ công dữ liệu bài báo học thuật theo từ khóa (Ví dụ: 3 trang về Machine Learning)
php artisan papers:sync --keyword="machine learning" --pages=3

# Chạy queue worker xử lý hàng đợi đồng bộ ngầm
php artisan queue:work

# Liệt kê tất cả API Routes
php artisan route:list

# Xóa cache Laravel
php artisan cache:clear
```
