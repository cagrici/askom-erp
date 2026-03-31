import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import Layout from '@/Layouts';
import { Card, Row, Col, Button, Table, Badge, Form, InputGroup, ProgressBar, Dropdown } from 'react-bootstrap';

interface Discount {
    id: number;
    name: string;
    code: string;
    type: string;
    type_label: string;
    calculation_type: string;
    calculation_type_label: string;
    discount_value: number;
    status: string;
    status_label: string;
    is_active: boolean;
    start_date: string | null;
    end_date: string | null;
    days_remaining: number | null;
    usage_count: number;
    usage_limit: number | null;
    usage_percentage: number;
    total_discount_given: number;
    application_count: number;
    priority: number;
    can_combine: boolean;
    auto_apply: boolean;
    created_at: string;
    creator?: {
        name: string;
    };
}

interface Props {
    discounts: {
        data: Discount[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
    stats: {
        total: number;
        active: number;
        total_application: number;
        total_discount_given: number;
    };
    filters: {
        search?: string;
        type?: string;
        status?: string;
        is_active?: string;
    };
    types: Array<{ value: string; label: string }>;
    statuses: Array<{ value: string; label: string }>;
}

export default function Index({ discounts, stats, filters, types, statuses }: Props) {
    const [showFilters, setShowFilters] = useState(false);
    const [searchTerm, setSearchTerm] = useState(filters.search || '');
    const [selectedType, setSelectedType] = useState(filters.type || '');
    const [selectedStatus, setSelectedStatus] = useState(filters.status || '');
    const [selectedActive, setSelectedActive] = useState(filters.is_active || '');

    const handleFilter = () => {
        router.get(route('sales.discounts.index'), {
            search: searchTerm,
            type: selectedType,
            status: selectedStatus,
            is_active: selectedActive,
        });
    };

    const handleClearFilters = () => {
        setSearchTerm('');
        setSelectedType('');
        setSelectedStatus('');
        setSelectedActive('');
        router.get(route('sales.discounts.index'));
    };

    const handleToggleStatus = (id: number) => {
        router.patch(route('sales.discounts.toggle-status', id), {}, {
            preserveScroll: true,
        });
    };

    const handleDuplicate = (id: number) => {
        if (confirm('Bu iskonto kopyalanacak. Devam etmek istiyor musunuz?')) {
            router.post(route('sales.discounts.duplicate', id));
        }
    };

    const handleDelete = (id: number) => {
        if (confirm('Bu iskonto silinecek. Bu işlem geri alınamaz. Devam etmek istiyor musunuz?')) {
            router.delete(route('sales.discounts.destroy', id));
        }
    };

    const getStatusBadge = (status: string) => {
        const badges: { [key: string]: string } = {
            draft: 'secondary',
            active: 'success',
            inactive: 'warning',
            expired: 'danger',
        };
        return badges[status] || 'secondary';
    };

    const getTypeBadge = (type: string) => {
        const badges: { [key: string]: string } = {
            customer: 'primary',
            product: 'info',
            quantity: 'warning',
            cash: 'success',
            general: 'secondary',
            category: 'dark',
        };
        return badges[type] || 'secondary';
    };

    return (
        <Layout>
            <Head title="İskontolar" />

            <div className="page-content">
                <div className="container-fluid">
                    {/* Page Title */}
                    <Row className="mb-3">
                        <Col xs={12}>
                            <div className="page-title-box d-sm-flex align-items-center justify-content-between">
                                <h4 className="mb-sm-0">İskontolar</h4>
                                <div className="page-title-right">
                                    <Link href={route('sales.discounts.create')}>
                                        <Button variant="primary">
                                            <i className="ri-add-line align-bottom me-1"></i>
                                            Yeni İskonto
                                        </Button>
                                    </Link>
                                </div>
                            </div>
                        </Col>
                    </Row>

                    {/* Statistics Cards */}
                    <Row className="mb-3">
                        <Col md={3}>
                            <Card className="card-animate">
                                <Card.Body>
                                    <div className="d-flex align-items-center">
                                        <div className="flex-grow-1">
                                            <p className="text-uppercase fw-medium text-muted mb-0">
                                                Toplam İskonto
                                            </p>
                                        </div>
                                        <div className="flex-shrink-0">
                                            <h5 className="text-muted fs-14 mb-0">
                                                <i className="ri-percent-line fs-22 text-primary"></i>
                                            </h5>
                                        </div>
                                    </div>
                                    <div className="d-flex align-items-end justify-content-between mt-2">
                                        <div>
                                            <h4 className="fs-22 fw-semibold ff-secondary mb-0">
                                                {stats.total}
                                            </h4>
                                        </div>
                                    </div>
                                </Card.Body>
                            </Card>
                        </Col>

                        <Col md={3}>
                            <Card className="card-animate">
                                <Card.Body>
                                    <div className="d-flex align-items-center">
                                        <div className="flex-grow-1">
                                            <p className="text-uppercase fw-medium text-muted mb-0">
                                                Aktif İskonto
                                            </p>
                                        </div>
                                        <div className="flex-shrink-0">
                                            <h5 className="text-muted fs-14 mb-0">
                                                <i className="ri-checkbox-circle-line fs-22 text-success"></i>
                                            </h5>
                                        </div>
                                    </div>
                                    <div className="d-flex align-items-end justify-content-between mt-2">
                                        <div>
                                            <h4 className="fs-22 fw-semibold ff-secondary mb-0">
                                                {stats.active}
                                            </h4>
                                        </div>
                                    </div>
                                </Card.Body>
                            </Card>
                        </Col>

                        <Col md={3}>
                            <Card className="card-animate">
                                <Card.Body>
                                    <div className="d-flex align-items-center">
                                        <div className="flex-grow-1">
                                            <p className="text-uppercase fw-medium text-muted mb-0">
                                                Toplam Uygulama
                                            </p>
                                        </div>
                                        <div className="flex-shrink-0">
                                            <h5 className="text-muted fs-14 mb-0">
                                                <i className="ri-file-list-3-line fs-22 text-info"></i>
                                            </h5>
                                        </div>
                                    </div>
                                    <div className="d-flex align-items-end justify-content-between mt-2">
                                        <div>
                                            <h4 className="fs-22 fw-semibold ff-secondary mb-0">
                                                {stats.total_application.toLocaleString()}
                                            </h4>
                                        </div>
                                    </div>
                                </Card.Body>
                            </Card>
                        </Col>

                        <Col md={3}>
                            <Card className="card-animate">
                                <Card.Body>
                                    <div className="d-flex align-items-center">
                                        <div className="flex-grow-1">
                                            <p className="text-uppercase fw-medium text-muted mb-0">
                                                Verilen Toplam İskonto
                                            </p>
                                        </div>
                                        <div className="flex-shrink-0">
                                            <h5 className="text-muted fs-14 mb-0">
                                                <i className="ri-money-dollar-circle-line fs-22 text-warning"></i>
                                            </h5>
                                        </div>
                                    </div>
                                    <div className="d-flex align-items-end justify-content-between mt-2">
                                        <div>
                                            <h4 className="fs-22 fw-semibold ff-secondary mb-0">
                                                ₺{stats.total_discount_given.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                                            </h4>
                                        </div>
                                    </div>
                                </Card.Body>
                            </Card>
                        </Col>
                    </Row>

                    {/* Filters and Table */}
                    <Row>
                        <Col xs={12}>
                            <Card>
                                <Card.Header>
                                    <div className="d-flex align-items-center justify-content-between">
                                        <h5 className="card-title mb-0">İskonto Listesi</h5>
                                        <Button
                                            variant="light"
                                            size="sm"
                                            onClick={() => setShowFilters(!showFilters)}
                                        >
                                            <i className="ri-filter-3-line align-bottom me-1"></i>
                                            Filtrele
                                        </Button>
                                    </div>

                                    {showFilters && (
                                        <div className="mt-3">
                                            <Row className="g-3">
                                                <Col md={3}>
                                                    <InputGroup>
                                                        <Form.Control
                                                            type="text"
                                                            placeholder="Ara..."
                                                            value={searchTerm}
                                                            onChange={(e) => setSearchTerm(e.target.value)}
                                                            onKeyPress={(e) => {
                                                                if (e.key === 'Enter') handleFilter();
                                                            }}
                                                        />
                                                    </InputGroup>
                                                </Col>

                                                <Col md={2}>
                                                    <Form.Select
                                                        value={selectedType}
                                                        onChange={(e) => setSelectedType(e.target.value)}
                                                    >
                                                        <option value="">Tüm Tipler</option>
                                                        {types.map((type) => (
                                                            <option key={type.value} value={type.value}>
                                                                {type.label}
                                                            </option>
                                                        ))}
                                                    </Form.Select>
                                                </Col>

                                                <Col md={2}>
                                                    <Form.Select
                                                        value={selectedStatus}
                                                        onChange={(e) => setSelectedStatus(e.target.value)}
                                                    >
                                                        <option value="">Tüm Durumlar</option>
                                                        {statuses.map((status) => (
                                                            <option key={status.value} value={status.value}>
                                                                {status.label}
                                                            </option>
                                                        ))}
                                                    </Form.Select>
                                                </Col>

                                                <Col md={2}>
                                                    <Form.Select
                                                        value={selectedActive}
                                                        onChange={(e) => setSelectedActive(e.target.value)}
                                                    >
                                                        <option value="">Tümü</option>
                                                        <option value="1">Aktif</option>
                                                        <option value="0">Pasif</option>
                                                    </Form.Select>
                                                </Col>

                                                <Col md={3}>
                                                    <div className="d-flex gap-2">
                                                        <Button onClick={handleFilter} className="w-100">
                                                            Uygula
                                                        </Button>
                                                        <Button
                                                            variant="secondary"
                                                            onClick={handleClearFilters}
                                                            className="w-100"
                                                        >
                                                            Temizle
                                                        </Button>
                                                    </div>
                                                </Col>
                                            </Row>
                                        </div>
                                    )}
                                </Card.Header>

                                <Card.Body>
                                    <div className="table-responsive">
                                        <Table className="table-hover mb-0">
                                            <thead className="table-light">
                                                <tr>
                                                    <th>Kod</th>
                                                    <th>İsim</th>
                                                    <th>Tip</th>
                                                    <th>Hesaplama</th>
                                                    <th>Değer</th>
                                                    <th>Durum</th>
                                                    <th>Kullanım</th>
                                                    <th>Öncelik</th>
                                                    <th>İşlemler</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {discounts.data.length > 0 ? (
                                                    discounts.data.map((discount) => (
                                                        <tr key={discount.id}>
                                                            <td>
                                                                <Link
                                                                    href={route('sales.discounts.show', discount.id)}
                                                                    className="fw-medium link-primary"
                                                                >
                                                                    {discount.code}
                                                                </Link>
                                                            </td>
                                                            <td>
                                                                <div>
                                                                    <div className="fw-medium">{discount.name}</div>
                                                                    {discount.days_remaining !== null && discount.days_remaining >= 0 && (
                                                                        <small className="text-muted">
                                                                            {discount.days_remaining} gün kaldı
                                                                        </small>
                                                                    )}
                                                                </div>
                                                            </td>
                                                            <td>
                                                                <Badge bg={getTypeBadge(discount.type)}>
                                                                    {discount.type_label}
                                                                </Badge>
                                                            </td>
                                                            <td>{discount.calculation_type_label}</td>
                                                            <td className="fw-medium">
                                                                {discount.calculation_type === 'percentage'
                                                                    ? `%${discount.discount_value}`
                                                                    : `₺${discount.discount_value.toLocaleString('tr-TR')}`}
                                                            </td>
                                                            <td>
                                                                <Badge bg={getStatusBadge(discount.status)}>
                                                                    {discount.status_label}
                                                                </Badge>
                                                                {discount.is_active && (
                                                                    <Badge bg="success" className="ms-1">
                                                                        <i className="ri-checkbox-circle-line"></i>
                                                                    </Badge>
                                                                )}
                                                            </td>
                                                            <td>
                                                                <div>
                                                                    <small className="text-muted">
                                                                        {discount.usage_count} / {discount.usage_limit || '∞'}
                                                                    </small>
                                                                    {discount.usage_limit && (
                                                                        <ProgressBar
                                                                            now={discount.usage_percentage}
                                                                            style={{ height: '4px' }}
                                                                            variant={
                                                                                discount.usage_percentage >= 90
                                                                                    ? 'danger'
                                                                                    : discount.usage_percentage >= 70
                                                                                        ? 'warning'
                                                                                        : 'success'
                                                                            }
                                                                        />
                                                                    )}
                                                                </div>
                                                            </td>
                                                            <td>
                                                                <Badge bg="dark">{discount.priority}</Badge>
                                                                {discount.can_combine && (
                                                                    <i className="ri-stack-line ms-2 text-info" title="Kombine Edilebilir"></i>
                                                                )}
                                                                {discount.auto_apply && (
                                                                    <i className="ri-flashlight-line ms-1 text-warning" title="Otomatik Uygula"></i>
                                                                )}
                                                            </td>
                                                            <td>
                                                                <Dropdown>
                                                                    <Dropdown.Toggle
                                                                        variant="light"
                                                                        size="sm"
                                                                        className="btn-icon"
                                                                    >
                                                                        <i className="ri-more-2-fill"></i>
                                                                    </Dropdown.Toggle>

                                                                    <Dropdown.Menu>
                                                                        <Dropdown.Item
                                                                            as={Link}
                                                                            href={route('sales.discounts.show', discount.id)}
                                                                        >
                                                                            <i className="ri-eye-line align-bottom me-2 text-muted"></i>
                                                                            Görüntüle
                                                                        </Dropdown.Item>
                                                                        <Dropdown.Item
                                                                            as={Link}
                                                                            href={route('sales.discounts.edit', discount.id)}
                                                                        >
                                                                            <i className="ri-pencil-line align-bottom me-2 text-muted"></i>
                                                                            Düzenle
                                                                        </Dropdown.Item>
                                                                        <Dropdown.Item
                                                                            onClick={() => handleToggleStatus(discount.id)}
                                                                        >
                                                                            <i className="ri-toggle-line align-bottom me-2 text-muted"></i>
                                                                            {discount.is_active ? 'Pasifleştir' : 'Aktifleştir'}
                                                                        </Dropdown.Item>
                                                                        <Dropdown.Item
                                                                            onClick={() => handleDuplicate(discount.id)}
                                                                        >
                                                                            <i className="ri-file-copy-line align-bottom me-2 text-muted"></i>
                                                                            Kopyala
                                                                        </Dropdown.Item>
                                                                        <Dropdown.Divider />
                                                                        <Dropdown.Item
                                                                            onClick={() => handleDelete(discount.id)}
                                                                            className="text-danger"
                                                                        >
                                                                            <i className="ri-delete-bin-line align-bottom me-2"></i>
                                                                            Sil
                                                                        </Dropdown.Item>
                                                                    </Dropdown.Menu>
                                                                </Dropdown>
                                                            </td>
                                                        </tr>
                                                    ))
                                                ) : (
                                                    <tr>
                                                        <td colSpan={9} className="text-center py-4">
                                                            <div className="text-muted">
                                                                <i className="ri-search-line fs-24 mb-2"></i>
                                                                <p>Henüz iskonto bulunmamaktadır.</p>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </Table>
                                    </div>

                                    {/* Pagination */}
                                    {discounts.last_page > 1 && (
                                        <div className="d-flex justify-content-between align-items-center mt-3">
                                            <div className="text-muted">
                                                Toplam {discounts.total} kayıttan {discounts.data.length} tanesi gösteriliyor
                                            </div>
                                            <nav>
                                                <ul className="pagination mb-0">
                                                    {Array.from({ length: discounts.last_page }, (_, i) => i + 1).map(
                                                        (page) => (
                                                            <li
                                                                key={page}
                                                                className={`page-item ${discounts.current_page === page ? 'active' : ''
                                                                    }`}
                                                            >
                                                                <Link
                                                                    href={route('sales.discounts.index', {
                                                                        page,
                                                                        search: searchTerm,
                                                                        type: selectedType,
                                                                        status: selectedStatus,
                                                                        is_active: selectedActive,
                                                                    })}
                                                                    className="page-link"
                                                                >
                                                                    {page}
                                                                </Link>
                                                            </li>
                                                        )
                                                    )}
                                                </ul>
                                            </nav>
                                        </div>
                                    )}
                                </Card.Body>
                            </Card>
                        </Col>
                    </Row>
                </div>
            </div>
        </Layout>
    );
}
