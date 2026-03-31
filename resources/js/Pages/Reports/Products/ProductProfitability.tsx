import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import Layout from '@/Layouts';
import { Card, Col, Row, Form, Button, Table, Badge, ProgressBar } from 'react-bootstrap';
import { Bar, Pie } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js';
import { FaFilter } from 'react-icons/fa';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend);

interface Product {
    id: number;
    code: string;
    name: string;
    category_name: string;
    total_quantity: number;
    total_revenue: number;
    total_cost: number;
    profit: number;
    margin: number;
    avg_selling_price: number;
    cost_price: number;
}

interface MarginDistribution {
    range: string;
    count: number;
}

interface Props {
    filters: {
        start_date: string;
        end_date: string;
    };
    products: Product[];
    marginDistribution: MarginDistribution[];
    summary: {
        total_revenue: number;
        total_cost: number;
        total_profit: number;
        avg_margin: number;
    };
}

export default function ProductProfitability({
    filters,
    products,
    marginDistribution,
    summary,
}: Props) {
    const [localFilters, setLocalFilters] = useState(filters);

    const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setLocalFilters(prev => ({ ...prev, [name]: value }));
    };

    const applyFilters = () => {
        router.get('/reports/products/profitability', localFilters as any, {
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

    const marginChartData = {
        labels: marginDistribution.map(m => m.range),
        datasets: [
            {
                data: marginDistribution.map(m => m.count),
                backgroundColor: [
                    'rgba(255, 99, 132, 0.7)',
                    'rgba(255, 206, 86, 0.7)',
                    'rgba(54, 162, 235, 0.7)',
                    'rgba(75, 192, 192, 0.7)',
                    'rgba(153, 102, 255, 0.7)',
                ],
            },
        ],
    };

    const topProfitableProducts = products.slice(0, 10);
    const profitChartData = {
        labels: topProfitableProducts.map(p =>
            p.name.length > 15 ? p.name.substring(0, 15) + '...' : p.name
        ),
        datasets: [
            {
                label: 'Kar',
                data: topProfitableProducts.map(p => p.profit),
                backgroundColor: topProfitableProducts.map(p =>
                    p.profit >= 0 ? 'rgba(75, 192, 192, 0.7)' : 'rgba(255, 99, 132, 0.7)'
                ),
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
            <Head title="Ürün Karlılık Analizi" />

            <div className="page-content">
                <div className="page-header mb-4">
                    <h4 className="page-title">Ürün Karlılık Analizi</h4>
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
                                <h3 className="mb-0 text-primary">{formatCurrency(summary.total_revenue)}</h3>
                            </Card.Body>
                        </Card>
                    </Col>
                    <Col md={3}>
                        <Card className="text-center h-100">
                            <Card.Body>
                                <div className="text-muted mb-2">Toplam Maliyet</div>
                                <h3 className="mb-0 text-danger">{formatCurrency(summary.total_cost)}</h3>
                            </Card.Body>
                        </Card>
                    </Col>
                    <Col md={3}>
                        <Card className="text-center h-100">
                            <Card.Body>
                                <div className="text-muted mb-2">Toplam Kar</div>
                                <h3 className={`mb-0 ${summary.total_profit >= 0 ? 'text-success' : 'text-danger'}`}>
                                    {formatCurrency(summary.total_profit)}
                                </h3>
                            </Card.Body>
                        </Card>
                    </Col>
                    <Col md={3}>
                        <Card className="text-center h-100">
                            <Card.Body>
                                <div className="text-muted mb-2">Ortalama Marj</div>
                                <h3 className="mb-0 text-info">%{summary.avg_margin}</h3>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>

                {/* Charts */}
                <Row className="mb-4">
                    <Col md={5}>
                        <Card className="h-100">
                            <Card.Header>
                                <h5 className="mb-0">Marj Dağılımı</h5>
                            </Card.Header>
                            <Card.Body>
                                <Pie
                                    data={marginChartData}
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
                                <h5 className="mb-0">En Karlı 10 Ürün</h5>
                            </Card.Header>
                            <Card.Body>
                                <Bar
                                    data={profitChartData}
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
                    </Col>
                </Row>

                {/* Products Table */}
                <Card>
                    <Card.Header>
                        <h5 className="mb-0">Ürün Karlılık Detayları</h5>
                    </Card.Header>
                    <Card.Body>
                        <div className="table-responsive">
                            <Table striped hover>
                                <thead>
                                    <tr>
                                        <th>Ürün</th>
                                        <th>Kategori</th>
                                        <th className="text-end">Miktar</th>
                                        <th className="text-end">Gelir</th>
                                        <th className="text-end">Maliyet</th>
                                        <th className="text-end">Kar</th>
                                        <th>Marj</th>
                                        <th>Seviye</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {products.slice(0, 50).map((product) => (
                                        <tr key={product.id}>
                                            <td>
                                                <div>{product.name}</div>
                                                <small className="text-muted">{product.code}</small>
                                            </td>
                                            <td>{product.category_name || '-'}</td>
                                            <td className="text-end">{formatNumber(product.total_quantity)}</td>
                                            <td className="text-end">{formatCurrency(product.total_revenue)}</td>
                                            <td className="text-end">{formatCurrency(product.total_cost)}</td>
                                            <td className={`text-end ${product.profit >= 0 ? 'text-success' : 'text-danger'}`}>
                                                {formatCurrency(product.profit)}
                                            </td>
                                            <td style={{ width: '120px' }}>
                                                <div className="d-flex align-items-center">
                                                    <ProgressBar
                                                        now={Math.max(0, Math.min(product.margin, 100))}
                                                        variant={
                                                            product.margin >= 20
                                                                ? 'success'
                                                                : product.margin >= 10
                                                                ? 'info'
                                                                : product.margin >= 0
                                                                ? 'warning'
                                                                : 'danger'
                                                        }
                                                        className="flex-grow-1 me-2"
                                                    />
                                                    <small>%{product.margin}</small>
                                                </div>
                                            </td>
                                            <td>{getMarginBadge(product.margin)}</td>
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
