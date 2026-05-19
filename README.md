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
