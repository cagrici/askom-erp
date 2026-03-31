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
import { FaFilter, FaChartBar, FaMoneyBillWave, FaChartLine, FaExclamationTriangle } from 'react-icons/fa';

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

interface CategorySales {
    name: string;
    value: number;
}

interface PerformanceTrend {
    month: string;
    total_sales: number;
    product_count: number;
}

interface BrandSales {
    name: string;
    value: number;
}

interface LowPerformingProduct {
    code: string;
    name: string;
    total_sales: number;
    total_quantity: number;
}

interface Props {
    filters: {
        start_date: string;
        end_date: string;
    };
    summary: {
        total_products: number;
        active_products: number;
        low_stock: number;
        out_of_stock: number;
    };
    salesByCategory: CategorySales[];
    performanceTrend: PerformanceTrend[];
    salesByBrand: BrandSales[];
    lowPerformingProducts: LowPerformingProduct[];
}

export default function ProductReportIndex({
    filters,
    summary,
    salesByCategory,
    performanceTrend,
    salesByBrand,
    lowPerformingProducts,
}: Props) {
    const [localFilters, setLocalFilters] = useState(filters);

    const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setLocalFilters(prev => ({ ...prev, [name]: value }));
    };

    const applyFilters = () => {
        router.get('/reports/products', localFilters as any, {
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

    const categoryChartData = {
        labels: salesByCategory.map(c => c.name),
        datasets: [
            {
                data: salesByCategory.map(c => c.value),
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

    const trendChartData = {
        labels: performanceTrend.map(p => {
            const date = new Date(p.month + '-01');
            return date.toLocaleDateString('tr-TR', { month: 'short' });
        }),
        datasets: [
            {
                label: 'Satış Tutarı',
                data: performanceTrend.map(p => p.total_sales),
                borderColor: 'rgb(54, 162, 235)',
                backgroundColor: 'rgba(54, 162, 235, 0.5)',
                yAxisID: 'y',
            },
            {
                label: 'Satılan Ürün Sayısı',
                data: performanceTrend.map(p => p.product_count),
                borderColor: 'rgb(255, 99, 132)',
                backgroundColor: 'rgba(255, 99, 132, 0.5)',
                yAxisID: 'y1',
            },
        ],
    };

    const brandChartData = {
        labels: salesByBrand.map(b => b.name),
        datasets: [
            {
                label: 'Satış Tutarı',
                data: salesByBrand.map(b => b.value),
                backgroundColor: 'rgba(153, 102, 255, 0.7)',
            },
        ],
    };

    return (
        <Layout>
            <Head title="Ürün Analizleri" />

            <div className="page-content">
                <div className="page-header d-flex justify-content-between align-items-center mb-4">
                    <h4 className="page-title mb-0">Ürün Analizleri</h4>
                    <div className="d-flex gap-2">
                        <Link href="/reports/products/performance" className="btn btn-outline-primary btn-sm">
                            <FaChartBar className="me-1" /> Performans
                        </Link>
                        <Link href="/reports/products/profitability" className="btn btn-outline-primary btn-sm">
                            <FaMoneyBillWave className="me-1" /> Karlılık
                        </Link>
                        <Link href="/reports/products/trends" className="btn btn-outline-primary btn-sm">
                            <FaChartLine className="me-1" /> Trendler
                        </Link>
                        <Link href="/reports/products/slow-moving" className="btn btn-outline-primary btn-sm">
                            <FaExclamationTriangle className="me-1" /> Yavaş Hareket
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
                                <div className="text-muted mb-2">Toplam Ürün</div>
                                <h3 className="mb-0 text-primary">{formatNumber(summary.total_products)}</h3>
                            </Card.Body>
                        </Card>
                    </Col>
                    <Col md={3}>
                        <Card className="text-center h-100">
                            <Card.Body>
                                <div className="text-muted mb-2">Aktif Ürün</div>
                                <h3 className="mb-0 text-success">{formatNumber(summary.active_products)}</h3>
                            </Card.Body>
                        </Card>
                    </Col>
                    <Col md={3}>
                        <Card className="text-center h-100">
                            <Card.Body>
                                <div className="text-muted mb-2">Düşük Stok</div>
                                <h3 className="mb-0 text-warning">{formatNumber(summary.low_stock)}</h3>
                            </Card.Body>
                        </Card>
                    </Col>
                    <Col md={3}>
                        <Card className="text-center h-100">
                            <Card.Body>
                                <div className="text-muted mb-2">Stoksuz</div>
                                <h3 className="mb-0 text-danger">{formatNumber(summary.out_of_stock)}</h3>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>

                {/* Charts Row 1 */}
                <Row className="mb-4">
                    <Col md={5}>
                        <Card className="h-100">
                            <Card.Header>
                                <h5 className="mb-0">Kategori Bazlı Satış</h5>
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
                    <Col md={7}>
                        <Card className="h-100">
                            <Card.Header>
                                <h5 className="mb-0">Performans Trendi</h5>
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
                </Row>

                {/* Brand Sales Chart */}
                <Card className="mb-4">
                    <Card.Header>
                        <h5 className="mb-0">Marka Bazlı Satış</h5>
                    </Card.Header>
                    <Card.Body>
                        <Bar
                            data={brandChartData}
                            options={{
                                responsive: true,
                                plugins: {
                                    legend: { display: false },
                                },
                                scales: {
                                    y: {
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

                {/* Low Performing Products */}
                <Card>
                    <Card.Header className="d-flex justify-content-between align-items-center">
                        <h5 className="mb-0">
                            <FaExclamationTriangle className="text-warning me-2" />
                            Düşük Performanslı Ürünler
                        </h5>
                        <Badge bg="warning">{lowPerformingProducts.length} ürün</Badge>
                    </Card.Header>
                    <Card.Body>
                        <div className="table-responsive">
                            <Table striped hover>
                                <thead>
                                    <tr>
                                        <th>Ürün Kodu</th>
                                        <th>Ürün Adı</th>
                                        <th className="text-end">Satış Miktarı</th>
                                        <th className="text-end">Satış Tutarı</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {lowPerformingProducts.map((product, idx) => (
                                        <tr key={idx}>
                                            <td>{product.code}</td>
                                            <td>{product.name}</td>
                                            <td className="text-end">{formatNumber(product.total_quantity)}</td>
                                            <td className="text-end">{formatCurrency(product.total_sales)}</td>
                                        </tr>
                                    ))}
                                    {lowPerformingProducts.length === 0 && (
                                        <tr>
                                            <td colSpan={4} className="text-center text-muted">
                                                Veri bulunmuyor
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
