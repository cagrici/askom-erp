import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Form, Button, Badge, ListGroup, Alert, Spinner } from 'react-bootstrap';
import axios from 'axios';

interface Category {
    id: number;
    name: string;
    product_count?: number;
}

interface Brand {
    id: number;
    name: string;
    product_count?: number;
}

interface Supplier {
    id: number;
    title: string;
    account_code: string;
    product_count?: number;
}

interface Product {
    id: number;
    name: string;
    code: string;
    category_id?: number;
    brand_id?: number;
    supplier_id?: number;
    category?: Category;
    brand?: Brand;
    supplier?: Supplier;
}

interface OrderItem {
    id?: string | number;
    product_id: number | null;
    product?: Product;
    quantity: number;
    unit_price: number;
    discount_percentage: number;
    discount_amount: number;
    tax_rate: number;
    line_total: number;
    original_unit_price?: number;
    bulk_discount_applied?: boolean;
    discount_source?: 'manual' | 'bulk_category' | 'bulk_brand' | 'bulk_supplier';
}

interface DiscountPreview {
    affected_items: Array<{
        id: string | number;
        old_price: number;
        new_price: number;
        savings: number;
        discount_amount: number;
    }>;
    total_savings: number;
    item_count: number;
}

interface BulkDiscountPanelProps {
    items: OrderItem[];
    onApplyDiscount: (updatedItems: OrderItem[]) => void;
    onClose: () => void;
    isOpen: boolean;
}

export default function BulkDiscountPanel({
    items,
    onApplyDiscount,
    onClose,
    isOpen
}: BulkDiscountPanelProps) {
    const [discountType, setDiscountType] = useState<'category' | 'brand' | 'supplier'>('category');
    const [discountMethod, setDiscountMethod] = useState<'percentage' | 'amount'>('percentage');
    const [discountValue, setDiscountValue] = useState<number>(0);
    const [targetId, setTargetId] = useState<number | null>(null);
    const [categories, setCategories] = useState<Category[]>([]);
    const [brands, setBrands] = useState<Brand[]>([]);
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [previewData, setPreviewData] = useState<DiscountPreview | null>(null);
    const [loading, setLoading] = useState(false);
    const [isApplying, setIsApplying] = useState(false);

    // Extract unique categories, brands, suppliers from current items
    useEffect(() => {
        if (!isOpen) return;

        const extractedCategories = new Map<number, Category>();
        const extractedBrands = new Map<number, Brand>();
        const extractedSuppliers = new Map<number, Supplier>();

        items.forEach(item => {
            if (item.product) {
                // Categories
                if (item.product.category_id && item.product.category) {
                    const categoryId = item.product.category_id;
                    if (!extractedCategories.has(categoryId)) {
                        extractedCategories.set(categoryId, {
                            ...item.product.category,
                            product_count: 0
                        });
                    }
                    extractedCategories.get(categoryId)!.product_count!++;
                }

                // Brands
                if (item.product.brand_id && item.product.brand) {
                    const brandId = item.product.brand_id;
                    if (!extractedBrands.has(brandId)) {
                        extractedBrands.set(brandId, {
                            ...item.product.brand,
                            product_count: 0
                        });
                    }
                    extractedBrands.get(brandId)!.product_count!++;
                }

                // Suppliers
                if (item.product.supplier_id && item.product.supplier) {
                    const supplierId = item.product.supplier_id;
                    if (!extractedSuppliers.has(supplierId)) {
                        extractedSuppliers.set(supplierId, {
                            ...item.product.supplier,
                            product_count: 0
                        });
                    }
                    extractedSuppliers.get(supplierId)!.product_count!++;
                }
            }
        });

        setCategories(Array.from(extractedCategories.values()));
        setBrands(Array.from(extractedBrands.values()));
        setSuppliers(Array.from(extractedSuppliers.values()));
    }, [items, isOpen]);

    // Preview discount when parameters change
    useEffect(() => {
        if (targetId && discountValue > 0) {
            previewDiscount();
        } else {
            setPreviewData(null);
        }
    }, [discountType, targetId, discountValue, discountMethod]);

    const previewDiscount = () => {
        if (!targetId || !discountValue) return;

        setLoading(true);

        // Filter affected items
        const affectedItems = items.filter(item => {
            if (!item.product) return false;

            switch (discountType) {
                case 'category':
                    return item.product.category_id === targetId;
                case 'brand':
                    return item.product.brand_id === targetId;
                case 'supplier':
                    return item.product.supplier_id === targetId;
                default:
                    return false;
            }
        });

        // Calculate preview
        const preview: DiscountPreview = {
            affected_items: [],
            total_savings: 0,
            item_count: affectedItems.length
        };

        affectedItems.forEach(item => {
            const originalPrice = item.original_unit_price || item.unit_price;
            let discountAmount = 0;

            if (discountMethod === 'percentage') {
                discountAmount = (originalPrice * discountValue) / 100;
            } else {
                discountAmount = discountValue;
            }

            const newPrice = originalPrice - discountAmount;
            const savings = discountAmount * item.quantity;

            preview.affected_items.push({
                id: item.id || Math.random(),
                old_price: originalPrice,
                new_price: Math.max(0, newPrice),
                savings: savings,
                discount_amount: discountAmount
            });

            preview.total_savings += savings;
        });

        setPreviewData(preview);
        setLoading(false);
    };

    const applyDiscount = () => {
        if (!previewData || !targetId) return;

        setIsApplying(true);

        // Apply discount to items
        const updatedItems = items.map(item => {
            const shouldApplyDiscount = (() => {
                if (!item.product) return false;

                switch (discountType) {
                    case 'category':
                        return item.product.category_id === targetId;
                    case 'brand':
                        return item.product.brand_id === targetId;
                    case 'supplier':
                        return item.product.supplier_id === targetId;
                    default:
                        return false;
                }
            })();

            if (shouldApplyDiscount) {
                const originalPrice = item.original_unit_price || item.unit_price;
                let discountAmount = 0;
                let discountPercentage = 0;

                if (discountMethod === 'percentage') {
                    discountPercentage = discountValue;
                    discountAmount = (originalPrice * discountValue) / 100;
                } else {
                    discountAmount = discountValue;
                    discountPercentage = (discountValue / originalPrice) * 100;
                }

                return {
                    ...item,
                    original_unit_price: originalPrice,
                    discount_percentage: discountPercentage,
                    discount_amount: discountAmount,
                    bulk_discount_applied: true,
                    discount_source: `bulk_${discountType}` as const
                };
            }

            return item;
        });

        onApplyDiscount(updatedItems);
        setIsApplying(false);
        resetForm();
        onClose();
    };

    const resetForm = () => {
        setDiscountValue(0);
        setTargetId(null);
        setPreviewData(null);
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('tr-TR', {
            style: 'currency',
            currency: 'TRY',
            minimumFractionDigits: 2,
        }).format(amount);
    };

    const getTargetOptions = () => {
        switch (discountType) {
            case 'category':
                return categories;
            case 'brand':
                return brands;
            case 'supplier':
                return suppliers;
            default:
                return [];
        }
    };

    const getTargetName = () => {
        const options = getTargetOptions();
        const selected = options.find(opt => opt.id === targetId);

        if (discountType === 'supplier') {
            return (selected as Supplier)?.title;
        }
        return selected?.name;
    };

    if (!isOpen) return null;

    return (
        <Card className="mb-4 border-primary">
            <Card.Header className="bg-success text-white">
                <div className="d-flex justify-content-between align-items-center">
                    <h5 className="mb-0 text-white">
                        <i className="ri-price-tag-3-line me-2"></i>
                        Toplu İndirim Uygula
                    </h5>
                    <Button variant="outline-light" size="sm" onClick={onClose}>
                        <i className="ri-close-line"></i>
                    </Button>
                </div>
            </Card.Header>
            <Card.Body>
                <Row className="g-3">
                    {/* Discount Type Selection */}
                    <Col md={4}>
                        <Form.Label>İndirim Tipi</Form.Label>
                        <Form.Select
                            value={discountType}
                            onChange={(e) => {
                                setDiscountType(e.target.value as any);
                                setTargetId(null);
                                setPreviewData(null);
                            }}
                        >
                            <option value="category">Kategori</option>
                            <option value="brand">Marka</option>
                            <option value="supplier">Tedarikçi</option>
                        </Form.Select>
                    </Col>

                    {/* Target Selection */}
                    <Col md={4}>
                        <Form.Label>
                            {discountType === 'category' ? 'Kategori' :
                             discountType === 'brand' ? 'Marka' : 'Tedarikçi'} Seçin
                        </Form.Label>
                        <Form.Select
                            value={targetId || ''}
                            onChange={(e) => setTargetId(Number(e.target.value) || null)}
                        >
                            <option value="">Seçin...</option>
                            {getTargetOptions().map((option: any) => (
                                <option key={option.id} value={option.id}>
                                    {discountType === 'supplier' ? option.title : option.name}
                                    {option.product_count && ` (${option.product_count} ürün)`}
                                </option>
                            ))}
                        </Form.Select>
                    </Col>

                    {/* Discount Value */}
                    <Col md={4}>
                        <Form.Label>İndirim Miktarı</Form.Label>
                        <div className="d-flex">
                            <Form.Select
                                value={discountMethod}
                                onChange={(e) => setDiscountMethod(e.target.value as any)}
                                style={{ maxWidth: '80px' }}
                            >
                                <option value="percentage">%</option>
                                <option value="amount">₺</option>
                            </Form.Select>
                            <Form.Control
                                type="number"
                                value={discountValue || ''}
                                onChange={(e) => setDiscountValue(Number(e.target.value) || 0)}
                                placeholder="0"
                                min="0"
                                max={discountMethod === 'percentage' ? '100' : undefined}
                                step={discountMethod === 'percentage' ? '0.1' : '0.01'}
                                className="ms-2"
                            />
                        </div>
                    </Col>
                </Row>

                {/* Preview Section */}
                {loading && (
                    <div className="text-center py-3">
                        <Spinner animation="border" size="sm" className="me-2" />
                        Hesaplanıyor...
                    </div>
                )}

                {previewData && !loading && (
                    <Alert variant="info" className="mt-3">
                        <div className="d-flex justify-content-between align-items-center mb-2">
                            <h6 className="mb-0">
                                <i className="ri-eye-line me-2"></i>
                                İndirim Önizlemesi
                            </h6>
                            <Badge bg="primary">
                                {previewData.item_count} ürün etkilenecek
                            </Badge>
                        </div>

                        <div className="mb-3">
                            <strong>{getTargetName()}</strong> için
                            <Badge bg="success" className="ms-2">
                                {discountMethod === 'percentage' ? `%${discountValue}` : formatCurrency(discountValue)}
                            </Badge>
                            <span className="ms-2">indirim uygulanacak</span>
                        </div>

                        <div className="mb-3">
                            <strong>Toplam Tasarruf: </strong>
                            <span className="text-success fs-5">
                                {formatCurrency(previewData.total_savings)}
                            </span>
                        </div>

                        {previewData.affected_items.length > 0 && (
                            <ListGroup variant="flush" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                                {previewData.affected_items.map((preview, index) => {
                                    const item = items.find(i => i.id === preview.id);
                                    return (
                                        <ListGroup.Item key={preview.id} className="py-2">
                                            <div className="d-flex justify-content-between align-items-center">
                                                <div>
                                                    <div className="fw-medium">
                                                        {item?.product?.name || `Ürün ${index + 1}`}
                                                    </div>
                                                    <small className="text-muted">
                                                        {formatCurrency(preview.old_price)} → {formatCurrency(preview.new_price)}
                                                    </small>
                                                </div>
                                                <div className="text-end">
                                                    <Badge bg="success">
                                                        {formatCurrency(preview.savings)} tasarruf
                                                    </Badge>
                                                </div>
                                            </div>
                                        </ListGroup.Item>
                                    );
                                })}
                            </ListGroup>
                        )}
                    </Alert>
                )}

                {/* Action Buttons */}
                <div className="d-flex justify-content-end gap-2 mt-3">
                    <Button variant="outline-secondary" onClick={onClose}>
                        İptal
                    </Button>
                    <Button
                        variant="primary"
                        onClick={applyDiscount}
                        disabled={!previewData || previewData.item_count === 0 || isApplying}
                    >
                        {isApplying ? (
                            <>
                                <Spinner animation="border" size="sm" className="me-2" />
                                Uygulanıyor...
                            </>
                        ) : (
                            <>
                                <i className="ri-check-line me-2"></i>
                                İndirimi Uygula
                            </>
                        )}
                    </Button>
                </div>
            </Card.Body>
        </Card>
    );
}
