import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const NAV = [
    { to: '/dashboard',         label: 'Dashboard',     icon: '📊' },
    { to: '/papers',            label: 'Bài báo',        icon: '📄' },
    { to: '/trends',            label: 'Xu hướng',       icon: '📈' },
    { to: '/trends/trending',   label: 'Chủ đề nổi',    icon: '🔥' },
    { to: '/bookmarks',         label: 'Bookmark',       icon: '🔖' },
];

const ADMIN_NAV = [
    { to: '/admin/users',       label: 'Users',          icon: '👥' },
    { to: '/admin/api-sources', label: 'API Sources',    icon: '⚙️' },
];

export default function AppLayout({ children, title }) {
    const { user, logout } = useAuth();
    const { pathname } = useLocation();
    const [open, setOpen] = useState(true);
    const [searchQ, setSearchQ] = useState('');

    const handleSearch = (e) => {
        e.preventDefault();
        if (searchQ.trim()) {
            window.location.href = `/papers/search?q=${encodeURIComponent(searchQ)}`;
        }
    };

    return (
        <div className="flex h-screen bg-surface-900 overflow-hidden">
            {/* Sidebar */}
            <aside className={`${open ? 'w-64' : 'w-16'} flex-shrink-0 transition-all duration-300
                               bg-surface-800 border-r border-surface-700 flex flex-col`}>
                {/* Logo */}
                <div className="h-16 flex items-center px-4 border-b border-surface-700 gap-3">
                    <div className="w-8 h-8 rounded-xl bg-primary-600 flex items-center justify-center flex-shrink-0">
                        <span className="text-white text-xs font-bold">JT</span>
                    </div>
                    {open && <span className="font-semibold text-white text-sm">Journal Tracker</span>}
                </div>

                {/* Nav */}
                <nav className="flex-1 p-3 space-y-1 overflow-y-auto scrollbar-thin">
                    {NAV.map(item => (
                        <Link
                            key={item.to}
                            to={item.to}
                            className={`nav-link ${pathname === item.to ? 'active' : ''}`}
                        >
                            <span className="text-base">{item.icon}</span>
                            {open && <span>{item.label}</span>}
                        </Link>
                    ))}

                    {user?.role === 'admin' && (
                        <>
                            <div className="pt-3 pb-1">
                                {open && (
                                    <p className="px-3 text-xs text-gray-600 uppercase tracking-wider font-medium">
                                        Admin
                                    </p>
                                )}
                            </div>
                            {ADMIN_NAV.map(item => (
                                <Link
                                    key={item.to}
                                    to={item.to}
                                    className={`nav-link ${pathname === item.to ? 'active' : ''}`}
                                >
                                    <span className="text-base">{item.icon}</span>
                                    {open && <span>{item.label}</span>}
                                </Link>
                            ))}
                        </>
                    )}
                </nav>

                {/* User Footer */}
                <div className="p-3 border-t border-surface-700">
                    <div className="flex items-center gap-3 px-2 py-2">
                        <div className="w-8 h-8 rounded-full bg-primary-700 flex items-center justify-center flex-shrink-0">
                            <span className="text-white text-xs font-semibold">
                                {user?.name?.charAt(0)?.toUpperCase()}
                            </span>
                        </div>
                        {open && (
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-white truncate">{user?.name}</p>
                                <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
                            </div>
                        )}
                    </div>
                    {open && (
                        <button onClick={logout} className="btn-ghost w-full justify-center mt-2 text-xs py-1.5">
                            Đăng xuất
                        </button>
                    )}
                </div>
            </aside>

            {/* Main */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Topbar */}
                <header className="h-16 bg-surface-800 border-b border-surface-700 flex items-center px-6 gap-4">
                    <button
                        onClick={() => setOpen(!open)}
                        className="text-gray-400 hover:text-white transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                  d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                    </button>

                    <form onSubmit={handleSearch} className="flex-1 max-w-xl relative">
                        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500"
                             fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <input
                            type="search"
                            placeholder="Tìm kiếm bài báo, tác giả, từ khóa..."
                            className="input-field pl-10 py-2 text-sm"
                            value={searchQ}
                            onChange={e => setSearchQ(e.target.value)}
                        />
                    </form>

                    {title && (
                        <span className="hidden md:block text-sm text-gray-500 ml-auto">{title}</span>
                    )}
                </header>

                {/* Page */}
                <main className="flex-1 overflow-y-auto scrollbar-thin p-6 animate-fade-in">
                    {children}
                </main>
            </div>
        </div>
    );
}
