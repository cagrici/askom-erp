import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { Button, Card, Table, Form, Row, Col, Badge, Dropdown } from 'react-bootstrap';
import { FaEdit, FaTrash, FaPlus, FaFilter, FaEllipsisV, FaMapMarkerAlt, FaSortUp, FaSortDown, FaSort } from 'react-icons/fa';
import AdminLayout from '../../../Layouts/AdminLayout';
import { useTranslation } from 'react-i18next';
import CompanyLocationModal from '../../../Components/Admin/CompanyLocationModal';

interface CompanyLocationProps {
    id: number;
    name: string;
    pivot: {
        is_primary: boolean;
        is_admin: boolean;
    };
}

interface UserProps {
    id: number;
    name: string;
    email: string;
    username: string;
    avatar?: string;
    roles: Array<{
        id: number;
        name: string;
    }>;
    companyLocations: Array<CompanyLocationProps>;
    department?: {
        id: number;
        name: string;
    };
}

interface IndexProps {
    users: {
        data: UserProps[];
        links: any[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
        from: number;
        to: number;
    };
    roles: Array<{
        id: number;
        name: string;
    }>;
    companyLocations: Array<{
        id: number;
        name: string;
    }>;
    departments: Array<{
        id: number;
        name: string;
    }>;
    filters: {
        search?: string;
        role?: number;
        location?: number;
        department?: number;
        per_page?: number;
    };
}

export default function Index({ users, roles, companyLocations, departments, filters }: IndexProps) {
    const { t } = useTranslation();
    const [searchTerm, setSearchTerm] = useState(filters.search || '');
    const [selectedRole, setSelectedRole] = useState(filters.role || '');
    const [selectedLocation, setSelectedLocation] = useState(filters.location || '');
    const [selectedDepartment, setSelectedDepartment] = useState(filters.department || '');
    const [showFilters, setShowFilters] = useState(false);
    const [showLocationModal, setShowLocationModal] = useState(false);
    const [selectedUser, setSelectedUser] = useState<UserProps | null>(null);
    const [perPage, setPerPage] = useState(filters.per_page || users.per_page || 10);

    const currentFilters = () => ({
        search: searchTerm,
        role: selectedRole,
        location: selectedLocation,
        department: selectedDepartment,
        per_page: perPage,
    });

    const handleManageLocations = (user: UserProps) => {
        setSelectedUser(user);
        setShowLocationModal(true);
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(route('admin.users.index'), currentFilters(), { preserveState: true });
    };

    const handleReset = () => {
        setSearchTerm('');
        setSelectedRole('');
        setSelectedLocation('');
        setSelectedDepartment('');
        setPerPage(10);
        router.get(route('admin.users.index'), {}, { preserveState: true });
    };

    const handlePerPageChange = (value: number) => {
        setPerPage(value);
        router.get(route('admin.users.index'), { ...currentFilters(), per_page: value }, { preserveState: true });
    };

    const handleDelete = (id: number) => {
        if (confirm(t('Are you sure you want to delete this user?'))) {
            router.delete(route('admin.users.destroy', id));
        }
    };

    // Pagination renderer
    const renderPagination = () => {
        if (!users.links || users.last_page <= 1) return null;

        return (
            <ul className="pagination pagination-sm mb-0">
                {users.links.map((link: any, index: number) => {
                    let label = link.label;
                    if (label.includes('Previous')) label = '‹';
                    else if (label.includes('Next')) label = '›';

                    return (
                        <li key={index} className={`page-item ${link.active ? 'active' : ''} ${!link.url ? 'disabled' : ''}`}>
                            {link.url ? (
                                <Link
                                    href={link.url}
                                    className="page-link"
                                    preserveState
                                    dangerouslySetInnerHTML={{ __html: label }}
                                />
                            ) : (
                                <span className="page-link" dangerouslySetInnerHTML={{ __html: label }} />
                            )}
                        </li>
                    );
                })}
            </ul>
        );
    };

    return (
        <React.Fragment>
            <AdminLayout>
                <Head title={t('User Management')} />
                <div className="page-content">
                    <div className="container-fluid px-4">
                        <div className="d-flex justify-content-between align-items-center mb-4">
                            <h1 className="h3 mb-0 text-gray-800">{t('User Management')}</h1>
                            <Link href={route('admin.users.create')} className="btn btn-primary">
                                <FaPlus className="me-2" /> {t('Add User')}
                            </Link>
                        </div>

                        <Card className="mb-4 shadow-sm">
                            <Card.Header className="bg-light d-flex justify-content-between align-items-center">
                                <div>{t('Users')} <Badge bg="secondary" className="ms-1">{users.total}</Badge></div>
                                <Button
                                    variant="outline-secondary"
                                    size="sm"
                                    onClick={() => setShowFilters(!showFilters)}
                                >
                                    <FaFilter className="me-1" />
                                    {showFilters ? t('Hide Filters') : t('Show Filters')}
                                </Button>
                            </Card.Header>
                            <Card.Body className="p-0">
                                {showFilters && (
                                    <div className="p-3 border-bottom bg-light bg-opacity-50">
                                        <Form onSubmit={handleSearch}>
                                            <Row className="g-3">
                                                <Col md={3}>
                                                    <Form.Group>
                                                        <Form.Label className="small mb-1">{t('Search')}</Form.Label>
                                                        <Form.Control
                                                            size="sm"
                                                            type="text"
                                                            placeholder={t('Name, Email or Username')}
                                                            value={searchTerm}
                                                            onChange={(e) => setSearchTerm(e.target.value)}
                                                        />
                                                    </Form.Group>
                                                </Col>
                                                <Col md={3}>
                                                    <Form.Group>
                                                        <Form.Label className="small mb-1">{t('Role')}</Form.Label>
                                                        <Form.Select size="sm" value={selectedRole} onChange={(e) => setSelectedRole(e.target.value)}>
                                                            <option value="">{t('All Roles')}</option>
                                                            {roles.map((role) => (
                                                                <option key={role.id} value={role.id}>{role.name}</option>
                                                            ))}
                                                        </Form.Select>
                                                    </Form.Group>
                                                </Col>
                                                <Col md={3}>
                                                    <Form.Group>
                                                        <Form.Label className="small mb-1">{t('Location')}</Form.Label>
                                                        <Form.Select size="sm" value={selectedLocation} onChange={(e) => setSelectedLocation(e.target.value)}>
                                                            <option value="">{t('All Locations')}</option>
                                                            {companyLocations.map((location) => (
                                                                <option key={location.id} value={location.id}>{location.name}</option>
                                                            ))}
                                                        </Form.Select>
                                                    </Form.Group>
                                                </Col>
                                                <Col md={3}>
                                                    <Form.Group>
                                                        <Form.Label className="small mb-1">{t('Department')}</Form.Label>
                                                        <Form.Select size="sm" value={selectedDepartment} onChange={(e) => setSelectedDepartment(e.target.value)}>
                                                            <option value="">{t('All Departments')}</option>
                                                            {departments.map((department) => (
                                                                <option key={department.id} value={department.id}>{department.name}</option>
                                                            ))}
                                                        </Form.Select>
                                                    </Form.Group>
                                                </Col>
                                                <Col md={12} className="d-flex justify-content-end">
                                                    <Button type="button" variant="outline-secondary" size="sm" onClick={handleReset} className="me-2">
                                                        {t('Reset')}
                                                    </Button>
                                                    <Button type="submit" variant="primary" size="sm">
                                                        {t('Filter')}
                                                    </Button>
                                                </Col>
                                            </Row>
                                        </Form>
                                    </div>
                                )}

                                {/* Per-page selector & info bar */}
                                <div className="d-flex justify-content-between align-items-center px-3 py-2 border-bottom bg-white">
                                    <div className="d-flex align-items-center gap-2">
                                        <Form.Select
                                            size="sm"
                                            style={{ width: 'auto' }}
                                            value={perPage}
                                            onChange={(e) => handlePerPageChange(Number(e.target.value))}
                                        >
                                            {[10, 20, 30, 50, 100].map(n => (
                                                <option key={n} value={n}>{n}</option>
                                            ))}
                                        </Form.Select>
                                        <span className="text-muted small">{t('records per page')}</span>
                                    </div>
                                    <span className="text-muted small">
                                        {users.from && users.to
                                            ? `${users.from}-${users.to} / ${users.total} ${t('records')}`
                                            : `0 ${t('records')}`
                                        }
                                    </span>
                                </div>

                                <div className="table-responsive">
                                    <Table hover bordered className="align-middle mb-0" size="sm">
                                        <thead className="table-light">
                                            <tr>
                                                <th style={{ width: 50 }}>{t('Avatar')}</th>
                                                <th style={{ width: 60 }}>{t('ID')}</th>
                                                <th>{t('Name')}</th>
                                                <th>{t('Username')}</th>
                                                <th>{t('Email')}</th>
                                                <th>{t('Department')}</th>
                                                <th>{t('Roles')}</th>
                                                <th>{t('Locations')}</th>
                                                <th style={{ width: 60 }}>{t('Actions')}</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {users.data.length === 0 ? (
                                                <tr>
                                                    <td colSpan={9} className="text-center py-4 text-muted">
                                                        {t('No users found')}
                                                    </td>
                                                </tr>
                                            ) : (
                                                users.data.map((user) => (
                                                    <tr key={user.id}>
                                                        <td className="text-center">
                                                            <img
                                                                src={user.avatar ? `/storage/${user.avatar}` : '/images/users/user-dummy-img.jpg'}
                                                                alt={user.name}
                                                                className="rounded-circle"
                                                                style={{ width: '32px', height: '32px', objectFit: 'cover' }}
                                                                onError={(e) => {
                                                                    e.currentTarget.src = '/images/users/user-dummy-img.jpg';
                                                                }}
                                                            />
                                                        </td>
                                                        <td>{user.id}</td>
                                                        <td className="fw-medium">{user.name}</td>
                                                        <td>{user.username}</td>
                                                        <td>{user.email}</td>
                                                        <td>{user.department?.name || '-'}</td>
                                                        <td>
                                                            {user.roles.map((role) => (
                                                                <Badge key={role.id} bg="primary" className="me-1 mb-1">{role.name}</Badge>
                                                            ))}
                                                        </td>
                                                        <td>
                                                            {user.companyLocations && user.companyLocations.length > 0 ?
                                                                user.companyLocations.map((location) => (
                                                                    <Badge
                                                                        key={location.id}
                                                                        bg={location.pivot?.is_primary ? "success" : (location.pivot?.is_admin ? "danger" : "info")}
                                                                        className="me-1 mb-1"
                                                                    >
                                                                        {location.name}
                                                                        {location.pivot?.is_primary && ` (${t('Primary')})`}
                                                                        {location.pivot?.is_admin && ` (${t('Admin')})`}
                                                                    </Badge>
                                                                )) : '-'
                                                            }
                                                        </td>
                                                        <td>
                                                            <Dropdown align="end">
                                                                <Dropdown.Toggle variant="light" size="sm" id={`user-dropdown-${user.id}`}>
                                                                    <FaEllipsisV />
                                                                </Dropdown.Toggle>
                                                                <Dropdown.Menu>
                                                                    <Link href={route('admin.users.edit', user.id)} className="dropdown-item">
                                                                        <FaEdit className="me-2" /> {t('Edit')}
                                                                    </Link>
                                                                    <Dropdown.Item onClick={() => handleManageLocations(user)}>
                                                                        <FaMapMarkerAlt className="me-2" /> {t('Manage Locations')}
                                                                    </Dropdown.Item>
                                                                    <Dropdown.Divider />
                                                                    <Dropdown.Item className="text-danger" onClick={() => handleDelete(user.id)}>
                                                                        <FaTrash className="me-2" /> {t('Delete')}
                                                                    </Dropdown.Item>
                                                                </Dropdown.Menu>
                                                            </Dropdown>
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </Table>
                                </div>

                                {/* Footer: pagination */}
                                {users.last_page > 1 && (
                                    <div className="d-flex justify-content-between align-items-center px-3 py-2 border-top">
                                        <span className="text-muted small">
                                            {t('Page')} {users.current_page} / {users.last_page}
                                        </span>
                                        {renderPagination()}
                                    </div>
                                )}
                            </Card.Body>
                        </Card>
                    </div>
                </div>
            </AdminLayout>

            {showLocationModal && selectedUser && (
                <CompanyLocationModal
                    show={showLocationModal}
                    onHide={() => setShowLocationModal(false)}
                    userId={selectedUser.id}
                    userName={selectedUser.name}
                    userLocations={selectedUser.companyLocations || []}
                    availableLocations={companyLocations || []}
                    onSave={() => router.reload()}
                />
            )}
        </React.Fragment>
    );
}
