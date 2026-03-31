import React, { useState, useEffect } from 'react';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { Button, Card, Form, Row, Col, Badge } from 'react-bootstrap';
import { FaArrowLeft, FaSave } from 'react-icons/fa';
import AdminLayout from '../../../Layouts/AdminLayout';
import { useTranslation } from 'react-i18next';
import Select from 'react-select';
import AssignedAccountsManager from '../../../Components/AssignedAccountsManager';

interface CompanyLocationProps {
    id: number;
    name: string;
    pivot?: {
        is_primary: boolean;
        is_admin: boolean;
    };
}

interface RoleProps {
    id: number;
    name: string;
}

interface DepartmentProps {
    id: number;
    name: string;
}

interface UserProps {
    id: number;
    first_name: string;
    last_name: string;
    name: string;
    username: string;
    email: string;
    avatar?: string;
    avatar?: string;
    department_id: number | null;
    position: string | null;
    employee_id: string | null;
    is_admin: boolean;
    status: boolean;
    roles: RoleProps[];
    companyLocations: CompanyLocationProps[];
    department?: DepartmentProps;

    assignedAccounts?: Array<{
    id: number;
    title: string;
    account_code: string;
    pivot?: { is_default: boolean };
}>;
}



interface EditProps {
    user: UserProps;
    roles: RoleProps[];
    companyLocations: CompanyLocationProps[];
    departments: DepartmentProps[];
}

export default function Edit({ user, roles, companyLocations, departments }: EditProps) {
    const { t } = useTranslation();

    // Add logging to debug user data
    console.log('User data received in Edit component:', user);

    // Extracting name parts if first_name and last_name are not available
    const nameParts = user.name ? user.name.split(' ') : ['', ''];
    const extractedFirstName = nameParts[0] || '';
    const extractedLastName = nameParts.slice(1).join(' ') || '';

    const { data, setData, post, processing, errors } = useForm({
        // Use extracted name parts if first_name/last_name are not available
        first_name: user.first_name || extractedFirstName,
        last_name: user.last_name || extractedLastName,
        // Use name if username is not available
        username: user.username || user.name || '',
        email: user.email || '',
        password: '',
        password_confirmation: '',
        department_id: user.department_id?.toString() || '',
        position: user.position || '',
        employee_id: user.employee_id || '',
        // Use is_active if is_admin is not available
        is_admin: user.is_admin ?? false,
        status: user.is_active ?? true,
        roles: [] as number[],
        companyLocations: [] as { id: number; is_primary: boolean; is_admin: boolean; }[],
        avatar: null as File | null,
        _method: 'PUT' as const,
    });

    // Avatar preview state
    const [avatarPreview, setAvatarPreview] = useState<string | null>(
        user.avatar ? `/storage/${user.avatar}` : (user.avatar || null)
    );

    // Initialize selected roles from user data
    const [selectedRoles, setSelectedRoles] = useState<{ value: number; label: string; }[]>(
        user.roles && user.roles.length > 0 ? user.roles.map(role => ({
            value: role.id,
            label: role.name
        })) : []
    );

    // Initialize selected locations from user data
    const [selectedLocations, setSelectedLocations] = useState<{ value: number; label: string; }[]>(
        user.companyLocations && user.companyLocations.length > 0 ? user.companyLocations.map(location => ({
            value: location.id,
            label: location.name
        })) : []
    );

    // Initialize primary location from user data
    const [primaryLocation, setPrimaryLocation] = useState<number | null>(
        user.companyLocations && user.companyLocations.length > 0 ?
        user.companyLocations.find(location => location.pivot?.is_primary)?.id || null : null
    );

    // Initialize admin locations from user data
    const [adminLocations, setAdminLocations] = useState<number[]>(
        user.companyLocations && user.companyLocations.length > 0 ?
        user.companyLocations.filter(location => location.pivot?.is_admin).map(location => location.id) : []
    );

    const roleOptions = roles.map(role => ({
        value: role.id,
        label: role.name
    }));

    const locationOptions = companyLocations.map(location => ({
        value: location.id,
        label: location.name
    }));

    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setData('avatar', file);

            // Create preview URL
            const previewUrl = URL.createObjectURL(file);
            setAvatarPreview(previewUrl);
        }
    };

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

        post(route('admin.users.update', user.id), {
            forceFormData: true,
        });
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
            <Head title={t('Edit User')} />
            <div className="page-content">
                <div className="container-fluid px-4">
                    <div className="d-flex justify-content-between align-items-center mb-4">
                        <h1 className="h3 mb-0 text-gray-800">{t('Edit User')}: {user.name}</h1>
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
                                {/* Avatar Section */}
                                <Row className="mb-4">
                                    <Col md={12}>
                                        <Form.Group>
                                            <Form.Label>{t('Profile Picture')}</Form.Label>
                                            <div className="d-flex align-items-center gap-3">
                                                <div>
                                                    <img
                                                        src={avatarPreview || '/images/users/user-dummy-img.jpg'}
                                                        alt={t('Profile Picture')}
                                                        className="rounded-circle"
                                                        style={{ width: '80px', height: '80px', objectFit: 'cover' }}
                                                        onError={(e) => {
                                                            e.currentTarget.src = '/images/users/user-dummy-img.jpg';
                                                        }}
                                                    />
                                                </div>
                                                <div className="flex-grow-1">
                                                    <Form.Control
                                                        type="file"
                                                        accept="image/*"
                                                        onChange={handleAvatarChange}
                                                        isInvalid={!!errors.avatar}
                                                    />
                                                    {errors.avatar && (
                                                        <Form.Control.Feedback type="invalid">{errors.avatar}</Form.Control.Feedback>
                                                    )}
                                                    <Form.Text className="text-muted">
                                                        {t('Allowed formats: JPG, PNG, GIF. Max size: 2MB.')}
                                                    </Form.Text>
                                                </div>
                                            </div>
                                        </Form.Group>
                                    </Col>
                                </Row>

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
                                            <Form.Label>{t('Password')} <small className="text-muted">({t('Leave blank to keep current password')})</small></Form.Label>
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
                                            <Form.Label>{t('Confirm Password')}</Form.Label>
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
                                                isInvalid={!!errors.employee_id}
                                                value={data.employee_id}
                                                onChange={e => setData('employee_id', e.target.value)}
                                            />
                                            {errors.employee_id && (
                                                <Form.Control.Feedback type="invalid">{errors.employee_id}</Form.Control.Feedback>
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
                                        {t('Update User')}
                                    </Button>
                                </div>

                                {/* Assigned Accounts Section - for B2B Portal access */}
{user.roles?.some(role => role.name === 'customer' || role.name === 'customer_admin') && (
    <AssignedAccountsManager
        userId={user.id}
        initialAccounts={user.assignedAccounts || []}
    />
)}
                            </Form>
                        </Card.Body>
                    </Card>
                </div>
            </div>
        </AdminLayout>
    );
}
