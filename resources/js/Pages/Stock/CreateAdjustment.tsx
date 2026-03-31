import React, { useState } from 'react';
import Layout from '@/Layouts';
import { Head, Link, router } from '@inertiajs/react';
import { Card, Button, Form, Row, Col, Alert, Table, Modal, InputGroup, Badge } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';

interface Product {
    id: number;
    name: string;
    code: string;
    sku?: string;
    stock_quantity: number;
    cost_price: number;
    units?: ProductUnit[];
}

interface ProductUnit {
    id: number;
    name: string;
    conversion_factor: number;
}

interface AdjustmentItem {
    product_id: number;
    product?: Product;
    before_quantity: number;
    after_quantity: number;
    adjustment_quantity: number;
    unit_cost: number;
    total_cost: number;
    reason_code: string;
    notes?: string;
}

interface Props {
    products: Product[];
    adjustmentTypes: Array<{value: string, label: string}>;
    reasonCodes: Record<string, string>;
    errors: Record<string, string>;
}

export default function CreateAdjustment({ products, adjustmentTypes, reasonCodes, errors }: Props) {
    const { t } = useTranslation();
    
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        adjustment_type: 'count_adjustment',
        reason_code: 'PHYSICAL_COUNT',
        notes: ''
    });

    const [items, setItems] = useState<AdjustmentItem[]>([]);
    const [showProductModal, setShowProductModal] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [productSearch, setProductSearch] = useState('');
    const [newItem, setNewItem] = useState({
        after_quantity: 0,
        reason_code: 'PHYSICAL_COUNT',
        notes: ''
    });

    const handleInputChange = (field: string, value: any) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const filteredProducts = products.filter(product =>
        product.name.toLowerCase().includes(productSearch.toLowerCase()) ||
        product.code.toLowerCase().includes(productSearch.toLowerCase()) ||
        (product.sku && product.sku.toLowerCase().includes(productSearch.toLowerCase()))
    );

    const handleProductSelect = (product: Product) => {
        setSelectedProduct(product);
        setNewItem({
            after_quantity: product.stock_quantity,
            reason_code: formData.reason_code,
            notes: ''
        });
    };

    const addItemToAdjustment = () => {
        if (!selectedProduct) return;

        const beforeQuantity = selectedProduct.stock_quantity;
        const afterQuantity = newItem.after_quantity;
        const adjustmentQuantity = afterQuantity - beforeQuantity;
        const unitCost = selectedProduct.cost_price || 0;
        const totalCost = Math.abs(adjustmentQuantity) * unitCost;

        const adjustmentItem: AdjustmentItem = {
            product_id: selectedProduct.id,
            product: selectedProduct,
            before_quantity: beforeQuantity,
            after_quantity: afterQuantity,
            adjustment_quantity: adjustmentQuantity,
            unit_cost: unitCost,
            total_cost: totalCost,
            reason_code: newItem.reason_code,
            notes: newItem.notes
        };

        setItems(prev => [...prev, adjustmentItem]);
        setShowProductModal(false);
        setSelectedProduct(null);
        setProductSearch('');
    };

    const removeItem = (index: number) => {
        setItems(prev => prev.filter((_, i) => i !== index));
    };

    const updateItemQuantity = (index: number, afterQuantity: number) => {
        setItems(prev => prev.map((item, i) => {
            if (i === index) {
                const adjustmentQuantity = afterQuantity - item.before_quantity;
                const totalCost = Math.abs(adjustmentQuantity) * item.unit_cost;
                return { 
                    ...item, 
                    after_quantity: afterQuantity,
                    adjustment_quantity: adjustmentQuantity,
                    total_cost: totalCost
                };
            }
            return item;
        }));
    };

    const getTotalAdjustmentValue = () => {
        return items.reduce((sum, item) => sum + item.total_cost, 0);
    };

    const getTotalAdjustmentItems = () => {
        return items.length;
    };

    const getPositiveAdjustments = () => {
        return items.filter(item => item.adjustment_quantity > 0).length;
    };

    const getNegativeAdjustments = () => {
        return items.filter(item => item.adjustment_quantity < 0).length;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        if (items.length === 0) {
            alert('En az bir ürün eklemelisiniz.');
            return;
        }

        const submitData = {
            ...formData,
            items: items.map(item => ({
                product_id: item.product_id,
                before_quantity: item.before_quantity,
                after_quantity: item.after_quantity,
                adjustment_quantity: item.adjustment_quantity,
                unit_cost: item.unit_cost,
                total_cost: item.total_cost,
                reason_code: item.reason_code,
                notes: item.notes
            })),
            total_items: getTotalAdjustmentItems(),
            total_value: getTotalAdjustmentValue()
        };

        router.post(route('stock.adjustments.store'), submitData);
    };

    const formatCurrency = (amount: number) => {
        return `₺${amount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}`;
    };

    const getAdjustmentTypeText = (type: string) => {
        const typeObj = adjustmentTypes.find(t => t.value === type);
        return typeObj ? typeObj.label : type;
    };

    const getAdjustmentBadgeColor = (quantity: number) => {
        if (quantity > 0) return 'success';
        if (quantity < 0) return 'danger';
        return 'secondary';
    };

    const getAdjustmentIcon = (quantity: number) => {
        if (quantity > 0) return 'ri-arrow-up-line';
        if (quantity < 0) return 'ri-arrow-down-line';
        return 'ri-subtract-line';
    };

    return (
        <Layout>
            <Head title="Yeni Stok Düzeltmesi" />

            <div className="page-content">
                <div className="container-fluid">
                    <Row className="mb-3">
                        <Col>
                            <div className="page-title-box d-flex align-items-center justify-content-between">
                                <div>
                                    <h4 className="mb-0">Yeni Stok Düzeltmesi</h4>
                                    <div className="page-title-right">
                                        <ol className="breadcrumb m-0">
                                            <li className="breadcrumb-item">
                                                <Link href={route('stock.index')}>Stok Yönetimi</Link>
                                            </li>
                                            <li className="breadcrumb-item">
                                                <Link href={route('stock.adjustments')}>Stok Düzeltmeleri</Link>
                                            </li>
                                            <li className="breadcrumb-item active">Yeni Düzeltme</li>
                                        </ol>
                                    </div>
                                </div>
                                <div className="d-flex gap-2">
                                    <Link 
                                        href={route('stock.adjustments')} 
                                        className="btn btn-secondary"
                                    >
                                        <i className="ri-arrow-left-line me-1"></i>
                                        Geri Dön
                                    </Link>
                                </div>
                            </div>
                        </Col>
                    </Row>

                    <Form onSubmit={handleSubmit}>
                        <Row>
                            <Col lg={8}>
                                <Card>
                                    <Card.Header>
                                        <h5 className="card-title mb-0">Düzeltme Bilgileri</h5>
                                    </Card.Header>
                                    <Card.Body>
                                        <Row className="mb-3">
                                            <Col md={6}>
                                                <Form.Group>
                                                    <Form.Label>Düzeltme Başlığı *</Form.Label>
                                                    <Form.Control
                                                        type="text"
                                                        value={formData.title}
                                                        onChange={(e) => handleInputChange('title', e.target.value)}
                                                        placeholder="Düzeltme açıklaması girin"
                                                        isInvalid={!!errors.title}
                                                        required
                                                    />
                                                    <Form.Control.Feedback type="invalid">
                                                        {errors.title}
                                                    </Form.Control.Feedback>
                                                </Form.Group>
                                            </Col>
                                            <Col md={6}>
                                                <Form.Group>
                                                    <Form.Label>Düzeltme Türü</Form.Label>
                                                    <Form.Select
                                                        value={formData.adjustment_type}
                                                        onChange={(e) => handleInputChange('adjustment_type', e.target.value)}
                                                    >
                                                        {adjustmentTypes.map(type => (
                                                            <option key={type.value} value={type.value}>
                                                                {type.label}
                                                            </option>
                                                        ))}
                                                    </Form.Select>
                                                </Form.Group>
                                            </Col>
                                        </Row>

                                        <Row className="mb-3">
                                            <Col md={6}>
                                                <Form.Group>
                                                    <Form.Label>Genel Sebep Kodu</Form.Label>
                                                    <Form.Select
                                                        value={formData.reason_code}
                                                        onChange={(e) => handleInputChange('reason_code', e.target.value)}
                                                    >
                                                        {Object.entries(reasonCodes).map(([code, label]) => (
                                                            <option key={code} value={code}>
                                                                {label}
                                                            </option>
                                                        ))}
                                                    </Form.Select>
                                                </Form.Group>
                                            </Col>
                                        </Row>

                                        <Row className="mb-3">
                                            <Col>
                                                <Form.Group>
                                                    <Form.Label>Açıklama</Form.Label>
                                                    <Form.Control
                                                        as="textarea"
                                                        rows={3}
                                                        value={formData.description}
                                                        onChange={(e) => handleInputChange('description', e.target.value)}
                                                        placeholder="Stok düzeltmesi hakkında detaylı açıklama..."
                                                    />
                                                </Form.Group>
                                            </Col>
                                        </Row>

                                        <Row>
                                            <Col>
                                                <Form.Group>
                                                    <Form.Label>Notlar</Form.Label>
                                                    <Form.Control
                                                        as="textarea"
                                                        rows={2}
                                                        value={formData.notes}
                                                        onChange={(e) => handleInputChange('notes', e.target.value)}
                                                        placeholder="Ek notlar ve özel talimatlar..."
                                                    />
                                                </Form.Group>
                                            </Col>
                                        </Row>
                                    </Card.Body>
                                </Card>

                                {/* Adjustment Items */}
                                <Card>
                                    <Card.Header className="d-flex align-items-center justify-content-between">
                                        <h5 className="card-title mb-0">Düzeltme Kalemleri</h5>
                                        <Button 
                                            variant="primary" 
                                            size="sm"
                                            onClick={() => setShowProductModal(true)}
                                        >
                                            <i className="ri-add-line me-1"></i>
                                            Ürün Ekle
                                        </Button>
                                    </Card.Header>
                                    <Card.Body>
                                        {items.length === 0 ? (
                                            <div className="text-center py-4">
                                                <i className="ri-file-list-3-line fs-1 text-muted"></i>
                                                <p className="text-muted mt-2">Henüz düzeltme kalemi eklenmedi</p>
                                                <Button 
                                                    variant="outline-primary"
                                                    onClick={() => setShowProductModal(true)}
                                                >
                                                    <i className="ri-add-line me-1"></i>
                                                    İlk Kalemi Ekle
                                                </Button>
                                            </div>
                                        ) : (
                                            <div className="table-responsive">
                                                <Table hover>
                                                    <thead className="table-light">
                                                        <tr>
                                                            <th>Ürün</th>
                                                            <th className="text-center">Mevcut Stok</th>
                                                            <th className="text-center">Yeni Stok</th>
                                                            <th className="text-center">Düzeltme</th>
                                                            <th className="text-end">Birim Maliyet</th>
                                                            <th className="text-end">Toplam Etki</th>
                                                            <th className="text-center">İşlemler</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {items.map((item, index) => (
                                                            <tr key={index}>
                                                                <td>
                                                                    <div>
                                                                        <div className="fw-medium">{item.product?.name}</div>
                                                                        <small className="text-muted">{item.product?.code}</small>
                                                                        {item.notes && (
                                                                            <div>
                                                                                <small className="text-info">
                                                                                    <i className="ri-information-line me-1"></i>
                                                                                    {item.notes}
                                                                                </small>
                                                                            </div>
                                                                        )}
                                                                        <div>
                                                                            <Badge bg="outline-secondary" className="fs-7">
                                                                                {reasonCodes[item.reason_code]}
                                                                            </Badge>
                                                                        </div>
                                                                    </div>
                                                                </td>
                                                                <td className="text-center">
                                                                    <Badge bg="secondary">
                                                                        {item.before_quantity}
                                                                    </Badge>
                                                                </td>
                                                                <td className="text-center">
                                                                    <InputGroup size="sm" style={{ width: '120px', margin: '0 auto' }}>
                                                                        <Button
                                                                            variant="outline-secondary"
                                                                            onClick={() => updateItemQuantity(index, Math.max(0, item.after_quantity - 1))}
                                                                        >
                                                                            -
                                                                        </Button>
                                                                        <Form.Control
                                                                            type="number"
                                                                            value={item.after_quantity}
                                                                            onChange={(e) => updateItemQuantity(index, parseFloat(e.target.value) || 0)}
                                                                            min="0"
                                                                            step="0.01"
                                                                            className="text-center"
                                                                        />
                                                                        <Button
                                                                            variant="outline-secondary"
                                                                            onClick={() => updateItemQuantity(index, item.after_quantity + 1)}
                                                                        >
                                                                            +
                                                                        </Button>
                                                                    </InputGroup>
                                                                </td>
                                                                <td className="text-center">
                                                                    <Badge bg={getAdjustmentBadgeColor(item.adjustment_quantity)}>
                                                                        <i className={`${getAdjustmentIcon(item.adjustment_quantity)} me-1`}></i>
                                                                        {item.adjustment_quantity > 0 ? '+' : ''}{item.adjustment_quantity}
                                                                    </Badge>
                                                                </td>
                                                                <td className="text-end">
                                                                    {formatCurrency(item.unit_cost)}
                                                                </td>
                                                                <td className="text-end fw-medium">
                                                                    <span className={item.adjustment_quantity < 0 ? 'text-danger' : 'text-success'}>
                                                                        {formatCurrency(item.total_cost)}
                                                                    </span>
                                                                </td>
                                                                <td className="text-center">
                                                                    <Button
                                                                        variant="outline-danger"
                                                                        size="sm"
                                                                        onClick={() => removeItem(index)}
                                                                    >
                                                                        <i className="ri-delete-bin-line"></i>
                                                                    </Button>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                    <tfoot>
                                                        <tr className="table-active">
                                                            <th colSpan={5}>Toplam Etki</th>
                                                            <th className="text-end">{formatCurrency(getTotalAdjustmentValue())}</th>
                                                            <th></th>
                                                        </tr>
                                                    </tfoot>
                                                </Table>
                                            </div>
                                        )}
                                    </Card.Body>
                                </Card>
                            </Col>

                            <Col lg={4}>
                                <Card className="position-sticky" style={{ top: '80px' }}>
                                    <Card.Header>
                                        <h5 className="card-title mb-0">Düzeltme Özeti</h5>
                                    </Card.Header>
                                    <Card.Body>
                                        <div className="d-flex justify-content-between mb-2">
                                            <span>Düzeltme Türü:</span>
                                            <span className="fw-medium">{getAdjustmentTypeText(formData.adjustment_type)}</span>
                                        </div>
                                        <div className="d-flex justify-content-between mb-2">
                                            <span>Ana Sebep:</span>
                                            <span className="fw-medium">{reasonCodes[formData.reason_code]}</span>
                                        </div>
                                        <div className="d-flex justify-content-between mb-2">
                                            <span>Toplam Kalem:</span>
                                            <span className="fw-medium">{getTotalAdjustmentItems()} Ürün</span>
                                        </div>
                                        <div className="d-flex justify-content-between mb-2">
                                            <span>Artış:</span>
                                            <Badge bg="success">{getPositiveAdjustments()} Kalem</Badge>
                                        </div>
                                        <div className="d-flex justify-content-between mb-2">
                                            <span>Azalış:</span>
                                            <Badge bg="danger">{getNegativeAdjustments()} Kalem</Badge>
                                        </div>
                                        <hr />
                                        <div className="d-flex justify-content-between mb-3">
                                            <span className="fw-medium">Mali Etki:</span>
                                            <span className="fw-bold fs-5 text-primary">{formatCurrency(getTotalAdjustmentValue())}</span>
                                        </div>

                                        <Alert variant="info" className="small">
                                            <i className="ri-information-line me-1"></i>
                                            Düzeltme oluşturulduktan sonra onay bekleyecektir. Onaylandıktan sonra stok seviyeleri otomatik olarak güncellenecektir.
                                        </Alert>

                                        <div className="d-grid gap-2">
                                            <Button 
                                                type="submit" 
                                                variant="success" 
                                                size="lg"
                                                disabled={items.length === 0}
                                            >
                                                <i className="ri-check-line me-1"></i>
                                                Düzeltme Oluştur
                                            </Button>
                                            <Link 
                                                href={route('stock.adjustments')} 
                                                className="btn btn-secondary"
                                            >
                                                <i className="ri-close-line me-1"></i>
                                                İptal
                                            </Link>
                                        </div>
                                    </Card.Body>
                                </Card>
                            </Col>
                        </Row>
                    </Form>
                </div>
            </div>

            {/* Product Selection Modal */}
            <Modal 
                show={showProductModal} 
                onHide={() => setShowProductModal(false)} 
                size="lg"
                centered
            >
                <Modal.Header closeButton>
                    <Modal.Title>Ürün Seç</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {!selectedProduct ? (
                        <>
                            <Form.Group className="mb-3">
                                <Form.Control
                                    type="text"
                                    value={productSearch}
                                    onChange={(e) => setProductSearch(e.target.value)}
                                    placeholder="Ürün adı, kodu veya SKU ile arayın..."
                                    autoFocus
                                />
                            </Form.Group>
                            <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                                {filteredProducts.map(product => (
                                    <div 
                                        key={product.id} 
                                        className="border rounded p-3 mb-2 cursor-pointer hover-bg-light"
                                        onClick={() => handleProductSelect(product)}
                                    >
                                        <div className="d-flex justify-content-between align-items-center">
                                            <div>
                                                <div className="fw-medium">{product.name}</div>
                                                <small className="text-muted">
                                                    {product.code}
                                                    {product.sku && ` • SKU: ${product.sku}`}
                                                </small>
                                            </div>
                                            <div className="text-end">
                                                <div className="fw-medium">{formatCurrency(product.cost_price)}</div>
                                                <Badge bg="secondary">
                                                    Stok: {product.stock_quantity}
                                                </Badge>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    ) : (
                        <div>
                            <Alert variant="info">
                                <strong>{selectedProduct.name}</strong> ({selectedProduct.code}) ürünü seçildi.
                                <br />
                                Mevcut Stok: <strong>{selectedProduct.stock_quantity}</strong>
                            </Alert>

                            <Row>
                                <Col md={6}>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Yeni Stok Miktarı *</Form.Label>
                                        <Form.Control
                                            type="number"
                                            value={newItem.after_quantity}
                                            onChange={(e) => setNewItem({...newItem, after_quantity: parseFloat(e.target.value) || 0})}
                                            min="0"
                                            step="0.01"
                                            required
                                        />
                                        <Form.Text className="text-muted">
                                            Düzeltme: {newItem.after_quantity - selectedProduct.stock_quantity > 0 ? '+' : ''}{newItem.after_quantity - selectedProduct.stock_quantity}
                                        </Form.Text>
                                    </Form.Group>
                                </Col>
                                <Col md={6}>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Sebep Kodu</Form.Label>
                                        <Form.Select
                                            value={newItem.reason_code}
                                            onChange={(e) => setNewItem({...newItem, reason_code: e.target.value})}
                                        >
                                            {Object.entries(reasonCodes).map(([code, label]) => (
                                                <option key={code} value={code}>
                                                    {label}
                                                </option>
                                            ))}
                                        </Form.Select>
                                    </Form.Group>
                                </Col>
                            </Row>

                            <Form.Group className="mb-3">
                                <Form.Label>Notlar</Form.Label>
                                <Form.Control
                                    as="textarea"
                                    rows={2}
                                    value={newItem.notes}
                                    onChange={(e) => setNewItem({...newItem, notes: e.target.value})}
                                    placeholder="Bu düzeltme için özel notlar..."
                                />
                            </Form.Group>
                        </div>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    {!selectedProduct ? (
                        <Button variant="secondary" onClick={() => setShowProductModal(false)}>
                            İptal
                        </Button>
                    ) : (
                        <>
                            <Button variant="secondary" onClick={() => setSelectedProduct(null)}>
                                Geri
                            </Button>
                            <Button 
                                variant="primary" 
                                onClick={addItemToAdjustment}
                            >
                                Kalemi Ekle
                            </Button>
                        </>
                    )}
                </Modal.Footer>
            </Modal>
        </Layout>
    );
}