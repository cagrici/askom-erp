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
import { FaFilter, FaChartPie, FaHeart, FaChartLine, FaUserPlus, FaExclamationTriangle } from 'react-icons/fa';

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

interface GrowthTrend {
    month: string;
    count: number;
}

interface TopCustomer {
    name: string;
    total_sales: number;
}

interface Segmentation {
    name: string;
    value: number;
}

interface AtRiskCustomer {
    id: number;
    code: string;
    name: string;
    current_balance: number;
}

interface Props {
    filters: {
        start_date: string;
        end_date: string;
    };
    summary: {
        total_customers: number;
        active_customers: number;
        new_customers: number;
        avg_sales_per_customer: number;
    };
    segmentation: Segmentation[];
    growthTrend: GrowthTrend[];
    topCustomers: TopCustomer[];
    atRiskCustomers: AtRiskCustomer[];
}

export default function CustomerReportIndex({
    filters,
    summary,
    segmentation,
    growthTrend,
    topCustomers,
    atRiskCustomers,
}: Props) {
    const [localFilters, setLocalFilters] = useState(filters);

    const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setLocalFilters(prev => ({ ...prev, [name]: value }));
    };

    const applyFilters = () => {
        router.get('/reports/customers', localFilters as any, {
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

    // Segmentation pie chart
    const segmentationChartData = {
        labels: segmentation.map(s => s.name),
        datasets: [
            {
                data: segmentation.map(s => s.value),
                backgroundColor: [
                    'rgba(75, 192, 192, 0.7)',
                    'rgba(255, 206, 86, 0.7)',
                    'rgba(255, 99, 132, 0.7)',
                ],
            },
        ],
    };

    // Growth trend chart
    const growthChartData = {
        labels: growthTrend.map(g => {
            const date = new Date(g.month + '-01');
            return date.toLocaleDateString('tr-TR', { month: 'short' });
        }),
        datasets: [
            {
                label: 'Yeni Müşteri',
                data: growthTrend.map(g => g.count),
                borderColor: 'rgb(54, 162, 235)',
                backgroundColor: 'rgba(54, 162, 235, 0.5)',
                fill: true,
            },
        ],
    };

    // Top customers chart
    const topCustomersChartData = {
        labels: topCustomers.map(c =>
            c.name.length > 20 ? c.name.substring(0, 20) + '...' : c.name
        ),
        datasets: [
            {
                label: 'Satış Tutarı',
                data: topCustomers.map(c => c.total_sales),
                backgroundColor: 'rgba(153, 102, 255, 0.7)',
            },
        ],
    };

    return (
        <Layout>
            <Head title="Müşteri Raporları" />

            <div className="page-content">
                <div className="page-header d-flex justify-content-between align-items-center mb-4">
                    <h4 className="page-title mb-0">Müşteri Raporları</h4>
                    <div className="d-flex gap-2">
                        <Link href="/reports/customers/segmentation" className="btn btn-outline-primary btn-sm">
                            <FaChartPie className="me-1" /> Segmentasyon
                        </Link>
                        <Link href="/reports/customers/lifetime-value" className="btn btn-outline-primary btn-sm">
                            <FaHeart className="me-1" /> Yaşam Değeri
                        </Link>
                        <Link href="/reports/customers/retention" className="btn btn-outline-primary btn-sm">
                            <FaChartLine className="me-1" /> Sadakat
                        </Link>
                        <Link href="/reports/customers/growth" className="btn btn-outline-primary btn-sm">
                            <FaUserPlus className="me-1" /> Büyüme
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
                                <div className="text-muted mb-2">Toplam Müşteri</div>
                                <h3 className="mb-0 text-primary">{formatNumber(summary.total_customers)}</h3>
                            </Card.Body>
                        </Card>
                    </Col>
                    <Col md={3}>
                        <Card className="text-center h-100">
                            <Card.Body>
                                <div className="text-muted mb-2">Aktif Müşteri</div>
                                <h3 className="mb-0 text-success">{formatNumber(summary.active_customers)}</h3>
                            </Card.Body>
                        </Card>
                    </Col>
                    <Col md={3}>
                        <Card className="text-center h-100">
                            <Card.Body>
                                <div className="text-muted mb-2">Yeni Müşteri (Dönem)</div>
                                <h3 className="mb-0 text-info">{formatNumber(summary.new_customers)}</h3>
                            </Card.Body>
                        </Card>
                    </Col>
                    <Col md={3}>
                        <Card className="text-center h-100">
                            <Card.Body>
                                <div className="text-muted mb-2">Ort. Satış/Müşteri</div>
                                <h3 className="mb-0 text-warning">{formatCurrency(summary.avg_sales_per_customer)}</h3>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>

                {/* Charts Row 1 */}
                <Row className="mb-4">
                    <Col md={4}>
                        <Card className="h-100">
                            <Card.Header>
                                <h5 className="mb-0">Müşteri Segmentasyonu</h5>
                            </Card.Header>
                            <Card.Body>
                                <Pie
                                    data={segmentationChartData}
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
                    <Col md={8}>
                        <Card className="h-100">
                            <Card.Header>
                                <h5 className="mb-0">Müşteri Büyüme Trendi</h5>
                            </Card.Header>
                            <Card.Body>
                                <Line
                                    data={growthChartData}
                                    options={{
                                        responsive: true,
                                        plugins: {
                                            legend: { display: false },
                                        },
                                    }}
                                />
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>

                {/* Top Customers Chart */}
                <Card className="mb-4">
                    <Card.Header>
                        <h5 className="mb-0">En Değerli 10 Müşteri</h5>
                    </Card.Header>
                    <Card.Body>
                        <Bar
                            data={topCustomersChartData}
                            options={{
                                responsive: true,
                                indexAxis: 'y' as const,
                                plugins: {
                                    legend: { display: false },
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

                {/* At Risk Customers */}
                <Card>
                    <Card.Header className="d-flex justify-content-between align-items-center">
                        <h5 className="mb-0">
                            <FaExclamationTriangle className="text-warning me-2" />
                            Risk Altındaki Müşteriler
                        </h5>
                        <Badge bg="warning">{atRiskCustomers.length} müşteri</Badge>
                    </Card.Header>
                    <Card.Body>
                        <p className="text-muted small mb-3">
                            Son 90 gün içinde sipariş vermeyen ancak daha önce sipariş geçmişi olan müşteriler
                        </p>
                        <div className="table-responsive">
                            <Table striped hover>
                                <thead>
                                    <tr>
                                        <th>Müşteri Kodu</th>
                                        <th>Müşteri Adı</th>
                                        <th className="text-end">Mevcut Bakiye</th>
                                        <th>Aksiyon</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {atRiskCustomers.map((customer) => (
                                        <tr key={customer.id}>
                                            <td>{customer.code}</td>
                                            <td>{customer.name}</td>
                                            <td className="text-end">{formatCurrency(customer.current_balance)}</td>
                                            <td>
                                                <Button variant="outline-primary" size="sm">
                                                    İletişime Geç
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                    {atRiskCustomers.length === 0 && (
                                        <tr>
                                            <td colSpan={4} className="text-center text-muted">
                                                Risk altında müşteri bulunmuyor
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </Table>
                        </div>
                    </Card.Body>
                </Card>
            </div>
        </Layout>
    );
}
