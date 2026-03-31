import React, { useState } from 'react';
import Layout from '@/Layouts';
import { Head, Link, useForm } from '@inertiajs/react';
import { Card, Form, Button, Row, Col, Alert, Badge } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';

interface Product {
    id: number;
    name: string;
    sku: string;
}

interface Attribute {
    id: number;
    name: string;
    type: string;
    values: AttributeValue[];
}

interface AttributeValue {
    id: number;
    value: string;
    color_hex?: string;
}

interface Props {
    products: Product[];
    attributes: Attribute[];
}

interface FormData {
    product_id: string;
    name: string;
    sku: string;
    price: string;
    compare_price: string;
    cost_price: string;
    stock_quantity: string;
    weight: string;
    length: string;
    width: string;
    height: string;
    is_active: boolean;
    attribute_values: number[];
}

export default function VariantCreate({ products, attributes }: Props) {
    const { t } = useTranslation();
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

    const { data, setData, post, processing, errors, reset } = useForm<FormData>({
        product_id: '',
        name: '',
        sku: '',
        price: '',
        compare_price: '',
        cost_price: '',
        stock_quantity: '0',
        weight: '',
        length: '',
        width: '',
        height: '',
        is_active: true,
        attribute_values: [],
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('product-variants.store'), {
            onSuccess: () => {
                reset();
            }
        });
    };

    const handleProductChange = (productId: string) => {
        const product = products.find(p => p.id.toString() === productId);
        setSelectedProduct(product || null);
        setData('product_id', productId);
        
        if (product) {
            // Auto-generate SKU based on product SKU
            const variantCount = Math.floor(Math.random() * 1000);
            setData('sku', `${product.sku}-V${variantCount}`);
        }
    };

    const handleAttributeValueChange = (valueId: number, checked: boolean) => {
        if (checked) {
            setData('attribute_values', [...data.attribute_values, valueId]);
        } else {
            setData('attribute_values', data.attribute_values.filter(id => id !== valueId));
        }
    };

    const generateVariantName = () => {
        if (!selectedProduct || data.attribute_values.length === 0) return;

        const selectedValues = attributes.flatMap(attr => 
            attr.values.filter(val => data.attribute_values.includes(val.id))
        );

        const variantName = `${selectedProduct.name} - ${selectedValues.map(val => val.value).join(', ')}`;
        setData('name', variantName);
    };

    return (
        <>
            <Head title="Yeni Varyant Oluştur" />
            <Layout>
                <div className="page-content">
                    <div className="container-fluid">
                        <Row className="mb-3">
                            <Col>
                                <div className="page-title-box d-flex align-items-center justify-content-between">
                                    <h4 className="mb-0">Yeni Varyant Oluştur</h4>
                                    <Link href={route('product-variants.index')} className="btn btn-secondary">
                                        <i className="ri-arrow-left-line me-1"></i>
                                        Geri Dön
                                    </Link>
                                </div>
                            </Col>
                        </Row>

                        <form onSubmit={handleSubmit}>
                            <Row>
                                <Col xl={8}>
                                    <Card>
                                        <Card.Header>
                                            <h5 className="card-title mb-0">Temel Bilgiler</h5>
                                        </Card.Header>
                                        <Card.Body>
                                            <Row>
                                                <Col md={12}>
                                                    <Form.Group className="mb-3">
                                                        <Form.Label>Ana Ürün <span className="text-danger">*</span></Form.Label>
                                                        <Form.Select
                                                            value={data.product_id}
                                                            onChange={(e) => handleProductChange(e.target.value)}
                                                            isInvalid={!!errors.product_id}
                                                        >
                                                            <option value="">Ürün Seçin...</option>
                                                            {products.map(product => (
                                                                <option key={product.id} value={product.id}>
                                                                    {product.name} ({product.sku})
                                                                </option>
                                                            ))}
                                                        </Form.Select>
                                                        <Form.Control.Feedback type="invalid">
                                                            {errors.product_id}
                                                        </Form.Control.Feedback>
                                                    </Form.Group>
                                                </Col>
                                            </Row>

                                            {selectedProduct && (
                                                <>
                                                    <Row>
                                                        <Col md={6}>
                                                            <Form.Group className="mb-3">
                                                                <Form.Label>Varyant Adı <span className="text-danger">*</span></Form.Label>
                                                                <div className="d-flex">
                                                                    <Form.Control
                                                                        type="text"
                                                                        value={data.name}
                                                                        onChange={(e) => setData('name', e.target.value)}
                                                                        isInvalid={!!errors.name}
                                                                        placeholder="Örn: Kırmızı - Büyük"
                                                                    />
                                                                    <Button 
                                                                        variant="outline-secondary" 
                                                                        className="ms-2"
                                                                        type="button"
                                                                        onClick={generateVariantName}
                                                                        disabled={data.attribute_values.length === 0}
                                                                    >
                                                                        <i className="ri-magic-line"></i>
                                                                    </Button>
                                                                </div>
                                                                <Form.Control.Feedback type="invalid">
                                                                    {errors.name}
                                                                </Form.Control.Feedback>
                                                                <Form.Text className="text-muted">
                                                                    Sağdaki butona tıklayarak seçilen özelliklerden otomatik ad oluşturabilirsiniz.
                                                                </Form.Text>
                                                            </Form.Group>
                                                        </Col>
                                                        <Col md={6}>
                                                            <Form.Group className="mb-3">
                                                                <Form.Label>SKU <span className="text-danger">*</span></Form.Label>
                                                                <Form.Control
                                                                    type="text"
                                                                    value={data.sku}
                                                                    onChange={(e) => setData('sku', e.target.value)}
                                                                    isInvalid={!!errors.sku}
                                                                    placeholder="Örn: PRD-001-V1"
                                                                />
                                                                <Form.Control.Feedback type="invalid">
                                                                    {errors.sku}
                                                                </Form.Control.Feedback>
                                                            </Form.Group>
                                                        </Col>
                                                    </Row>

                                                    {/* Özellikler */}
                                                    {attributes.length > 0 && (
                                                        <div className="mb-4">
                                                            <h6>Varyant Özellikleri</h6>
                                                            <Row>
                                                                {attributes.map(attribute => (
                                                                    <Col md={6} key={attribute.id} className="mb-3">
                                                                        <div className="border rounded p-3">
                                                                            <h6 className="mb-2">{attribute.name}</h6>
                                                                            <div className="d-flex flex-wrap gap-2">
                                                                                {attribute.values.map(value => (
                                                                                    <Form.Check
                                                                                        key={value.id}
                                                                                        type="checkbox"
                                                                                        id={`attr-${value.id}`}
                                                                                        label={
                                                                                            <div className="d-flex align-items-center">
                                                                                                {value.color_hex && (
                                                                                                    <div 
                                                                                                        className="rounded-circle me-2"
                                                                                                        style={{
                                                                                                            width: '16px',
                                                                                                            height: '16px',
                                                                                                            backgroundColor: value.color_hex,
                                                                                                            border: '1px solid #dee2e6'
                                                                                                        }}
                                                                                                    />
                                                                                                )}
                                                                                                {value.value}
                                                                                            </div>
                                                                                        }
                                                                                        checked={data.attribute_values.includes(value.id)}
                                                                                        onChange={(e) => handleAttributeValueChange(value.id, e.target.checked)}
                                                                                    />
                                                                                ))}
                                                                            </div>
                                                                        </div>
                                                                    </Col>
                                                                ))}
                                                            </Row>
                                                        </div>
                                                    )}

                                                    {/* Fiyatlandırma */}
                                                    <h6>Fiyatlandırma</h6>
                                                    <Row>
                                                        <Col md={4}>
                                                            <Form.Group className="mb-3">
                                                                <Form.Label>Satış Fiyatı</Form.Label>
                                                                <Form.Control
                                                                    type="number"
                                                                    step="0.01"
                                                                    value={data.price}
                                                                    onChange={(e) => setData('price', e.target.value)}
                                                                    isInvalid={!!errors.price}
                                                                    placeholder="0.00"
                                                                />
                                                                <Form.Control.Feedback type="invalid">
                                                                    {errors.price}
                                                                </Form.Control.Feedback>
                                                            </Form.Group>
                                                        </Col>
                                                        <Col md={4}>
                                                            <Form.Group className="mb-3">
                                                                <Form.Label>Karşılaştırma Fiyatı</Form.Label>
                                                                <Form.Control
                                                                    type="number"
                                                                    step="0.01"
                                                                    value={data.compare_price}
                                                                    onChange={(e) => setData('compare_price', e.target.value)}
                                                                    isInvalid={!!errors.compare_price}
                                                                    placeholder="0.00"
                                                                />
                                                                <Form.Control.Feedback type="invalid">
                                                                    {errors.compare_price}
                                                                </Form.Control.Feedback>
                                                            </Form.Group>
                                                        </Col>
                                                        <Col md={4}>
                                                            <Form.Group className="mb-3">
                                                                <Form.Label>Maliyet Fiyatı</Form.Label>
                                                                <Form.Control
                                                                    type="number"
                                                                    step="0.01"
                                                                    value={data.cost_price}
                                                                    onChange={(e) => setData('cost_price', e.target.value)}
                                                                    isInvalid={!!errors.cost_price}
                                                                    placeholder="0.00"
                                                                />
                                                                <Form.Control.Feedback type="invalid">
                                                                    {errors.cost_price}
                                                                </Form.Control.Feedback>
                                                            </Form.Group>
                                                        </Col>
                                                    </Row>

                                                    {/* Stok ve Fiziksel Özellikler */}
                                                    <h6>Stok ve Fiziksel Özellikler</h6>
                                                    <Row>
                                                        <Col md={3}>
                                                            <Form.Group className="mb-3">
                                                                <Form.Label>Stok Miktarı</Form.Label>
                                                                <Form.Control
                                                                    type="number"
                                                                    value={data.stock_quantity}
                                                                    onChange={(e) => setData('stock_quantity', e.target.value)}
                                                                    isInvalid={!!errors.stock_quantity}
                                                                    placeholder="0"
                                                                />
                                                                <Form.Control.Feedback type="invalid">
                                                                    {errors.stock_quantity}
                                                                </Form.Control.Feedback>
                                                            </Form.Group>
                                                        </Col>
                                                        <Col md={3}>
                                                            <Form.Group className="mb-3">
                                                                <Form.Label>Ağırlık (kg)</Form.Label>
                                                                <Form.Control
                                                                    type="number"
                                                                    step="0.01"
                                                                    value={data.weight}
                                                                    onChange={(e) => setData('weight', e.target.value)}
                                                                    isInvalid={!!errors.weight}
                                                                    placeholder="0.00"
                                                                />
                                                                <Form.Control.Feedback type="invalid">
                                                                    {errors.weight}
                                                                </Form.Control.Feedback>
                                                            </Form.Group>
                                                        </Col>
                                                        <Col md={2}>
                                                            <Form.Group className="mb-3">
                                                                <Form.Label>Uzunluk (cm)</Form.Label>
                                                                <Form.Control
                                                                    type="number"
                                                                    step="0.01"
                                                                    value={data.length}
                                                                    onChange={(e) => setData('length', e.target.value)}
                                                                    isInvalid={!!errors.length}
                                                                    placeholder="0"
                                                                />
                                                                <Form.Control.Feedback type="invalid">
                                                                    {errors.length}
                                                                </Form.Control.Feedback>
                                                            </Form.Group>
                                                        </Col>
                                                        <Col md={2}>
                                                            <Form.Group className="mb-3">
                                                                <Form.Label>Genişlik (cm)</Form.Label>
                                                                <Form.Control
                                                                    type="number"
                                                                    step="0.01"
                                                                    value={data.width}
                                                                    onChange={(e) => setData('width', e.target.value)}
                                                                    isInvalid={!!errors.width}
                                                                    placeholder="0"
                                                                />
                                                                <Form.Control.Feedback type="invalid">
                                                                    {errors.width}
                                                                </Form.Control.Feedback>
                                                            </Form.Group>
                                                        </Col>
                                                        <Col md={2}>
                                                            <Form.Group className="mb-3">
                                                                <Form.Label>Yükseklik (cm)</Form.Label>
                                                                <Form.Control
                                                                    type="number"
                                                                    step="0.01"
                                                                    value={data.height}
                                                                    onChange={(e) => setData('height', e.target.value)}
                                                                    isInvalid={!!errors.height}
                                                                    placeholder="0"
                                                                />
                                                                <Form.Control.Feedback type="invalid">
                                                                    {errors.height}
                                                                </Form.Control.Feedback>
                                                            </Form.Group>
                                                        </Col>
                                                    </Row>
                                                </>
                                            )}
                                        </Card.Body>
                                    </Card>
                                </Col>

                                <Col xl={4}>
                                    <Card>
                                        <Card.Header>
                                            <h5 className="card-title mb-0">Durum</h5>
                                        </Card.Header>
                                        <Card.Body>
                                            <Form.Group className="mb-3">
                                                <Form.Check
                                                    type="switch"
                                                    id="is_active"
                                                    label="Aktif"
                                                    checked={data.is_active}
                                                    onChange={(e) => setData('is_active', e.target.checked)}
                                                />
                                                <Form.Text className="text-muted">
                                                    Pasif varyantlar müşterilere gösterilmez.
                                                </Form.Text>
                                            </Form.Group>

                                            {selectedProduct && (
                                                <Alert variant="info">
                                                    <h6>Seçilen Ürün:</h6>
                                                    <strong>{selectedProduct.name}</strong><br />
                                                    <small className="text-muted">SKU: {selectedProduct.sku}</small>
                                                </Alert>
                                            )}

                                            <div className="d-grid gap-2">
                                                <Button 
                                                    type="submit" 
                                                    variant="primary" 
                                                    disabled={processing || !data.product_id}
                                                >
                                                    {processing ? (
                                                        <>
                                                            <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                                                            Kaydediliyor...
                                                        </>
                                                    ) : (
                                                        <>
                                                            <i className="ri-save-line me-1"></i>
                                                            Varyantı Kaydet
                                                        </>
                                                    )}
                                                </Button>
                                                <Button 
                                                    type="button" 
                                                    variant="secondary"
                                                    onClick={() => reset()}
                                                    disabled={processing}
                                                >
                                                    <i className="ri-refresh-line me-1"></i>
                                                    Formu Temizle
                                                </Button>
                                            </div>
                                        </Card.Body>
                                    </Card>
                                </Col>
                            </Row>
                        </form>
                    </div>
                </div>
            </Layout>
        </>
    );
}