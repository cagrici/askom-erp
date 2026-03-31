import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { Button, Card, Table, Form, Row, Col, Badge, Dropdown } from 'react-bootstrap';
import { FaEdit, FaTrash, FaPlus, FaFilter, FaEllipsisV, FaUserTag } from 'react-icons/fa';
import AdminLayout from '../../../Layouts/AdminLayout';
import Pagination from '../../../Components/Common/Pagination';
import { useTranslation } from 'react-i18next';

interface PermissionProps {
    id: number;
    name: string;
    slug: string;
    description: string;
    module: string;
    roles: Array<{
        id: number;
        name: string;
    }>;
}

interface IndexProps {
    permissions: {
        data: PermissionProps[];
        links: any;
        total: number;
    };
    modules: string[];
    filters: {
        search?: string;
        module?: string;
    };
}

export default function Index({ permissions, modules, filters }: IndexProps) {
    const { t } = useTranslation();
    const [searchTerm, setSearchTerm] = useState(filters.search || '');
    const [selectedModule, setSelectedModule] = useState(filters.module || '');
    const [showFilters, setShowFilters] = useState(false);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();

        router.get(
            route('admin.permissions.index'),
            {
                search: searchTerm,
                module: selectedModule
            },
            { preserveState: true }
        );
    };

    const handleReset = () => {
        setSearchTerm('');
        setSelectedModule('');

        router.get(
            route('admin.permissions.index'),
            {},
            { preserveState: true }
        );
    };

    const handleDelete = (id: number) => {
        if (confirm(t('Are you sure you want to delete this permission?'))) {
            router.delete(route('admin.permissions.destroy', id));
        }
    };

    return (
        <AdminLayout>
            <Head title={t('Permission Management')} />
            <div className="page-content">
                <div className="container-fluid px-4">
                    <div className="d-flex justify-content-between align-items-center mb-4">
                        <h1 className="h3 mb-0 text-gray-800">{t('Permission Management')}</h1>
                        <Link href={route('admin.permissions.create')} className="btn btn-primary">
                            <FaPlus className="me-2" /> {t('Add Permission')}
                        </Link>
                    </div>

                    <Card className="mb-4 shadow-sm">
                        <Card.Header className="bg-light d-flex justify-content-between align-items-center">
                            <div>{t('Permissions')}</div>
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
                                        <Col md={6}>
                                            <Form.Group>
                                                <Form.Label>{t('Search')}</Form.Label>
                                                <Form.Control
                                                    type="text"
                                                    placeholder={t('Permission Name or Description')}
                                                    value={searchTerm}
                                                    onChange={(e) => setSearchTerm(e.target.value)}
                                                />
                                            </Form.Group>
                                        </Col>
                                        <Col md={6}>
                                            <Form.Group>
                                                <Form.Label>{t('Module')}</Form.Label>
                                                <Form.Select
                                                    value={selectedModule}
                                                    onChange={(e) => setSelectedModule(e.target.value)}
                                                >
                                                    <option value="">{t('All Modules')}</option>
                                                    {modules.map((module, index) => (
                                                        <option key={index} value={module}>
                                                            {module}
                                                        </option>
                                                    ))}
                                                </Form.Select>
                                            </Form.Group>
                                        </Col>
                                        <Col md={12} className="d-flex justify-content-end">
                                            <Button type="button" variant="outline-secondary" onClick={handleReset} className="me-2">
                                                {t('Reset')}
                                            </Button>
                                            <Button type="submit" variant="primary">
                                                {t('Filter')}
                                            </Button>
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
                                        <th>{t('Module')}</th>
                                        <th>{t('Description')}</th>
                                        <th>{t('Assigned Roles')}</th>
                                        <th>{t('Actions')}</th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {permissions.data.length === 0 ? (
                                        <tr>
                                            <td colSpan={7} className="text-center py-4">
                                                {t('No permissions found')}
                                            </td>
                                        </tr>
                                    ) : (
                                        permissions.data.map((permission) => (
                                            <tr key={permission.id}>
                                                <td>{permission.id}</td>
                                                <td>{permission.name}</td>
                                                <td>{permission.slug}</td>
                                                <td>
                                                    <Badge bg="info">
                                                        {permission.module || t('General')}
                                                    </Badge>
                                                </td>
                                                <td>{permission.description}</td>
                                                <td>
                                                    {permission.roles.map(role => (
                                                        <Badge
                                                            key={role.id}
                                                            bg="primary"
                                                            className="me-1 mb-1"
                                                        >
                                                            {role.name}
                                                        </Badge>
                                                    ))}
                                                </td>
                                                <td>
                                                    <Dropdown align="end">
                                                        <Dropdown.Toggle variant="light" size="sm" id={`permission-dropdown-${permission.id}`}>
                                                            <FaEllipsisV />
                                                        </Dropdown.Toggle>
                                                        <Dropdown.Menu>
                                                            <Link
                                                                href={route('admin.permissions.edit', permission.id)}
                                                                className="dropdown-item"
                                                            >
                                                                <FaEdit className="me-2" /> {t('Edit')}
                                                            </Link>
                                                            <Dropdown.Item onClick={() => handleDelete(permission.id)}>
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

                            <Pagination links={permissions.links} />
                        </Card.Body>
                    </Card>
                </div>
            </div>
        </AdminLayout>
    );
}
