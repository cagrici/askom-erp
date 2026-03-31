import React, { useState } from 'react';
import Layout from '@/Layouts';
import { Head, Link, router } from '@inertiajs/react';
import { Card, Button, Form, Row, Col, Alert, Table, Modal, InputGroup, Badge } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';

interface User {
    id: number;
    name: string;
    email: string;
}

interface Location {
    id: number;
    name: string;
    code: string;
    address?: string;
}

interface Product {
    id: number;
    name: string;
    code: string;
    current_stock: number;
    unit_name: string;
    cost_price: number;
}

interface ProductUnit {
    id: number;
    name: string;
    conversion_factor: number;
}

interface TransferItem {
    product_id: number;
    product?: Product;
    product_unit_id?: number;
    quantity: number;
    unit_cost: number;
    total_cost: number;
    notes?: string;
}

interface Props {
    locations: Location[];
    users: User[];
    products: Product[];
    productUnits: ProductUnit[];
    errors: Record<string, string>;
}

export default function CreateTransfer({ locations, users, products, productUnits, errors }: Props) {
    const { t } = useTranslation();
    
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        from_location_id: '',
        to_location_id: '',
        transfer_type: 'internal',
        priority: 'normal',
        expected_date: '',
        notes: ''
    });

    const [items, setItems] = useState<TransferItem[]>([]);
    const [showProductModal, setShowProductModal] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [productSearch, setProductSearch] = useState('');
    const [newItem, setNewItem] = useState({
        quantity: 1,
        product_unit_id: '',
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
        product.code.toLowerCase().includes(productSearch.toLowerCase())
    );

    const handleProductSelect = (product: Product) => {
        setSelectedProduct(product);
        setNewItem({
            quantity: 1,
            product_unit_id: '',
            notes: ''
        });
    };

    const addItemToTransfer = () => {
        if (!selectedProduct) return;

        const unitCost = selectedProduct.cost_price || 0;
        const totalCost = newItem.quantity * unitCost;

        const transferItem: TransferItem = {
            product_id: selectedProduct.id,
            product: selectedProduct,
            product_unit_id: newItem.product_unit_id ? parseInt(newItem.product_unit_id) : undefined,
            quantity: newItem.quantity,
            unit_cost: unitCost,
            total_cost: totalCost,
            notes: newItem.notes
        };

        setItems(prev => [...prev, transferItem]);
        setShowProductModal(false);
        setSelectedProduct(null);
        setProductSearch('');
    };

    const removeItem = (index: number) => {
        setItems(prev => prev.filter((_, i) => i !== index));
    };

    const updateItemQuantity = (index: number, quantity: number) => {
        setItems(prev => prev.map((item, i) => {
            if (i === index) {
                const totalCost = quantity * item.unit_cost;
                return { ...item, quantity, total_cost: totalCost };
            }
            return item;
        }));
    };

    const getTotalValue = () => {
        return items.reduce((sum, item) => sum + item.total_cost, 0);
    };

    const getTotalItems = () => {
        return items.reduce((sum, item) => sum + item.quantity, 0);
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
                product_unit_id: item.product_unit_id,
                quantity: item.quantity,
                unit_cost: item.unit_cost,
                total_cost: item.total_cost,
                notes: item.notes
            })),
            total_items: getTotalItems(),
            total_value: getTotalValue()
        };

        router.post(route('stock.transfers.store'), submitData);
    };

    const formatCurrency = (amount: number) => {
        return `₺${amount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}`;
    };

    const getTransferTypeText = (type: string) => {
        const types = {
            'internal': 'İç Transfer',
            'external': 'Dış Transfer',
            'warehouse_to_store': 'Depo → Mağaza',
            'store_to_warehouse': 'Mağaza → Depo',
            'store_to_store': 'Mağaza → Mağaza',
            'emergency': 'Acil Transfer',
            'return': 'İade Transfer'
        };
        return types[type] || type;
    };

    const getPriorityText = (priority: string) => {
        const priorities = {
            'low': 'Düşük',
            'normal': 'Normal',
            'high': 'Yüksek',
            'urgent': 'Acil'
        };
        return priorities[priority] || priority;
    };

    const getPriorityColor = (priority: string) => {
        const colors = {
            'low': 'secondary',
            'normal': 'primary',
            'high': 'warning',
            'urgent': 'danger'
        };
        return colors[priority] || 'primary';
    };

    return (
        <Layout>
            <Head title="Yeni Stok Transferi" />

            <div className="page-content">
                <div className="container-fluid">
                    <Row className="mb-3">
                        <Col>
                            <div className="page-title-box d-flex align-items-center justify-content-between">
                                <div>
                                    <h4 className="mb-0">Yeni Stok Transferi</h4>
                                    <div className="page-title-right">
                                        <ol className="breadcrumb m-0">
                                            <li className="breadcrumb-item">
                                                <Link href={route('stock.index')}>Stok Yönetimi</Link>
                                            </li>
                                            <li className="breadcrumb-item">
                                                <Link href={route('stock.transfers')}>Stok Transferleri</Link>
                                            </li>
                                            <li className="breadcrumb-item active">Yeni Transfer</li>
                                        </ol>
                                    </div>
                                </div>
                                <div className="d-flex gap-2">
                                    <Link 
                                        href={route('stock.transfers')} 
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
                                        <h5 className="card-title mb-0">Transfer Bilgileri</h5>
                                    </Card.Header>
                                    <Card.Body>
                                        <Row className="mb-3">
                                            <Col md={6}>
                                                <Form.Group>
                                                    <Form.Label>Transfer Başlığı *</Form.Label>
                                                    <Form.Control
                                                        type="text"
                                                        value={formData.title}
                                                        onChange={(e) => handleInputChange('title', e.target.value)}
                                                        placeholder="Transfer açıklaması girin"
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
                                                    <Form.Label>Transfer Türü</Form.Label>
                                                    <Form.Select
                                                        value={formData.transfer_type}
                                                        onChange={(e) => handleInputChange('transfer_type', e.target.value)}
                                                    >
                                                        <option value="internal">İç Transfer</option>
                                                        <option value="external">Dış Transfer</option>
                                                        <option value="warehouse_to_store">Depo → Mağaza</option>
                                                        <option value="store_to_warehouse">Mağaza → Depo</option>
                                                        <option value="store_to_store">Mağaza → Mağaza</option>
                                                        <option value="emergency">Acil Transfer</option>
                                                        <option value="return">İade Transfer</option>
                                                    </Form.Select>
                                                </Form.Group>
                                            </Col>
                                        </Row>

                                        <Row className="mb-3">
                                            <Col md={6}>
                                                <Form.Group>
                                                    <Form.Label>Kaynak Lokasyon *</Form.Label>
                                                    <Form.Select
                                                        value={formData.from_location_id}
                                                        onChange={(e) => handleInputChange('from_location_id', e.target.value)}
                                                        isInvalid={!!errors.from_location_id}
                                                        required
                                                    >
                                                        <option value="">Kaynak lokasyon seçin</option>
                                                        {locations.map(location => (
                                                            <option key={location.id} value={location.id}>
                                                                {location.name} ({location.code})
                                                            </option>
                                                        ))}
                                                    </Form.Select>
                                                    <Form.Control.Feedback type="invalid">
                                                        {errors.from_location_id}
                                                    </Form.Control.Feedback>
                                                </Form.Group>
                                            </Col>
                                            <Col md={6}>
                                                <Form.Group>
                                                    <Form.Label>Hedef Lokasyon *</Form.Label>
                                                    <Form.Select
                                                        value={formData.to_location_id}
                                                        onChange={(e) => handleInputChange('to_location_id', e.target.value)}
                                                        isInvalid={!!errors.to_location_id}
                                                        required
                                                    >
                                                        <option value="">Hedef lokasyon seçin</option>
                                                        {locations.map(location => (
                                                            <option key={location.id} value={location.id}>
                                                                {location.name} ({location.code})
                                                            </option>
                                                        ))}
                                                    </Form.Select>
                                                    <Form.Control.Feedback type="invalid">
                                                        {errors.to_location_id}
                                                    </Form.Control.Feedback>
                                                </Form.Group>
                                            </Col>
                                        </Row>

                                        <Row className="mb-3">
                                            <Col md={6}>
                                                <Form.Group>
                                                    <Form.Label>Öncelik</Form.Label>
                                                    <Form.Select
                                                        value={formData.priority}
                                                        onChange={(e) => handleInputChange('priority', e.target.value)}
                                                    >
                                                        <option value="low">Düşük</option>
                                                        <option value="normal">Normal</option>
                                                        <option value="high">Yüksek</option>
                                                        <option value="urgent">Acil</option>
                                                    </Form.Select>
                                                </Form.Group>
                                            </Col>
                                            <Col md={6}>
                                                <Form.Group>
                                                    <Form.Label>Beklenen Tarih</Form.Label>
                                                    <Form.Control
                                                        type="date"
                                                        value={formData.expected_date}
                                                        onChange={(e) => handleInputChange('expected_date', e.target.value)}
                                                        min={new Date().toISOString().split('T')[0]}
                                                    />
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
                                                        placeholder="Transfer hakkında detaylı açıklama..."
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

                                {/* Transfer Items */}
                                <Card>
                                    <Card.Header className="d-flex align-items-center justify-content-between">
                                        <h5 className="card-title mb-0">Transfer Ürünleri</h5>
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
                                                <i className="ri-package-line fs-1 text-muted"></i>
                                                <p className="text-muted mt-2">Henüz ürün eklenmedi</p>
                                                <Button 
                                                    variant="outline-primary"
                                                    onClick={() => setShowProductModal(true)}
                                                >
                                                    <i className="ri-add-line me-1"></i>
                                                    İlk Ürünü Ekle
                                                </Button>
                                            </div>
                                        ) : (
                                            <div className="table-responsive">
                                                <Table hover>
                                                    <thead className="table-light">
                                                        <tr>
                                                            <th>Ürün</th>
                                                            <th className="text-center">Mevcut Stok</th>
                                                            <th className="text-center">Miktar</th>
                                                            <th className="text-end">Birim Fiyat</th>
                                                            <th className="text-end">Toplam</th>
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
                                                                    </div>
                                                                </td>
                                                                <td className="text-center">
                                                                    <Badge bg="secondary">
                                                                        {item.product?.current_stock} {item.product?.unit_name}
                                                                    </Badge>
                                                                </td>
                                                                <td className="text-center">
                                                                    <InputGroup size="sm" style={{ width: '120px', margin: '0 auto' }}>
                                                                        <Button
                                                                            variant="outline-secondary"
                                                                            onClick={() => updateItemQuantity(index, Math.max(1, item.quantity - 1))}
                                                                        >
                                                                            -
                                                                        </Button>
                                                                        <Form.Control
                                                                            type="number"
                                                                            value={item.quantity}
                                                                            onChange={(e) => updateItemQuantity(index, parseInt(e.target.value) || 1)}
                                                                            min="1"
                                                                            className="text-center"
                                                                        />
                                                                        <Button
                                                                            variant="outline-secondary"
                                                                            onClick={() => updateItemQuantity(index, item.quantity + 1)}
                                                                        >
                                                                            +
                                                                        </Button>
                                                                    </InputGroup>
                                                                </td>
                                                                <td className="text-end">
                                                                    {formatCurrency(item.unit_cost)}
                                                                </td>
                                                                <td className="text-end fw-medium">
                                                                    {formatCurrency(item.total_cost)}
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
                                                            <th colSpan={2}>Toplam</th>
                                                            <th className="text-center">{getTotalItems()} Adet</th>
                                                            <th></th>
                                                            <th className="text-end">{formatCurrency(getTotalValue())}</th>
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
                                        <h5 className="card-title mb-0">Transfer Özeti</h5>
                                    </Card.Header>
                                    <Card.Body>
                                        <div className="d-flex justify-content-between mb-2">
                                            <span>Transfer Türü:</span>
                                            <span className="fw-medium">{getTransferTypeText(formData.transfer_type)}</span>
                                        </div>
                                        <div className="d-flex justify-content-between mb-2">
                                            <span>Öncelik:</span>
                                            <Badge bg={getPriorityColor(formData.priority)}>
                                                {getPriorityText(formData.priority)}
                                            </Badge>
                                        </div>
                                        <div className="d-flex justify-content-between mb-2">
                                            <span>Toplam Ürün:</span>
                                            <span className="fw-medium">{items.length} Çeşit</span>
                                        </div>
                                        <div className="d-flex justify-content-between mb-2">
                                            <span>Toplam Miktar:</span>
                                            <span className="fw-medium">{getTotalItems()} Adet</span>
                                        </div>
                                        <hr />
                                        <div className="d-flex justify-content-between mb-3">
                                            <span className="fw-medium">Toplam Değer:</span>
                                            <span className="fw-bold fs-5 text-primary">{formatCurrency(getTotalValue())}</span>
                                        </div>

                                        <div className="d-grid gap-2">
                                            <Button 
                                                type="submit" 
                                                variant="success" 
                                                size="lg"
                                                disabled={items.length === 0}
                                            >
                                                <i className="ri-check-line me-1"></i>
                                                Transfer Oluştur
                                            </Button>
                                            <Link 
                                                href={route('stock.transfers')} 
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
                                    placeholder="Ürün adı veya kodu ile arayın..."
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
                                                <small className="text-muted">{product.code}</small>
                                            </div>
                                            <div className="text-end">
                                                <div className="fw-medium">{formatCurrency(product.cost_price)}</div>
                                                <Badge bg="secondary">
                                                    Stok: {product.current_stock} {product.unit_name}
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
                                Mevcut Stok: <strong>{selectedProduct.current_stock} {selectedProduct.unit_name}</strong>
                            </Alert>

                            <Row>
                                <Col md={6}>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Miktar *</Form.Label>
                                        <Form.Control
                                            type="number"
                                            value={newItem.quantity}
                                            onChange={(e) => setNewItem({...newItem, quantity: parseInt(e.target.value) || 1})}
                                            min="1"
                                            max={selectedProduct.current_stock}
                                            required
                                        />
                                    </Form.Group>
                                </Col>
                                <Col md={6}>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Birim</Form.Label>
                                        <Form.Select
                                            value={newItem.product_unit_id}
                                            onChange={(e) => setNewItem({...newItem, product_unit_id: e.target.value})}
                                        >
                                            <option value="">Varsayılan Birim</option>
                                            {productUnits?.map(unit => (
                                                <option key={unit.id} value={unit.id}>
                                                    {unit.name}
                                                </option>
                                            )) || []}
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
                                    placeholder="Bu ürün için özel notlar..."
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
                                onClick={addItemToTransfer}
                                disabled={newItem.quantity <= 0 || newItem.quantity > selectedProduct.current_stock}
                            >
                                Ürünü Ekle
                            </Button>
                        </>
                    )}
                </Modal.Footer>
            </Modal>
        </Layout>
    );
}