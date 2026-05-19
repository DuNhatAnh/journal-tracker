# 📚 Journal Tracker — Scientific Journal Publication Trend Tracking System

## 🏗️ Project Structure

```
journal-tracker/
├── backend/    ← Laravel 11 REST API (PHP 8.2+)
└── frontend/   ← React 18 SPA (Vite + Tailwind)
```

---

## ⚙️ Tech Stack

| Layer      | Technology                              |
|------------|-----------------------------------------|
| Backend    | PHP 8.2+ / Laravel 11 / Sanctum         |
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

1. **Điền thông tin kết nối Supabase:**
   Sao chép file `backend/.env.example` thành `backend/.env` và cập nhật thông tin database kết nối tới Supabase của bạn (`DB_HOST`, `DB_DATABASE`, `DB_USERNAME`, `DB_PASSWORD`).

2. **Khởi động Docker Compose:**
   Tại thư mục gốc của dự án (`journal-tracker/`), chạy lệnh sau:
   ```powershell
   docker compose up --build
   ```
   *Hệ thống sẽ tự động sao chép .env, cài đặt toàn bộ PHP/Node dependencies và sinh `APP_KEY`.*

3. **Truy cập ứng dụng:**
   - **Frontend:** [http://localhost:5173](http://localhost:5173)
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

```powershell
cd backend

# 1. Cài PHP dependencies (yêu cầu PHP 8.2+)
composer install

# 2. Copy và cấu hình môi trường
cp .env.example .env
php artisan key:generate

# 3. Điền Supabase credentials vào .env
#    DB_HOST, DB_DATABASE, DB_USERNAME, DB_PASSWORD

# 4. Chạy migrations
php artisan migrate

# 5. Seed dữ liệu mẫu
php artisan db:seed

# 6. Khởi động API server (port 8000)
php artisan serve

# 7. Queue worker (cho background sync)
php artisan queue:work
```

**Demo accounts sau khi seed:**

| Role | Email | Password |
|------|-------|---------|
| Admin | admin@journaltracker.app | password |
| Researcher | researcher@journaltracker.app | password |
| Lecturer | lecturer@journaltracker.app | password |
| Student | student@journaltracker.app | password |

---

## 🎨 Frontend Setup (`frontend/`)

```powershell
cd frontend

# 1. Cài Node dependencies
npm install

# 2. Tạo .env
cp .env.example .env

# 3. Chạy dev server (port 5173)
npm run dev
```

Vite dev proxy tự động forward `/api/*` → `http://localhost:8000` nên không cần cấu hình thêm.

Mở trình duyệt: **http://localhost:5173**

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
│   │   ├── charts/           ← Reusable chart components (TODO)
│   │   └── ui/               ← Reusable UI components (TODO)
│   ├── pages/
│   │   ├── Auth/           ← Login.jsx, Register.jsx
│   │   ├── Dashboard/      ← Dashboard.jsx
│   │   ├── Papers/         ← PapersList, PaperDetail, PapersSearch
│   │   ├── Trends/         ← TrendsOverview, TrendsTrending, TrendDetail
│   │   ├── Bookmarks/      ← BookmarksList.jsx
│   │   └── Admin/          ← (TODO) Admin pages
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

## 🌿 Git Workflow

```bash
git checkout -b feature/your-feature-name
# ... code ...
git add .
git commit -m "feat: mô tả tính năng"
git push origin feature/your-feature-name
# Tạo Pull Request vào develop
```

---

## 🛠️ Useful Commands

```powershell
# Backend
php artisan papers:sync --field="machine learning" --pages=3
php artisan queue:work
php artisan route:list
php artisan cache:clear

# Frontend
npm run dev      # Dev server
npm run build    # Production build
```
