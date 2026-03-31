import React, { useState } from 'react';
import Layout from '@/Layouts';
import { Head, router, useForm } from '@inertiajs/react';
import { Card, Table, Button, Form, Row, Col, InputGroup, Badge, Modal, Alert, Pagination } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';

interface Category {
    id: number;
    name: string;
    slug: string;
    description?: string;
    parent?: {
        id: number;
        name: string;
    };
    parent_id?: number;
    is_active: boolean;
    is_featured: boolean;
    display_order: number;
    image?: string;
    children_count?: number;
    total_products_count?: number;
    main_category_products_count?: number;
    children?: Category[];
    created_at: string;
}

interface Props {
    categories: {
        data: Category[];
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
    parentCategories?: Category[];
    flash?: {
        success?: string;
        error?: string;
    };
}

export default function CategoryIndex({ categories, filters, parentCategories = [], flash }: Props) {
    const { t } = useTranslation();
    const [localFilters, setLocalFilters] = useState(filters);
    
    // Modal states
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
    const [showAlert, setShowAlert] = useState<{type: 'success' | 'error', message: string} | null>(null);

    // Create form
    const createForm = useForm({
        name: '',
        slug: '',
        description: '',
        parent_id: null as number | null,
        is_active: true,
        is_featured: false,
        display_order: 0,
        image: null as File | null,
    });

    // Edit form
    const editForm = useForm({
        name: '',
        slug: '',
        description: '',
        parent_id: null as number | null,
        is_active: true,
        is_featured: false,
        display_order: 0,
        image: null as File | null,
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

    // Boş değerleri temizle
    const getCleanFilters = (filterObj: any) => {
        return Object.fromEntries(
            Object.entries(filterObj).filter(([_, value]) => value !== '' && value !== null && value !== undefined)
        );
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        const cleanFilters = getCleanFilters(localFilters);
        router.get(route('product-categories.index'), cleanFilters, { preserveState: true });
    };

    const resetSearch = () => {
        setLocalFilters({});
        router.get(route('product-categories.index'), {});
    };


    const handleCreate = (e: React.FormEvent) => {
        e.preventDefault();
        
        createForm.post(route('product-categories.store'), {
            onSuccess: () => {
                setShowCreateModal(false);
                createForm.reset();
                setShowAlert({type: 'success', message: 'Kategori başarıyla oluşturuldu.'});
            },
            onError: () => {
                setShowAlert({type: 'error', message: 'Kategori oluşturulurken bir hata oluştu.'});
            }
        });
    };

    const handleEdit = (category: Category) => {
        setSelectedCategory(category);
        editForm.setData({
            name: category.name,
            slug: category.slug,
            description: category.description || '',
            parent_id: category.parent_id || null,
            is_active: category.is_active,
            is_featured: category.is_featured,
            display_order: category.display_order,
            image: null,
        });
        setShowEditModal(true);
    };

    const handleUpdate = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedCategory) return;
        
        editForm.put(route('product-categories.update', selectedCategory.id), {
            onSuccess: () => {
                setShowEditModal(false);
                editForm.reset();
                setSelectedCategory(null);
                setShowAlert({type: 'success', message: 'Kategori başarıyla güncellendi.'});
            },
            onError: () => {
                setShowAlert({type: 'error', message: 'Kategori güncellenirken bir hata oluştu.'});
            }
        });
    };

    const handleDelete = (category: Category) => {
        setSelectedCategory(category);
        setShowDeleteModal(true);
    };

    const confirmDelete = () => {
        if (!selectedCategory) return;
        
        router.delete(route('product-categories.destroy', selectedCategory.id), {
            onSuccess: () => {
                setShowDeleteModal(false);
                setSelectedCategory(null);
                setShowAlert({type: 'success', message: 'Kategori başarıyla silindi.'});
            },
            onError: () => {
                setShowAlert({type: 'error', message: 'Kategori silinirken bir hata oluştu.'});
            }
        });
    };

    return (
        <>
            <Head title="Kategoriler" />
            <Layout>
                <div className="page-content">
                    <div className="container-fluid">
                        <Row className="mb-3">
                            <Col>
                                <div className="page-title-box d-flex align-items-center justify-content-between">
                                    <div className="d-flex align-items-center gap-3">
                                        <h4 className="mb-0">Ürün Kategorileri</h4>
                                    </div>
                                    <Button
                                        variant="primary"
                                        onClick={() => setShowCreateModal(true)}
                                    >
                                        <i className="ri-add-line me-1"></i>
                                        Yeni Kategori
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
                                                    placeholder="Kategori ara..."
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
                                            <th>Kategori</th>
                                            <th>Üst Kategori</th>
                                            <th>Durum</th>
                                            <th>Sıralama</th>
                                            <th>Ürün Sayıları</th>
                                            <th>Oluşturulma</th>
                                            <th>İşlemler</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {categories.data.map((category) => (
                                            <tr key={category.id}>
                                                <td>
                                                    <div className="d-flex align-items-center">
                                                        <span>{category.name}</span>
                                                        {category.children_count > 0 && (
                                                            <Badge bg="info" className="ms-2" style={{ fontSize: '0.7em' }}>
                                                                {category.children_count} alt kategori
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </td>
                                                <td>
                                                    {category.parent ? (
                                                        <span className="text-muted">{category.parent.name}</span>
                                                    ) : (
                                                        <span className="text-muted">Ana Kategori</span>
                                                    )}
                                                </td>
                                                <td>
                                                    <Badge bg={category.is_active ? 'success' : 'danger'}>
                                                        {category.is_active ? 'Aktif' : 'Pasif'}
                                                    </Badge>
                                                    {category.is_featured && (
                                                        <Badge bg="primary" className="ms-1">Öne Çıkan</Badge>
                                                    )}
                                                </td>
                                                <td>{category.display_order}</td>
                                                <td>
                                                    <Badge bg="primary" title="Toplam ürün sayısı">
                                                        {category.total_products_count || 0}
                                                    </Badge>
                                                </td>
                                                <td>{new Date(category.created_at).toLocaleDateString('tr-TR')}</td>
                                                <td>
                                                    <div className="d-flex gap-1">
                                                        <Button
                                                            variant="outline-primary"
                                                            size="sm"
                                                            onClick={() => handleEdit(category)}
                                                        >
                                                            <i className="ri-edit-line"></i>
                                                        </Button>
                                                        <Button
                                                            variant="outline-danger"
                                                            size="sm"
                                                            onClick={() => handleDelete(category)}
                                                            disabled={category.children_count! > 0 || category.total_products_count! > 0}
                                                        >
                                                            <i className="ri-delete-bin-line"></i>
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </Table>
                                
                                {categories.data.length === 0 && (
                                    <div className="text-center py-4">
                                        <i className="ri-folder-line text-muted" style={{ fontSize: '3rem' }}></i>
                                        <p className="text-muted mt-2">Kategori bulunamadı</p>
                                    </div>
                                )}

                                {/* Pagination */}
                                {categories.last_page > 1 && (
                                    <div className="d-flex justify-content-between align-items-center mt-3">
                                        <div className="text-muted">
                                            {categories.from} - {categories.to} / {categories.total} kategori
                                        </div>
                                        <Pagination>
                                            <Pagination.Prev 
                                                disabled={categories.current_page === 1}
                                                onClick={() => categories.current_page > 1 && router.get(route('product-categories.index'), { 
                                                    ...getCleanFilters(filters), 
                                                    page: categories.current_page - 1 
                                                }, { preserveState: true })}
                                            />
                                            
                                            {Array.from({ length: categories.last_page }, (_, i) => i + 1)
                                                .filter(page => 
                                                    page === 1 || 
                                                    page === categories.last_page || 
                                                    Math.abs(page - categories.current_page) <= 2
                                                )
                                                .map((page, index, array) => (
                                                    <React.Fragment key={page}>
                                                        {index > 0 && array[index - 1] < page - 1 && <Pagination.Ellipsis disabled />}
                                                        <Pagination.Item
                                                            active={page === categories.current_page}
                                                            onClick={() => router.get(route('product-categories.index'), { 
                                                                ...getCleanFilters(filters), 
                                                                page 
                                                            }, { preserveState: true })}
                                                        >
                                                            {page}
                                                        </Pagination.Item>
                                                    </React.Fragment>
                                                ))
                                            }
                                            
                                            <Pagination.Next 
                                                disabled={categories.current_page === categories.last_page}
                                                onClick={() => categories.current_page < categories.last_page && router.get(route('product-categories.index'), { 
                                                    ...getCleanFilters(filters), 
                                                    page: categories.current_page + 1 
                                                }, { preserveState: true })}
                                            />
                                        </Pagination>
                                    </div>
                                )}
                            </Card.Body>
                        </Card>
                    </div>
                </div>

                {/* Create Modal */}
                <Modal show={showCreateModal} onHide={() => setShowCreateModal(false)} size="lg">
                    <Modal.Header closeButton>
                        <Modal.Title>Yeni Kategori Ekle</Modal.Title>
                    </Modal.Header>
                    <Form onSubmit={handleCreate}>
                        <Modal.Body>
                            <Row>
                                <Col md={6}>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Kategori Adı <span className="text-danger">*</span></Form.Label>
                                        <Form.Control
                                            type="text"
                                            value={createForm.data.name}
                                            onChange={(e) => createForm.setData('name', e.target.value)}
                                            isInvalid={!!createForm.errors.name}
                                            placeholder="Kategori adını girin"
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
                                        <Form.Label>Üst Kategori</Form.Label>
                                        <Form.Select
                                            value={createForm.data.parent_id || ''}
                                            onChange={(e) => createForm.setData('parent_id', e.target.value || null)}
                                            isInvalid={!!createForm.errors.parent_id}
                                        >
                                            <option value="">Ana Kategori</option>
                                            {parentCategories.map(cat => (
                                                <option key={cat.id} value={cat.id}>
                                                    {cat.parent ? `— ${cat.name}` : cat.name}
                                                </option>
                                            ))}
                                        </Form.Select>
                                        <Form.Control.Feedback type="invalid">
                                            {createForm.errors.parent_id}
                                        </Form.Control.Feedback>
                                    </Form.Group>
                                </Col>
                                <Col md={6}>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Sıralama</Form.Label>
                                        <Form.Control
                                            type="number"
                                            min="0"
                                            value={createForm.data.display_order}
                                            onChange={(e) => createForm.setData('display_order', parseInt(e.target.value) || 0)}
                                            isInvalid={!!createForm.errors.display_order}
                                        />
                                        <Form.Control.Feedback type="invalid">
                                            {createForm.errors.display_order}
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
                                    placeholder="Kategori açıklaması"
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
                                            id="create_is_featured"
                                            label="Öne Çıkan"
                                            checked={createForm.data.is_featured}
                                            onChange={(e) => createForm.setData('is_featured', e.target.checked)}
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
                                    'Kategori Oluştur'
                                )}
                            </Button>
                        </Modal.Footer>
                    </Form>
                </Modal>

                {/* Edit Modal */}
                <Modal show={showEditModal} onHide={() => setShowEditModal(false)} size="lg">
                    <Modal.Header closeButton>
                        <Modal.Title>Kategori Düzenle</Modal.Title>
                    </Modal.Header>
                    <Form onSubmit={handleUpdate}>
                        <Modal.Body>
                            <Row>
                                <Col md={6}>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Kategori Adı <span className="text-danger">*</span></Form.Label>
                                        <Form.Control
                                            type="text"
                                            value={editForm.data.name}
                                            onChange={(e) => editForm.setData('name', e.target.value)}
                                            isInvalid={!!editForm.errors.name}
                                            placeholder="Kategori adını girin"
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
                                        <Form.Label>Üst Kategori</Form.Label>
                                        <Form.Select
                                            value={editForm.data.parent_id || ''}
                                            onChange={(e) => editForm.setData('parent_id', e.target.value || null)}
                                            isInvalid={!!editForm.errors.parent_id}
                                        >
                                            <option value="">Ana Kategori</option>
                                            {parentCategories
                                                .filter(cat => cat.id !== selectedCategory?.id)
                                                .map(cat => (
                                                    <option key={cat.id} value={cat.id}>
                                                        {cat.parent ? `— ${cat.name}` : cat.name}
                                                    </option>
                                                ))}
                                        </Form.Select>
                                        <Form.Control.Feedback type="invalid">
                                            {editForm.errors.parent_id}
                                        </Form.Control.Feedback>
                                    </Form.Group>
                                </Col>
                                <Col md={6}>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Sıralama</Form.Label>
                                        <Form.Control
                                            type="number"
                                            min="0"
                                            value={editForm.data.display_order}
                                            onChange={(e) => editForm.setData('display_order', parseInt(e.target.value) || 0)}
                                            isInvalid={!!editForm.errors.display_order}
                                        />
                                        <Form.Control.Feedback type="invalid">
                                            {editForm.errors.display_order}
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
                                    placeholder="Kategori açıklaması"
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
                                            id="edit_is_featured"
                                            label="Öne Çıkan"
                                            checked={editForm.data.is_featured}
                                            onChange={(e) => editForm.setData('is_featured', e.target.checked)}
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
                                    'Kategori Güncelle'
                                )}
                            </Button>
                        </Modal.Footer>
                    </Form>
                </Modal>

                {/* Delete Modal */}
                <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
                    <Modal.Header closeButton>
                        <Modal.Title>Kategori Sil</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <p>
                            <strong>"{selectedCategory?.name}"</strong> kategorisini silmek istediğinizden emin misiniz?
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