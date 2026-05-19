import AppLayout from '../../components/layout/AppLayout';
import { useFetch } from '../../hooks/useFetch';
import { trendsApi } from '../../api/services';
import { Link } from 'react-router-dom';

export default function TrendsTrending() {
    const { data, loading } = useFetch(() => trendsApi.trending());

    return (
        <AppLayout title="Chủ đề nổi bật">
            <div className="space-y-6">
                <div>
                    <h1 className="section-title">🔥 Chủ Đề Đang Nổi</h1>
                    <p className="section-sub">
                        {data?.year ? `Top topics năm ${data.year} theo tăng trưởng` : 'Đang tải...'}
                    </p>
                </div>

                {loading ? (
                    <div className="text-center py-12 text-gray-500 animate-pulse-soft">Đang tải...</div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {data?.trending?.map((trend, i) => (
                            <Link key={trend.id} to={`/trends/${trend.keyword?.slug}`}
                                  className="glass-card p-5 hover:border-primary-700/50 transition-all flex items-center gap-4">
                                <div className="text-3xl font-black text-surface-600 w-10 text-center">
                                    #{i + 1}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-semibold text-white">{trend.keyword?.name}</p>
                                    <p className="text-xs text-gray-500 mt-1">
                                        {trend.paper_count?.toLocaleString()} bài báo · {trend.citation_count?.toLocaleString()} trích dẫn
                                    </p>
                                </div>
                                {trend.growth_rate > 0 && (
                                    <div className="text-right">
                                        <span className="badge-success text-sm">+{trend.growth_rate}%</span>
                                        <p className="text-xs text-gray-600 mt-1">YoY</p>
                                    </div>
                                )}
                            </Link>
                        ))}
                        {!data?.trending?.length && (
                            <div className="glass-card p-12 text-center text-gray-500 col-span-2">
                                Chưa có dữ liệu xu hướng.
                            </div>
                        )}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
