import React from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { Button, Card, Table, Badge, Form, Row, Col, InputGroup } from 'react-bootstrap';
import { FaPlus, FaEdit, FaTrash, FaSearch, FaUser, FaUsers } from 'react-icons/fa';
import AdminLayout from '../../../Layouts/AdminLayout';
import { useTranslation } from 'react-i18next';

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
    user?: {
        id: number;
        name: string;
        email: string;
    };
    role?: {
        id: number;
        name: string;
    };
}

interface PageProps {
    redirects: {
        data: LoginRedirectProps[];
        links: any[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
    filters: {
        type?: string;
        is_active?: string;
        search?: string;
    };
}

export default function Index({ redirects, filters }: PageProps) {
    const { t } = useTranslation();

    const [filterData, setFilterData] = React.useState({
        type: filters.type || '',
        is_active: filters.is_active || '',
        search: filters.search || '',
    });

    const handleFilter = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(route('admin.login-redirects.index'), filterData, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleDelete = (id: number) => {
        if (confirm(t('Are you sure you want to delete this redirect?'))) {
            router.delete(route('admin.login-redirects.destroy', id));
        }
    };

    const handleToggleActive = (id: number) => {
        router.post(route('admin.login-redirects.toggle-active', id));
    };

    const clearFilters = () => {
        setFilterData({
            type: '',
            is_active: '',
            search: '',
        });
        router.get(route('admin.login-redirects.index'));
    };

    return (
        <AdminLayout>
            <Head title={t('Login Redirects')} />
            <div className="page-content">
                <div className="container-fluid px-4">
                    <div className="d-flex justify-content-between align-items-center mb-4">
                        <h1 className="h3 mb-0 text-gray-800">{t('Login Redirect Settings')}</h1>
                        <Link href={route('admin.login-redirects.create')} className="btn btn-primary">
                            <FaPlus className="me-2" /> {t('Add New Redirect')}
                        </Link>
                    </div>

                    {/* Filters */}
                    <Card className="mb-4 shadow-sm">
                        <Card.Body>
                            <Form onSubmit={handleFilter}>
                                <Row>
                                    <Col md={3}>
                                        <Form.Group>
                                            <Form.Label>{t('Type')}</Form.Label>
                                            <Form.Select
                                                value={filterData.type}
                                                onChange={e => setFilterData({ ...filterData, type: e.target.value })}
                                            >
                                                <option value="">{t('All Types')}</option>
                                                <option value="user">{t('User')}</option>
                                                <option value="role">{t('Role')}</option>
                                            </Form.Select>
                                        </Form.Group>
                                    </Col>
                                    <Col md={3}>
                                        <Form.Group>
                                            <Form.Label>{t('Status')}</Form.Label>
                                            <Form.Select
                                                value={filterData.is_active}
                                                onChange={e => setFilterData({ ...filterData, is_active: e.target.value })}
                                            >
                                                <option value="">{t('All Status')}</option>
                                                <option value="1">{t('Active')}</option>
                                                <option value="0">{t('Inactive')}</option>
                                            </Form.Select>
                                        </Form.Group>
                                    </Col>
                                    <Col md={4}>
                                        <Form.Group>
                                            <Form.Label>{t('Search')}</Form.Label>
                                            <InputGroup>
                                                <Form.Control
                                                    type="text"
                                                    placeholder={t('Search by name, URL, user or role...')}
                                                    value={filterData.search}
                                                    onChange={e => setFilterData({ ...filterData, search: e.target.value })}
                                                />
                                                <Button variant="outline-secondary">
                                                    <FaSearch />
                                                </Button>
                                            </InputGroup>
                                        </Form.Group>
                                    </Col>
                                    <Col md={2} className="d-flex align-items-end">
                                        <div className="d-flex gap-2 w-100">
                                            <Button type="submit" variant="primary" className="flex-fill">
                                                {t('Filter')}
                                            </Button>
                                            <Button variant="secondary" onClick={clearFilters}>
                                                {t('Clear')}
                                            </Button>
                                        </div>
                                    </Col>
                                </Row>
                            </Form>
                        </Card.Body>
                    </Card>

                    {/* Table */}
                    <Card className="shadow-sm">
                        <Card.Body>
                            <div className="table-responsive">
                                <Table striped bordered hover>
                                    <thead>
                                        <tr>
                                            <th>{t('Type')}</th>
                                            <th>{t('Target')}</th>
                                            <th>{t('Redirect To')}</th>
                                            <th>{t('Priority')}</th>
                                            <th>{t('Status')}</th>
                                            <th>{t('Actions')}</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {redirects.data.length > 0 ? (
                                            redirects.data.map((redirect) => (
                                                <tr key={redirect.id}>
                                                    <td>
                                                        <Badge bg={redirect.type === 'user' ? 'info' : 'primary'}>
                                                            {redirect.type === 'user' ? <FaUser className="me-1" /> : <FaUsers className="me-1" />}
                                                            {t(redirect.type === 'user' ? 'User' : 'Role')}
                                                        </Badge>
                                                    </td>
                                                    <td>
                                                        {redirect.type === 'user' && redirect.user ? (
                                                            <>
                                                                <strong>{redirect.user.name}</strong>
                                                                <br />
                                                                <small className="text-muted">{redirect.user.email}</small>
                                                            </>
                                                        ) : redirect.type === 'role' && redirect.role ? (
                                                            <strong>{redirect.role.name}</strong>
                                                        ) : (
                                                            <span className="text-muted">-</span>
                                                        )}
                                                    </td>
                                                    <td>
                                                        <code>{redirect.redirect_to}</code>
                                                        {redirect.name && (
                                                            <>
                                                                <br />
                                                                <small className="text-muted">{redirect.name}</small>
                                                            </>
                                                        )}
                                                    </td>
                                                    <td className="text-center">
                                                        <Badge bg="secondary">{redirect.priority}</Badge>
                                                    </td>
                                                    <td>
                                                        <Form.Check
                                                            type="switch"
                                                            checked={redirect.is_active}
                                                            onChange={() => handleToggleActive(redirect.id)}
                                                            label={redirect.is_active ? t('Active') : t('Inactive')}
                                                        />
                                                    </td>
                                                    <td>
                                                        <div className="d-flex gap-2">
                                                            <Link
                                                                href={route('admin.login-redirects.edit', redirect.id)}
                                                                className="btn btn-sm btn-warning"
                                                            >
                                                                <FaEdit />
                                                            </Link>
                                                            <Button
                                                                variant="danger"
                                                                size="sm"
                                                                onClick={() => handleDelete(redirect.id)}
                                                            >
                                                                <FaTrash />
                                                            </Button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan={6} className="text-center py-4">
                                                    <p className="text-muted mb-0">{t('No redirects found')}</p>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </Table>
                            </div>

                            {/* Pagination */}
                            {redirects.last_page > 1 && (
                                <div className="d-flex justify-content-center mt-4">
                                    <nav>
                                        <ul className="pagination">
                                            {redirects.links.map((link, index) => (
                                                <li
                                                    key={index}
                                                    className={`page-item ${link.active ? 'active' : ''} ${!link.url ? 'disabled' : ''}`}
                                                >
                                                    {link.url ? (
                                                        <Link
                                                            href={link.url}
                                                            className="page-link"
                                                            dangerouslySetInnerHTML={{ __html: link.label }}
                                                            preserveState
                                                            preserveScroll
                                                        />
                                                    ) : (
                                                        <span
                                                            className="page-link"
                                                            dangerouslySetInnerHTML={{ __html: link.label }}
                                                        />
                                                    )}
                                                </li>
                                            ))}
                                        </ul>
                                    </nav>
                                </div>
                            )}
                        </Card.Body>
                    </Card>
                </div>
            </div>
        </AdminLayout>
    );
}