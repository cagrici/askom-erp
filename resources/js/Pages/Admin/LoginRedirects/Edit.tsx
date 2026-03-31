import React from 'react';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { Button, Card, Form, Row, Col, Alert } from 'react-bootstrap';
import { FaArrowLeft, FaSave } from 'react-icons/fa';
import AdminLayout from '../../../Layouts/AdminLayout';
import { useTranslation } from 'react-i18next';

interface UserProps {
    id: number;
    name: string;
    email: string;
}

interface RoleProps {
    id: number;
    name: string;
}

interface SamplePageProps {
    value: string;
    label: string;
}

interface LoginRedirectProps {
    id: number;
    type: 'user' | 'role';
    user_id: number | null;
    role_id: number | null;
    redirect_to: string;
    name: string | null;
    description: string | null;
    priority: number;
    is_active: boolean;
}

interface EditProps {
    redirect: LoginRedirectProps;
    users: UserProps[];
    roles: RoleProps[];
    samplePages: SamplePageProps[];
}

export default function Edit({ redirect, users, roles, samplePages }: EditProps) {
    const { t } = useTranslation();
    
    const { data, setData, put, processing, errors } = useForm({
        type: redirect.type,
        user_id: redirect.user_id || '',
        role_id: redirect.role_id || '',
        redirect_to: redirect.redirect_to,
        name: redirect.name || '',
        description: redirect.description || '',
        priority: redirect.priority,
        is_active: redirect.is_active,
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        put(route('admin.login-redirects.update', redirect.id));
    };

    const handlePageSelect = (page: string) => {
        setData('redirect_to', page);
        const selectedPage = samplePages.find(p => p.value === page);
        if (selectedPage && !data.name) {
            setData('name', selectedPage.label);
        }
    };

    return (
        <AdminLayout>
            <Head title={t('Edit Login Redirect')} />
            <div className="page-content">
                <div className="container-fluid px-4">
                    <div className="d-flex justify-content-between align-items-center mb-4">
                        <h1 className="h3 mb-0 text-gray-800">{t('Edit Login Redirect')}</h1>
                        <Link href={route('admin.login-redirects.index')} className="btn btn-outline-primary">
                            <FaArrowLeft className="me-2" /> {t('Back to List')}
                        </Link>
                    </div>

                    <Card className="mb-4 shadow-sm">
                        <Card.Header className="bg-light">
                            <div>{t('Redirect Information')}</div>
                        </Card.Header>
                        <Card.Body>
                            <Form onSubmit={handleSubmit}>
                                <Row className="mb-3">
                                    <Col md={6}>
                                        <Form.Group>
                                            <Form.Label>{t('Type')} <span className="text-danger">*</span></Form.Label>
                                            <Form.Select
                                                value={data.type}
                                                onChange={e => setData('type', e.target.value)}
                                                isInvalid={!!errors.type}
                                            >
                                                <option value="role">{t('Role Based')}</option>
                                                <option value="user">{t('User Based')}</option>
                                            </Form.Select>
                                            {errors.type && (
                                                <Form.Control.Feedback type="invalid">{errors.type}</Form.Control.Feedback>
                                            )}
                                        </Form.Group>
                                    </Col>
                                    <Col md={6}>
                                        {data.type === 'user' ? (
                                            <Form.Group>
                                                <Form.Label>{t('Select User')} <span className="text-danger">*</span></Form.Label>
                                                <Form.Select
                                                    value={data.user_id}
                                                    onChange={e => setData('user_id', e.target.value)}
                                                    isInvalid={!!errors.user_id}
                                                >
                                                    <option value="">{t('Select a user...')}</option>
                                                    {users.map(user => (
                                                        <option key={user.id} value={user.id}>
                                                            {user.name} ({user.email})
                                                        </option>
                                                    ))}
                                                </Form.Select>
                                                {errors.user_id && (
                                                    <Form.Control.Feedback type="invalid">{errors.user_id}</Form.Control.Feedback>
                                                )}
                                            </Form.Group>
                                        ) : (
                                            <Form.Group>
                                                <Form.Label>{t('Select Role')} <span className="text-danger">*</span></Form.Label>
                                                <Form.Select
                                                    value={data.role_id}
                                                    onChange={e => setData('role_id', e.target.value)}
                                                    isInvalid={!!errors.role_id}
                                                >
                                                    <option value="">{t('Select a role...')}</option>
                                                    {roles.map(role => (
                                                        <option key={role.id} value={role.id}>
                                                            {role.name}
                                                        </option>
                                                    ))}
                                                </Form.Select>
                                                {errors.role_id && (
                                                    <Form.Control.Feedback type="invalid">{errors.role_id}</Form.Control.Feedback>
                                                )}
                                            </Form.Group>
                                        )}
                                    </Col>
                                </Row>

                                <Row className="mb-3">
                                    <Col md={8}>
                                        <Form.Group>
                                            <Form.Label>{t('Redirect To')} <span className="text-danger">*</span></Form.Label>
                                            <Form.Control
                                                type="text"
                                                value={data.redirect_to}
                                                onChange={e => setData('redirect_to', e.target.value)}
                                                placeholder="/dashboard"
                                                isInvalid={!!errors.redirect_to}
                                            />
                                            {errors.redirect_to && (
                                                <Form.Control.Feedback type="invalid">{errors.redirect_to}</Form.Control.Feedback>
                                            )}
                                            <Form.Text className="text-muted">
                                                {t('Enter the path where the user will be redirected after login.')}
                                            </Form.Text>
                                        </Form.Group>
                                    </Col>
                                    <Col md={4}>
                                        <Form.Group>
                                            <Form.Label>{t('Quick Select')}</Form.Label>
                                            <Form.Select onChange={e => handlePageSelect(e.target.value)}>
                                                <option value="">{t('Select a page...')}</option>
                                                {samplePages.map(page => (
                                                    <option key={page.value} value={page.value}>
                                                        {page.label}
                                                    </option>
                                                ))}
                                            </Form.Select>
                                        </Form.Group>
                                    </Col>
                                </Row>

                                <Row className="mb-3">
                                    <Col md={8}>
                                        <Form.Group>
                                            <Form.Label>{t('Display Name')}</Form.Label>
                                            <Form.Control
                                                type="text"
                                                value={data.name}
                                                onChange={e => setData('name', e.target.value)}
                                                placeholder={t('e.g., Sales Dashboard')}
                                                isInvalid={!!errors.name}
                                            />
                                            {errors.name && (
                                                <Form.Control.Feedback type="invalid">{errors.name}</Form.Control.Feedback>
                                            )}
                                        </Form.Group>
                                    </Col>
                                    <Col md={4}>
                                        <Form.Group>
                                            <Form.Label>{t('Priority')}</Form.Label>
                                            <Form.Control
                                                type="number"
                                                value={data.priority}
                                                onChange={e => setData('priority', parseInt(e.target.value) || 0)}
                                                min="0"
                                                isInvalid={!!errors.priority}
                                            />
                                            {errors.priority && (
                                                <Form.Control.Feedback type="invalid">{errors.priority}</Form.Control.Feedback>
                                            )}
                                            <Form.Text className="text-muted">
                                                {t('Higher priority redirects are applied first.')}
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
                                                value={data.description}
                                                onChange={e => setData('description', e.target.value)}
                                                placeholder={t('Optional description for this redirect rule...')}
                                                isInvalid={!!errors.description}
                                            />
                                            {errors.description && (
                                                <Form.Control.Feedback type="invalid">{errors.description}</Form.Control.Feedback>
                                            )}
                                        </Form.Group>
                                    </Col>
                                </Row>

                                <Row className="mb-3">
                                    <Col md={12}>
                                        <Form.Group>
                                            <Form.Check
                                                type="switch"
                                                id="is_active"
                                                label={t('Active')}
                                                checked={data.is_active}
                                                onChange={e => setData('is_active', e.target.checked)}
                                            />
                                            <Form.Text className="text-muted">
                                                {t('Only active redirects will be applied.')}
                                            </Form.Text>
                                        </Form.Group>
                                    </Col>
                                </Row>

                                <Alert variant="info">
                                    <strong>{t('How it works')}:</strong>
                                    <ul className="mb-0 mt-2">
                                        <li>{t('User-specific redirects have priority over role-based redirects.')}</li>
                                        <li>{t('If multiple redirects exist, the one with the highest priority is used.')}</li>
                                        <li>{t('The redirect path should start with a forward slash (/).')}</li>
                                    </ul>
                                </Alert>

                                <div className="d-flex justify-content-end mt-4">
                                    <Button
                                        type="button"
                                        variant="outline-secondary"
                                        className="me-2"
                                        onClick={() => router.get(route('admin.login-redirects.index'))}
                                    >
                                        {t('Cancel')}
                                    </Button>
                                    <Button
                                        type="submit"
                                        variant="primary"
                                        disabled={processing}
                                    >
                                        <FaSave className="me-2" />
                                        {t('Update Redirect')}
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