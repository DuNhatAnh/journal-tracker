import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export default function Register() {
    const { register } = useAuth();
    const navigate = useNavigate();
    const [form, setForm] = useState({
        name: '', email: '', password: '', password_confirmation: '', role: 'student',
    });
    const [errors,  setErrors]  = useState({});
    const [loading, setLoading] = useState(false);

    const handleChange = (e) =>
        setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrors({});
        setLoading(true);
        try {
            await register(form);
            navigate('/dashboard');
        } catch (err) {
            const data = err.response?.data;
            if (data?.errors) setErrors(data.errors);
            else setErrors({ name: data?.message ?? 'Đăng ký thất bại.' });
        } finally {
            setLoading(false);
        }
    };

    const Field = ({ name, label, type = 'text', placeholder }) => (
        <div>
            <label className="block text-sm text-gray-400 mb-1.5">{label}</label>
            <input name={name} type={type} className="input-field"
                   placeholder={placeholder}
                   value={form[name]} onChange={handleChange} />
            {errors[name] && <p className="text-rose-400 text-xs mt-1">{errors[name]}</p>}
        </div>
    );

    return (
        <div className="min-h-screen bg-surface-900 flex items-center justify-center p-4">
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-primary-600/10 rounded-full blur-3xl" />
            </div>

            <div className="relative w-full max-w-md">
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary-600 shadow-lg mb-4">
                        <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                    </div>
                    <h1 className="text-2xl font-bold text-white">Journal Tracker</h1>
                    <p className="text-gray-400 text-sm mt-1">Tạo tài khoản mới</p>
                </div>

                <div className="glass-card p-8">
                    <h2 className="text-lg font-semibold text-white mb-6">Đăng ký</h2>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <Field name="name"                  label="Họ và tên"         placeholder="Nguyen Van A" />
                        <Field name="email"    type="email" label="Email"              placeholder="you@example.com" />
                        <Field name="password" type="password" label="Mật khẩu"       placeholder="Tối thiểu 8 ký tự" />
                        <Field name="password_confirmation" type="password" label="Xác nhận mật khẩu" placeholder="••••••••" />

                        <div>
                            <label className="block text-sm text-gray-400 mb-1.5">Vai trò</label>
                            <select name="role" className="input-field" value={form.role} onChange={handleChange}>
                                <option value="student">Sinh viên</option>
                                <option value="lecturer">Giảng viên</option>
                                <option value="researcher">Nhà nghiên cứu</option>
                            </select>
                        </div>

                        <button type="submit" disabled={loading}
                                className="btn-primary w-full justify-center py-3 mt-2">
                            {loading ? 'Đang tạo tài khoản...' : 'Đăng ký'}
                        </button>
                    </form>
                    <p className="text-center text-gray-500 text-sm mt-6">
                        Đã có tài khoản?{' '}
                        <Link to="/login" className="text-primary-400 hover:text-primary-300 font-medium">
                            Đăng nhập
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
