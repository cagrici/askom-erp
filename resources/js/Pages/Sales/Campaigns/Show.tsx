import React from 'react';
import { Head, Link } from '@inertiajs/react';
import { Card, Table, Button, Row, Col, Badge, ProgressBar } from 'react-bootstrap';
import Layout from '@/Layouts';

interface Campaign {
    id: number;
    name: string;
    code: string;
    description: string;
    type: string;
    type_label: string;
    target_type: string;
    target_type_label: string;
    start_date: string;
    end_date: string;
    status: string;
    status_label: string;
    is_active: boolean;
    discount_value: number;
    min_purchase_amount: number;
    max_discount_amount: number;
    buy_quantity: number;
    get_quantity: number;
    usage_limit: number | null;
    usage_limit_per_customer: number | null;
    usage_count: number;
    coupon_code: string | null;
    requires_coupon: boolean;
    can_stack: boolean;
    show_on_website: boolean;
    terms_conditions: string;
    notes: string;
    creator?: {
        name: string;
    };
    updater?: {
        name: string;
    };
    gift_product?: {
        name: string;
        product_code: string;
    };
    gift_quantity: number;
    usages: Array<{
        id: number;
        order_amount: number;
        discount_amount: number;
        coupon_code: string;
        customer: {
            title: string;
        };
        sales_order?: {
            order_number: string;
        };
        created_at: string;
    }>;
}

interface UsageStats {
    total_usage: number;
    usage_limit: number | null;
    usage_percentage: number;
    total_revenue: number;
    total_discount_given: number;
    average_discount: number;
    days_remaining: number;
    is_currently_active: boolean;
}

interface Props {
    campaign: Campaign;
    usageStats: UsageStats;
    dailyUsage: Array<{
        date: string;
        count: number;
        total_discount: number;
    }>;
}

export default function Show({ campaign, usageStats, dailyUsage }: Props) {
    const getStatusColor = (status: string) => {
        const colors: Record<string, string> = {
            draft: 'secondary',
            scheduled: 'info',
            active: 'success',
            paused: 'warning',
            expired: 'danger',
            completed: 'primary',
        };
        return colors[status] || 'secondary';
    };

    const getTypeColor = (type: string) => {
        const colors: Record<string, string> = {
            discount_percentage: 'primary',
            discount_amount: 'success',
            buy_x_get_y: 'info',
            free_shipping: 'warning',
            bundle: 'danger',
            gift: 'pink',
            cashback: 'purple',
        };
        return colors[type] || 'secondary';
    };

    return (
        <Layout>
            <Head title={`Kampanya Detayı - ${campaign.name}`} />

            <div className="page-content">
                <div className="container-fluid">
                    <Row className="mb-3">
                        <Col>
                            <div className="page-title-box d-sm-flex align-items-center justify-content-between">
                                <h4 className="mb-sm-0">Kampanya Detayı: {campaign.name}</h4>
                                <div className="page-title-right d-flex gap-2">
                                    <Link href={route('sales.campaigns.index')}>
                                        <Button variant="secondary" size="sm">
                                            <i className="ri-arrow-left-line me-1"></i>
                                            Geri Dön
                                        </Button>
                                    </Link>
                                    <Link href={route('sales.campaigns.edit', campaign.id)}>
                                        <Button variant="primary" size="sm">
                                            <i className="ri-edit-line me-1"></i>
                                            Düzenle
                                        </Button>
                                    </Link>
                                </div>
                            </div>
                        </Col>
                    </Row>

                    <Row>
                        <Col lg={8}>
                            {/* Campaign Info */}
                            <Card className="mb-3">
                                <Card.Header className="d-flex justify-content-between align-items-center">
                                    <h5 className="card-title mb-0">Kampanya Bilgileri</h5>
                                    <div className="d-flex gap-2">
                                        <Badge bg={getStatusColor(campaign.status)} className="fs-6">
                                            {campaign.status_label}
                                        </Badge>
                                        <Badge bg={campaign.is_active ? 'success' : 'secondary'} className="fs-6">
                                            {campaign.is_active ? 'Aktif' : 'Pasif'}
                                        </Badge>
                                    </div>
                                </Card.Header>
                                <Card.Body>
                                    <Row>
                                        <Col md={6}>
                                            <p className="mb-2">
                                                <strong>Kampanya Adı:</strong> {campaign.name}
                                            </p>
                                            <p className="mb-2">
                                                <strong>Kampanya Kodu:</strong> {campaign.code}
                                            </p>
                                            <p className="mb-2">
                                                <strong>Kampanya Tipi:</strong>{' '}
                                                <Badge bg={getTypeColor(campaign.type)}>
                                                    {campaign.type_label}
                                                </Badge>
                                            </p>
                                            <p className="mb-2">
                                                <strong>Hedef:</strong> {campaign.target_type_label}
                                            </p>
                                        </Col>
                                        <Col md={6}>
                                            <p className="mb-2">
                                                <strong>Başlangıç Tarihi:</strong>{' '}
                                                {new Date(campaign.start_date).toLocaleString('tr-TR')}
                                            </p>
                                            <p className="mb-2">
                                                <strong>Bitiş Tarihi:</strong>{' '}
                                                {new Date(campaign.end_date).toLocaleString('tr-TR')}
                                            </p>
                                            {usageStats.is_currently_active && (
                                                <p className="mb-2">
                                                    <strong className="text-success">
                                                        <i className="ri-time-line me-1"></i>
                                                        {usageStats.days_remaining} gün kaldı
                                                    </strong>
                                                </p>
                                            )}
                                            {campaign.creator && (
                                                <p className="mb-2">
                                                    <strong>Oluşturan:</strong> {campaign.creator.name}
                                                </p>
                                            )}
                                        </Col>
                                    </Row>

                                    {campaign.description && (
                                        <>
                                            <hr />
                                            <Row>
                                                <Col>
                                                    <strong>Açıklama:</strong>
                                                    <p className="mt-2">{campaign.description}</p>
                                                </Col>
                                            </Row>
                                        </>
                                    )}

                                    <hr />

                                    {/* Discount Configuration */}
                                    <Row>
                                        <Col md={6}>
                                            {campaign.discount_value && (
                                                <p className="mb-2">
                                                    <strong>İndirim Değeri:</strong>{' '}
                                                    {campaign.type === 'discount_percentage'
                                                        ? `%${campaign.discount_value}`
                                                        : `₺${Number(campaign.discount_value).toLocaleString('tr-TR', {
                                                              minimumFractionDigits: 2,
                                                          })}`}
                                                </p>
                                            )}
                                            {campaign.min_purchase_amount > 0 && (
                                                <p className="mb-2">
                                                    <strong>Min. Alışveriş Tutarı:</strong> ₺
                                                    {Number(campaign.min_purchase_amount).toLocaleString('tr-TR', {
                                                        minimumFractionDigits: 2,
                                                    })}
                                                </p>
                                            )}
                                            {campaign.max_discount_amount > 0 && (
                                                <p className="mb-2">
                                                    <strong>Maks. İndirim Tutarı:</strong> ₺
                                                    {Number(campaign.max_discount_amount).toLocaleString('tr-TR', {
                                                        minimumFractionDigits: 2,
                                                    })}
                                                </p>
                                            )}
                                        </Col>
                                        <Col md={6}>
                                            {campaign.type === 'buy_x_get_y' && (
                                                <>
                                                    <p className="mb-2">
                                                        <strong>Alınacak Miktar:</strong> {campaign.buy_quantity}
                                                    </p>
                                                    <p className="mb-2">
                                                        <strong>Ödenecek Miktar:</strong> {campaign.get_quantity}
                                                    </p>
                                                </>
                                            )}
                                            {campaign.type === 'gift' && campaign.gift_product && (
                                                <>
                                                    <p className="mb-2">
                                                        <strong>Hediye Ürün:</strong> {campaign.gift_product.name}
                                                    </p>
                                                    <p className="mb-2">
                                                        <strong>Hediye Miktarı:</strong> {campaign.gift_quantity}
                                                    </p>
                                                </>
                                            )}
                                        </Col>
                                    </Row>

                                    {/* Coupon Code */}
                                    {campaign.requires_coupon && campaign.coupon_code && (
                                        <>
                                            <hr />
                                            <Row>
                                                <Col>
                                                    <div className="alert alert-info mb-0">
                                                        <i className="ri-ticket-line me-2"></i>
                                                        <strong>Kupon Kodu:</strong>
                                                        <code className="ms-2">{campaign.coupon_code}</code>
                                                    </div>
                                                </Col>
                                            </Row>
                                        </>
                                    )}

                                    {/* Additional Settings */}
                                    <hr />
                                    <Row>
                                        <Col md={6}>
                                            <p className="mb-2">
                                                <strong>Diğer Kampanyalarla Kullanılabilir:</strong>{' '}
                                                {campaign.can_stack ? (
                                                    <Badge bg="success">Evet</Badge>
                                                ) : (
                                                    <Badge bg="secondary">Hayır</Badge>
                                                )}
                                            </p>
                                            <p className="mb-2">
                                                <strong>Web Sitesinde Göster:</strong>{' '}
                                                {campaign.show_on_website ? (
                                                    <Badge bg="success">Evet</Badge>
                                                ) : (
                                                    <Badge bg="secondary">Hayır</Badge>
                                                )}
                                            </p>
                                        </Col>
                                        <Col md={6}>
                                            {campaign.usage_limit && (
                                                <p className="mb-2">
                                                    <strong>Toplam Kullanım Limiti:</strong> {campaign.usage_limit}
                                                </p>
                                            )}
                                            {campaign.usage_limit_per_customer && (
                                                <p className="mb-2">
                                                    <strong>Müşteri Başına Limit:</strong>{' '}
                                                    {campaign.usage_limit_per_customer}
                                                </p>
                                            )}
                                        </Col>
                                    </Row>
                                </Card.Body>
                            </Card>

                            {/* Usage History */}
                            <Card>
                                <Card.Header>
                                    <h5 className="card-title mb-0">Kullanım Geçmişi</h5>
                                </Card.Header>
                                <Card.Body>
                                    {campaign.usages.length > 0 ? (
                                        <div className="table-responsive">
                                            <Table hover className="mb-0">
                                                <thead className="table-light">
                                                    <tr>
                                                        <th>Tarih</th>
                                                        <th>Müşteri</th>
                                                        <th>Sipariş No</th>
                                                        <th className="text-end">Sipariş Tutarı</th>
                                                        <th className="text-end">İndirim</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {campaign.usages.map((usage) => (
                                                        <tr key={usage.id}>
                                                            <td>
                                                                {new Date(usage.created_at).toLocaleString('tr-TR')}
                                                            </td>
                                                            <td>{usage.customer.title}</td>
                                                            <td>
                                                                {usage.sales_order ? (
                                                                    <Link
                                                                        href={route(
                                                                            'sales.orders.show',
                                                                            usage.sales_order.id
                                                                        )}
                                                                        className="text-primary"
                                                                    >
                                                                        {usage.sales_order.order_number}
                                                                    </Link>
                                                                ) : (
                                                                    '-'
                                                                )}
                                                            </td>
                                                            <td className="text-end">
                                                                ₺{Number(usage.order_amount).toLocaleString('tr-TR', {
                                                                    minimumFractionDigits: 2,
                                                                })}
                                                            </td>
                                                            <td className="text-end text-danger">
                                                                -₺{Number(usage.discount_amount).toLocaleString('tr-TR', {
                                                                    minimumFractionDigits: 2,
                                                                })}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </Table>
                                        </div>
                                    ) : (
                                        <div className="text-center text-muted py-4">
                                            <i className="ri-inbox-line fs-1 d-block mb-2"></i>
                                            Henüz kullanım bulunmuyor
                                        </div>
                                    )}
                                </Card.Body>
                            </Card>
                        </Col>

                        <Col lg={4}>
                            {/* Statistics */}
                            <Card className="mb-3">
                                <Card.Header>
                                    <h5 className="card-title mb-0">İstatistikler</h5>
                                </Card.Header>
                                <Card.Body>
                                    <div className="mb-3">
                                        <p className="text-muted mb-1">Toplam Kullanım</p>
                                        <h4 className="mb-0">
                                            {usageStats.total_usage}
                                            {usageStats.usage_limit && ` / ${usageStats.usage_limit}`}
                                        </h4>
                                        {usageStats.usage_limit && (
                                            <ProgressBar
                                                now={usageStats.usage_percentage}
                                                className="mt-2"
                                                variant={
                                                    usageStats.usage_percentage >= 90
                                                        ? 'danger'
                                                        : usageStats.usage_percentage >= 70
                                                        ? 'warning'
                                                        : 'success'
                                                }
                                            />
                                        )}
                                    </div>

                                    <hr />

                                    <div className="mb-3">
                                        <p className="text-muted mb-1">Toplam Gelir</p>
                                        <h4 className="mb-0 text-success">
                                            ₺{Number(usageStats.total_revenue).toLocaleString('tr-TR', {
                                                minimumFractionDigits: 2,
                                            })}
                                        </h4>
                                    </div>

                                    <hr />

                                    <div className="mb-3">
                                        <p className="text-muted mb-1">Verilen Toplam İndirim</p>
                                        <h4 className="mb-0 text-danger">
                                            ₺{Number(usageStats.total_discount_given).toLocaleString('tr-TR', {
                                                minimumFractionDigits: 2,
                                            })}
                                        </h4>
                                    </div>

                                    <hr />

                                    <div className="mb-0">
                                        <p className="text-muted mb-1">Ortalama İndirim</p>
                                        <h4 className="mb-0">
                                            ₺{Number(usageStats.average_discount).toLocaleString('tr-TR', {
                                                minimumFractionDigits: 2,
                                            })}
                                        </h4>
                                    </div>
                                </Card.Body>
                            </Card>

                            {/* Notes */}
                            {campaign.notes && (
                                <Card>
                                    <Card.Header>
                                        <h5 className="card-title mb-0">Notlar</h5>
                                    </Card.Header>
                                    <Card.Body>
                                        <p className="mb-0">{campaign.notes}</p>
                                    </Card.Body>
                                </Card>
                            )}
                        </Col>
                    </Row>
                </div>
            </div>
        </Layout>
    );
}
