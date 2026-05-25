import React, { Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { Layout } from "./components/shared/Layout";
import { ThemeProvider } from "./lib/theme";

// Lazy load pages
const Landing = React.lazy(() => import("./pages/Shared/Landing"));
const Dashboard = React.lazy(() => import("./pages/Academic/Dashboard"));
const Login = React.lazy(() => import("./pages/Auth/Login"));
const Register = React.lazy(() => import("./pages/Auth/Register"));
const Search = React.lazy(() => import("./pages/Shared/Search"));
const Trending = React.lazy(() => import("./pages/Researcher/Trending"));
const Bookmarks = React.lazy(() => import("./pages/Academic/Bookmarks"));
const Following = React.lazy(() => import("./pages/Researcher/Following"));
const Notifications = React.lazy(() => import("./pages/Shared/Notifications"));
const Profile = React.lazy(() => import("./pages/Shared/Profile"));
const AllPapers = React.lazy(() => import("./pages/Shared/AllPapers"));
const Settings = React.lazy(() => import("./pages/Shared/Settings"));
const About = React.lazy(() => import("./pages/Shared/About"));
const Guide = React.lazy(() => import("./pages/Shared/Guide"));
const AdminDashboard = React.lazy(() => import("./pages/Admin/AdminDashboard"));
const AdminUsers = React.lazy(() => import("./pages/Admin/Users"));
const AdminSync = React.lazy(() => import("./pages/Admin/Sync"));

const LoadingScreen = () => (
  <div className="flex h-screen w-full items-center justify-center bg-surface">
    <div className="w-8 h-8 border-4 border-tertiary border-t-transparent rounded-full animate-spin"></div>
  </div>
);

export default function App() {
  return (
    <ThemeProvider>
      <Toaster position="bottom-right" toastOptions={{ style: { background: '#1E293B', color: '#fff', borderRadius: '12px' } }} />
      <BrowserRouter>
        <Suspense fallback={<LoadingScreen />}>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route element={<Layout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/search" element={<Search />} />
              <Route path="/papers" element={<AllPapers />} />
              <Route path="/trending" element={<Trending />} />
              <Route path="/bookmarks" element={<Bookmarks />} />
              <Route path="/following" element={<Following />} />
              <Route path="/notifications" element={<Notifications />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/about" element={<About />} />
              <Route path="/guide" element={<Guide />} />
              {/* Admin Routes */}
              <Route path="/admin/dashboard" element={<AdminDashboard />} />
              <Route path="/admin/users" element={<AdminUsers />} />
              <Route path="/admin/sync" element={<AdminSync />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </Suspense>
      </BrowserRouter>
    </ThemeProvider>
  );
}
