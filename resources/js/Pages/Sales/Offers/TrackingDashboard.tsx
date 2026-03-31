import React from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { Card, Table, Button, Row, Col, Badge, Nav } from 'react-bootstrap';
import Layout from '@/Layouts';

interface Stats {
    total_offers: number;
    sent_offers: number;
    awaiting_response: number;
    expired_offers: number;
    approved_offers: number;
    converted_offers: number;
    total_emails_sent: number;
    total_opened: number;
    open_rate: number;
}

interface SalesOffer {
    id: number;
    offer_no: string;
    offer_date: string;
    valid_until_date: string;
    customer_display_name: string;
    formatted_total: string;
    status: string;
    email_sent_at?: string;
    email_sent_count?: number;
    email_sent_to?: string;
    customer_approved_at?: string;
    converted_at?: string;
}

interface PaginatedOffers {
    data: SalesOffer[];
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

interface Props {
    stats: Stats;
    offers: PaginatedOffers;
    tab: string;
}

const statusColors: Record<string, string> = {
    draft: 'secondary',
    sent: 'info',
    approved: 'success',
    accepted: 'success',
    rejected: 'danger',
    converted_to_order: 'primary',
    expired: 'warning'
};

const statusLabels: Record<string, string> = {
    draft: 'Taslak',
    sent: 'Gonderildi',
    approved: 'Onaylandi',
    accepted: 'Kabul Edildi',
    rejected: 'Reddedildi',
    converted_to_order: 'Siparise Donusturuldu',
    expired: 'Suresi Doldu'
};

// Pagination labels from Laravel are simple text like "Previous", "Next", "1", "2" etc.
// They are safe to render directly without dangerouslySetInnerHTML.
function decodePaginationLabel(label: string): string {
    return label
        .replace(/&laquo;/g, '\u00AB')
        .replace(/&raquo;/g, '\u00BB')
        .replace(/&amp;/g, '&');
}

export default function TrackingDashboard({ stats, offers, tab }: Props) {
    const handleTabChange = (newTab: string) => {
        router.get(route('sales.offers.tracking'), { tab: newTab }, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const daysSince = (dateStr: string) => {
        const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24));
        return diff;
    };

    return (
        <Layout>
            <Head title="Teklif Takip Paneli" />

            <div className="page-content">
                <div className="container-fluid">
                    <Row className="mb-3">
                        <Col>
                            <div className="page-title-box d-sm-flex align-items-center justify-content-between">
                                <h4 className="mb-sm-0">Teklif Takip Paneli</h4>
                                <div className="page-title-right">
                                    <Link href={route('sales.offers.index')}>
                                        <Button variant="secondary" size="sm">
                                            <i className="ri-arrow-left-line me-1"></i>
                                            Teklifler
                                        </Button>
                                    </Link>
                                </div>
                            </div>
                        </Col>
                    </Row>

                    {/* Stats Cards */}
                    <Row className="mb-3">
                        <Col md={3} sm={6} className="mb-3">
                            <Card className="border-start border-4 border-info">
                                <Card.Body>
                                    <div className="d-flex align-items-center">
                                        <div className="flex-grow-1">
                                            <p className="text-muted mb-1">Gonderilen Teklifler</p>
                                            <h4 className="mb-0">{stats.sent_offers} <small className="text-muted fs-6">/ {stats.total_offers}</small></h4>
                                        </div>
                                        <div className="flex-shrink-0">
                                            <i className="ri-mail-send-line fs-1 text-info"></i>
                                        </div>
                                    </div>
                                </Card.Body>
                            </Card>
                        </Col>
                        <Col md={3} sm={6} className="mb-3">
                            <Card className="border-start border-4 border-warning" style={{ cursor: 'pointer' }} onClick={() => handleTabChange('awaiting')}>
                                <Card.Body>
                                    <div className="d-flex align-items-center">
                                        <div className="flex-grow-1">
                                            <p className="text-muted mb-1">Yanit Bekleyen</p>
                                            <h4 className="mb-0">{stats.awaiting_response}</h4>
                                        </div>
                                        <div className="flex-shrink-0">
                                            <i className="ri-time-line fs-1 text-warning"></i>
                                        </div>
                                    </div>
                                </Card.Body>
                            </Card>
                        </Col>
                        <Col md={3} sm={6} className="mb-3">
                            <Card className="border-start border-4 border-success" style={{ cursor: 'pointer' }} onClick={() => handleTabChange('approved')}>
                                <Card.Body>
                                    <div className="d-flex align-items-center">
                                        <div className="flex-grow-1">
                                            <p className="text-muted mb-1">Onaylanan</p>
                                            <h4 className="mb-0">{stats.approved_offers}</h4>
                                        </div>
                                        <div className="flex-shrink-0">
                                            <i className="ri-checkbox-circle-line fs-1 text-success"></i>
                                        </div>
                                    </div>
                                </Card.Body>
                            </Card>
                        </Col>
                        <Col md={3} sm={6} className="mb-3">
                            <Card className="border-start border-4 border-primary" style={{ cursor: 'pointer' }} onClick={() => handleTabChange('converted')}>
                                <Card.Body>
                                    <div className="d-flex align-items-center">
                                        <div className="flex-grow-1">
                                            <p className="text-muted mb-1">Siparise Donusen</p>
                                            <h4 className="mb-0">{stats.converted_offers}</h4>
                                        </div>
                                        <div className="flex-shrink-0">
                                            <i className="ri-shopping-cart-line fs-1 text-primary"></i>
                                        </div>
                                    </div>
                                </Card.Body>
                            </Card>
                        </Col>
                    </Row>

                    {/* Email Stats */}
                    <Row className="mb-3">
                        <Col md={4} className="mb-3">
                            <Card>
                                <Card.Body className="text-center">
                                    <h2 className="text-info mb-1">{stats.total_emails_sent}</h2>
                                    <p className="text-muted mb-0">Toplam Email</p>
                                </Card.Body>
                            </Card>
                        </Col>
                        <Col md={4} className="mb-3">
                            <Card>
                                <Card.Body className="text-center">
                                    <h2 className="text-success mb-1">{stats.total_opened}</h2>
                                    <p className="text-muted mb-0">Acilan Email</p>
                                </Card.Body>
                            </Card>
                        </Col>
                        <Col md={4} className="mb-3">
                            <Card>
                                <Card.Body className="text-center">
                                    <h2 className={`mb-1 ${stats.open_rate >= 50 ? 'text-success' : stats.open_rate >= 25 ? 'text-warning' : 'text-danger'}`}>
                                        %{stats.open_rate}
                                    </h2>
                                    <p className="text-muted mb-0">Acilma Orani</p>
                                </Card.Body>
                            </Card>
                        </Col>
                    </Row>

                    {/* Tabs + Table */}
                    <Card>
                        <Card.Header>
                            <Nav variant="tabs" className="card-header-tabs">
                                <Nav.Item>
                                    <Nav.Link active={tab === 'awaiting'} onClick={() => handleTabChange('awaiting')}>
                                        <i className="ri-time-line me-1"></i>
                                        Yanit Bekleyen
                                        {stats.awaiting_response > 0 && (
                                            <Badge bg="warning" text="dark" className="ms-2">{stats.awaiting_response}</Badge>
                                        )}
                                    </Nav.Link>
                                </Nav.Item>
                                <Nav.Item>
                                    <Nav.Link active={tab === 'expired'} onClick={() => handleTabChange('expired')}>
                                        <i className="ri-alarm-warning-line me-1"></i>
                                        Suresi Dolan
                                        {stats.expired_offers > 0 && (
                                            <Badge bg="danger" className="ms-2">{stats.expired_offers}</Badge>
                                        )}
                                    </Nav.Link>
                                </Nav.Item>
                                <Nav.Item>
                                    <Nav.Link active={tab === 'approved'} onClick={() => handleTabChange('approved')}>
                                        <i className="ri-checkbox-circle-line me-1"></i>
                                        Onaylanan
                                    </Nav.Link>
                                </Nav.Item>
                                <Nav.Item>
                                    <Nav.Link active={tab === 'converted'} onClick={() => handleTabChange('converted')}>
                                        <i className="ri-shopping-cart-line me-1"></i>
                                        Siparise Donusen
                                    </Nav.Link>
                                </Nav.Item>
                            </Nav>
                        </Card.Header>
                        <Card.Body>
                            <div className="table-responsive">
                                <Table hover className="mb-0">
                                    <thead className="table-light">
                                        <tr>
                                            <th>Teklif No</th>
                                            <th>Musteri</th>
                                            <th>Tutar</th>
                                            <th>Gonderim</th>
                                            <th>Gecerlilik</th>
                                            <th>Durum</th>
                                            {tab === 'awaiting' && <th>Bekleme</th>}
                                            <th className="text-end">Islemler</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {offers.data.length === 0 ? (
                                            <tr>
                                                <td colSpan={tab === 'awaiting' ? 8 : 7} className="text-center py-4">
                                                    <i className="ri-inbox-line fs-1 text-muted"></i>
                                                    <p className="text-muted mt-2">Bu kategoride teklif bulunamadi.</p>
                                                </td>
                                            </tr>
                                        ) : (
                                            offers.data.map((offer) => (
                                                <tr key={offer.id}>
                                                    <td>
                                                        <Link href={route('sales.offers.show', offer.id)} className="text-body fw-medium">
                                                            {offer.offer_no}
                                                        </Link>
                                                    </td>
                                                    <td>{offer.customer_display_name}</td>
                                                    <td className="fw-medium">{offer.formatted_total}</td>
                                                    <td>
                                                        <small>
                                                            {offer.email_sent_at ? new Date(offer.email_sent_at).toLocaleDateString('tr-TR') : '-'}
                                                            {offer.email_sent_count && offer.email_sent_count > 1 && (
                                                                <Badge bg="light" text="dark" className="ms-1">{offer.email_sent_count}x</Badge>
                                                            )}
                                                        </small>
                                                    </td>
                                                    <td>
                                                        {new Date(offer.valid_until_date) < new Date() ? (
                                                            <span className="text-danger">
                                                                <i className="ri-alarm-warning-line me-1"></i>
                                                                {new Date(offer.valid_until_date).toLocaleDateString('tr-TR')}
                                                            </span>
                                                        ) : (
                                                            <span>{new Date(offer.valid_until_date).toLocaleDateString('tr-TR')}</span>
                                                        )}
                                                    </td>
                                                    <td>
                                                        <Badge bg={statusColors[offer.status] || 'secondary'}>
                                                            {statusLabels[offer.status] || offer.status}
                                                        </Badge>
                                                    </td>
                                                    {tab === 'awaiting' && (
                                                        <td>
                                                            {offer.email_sent_at && (
                                                                <span className={`${daysSince(offer.email_sent_at) > 7 ? 'text-danger fw-bold' : daysSince(offer.email_sent_at) > 3 ? 'text-warning' : 'text-muted'}`}>
                                                                    {daysSince(offer.email_sent_at)} gun
                                                                </span>
                                                            )}
                                                        </td>
                                                    )}
                                                    <td className="text-end">
                                                        <Link href={route('sales.offers.show', offer.id)}>
                                                            <Button variant="outline-primary" size="sm" className="me-1">
                                                                <i className="ri-eye-line"></i>
                                                            </Button>
                                                        </Link>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </Table>
                            </div>

                            {offers.last_page > 1 && (
                                <div className="d-flex justify-content-between align-items-center mt-3">
                                    <div className="text-muted">
                                        Toplam {offers.total} kayit - Sayfa {offers.current_page} / {offers.last_page}
                                    </div>
                                    <nav>
                                        <ul className="pagination mb-0">
                                            {offers.links.map((link, index) => (
                                                <li key={index} className={`page-item ${link.active ? 'active' : ''} ${!link.url ? 'disabled' : ''}`}>
                                                    {link.url ? (
                                                        <a
                                                            href={link.url}
                                                            className="page-link"
                                                            onClick={(e) => {
                                                                e.preventDefault();
                                                                router.get(link.url!);
                                                            }}
                                                        >
                                                            {decodePaginationLabel(link.label)}
                                                        </a>
                                                    ) : (
                                                        <span className="page-link">{decodePaginationLabel(link.label)}</span>
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
