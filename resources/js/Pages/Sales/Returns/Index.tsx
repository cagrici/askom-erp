import React, { useState } from 'react';
import { Head, Link, useForm, router } from '@inertiajs/react';
import { Card, Table, Button, Row, Col, Form, InputGroup, Badge } from 'react-bootstrap';
import Layout from '@/Layouts';

interface Customer {
    id: number;
    title: string;
    entity_code: string;
}

interface SalesOrder {
    id: number;
    order_number: string;
}

interface SalesReturnItem {
    id: number;
    product_name: string;
    quantity_returned: number;
}

interface SalesReturn {
    id: number;
    return_no: string;
    return_date: string;
    status: string;
    status_label: string;
    return_reason: string;
    reason_label: string;
    total_amount: number;
    customer: Customer;
    sales_order: SalesOrder;
    items: SalesReturnItem[];
    created_by?: {
        name: string;
    };
    approved_by?: {
        name: string;
    };
    driver?: {
        name: string;
    };
}

interface PaginatedReturns {
    data: SalesReturn[];
    current_page: number;
    per_page: number;
    total: number;
    last_page: number;
    links: Array<{
        url?: string;
        label: string;
        active: boolean;
    }>;
}

interface Props {
    returns: PaginatedReturns;
    filters: {
        search?: string;
        status?: string;
        customer_id?: number;
        date_from?: string;
        date_to?: string;
    };
    statuses: Record<string, string>;
    reasons: Record<string, string>;
}

export default function Index({ returns, filters, statuses, reasons }: Props) {
    const [showFilters, setShowFilters] = useState(false);

    const { data, setData, get, processing } = useForm({
        search: filters.search || '',
        status: filters.status || '',
        customer_id: filters.customer_id || '',
        date_from: filters.date_from || '',
        date_to: filters.date_to || '',
    });

    const handleFilter = () => {
        get(route('sales.returns.index'), {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const clearFilters = () => {
        setData({
            search: '',
            status: '',
            customer_id: '',
            date_from: '',
            date_to: '',
        });

        router.get(route('sales.returns.index'));
    };

    const getStatusColor = (status: string) => {
        const colors: Record<string, string> = {
            pending_approval: 'warning',
            approved: 'info',
            rejected: 'danger',
            processing: 'primary',
            completed: 'success',
            cancelled: 'secondary',
        };
        return colors[status] || 'secondary';
    };

    return (
        <Layout>
            <Head title="İadeler" />

            <div className="page-content">
                <div className="container-fluid">
                <Row className="mb-3">
                    <Col>
                        <div className="page-title-box d-sm-flex align-items-center justify-content-between">
                            <h4 className="mb-sm-0">İadeler</h4>
                            <div className="page-title-right">
                                <Link href={route('sales.returns.create')}>
                                    <Button variant="primary" size="sm">
                                        <i className="ri-add-line me-1"></i>
                                        Yeni İade Talebi
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    </Col>
                </Row>

                {/* Filters */}
                <Card className="mb-3">
                    <Card.Header className="d-flex justify-content-between align-items-center">
                        <h5 className="card-title mb-0">Filtrele</h5>
                        <Button
                            variant="link"
                            size="sm"
                            onClick={() => setShowFilters(!showFilters)}
                        >
                            {showFilters ? 'Gizle' : 'Göster'}
                        </Button>
                    </Card.Header>
                    {showFilters && (
                        <Card.Body>
                            <Row className="g-3">
                                <Col md={3}>
                                    <Form.Group>
                                        <Form.Label>Ara</Form.Label>
                                        <InputGroup>
                                            <InputGroup.Text>
                                                <i className="ri-search-line"></i>
                                            </InputGroup.Text>
                                            <Form.Control
                                                type="text"
                                                placeholder="İade No, Müşteri..."
                                                value={data.search}
                                                onChange={(e) => setData('search', e.target.value)}
                                                onKeyPress={(e) => e.key === 'Enter' && handleFilter()}
                                            />
                                        </InputGroup>
                                    </Form.Group>
                                </Col>

                                <Col md={2}>
                                    <Form.Group>
                                        <Form.Label>Durum</Form.Label>
                                        <Form.Select
                                            value={data.status}
                                            onChange={(e) => setData('status', e.target.value)}
                                        >
                                            <option value="">Tümü</option>
                                            {Object.entries(statuses).map(([key, label]) => (
                                                <option key={key} value={key}>
                                                    {label}
                                                </option>
                                            ))}
                                        </Form.Select>
                                    </Form.Group>
                                </Col>

                                <Col md={2}>
                                    <Form.Group>
                                        <Form.Label>Başlangıç Tarihi</Form.Label>
                                        <Form.Control
                                            type="date"
                                            value={data.date_from}
                                            onChange={(e) => setData('date_from', e.target.value)}
                                        />
                                    </Form.Group>
                                </Col>

                                <Col md={2}>
                                    <Form.Group>
                                        <Form.Label>Bitiş Tarihi</Form.Label>
                                        <Form.Control
                                            type="date"
                                            value={data.date_to}
                                            onChange={(e) => setData('date_to', e.target.value)}
                                        />
                                    </Form.Group>
                                </Col>

                                <Col md={3} className="d-flex align-items-end">
                                    <Button
                                        variant="primary"
                                        onClick={handleFilter}
                                        disabled={processing}
                                        className="me-2"
                                    >
                                        <i className="ri-filter-line me-1"></i>
                                        Filtrele
                                    </Button>
                                    <Button variant="outline-secondary" onClick={clearFilters}>
                                        <i className="ri-refresh-line me-1"></i>
                                        Temizle
                                    </Button>
                                </Col>
                            </Row>
                        </Card.Body>
                    )}
                </Card>

                {/* Returns List */}
                <Card>
                    <Card.Body>
                        <div className="table-responsive">
                            <Table hover className="mb-0">
                                <thead className="table-light">
                                    <tr>
                                        <th>İade No</th>
                                        <th>Sipariş No</th>
                                        <th>Müşteri</th>
                                        <th>Tarih</th>
                                        <th>Neden</th>
                                        <th>Tutar</th>
                                        <th>Durum</th>
                                        <th className="text-end">İşlemler</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {returns.data.length > 0 ? (
                                        returns.data.map((returnItem) => (
                                            <tr key={returnItem.id}>
                                                <td>
                                                    <Link
                                                        href={route('sales.returns.show', returnItem.id)}
                                                        className="text-dark fw-medium"
                                                    >
                                                        {returnItem.return_no}
                                                    </Link>
                                                </td>
                                                <td>
                                                    <Link
                                                        href={route('sales.orders.show', returnItem.sales_order.id)}
                                                        className="text-primary"
                                                    >
                                                        {returnItem.sales_order.order_number}
                                                    </Link>
                                                </td>
                                                <td>
                                                    <div className="d-flex flex-column">
                                                        <span className="fw-medium">
                                                            {returnItem.customer.title}
                                                        </span>
                                                        <small className="text-muted">
                                                            {returnItem.customer.entity_code}
                                                        </small>
                                                    </div>
                                                </td>
                                                <td>
                                                    {new Date(returnItem.return_date).toLocaleDateString('tr-TR')}
                                                </td>
                                                <td>
                                                    <span className="badge bg-secondary">
                                                        {returnItem.reason_label}
                                                    </span>
                                                </td>
                                                <td className="text-end">
                                                    ₺{Number(returnItem.total_amount).toLocaleString('tr-TR', {
                                                        minimumFractionDigits: 2,
                                                        maximumFractionDigits: 2,
                                                    })}
                                                </td>
                                                <td>
                                                    <Badge bg={getStatusColor(returnItem.status)}>
                                                        {returnItem.status_label}
                                                    </Badge>
                                                </td>
                                                <td className="text-end">
                                                    <Link
                                                        href={route('sales.returns.show', returnItem.id)}
                                                    >
                                                        <Button variant="outline-primary" size="sm">
                                                            <i className="ri-eye-line"></i>
                                                        </Button>
                                                    </Link>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={8} className="text-center py-4">
                                                <div className="text-muted">
                                                    <i className="ri-inbox-line fs-1 d-block mb-2"></i>
                                                    İade kaydı bulunamadı
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </Table>
                        </div>

                        {/* Pagination */}
                        {returns.last_page > 1 && (
                            <div className="d-flex justify-content-between align-items-center mt-3">
                                <div className="text-muted">
                                    Toplam {returns.total} kayıt bulundu
                                </div>
                                <nav>
                                    <ul className="pagination mb-0">
                                        {returns.links.map((link, index) => (
                                            <li
                                                key={index}
                                                className={`page-item ${link.active ? 'active' : ''} ${
                                                    !link.url ? 'disabled' : ''
                                                }`}
                                            >
                                                {link.url ? (
                                                    <Link
                                                        href={link.url}
                                                        className="page-link"
                                                        preserveState
                                                        preserveScroll
                                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                                    />
                                                ) : (
                                                    <span
                                                        className="page-link"
                                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                                    />
                                                )}
                                            </li>
                                        ))}
                                    </ul>
                                </nav>
                            </div>
                        )}
                    </Card.Body>
                </Card>
                </div>
            </div>
        </Layout>
    );
}
