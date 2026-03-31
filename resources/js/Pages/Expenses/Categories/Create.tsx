import React from 'react';
import { Container, Row, Col, Card, Form, Button } from 'react-bootstrap';
import BreadCrumb from '../../../Components/Common/BreadCrumb';
import { Head, Link, useForm } from '@inertiajs/react';
import Layout from '../../../Layouts';

interface Category {
    id: number;
    name: string;
}

interface CreateProps {
    parentCategories: Category[];
}

const ExpenseCategoryCreate = (props: CreateProps) => {
    const { parentCategories } = props;
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        description: '',
        parent_id: '',
        is_active: true,
    });
    
    // Handle input changes
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target as HTMLInputElement;
        
        if (type === 'checkbox') {
            const checked = (e.target as HTMLInputElement).checked;
            setData(name, checked);
        } else {
            setData(name, value);
        }
    };
    
    // Handle form submission
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        post(route('expense-categories.store'));
    };
    
    return (
        <React.Fragment>
            <Head title="Yeni Harcama Kategorisi | Portal" />
            <div className="page-content">
                <Container fluid>
                    <BreadCrumb title="Yeni Harcama Kategorisi" pageTitle="Harcama Yönetimi" />
                    
                    <Row className="justify-content-center">
                        <Col lg={8}>
                            <Card>
                                <Card.Header>
                                    <h4 className="card-title mb-0 flex-grow-1">Kategori Bilgileri</h4>
                                </Card.Header>
                                <Card.Body>
                                    <Form onSubmit={handleSubmit}>
                                        <Row className="mb-3">
                                            <Col md={12}>
                                                <Form.Group>
                                                    <Form.Label>Kategori Adı <span className="text-danger">*</span></Form.Label>
                                                    <Form.Control
                                                        type="text"
                                                        name="name"
                                                        value={data.name}
                                                        onChange={handleChange}
                                                        required
                                                        isInvalid={!!errors.name}
                                                    />
                                                    {errors.name && <Form.Control.Feedback type="invalid">{errors.name}</Form.Control.Feedback>}
                                                </Form.Group>
                                            </Col>
                                        </Row>
                                        
                                        <Row className="mb-3">
                                            <Col md={12}>
                                                <Form.Group>
                                                    <Form.Label>Üst Kategori</Form.Label>
                                                    <Form.Select
                                                        name="parent_id"
                                                        value={data.parent_id}
                                                        onChange={handleChange}
                                                        isInvalid={!!errors.parent_id}
                                                    >
                                                        <option value="">Üst Kategori Yok</option>
                                                        {parentCategories.map((category) => (
                                                            <option key={category.id} value={category.id}>
                                                                {category.name}
                                                            </option>
                                                        ))}
                                                    </Form.Select>
                                                    {errors.parent_id && <Form.Control.Feedback type="invalid">{errors.parent_id}</Form.Control.Feedback>}
                                                    <Form.Text className="text-muted">
                                                        Bu kategori için üst kategori seçebilirsiniz
                                                    </Form.Text>
                                                </Form.Group>
                                            </Col>
                                        </Row>
                                        
                                        <Row className="mb-3">
                                            <Col md={12}>
                                                <Form.Group>
                                                    <Form.Label>Açıklama</Form.Label>
                                                    <Form.Control
                                                        as="textarea"
                                                        rows={3}
                                                        name="description"
                                                        value={data.description}
                                                        onChange={handleChange}
                                                        isInvalid={!!errors.description}
                                                    />
                                                    {errors.description && <Form.Control.Feedback type="invalid">{errors.description}</Form.Control.Feedback>}
                                                </Form.Group>
                                            </Col>
                                        </Row>
                                        
                                        <Row className="mb-3">
                                            <Col md={12}>
                                                <Form.Group className="d-flex align-items-center">
                                                    <Form.Check
                                                        type="checkbox"
                                                        name="is_active"
                                                        id="is_active"
                                                        checked={data.is_active}
                                                        onChange={handleChange}
                                                        label="Kategori Aktif"
                                                        isInvalid={!!errors.is_active}
                                                    />
                                                    {errors.is_active && <div className="invalid-feedback d-block ms-2">{errors.is_active}</div>}
                                                </Form.Group>
                                            </Col>
                                        </Row>
                                        
                                        <div className="d-flex justify-content-end gap-2 mt-4">
                                            <Link href={route('expense-categories.index')} className="btn btn-light">
                                                İptal
                                            </Link>
                                            <Button type="submit" variant="primary" disabled={processing}>
                                                <i className="ri-save-line align-bottom me-1"></i> Kaydet
                                            </Button>
                                        </div>
                                    </Form>
                                </Card.Body>
                            </Card>
                        </Col>
                    </Row>
                </Container>
            </div>
        </React.Fragment>
    );
};

ExpenseCategoryCreate.layout = (page: any) => <Layout children={page} />;
export default ExpenseCategoryCreate;
