import { Head, Link, router } from '@inertiajs/react';
import Layout from '@/Layouts';
import { Card, Row, Col, Button, Badge, Table, ProgressBar } from 'react-bootstrap';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

interface Discount {
    id: number;
    name: string;
    code: string;
    description: string | null;
    type: string;
    type_label: string;
    calculation_type: string;
    calculation_type_label: string;
    discount_value: number;
    min_purchase_amount: number | null;
    max_discount_amount: number | null;
    start_date: string | null;
    end_date: string | null;
    is_active: boolean;
    status: string;
    status_label: string;
    priority: number;
    can_combine: boolean;
    applies_to_discounted_products: boolean;
    requires_cash_payment: boolean;
    auto_apply: boolean;
    show_on_invoice: boolean;
    show_on_website: boolean;
    usage_count: number;
    usage_limit: number | null;
    usage_limit_per_customer: number | null;
    application_count: number;
    total_discount_given: number;
    total_revenue: number;
    days_remaining: number | null;
    usage_percentage: number;
    quantity_tiers: Array<{ min_qty: number; max_qty: number; discount: number }> | null;
    notes: string | null;
    created_at: string;
    creator?: { name: string };
    updater?: { name: string };
}

interface UsageStats {
    total_usages: number;
    unique_customers: number;
    total_revenue: number;
    total_discount_given: number;
    average_discount: number;
}

interface DailyUsage {
    date: string;
    count: number;
    total_discount: number;
}

interface DiscountUsage {
    id: number;
    discount_amount: number;
    order_amount: number;
    quantity: number | null;
    created_at: string;
    customer?: { title: string };
    sales_order?: { order_number: string };
    user?: { name: string };
}

interface Props {
    discount: Discount;
    usageStats: UsageStats;
    dailyUsage: DailyUsage[];
    recentUsages: DiscountUsage[];
}

export default function Show({ discount, usageStats, dailyUsage, recentUsages }: Props) {
    const handleToggleStatus = () => {
        router.patch(route('sales.discounts.toggle-status', discount.id), {}, {
            preserveScroll: true,
        });
    };

    const handleDuplicate = () => {
        if (confirm('Bu iskonto kopyalanacak. Devam etmek istiyor musunuz?')) {
            router.post(route('sales.discounts.duplicate', discount.id));
        }
    };

    const handleDelete = () => {
        if (confirm('Bu iskonto silinecek. Bu işlem geri alınamaz. Devam etmek istiyor musunuz?')) {
            router.delete(route('sales.discounts.destroy', discount.id), {
                onSuccess: () => router.visit(route('sales.discounts.index')),
            });
        }
    };

    const getStatusBadge = (status: string) => {
        const badges: { [key: string]: string } = {
            draft: 'secondary',
            active: 'success',
            inactive: 'warning',
            expired: 'danger',
        };
        return badges[status] || 'secondary';
    };

    return (
        <Layout>
            <Head title={`İskonto Detayı - ${discount.name}`} />

            <div className="page-content">
                <div className="container-fluid">
                    {/* Page Title */}
                    <Row className="mb-3">
                        <Col xs={12}>
                            <div className="page-title-box d-sm-flex align-items-center justify-content-between">
                                <h4 className="mb-sm-0">İskonto Detayı</h4>
                                <div className="page-title-right">
                                    <Link href={route('sales.discounts.index')}>
                                        <Button variant="secondary" size="sm" className="me-2">
                                            <i className="ri-arrow-left-line align-bottom me-1"></i>
                                            Geri Dön
                                        </Button>
                                    </Link>
                                    <Link href={route('sales.discounts.edit', discount.id)}>
                                        <Button variant="primary" size="sm" className="me-2">
                                            <i className="ri-pencil-line align-bottom me-1"></i>
                                            Düzenle
                                        </Button>
                                    </Link>
                                    <Button
                                        variant={discount.is_active ? 'warning' : 'success'}
                                        size="sm"
                                        onClick={handleToggleStatus}
                                        className="me-2"
                                    >
                                        <i className="ri-toggle-line align-bottom me-1"></i>
                                        {discount.is_active ? 'Pasifleştir' : 'Aktifleştir'}
                                    </Button>
                                </div>
                            </div>
                        </Col>
                    </Row>

                    <Row>
                        <Col lg={8}>
                            {/* Discount Info */}
                            <Card>
                                <Card.Header>
                                    <div className="d-flex align-items-center justify-content-between">
                                        <h5 className="card-title mb-0">İskonto Bilgileri</h5>
                                        <div>
                                            <Badge bg={getStatusBadge(discount.status)} className="me-2">
                                                {discount.status_label}
                                            </Badge>
                                            {discount.is_active && (
                                                <Badge bg="success">
                                                    <i className="ri-checkbox-circle-line me-1"></i>
                                                    Aktif
                                                </Badge>
                                            )}
                                        </div>
                                    </div>
                                </Card.Header>
                                <Card.Body>
                                    <Row className="mb-3">
                                        <Col md={6}>
                                            <div className="mb-3">
                                                <label className="form-label text-muted">İskonto Adı</label>
                                                <p className="fw-semibold">{discount.name}</p>
                                            </div>
                                            <div className="mb-3">
                                                <label className="form-label text-muted">İskonto Kodu</label>
                                                <p className="fw-semibold">{discount.code}</p>
                                            </div>
                                            <div className="mb-3">
                                                <label className="form-label text-muted">İskonto Tipi</label>
                                                <p>
                                                    <Badge bg="primary">{discount.type_label}</Badge>
                                                </p>
                                            </div>
                                        </Col>
                                        <Col md={6}>
                                            <div className="mb-3">
                                                <label className="form-label text-muted">Hesaplama Türü</label>
                                                <p className="fw-semibold">{discount.calculation_type_label}</p>
                                            </div>
                                            <div className="mb-3">
                                                <label className="form-label text-muted">İskonto Değeri</label>
                                                <p className="fw-semibold text-primary fs-18">
                                                    {discount.calculation_type === 'percentage'
                                                        ? `%${discount.discount_value}`
                                                        : `₺${discount.discount_value.toLocaleString('tr-TR')}`}
                                                </p>
                                            </div>
                                            <div className="mb-3">
                                                <label className="form-label text-muted">Öncelik</label>
                                                <p>
                                                    <Badge bg="dark">{discount.priority}</Badge>
                                                </p>
                                            </div>
                                        </Col>
                                    </Row>

                                    {discount.description && (
                                        <Row className="mb-3">
                                            <Col>
                                                <label className="form-label text-muted">Açıklama</label>
                                                <p>{discount.description}</p>
                                            </Col>
                                        </Row>
                                    )}

                                    <Row>
                                        <Col md={6}>
                                            {discount.min_purchase_amount && (
                                                <div className="mb-3">
                                                    <label className="form-label text-muted">Minimum Alışveriş Tutarı</label>
                                                    <p>₺{discount.min_purchase_amount.toLocaleString('tr-TR')}</p>
                                                </div>
                                            )}
                                        </Col>
                                        <Col md={6}>
                                            {discount.max_discount_amount && (
                                                <div className="mb-3">
                                                    <label className="form-label text-muted">Maksimum İskonto Tutarı</label>
                                                    <p>₺{discount.max_discount_amount.toLocaleString('tr-TR')}</p>
                                                </div>
                                            )}
                                        </Col>
                                    </Row>

                                    <Row>
                                        <Col md={6}>
                                            {discount.start_date && (
                                                <div className="mb-3">
                                                    <label className="form-label text-muted">Başlangıç Tarihi</label>
                                                    <p>{format(new Date(discount.start_date), 'dd MMMM yyyy HH:mm', { locale: tr })}</p>
                                                </div>
                                            )}
                                        </Col>
                                        <Col md={6}>
                                            {discount.end_date && (
                                                <div className="mb-3">
                                                    <label className="form-label text-muted">Bitiş Tarihi</label>
                                                    <p>
                                                        {format(new Date(discount.end_date), 'dd MMMM yyyy HH:mm', { locale: tr })}
                                                        {discount.days_remaining !== null && discount.days_remaining >= 0 && (
                                                            <Badge bg="warning" className="ms-2">
                                                                {discount.days_remaining} gün kaldı
                                                            </Badge>
                                                        )}
                                                    </p>
                                                </div>
                                            )}
                                        </Col>
                                    </Row>

                                    <Row>
                                        <Col>
                                            <div className="d-flex flex-wrap gap-3">
                                                {discount.can_combine && (
                                                    <div>
                                                        <i className="ri-stack-line text-info me-1"></i>
                                                        <span className="text-muted">Kombine Edilebilir</span>
                                                    </div>
                                                )}
                                                {discount.auto_apply && (
                                                    <div>
                                                        <i className="ri-flashlight-line text-warning me-1"></i>
                                                        <span className="text-muted">Otomatik Uygula</span>
                                                    </div>
                                                )}
                                                {discount.requires_cash_payment && (
                                                    <div>
                                                        <i className="ri-money-dollar-circle-line text-success me-1"></i>
                                                        <span className="text-muted">Nakit Ödeme Gerekli</span>
                                                    </div>
                                                )}
                                                {discount.show_on_invoice && (
                                                    <div>
                                                        <i className="ri-file-text-line text-primary me-1"></i>
                                                        <span className="text-muted">Faturada Göster</span>
                                                    </div>
                                                )}
                                                {discount.show_on_website && (
                                                    <div>
                                                        <i className="ri-global-line text-info me-1"></i>
                                                        <span className="text-muted">Web Sitesinde Göster</span>
                                                    </div>
                                                )}
                                                {discount.applies_to_discounted_products && (
                                                    <div>
                                                        <i className="ri-percent-line text-danger me-1"></i>
                                                        <span className="text-muted">İndirimli Ürünlere Uygulanır</span>
                                                    </div>
                                                )}
                                            </div>
                                        </Col>
                                    </Row>

                                    {discount.quantity_tiers && discount.quantity_tiers.length > 0 && (
                                        <Row className="mt-3">
                                            <Col>
                                                <label className="form-label text-muted">Miktar Basamakları</label>
                                                <Table size="sm" bordered>
                                                    <thead>
                                                        <tr>
                                                            <th>Min. Miktar</th>
                                                            <th>Maks. Miktar</th>
                                                            <th>İskonto</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {discount.quantity_tiers.map((tier, index) => (
                                                            <tr key={index}>
                                                                <td>{tier.min_qty}</td>
                                                                <td>{tier.max_qty}</td>
                                                                <td>
                                                                    {discount.calculation_type === 'percentage'
                                                                        ? `%${tier.discount}`
                                                                        : `₺${tier.discount.toLocaleString('tr-TR')}`}
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </Table>
                                            </Col>
                                        </Row>
                                    )}

                                    {discount.notes && (
                                        <Row className="mt-3">
                                            <Col>
                                                <label className="form-label text-muted">Notlar</label>
                                                <p className="text-muted">{discount.notes}</p>
                                            </Col>
                                        </Row>
                                    )}
                                </Card.Body>
                            </Card>

                            {/* Recent Usages */}
                            <Card>
                                <Card.Header>
                                    <h5 className="card-title mb-0">Son Kullanımlar</h5>
                                </Card.Header>
                                <Card.Body>
                                    <div className="table-responsive">
                                        <Table className="table-hover mb-0">
                                            <thead className="table-light">
                                                <tr>
                                                    <th>Tarih</th>
                                                    <th>Müşteri</th>
                                                    <th>Sipariş</th>
                                                    <th>Miktar</th>
                                                    <th>İskonto</th>
                                                    <th>Kullanıcı</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {recentUsages.length > 0 ? (
                                                    recentUsages.map((usage) => (
                                                        <tr key={usage.id}>
                                                            <td>
                                                                <small>
                                                                    {format(new Date(usage.created_at), 'dd MMM yyyy HH:mm', { locale: tr })}
                                                                </small>
                                                            </td>
                                                            <td>{usage.customer?.title}</td>
                                                            <td>{usage.sales_order?.order_number}</td>
                                                            <td>
                                                                ₺{usage.order_amount.toLocaleString('tr-TR', {
                                                                    minimumFractionDigits: 2,
                                                                })}
                                                            </td>
                                                            <td className="text-success fw-medium">
                                                                -₺{usage.discount_amount.toLocaleString('tr-TR', {
                                                                    minimumFractionDigits: 2,
                                                                })}
                                                            </td>
                                                            <td>
                                                                <small className="text-muted">{usage.user?.name}</small>
                                                            </td>
                                                        </tr>
                                                    ))
                                                ) : (
                                                    <tr>
                                                        <td colSpan={6} className="text-center text-muted py-3">
                                                            Henüz kullanım bulunmamaktadır.
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </Table>
                                    </div>
                                </Card.Body>
                            </Card>
                        </Col>

                        <Col lg={4}>
                            {/* Statistics */}
                            <Card className="card-animate">
                                <Card.Header>
                                    <h5 className="card-title mb-0">İstatistikler</h5>
                                </Card.Header>
                                <Card.Body>
                                    <div className="mb-4">
                                        <p className="text-muted mb-2">Kullanım Limiti</p>
                                        <div className="d-flex align-items-center">
                                            <div className="flex-grow-1">
                                                <h4 className="mb-0">
                                                    {discount.usage_count} / {discount.usage_limit || '∞'}
                                                </h4>
                                            </div>
                                        </div>
                                        {discount.usage_limit && (
                                            <ProgressBar
                                                now={discount.usage_percentage}
                                                className="mt-2"
                                                variant={
                                                    discount.usage_percentage >= 90
                                                        ? 'danger'
                                                        : discount.usage_percentage >= 70
                                                            ? 'warning'
                                                            : 'success'
                                                }
                                            />
                                        )}
                                    </div>

                                    <div className="mb-4">
                                        <p className="text-muted mb-2">Toplam Uygulama</p>
                                        <h4 className="mb-0">{usageStats.total_usages.toLocaleString()}</h4>
                                    </div>

                                    <div className="mb-4">
                                        <p className="text-muted mb-2">Benzersiz Müşteri</p>
                                        <h4 className="mb-0">{usageStats.unique_customers.toLocaleString()}</h4>
                                    </div>

                                    <div className="mb-4">
                                        <p className="text-muted mb-2">Verilen Toplam İskonto</p>
                                        <h4 className="mb-0 text-danger">
                                            ₺{usageStats.total_discount_given.toLocaleString('tr-TR', {
                                                minimumFractionDigits: 2,
                                            })}
                                        </h4>
                                    </div>

                                    <div className="mb-4">
                                        <p className="text-muted mb-2">Toplam Gelir</p>
                                        <h4 className="mb-0 text-success">
                                            ₺{usageStats.total_revenue.toLocaleString('tr-TR', {
                                                minimumFractionDigits: 2,
                                            })}
                                        </h4>
                                    </div>

                                    <div className="mb-4">
                                        <p className="text-muted mb-2">Ortalama İskonto</p>
                                        <h4 className="mb-0">
                                            ₺{(usageStats.average_discount || 0).toLocaleString('tr-TR', {
                                                minimumFractionDigits: 2,
                                            })}
                                        </h4>
                                    </div>
                                </Card.Body>
                            </Card>

                            {/* Actions */}
                            <Card>
                                <Card.Header>
                                    <h5 className="card-title mb-0">İşlemler</h5>
                                </Card.Header>
                                <Card.Body>
                                    <div className="d-grid gap-2">
                                        <Button variant="warning" onClick={handleToggleStatus}>
                                            <i className="ri-toggle-line me-1"></i>
                                            {discount.is_active ? 'Pasifleştir' : 'Aktifleştir'}
                                        </Button>
                                        <Button variant="info" onClick={handleDuplicate}>
                                            <i className="ri-file-copy-line me-1"></i>
                                            Kopyala
                                        </Button>
                                        <Button variant="danger" onClick={handleDelete}>
                                            <i className="ri-delete-bin-line me-1"></i>
                                            Sil
                                        </Button>
                                    </div>

                                    {discount.creator && (
                                        <div className="mt-4 pt-3 border-top">
                                            <p className="text-muted mb-1">
                                                <small>Oluşturan: {discount.creator.name}</small>
                                            </p>
                                            <p className="text-muted mb-0">
                                                <small>
                                                    {format(new Date(discount.created_at), 'dd MMMM yyyy HH:mm', {
                                                        locale: tr,
                                                    })}
                                                </small>
                                            </p>
                                        </div>
                                    )}
                                </Card.Body>
                            </Card>
                        </Col>
                    </Row>
                </div>
            </div>
        </Layout>
    );
}
