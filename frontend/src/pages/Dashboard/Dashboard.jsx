import AppLayout from '../../components/layout/AppLayout';
import { useFetch } from '../../hooks/useFetch';
import { dashboardApi } from '../../api/services';
import ReactApexChart from 'react-apexcharts';

function StatCard({ icon, label, value, color = 'primary' }) {
    const colors = {
        primary: 'text-primary-400 bg-primary-900/30',
        teal:    'text-cyan-400 bg-cyan-900/30',
        amber:   'text-amber-400 bg-amber-900/30',
        green:   'text-emerald-400 bg-emerald-900/30',
    };
    return (
        <div className="stat-card animate-slide-up">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl ${colors[color]}`}>
                {icon}
            </div>
            <p className="text-2xl font-bold text-white mt-2">
                {typeof value === 'number' ? value.toLocaleString() : (value ?? '—')}
            </p>
            <p className="text-sm text-gray-400">{label}</p>
        </div>
    );
}

export default function Dashboard() {
    const { data, loading, error } = useFetch(() => dashboardApi.get());

    if (loading) return (
        <AppLayout title="Dashboard">
            <div className="flex items-center justify-center h-64 text-gray-500">
                <div className="animate-pulse-soft">Đang tải dữ liệu...</div>
            </div>
        </AppLayout>
    );

    if (error) return (
        <AppLayout title="Dashboard">
            <div className="glass-card p-8 text-center text-rose-400">
                Lỗi: {error}
            </div>
        </AppLayout>
    );

    const { stats, trending_topics, recent_papers } = data ?? {};

    const barOptions = {
        chart: { background: 'transparent', toolbar: { show: false } },
        plotOptions: { bar: { borderRadius: 6, horizontal: true } },
        colors: ['#3b6ff2'],
        xaxis: { categories: stats?.top_keywords?.map(k => k.name) ?? [] },
        theme: { mode: 'dark' },
        dataLabels: { enabled: false },
        grid: { borderColor: '#21262d' },
    };

    return (
        <AppLayout title="Dashboard">
            <div className="space-y-6">
                <div>
                    <h1 className="section-title">
                        Dashboard <span className="text-gradient">Xu Hướng Nghiên Cứu</span>
                    </h1>
                    <p className="section-sub">Tổng quan về xuất bản học thuật</p>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard icon="📄" label="Tổng bài báo"     value={stats?.total_papers}     color="primary" />
                    <StatCard icon="🏷️" label="Từ khóa theo dõi" value={stats?.total_keywords}   color="teal"    />
                    <StatCard icon="📅" label="Bài báo năm nay"  value={stats?.papers_this_year} color="amber"   />
                    <StatCard icon="🔥" label="Chủ đề nổi bật"   value={trending_topics?.length} color="green"   />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Trending */}
                    <div className="glass-card p-6">
                        <h2 className="font-semibold text-white mb-4">🔥 Chủ đề đang nổi</h2>
                        <div className="space-y-3">
                            {trending_topics?.map((trend, i) => (
                                <a key={trend.id} href={`/trends/${trend.keyword?.slug}`}
                                   className="flex items-center gap-3 p-3 rounded-xl hover:bg-surface-700 transition-colors">
                                    <span className="text-lg font-bold text-gray-600 w-6">#{i + 1}</span>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-white truncate">{trend.keyword?.name}</p>
                                        <p className="text-xs text-gray-500">{trend.paper_count?.toLocaleString()} bài báo</p>
                                    </div>
                                    {trend.growth_rate > 0 && (
                                        <span className="badge-success">+{trend.growth_rate}%</span>
                                    )}
                                </a>
                            ))}
                            {!trending_topics?.length && (
                                <p className="text-gray-600 text-sm">Chưa có dữ liệu</p>
                            )}
                        </div>
                    </div>

                    {/* Bar chart */}
                    <div className="lg:col-span-2 glass-card p-6">
                        <h2 className="font-semibold text-white mb-4">📊 Từ khóa hàng đầu</h2>
                        {stats?.top_keywords?.length > 0 ? (
                            <ReactApexChart
                                type="bar" height={240}
                                series={[{ name: 'Số bài báo', data: stats.top_keywords.map(k => k.papers_count) }]}
                                options={barOptions}
                            />
                        ) : (
                            <div className="flex items-center justify-center h-40 text-gray-600 text-sm">
                                Chưa có dữ liệu. Hãy sync từ API!
                            </div>
                        )}
                    </div>
                </div>

                {/* Recent papers */}
                <div className="glass-card p-6">
                    <h2 className="font-semibold text-white mb-4">📄 Bài báo mới nhất</h2>
                    {recent_papers?.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="data-table">
                                <thead><tr>
                                    <th>Tiêu đề</th><th>Tạp chí</th><th>Năm</th><th>Trích dẫn</th>
                                </tr></thead>
                                <tbody>
                                    {recent_papers.map(p => (
                                        <tr key={p.id}>
                                            <td className="max-w-xs">
                                                <a href={`/papers/${p.id}`}
                                                   className="text-primary-400 hover:text-primary-300 line-clamp-1">
                                                    {p.title}
                                                </a>
                                            </td>
                                            <td className="text-gray-400 text-xs">{p.journal?.name ?? '—'}</td>
                                            <td className="text-gray-400">{p.published_year}</td>
                                            <td>{p.citations_count?.toLocaleString()}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <p className="text-gray-600 text-sm">Chưa có dữ liệu. Chạy: <code className="text-primary-400 font-mono">php artisan papers:sync</code></p>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
