import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { Card, Table, Button, Row, Col, Form, Badge, Modal, InputGroup } from 'react-bootstrap';
import Layout from '@/Layouts';

interface Driver {
    id: number;
    name: string;
    phone?: string;
    mobile_phone?: string;
    license_number?: string;
    license_type?: string;
    license_expiry_date?: string;
    is_active_driver: boolean;
    driver_notes?: string;
}

interface PaginatedDrivers {
    data: Driver[];
    current_page: number;
    per_page: number;
    total: number;
    last_page: number;
    links: Array<{
        url?: string;
        label: string;
        active: boolean;
    }>;
}

interface Stats {
    total: number;
    active: number;
    inactive: number;
    license_expiring: number;
}

interface Props {
    drivers: PaginatedDrivers;
    stats: Stats;
    filters: {
        search?: string;
        status?: string;
    };
}

export default function Index({ drivers, stats, filters }: Props) {
    const [search, setSearch] = useState(filters.search || '');
    const [status, setStatus] = useState(filters.status || '');
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);

    const handleSearch = () => {
        router.get(route('warehouse.drivers.index'), {
            search: search || undefined,
            status: status || undefined,
        }, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    };

    const clearFilters = () => {
        setSearch('');
        setStatus('');
        router.get(route('warehouse.drivers.index'));
    };

    const handleToggleActive = (driver: Driver) => {
        router.post(route('warehouse.drivers.toggle-active', driver.id), {}, {
            preserveScroll: true,
        });
    };

    const handleDelete = (driver: Driver) => {
        setSelectedDriver(driver);
        setShowDeleteModal(true);
    };

    const confirmDelete = () => {
        if (selectedDriver) {
            router.delete(route('warehouse.drivers.destroy', selectedDriver.id));
        }
        setShowDeleteModal(false);
        setSelectedDriver(null);
    };

    const formatDate = (dateString?: string) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString('tr-TR');
    };

    const isLicenseExpiringSoon = (expiryDate?: string) => {
        if (!expiryDate) return false;
        const expiry = new Date(expiryDate);
        const thirtyDaysFromNow = new Date();
        thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
        return expiry <= thirtyDaysFromNow;
    };

    return (
        <Layout>
            <Head title="Şoförler" />
            <div className="page-content">
            <div className="container-fluid py-4">
                {/* Header */}
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <div>
                        <h4 className="mb-1">Şoförler</h4>
                        <p className="text-muted mb-0">Şoför yonetimi</p>
                    </div>
                    <Link
                        href={route('warehouse.drivers.create')}
                        className="btn btn-primary"
                    >
                        <i className="ri-add-line me-1"></i>
                        Yeni Sofor
                    </Link>
                </div>

                {/* Stats Cards */}
                <Row className="mb-4">
                    <Col md={3}>
                        <Card className="border-0 shadow-sm">
                            <Card.Body className="text-center">
                                <div className="text-primary fs-1 mb-2">
                                    <i className="ri-user-line"></i>
                                </div>
                                <h3 className="mb-1">{stats.total}</h3>
                                <p className="text-muted mb-0">Toplam Sofor</p>
                            </Card.Body>
                        </Card>
                    </Col>
                    <Col md={3}>
                        <Card className="border-0 shadow-sm bg-success bg-opacity-10">
                            <Card.Body className="text-center">
                                <div className="text-success fs-1 mb-2">
                                    <i className="ri-checkbox-circle-line"></i>
                                </div>
                                <h3 className="mb-1">{stats.active}</h3>
                                <p className="text-muted mb-0">Aktif</p>
                            </Card.Body>
                        </Card>
                    </Col>
                    <Col md={3}>
                        <Card className="border-0 shadow-sm bg-secondary bg-opacity-10">
                            <Card.Body className="text-center">
                                <div className="text-secondary fs-1 mb-2">
                                    <i className="ri-close-circle-line"></i>
                                </div>
                                <h3 className="mb-1">{stats.inactive}</h3>
                                <p className="text-muted mb-0">Pasif</p>
                            </Card.Body>
                        </Card>
                    </Col>
                    <Col md={3}>
                        <Card className="border-0 shadow-sm bg-warning bg-opacity-10">
                            <Card.Body className="text-center">
                                <div className="text-warning fs-1 mb-2">
                                    <i className="ri-error-warning-line"></i>
                                </div>
                                <h3 className="mb-1">{stats.license_expiring}</h3>
                                <p className="text-muted mb-0">Ehliyet Bitecek</p>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>

                {/* Filters */}
                <Card className="border-0 shadow-sm mb-4">
                    <Card.Body>
                        <Row className="align-items-end">
                            <Col md={5}>
                                <Form.Label>Ara</Form.Label>
                                <InputGroup>
                                    <Form.Control
                                        type="text"
                                        placeholder="Ad, telefon veya ehliyet no..."
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        onKeyPress={handleKeyPress}
                                    />
                                    <Button variant="primary" onClick={handleSearch}>
                                        <i className="ri-search-line"></i>
                                    </Button>
                                </InputGroup>
                            </Col>
                            <Col md={3}>
                                <Form.Label>Durum</Form.Label>
                                <Form.Select
                                    value={status}
                                    onChange={(e) => {
                                        setStatus(e.target.value);
                                        router.get(route('warehouse.drivers.index'), {
                                            search: search || undefined,
                                            status: e.target.value || undefined,
                                        }, { preserveState: true, preserveScroll: true });
                                    }}
                                >
                                    <option value="">Tumu</option>
                                    <option value="active">Aktif</option>
                                    <option value="inactive">Pasif</option>
                                </Form.Select>
                            </Col>
                            <Col md={2}>
                                <Button
                                    variant="outline-secondary"
                                    onClick={clearFilters}
                                    className="w-100"
                                >
                                    <i className="ri-refresh-line me-1"></i>
                                    Temizle
                                </Button>
                            </Col>
                        </Row>
                    </Card.Body>
                </Card>

                {/* Drivers Table */}
                <Card className="border-0 shadow-sm">
                    <Card.Body className="p-0">
                        <Table responsive hover className="mb-0">
                            <thead className="bg-light">
                                <tr>
                                    <th>Ad Soyad</th>
                                    <th>Telefon</th>
                                    <th>Ehliyet No</th>
                                    <th>Ehliyet Sinifi</th>
                                    <th>Ehliyet Bitis</th>
                                    <th>Durum</th>
                                    <th className="text-end">Islemler</th>
                                </tr>
                            </thead>
                            <tbody>
                                {drivers.data.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="text-center py-5">
                                            <div className="text-muted">
                                                <i className="ri-user-line fs-1 d-block mb-2"></i>
                                                Sofor bulunamadi
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    drivers.data.map((driver) => (
                                        <tr key={driver.id}>
                                            <td>
                                                <div className="d-flex align-items-center">
                                                    <div className="avatar-sm bg-primary bg-opacity-10 rounded-circle me-2 d-flex align-items-center justify-content-center">
                                                        <i className="ri-user-line text-primary"></i>
                                                    </div>
                                                    <div>
                                                        <div className="fw-bold">{driver.name}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>{driver.phone || driver.mobile_phone || '-'}</td>
                                            <td>{driver.license_number || '-'}</td>
                                            <td>{driver.license_type || '-'}</td>
                                            <td>
                                                {driver.license_expiry_date ? (
                                                    <span className={isLicenseExpiringSoon(driver.license_expiry_date) ? 'text-danger fw-bold' : ''}>
                                                        {formatDate(driver.license_expiry_date)}
                                                        {isLicenseExpiringSoon(driver.license_expiry_date) && (
                                                            <i className="ri-error-warning-line ms-1"></i>
                                                        )}
                                                    </span>
                                                ) : '-'}
                                            </td>
                                            <td>
                                                <Badge bg={driver.is_active_driver ? 'success' : 'secondary'}>
                                                    {driver.is_active_driver ? 'Aktif' : 'Pasif'}
                                                </Badge>
                                            </td>
                                            <td className="text-end">
                                                <div className="btn-group">
                                                    <Link
                                                        href={route('warehouse.drivers.edit', driver.id)}
                                                        className="btn btn-sm btn-outline-primary"
                                                    >
                                                        <i className="ri-pencil-line"></i>
                                                    </Link>
                                                    <Button
                                                        variant={driver.is_active_driver ? 'outline-warning' : 'outline-success'}
                                                        size="sm"
                                                        onClick={() => handleToggleActive(driver)}
                                                        title={driver.is_active_driver ? 'Pasif Yap' : 'Aktif Yap'}
                                                    >
                                                        <i className={driver.is_active_driver ? 'ri-pause-line' : 'ri-play-line'}></i>
                                                    </Button>
                                                    <Button
                                                        variant="outline-danger"
                                                        size="sm"
                                                        onClick={() => handleDelete(driver)}
                                                    >
                                                        <i className="ri-delete-bin-line"></i>
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </Table>
                    </Card.Body>

                    {/* Pagination */}
                    {drivers.last_page > 1 && (
                        <Card.Footer className="bg-white">
                            <nav className="d-flex justify-content-between align-items-center">
                                <small className="text-muted">
                                    Toplam {drivers.total} kayit
                                </small>
                                <ul className="pagination pagination-sm mb-0">
                                    {drivers.links.map((link, index) => (
                                        <li
                                            key={index}
                                            className={`page-item ${link.active ? 'active' : ''} ${!link.url ? 'disabled' : ''}`}
                                        >
                                            {link.url ? (
                                                <Link
                                                    href={link.url}
                                                    className="page-link"
                                                    dangerouslySetInnerHTML={{ __html: link.label }}
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
                        </Card.Footer>
                    )}
                </Card>
            </div>
</div>
            {/* Delete Confirmation Modal */}
            <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>Sofor Sil</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <p>
                        <strong>{selectedDriver?.name}</strong> isimli soforu silmek istediginizden emin misiniz?
                    </p>
                    <p className="text-muted small mb-0">
                        Bu islem geri alinamaz. Sofor kaydi sistemden kaldirilacaktir.
                    </p>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
                        Iptal
                    </Button>
                    <Button variant="danger" onClick={confirmDelete}>
                        Sil
                    </Button>
                </Modal.Footer>
            </Modal>
        </Layout>
    );
}
