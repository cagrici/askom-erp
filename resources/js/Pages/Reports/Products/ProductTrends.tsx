import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import Layout from '@/Layouts';
import { Card, Col, Row, Form, Button, Table, Badge } from 'react-bootstrap';
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
import { FaFilter, FaArrowUp, FaArrowDown, FaStar } from 'react-icons/fa';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

interface CategoryTrendData {
    month: string;
    category_name: string;
    total_sales: number;
}

interface GrowingProduct {
    name: string;
    first_half_sales: number;
    second_half_sales: number;
    growth: number;
}

interface NewProduct {
    id: number;
    code: string;
    name: string;
    created_at: string;
    total_sales: number;
    total_quantity: number;
}

interface Props {
    filters: {
        start_date: string;
        end_date: string;
    };
    categoryTrends: { [key: string]: CategoryTrendData[] };
    growingProducts: GrowingProduct[];
    decliningProducts: GrowingProduct[];
    newProducts: NewProduct[];
}

export default function ProductTrends({
    filters,
    categoryTrends,
    growingProducts,
    decliningProducts,
    newProducts,
}: Props) {
    const [localFilters, setLocalFilters] = useState(filters);

    const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setLocalFilters(prev => ({ ...prev, [name]: value }));
    };

    const applyFilters = () => {
        router.get('/reports/products/trends', localFilters as any, {
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

    // Build category trend chart
    const categories = Object.keys(categoryTrends);
    const allMonths = [...new Set(
        Object.values(categoryTrends).flat().map(d => d.month)
    )].sort();

    const colors = [
        'rgb(255, 99, 132)',
        'rgb(54, 162, 235)',
        'rgb(255, 206, 86)',
        'rgb(75, 192, 192)',
        'rgb(153, 102, 255)',
    ];

    const trendChartData = {
        labels: allMonths.map(m => {
            const date = new Date(m + '-01');
            return date.toLocaleDateString('tr-TR', { month: 'short' });
        }),
        datasets: categories.slice(0, 5).map((category, index) => ({
            label: category,
            data: allMonths.map(month => {
                const found = categoryTrends[category]?.find(d => d.month === month);
                return found ? found.total_sales : 0;
            }),
            borderColor: colors[index % colors.length],
            backgroundColor: colors[index % colors.length].replace('rgb', 'rgba').replace(')', ', 0.5)'),
            tension: 0.3,
        })),
    };

    return (
        <Layout>
            <Head title="Ürün Trend Analizi" />

            <div className="page-content">
                <div className="page-header mb-4">
                    <h4 className="page-title">Ürün Trend Analizi</h4>
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

                {/* Category Trends Chart */}
                <Card className="mb-4">
                    <Card.Header>
                        <h5 className="mb-0">Kategori Satış Trendleri</h5>
                    </Card.Header>
                    <Card.Body>
                        <Line
                            data={trendChartData}
                            options={{
                                responsive: true,
                                plugins: {
                                    legend: {
                                        position: 'bottom' as const,
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

                {/* Growing and Declining Products */}
                <Row className="mb-4">
                    <Col md={6}>
                        <Card className="h-100">
                            <Card.Header className="bg-success text-white">
                                <h5 className="mb-0">
                                    <FaArrowUp className="me-2" />
                                    Büyüyen Ürünler
                                </h5>
                            </Card.Header>
                            <Card.Body>
                                <Table striped hover size="sm">
                                    <thead>
                                        <tr>
                                            <th>Ürün</th>
                                            <th className="text-end">1. Yarı</th>
                                            <th className="text-end">2. Yarı</th>
                                            <th className="text-end">Büyüme</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {growingProducts.map((product, idx) => (
                                            <tr key={idx}>
                                                <td>
                                                    {product.name.length > 25
                                                        ? product.name.substring(0, 25) + '...'
                                                        : product.name}
                                                </td>
                                                <td className="text-end">{formatCurrency(product.first_half_sales)}</td>
                                                <td className="text-end">{formatCurrency(product.second_half_sales)}</td>
                                                <td className="text-end">
                                                    <Badge bg="success">+%{product.growth}</Badge>
                                                </td>
                                            </tr>
                                        ))}
                                        {growingProducts.length === 0 && (
                                            <tr>
                                                <td colSpan={4} className="text-center text-muted">
                                                    Veri bulunmuyor
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </Table>
                            </Card.Body>
                        </Card>
                    </Col>
                    <Col md={6}>
                        <Card className="h-100">
                            <Card.Header className="bg-danger text-white">
                                <h5 className="mb-0">
                                    <FaArrowDown className="me-2" />
                                    Düşen Ürünler
                                </h5>
                            </Card.Header>
                            <Card.Body>
                                <Table striped hover size="sm">
                                    <thead>
                                        <tr>
                                            <th>Ürün</th>
                                            <th className="text-end">1. Yarı</th>
                                            <th className="text-end">2. Yarı</th>
                                            <th className="text-end">Düşüş</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {decliningProducts.map((product, idx) => (
                                            <tr key={idx}>
                                                <td>
                                                    {product.name.length > 25
                                                        ? product.name.substring(0, 25) + '...'
                                                        : product.name}
                                                </td>
                                                <td className="text-end">{formatCurrency(product.first_half_sales)}</td>
                                                <td className="text-end">{formatCurrency(product.second_half_sales)}</td>
                                                <td className="text-end">
                                                    <Badge bg="danger">{product.decline}%</Badge>
                                                </td>
                                            </tr>
                                        ))}
                                        {decliningProducts.length === 0 && (
                                            <tr>
                                                <td colSpan={4} className="text-center text-muted">
                                                    Veri bulunmuyor
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </Table>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>

                {/* New Products Performance */}
                <Card>
                    <Card.Header>
                        <h5 className="mb-0">
                            <FaStar className="text-warning me-2" />
                            Yeni Ürün Performansı
                        </h5>
                    </Card.Header>
                    <Card.Body>
                        <div className="table-responsive">
                            <Table striped hover>
                                <thead>
                                    <tr>
                                        <th>Ürün Kodu</th>
                                        <th>Ürün Adı</th>
                                        <th>Eklenme Tarihi</th>
                                        <th className="text-end">Satış Miktarı</th>
                                        <th className="text-end">Satış Tutarı</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {newProducts.map((product) => (
                                        <tr key={product.id}>
                                            <td>{product.code}</td>
                                            <td>{product.name}</td>
                                            <td>{new Date(product.created_at).toLocaleDateString('tr-TR')}</td>
                                            <td className="text-end">{formatNumber(product.total_quantity)}</td>
                                            <td className="text-end">{formatCurrency(product.total_sales)}</td>
                                        </tr>
                                    ))}
                                    {newProducts.length === 0 && (
                                        <tr>
                                            <td colSpan={5} className="text-center text-muted">
                                                Yeni ürün bulunmuyor
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
