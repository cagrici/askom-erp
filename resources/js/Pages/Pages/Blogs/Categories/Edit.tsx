import BreadCrumb from '../../../../Components/Common/BreadCrumb';
import React from 'react';
import { Container, Row, Col, Card, CardBody, Form, Button } from 'react-bootstrap';
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
    posts_count?: number;
}

interface EditCategoryProps {
    category: Category;
}

const CategoryEdit = ({ category }: PageProps<EditCategoryProps>) => {
    document.title = "Kategori Düzenle | Şirket İçi Portal";

    // Form state
    const { data, setData, put, processing, errors } = useForm({
        name: category.name,
        description: category.description || '',
        color: category.color || '#3498db',
        icon: category.icon || '',
        is_active: category.is_active,
    });

    // Form gönderme
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        put(route('news.categories.update', category.id));
    };

    return (
        <React.Fragment>
            <div className="page-content">
                <Container fluid>
                    <BreadCrumb title="Kategori Düzenle" pageTitle="Haberler" />

                    <Row className="justify-content-center">
                        <Col lg={8}>
                            <Card>
                                <CardBody>
                                    <div className="d-flex align-items-center justify-content-between mb-4">
                                        <h4 className="card-title mb-0">Kategori Düzenle</h4>
                                        <Link 
                                            href={route('news.categories.index')} 
                                            className="btn btn-soft-secondary btn-sm"
                                        >
                                            <i className="ri-arrow-left-line align-bottom me-1"></i> Geri Dön
                                        </Link>
                                    </div>

                                    <Form onSubmit={handleSubmit}>
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

                                        <div className="mb-4">
                                            <Form.Check
                                                type="checkbox"
                                                id="is-active"
                                                label="Aktif"
                                                checked={data.is_active}
                                                onChange={(e) => setData('is_active', e.target.checked)}
                                            />
                                        </div>

                                        <div className="d-flex justify-content-end gap-2">
                                            <Link 
                                                href={route('news.categories.index')} 
                                                className="btn btn-light"
                                            >
                                                İptal
                                            </Link>
                                            <Button variant="success" type="submit" disabled={processing}>
                                                {processing ? (
                                                    <><span className="spinner-border spinner-border-sm me-1"></span> Güncelleniyor...</>
                                                ) : (
                                                    'Güncelle'
                                                )}
                                            </Button>
                                        </div>
                                    </Form>
                                </CardBody>
                            </Card>
                        </Col>
                    </Row>
                </Container>
            </div>
        </React.Fragment>
    );
};

CategoryEdit.layout = (page:any) => <Layout children={page} />
export default CategoryEdit;