import React, { useState } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { Card, Row, Col, Badge, Table, Button, Modal, Form, Alert } from 'react-bootstrap';
import Layout from '../../../Layouts';

interface Payment {
    id: number;
    payment_number: string;
    current_account_id: number;
    bank_account_id: number;
    payment_method_id: number;
    amount: number;
    currency: string;
    exchange_rate: number;
    amount_in_base_currency: number;
    commission_rate: number;
    commission_amount: number;
    bank_fees: number;
    net_amount: number;
    payment_date: string;
    due_date?: string;
    value_date?: string;
    reference_number?: string;
    document_number?: string;
    description?: string;
    notes?: string;
    status: string;
    approval_status: string;
    is_reconciled: boolean;
    is_overdue: boolean;
    days_overdue: number;
    reconciled_at?: string;
    approved_at?: string;
    paid_at?: string;
    status_text: string;
    approval_status_text: string;
    status_badge_color: string;
    formatted_amount: string;
    formatted_net_amount: string;
    can_edit: boolean;
    can_delete: boolean;
    can_approve: boolean;
    can_pay: boolean;
    can_reconcile: boolean;
    current_account: {
        id: number;
        title: string;
        account_code: string;
        account_type: string;
    };
    bank_account: {
        id: number;
        account_name: string;
        bank_name: string;
        currency: string;
    };
    payment_method: {
        id: number;
        name: string;
    };
    payment_term?: {
        id: number;
        name: string;
        days: number;
    };
    created_by?: {
        id: number;
        name: string;
    };
    updated_by?: {
        id: number;
        name: string;
    };
    approved_by?: {
        id: number;
        name: string;
    };
    reconciled_by?: {
        id: number;
        name: string;
    };
    paid_by?: {
        id: number;
        name: string;
    };
    created_at: string;
    updated_at: string;
}

interface PageProps {
    payment: Payment;
}

export default function Show() {
    const { payment } = usePage<PageProps>().props;
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [showBouncedModal, setShowBouncedModal] = useState(false);
    const [showPaidModal, setShowPaidModal] = useState(false);
    const [rejectReason, setRejectReason] = useState('');
    const [bouncedReason, setBouncedReason] = useState('');
    const [paidDate, setPaidDate] = useState(new Date().toISOString().split('T')[0]);
    const [paidNotes, setPaidNotes] = useState('');

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('tr-TR');
    };

    const formatDateTime = (dateString: string) => {
        return new Date(dateString).toLocaleString('tr-TR');
    };

    const formatCurrency = (amount: number, currency: string) => {
        return new Intl.NumberFormat('tr-TR', {
            style: 'decimal',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(amount) + ' ' + currency;
    };

    const getCurrencyFlag = (currency: string) => {
        switch (currency) {
            case 'TRY': return '🇹🇷';
            case 'USD': return '🇺🇸';
            case 'EUR': return '🇪🇺';
            case 'GBP': return '🇬🇧';
            default: return '💰';
        }
    };

    const handleApprove = () => {
        if (confirm('Bu ödemeyi onaylamak istediğinizden emin misiniz?')) {
            router.patch(route('accounting.payments.approve', payment.id));
        }
    };

    const handleReject = () => {
        if (rejectReason.trim()) {
            router.patch(route('accounting.payments.reject', payment.id), {
                reason: rejectReason
            });
            setShowRejectModal(false);
            setRejectReason('');
        }
    };

    const handleMarkAsPaid = () => {
        router.patch(route('accounting.payments.mark-paid', payment.id), {
            paid_date: paidDate,
            notes: paidNotes
        });
        setShowPaidModal(false);
    };

    const handleMarkAsBounced = () => {
        if (bouncedReason.trim()) {
            router.patch(route('accounting.payments.mark-bounced', payment.id), {
                reason: bouncedReason
            });
            setShowBouncedModal(false);
            setBouncedReason('');
        }
    };

    const handleReconcile = () => {
        if (confirm('Bu ödeme için mutabakat yapmak istediğinizden emin misiniz?')) {
            router.patch(route('accounting.payments.reconcile', payment.id));
        }
    };

    const handleDelete = () => {
        if (confirm('Bu ödemeyi silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.')) {
            router.delete(route('accounting.payments.destroy', payment.id));
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text).then(() => {
            alert('Panoya kopyalandı!');
        });
    };

    return (
        <Layout title={`Ödeme - ${payment.payment_number}`}>
            <Head title={`Ödeme - ${payment.payment_number}`} />
            <div className="page-content">
                <div className="container-fluid">
                    <div className="d-flex justify-content-between align-items-center mb-4">
                        <div>
                            <h1 className="h3 mb-0">Ödeme Detayı</h1>
                            <p className="text-muted mb-0">{payment.payment_number}</p>
                        </div>
                        <div>
                            <Link
                                href={route('accounting.payments.index')}
                                className="btn btn-outline-secondary me-2"
                            >
                                <i className="fas fa-arrow-left"></i> Geri Dön
                            </Link>

                            {payment.can_edit && (
                                <Link
                                    href={route('accounting.payments.edit', payment.id)}
                                    className="btn btn-primary me-2"
                                >
                                    <i className="fas fa-edit"></i> Düzenle
                                </Link>
                            )}

                            {payment.can_approve && (
                                <Button
                                    variant="success"
                                    onClick={handleApprove}
                                    className="me-2"
                                >
                                    <i className="fas fa-check"></i> Onayla
                                </Button>
                            )}

                            {payment.status === 'pending' && payment.approval_status === 'pending' && (
                                <Button
                                    variant="warning"
                                    onClick={() => setShowRejectModal(true)}
                                    className="me-2"
                                >
                                    <i className="fas fa-times"></i> Reddet
                                </Button>
                            )}

                            {payment.can_pay && (
                                <Button
                                    variant="info"
                                    onClick={() => setShowPaidModal(true)}
                                    className="me-2"
                                >
                                    <i className="fas fa-money-bill-wave"></i> Ödenmiş İşaretle
                                </Button>
                            )}

                            {payment.status === 'paid' && (
                                <Button
                                    variant="outline-warning"
                                    onClick={() => setShowBouncedModal(true)}
                                    className="me-2"
                                >
                                    <i className="fas fa-undo"></i> İade Et
                                </Button>
                            )}

                            {payment.can_reconcile && (
                                <Button
                                    variant="secondary"
                                    onClick={handleReconcile}
                                    className="me-2"
                                >
                                    <i className="fas fa-handshake"></i> Mutabakat
                                </Button>
                            )}

                            {payment.can_delete && (
                                <Button
                                    variant="danger"
                                    onClick={handleDelete}
                                >
                                    <i className="fas fa-trash"></i> Sil
                                </Button>
                            )}
                        </div>
                    </div>

                    <Row>
                        <Col lg={8}>
                            {/* Status Alerts */}
                            {payment.is_overdue && (
                                <Alert variant="danger" className="mb-4">
                                    <i className="fas fa-exclamation-triangle me-2"></i>
                                    <strong>Vadesi Geçmiş:</strong> Bu ödeme {payment.days_overdue} gün önce vadesi geçmiştir.
                                </Alert>
                            )}

                            {payment.is_reconciled && (
                                <Alert variant="success" className="mb-4">
                                    <i className="fas fa-check-circle me-2"></i>
                                    <strong>Mutabakat Tamamlandı:</strong> Bu ödeme için mutabakat {formatDateTime(payment.reconciled_at!)} tarihinde tamamlanmıştır.
                                </Alert>
                            )}

                            {/* Basic Information */}
                            <Card className="mb-4">
                                <Card.Header>
                                    <h6 className="mb-0">Temel Bilgiler</h6>
                                </Card.Header>
                                <Card.Body>
                                    <Row>
                                        <Col md={6}>
                                            <Table borderless>
                                                <tbody>
                                                    <tr>
                                                        <td className="fw-bold">Ödeme Numarası:</td>
                                                        <td>
                                                            {payment.payment_number}
                                                            <Button
                                                                variant="outline-secondary"
                                                                size="sm"
                                                                className="ms-2"
                                                                onClick={() => copyToClipboard(payment.payment_number)}
                                                            >
                                                                <i className="ri ri-file-copy-line"></i>
                                                            </Button>
                                                        </td>
                                                    </tr>
                                                    <tr>
                                                        <td className="fw-bold">Cari Hesap:</td>
                                                        <td>
                                                            <Link
                                                                href={route('accounting.current-accounts.show', payment.current_account.id)}
                                                                className="text-decoration-none"
                                                            >
                                                                {payment.current_account.title}
                                                            </Link>
                                                            <br />
                                                            <small className="text-muted">{payment.current_account.account_code}</small>
                                                        </td>
                                                    </tr>
                                                    <tr>
                                                        <td className="fw-bold">Banka Hesabı:</td>
                                                        <td>
                                                            <Link
                                                                href={route('accounting.bank-accounts.show', payment.bank_account.id)}
                                                                className="text-decoration-none"
                                                            >
                                                                {payment.bank_account.account_name}
                                                            </Link>
                                                            <br />
                                                            <small className="text-muted">{payment.bank_account.bank_name}</small>
                                                        </td>
                                                    </tr>
                                                    <tr>
                                                        <td className="fw-bold">Ödeme Yöntemi:</td>
                                                        <td>{payment.payment_method.name}</td>
                                                    </tr>
                                                    {payment.payment_term && (
                                                        <tr>
                                                            <td className="fw-bold">Ödeme Vadesi:</td>
                                                            <td>{payment.payment_term.name} ({payment.payment_term.days} gün)</td>
                                                        </tr>
                                                    )}
                                                </tbody>
                                            </Table>
                                        </Col>
                                        <Col md={6}>
                                            <Table borderless>
                                                <tbody>
                                                    <tr>
                                                        <td className="fw-bold">Durum:</td>
                                                        <td>
                                                            <Badge bg={payment.status_badge_color}>
                                                                {payment.status_text}
                                                            </Badge>
                                                        </td>
                                                    </tr>
                                                    <tr>
                                                        <td className="fw-bold">Onay Durumu:</td>
                                                        <td>
                                                            <Badge bg={
                                                                payment.approval_status === 'approved' ? 'success' :
                                                                payment.approval_status === 'rejected' ? 'danger' : 'warning'
                                                            }>
                                                                {payment.approval_status_text}
                                                            </Badge>
                                                        </td>
                                                    </tr>
                                                    <tr>
                                                        <td className="fw-bold">Mutabakat:</td>
                                                        <td>
                                                            <Badge bg={payment.is_reconciled ? 'success' : 'secondary'}>
                                                                {payment.is_reconciled ? '✅ Yapıldı' : '❌ Yapılmadı'}
                                                            </Badge>
                                                        </td>
                                                    </tr>
                                                    {payment.reference_number && (
                                                        <tr>
                                                            <td className="fw-bold">Referans No:</td>
                                                            <td>{payment.reference_number}</td>
                                                        </tr>
                                                    )}
                                                    {payment.document_number && (
                                                        <tr>
                                                            <td className="fw-bold">Belge No:</td>
                                                            <td>{payment.document_number}</td>
                                                        </tr>
                                                    )}
                                                </tbody>
                                            </Table>
                                        </Col>
                                    </Row>
                                </Card.Body>
                            </Card>

                            {/* Amount Details */}
                            <Card className="mb-4">
                                <Card.Header>
                                    <h6 className="mb-0">Tutar Detayları</h6>
                                </Card.Header>
                                <Card.Body>
                                    <Row>
                                        <Col md={6}>
                                            <Table borderless>
                                                <tbody>
                                                    <tr>
                                                        <td className="fw-bold">Brüt Tutar:</td>
                                                        <td className="text-end">
                                                            <span className="h5 text-primary">
                                                                {getCurrencyFlag(payment.currency)} {payment.formatted_amount}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                    {payment.commission_amount > 0 && (
                                                        <tr>
                                                            <td className="fw-bold">
                                                                Komisyon ({payment.commission_rate}%):
                                                            </td>
                                                            <td className="text-end text-warning">
                                                                -{formatCurrency(payment.commission_amount, payment.currency)}
                                                            </td>
                                                        </tr>
                                                    )}
                                                    {payment.bank_fees > 0 && (
                                                        <tr>
                                                            <td className="fw-bold">Banka Masrafları:</td>
                                                            <td className="text-end text-warning">
                                                                -{formatCurrency(payment.bank_fees, payment.currency)}
                                                            </td>
                                                        </tr>
                                                    )}
                                                    <tr className="border-top">
                                                        <td className="fw-bold">Net Tutar:</td>
                                                        <td className="text-end">
                                                            <span className="h5 text-success">
                                                                {payment.formatted_net_amount}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                </tbody>
                                            </Table>
                                        </Col>
                                        <Col md={6}>
                                            <Table borderless>
                                                <tbody>
                                                    <tr>
                                                        <td className="fw-bold">Para Birimi:</td>
                                                        <td className="text-end">
                                                            {getCurrencyFlag(payment.currency)} {payment.currency}
                                                        </td>
                                                    </tr>
                                                    {payment.currency !== 'TRY' && (
                                                        <>
                                                            <tr>
                                                                <td className="fw-bold">Döviz Kuru:</td>
                                                                <td className="text-end">{payment.exchange_rate}</td>
                                                            </tr>
                                                            <tr>
                                                                <td className="fw-bold">TL Karşılığı:</td>
                                                                <td className="text-end">
                                                                    🇹🇷 {formatCurrency(payment.amount_in_base_currency, 'TRY')}
                                                                </td>
                                                            </tr>
                                                        </>
                                                    )}
                                                </tbody>
                                            </Table>
                                        </Col>
                                    </Row>
                                </Card.Body>
                            </Card>

                            {/* Date Information */}
                            <Card className="mb-4">
                                <Card.Header>
                                    <h6 className="mb-0">Tarih Bilgileri</h6>
                                </Card.Header>
                                <Card.Body>
                                    <Row>
                                        <Col md={6}>
                                            <Table borderless>
                                                <tbody>
                                                    <tr>
                                                        <td className="fw-bold">Ödeme Tarihi:</td>
                                                        <td>{formatDate(payment.payment_date)}</td>
                                                    </tr>
                                                    {payment.due_date && (
                                                        <tr>
                                                            <td className="fw-bold">Vade Tarihi:</td>
                                                            <td className={payment.is_overdue ? 'text-danger' : ''}>
                                                                {formatDate(payment.due_date)}
                                                                {payment.is_overdue && (
                                                                    <span className="badge bg-danger ms-2">
                                                                        {payment.days_overdue} gün geçmiş
                                                                    </span>
                                                                )}
                                                            </td>
                                                        </tr>
                                                    )}
                                                    {payment.value_date && (
                                                        <tr>
                                                            <td className="fw-bold">Valör Tarihi:</td>
                                                            <td>{formatDate(payment.value_date)}</td>
                                                        </tr>
                                                    )}
                                                </tbody>
                                            </Table>
                                        </Col>
                                        <Col md={6}>
                                            <Table borderless>
                                                <tbody>
                                                    {payment.approved_at && (
                                                        <tr>
                                                            <td className="fw-bold">Onay Tarihi:</td>
                                                            <td>{formatDateTime(payment.approved_at)}</td>
                                                        </tr>
                                                    )}
                                                    {payment.paid_at && (
                                                        <tr>
                                                            <td className="fw-bold">Ödenme Tarihi:</td>
                                                            <td>{formatDateTime(payment.paid_at)}</td>
                                                        </tr>
                                                    )}
                                                    {payment.reconciled_at && (
                                                        <tr>
                                                            <td className="fw-bold">Mutabakat Tarihi:</td>
                                                            <td>{formatDateTime(payment.reconciled_at)}</td>
                                                        </tr>
                                                    )}
                                                </tbody>
                                            </Table>
                                        </Col>
                                    </Row>
                                </Card.Body>
                            </Card>

                            {/* Description and Notes */}
                            {(payment.description || payment.notes) && (
                                <Card className="mb-4">
                                    <Card.Header>
                                        <h6 className="mb-0">Açıklama ve Notlar</h6>
                                    </Card.Header>
                                    <Card.Body>
                                        {payment.description && (
                                            <div className="mb-3">
                                                <strong>Açıklama:</strong>
                                                <p className="mt-2">{payment.description}</p>
                                            </div>
                                        )}
                                        {payment.notes && (
                                            <div>
                                                <strong>Notlar:</strong>
                                                <p className="mt-2 bg-light p-3 rounded">{payment.notes}</p>
                                            </div>
                                        )}
                                    </Card.Body>
                                </Card>
                            )}
                        </Col>

                        <Col lg={4}>
                            {/* Quick Actions */}
                            <Card className="mb-4">
                                <Card.Header>
                                    <h6 className="mb-0">Hızlı İşlemler</h6>
                                </Card.Header>
                                <Card.Body>
                                    <div className="d-grid gap-2">
                                        <Button
                                            variant="outline-primary"
                                            onClick={() => copyToClipboard(payment.payment_number)}
                                        >
                                            <i className="ri ri-file-copy-line"></i> Ödeme No'yu Kopyala
                                        </Button>
                                        {payment.reference_number && (
                                            <Button
                                                variant="outline-primary"
                                                onClick={() => copyToClipboard(payment.reference_number!)}
                                            >
                                                <i className="ri ri-file-copy-line"></i> Referans No'yu Kopyala
                                            </Button>
                                        )}
                                        <hr />
                                        <Link
                                            href={route('accounting.payments.create', { current_account_id: payment.current_account.id })}
                                            className="btn btn-success"
                                        >
                                            <i className="fas fa-plus"></i> Bu Cariye Yeni Ödeme
                                        </Link>
                                    </div>
                                </Card.Body>
                            </Card>

                            {/* User Information */}
                            <Card>
                                <Card.Header>
                                    <h6 className="mb-0">Kullanıcı Bilgileri</h6>
                                </Card.Header>
                                <Card.Body>
                                    {payment.created_by && (
                                        <div className="mb-2">
                                            <strong>Oluşturan:</strong> {payment.created_by.name}
                                            <br />
                                            <small className="text-muted">{formatDateTime(payment.created_at)}</small>
                                        </div>
                                    )}
                                    {payment.updated_by && (
                                        <div className="mb-2">
                                            <strong>Güncelleyen:</strong> {payment.updated_by.name}
                                            <br />
                                            <small className="text-muted">{formatDateTime(payment.updated_at)}</small>
                                        </div>
                                    )}
                                    {payment.approved_by && (
                                        <div className="mb-2">
                                            <strong>Onaylayan:</strong> {payment.approved_by.name}
                                            <br />
                                            <small className="text-muted">{formatDateTime(payment.approved_at!)}</small>
                                        </div>
                                    )}
                                    {payment.paid_by && (
                                        <div className="mb-2">
                                            <strong>Ödemeyi İşaretleyen:</strong> {payment.paid_by.name}
                                            <br />
                                            <small className="text-muted">{formatDateTime(payment.paid_at!)}</small>
                                        </div>
                                    )}
                                    {payment.reconciled_by && (
                                        <div className="mb-2">
                                            <strong>Mutabakat Yapan:</strong> {payment.reconciled_by.name}
                                            <br />
                                            <small className="text-muted">{formatDateTime(payment.reconciled_at!)}</small>
                                        </div>
                                    )}
                                    <div className="mt-3">
                                        <strong>Ödeme ID:</strong> #{payment.id}
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
                    <Modal.Title>Ödemeyi Reddet</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form.Group>
                        <Form.Label>Red Nedeni <span className="text-danger">*</span></Form.Label>
                        <Form.Control
                            as="textarea"
                            rows={3}
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                            placeholder="Red nedenini açıklayın..."
                        />
                    </Form.Group>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowRejectModal(false)}>
                        İptal
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

            {/* Bounced Modal */}
            <Modal show={showBouncedModal} onHide={() => setShowBouncedModal(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>Ödemeyi İade Et</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form.Group>
                        <Form.Label>İade Nedeni <span className="text-danger">*</span></Form.Label>
                        <Form.Control
                            as="textarea"
                            rows={3}
                            value={bouncedReason}
                            onChange={(e) => setBouncedReason(e.target.value)}
                            placeholder="İade nedenini açıklayın..."
                        />
                    </Form.Group>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowBouncedModal(false)}>
                        İptal
                    </Button>
                    <Button
                        variant="warning"
                        onClick={handleMarkAsBounced}
                        disabled={!bouncedReason.trim()}
                    >
                        İade Et
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* Paid Modal */}
            <Modal show={showPaidModal} onHide={() => setShowPaidModal(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>Ödemeyi Ödenmiş İşaretle</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form.Group className="mb-3">
                        <Form.Label>Ödenme Tarihi</Form.Label>
                        <Form.Control
                            type="date"
                            value={paidDate}
                            onChange={(e) => setPaidDate(e.target.value)}
                        />
                    </Form.Group>
                    <Form.Group>
                        <Form.Label>Notlar</Form.Label>
                        <Form.Control
                            as="textarea"
                            rows={3}
                            value={paidNotes}
                            onChange={(e) => setPaidNotes(e.target.value)}
                            placeholder="Ek notlar..."
                        />
                    </Form.Group>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowPaidModal(false)}>
                        İptal
                    </Button>
                    <Button variant="success" onClick={handleMarkAsPaid}>
                        Ödenmiş İşaretle
                    </Button>
                </Modal.Footer>
            </Modal>
        </Layout>
    );
}
