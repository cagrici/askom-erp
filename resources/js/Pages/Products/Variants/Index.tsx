import React, { useState } from 'react';
import Layout from '@/Layouts';
import { Head, router, useForm } from '@inertiajs/react';
import { Card, Table, Button, Form, Row, Col, InputGroup, Badge, Modal, Alert } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';

interface Variant {
    id: number;
    variant_name: string;
    variant_code: string;
    barcode?: string;
    price?: number;
    cost_price?: number;
    stock_quantity: number;
    is_active: boolean;
    attributes: any;
    product: {
        id: number;
        name: string;
        code: string;
    };
    created_at: string;
}

interface Product {
    id: number;
    name: string;
}

interface Props {
    variants: {
        data: Variant[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
        from?: number;
        to?: number;
        links?: any[];
    };
    filters: {
        search?: string;
        product_id?: number;
        is_active?: boolean;
        stock_status?: string;
    };
    products: Product[];
    flash?: {
        success?: string;
        error?: string;
    };
}

export default function VariantIndex({ variants, filters, products, flash }: Props) {
    const { t } = useTranslation();
    const [localFilters, setLocalFilters] = useState(filters);
    
    // Modal states
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [selectedVariant, setSelectedVariant] = useState<Variant | null>(null);
    const [showAlert, setShowAlert] = useState<{type: 'success' | 'error', message: string} | null>(null);

    // Create form
    const createForm = useForm({
        product_id: '',
        variant_name: '',
        variant_code: '',
        barcode: '',
        price: '',
        cost_price: '',
        stock_quantity: 0,
        is_active: true,
        attributes: {} as any,
    });

    // Edit form
    const editForm = useForm({
        product_id: '',
        variant_name: '',
        variant_code: '',
        barcode: '',
        price: '',
        cost_price: '',
        stock_quantity: 0,
        is_active: true,
        attributes: {} as any,
    });

    // Flash message handling
    React.useEffect(() => {
        if (flash?.success) {
            setShowAlert({type: 'success', message: flash.success});
            setTimeout(() => setShowAlert(null), 5000);
        } else if (flash?.error) {
            setShowAlert({type: 'error', message: flash.error});
            setTimeout(() => setShowAlert(null), 8000);
        }
    }, [flash]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(route('product-variants.index'), localFilters, { preserveState: true });
    };

    const resetSearch = () => {
        setLocalFilters({});
        router.get(route('product-variants.index'), {}, { preserveState: true });
    };

    const handleCreate = (e: React.FormEvent) => {
        e.preventDefault();
        
        createForm.post(route('product-variants.store'), {
            onSuccess: () => {
                setShowCreateModal(false);
                createForm.reset();
                setShowAlert({type: 'success', message: 'Ürün varyantı başarıyla oluşturuldu.'});
            },
            onError: () => {
                setShowAlert({type: 'error', message: 'Ürün varyantı oluşturulurken bir hata oluştu.'});
            }
        });
    };

    const handleEdit = (variant: Variant) => {
        setSelectedVariant(variant);
        editForm.setData({
            product_id: variant.product.id.toString(),
            variant_name: variant.variant_name,
            variant_code: variant.variant_code,
            barcode: variant.barcode || '',
            price: variant.price?.toString() || '',
            cost_price: variant.cost_price?.toString() || '',
            stock_quantity: variant.stock_quantity,
            is_active: variant.is_active,
            attributes: variant.attributes || {},
        });
        setShowEditModal(true);
    };

    const handleUpdate = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedVariant) return;
        
        editForm.put(route('product-variants.update', selectedVariant.id), {
            onSuccess: () => {
                setShowEditModal(false);
                editForm.reset();
                setSelectedVariant(null);
                setShowAlert({type: 'success', message: 'Ürün varyantı başarıyla güncellendi.'});
            },
            onError: () => {
                setShowAlert({type: 'error', message: 'Ürün varyantı güncellenirken bir hata oluştu.'});
            }
        });
    };

    const handleDelete = (variant: Variant) => {
        setSelectedVariant(variant);
        setShowDeleteModal(true);
    };

    const confirmDelete = () => {
        if (!selectedVariant) return;
        
        router.delete(route('product-variants.destroy', selectedVariant.id), {
            onSuccess: () => {
                setShowDeleteModal(false);
                setSelectedVariant(null);
                setShowAlert({type: 'success', message: 'Ürün varyantı başarıyla silindi.'});
            },
            onError: () => {
                setShowAlert({type: 'error', message: 'Ürün varyantı silinirken bir hata oluştu.'});
            }
        });
    };

    const getStockBadge = (quantity: number) => {
        if (quantity <= 0) {
            return <Badge bg="danger">Stokta Yok</Badge>;
        } else if (quantity <= 10) {
            return <Badge bg="warning">Düşük Stok</Badge>;
        } else {
            return <Badge bg="success">Stokta Var</Badge>;
        }
    };

    const formatPrice = (price?: number) => {
        return price ? `₺${price.toLocaleString()}` : '-';
    };

    const renderAttributes = (attributes: any) => {
        if (!attributes || typeof attributes !== 'object') return null;
        
        return Object.entries(attributes).map(([key, value], index) => (
            <Badge key={index} bg="light" text="dark" className="small me-1">
                {key}: {String(value)}
            </Badge>
        ));
    };

    return (
        <>
            <Head title="Ürün Varyantları" />
            <Layout>
                <div className="page-content">
                    <div className="container-fluid">
                        <Row className="mb-3">
                            <Col>
                                <div className="page-title-box d-flex align-items-center justify-content-between">
                                    <h4 className="mb-0">Ürün Varyantları</h4>
                                    <Button
                                        variant="primary"
                                        onClick={() => setShowCreateModal(true)}
                                    >
                                        <i className="ri-add-line me-1"></i>
                                        Yeni Varyant
                                    </Button>
                                </div>
                            </Col>
                        </Row>

                        {showAlert && (
                            <Row className="mb-3">
                                <Col>
                                    <Alert variant={showAlert.type === 'success' ? 'success' : 'danger'} dismissible onClose={() => setShowAlert(null)}>
                                        {showAlert.message}
                                    </Alert>
                                </Col>
                            </Row>
                        )}

                        <Card>
                            <Card.Header>
                                <Form onSubmit={handleSearch}>
                                    <Row>
                                        <Col md={4}>
                                            <InputGroup>
                                                <Form.Control
                                                    type="text"
                                                    placeholder="Varyant adı, kodu veya ürün ara..."
                                                    value={localFilters.search || ''}
                                                    onChange={(e) => setLocalFilters(prev => ({ ...prev, search: e.target.value }))}
                                                />
                                                <Button type="submit" variant="outline-secondary">
                                                    <i className="ri-search-line"></i>
                                                </Button>
                                            </InputGroup>
                                        </Col>
                                        <Col md={2}>
                                            <Form.Select
                                                value={localFilters.product_id || ''}
                                                onChange={(e) => setLocalFilters(prev => ({
                                                    ...prev,
                                                    product_id: e.target.value ? parseInt(e.target.value) : undefined
                                                }))}
                                            >
                                                <option value="">Tüm Ürünler</option>
                                                {products.map(product => (
                                                    <option key={product.id} value={product.id}>
                                                        {product.name}
                                                    </option>
                                                ))}
                                            </Form.Select>
                                        </Col>
                                        <Col md={2}>
                                            <Form.Select
                                                value={localFilters.is_active?.toString() || ''}
                                                onChange={(e) => setLocalFilters(prev => ({
                                                    ...prev,
                                                    is_active: e.target.value === '' ? undefined : e.target.value === 'true'
                                                }))}
                                            >
                                                <option value="">Tüm Durumlar</option>
                                                <option value="true">Aktif</option>
                                                <option value="false">Pasif</option>
                                            </Form.Select>
                                        </Col>
                                        <Col md={2}>
                                            <Form.Select
                                                value={localFilters.stock_status || ''}
                                                onChange={(e) => setLocalFilters(prev => ({
                                                    ...prev,
                                                    stock_status: e.target.value || undefined
                                                }))}
                                            >
                                                <option value="">Tüm Stoklar</option>
                                                <option value="in_stock">Stokta Var</option>
                                                <option value="low_stock">Düşük Stok</option>
                                                <option value="out_of_stock">Stokta Yok</option>
                                            </Form.Select>
                                        </Col>
                                        <Col md={2}>
                                            <Button variant="secondary" onClick={resetSearch}>
                                                <i className="ri-refresh-line me-1"></i>
                                                Temizle
                                            </Button>
                                        </Col>
                                    </Row>
                                </Form>
                            </Card.Header>
                            <Card.Body className="p-0">
                                <Table responsive className="table-centered table-nowrap mb-0">
                                    <thead className="table-light">
                                        <tr>
                                            <th>Varyant Bilgileri</th>
                                            <th>Ürün</th>
                                            <th>Özellikler</th>
                                            <th>Fiyat</th>
                                            <th>Stok</th>
                                            <th>Durum</th>
                                            <th>İşlemler</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {variants.data.map((variant) => (
                                            <tr key={variant.id}>
                                                <td>
                                                    <div>
                                                        <h6 className="mb-0">{variant.variant_name}</h6>
                                                        <small className="text-muted">Kod: {variant.variant_code}</small>
                                                        {variant.barcode && (
                                                            <div className="small text-muted">Barkod: {variant.barcode}</div>
                                                        )}
                                                    </div>
                                                </td>
                                                <td>
                                                    <div>
                                                        <div className="fw-medium">{variant.product.name}</div>
                                                        <small className="text-muted">{variant.product.code}</small>
                                                    </div>
                                                </td>
                                                <td>
                                                    <div className="d-flex flex-wrap gap-1">
                                                        {renderAttributes(variant.attributes)}
                                                    </div>
                                                </td>
                                                <td>
                                                    <div>
                                                        <div className="fw-medium">{formatPrice(variant.price)}</div>
                                                        {variant.cost_price && (
                                                            <small className="text-muted">
                                                                Maliyet: {formatPrice(variant.cost_price)}
                                                            </small>
                                                        )}
                                                    </div>
                                                </td>
                                                <td>
                                                    <div>
                                                        <div className="fw-medium">{variant.stock_quantity}</div>
                                                        {getStockBadge(variant.stock_quantity)}
                                                    </div>
                                                </td>
                                                <td>
                                                    <Badge bg={variant.is_active ? 'success' : 'danger'}>
                                                        {variant.is_active ? 'Aktif' : 'Pasif'}
                                                    </Badge>
                                                </td>
                                                <td>
                                                    <div className="d-flex gap-1">
                                                        <Button
                                                            variant="outline-primary"
                                                            size="sm"
                                                            onClick={() => handleEdit(variant)}
                                                        >
                                                            <i className="ri-edit-line"></i>
                                                        </Button>
                                                        <Button
                                                            variant="outline-danger"
                                                            size="sm"
                                                            onClick={() => handleDelete(variant)}
                                                        >
                                                            <i className="ri-delete-bin-line"></i>
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </Table>
                                
                                {variants.data.length === 0 && (
                                    <div className="text-center py-4">
                                        <i className="ri-palette-line text-muted" style={{ fontSize: '3rem' }}></i>
                                        <p className="text-muted mt-2">Ürün varyantı bulunamadı</p>
                                    </div>
                                )}
                            </Card.Body>
                        </Card>
                    </div>
                </div>

                {/* Create Modal */}
                <Modal show={showCreateModal} onHide={() => setShowCreateModal(false)} size="lg">
                    <Modal.Header closeButton>
                        <Modal.Title>Yeni Ürün Varyantı Ekle</Modal.Title>
                    </Modal.Header>
                    <Form onSubmit={handleCreate}>
                        <Modal.Body>
                            <Row>
                                <Col md={6}>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Ürün <span className="text-danger">*</span></Form.Label>
                                        <Form.Select
                                            value={createForm.data.product_id}
                                            onChange={(e) => createForm.setData('product_id', e.target.value)}
                                            isInvalid={!!createForm.errors.product_id}
                                        >
                                            <option value="">Ürün seçin</option>
                                            {products.map(product => (
                                                <option key={product.id} value={product.id}>
                                                    {product.name}
                                                </option>
                                            ))}
                                        </Form.Select>
                                        <Form.Control.Feedback type="invalid">
                                            {createForm.errors.product_id}
                                        </Form.Control.Feedback>
                                    </Form.Group>
                                </Col>
                                <Col md={6}>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Varyant Adı <span className="text-danger">*</span></Form.Label>
                                        <Form.Control
                                            type="text"
                                            value={createForm.data.variant_name}
                                            onChange={(e) => createForm.setData('variant_name', e.target.value)}
                                            isInvalid={!!createForm.errors.variant_name}
                                            placeholder="Varyant adını girin"
                                        />
                                        <Form.Control.Feedback type="invalid">
                                            {createForm.errors.variant_name}
                                        </Form.Control.Feedback>
                                    </Form.Group>
                                </Col>
                            </Row>

                            <Row>
                                <Col md={6}>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Varyant Kodu</Form.Label>
                                        <Form.Control
                                            type="text"
                                            value={createForm.data.variant_code}
                                            onChange={(e) => createForm.setData('variant_code', e.target.value)}
                                            isInvalid={!!createForm.errors.variant_code}
                                            placeholder="Otomatik oluşur"
                                        />
                                        <Form.Control.Feedback type="invalid">
                                            {createForm.errors.variant_code}
                                        </Form.Control.Feedback>
                                    </Form.Group>
                                </Col>
                                <Col md={6}>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Barkod</Form.Label>
                                        <Form.Control
                                            type="text"
                                            value={createForm.data.barcode}
                                            onChange={(e) => createForm.setData('barcode', e.target.value)}
                                            isInvalid={!!createForm.errors.barcode}
                                        />
                                        <Form.Control.Feedback type="invalid">
                                            {createForm.errors.barcode}
                                        </Form.Control.Feedback>
                                    </Form.Group>
                                </Col>
                            </Row>

                            <Row>
                                <Col md={4}>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Satış Fiyatı</Form.Label>
                                        <Form.Control
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            value={createForm.data.price}
                                            onChange={(e) => createForm.setData('price', e.target.value)}
                                            isInvalid={!!createForm.errors.price}
                                        />
                                        <Form.Control.Feedback type="invalid">
                                            {createForm.errors.price}
                                        </Form.Control.Feedback>
                                    </Form.Group>
                                </Col>
                                <Col md={4}>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Maliyet Fiyatı</Form.Label>
                                        <Form.Control
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            value={createForm.data.cost_price}
                                            onChange={(e) => createForm.setData('cost_price', e.target.value)}
                                            isInvalid={!!createForm.errors.cost_price}
                                        />
                                        <Form.Control.Feedback type="invalid">
                                            {createForm.errors.cost_price}
                                        </Form.Control.Feedback>
                                    </Form.Group>
                                </Col>
                                <Col md={4}>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Stok Miktarı</Form.Label>
                                        <Form.Control
                                            type="number"
                                            min="0"
                                            value={createForm.data.stock_quantity}
                                            onChange={(e) => createForm.setData('stock_quantity', parseInt(e.target.value) || 0)}
                                            isInvalid={!!createForm.errors.stock_quantity}
                                        />
                                        <Form.Control.Feedback type="invalid">
                                            {createForm.errors.stock_quantity}
                                        </Form.Control.Feedback>
                                    </Form.Group>
                                </Col>
                            </Row>

                            <Row>
                                <Col md={6}>
                                    <Form.Group className="mb-3">
                                        <Form.Check
                                            type="checkbox"
                                            id="create_is_active"
                                            label="Aktif"
                                            checked={createForm.data.is_active}
                                            onChange={(e) => createForm.setData('is_active', e.target.checked)}
                                        />
                                    </Form.Group>
                                </Col>
                            </Row>
                        </Modal.Body>
                        <Modal.Footer>
                            <Button variant="secondary" onClick={() => setShowCreateModal(false)}>
                                İptal
                            </Button>
                            <Button type="submit" variant="primary" disabled={createForm.processing}>
                                {createForm.processing ? (
                                    <>
                                        <span className="spinner-border spinner-border-sm me-2"></span>
                                        Oluşturuluyor...
                                    </>
                                ) : (
                                    'Varyant Oluştur'
                                )}
                            </Button>
                        </Modal.Footer>
                    </Form>
                </Modal>

                {/* Edit Modal */}
                <Modal show={showEditModal} onHide={() => setShowEditModal(false)} size="lg">
                    <Modal.Header closeButton>
                        <Modal.Title>Ürün Varyantı Düzenle</Modal.Title>
                    </Modal.Header>
                    <Form onSubmit={handleUpdate}>
                        <Modal.Body>
                            <Row>
                                <Col md={6}>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Ürün <span className="text-danger">*</span></Form.Label>
                                        <Form.Select
                                            value={editForm.data.product_id}
                                            onChange={(e) => editForm.setData('product_id', e.target.value)}
                                            isInvalid={!!editForm.errors.product_id}
                                        >
                                            <option value="">Ürün seçin</option>
                                            {products.map(product => (
                                                <option key={product.id} value={product.id}>
                                                    {product.name}
                                                </option>
                                            ))}
                                        </Form.Select>
                                        <Form.Control.Feedback type="invalid">
                                            {editForm.errors.product_id}
                                        </Form.Control.Feedback>
                                    </Form.Group>
                                </Col>
                                <Col md={6}>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Varyant Adı <span className="text-danger">*</span></Form.Label>
                                        <Form.Control
                                            type="text"
                                            value={editForm.data.variant_name}
                                            onChange={(e) => editForm.setData('variant_name', e.target.value)}
                                            isInvalid={!!editForm.errors.variant_name}
                                            placeholder="Varyant adını girin"
                                        />
                                        <Form.Control.Feedback type="invalid">
                                            {editForm.errors.variant_name}
                                        </Form.Control.Feedback>
                                    </Form.Group>
                                </Col>
                            </Row>

                            <Row>
                                <Col md={6}>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Varyant Kodu</Form.Label>
                                        <Form.Control
                                            type="text"
                                            value={editForm.data.variant_code}
                                            onChange={(e) => editForm.setData('variant_code', e.target.value)}
                                            isInvalid={!!editForm.errors.variant_code}
                                        />
                                        <Form.Control.Feedback type="invalid">
                                            {editForm.errors.variant_code}
                                        </Form.Control.Feedback>
                                    </Form.Group>
                                </Col>
                                <Col md={6}>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Barkod</Form.Label>
                                        <Form.Control
                                            type="text"
                                            value={editForm.data.barcode}
                                            onChange={(e) => editForm.setData('barcode', e.target.value)}
                                            isInvalid={!!editForm.errors.barcode}
                                        />
                                        <Form.Control.Feedback type="invalid">
                                            {editForm.errors.barcode}
                                        </Form.Control.Feedback>
                                    </Form.Group>
                                </Col>
                            </Row>

                            <Row>
                                <Col md={4}>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Satış Fiyatı</Form.Label>
                                        <Form.Control
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            value={editForm.data.price}
                                            onChange={(e) => editForm.setData('price', e.target.value)}
                                            isInvalid={!!editForm.errors.price}
                                        />
                                        <Form.Control.Feedback type="invalid">
                                            {editForm.errors.price}
                                        </Form.Control.Feedback>
                                    </Form.Group>
                                </Col>
                                <Col md={4}>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Maliyet Fiyatı</Form.Label>
                                        <Form.Control
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            value={editForm.data.cost_price}
                                            onChange={(e) => editForm.setData('cost_price', e.target.value)}
                                            isInvalid={!!editForm.errors.cost_price}
                                        />
                                        <Form.Control.Feedback type="invalid">
                                            {editForm.errors.cost_price}
                                        </Form.Control.Feedback>
                                    </Form.Group>
                                </Col>
                                <Col md={4}>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Stok Miktarı</Form.Label>
                                        <Form.Control
                                            type="number"
                                            min="0"
                                            value={editForm.data.stock_quantity}
                                            onChange={(e) => editForm.setData('stock_quantity', parseInt(e.target.value) || 0)}
                                            isInvalid={!!editForm.errors.stock_quantity}
                                        />
                                        <Form.Control.Feedback type="invalid">
                                            {editForm.errors.stock_quantity}
                                        </Form.Control.Feedback>
                                    </Form.Group>
                                </Col>
                            </Row>

                            <Row>
                                <Col md={6}>
                                    <Form.Group className="mb-3">
                                        <Form.Check
                                            type="checkbox"
                                            id="edit_is_active"
                                            label="Aktif"
                                            checked={editForm.data.is_active}
                                            onChange={(e) => editForm.setData('is_active', e.target.checked)}
                                        />
                                    </Form.Group>
                                </Col>
                            </Row>
                        </Modal.Body>
                        <Modal.Footer>
                            <Button variant="secondary" onClick={() => setShowEditModal(false)}>
                                İptal
                            </Button>
                            <Button type="submit" variant="primary" disabled={editForm.processing}>
                                {editForm.processing ? (
                                    <>
                                        <span className="spinner-border spinner-border-sm me-2"></span>
                                        Güncelleniyor...
                                    </>
                                ) : (
                                    'Varyant Güncelle'
                                )}
                            </Button>
                        </Modal.Footer>
                    </Form>
                </Modal>

                {/* Delete Modal */}
                <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
                    <Modal.Header closeButton>
                        <Modal.Title>Ürün Varyantı Sil</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <p>
                            <strong>"{selectedVariant?.variant_name}"</strong> varyantını silmek istediğinizden emin misiniz?
                        </p>
                        <p className="text-muted small">
                            Bu işlem geri alınamaz.
                        </p>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
                            İptal
                        </Button>
                        <Button variant="danger" onClick={confirmDelete}>
                            <i className="ri-delete-bin-line me-1"></i>
                            Sil
                        </Button>
                    </Modal.Footer>
                </Modal>
            </Layout>
        </>
    );
}