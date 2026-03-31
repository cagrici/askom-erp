import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import Layout from '@/Layouts';
import { Card, Col, Row, Form, Button, Table, Badge } from 'react-bootstrap';
import { Line, Bar } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
    Filler,
} from 'chart.js';
import { FaFilter, FaArrowUp, FaArrowDown, FaMinus } from 'react-icons/fa';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

interface SalesTrend {
    month: string;
    total_sales: number;
    order_count: number;
    customer_count: number;
    moving_avg: number;
    growth: number;
}

interface YoYComparison {
    month: string;
    current_year: number;
    previous_year: number;
    growth: number;
}

interface Seasonality {
    month: string;
    avg_order_value: number;
    avg_orders: number;
}

interface Props {
    filters: {
        start_date: string;
        end_date: string;
    };
    salesTrend: SalesTrend[];
    yoyComparison: YoYComparison[];
    seasonality: Seasonality[];
}

export default function TrendAnalysis({ filters, salesTrend, yoyComparison, seasonality }: Props) {
    const [localFilters, setLocalFilters] = useState(filters);

    const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setLocalFilters(prev => ({ ...prev, [name]: value }));
    };

    const applyFilters = () => {
        router.get('/reports/performance/trend-analysis', localFilters as any, {
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

    // Sales trend with moving average
    const trendChartData = {
        labels: salesTrend.map(t => {
            const date = new Date(t.month + '-01');
            return date.toLocaleDateString('tr-TR', { month: 'short', year: '2-digit' });
        }),
        datasets: [
            {
                label: 'Satış',
                data: salesTrend.map(t => t.total_sales),
                borderColor: 'rgb(54, 162, 235)',
                backgroundColor: 'rgba(54, 162, 235, 0.1)',
                fill: true,
            },
            {
                label: 'Hareketli Ortalama',
                data: salesTrend.map(t => t.moving_avg),
                borderColor: 'rgb(255, 99, 132)',
                borderDash: [5, 5],
                pointRadius: 0,
            },
        ],
    };

    // Year-over-year comparison
    const yoyChartData = {
        labels: yoyComparison.map(y => y.month),
        datasets: [
            {
                label: 'Bu Yıl',
                data: yoyComparison.map(y => y.current_year),
                backgroundColor: 'rgba(75, 192, 192, 0.7)',
            },
            {
                label: 'Geçen Yıl',
                data: yoyComparison.map(y => y.previous_year),
                backgroundColor: 'rgba(255, 206, 86, 0.7)',
            },
        ],
    };

    // Seasonality chart
    const seasonalityChartData = {
        labels: seasonality.map(s => s.month),
        datasets: [
            {
                label: 'Ort. Sipariş Değeri',
                data: seasonality.map(s => s.avg_order_value),
                borderColor: 'rgb(153, 102, 255)',
                yAxisID: 'y',
            },
            {
                label: 'Ort. Sipariş Sayısı',
                data: seasonality.map(s => s.avg_orders),
                borderColor: 'rgb(255, 159, 64)',
                yAxisID: 'y1',
            },
        ],
    };

    const getGrowthIcon = (growth: number) => {
        if (growth > 0) return <FaArrowUp className="text-success" />;
        if (growth < 0) return <FaArrowDown className="text-danger" />;
        return <FaMinus className="text-muted" />;
    };

    const getGrowthBadge = (growth: number) => {
        if (growth > 10) return <Badge bg="success">+{growth}%</Badge>;
        if (growth > 0) return <Badge bg="info">+{growth}%</Badge>;
        if (growth === 0) return <Badge bg="secondary">0%</Badge>;
        if (growth > -10) return <Badge bg="warning">{growth}%</Badge>;
        return <Badge bg="danger">{growth}%</Badge>;
    };

    return (
        <Layout>
            <Head title="Trend Analizi" />

            <div className="page-content">
                <div className="page-header mb-4">
                    <h4 className="page-title">Trend Analizi</h4>
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

                {/* Main Trend Chart */}
                <Card className="mb-4">
                    <Card.Header>
                        <h5 className="mb-0">Satış Trendi ve Hareketli Ortalama</h5>
                    </Card.Header>
                    <Card.Body>
                        <Line
                            data={trendChartData}
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

                {/* YoY Comparison */}
                <Card className="mb-4">
                    <Card.Header>
                        <h5 className="mb-0">Yıllık Karşılaştırma</h5>
                    </Card.Header>
                    <Card.Body>
                        <Bar
                            data={yoyChartData}
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

                {/* Seasonality */}
                <Card className="mb-4">
                    <Card.Header>
                        <h5 className="mb-0">Mevsimsellik Analizi</h5>
                    </Card.Header>
                    <Card.Body>
                        <Line
                            data={seasonalityChartData}
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

                {/* Trend Details Table */}
                <Card>
                    <Card.Header>
                        <h5 className="mb-0">Aylık Trend Detayları</h5>
                    </Card.Header>
                    <Card.Body>
                        <div className="table-responsive">
                            <Table striped hover>
                                <thead>
                                    <tr>
                                        <th>Ay</th>
                                        <th className="text-end">Satış</th>
                                        <th className="text-end">Sipariş</th>
                                        <th className="text-end">Müşteri</th>
                                        <th className="text-end">Hareketli Ort.</th>
                                        <th className="text-center">Büyüme</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {salesTrend.map((item, idx) => (
                                        <tr key={idx}>
                                            <td>
                                                {new Date(item.month + '-01').toLocaleDateString('tr-TR', {
                                                    month: 'long',
                                                    year: 'numeric',
                                                })}
                                            </td>
                                            <td className="text-end">{formatCurrency(item.total_sales)}</td>
                                            <td className="text-end">{formatNumber(item.order_count)}</td>
                                            <td className="text-end">{formatNumber(item.customer_count)}</td>
                                            <td className="text-end">{formatCurrency(item.moving_avg)}</td>
                                            <td className="text-center">
                                                {getGrowthIcon(item.growth)} {getGrowthBadge(item.growth)}
                                            </td>
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
