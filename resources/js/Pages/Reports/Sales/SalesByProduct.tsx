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
import { FaFilter, FaDownload } from 'react-icons/fa';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface Product {
    id: number;
    code: string;
    name: string;
    category_name: string;
    brand_name: string;
    total_quantity: number;
    total_amount: number;
    order_count: number;
    avg_price: number;
}

interface CategoryBreakdown {
    category_name: string;
    total_amount: number;
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
        current_page: number;
        last_page: number;
        total: number;
    };
    categoryBreakdown: CategoryBreakdown[];
}

export default function SalesByProduct({ filters, products, categoryBreakdown }: Props) {
    const [localFilters, setLocalFilters] = useState(filters);

    const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setLocalFilters(prev => ({ ...prev, [name]: value }));
    };

    const applyFilters = () => {
        router.get('/reports/sales/by-product', localFilters as any, {
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

    const chartData = {
        labels: categoryBreakdown.map(c => c.category_name),
        datasets: [
            {
                label: 'Satış Tutarı',
                data: categoryBreakdown.map(c => c.total_amount),
                backgroundColor: 'rgba(54, 162, 235, 0.7)',
                borderColor: 'rgba(54, 162, 235, 1)',
                borderWidth: 1,
            },
        ],
    };

    return (
        <Layout>
            <Head title="Ürün Bazlı Satış Raporu" />

            <div className="page-content">
                <div className="page-header mb-4">
                    <h4 className="page-title">Ürün Bazlı Satış Raporu</h4>
                </div>

                {/* Filters */}
                <Card className="mb-4">
                    <Card.Body>
                        <Row className="align-items-end">
                            <Col md={3}>
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
                            <Col md={3}>
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
                            <Col md={3}>
                                <Button variant="primary" onClick={applyFilters}>
                                    <FaFilter className="me-2" />
                                    Filtrele
                                </Button>
                            </Col>
                        </Row>
                    </Card.Body>
                </Card>

                {/* Category Chart */}
                <Card className="mb-4">
                    <Card.Header>
                        <h5 className="mb-0">Kategori Bazlı Satışlar</h5>
                    </Card.Header>
                    <Card.Body>
                        <Bar
                            data={chartData}
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

                {/* Products Table */}
                <Card>
                    <Card.Header className="d-flex justify-content-between align-items-center">
                        <h5 className="mb-0">Ürün Detayları ({products.total} ürün)</h5>
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
                                        <th className="text-end">Tutar</th>
                                        <th className="text-end">Sipariş</th>
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
                                            <td className="text-end">{formatCurrency(product.total_amount)}</td>
                                            <td className="text-end">{formatNumber(product.order_count)}</td>
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
