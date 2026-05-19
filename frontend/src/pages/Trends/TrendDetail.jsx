import { useParams } from 'react-router-dom';
import AppLayout from '../../components/layout/AppLayout';
import { useFetch } from '../../hooks/useFetch';
import { trendsApi } from '../../api/services';
import ReactApexChart from 'react-apexcharts';

export default function TrendDetail() {
    const { slug } = useParams();
    const { data, loading } = useFetch(() => trendsApi.show(slug), [slug]);

    const keyword = data?.keyword;
    const trends  = data?.trends ?? [];
    const papers  = data?.papers ?? [];

    const chartOptions = {
        chart: { background: 'transparent', toolbar: { show: false } },
        stroke: { curve: 'smooth', width: 2.5 },
        fill: {
            type: 'gradient',
            gradient: { shadeIntensity: 1, opacityFrom: 0.3, opacityTo: 0, stops: [0, 90, 100] },
        },
        colors: ['#3b6ff2'],
        xaxis: { categories: trends.map(t => t.year), labels: { style: { colors: '#6b7280' } } },
        yaxis: { labels: { style: { colors: '#6b7280' } } },
        grid: { borderColor: '#21262d' },
        theme: { mode: 'dark' },
        tooltip: { theme: 'dark' },
        dataLabels: { enabled: false },
    };

    return (
        <AppLayout title={keyword?.name ?? 'Xu hướng'}>
            <div className="space-y-6">
                <div>
                    <h1 className="section-title">
                        📈 <span className="text-gradient">{keyword?.name}</span>
                    </h1>
                    <p className="section-sub">Xu hướng xuất bản theo từ khóa</p>
                </div>

                {loading ? (
                    <div className="text-center py-12 text-gray-500 animate-pulse-soft">Đang tải...</div>
                ) : (
                    <>
                        <div className="glass-card p-6">
                            <ReactApexChart
                                type="area" height={300}
                                series={[{ name: 'Số bài báo', data: trends.map(t => t.paper_count) }]}
                                options={chartOptions}
                            />
                        </div>

                        <div className="glass-card p-6">
                            <h2 className="font-semibold text-white mb-4">Bài báo liên quan ({papers.length})</h2>
                            <div className="space-y-3">
                                {papers.map(p => (
                                    <a key={p.id} href={`/papers/${p.id}`}
                                       className="flex gap-4 p-3 rounded-xl hover:bg-surface-700 transition-colors">
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm text-white hover:text-primary-300 line-clamp-1">{p.title}</p>
                                            <p className="text-xs text-gray-500 mt-0.5">
                                                {p.journal?.name} · {p.published_year}
                                            </p>
                                        </div>
                                        <span className="text-xs text-gray-500 flex-shrink-0">
                                            {p.citations_count?.toLocaleString()} trích dẫn
                                        </span>
                                    </a>
                                ))}
                            </div>
                        </div>
                    </>
                )}
            </div>
        </AppLayout>
    );
}
