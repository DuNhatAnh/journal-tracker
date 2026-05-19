import AppLayout from '../../components/layout/AppLayout';
import { useFetch } from '../../hooks/useFetch';
import { trendsApi } from '../../api/services';
import ReactApexChart from 'react-apexcharts';

export default function TrendsOverview() {
    const { data, loading } = useFetch(() => trendsApi.overview());
    const trends = data ?? {};

    const keywordNames = Object.keys(trends);
    const series = keywordNames.map(name => ({
        name,
        data: (trends[name] ?? []).map(t => ({ x: t.year, y: t.paper_count })),
    }));

    const chartOptions = {
        chart: { type: 'line', background: 'transparent', toolbar: { show: false }, zoom: { enabled: true } },
        stroke: { curve: 'smooth', width: 2.5 },
        markers: { size: 4 },
        xaxis: { type: 'numeric', labels: { style: { colors: '#6b7280' } } },
        yaxis: { labels: { style: { colors: '#6b7280' } } },
        legend: { labels: { colors: '#9ca3af' } },
        grid: { borderColor: '#21262d' },
        theme: { mode: 'dark' },
        tooltip: { theme: 'dark' },
        colors: ['#3b6ff2', '#06b6d4', '#8b5cf6', '#f59e0b', '#10b981', '#f43f5e'],
    };

    return (
        <AppLayout title="Xu Hướng">
            <div className="space-y-6">
                <div>
                    <h1 className="section-title">📈 Xu Hướng Xuất Bản</h1>
                    <p className="section-sub">Biến động số lượng bài báo theo từ khóa qua các năm</p>
                </div>

                <div className="glass-card p-6">
                    <h2 className="font-semibold text-white mb-4">Tổng quan xu hướng</h2>
                    {loading ? (
                        <div className="h-60 flex items-center justify-center text-gray-600 animate-pulse-soft">Đang tải biểu đồ...</div>
                    ) : series.length > 0 ? (
                        <ReactApexChart type="line" height={380} series={series} options={chartOptions} />
                    ) : (
                        <div className="h-60 flex items-center justify-center text-gray-600 text-sm">
                            Chưa có dữ liệu. Chạy <code className="text-primary-400 font-mono">php artisan papers:sync</code>
                        </div>
                    )}
                </div>

                {/* Table */}
                {!loading && series.length > 0 && (
                    <div className="glass-card p-6">
                        <h2 className="font-semibold text-white mb-4">Chi tiết theo từ khóa</h2>
                        <div className="overflow-x-auto">
                            <table className="data-table">
                                <thead><tr>
                                    <th>Từ khóa</th><th>Năm</th><th>Số bài báo</th><th>Trích dẫn</th><th>Tăng trưởng</th>
                                </tr></thead>
                                <tbody>
                                    {Object.entries(trends).flatMap(([name, rows]) =>
                                        rows.map(row => (
                                            <tr key={`${name}-${row.year}`}>
                                                <td className="font-medium text-white">{name}</td>
                                                <td className="text-gray-400">{row.year}</td>
                                                <td>{row.paper_count?.toLocaleString()}</td>
                                                <td>{row.citation_count?.toLocaleString()}</td>
                                                <td>
                                                    {row.growth_rate > 0 ? (
                                                        <span className="badge-success">+{row.growth_rate}%</span>
                                                    ) : row.growth_rate < 0 ? (
                                                        <span className="badge-danger">{row.growth_rate}%</span>
                                                    ) : <span className="text-gray-600">—</span>}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
