import { useState, useEffect } from 'react';

/**
 * Generic hook to call any async API function.
 * Usage: const { data, loading, error, refetch } = useFetch(() => papersApi.list());
 */
export function useFetch(fetchFn, deps = []) {
    const [data,    setData]    = useState(null);
    const [loading, setLoading] = useState(true);
    const [error,   setError]   = useState(null);

    const execute = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetchFn();
            setData(res.data);
        } catch (err) {
            setError(err.response?.data?.message ?? 'Đã có lỗi xảy ra.');
        } finally {
            setLoading(false);
        }
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => { execute(); }, deps);

    return { data, loading, error, refetch: execute };
}
