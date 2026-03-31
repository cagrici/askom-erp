import React from 'react';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { Button, Card, Form, Row, Col } from 'react-bootstrap';
import { FaArrowLeft, FaSave } from 'react-icons/fa';
import AdminLayout from '../../../Layouts/AdminLayout';
import { useTranslation } from 'react-i18next';

export default function Create() {
    const { t } = useTranslation();
    
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        description: '',
        level: 1,
        is_active: true,
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('admin.roles.store'));
    };

    return (
        <AdminLayout>
            <Head title={t('Create Role')} />
            <div className="page-content">
                <div className="container-fluid px-4">
                    <div className="d-flex justify-content-between align-items-center mb-4">
                        <h1 className="h3 mb-0 text-gray-800">{t('Create Role')}</h1>
                        <Link href={route('admin.roles.index')} className="btn btn-outline-primary">
                            <FaArrowLeft className="me-2" /> {t('Back to Roles')}
                        </Link>
                    </div>

                    <Card className="mb-4 shadow-sm">
                        <Card.Header className="bg-light">
                            <div>{t('Role Information')}</div>
                        </Card.Header>
                        <Card.Body>
                            <Form onSubmit={handleSubmit}>
                                <Row className="mb-3">
                                    <Col md={12}>
                                        <Form.Group>
                                            <Form.Label>{t('Role Name')} <span className="text-danger">*</span></Form.Label>
                                            <Form.Control
                                                type="text"
                                                isInvalid={!!errors.name}
                                                value={data.name}
                                                onChange={e => setData('name', e.target.value)}
                                                placeholder={t('Enter role name')}
                                            />
                                            {errors.name && (
                                                <Form.Control.Feedback type="invalid">{errors.name}</Form.Control.Feedback>
                                            )}
                                            <Form.Text className="text-muted">
                                                {t('The role name will be automatically converted to a slug.')}
                                            </Form.Text>
                                        </Form.Group>
                                    </Col>
                                </Row>

                                <Row className="mb-3">
                                    <Col md={12}>
                                        <Form.Group>
                                            <Form.Label>{t('Description')}</Form.Label>
                                            <Form.Control
                                                as="textarea"
                                                rows={3}
                                                isInvalid={!!errors.description}
                                                value={data.description}
                                                onChange={e => setData('description', e.target.value)}
                                                placeholder={t('Enter role description')}
                                            />
                                            {errors.description && (
                                                <Form.Control.Feedback type="invalid">{errors.description}</Form.Control.Feedback>
                                            )}
                                        </Form.Group>
                                    </Col>
                                </Row>

                                <Row className="mb-3">
                                    <Col md={6}>
                                        <Form.Group>
                                            <Form.Label>{t('Level')}</Form.Label>
                                            <Form.Control
                                                type="number"
                                                min="1"
                                                isInvalid={!!errors.level}
                                                value={data.level}
                                                onChange={e => setData('level', parseInt(e.target.value))}
                                            />
                                            {errors.level && (
                                                <Form.Control.Feedback type="invalid">{errors.level}</Form.Control.Feedback>
                                            )}
                                            <Form.Text className="text-muted">
                                                {t('Higher levels indicate higher privileges.')}
                                            </Form.Text>
                                        </Form.Group>
                                    </Col>
                                    <Col md={6}>
                                        <Form.Group className="mt-4">
                                            <Form.Check
                                                type="switch"
                                                id="is_active"
                                                label={t('Active')}
                                                checked={data.is_active}
                                                onChange={e => setData('is_active', e.target.checked)}
                                            />
                                            <Form.Text className="text-muted">
                                                {t('Inactive roles are not assigned to new users.')}
                                            </Form.Text>
                                        </Form.Group>
                                    </Col>
                                </Row>

                                <div className="d-flex justify-content-end mt-4">
                                    <Button
                                        type="button"
                                        variant="outline-secondary"
                                        className="me-2"
                                        onClick={() => router.get(route('admin.roles.index'))}
                                    >
                                        {t('Cancel')}
                                    </Button>
                                    <Button
                                        type="submit"
                                        variant="primary"
                                        disabled={processing}
                                    >
                                        <FaSave className="me-2" />
                                        {t('Save Role')}
                                    </Button>
                                </div>
                            </Form>
                        </Card.Body>
                    </Card>
                </div>
            </div>
        </AdminLayout>
    );
}
