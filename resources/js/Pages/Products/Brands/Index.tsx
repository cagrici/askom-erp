import React, { useState } from 'react';
import Layout from '@/Layouts';
import { Head, router, useForm } from '@inertiajs/react';
import { Card, Table, Button, Form, Row, Col, InputGroup, Badge, Modal, Alert } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';

interface Brand {
    id: number;
    name: string;
    slug: string;
    description?: string;
    website?: string;
    country?: string;
    logo?: string;
    is_active: boolean;
    sort_order: number;
    products_count?: number;
    created_at: string;
}

interface Props {
    brands: {
        data: Brand[];
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
    };
    flash?: {
        success?: string;
        error?: string;
    };
}

export default function BrandIndex({ brands, filters, flash }: Props) {
    const { t } = useTranslation();
    const [localFilters, setLocalFilters] = useState(filters);
    
    // Modal states
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [selectedBrand, setSelectedBrand] = useState<Brand | null>(null);
    const [showAlert, setShowAlert] = useState<{type: 'success' | 'error', message: string} | null>(null);

    // Create form
    const createForm = useForm({
        name: '',
        slug: '',
        description: '',
        website: '',
        country: '',
        is_active: true,
        sort_order: 0,
        logo: null as File | null,
    });

    // Edit form
    const editForm = useForm({
        name: '',
        slug: '',
        description: '',
        website: '',
        country: '',
        is_active: true,
        sort_order: 0,
        logo: null as File | null,
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
        router.get(route('brands.index'), localFilters, { preserveState: true });
    };

    const resetSearch = () => {
        setLocalFilters({});
        router.get(route('brands.index'), {}, { preserveState: true });
    };

    const handleCreate = (e: React.FormEvent) => {
        e.preventDefault();
        
        createForm.post(route('brands.store'), {
            onSuccess: () => {
                setShowCreateModal(false);
                createForm.reset();
                setShowAlert({type: 'success', message: 'Marka başarıyla oluşturuldu.'});
            },
            onError: () => {
                setShowAlert({type: 'error', message: 'Marka oluşturulurken bir hata oluştu.'});
            }
        });
    };

    const handleEdit = (brand: Brand) => {
        setSelectedBrand(brand);
        editForm.setData({
            name: brand.name,
            slug: brand.slug,
            description: brand.description || '',
            website: brand.website || '',
            country: brand.country || '',
            is_active: brand.is_active,
            sort_order: brand.sort_order,
            logo: null,
        });
        setShowEditModal(true);
    };

    const handleUpdate = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedBrand) return;
        
        editForm.put(route('brands.update', selectedBrand.id), {
            onSuccess: () => {
                setShowEditModal(false);
                editForm.reset();
                setSelectedBrand(null);
                setShowAlert({type: 'success', message: 'Marka başarıyla güncellendi.'});
            },
            onError: () => {
                setShowAlert({type: 'error', message: 'Marka güncellenirken bir hata oluştu.'});
            }
        });
    };

    const handleDelete = (brand: Brand) => {
        setSelectedBrand(brand);
        setShowDeleteModal(true);
    };

    const confirmDelete = () => {
        if (!selectedBrand) return;
        
        router.delete(route('brands.destroy', selectedBrand.id), {
            onSuccess: () => {
                setShowDeleteModal(false);
                setSelectedBrand(null);
                setShowAlert({type: 'success', message: 'Marka başarıyla silindi.'});
            },
            onError: () => {
                setShowAlert({type: 'error', message: 'Marka silinirken bir hata oluştu.'});
            }
        });
    };

    return (
        <>
            <Head title="Markalar" />
            <Layout>
                <div className="page-content">
                    <div className="container-fluid">
                        <Row className="mb-3">
                            <Col>
                                <div className="page-title-box d-flex align-items-center justify-content-between">
                                    <h4 className="mb-0">Markalar</h4>
                                    <Button
                                        variant="primary"
                                        onClick={() => setShowCreateModal(true)}
                                    >
                                        <i className="ri-add-line me-1"></i>
                                        Yeni Marka
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
                                                    placeholder="Marka ara..."
                                                    value={localFilters.search || ''}
                                                    onChange={(e) => setLocalFilters(prev => ({ ...prev, search: e.target.value }))}
                                                />
                                                <Button type="submit" variant="outline-secondary">
                                                    <i className="ri-search-line"></i>
                                                </Button>
                                            </InputGroup>
                                        </Col>
                                        <Col md={3}>
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
                                            <th>Marka</th>
                                            <th>Website</th>
                                            <th>Ülke</th>
                                            <th>Durum</th>
                                            <th>Sıralama</th>
                                            <th>Ürün Sayısı</th>
                                            <th>Oluşturulma</th>
                                            <th>İşlemler</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {brands.data.map((brand) => (
                                            <tr key={brand.id}>
                                                <td>
                                                    <div className="d-flex align-items-center">
                                                        {brand.logo && (
                                                            <img
                                                                src={`/storage/${brand.logo}`}
                                                                alt={brand.name}
                                                                className="rounded me-2"
                                                                style={{ width: '32px', height: '32px', objectFit: 'contain' }}
                                                            />
                                                        )}
                                                        <div>
                                                            <h6 className="mb-0">{brand.name}</h6>
                                                            <small className="text-muted">{brand.slug}</small>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td>
                                                    {brand.website ? (
                                                        <a href={brand.website} target="_blank" rel="noopener noreferrer" className="text-decoration-none">
                                                            <i className="ri-external-link-line me-1"></i>
                                                            Website
                                                        </a>
                                                    ) : (
                                                        <span className="text-muted">-</span>
                                                    )}
                                                </td>
                                                <td>
                                                    {brand.country ? (
                                                        <Badge bg="secondary">{brand.country}</Badge>
                                                    ) : (
                                                        <span className="text-muted">-</span>
                                                    )}
                                                </td>
                                                <td>
                                                    <Badge bg={brand.is_active ? 'success' : 'danger'}>
                                                        {brand.is_active ? 'Aktif' : 'Pasif'}
                                                    </Badge>
                                                </td>
                                                <td>{brand.sort_order}</td>
                                                <td>
                                                    <Badge bg="info">{brand.products_count || 0}</Badge>
                                                </td>
                                                <td>{new Date(brand.created_at).toLocaleDateString('tr-TR')}</td>
                                                <td>
                                                    <div className="d-flex gap-1">
                                                        <Button
                                                            variant="outline-primary"
                                                            size="sm"
                                                            onClick={() => handleEdit(brand)}
                                                        >
                                                            <i className="ri-edit-line"></i>
                                                        </Button>
                                                        <Button
                                                            variant="outline-danger"
                                                            size="sm"
                                                            onClick={() => handleDelete(brand)}
                                                            disabled={(brand.products_count || 0) > 0}
                                                        >
                                                            <i className="ri-delete-bin-line"></i>
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </Table>
                                
                                {brands.data.length === 0 && (
                                    <div className="text-center py-4">
                                        <i className="ri-bookmark-line text-muted" style={{ fontSize: '3rem' }}></i>
                                        <p className="text-muted mt-2">Marka bulunamadı</p>
                                    </div>
                                )}
                            </Card.Body>
                        </Card>
                    </div>
                </div>

                {/* Create Modal */}
                <Modal show={showCreateModal} onHide={() => setShowCreateModal(false)} size="lg">
                    <Modal.Header closeButton>
                        <Modal.Title>Yeni Marka Ekle</Modal.Title>
                    </Modal.Header>
                    <Form onSubmit={handleCreate}>
                        <Modal.Body>
                            <Row>
                                <Col md={6}>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Marka Adı <span className="text-danger">*</span></Form.Label>
                                        <Form.Control
                                            type="text"
                                            value={createForm.data.name}
                                            onChange={(e) => createForm.setData('name', e.target.value)}
                                            isInvalid={!!createForm.errors.name}
                                            placeholder="Marka adını girin"
                                        />
                                        <Form.Control.Feedback type="invalid">
                                            {createForm.errors.name}
                                        </Form.Control.Feedback>
                                    </Form.Group>
                                </Col>
                                <Col md={6}>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Slug</Form.Label>
                                        <Form.Control
                                            type="text"
                                            value={createForm.data.slug}
                                            onChange={(e) => createForm.setData('slug', e.target.value)}
                                            isInvalid={!!createForm.errors.slug}
                                            placeholder="URL dostu ad (otomatik oluşur)"
                                        />
                                        <Form.Control.Feedback type="invalid">
                                            {createForm.errors.slug}
                                        </Form.Control.Feedback>
                                    </Form.Group>
                                </Col>
                            </Row>

                            <Row>
                                <Col md={6}>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Website</Form.Label>
                                        <Form.Control
                                            type="url"
                                            value={createForm.data.website}
                                            onChange={(e) => createForm.setData('website', e.target.value)}
                                            isInvalid={!!createForm.errors.website}
                                            placeholder="https://example.com"
                                        />
                                        <Form.Control.Feedback type="invalid">
                                            {createForm.errors.website}
                                        </Form.Control.Feedback>
                                    </Form.Group>
                                </Col>
                                <Col md={6}>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Ülke</Form.Label>
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
                                    placeholder="Marka açıklaması"
                                />
                                <Form.Control.Feedback type="invalid">
                                    {createForm.errors.description}
                                </Form.Control.Feedback>
                            </Form.Group>

                            <Row>
                                <Col md={6}>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Sıralama</Form.Label>
                                        <Form.Control
                                            type="number"
                                            min="0"
                                            value={createForm.data.sort_order}
                                            onChange={(e) => createForm.setData('sort_order', parseInt(e.target.value) || 0)}
                                            isInvalid={!!createForm.errors.sort_order}
                                        />
                                        <Form.Control.Feedback type="invalid">
                                            {createForm.errors.sort_order}
                                        </Form.Control.Feedback>
                                    </Form.Group>
                                </Col>
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
                                    'Marka Oluştur'
                                )}
                            </Button>
                        </Modal.Footer>
                    </Form>
                </Modal>

                {/* Edit Modal */}
                <Modal show={showEditModal} onHide={() => setShowEditModal(false)} size="lg">
                    <Modal.Header closeButton>
                        <Modal.Title>Marka Düzenle</Modal.Title>
                    </Modal.Header>
                    <Form onSubmit={handleUpdate}>
                        <Modal.Body>
                            <Row>
                                <Col md={6}>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Marka Adı <span className="text-danger">*</span></Form.Label>
                                        <Form.Control
                                            type="text"
                                            value={editForm.data.name}
                                            onChange={(e) => editForm.setData('name', e.target.value)}
                                            isInvalid={!!editForm.errors.name}
                                            placeholder="Marka adını girin"
                                        />
                                        <Form.Control.Feedback type="invalid">
                                            {editForm.errors.name}
                                        </Form.Control.Feedback>
                                    </Form.Group>
                                </Col>
                                <Col md={6}>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Slug</Form.Label>
                                        <Form.Control
                                            type="text"
                                            value={editForm.data.slug}
                                            onChange={(e) => editForm.setData('slug', e.target.value)}
                                            isInvalid={!!editForm.errors.slug}
                                            placeholder="URL dostu ad"
                                        />
                                        <Form.Control.Feedback type="invalid">
                                            {editForm.errors.slug}
                                        </Form.Control.Feedback>
                                    </Form.Group>
                                </Col>
                            </Row>

                            <Row>
                                <Col md={6}>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Website</Form.Label>
                                        <Form.Control
                                            type="url"
                                            value={editForm.data.website}
                                            onChange={(e) => editForm.setData('website', e.target.value)}
                                            isInvalid={!!editForm.errors.website}
                                            placeholder="https://example.com"
                                        />
                                        <Form.Control.Feedback type="invalid">
                                            {editForm.errors.website}
                                        </Form.Control.Feedback>
                                    </Form.Group>
                                </Col>
                                <Col md={6}>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Ülke</Form.Label>
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
                                    placeholder="Marka açıklaması"
                                />
                                <Form.Control.Feedback type="invalid">
                                    {editForm.errors.description}
                                </Form.Control.Feedback>
                            </Form.Group>

                            <Row>
                                <Col md={6}>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Sıralama</Form.Label>
                                        <Form.Control
                                            type="number"
                                            min="0"
                                            value={editForm.data.sort_order}
                                            onChange={(e) => editForm.setData('sort_order', parseInt(e.target.value) || 0)}
                                            isInvalid={!!editForm.errors.sort_order}
                                        />
                                        <Form.Control.Feedback type="invalid">
                                            {editForm.errors.sort_order}
                                        </Form.Control.Feedback>
                                    </Form.Group>
                                </Col>
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
                                    'Marka Güncelle'
                                )}
                            </Button>
                        </Modal.Footer>
                    </Form>
                </Modal>

                {/* Delete Modal */}
                <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
                    <Modal.Header closeButton>
                        <Modal.Title>Marka Sil</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <p>
                            <strong>"{selectedBrand?.name}"</strong> markasını silmek istediğinizden emin misiniz?
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