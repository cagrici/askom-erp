import React, { useState } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import { Card, Form, Button, Row, Col, Alert } from 'react-bootstrap';
import Layout from '@/Layouts';
import ProductSearchableSelect from '@/Components/ProductSearchableSelect';

interface PriceList {
    id: number;
    name: string;
    code: string;
    currency: string;
    type: string;
}

interface Props {
    priceList: PriceList;
    existingProductIds: number[];
}

export default function Create({ priceList, existingProductIds }: Props) {
    const { data, setData, post, processing, errors, reset } = useForm({
        product_id: '',
        price: '',
        min_quantity: '1',
        discount_percentage: '',
        discount_amount: ''
    });

    const [selectedProduct, setSelectedProduct] = useState<any>(null);
    const [discountType, setDiscountType] = useState<'percentage' | 'amount'>('percentage');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        // Clear the other discount field based on selected type
        const submitData = {
            ...data,
            discount_percentage: discountType === 'percentage' ? data.discount_percentage : '',
            discount_amount: discountType === 'amount' ? data.discount_amount : ''
        };

        post(route('sales.price-lists.prices.store', priceList.id), {
            data: submitData,
            onSuccess: () => {
                reset();
                setSelectedProduct(null);
            }
        });
    };

    const handleProductChange = (product: any) => {
        setSelectedProduct(product);
        setData('product_id', product ? product.id.toString() : '');
    };

    const calculateFinalPrice = () => {
        const price = parseFloat(data.price) || 0;
        
        if (discountType === 'percentage' && data.discount_percentage) {
            const discountPercent = parseFloat(data.discount_percentage) || 0;
            return price * (1 - discountPercent / 100);
        }
        
        if (discountType === 'amount' && data.discount_amount) {
            const discountAmount = parseFloat(data.discount_amount) || 0;
            return Math.max(0, price - discountAmount);
        }
        
        return price;
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
            <Head title={`Yeni Ürün Fiyatı - ${priceList.name}`} />
            
            <div className="page-content">
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <div>
                        <h1 className="h3 mb-1">
                            <i className="ri-price-tag-line me-2"></i>
                            Yeni Ürün Fiyatı
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
                        </p>
                    </div>

                    <Link href={route('sales.price-lists.prices.index', priceList.id)}>
                        <Button variant="outline-secondary">
                            <i className="ri-arrow-left-line me-1"></i>
                            Geri
                        </Button>
                    </Link>
                </div>

                <Form onSubmit={handleSubmit}>
                    <Row>
                        <Col lg={8}>
                            <Card className="mb-4">
                                <Card.Header>
                                    <h5 className="mb-0">Ürün Seçimi</h5>
                                </Card.Header>
                                <Card.Body>
                                    <Form.Label>Ürün *</Form.Label>
                                    <ProductSearchableSelect
                                        value={selectedProduct?.id || null}
                                        onChange={handleProductChange}
                                        searchUrl={route('sales.orders.products.search')}
                                        placeholder="Ürün arayın..."
                                        isInvalid={!!errors.product_id}
                                    />
                                    {errors.product_id && (
                                        <div className="text-danger mt-1">
                                            <small>{errors.product_id}</small>
                                        </div>
                                    )}
                                    
                                    {existingProductIds.length > 0 && (
                                        <Alert variant="info" className="mt-3 mb-0">
                                            <small>
                                                <i className="ri-information-line me-1"></i>
                                                Bu fiyat listesinde zaten {existingProductIds.length} ürün için fiyat tanımlanmış.
                                                Mevcut ürünler için fiyat eklerken dikkatli olun.
                                            </small>
                                        </Alert>
                                    )}
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
                                </Card.Body>
                            </Card>
                        </Col>

                        <Col lg={4}>
                            <Card className="mb-4">
                                <Card.Header>
                                    <h5 className="mb-0">Önizleme</h5>
                                </Card.Header>
                                <Card.Body>
                                    {selectedProduct ? (
                                        <div>
                                            <div className="mb-3">
                                                <strong>Seçili Ürün:</strong><br />
                                                <span>{selectedProduct.name}</span><br />
                                                <small className="text-muted">{selectedProduct.code}</small>
                                            </div>

                                            {data.price && (
                                                <div className="mb-3">
                                                    <div className="d-flex justify-content-between mb-1">
                                                        <span className="text-muted">Birim Fiyat:</span>
                                                        <span>{formatPrice(parseFloat(data.price) || 0)}</span>
                                                    </div>
                                                    
                                                    {((discountType === 'percentage' && data.discount_percentage) || 
                                                      (discountType === 'amount' && data.discount_amount)) && (
                                                        <>
                                                            <div className="d-flex justify-content-between mb-1">
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
                                                    
                                                    <div className="d-flex justify-content-between">
                                                        <strong>Final Fiyat:</strong>
                                                        <strong className="text-success">
                                                            {formatPrice(calculateFinalPrice())}
                                                        </strong>
                                                    </div>
                                                </div>
                                            )}

                                            {data.min_quantity && (
                                                <div className="mb-3">
                                                    <div className="d-flex justify-content-between">
                                                        <span className="text-muted">Min. Miktar:</span>
                                                        <span>{data.min_quantity}</span>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="text-center text-muted py-4">
                                            <i className="ri-search-line fs-1 d-block mb-2"></i>
                                            <p className="mb-0">Önce bir ürün seçin</p>
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
                                            disabled={processing || !selectedProduct}
                                        >
                                            {processing ? (
                                                <>
                                                    <span className="spinner-border spinner-border-sm me-2"></span>
                                                    Ekleniyor...
                                                </>
                                            ) : (
                                                <>
                                                    <i className="ri-save-line me-1"></i>
                                                    Fiyatı Ekle
                                                </>
                                            )}
                                        </Button>

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