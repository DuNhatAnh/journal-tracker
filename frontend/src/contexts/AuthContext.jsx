import { createContext, useContext, useState, useCallback } from 'react';
import api from '../api/axios';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user,  setUser]  = useState(() => {
        const stored = localStorage.getItem('user');
        return stored ? JSON.parse(stored) : null;
    });
    const [token, setToken] = useState(() => localStorage.getItem('token'));

    const login = useCallback(async (email, password) => {
        const res = await api.post('/login', { email, password });
        const { user, token } = res.data;

        localStorage.setItem('token', token);
        localStorage.setItem('user',  JSON.stringify(user));
        setToken(token);
        setUser(user);

        return user;
    }, []);

    const register = useCallback(async (data) => {
        const res = await api.post('/register', data);
        const { user, token } = res.data;

        localStorage.setItem('token', token);
        localStorage.setItem('user',  JSON.stringify(user));
        setToken(token);
        setUser(user);

        return user;
    }, []);

    const logout = useCallback(async () => {
        try {
            await api.post('/logout');
        } catch (_) {
            // ignore if already expired
        } finally {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            setToken(null);
            setUser(null);
        }
    }, []);

    return (
        <AuthContext.Provider value={{ user, token, login, register, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);
