import BreadCrumb from '../../../../Components/Common/BreadCrumb';
import React, { useState } from 'react';
import { Container, Row, Col, Card, CardBody, Table, Button, Badge, Modal, Form } from 'react-bootstrap';
import { Link, useForm } from '@inertiajs/react';
import Layout from '../../../../Layouts';
import { PageProps } from '@inertiajs/core';

interface Category {
    id: number;
    name: string;
    slug: string;
    description: string | null;
    color: string | null;
    icon: string | null;
    is_active: boolean;
    posts_count: number;
}

interface CategoryListProps {
    categories: Category[];
}

const BlogCategories = ({ categories }: PageProps<CategoryListProps>) => {
    document.title = "Kategoriler | Şirket İçi Portal";

    // Yeni kategori ekleme modalı
    const [showModal, setShowModal] = useState(false);
    
    // Form state
    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        description: '',
        color: '#3498db',
        icon: '',
        is_active: true,
    });

    // Modal aç/kapa
    const handleCloseModal = () => {
        setShowModal(false);
        reset();
    };
    
    const handleShowModal = () => setShowModal(true);

    // Form gönderme
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('news.categories.store'), {
            onSuccess: () => {
                handleCloseModal();
            }
        });
    };

    // Kategori silme
    const handleDelete = (id: number) => {
        if (confirm('Bu kategoriyi silmek istediğinizden emin misiniz?')) {
            useForm().delete(route('news.categories.destroy', id));
        }
    };

    return (
        <React.Fragment>
            <div className="page-content">
                <Container fluid>
                    <BreadCrumb title="Kategoriler" pageTitle="Haberler" />

                    <Row>
                        <Col lg={12}>
                            <Card>
                                <CardBody>
                                    <div className="d-flex align-items-center justify-content-between mb-4">
                                        <h4 className="card-title mb-0">Haber Kategorileri</h4>
                                        <Button variant="success" onClick={handleShowModal}>
                                            <i className="ri-add-line align-bottom me-1"></i> Yeni Kategori
                                        </Button>
                                    </div>

                                    <div className="table-responsive">
                                        <Table className="table-striped table-nowrap align-middle mb-0">
                                            <thead>
                                                <tr>
                                                    <th scope="col">ID</th>
                                                    <th scope="col">Kategori Adı</th>
                                                    <th scope="col">Renk</th>
                                                    <th scope="col">İkon</th>
                                                    <th scope="col">Durum</th>
                                                    <th scope="col">Haber Sayısı</th>
                                                    <th scope="col">İşlemler</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {categories.length > 0 ? (
                                                    categories.map((category) => (
                                                        <tr key={category.id}>
                                                            <td>{category.id}</td>
                                                            <td>
                                                                <div className="d-flex align-items-center">
                                                                    <div className="flex-grow-1">
                                                                        <h5 className="fs-14 mb-0">{category.name}</h5>
                                                                        {category.description && (
                                                                            <p className="text-muted mb-0">{category.description}</p>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td>
                                                                {category.color ? (
                                                                    <div className="d-flex align-items-center">
                                                                        <div 
                                                                            style={{ 
                                                                                width: '20px', 
                                                                                height: '20px', 
                                                                                backgroundColor: category.color,
                                                                                borderRadius: '4px',
                                                                                marginRight: '8px'
                                                                            }} 
                                                                        ></div>
                                                                        <span>{category.color}</span>
                                                                    </div>
                                                                ) : (
                                                                    <span className="text-muted">-</span>
                                                                )}
                                                            </td>
                                                            <td>
                                                                {category.icon ? (
                                                                    <i className={category.icon + " fs-18"}></i>
                                                                ) : (
                                                                    <span className="text-muted">-</span>
                                                                )}
                                                            </td>
                                                            <td>
                                                                {category.is_active ? (
                                                                    <Badge bg="success">Aktif</Badge>
                                                                ) : (
                                                                    <Badge bg="danger">Pasif</Badge>
                                                                )}
                                                            </td>
                                                            <td>
                                                                <Badge bg="info">{category.posts_count}</Badge>
                                                            </td>
                                                            <td>
                                                                <div className="d-flex gap-2">
                                                                    <Link 
                                                                        href={route('news.categories.edit', category.id)} 
                                                                        className="btn btn-sm btn-soft-primary"
                                                                    >
                                                                        <i className="ri-pencil-fill"></i>
                                                                    </Link>
                                                                    <Button 
                                                                        variant="soft-danger" 
                                                                        size="sm" 
                                                                        onClick={() => handleDelete(category.id)}
                                                                        disabled={category.posts_count > 0}
                                                                    >
                                                                        <i className="ri-delete-bin-line"></i>
                                                                    </Button>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ))
                                                ) : (
                                                    <tr>
                                                        <td colSpan={7} className="text-center">
                                                            <div className="p-4">
                                                                <div className="avatar-md mx-auto mb-4">
                                                                    <div className="avatar-title bg-light rounded-circle text-primary display-6">
                                                                        <i className="ri-folder-line"></i>
                                                                    </div>
                                                                </div>
                                                                <h5>Henüz kategori bulunmuyor</h5>
                                                                <p className="text-muted">İlk kategoriyi ekleyin!</p>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </Table>
                                    </div>
                                </CardBody>
                            </Card>
                        </Col>
                    </Row>

                    {/* Yeni Kategori Ekleme Modalı */}
                    <Modal show={showModal} onHide={handleCloseModal} centered>
                        <Modal.Header closeButton>
                            <Modal.Title>Yeni Kategori Ekle</Modal.Title>
                        </Modal.Header>
                        <Form onSubmit={handleSubmit}>
                            <Modal.Body>
                                <div className="mb-3">
                                    <Form.Label htmlFor="category-name">Kategori Adı</Form.Label>
                                    <Form.Control
                                        type="text"
                                        id="category-name"
                                        placeholder="Kategori adını giriniz"
                                        value={data.name}
                                        onChange={(e) => setData('name', e.target.value)}
                                        isInvalid={!!errors.name}
                                        required
                                    />
                                    {errors.name && <div className="invalid-feedback">{errors.name}</div>}
                                </div>

                                <div className="mb-3">
                                    <Form.Label htmlFor="category-description">Açıklama</Form.Label>
                                    <Form.Control
                                        as="textarea"
                                        id="category-description"
                                        rows={3}
                                        placeholder="Kategori açıklamasını giriniz"
                                        value={data.description}
                                        onChange={(e) => setData('description', e.target.value)}
                                        isInvalid={!!errors.description}
                                    />
                                    {errors.description && <div className="invalid-feedback">{errors.description}</div>}
                                </div>

                                <div className="mb-3">
                                    <Form.Label htmlFor="category-color">Renk</Form.Label>
                                    <div className="d-flex align-items-center gap-2">
                                        <Form.Control
                                            type="color"
                                            id="category-color"
                                            value={data.color}
                                            onChange={(e) => setData('color', e.target.value)}
                                            isInvalid={!!errors.color}
                                            style={{ width: '50px' }}
                                        />
                                        <Form.Control
                                            type="text"
                                            value={data.color}
                                            onChange={(e) => setData('color', e.target.value)}
                                            placeholder="#HEX kodu"
                                        />
                                    </div>
                                    {errors.color && <div className="invalid-feedback">{errors.color}</div>}
                                </div>

                                <div className="mb-3">
                                    <Form.Label htmlFor="category-icon">İkon Kodu</Form.Label>
                                    <Form.Control
                                        type="text"
                                        id="category-icon"
                                        placeholder="Örn: ri-announcement-line"
                                        value={data.icon}
                                        onChange={(e) => setData('icon', e.target.value)}
                                        isInvalid={!!errors.icon}
                                    />
                                    <div className="form-text">
                                        <Link href="https://remixicon.com/" target="_blank">
                                            RemixIcon <i className="ri-external-link-line"></i>
                                        </Link> ikonlarını kullanabilirsiniz.
                                    </div>
                                    {errors.icon && <div className="invalid-feedback">{errors.icon}</div>}
                                </div>

                                <div className="mb-3">
                                    <Form.Check
                                        type="checkbox"
                                        id="is-active"
                                        label="Aktif"
                                        checked={data.is_active}
                                        onChange={(e) => setData('is_active', e.target.checked)}
                                    />
                                </div>
                            </Modal.Body>
                            <Modal.Footer>
                                <Button variant="light" onClick={handleCloseModal}>
                                    İptal
                                </Button>
                                <Button variant="success" type="submit" disabled={processing}>
                                    {processing ? (
                                        <><span className="spinner-border spinner-border-sm me-1"></span> Kaydediliyor...</>
                                    ) : (
                                        'Kaydet'
                                    )}
                                </Button>
                            </Modal.Footer>
                        </Form>
                    </Modal>
                </Container>
            </div>
        </React.Fragment>
    );
};

BlogCategories.layout = (page:any) => <Layout children={page} />
export default BlogCategories;