import React, { useState } from 'react';
import { Head, Link, useForm, router } from '@inertiajs/react';
import { Card, Table, Button, Row, Col, Form, InputGroup, Badge, Dropdown, Modal } from 'react-bootstrap';
import Layout from '@/Layouts';

interface Customer {
    id: number;
    name: string;
    title?: string;
}

interface SalesOrder {
    id: number;
    order_number: string;
    customer?: Customer;
}

interface Vehicle {
    id: number;
    plate_number: string;
    make?: string;
    model?: string;
}

interface Driver {
    id: number;
    name: string;
}

interface User {
    id: number;
    name: string;
}

interface ShippingOrderItem {
    id: number;
    product_id: number;
    product?: {
        id: number;
        name: string;
        code: string;
    };
    shipping_quantity: number;
    picked_quantity: number;
    status: string;
}

interface ShippingOrder {
    id: number;
    shipping_number: string;
    sales_order_id: number;
    sales_order?: SalesOrder;
    created_by?: User;
    vehicle?: Vehicle;
    driver?: Driver;
    status: string;
    status_label: string;
    priority: string;
    priority_label: string;
    requested_ship_date?: string;
    shipped_at?: string;
    total_items: number;
    total_quantity: number;
    created_at: string;
    items?: ShippingOrderItem[];
}

interface PaginatedShippingOrders {
    data: ShippingOrder[];
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

interface Stats {
    pending: number;
    picking: number;
    ready_to_ship: number;
    shipped_today: number;
}

interface Props {
    shippingOrders: PaginatedShippingOrders;
    stats: Stats;
    filters: {
        search?: string;
        status?: string;
        priority?: string;
        date_from?: string;
        date_to?: string;
        sort?: string;
        direction?: string;
    };
    statuses: Record<string, string>;
    priorities: Record<string, string>;
}

const getStatusBadgeVariant = (status: string): string => {
    const variants: Record<string, string> = {
        pending: 'warning',
        picking_assigned: 'info',
        picking: 'primary',
        ready_to_ship: 'success',
        shipped: 'secondary',
        delivered: 'dark',
        cancelled: 'danger',
    };
    return variants[status] || 'secondary';
};

const getPriorityBadgeVariant = (priority: string): string => {
    const variants: Record<string, string> = {
        urgent: 'danger',
        high: 'warning',
        normal: 'primary',
        low: 'secondary',
    };
    return variants[priority] || 'secondary';
};

export default function Index({
    shippingOrders,
    stats,
    filters,
    statuses,
    priorities,
}: Props) {
    const [showFilters, setShowFilters] = useState(false);
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [orderToCancel, setOrderToCancel] = useState<ShippingOrder | null>(null);
    const [cancelReason, setCancelReason] = useState('');

    const { data, setData, get, processing } = useForm({
        search: filters.search || '',
        status: filters.status || '',
        priority: filters.priority || '',
        date_from: filters.date_from || '',
        date_to: filters.date_to || '',
        sort: filters.sort || 'created_at',
        direction: filters.direction || 'desc',
    });

    const handleFilter = () => {
        get(route('warehouse.shipping-orders.index'), {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleSort = (field: string) => {
        const newDirection = data.sort === field && data.direction === 'asc' ? 'desc' : 'asc';
        setData('sort', field);
        setData('direction', newDirection);

        get(route('warehouse.shipping-orders.index'), {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const clearFilters = () => {
        setData({
            search: '',
            status: '',
            priority: '',
            date_from: '',
            date_to: '',
            sort: 'created_at',
            direction: 'desc',
        });

        router.get(route('warehouse.shipping-orders.index'));
    };

    const handleCancel = (order: ShippingOrder) => {
        setOrderToCancel(order);
        setCancelReason('');
        setShowCancelModal(true);
    };

    const confirmCancel = () => {
        if (orderToCancel && cancelReason) {
            router.post(route('warehouse.shipping-orders.cancel', orderToCancel.id), {
                cancellation_reason: cancelReason,
            }, {
                onSuccess: () => {
                    setShowCancelModal(false);
                    setOrderToCancel(null);
                    setCancelReason('');
                }
            });
        }
    };

    const formatDate = (dateString?: string) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString('tr-TR');
    };

    const formatDateTime = (dateString?: string) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleString('tr-TR');
    };

    return (
        <Layout>
            <Head title="Sevk Emirleri" />
            <div className="page-content">
            <div className="container-fluid py-4">
                {/* Header */}
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <div>
                        <h4 className="mb-1">Sevk Emirleri</h4>
                        <p className="text-muted mb-0">Depo sevkiyat yonetimi</p>
                    </div>
                    <Link
                        href={route('warehouse.shipping-orders.create')}
                        className="btn btn-primary"
                    >
                        <i className="ri-add-line me-1"></i>
                        Yeni Sevk Emri
                    </Link>
                </div>

                {/* Stats Cards */}
                <Row className="mb-4">
                    <Col md={3}>
                        <Card className="border-0 shadow-sm">
                            <Card.Body className="text-center">
                                <div className="text-warning fs-1 mb-2">
                                    <i className="ri-time-line"></i>
                                </div>
                                <h3 className="mb-1">{stats.pending}</h3>
                                <p className="text-muted mb-0">Bekleyen</p>
                            </Card.Body>
                        </Card>
                    </Col>
                    <Col md={3}>
                        <Card className="border-0 shadow-sm">
                            <Card.Body className="text-center">
                                <div className="text-primary fs-1 mb-2">
                                    <i className="ri-inbox-unarchive-line"></i>
                                </div>
                                <h3 className="mb-1">{stats.picking}</h3>
                                <p className="text-muted mb-0">Toplaniyor</p>
                            </Card.Body>
                        </Card>
                    </Col>
                    <Col md={3}>
                        <Card className="border-0 shadow-sm">
                            <Card.Body className="text-center">
                                <div className="text-success fs-1 mb-2">
                                    <i className="ri-checkbox-circle-line"></i>
                                </div>
                                <h3 className="mb-1">{stats.ready_to_ship}</h3>
                                <p className="text-muted mb-0">Sevke Hazir</p>
                            </Card.Body>
                        </Card>
                    </Col>
                    <Col md={3}>
                        <Card className="border-0 shadow-sm">
                            <Card.Body className="text-center">
                                <div className="text-info fs-1 mb-2">
                                    <i className="ri-truck-line"></i>
                                </div>
                                <h3 className="mb-1">{stats.shipped_today}</h3>
                                <p className="text-muted mb-0">Bugun Sevk</p>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>

                {/* Filters */}
                <Card className="border-0 shadow-sm mb-4">
                    <Card.Body>
                        <Row className="align-items-end">
                            <Col md={4}>
                                <InputGroup>
                                    <InputGroup.Text>
                                        <i className="ri-search-line"></i>
                                    </InputGroup.Text>
                                    <Form.Control
                                        placeholder="Sevk no, siparis no veya musteri ara..."
                                        value={data.search}
                                        onChange={(e) => setData('search', e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && handleFilter()}
                                    />
                                </InputGroup>
                            </Col>
                            <Col md={2}>
                                <Form.Select
                                    value={data.status}
                                    onChange={(e) => {
                                        setData('status', e.target.value);
                                        setTimeout(handleFilter, 100);
                                    }}
                                >
                                    <option value="">Tum Durumlar</option>
                                    {Object.entries(statuses).map(([value, label]) => (
                                        <option key={value} value={value}>{label}</option>
                                    ))}
                                </Form.Select>
                            </Col>
                            <Col md={2}>
                                <Form.Select
                                    value={data.priority}
                                    onChange={(e) => {
                                        setData('priority', e.target.value);
                                        setTimeout(handleFilter, 100);
                                    }}
                                >
                                    <option value="">Tum Oncelikler</option>
                                    {Object.entries(priorities).map(([value, label]) => (
                                        <option key={value} value={value}>{label}</option>
                                    ))}
                                </Form.Select>
                            </Col>
                            <Col md={2}>
                                <Button
                                    variant="outline-secondary"
                                    onClick={() => setShowFilters(!showFilters)}
                                    className="w-100"
                                >
                                    <i className="ri-filter-3-line me-1"></i>
                                    Filtreler
                                </Button>
                            </Col>
                            <Col md={2}>
                                <Button
                                    variant="primary"
                                    onClick={handleFilter}
                                    disabled={processing}
                                    className="w-100"
                                >
                                    <i className="ri-search-line me-1"></i>
                                    Ara
                                </Button>
                            </Col>
                        </Row>

                        {showFilters && (
                            <Row className="mt-3 pt-3 border-top">
                                <Col md={3}>
                                    <Form.Label>Baslangic Tarihi</Form.Label>
                                    <Form.Control
                                        type="date"
                                        value={data.date_from}
                                        onChange={(e) => setData('date_from', e.target.value)}
                                    />
                                </Col>
                                <Col md={3}>
                                    <Form.Label>Bitis Tarihi</Form.Label>
                                    <Form.Control
                                        type="date"
                                        value={data.date_to}
                                        onChange={(e) => setData('date_to', e.target.value)}
                                    />
                                </Col>
                                <Col md={3} className="d-flex align-items-end">
                                    <Button
                                        variant="outline-secondary"
                                        onClick={clearFilters}
                                        className="w-100"
                                    >
                                        <i className="ri-refresh-line me-1"></i>
                                        Temizle
                                    </Button>
                                </Col>
                            </Row>
                        )}
                    </Card.Body>
                </Card>

                {/* Shipping Orders Table */}
                <Card className="border-0 shadow-sm">
                    <Card.Body className="p-0">
                        <Table responsive hover className="mb-0">
                            <thead className="bg-light">
                                <tr>
                                    <th
                                        style={{ cursor: 'pointer' }}
                                        onClick={() => handleSort('shipping_number')}
                                    >
                                        Sevk No
                                        {data.sort === 'shipping_number' && (
                                            <i className={`ri-arrow-${data.direction === 'asc' ? 'up' : 'down'}-s-line ms-1`}></i>
                                        )}
                                    </th>
                                    <th>Siparis</th>
                                    <th>Musteri</th>
                                    <th
                                        style={{ cursor: 'pointer' }}
                                        onClick={() => handleSort('priority')}
                                    >
                                        Oncelik
                                        {data.sort === 'priority' && (
                                            <i className={`ri-arrow-${data.direction === 'asc' ? 'up' : 'down'}-s-line ms-1`}></i>
                                        )}
                                    </th>
                                    <th>Durum</th>
                                    <th className="text-center">Kalem</th>
                                    <th>Arac / Sofor</th>
                                    <th
                                        style={{ cursor: 'pointer' }}
                                        onClick={() => handleSort('created_at')}
                                    >
                                        Olusturma
                                        {data.sort === 'created_at' && (
                                            <i className={`ri-arrow-${data.direction === 'asc' ? 'up' : 'down'}-s-line ms-1`}></i>
                                        )}
                                    </th>
                                    <th className="text-end">Islemler</th>
                                </tr>
                            </thead>
                            <tbody>
                                {shippingOrders.data.length === 0 ? (
                                    <tr>
                                        <td colSpan={9} className="text-center py-5">
                                            <div className="text-muted">
                                                <i className="ri-inbox-line fs-1 d-block mb-2"></i>
                                                Sevk emri bulunamadi
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    shippingOrders.data.map((order) => (
                                        <tr key={order.id}>
                                            <td>
                                                <Link
                                                    href={route('warehouse.shipping-orders.show', order.id)}
                                                    className="fw-bold text-decoration-none"
                                                >
                                                    {order.shipping_number}
                                                </Link>
                                            </td>
                                            <td>
                                                <Link
                                                    href={route('sales.orders.show', order.sales_order_id)}
                                                    className="text-decoration-none"
                                                >
                                                    {order.sales_order?.order_number || '-'}
                                                </Link>
                                            </td>
                                            <td>
                                                {order.sales_order?.customer?.name || order.sales_order?.customer?.title || '-'}
                                            </td>
                                            <td>
                                                <Badge bg={getPriorityBadgeVariant(order.priority)}>
                                                    {order.priority_label}
                                                </Badge>
                                            </td>
                                            <td>
                                                <Badge bg={getStatusBadgeVariant(order.status)}>
                                                    {order.status_label}
                                                </Badge>
                                            </td>
                                            <td className="text-center">
                                                <span className="badge bg-light text-dark">
                                                    {order.total_items}
                                                </span>
                                            </td>
                                            <td>
                                                <small>
                                                    {order.vehicle?.plate_number || '-'}
                                                    {order.driver && (
                                                        <span className="text-muted"> / {order.driver.name}</span>
                                                    )}
                                                </small>
                                            </td>
                                            <td>
                                                <small>{formatDateTime(order.created_at)}</small>
                                            </td>
                                            <td className="text-end">
                                                <Dropdown align="end">
                                                    <Dropdown.Toggle
                                                        variant="light"
                                                        size="sm"
                                                        className="btn-icon"
                                                    >
                                                        <i className="ri-more-2-fill"></i>
                                                    </Dropdown.Toggle>
                                                    <Dropdown.Menu>
                                                        <Dropdown.Item
                                                            as={Link}
                                                            href={route('warehouse.shipping-orders.show', order.id)}
                                                        >
                                                            <i className="ri-eye-line me-2"></i>
                                                            Detay
                                                        </Dropdown.Item>
                                                        {order.status === 'pending' && (
                                                            <Dropdown.Item
                                                                as={Link}
                                                                href={route('warehouse.shipping-orders.show', order.id)}
                                                            >
                                                                <i className="ri-user-add-line me-2"></i>
                                                                Toplama Ata
                                                            </Dropdown.Item>
                                                        )}
                                                        {order.status === 'ready_to_ship' && (
                                                            <Dropdown.Item
                                                                as={Link}
                                                                href={route('warehouse.shipping-orders.show', order.id)}
                                                            >
                                                                <i className="ri-truck-line me-2"></i>
                                                                Sevk Et
                                                            </Dropdown.Item>
                                                        )}
                                                        {!['shipped', 'delivered', 'cancelled'].includes(order.status) && (
                                                            <>
                                                                <Dropdown.Divider />
                                                                <Dropdown.Item
                                                                    className="text-danger"
                                                                    onClick={() => handleCancel(order)}
                                                                >
                                                                    <i className="ri-close-circle-line me-2"></i>
                                                                    Iptal Et
                                                                </Dropdown.Item>
                                                            </>
                                                        )}
                                                    </Dropdown.Menu>
                                                </Dropdown>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </Table>
                    </Card.Body>

                    {/* Pagination */}
                    {shippingOrders.last_page > 1 && (
                        <Card.Footer className="bg-white">
                            <nav className="d-flex justify-content-between align-items-center">
                                <small className="text-muted">
                                    Toplam {shippingOrders.total} kayit
                                </small>
                                <ul className="pagination pagination-sm mb-0">
                                    {shippingOrders.links.map((link, index) => (
                                        <li
                                            key={index}
                                            className={`page-item ${link.active ? 'active' : ''} ${!link.url ? 'disabled' : ''}`}
                                        >
                                            {link.url ? (
                                                <Link
                                                    href={link.url}
                                                    className="page-link"
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
                        </Card.Footer>
                    )}
                </Card>
            </div>
</div>
            {/* Cancel Modal */}
            <Modal show={showCancelModal} onHide={() => setShowCancelModal(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>Sevk Emri Iptal</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <p>
                        <strong>{orderToCancel?.shipping_number}</strong> numarali sevk emrini iptal etmek istediginize emin misiniz?
                    </p>
                    <Form.Group>
                        <Form.Label>Iptal Nedeni *</Form.Label>
                        <Form.Control
                            as="textarea"
                            rows={3}
                            value={cancelReason}
                            onChange={(e) => setCancelReason(e.target.value)}
                            placeholder="Iptal nedenini yaziniz..."
                        />
                    </Form.Group>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowCancelModal(false)}>
                        Vazgec
                    </Button>
                    <Button
                        variant="danger"
                        onClick={confirmCancel}
                        disabled={!cancelReason.trim()}
                    >
                        Iptal Et
                    </Button>
                </Modal.Footer>
            </Modal>
        </Layout>
    );
}
