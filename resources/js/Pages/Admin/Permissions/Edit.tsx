import React, { useState } from 'react';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { Button, Card, Form, Row, Col } from 'react-bootstrap';
import { FaArrowLeft, FaSave, FaUserTag } from 'react-icons/fa';
import AdminLayout from '../../../Layouts/AdminLayout';
import { useTranslation } from 'react-i18next';
import Select from 'react-select';

interface RoleProps {
    id: number;
    name: string;
}

interface PermissionProps {
    id: number;
    name: string;
    slug: string;
    description: string;
    module: string;
    roles: RoleProps[];
}

interface EditProps {
    permission: PermissionProps;
    modules: string[];
    roles: RoleProps[];
    assignedRoles: number[];
}

export default function Edit({ permission, modules, roles, assignedRoles }: EditProps) {
    const { t } = useTranslation();
    
    const { data, setData, put, processing, errors } = useForm({
        name: permission.name || '',
        description: permission.description || '',
        module: permission.module || '',
        roles: assignedRoles || [],
    });

    const [selectedRoles, setSelectedRoles] = useState<{ value: number; label: string; }[]>(
        roles.filter(role => assignedRoles.includes(role.id)).map(role => ({
            value: role.id,
            label: role.name
        }))
    );

    const roleOptions = roles.map(role => ({
        value: role.id,
        label: role.name
    }));

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        // Format roles for submission
        data.roles = selectedRoles.map(role => role.value);
        
        put(route('admin.permissions.update', permission.id));
    };

    return (
        <AdminLayout>
            <Head title={t('Edit Permission')} />
            <div className="page-content">
                <div className="container-fluid px-4">
                    <div className="d-flex justify-content-between align-items-center mb-4">
                        <h1 className="h3 mb-0 text-gray-800">{t('Edit Permission')}: {permission.name}</h1>
                        <Link href={route('admin.permissions.index')} className="btn btn-outline-primary">
                            <FaArrowLeft className="me-2" /> {t('Back to Permissions')}
                        </Link>
                    </div>

                    <Card className="mb-4 shadow-sm">
                        <Card.Header className="bg-light">
                            <div>{t('Permission Information')}</div>
                        </Card.Header>
                        <Card.Body>
                            <Form onSubmit={handleSubmit}>
                                <Row className="mb-3">
                                    <Col md={12}>
                                        <Form.Group>
                                            <Form.Label>{t('Permission Name')} <span className="text-danger">*</span></Form.Label>
                                            <Form.Control
                                                type="text"
                                                isInvalid={!!errors.name}
                                                value={data.name}
                                                onChange={e => setData('name', e.target.value)}
                                                placeholder={t('Enter permission name')}
                                            />
                                            {errors.name && (
                                                <Form.Control.Feedback type="invalid">{errors.name}</Form.Control.Feedback>
                                            )}
                                            <Form.Text className="text-muted">
                                                {t('The permission name will be automatically converted to a slug.')}
                                            </Form.Text>
                                        </Form.Group>
                                    </Col>
                                </Row>

                                <Row className="mb-3">
                                    <Col md={12}>
                                        <Form.Group>
                                            <Form.Label>{t('Module')} <span className="text-danger">*</span></Form.Label>
                                            <Form.Select
                                                isInvalid={!!errors.module}
                                                value={data.module}
                                                onChange={e => setData('module', e.target.value)}
                                            >
                                                <option value="">{t('Select Module')}</option>
                                                {modules.map((module, index) => (
                                                    <option key={index} value={module}>
                                                        {module}
                                                    </option>
                                                ))}
                                                <option value="new">{t('Create New Module')}</option>
                                            </Form.Select>
                                            {errors.module && (
                                                <Form.Control.Feedback type="invalid">{errors.module}</Form.Control.Feedback>
                                            )}
                                        </Form.Group>
                                    </Col>
                                </Row>

                                {data.module === 'new' && (
                                    <Row className="mb-3">
                                        <Col md={12}>
                                            <Form.Group>
                                                <Form.Label>{t('New Module Name')} <span className="text-danger">*</span></Form.Label>
                                                <Form.Control
                                                    type="text"
                                                    value={data.module === 'new' ? '' : data.module}
                                                    onChange={e => setData('module', e.target.value)}
                                                    placeholder={t('Enter new module name')}
                                                />
                                            </Form.Group>
                                        </Col>
                                    </Row>
                                )}

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
                                                placeholder={t('Enter permission description')}
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
                                            <Form.Label>{t('Assign Roles')}</Form.Label>
                                            <Select
                                                isMulti
                                                options={roleOptions}
                                                className={errors.roles ? 'is-invalid' : ''}
                                                value={selectedRoles}
                                                onChange={(selected) => setSelectedRoles(selected as { value: number; label: string; }[])}
                                                placeholder={t('Select Roles')}
                                            />
                                            {errors.roles && (
                                                <div className="invalid-feedback d-block">{errors.roles}</div>
                                            )}
                                            <Form.Text className="text-muted">
                                                {t('Assign this permission to multiple roles.')}
                                            </Form.Text>
                                        </Form.Group>
                                    </Col>
                                </Row>

                                <div className="d-flex justify-content-end mt-4">
                                    <Button
                                        type="button"
                                        variant="outline-secondary"
                                        className="me-2"
                                        onClick={() => router.get(route('admin.permissions.index'))}
                                    >
                                        {t('Cancel')}
                                    </Button>
                                    <Button
                                        type="submit"
                                        variant="primary"
                                        disabled={processing}
                                    >
                                        <FaSave className="me-2" />
                                        {t('Update Permission')}
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
