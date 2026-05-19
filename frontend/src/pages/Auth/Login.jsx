import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export default function Login() {
    const { login } = useAuth();
    const navigate  = useNavigate();
    const [form,   setForm]   = useState({ email: '', password: '' });
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);

    const handleChange = (e) =>
        setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrors({});
        setLoading(true);
        try {
            await login(form.email, form.password);
            navigate('/dashboard');
        } catch (err) {
            const data = err.response?.data;
            if (data?.errors) setErrors(data.errors);
            else setErrors({ email: data?.message ?? 'Đăng nhập thất bại.' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-surface-900 flex items-center justify-center p-4">
            {/* Background glow */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px]
                                bg-primary-600/10 rounded-full blur-3xl" />
                <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px]
                                bg-accent-teal/5 rounded-full blur-3xl" />
            </div>

            <div className="relative w-full max-w-md">
                {/* Logo */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl
                                    bg-primary-600 shadow-lg shadow-primary-900/50 mb-4">
                        <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                    </div>
                    <h1 className="text-2xl font-bold text-white">Journal Tracker</h1>
                    <p className="text-gray-400 text-sm mt-1">Theo dõi xu hướng nghiên cứu khoa học</p>
                </div>

                <div className="glass-card p-8">
                    <h2 className="text-lg font-semibold text-white mb-6">Đăng nhập</h2>
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label className="block text-sm text-gray-400 mb-1.5">Email</label>
                            <input name="email" type="email" className="input-field"
                                   placeholder="you@example.com"
                                   value={form.email} onChange={handleChange} />
                            {errors.email && <p className="text-rose-400 text-xs mt-1">{errors.email}</p>}
                        </div>
                        <div>
                            <label className="block text-sm text-gray-400 mb-1.5">Mật khẩu</label>
                            <input name="password" type="password" className="input-field"
                                   placeholder="••••••••"
                                   value={form.password} onChange={handleChange} />
                            {errors.password && <p className="text-rose-400 text-xs mt-1">{errors.password}</p>}
                        </div>
                        <button type="submit" disabled={loading}
                                className="btn-primary w-full justify-center py-3">
                            {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
                        </button>
                    </form>
                    <p className="text-center text-gray-500 text-sm mt-6">
                        Chưa có tài khoản?{' '}
                        <Link to="/register" className="text-primary-400 hover:text-primary-300 font-medium">
                            Đăng ký
                        </Link>
                    </p>
                </div>

                <div className="mt-4 glass-card p-4 text-xs text-gray-500">
                    <p className="font-medium text-gray-400 mb-2">Demo accounts:</p>
                    <div className="space-y-1 font-mono">
                        <p>admin@journaltracker.app / password</p>
                        <p>researcher@journaltracker.app / password</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
