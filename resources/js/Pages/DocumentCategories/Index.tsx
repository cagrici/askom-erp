import React, { useState, useEffect } from 'react';
import { Head, useForm, router } from '@inertiajs/react';
import Layout from '../../Layouts';
import { Card, Container, Row, Col, Table, Button, Modal, Form, Badge, Alert, Spinner } from 'react-bootstrap';
import { FaPlus, FaEdit, FaTrash, FaEye, FaFolder, FaTags } from 'react-icons/fa';
import { toast } from 'react-toastify';

interface Category {
    id: number;
    name: string;
    slug: string;
    description?: string;
    color?: string;
    icon?: string;
    parent_id?: number;
    type: string;
    is_active: boolean;
    display_order?: number;
    created_at: string;
    updated_at: string;
    parent?: Category;
    children?: Category[];
    creator?: {
        id: number;
        name: string;
    };
}

interface Props {
    categories: Category[];
    currentType: string;
}

export default function Index({ categories, currentType }: Props) {
    const [showModal, setShowModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
    const [loading, setLoading] = useState(false);

    const { data, setData, post, put, delete: destroy, processing, errors, reset } = useForm({
        name: '',
        slug: '',
        description: '',
        color: '#007bff',
        icon: 'ri-folder-line',
        parent_id: '',
        type: 'document',
        is_active: true,
        display_order: 0,
    });

    const handleCreate = () => {
        reset();
        setData('type', 'document');
        setSelectedCategory(null);
        setShowModal(true);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const submitData = {
            ...data,
            parent_id: data.parent_id || null,
        };

        post(route('document-categories.store'), {
            onSuccess: () => {
                setShowModal(false);
                reset();
                toast.success('Kategori başarıyla oluşturuldu');
            },
            onError: () => {
                toast.error('Kategori oluşturulurken bir hata oluştu');
            }
        });
    };

    const handleEdit = (category: Category) => {
        setSelectedCategory(category);
        setData({
            name: category.name,
            slug: category.slug,
            description: category.description || '',
            color: category.color || '#007bff',
            icon: category.icon || 'ri-folder-line',
            parent_id: category.parent_id?.toString() || '',
            type: category.type,
            is_active: category.is_active,
            display_order: category.display_order || 0,
        });
        setShowEditModal(true);
    };

    const handleUpdate = (e: React.FormEvent) => {
        e.preventDefault();

        if (!selectedCategory) return;

        const submitData = {
            ...data,
            parent_id: data.parent_id || null,
        };

        put(route('document-categories.update', selectedCategory.id), {
            onSuccess: () => {
                setShowEditModal(false);
                reset();
                setSelectedCategory(null);
                toast.success('Kategori başarıyla güncellendi');
            },
            onError: () => {
                toast.error('Kategori güncellenirken bir hata oluştu');
            }
        });
    };

    const handleDelete = (category: Category) => {
        setSelectedCategory(category);
        setShowDeleteModal(true);
    };

    const confirmDelete = () => {
        if (!selectedCategory) return;

        destroy(route('document-categories.destroy', selectedCategory.id), {
            onSuccess: () => {
                setShowDeleteModal(false);
                setSelectedCategory(null);
                toast.success('Kategori başarıyla silindi');
            },
            onError: () => {
                toast.error('Kategori silinirken bir hata oluştu');
            }
        });
    };

    const getStatusBadge = (isActive: boolean) => {
        return isActive ?
            <Badge bg="success">Aktif</Badge> :
            <Badge bg="danger">Pasif</Badge>;
    };

    const getParentCategoryName = (category: Category) => {
        return category.parent ? category.parent.name : 'Ana Kategori';
    };

    const mainCategories = categories.filter(cat => !cat.parent_id);
    const subCategories = categories.filter(cat => cat.parent_id);

    return (
        <Layout>
            <Head title="Dokuman Kategorileri" />

                <div className="page-content">
                <Container fluid className="py-4">
                    <Row>
                        <Col lg={12}>
                            <Card>
                                <Card.Header className="d-flex justify-content-between align-items-center">
                                    <div>
                                        <h4 className="mb-0 d-flex align-items-center">
                                            <FaFolder className="me-2 text-primary" />
                                            Dokuman Kategorileri
                                        </h4>
                                        <p className="text-muted mb-0 mt-1">
                                            Dokuman kategorilerini yönetin
                                        </p>
                                    </div>
                                    <Button
                                        variant="primary"
                                        onClick={handleCreate}
                                        className="d-flex align-items-center"
                                    >
                                        <FaPlus className="me-2" />
                                        Yeni Kategori
                                    </Button>
                                </Card.Header>
                                <Card.Body>
                                    {categories.length === 0 ? (
                                        <Alert variant="info" className="text-center">
                                            <FaTags size={48} className="mb-3 text-muted" />
                                            <h5>Henüz kategori bulunmuyor</h5>
                                            <p>İlk kategoriyi oluşturmak için "Yeni Kategori" butonuna tıklayın.</p>
                                        </Alert>
                                    ) : (
                                        <div className="table-responsive">
                                            <Table striped hover>
                                                <thead className="table-light">
                                                    <tr>
                                                        <th>Kategori Adı</th>
                                                        <th>Slug</th>
                                                        <th>Üst Kategori</th>
                                                        <th>Açıklama</th>
                                                        <th>Durum</th>
                                                        <th>Sıra</th>
                                                        <th>İşlemler</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {categories.map((category) => (
                                                        <tr key={category.id}>
                                                            <td>
                                                                <div className="d-flex align-items-center">
                                                                    {category.icon && (
                                                                        <i
                                                                            className={`${category.icon} me-2`}
                                                                            style={{ color: category.color || '#007bff' }}
                                                                        ></i>
                                                                    )}
                                                                    <div>
                                                                        <strong>{category.name}</strong>
                                                                        {category.children && category.children.length > 0 && (
                                                                            <small className="text-muted d-block">
                                                                                {category.children.length} alt kategori
                                                                            </small>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td>
                                                                <code className="text-muted">{category.slug}</code>
                                                            </td>
                                                            <td>{getParentCategoryName(category)}</td>
                                                            <td>
                                                                {category.description ? (
                                                                    <span className="text-truncate d-block" style={{ maxWidth: '200px' }}>
                                                                        {category.description}
                                                                    </span>
                                                                ) : (
                                                                    <span className="text-muted">-</span>
                                                                )}
                                                            </td>
                                                            <td>{getStatusBadge(category.is_active)}</td>
                                                            <td>
                                                                <Badge variant="secondary">{category.display_order || 0}</Badge>
                                                            </td>
                                                            <td>
                                                                <div className="d-flex gap-2">
                                                                    <Button
                                                                        variant="outline-primary"
                                                                        size="sm"
                                                                        onClick={() => handleEdit(category)}
                                                                        title="Düzenle"
                                                                    >
                                                                        <FaEdit />
                                                                    </Button>
                                                                    <Button
                                                                        variant="outline-danger"
                                                                        size="sm"
                                                                        onClick={() => handleDelete(category)}
                                                                        title="Sil"
                                                                        disabled={category.children && category.children.length > 0}
                                                                    >
                                                                        <FaTrash />
                                                                    </Button>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </Table>
                                        </div>
                                    )}
                                </Card.Body>
                            </Card>
                        </Col>
                    </Row>
                </Container>
            </div>

            {/* Create Category Modal */}
            <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
                <Modal.Header closeButton>
                    <Modal.Title>Yeni Kategori Oluştur</Modal.Title>
                </Modal.Header>
                <Form onSubmit={handleSubmit}>
                    <Modal.Body>
                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Kategori Adı *</Form.Label>
                                    <Form.Control
                                        type="text"
                                        value={data.name}
                                        onChange={(e) => setData('name', e.target.value)}
                                        isInvalid={!!errors.name}
                                        required
                                    />
                                    <Form.Control.Feedback type="invalid">
                                        {errors.name}
                                    </Form.Control.Feedback>
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Slug</Form.Label>
                                    <Form.Control
                                        type="text"
                                        value={data.slug}
                                        onChange={(e) => setData('slug', e.target.value)}
                                        isInvalid={!!errors.slug}
                                        placeholder="Otomatik oluşturulacak"
                                    />
                                    <Form.Control.Feedback type="invalid">
                                        {errors.slug}
                                    </Form.Control.Feedback>
                                </Form.Group>
                            </Col>
                        </Row>

                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Üst Kategori</Form.Label>
                                    <Form.Select
                                        value={data.parent_id}
                                        onChange={(e) => setData('parent_id', e.target.value)}
                                    >
                                        <option value="">Ana Kategori</option>
                                        {mainCategories.map((category) => (
                                            <option key={category.id} value={category.id}>
                                                {category.name}
                                            </option>
                                        ))}
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                            <Col md={3}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Renk</Form.Label>
                                    <Form.Control
                                        type="color"
                                        value={data.color}
                                        onChange={(e) => setData('color', e.target.value)}
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={3}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Sıra</Form.Label>
                                    <Form.Control
                                        type="number"
                                        value={data.display_order}
                                        onChange={(e) => setData('display_order', parseInt(e.target.value) || 0)}
                                        min="0"
                                    />
                                </Form.Group>
                            </Col>
                        </Row>

                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>İkon</Form.Label>
                                    <Form.Control
                                        type="text"
                                        value={data.icon}
                                        onChange={(e) => setData('icon', e.target.value)}
                                        placeholder="ri-folder-line"
                                    />
                                    <Form.Text className="text-muted">
                                        Remix Icon sınıfı (örn: ri-folder-line)
                                    </Form.Text>
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Check
                                        type="checkbox"
                                        label="Aktif"
                                        checked={data.is_active}
                                        onChange={(e) => setData('is_active', e.target.checked)}
                                    />
                                </Form.Group>
                            </Col>
                        </Row>

                        <Form.Group className="mb-3">
                            <Form.Label>Açıklama</Form.Label>
                            <Form.Control
                                as="textarea"
                                rows={3}
                                value={data.description}
                                onChange={(e) => setData('description', e.target.value)}
                                placeholder="Kategori açıklaması..."
                            />
                        </Form.Group>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={() => setShowModal(false)}>
                            İptal
                        </Button>
                        <Button variant="primary" type="submit" disabled={processing}>
                            {processing ? (
                                <>
                                    <Spinner animation="border" size="sm" className="me-2" />
                                    Kaydediliyor...
                                </>
                            ) : (
                                'Kaydet'
                            )}
                        </Button>
                    </Modal.Footer>
                </Form>
            </Modal>

            {/* Edit Category Modal */}
            <Modal show={showEditModal} onHide={() => setShowEditModal(false)} size="lg">
                <Modal.Header closeButton>
                    <Modal.Title>Kategori Düzenle</Modal.Title>
                </Modal.Header>
                <Form onSubmit={handleUpdate}>
                    <Modal.Body>
                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Kategori Adı *</Form.Label>
                                    <Form.Control
                                        type="text"
                                        value={data.name}
                                        onChange={(e) => setData('name', e.target.value)}
                                        isInvalid={!!errors.name}
                                        required
                                    />
                                    <Form.Control.Feedback type="invalid">
                                        {errors.name}
                                    </Form.Control.Feedback>
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Slug</Form.Label>
                                    <Form.Control
                                        type="text"
                                        value={data.slug}
                                        onChange={(e) => setData('slug', e.target.value)}
                                        isInvalid={!!errors.slug}
                                    />
                                    <Form.Control.Feedback type="invalid">
                                        {errors.slug}
                                    </Form.Control.Feedback>
                                </Form.Group>
                            </Col>
                        </Row>

                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Üst Kategori</Form.Label>
                                    <Form.Select
                                        value={data.parent_id}
                                        onChange={(e) => setData('parent_id', e.target.value)}
                                    >
                                        <option value="">Ana Kategori</option>
                                        {mainCategories
                                            .filter(cat => cat.id !== selectedCategory?.id)
                                            .map((category) => (
                                            <option key={category.id} value={category.id}>
                                                {category.name}
                                            </option>
                                        ))}
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                            <Col md={3}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Renk</Form.Label>
                                    <Form.Control
                                        type="color"
                                        value={data.color}
                                        onChange={(e) => setData('color', e.target.value)}
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={3}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Sıra</Form.Label>
                                    <Form.Control
                                        type="number"
                                        value={data.display_order}
                                        onChange={(e) => setData('display_order', parseInt(e.target.value) || 0)}
                                        min="0"
                                    />
                                </Form.Group>
                            </Col>
                        </Row>

                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>İkon</Form.Label>
                                    <Form.Control
                                        type="text"
                                        value={data.icon}
                                        onChange={(e) => setData('icon', e.target.value)}
                                        placeholder="ri-folder-line"
                                    />
                                    <Form.Text className="text-muted">
                                        Remix Icon sınıfı (örn: ri-folder-line)
                                    </Form.Text>
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Check
                                        type="checkbox"
                                        label="Aktif"
                                        checked={data.is_active}
                                        onChange={(e) => setData('is_active', e.target.checked)}
                                    />
                                </Form.Group>
                            </Col>
                        </Row>

                        <Form.Group className="mb-3">
                            <Form.Label>Açıklama</Form.Label>
                            <Form.Control
                                as="textarea"
                                rows={3}
                                value={data.description}
                                onChange={(e) => setData('description', e.target.value)}
                                placeholder="Kategori açıklaması..."
                            />
                        </Form.Group>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={() => setShowEditModal(false)}>
                            İptal
                        </Button>
                        <Button variant="primary" type="submit" disabled={processing}>
                            {processing ? (
                                <>
                                    <Spinner animation="border" size="sm" className="me-2" />
                                    Güncelleniyor...
                                </>
                            ) : (
                                'Güncelle'
                            )}
                        </Button>
                    </Modal.Footer>
                </Form>
            </Modal>

            {/* Delete Confirmation Modal */}
            <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>Kategori Sil</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Alert variant="warning">
                        <strong>Dikkat!</strong> Bu işlem geri alınamaz.
                    </Alert>
                    <p>
                        <strong>"{selectedCategory?.name}"</strong> kategorisini silmek istediğinizden emin misiniz?
                    </p>
                    {selectedCategory?.children && selectedCategory.children.length > 0 && (
                        <Alert variant="danger">
                            Bu kategori alt kategorilere sahip olduğu için silinemez.
                        </Alert>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
                        İptal
                    </Button>
                    <Button
                        variant="danger"
                        onClick={confirmDelete}
                        disabled={processing || (selectedCategory?.children && selectedCategory.children.length > 0)}
                    >
                        {processing ? (
                            <>
                                <Spinner animation="border" size="sm" className="me-2" />
                                Siliniyor...
                            </>
                        ) : (
                            'Sil'
                        )}
                    </Button>
                </Modal.Footer>
            </Modal>
        </Layout>
    );
}
