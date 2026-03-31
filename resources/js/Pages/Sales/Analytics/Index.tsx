import React, { useState, useEffect } from 'react';
import { Head, router } from '@inertiajs/react';
import { Card, Row, Col, Button, Form, Badge, Table, Dropdown } from 'react-bootstrap';
import Layout from '@/Layouts';
import { Line, Doughnut, Bar } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    ArcElement,
    BarElement,
} from 'chart.js';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    ArcElement,
    BarElement
);

interface OverviewData {
    current_period: {
        total_orders: number;
        total_revenue: number;
        total_items: number;
        average_order_value: number;
        confirmed_orders: number;
        shipped_orders: number;
        delivered_orders: number;
        cancelled_orders: number;
    };
    previous_period: {
        total_orders: number;
        total_revenue: number;
        total_items: number;
        average_order_value: number;
    };
    growth: {
        total_orders: number;
        total_revenue: number;
        total_items: number;
        average_order_value: number;
    };
    period_info: {
        current: {
            from: string;
            to: string;
            days: number;
        };
        previous: {
            from: string;
            to: string;
            days: number;
        };
    };
}

interface TrendData {
    period: string;
    period_label: string;
    order_count: number;
    total_revenue: number;
    avg_order_value: number;
}

interface Customer {
    id: number;
    title: string;
    account_code: string;
    order_count: number;
    total_revenue: number;
    avg_order_value: number;
    last_order_date: string;
}

interface Product {
    id: number;
    code: string;
    name: string;
    category_name?: string;
    brand_name?: string;
    total_quantity: number;
    total_revenue: number;
    order_count: number;
    avg_unit_price: number;
}

interface StatusDistribution {
    status: string;
    status_label: string;
    count: number;
    total_amount: number;
    percentage: number;
}

interface Props {
    overview: OverviewData;
    salesTrend: TrendData[];
    topCustomers: Customer[];
    topProducts: Product[];
    statusDistribution: StatusDistribution[];
    filters: {
        date_from?: string;
        date_to?: string;
        customer_id?: number;
        salesperson_id?: number;
        group_by?: string;
    };
    userPermissions: {
        canExport: boolean;
    };
}

export default function Index({ 
    overview, 
    salesTrend, 
    topCustomers, 
    topProducts, 
    statusDistribution, 
    filters, 
    userPermissions 
}: Props) {
    const [currentFilters, setCurrentFilters] = useState(filters);
    const [loading, setLoading] = useState(false);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('tr-TR', {
            style: 'currency',
            currency: 'TRY',
            minimumFractionDigits: 2,
        }).format(amount);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('tr-TR');
    };

    const getGrowthColor = (growth: number) => {
        if (growth > 0) return 'text-success';
        if (growth < 0) return 'text-danger';
        return 'text-muted';
    };

    const getGrowthIcon = (growth: number) => {
        if (growth > 0) return 'ri-arrow-up-line';
        if (growth < 0) return 'ri-arrow-down-line';
        return 'ri-subtract-line';
    };

    // Chart configurations
    const salesTrendChartData = {
        labels: salesTrend.map(item => item.period_label),
        datasets: [
            {
                label: 'Sipariş Sayısı',
                data: salesTrend.map(item => item.order_count),
                borderColor: 'rgb(75, 192, 192)',
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                yAxisID: 'y',
            },
            {
                label: 'Toplam Ciro',
                data: salesTrend.map(item => item.total_revenue),
                borderColor: 'rgb(255, 99, 132)',
                backgroundColor: 'rgba(255, 99, 132, 0.2)',
                yAxisID: 'y1',
            },
        ],
    };

    const salesTrendChartOptions = {
        responsive: true,
        interaction: {
            mode: 'index' as const,
            intersect: false,
        },
        scales: {
            x: {
                display: true,
                title: {
                    display: true,
                    text: 'Periode'
                },
            },
            y: {
                type: 'linear' as const,
                display: true,
                position: 'left' as const,
                title: {
                    display: true,
                    text: 'Sipariş Sayısı'
                },
            },
            y1: {
                type: 'linear' as const,
                display: true,
                position: 'right' as const,
                title: {
                    display: true,
                    text: 'Ciro (TL)'
                },
                grid: {
                    drawOnChartArea: false,
                },
            },
        },
    };

    const statusDistributionChartData = {
        labels: statusDistribution.map(item => item.status_label),
        datasets: [
            {
                data: statusDistribution.map(item => item.count),
                backgroundColor: [
                    '#FF6384',
                    '#36A2EB',
                    '#FFCE56',
                    '#4BC0C0',
                    '#9966FF',
                    '#FF9F40',
                    '#FF6384',
                    '#C9CBCF'
                ],
            },
        ],
    };

    const topProductsChartData = {
        labels: topProducts.map(product => product.name.length > 20 ? product.name.substring(0, 20) + '...' : product.name),
        datasets: [
            {
                label: 'Toplam Satış',
                data: topProducts.map(product => product.total_revenue),
                backgroundColor: 'rgba(54, 162, 235, 0.8)',
            },
        ],
    };

    const handleFilterChange = (field: string, value: any) => {
        const newFilters = { ...currentFilters, [field]: value };
        setCurrentFilters(newFilters);
    };

    const applyFilters = () => {
        setLoading(true);
        router.get(route('sales.analytics.index'), currentFilters, {
            preserveState: true,
            onFinish: () => setLoading(false),
        });
    };

    const handleExport = (type: string, format: string) => {
        const exportData = {
            type,
            format,
            ...currentFilters
        };

        router.post(route('sales.analytics.export'), exportData, {
            onSuccess: (response: any) => {
                // Handle successful export
                console.log('Export successful:', response);
            },
            onError: (errors: any) => {
                console.error('Export failed:', errors);
            }
        });
    };

    return (
        <Layout>
            <Head title="Satış Analitikleri" />
            <div className="page-content">
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <div>
                        <h1 className="h3 mb-1">
                            <i className="ri-line-chart-line me-2"></i>
                            Satış Analitikleri
                        </h1>
                        <div className="text-muted">
                            {formatDate(overview.period_info.current.from)} - {formatDate(overview.period_info.current.to)}
                            <span className="ms-2">({overview.period_info.current.days} gün)</span>
                        </div>
                    </div>

                    {userPermissions.canExport && (
                        <Dropdown>
                            <Dropdown.Toggle variant="primary" size="sm">
                                <i className="ri-download-line me-1"></i>
                                Dışa Aktar
                            </Dropdown.Toggle>
                            <Dropdown.Menu>
                                <Dropdown.Item onClick={() => handleExport('sales_summary', 'excel')}>
                                    <i className="ri-file-excel-line me-2"></i>
                                    Satış Özeti (Excel)
                                </Dropdown.Item>
                                <Dropdown.Item onClick={() => handleExport('customer_analysis', 'excel')}>
                                    <i className="ri-file-excel-line me-2"></i>
                                    Müşteri Analizi (Excel)
                                </Dropdown.Item>
                                <Dropdown.Item onClick={() => handleExport('product_analysis', 'excel')}>
                                    <i className="ri-file-excel-line me-2"></i>
                                    Ürün Analizi (Excel)
                                </Dropdown.Item>
                                <Dropdown.Divider />
                                <Dropdown.Item onClick={() => handleExport('sales_summary', 'pdf')}>
                                    <i className="ri-file-pdf-line me-2"></i>
                                    Satış Raporu (PDF)
                                </Dropdown.Item>
                            </Dropdown.Menu>
                        </Dropdown>
                    )}
                </div>

                {/* Filter Row */}
                <Card className="mb-4">
                    <Card.Body>
                        <Row>
                            <Col md={3}>
                                <Form.Group>
                                    <Form.Label>Başlangıç Tarihi</Form.Label>
                                    <Form.Control
                                        type="date"
                                        value={currentFilters.date_from || ''}
                                        onChange={(e) => handleFilterChange('date_from', e.target.value)}
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={3}>
                                <Form.Group>
                                    <Form.Label>Bitiş Tarihi</Form.Label>
                                    <Form.Control
                                        type="date"
                                        value={currentFilters.date_to || ''}
                                        onChange={(e) => handleFilterChange('date_to', e.target.value)}
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={3}>
                                <Form.Group>
                                    <Form.Label>Gruplama</Form.Label>
                                    <Form.Select
                                        value={currentFilters.group_by || 'day'}
                                        onChange={(e) => handleFilterChange('group_by', e.target.value)}
                                    >
                                        <option value="day">Günlük</option>
                                        <option value="week">Haftalık</option>
                                        <option value="month">Aylık</option>
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                            <Col md={3} className="d-flex align-items-end">
                                <Button 
                                    variant="primary" 
                                    onClick={applyFilters}
                                    disabled={loading}
                                    className="w-100"
                                >
                                    {loading ? (
                                        <>
                                            <span className="spinner-border spinner-border-sm me-2" />
                                            Yükleniyor...
                                        </>
                                    ) : (
                                        <>
                                            <i className="ri-search-line me-1"></i>
                                            Filtrele
                                        </>
                                    )}
                                </Button>
                            </Col>
                        </Row>
                    </Card.Body>
                </Card>

                {/* Overview Cards */}
                <Row className="mb-4">
                    <Col lg={3} md={6} className="mb-3">
                        <Card className="h-100">
                            <Card.Body>
                                <div className="d-flex justify-content-between align-items-start">
                                    <div>
                                        <div className="text-muted mb-1">Toplam Sipariş</div>
                                        <h4 className="mb-0">{overview.current_period.total_orders.toLocaleString()}</h4>
                                    </div>
                                    <div className="text-primary fs-1">
                                        <i className="ri-shopping-cart-line"></i>
                                    </div>
                                </div>
                                <div className={`mt-2 ${getGrowthColor(overview.growth.total_orders)}`}>
                                    <i className={getGrowthIcon(overview.growth.total_orders)}></i>
                                    <span className="ms-1">
                                        {Math.abs(overview.growth.total_orders).toFixed(1)}%
                                    </span>
                                    <small className="text-muted ms-2">önceki döneme göre</small>
                                </div>
                            </Card.Body>
                        </Card>
                    </Col>

                    <Col lg={3} md={6} className="mb-3">
                        <Card className="h-100">
                            <Card.Body>
                                <div className="d-flex justify-content-between align-items-start">
                                    <div>
                                        <div className="text-muted mb-1">Toplam Ciro</div>
                                        <h4 className="mb-0">{formatCurrency(overview.current_period.total_revenue)}</h4>
                                    </div>
                                    <div className="text-success fs-1">
                                        <i className="ri-money-dollar-circle-line"></i>
                                    </div>
                                </div>
                                <div className={`mt-2 ${getGrowthColor(overview.growth.total_revenue)}`}>
                                    <i className={getGrowthIcon(overview.growth.total_revenue)}></i>
                                    <span className="ms-1">
                                        {Math.abs(overview.growth.total_revenue).toFixed(1)}%
                                    </span>
                                    <small className="text-muted ms-2">önceki döneme göre</small>
                                </div>
                            </Card.Body>
                        </Card>
                    </Col>

                    <Col lg={3} md={6} className="mb-3">
                        <Card className="h-100">
                            <Card.Body>
                                <div className="d-flex justify-content-between align-items-start">
                                    <div>
                                        <div className="text-muted mb-1">Ortalama Sipariş Değeri</div>
                                        <h4 className="mb-0">{formatCurrency(overview.current_period.average_order_value)}</h4>
                                    </div>
                                    <div className="text-warning fs-1">
                                        <i className="ri-calculator-line"></i>
                                    </div>
                                </div>
                                <div className={`mt-2 ${getGrowthColor(overview.growth.average_order_value)}`}>
                                    <i className={getGrowthIcon(overview.growth.average_order_value)}></i>
                                    <span className="ms-1">
                                        {Math.abs(overview.growth.average_order_value).toFixed(1)}%
                                    </span>
                                    <small className="text-muted ms-2">önceki döneme göre</small>
                                </div>
                            </Card.Body>
                        </Card>
                    </Col>

                    <Col lg={3} md={6} className="mb-3">
                        <Card className="h-100">
                            <Card.Body>
                                <div className="d-flex justify-content-between align-items-start">
                                    <div>
                                        <div className="text-muted mb-1">Toplam Kalem</div>
                                        <h4 className="mb-0">{overview.current_period.total_items.toLocaleString()}</h4>
                                    </div>
                                    <div className="text-info fs-1">
                                        <i className="ri-list-check-3"></i>
                                    </div>
                                </div>
                                <div className={`mt-2 ${getGrowthColor(overview.growth.total_items)}`}>
                                    <i className={getGrowthIcon(overview.growth.total_items)}></i>
                                    <span className="ms-1">
                                        {Math.abs(overview.growth.total_items).toFixed(1)}%
                                    </span>
                                    <small className="text-muted ms-2">önceki döneme göre</small>
                                </div>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>

                <Row>
                    {/* Sales Trend Chart */}
                    <Col lg={8} className="mb-4">
                        <Card className="h-100">
                            <Card.Header>
                                <h5 className="mb-0">Satış Trendi</h5>
                            </Card.Header>
                            <Card.Body>
                                <Line data={salesTrendChartData} options={salesTrendChartOptions} />
                            </Card.Body>
                        </Card>
                    </Col>

                    {/* Order Status Distribution */}
                    <Col lg={4} className="mb-4">
                        <Card className="h-100">
                            <Card.Header>
                                <h5 className="mb-0">Sipariş Durumu Dağılımı</h5>
                            </Card.Header>
                            <Card.Body>
                                <Doughnut data={statusDistributionChartData} />
                                <div className="mt-3">
                                    {statusDistribution.map((status) => (
                                        <div key={status.status} className="d-flex justify-content-between mb-1">
                                            <small>{status.status_label}</small>
                                            <small>
                                                <Badge bg="secondary">{status.count}</Badge>
                                                <span className="ms-1">(%{status.percentage})</span>
                                            </small>
                                        </div>
                                    ))}
                                </div>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>

                <Row>
                    {/* Top Customers */}
                    <Col lg={6} className="mb-4">
                        <Card>
                            <Card.Header>
                                <h5 className="mb-0">En İyi Müşteriler</h5>
                            </Card.Header>
                            <Card.Body className="p-0">
                                <Table className="mb-0">
                                    <thead className="table-light">
                                        <tr>
                                            <th>Müşteri</th>
                                            <th className="text-center">Sipariş</th>
                                            <th className="text-end">Toplam</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {topCustomers.map((customer) => (
                                            <tr key={customer.id}>
                                                <td>
                                                    <div className="fw-medium">{customer.title}</div>
                                                    <small className="text-muted">{customer.account_code}</small>
                                                </td>
                                                <td className="text-center">
                                                    <Badge bg="primary">{customer.order_count}</Badge>
                                                </td>
                                                <td className="text-end">
                                                    <div className="fw-medium">{formatCurrency(customer.total_revenue)}</div>
                                                    <small className="text-muted">Ort: {formatCurrency(customer.avg_order_value)}</small>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </Table>
                            </Card.Body>
                        </Card>
                    </Col>

                    {/* Top Products */}
                    <Col lg={6} className="mb-4">
                        <Card>
                            <Card.Header>
                                <h5 className="mb-0">En Çok Satan Ürünler</h5>
                            </Card.Header>
                            <Card.Body className="p-0">
                                <Table className="mb-0">
                                    <thead className="table-light">
                                        <tr>
                                            <th>Ürün</th>
                                            <th className="text-center">Miktar</th>
                                            <th className="text-end">Toplam</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {topProducts.map((product) => (
                                            <tr key={product.id}>
                                                <td>
                                                    <div className="fw-medium">{product.name}</div>
                                                    <small className="text-muted">{product.code}</small>
                                                    {product.brand_name && (
                                                        <div>
                                                            <small className="text-muted">{product.brand_name}</small>
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="text-center">
                                                    <Badge bg="success">{product.total_quantity}</Badge>
                                                </td>
                                                <td className="text-end">
                                                    <div className="fw-medium">{formatCurrency(product.total_revenue)}</div>
                                                    <small className="text-muted">{product.order_count} sipariş</small>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </Table>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>
            </div>
        </Layout>
    );
}