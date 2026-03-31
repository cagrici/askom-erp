import React, { useState, useEffect } from 'react';
import { Card, Button, Form, InputGroup, Col, Row } from 'react-bootstrap';
import ProductSearchableSelect from './ProductSearchableSelect';

interface Product {
    id: number;
    code: string;
    name: string;
    sale_price: number;
    tax_rate: number;
    stock_quantity: number;
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
    tax?: {
        id: number;
        name: string;
        rate: number;
        type: string;
        code: string;
        is_default: boolean;
    };
    primary_image_url?: string;
}

interface Tax {
    id: number;
    name: string;
    rate: number;
    type: string;
    code: string;
    is_default: boolean;
}

interface StickyQuickAddItemProps {
    onAddItem: (item: {
        product_id: number;
        product?: Product;
        quantity: number;
        unit_price: number;
        tax_rate: number;
    }) => void;
    searchUrl: string;
    taxes: Tax[];
    isVisible: boolean;
    customerId?: number | null;
    defaultQuantity?: number;
}

export default function StickyQuickAddItem({
    onAddItem,
    searchUrl,
    taxes,
    isVisible,
    customerId = null,
    defaultQuantity = 1
}: StickyQuickAddItemProps) {
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [quantity, setQuantity] = useState<number>(defaultQuantity);
    const [unitPrice, setUnitPrice] = useState<number>(0);
    const [taxRate, setTaxRate] = useState<number>(taxes.find(t => t.is_default)?.rate || 0);
    const [isExpanded, setIsExpanded] = useState(false);

    // Update unit price and tax rate when product is selected
    useEffect(() => {
        if (selectedProduct) {
            setUnitPrice(selectedProduct.sale_price);
            setTaxRate(selectedProduct.tax?.rate || selectedProduct.tax_rate || taxes.find(t => t.is_default)?.rate || 0);
        }
    }, [selectedProduct, taxes]);

    const handleAddItem = () => {
        if (!selectedProduct) return;

        onAddItem({
            product_id: selectedProduct.id,
            product: selectedProduct,
            quantity,
            unit_price: unitPrice,
            tax_rate: taxRate,
        });

        // Reset form
        setSelectedProduct(null);
        setQuantity(1);
        setUnitPrice(0);
        setTaxRate(taxes.find(t => t.is_default)?.rate || 0);
        setIsExpanded(false);
    };

    const handleProductSelect = (product: Product | null) => {
        setSelectedProduct(product);
        if (product && !isExpanded) {
            setIsExpanded(true);
        }
    };

    if (!isVisible) return null;

    return (
        <div className="mb-4">
            <Card className="border border-info border-opacity-25 bg-gradient bg-dark bg-opacity-10 ">
                <Card.Body className="py-3">
                    {!isExpanded ? (
                        // Collapsed state - just product search
                        <div className="d-flex align-items-center gap-2">
                            <div className="flex-grow-1">
                                <ProductSearchableSelect
                                    value={selectedProduct?.id || null}
                                    onChange={handleProductSelect}
                                    searchUrl={searchUrl}
                                    placeholder="🔍 Hızlı ürün ekle..."
                                    className="form-control-lg"
                                    customerId={customerId}
                                    quantity={quantity}
                                />
                            </div>
                            <Button
                                variant="outline-primary"
                                size="lg"
                                onClick={() => setIsExpanded(true)}
                                disabled={!selectedProduct}
                                className="d-none d-md-block"
                            >
                                <i className="ri-arrow-up-line me-1"></i>
                                Genişlet
                            </Button>
                            <Button
                                variant="outline-primary"
                                size="lg"
                                onClick={() => setIsExpanded(true)}
                                disabled={!selectedProduct}
                                className="d-md-none"
                            >
                                <i className="ri-arrow-up-line"></i>
                            </Button>
                        </div>
                    ) : (
                        // Expanded state - full form
                        <div>
                            <div className="d-flex align-items-center justify-content-between mb-3">
                                <h6 className="mb-0 text-primary">
                                    <i className="ri-flash-line me-2"></i>
                                    Hızlı Kalem Ekle
                                </h6>
                                <Button
                                    variant="outline-secondary"
                                    size="sm"
                                    onClick={() => setIsExpanded(false)}
                                >
                                    <i className="ri-arrow-down-line"></i>
                                </Button>
                            </div>

                            <Row className="g-3">
                                <Col xs={12} md={5}>
                                    <Form.Label className="small fw-medium">Ürün</Form.Label>
                                    <ProductSearchableSelect
                                        value={selectedProduct?.id || null}
                                        onChange={handleProductSelect}
                                        searchUrl={searchUrl}
                                        placeholder="Ürün ara..."
                                        customerId={customerId}
                                        quantity={quantity}
                                    />
                                    {selectedProduct && (
                                        <div className="mt-1">
                                            <small className="text-muted">
                                                Stok: {selectedProduct.stock_quantity} {selectedProduct.baseUnit?.symbol}
                                            </small>
                                            {selectedProduct.code && (
                                                <small className="text-muted ms-2">
                                                    Kod: {selectedProduct.code}
                                                </small>
                                            )}
                                        </div>
                                    )}
                                </Col>

                                <Col xs={4} md={2}>
                                    <Form.Label className="small fw-medium">Miktar</Form.Label>
                                    <Form.Control
                                        type="number"
                                        min="0.001"
                                        step="0.001"
                                        value={quantity}
                                        onChange={(e) => setQuantity(parseFloat(e.target.value) || 1)}
                                       
                                    />
                                </Col>

                                <Col xs={4} md={2}>
                                    <Form.Label className="small fw-medium">Fiyat</Form.Label>
                                    <Form.Control
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={unitPrice}
                                        onChange={(e) => setUnitPrice(parseFloat(e.target.value) || 0)}

                                    />
                                </Col>

                                <Col xs={4} md={2}>
                                    <Form.Label className="small fw-medium">KDV</Form.Label>
                                    <Form.Select
                                        value={taxRate}
                                        onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)}

                                    >
                                        {taxes.map((tax) => (
                                            <option key={tax.id} value={tax.rate}>
                                                %{tax.rate % 1 === 0 ? Math.floor(tax.rate) : tax.rate}
                                            </option>
                                        ))}
                                    </Form.Select>
                                </Col>

                                <Col xs={12} md={1} className="d-flex align-items-center">
                                    <Button
                                        variant="primary"
                                        onClick={handleAddItem}
                                        disabled={!selectedProduct}
                                        className="w-100"

                                    >
                                        <i className="ri-add-line me-1 d-md-none"></i>
                                        <i className="ri-add-line d-none d-md-inline"></i>
                                        <span className="d-md-none">Ekle</span>
                                    </Button>
                                </Col>
                            </Row>

                            {selectedProduct && (
                                <div className="mt-3 p-2 bg-light rounded">
                                    <div className="d-flex align-items-center gap-3">
                                        <img
                                            src={selectedProduct.primary_image_url || '/images/no-image.png'}
                                            alt={selectedProduct.name}
                                            className="rounded"
                                            style={{
                                                width: '40px',
                                                height: '40px',
                                                objectFit: 'cover'
                                            }}
                                            onError={(e) => {
                                                e.currentTarget.src = '/images/no-image.png';
                                            }}
                                        />
                                        <div className="flex-grow-1">
                                            <div className="fw-medium">{selectedProduct.name}</div>
                                            <div className="d-flex gap-3">
                                                {selectedProduct.brand && (
                                                    <small className="text-primary">
                                                        <i className="ri-award-line me-1"></i>
                                                        {selectedProduct.brand.name}
                                                    </small>
                                                )}
                                                {selectedProduct.category && (
                                                    <small className="text-muted">
                                                        {selectedProduct.category.name}
                                                    </small>
                                                )}
                                            </div>
                                        </div>
                                        <div className="text-end">
                                            <div className="fw-medium text-primary">
                                                {new Intl.NumberFormat('tr-TR', {
                                                    style: 'currency',
                                                    currency: 'TRY',
                                                    minimumFractionDigits: 2,
                                                }).format(unitPrice * quantity)}
                                            </div>
                                            <small className="text-muted">
                                                {quantity} x {new Intl.NumberFormat('tr-TR', {
                                                    style: 'currency',
                                                    currency: 'TRY',
                                                    minimumFractionDigits: 2,
                                                }).format(unitPrice)}
                                            </small>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </Card.Body>
            </Card>
        </div>
    );
}
