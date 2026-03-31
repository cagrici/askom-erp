import React from 'react';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { Button, Card, Form, Row, Col, Alert } from 'react-bootstrap';
import { FaArrowLeft, FaSave } from 'react-icons/fa';
import AdminLayout from '../../../Layouts/AdminLayout';
import { useTranslation } from 'react-i18next';

interface PermissionProps {
    id: number;
    name: string;
    display_name: string;
    description: string;
}

interface ModuleProps {
    id: number;
    name: string;
    slug: string;
    display_name: string;
    icon?: string;
    description?: string;
}

interface GroupedPermissionProps {
    module: ModuleProps;
    permissions: { [group: string]: PermissionProps[] };
}

interface RoleProps {
    id: number;
    name: string;
    slug: string;
    description: string;
    level: number;
    is_system: boolean;
    is_active: boolean;
    permissions: PermissionProps[];
}

interface EditProps {
    role: RoleProps;
    groupedPermissions: GroupedPermissionProps[];
}

export default function Edit({ role, groupedPermissions }: EditProps) {
    const { t } = useTranslation();
    
    const { data, setData, put, processing, errors } = useForm({
        name: role.name || '',
        description: role.description || '',
        level: role.level || 1,
        is_active: role.is_active,
        permissions: role.permissions ? role.permissions.map(p => p.id) : [],
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        put(route('admin.roles.update', role.id));
    };

    const handlePermissionChange = (permissionId: number, checked: boolean) => {
        if (checked) {
            setData('permissions', [...data.permissions, permissionId]);
        } else {
            setData('permissions', data.permissions.filter(id => id !== permissionId));
        }
    };

    const getAllModulePermissions = (module: GroupedPermissionProps): PermissionProps[] => {
        const allPermissions: PermissionProps[] = [];
        Object.values(module.permissions).forEach(groupPermissions => {
            allPermissions.push(...groupPermissions);
        });
        return allPermissions;
    };

    const handleSelectAllModule = (module: GroupedPermissionProps, checked: boolean) => {
        const allPermissions = getAllModulePermissions(module);
        const modulePermissionIds = allPermissions.map(p => p.id);
        if (checked) {
            const newPermissions = [...new Set([...data.permissions, ...modulePermissionIds])];
            setData('permissions', newPermissions);
        } else {
            setData('permissions', data.permissions.filter(id => !modulePermissionIds.includes(id)));
        }
    };

    const isModuleFullySelected = (module: GroupedPermissionProps) => {
        const allPermissions = getAllModulePermissions(module);
        return allPermissions.every(p => data.permissions.includes(p.id));
    };

    const isModulePartiallySelected = (module: GroupedPermissionProps) => {
        const allPermissions = getAllModulePermissions(module);
        return allPermissions.some(p => data.permissions.includes(p.id)) && !isModuleFullySelected(module);
    };

    const getGroupDisplayName = (group: string): string => {
        const groupNames: { [key: string]: string } = {
            'view': t('View'),
            'create': t('Create'),
            'edit': t('Edit'),
            'delete': t('Delete'),
            'approve': t('Approve'),
            'download': t('Download'),
            'share': t('Share'),
            'publish': t('Publish'),
            'export': t('Export'),
            'reports': t('Reports'),
            'settings': t('Settings'),
            'users': t('Users'),
            'roles': t('Roles'),
            'permissions': t('Permissions'),
            'assign': t('Assign'),
            'process': t('Process'),
            'complete': t('Complete'),
            'reject': t('Reject'),
            'rooms': t('Rooms'),
            'sales': t('Sales'),
            'comparative': t('Comparative'),
            'vote': t('Vote'),
            'comment': t('Comment'),
            'deliver': t('Deliver'),
            'reserve': t('Reserve')
        };
        return groupNames[group] || group;
    };

    return (
        <AdminLayout>
            <Head title={t('Edit Role')} />
            <div className="page-content">
                <div className="container-fluid px-4">
                    <div className="d-flex justify-content-between align-items-center mb-4">
                        <h1 className="h3 mb-0 text-gray-800">{t('Edit Role')}: {role.name}</h1>
                        <Link href={route('admin.roles.index')} className="btn btn-outline-primary">
                            <FaArrowLeft className="me-2" /> {t('Back to Roles')}
                        </Link>
                    </div>

                    {role.is_system && (
                        <Alert variant="warning" className="mb-4">
                            <strong>{t('Warning')}:</strong> {t('This is a system role. Some settings may be restricted.')}
                        </Alert>
                    )}

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
                                                disabled={role.is_system}
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
                                                disabled={role.is_system}
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
                                                disabled={role.is_system}
                                            />
                                            <Form.Text className="text-muted">
                                                {t('Inactive roles are not assigned to new users.')}
                                            </Form.Text>
                                        </Form.Group>
                                    </Col>
                                </Row>

                                {/* Permissions Section */}
                                {!role.is_system && (
                                    <Card className="mt-4">
                                        <Card.Header className="bg-light">
                                            <h5 className="mb-0">{t('Permissions')}</h5>
                                        </Card.Header>
                                        <Card.Body>
                                            {groupedPermissions.length > 0 ? (
                                                groupedPermissions.map((groupedPermission) => {
                                                    const allPermissions = getAllModulePermissions(groupedPermission);
                                                    return (
                                                        <Card key={groupedPermission.module.id} className="mb-3">
                                                            <Card.Header className="bg-light">
                                                                <div className="d-flex align-items-center">
                                                                    <Form.Check
                                                                        type="checkbox"
                                                                        id={`module_${groupedPermission.module.slug}`}
                                                                        checked={isModuleFullySelected(groupedPermission)}
                                                                        ref={input => {
                                                                            if (input) input.indeterminate = isModulePartiallySelected(groupedPermission);
                                                                        }}
                                                                        onChange={(e) => handleSelectAllModule(groupedPermission, e.target.checked)}
                                                                        className="me-3"
                                                                    />
                                                                    {groupedPermission.module.icon && (
                                                                        <i className={`${groupedPermission.module.icon} me-2`}></i>
                                                                    )}
                                                                    <div className="flex-grow-1">
                                                                        <strong>{groupedPermission.module.display_name}</strong>
                                                                        {groupedPermission.module.description && (
                                                                            <div className="text-muted small">{groupedPermission.module.description}</div>
                                                                        )}
                                                                    </div>
                                                                    <span className="badge bg-secondary">
                                                                        {allPermissions.length} {t('permissions')}
                                                                    </span>
                                                                </div>
                                                            </Card.Header>
                                                            <Card.Body>
                                                                {Object.entries(groupedPermission.permissions).map(([group, permissions]) => (
                                                                    <div key={group} className="mb-3">
                                                                        <h6 className="text-muted mb-2">{getGroupDisplayName(group)}</h6>
                                                                        <Row>
                                                                            {permissions.map(permission => (
                                                                                <Col md={6} lg={4} key={permission.id} className="mb-2">
                                                                                    <Form.Check
                                                                                        type="checkbox"
                                                                                        id={`permission_${permission.id}`}
                                                                                        label={
                                                                                            <div>
                                                                                                <div>{permission.display_name}</div>
                                                                                                {permission.description && (
                                                                                                    <small className="text-muted">{permission.description}</small>
                                                                                                )}
                                                                                            </div>
                                                                                        }
                                                                                        checked={data.permissions.includes(permission.id)}
                                                                                        onChange={(e) => handlePermissionChange(permission.id, e.target.checked)}
                                                                                        className="ms-2"
                                                                                    />
                                                                                </Col>
                                                                            ))}
                                                                        </Row>
                                                                    </div>
                                                                ))}
                                                            </Card.Body>
                                                        </Card>
                                                    );
                                                })
                                            ) : (
                                                <p className="text-muted">{t('No permissions available')}</p>
                                            )}
                                        </Card.Body>
                                    </Card>
                                )}

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
                                        disabled={processing || role.is_system}
                                    >
                                        <FaSave className="me-2" />
                                        {t('Update Role')}
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
