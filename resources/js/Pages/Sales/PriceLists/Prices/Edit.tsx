import React, { useState } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import { Card, Form, Button, Row, Col, Alert } from 'react-bootstrap';
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
    price: number;
    min_quantity: number;
    discount_percentage?: number;
    discount_amount?: number;
    product: Product;
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
}

export default function Edit({ priceList, price }: Props) {
    const { data, setData, put, processing, errors } = useForm({
        price: price.price.toString(),
        min_quantity: price.min_quantity.toString(),
        discount_percentage: price.discount_percentage?.toString() || '',
        discount_amount: price.discount_amount?.toString() || ''
    });

    const [discountType, setDiscountType] = useState<'percentage' | 'amount'>(
        price.discount_percentage ? 'percentage' : 'amount'
    );

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        // Clear the other discount field based on selected type
        const submitData = {
            ...data,
            discount_percentage: discountType === 'percentage' ? data.discount_percentage : '',
            discount_amount: discountType === 'amount' ? data.discount_amount : ''
        };

        put(route('sales.price-lists.prices.update', [priceList.id, price.id]), {
            data: submitData
        });
    };

    const calculateFinalPrice = () => {
        const basePrice = parseFloat(data.price) || 0;
        
        if (discountType === 'percentage' && data.discount_percentage) {
            const discountPercent = parseFloat(data.discount_percentage) || 0;
            return basePrice * (1 - discountPercent / 100);
        }
        
        if (discountType === 'amount' && data.discount_amount) {
            const discountAmount = parseFloat(data.discount_amount) || 0;
            return Math.max(0, basePrice - discountAmount);
        }
        
        return basePrice;
    };

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('tr-TR', {
            style: 'currency',
            currency: priceList.currency,
            minimumFractionDigits: 2
        }).format(price);
    };

    return (
        <Layout>
            <Head title={`Fiyat Düzenle - ${price.product.name}`} />
            
            <div className="page-content">
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <div>
                        <h1 className="h3 mb-1">
                            <i className="ri-edit-line me-2"></i>
                            Fiyat Düzenle
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
                            {price.product.name}
                        </p>
                    </div>

                    <div className="d-flex gap-2">
                        <Link href={route('sales.price-lists.prices.show', [priceList.id, price.id])}>
                            <Button variant="outline-info">
                                <i className="ri-eye-line me-1"></i>
                                Görüntüle
                            </Button>
                        </Link>
                        
                        <Link href={route('sales.price-lists.prices.index', priceList.id)}>
                            <Button variant="outline-secondary">
                                <i className="ri-arrow-left-line me-1"></i>
                                Geri
                            </Button>
                        </Link>
                    </div>
                </div>

                <Form onSubmit={handleSubmit}>
                    <Row>
                        <Col lg={8}>
                            <Card className="mb-4">
                                <Card.Header>
                                    <h5 className="mb-0">Ürün Bilgisi</h5>
                                </Card.Header>
                                <Card.Body>
                                    <div className="d-flex align-items-center p-3 bg-light rounded">
                                        <div className="me-3">
                                            <i className="ri-price-tag-3-line fs-2 text-primary"></i>
                                        </div>
                                        <div className="flex-grow-1">
                                            <h5 className="mb-1">{price.product.name}</h5>
                                            <p className="text-muted mb-1">
                                                <strong>Kod:</strong> {price.product.code}
                                            </p>
                                            <div className="d-flex gap-3">
                                                {price.product.category && (
                                                    <small className="text-muted">
                                                        <i className="ri-folder-line me-1"></i>
                                                        {price.product.category.name}
                                                    </small>
                                                )}
                                                {price.product.brand && (
                                                    <small className="text-muted">
                                                        <i className="ri-price-tag-line me-1"></i>
                                                        {price.product.brand.name}
                                                    </small>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </Card.Body>
                            </Card>

                            <Card className="mb-4">
                                <Card.Header>
                                    <h5 className="mb-0">Fiyat Bilgileri</h5>
                                </Card.Header>
                                <Card.Body>
                                    <Row className="g-3">
                                        <Col md={6}>
                                            <Form.Label>Birim Fiyat ({priceList.currency}) *</Form.Label>
                                            <Form.Control
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                value={data.price}
                                                onChange={(e) => setData('price', e.target.value)}
                                                isInvalid={!!errors.price}
                                                placeholder="0.00"
                                            />
                                            {errors.price && (
                                                <Form.Control.Feedback type="invalid">
                                                    {errors.price}
                                                </Form.Control.Feedback>
                                            )}
                                        </Col>

                                        <Col md={6}>
                                            <Form.Label>Minimum Miktar *</Form.Label>
                                            <Form.Control
                                                type="number"
                                                step="0.01"
                                                min="0.01"
                                                value={data.min_quantity}
                                                onChange={(e) => setData('min_quantity', e.target.value)}
                                                isInvalid={!!errors.min_quantity}
                                                placeholder="1"
                                            />
                                            {errors.min_quantity && (
                                                <Form.Control.Feedback type="invalid">
                                                    {errors.min_quantity}
                                                </Form.Control.Feedback>
                                            )}
                                            <Form.Text className="text-muted">
                                                Bu fiyatın geçerli olduğu minimum miktar
                                            </Form.Text>
                                        </Col>
                                    </Row>
                                </Card.Body>
                            </Card>

                            <Card className="mb-4">
                                <Card.Header>
                                    <h5 className="mb-0">İndirim (Opsiyonel)</h5>
                                </Card.Header>
                                <Card.Body>
                                    <div className="mb-3">
                                        <Form.Label>İndirim Türü</Form.Label>
                                        <div className="d-flex gap-3">
                                            <Form.Check
                                                type="radio"
                                                id="discount-percentage"
                                                label="Yüzde (%)"
                                                checked={discountType === 'percentage'}
                                                onChange={() => setDiscountType('percentage')}
                                            />
                                            <Form.Check
                                                type="radio"
                                                id="discount-amount"
                                                label={`Tutar (${priceList.currency})`}
                                                checked={discountType === 'amount'}
                                                onChange={() => setDiscountType('amount')}
                                            />
                                        </div>
                                    </div>

                                    <Row className="g-3">
                                        <Col md={6}>
                                            <Form.Label>İndirim Yüzdesi (%)</Form.Label>
                                            <Form.Control
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                max="100"
                                                value={data.discount_percentage}
                                                onChange={(e) => setData('discount_percentage', e.target.value)}
                                                isInvalid={!!errors.discount_percentage}
                                                disabled={discountType !== 'percentage'}
                                                placeholder="0.00"
                                            />
                                            {errors.discount_percentage && (
                                                <Form.Control.Feedback type="invalid">
                                                    {errors.discount_percentage}
                                                </Form.Control.Feedback>
                                            )}
                                        </Col>

                                        <Col md={6}>
                                            <Form.Label>İndirim Tutarı ({priceList.currency})</Form.Label>
                                            <Form.Control
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                value={data.discount_amount}
                                                onChange={(e) => setData('discount_amount', e.target.value)}
                                                isInvalid={!!errors.discount_amount}
                                                disabled={discountType !== 'amount'}
                                                placeholder="0.00"
                                            />
                                            {errors.discount_amount && (
                                                <Form.Control.Feedback type="invalid">
                                                    {errors.discount_amount}
                                                </Form.Control.Feedback>
                                            )}
                                        </Col>
                                    </Row>

                                    {((discountType === 'percentage' && data.discount_percentage) || 
                                      (discountType === 'amount' && data.discount_amount)) && (
                                        <Alert variant="info" className="mt-3 mb-0">
                                            <div className="d-flex justify-content-between align-items-center">
                                                <span>
                                                    <i className="ri-information-line me-1"></i>
                                                    İndirim sonrası final fiyat:
                                                </span>
                                                <strong className="text-success">
                                                    {formatPrice(calculateFinalPrice())}
                                                </strong>
                                            </div>
                                        </Alert>
                                    )}
                                </Card.Body>
                            </Card>
                        </Col>

                        <Col lg={4}>
                            <Card className="mb-4">
                                <Card.Header>
                                    <h5 className="mb-0">Fiyat Özeti</h5>
                                </Card.Header>
                                <Card.Body>
                                    {data.price && (
                                        <div>
                                            <div className="d-flex justify-content-between mb-2">
                                                <span className="text-muted">Birim Fiyat:</span>
                                                <span>{formatPrice(parseFloat(data.price) || 0)}</span>
                                            </div>
                                            
                                            {((discountType === 'percentage' && data.discount_percentage) || 
                                              (discountType === 'amount' && data.discount_amount)) && (
                                                <>
                                                    <div className="d-flex justify-content-between mb-2">
                                                        <span className="text-muted">İndirim:</span>
                                                        <span className="text-warning">
                                                            {discountType === 'percentage' 
                                                                ? `%${data.discount_percentage}`
                                                                : formatPrice(parseFloat(data.discount_amount) || 0)
                                                            }
                                                        </span>
                                                    </div>
                                                    <hr className="my-2" />
                                                </>
                                            )}
                                            
                                            <div className="d-flex justify-content-between mb-3">
                                                <strong>Final Fiyat:</strong>
                                                <strong className="text-success">
                                                    {formatPrice(calculateFinalPrice())}
                                                </strong>
                                            </div>

                                            <div className="d-flex justify-content-between">
                                                <span className="text-muted">Min. Miktar:</span>
                                                <span>{data.min_quantity}</span>
                                            </div>
                                        </div>
                                    )}
                                </Card.Body>
                            </Card>

                            <Card>
                                <Card.Header>
                                    <h5 className="mb-0">İşlemler</h5>
                                </Card.Header>
                                <Card.Body>
                                    <div className="d-grid gap-2">
                                        <Button 
                                            type="submit" 
                                            variant="primary"
                                            disabled={processing}
                                        >
                                            {processing ? (
                                                <>
                                                    <span className="spinner-border spinner-border-sm me-2"></span>
                                                    Güncelleniyor...
                                                </>
                                            ) : (
                                                <>
                                                    <i className="ri-save-line me-1"></i>
                                                    Değişiklikleri Kaydet
                                                </>
                                            )}
                                        </Button>

                                        <Link href={route('sales.price-lists.prices.show', [priceList.id, price.id])}>
                                            <Button variant="outline-info" className="w-100">
                                                <i className="ri-eye-line me-1"></i>
                                                Görüntüle
                                            </Button>
                                        </Link>

                                        <Link href={route('sales.price-lists.prices.index', priceList.id)}>
                                            <Button variant="outline-secondary" className="w-100">
                                                <i className="ri-close-line me-1"></i>
                                                İptal
                                            </Button>
                                        </Link>
                                    </div>
                                </Card.Body>
                            </Card>
                        </Col>
                    </Row>
                </Form>
            </div>
        </Layout>
    );
}