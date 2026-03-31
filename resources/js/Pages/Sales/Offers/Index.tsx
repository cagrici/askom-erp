import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { Card, Table, Button, Row, Col, Form, Badge, Dropdown, Modal } from 'react-bootstrap';
import Layout from '@/Layouts';

interface SalesOffer {
    id: number;
    offer_no: string;
    offer_date: string;
    valid_until_date: string;
    customer_display_name: string;
    formatted_total: string;
    status: string;
    customer_name?: string;
    customer_email?: string;
    email_sent_at?: string;
    email_sent_count?: number;
    email_sent_to?: string;
    email_attachment_type?: string;
    entity?: {
        entity_name: string;
    };
    creator?: {
        name: string;
    };
}

interface EmailLogEntry {
    id: number;
    sent_to: string;
    attachment_type: string;
    custom_message?: string;
    status: string;
    error_message?: string;
    sent_by_name: string;
    sent_at: string;
    opened_at?: string;
    open_count?: number;
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
    offers: PaginatedOffers;
    filters: {
        search?: string;
        status?: string;
        date_from?: string;
        date_to?: string;
    };
}

const statusColors: Record<string, string> = {
    draft: 'secondary',
    sent: 'info',
    approved: 'success',
    rejected: 'danger',
    converted_to_order: 'primary',
    expired: 'warning'
};

const statusLabels: Record<string, string> = {
    draft: 'Taslak',
    sent: 'Gönderildi',
    approved: 'Onaylandı',
    rejected: 'Reddedildi',
    converted_to_order: 'Siparişe Dönüştürüldü',
    expired: 'Süresi Doldu'
};

export default function Index({ offers, filters }: Props) {
    const [search, setSearch] = useState(filters.search || '');
    const [status, setStatus] = useState(filters.status || '');
    const [showEmailModal, setShowEmailModal] = useState(false);
    const [emailOfferId, setEmailOfferId] = useState<number | null>(null);
    const [emailForm, setEmailForm] = useState({
        email: '',
        format: 'pdf' as 'pdf' | 'excel',
        message: '',
    });
    const [emailSending, setEmailSending] = useState(false);
    const [showHistoryModal, setShowHistoryModal] = useState(false);
    const [historyLogs, setHistoryLogs] = useState<EmailLogEntry[]>([]);
    const [historyLoading, setHistoryLoading] = useState(false);
    const [historyOfferNo, setHistoryOfferNo] = useState('');

    const handleOpenEmailModal = (offer: SalesOffer) => {
        setEmailOfferId(offer.id);
        setEmailForm({
            email: offer.customer_email || '',
            format: 'pdf',
            message: '',
        });
        setShowEmailModal(true);
    };

    const handleSendEmail = () => {
        if (!emailOfferId) return;
        setEmailSending(true);
        router.post(route('sales.offers.send-email', emailOfferId), emailForm, {
            onSuccess: () => {
                setShowEmailModal(false);
                setEmailSending(false);
                setEmailOfferId(null);
            },
            onError: () => {
                setEmailSending(false);
            },
        });
    };

    const handleViewEmailHistory = (offer: SalesOffer) => {
        setHistoryOfferNo(offer.offer_no);
        setHistoryLoading(true);
        setShowHistoryModal(true);
        fetch(route('sales.offers.email-history', offer.id))
            .then(res => res.json())
            .then(data => {
                setHistoryLogs(data.logs || []);
                setHistoryLoading(false);
            })
            .catch(() => setHistoryLoading(false));
    };

    const handleFilter = () => {
        router.get(route('sales.offers.index'), {
            search,
            status,
            date_from: filters.date_from,
            date_to: filters.date_to
        }, {
            preserveState: true,
            preserveScroll: true
        });
    };

    const handleReset = () => {
        setSearch('');
        setStatus('');
        router.get(route('sales.offers.index'));
    };

    return (
        <Layout>
            <Head title="Satış Teklifleri" />

            <div className="page-content">
                <div className="container-fluid">
                    <Row className="mb-3">
                        <Col>
                            <div className="page-title-box d-sm-flex align-items-center justify-content-between">
                                <h4 className="mb-sm-0">Satış Teklifleri</h4>
                                <div className="page-title-right d-flex gap-2">
                                    <Link href={route('sales.offers.tracking')}>
                                        <Button variant="outline-info">
                                            <i className="ri-bar-chart-line me-1"></i>
                                            Takip Paneli
                                        </Button>
                                    </Link>
                                    <Link href={route('sales.offers.create')}>
                                        <Button variant="primary">
                                            <i className="ri-add-line align-bottom me-1"></i>
                                            Yeni Teklif
                                        </Button>
                                    </Link>
                                </div>
                            </div>
                        </Col>
                    </Row>

                    <Card>
                        <Card.Body>
                            <Row className="mb-3">
                                <Col md={4}>
                                    <Form.Control
                                        type="text"
                                        placeholder="Teklif No, Müşteri Ara..."
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && handleFilter()}
                                    />
                                </Col>
                                <Col md={3}>
                                    <Form.Select
                                        value={status}
                                        onChange={(e) => setStatus(e.target.value)}
                                    >
                                        <option value="">Tüm Durumlar</option>
                                        <option value="draft">Taslak</option>
                                        <option value="sent">Gönderildi</option>
                                        <option value="approved">Onaylandı</option>
                                        <option value="rejected">Reddedildi</option>
                                        <option value="converted_to_order">Siparişe Dönüştü</option>
                                        <option value="expired">Süresi Doldu</option>
                                    </Form.Select>
                                </Col>
                                <Col md={5}>
                                    <Button variant="primary" onClick={handleFilter} className="me-2">
                                        <i className="ri-search-line me-1"></i>
                                        Filtrele
                                    </Button>
                                    <Button variant="secondary" onClick={handleReset}>
                                        <i className="ri-refresh-line me-1"></i>
                                        Temizle
                                    </Button>
                                </Col>
                            </Row>

                            <div className="table-responsive">
                                <Table hover className="mb-0">
                                    <thead className="table-light">
                                        <tr>
                                            <th>Teklif No</th>
                                            <th>Müşteri</th>
                                            <th>Tarih</th>
                                            <th>Geçerlilik</th>
                                            <th>Tutar</th>
                                            <th>Durum</th>
                                            <th className="text-center">Email</th>
                                            <th>Oluşturan</th>
                                            <th className="text-end">İşlemler</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {offers.data.length === 0 ? (
                                            <tr>
                                                <td colSpan={9} className="text-center py-4">
                                                    <i className="ri-file-list-3-line fs-1 text-muted"></i>
                                                    <p className="text-muted mt-2">Teklif bulunamadı</p>
                                                </td>
                                            </tr>
                                        ) : (
                                            offers.data.map((offer) => (
                                                <tr key={offer.id}>
                                                    <td>
                                                        <Link
                                                            href={route('sales.offers.show', offer.id)}
                                                            className="text-body fw-medium"
                                                        >
                                                            {offer.offer_no}
                                                        </Link>
                                                    </td>
                                                    <td>{offer.customer_display_name}</td>
                                                    <td>{new Date(offer.offer_date).toLocaleDateString('tr-TR')}</td>
                                                    <td>{new Date(offer.valid_until_date).toLocaleDateString('tr-TR')}</td>
                                                    <td className="fw-medium">{offer.formatted_total}</td>
                                                    <td>
                                                        <Badge bg={statusColors[offer.status] || 'secondary'}>
                                                            {statusLabels[offer.status] || offer.status}
                                                        </Badge>
                                                    </td>
                                                    <td className="text-center">
                                                        {offer.email_sent_count && offer.email_sent_count > 0 ? (
                                                            <span
                                                                className="d-inline-flex align-items-center gap-1"
                                                                style={{ cursor: 'pointer' }}
                                                                title={`Son: ${offer.email_sent_at ? new Date(offer.email_sent_at).toLocaleDateString('tr-TR') : '-'}`}
                                                                onClick={() => handleViewEmailHistory(offer)}
                                                            >
                                                                <i className="ri-mail-check-line text-success"></i>
                                                                <Badge bg="light" text="dark" pill>
                                                                    {offer.email_sent_count}
                                                                </Badge>
                                                            </span>
                                                        ) : (
                                                            <i className="ri-mail-line text-muted" title="Henuz gonderilmedi"></i>
                                                        )}
                                                    </td>
                                                    <td>{offer.creator?.name || '-'}</td>
                                                    <td className="text-end">
                                                        <Dropdown align="end">
                                                            <Dropdown.Toggle
                                                                variant="link"
                                                                className="btn btn-sm btn-icon btn-link text-muted"
                                                            >
                                                                <i className="ri-more-2-fill"></i>
                                                            </Dropdown.Toggle>
                                                            <Dropdown.Menu>
                                                                <Dropdown.Item
                                                                    href={route('sales.offers.show', offer.id)}
                                                                >
                                                                    <i className="ri-eye-line me-2"></i>
                                                                    Görüntüle
                                                                </Dropdown.Item>
                                                                {offer.status === 'draft' && (
                                                                    <Dropdown.Item
                                                                        href={route('sales.offers.edit', offer.id)}
                                                                    >
                                                                        <i className="ri-edit-line me-2"></i>
                                                                        Düzenle
                                                                    </Dropdown.Item>
                                                                )}
                                                                <Dropdown.Item
                                                                    href={route('sales.offers.pdf', offer.id)}
                                                                    target="_blank"
                                                                >
                                                                    <i className="ri-file-pdf-line me-2"></i>
                                                                    PDF İndir
                                                                </Dropdown.Item>
                                                                <Dropdown.Item
                                                                    onClick={() => handleOpenEmailModal(offer)}
                                                                >
                                                                    <i className="ri-mail-send-line me-2"></i>
                                                                    Email Gönder
                                                                </Dropdown.Item>
                                                                {offer.status !== 'converted_to_order' && (
                                                                    <Dropdown.Item
                                                                        onClick={() => {
                                                                            if (confirm('Bu teklifi silmek istediğinizden emin misiniz?')) {
                                                                                router.delete(route('sales.offers.destroy', offer.id));
                                                                            }
                                                                        }}
                                                                        className="text-danger"
                                                                    >
                                                                        <i className="ri-delete-bin-line me-2"></i>
                                                                        Sil
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

                            {offers.last_page > 1 && (
                                <div className="d-flex justify-content-between align-items-center mt-3">
                                    <div className="text-muted">
                                        Toplam {offers.total} kayıt - Sayfa {offers.current_page} / {offers.last_page}
                                    </div>
                                    <nav>
                                        <ul className="pagination mb-0">
                                            {offers.links.map((link, index) => (
                                                <li
                                                    key={index}
                                                    className={`page-item ${link.active ? 'active' : ''} ${!link.url ? 'disabled' : ''}`}
                                                >
                                                    {link.url ? (
                                                        <a
                                                            href={link.url}
                                                            className="page-link"
                                                            onClick={(e) => {
                                                                e.preventDefault();
                                                                router.get(link.url!);
                                                            }}
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
            {/* Email Modal */}
            <Modal show={showEmailModal} onHide={() => setShowEmailModal(false)} size="lg">
                <Modal.Header closeButton>
                    <Modal.Title>
                        <i className="ri-mail-send-line me-2"></i>
                        Teklifi Email ile Gönder
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form.Group className="mb-3">
                        <Form.Label>Alıcı Email Adresi *</Form.Label>
                        <Form.Control
                            type="email"
                            value={emailForm.email}
                            onChange={e => setEmailForm({ ...emailForm, email: e.target.value })}
                            placeholder="ornek@sirket.com"
                        />
                    </Form.Group>

                    <Form.Group className="mb-3">
                        <Form.Label>Ek Dosya Formatı *</Form.Label>
                        <div className="d-flex gap-3">
                            <Form.Check
                                type="radio"
                                id="format-pdf"
                                name="format"
                                label={
                                    <span>
                                        <i className="ri-file-pdf-line text-danger me-1"></i>
                                        PDF Dosyası
                                    </span>
                                }
                                checked={emailForm.format === 'pdf'}
                                onChange={() => setEmailForm({ ...emailForm, format: 'pdf' })}
                            />
                            <Form.Check
                                type="radio"
                                id="format-excel"
                                name="format"
                                label={
                                    <span>
                                        <i className="ri-file-excel-line text-success me-1"></i>
                                        Excel Dosyası
                                    </span>
                                }
                                checked={emailForm.format === 'excel'}
                                onChange={() => setEmailForm({ ...emailForm, format: 'excel' })}
                            />
                        </div>
                    </Form.Group>

                    <Form.Group className="mb-3">
                        <Form.Label>Mesaj (Opsiyonel)</Form.Label>
                        <Form.Control
                            as="textarea"
                            rows={4}
                            value={emailForm.message}
                            onChange={e => setEmailForm({ ...emailForm, message: e.target.value })}
                            placeholder="Müşteriye iletmek istediğiniz mesajı yazın..."
                        />
                        <Form.Text className="text-muted">
                            Bu mesaj email içeriğinde gösterilecektir.
                        </Form.Text>
                    </Form.Group>

                    <div className="alert alert-info mb-0">
                        <i className="ri-information-line me-2"></i>
                        <strong>Not:</strong> Email gönderildiğinde müşteri, teklifi onaylamak için bir link alacaktır.
                        Bu link üzerinden teklifi görüntüleyebilir ve onaylayabilir.
                    </div>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowEmailModal(false)} disabled={emailSending}>
                        İptal
                    </Button>
                    <Button
                        variant="primary"
                        onClick={handleSendEmail}
                        disabled={!emailForm.email || emailSending}
                    >
                        {emailSending ? (
                            <>
                                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                Gönderiliyor...
                            </>
                        ) : (
                            <>
                                <i className="ri-send-plane-line me-1"></i>
                                Gönder
                            </>
                        )}
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* Email History Modal */}
            <Modal show={showHistoryModal} onHide={() => setShowHistoryModal(false)} size="lg">
                <Modal.Header closeButton>
                    <Modal.Title>
                        <i className="ri-mail-line me-2"></i>
                        Email Gecmisi - {historyOfferNo}
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {historyLoading ? (
                        <div className="text-center py-4">
                            <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                            Yukleniyor...
                        </div>
                    ) : historyLogs.length === 0 ? (
                        <div className="text-center py-4 text-muted">
                            <i className="ri-mail-line fs-1"></i>
                            <p className="mt-2">Henuz email gonderilmemis.</p>
                        </div>
                    ) : (
                        <div className="table-responsive">
                            <Table hover size="sm" className="mb-0">
                                <thead className="table-light">
                                    <tr>
                                        <th>Tarih</th>
                                        <th>Alici</th>
                                        <th>Format</th>
                                        <th>Gonderen</th>
                                        <th>Durum</th>
                                        <th>Acilma</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {historyLogs.map((log) => (
                                        <tr key={log.id}>
                                            <td>{log.sent_at}</td>
                                            <td>{log.sent_to}</td>
                                            <td>
                                                {log.attachment_type === 'pdf' ? (
                                                    <span><i className="ri-file-pdf-line text-danger me-1"></i>PDF</span>
                                                ) : (
                                                    <span><i className="ri-file-excel-line text-success me-1"></i>Excel</span>
                                                )}
                                            </td>
                                            <td>{log.sent_by_name}</td>
                                            <td>
                                                {log.status === 'sent' ? (
                                                    <Badge bg="success">Gonderildi</Badge>
                                                ) : (
                                                    <Badge bg="danger" title={log.error_message || ''}>Basarisiz</Badge>
                                                )}
                                            </td>
                                            <td>
                                                {log.opened_at ? (
                                                    <span title={`${log.open_count || 1}x acildi - Ilk: ${log.opened_at}`}>
                                                        <i className="ri-eye-line text-success me-1"></i>
                                                        {log.opened_at}
                                                    </span>
                                                ) : (
                                                    <span className="text-muted">
                                                        <i className="ri-eye-off-line me-1"></i>
                                                        Acilmadi
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </Table>
                        </div>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowHistoryModal(false)}>
                        Kapat
                    </Button>
                </Modal.Footer>
            </Modal>
        </Layout>
    );
}
