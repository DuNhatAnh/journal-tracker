import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';

// Auth pages
import Login    from './pages/Auth/Login';
import Register from './pages/Auth/Register';

// App pages
import Dashboard      from './pages/Dashboard/Dashboard';
import PapersList     from './pages/Papers/PapersList';
import PaperDetail    from './pages/Papers/PaperDetail';
import PapersSearch   from './pages/Papers/PapersSearch';
import TrendsOverview from './pages/Trends/TrendsOverview';
import TrendsTrending from './pages/Trends/TrendsTrending';
import TrendDetail    from './pages/Trends/TrendDetail';
import BookmarksList  from './pages/Bookmarks/BookmarksList';

// Route guards
function PrivateRoute({ children }) {
    const { token } = useAuth();
    return token ? children : <Navigate to="/login" replace />;
}

function GuestRoute({ children }) {
    const { token } = useAuth();
    return !token ? children : <Navigate to="/dashboard" replace />;
}

export default function App() {
    return (
        <Routes>
            {/* Guest only */}
            <Route path="/login"    element={<GuestRoute><Login /></GuestRoute>} />
            <Route path="/register" element={<GuestRoute><Register /></GuestRoute>} />

            {/* Protected */}
            <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
            <Route path="/papers"    element={<PrivateRoute><PapersList /></PrivateRoute>} />
            <Route path="/papers/search" element={<PrivateRoute><PapersSearch /></PrivateRoute>} />
            <Route path="/papers/:id"    element={<PrivateRoute><PaperDetail /></PrivateRoute>} />
            <Route path="/trends"           element={<PrivateRoute><TrendsOverview /></PrivateRoute>} />
            <Route path="/trends/trending"  element={<PrivateRoute><TrendsTrending /></PrivateRoute>} />
            <Route path="/trends/:slug"     element={<PrivateRoute><TrendDetail /></PrivateRoute>} />
            <Route path="/bookmarks"        element={<PrivateRoute><BookmarksList /></PrivateRoute>} />

            {/* Redirect root */}
            <Route path="/"   element={<Navigate to="/dashboard" replace />} />
            <Route path="*"   element={<Navigate to="/dashboard" replace />} />
        </Routes>
    );
}
