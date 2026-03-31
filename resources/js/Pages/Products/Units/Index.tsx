import React, { useState } from 'react';
import Layout from '@/Layouts';
import { Head, router, useForm } from '@inertiajs/react';
import { Card, Table, Button, Form, Row, Col, InputGroup, Badge, Modal, Alert } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';

interface Unit {
    id: number;
    name: string;
    symbol: string;
    type: string;
    conversion_factor?: number;
    base_unit_id?: number;
    base_unit?: {
        id: number;
        name: string;
        symbol: string;
    };
    is_active: boolean;
    description?: string;
    created_at: string;
}

interface Props {
    units: {
        data: Unit[];
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
    unitTypes: Array<{
        value: string;
        label: string;
    }>;
    flash?: {
        success?: string;
        error?: string;
    };
}

export default function UnitIndex({ units, filters, unitTypes, flash }: Props) {
    const { t } = useTranslation();
    const [localFilters, setLocalFilters] = useState(filters);
    
    // Modal states
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null);
    const [showAlert, setShowAlert] = useState<{type: 'success' | 'error', message: string} | null>(null);

    // Create form
    const createForm = useForm({
        name: '',
        symbol: '',
        type: 'piece',
        conversion_factor: '',
        base_unit_id: '',
        is_active: true,
        description: '',
    });

    // Edit form
    const editForm = useForm({
        name: '',
        symbol: '',
        type: 'piece',
        conversion_factor: '',
        base_unit_id: '',
        is_active: true,
        description: '',
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
        router.get(route('units.index'), localFilters, { preserveState: true });
    };

    const resetSearch = () => {
        setLocalFilters({});
        router.get(route('units.index'), {}, { preserveState: true });
    };

    const handleCreate = (e: React.FormEvent) => {
        e.preventDefault();
        
        createForm.post(route('units.store'), {
            onSuccess: () => {
                setShowCreateModal(false);
                createForm.reset();
                setShowAlert({type: 'success', message: 'Birim başarıyla oluşturuldu.'});
            },
            onError: () => {
                setShowAlert({type: 'error', message: 'Birim oluşturulurken bir hata oluştu.'});
            }
        });
    };

    const handleEdit = (unit: Unit) => {
        setSelectedUnit(unit);
        editForm.setData({
            name: unit.name,
            symbol: unit.symbol,
            type: unit.type,
            conversion_factor: unit.conversion_factor?.toString() || '',
            base_unit_id: unit.base_unit_id?.toString() || '',
            is_active: unit.is_active,
            description: unit.description || '',
        });
        setShowEditModal(true);
    };

    const handleUpdate = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedUnit) return;
        
        editForm.put(route('units.update', selectedUnit.id), {
            onSuccess: () => {
                setShowEditModal(false);
                editForm.reset();
                setSelectedUnit(null);
                setShowAlert({type: 'success', message: 'Birim başarıyla güncellendi.'});
            },
            onError: () => {
                setShowAlert({type: 'error', message: 'Birim güncellenirken bir hata oluştu.'});
            }
        });
    };

    const handleDelete = (unit: Unit) => {
        setSelectedUnit(unit);
        setShowDeleteModal(true);
    };

    const confirmDelete = () => {
        if (!selectedUnit) return;
        
        router.delete(route('units.destroy', selectedUnit.id), {
            onSuccess: () => {
                setShowDeleteModal(false);
                setSelectedUnit(null);
                setShowAlert({type: 'success', message: 'Birim başarıyla silindi.'});
            },
            onError: () => {
                setShowAlert({type: 'error', message: 'Birim silinirken bir hata oluştu.'});
            }
        });
    };

    const getUnitTypeLabel = (type: string) => {
        const typeObj = unitTypes.find(t => t.value === type);
        return typeObj ? typeObj.label : type;
    };

    const getUnitTypeBadgeColor = (type: string) => {
        const colors: Record<string, string> = {
            'length': 'primary',
            'weight': 'success',
            'volume': 'info',
            'area': 'warning',
            'piece': 'secondary',
            'time': 'dark',
            'other': 'light'
        };
        return colors[type] || 'secondary';
    };

    return (
        <>
            <Head title="Ürün Birimleri" />
            <Layout>
                <>
                    <div className="page-content">
                        <div className="container-fluid">
                            <Row className="mb-3">
                                <Col>
                                    <div className="page-title-box d-flex align-items-center justify-content-between">
                                        <h4 className="mb-0">Ürün Birimleri</h4>
                                        <Button
                                            variant="primary"
                                            onClick={() => setShowCreateModal(true)}
                                        >
                                            <i className="ri-add-line me-1"></i>
                                            Yeni Birim
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
                                                        placeholder="Birim adı, sembol veya tip ara..."
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
                                            <Col md={3}>
                                                <Form.Select
                                                    value={localFilters.type || ''}
                                                    onChange={(e) => setLocalFilters(prev => ({
                                                        ...prev,
                                                        type: e.target.value || undefined
                                                    }))}
                                                >
                                                    <option value="">Tüm Tipler</option>
                                                    {unitTypes.map(type => (
                                                        <option key={type.value} value={type.value}>
                                                            {type.label}
                                                        </option>
                                                    ))}
                                                </Form.Select>
                                            </Col>
                                            <Col md={3}>
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
                                                <th>Birim Adı</th>
                                                <th>Sembol</th>
                                                <th>Tip</th>
                                                <th>Temel Birim</th>
                                                <th>Çevrim Faktörü</th>
                                                <th>Durum</th>
                                                <th>İşlemler</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {units.data.map(unit => (
                                                <tr key={unit.id}>
                                                    <td>
                                                        <div>
                                                            <div className="fw-medium">{unit.name}</div>
                                                            {unit.description && (
                                                                <small className="text-muted">
                                                                    {unit.description.length > 50 
                                                                        ? unit.description.substring(0, 50) + '...'
                                                                        : unit.description
                                                                    }
                                                                </small>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <code className="bg-light px-2 py-1 rounded">{unit.symbol}</code>
                                                    </td>
                                                    <td>
                                                        <Badge bg={getUnitTypeBadgeColor(unit.type)}>
                                                            {getUnitTypeLabel(unit.type)}
                                                        </Badge>
                                                    </td>
                                                    <td>
                                                        {unit.base_unit ? (
                                                            <span>
                                                                {unit.base_unit.name} ({unit.base_unit.symbol})
                                                            </span>
                                                        ) : (
                                                            <span className="text-muted">Temel birim</span>
                                                        )}
                                                    </td>
                                                    <td>
                                                        {unit.conversion_factor ? (
                                                            <span>{unit.conversion_factor}</span>
                                                        ) : '-'}
                                                    </td>
                                                    <td>
                                                        <Badge bg={unit.is_active ? 'success' : 'danger'}>
                                                            {unit.is_active ? 'Aktif' : 'Pasif'}
                                                        </Badge>
                                                    </td>
                                                    <td>
                                                        <div className="d-flex gap-1">
                                                            <Button
                                                                variant="outline-primary"
                                                                size="sm"
                                                                onClick={() => handleEdit(unit)}
                                                            >
                                                                <i className="ri-edit-line"></i>
                                                            </Button>
                                                            <Button
                                                                variant="outline-danger"
                                                                size="sm"
                                                                onClick={() => handleDelete(unit)}
                                                            >
                                                                <i className="ri-delete-bin-line"></i>
                                                            </Button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </Table>
                                    
                                    {units.data.length === 0 && (
                                        <div className="text-center py-4">
                                            <i className="ri-ruler-line text-muted" style={{ fontSize: '3rem' }}></i>
                                            <p className="text-muted mt-2">Birim bulunamadı</p>
                                        </div>
                                    )}
                                </Card.Body>
                            </Card>
                        </div>
                    </div>

                    {/* Create Modal */}
                <Modal show={showCreateModal} onHide={() => setShowCreateModal(false)} size="lg">
                    <Modal.Header closeButton>
                        <Modal.Title>Yeni Birim Ekle</Modal.Title>
                    </Modal.Header>
                    <Form onSubmit={handleCreate}>
                        <Modal.Body>
                            <Row>
                                <Col md={6}>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Birim Adı <span className="text-danger">*</span></Form.Label>
                                        <Form.Control
                                            type="text"
                                            value={createForm.data.name}
                                            onChange={(e) => createForm.setData('name', e.target.value)}
                                            isInvalid={!!createForm.errors.name}
                                            placeholder="Birim adını girin"
                                        />
                                        <Form.Control.Feedback type="invalid">
                                            {createForm.errors.name}
                                        </Form.Control.Feedback>
                                    </Form.Group>
                                </Col>
                                <Col md={6}>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Sembol <span className="text-danger">*</span></Form.Label>
                                        <Form.Control
                                            type="text"
                                            value={createForm.data.symbol}
                                            onChange={(e) => createForm.setData('symbol', e.target.value)}
                                            isInvalid={!!createForm.errors.symbol}
                                            placeholder="kg, lt, m, vb."
                                        />
                                        <Form.Control.Feedback type="invalid">
                                            {createForm.errors.symbol}
                                        </Form.Control.Feedback>
                                    </Form.Group>
                                </Col>
                            </Row>

                            <Row>
                                <Col md={6}>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Tip <span className="text-danger">*</span></Form.Label>
                                        <Form.Select
                                            value={createForm.data.type}
                                            onChange={(e) => createForm.setData('type', e.target.value)}
                                            isInvalid={!!createForm.errors.type}
                                        >
                                            {unitTypes.map(type => (
                                                <option key={type.value} value={type.value}>
                                                    {type.label}
                                                </option>
                                            ))}
                                        </Form.Select>
                                        <Form.Control.Feedback type="invalid">
                                            {createForm.errors.type}
                                        </Form.Control.Feedback>
                                    </Form.Group>
                                </Col>
                                <Col md={6}>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Çevrim Faktörü</Form.Label>
                                        <Form.Control
                                            type="number"
                                            step="0.0001"
                                            min="0"
                                            value={createForm.data.conversion_factor}
                                            onChange={(e) => createForm.setData('conversion_factor', e.target.value)}
                                            isInvalid={!!createForm.errors.conversion_factor}
                                        />
                                        <Form.Control.Feedback type="invalid">
                                            {createForm.errors.conversion_factor}
                                        </Form.Control.Feedback>
                                    </Form.Group>
                                </Col>
                            </Row>

                            <Form.Group className="mb-3">
                                <Form.Label>Açıklama</Form.Label>
                                <Form.Control
                                    as="textarea"
                                    rows={2}
                                    value={createForm.data.description}
                                    onChange={(e) => createForm.setData('description', e.target.value)}
                                    isInvalid={!!createForm.errors.description}
                                    placeholder="Birim açıklaması"
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
                                    'Birim Oluştur'
                                )}
                            </Button>
                        </Modal.Footer>
                    </Form>
                </Modal>

                {/* Edit Modal */}
                <Modal show={showEditModal} onHide={() => setShowEditModal(false)} size="lg">
                    <Modal.Header closeButton>
                        <Modal.Title>Birim Düzenle</Modal.Title>
                    </Modal.Header>
                    <Form onSubmit={handleUpdate}>
                        <Modal.Body>
                            <Row>
                                <Col md={6}>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Birim Adı <span className="text-danger">*</span></Form.Label>
                                        <Form.Control
                                            type="text"
                                            value={editForm.data.name}
                                            onChange={(e) => editForm.setData('name', e.target.value)}
                                            isInvalid={!!editForm.errors.name}
                                            placeholder="Birim adını girin"
                                        />
                                        <Form.Control.Feedback type="invalid">
                                            {editForm.errors.name}
                                        </Form.Control.Feedback>
                                    </Form.Group>
                                </Col>
                                <Col md={6}>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Sembol <span className="text-danger">*</span></Form.Label>
                                        <Form.Control
                                            type="text"
                                            value={editForm.data.symbol}
                                            onChange={(e) => editForm.setData('symbol', e.target.value)}
                                            isInvalid={!!editForm.errors.symbol}
                                            placeholder="kg, lt, m, vb."
                                        />
                                        <Form.Control.Feedback type="invalid">
                                            {editForm.errors.symbol}
                                        </Form.Control.Feedback>
                                    </Form.Group>
                                </Col>
                            </Row>

                            <Row>
                                <Col md={6}>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Tip <span className="text-danger">*</span></Form.Label>
                                        <Form.Select
                                            value={editForm.data.type}
                                            onChange={(e) => editForm.setData('type', e.target.value)}
                                            isInvalid={!!editForm.errors.type}
                                        >
                                            {unitTypes.map(type => (
                                                <option key={type.value} value={type.value}>
                                                    {type.label}
                                                </option>
                                            ))}
                                        </Form.Select>
                                        <Form.Control.Feedback type="invalid">
                                            {editForm.errors.type}
                                        </Form.Control.Feedback>
                                    </Form.Group>
                                </Col>
                                <Col md={6}>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Çevrim Faktörü</Form.Label>
                                        <Form.Control
                                            type="number"
                                            step="0.0001"
                                            min="0"
                                            value={editForm.data.conversion_factor}
                                            onChange={(e) => editForm.setData('conversion_factor', e.target.value)}
                                            isInvalid={!!editForm.errors.conversion_factor}
                                        />
                                        <Form.Control.Feedback type="invalid">
                                            {editForm.errors.conversion_factor}
                                        </Form.Control.Feedback>
                                    </Form.Group>
                                </Col>
                            </Row>

                            <Form.Group className="mb-3">
                                <Form.Label>Açıklama</Form.Label>
                                <Form.Control
                                    as="textarea"
                                    rows={2}
                                    value={editForm.data.description}
                                    onChange={(e) => editForm.setData('description', e.target.value)}
                                    isInvalid={!!editForm.errors.description}
                                    placeholder="Birim açıklaması"
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
                                    'Birim Güncelle'
                                )}
                            </Button>
                        </Modal.Footer>
                    </Form>
                </Modal>

                {/* Delete Modal */}
                <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
                    <Modal.Header closeButton>
                        <Modal.Title>Birim Sil</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <p>
                            <strong>"{selectedUnit?.name}"</strong> birimini silmek istediğinizden emin misiniz?
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
                </>
            </Layout>
        </>
    );
}