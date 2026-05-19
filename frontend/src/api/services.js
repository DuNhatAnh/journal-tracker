import api from './axios';

// ─── Auth ─────────────────────────────────────────────────────────────────────
export const authApi = {
    login:    (data) => api.post('/login', data),
    register: (data) => api.post('/register', data),
    logout:   ()     => api.post('/logout'),
    me:       ()     => api.get('/me'),
};

// ─── Dashboard ────────────────────────────────────────────────────────────────
export const dashboardApi = {
    get: () => api.get('/dashboard'),
};

// ─── Papers ───────────────────────────────────────────────────────────────────
export const papersApi = {
    list:   (params) => api.get('/papers', { params }),
    search: (q)      => api.get('/papers/search', { params: { q } }),
    show:   (id)     => api.get(`/papers/${id}`),
};

// ─── Journals ─────────────────────────────────────────────────────────────────
export const journalsApi = {
    list: (params) => api.get('/journals', { params }),
    show: (id)     => api.get(`/journals/${id}`),
};

// ─── Keywords ─────────────────────────────────────────────────────────────────
export const keywordsApi = {
    list: (params) => api.get('/keywords', { params }),
    show: (id)     => api.get(`/keywords/${id}`),
};

// ─── Trends ───────────────────────────────────────────────────────────────────
export const trendsApi = {
    overview:  ()     => api.get('/trends'),
    trending:  ()     => api.get('/trends/trending'),
    show:      (slug) => api.get(`/trends/${slug}`),
};

// ─── Bookmarks ────────────────────────────────────────────────────────────────
export const bookmarksApi = {
    list:    ()         => api.get('/bookmarks'),
    create:  (paperId)  => api.post('/bookmarks', { paper_id: paperId }),
    delete:  (id)       => api.delete(`/bookmarks/${id}`),
};

// ─── Notifications ────────────────────────────────────────────────────────────
export const notificationsApi = {
    list:       ()   => api.get('/notifications'),
    markRead:   (id) => api.patch(`/notifications/${id}/read`),
    markAllRead:()   => api.post('/notifications/read-all'),
};

// ─── Admin ────────────────────────────────────────────────────────────────────
export const adminApi = {
    users: {
        list:    ()     => api.get('/admin/users'),
        show:    (id)   => api.get(`/admin/users/${id}`),
        update:  (id, data) => api.put(`/admin/users/${id}`, data),
        destroy: (id)   => api.delete(`/admin/users/${id}`),
    },
    apiSources: {
        list:    ()     => api.get('/admin/api-sources'),
        create:  (data) => api.post('/admin/api-sources', data),
        update:  (id, data) => api.put(`/admin/api-sources/${id}`, data),
        destroy: (id)   => api.delete(`/admin/api-sources/${id}`),
        sync:    (id)   => api.post(`/admin/api-sources/${id}/sync`),
    },
};
