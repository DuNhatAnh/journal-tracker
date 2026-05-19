import AppLayout from '../../components/layout/AppLayout';
import { useFetch } from '../../hooks/useFetch';
import { bookmarksApi } from '../../api/services';
import { Link } from 'react-router-dom';

export default function BookmarksList() {
    const { data, loading, refetch } = useFetch(() => bookmarksApi.list());
    const bookmarks = data?.data ?? [];

    const handleDelete = async (id) => {
        try {
            await bookmarksApi.delete(id);
            refetch();
        } catch (e) { console.error(e); }
    };

    return (
        <AppLayout title="Bookmarks">
            <div className="space-y-6">
                <div>
                    <h1 className="section-title">🔖 Bookmarks của tôi</h1>
                    <p className="section-sub">{data?.total ?? 0} bài báo đã lưu</p>
                </div>

                {loading ? (
                    <div className="text-center py-12 text-gray-500 animate-pulse-soft">Đang tải...</div>
                ) : (
                    <div className="space-y-4">
                        {bookmarks.map(bm => (
                            <div key={bm.id} className="glass-card p-5 flex gap-4">
                                <div className="flex-1 min-w-0">
                                    <Link to={`/papers/${bm.paper?.id}`}
                                          className="font-medium text-white hover:text-primary-300 line-clamp-2">
                                        {bm.paper?.title}
                                    </Link>
                                    <div className="flex gap-3 mt-2 text-xs text-gray-500">
                                        {bm.paper?.journal && <span>📚 {bm.paper.journal.name}</span>}
                                        <span>📅 {bm.paper?.published_year}</span>
                                    </div>
                                    {bm.note && <p className="text-xs text-gray-500 mt-2 italic">"{bm.note}"</p>}
                                    <div className="flex flex-wrap gap-1.5 mt-2">
                                        {bm.paper?.keywords?.map(kw => (
                                            <span key={kw.id} className="badge-primary">{kw.name}</span>
                                        ))}
                                    </div>
                                </div>
                                <button onClick={() => handleDelete(bm.id)} className="btn-danger text-xs py-1 px-2 self-start">
                                    Xóa
                                </button>
                            </div>
                        ))}
                        {bookmarks.length === 0 && (
                            <div className="glass-card p-12 text-center text-gray-500">
                                Bạn chưa bookmark bài báo nào. Hãy khám phá{' '}
                                <Link to="/papers" className="text-primary-400">danh sách bài báo</Link>!
                            </div>
                        )}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
