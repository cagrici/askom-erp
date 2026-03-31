import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import Layout from '@/Layouts';
import { Card, Col, Row, Form, Button, Table, Badge } from 'react-bootstrap';
import { Bar } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js';
import { FaFilter, FaTrophy, FaArrowDown } from 'react-icons/fa';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface Product {
    id: number;
    code: string;
    name: string;
    category_name: string;
    brand_name: string;
    total_quantity: number;
    total_revenue: number;
    order_count: number;
    customer_count: number;
    avg_price: number;
}

interface TopPerformer {
    name: string;
    total_sales: number;
}

interface Category {
    id: number;
    name: string;
}

interface Brand {
    id: number;
    name: string;
}

interface Props {
    filters: {
        start_date: string;
        end_date: string;
        category_id: number | null;
        brand_id: number | null;
    };
    products: {
        data: Product[];
        total: number;
    };
    topPerformers: TopPerformer[];
    worstPerformers: TopPerformer[];
    categories: Category[];
    brands: Brand[];
}

export default function ProductPerformance({
    filters,
    products,
    topPerformers,
    worstPerformers,
    categories,
    brands,
}: Props) {
    const [localFilters, setLocalFilters] = useState(filters);

    const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setLocalFilters(prev => ({ ...prev, [name]: value }));
    };

    const applyFilters = () => {
        router.get('/reports/products/performance', localFilters as any, {
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

    const topChartData = {
        labels: topPerformers.map(p =>
            p.name.length > 20 ? p.name.substring(0, 20) + '...' : p.name
        ),
        datasets: [
            {
                label: 'Satış Tutarı',
                data: topPerformers.map(p => p.total_sales),
                backgroundColor: 'rgba(75, 192, 192, 0.7)',
            },
        ],
    };

    const worstChartData = {
        labels: worstPerformers.map(p =>
            p.name.length > 20 ? p.name.substring(0, 20) + '...' : p.name
        ),
        datasets: [
            {
                label: 'Satış Tutarı',
                data: worstPerformers.map(p => p.total_sales),
                backgroundColor: 'rgba(255, 99, 132, 0.7)',
            },
        ],
    };

    return (
        <Layout>
            <Head title="Ürün Performans Raporu" />

            <div className="page-content">
                <div className="page-header mb-4">
                    <h4 className="page-title">Ürün Performans Raporu</h4>
                </div>

                {/* Filters */}
                <Card className="mb-4">
                    <Card.Body>
                        <Row className="align-items-end">
                            <Col md={2}>
                                <Form.Group>
                                    <Form.Label>Başlangıç</Form.Label>
                                    <Form.Control
                                        type="date"
                                        name="start_date"
                                        value={localFilters.start_date}
                                        onChange={handleFilterChange}
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={2}>
                                <Form.Group>
                                    <Form.Label>Bitiş</Form.Label>
                                    <Form.Control
                                        type="date"
                                        name="end_date"
                                        value={localFilters.end_date}
                                        onChange={handleFilterChange}
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={3}>
                                <Form.Group>
                                    <Form.Label>Kategori</Form.Label>
                                    <Form.Select
                                        name="category_id"
                                        value={localFilters.category_id || ''}
                                        onChange={handleFilterChange}
                                    >
                                        <option value="">Tümü</option>
                                        {categories.map(c => (
                                            <option key={c.id} value={c.id}>{c.name}</option>
                                        ))}
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                            <Col md={3}>
                                <Form.Group>
                                    <Form.Label>Marka</Form.Label>
                                    <Form.Select
                                        name="brand_id"
                                        value={localFilters.brand_id || ''}
                                        onChange={handleFilterChange}
                                    >
                                        <option value="">Tümü</option>
                                        {brands.map(b => (
                                            <option key={b.id} value={b.id}>{b.name}</option>
                                        ))}
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                            <Col md={2}>
                                <Button variant="primary" onClick={applyFilters}>
                                    <FaFilter className="me-2" />
                                    Filtrele
                                </Button>
                            </Col>
                        </Row>
                    </Card.Body>
                </Card>

                {/* Charts */}
                <Row className="mb-4">
                    <Col md={6}>
                        <Card className="h-100">
                            <Card.Header className="bg-success text-white">
                                <h5 className="mb-0">
                                    <FaTrophy className="me-2" />
                                    En İyi Performans
                                </h5>
                            </Card.Header>
                            <Card.Body>
                                <Bar
                                    data={topChartData}
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
                    <Col md={6}>
                        <Card className="h-100">
                            <Card.Header className="bg-danger text-white">
                                <h5 className="mb-0">
                                    <FaArrowDown className="me-2" />
                                    En Düşük Performans
                                </h5>
                            </Card.Header>
                            <Card.Body>
                                <Bar
                                    data={worstChartData}
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
                        <h5 className="mb-0">Tüm Ürünler ({products.total})</h5>
                    </Card.Header>
                    <Card.Body>
                        <div className="table-responsive">
                            <Table striped hover>
                                <thead>
                                    <tr>
                                        <th>Ürün Kodu</th>
                                        <th>Ürün Adı</th>
                                        <th>Kategori</th>
                                        <th>Marka</th>
                                        <th className="text-end">Miktar</th>
                                        <th className="text-end">Gelir</th>
                                        <th className="text-end">Sipariş</th>
                                        <th className="text-end">Müşteri</th>
                                        <th className="text-end">Ort. Fiyat</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {products.data.map((product) => (
                                        <tr key={product.id}>
                                            <td>{product.code}</td>
                                            <td>{product.name}</td>
                                            <td>{product.category_name || '-'}</td>
                                            <td>{product.brand_name || '-'}</td>
                                            <td className="text-end">{formatNumber(product.total_quantity)}</td>
                                            <td className="text-end">{formatCurrency(product.total_revenue)}</td>
                                            <td className="text-end">{formatNumber(product.order_count)}</td>
                                            <td className="text-end">{formatNumber(product.customer_count)}</td>
                                            <td className="text-end">{formatCurrency(product.avg_price)}</td>
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
