import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import AppLayout from '../../components/layout/AppLayout';
import { useFetch } from '../../hooks/useFetch';
import { papersApi } from '../../api/services';
import { Link } from 'react-router-dom';

export default function PapersSearch() {
    const [params] = useSearchParams();
    const q = params.get('q') ?? '';
    const { data, loading } = useFetch(() => papersApi.search(q), [q]);
    const papers = data?.data ?? [];

    return (
        <AppLayout title={`Tìm kiếm: "${q}"`}>
            <div className="space-y-6">
                <div>
                    <h1 className="section-title">Kết quả tìm kiếm</h1>
                    <p className="section-sub">
                        {loading ? 'Đang tìm...' : `${data?.total ?? 0} kết quả cho "${q}"`}
                    </p>
                </div>

                {loading ? (
                    <div className="text-center py-12 text-gray-500 animate-pulse-soft">Đang tìm kiếm...</div>
                ) : (
                    <div className="space-y-4">
                        {papers.map(paper => (
                            <div key={paper.id} className="glass-card p-5 hover:border-surface-500/70 transition-all">
                                <Link to={`/papers/${paper.id}`}
                                      className="font-medium text-white hover:text-primary-300 line-clamp-2">
                                    {paper.title}
                                </Link>
                                <div className="flex gap-3 mt-2 text-xs text-gray-500">
                                    {paper.journal && <span>📚 {paper.journal.name}</span>}
                                    <span>📅 {paper.published_year}</span>
                                    <span>📖 {paper.citations_count?.toLocaleString()} trích dẫn</span>
                                </div>
                                {paper.abstract && (
                                    <p className="text-sm text-gray-500 mt-2 line-clamp-2">{paper.abstract}</p>
                                )}
                                <div className="flex flex-wrap gap-1.5 mt-3">
                                    {paper.keywords?.map(kw => (
                                        <span key={kw.id} className="badge-primary">{kw.name}</span>
                                    ))}
                                </div>
                            </div>
                        ))}
                        {papers.length === 0 && (
                            <div className="glass-card p-12 text-center text-gray-500">
                                Không tìm thấy kết quả nào cho "{q}".
                            </div>
                        )}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
