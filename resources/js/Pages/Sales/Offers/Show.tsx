import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { Card, Row, Col, Button, Table, Badge, Modal, Form, Image } from 'react-bootstrap';
import Layout from '@/Layouts';
import { formatCurrency, CurrencyCode } from '@/utils/currency';

interface EmailLog {
    id: number;
    sent_to: string;
    attachment_type: string;
    custom_message?: string;
    status: string;
    error_message?: string;
    opened_at?: string;
    open_count?: number;
    sender?: { name: string };
    created_at: string;
}

interface SalesOffer {
    id: number;
    offer_no: string;
    offer_date: string;
    valid_until_date: string;
    status: string;
    customer_display_name: string;
    customer_name?: string;
    customer_phone?: string;
    customer_email?: string;
    customer_address?: string;
    subtotal: number;
    discount_rate: number;
    discount_amount: number;
    tax_rate: number;
    tax_amount: number;
    total_amount: number;
    notes?: string;
    customer_notes?: string;
    email_sent_at?: string;
    email_sent_count?: number;
    email_sent_to?: string;
    email_logs?: EmailLog[];
    customer_approved_at?: string;
    customer_approved_ip?: string;
    customer_approval_notes?: string;
    approval_token_expires_at?: string;
    approval_token?: string;
    items: OfferItem[];
    entity?: {
        entity_name: string;
        entity_code: string;
    };
    currency?: {
        cur_code: string;
    };
    creator?: {
        name: string;
    };
    sales_person?: {
        name: string;
    };
    converted_order?: {
        id: number;
        order_number?: string;
    };
}

interface OfferItem {
    id: number;
    product_display_name: string;
    product_code?: string;
    quantity: number;
    unit_price: number;
    discount_rate1: number;
    discount_rate2: number;
    discount_rate3: number;
    discount_amount: number;
    tax_rate: number;
    tax_amount: number;
    total_amount: number;
    unit?: {
        name: string;
    };
    product?: {
        images?: Array<{
            image_path: string;
        }>;
    };
}

interface Props {
    offer: SalesOffer;
    canConvert: boolean;
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

export default function Show({ offer, canConvert }: Props) {
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [rejectReason, setRejectReason] = useState('');
    const [showEmailModal, setShowEmailModal] = useState(false);

    // Para birimi yardımcı fonksiyonu
    const offerCurrency = (offer.currency?.cur_code || 'TRY') as CurrencyCode;
    const formatPrice = (amount: number) => formatCurrency(amount, offerCurrency);
    const [emailForm, setEmailForm] = useState({
        email: offer.customer_email || '',
        format: 'pdf' as 'pdf' | 'excel',
        message: '',
    });
    const [emailSending, setEmailSending] = useState(false);
    const [showReminderModal, setShowReminderModal] = useState(false);
    const [reminderMessage, setReminderMessage] = useState('');
    const [reminderSending, setReminderSending] = useState(false);

    const handleSend = () => {
        setShowEmailModal(true);
    };

    const handleSendReminder = () => {
        setReminderSending(true);
        router.post(route('sales.offers.send-reminder', offer.id), {
            message: reminderMessage || undefined,
        }, {
            onSuccess: () => {
                setShowReminderModal(false);
                setReminderSending(false);
                setReminderMessage('');
            },
            onError: () => {
                setReminderSending(false);
            },
        });
    };

    const handleSendEmail = () => {
        setEmailSending(true);
        router.post(route('sales.offers.send-email', offer.id), emailForm, {
            onSuccess: () => {
                setShowEmailModal(false);
                setEmailSending(false);
            },
            onError: () => {
                setEmailSending(false);
            },
        });
    };

    const handleApprove = () => {
        if (confirm('Teklifi onaylamak istiyor musunuz?')) {
            router.post(route('sales.offers.approve', offer.id));
        }
    };

    const handleReject = () => {
        router.post(route('sales.offers.reject', offer.id), {
            reason: rejectReason
        }, {
            onSuccess: () => setShowRejectModal(false)
        });
    };

    const handleConvertToOrder = () => {
        router.visit(route('sales.offers.convert-to-order', offer.id));
    };

    return (
        <Layout>
            <Head title={`Teklif: ${offer.offer_no}`} />

            <div className="page-content">
                <div className="container-fluid">
                    <Row className="mb-3">
                        <Col>
                            <div className="page-title-box d-sm-flex align-items-center justify-content-between">
                                <h4 className="mb-sm-0">Teklif Detayı: {offer.offer_no}</h4>
                                <div className="page-title-right">
                                    <Link href={route('sales.offers.index')}>
                                        <Button variant="secondary" size="sm" className="me-2">
                                            <i className="ri-arrow-left-line me-1"></i>
                                            Geri Dön
                                        </Button>
                                    </Link>
                                    <a href={route('sales.offers.pdf', offer.id)} target="_blank">
                                        <Button variant="outline-primary" size="sm">
                                            <i className="ri-file-pdf-line me-1"></i>
                                            PDF İndir
                                        </Button>
                                    </a>
                                </div>
                            </div>
                        </Col>
                    </Row>

                    <Row>
                        <Col lg={8}>
                            {/* Offer Info */}
                            <Card className="mb-3">
                                <Card.Header className="d-flex justify-content-between align-items-center">
                                    <h5 className="card-title mb-0">Teklif Bilgileri</h5>
                                    <Badge bg={statusColors[offer.status] || 'secondary'} className="fs-6">
                                        {statusLabels[offer.status] || offer.status}
                                    </Badge>
                                </Card.Header>
                                <Card.Body>
                                    <Row>
                                        <Col md={6}>
                                            <p className="mb-2"><strong>Teklif No:</strong> {offer.offer_no}</p>
                                            <p className="mb-2"><strong>Teklif Tarihi:</strong> {new Date(offer.offer_date).toLocaleDateString('tr-TR')}</p>
                                            <p className="mb-2"><strong>Geçerlilik:</strong> {new Date(offer.valid_until_date).toLocaleDateString('tr-TR')}</p>
                                        </Col>
                                        <Col md={6}>
                                            <p className="mb-2"><strong>Oluşturan:</strong> {offer.creator?.name || '-'}</p>
                                            <p className="mb-2"><strong>Satış Temsilcisi:</strong> {offer.sales_person?.name || '-'}</p>
                                            {offer.converted_order && (
                                                <p className="mb-2">
                                                    <strong>Sipariş:</strong>{' '}
                                                    <Link href={route('sales.orders.show', offer.converted_order.id)} className="text-primary">
                                                        {offer.converted_order.order_number || `#${offer.converted_order.id}`}
                                                    </Link>
                                                </p>
                                            )}
                                        </Col>
                                    </Row>
                                </Card.Body>
                            </Card>

                            {/* Customer Info */}
                            <Card className="mb-3">
                                <Card.Header>
                                    <h5 className="card-title mb-0">Müşteri Bilgileri</h5>
                                </Card.Header>
                                <Card.Body>
                                    <Row>
                                        <Col md={6}>
                                            <p className="mb-2"><strong>Müşteri:</strong> {offer.customer_display_name}</p>
                                            {offer.entity && (
                                                <p className="mb-2"><strong>Cari Kod:</strong> {offer.entity.entity_code}</p>
                                            )}
                                            {offer.customer_phone && (
                                                <p className="mb-2"><strong>Telefon:</strong> {offer.customer_phone}</p>
                                            )}
                                        </Col>
                                        <Col md={6}>
                                            {offer.customer_email && (
                                                <p className="mb-2"><strong>Email:</strong> {offer.customer_email}</p>
                                            )}
                                            {offer.customer_address && (
                                                <p className="mb-2"><strong>Adres:</strong> {offer.customer_address}</p>
                                            )}
                                        </Col>
                                    </Row>
                                </Card.Body>
                            </Card>

                            {/* Items */}
                            <Card className="mb-3">
                                <Card.Header>
                                    <h5 className="card-title mb-0">Ürünler</h5>
                                </Card.Header>
                                <Card.Body>
                                    <div className="table-responsive">
                                        <Table bordered hover className="mb-0">
                                            <thead className="table-light">
                                                <tr>
                                                    <th>Ürün</th>
                                                    <th className="text-end">Miktar</th>
                                                    <th className="text-end">Birim Fiyat</th>
                                                    <th className="text-end">İsk1%</th>
                                                    <th className="text-end">İsk2%</th>
                                                    <th className="text-end">İsk3%</th>
                                                    <th className="text-end">KDV %</th>
                                                    <th className="text-end">Toplam</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {offer.items.map((item, index) => (
                                                    <tr key={index}>
                                                        <td>
                                                            <div className="d-flex align-items-center gap-2">
                                                                {item.product?.images?.[0] ? (
                                                                    <Image
                                                                        src={`/storage/${item.product.images[0].image_path}`}
                                                                        rounded
                                                                        style={{ width: '50px', height: '50px', objectFit: 'cover' }}
                                                                    />
                                                                ) : (
                                                                    <div className="bg-light rounded d-flex align-items-center justify-content-center" style={{ width: '50px', height: '50px' }}>
                                                                        <i className="ri-image-line text-muted"></i>
                                                                    </div>
                                                                )}
                                                                <div>
                                                                    <div className="fw-medium">{item.product_display_name}</div>
                                                                    {item.product_code && (
                                                                        <small className="text-muted">Kod: {item.product_code}</small>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="text-end">
                                                            {item.quantity} {item.unit?.name || 'adet'}
                                                        </td>
                                                        <td className="text-end">
                                                            {formatPrice(item.unit_price)}
                                                        </td>
                                                        <td className="text-end">{item.discount_rate1 || 0}%</td>
                                                        <td className="text-end">{item.discount_rate2 || 0}%</td>
                                                        <td className="text-end">{item.discount_rate3 || 0}%</td>
                                                        <td className="text-end">{item.tax_rate}%</td>
                                                        <td className="text-end fw-medium">
                                                            {formatPrice(item.total_amount)}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </Table>
                                    </div>
                                </Card.Body>
                            </Card>

                            {/* Notes */}
                            {(offer.notes || offer.customer_notes) && (
                                <Card className="mb-3">
                                    <Card.Header>
                                        <h5 className="card-title mb-0">Notlar</h5>
                                    </Card.Header>
                                    <Card.Body>
                                        {offer.notes && (
                                            <div className="mb-3">
                                                <strong>İç Notlar:</strong>
                                                <p className="mb-0 mt-1">{offer.notes}</p>
                                            </div>
                                        )}
                                        {offer.customer_notes && (
                                            <div>
                                                <strong>Müşteri Notları:</strong>
                                                <p className="mb-0 mt-1">{offer.customer_notes}</p>
                                            </div>
                                        )}
                                    </Card.Body>
                                </Card>
                            )}

                            {/* Email History */}
                            {offer.email_logs && offer.email_logs.length > 0 && (
                                <Card className="mb-3">
                                    <Card.Header className="d-flex justify-content-between align-items-center">
                                        <h5 className="card-title mb-0">
                                            <i className="ri-mail-line me-2"></i>
                                            Email Gecmisi
                                        </h5>
                                        <Badge bg="info" pill>{offer.email_logs.length}</Badge>
                                    </Card.Header>
                                    <Card.Body>
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
                                                    {offer.email_logs.map((log) => (
                                                        <tr key={log.id}>
                                                            <td>{new Date(log.created_at).toLocaleString('tr-TR')}</td>
                                                            <td>{log.sent_to}</td>
                                                            <td>
                                                                {log.attachment_type === 'pdf' ? (
                                                                    <span><i className="ri-file-pdf-line text-danger me-1"></i>PDF</span>
                                                                ) : (
                                                                    <span><i className="ri-file-excel-line text-success me-1"></i>Excel</span>
                                                                )}
                                                            </td>
                                                            <td>{log.sender?.name || 'Sistem'}</td>
                                                            <td>
                                                                {log.status === 'sent' ? (
                                                                    <Badge bg="success">Gonderildi</Badge>
                                                                ) : (
                                                                    <Badge bg="danger" title={log.error_message || ''}>Basarisiz</Badge>
                                                                )}
                                                            </td>
                                                            <td>
                                                                {log.opened_at ? (
                                                                    <span title={`${log.open_count || 1}x acildi`}>
                                                                        <i className="ri-eye-line text-success me-1"></i>
                                                                        {new Date(log.opened_at).toLocaleString('tr-TR')}
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
                                    </Card.Body>
                                </Card>
                            )}
                        </Col>

                        <Col lg={4}>
                            {/* Summary */}
                            <Card className="mb-3 border-primary">
                                <Card.Header className="bg-primary text-white">
                                    <h5 className="card-title mb-0 text-white">Teklif Özeti</h5>
                                </Card.Header>
                                <Card.Body>
                                    {(() => {
                                        // Brüt toplam (iskontosuz)
                                        const grossTotal = offer.items.reduce((sum, item) => {
                                            return sum + (Number(item.quantity) * Number(item.unit_price));
                                        }, 0);
                                        // Kalem iskontolarının toplamı
                                        const itemDiscounts = offer.items.reduce((sum, item) => {
                                            return sum + Number(item.discount_amount || 0);
                                        }, 0);
                                        // Toplam iskonto (kalem + genel)
                                        const totalDiscount = itemDiscounts + Number(offer.discount_amount || 0);

                                        return (
                                            <>
                                                <div className="d-flex justify-content-between mb-2">
                                                    <span>Brüt Toplam:</span>
                                                    <strong>{formatPrice(grossTotal)}</strong>
                                                </div>
                                                {itemDiscounts > 0 && (
                                                    <div className="d-flex justify-content-between mb-2">
                                                        <span>Kalem İskontoları:</span>
                                                        <strong className="text-danger">-{formatPrice(itemDiscounts)}</strong>
                                                    </div>
                                                )}
                                                <div className="d-flex justify-content-between mb-2">
                                                    <span>Ara Toplam:</span>
                                                    <strong>{formatPrice(offer.subtotal)}</strong>
                                                </div>
                                                {Number(offer.discount_amount) > 0 && (
                                                    <div className="d-flex justify-content-between mb-2">
                                                        <span>Genel İskonto ({offer.discount_rate}%):</span>
                                                        <strong className="text-danger">-{formatPrice(offer.discount_amount)}</strong>
                                                    </div>
                                                )}
                                                {totalDiscount > 0 && (
                                                    <div className="d-flex justify-content-between mb-2 border-top pt-2">
                                                        <span className="fw-bold">Toplam İskonto:</span>
                                                        <strong className="text-danger">-{formatPrice(totalDiscount)}</strong>
                                                    </div>
                                                )}
                                                <div className="d-flex justify-content-between mb-2">
                                                    <span>KDV:</span>
                                                    <strong>{formatPrice(offer.tax_amount)}</strong>
                                                </div>
                                                <hr />
                                                <div className="d-flex justify-content-between">
                                                    <h5 className="mb-0">TOPLAM:</h5>
                                                    <h5 className="mb-0 text-primary">
                                                        {formatPrice(offer.total_amount)}
                                                    </h5>
                                                </div>
                                            </>
                                        );
                                    })()}
                                </Card.Body>
                            </Card>

                            {/* Email Summary */}
                            {offer.email_sent_count && offer.email_sent_count > 0 && (
                                <div className="alert alert-light border mb-3">
                                    <h6 className="mb-2">
                                        <i className="ri-mail-check-line text-success me-1"></i>
                                        Email Bilgisi
                                    </h6>
                                    <small>
                                        <div className="mb-1"><strong>Son Gonderim:</strong> {offer.email_sent_at ? new Date(offer.email_sent_at).toLocaleString('tr-TR') : '-'}</div>
                                        <div className="mb-1"><strong>Alici:</strong> {offer.email_sent_to}</div>
                                        <div><strong>Toplam Gonderim:</strong> {offer.email_sent_count}</div>
                                    </small>
                                </div>
                            )}

                            {/* Approval Tracking */}
                            {offer.approval_token && (
                                <Card className="mb-3">
                                    <Card.Header className={offer.customer_approved_at ? 'bg-success text-white' : offer.status === 'rejected' ? 'bg-danger text-white' : 'bg-warning'}>
                                        <h6 className={`card-title mb-0 ${offer.customer_approved_at || offer.status === 'rejected' ? 'text-white' : ''}`}>
                                            <i className={`me-1 ${offer.customer_approved_at ? 'ri-checkbox-circle-line' : offer.status === 'rejected' ? 'ri-close-circle-line' : 'ri-time-line'}`}></i>
                                            Musteri Onay Durumu
                                        </h6>
                                    </Card.Header>
                                    <Card.Body>
                                        {offer.customer_approved_at ? (
                                            <>
                                                <div className="d-flex align-items-center mb-2">
                                                    <Badge bg="success" className="me-2">Onaylandi</Badge>
                                                </div>
                                                <small>
                                                    <div className="mb-1"><strong>Onay Tarihi:</strong> {new Date(offer.customer_approved_at).toLocaleString('tr-TR')}</div>
                                                    {offer.customer_approved_ip && (
                                                        <div className="mb-1"><strong>IP Adresi:</strong> {offer.customer_approved_ip}</div>
                                                    )}
                                                    {offer.customer_approval_notes && (
                                                        <div className="mb-1"><strong>Musteri Notu:</strong> {offer.customer_approval_notes}</div>
                                                    )}
                                                </small>
                                            </>
                                        ) : offer.status === 'rejected' ? (
                                            <div className="d-flex align-items-center">
                                                <Badge bg="danger">Reddedildi</Badge>
                                            </div>
                                        ) : (
                                            <>
                                                <div className="d-flex align-items-center mb-2">
                                                    <Badge bg="warning" text="dark">Yanit Bekleniyor</Badge>
                                                </div>
                                                <small>
                                                    {offer.approval_token_expires_at && (
                                                        <div className="mb-1">
                                                            <strong>Link Gecerliligi:</strong>{' '}
                                                            {new Date(offer.approval_token_expires_at) < new Date() ? (
                                                                <span className="text-danger">Suresi dolmus</span>
                                                            ) : (
                                                                <span>{new Date(offer.approval_token_expires_at).toLocaleDateString('tr-TR')}</span>
                                                            )}
                                                        </div>
                                                    )}
                                                </small>
                                            </>
                                        )}
                                    </Card.Body>
                                </Card>
                            )}

                            {/* Actions */}
                            <Card>
                                <Card.Header>
                                    <h5 className="card-title mb-0">İşlemler</h5>
                                </Card.Header>
                                <Card.Body>
                                    <div className="d-grid gap-2">
                                        {offer.status === 'draft' && (
                                            <Link href={route('sales.offers.edit', offer.id)}>
                                                <Button variant="warning" className="w-100">
                                                    <i className="ri-edit-line me-1"></i>
                                                    Düzenle
                                                </Button>
                                            </Link>
                                        )}

                                        {offer.status !== 'converted_to_order' ? (
                                            <>
                                                <Button variant="info" onClick={handleSend}>
                                                    <i className="ri-mail-send-line me-1"></i>
                                                    Email Gönder
                                                </Button>
                                                {offer.email_sent_count && offer.email_sent_count > 0 && (
                                                    <Button variant="outline-warning" onClick={() => setShowReminderModal(true)}>
                                                        <i className="ri-notification-line me-1"></i>
                                                        Hatirlatma Gonder
                                                    </Button>
                                                )}
                                            </>
                                        ) : (
                                            <div className="alert alert-info mb-0 py-2 px-3 text-center small">
                                                <i className="ri-information-line me-1"></i>
                                                Siparişe dönüşen teklifler, sipariş detayından email olarak gönderilebilir.
                                            </div>
                                        )}

                                        {(offer.status === 'draft' || offer.status === 'sent') && (
                                            <>
                                                <Button variant="success" onClick={handleApprove}>
                                                    <i className="ri-check-line me-1"></i>
                                                    Onayla
                                                </Button>
                                                <Button variant="danger" onClick={() => setShowRejectModal(true)}>
                                                    <i className="ri-close-line me-1"></i>
                                                    Reddet
                                                </Button>
                                            </>
                                        )}

                                        {canConvert && (
                                            <Button variant="primary" onClick={handleConvertToOrder}>
                                                <i className="ri-shopping-cart-line me-1"></i>
                                                Siparişe Dönüştür
                                            </Button>
                                        )}

                                        <a href={route('sales.offers.pdf', offer.id)} target="_blank">
                                            <Button variant="outline-primary" className="w-100">
                                                <i className="ri-file-pdf-line me-1"></i>
                                                PDF Indir
                                            </Button>
                                        </a>

                                        <a href={route('sales.offers.excel', offer.id)} target="_blank">
                                            <Button variant="outline-success" className="w-100">
                                                <i className="ri-file-excel-line me-1"></i>
                                                Excel Indir
                                            </Button>
                                        </a>

                                        {offer.status !== 'converted_to_order' && (
                                            <Button
                                                variant="outline-danger"
                                                onClick={() => {
                                                    if (confirm('Bu teklifi silmek istediğinizden emin misiniz?')) {
                                                        router.delete(route('sales.offers.destroy', offer.id));
                                                    }
                                                }}
                                            >
                                                <i className="ri-delete-bin-line me-1"></i>
                                                Teklifi Sil
                                            </Button>
                                        )}
                                    </div>
                                </Card.Body>
                            </Card>
                        </Col>
                    </Row>
                </div>
            </div>

            {/* Reject Modal */}
            <Modal show={showRejectModal} onHide={() => setShowRejectModal(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>Teklifi Reddet</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form.Group>
                        <Form.Label>Red Nedeni *</Form.Label>
                        <Form.Control
                            as="textarea"
                            rows={4}
                            value={rejectReason}
                            onChange={e => setRejectReason(e.target.value)}
                            placeholder="Red nedenini yaziniz..."
                        />
                    </Form.Group>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowRejectModal(false)}>
                        Iptal
                    </Button>
                    <Button
                        variant="danger"
                        onClick={handleReject}
                        disabled={!rejectReason.trim()}
                    >
                        Reddet
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* Email Modal */}
            <Modal show={showEmailModal} onHide={() => setShowEmailModal(false)} size="lg">
                <Modal.Header closeButton>
                    <Modal.Title>
                        <i className="ri-mail-send-line me-2"></i>
                        Teklifi Email ile Gonder
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form.Group className="mb-3">
                        <Form.Label>Alici Email Adresi *</Form.Label>
                        <Form.Control
                            type="email"
                            value={emailForm.email}
                            onChange={e => setEmailForm({ ...emailForm, email: e.target.value })}
                            placeholder="ornek@sirket.com"
                        />
                    </Form.Group>

                    <Form.Group className="mb-3">
                        <Form.Label>Ek Dosya Formati *</Form.Label>
                        <div className="d-flex gap-3">
                            <Form.Check
                                type="radio"
                                id="format-pdf"
                                name="format"
                                label={
                                    <span>
                                        <i className="ri-file-pdf-line text-danger me-1"></i>
                                        PDF Dosyasi
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
                                        Excel Dosyasi
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
                            placeholder="Musteriye iletmek istediginiz mesaji yazin..."
                        />
                        <Form.Text className="text-muted">
                            Bu mesaj email iceriginde gosterilecektir.
                        </Form.Text>
                    </Form.Group>

                    <div className="alert alert-info mb-0">
                        <i className="ri-information-line me-2"></i>
                        <strong>Not:</strong> Email gonderildiginde musteri, teklifi onaylamak icin bir link alacaktir.
                        Bu link uzerinden teklifi goruntuleyebilir ve onaylayabilir.
                    </div>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowEmailModal(false)} disabled={emailSending}>
                        Iptal
                    </Button>
                    <Button
                        variant="primary"
                        onClick={handleSendEmail}
                        disabled={!emailForm.email || emailSending}
                    >
                        {emailSending ? (
                            <>
                                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                Gonderiliyor...
                            </>
                        ) : (
                            <>
                                <i className="ri-send-plane-line me-1"></i>
                                Gonder
                            </>
                        )}
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* Reminder Modal */}
            <Modal show={showReminderModal} onHide={() => setShowReminderModal(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>
                        <i className="ri-notification-line me-2"></i>
                        Hatirlatma Gonder
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <div className="alert alert-info mb-3">
                        <small>
                            <strong>Alici:</strong> {offer.customer_email || offer.entity?.entity_name || '-'}<br />
                            <strong>Son Gonderim:</strong> {offer.email_sent_at ? new Date(offer.email_sent_at).toLocaleString('tr-TR') : '-'}<br />
                            <strong>Toplam Gonderim:</strong> {offer.email_sent_count || 0}
                        </small>
                    </div>
                    <Form.Group className="mb-3">
                        <Form.Label>Hatirlatma Mesaji (Opsiyonel)</Form.Label>
                        <Form.Control
                            as="textarea"
                            rows={4}
                            value={reminderMessage}
                            onChange={e => setReminderMessage(e.target.value)}
                            placeholder="Bos birakirsaniz otomatik hatirlatma mesaji gonderilecektir..."
                        />
                    </Form.Group>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowReminderModal(false)} disabled={reminderSending}>
                        Iptal
                    </Button>
                    <Button variant="warning" onClick={handleSendReminder} disabled={reminderSending}>
                        {reminderSending ? (
                            <>
                                <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                                Gonderiliyor...
                            </>
                        ) : (
                            <>
                                <i className="ri-notification-line me-1"></i>
                                Hatirlatma Gonder
                            </>
                        )}
                    </Button>
                </Modal.Footer>
            </Modal>
        </Layout>
    );
}
