import React, { useState } from 'react';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { Button, Card, Form, Row, Col, Badge } from 'react-bootstrap';
import { FaArrowLeft, FaSave } from 'react-icons/fa';
import AdminLayout from '../../../Layouts/AdminLayout';
import { useTranslation } from 'react-i18next';
import Select from 'react-select';

interface CompanyLocationProps {
    id: number;
    name: string;
}

interface RoleProps {
    id: number;
    name: string;
}

interface DepartmentProps {
    id: number;
    name: string;
}

interface CreateProps {
    roles: RoleProps[];
    companyLocations: CompanyLocationProps[];
    departments: DepartmentProps[];
}

export default function Create({ roles, companyLocations, departments }: CreateProps) {
    const { t } = useTranslation();

    const { data, setData, post, processing, errors } = useForm({
        first_name: '',
        last_name: '',
        username: '',
        email: '',
        password: '',
        password_confirmation: '',
        department_id: '',
        position: '',
        host_id: '',
        is_admin: false,
        status: true,
        roles: [] as number[],
        companyLocations: [] as { id: number; is_primary: boolean; is_admin: boolean; }[],
    });

    const [selectedRoles, setSelectedRoles] = useState<{ value: number; label: string; }[]>([]);
    const [selectedLocations, setSelectedLocations] = useState<{ value: number; label: string; }[]>([]);
    const [primaryLocation, setPrimaryLocation] = useState<number | null>(null);
    const [adminLocations, setAdminLocations] = useState<number[]>([]);

    const roleOptions = roles.map(role => ({
        value: role.id,
        label: role.name
    }));

    const locationOptions = companyLocations.map(location => ({
        value: location.id,
        label: location.name
    }));

    const departmentOptions = [
        { value: '', label: t('Select Department') },
        ...departments.map(department => ({
            value: department.id.toString(),
            label: department.name
        }))
    ];

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Format roles for submission
        data.roles = selectedRoles.map(role => role.value);

        // Format company locations for submission
        data.companyLocations = selectedLocations.map(location => ({
            id: location.value,
            is_primary: primaryLocation === location.value,
            is_admin: adminLocations.includes(location.value)
        }));

        post(route('admin.users.store'));
    };

    const togglePrimaryLocation = (locationId: number) => {
        setPrimaryLocation(locationId === primaryLocation ? null : locationId);
    };

    const toggleAdminLocation = (locationId: number) => {
        if (adminLocations.includes(locationId)) {
            setAdminLocations(adminLocations.filter(id => id !== locationId));
        } else {
            setAdminLocations([...adminLocations, locationId]);
        }
    };

    return (
        <AdminLayout>
            <Head title={t('Create User')} />
            <div className="page-content">
                <div className="container-fluid px-4">
                    <div className="d-flex justify-content-between align-items-center mb-4">
                        <h1 className="h3 mb-0 text-gray-800">{t('Create User')}</h1>
                        <Link href={route('admin.users.index')} className="btn btn-outline-primary">
                            <FaArrowLeft className="me-2" /> {t('Back to Users')}
                        </Link>
                    </div>

                    <Card className="mb-4 shadow-sm">
                        <Card.Header className="bg-light">
                            <div>{t('User Information')}</div>
                        </Card.Header>
                        <Card.Body>
                            <Form onSubmit={handleSubmit}>
                                <Row className="mb-3">
                                    <Col md={6}>
                                        <Form.Group>
                                            <Form.Label>{t('First Name')} <span className="text-danger">*</span></Form.Label>
                                            <Form.Control
                                                type="text"
                                                isInvalid={!!errors.first_name}
                                                value={data.first_name}
                                                onChange={e => setData('first_name', e.target.value)}
                                            />
                                            {errors.first_name && (
                                                <Form.Control.Feedback type="invalid">{errors.first_name}</Form.Control.Feedback>
                                            )}
                                        </Form.Group>
                                    </Col>
                                    <Col md={6}>
                                        <Form.Group>
                                            <Form.Label>{t('Last Name')} <span className="text-danger">*</span></Form.Label>
                                            <Form.Control
                                                type="text"
                                                isInvalid={!!errors.last_name}
                                                value={data.last_name}
                                                onChange={e => setData('last_name', e.target.value)}
                                            />
                                            {errors.last_name && (
                                                <Form.Control.Feedback type="invalid">{errors.last_name}</Form.Control.Feedback>
                                            )}
                                        </Form.Group>
                                    </Col>
                                </Row>

                                <Row className="mb-3">
                                    <Col md={6}>
                                        <Form.Group>
                                            <Form.Label>{t('Username')} <span className="text-danger">*</span></Form.Label>
                                            <Form.Control
                                                type="text"
                                                isInvalid={!!errors.username}
                                                value={data.username}
                                                onChange={e => setData('username', e.target.value)}
                                            />
                                            {errors.username && (
                                                <Form.Control.Feedback type="invalid">{errors.username}</Form.Control.Feedback>
                                            )}
                                        </Form.Group>
                                    </Col>
                                    <Col md={6}>
                                        <Form.Group>
                                            <Form.Label>{t('Email')} <span className="text-danger">*</span></Form.Label>
                                            <Form.Control
                                                type="email"
                                                isInvalid={!!errors.email}
                                                value={data.email}
                                                onChange={e => setData('email', e.target.value)}
                                            />
                                            {errors.email && (
                                                <Form.Control.Feedback type="invalid">{errors.email}</Form.Control.Feedback>
                                            )}
                                        </Form.Group>
                                    </Col>
                                </Row>

                                <Row className="mb-3">
                                    <Col md={6}>
                                        <Form.Group>
                                            <Form.Label>{t('Password')} <span className="text-danger">*</span></Form.Label>
                                            <Form.Control
                                                type="password"
                                                isInvalid={!!errors.password}
                                                value={data.password}
                                                onChange={e => setData('password', e.target.value)}
                                            />
                                            {errors.password && (
                                                <Form.Control.Feedback type="invalid">{errors.password}</Form.Control.Feedback>
                                            )}
                                        </Form.Group>
                                    </Col>
                                    <Col md={6}>
                                        <Form.Group>
                                            <Form.Label>{t('Confirm Password')} <span className="text-danger">*</span></Form.Label>
                                            <Form.Control
                                                type="password"
                                                isInvalid={!!errors.password_confirmation}
                                                value={data.password_confirmation}
                                                onChange={e => setData('password_confirmation', e.target.value)}
                                            />
                                            {errors.password_confirmation && (
                                                <Form.Control.Feedback type="invalid">{errors.password_confirmation}</Form.Control.Feedback>
                                            )}
                                        </Form.Group>
                                    </Col>
                                </Row>

                                <Row className="mb-3">
                                    <Col md={6}>
                                        <Form.Group>
                                            <Form.Label>{t('Department')}</Form.Label>
                                            <Form.Select
                                                isInvalid={!!errors.department_id}
                                                value={data.department_id}
                                                onChange={e => setData('department_id', e.target.value)}
                                            >
                                                <option value="">{t('Select Department')}</option>
                                                {departments.map(department => (
                                                    <option key={department.id} value={department.id}>
                                                        {department.name}
                                                    </option>
                                                ))}
                                            </Form.Select>
                                            {errors.department_id && (
                                                <Form.Control.Feedback type="invalid">{errors.department_id}</Form.Control.Feedback>
                                            )}
                                        </Form.Group>
                                    </Col>
                                    <Col md={6}>
                                        <Form.Group>
                                            <Form.Label>{t('Position')}</Form.Label>
                                            <Form.Control
                                                type="text"
                                                isInvalid={!!errors.position}
                                                value={data.position}
                                                onChange={e => setData('position', e.target.value)}
                                            />
                                            {errors.position && (
                                                <Form.Control.Feedback type="invalid">{errors.position}</Form.Control.Feedback>
                                            )}
                                        </Form.Group>
                                    </Col>
                                </Row>

                                <Row className="mb-3">
                                    <Col md={6}>
                                        <Form.Group>
                                            <Form.Label>{t('Employee ID')}</Form.Label>
                                            <Form.Control
                                                type="text"
                                                isInvalid={!!errors.host_id}
                                                value={data.host_id}
                                                onChange={e => setData('host_id', e.target.value)}
                                            />
                                            {errors.host_id && (
                                                <Form.Control.Feedback type="invalid">{errors.host_id}</Form.Control.Feedback>
                                            )}
                                        </Form.Group>
                                    </Col>
                                    <Col md={6}>
                                        <Form.Group className="mt-4">
                                            <Form.Check
                                                type="switch"
                                                id="is_admin"
                                                label={t('Is Admin')}
                                                checked={data.is_admin}
                                                onChange={e => setData('is_admin', e.target.checked)}
                                            />
                                        </Form.Group>
                                        <Form.Group className="mt-2">
                                            <Form.Check
                                                type="switch"
                                                id="status"
                                                label={t('Active')}
                                                checked={data.status}
                                                onChange={e => setData('status', e.target.checked)}
                                            />
                                        </Form.Group>
                                    </Col>
                                </Row>

                                <Row className="mb-3">
                                    <Col md={12}>
                                        <Form.Group>
                                            <Form.Label>{t('Roles')} <span className="text-danger">*</span></Form.Label>
                                            <Select
                                                isMulti
                                                options={roleOptions}
                                                className={errors.roles ? 'is-invalid' : ''}
                                                value={selectedRoles}
                                                onChange={(selected) => setSelectedRoles(selected as { value: number; label: string; }[])}
                                                placeholder={t('Select Roles')}
                                                styles={{
                                                    multiValue: (base) => ({ ...base, backgroundColor: '#405189', borderRadius: '4px' }),
                                                    multiValueLabel: (base) => ({ ...base, color: '#fff', fontSize: '13px', padding: '2px 6px' }),
                                                    multiValueRemove: (base) => ({ ...base, color: '#fff', ':hover': { backgroundColor: '#334171', color: '#fff' } }),
                                                }}
                                            />
                                            {errors.roles && (
                                                <div className="invalid-feedback d-block">{errors.roles}</div>
                                            )}
                                        </Form.Group>
                                    </Col>
                                </Row>

                                <Row className="mb-3">
                                    <Col md={12}>
                                        <Form.Group>
                                            <Form.Label>{t('Company Locations')}</Form.Label>
                                            <Select
                                                isMulti
                                                options={locationOptions}
                                                className={errors.companyLocations ? 'is-invalid' : ''}
                                                value={selectedLocations}
                                                onChange={(selected) => setSelectedLocations(selected as { value: number; label: string; }[])}
                                                placeholder={t('Select Locations')}
                                            />
                                            {errors.companyLocations && (
                                                <div className="invalid-feedback d-block">{errors.companyLocations}</div>
                                            )}
                                        </Form.Group>
                                    </Col>
                                </Row>

                                {selectedLocations.length > 0 && (
                                    <Row className="mb-3">
                                        <Col md={12}>
                                            <Card>
                                                <Card.Header className="bg-light">
                                                    {t('Location Settings')}
                                                </Card.Header>
                                                <Card.Body>
                                                    <div className="table-responsive">
                                                        <table className="table table-bordered">
                                                            <thead>
                                                                <tr>
                                                                    <th>{t('Location')}</th>
                                                                    <th>{t('Primary')}</th>
                                                                    <th>{t('Admin')}</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {selectedLocations.map(location => (
                                                                    <tr key={location.value}>
                                                                        <td>{location.label}</td>
                                                                        <td>
                                                                            <Form.Check
                                                                                type="radio"
                                                                                name="primary_location"
                                                                                id={`primary_${location.value}`}
                                                                                checked={primaryLocation === location.value}
                                                                                onChange={() => togglePrimaryLocation(location.value)}
                                                                            />
                                                                        </td>
                                                                        <td>
                                                                            <Form.Check
                                                                                type="checkbox"
                                                                                id={`admin_${location.value}`}
                                                                                checked={adminLocations.includes(location.value)}
                                                                                onChange={() => toggleAdminLocation(location.value)}
                                                                            />
                                                                        </td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                </Card.Body>
                                            </Card>
                                        </Col>
                                    </Row>
                                )}

                                <div className="d-flex justify-content-end mt-4">
                                    <Button
                                        type="button"
                                        variant="outline-secondary"
                                        className="me-2"
                                        onClick={() => router.get(route('admin.users.index'))}
                                    >
                                        {t('Cancel')}
                                    </Button>
                                    <Button
                                        type="submit"
                                        variant="primary"
                                        disabled={processing}
                                    >
                                        <FaSave className="me-2" />
                                        {t('Save User')}
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
