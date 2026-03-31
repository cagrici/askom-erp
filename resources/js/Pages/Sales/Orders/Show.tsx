import React, { useState } from 'react';
import { Head, Link, useForm, router } from '@inertiajs/react';
import { Card, Table, Button, Row, Col, Badge, Dropdown, Modal, Form, Alert } from 'react-bootstrap';
import Layout from '@/Layouts';

interface Customer {
    id: number;
    title: string;
    account_code: string;
    email?: string;
    phone?: string;
}

interface Salesperson {
    id: number;
    name: string;
    email?: string;
}

interface Product {
    id: number;
    code: string;
    name: string;
    category?: {
        id: number;
        name: string;
    };
    brand?: {
        id: number;
        name: string;
    };
    supplier?: {
        id: number;
        title: string;
        account_code: string;
    };
    baseUnit?: {
        id: number;
        name: string;
        symbol: string;
    };
    primary_image_url?: string;
    primaryImage?: {
        id: number;
        image_path: string;
        thumbnail_path: string;
        image_url: string;
        thumbnail_url: string;
        alt_text?: string;
        is_primary: boolean;
    };
}

interface SalesOrderItem {
    id: number;
    product_id: number;
    product: Product;
    quantity: number;
    unit_price: number;
    discount_percentage: number;
    discount_amount: number;
    tax_rate: number;
    tax_amount: number;
    line_total: number;
    pricing_currency?: string;
    foreign_unit_price?: number;
    foreign_line_total?: number;
    requested_delivery_date?: string;
    notes?: string;
    special_instructions?: string;
    status: string;
    status_label: string;
}

interface StatusHistory {
    id: number;
    old_status: string;
    new_status: string;
    old_status_label: string;
    new_status_label: string;
    notes?: string;
    reason?: string;
    changed_at: string;
    changed_by: {
        id: number;
        name: string;
    };
}

interface SalesOrder {
    id: number;
    order_number: string;
    customer_id: number;
    customer: Customer;
    salesperson_id?: number;
    salesperson?: Salesperson;
    order_date: string;
    delivery_date?: string;
    requested_delivery_date?: string;
    status: string;
    status_label: string;
    priority: string;
    priority_label: string;
    payment_term_days: number;
    payment_method: string;
    payment_method_label: string;
    currency: string;
    exchange_rate: number;
    pricing_currency?: string;
    subtotal: number;
    tax_amount: number;
    shipping_cost: number;
    discount_amount: number;
    total_amount: number;
    billing_address?: any;
    shipping_address?: any;
    notes?: string;
    internal_notes?: string;
    terms_and_conditions?: string;
    logo_id?: number;
    logo_ficheno?: string;
    logo_synced_at?: string;
    reference_number?: string;
    external_order_number?: string;
    created_at: string;
    updated_at: string;
    created_by: {
        id: number;
        name: string;
    };
    cancelled_by?: {
        id: number;
        name: string;
    };
    items: SalesOrderItem[];
    status_history: StatusHistory[];
}

interface StockItem {
    item_id: number;
    product_id: number;
    product_name: string;
    product_code: string;
    requested_quantity: number;
    available_stock: number;
    is_available: boolean;
    track_inventory: boolean;
    allow_backorder: boolean;
    shortage: number;
}

interface StockAvailability {
    all_available: boolean;
    items: StockItem[];
}

interface Props {
    salesOrder: SalesOrder;
    statuses: Record<string, string>;
    itemStatuses: Record<string, string>;
    stockAvailability: StockAvailability;
    userPermissions: {
        canEdit: boolean;
        canDelete: boolean;
        canUpdateStatus: boolean;
    };
}

export default function Show({ salesOrder, statuses, itemStatuses, stockAvailability, userPermissions }: Props) {
    const [showStatusModal, setShowStatusModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showHistoryModal, setShowHistoryModal] = useState(false);
    const [showEmailModal, setShowEmailModal] = useState(false);
    const [emailLoading, setEmailLoading] = useState(false);
    const [logoSyncLoading, setLogoSyncLoading] = useState(false);
    const [emailForm, setEmailForm] = useState({
        email: '',
        cc: '',
        message: '',
        attach_pdf: true,
    });

    const { data, setData, patch, processing, errors } = useForm({
        status: salesOrder.status,
        notes: '',
        reason: '',
    });

    const handleStatusUpdate = (e: React.FormEvent) => {
        e.preventDefault();

        patch(route('sales.orders.update-status', salesOrder.id), {
            onSuccess: () => {
                setShowStatusModal(false);
                setData({ status: salesOrder.status, notes: '', reason: '' });
            }
        });
    };

    const handleDelete = () => {
        router.delete(route('sales.orders.destroy', salesOrder.id), {
            onSuccess: () => {
                setShowDeleteModal(false);
            }
        });
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

    const formatCurrency = (amount: number, currency: string = salesOrder.currency) => {
        return new Intl.NumberFormat('tr-TR', {
            style: 'currency',
            currency: currency,
            minimumFractionDigits: 2,
        }).format(amount);
    };

    // Calculate foreign currency equivalent
    const getForeignAmount = (tryAmount: number): number | null => {
        if (salesOrder.pricing_currency && salesOrder.exchange_rate > 0) {
            return tryAmount / salesOrder.exchange_rate;
        }
        return null;
    };

    // Format foreign currency amount
    const formatForeignCurrency = (amount: number): string => {
        if (!salesOrder.pricing_currency) return '';
        return new Intl.NumberFormat('tr-TR', {
            style: 'currency',
            currency: salesOrder.pricing_currency,
            minimumFractionDigits: 2,
        }).format(amount);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('tr-TR');
    };

    const formatDateTime = (dateString: string) => {
        return new Date(dateString).toLocaleString('tr-TR');
    };

    const openEmailModal = async () => {
        setEmailForm({
            email: '',
            cc: '',
            message: '',
            attach_pdf: true,
        });

        try {
            const response = await fetch(route('sales.orders.customer-email', salesOrder.id));
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
        setEmailLoading(true);

        try {
            const response = await fetch(route('sales.orders.send-email', salesOrder.id), {
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
                alert('Email başarıyla gönderildi!');
                setShowEmailModal(false);
            } else {
                alert(result.message || 'Email gönderilemedi.');
            }
        } catch (error) {
            console.error('Email send error:', error);
            alert('Email gönderilirken bir hata oluştu.');
        } finally {
            setEmailLoading(false);
        }
    };

    const handleSyncToLogo = () => {
        if (!confirm(salesOrder.logo_id
            ? 'Sipariş Logo\'da güncellenecek. Devam etmek istiyor musunuz?'
            : 'Sipariş Logo\'ya aktarılacak. Devam etmek istiyor musunuz?'
        )) return;

        setLogoSyncLoading(true);
        router.post(route('sales.orders.sync-to-logo', salesOrder.id), {}, {
            preserveScroll: true,
            onFinish: () => setLogoSyncLoading(false),
        });
    };

    const canEditOrder = userPermissions.canEdit && ['draft', 'confirmed'].includes(salesOrder.status);
    const canUpdateStatus = userPermissions.canUpdateStatus;
    const canDeleteOrder = userPermissions.canDelete && salesOrder.status === 'draft';

    return (
        <Layout>
            <Head title={`Satış Siparişi - ${salesOrder.order_number}`} />
            <div className="page-content">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h1 className="h3 mb-1">
                        <i className="ri-shopping-cart-line me-2"></i>
                        {salesOrder.order_number}
                    </h1>
                    <div className="d-flex gap-2 align-items-center">
                        <Badge bg={getStatusBadgeVariant(salesOrder.status)}>
                            {salesOrder.status_label}
                        </Badge>
                        <Badge bg={getPriorityBadgeVariant(salesOrder.priority)}>
                            {salesOrder.priority_label}
                        </Badge>
                        <small className="text-muted">
                            Oluşturulma: {formatDateTime(salesOrder.created_at)}
                        </small>
                    </div>
                </div>

                <div className="d-flex gap-2">
                    <Button
                        variant="outline-secondary"
                        size="sm"
                        onClick={() => setShowHistoryModal(true)}
                    >
                        <i className="ri-history-line me-1"></i>
                        Geçmiş
                    </Button>

                    {canUpdateStatus && (
                        <Button
                            variant="outline-primary"
                            size="sm"
                            onClick={() => setShowStatusModal(true)}
                        >
                            <i className="ri-refresh-line me-1"></i>
                            Durum Güncelle
                        </Button>
                    )}

                    <Dropdown>
                        <Dropdown.Toggle variant="outline-secondary" size="sm">
                            <i className="ri-more-line"></i>
                        </Dropdown.Toggle>
                        <Dropdown.Menu>
                            {canEditOrder && (
                                <Dropdown.Item as={Link} href={route('sales.orders.edit', salesOrder.id)}>
                                    <i className="ri-edit-line me-2"></i>
                                    Düzenle
                                </Dropdown.Item>
                            )}

                            <Dropdown.Item
                                as="a"
                                href={route('sales.orders.pdf', salesOrder.id)}
                                target="_blank"
                            >
                                <i className="ri-eye-line me-2"></i>
                                PDF Önizle
                            </Dropdown.Item>

                            <Dropdown.Item
                                as="a"
                                href={route('sales.orders.pdf.download', salesOrder.id)}
                                target="_blank"
                            >
                                <i className="ri-file-pdf-line me-2"></i>
                                PDF İndir
                            </Dropdown.Item>

                            <Dropdown.Item
                                as="a"
                                href={route('sales.orders.excel', salesOrder.id)}
                            >
                                <i className="ri-file-excel-line me-2"></i>
                                Excel İndir
                            </Dropdown.Item>

                            <Dropdown.Item onClick={openEmailModal}>
                                <i className="ri-mail-line me-2"></i>
                                Email Gönder
                            </Dropdown.Item>

                            <Dropdown.Divider />
                            <Dropdown.Item
                                onClick={handleSyncToLogo}
                                disabled={logoSyncLoading || salesOrder.status === 'cancelled'}
                            >
                                {logoSyncLoading ? (
                                    <>
                                        <span className="spinner-border spinner-border-sm me-2"></span>
                                        Aktarılıyor...
                                    </>
                                ) : (
                                    <>
                                        <i className="ri-refresh-line me-2"></i>
                                        {salesOrder.logo_id ? 'Logo\'ya Tekrar Aktar' : 'Logo\'ya Aktar'}
                                    </>
                                )}
                            </Dropdown.Item>
                            {salesOrder.logo_synced_at && (
                                <Dropdown.ItemText className="small text-muted">
                                    <i className="ri-check-double-line me-1"></i>
                                    Son aktarım: {new Date(salesOrder.logo_synced_at).toLocaleString('tr-TR')}
                                </Dropdown.ItemText>
                            )}

                            <Dropdown.Divider />
                            <Dropdown.Item>
                                <i className="ri-file-copy-line me-2"></i>
                                Kopyala
                            </Dropdown.Item>

                            {['confirmed', 'in_production', 'ready_to_ship'].includes(salesOrder.status) && (
                                <>
                                    <Dropdown.Divider />
                                    <Dropdown.Item
                                        as={Link}
                                        href={route('warehouse.shipping-orders.create', { sales_order_id: salesOrder.id })}
                                    >
                                        <i className="ri-truck-line me-2"></i>
                                        Sevk Emri Olustur
                                    </Dropdown.Item>
                                </>
                            )}

                            {canDeleteOrder && (
                                <>
                                    <Dropdown.Divider />
                                    <Dropdown.Item
                                        className="text-danger"
                                        onClick={() => setShowDeleteModal(true)}
                                    >
                                        <i className="ri-delete-bin-line me-2"></i>
                                        Sil
                                    </Dropdown.Item>
                                </>
                            )}
                        </Dropdown.Menu>
                    </Dropdown>

                    <Link href={route('sales.orders.index')}>
                        <Button variant="outline-secondary" size="sm">
                            <i className="ri-arrow-left-line me-1"></i>
                            Geri
                        </Button>
                    </Link>
                </div>
            </div>

            <Row>
                <Col lg={8}>
                    {/* Order Details */}
                    <Card className="mb-4">
                        <Card.Header>
                            <h5 className="mb-0">Sipariş Detayları</h5>
                        </Card.Header>
                        <Card.Body>
                            <Row>
                                <Col md={6}>
                                    <div className="mb-3">
                                        <strong>Musteri:</strong>
                                        <div>{salesOrder.customer?.title || 'Belirtilmemis'}</div>
                                        {salesOrder.customer?.account_code && (
                                            <small className="text-muted">{salesOrder.customer.account_code}</small>
                                        )}
                                    </div>

                                    <div className="mb-3">
                                        <strong>Sipariş Tarihi:</strong>
                                        <div>{formatDate(salesOrder.order_date)}</div>
                                    </div>

                                    {salesOrder.delivery_date && (
                                        <div className="mb-3">
                                            <strong>Teslimat Tarihi:</strong>
                                            <div>{formatDate(salesOrder.delivery_date)}</div>
                                        </div>
                                    )}

                                    {salesOrder.reference_number && (
                                        <div className="mb-3">
                                            <strong>Referans No:</strong>
                                            <div>{salesOrder.reference_number}</div>
                                        </div>
                                    )}
                                </Col>
                                <Col md={6}>
                                    {salesOrder.salesperson && (
                                        <div className="mb-3">
                                            <strong>Satış Temsilcisi:</strong>
                                            <div>{salesOrder.salesperson.name}</div>
                                        </div>
                                    )}

                                    <div className="mb-3">
                                        <strong>Ödeme Vadesi:</strong>
                                        <div>{salesOrder.payment_term_days} gün</div>
                                    </div>

                                    <div className="mb-3">
                                        <strong>Ödeme Yöntemi:</strong>
                                        <div>{salesOrder.payment_method_label}</div>
                                    </div>

                                    {salesOrder.external_order_number && (
                                        <div className="mb-3">
                                            <strong>Müşteri Sipariş No:</strong>
                                            <div>{salesOrder.external_order_number}</div>
                                        </div>
                                    )}
                                </Col>
                            </Row>

                            {salesOrder.notes && (
                                <div className="mt-3">
                                    <strong>Notlar:</strong>
                                    <div className="mt-1 p-2 bg-light rounded">
                                        {salesOrder.notes}
                                    </div>
                                </div>
                            )}
                        </Card.Body>
                    </Card>

                    {/* Order Items */}
                    <Card className="mb-4">
                        <Card.Header>
                            <h5 className="mb-0">Sipariş Kalemleri</h5>
                        </Card.Header>
                        <Card.Body className="p-0">
                            <div className="table-responsive">
                                <Table className="mb-0">
                                    <thead className="table-light">
                                        <tr>
                                            <th>Ürün</th>
                                            <th width="150">Marka/Tedarikçi</th>
                                            <th width="100" className="text-center">Miktar</th>
                                            <th width="120" className="text-end">Birim Fiyat</th>
                                            <th width="100" className="text-center">İndirim</th>
                                            <th width="100" className="text-center">KDV</th>
                                            <th width="120" className="text-end">Toplam</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {salesOrder.items.map((item) => (
                                            <tr key={item.id}>
                                                <td>
                                                    <div className="d-flex align-items-start gap-3">
                                                        {/* Product Image */}
                                                        <img 
                                                            src={item.product.primary_image_url || '/images/no-image.png'} 
                                                            alt={item.product.name}
                                                            className="rounded"
                                                            style={{ 
                                                                width: '60px', 
                                                                height: '60px', 
                                                                objectFit: 'cover',
                                                                flexShrink: 0
                                                            }}
                                                            onError={(e) => {
                                                                e.currentTarget.src = '/images/no-image.png';
                                                            }}
                                                        />
                                                        
                                                        {/* Product Info */}
                                                        <div className="flex-grow-1">
                                                            <div className="fw-medium">{item.product.name}</div>
                                                            <div className="d-flex gap-3 mt-1">
                                                                <small className="text-muted">
                                                                    <strong>Kod:</strong> {item.product.code}
                                                                </small>
                                                                {item.product.category && (
                                                                    <small className="text-muted">
                                                                        <strong>Kategori:</strong> {item.product.category.name}
                                                                    </small>
                                                                )}
                                                                {item.product.brand && (
                                                                    <small className="text-muted">
                                                                        <strong>Marka:</strong> {item.product.brand.name}
                                                                    </small>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    {(item.notes || item.special_instructions) && (
                                                        <div className="mt-1">
                                                            {item.notes && (
                                                                <small className="text-muted d-block">
                                                                    <strong>Not:</strong> {item.notes}
                                                                </small>
                                                            )}
                                                            {item.special_instructions && (
                                                                <small className="text-warning d-block">
                                                                    <strong>Özel Talimat:</strong> {item.special_instructions}
                                                                </small>
                                                            )}
                                                        </div>
                                                    )}
                                                </td>
                                                <td>
                                                    <div>
                                                        {item.product.brand && (
                                                            <div className="small fw-medium text-primary">
                                                                <i className="ri-award-line me-1"></i>
                                                                {item.product.brand.name}
                                                            </div>
                                                        )}
                                                        {item.product.supplier && (
                                                            <div className="small text-muted">
                                                                <i className="ri-truck-line me-1"></i>
                                                                {item.product.supplier.title}
                                                            </div>
                                                        )}
                                                        {!item.product.brand && !item.product.supplier && (
                                                            <small className="text-muted">-</small>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="text-center">
                                                    <div>{item.quantity}</div>
                                                    {item.product.baseUnit && (
                                                        <small className="text-muted">{item.product.baseUnit.symbol}</small>
                                                    )}
                                                </td>
                                                <td className="text-end">
                                                    <div>{formatCurrency(item.unit_price)}</div>
                                                    {item.foreign_unit_price && (
                                                        <small className="text-info">
                                                            {formatForeignCurrency(item.foreign_unit_price)}
                                                        </small>
                                                    )}
                                                    {item.product.baseUnit && (
                                                        <small className="text-muted">/{item.product.baseUnit.symbol}</small>
                                                    )}
                                                </td>
                                                <td className="text-center">
                                                    {item.discount_percentage > 0 && (
                                                        <div>
                                                            <div>%{item.discount_percentage}</div>
                                                            <small className="text-muted">
                                                                {formatCurrency(item.discount_amount)}
                                                            </small>
                                                        </div>
                                                    )}
                                                    {item.discount_amount > 0 && item.discount_percentage === 0 && (
                                                        <div>{formatCurrency(item.discount_amount)}</div>
                                                    )}
                                                    {item.discount_percentage === 0 && item.discount_amount === 0 && '-'}
                                                </td>
                                                <td className="text-center">
                                                    <div>%{item.tax_rate % 1 === 0 ? Math.floor(item.tax_rate) : item.tax_rate}</div>
                                                    <small className="text-muted">
                                                        {formatCurrency(item.tax_amount)}
                                                    </small>
                                                </td>
                                                <td className="text-end">
                                                    <div className="fw-medium">
                                                        {formatCurrency(item.line_total)}
                                                    </div>
                                                    {item.foreign_line_total && (
                                                        <small className="text-info">
                                                            {formatForeignCurrency(item.foreign_line_total)}
                                                        </small>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </Table>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>

                <Col lg={4}>
                    {/* Order Summary */}
                    <Card className="mb-4">
                        <Card.Header>
                            <h5 className="mb-0">Sipariş Özeti</h5>
                        </Card.Header>
                        <Card.Body>
                            <div className="d-flex justify-content-between mb-2">
                                <span>Ara Toplam:</span>
                                <span>{formatCurrency(salesOrder.subtotal)}</span>
                            </div>

                            {/* Item-level Discounts */}
                            {(() => {
                                const bulkDiscountItems = salesOrder.items.filter(item => 
                                    item.discount_percentage > 0 || item.discount_amount > 0
                                );
                                const totalItemDiscount = salesOrder.items.reduce((sum, item) => 
                                    sum + (item.discount_amount || 0), 0
                                );
                                
                                return totalItemDiscount > 0 ? (
                                    <>
                                        <div className="d-flex justify-content-between mb-2 text-success">
                                            <span>
                                                <i className="ri-price-tag-line me-1"></i>
                                                Kalem İndirimleri:
                                            </span>
                                            <span>-{formatCurrency(totalItemDiscount)}</span>
                                        </div>
                                        <div className="ms-3 mb-2">
                                            {bulkDiscountItems.map((item, index) => (
                                                <div key={item.id} className="d-flex justify-content-between">
                                                    <small className="text-muted">
                                                        {item.product.name}: 
                                                        {item.discount_percentage > 0 ? ` %${item.discount_percentage}` : ''}
                                                    </small>
                                                    <small className="text-success">-{formatCurrency(item.discount_amount)}</small>
                                                </div>
                                            ))}
                                        </div>
                                        <hr className="my-2" />
                                    </>
                                ) : null;
                            })()}

                            <div className="d-flex justify-content-between mb-2">
                                <span>KDV:</span>
                                <span>{formatCurrency(salesOrder.tax_amount)}</span>
                            </div>

                            {salesOrder.shipping_cost > 0 && (
                                <div className="d-flex justify-content-between mb-2">
                                    <span>Kargo:</span>
                                    <span>{formatCurrency(salesOrder.shipping_cost)}</span>
                                </div>
                            )}

                            {salesOrder.discount_amount > 0 && (
                                <div className="d-flex justify-content-between mb-2 text-success">
                                    <span>
                                        <i className="ri-discount-percent-line me-1"></i>
                                        Sipariş İndirimi:
                                    </span>
                                    <span>-{formatCurrency(salesOrder.discount_amount)}</span>
                                </div>
                            )}

                            <hr />
                            <div className="d-flex justify-content-between fw-bold fs-5">
                                <span>Genel Toplam:</span>
                                <div className="text-end">
                                    <span className="text-primary">{formatCurrency(salesOrder.total_amount)}</span>
                                    {salesOrder.pricing_currency && getForeignAmount(salesOrder.total_amount) !== null && (
                                        <div className="text-muted fs-6 fw-normal">
                                            {formatForeignCurrency(getForeignAmount(salesOrder.total_amount)!)}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="mt-3">
                                <small className="text-muted">
                                    Para Birimi: {salesOrder.currency}
                                    {salesOrder.pricing_currency && (
                                        <> • Döviz: {salesOrder.pricing_currency} (Kur: {salesOrder.exchange_rate ? Number(salesOrder.exchange_rate).toFixed(4) : '-'})</>
                                    )}
                                </small>
                            </div>
                        </Card.Body>
                    </Card>

                    {/* Stock Availability */}
                    <Card className="mb-4">
                        <Card.Header>
                            <h5 className="mb-0">
                                <i className="ri-stack-line me-2"></i>
                                Stok Durumu
                                {stockAvailability.all_available ? (
                                    <Badge bg="success" className="ms-2">Tüm Stoklar Mevcut</Badge>
                                ) : (
                                    <Badge bg="warning" className="ms-2">Stok Eksikliği</Badge>
                                )}
                            </h5>
                        </Card.Header>
                        <Card.Body>
                            {stockAvailability.items.map((stockItem) => (
                                <div key={stockItem.item_id} className="mb-3">
                                    <div className="d-flex justify-content-between align-items-start">
                                        <div className="flex-grow-1">
                                            <div className="fw-medium">{stockItem.product_name}</div>
                                            <small className="text-muted">Kod: {stockItem.product_code}</small>
                                        </div>
                                        <div className="text-end">
                                            {stockItem.track_inventory ? (
                                                <>
                                                    <div className="fw-medium">
                                                        {stockItem.requested_quantity} / {stockItem.available_stock}
                                                    </div>
                                                    <small className="text-muted">İhtiyaç / Stok</small>
                                                    {stockItem.shortage > 0 && (
                                                        <div className="text-danger">
                                                            <small>Eksik: {stockItem.shortage}</small>
                                                        </div>
                                                    )}
                                                    {stockItem.allow_backorder && stockItem.shortage > 0 && (
                                                        <div className="text-info">
                                                            <small><i className="ri-check-line"></i> Sipariş alınabilir</small>
                                                        </div>
                                                    )}
                                                </>
                                            ) : (
                                                <Badge bg="secondary">Stok takibi yok</Badge>
                                            )}
                                        </div>
                                    </div>
                                    
                                    <div className="mt-1">
                                        <div 
                                            className="progress" 
                                            style={{ height: '4px' }}
                                            title={`${stockItem.available_stock} adet mevcut`}
                                        >
                                            <div 
                                                className={`progress-bar ${
                                                    stockItem.is_available ? 'bg-success' : 
                                                    stockItem.allow_backorder ? 'bg-warning' : 'bg-danger'
                                                }`}
                                                style={{ 
                                                    width: stockItem.track_inventory ? 
                                                        `${Math.min(100, (stockItem.available_stock / Math.max(stockItem.requested_quantity, 1)) * 100)}%` : 
                                                        '100%' 
                                                }}
                                            />
                                        </div>
                                    </div>
                                    
                                    {stockItem !== stockAvailability.items[stockAvailability.items.length - 1] && (
                                        <hr className="my-3" />
                                    )}
                                </div>
                            ))}
                        </Card.Body>
                    </Card>

                    {/* Additional Information */}
                    <Card>
                        <Card.Header>
                            <h5 className="mb-0">Ek Bilgiler</h5>
                        </Card.Header>
                        <Card.Body>
                            <div className="mb-3">
                                <strong>Oluşturan:</strong>
                                <div>{salesOrder.created_by.name}</div>
                                <small className="text-muted">{formatDateTime(salesOrder.created_at)}</small>
                            </div>

                            {salesOrder.updated_at !== salesOrder.created_at && (
                                <div className="mb-3">
                                    <strong>Son Güncelleme:</strong>
                                    <div className="text-muted">{formatDateTime(salesOrder.updated_at)}</div>
                                </div>
                            )}

                            <div className="mb-3">
                                <strong>Toplam Kalem:</strong>
                                <div>{salesOrder.items.length}</div>
                            </div>

                            {salesOrder.logo_ficheno && (
                                <div className="mb-3">
                                    <strong>Logo Sipariş No:</strong>
                                    <div>{salesOrder.logo_ficheno}</div>
                                    {salesOrder.logo_synced_at && (
                                        <small className="text-muted">
                                            Aktarım: {formatDateTime(salesOrder.logo_synced_at)}
                                        </small>
                                    )}
                                </div>
                            )}

                            {salesOrder.cancelled_by && (
                                <div className="mb-3">
                                    <strong>İptal Eden:</strong>
                                    <div className="text-danger">{salesOrder.cancelled_by.name}</div>
                                </div>
                            )}

                            {salesOrder.internal_notes && (
                                <div className="mt-3">
                                    <strong>İç Notlar:</strong>
                                    <div className="mt-1 p-2 bg-light rounded">
                                        <small>{salesOrder.internal_notes}</small>
                                    </div>
                                </div>
                            )}
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
            </div>
            {/* Status Update Modal */}
            <Modal show={showStatusModal} onHide={() => setShowStatusModal(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>Sipariş Durumunu Güncelle</Modal.Title>
                </Modal.Header>
                <Form onSubmit={handleStatusUpdate}>
                    <Modal.Body>
                        <div className="mb-3">
                            <Form.Label>Mevcut Durum</Form.Label>
                            <div>
                                <Badge bg={getStatusBadgeVariant(salesOrder.status)}>
                                    {salesOrder.status_label}
                                </Badge>
                            </div>
                        </div>

                        <div className="mb-3">
                            <Form.Label>Yeni Durum *</Form.Label>
                            <Form.Select
                                value={data.status}
                                onChange={(e) => setData('status', e.target.value)}
                                isInvalid={!!errors.status}
                            >
                                {Object.entries(statuses).map(([key, label]) => (
                                    <option key={key} value={key}>{label}</option>
                                ))}
                            </Form.Select>
                            {errors.status && (
                                <Form.Control.Feedback type="invalid">
                                    {errors.status}
                                </Form.Control.Feedback>
                            )}
                        </div>

                        <div className="mb-3">
                            <Form.Label>Neden</Form.Label>
                            <Form.Control
                                type="text"
                                value={data.reason}
                                onChange={(e) => setData('reason', e.target.value)}
                                placeholder="Durum değişikliğinin nedeni"
                                isInvalid={!!errors.reason}
                            />
                            {errors.reason && (
                                <Form.Control.Feedback type="invalid">
                                    {errors.reason}
                                </Form.Control.Feedback>
                            )}
                        </div>

                        <div className="mb-3">
                            <Form.Label>Notlar</Form.Label>
                            <Form.Control
                                as="textarea"
                                rows={3}
                                value={data.notes}
                                onChange={(e) => setData('notes', e.target.value)}
                                placeholder="Ek notlar..."
                                isInvalid={!!errors.notes}
                            />
                            {errors.notes && (
                                <Form.Control.Feedback type="invalid">
                                    {errors.notes}
                                </Form.Control.Feedback>
                            )}
                        </div>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={() => setShowStatusModal(false)}>
                            İptal
                        </Button>
                        <Button
                            type="submit"
                            variant="primary"
                            disabled={processing}
                        >
                            {processing ? 'Güncelleniyor...' : 'Güncelle'}
                        </Button>
                    </Modal.Footer>
                </Form>
            </Modal>

            {/* Status History Modal */}
            <Modal show={showHistoryModal} onHide={() => setShowHistoryModal(false)} size="lg">
                <Modal.Header closeButton>
                    <Modal.Title>Sipariş Durum Geçmişi</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {salesOrder.status_history.length === 0 ? (
                        <div className="text-center py-4 text-muted">
                            <i className="ri-history-line fs-1 d-block mb-2"></i>
                            Henüz durum değişikliği yok
                        </div>
                    ) : (
                        <div className="timeline">
                            {salesOrder.status_history.map((history) => (
                                <div key={history.id} className="mb-4">
                                    <div className="d-flex align-items-start gap-3">
                                        <div className="flex-shrink-0">
                                            <Badge bg={getStatusBadgeVariant(history.new_status)}>
                                                {history.new_status_label}
                                            </Badge>
                                        </div>
                                        <div className="flex-grow-1">
                                            <div className="fw-medium">
                                                {history.old_status_label} → {history.new_status_label}
                                            </div>
                                            <div className="text-muted">
                                                {history.changed_by.name} • {formatDateTime(history.changed_at)}
                                            </div>
                                            {history.reason && (
                                                <div className="mt-1">
                                                    <strong>Neden:</strong> {history.reason}
                                                </div>
                                            )}
                                            {history.notes && (
                                                <div className="mt-1">
                                                    <strong>Notlar:</strong> {history.notes}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    {salesOrder.status_history.indexOf(history) < salesOrder.status_history.length - 1 && (
                                        <hr className="my-3" />
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowHistoryModal(false)}>
                        Kapat
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* Delete Confirmation Modal */}
            <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>Siparişi Sil</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Alert variant="warning">
                        <i className="ri-alert-line me-2"></i>
                        <strong>{salesOrder.order_number}</strong> numaralı siparişi silmek istediğinizden emin misiniz?
                        Bu işlem geri alınamaz.
                    </Alert>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
                        İptal
                    </Button>
                    <Button variant="danger" onClick={handleDelete}>
                        Sil
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* Email Modal */}
            <Modal show={showEmailModal} onHide={() => setShowEmailModal(false)} size="lg">
                <Modal.Header closeButton>
                    <Modal.Title>
                        <i className="ri-mail-send-line me-2"></i>
                        Siparişi Email ile Gönder
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <div className="alert alert-info mb-3">
                        <strong>Sipariş:</strong> {salesOrder.order_number} |
                        <strong className="ms-2">Müşteri:</strong> {salesOrder.customer?.title}
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
                            Müşterinin kayıtlı email adresi otomatik doldurulur.
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
                            Birden fazla adres için virgül ile ayırın.
                        </Form.Text>
                    </Form.Group>

                    <Form.Group className="mb-3">
                        <Form.Label>Mesaj (Opsiyonel)</Form.Label>
                        <Form.Control
                            as="textarea"
                            rows={4}
                            value={emailForm.message}
                            onChange={(e) => setEmailForm({ ...emailForm, message: e.target.value })}
                            placeholder="Müşteriye iletmek istediğiniz özel mesaj..."
                        />
                    </Form.Group>

                    <Form.Check
                        type="checkbox"
                        id="attach_pdf"
                        label="Sipariş PDF'ini ekle"
                        checked={emailForm.attach_pdf}
                        onChange={(e) => setEmailForm({ ...emailForm, attach_pdf: e.target.checked })}
                    />
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowEmailModal(false)}>
                        İptal
                    </Button>
                    <Button
                        variant="primary"
                        onClick={handleSendEmail}
                        disabled={emailLoading || !emailForm.email}
                    >
                        {emailLoading ? (
                            <>
                                <span className="spinner-border spinner-border-sm me-2"></span>
                                Gönderiliyor...
                            </>
                        ) : (
                            <>
                                <i className="ri-send-plane-line me-2"></i>
                                Gönder
                            </>
                        )}
                    </Button>
                </Modal.Footer>
            </Modal>
        </Layout>
    );
}
