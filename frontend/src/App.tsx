import React, { Suspense } from "react";
import { createBrowserRouter, createRoutesFromElements, Route, RouterProvider, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { Layout } from "./components/shared/Layout";
import { ThemeProvider } from "./lib/theme";

// Import pages statically to avoid connection-starving lazy chunk requests on navigation
import Landing from "./pages/Shared/Landing";
import Dashboard from "./pages/Academic/Dashboard";
import Login from "./pages/Auth/Login";
import Register from "./pages/Auth/Register";
import SSOCallback from "./pages/Auth/SSOCallback";
import VerifyEmail from "./pages/Auth/VerifyEmail";
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
import AdminKeywords from "./pages/Admin/Keywords";
import AdminSettings from "./pages/Admin/Settings"; // Import Admin settings & schedules
import AdminAiSettings from "./pages/Admin/AiSettings"; // Import AI Settings

const LoadingScreen = () => (
  <div className="flex h-screen w-full items-center justify-center bg-surface">
    <div className="w-8 h-8 border-4 border-tertiary border-t-transparent rounded-full animate-spin"></div>
  </div>
);

const router = createBrowserRouter(
  createRoutesFromElements(
    <>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/sso-callback" element={<SSOCallback />} />
      <Route path="/email/verify/:id/:hash" element={<VerifyEmail />} />
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
        <Route path="/admin/keywords" element={<AdminKeywords />} />
        <Route path="/admin/settings" element={<AdminSettings />} />
        <Route path="/admin/settings/ai" element={<AdminAiSettings />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </>
  )
);

export default function App() {
  return (
    <ThemeProvider>
      <Toaster position="top-center" toastOptions={{ style: { background: '#1E293B', color: '#fff', borderRadius: '12px' } }} />
      <Suspense fallback={<LoadingScreen />}>
        <RouterProvider router={router} />
      </Suspense>
    </ThemeProvider>
  );
}
