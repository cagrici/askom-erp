import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { Button, Card, Table, Form, Row, Col, Badge, Dropdown } from 'react-bootstrap';
import { FaEdit, FaTrash, FaPlus, FaFilter, FaEllipsisV, FaUsers } from 'react-icons/fa';
import AdminLayout from '../../../Layouts/AdminLayout';
import Pagination from '../../../Components/Common/Pagination';
import { useTranslation } from 'react-i18next';

interface RoleProps {
    id: number;
    name: string;
    slug: string;
    description: string;
    level: number;
    is_system: boolean;
    is_active: boolean;
    users: Array<{
        id: number;
        name: string;
    }>;
}

interface IndexProps {
    roles: {
        data: RoleProps[];
        links: any;
        total: number;
    };
    filters: {
        search?: string;
    };
}

export default function Index({ roles, filters }: IndexProps) {
    const { t } = useTranslation();
    const [searchTerm, setSearchTerm] = useState(filters.search || '');
    const [showFilters, setShowFilters] = useState(false);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();

        router.get(
            route('admin.roles.index'),
            { search: searchTerm },
            { preserveState: true }
        );
    };

    const handleReset = () => {
        setSearchTerm('');

        router.get(
            route('admin.roles.index'),
            {},
            { preserveState: true }
        );
    };

    const handleDelete = (id: number) => {
        if (confirm(t('Are you sure you want to delete this role?'))) {
            router.delete(route('admin.roles.destroy', id));
        }
    };

    return (
        <AdminLayout>
            <Head title={t('Role Management')} />
            <div className="page-content">
                <div className="container-fluid px-4">
                    <div className="d-flex justify-content-between align-items-center mb-4">
                        <h1 className="h3 mb-0 text-gray-800">{t('Role Management')}</h1>
                        <Link href={route('admin.roles.create')} className="btn btn-primary">
                            <FaPlus className="me-2" /> {t('Add Role')}
                        </Link>
                    </div>

                    <Card className="mb-4 shadow-sm">
                        <Card.Header className="bg-light d-flex justify-content-between align-items-center">
                            <div>{t('Roles')}</div>
                            <Button
                                variant="outline-secondary"
                                size="sm"
                                onClick={() => setShowFilters(!showFilters)}
                            >
                                <FaFilter className="me-1" />
                                {showFilters ? t('Hide Filters') : t('Show Filters')}
                            </Button>
                        </Card.Header>
                        <Card.Body>
                            {showFilters && (
                                <Form onSubmit={handleSearch} className="mb-4">
                                    <Row className="g-3">
                                        <Col md={8}>
                                            <Form.Group>
                                                <Form.Label>{t('Search')}</Form.Label>
                                                <Form.Control
                                                    type="text"
                                                    placeholder={t('Role Name or Description')}
                                                    value={searchTerm}
                                                    onChange={(e) => setSearchTerm(e.target.value)}
                                                />
                                            </Form.Group>
                                        </Col>
                                        <Col md={4} className="d-flex align-items-end">
                                            <div className="d-grid gap-2 w-100">
                                                <Button type="submit" variant="primary">
                                                    {t('Filter')}
                                                </Button>
                                                <Button type="button" variant="outline-secondary" onClick={handleReset}>
                                                    {t('Reset')}
                                                </Button>
                                            </div>
                                        </Col>
                                    </Row>
                                </Form>
                            )}

                            <div className="table-responsive">
                                <Table hover bordered className="align-middle">
                                    <thead className="bg-light">
                                    <tr>
                                        <th>{t('ID')}</th>
                                        <th>{t('Name')}</th>
                                        <th>{t('Slug')}</th>
                                        <th>{t('Description')}</th>
                                        <th>{t('Level')}</th>
                                        <th>{t('Status')}</th>
                                        <th>{t('Users')}</th>
                                        <th>{t('Actions')}</th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {roles.data.length === 0 ? (
                                        <tr>
                                            <td colSpan={8} className="text-center py-4">
                                                {t('No roles found')}
                                            </td>
                                        </tr>
                                    ) : (
                                        roles.data.map((role) => (
                                            <tr key={role.id}>
                                                <td>{role.id}</td>
                                                <td>{role.name}</td>
                                                <td>{role.slug}</td>
                                                <td>{role.description}</td>
                                                <td>{role.level}</td>
                                                <td>
                                                    <Badge bg={role.is_active ? 'success' : 'danger'}>
                                                        {role.is_active ? t('Active') : t('Inactive')}
                                                    </Badge>
                                                    {role.is_system && (
                                                        <Badge bg="info" className="ms-1">
                                                            {t('System')}
                                                        </Badge>
                                                    )}
                                                </td>
                                                <td>
                                                    <Badge bg="secondary">
                                                        {role.users.length} {t('users')}
                                                    </Badge>
                                                </td>
                                                <td>
                                                    <Dropdown align="end">
                                                        <Dropdown.Toggle variant="light" size="sm" id={`role-dropdown-${role.id}`}>
                                                            <FaEllipsisV />
                                                        </Dropdown.Toggle>
                                                        <Dropdown.Menu>
                                                            <Link
                                                                href={route('admin.roles.edit', role.id)}
                                                                className="dropdown-item"
                                                            >
                                                                <FaEdit className="me-2" /> {t('Edit')}
                                                            </Link>
                                                            {!role.is_system && (
                                                                <Dropdown.Item 
                                                                    onClick={() => handleDelete(role.id)}
                                                                    className={role.users.length > 0 ? 'disabled' : ''}
                                                                >
                                                                    <FaTrash className="me-2" /> {t('Delete')}
                                                                </Dropdown.Item>
                                                            )}
                                                        </Dropdown.Menu>
                                                    </Dropdown>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                    </tbody>
                                </Table>
                            </div>

                            <Pagination links={roles.links} />
                        </Card.Body>
                    </Card>
                </div>
            </div>
        </AdminLayout>
    );
}
