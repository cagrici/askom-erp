import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import Layout from '@/Layouts';
import { Card, Row, Col, Button, Table, Badge, Form, ProgressBar, Dropdown } from 'react-bootstrap';

interface SalesTarget {
    id: number;
    name: string;
    code: string;
    period_type: string;
    period_type_label: string;
    assignment_type: string;
    assignment_type_label: string;
    year: number;
    month: number | null;
    quarter: number | null;
    start_date: string;
    end_date: string;
    revenue_target: number;
    actual_revenue: number;
    revenue_achievement: number;
    overall_achievement: number;
    status: string;
    status_label: string;
    is_active: boolean;
    days_remaining: number;
    progress_percentage: number;
    user?: { name: string };
    department?: { name: string };
    location?: { name: string };
}

interface Props {
    targets: {
        data: SalesTarget[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
    stats: {
        total: number;
        active: number;
        completed: number;
        avg_achievement: number;
    };
    filters: {
        search?: string;
        period_type?: string;
        assignment_type?: string;
        status?: string;
        year?: number;
        user_id?: number;
    };
    periodTypes: Array<{ value: string; label: string }>;
    assignmentTypes: Array<{ value: string; label: string }>;
    statuses: Array<{ value: string; label: string }>;
    years: number[];
}

export default function Index({
    targets,
    stats,
    filters,
    periodTypes,
    assignmentTypes,
    statuses,
    years,
}: Props) {
    const [showFilters, setShowFilters] = useState(false);
    const [searchTerm, setSearchTerm] = useState(filters.search || '');
    const [selectedPeriodType, setSelectedPeriodType] = useState(filters.period_type || '');
    const [selectedAssignmentType, setSelectedAssignmentType] = useState(filters.assignment_type || '');
    const [selectedStatus, setSelectedStatus] = useState(filters.status || '');
    const [selectedYear, setSelectedYear] = useState(filters.year?.toString() || '');

    const handleFilter = () => {
        router.get(route('sales.targets.index'), {
            search: searchTerm,
            period_type: selectedPeriodType,
            assignment_type: selectedAssignmentType,
            status: selectedStatus,
            year: selectedYear,
        });
    };

    const handleClearFilters = () => {
        setSearchTerm('');
        setSelectedPeriodType('');
        setSelectedAssignmentType('');
        setSelectedStatus('');
        setSelectedYear('');
        router.get(route('sales.targets.index'));
    };

    const handleToggleStatus = (id: number) => {
        router.patch(route('sales.targets.toggle-status', id), {}, {
            preserveScroll: true,
        });
    };

    const handleRecalculate = (id: number) => {
        if (confirm('Hedef değerleri yeniden hesaplanacak. Devam etmek istiyor musunuz?')) {
            router.post(route('sales.targets.recalculate', id));
        }
    };

    const handleDelete = (id: number) => {
        if (confirm('Bu hedef silinecek. Bu işlem geri alınamaz. Devam etmek istiyor musunuz?')) {
            router.delete(route('sales.targets.destroy', id));
        }
    };

    const getStatusBadge = (status: string) => {
        const badges: { [key: string]: string } = {
            active: 'success',
            completed: 'primary',
            cancelled: 'danger',
        };
        return badges[status] || 'secondary';
    };

    const getAchievementColor = (achievement: number) => {
        if (achievement >= 100) return 'success';
        if (achievement >= 75) return 'info';
        if (achievement >= 50) return 'warning';
        return 'danger';
    };

    return (
        <Layout>
            <Head title="Satış Hedefleri" />

            <div className="page-content">
                <div className="container-fluid">
                    {/* Page Title */}
                    <Row className="mb-3">
                        <Col xs={12}>
                            <div className="page-title-box d-sm-flex align-items-center justify-content-between">
                                <h4 className="mb-sm-0">Satış Hedefleri</h4>
                                <div className="page-title-right">
                                    <Link href={route('sales.targets.create')}>
                                        <Button variant="primary">
                                            <i className="ri-add-line align-bottom me-1"></i>
                                            Yeni Hedef
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
                                            <p className="text-uppercase fw-medium text-muted mb-0">Toplam Hedef</p>
                                        </div>
                                        <div className="flex-shrink-0">
                                            <h5 className="text-muted fs-14 mb-0">
                                                <i className="ri-target-line fs-22 text-primary"></i>
                                            </h5>
                                        </div>
                                    </div>
                                    <div className="d-flex align-items-end justify-content-between mt-2">
                                        <div>
                                            <h4 className="fs-22 fw-semibold ff-secondary mb-0">{stats.total}</h4>
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
                                            <p className="text-uppercase fw-medium text-muted mb-0">Aktif Hedef</p>
                                        </div>
                                        <div className="flex-shrink-0">
                                            <h5 className="text-muted fs-14 mb-0">
                                                <i className="ri-play-circle-line fs-22 text-success"></i>
                                            </h5>
                                        </div>
                                    </div>
                                    <div className="d-flex align-items-end justify-content-between mt-2">
                                        <div>
                                            <h4 className="fs-22 fw-semibold ff-secondary mb-0">{stats.active}</h4>
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
                                            <p className="text-uppercase fw-medium text-muted mb-0">Tamamlanan</p>
                                        </div>
                                        <div className="flex-shrink-0">
                                            <h5 className="text-muted fs-14 mb-0">
                                                <i className="ri-checkbox-circle-line fs-22 text-info"></i>
                                            </h5>
                                        </div>
                                    </div>
                                    <div className="d-flex align-items-end justify-content-between mt-2">
                                        <div>
                                            <h4 className="fs-22 fw-semibold ff-secondary mb-0">{stats.completed}</h4>
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
                                                Ort. Başarı Oranı
                                            </p>
                                        </div>
                                        <div className="flex-shrink-0">
                                            <h5 className="text-muted fs-14 mb-0">
                                                <i className="ri-percent-line fs-22 text-warning"></i>
                                            </h5>
                                        </div>
                                    </div>
                                    <div className="d-flex align-items-end justify-content-between mt-2">
                                        <div>
                                            <h4 className="fs-22 fw-semibold ff-secondary mb-0">
                                                %{stats.avg_achievement.toFixed(1)}
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
                                        <h5 className="card-title mb-0">Hedef Listesi</h5>
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
                                                <Col md={2}>
                                                    <Form.Control
                                                        type="text"
                                                        placeholder="Ara..."
                                                        value={searchTerm}
                                                        onChange={(e) => setSearchTerm(e.target.value)}
                                                        onKeyPress={(e) => {
                                                            if (e.key === 'Enter') handleFilter();
                                                        }}
                                                    />
                                                </Col>

                                                <Col md={2}>
                                                    <Form.Select
                                                        value={selectedPeriodType}
                                                        onChange={(e) => setSelectedPeriodType(e.target.value)}
                                                    >
                                                        <option value="">Tüm Dönemler</option>
                                                        {periodTypes.map((type) => (
                                                            <option key={type.value} value={type.value}>
                                                                {type.label}
                                                            </option>
                                                        ))}
                                                    </Form.Select>
                                                </Col>

                                                <Col md={2}>
                                                    <Form.Select
                                                        value={selectedAssignmentType}
                                                        onChange={(e) => setSelectedAssignmentType(e.target.value)}
                                                    >
                                                        <option value="">Tüm Atamalar</option>
                                                        {assignmentTypes.map((type) => (
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

                                                <Col md={1}>
                                                    <Form.Select
                                                        value={selectedYear}
                                                        onChange={(e) => setSelectedYear(e.target.value)}
                                                    >
                                                        <option value="">Yıl</option>
                                                        {years.map((year) => (
                                                            <option key={year} value={year}>
                                                                {year}
                                                            </option>
                                                        ))}
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
                                                    <th>Hedef</th>
                                                    <th>Dönem</th>
                                                    <th>Atama</th>
                                                    <th>Ciro Hedefi</th>
                                                    <th>Başarı Oranı</th>
                                                    <th>Durum</th>
                                                    <th>Süre</th>
                                                    <th>İşlemler</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {targets.data.length > 0 ? (
                                                    targets.data.map((target) => (
                                                        <tr key={target.id}>
                                                            <td>
                                                                <Link
                                                                    href={route('sales.targets.show', target.id)}
                                                                    className="fw-medium link-primary"
                                                                >
                                                                    {target.name}
                                                                </Link>
                                                                <div>
                                                                    <small className="text-muted">{target.code}</small>
                                                                </div>
                                                            </td>
                                                            <td>
                                                                <div>
                                                                    <Badge bg="info">{target.period_type_label}</Badge>
                                                                    <div className="mt-1">
                                                                        <small className="text-muted">
                                                                            {target.year}
                                                                            {target.month && ` - ${target.month}. Ay`}
                                                                            {target.quarter && ` - Q${target.quarter}`}
                                                                        </small>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td>
                                                                <div>
                                                                    <small className="text-muted">
                                                                        {target.assignment_type_label}
                                                                    </small>
                                                                    {target.user && (
                                                                        <div className="fw-medium">
                                                                            {target.user.name}
                                                                        </div>
                                                                    )}
                                                                    {target.department && (
                                                                        <div className="fw-medium">
                                                                            {target.department.name}
                                                                        </div>
                                                                    )}
                                                                    {target.location && (
                                                                        <div className="fw-medium">
                                                                            {target.location.name}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </td>
                                                            <td>
                                                                <div>
                                                                    <div className="fw-medium">
                                                                        ₺{target.revenue_target.toLocaleString('tr-TR')}
                                                                    </div>
                                                                    <small className="text-success">
                                                                        ₺{target.actual_revenue.toLocaleString('tr-TR')}
                                                                    </small>
                                                                </div>
                                                            </td>
                                                            <td>
                                                                <div>
                                                                    <div className="d-flex align-items-center">
                                                                        <div className="flex-grow-1">
                                                                            <ProgressBar
                                                                                now={Math.min(100, target.overall_achievement)}
                                                                                variant={getAchievementColor(
                                                                                    target.overall_achievement
                                                                                )}
                                                                                style={{ height: '6px' }}
                                                                            />
                                                                        </div>
                                                                        <span className="ms-2 fw-semibold">
                                                                            %{target.overall_achievement.toFixed(1)}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td>
                                                                <Badge bg={getStatusBadge(target.status)}>
                                                                    {target.status_label}
                                                                </Badge>
                                                                {target.is_active && (
                                                                    <Badge bg="success" className="ms-1">
                                                                        <i className="ri-checkbox-circle-line"></i>
                                                                    </Badge>
                                                                )}
                                                            </td>
                                                            <td>
                                                                <div>
                                                                    {target.days_remaining > 0 ? (
                                                                        <small className="text-muted">
                                                                            {target.days_remaining} gün kaldı
                                                                        </small>
                                                                    ) : (
                                                                        <small className="text-danger">Süresi doldu</small>
                                                                    )}
                                                                    <ProgressBar
                                                                        now={target.progress_percentage}
                                                                        variant="secondary"
                                                                        style={{ height: '4px' }}
                                                                        className="mt-1"
                                                                    />
                                                                </div>
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
                                                                            href={route('sales.targets.show', target.id)}
                                                                        >
                                                                            <i className="ri-eye-line align-bottom me-2 text-muted"></i>
                                                                            Görüntüle
                                                                        </Dropdown.Item>
                                                                        <Dropdown.Item
                                                                            as={Link}
                                                                            href={route('sales.targets.edit', target.id)}
                                                                        >
                                                                            <i className="ri-pencil-line align-bottom me-2 text-muted"></i>
                                                                            Düzenle
                                                                        </Dropdown.Item>
                                                                        <Dropdown.Item
                                                                            onClick={() => handleToggleStatus(target.id)}
                                                                        >
                                                                            <i className="ri-toggle-line align-bottom me-2 text-muted"></i>
                                                                            {target.is_active
                                                                                ? 'Pasifleştir'
                                                                                : 'Aktifleştir'}
                                                                        </Dropdown.Item>
                                                                        <Dropdown.Item
                                                                            onClick={() => handleRecalculate(target.id)}
                                                                        >
                                                                            <i className="ri-refresh-line align-bottom me-2 text-muted"></i>
                                                                            Yeniden Hesapla
                                                                        </Dropdown.Item>
                                                                        <Dropdown.Divider />
                                                                        <Dropdown.Item
                                                                            onClick={() => handleDelete(target.id)}
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
                                                        <td colSpan={8} className="text-center py-4">
                                                            <div className="text-muted">
                                                                <i className="ri-search-line fs-24 mb-2"></i>
                                                                <p>Henüz hedef bulunmamaktadır.</p>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </Table>
                                    </div>

                                    {/* Pagination */}
                                    {targets.last_page > 1 && (
                                        <div className="d-flex justify-content-between align-items-center mt-3">
                                            <div className="text-muted">
                                                Toplam {targets.total} kayıttan {targets.data.length} tanesi gösteriliyor
                                            </div>
                                            <nav>
                                                <ul className="pagination mb-0">
                                                    {Array.from({ length: targets.last_page }, (_, i) => i + 1).map(
                                                        (page) => (
                                                            <li
                                                                key={page}
                                                                className={`page-item ${targets.current_page === page ? 'active' : ''
                                                                    }`}
                                                            >
                                                                <Link
                                                                    href={route('sales.targets.index', {
                                                                        page,
                                                                        search: searchTerm,
                                                                        period_type: selectedPeriodType,
                                                                        assignment_type: selectedAssignmentType,
                                                                        status: selectedStatus,
                                                                        year: selectedYear,
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
