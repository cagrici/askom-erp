import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import Layout from '@/Layouts';
import { Card, Col, Row, Form, Button, Table, Badge, Alert } from 'react-bootstrap';
import { FaFilter, FaExclamationTriangle, FaBoxOpen } from 'react-icons/fa';

interface NoSalesProduct {
    id: number;
    code: string;
    name: string;
    category_name: string;
    brand_name: string;
    cost_price: number;
    sale_price: number;
}

interface LowTurnoverProduct {
    id: number;
    code: string;
    name: string;
    category_name: string;
    total_quantity: number;
    total_sales: number;
    order_count: number;
}

interface Props {
    filters: {
        days: number;
    };
    noSalesProducts: NoSalesProduct[];
    lowTurnoverProducts: LowTurnoverProduct[];
    summary: {
        no_sales_count: number;
        low_turnover_count: number;
        slow_moving_value: number;
    };
}

export default function SlowMoving({ filters, noSalesProducts, lowTurnoverProducts, summary }: Props) {
    const [localFilters, setLocalFilters] = useState(filters);

    const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const { name, value } = e.target;
        setLocalFilters(prev => ({ ...prev, [name]: parseInt(value) }));
    };

    const applyFilters = () => {
        router.get('/reports/products/slow-moving', localFilters as any, {
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

    return (
        <Layout>
            <Head title="Yavaş Hareket Eden Ürünler" />

            <div className="page-content">
                <div className="page-header mb-4">
                    <h4 className="page-title">
                        <FaExclamationTriangle className="text-warning me-2" />
                        Yavaş Hareket Eden Ürünler
                    </h4>
                </div>

                {/* Filters */}
                <Card className="mb-4">
                    <Card.Body>
                        <Row className="align-items-end">
                            <Col md={4}>
                                <Form.Group>
                                    <Form.Label>İnceleme Süresi</Form.Label>
                                    <Form.Select
                                        name="days"
                                        value={localFilters.days}
                                        onChange={handleFilterChange}
                                    >
                                        <option value="30">Son 30 Gün</option>
                                        <option value="60">Son 60 Gün</option>
                                        <option value="90">Son 90 Gün</option>
                                        <option value="180">Son 180 Gün</option>
                                        <option value="365">Son 1 Yıl</option>
                                    </Form.Select>
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
                    <Col md={4}>
                        <Card className="text-center h-100 border-danger">
                            <Card.Body>
                                <FaBoxOpen className="text-danger mb-2" size={32} />
                                <div className="text-muted mb-2">Satışsız Ürün</div>
                                <h3 className="mb-0 text-danger">{formatNumber(summary.no_sales_count)}</h3>
                            </Card.Body>
                        </Card>
                    </Col>
                    <Col md={4}>
                        <Card className="text-center h-100 border-warning">
                            <Card.Body>
                                <FaExclamationTriangle className="text-warning mb-2" size={32} />
                                <div className="text-muted mb-2">Düşük Devir Ürün</div>
                                <h3 className="mb-0 text-warning">{formatNumber(summary.low_turnover_count)}</h3>
                            </Card.Body>
                        </Card>
                    </Col>
                    <Col md={4}>
                        <Card className="text-center h-100 border-info">
                            <Card.Body>
                                <div className="text-muted mb-2">Bağlı Stok Değeri</div>
                                <h3 className="mb-0 text-info">{formatCurrency(summary.slow_moving_value)}</h3>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>

                {/* Alert */}
                {summary.no_sales_count > 0 && (
                    <Alert variant="warning" className="mb-4">
                        <Alert.Heading>
                            <FaExclamationTriangle className="me-2" />
                            Dikkat!
                        </Alert.Heading>
                        <p className="mb-0">
                            Son {filters.days} gün içinde hiç satışı olmayan {summary.no_sales_count} ürün bulunmaktadır.
                            Bu ürünler için promosyon veya indirim kampanyaları düzenlenebilir veya stok optimizasyonu yapılabilir.
                        </p>
                    </Alert>
                )}

                {/* No Sales Products */}
                <Card className="mb-4">
                    <Card.Header className="bg-danger text-white">
                        <h5 className="mb-0">
                            Son {filters.days} Günde Satışı Olmayan Ürünler
                        </h5>
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
                                        <th className="text-end">Maliyet</th>
                                        <th className="text-end">Satış Fiyatı</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {noSalesProducts.slice(0, 50).map((product) => (
                                        <tr key={product.id}>
                                            <td>{product.code}</td>
                                            <td>{product.name}</td>
                                            <td>{product.category_name || '-'}</td>
                                            <td>{product.brand_name || '-'}</td>
                                            <td className="text-end">{formatCurrency(product.cost_price || 0)}</td>
                                            <td className="text-end">{formatCurrency(product.sale_price || 0)}</td>
                                        </tr>
                                    ))}
                                    {noSalesProducts.length === 0 && (
                                        <tr>
                                            <td colSpan={6} className="text-center text-success">
                                                Tüm ürünler bu dönemde satış yapmış!
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </Table>
                        </div>
                    </Card.Body>
                </Card>

                {/* Low Turnover Products */}
                <Card>
                    <Card.Header className="bg-warning">
                        <h5 className="mb-0">
                            Düşük Devir Hızlı Ürünler (≤3 sipariş)
                        </h5>
                    </Card.Header>
                    <Card.Body>
                        <div className="table-responsive">
                            <Table striped hover>
                                <thead>
                                    <tr>
                                        <th>Ürün Kodu</th>
                                        <th>Ürün Adı</th>
                                        <th>Kategori</th>
                                        <th className="text-end">Satış Miktarı</th>
                                        <th className="text-end">Satış Tutarı</th>
                                        <th className="text-end">Sipariş Sayısı</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {lowTurnoverProducts.map((product) => (
                                        <tr key={product.id}>
                                            <td>{product.code}</td>
                                            <td>{product.name}</td>
                                            <td>{product.category_name || '-'}</td>
                                            <td className="text-end">{formatNumber(product.total_quantity)}</td>
                                            <td className="text-end">{formatCurrency(product.total_sales)}</td>
                                            <td className="text-end">
                                                <Badge bg="warning">{product.order_count}</Badge>
                                            </td>
                                        </tr>
                                    ))}
                                    {lowTurnoverProducts.length === 0 && (
                                        <tr>
                                            <td colSpan={6} className="text-center text-muted">
                                                Düşük devir hızlı ürün bulunmuyor
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
