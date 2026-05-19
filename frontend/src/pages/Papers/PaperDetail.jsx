import { useParams } from 'react-router-dom';
import AppLayout from '../../components/layout/AppLayout';
import { useFetch } from '../../hooks/useFetch';
import { papersApi, bookmarksApi } from '../../api/services';
import { useState } from 'react';

export default function PaperDetail() {
    const { id } = useParams();
    const { data, loading } = useFetch(() => papersApi.show(id), [id]);
    const [bookmarked, setBookmarked] = useState(false);

    const paper = data?.paper;

    const toggleBookmark = async () => {
        try {
            if (bookmarked) {
                // find and delete — simplified for now
            } else {
                await bookmarksApi.create(paper.id);
                setBookmarked(true);
            }
        } catch (e) { console.error(e); }
    };

    if (loading) return (
        <AppLayout title="Chi tiết bài báo">
            <div className="text-center py-12 text-gray-500 animate-pulse-soft">Đang tải...</div>
        </AppLayout>
    );

    return (
        <AppLayout title={paper?.title ?? 'Bài báo'}>
            <div className="max-w-3xl space-y-6">
                <div className="glass-card p-8">
                    <h1 className="text-xl font-bold text-white leading-relaxed">{paper?.title}</h1>

                    <div className="flex flex-wrap gap-3 mt-4 text-xs text-gray-500">
                        {paper?.journal && <span>📚 {paper.journal.name}</span>}
                        <span>📅 {paper?.published_year}</span>
                        <span>📖 {paper?.citations_count?.toLocaleString()} trích dẫn</span>
                        {paper?.doi && (
                            <a href={`https://doi.org/${paper.doi}`} target="_blank" rel="noreferrer"
                               className="text-primary-400 hover:underline">
                                🔗 DOI
                            </a>
                        )}
                    </div>

                    {/* Authors */}
                    {paper?.authors?.length > 0 && (
                        <div className="mt-4">
                            <p className="text-xs text-gray-500 mb-2">Tác giả</p>
                            <div className="flex flex-wrap gap-2">
                                {paper.authors.map(a => (
                                    <span key={a.id} className="badge-primary">{a.name}</span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Keywords */}
                    {paper?.keywords?.length > 0 && (
                        <div className="mt-4">
                            <p className="text-xs text-gray-500 mb-2">Từ khóa</p>
                            <div className="flex flex-wrap gap-2">
                                {paper.keywords.map(kw => (
                                    <span key={kw.id} className="badge-success">{kw.name}</span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Abstract */}
                    {paper?.abstract && (
                        <div className="mt-6 pt-6 border-t border-surface-700">
                            <p className="text-xs text-gray-500 mb-2 uppercase tracking-wider">Abstract</p>
                            <p className="text-sm text-gray-300 leading-relaxed">{paper.abstract}</p>
                        </div>
                    )}

                    {/* Bookmark button */}
                    <div className="mt-6 pt-6 border-t border-surface-700">
                        <button onClick={toggleBookmark}
                                className={bookmarked ? 'btn-ghost' : 'btn-primary'}>
                            {bookmarked ? '🔖 Đã bookmark' : '+ Bookmark bài báo'}
                        </button>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
