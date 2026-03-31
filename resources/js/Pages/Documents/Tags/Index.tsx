import React, { useState } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import { Button, Card, Container, Table, Modal, Form, Alert, Badge } from 'react-bootstrap';
import { FiPlus, FiEdit, FiTrash2, FiX, FiSave } from 'react-icons/fi';

import Layout from '../../../Layouts';

interface Tag {
    id: number;
    name: string;
    slug: string;
    documents_count: number;
}

interface Props {
    tags: Tag[];
    flash?: {
        success?: string;
        error?: string;
    };
}

const TagIndex: React.FC<Props> = ({ tags, flash = {} }) => {
    // State for modals
    const [createModalShow, setCreateModalShow] = useState(false);
    const [editModalShow, setEditModalShow] = useState(false);
    const [deleteModalShow, setDeleteModalShow] = useState(false);
    const [selectedTag, setSelectedTag] = useState<Tag | null>(null);
    const [flashMessage, setFlashMessage] = useState<{type: string, message: string} | null>(
        flash?.success ? {type: 'success', message: flash.success} :
            flash?.error ? {type: 'danger', message: flash.error} : null
    );

    // Create form
    const { data: createData, setData: setCreateData, post: createPost, processing: createProcessing, errors: createErrors, reset: createReset } = useForm({
        name: '',
    });

    // Edit form
    const { data: editData, setData: setEditData, put: editPut, processing: editProcessing, errors: editErrors, reset: editReset } = useForm({
        id: '',
        name: '',
    });

    // Delete form
    const { data: deleteData, setData: setDeleteData, delete: deleteSubmit, processing: deleteProcessing, reset: deleteReset } = useForm({
        id: '',
    });

    // Handle form input changes
    const handleCreateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setCreateData(name as any, value);
    };

    const handleEditChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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

    const openEditModal = (tag: Tag) => {
        setSelectedTag(tag);
        editReset();
        setEditData({
            id: tag.id.toString(),
            name: tag.name,
        });
        setEditModalShow(true);
    };

    const closeEditModal = () => {
        editReset();
        setSelectedTag(null);
        setEditModalShow(false);
    };

    const openDeleteModal = (tag: Tag) => {
        setSelectedTag(tag);
        setDeleteData('id', tag.id.toString());
        setDeleteModalShow(true);
    };

    const closeDeleteModal = () => {
        deleteReset();
        setSelectedTag(null);
        setDeleteModalShow(false);
    };

    // Form submissions
    const handleCreateSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        createPost(route('tags.store'), {
            onSuccess: () => {
                closeCreateModal();
                setFlashMessage({
                    type: 'success',
                    message: 'Etiket başarıyla oluşturuldu.'
                });
            }
        });
    };

    const handleEditSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (selectedTag) {
            editPut(route('tags.update', selectedTag.id), {
                onSuccess: () => {
                    closeEditModal();
                    setFlashMessage({
                        type: 'success',
                        message: 'Etiket başarıyla güncellendi.'
                    });
                }
            });
        }
    };

    const handleDeleteSubmit = () => {
        if (selectedTag) {
            deleteSubmit(route('tags.destroy', selectedTag.id), {
                onSuccess: () => {
                    closeDeleteModal();
                    setFlashMessage({
                        type: 'success',
                        message: 'Etiket başarıyla silindi.'
                    });
                },
                onError: (errors) => {
                    closeDeleteModal();
                    setFlashMessage({
                        type: 'danger',
                        message: errors.error || 'Etiket silinemedi.'
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

    return (
        <React.Fragment>
            <Head title="Belge Etiketleri" />
            <div className="page-content">
                <Container fluid>
                    {flashMessage && (
                        <Alert variant={flashMessage.type} dismissible onClose={() => setFlashMessage(null)}>
                            {flashMessage.message}
                        </Alert>
                    )}

                    <div className="d-flex justify-content-between align-items-center mb-4">
                        <h1 className="mb-0">Belge Etiketleri</h1>
                        <div>
                            <Button variant="primary" onClick={openCreateModal}>
                                <FiPlus className="me-1" /> Yeni Etiket
                            </Button>
                        </div>
                    </div>

                    <Card>
                        <Card.Body>
                            <Table responsive hover>
                                <thead>
                                <tr>
                                    <th>Etiket Adı</th>
                                    <th>Kullanım Sayısı</th>
                                    <th>İşlemler</th>
                                </tr>
                                </thead>
                                <tbody>
                                {tags.length === 0 ? (
                                    <tr>
                                        <td colSpan={3} className="text-center py-4">
                                            Henüz etiket bulunmamaktadır.
                                        </td>
                                    </tr>
                                ) : (
                                    tags.map((tag) => (
                                        <tr key={tag.id}>
                                            <td>
                                                <Badge bg="primary" className="fs-6 p-2">{tag.name}</Badge>
                                            </td>
                                            <td>
                                                {tag.documents_count} belge
                                            </td>
                                            <td>
                                                <div className="d-flex gap-1">
                                                    <Button variant="primary" size="sm" onClick={() => openEditModal(tag)}>
                                                        <FiEdit />
                                                    </Button>
                                                    <Button variant="danger" size="sm" onClick={() => openDeleteModal(tag)} disabled={tag.documents_count > 0}>
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

            {/* Create Tag Modal */}
            <Modal show={createModalShow} onHide={closeCreateModal} backdrop="static">
                <Form onSubmit={handleCreateSubmit}>
                    <Modal.Header closeButton>
                        <Modal.Title>Yeni Etiket Ekle</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <Form.Group className="mb-3">
                            <Form.Label>Etiket Adı <span className="text-danger">*</span></Form.Label>
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

            {/* Edit Tag Modal */}
            <Modal show={editModalShow} onHide={closeEditModal} backdrop="static">
                <Form onSubmit={handleEditSubmit}>
                    <Modal.Header closeButton>
                        <Modal.Title>Etiket Düzenle</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <Form.Group className="mb-3">
                            <Form.Label>Etiket Adı <span className="text-danger">*</span></Form.Label>
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

            {/* Delete Tag Modal */}
            <Modal show={deleteModalShow} onHide={closeDeleteModal} backdrop="static">
                <Modal.Header closeButton>
                    <Modal.Title>Etiket Sil</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <p>
                        <strong>{selectedTag?.name}</strong> etiketini silmek istediğinize emin misiniz?
                    </p>
                    <p className="text-danger mb-0">Bu işlem geri alınamaz!</p>
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

TagIndex.layout = (page: any) => <Layout children={page} />
export default TagIndex;
