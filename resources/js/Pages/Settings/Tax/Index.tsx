import React, { useState } from 'react';
import Layout from '@/Layouts';
import { Head, router, useForm } from '@inertiajs/react';
import { Card, Table, Button, Form, Row, Col, InputGroup, Badge, Modal, Alert } from 'react-bootstrap';

interface Tax {
    id: number;
    name: string;
    code: string;
    type: 'percentage' | 'fixed';
    rate?: number;
    fixed_amount?: number;
    description?: string;
    country: string;
    is_active: boolean;
    is_default: boolean;
    created_at: string;
}

interface Props {
    taxes: {
        data: Tax[];
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
        is_active?: boolean;
        type?: string;
    };
    flash?: {
        success?: string;
        error?: string;
    };
}

export default function TaxIndex({ taxes, filters, flash }: Props) {
    const [localFilters, setLocalFilters] = useState(filters);
    
    // Modal states
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [selectedTax, setSelectedTax] = useState<Tax | null>(null);
    const [showAlert, setShowAlert] = useState<{type: 'success' | 'error', message: string} | null>(null);

    // Create form
    const createForm = useForm({
        name: '',
        code: '',
        type: 'percentage' as 'percentage' | 'fixed',
        rate: 20,
        fixed_amount: 0,
        description: '',
        country: 'Türkiye',
        is_active: true,
        is_default: false,
    });

    // Edit form
    const editForm = useForm({
        name: '',
        code: '',
        type: 'percentage' as 'percentage' | 'fixed',
        rate: 20,
        fixed_amount: 0,
        description: '',
        country: 'Türkiye',
        is_active: true,
        is_default: false,
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

    // Clean filters
    const getCleanFilters = (filterObj: any) => {
        return Object.fromEntries(
            Object.entries(filterObj).filter(([_, value]) => value !== '' && value !== null && value !== undefined)
        );
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        const cleanFilters = getCleanFilters(localFilters);
        router.get(route('settings.tax.index'), cleanFilters, { preserveState: true });
    };

    const resetSearch = () => {
        setLocalFilters({});
        router.get(route('settings.tax.index'), {});
    };

    const handleCreate = (e: React.FormEvent) => {
        e.preventDefault();
        
        createForm.post(route('settings.tax.store'), {
            onSuccess: () => {
                setShowCreateModal(false);
                createForm.reset();
                setShowAlert({type: 'success', message: 'Vergi başarıyla oluşturuldu.'});
            },
            onError: () => {
                setShowAlert({type: 'error', message: 'Vergi oluşturulurken bir hata oluştu.'});
            }
        });
    };

    const handleEdit = (tax: Tax) => {
        setSelectedTax(tax);
        editForm.setData({
            name: tax.name,
            code: tax.code,
            type: tax.type,
            rate: tax.rate || 20,
            fixed_amount: tax.fixed_amount || 0,
            description: tax.description || '',
            country: tax.country,
            is_active: tax.is_active,
            is_default: tax.is_default,
        });
        setShowEditModal(true);
    };

    const handleUpdate = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedTax) return;
        
        editForm.put(route('settings.tax.update', selectedTax.id), {
            onSuccess: () => {
                setShowEditModal(false);
                editForm.reset();
                setSelectedTax(null);
                setShowAlert({type: 'success', message: 'Vergi başarıyla güncellendi.'});
            },
            onError: () => {
                setShowAlert({type: 'error', message: 'Vergi güncellenirken bir hata oluştu.'});
            }
        });
    };

    const handleDelete = (tax: Tax) => {
        setSelectedTax(tax);
        setShowDeleteModal(true);
    };

    const confirmDelete = () => {
        if (!selectedTax) return;
        
        router.delete(route('settings.tax.destroy', selectedTax.id), {
            onSuccess: () => {
                setShowDeleteModal(false);
                setSelectedTax(null);
                setShowAlert({type: 'success', message: 'Vergi başarıyla silindi.'});
            },
            onError: () => {
                setShowAlert({type: 'error', message: 'Vergi silinirken bir hata oluştu.'});
            }
        });
    };

    const handleSetDefault = (tax: Tax) => {
        router.patch(route('settings.tax.set-default', tax.id), {}, {
            onSuccess: () => {
                setShowAlert({type: 'success', message: 'Varsayılan vergi güncellendi.'});
            }
        });
    };

    const handleToggleStatus = (tax: Tax) => {
        router.patch(route('settings.tax.toggle-status', tax.id), {}, {
            onSuccess: () => {
                const status = !tax.is_active ? 'aktif' : 'pasif';
                setShowAlert({type: 'success', message: `Vergi ${status} duruma getirildi.`});
            }
        });
    };

    const formatTaxValue = (tax: Tax) => {
        if (tax.type === 'percentage') {
            return `%${tax.rate}`;
        } else {
            return `${tax.fixed_amount?.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL`;
        }
    };

    return (
        <>
            <Head title="Vergi Ayarları" />
            <Layout>
                <div className="page-content">
                    <div className="container-fluid">
                        <Row className="mb-3">
                            <Col>
                                <div className="page-title-box d-flex align-items-center justify-content-between">
                                    <div className="d-flex align-items-center gap-3">
                                        <h4 className="mb-0">Vergi Ayarları</h4>
                                        <Badge bg="secondary">{taxes.total} vergi</Badge>
                                    </div>
                                    <Button
                                        variant="primary"
                                        onClick={() => setShowCreateModal(true)}
                                    >
                                        <i className="ri-add-line me-1"></i>
                                        Yeni Vergi
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
                                                    placeholder="Vergi ara..."
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
                                                value={localFilters.type || ''}
                                                onChange={(e) => setLocalFilters(prev => ({
                                                    ...prev,
                                                    type: e.target.value || undefined
                                                }))}
                                            >
                                                <option value="">Tüm Türler</option>
                                                <option value="percentage">Yüzde</option>
                                                <option value="fixed">Sabit Tutar</option>
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
                                            <th>Vergi Adı</th>
                                            <th>Kod</th>
                                            <th>Tür</th>
                                            <th>Değer</th>
                                            <th>Ülke</th>
                                            <th>Durum</th>
                                            <th>Oluşturulma</th>
                                            <th>İşlemler</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {taxes.data.map((tax) => (
                                            <tr key={tax.id}>
                                                <td>
                                                    <div className="d-flex align-items-center">
                                                        <span className="fw-medium">{tax.name}</span>
                                                        {tax.is_default && (
                                                            <Badge bg="warning" className="ms-2" style={{ fontSize: '0.7em' }}>
                                                                Varsayılan
                                                            </Badge>
                                                        )}
                                                    </div>
                                                    {tax.description && (
                                                        <small className="text-muted d-block">{tax.description}</small>
                                                    )}
                                                </td>
                                                <td>
                                                    <code className="bg-light px-2 py-1 rounded">{tax.code}</code>
                                                </td>
                                                <td>
                                                    <Badge bg={tax.type === 'percentage' ? 'info' : 'secondary'}>
                                                        {tax.type === 'percentage' ? 'Yüzde' : 'Sabit Tutar'}
                                                    </Badge>
                                                </td>
                                                <td>
                                                    <span className="fw-medium">{formatTaxValue(tax)}</span>
                                                </td>
                                                <td>{tax.country}</td>
                                                <td>
                                                    <Badge bg={tax.is_active ? 'success' : 'danger'}>
                                                        {tax.is_active ? 'Aktif' : 'Pasif'}
                                                    </Badge>
                                                </td>
                                                <td>{new Date(tax.created_at).toLocaleDateString('tr-TR')}</td>
                                                <td>
                                                    <div className="d-flex gap-1">
                                                        {!tax.is_default && (
                                                            <Button
                                                                variant="outline-warning"
                                                                size="sm"
                                                                onClick={() => handleSetDefault(tax)}
                                                                title="Varsayılan yap"
                                                            >
                                                                <i className="ri-star-line"></i>
                                                            </Button>
                                                        )}
                                                        <Button
                                                            variant={tax.is_active ? "outline-secondary" : "outline-success"}
                                                            size="sm"
                                                            onClick={() => handleToggleStatus(tax)}
                                                            title={tax.is_active ? "Pasif yap" : "Aktif yap"}
                                                        >
                                                            <i className={tax.is_active ? "ri-pause-line" : "ri-play-line"}></i>
                                                        </Button>
                                                        <Button
                                                            variant="outline-primary"
                                                            size="sm"
                                                            onClick={() => handleEdit(tax)}
                                                        >
                                                            <i className="ri-edit-line"></i>
                                                        </Button>
                                                        <Button
                                                            variant="outline-danger"
                                                            size="sm"
                                                            onClick={() => handleDelete(tax)}
                                                            disabled={tax.is_default}
                                                            title={tax.is_default ? "Varsayılan vergi silinemez" : "Sil"}
                                                        >
                                                            <i className="ri-delete-bin-line"></i>
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </Table>
                                
                                {taxes.data.length === 0 && (
                                    <div className="text-center py-4">
                                        <i className="ri-file-list-line text-muted" style={{ fontSize: '3rem' }}></i>
                                        <p className="text-muted mt-2">Vergi bulunamadı</p>
                                        <Button variant="primary" onClick={() => setShowCreateModal(true)}>
                                            İlk vergiyi oluştur
                                        </Button>
                                    </div>
                                )}

                                {/* Pagination would go here */}
                            </Card.Body>
                        </Card>
                    </div>
                </div>

                {/* Create Modal */}
                <Modal show={showCreateModal} onHide={() => setShowCreateModal(false)} size="lg">
                    <Modal.Header closeButton>
                        <Modal.Title>Yeni Vergi Ekle</Modal.Title>
                    </Modal.Header>
                    <Form onSubmit={handleCreate}>
                        <Modal.Body>
                            <Row>
                                <Col md={6}>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Vergi Adı <span className="text-danger">*</span></Form.Label>
                                        <Form.Control
                                            type="text"
                                            value={createForm.data.name}
                                            onChange={(e) => createForm.setData('name', e.target.value)}
                                            isInvalid={!!createForm.errors.name}
                                            placeholder="ÖTV, KDV vs."
                                        />
                                        <Form.Control.Feedback type="invalid">
                                            {createForm.errors.name}
                                        </Form.Control.Feedback>
                                    </Form.Group>
                                </Col>
                                <Col md={6}>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Vergi Kodu <span className="text-danger">*</span></Form.Label>
                                        <Form.Control
                                            type="text"
                                            value={createForm.data.code}
                                            onChange={(e) => createForm.setData('code', e.target.value.toUpperCase())}
                                            isInvalid={!!createForm.errors.code}
                                            placeholder="VAT18, TAX8"
                                            maxLength={10}
                                        />
                                        <Form.Control.Feedback type="invalid">
                                            {createForm.errors.code}
                                        </Form.Control.Feedback>
                                    </Form.Group>
                                </Col>
                            </Row>

                            <Row>
                                <Col md={4}>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Vergi Türü <span className="text-danger">*</span></Form.Label>
                                        <Form.Select
                                            value={createForm.data.type}
                                            onChange={(e) => createForm.setData('type', e.target.value as 'percentage' | 'fixed')}
                                            isInvalid={!!createForm.errors.type}
                                        >
                                            <option value="percentage">Yüzde (%)</option>
                                            <option value="fixed">Sabit Tutar</option>
                                        </Form.Select>
                                        <Form.Control.Feedback type="invalid">
                                            {createForm.errors.type}
                                        </Form.Control.Feedback>
                                    </Form.Group>
                                </Col>
                                <Col md={4}>
                                    {createForm.data.type === 'percentage' ? (
                                        <Form.Group className="mb-3">
                                            <Form.Label>Vergi Oranı (%) <span className="text-danger">*</span></Form.Label>
                                            <Form.Control
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                max="100"
                                                value={createForm.data.rate}
                                                onChange={(e) => createForm.setData('rate', parseFloat(e.target.value))}
                                                isInvalid={!!createForm.errors.rate}
                                                placeholder="18.00"
                                            />
                                            <Form.Control.Feedback type="invalid">
                                                {createForm.errors.rate}
                                            </Form.Control.Feedback>
                                        </Form.Group>
                                    ) : (
                                        <Form.Group className="mb-3">
                                            <Form.Label>Sabit Tutar (TL) <span className="text-danger">*</span></Form.Label>
                                            <Form.Control
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                value={createForm.data.fixed_amount}
                                                onChange={(e) => createForm.setData('fixed_amount', parseFloat(e.target.value))}
                                                isInvalid={!!createForm.errors.fixed_amount}
                                                placeholder="10.00"
                                            />
                                            <Form.Control.Feedback type="invalid">
                                                {createForm.errors.fixed_amount}
                                            </Form.Control.Feedback>
                                        </Form.Group>
                                    )}
                                </Col>
                                <Col md={4}>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Ülke <span className="text-danger">*</span></Form.Label>
                                        <Form.Control
                                            type="text"
                                            value={createForm.data.country}
                                            onChange={(e) => createForm.setData('country', e.target.value)}
                                            isInvalid={!!createForm.errors.country}
                                            placeholder="Türkiye"
                                        />
                                        <Form.Control.Feedback type="invalid">
                                            {createForm.errors.country}
                                        </Form.Control.Feedback>
                                    </Form.Group>
                                </Col>
                            </Row>

                            <Form.Group className="mb-3">
                                <Form.Label>Açıklama</Form.Label>
                                <Form.Control
                                    as="textarea"
                                    rows={3}
                                    value={createForm.data.description}
                                    onChange={(e) => createForm.setData('description', e.target.value)}
                                    isInvalid={!!createForm.errors.description}
                                    placeholder="Vergi açıklaması"
                                />
                                <Form.Control.Feedback type="invalid">
                                    {createForm.errors.description}
                                </Form.Control.Feedback>
                            </Form.Group>

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
                                <Col md={6}>
                                    <Form.Group className="mb-3">
                                        <Form.Check
                                            type="checkbox"
                                            id="create_is_default"
                                            label="Varsayılan Vergi"
                                            checked={createForm.data.is_default}
                                            onChange={(e) => createForm.setData('is_default', e.target.checked)}
                                        />
                                        <Form.Text className="text-muted">
                                            Yeni ürünlerde otomatik olarak seçilir
                                        </Form.Text>
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
                                    'Vergi Oluştur'
                                )}
                            </Button>
                        </Modal.Footer>
                    </Form>
                </Modal>

                {/* Edit Modal */}
                <Modal show={showEditModal} onHide={() => setShowEditModal(false)} size="lg">
                    <Modal.Header closeButton>
                        <Modal.Title>Vergi Düzenle</Modal.Title>
                    </Modal.Header>
                    <Form onSubmit={handleUpdate}>
                        <Modal.Body>
                            <Row>
                                <Col md={6}>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Vergi Adı <span className="text-danger">*</span></Form.Label>
                                        <Form.Control
                                            type="text"
                                            value={editForm.data.name}
                                            onChange={(e) => editForm.setData('name', e.target.value)}
                                            isInvalid={!!editForm.errors.name}
                                            placeholder="ÖTV, KDV vs."
                                        />
                                        <Form.Control.Feedback type="invalid">
                                            {editForm.errors.name}
                                        </Form.Control.Feedback>
                                    </Form.Group>
                                </Col>
                                <Col md={6}>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Vergi Kodu <span className="text-danger">*</span></Form.Label>
                                        <Form.Control
                                            type="text"
                                            value={editForm.data.code}
                                            onChange={(e) => editForm.setData('code', e.target.value.toUpperCase())}
                                            isInvalid={!!editForm.errors.code}
                                            placeholder="VAT18, TAX8"
                                            maxLength={10}
                                        />
                                        <Form.Control.Feedback type="invalid">
                                            {editForm.errors.code}
                                        </Form.Control.Feedback>
                                    </Form.Group>
                                </Col>
                            </Row>

                            <Row>
                                <Col md={4}>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Vergi Türü <span className="text-danger">*</span></Form.Label>
                                        <Form.Select
                                            value={editForm.data.type}
                                            onChange={(e) => editForm.setData('type', e.target.value as 'percentage' | 'fixed')}
                                            isInvalid={!!editForm.errors.type}
                                        >
                                            <option value="percentage">Yüzde (%)</option>
                                            <option value="fixed">Sabit Tutar</option>
                                        </Form.Select>
                                        <Form.Control.Feedback type="invalid">
                                            {editForm.errors.type}
                                        </Form.Control.Feedback>
                                    </Form.Group>
                                </Col>
                                <Col md={4}>
                                    {editForm.data.type === 'percentage' ? (
                                        <Form.Group className="mb-3">
                                            <Form.Label>Vergi Oranı (%) <span className="text-danger">*</span></Form.Label>
                                            <Form.Control
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                max="100"
                                                value={editForm.data.rate}
                                                onChange={(e) => editForm.setData('rate', parseFloat(e.target.value))}
                                                isInvalid={!!editForm.errors.rate}
                                                placeholder="18.00"
                                            />
                                            <Form.Control.Feedback type="invalid">
                                                {editForm.errors.rate}
                                            </Form.Control.Feedback>
                                        </Form.Group>
                                    ) : (
                                        <Form.Group className="mb-3">
                                            <Form.Label>Sabit Tutar (TL) <span className="text-danger">*</span></Form.Label>
                                            <Form.Control
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                value={editForm.data.fixed_amount}
                                                onChange={(e) => editForm.setData('fixed_amount', parseFloat(e.target.value))}
                                                isInvalid={!!editForm.errors.fixed_amount}
                                                placeholder="10.00"
                                            />
                                            <Form.Control.Feedback type="invalid">
                                                {editForm.errors.fixed_amount}
                                            </Form.Control.Feedback>
                                        </Form.Group>
                                    )}
                                </Col>
                                <Col md={4}>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Ülke <span className="text-danger">*</span></Form.Label>
                                        <Form.Control
                                            type="text"
                                            value={editForm.data.country}
                                            onChange={(e) => editForm.setData('country', e.target.value)}
                                            isInvalid={!!editForm.errors.country}
                                            placeholder="Türkiye"
                                        />
                                        <Form.Control.Feedback type="invalid">
                                            {editForm.errors.country}
                                        </Form.Control.Feedback>
                                    </Form.Group>
                                </Col>
                            </Row>

                            <Form.Group className="mb-3">
                                <Form.Label>Açıklama</Form.Label>
                                <Form.Control
                                    as="textarea"
                                    rows={3}
                                    value={editForm.data.description}
                                    onChange={(e) => editForm.setData('description', e.target.value)}
                                    isInvalid={!!editForm.errors.description}
                                    placeholder="Vergi açıklaması"
                                />
                                <Form.Control.Feedback type="invalid">
                                    {editForm.errors.description}
                                </Form.Control.Feedback>
                            </Form.Group>

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
                                <Col md={6}>
                                    <Form.Group className="mb-3">
                                        <Form.Check
                                            type="checkbox"
                                            id="edit_is_default"
                                            label="Varsayılan Vergi"
                                            checked={editForm.data.is_default}
                                            onChange={(e) => editForm.setData('is_default', e.target.checked)}
                                        />
                                        <Form.Text className="text-muted">
                                            Yeni ürünlerde otomatik olarak seçilir
                                        </Form.Text>
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
                                    'Vergi Güncelle'
                                )}
                            </Button>
                        </Modal.Footer>
                    </Form>
                </Modal>

                {/* Delete Modal */}
                <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
                    <Modal.Header closeButton>
                        <Modal.Title>Vergi Sil</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <p>
                            <strong>"{selectedTax?.name}"</strong> vergisini silmek istediğinizden emin misiniz?
                        </p>
                        <p className="text-muted small">
                            Bu vergi ürünlerde kullanılıyorsa silinemez.
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