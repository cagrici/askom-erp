import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import Layout from '@/Layouts';
import { Card, Col, Row, Form, Button, ProgressBar } from 'react-bootstrap';
import { Line } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js';
import { FaFilter, FaShoppingCart, FaTruck, FaUsers, FaChartLine } from 'react-icons/fa';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

interface OrderKPIs {
    total_orders: number;
    confirmed_orders: number;
    confirmation_rate: number;
    avg_processing_time: number;
}

interface DeliveryKPIs {
    shipped_orders: number;
    delivered_orders: number;
    delivery_rate: number;
    avg_delivery_time: number;
}

interface CustomerKPIs {
    active_customers: number;
    repeat_customers: number;
    repeat_rate: number;
    satisfaction_score: number;
}

interface FinancialKPIs {
    total_revenue: number;
    total_cost: number;
    gross_profit: number;
    gross_margin: number;
}

interface KPITrend {
    month: string;
    orders: number;
    revenue: number;
    customers: number;
}

interface Props {
    filters: {
        start_date: string;
        end_date: string;
    };
    orderKPIs: OrderKPIs;
    deliveryKPIs: DeliveryKPIs;
    customerKPIs: CustomerKPIs;
    financialKPIs: FinancialKPIs;
    kpiTrend: KPITrend[];
}

export default function OperationalKPIs({
    filters,
    orderKPIs,
    deliveryKPIs,
    customerKPIs,
    financialKPIs,
    kpiTrend,
}: Props) {
    const [localFilters, setLocalFilters] = useState(filters);

    const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setLocalFilters(prev => ({ ...prev, [name]: value }));
    };

    const applyFilters = () => {
        router.get('/reports/performance/operational-kpis', localFilters as any, {
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

    const trendChartData = {
        labels: kpiTrend.map(t => {
            const date = new Date(t.month + '-01');
            return date.toLocaleDateString('tr-TR', { month: 'short' });
        }),
        datasets: [
            {
                label: 'Gelir (TL)',
                data: kpiTrend.map(t => t.revenue),
                borderColor: 'rgb(75, 192, 192)',
                yAxisID: 'y',
            },
            {
                label: 'Sipariş',
                data: kpiTrend.map(t => t.orders),
                borderColor: 'rgb(255, 99, 132)',
                yAxisID: 'y1',
            },
            {
                label: 'Müşteri',
                data: kpiTrend.map(t => t.customers),
                borderColor: 'rgb(54, 162, 235)',
                yAxisID: 'y1',
            },
        ],
    };

    return (
        <Layout>
            <Head title="Operasyonel KPI'lar" />

            <div className="page-content">
                <div className="page-header mb-4">
                    <h4 className="page-title">Operasyonel KPI'lar</h4>
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

                {/* Order KPIs */}
                <Card className="mb-4">
                    <Card.Header className="bg-primary text-white">
                        <h5 className="mb-0">
                            <FaShoppingCart className="me-2" />
                            Sipariş KPI'ları
                        </h5>
                    </Card.Header>
                    <Card.Body>
                        <Row>
                            <Col md={3} className="text-center">
                                <h2 className="text-primary">{formatNumber(orderKPIs.total_orders)}</h2>
                                <p className="text-muted mb-0">Toplam Sipariş</p>
                            </Col>
                            <Col md={3} className="text-center">
                                <h2 className="text-success">{formatNumber(orderKPIs.confirmed_orders)}</h2>
                                <p className="text-muted mb-0">Onaylanan Sipariş</p>
                            </Col>
                            <Col md={3} className="text-center">
                                <h2 className="text-info">%{orderKPIs.confirmation_rate}</h2>
                                <p className="text-muted mb-0">Onay Oranı</p>
                                <ProgressBar now={orderKPIs.confirmation_rate} variant="info" className="mt-2" />
                            </Col>
                            <Col md={3} className="text-center">
                                <h2 className="text-warning">{orderKPIs.avg_processing_time} gün</h2>
                                <p className="text-muted mb-0">Ort. İşlem Süresi</p>
                            </Col>
                        </Row>
                    </Card.Body>
                </Card>

                {/* Delivery KPIs */}
                <Card className="mb-4">
                    <Card.Header className="bg-success text-white">
                        <h5 className="mb-0">
                            <FaTruck className="me-2" />
                            Teslimat KPI'ları
                        </h5>
                    </Card.Header>
                    <Card.Body>
                        <Row>
                            <Col md={3} className="text-center">
                                <h2 className="text-primary">{formatNumber(deliveryKPIs.shipped_orders)}</h2>
                                <p className="text-muted mb-0">Sevk Edilen</p>
                            </Col>
                            <Col md={3} className="text-center">
                                <h2 className="text-success">{formatNumber(deliveryKPIs.delivered_orders)}</h2>
                                <p className="text-muted mb-0">Teslim Edilen</p>
                            </Col>
                            <Col md={3} className="text-center">
                                <h2 className="text-info">%{deliveryKPIs.delivery_rate}</h2>
                                <p className="text-muted mb-0">Teslimat Oranı</p>
                                <ProgressBar now={deliveryKPIs.delivery_rate} variant="success" className="mt-2" />
                            </Col>
                            <Col md={3} className="text-center">
                                <h2 className="text-warning">{deliveryKPIs.avg_delivery_time} gün</h2>
                                <p className="text-muted mb-0">Ort. Teslimat Süresi</p>
                            </Col>
                        </Row>
                    </Card.Body>
                </Card>

                {/* Customer KPIs */}
                <Card className="mb-4">
                    <Card.Header className="bg-info text-white">
                        <h5 className="mb-0">
                            <FaUsers className="me-2" />
                            Müşteri KPI'ları
                        </h5>
                    </Card.Header>
                    <Card.Body>
                        <Row>
                            <Col md={3} className="text-center">
                                <h2 className="text-primary">{formatNumber(customerKPIs.active_customers)}</h2>
                                <p className="text-muted mb-0">Aktif Müşteri</p>
                            </Col>
                            <Col md={3} className="text-center">
                                <h2 className="text-success">{formatNumber(customerKPIs.repeat_customers)}</h2>
                                <p className="text-muted mb-0">Tekrar Müşteri</p>
                            </Col>
                            <Col md={3} className="text-center">
                                <h2 className="text-info">%{customerKPIs.repeat_rate}</h2>
                                <p className="text-muted mb-0">Tekrar Oranı</p>
                                <ProgressBar now={customerKPIs.repeat_rate} variant="info" className="mt-2" />
                            </Col>
                            <Col md={3} className="text-center">
                                <h2 className="text-warning">{customerKPIs.satisfaction_score}/5</h2>
                                <p className="text-muted mb-0">Memnuniyet Skoru</p>
                            </Col>
                        </Row>
                    </Card.Body>
                </Card>

                {/* Financial KPIs */}
                <Card className="mb-4">
                    <Card.Header className="bg-warning">
                        <h5 className="mb-0">
                            <FaChartLine className="me-2" />
                            Finansal KPI'lar
                        </h5>
                    </Card.Header>
                    <Card.Body>
                        <Row>
                            <Col md={3} className="text-center">
                                <h2 className="text-primary">{formatCurrency(financialKPIs.total_revenue)}</h2>
                                <p className="text-muted mb-0">Toplam Gelir</p>
                            </Col>
                            <Col md={3} className="text-center">
                                <h2 className="text-danger">{formatCurrency(financialKPIs.total_cost)}</h2>
                                <p className="text-muted mb-0">Toplam Maliyet</p>
                            </Col>
                            <Col md={3} className="text-center">
                                <h2 className="text-success">{formatCurrency(financialKPIs.gross_profit)}</h2>
                                <p className="text-muted mb-0">Brüt Kar</p>
                            </Col>
                            <Col md={3} className="text-center">
                                <h2 className="text-info">%{financialKPIs.gross_margin}</h2>
                                <p className="text-muted mb-0">Brüt Marj</p>
                                <ProgressBar now={financialKPIs.gross_margin} variant="info" className="mt-2" />
                            </Col>
                        </Row>
                    </Card.Body>
                </Card>

                {/* Trend Chart */}
                <Card>
                    <Card.Header>
                        <h5 className="mb-0">KPI Trendi</h5>
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
            </div>
        </Layout>
    );
}
