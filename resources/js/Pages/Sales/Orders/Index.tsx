import React, { useState, useCallback } from 'react';
import { Head, Link, useForm, router } from '@inertiajs/react';
import { Card, Table, Button, Row, Col, Form, InputGroup, Badge, Dropdown, Modal, Spinner, Collapse } from 'react-bootstrap';
import Layout from '@/Layouts';
import CustomerSearchSelect from '@/Components/CustomerSearchSelect';
import ProductFilterSelect from '@/Components/ProductFilterSelect';

interface Customer {
    id: number;
    title: string;
    account_code: string;
}

interface Salesperson {
    id: number;
    name: string;
}

interface Product {
    id: number;
    code: string;
    name: string;
}

interface SalesOrderItem {
    id: number;
    product_name: string;
    quantity: number;
    unit_price: number;
    line_total: number;
}

interface OrderItemDetail {
    id: number;
    product_code: string;
    product_name: string;
    quantity: number;
    unit_name: string;
    unit_price: number;
    discount_percentage: number;
    tax_rate: number;
    line_total: number;
    status: string;
}

interface SalesOrder {
    id: number;
    order_number: string;
    order_date: string;
    delivery_date?: string;
    customer: Customer;
    salesperson?: Salesperson;
    status: string;
    status_label: string;
    priority: string;
    priority_label: string;
    total_amount: number;
    currency: string;
    items_count?: number;
    items?: SalesOrderItem[];
}

interface PaginatedSalesOrders {
    data: SalesOrder[];
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
    salesOrders: PaginatedSalesOrders;
    filters: {
        search?: string;
        status?: string;
        customer_id?: number;
        salesperson_id?: number;
        product_id?: number;
        priority?: string;
        date_from?: string;
        date_to?: string;
        sort?: string;
        direction?: string;
    };
    selectedCustomer: Customer | null;
    selectedProduct: Product | null;
    salespeople: Salesperson[];
    statuses: Record<string, string>;
    priorities: Record<string, string>;
    userPermissions: {
        canCreate: boolean;
        canEdit: boolean;
        canDelete: boolean;
        canViewAll: boolean;
        canApprove: boolean;
    };
}

export default function Index({
    salesOrders,
    filters,
    selectedCustomer,
    selectedProduct,
    salespeople,
    statuses,
    priorities,
    userPermissions
}: Props) {
    const [showFilters, setShowFilters] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [orderToDelete, setOrderToDelete] = useState<SalesOrder | null>(null);

    // Expandable rows state
    const [expandedOrders, setExpandedOrders] = useState<Set<number>>(new Set());
    const [orderItems, setOrderItems] = useState<Record<number, OrderItemDetail[]>>({});
    const [loadingItems, setLoadingItems] = useState<Set<number>>(new Set());

    // Approve modal state
    const [showApproveModal, setShowApproveModal] = useState(false);
    const [orderToApprove, setOrderToApprove] = useState<SalesOrder | null>(null);
    const [approveNotes, setApproveNotes] = useState('');
    const [approving, setApproving] = useState(false);

    // Email modal state
    const [showEmailModal, setShowEmailModal] = useState(false);
    const [emailOrder, setEmailOrder] = useState<SalesOrder | null>(null);
    const [emailLoading, setEmailLoading] = useState(false);
    const [emailForm, setEmailForm] = useState({
        email: '',
        cc: '',
        message: '',
        attach_pdf: true,
    });

    const { data, setData, get, processing } = useForm({
        search: filters.search || '',
        status: filters.status || '',
        customer_id: filters.customer_id || '',
        salesperson_id: filters.salesperson_id || '',
        product_id: filters.product_id || '',
        priority: filters.priority || '',
        date_from: filters.date_from || '',
        date_to: filters.date_to || '',
        sort: filters.sort || 'order_date',
        direction: filters.direction || 'desc',
    });

    const handleFilter = () => {
        get(route('sales.orders.index'), {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleSort = (field: string) => {
        const newDirection = data.sort === field && data.direction === 'asc' ? 'desc' : 'asc';
        setData('sort', field);
        setData('direction', newDirection);

        get(route('sales.orders.index'), {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const clearFilters = () => {
        setData({
            search: '',
            status: '',
            customer_id: '',
            salesperson_id: '',
            product_id: '',
            priority: '',
            date_from: '',
            date_to: '',
            sort: 'order_date',
            direction: 'desc',
        });

        router.get(route('sales.orders.index'));
    };

    const handleDelete = (order: SalesOrder) => {
        setOrderToDelete(order);
        setShowDeleteModal(true);
    };

    const confirmDelete = () => {
        if (orderToDelete) {
            router.delete(route('sales.orders.destroy', orderToDelete.id), {
                onSuccess: () => {
                    setShowDeleteModal(false);
                    setOrderToDelete(null);
                }
            });
        }
    };

    // Approve functions
    const handleApproveClick = (order: SalesOrder) => {
        if (order.status === 'draft' && userPermissions.canApprove) {
            setOrderToApprove(order);
            setApproveNotes('');
            setShowApproveModal(true);
        }
    };

    const confirmApprove = () => {
        if (orderToApprove) {
            setApproving(true);
            router.post(route('sales.orders.approve', orderToApprove.id), {
                notes: approveNotes
            }, {
                onSuccess: () => {
                    setShowApproveModal(false);
                    setOrderToApprove(null);
                    setApproveNotes('');
                },
                onFinish: () => {
                    setApproving(false);
                }
            });
        }
    };

    // Email functions
    const openEmailModal = async (order: SalesOrder) => {
        setEmailOrder(order);
        setEmailForm({
            email: '',
            cc: '',
            message: '',
            attach_pdf: true,
        });

        // Fetch customer email
        try {
            const response = await fetch(route('sales.orders.customer-email', order.id));
            const data = await response.json();
            if (data.email) {
                setEmailForm(prev => ({ ...prev, email: data.email }));
            }
        } catch (error) {
            console.error('Customer email fetch error:', error);
        }

        setShowEmailModal(true);
    };

    const handleSendEmail = async () => {
        if (!emailOrder) return;

        setEmailLoading(true);

        try {
            const response = await fetch(route('sales.orders.send-email', emailOrder.id), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                    'Accept': 'application/json',
                },
                body: JSON.stringify(emailForm),
            });

            const result = await response.json();

            if (response.ok && result.success) {
                alert('Email basariyla gonderildi!');
                setShowEmailModal(false);
                setEmailOrder(null);
            } else {
                alert(result.message || 'Email gonderilemedi.');
            }
        } catch (error) {
            console.error('Email send error:', error);
            alert('Email gonderilirken bir hata olustu.');
        } finally {
            setEmailLoading(false);
        }
    };

    const handleDownloadPdf = (orderId: number) => {
        window.open(route('sales.orders.pdf.download', orderId), '_blank');
    };

    const getStatusBadgeVariant = (status: string) => {
        switch (status) {
            case 'draft': return 'secondary';
            case 'confirmed': return 'primary';
            case 'in_production': return 'warning';
            case 'ready_to_ship': return 'info';
            case 'shipped': return 'success';
            case 'delivered': return 'success';
            case 'cancelled': return 'danger';
            case 'returned': return 'danger';
            default: return 'secondary';
        }
    };

    const getPriorityBadgeVariant = (priority: string) => {
        switch (priority) {
            case 'urgent': return 'danger';
            case 'high': return 'warning';
            case 'normal': return 'info';
            case 'low': return 'secondary';
            default: return 'secondary';
        }
    };

    const formatCurrency = (amount: number, currency: string) => {
        return new Intl.NumberFormat('tr-TR', {
            style: 'currency',
            currency: currency,
            minimumFractionDigits: 2,
        }).format(amount);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('tr-TR');
    };

    const getSortIcon = (field: string) => {
        if (data.sort !== field) return null;
        return data.direction === 'asc' ? '↑' : '↓';
    };

    // Toggle expand/collapse for order items
    const toggleOrderExpand = useCallback(async (orderId: number) => {
        const newExpanded = new Set(expandedOrders);

        if (newExpanded.has(orderId)) {
            newExpanded.delete(orderId);
            setExpandedOrders(newExpanded);
            return;
        }

        // If items not loaded yet, fetch them
        if (!orderItems[orderId]) {
            setLoadingItems(prev => new Set(prev).add(orderId));

            try {
                const response = await fetch(route('sales.orders.items', orderId));
                const result = await response.json();

                if (result.success) {
                    setOrderItems(prev => ({
                        ...prev,
                        [orderId]: result.items
                    }));
                }
            } catch (error) {
                console.error('Failed to load order items:', error);
            } finally {
                setLoadingItems(prev => {
                    const next = new Set(prev);
                    next.delete(orderId);
                    return next;
                });
            }
        }

        newExpanded.add(orderId);
        setExpandedOrders(newExpanded);
    }, [expandedOrders, orderItems]);

    return (
        <Layout>
            <Head title="Satış Siparişleri" />

            <div className="page-content">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h1 className="h3 mb-0">
                    <i className="ri-shopping-cart-line me-2"></i>
                    Satış Siparişleri
                </h1>

                <div className="d-flex gap-2">
                    <Button
                        variant="outline-secondary"
                        onClick={() => setShowFilters(!showFilters)}
                    >
                        <i className="ri-filter-line me-1"></i>
                        Filtreler
                        {Object.values(filters).some(v => v) && (
                            <Badge bg="primary" className="ms-1">
                                {Object.values(filters).filter(v => v).length}
                            </Badge>
                        )}
                    </Button>

                    {userPermissions.canCreate && (
                        <Link href={route('sales.orders.create')}>
                            <Button variant="primary">
                                <i className="ri-add-line me-1"></i>
                                Yeni Sipariş
                            </Button>
                        </Link>
                    )}
                </div>
            </div>

            {/* Filters Panel */}
            {showFilters && (
                <Card className="mb-4">
                    <Card.Body>
                        <Row className="g-3">
                            <Col md={3}>
                                <Form.Label>Arama</Form.Label>
                                <Form.Control
                                    type="text"
                                    placeholder="Sipariş no, müşteri..."
                                    value={data.search}
                                    onChange={(e) => setData('search', e.target.value)}
                                />
                            </Col>

                            <Col md={2}>
                                <Form.Label>Durum</Form.Label>
                                <Form.Select
                                    value={data.status}
                                    onChange={(e) => setData('status', e.target.value)}
                                >
                                    <option value="">Tümü</option>
                                    {Object.entries(statuses).map(([key, label]) => (
                                        <option key={key} value={key}>{label}</option>
                                    ))}
                                </Form.Select>
                            </Col>

                            <Col md={2}>
                                <Form.Label>Öncelik</Form.Label>
                                <Form.Select
                                    value={data.priority}
                                    onChange={(e) => setData('priority', e.target.value)}
                                >
                                    <option value="">Tümü</option>
                                    {Object.entries(priorities).map(([key, label]) => (
                                        <option key={key} value={key}>{label}</option>
                                    ))}
                                </Form.Select>
                            </Col>

                            <Col md={3}>
                                <Form.Label>Musteri</Form.Label>
                                <CustomerSearchSelect
                                    value={data.customer_id ? Number(data.customer_id) : null}
                                    onChange={(customerId) => setData('customer_id', customerId ? String(customerId) : '')}
                                    placeholder="Musteri ara veya sec..."
                                    isClearable={true}
                                    initialCustomer={selectedCustomer}
                                />
                            </Col>

                            <Col md={2}>
                                <Form.Label>Urun</Form.Label>
                                <ProductFilterSelect
                                    value={data.product_id ? Number(data.product_id) : null}
                                    onChange={(productId) => setData('product_id', productId ? String(productId) : '')}
                                    placeholder="Urun ara..."
                                    isClearable={true}
                                    initialProduct={selectedProduct}
                                />
                            </Col>
                        </Row>

                        <Row className="g-3 mt-2">
                            <Col md={2}>
                                <Form.Label>Temsilci</Form.Label>
                                <Form.Select
                                    value={data.salesperson_id}
                                    onChange={(e) => setData('salesperson_id', e.target.value)}
                                >
                                    <option value="">Tumu</option>
                                    {salespeople.map((person) => (
                                        <option key={person.id} value={person.id}>
                                            {person.name}
                                        </option>
                                    ))}
                                </Form.Select>
                            </Col>

                            <Col md={2}>
                                <Form.Label>Baslangic Tarihi</Form.Label>
                                <Form.Control
                                    type="date"
                                    value={data.date_from}
                                    onChange={(e) => setData('date_from', e.target.value)}
                                />
                            </Col>

                            <Col md={2}>
                                <Form.Label>Bitis Tarihi</Form.Label>
                                <Form.Control
                                    type="date"
                                    value={data.date_to}
                                    onChange={(e) => setData('date_to', e.target.value)}
                                />
                            </Col>

                            <Col md={6} className="d-flex align-items-end gap-2">
                                <Button
                                    variant="primary"
                                    onClick={handleFilter}
                                    disabled={processing}
                                >
                                    <i className="ri-search-line me-1"></i>
                                    Filtrele
                                </Button>

                                <Button
                                    variant="outline-secondary"
                                    onClick={clearFilters}
                                >
                                    <i className="ri-refresh-line me-1"></i>
                                    Temizle
                                </Button>
                            </Col>
                        </Row>
                    </Card.Body>
                </Card>
            )}

            {/* Results Summary */}
            <div className="d-flex justify-content-between align-items-center mb-3">
                <small className="text-muted">
                    Toplam {salesOrders.total} sipariş, sayfa {salesOrders.current_page} / {salesOrders.last_page}
                </small>

                <div className="d-flex gap-2">
                    <Button variant="outline-primary" size="sm">
                        <i className="ri-download-line me-1"></i>
                        Excel
                    </Button>
                    <Button variant="outline-primary" size="sm">
                        <i className="ri-file-pdf-line me-1"></i>
                        PDF
                    </Button>
                </div>
            </div>

            {/* Sales Orders Table */}
            <Card>
                <Card.Body className="p-0">
                    <div className="table-responsive">
                        <Table hover className="mb-0">
                            <thead className="table-light">
                                <tr>
                                    <th style={{ width: '40px' }}></th>
                                    <th
                                        className="cursor-pointer"
                                        onClick={() => handleSort('order_number')}
                                    >
                                        Sipariş No {getSortIcon('order_number')}
                                    </th>
                                    <th
                                        className="cursor-pointer"
                                        onClick={() => handleSort('order_date')}
                                    >
                                        Tarih {getSortIcon('order_date')}
                                    </th>
                                    <th>Müşteri</th>
                                    <th>Satış Temsilcisi</th>
                                    <th
                                        className="cursor-pointer"
                                        onClick={() => handleSort('status')}
                                    >
                                        Durum {getSortIcon('status')}
                                    </th>
                                    <th
                                        className="cursor-pointer"
                                        onClick={() => handleSort('priority')}
                                    >
                                        Öncelik {getSortIcon('priority')}
                                    </th>
                                    <th
                                        className="cursor-pointer text-end"
                                        onClick={() => handleSort('total_amount')}
                                    >
                                        Toplam {getSortIcon('total_amount')}
                                    </th>
                                    <th width="100">İşlemler</th>
                                </tr>
                            </thead>
                            <tbody>
                                {salesOrders.data.length === 0 ? (
                                    <tr>
                                        <td colSpan={9} className="text-center py-4 text-muted">
                                            <i className="ri-inbox-line fs-1 d-block mb-2"></i>
                                            Sipariş bulunamadı
                                        </td>
                                    </tr>
                                ) : (
                                    salesOrders.data.map((order) => (
                                        <React.Fragment key={order.id}>
                                        <tr
                                            className={expandedOrders.has(order.id) ? 'table-active' : ''}
                                            style={{ cursor: 'pointer' }}
                                        >
                                            <td onClick={() => toggleOrderExpand(order.id)} className="text-center">
                                                {loadingItems.has(order.id) ? (
                                                    <Spinner animation="border" size="sm" />
                                                ) : (
                                                    <i className={`ri-arrow-${expandedOrders.has(order.id) ? 'down' : 'right'}-s-line fs-5`}></i>
                                                )}
                                            </td>
                                            <td onClick={() => toggleOrderExpand(order.id)}>
                                                <Link
                                                    href={route('sales.orders.show', order.id)}
                                                    className="text-decoration-none fw-medium"
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    {order.order_number}
                                                </Link>
                                            </td>
                                            <td onClick={() => toggleOrderExpand(order.id)}>
                                                <div>{formatDate(order.order_date)}</div>
                                                {order.delivery_date && (
                                                    <small className="text-muted">
                                                        Teslimat: {formatDate(order.delivery_date)}
                                                    </small>
                                                )}
                                            </td>
                                            <td onClick={() => toggleOrderExpand(order.id)}>
                                                <div className="fw-medium">{order.customer?.title || 'İsimsiz Müşteri'}</div>
                                                <small className="text-muted">{order.customer?.account_code || '-'}</small>
                                            </td>
                                            <td onClick={() => toggleOrderExpand(order.id)}>
                                                {order.salesperson?.name || '-'}
                                            </td>
                                            <td>
                                                {order.status === 'draft' && userPermissions.canApprove ? (
                                                    <Badge
                                                        bg={getStatusBadgeVariant(order.status)}
                                                        style={{ cursor: 'pointer' }}
                                                        onClick={() => handleApproveClick(order)}
                                                        title="Onaylamak için tıklayın"
                                                    >
                                                        {order.status_label}
                                                        <i className="ri-check-line ms-1"></i>
                                                    </Badge>
                                                ) : (
                                                    <Badge bg={getStatusBadgeVariant(order.status)}>
                                                        {order.status_label}
                                                    </Badge>
                                                )}
                                            </td>
                                            <td>
                                                <Badge bg={getPriorityBadgeVariant(order.priority)}>
                                                    {order.priority_label}
                                                </Badge>
                                            </td>
                                            <td className="text-end" onClick={() => toggleOrderExpand(order.id)}>
                                                <div className="fw-medium">
                                                    {formatCurrency(order.total_amount, order.currency)}
                                                </div>
                                                {order.items_count && (
                                                    <small className="text-muted" style={{ cursor: 'pointer' }}>
                                                        <i className="ri-list-check me-1"></i>
                                                        {order.items_count} kalem
                                                    </small>
                                                )}
                                            </td>
                                            <td onClick={(e) => e.stopPropagation()}>
                                                <Dropdown>
                                                    <Dropdown.Toggle
                                                        variant="outline-secondary"
                                                        size="sm"
                                                        id={`dropdown-${order.id}`}
                                                    >
                                                        <i className="ri-more-line"></i>
                                                    </Dropdown.Toggle>

                                                    <Dropdown.Menu>
                                                        <Dropdown.Item
                                                            as={Link}
                                                            href={route('sales.orders.show', order.id)}
                                                        >
                                                            <i className="ri-eye-line me-2"></i>
                                                            Görüntüle
                                                        </Dropdown.Item>

                                                        {userPermissions.canEdit && (
                                                            <Dropdown.Item
                                                                as={Link}
                                                                href={route('sales.orders.edit', order.id)}
                                                            >
                                                                <i className="ri-edit-line me-2"></i>
                                                                Düzenle
                                                            </Dropdown.Item>
                                                        )}

                                                        <Dropdown.Divider />

                                                        <Dropdown.Item onClick={() => handleDownloadPdf(order.id)}>
                                                            <i className="ri-file-pdf-line me-2"></i>
                                                            PDF Indir
                                                        </Dropdown.Item>

                                                        <Dropdown.Item
                                                            as="a"
                                                            href={route('sales.orders.excel', order.id)}
                                                        >
                                                            <i className="ri-file-excel-line me-2"></i>
                                                            Excel Indir
                                                        </Dropdown.Item>

                                                        <Dropdown.Item onClick={() => openEmailModal(order)}>
                                                            <i className="ri-mail-line me-2"></i>
                                                            Email Gonder
                                                        </Dropdown.Item>

                                                        {['confirmed', 'in_production', 'ready_to_ship'].includes(order.status) && (
                                                            <>
                                                                <Dropdown.Divider />
                                                                <Dropdown.Item
                                                                    as={Link}
                                                                    href={route('warehouse.shipping-orders.create', { sales_order_id: order.id })}
                                                                >
                                                                    <i className="ri-truck-line me-2"></i>
                                                                    Sevk Emri Olustur
                                                                </Dropdown.Item>
                                                            </>
                                                        )}

                                                        {userPermissions.canDelete && (
                                                            <>
                                                                <Dropdown.Divider />
                                                                <Dropdown.Item
                                                                    className="text-danger"
                                                                    onClick={() => handleDelete(order)}
                                                                >
                                                                    <i className="ri-delete-bin-line me-2"></i>
                                                                    Sil
                                                                </Dropdown.Item>
                                                            </>
                                                        )}
                                                    </Dropdown.Menu>
                                                </Dropdown>
                                            </td>
                                        </tr>
                                        {/* Expandable items row */}
                                        {expandedOrders.has(order.id) && (
                                            <tr className="bg-white">
                                                <td colSpan={9} className="p-0">
                                                    <div className="p-3">
                                                        {orderItems[order.id] && orderItems[order.id].length > 0 ? (
                                                            <Table size="sm" className="table mb-0 table-bordered table-striped table-hover">
                                                                <thead className="table-secondary">
                                                                    <tr>
                                                                        <th>Ürün Kodu</th>
                                                                        <th>Ürün Adı</th>
                                                                        <th className="text-center">Miktar</th>
                                                                        <th className="text-center">Birim</th>
                                                                        <th className="text-end">Birim Fiyat</th>
                                                                        <th className="text-center">İsk. %</th>
                                                                        <th className="text-center">KDV %</th>
                                                                        <th className="text-end">Toplam</th>
                                                                    </tr>
                                                                </thead>
                                                                <tbody>
                                                                    {orderItems[order.id].map((item) => (
                                                                        <tr key={item.id}>
                                                                            <td>
                                                                                <code className="text-primary">{item.product_code}</code>
                                                                            </td>
                                                                            <td>{item.product_name}</td>
                                                                            <td className="text-center">{item.quantity.toLocaleString('tr-TR')}</td>
                                                                            <td className="text-center">{item.unit_name}</td>
                                                                            <td className="text-end">
                                                                                {formatCurrency(item.unit_price, order.currency)}
                                                                            </td>
                                                                            <td className="text-center">
                                                                                {item.discount_percentage > 0 ? `%${item.discount_percentage}` : '-'}
                                                                            </td>
                                                                            <td className="text-center">%{item.tax_rate}</td>
                                                                            <td className="text-end fw-medium">
                                                                                {formatCurrency(item.line_total, order.currency)}
                                                                            </td>
                                                                        </tr>
                                                                    ))}
                                                                </tbody>
                                                            </Table>
                                                        ) : (
                                                            <div className="text-center text-muted py-2">
                                                                <i className="ri-inbox-line me-2"></i>
                                                                Sipariş kalemi bulunamadı
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                        </React.Fragment>
                                    ))
                                )}
                            </tbody>
                        </Table>
                    </div>
                </Card.Body>
            </Card>

            {/* Pagination */}
            {salesOrders.last_page > 1 && (
                <div className="d-flex justify-content-center mt-4">
                    <nav>
                        <ul className="pagination">
                            {salesOrders.links.map((link, index) => (
                                <li
                                    key={index}
                                    className={`page-item ${link.active ? 'active' : ''} ${!link.url ? 'disabled' : ''}`}
                                >
                                    {link.url ? (
                                        <Link
                                            href={link.url}
                                            className="page-link"
                                            preserveState
                                            preserveScroll
                                        >
                                            <span dangerouslySetInnerHTML={{ __html: link.label }} />
                                        </Link>
                                    ) : (
                                        <span className="page-link">
                                            <span dangerouslySetInnerHTML={{ __html: link.label }} />
                                        </span>
                                    )}
                                </li>
                            ))}
                        </ul>
                    </nav>
                </div>
            )}
        </div>
            {/* Delete Confirmation Modal */}
            <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>Siparisi Sil</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {orderToDelete && (
                        <p>
                            <strong>{orderToDelete.order_number}</strong> numarali siparisi silmek istediginizden emin misiniz?
                            Bu islem geri alinamaz.
                        </p>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
                        Iptal
                    </Button>
                    <Button variant="danger" onClick={confirmDelete}>
                        Sil
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* Approve Confirmation Modal */}
            <Modal show={showApproveModal} onHide={() => setShowApproveModal(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>
                        <i className="ri-check-double-line me-2 text-success"></i>
                        Siparisi Onayla
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {orderToApprove && (
                        <>
                            <div className="alert alert-info mb-3">
                                <strong>{orderToApprove.order_number}</strong> numarali siparisi onaylamak istediginizden emin misiniz?
                            </div>
                            <p className="mb-3">
                                <strong>Musteri:</strong> {orderToApprove.customer?.title || 'Bilinmiyor'}<br />
                                <strong>Tutar:</strong> {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: orderToApprove.currency }).format(orderToApprove.total_amount)}
                            </p>
                            <Form.Group>
                                <Form.Label>Not (Opsiyonel)</Form.Label>
                                <Form.Control
                                    as="textarea"
                                    rows={2}
                                    value={approveNotes}
                                    onChange={(e) => setApproveNotes(e.target.value)}
                                    placeholder="Onay notu ekleyin..."
                                />
                            </Form.Group>
                        </>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowApproveModal(false)} disabled={approving}>
                        Iptal
                    </Button>
                    <Button variant="success" onClick={confirmApprove} disabled={approving}>
                        {approving ? (
                            <>
                                <span className="spinner-border spinner-border-sm me-2"></span>
                                Onaylaniyor...
                            </>
                        ) : (
                            <>
                                <i className="ri-check-line me-2"></i>
                                Onayla
                            </>
                        )}
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* Email Modal */}
            <Modal show={showEmailModal} onHide={() => setShowEmailModal(false)} size="lg">
                <Modal.Header closeButton>
                    <Modal.Title>
                        <i className="ri-mail-send-line me-2"></i>
                        Siparis Email Gonder
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {emailOrder && (
                        <>
                            <div className="alert alert-info mb-3">
                                <strong>Siparis:</strong> {emailOrder.order_number} |
                                <strong className="ms-2">Musteri:</strong> {emailOrder.customer?.title}
                            </div>

                            <Form.Group className="mb-3">
                                <Form.Label>Email Adresi *</Form.Label>
                                <Form.Control
                                    type="email"
                                    value={emailForm.email}
                                    onChange={(e) => setEmailForm({ ...emailForm, email: e.target.value })}
                                    placeholder="ornek@firma.com"
                                    required
                                />
                                <Form.Text className="text-muted">
                                    Musterinin kayitli email adresi otomatik doldurulur.
                                </Form.Text>
                            </Form.Group>

                            <Form.Group className="mb-3">
                                <Form.Label>CC (Opsiyonel)</Form.Label>
                                <Form.Control
                                    type="text"
                                    value={emailForm.cc}
                                    onChange={(e) => setEmailForm({ ...emailForm, cc: e.target.value })}
                                    placeholder="cc1@firma.com, cc2@firma.com"
                                />
                                <Form.Text className="text-muted">
                                    Birden fazla adres icin virgul ile ayirin.
                                </Form.Text>
                            </Form.Group>

                            <Form.Group className="mb-3">
                                <Form.Label>Mesaj (Opsiyonel)</Form.Label>
                                <Form.Control
                                    as="textarea"
                                    rows={4}
                                    value={emailForm.message}
                                    onChange={(e) => setEmailForm({ ...emailForm, message: e.target.value })}
                                    placeholder="Musteriye iletmek istediginiz ozel mesaj..."
                                />
                            </Form.Group>

                            <Form.Check
                                type="checkbox"
                                id="attach_pdf"
                                label="Siparis PDF'ini ekle"
                                checked={emailForm.attach_pdf}
                                onChange={(e) => setEmailForm({ ...emailForm, attach_pdf: e.target.checked })}
                            />
                        </>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowEmailModal(false)}>
                        Iptal
                    </Button>
                    <Button
                        variant="primary"
                        onClick={handleSendEmail}
                        disabled={emailLoading || !emailForm.email}
                    >
                        {emailLoading ? (
                            <>
                                <span className="spinner-border spinner-border-sm me-2"></span>
                                Gonderiliyor...
                            </>
                        ) : (
                            <>
                                <i className="ri-send-plane-line me-2"></i>
                                Gonder
                            </>
                        )}
                    </Button>
                </Modal.Footer>
            </Modal>
        </Layout>
    );
}
