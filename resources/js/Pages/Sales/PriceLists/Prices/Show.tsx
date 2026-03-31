import React from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { Card, Button, Row, Col, Badge, Alert } from 'react-bootstrap';
import Layout from '@/Layouts';

interface Product {
    id: number;
    code: string;
    name: string;
    category?: {
        name: string;
    };
    brand?: {
        name: string;
    };
}

interface ProductPrice {
    id: number;
    product_id: number;
    product_code: string;
    product_name: string;
    product_brand?: string;
    category_name?: string;
    min_quantity: number;
    unit_price: number;
    discount_percent?: number;
    discount_amount?: number;
    final_price: number;
    created_at: string;
    updated_at: string;
}

interface PriceList {
    id: number;
    name: string;
    code: string;
    currency: string;
    type: string;
}

interface Props {
    priceList: PriceList;
    price: ProductPrice;
    userPermissions: {
        canEdit: boolean;
        canDelete: boolean;
    };
}

export default function Show({ priceList, price, userPermissions }: Props) {
    const formatPrice = (amount: number) => {
        return new Intl.NumberFormat('tr-TR', {
            style: 'currency',
            currency: priceList.currency,
            minimumFractionDigits: 2
        }).format(amount);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('tr-TR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const deletePrice = () => {
        if (confirm(`"${price.product_name}" ürünü için bu fiyatı silmek istediğinizden emin misiniz?`)) {
            router.delete(route('sales.price-lists.prices.destroy', [priceList.id, price.id]));
        }
    };

    return (
        <Layout>
            <Head title={`${price.product_name} - Fiyat Detayı`} />
            
            <div className="page-content">
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <div>
                        <h1 className="h3 mb-1">
                            <i className="ri-price-tag-line me-2"></i>
                            Fiyat Detayı
                        </h1>
                        <p className="text-muted mb-0">
                            <Link 
                                href={route('sales.price-lists.show', priceList.id)} 
                                className="text-decoration-none"
                            >
                                {priceList.name}
                            </Link>
                            <span className="mx-2">•</span>
                            <code>{priceList.code}</code>
                            <span className="mx-2">•</span>
                            {price.product_name}
                        </p>
                    </div>

                    <div className="d-flex gap-2">
                        {userPermissions.canEdit && (
                            <Link href={route('sales.price-lists.prices.edit', [priceList.id, price.id])}>
                                <Button variant="primary">
                                    <i className="ri-edit-line me-1"></i>
                                    Düzenle
                                </Button>
                            </Link>
                        )}
                        
                        <Link href={route('sales.price-lists.prices.index', priceList.id)}>
                            <Button variant="outline-secondary">
                                <i className="ri-arrow-left-line me-1"></i>
                                Fiyat Listesine Dön
                            </Button>
                        </Link>
                    </div>
                </div>

                <Row>
                    <Col lg={8}>
                        {/* Product Information */}
                        <Card className="mb-4">
                            <Card.Header>
                                <h5 className="mb-0">Ürün Bilgileri</h5>
                            </Card.Header>
                            <Card.Body>
                                <Row className="g-3">
                                    <Col md={6}>
                                        <strong>Ürün Adı:</strong><br />
                                        <span>{price.product_name}</span>
                                    </Col>
                                    <Col md={6}>
                                        <strong>Ürün Kodu:</strong><br />
                                        <code>{price.product_code}</code>
                                    </Col>
                                    {price.category_name && (
                                        <Col md={6}>
                                            <strong>Kategori:</strong><br />
                                            <span>{price.category_name}</span>
                                        </Col>
                                    )}
                                    {price.product_brand && (
                                        <Col md={6}>
                                            <strong>Marka:</strong><br />
                                            <span>{price.product_brand}</span>
                                        </Col>
                                    )}
                                </Row>
                            </Card.Body>
                        </Card>

                        {/* Pricing Information */}
                        <Card className="mb-4">
                            <Card.Header>
                                <h5 className="mb-0">Fiyat Bilgileri</h5>
                            </Card.Header>
                            <Card.Body>
                                <Row className="g-3">
                                    <Col md={6}>
                                        <strong>Birim Fiyat:</strong><br />
                                        <span className="fs-5 text-primary">{formatPrice(price.unit_price)}</span>
                                    </Col>
                                    <Col md={6}>
                                        <strong>Minimum Miktar:</strong><br />
                                        <span className="fs-5">{price.min_quantity}</span>
                                    </Col>
                                    
                                    {(price.discount_percent || price.discount_amount) && (
                                        <>
                                            <Col md={6}>
                                                <strong>İndirim:</strong><br />
                                                {price.discount_percent ? (
                                                    <Badge bg="warning" className="fs-6">
                                                        %{price.discount_percent} İndirim
                                                    </Badge>
                                                ) : price.discount_amount ? (
                                                    <Badge bg="warning" className="fs-6">
                                                        {formatPrice(price.discount_amount)} İndirim
                                                    </Badge>
                                                ) : null}
                                            </Col>
                                            <Col md={6}>
                                                <strong>Final Fiyat:</strong><br />
                                                <span className="fs-4 text-success fw-bold">
                                                    {formatPrice(price.final_price)}
                                                </span>
                                            </Col>
                                        </>
                                    )}
                                    
                                    {!price.discount_percent && !price.discount_amount && (
                                        <Col md={6}>
                                            <strong>Final Fiyat:</strong><br />
                                            <span className="fs-4 text-success fw-bold">
                                                {formatPrice(price.final_price)}
                                            </span>
                                        </Col>
                                    )}
                                </Row>

                                {(price.discount_percent || price.discount_amount) && (
                                    <Alert variant="info" className="mt-3 mb-0">
                                        <div className="d-flex justify-content-between align-items-center">
                                            <span>
                                                <i className="ri-calculator-line me-1"></i>
                                                İndirim Hesaplaması:
                                            </span>
                                            <div className="text-end">
                                                <small className="d-block">
                                                    {formatPrice(price.unit_price)} 
                                                    {price.discount_percent && ` - %${price.discount_percent}`}
                                                    {price.discount_amount && ` - ${formatPrice(price.discount_amount)}`}
                                                </small>
                                                <strong>{formatPrice(price.final_price)}</strong>
                                            </div>
                                        </div>
                                    </Alert>
                                )}
                            </Card.Body>
                        </Card>

                        {/* Price List Context */}
                        <Card className="mb-4">
                            <Card.Header>
                                <h5 className="mb-0">Fiyat Listesi Bilgileri</h5>
                            </Card.Header>
                            <Card.Body>
                                <Row className="g-3">
                                    <Col md={6}>
                                        <strong>Fiyat Listesi:</strong><br />
                                        <Link 
                                            href={route('sales.price-lists.show', priceList.id)}
                                            className="text-decoration-none"
                                        >
                                            {priceList.name}
                                        </Link>
                                    </Col>
                                    <Col md={6}>
                                        <strong>Liste Kodu:</strong><br />
                                        <code>{priceList.code}</code>
                                    </Col>
                                    <Col md={6}>
                                        <strong>Para Birimi:</strong><br />
                                        <Badge bg="secondary">{priceList.currency}</Badge>
                                    </Col>
                                    <Col md={6}>
                                        <strong>Liste Tipi:</strong><br />
                                        <Badge bg="primary">
                                            {priceList.type === 'sale' ? 'Satış' :
                                             priceList.type === 'purchase' ? 'Alış' : 'Özel'}
                                        </Badge>
                                    </Col>
                                </Row>
                            </Card.Body>
                        </Card>
                    </Col>

                    <Col lg={4}>
                        {/* Actions */}
                        <Card className="mb-4">
                            <Card.Header>
                                <h5 className="mb-0">İşlemler</h5>
                            </Card.Header>
                            <Card.Body>
                                <div className="d-grid gap-2">
                                    {userPermissions.canEdit && (
                                        <Link href={route('sales.price-lists.prices.edit', [priceList.id, price.id])}>
                                            <Button variant="primary" className="w-100">
                                                <i className="ri-edit-line me-1"></i>
                                                Fiyatı Düzenle
                                            </Button>
                                        </Link>
                                    )}

                                    <Link href={route('sales.price-lists.prices.index', priceList.id)}>
                                        <Button variant="outline-info" className="w-100">
                                            <i className="ri-list-check me-1"></i>
                                            Tüm Fiyatlar
                                        </Button>
                                    </Link>

                                    <Link href={route('sales.price-lists.show', priceList.id)}>
                                        <Button variant="outline-secondary" className="w-100">
                                            <i className="ri-price-tag-3-line me-1"></i>
                                            Fiyat Listesi
                                        </Button>
                                    </Link>

                                    {userPermissions.canDelete && (
                                        <>
                                            <hr className="my-2" />
                                            <Button 
                                                variant="outline-danger" 
                                                className="w-100"
                                                onClick={deletePrice}
                                            >
                                                <i className="ri-delete-bin-line me-1"></i>
                                                Fiyatı Sil
                                            </Button>
                                        </>
                                    )}
                                </div>
                            </Card.Body>
                        </Card>

                        {/* Price History */}
                        <Card>
                            <Card.Header>
                                <h5 className="mb-0">Fiyat Geçmişi</h5>
                            </Card.Header>
                            <Card.Body>
                                <div className="d-flex justify-content-between mb-2">
                                    <span className="text-muted">Oluşturulma:</span>
                                    <span>{formatDate(price.created_at)}</span>
                                </div>
                                <div className="d-flex justify-content-between">
                                    <span className="text-muted">Son Güncelleme:</span>
                                    <span>{formatDate(price.updated_at)}</span>
                                </div>
                                
                                {price.created_at !== price.updated_at && (
                                    <Alert variant="info" className="mt-3 mb-0">
                                        <small>
                                            <i className="ri-time-line me-1"></i>
                                            Bu fiyat {formatDate(price.updated_at)} tarihinde güncellenmiştir.
                                        </small>
                                    </Alert>
                                )}
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>
            </div>
        </Layout>
    );
}