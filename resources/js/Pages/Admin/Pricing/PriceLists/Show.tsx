import React from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { Card, Button, Row, Col, Badge, Table, Alert } from 'react-bootstrap';
import Layout from '@/Layouts';

interface CustomerGroup {
    id: number;
    name: string;
}

interface ProductPrice {
    id: number;
    product_id: number;
    product_code: string;
    product_name: string;
    product_brand?: string;
    min_quantity: number;
    max_quantity?: number;
    unit_price: number;
    discount_percent?: number;
    final_price: number;
    margin_percent?: number;
    cost_price?: number;
    is_active: boolean;
    valid_from?: string;
    valid_until?: string;
    created_at: string;
    updated_at: string;
}

interface PriceList {
    id: number;
    name: string;
    code: string;
    description?: string;
    type: string;
    currency: string;
    valid_from?: string;
    valid_until?: string;
    is_active: boolean;
    is_default: boolean;
    customer_groups?: CustomerGroup[];
    prices?: ProductPrice[];
    prices_count: number;
    created_at: string;
    updated_at: string;
}

interface Props {
    priceList: PriceList;
    types: Record<string, string>;
    currencies: Record<string, string>;
    userPermissions: {
        canEdit: boolean;
        canDelete: boolean;
        canManagePrices: boolean;
    };
}

export default function Show({ priceList, types, currencies, userPermissions }: Props) {
    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('tr-TR', {
            style: 'currency',
            currency: priceList.currency,
            minimumFractionDigits: 2
        }).format(price);
    };

    const formatDate = (dateString?: string) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString('tr-TR');
    };

    const getStatusBadge = () => {
        if (!priceList.is_active) {
            return <Badge bg="secondary">Pasif</Badge>;
        }
        if (priceList.is_default) {
            return <Badge bg="primary">Varsayılan</Badge>;
        }
        return <Badge bg="success">Aktif</Badge>;
    };

    const getTypeBadge = () => {
        const variants: Record<string, string> = {
            sale: 'primary',
            purchase: 'info',
            special: 'warning'
        };
        return <Badge bg={variants[priceList.type] || 'secondary'}>{types[priceList.type]}</Badge>;
    };

    const isValidityActive = () => {
        const now = new Date();
        const validFrom = priceList.valid_from ? new Date(priceList.valid_from) : null;
        const validUntil = priceList.valid_until ? new Date(priceList.valid_until) : null;

        if (validFrom && now < validFrom) return false;
        if (validUntil && now > validUntil) return false;
        return true;
    };

    const toggleStatus = () => {
        router.patch(route('sales.price-lists.toggle-status', priceList.id));
    };

    const setAsDefault = () => {
        router.patch(route('sales.price-lists.set-default', priceList.id));
    };

    const duplicatePriceList = () => {
        router.post(route('sales.price-lists.duplicate', priceList.id));
    };

    const deletePriceList = () => {
        if (confirm(`"${priceList.name}" fiyat listesini silmek istediğinizden emin misiniz?`)) {
            router.delete(route('sales.price-lists.destroy', priceList.id));
        }
    };

    return (
        <Layout>
            <Head title={`${priceList.name} - Fiyat Listesi`} />
            
            <div className="page-content">
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <div>
                        <h1 className="h3 mb-1">
                            <i className="ri-price-tag-3-line me-2"></i>
                            {priceList.name}
                        </h1>
                        <p className="text-muted mb-0">
                            Kod: <code>{priceList.code}</code> • Para Birimi: {priceList.currency}
                        </p>
                    </div>

                    <div className="d-flex gap-2">
                        {userPermissions.canEdit && (
                            <Link href={route('sales.price-lists.edit', priceList.id)}>
                                <Button variant="primary">
                                    <i className="ri-edit-line me-1"></i>
                                    Düzenle
                                </Button>
                            </Link>
                        )}
                        
                        <Link href={route('sales.price-lists.index')}>
                            <Button variant="outline-secondary">
                                <i className="ri-arrow-left-line me-1"></i>
                                Geri
                            </Button>
                        </Link>
                    </div>
                </div>

                <Row>
                    <Col lg={8}>
                        {/* Price List Details */}
                        <Card className="mb-4">
                            <Card.Header>
                                <h5 className="mb-0">Fiyat Listesi Detayları</h5>
                            </Card.Header>
                            <Card.Body>
                                <Row className="g-3">
                                    <Col md={6}>
                                        <strong>Fiyat Listesi Adı:</strong><br />
                                        <span>{priceList.name}</span>
                                    </Col>
                                    <Col md={6}>
                                        <strong>Fiyat Listesi Kodu:</strong><br />
                                        <code>{priceList.code}</code>
                                    </Col>
                                    <Col md={6}>
                                        <strong>Tip:</strong><br />
                                        {getTypeBadge()}
                                    </Col>
                                    <Col md={6}>
                                        <strong>Para Birimi:</strong><br />
                                        <Badge bg="outline-secondary">{priceList.currency} - {currencies[priceList.currency]}</Badge>
                                    </Col>
                                    {priceList.description && (
                                        <Col xs={12}>
                                            <strong>Açıklama:</strong><br />
                                            <span className="text-muted">{priceList.description}</span>
                                        </Col>
                                    )}
                                </Row>
                            </Card.Body>
                        </Card>

                        {/* Validity Period */}
                        <Card className="mb-4">
                            <Card.Header>
                                <h5 className="mb-0">Geçerlilik Dönemi</h5>
                            </Card.Header>
                            <Card.Body>
                                <Row className="g-3">
                                    <Col md={6}>
                                        <strong>Başlangıç Tarihi:</strong><br />
                                        <span>{formatDate(priceList.valid_from) || 'Belirtilmemiş'}</span>
                                    </Col>
                                    <Col md={6}>
                                        <strong>Bitiş Tarihi:</strong><br />
                                        <span>{formatDate(priceList.valid_until) || 'Süresiz'}</span>
                                    </Col>
                                    <Col xs={12}>
                                        {!isValidityActive() ? (
                                            <Alert variant="warning" className="mb-0">
                                                <i className="ri-alert-line me-1"></i>
                                                Bu fiyat listesi şu anda geçerlilik tarihi dışında!
                                            </Alert>
                                        ) : (
                                            <Alert variant="success" className="mb-0">
                                                <i className="ri-check-line me-1"></i>
                                                Fiyat listesi şu anda geçerli
                                            </Alert>
                                        )}
                                    </Col>
                                </Row>
                            </Card.Body>
                        </Card>

                        {/* Customer Groups */}
                        {priceList.customer_groups && priceList.customer_groups.length > 0 && (
                            <Card className="mb-4">
                                <Card.Header>
                                    <h5 className="mb-0">Atanmış Müşteri Grupları</h5>
                                </Card.Header>
                                <Card.Body>
                                    <div className="d-flex flex-wrap gap-2">
                                        {priceList.customer_groups.map((group) => (
                                            <Badge key={group.id} bg="info" className="p-2">
                                                {group.name}
                                            </Badge>
                                        ))}
                                    </div>
                                </Card.Body>
                            </Card>
                        )}

                        {/* Product Prices */}
                        <Card>
                            <Card.Header className="d-flex justify-content-between align-items-center">
                                <h5 className="mb-0">Ürün Fiyatları ({priceList.prices_count})</h5>
                                {userPermissions.canManagePrices && (
                                    <Button variant="outline-primary" size="sm">
                                        <i className="ri-add-line me-1"></i>
                                        Fiyat Ekle
                                    </Button>
                                )}
                            </Card.Header>
                            <Card.Body className="p-0">
                                {priceList.prices && priceList.prices.length > 0 ? (
                                    <div className="table-responsive">
                                        <Table className="mb-0">
                                            <thead className="table-light">
                                                <tr>
                                                    <th>Ürün</th>
                                                    <th>Miktar Aralığı</th>
                                                    <th>Birim Fiyat</th>
                                                    <th>İndirim</th>
                                                    <th>Final Fiyat</th>
                                                    <th>Geçerlilik</th>
                                                    <th>Durum</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {priceList.prices.map((price) => (
                                                    <tr key={price.id}>
                                                        <td>
                                                            <div>
                                                                <div className="fw-medium">{price.product_name}</div>
                                                                <small className="text-muted">
                                                                    {price.product_code}
                                                                    {price.product_brand && ` • ${price.product_brand}`}
                                                                </small>
                                                            </div>
                                                        </td>
                                                        <td>
                                                            {price.min_quantity}
                                                            {price.max_quantity ? ` - ${price.max_quantity}` : '+'}
                                                        </td>
                                                        <td>{formatPrice(price.unit_price)}</td>
                                                        <td>
                                                            {price.discount_percent ? `%${price.discount_percent}` : '-'}
                                                        </td>
                                                        <td className="fw-medium">{formatPrice(price.final_price)}</td>
                                                        <td>
                                                            {price.valid_from || price.valid_until ? (
                                                                <div>
                                                                    {price.valid_from && (
                                                                        <small className="d-block">
                                                                            {formatDate(price.valid_from)}
                                                                        </small>
                                                                    )}
                                                                    {price.valid_until && (
                                                                        <small className="d-block">
                                                                            - {formatDate(price.valid_until)}
                                                                        </small>
                                                                    )}
                                                                </div>
                                                            ) : (
                                                                <span className="text-muted">Süresiz</span>
                                                            )}
                                                        </td>
                                                        <td>
                                                            <Badge bg={price.is_active ? 'success' : 'secondary'}>
                                                                {price.is_active ? 'Aktif' : 'Pasif'}
                                                            </Badge>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </Table>
                                    </div>
                                ) : (
                                    <div className="text-center py-5">
                                        <i className="ri-price-tag-line fs-1 text-muted d-block mb-3"></i>
                                        <p className="text-muted mb-3">Bu fiyat listesinde henüz ürün fiyatı bulunmuyor</p>
                                        {userPermissions.canManagePrices && (
                                            <Button variant="primary">
                                                <i className="ri-add-line me-1"></i>
                                                İlk Fiyatı Ekle
                                            </Button>
                                        )}
                                    </div>
                                )}
                            </Card.Body>
                        </Card>
                    </Col>

                    <Col lg={4}>
                        {/* Status & Actions */}
                        <Card className="mb-4">
                            <Card.Header>
                                <h5 className="mb-0">Durum ve İşlemler</h5>
                            </Card.Header>
                            <Card.Body>
                                <div className="mb-3">
                                    <strong>Mevcut Durum:</strong><br />
                                    {getStatusBadge()}
                                </div>

                                <div className="d-grid gap-2">
                                    {userPermissions.canEdit && (
                                        <>
                                            <Button 
                                                variant={priceList.is_active ? "warning" : "success"}
                                                onClick={toggleStatus}
                                            >
                                                <i className={`ri-${priceList.is_active ? 'pause' : 'play'}-line me-1`}></i>
                                                {priceList.is_active ? 'Pasifleştir' : 'Aktifleştir'}
                                            </Button>

                                            {!priceList.is_default && priceList.is_active && (
                                                <Button 
                                                    variant="outline-primary"
                                                    onClick={setAsDefault}
                                                >
                                                    <i className="ri-star-line me-1"></i>
                                                    Varsayılan Yap
                                                </Button>
                                            )}

                                            <Button 
                                                variant="outline-info"
                                                onClick={duplicatePriceList}
                                            >
                                                <i className="ri-file-copy-line me-1"></i>
                                                Kopyala
                                            </Button>
                                        </>
                                    )}

                                    {userPermissions.canDelete && !priceList.is_default && priceList.prices_count === 0 && (
                                        <Button 
                                            variant="outline-danger"
                                            onClick={deletePriceList}
                                        >
                                            <i className="ri-delete-bin-line me-1"></i>
                                            Sil
                                        </Button>
                                    )}
                                </div>
                            </Card.Body>
                        </Card>

                        {/* Statistics */}
                        <Card className="mb-4">
                            <Card.Header>
                                <h6 className="mb-0">İstatistikler</h6>
                            </Card.Header>
                            <Card.Body>
                                <div className="d-flex justify-content-between mb-2">
                                    <span className="text-muted">Toplam Ürün:</span>
                                    <span className="fw-medium">{priceList.prices_count}</span>
                                </div>
                                <div className="d-flex justify-content-between mb-2">
                                    <span className="text-muted">Oluşturulma:</span>
                                    <span>{formatDate(priceList.created_at)}</span>
                                </div>
                                <div className="d-flex justify-content-between">
                                    <span className="text-muted">Son Güncelleme:</span>
                                    <span>{formatDate(priceList.updated_at)}</span>
                                </div>
                            </Card.Body>
                        </Card>

                        {/* Quick Info */}
                        <Card>
                            <Card.Header>
                                <h6 className="mb-0">Hızlı Bilgi</h6>
                            </Card.Header>
                            <Card.Body>
                                <div className="mb-3">
                                    <div className="d-flex align-items-center mb-2">
                                        <i className="ri-calendar-line me-2 text-muted"></i>
                                        <span className="text-muted">Geçerlilik:</span>
                                    </div>
                                    <div className="ms-4">
                                        {isValidityActive() ? (
                                            <Badge bg="success">Geçerli</Badge>
                                        ) : (
                                            <Badge bg="warning">Geçersiz</Badge>
                                        )}
                                    </div>
                                </div>
                                
                                <div className="mb-3">
                                    <div className="d-flex align-items-center mb-2">
                                        <i className="ri-group-line me-2 text-muted"></i>
                                        <span className="text-muted">Müşteri Grupları:</span>
                                    </div>
                                    <div className="ms-4">
                                        <Badge bg="info">
                                            {priceList.customer_groups?.length || 0} Grup
                                        </Badge>
                                    </div>
                                </div>

                                <div>
                                    <div className="d-flex align-items-center mb-2">
                                        <i className="ri-money-dollar-circle-line me-2 text-muted"></i>
                                        <span className="text-muted">Para Birimi:</span>
                                    </div>
                                    <div className="ms-4">
                                        <Badge bg="secondary">{priceList.currency}</Badge>
                                    </div>
                                </div>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>
            </div>
        </Layout>
    );
}