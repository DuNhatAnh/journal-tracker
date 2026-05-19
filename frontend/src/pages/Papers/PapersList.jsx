import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AppLayout from '../../components/layout/AppLayout';
import { useFetch } from '../../hooks/useFetch';
import { papersApi } from '../../api/services';

export default function PapersList() {
    const navigate = useNavigate();
    const [keyword, setKeyword] = useState('');
    const [applied, setApplied] = useState('');

    const { data, loading } = useFetch(
        () => papersApi.list({ keyword: applied }),
        [applied]
    );

    const papers = data?.data ?? [];

    return (
        <AppLayout title="Bài Báo">
            <div className="space-y-6">
                <div>
                    <h1 className="section-title">Bài Báo Nghiên Cứu</h1>
                    <p className="section-sub">{data?.total?.toLocaleString() ?? 0} bài báo</p>
                </div>

                {/* Filter */}
                <form onSubmit={(e) => { e.preventDefault(); setApplied(keyword); }}
                      className="glass-card p-4 flex gap-3">
                    <input className="input-field flex-1" placeholder="Lọc theo từ khóa..."
                           value={keyword} onChange={e => setKeyword(e.target.value)} />
                    <button type="submit" className="btn-primary">Lọc</button>
                    {applied && (
                        <button type="button" className="btn-ghost"
                                onClick={() => { setKeyword(''); setApplied(''); }}>
                            Xóa
                        </button>
                    )}
                </form>

                {/* List */}
                {loading ? (
                    <div className="text-center text-gray-500 py-12 animate-pulse-soft">Đang tải...</div>
                ) : (
                    <div className="space-y-4">
                        {papers.map(paper => (
                            <div key={paper.id} className="glass-card p-5 hover:border-surface-500/70 transition-all">
                                <Link to={`/papers/${paper.id}`}
                                      className="text-base font-medium text-white hover:text-primary-300 transition-colors line-clamp-2">
                                    {paper.title}
                                </Link>
                                <div className="flex flex-wrap gap-3 mt-2 text-xs text-gray-500">
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
                                Không tìm thấy bài báo nào.
                            </div>
                        )}
                    </div>
                )}

                {/* Pagination */}
                {data?.links && (
                    <div className="flex justify-center gap-2 flex-wrap">
                        {data.links.map((link, i) => (
                            <button key={i} disabled={!link.url}
                                    onClick={() => link.url && navigate(link.url.replace(window.location.origin, ''))}
                                    className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                                        link.active ? 'bg-primary-600 text-white' : 'text-gray-400 hover:bg-surface-700'
                                    } ${!link.url ? 'opacity-30 cursor-not-allowed' : ''}`}
                                    dangerouslySetInnerHTML={{ __html: link.label }}
                            />
                        ))}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
