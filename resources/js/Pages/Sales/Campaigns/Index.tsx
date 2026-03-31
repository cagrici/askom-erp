import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { Card, Table, Button, Row, Col, Form, InputGroup, Badge, ProgressBar } from 'react-bootstrap';
import Layout from '@/Layouts';

interface Campaign {
    id: number;
    name: string;
    code: string;
    type: string;
    type_label: string;
    target_type: string;
    target_type_label: string;
    start_date: string;
    end_date: string;
    status: string;
    status_label: string;
    is_active: boolean;
    discount_value: number;
    usage_count: number;
    usage_limit: number | null;
    usage_percentage: number;
    total_revenue: number;
    total_discount_given: number;
    days_remaining: number;
    is_currently_active: boolean;
    coupon_code: string | null;
    requires_coupon: boolean;
    creator?: {
        name: string;
    };
}

interface PaginatedCampaigns {
    data: Campaign[];
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
    scheduled: number;
    expired: number;
    total_usage: number;
    total_revenue: number;
    total_discount_given: number;
}

interface Props {
    campaigns: PaginatedCampaigns;
    stats: Stats;
    filters: {
        search?: string;
        status?: string;
        type?: string;
        is_active?: string;
        date_from?: string;
        date_to?: string;
    };
    types: Record<string, string>;
    statuses: Record<string, string>;
}

export default function Index({ campaigns, stats, filters, types, statuses }: Props) {
    const [showFilters, setShowFilters] = useState(false);
    const [searchTerm, setSearchTerm] = useState(filters.search || '');
    const [selectedStatus, setSelectedStatus] = useState(filters.status || '');
    const [selectedType, setSelectedType] = useState(filters.type || '');
    const [selectedActive, setSelectedActive] = useState(filters.is_active || '');
    const [dateFrom, setDateFrom] = useState(filters.date_from || '');
    const [dateTo, setDateTo] = useState(filters.date_to || '');

    const handleFilter = () => {
        router.get(route('sales.campaigns.index'), {
            search: searchTerm,
            status: selectedStatus,
            type: selectedType,
            is_active: selectedActive,
            date_from: dateFrom,
            date_to: dateTo,
        }, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const clearFilters = () => {
        setSearchTerm('');
        setSelectedStatus('');
        setSelectedType('');
        setSelectedActive('');
        setDateFrom('');
        setDateTo('');
        router.get(route('sales.campaigns.index'));
    };

    const getStatusColor = (status: string) => {
        const colors: Record<string, string> = {
            draft: 'secondary',
            scheduled: 'info',
            active: 'success',
            paused: 'warning',
            expired: 'danger',
            completed: 'primary',
        };
        return colors[status] || 'secondary';
    };

    const getTypeColor = (type: string) => {
        const colors: Record<string, string> = {
            discount_percentage: 'primary',
            discount_amount: 'success',
            buy_x_get_y: 'info',
            free_shipping: 'warning',
            bundle: 'danger',
            gift: 'pink',
            cashback: 'purple',
        };
        return colors[type] || 'secondary';
    };

    const handleToggleStatus = (campaignId: number) => {
        if (confirm('Kampanya durumunu değiştirmek istediğinizden emin misiniz?')) {
            router.patch(route('sales.campaigns.toggle-status', campaignId), {}, {
                preserveScroll: true,
            });
        }
    };

    const handleDuplicate = (campaignId: number) => {
        if (confirm('Kampanyayı kopyalamak istediğinizden emin misiniz?')) {
            router.post(route('sales.campaigns.duplicate', campaignId));
        }
    };

    const handleDelete = (campaignId: number) => {
        if (confirm('Kampanyayı silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.')) {
            router.delete(route('sales.campaigns.destroy', campaignId));
        }
    };

    return (
        <Layout>
            <Head title="Kampanyalar" />

            <div className="page-content">
                <div className="container-fluid">
                    <Row className="mb-3">
                        <Col>
                            <div className="page-title-box d-sm-flex align-items-center justify-content-between">
                                <h4 className="mb-sm-0">Kampanyalar</h4>
                                <div className="page-title-right">
                                    <Link href={route('sales.campaigns.create')}>
                                        <Button variant="primary" size="sm">
                                            <i className="ri-add-line me-1"></i>
                                            Yeni Kampanya
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
                                                Toplam Kampanya
                                            </p>
                                        </div>
                                        <div className="flex-shrink-0">
                                            <h5 className="text-primary fs-14 mb-0">
                                                <i className="ri-megaphone-line align-middle"></i>
                                            </h5>
                                        </div>
                                    </div>
                                    <div className="d-flex align-items-end justify-content-between mt-4">
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
                                                Aktif Kampanya
                                            </p>
                                        </div>
                                        <div className="flex-shrink-0">
                                            <h5 className="text-success fs-14 mb-0">
                                                <i className="ri-checkbox-circle-line align-middle"></i>
                                            </h5>
                                        </div>
                                    </div>
                                    <div className="d-flex align-items-end justify-content-between mt-4">
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
                                                Toplam Kullanım
                                            </p>
                                        </div>
                                        <div className="flex-shrink-0">
                                            <h5 className="text-info fs-14 mb-0">
                                                <i className="ri-shopping-cart-line align-middle"></i>
                                            </h5>
                                        </div>
                                    </div>
                                    <div className="d-flex align-items-end justify-content-between mt-4">
                                        <div>
                                            <h4 className="fs-22 fw-semibold ff-secondary mb-0">
                                                {stats.total_usage}
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
                                                Toplam İndirim
                                            </p>
                                        </div>
                                        <div className="flex-shrink-0">
                                            <h5 className="text-danger fs-14 mb-0">
                                                <i className="ri-price-tag-3-line align-middle"></i>
                                            </h5>
                                        </div>
                                    </div>
                                    <div className="d-flex align-items-end justify-content-between mt-4">
                                        <div>
                                            <h4 className="fs-22 fw-semibold ff-secondary mb-0">
                                                ₺{Number(stats.total_discount_given).toLocaleString('tr-TR', {
                                                    minimumFractionDigits: 2,
                                                    maximumFractionDigits: 2,
                                                })}
                                            </h4>
                                        </div>
                                    </div>
                                </Card.Body>
                            </Card>
                        </Col>
                    </Row>

                    {/* Filters */}
                    <Card className="mb-3">
                        <Card.Header className="d-flex justify-content-between align-items-center">
                            <h5 className="card-title mb-0">Filtrele</h5>
                            <Button
                                variant="link"
                                size="sm"
                                onClick={() => setShowFilters(!showFilters)}
                            >
                                {showFilters ? 'Gizle' : 'Göster'}
                            </Button>
                        </Card.Header>
                        {showFilters && (
                            <Card.Body>
                                <Row className="g-3">
                                    <Col md={3}>
                                        <Form.Group>
                                            <Form.Label>Ara</Form.Label>
                                            <InputGroup>
                                                <InputGroup.Text>
                                                    <i className="ri-search-line"></i>
                                                </InputGroup.Text>
                                                <Form.Control
                                                    type="text"
                                                    placeholder="Kampanya adı, kod..."
                                                    value={searchTerm}
                                                    onChange={(e) => setSearchTerm(e.target.value)}
                                                    onKeyPress={(e) => e.key === 'Enter' && handleFilter()}
                                                />
                                            </InputGroup>
                                        </Form.Group>
                                    </Col>

                                    <Col md={2}>
                                        <Form.Group>
                                            <Form.Label>Durum</Form.Label>
                                            <Form.Select
                                                value={selectedStatus}
                                                onChange={(e) => setSelectedStatus(e.target.value)}
                                            >
                                                <option value="">Tümü</option>
                                                {Object.entries(statuses).map(([key, label]) => (
                                                    <option key={key} value={key}>
                                                        {label}
                                                    </option>
                                                ))}
                                            </Form.Select>
                                        </Form.Group>
                                    </Col>

                                    <Col md={2}>
                                        <Form.Group>
                                            <Form.Label>Tip</Form.Label>
                                            <Form.Select
                                                value={selectedType}
                                                onChange={(e) => setSelectedType(e.target.value)}
                                            >
                                                <option value="">Tümü</option>
                                                {Object.entries(types).map(([key, label]) => (
                                                    <option key={key} value={key}>
                                                        {label}
                                                    </option>
                                                ))}
                                            </Form.Select>
                                        </Form.Group>
                                    </Col>

                                    <Col md={2}>
                                        <Form.Group>
                                            <Form.Label>Aktif/Pasif</Form.Label>
                                            <Form.Select
                                                value={selectedActive}
                                                onChange={(e) => setSelectedActive(e.target.value)}
                                            >
                                                <option value="">Tümü</option>
                                                <option value="1">Aktif</option>
                                                <option value="0">Pasif</option>
                                            </Form.Select>
                                        </Form.Group>
                                    </Col>

                                    <Col md={3} className="d-flex align-items-end">
                                        <Button
                                            variant="primary"
                                            onClick={handleFilter}
                                            className="me-2"
                                        >
                                            <i className="ri-filter-line me-1"></i>
                                            Filtrele
                                        </Button>
                                        <Button variant="outline-secondary" onClick={clearFilters}>
                                            <i className="ri-refresh-line me-1"></i>
                                            Temizle
                                        </Button>
                                    </Col>
                                </Row>
                            </Card.Body>
                        )}
                    </Card>

                    {/* Campaigns List */}
                    <Card>
                        <Card.Body>
                            <div className="table-responsive">
                                <Table hover className="mb-0">
                                    <thead className="table-light">
                                        <tr>
                                            <th>Kampanya</th>
                                            <th>Tip</th>
                                            <th>Tarih Aralığı</th>
                                            <th>Kullanım</th>
                                            <th className="text-end">İndirim / Gelir</th>
                                            <th>Durum</th>
                                            <th className="text-end">İşlemler</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {campaigns.data.length > 0 ? (
                                            campaigns.data.map((campaign) => (
                                                <tr key={campaign.id}>
                                                    <td>
                                                        <div className="d-flex flex-column">
                                                            <Link
                                                                href={route('sales.campaigns.show', campaign.id)}
                                                                className="text-dark fw-medium"
                                                            >
                                                                {campaign.name}
                                                            </Link>
                                                            <small className="text-muted">
                                                                Kod: {campaign.code}
                                                                {campaign.coupon_code && (
                                                                    <> • Kupon: {campaign.coupon_code}</>
                                                                )}
                                                            </small>
                                                            {campaign.is_currently_active && (
                                                                <small className="text-success">
                                                                    <i className="ri-checkbox-circle-line me-1"></i>
                                                                    Şu anda aktif • {campaign.days_remaining} gün kaldı
                                                                </small>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <Badge bg={getTypeColor(campaign.type)}>
                                                            {campaign.type_label}
                                                        </Badge>
                                                    </td>
                                                    <td>
                                                        <div className="d-flex flex-column">
                                                            <small>
                                                                {new Date(campaign.start_date).toLocaleDateString('tr-TR')}
                                                            </small>
                                                            <small className="text-muted">
                                                                {new Date(campaign.end_date).toLocaleDateString('tr-TR')}
                                                            </small>
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <div className="d-flex flex-column">
                                                            <small>
                                                                {campaign.usage_count}
                                                                {campaign.usage_limit && ` / ${campaign.usage_limit}`}
                                                            </small>
                                                            {campaign.usage_limit && (
                                                                <ProgressBar
                                                                    now={campaign.usage_percentage}
                                                                    style={{ height: '4px' }}
                                                                    variant={
                                                                        campaign.usage_percentage >= 90
                                                                            ? 'danger'
                                                                            : campaign.usage_percentage >= 70
                                                                            ? 'warning'
                                                                            : 'success'
                                                                    }
                                                                />
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="text-end">
                                                        <div className="d-flex flex-column">
                                                            <small className="text-danger">
                                                                -₺{Number(campaign.total_discount_given).toLocaleString('tr-TR', {
                                                                    minimumFractionDigits: 2,
                                                                })}
                                                            </small>
                                                            <small className="text-success">
                                                                ₺{Number(campaign.total_revenue).toLocaleString('tr-TR', {
                                                                    minimumFractionDigits: 2,
                                                                })}
                                                            </small>
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <div className="d-flex flex-column gap-1">
                                                            <Badge bg={getStatusColor(campaign.status)}>
                                                                {campaign.status_label}
                                                            </Badge>
                                                            <Form.Check
                                                                type="switch"
                                                                id={`active-${campaign.id}`}
                                                                label={campaign.is_active ? 'Aktif' : 'Pasif'}
                                                                checked={campaign.is_active}
                                                                onChange={() => handleToggleStatus(campaign.id)}
                                                            />
                                                        </div>
                                                    </td>
                                                    <td className="text-end">
                                                        <Link href={route('sales.campaigns.show', campaign.id)}>
                                                            <Button variant="outline-primary" size="sm" className="me-1">
                                                                <i className="ri-eye-line"></i>
                                                            </Button>
                                                        </Link>
                                                        <Link href={route('sales.campaigns.edit', campaign.id)}>
                                                            <Button variant="outline-secondary" size="sm" className="me-1">
                                                                <i className="ri-edit-line"></i>
                                                            </Button>
                                                        </Link>
                                                        <Button
                                                            variant="outline-info"
                                                            size="sm"
                                                            className="me-1"
                                                            onClick={() => handleDuplicate(campaign.id)}
                                                        >
                                                            <i className="ri-file-copy-line"></i>
                                                        </Button>
                                                        <Button
                                                            variant="outline-danger"
                                                            size="sm"
                                                            onClick={() => handleDelete(campaign.id)}
                                                        >
                                                            <i className="ri-delete-bin-line"></i>
                                                        </Button>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan={7} className="text-center py-4">
                                                    <div className="text-muted">
                                                        <i className="ri-megaphone-line fs-1 d-block mb-2"></i>
                                                        Kampanya bulunamadı
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </Table>
                            </div>

                            {/* Pagination */}
                            {campaigns.last_page > 1 && (
                                <div className="d-flex justify-content-between align-items-center mt-3">
                                    <div className="text-muted">
                                        Toplam {campaigns.total} kayıt bulundu
                                    </div>
                                    <nav>
                                        <ul className="pagination mb-0">
                                            {campaigns.links.map((link, index) => (
                                                <li
                                                    key={index}
                                                    className={`page-item ${link.active ? 'active' : ''} ${
                                                        !link.url ? 'disabled' : ''
                                                    }`}
                                                >
                                                    {link.url ? (
                                                        <Link
                                                            href={link.url}
                                                            className="page-link"
                                                            preserveState
                                                            preserveScroll
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
                                </div>
                            )}
                        </Card.Body>
                    </Card>
                </div>
            </div>
        </Layout>
    );
}
