// resources/js/Pages/Documents/Categories/Index.tsx
import React, { useState } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import { Button, Card, Container, Table, Modal, Form, Alert } from 'react-bootstrap';
import { FiPlus, FiEdit, FiTrash2, FiX, FiSave } from 'react-icons/fi';

import Layout from '../../../Layouts';

interface Category {
    id: number;
    name: string;
    slug: string;
    description: string | null;
    parent_id: number | null;
    parent: Category | null;
}

interface Props {
    categories: Category[];
    flash?: {
        success?: string;
        error?: string;
    };
}

const CategoryIndex: React.FC<Props> = ({ categories, flash = {} }) => {
    // State for modals
    const [createModalShow, setCreateModalShow] = useState(false);
    const [editModalShow, setEditModalShow] = useState(false);
    const [deleteModalShow, setDeleteModalShow] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
    const [flashMessage, setFlashMessage] = useState<{type: string, message: string} | null>(
        flash?.success ? {type: 'success', message: flash.success} :
            flash?.error ? {type: 'danger', message: flash.error} : null
    );

    // Create form
    const { data: createData, setData: setCreateData, post: createPost, processing: createProcessing, errors: createErrors, reset: createReset } = useForm({
        name: '',
        description: '',
        parent_id: '',
    });

    // Edit form
    const { data: editData, setData: setEditData, put: editPut, processing: editProcessing, errors: editErrors, reset: editReset } = useForm({
        id: '',
        name: '',
        description: '',
        parent_id: '',
    });

    // Delete form
    const { data: deleteData, setData: setDeleteData, delete: deleteSubmit, processing: deleteProcessing, reset: deleteReset } = useForm({
        id: '',
    });

    // Handle form input changes
    const handleCreateChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setCreateData(name as any, value);
    };

    const handleEditChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setEditData(name as any, value);
    };

    // Modal handlers
    const openCreateModal = () => {
        createReset();
        setCreateModalShow(true);
    };

    const closeCreateModal = () => {
        createReset();
        setCreateModalShow(false);
    };

    const openEditModal = (category: Category) => {
        setSelectedCategory(category);
        editReset();
        setEditData({
            id: category.id.toString(),
            name: category.name,
            description: category.description || '',
            parent_id: category.parent_id ? category.parent_id.toString() : '',
        });
        setEditModalShow(true);
    };

    const closeEditModal = () => {
        editReset();
        setSelectedCategory(null);
        setEditModalShow(false);
    };

    const openDeleteModal = (category: Category) => {
        setSelectedCategory(category);
        setDeleteData('id', category.id.toString());
        setDeleteModalShow(true);
    };

    const closeDeleteModal = () => {
        deleteReset();
        setSelectedCategory(null);
        setDeleteModalShow(false);
    };

    // Form submissions
    const handleCreateSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        createPost(route('document-categories.store'), {
            onSuccess: () => {
                closeCreateModal();
                setFlashMessage({
                    type: 'success',
                    message: 'Kategori başarıyla oluşturuldu.'
                });
            }
        });
    };

    const handleEditSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (selectedCategory) {
            editPut(route('document-categories.update', selectedCategory.id), {
                onSuccess: () => {
                    closeEditModal();
                    setFlashMessage({
                        type: 'success',
                        message: 'Kategori başarıyla güncellendi.'
                    });
                }
            });
        }
    };

    const handleDeleteSubmit = () => {
        if (selectedCategory) {
            deleteSubmit(route('document-categories.destroy', selectedCategory.id), {
                onSuccess: () => {
                    closeDeleteModal();
                    setFlashMessage({
                        type: 'success',
                        message: 'Kategori başarıyla silindi.'
                    });
                },
                onError: (errors) => {
                    closeDeleteModal();
                    setFlashMessage({
                        type: 'danger',
                        message: errors.error || 'Kategori silinemedi.'
                    });
                }
            });
        }
    };

    // Clear flash messages after 5 seconds
    React.useEffect(() => {
        if (flashMessage) {
            const timeout = setTimeout(() => {
                setFlashMessage(null);
            }, 5000);

            return () => clearTimeout(timeout);
        }
    }, [flashMessage]);

    // Get parent category name
    const getParentName = (parentId: number | null): string => {
        if (!parentId) return '-';
        const parent = categories.find(c => c.id === parentId);
        return parent ? parent.name : '-';
    };

    return (
        <React.Fragment>
            <Head title="Belge Kategorileri" />
            <div className="page-content">
                <Container fluid>
                    {flashMessage && (
                        <Alert variant={flashMessage.type} dismissible onClose={() => setFlashMessage(null)}>
                            {flashMessage.message}
                        </Alert>
                    )}

                    <div className="d-flex justify-content-between align-items-center mb-4">
                        <h1 className="mb-0">Belge Kategorileri</h1>
                        <div>
                            <Button variant="primary" onClick={openCreateModal}>
                                <FiPlus className="me-1" /> Yeni Kategori
                            </Button>
                        </div>
                    </div>

                    <Card>
                        <Card.Body>
                            <Table responsive hover>
                                <thead>
                                <tr>
                                    <th>Kategori Adı</th>
                                    <th>Açıklama</th>
                                    <th>Üst Kategori</th>
                                    <th>İşlemler</th>
                                </tr>
                                </thead>
                                <tbody>
                                {categories.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="text-center py-4">
                                            Henüz kategori bulunmamaktadır.
                                        </td>
                                    </tr>
                                ) : (
                                    categories.map((category) => (
                                        <tr key={category.id}>
                                            <td><strong>{category.name}</strong></td>
                                            <td>{category.description || '-'}</td>
                                            <td>{getParentName(category.parent_id)}</td>
                                            <td>
                                                <div className="d-flex gap-1">
                                                    <Button variant="primary" size="sm" onClick={() => openEditModal(category)}>
                                                        <FiEdit />
                                                    </Button>
                                                    <Button variant="danger" size="sm" onClick={() => openDeleteModal(category)}>
                                                        <FiTrash2 />
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                                </tbody>
                            </Table>
                        </Card.Body>
                    </Card>
                </Container>
            </div>

            {/* Create Category Modal */}
            <Modal show={createModalShow} onHide={closeCreateModal} backdrop="static">
                <Form onSubmit={handleCreateSubmit}>
                    <Modal.Header closeButton>
                        <Modal.Title>Yeni Kategori Ekle</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <Form.Group className="mb-3">
                            <Form.Label>Kategori Adı <span className="text-danger">*</span></Form.Label>
                            <Form.Control
                                type="text"
                                name="name"
                                value={createData.name}
                                onChange={handleCreateChange}
                                isInvalid={!!createErrors.name}
                                required
                            />
                            {createErrors.name && (
                                <Form.Control.Feedback type="invalid">
                                    {createErrors.name}
                                </Form.Control.Feedback>
                            )}
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>Açıklama</Form.Label>
                            <Form.Control
                                as="textarea"
                                rows={3}
                                name="description"
                                value={createData.description}
                                onChange={handleCreateChange}
                                isInvalid={!!createErrors.description}
                            />
                            {createErrors.description && (
                                <Form.Control.Feedback type="invalid">
                                    {createErrors.description}
                                </Form.Control.Feedback>
                            )}
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>Üst Kategori</Form.Label>
                            <Form.Select
                                name="parent_id"
                                value={createData.parent_id}
                                onChange={handleCreateChange}
                                isInvalid={!!createErrors.parent_id}
                            >
                                <option value="">Ana Kategori</option>
                                {categories.map(category => (
                                    <option key={category.id} value={category.id}>
                                        {category.name}
                                    </option>
                                ))}
                            </Form.Select>
                            {createErrors.parent_id && (
                                <Form.Control.Feedback type="invalid">
                                    {createErrors.parent_id}
                                </Form.Control.Feedback>
                            )}
                        </Form.Group>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={closeCreateModal}>
                            <FiX className="me-1" /> İptal
                        </Button>
                        <Button type="submit" variant="primary" disabled={createProcessing}>
                            <FiSave className="me-1" /> {createProcessing ? 'Kaydediliyor...' : 'Kaydet'}
                        </Button>
                    </Modal.Footer>
                </Form>
            </Modal>

            {/* Edit Category Modal */}
            <Modal show={editModalShow} onHide={closeEditModal} backdrop="static">
                <Form onSubmit={handleEditSubmit}>
                    <Modal.Header closeButton>
                        <Modal.Title>Kategori Düzenle</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <Form.Group className="mb-3">
                            <Form.Label>Kategori Adı <span className="text-danger">*</span></Form.Label>
                            <Form.Control
                                type="text"
                                name="name"
                                value={editData.name}
                                onChange={handleEditChange}
                                isInvalid={!!editErrors.name}
                                required
                            />
                            {editErrors.name && (
                                <Form.Control.Feedback type="invalid">
                                    {editErrors.name}
                                </Form.Control.Feedback>
                            )}
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>Açıklama</Form.Label>
                            <Form.Control
                                as="textarea"
                                rows={3}
                                name="description"
                                value={editData.description}
                                onChange={handleEditChange}
                                isInvalid={!!editErrors.description}
                            />
                            {editErrors.description && (
                                <Form.Control.Feedback type="invalid">
                                    {editErrors.description}
                                </Form.Control.Feedback>
                            )}
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>Üst Kategori</Form.Label>
                            <Form.Select
                                name="parent_id"
                                value={editData.parent_id}
                                onChange={handleEditChange}
                                isInvalid={!!editErrors.parent_id}
                            >
                                <option value="">Ana Kategori</option>
                                {categories
                                    .filter(category => category.id !== parseInt(editData.id))
                                    .map(category => (
                                        <option key={category.id} value={category.id}>
                                            {category.name}
                                        </option>
                                    ))}
                            </Form.Select>
                            {editErrors.parent_id && (
                                <Form.Control.Feedback type="invalid">
                                    {editErrors.parent_id}
                                </Form.Control.Feedback>
                            )}
                        </Form.Group>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={closeEditModal}>
                            <FiX className="me-1" /> İptal
                        </Button>
                        <Button type="submit" variant="primary" disabled={editProcessing}>
                            <FiSave className="me-1" /> {editProcessing ? 'Güncelleniyor...' : 'Güncelle'}
                        </Button>
                    </Modal.Footer>
                </Form>
            </Modal>

            {/* Delete Category Modal */}
            <Modal show={deleteModalShow} onHide={closeDeleteModal} backdrop="static">
                <Modal.Header closeButton>
                    <Modal.Title>Kategori Sil</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <p>
                        <strong>{selectedCategory?.name}</strong> kategorisini silmek istediğinize emin misiniz?
                    </p>
                    <p className="text-danger mb-0">Bu işlem geri alınamaz! Kategori altında belge veya alt kategori varsa silinemez.</p>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={closeDeleteModal}>
                        <FiX className="me-1" /> İptal
                    </Button>
                    <Button variant="danger" onClick={handleDeleteSubmit} disabled={deleteProcessing}>
                        <FiTrash2 className="me-1" /> {deleteProcessing ? 'Siliniyor...' : 'Sil'}
                    </Button>
                </Modal.Footer>
            </Modal>
        </React.Fragment>
    );
};

CategoryIndex.layout = (page: any) => <Layout children={page} />
export default CategoryIndex;
