import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { Layout } from "./components/shared/Layout";
import { ThemeProvider } from "./lib/theme";
import Landing from "./pages/Shared/Landing";
import Dashboard from "./pages/Academic/Dashboard";
import Login from "./pages/Auth/Login";
import Register from "./pages/Auth/Register";
import Search from "./pages/Shared/Search";
import Trending from "./pages/Researcher/Trending";
import Bookmarks from "./pages/Academic/Bookmarks";
import Following from "./pages/Researcher/Following";
import Notifications from "./pages/Shared/Notifications";
import Profile from "./pages/Shared/Profile";
import AllPapers from "./pages/Shared/AllPapers";
import Settings from "./pages/Shared/Settings";
import About from "./pages/Shared/About";
import Guide from "./pages/Shared/Guide";
import AdminDashboard from "./pages/Admin/AdminDashboard";
import AdminUsers from "./pages/Admin/Users";
import AdminSync from "./pages/Admin/Sync";

export default function App() {
  return (
    <ThemeProvider>
      <Toaster position="bottom-right" toastOptions={{ style: { background: '#1E293B', color: '#fff', borderRadius: '12px' } }} />
      <BrowserRouter>
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
      </BrowserRouter>
    </ThemeProvider>
  );
}
