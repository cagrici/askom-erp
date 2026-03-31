import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import Layout from '@/Layouts';
import { Card, Col, Row, Form, Button, Table, Badge, ProgressBar } from 'react-bootstrap';
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
import { FaFilter } from 'react-icons/fa';

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

interface MonthlyMargin {
    month: string;
    revenue: number;
    cost: number;
    profit: number;
    margin: number;
}

interface ProductMargin {
    name: string;
    revenue: number;
    cost: number;
    profit: number;
    margin: number;
}

interface CategoryMargin {
    category_name: string;
    revenue: number;
    cost: number;
    profit: number;
    margin: number;
}

interface Props {
    filters: {
        start_date: string;
        end_date: string;
    };
    monthlyMargins: MonthlyMargin[];
    productMargins: ProductMargin[];
    categoryMargins: CategoryMargin[];
}

export default function ProfitMargin({ filters, monthlyMargins, productMargins, categoryMargins }: Props) {
    const [localFilters, setLocalFilters] = useState(filters);

    const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setLocalFilters(prev => ({ ...prev, [name]: value }));
    };

    const applyFilters = () => {
        router.get('/reports/financial/profit-margin', localFilters as any, {
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

    const totalRevenue = monthlyMargins.reduce((sum, m) => sum + m.revenue, 0);
    const totalCost = monthlyMargins.reduce((sum, m) => sum + m.cost, 0);
    const totalProfit = totalRevenue - totalCost;
    const avgMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

    const marginTrendChartData = {
        labels: monthlyMargins.map(m => {
            const date = new Date(m.month + '-01');
            return date.toLocaleDateString('tr-TR', { month: 'short' });
        }),
        datasets: [
            {
                label: 'Kar Marjı (%)',
                data: monthlyMargins.map(m => m.margin),
                borderColor: 'rgb(75, 192, 192)',
                backgroundColor: 'rgba(75, 192, 192, 0.5)',
                yAxisID: 'y1',
            },
            {
                label: 'Kar',
                data: monthlyMargins.map(m => m.profit),
                borderColor: 'rgb(54, 162, 235)',
                backgroundColor: 'rgba(54, 162, 235, 0.5)',
                yAxisID: 'y',
            },
        ],
    };

    const revenueVsCostChartData = {
        labels: monthlyMargins.map(m => {
            const date = new Date(m.month + '-01');
            return date.toLocaleDateString('tr-TR', { month: 'short' });
        }),
        datasets: [
            {
                label: 'Gelir',
                data: monthlyMargins.map(m => m.revenue),
                backgroundColor: 'rgba(75, 192, 192, 0.7)',
            },
            {
                label: 'Maliyet',
                data: monthlyMargins.map(m => m.cost),
                backgroundColor: 'rgba(255, 99, 132, 0.7)',
            },
        ],
    };

    const categoryChartData = {
        labels: categoryMargins.map(c => c.category_name),
        datasets: [
            {
                data: categoryMargins.map(c => c.profit),
                backgroundColor: [
                    'rgba(75, 192, 192, 0.7)',
                    'rgba(54, 162, 235, 0.7)',
                    'rgba(255, 206, 86, 0.7)',
                    'rgba(153, 102, 255, 0.7)',
                    'rgba(255, 159, 64, 0.7)',
                ],
            },
        ],
    };

    const getMarginBadge = (margin: number) => {
        if (margin >= 30) return <Badge bg="success">Yüksek</Badge>;
        if (margin >= 15) return <Badge bg="info">Orta</Badge>;
        if (margin >= 0) return <Badge bg="warning">Düşük</Badge>;
        return <Badge bg="danger">Zarar</Badge>;
    };

    return (
        <Layout>
            <Head title="Kar Marjı Analizi" />

            <div className="page-content">
                <div className="page-header mb-4">
                    <h4 className="page-title">Kar Marjı Analizi</h4>
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

                {/* Summary */}
                <Row className="mb-4">
                    <Col md={3}>
                        <Card className="text-center h-100">
                            <Card.Body>
                                <div className="text-muted mb-2">Toplam Gelir</div>
                                <h3 className="mb-0 text-primary">{formatCurrency(totalRevenue)}</h3>
                            </Card.Body>
                        </Card>
                    </Col>
                    <Col md={3}>
                        <Card className="text-center h-100">
                            <Card.Body>
                                <div className="text-muted mb-2">Toplam Maliyet</div>
                                <h3 className="mb-0 text-danger">{formatCurrency(totalCost)}</h3>
                            </Card.Body>
                        </Card>
                    </Col>
                    <Col md={3}>
                        <Card className="text-center h-100">
                            <Card.Body>
                                <div className="text-muted mb-2">Toplam Kar</div>
                                <h3 className={`mb-0 ${totalProfit >= 0 ? 'text-success' : 'text-danger'}`}>
                                    {formatCurrency(totalProfit)}
                                </h3>
                            </Card.Body>
                        </Card>
                    </Col>
                    <Col md={3}>
                        <Card className="text-center h-100">
                            <Card.Body>
                                <div className="text-muted mb-2">Ortalama Marj</div>
                                <h3 className="mb-0 text-info">%{avgMargin.toFixed(1)}</h3>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>

                {/* Charts */}
                <Row className="mb-4">
                    <Col md={8}>
                        <Card className="h-100">
                            <Card.Header>
                                <h5 className="mb-0">Gelir vs Maliyet Trendi</h5>
                            </Card.Header>
                            <Card.Body>
                                <Bar
                                    data={revenueVsCostChartData}
                                    options={{
                                        responsive: true,
                                        plugins: {
                                            legend: {
                                                position: 'top' as const,
                                            },
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
                    </Col>
                    <Col md={4}>
                        <Card className="h-100">
                            <Card.Header>
                                <h5 className="mb-0">Kategori Kar Dağılımı</h5>
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

                {/* Margin Trend */}
                <Card className="mb-4">
                    <Card.Header>
                        <h5 className="mb-0">Kar Marjı Trendi</h5>
                    </Card.Header>
                    <Card.Body>
                        <Line
                            data={marginTrendChartData}
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
                                        ticks: {
                                            callback: function(value) {
                                                return value + '%';
                                            },
                                        },
                                    },
                                },
                            }}
                        />
                    </Card.Body>
                </Card>

                {/* Product Margins Table */}
                <Card>
                    <Card.Header>
                        <h5 className="mb-0">Ürün Kar Marjları</h5>
                    </Card.Header>
                    <Card.Body>
                        <div className="table-responsive">
                            <Table striped hover>
                                <thead>
                                    <tr>
                                        <th>Ürün</th>
                                        <th className="text-end">Gelir</th>
                                        <th className="text-end">Maliyet</th>
                                        <th className="text-end">Kar</th>
                                        <th style={{ width: '150px' }}>Marj</th>
                                        <th className="text-center">Seviye</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {productMargins.slice(0, 20).map((product, idx) => (
                                        <tr key={idx}>
                                            <td>{product.name}</td>
                                            <td className="text-end">{formatCurrency(product.revenue)}</td>
                                            <td className="text-end">{formatCurrency(product.cost)}</td>
                                            <td className={`text-end ${product.profit >= 0 ? 'text-success' : 'text-danger'}`}>
                                                {formatCurrency(product.profit)}
                                            </td>
                                            <td>
                                                <div className="d-flex align-items-center">
                                                    <ProgressBar
                                                        now={Math.max(0, Math.min(product.margin, 100))}
                                                        variant={product.margin >= 20 ? 'success' : product.margin >= 10 ? 'info' : 'warning'}
                                                        className="flex-grow-1 me-2"
                                                    />
                                                    <small>%{product.margin}</small>
                                                </div>
                                            </td>
                                            <td className="text-center">{getMarginBadge(product.margin)}</td>
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
