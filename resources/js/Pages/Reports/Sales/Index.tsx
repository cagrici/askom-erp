import React, { useState } from 'react';
import { Head, router, Link } from '@inertiajs/react';
import Layout from '@/Layouts';
import { Card, Col, Row, Form, Button, Table, Badge } from 'react-bootstrap';
import { Line, Bar, Pie } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js';
import { FaFilter, FaChartLine, FaUsers, FaUserTie, FaMapMarkerAlt, FaArrowUp, FaArrowDown } from 'react-icons/fa';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend
);

interface MonthlyTrendItem {
    month: string;
    total_amount: number;
    order_count: number;
}

interface TopProduct {
    name: string;
    total_amount: number;
}

interface CategorySales {
    category_name: string;
    total_amount: number;
}

interface RecentOrder {
    id: number;
    doc_number: string;
    doc_date: string;
    amt: number;
    request_status: string;
    current_account?: {
        id: number;
        name: string;
        code: string;
    };
}

interface Props {
    filters: {
        start_date: string;
        end_date: string;
    };
    summary: {
        total_sales: number;
        order_count: number;
        avg_order_value: number;
        return_rate: number;
    };
    monthlyTrend: MonthlyTrendItem[];
    topProducts: TopProduct[];
    salesByCategory: CategorySales[];
    recentOrders: RecentOrder[];
}

export default function SalesReportIndex({
    filters,
    summary,
    monthlyTrend,
    topProducts,
    salesByCategory,
    recentOrders,
}: Props) {
    const [localFilters, setLocalFilters] = useState(filters);

    const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setLocalFilters(prev => ({ ...prev, [name]: value }));
    };

    const applyFilters = () => {
        router.get('/reports/sales', localFilters as any, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('tr-TR', {
            style: 'currency',
            currency: 'TRY',
            minimumFractionDigits: 2,
        }).format(amount);
    };

    const formatNumber = (num: number) => {
        return new Intl.NumberFormat('tr-TR').format(num);
    };

    // Monthly trend chart
    const trendChartData = {
        labels: monthlyTrend.map(d => {
            const date = new Date(d.month + '-01');
            return date.toLocaleDateString('tr-TR', { month: 'short', year: 'numeric' });
        }),
        datasets: [
            {
                label: 'Satış Tutarı',
                data: monthlyTrend.map(d => d.total_amount),
                borderColor: 'rgb(54, 162, 235)',
                backgroundColor: 'rgba(54, 162, 235, 0.5)',
                yAxisID: 'y',
            },
            {
                label: 'Sipariş Sayısı',
                data: monthlyTrend.map(d => d.order_count),
                borderColor: 'rgb(255, 99, 132)',
                backgroundColor: 'rgba(255, 99, 132, 0.5)',
                yAxisID: 'y1',
            },
        ],
    };

    // Top products chart
    const topProductsChartData = {
        labels: topProducts.slice(0, 10).map(p =>
            p.name.length > 20 ? p.name.substring(0, 20) + '...' : p.name
        ),
        datasets: [
            {
                label: 'Satış Tutarı',
                data: topProducts.slice(0, 10).map(p => p.total_amount),
                backgroundColor: [
                    'rgba(255, 99, 132, 0.7)',
                    'rgba(54, 162, 235, 0.7)',
                    'rgba(255, 206, 86, 0.7)',
                    'rgba(75, 192, 192, 0.7)',
                    'rgba(153, 102, 255, 0.7)',
                    'rgba(255, 159, 64, 0.7)',
                    'rgba(199, 199, 199, 0.7)',
                    'rgba(83, 102, 255, 0.7)',
                    'rgba(255, 99, 255, 0.7)',
                    'rgba(99, 255, 132, 0.7)',
                ],
            },
        ],
    };

    // Category distribution chart
    const categoryChartData = {
        labels: salesByCategory.map(c => c.category_name),
        datasets: [
            {
                data: salesByCategory.map(c => c.total_amount),
                backgroundColor: [
                    'rgba(255, 99, 132, 0.7)',
                    'rgba(54, 162, 235, 0.7)',
                    'rgba(255, 206, 86, 0.7)',
                    'rgba(75, 192, 192, 0.7)',
                    'rgba(153, 102, 255, 0.7)',
                    'rgba(255, 159, 64, 0.7)',
                    'rgba(199, 199, 199, 0.7)',
                    'rgba(83, 102, 255, 0.7)',
                ],
            },
        ],
    };

    const getStatusBadge = (status: string) => {
        const statusMap: Record<string, { bg: string; text: string }> = {
            '1': { bg: 'warning', text: 'Beklemede' },
            '2': { bg: 'info', text: 'Onaylandı' },
            '3': { bg: 'primary', text: 'İşleniyor' },
            '4': { bg: 'success', text: 'Tamamlandı' },
            '5': { bg: 'danger', text: 'İptal' },
        };
        const s = statusMap[status] || { bg: 'secondary', text: 'Bilinmiyor' };
        return <Badge bg={s.bg}>{s.text}</Badge>;
    };

    return (
        <Layout>
            <Head title="Satış Raporları" />

            <div className="page-content">
                <div className="page-header d-flex justify-content-between align-items-center mb-4">
                    <h4 className="page-title mb-0">Satış Raporları</h4>
                    <div className="d-flex gap-2">
                        <Link href="/reports/sales/by-product" className="btn btn-outline-primary btn-sm">
                            <FaChartLine className="me-1" /> Ürün Bazlı
                        </Link>
                        <Link href="/reports/sales/by-customer" className="btn btn-outline-primary btn-sm">
                            <FaUsers className="me-1" /> Müşteri Bazlı
                        </Link>
                        <Link href="/reports/sales/by-salesperson" className="btn btn-outline-primary btn-sm">
                            <FaUserTie className="me-1" /> Temsilci Bazlı
                        </Link>
                        <Link href="/reports/sales/by-region" className="btn btn-outline-primary btn-sm">
                            <FaMapMarkerAlt className="me-1" /> Bölge Bazlı
                        </Link>
                    </div>
                </div>

                {/* Filters */}
                <Card className="mb-4">
                    <Card.Body>
                        <Row className="align-items-end">
                            <Col md={4}>
                                <Form.Group>
                                    <Form.Label>Başlangıç Tarihi</Form.Label>
                                    <Form.Control
                                        type="date"
                                        name="start_date"
                                        value={localFilters.start_date}
                                        onChange={handleFilterChange}
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={4}>
                                <Form.Group>
                                    <Form.Label>Bitiş Tarihi</Form.Label>
                                    <Form.Control
                                        type="date"
                                        name="end_date"
                                        value={localFilters.end_date}
                                        onChange={handleFilterChange}
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={4}>
                                <Button variant="primary" onClick={applyFilters}>
                                    <FaFilter className="me-2" />
                                    Filtrele
                                </Button>
                            </Col>
                        </Row>
                    </Card.Body>
                </Card>

                {/* Summary Cards */}
                <Row className="mb-4">
                    <Col md={3}>
                        <Card className="text-center h-100">
                            <Card.Body>
                                <div className="text-muted mb-2">Toplam Satış</div>
                                <h3 className="mb-0 text-primary">{formatCurrency(summary.total_sales)}</h3>
                            </Card.Body>
                        </Card>
                    </Col>
                    <Col md={3}>
                        <Card className="text-center h-100">
                            <Card.Body>
                                <div className="text-muted mb-2">Sipariş Sayısı</div>
                                <h3 className="mb-0 text-info">{formatNumber(summary.order_count)}</h3>
                            </Card.Body>
                        </Card>
                    </Col>
                    <Col md={3}>
                        <Card className="text-center h-100">
                            <Card.Body>
                                <div className="text-muted mb-2">Ortalama Sepet</div>
                                <h3 className="mb-0 text-success">{formatCurrency(summary.avg_order_value)}</h3>
                            </Card.Body>
                        </Card>
                    </Col>
                    <Col md={3}>
                        <Card className="text-center h-100">
                            <Card.Body>
                                <div className="text-muted mb-2">İade Oranı</div>
                                <h3 className="mb-0 text-warning">%{summary.return_rate}</h3>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>

                {/* Charts Row 1 */}
                <Row className="mb-4">
                    <Col md={8}>
                        <Card className="h-100">
                            <Card.Header>
                                <h5 className="mb-0">Aylık Satış Trendi</h5>
                            </Card.Header>
                            <Card.Body>
                                <Line
                                    data={trendChartData}
                                    options={{
                                        responsive: true,
                                        interaction: {
                                            mode: 'index' as const,
                                            intersect: false,
                                        },
                                        scales: {
                                            y: {
                                                type: 'linear' as const,
                                                display: true,
                                                position: 'left' as const,
                                                ticks: {
                                                    callback: function(value) {
                                                        return formatCurrency(value as number);
                                                    },
                                                },
                                            },
                                            y1: {
                                                type: 'linear' as const,
                                                display: true,
                                                position: 'right' as const,
                                                grid: {
                                                    drawOnChartArea: false,
                                                },
                                            },
                                        },
                                    }}
                                />
                            </Card.Body>
                        </Card>
                    </Col>
                    <Col md={4}>
                        <Card className="h-100">
                            <Card.Header>
                                <h5 className="mb-0">Kategori Dağılımı</h5>
                            </Card.Header>
                            <Card.Body>
                                <Pie
                                    data={categoryChartData}
                                    options={{
                                        responsive: true,
                                        plugins: {
                                            legend: {
                                                position: 'bottom' as const,
                                            },
                                        },
                                    }}
                                />
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>

                {/* Charts Row 2 */}
                <Row className="mb-4">
                    <Col md={12}>
                        <Card>
                            <Card.Header>
                                <h5 className="mb-0">En Çok Satan 10 Ürün</h5>
                            </Card.Header>
                            <Card.Body>
                                <Bar
                                    data={topProductsChartData}
                                    options={{
                                        responsive: true,
                                        indexAxis: 'y' as const,
                                        plugins: {
                                            legend: {
                                                display: false,
                                            },
                                        },
                                        scales: {
                                            x: {
                                                ticks: {
                                                    callback: function(value) {
                                                        return formatCurrency(value as number);
                                                    },
                                                },
                                            },
                                        },
                                    }}
                                />
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>

                {/* Recent Orders */}
                <Card>
                    <Card.Header>
                        <h5 className="mb-0">Son Siparişler</h5>
                    </Card.Header>
                    <Card.Body>
                        <div className="table-responsive">
                            <Table striped hover>
                                <thead>
                                    <tr>
                                        <th>Fatura No</th>
                                        <th>Tarih</th>
                                        <th>Müşteri</th>
                                        <th className="text-end">Tutar</th>
                                        <th className="text-center">Durum</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {recentOrders.map((order) => (
                                        <tr key={order.id}>
                                            <td>{order.doc_number}</td>
                                            <td>{new Date(order.doc_date).toLocaleDateString('tr-TR')}</td>
                                            <td>{order.current_account?.name || '-'}</td>
                                            <td className="text-end">{formatCurrency(order.amt)}</td>
                                            <td className="text-center">{getStatusBadge(order.request_status)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </Table>
                        </div>
                    </Card.Body>
                </Card>
            </div>
        </Layout>
    );
}
