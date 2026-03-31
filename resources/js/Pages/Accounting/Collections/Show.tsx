import React from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { Card, Row, Col, Badge, Table, Button } from 'react-bootstrap';
import Layout from '../../../Layouts';

interface Collection {
    id: number;
    collection_number: string;
    collection_date: string;
    amount: number;
    currency: string;
    exchange_rate: number;
    amount_in_base_currency: number;
    commission_amount: number;
    commission_rate: number;
    net_amount: number;
    collection_type: string;
    status: string;
    due_date?: string;
    maturity_date?: string;
    reference_number?: string;
    document_number?: string;
    document_date?: string;
    description?: string;
    notes?: string;
    check_number?: string;
    check_bank?: string;
    check_branch?: string;
    check_account?: string;
    promissory_note_number?: string;
    promissory_note_guarantor?: string;
    is_advance_payment: boolean;
    invoice_numbers?: string[];
    installment_count: number;
    installment_amount?: number;
    approval_status: string;
    approved_at?: string;
    approval_notes?: string;
    is_reconciled: boolean;
    reconciled_at?: string;
    bank_statement_reference?: string;
    created_at: string;
    updated_at: string;
    current_account?: {
        id: number;
        account_code: string;
        title: string;
        account_type: string;
    };
    payment_method?: {
        id: number;
        name: string;
        type: string;
    };
    payment_term?: {
        id: number;
        name: string;
        days: number;
    };
    bank_account?: {
        id: number;
        account_name: string;
        bank_name: string;
        iban: string;
    };
    collector?: {
        id: number;
        name: string;
    };
    approver?: {
        id: number;
        name: string;
    };
    reconciler?: {
        id: number;
        name: string;
    };
    creator?: {
        id: number;
        name: string;
    };
    updater?: {
        id: number;
        name: string;
    };
    collection_type_text: string;
    status_text: string;
    status_color: string;
    formatted_amount: string;
    formatted_net_amount: string;
    is_overdue: boolean;
    is_maturity_today: boolean;
    is_maturity_soon: boolean;
}

interface PageProps {
    collection: Collection;
}

export default function Show() {
    const { collection } = usePage<PageProps>().props;

    const formatCurrency = (amount: number, currency: string = 'TRY') => {
        return new Intl.NumberFormat('tr-TR', {
            style: 'currency',
            currency: currency,
        }).format(amount);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('tr-TR');
    };

    const formatDateTime = (dateString: string) => {
        return new Date(dateString).toLocaleString('tr-TR');
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'collected':
                return '✅';
            case 'pending':
                return '⏳';
            case 'bounced':
                return '❌';
            case 'cancelled':
                return '🚫';
            default:
                return '•';
        }
    };

    const handleMarkAsCollected = () => {
        if (confirm('Bu tahsilatı tamamlandı olarak işaretlemek istediğinizden emin misiniz?')) {
            router.patch(route('accounting.collections.mark-collected', collection.id));
        }
    };

    const handleReconcile = () => {
        const reference = prompt('Banka ekstresindeki referans numarasını giriniz (opsiyonel):');
        if (reference !== null) {
            router.patch(route('accounting.collections.reconcile', collection.id), {
                bank_statement_reference: reference
            });
        }
    };

    const handleApprove = () => {
        const notes = prompt('Onay notları (opsiyonel):');
        if (notes !== null) {
            router.patch(route('accounting.collections.approve', collection.id), {
                approval_notes: notes
            });
        }
    };

    return (
        <Layout title={`Tahsilat Detayı - ${collection.collection_number}`}>
            <Head title={`Tahsilat Detayı - ${collection.collection_number}`} />
            <div className="page-content">
                <div className="container-fluid">
                    <div className="d-flex justify-content-between align-items-center mb-4">
                        <div>
                            <h1 className="h3 mb-0">Tahsilat Detayı</h1>
                            <p className="text-muted mb-0">{collection.collection_number}</p>
                        </div>
                        <div>
                            <Link
                                href={route('accounting.collections.index')}
                                className="btn btn-outline-secondary me-2"
                            >
                                <i className="fas fa-arrow-left"></i> Geri Dön
                            </Link>
                            {collection.status === 'pending' && (
                                <Button
                                    variant="success"
                                    onClick={handleMarkAsCollected}
                                    className="me-2"
                                >
                                    <i className="fas fa-check"></i> Tahsil Et
                                </Button>
                            )}
                            {collection.status === 'collected' && !collection.is_reconciled && (
                                <Button
                                    variant="info"
                                    onClick={handleReconcile}
                                    className="me-2"
                                >
                                    <i className="fas fa-handshake"></i> Mutabakat Yap
                                </Button>
                            )}
                            {collection.approval_status === 'pending' && (
                                <Button
                                    variant="primary"
                                    onClick={handleApprove}
                                    className="me-2"
                                >
                                    <i className="fas fa-thumbs-up"></i> Onayla
                                </Button>
                            )}
                            <Link
                                href={route('accounting.collections.edit', collection.id)}
                                className="btn btn-warning"
                            >
                                <i className="fas fa-edit"></i> Düzenle
                            </Link>
                        </div>
                    </div>

                    <Row>
                        <Col lg={8}>
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
                                                        <td className="fw-bold">Tahsilat No:</td>
                                                        <td>{collection.collection_number}</td>
                                                    </tr>
                                                    <tr>
                                                        <td className="fw-bold">Tahsilat Tarihi:</td>
                                                        <td>{formatDate(collection.collection_date)}</td>
                                                    </tr>
                                                    <tr>
                                                        <td className="fw-bold">Tahsilat Tipi:</td>
                                                        <td>
                                                            <Badge bg="info">{collection.collection_type_text}</Badge>
                                                        </td>
                                                    </tr>
                                                    <tr>
                                                        <td className="fw-bold">Durum:</td>
                                                        <td>
                                                            <Badge bg={collection.status_color}>
                                                                {getStatusIcon(collection.status)} {collection.status_text}
                                                            </Badge>
                                                        </td>
                                                    </tr>
                                                    {collection.due_date && (
                                                        <tr>
                                                            <td className="fw-bold">Vade Tarihi:</td>
                                                            <td>{formatDate(collection.due_date)}</td>
                                                        </tr>
                                                    )}
                                                    {collection.maturity_date && (
                                                        <tr>
                                                            <td className="fw-bold">Vade Sonu:</td>
                                                            <td>
                                                                {formatDate(collection.maturity_date)}
                                                                {collection.is_maturity_today && (
                                                                    <Badge bg="warning" className="ms-2">Bugün</Badge>
                                                                )}
                                                                {collection.is_overdue && (
                                                                    <Badge bg="danger" className="ms-2">Gecikmiş</Badge>
                                                                )}
                                                            </td>
                                                        </tr>
                                                    )}
                                                </tbody>
                                            </Table>
                                        </Col>
                                        <Col md={6}>
                                            <Table borderless>
                                                <tbody>
                                                    <tr>
                                                        <td className="fw-bold">Cari Hesap:</td>
                                                        <td>
                                                            {collection.current_account && (
                                                                <div>
                                                                    <div className="fw-bold">{collection.current_account.title}</div>
                                                                    <small className="text-muted">{collection.current_account.account_code}</small>
                                                                </div>
                                                            )}
                                                        </td>
                                                    </tr>
                                                    <tr>
                                                        <td className="fw-bold">Ödeme Yöntemi:</td>
                                                        <td>
                                                            {collection.payment_method && (
                                                                <span>{collection.payment_method.name}</span>
                                                            )}
                                                        </td>
                                                    </tr>
                                                    {collection.payment_term && (
                                                        <tr>
                                                            <td className="fw-bold">Ödeme Vadesi:</td>
                                                            <td>{collection.payment_term.name}</td>
                                                        </tr>
                                                    )}
                                                    {collection.bank_account && (
                                                        <tr>
                                                            <td className="fw-bold">Banka Hesabı:</td>
                                                            <td>
                                                                <div>{collection.bank_account.account_name}</div>
                                                                <small className="text-muted">
                                                                    {collection.bank_account.bank_name} - {collection.bank_account.iban}
                                                                </small>
                                                            </td>
                                                        </tr>
                                                    )}
                                                    <tr>
                                                        <td className="fw-bold">Tutar:</td>
                                                        <td className="fw-bold text-success">{collection.formatted_amount}</td>
                                                    </tr>
                                                    {collection.commission_amount > 0 && (
                                                        <tr>
                                                            <td className="fw-bold">Komisyon:</td>
                                                            <td className="text-warning">
                                                                {formatCurrency(collection.commission_amount, collection.currency)}
                                                                {collection.commission_rate > 0 && ` (${collection.commission_rate}%)`}
                                                            </td>
                                                        </tr>
                                                    )}
                                                    <tr>
                                                        <td className="fw-bold">Net Tutar:</td>
                                                        <td className="fw-bold text-primary">{collection.formatted_net_amount}</td>
                                                    </tr>
                                                </tbody>
                                            </Table>
                                        </Col>
                                    </Row>
                                </Card.Body>
                            </Card>

                            {/* Document Information */}
                            {(collection.reference_number || collection.document_number) && (
                                <Card className="mb-4">
                                    <Card.Header>
                                        <h6 className="mb-0">Belge Bilgileri</h6>
                                    </Card.Header>
                                    <Card.Body>
                                        <Row>
                                            <Col md={6}>
                                                {collection.reference_number && (
                                                    <div className="mb-2">
                                                        <strong>Referans No:</strong> {collection.reference_number}
                                                    </div>
                                                )}
                                                {collection.document_number && (
                                                    <div className="mb-2">
                                                        <strong>Belge No:</strong> {collection.document_number}
                                                    </div>
                                                )}
                                                {collection.document_date && (
                                                    <div className="mb-2">
                                                        <strong>Belge Tarihi:</strong> {formatDate(collection.document_date)}
                                                    </div>
                                                )}
                                            </Col>
                                            <Col md={6}>
                                                {collection.invoice_numbers && collection.invoice_numbers.length > 0 && (
                                                    <div className="mb-2">
                                                        <strong>Fatura Numaraları:</strong>
                                                        <div className="mt-1">
                                                            {collection.invoice_numbers.map((invoice, index) => (
                                                                <Badge key={index} bg="secondary" className="me-1">
                                                                    {invoice}
                                                                </Badge>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </Col>
                                        </Row>
                                    </Card.Body>
                                </Card>
                            )}

                            {/* Check/Promissory Note Information */}
                            {(collection.check_number || collection.promissory_note_number) && (
                                <Card className="mb-4">
                                    <Card.Header>
                                        <h6 className="mb-0">
                                            {collection.check_number ? 'Çek Bilgileri' : 'Senet Bilgileri'}
                                        </h6>
                                    </Card.Header>
                                    <Card.Body>
                                        <Row>
                                            <Col md={6}>
                                                {collection.check_number && (
                                                    <>
                                                        <div className="mb-2">
                                                            <strong>Çek No:</strong> {collection.check_number}
                                                        </div>
                                                        {collection.check_bank && (
                                                            <div className="mb-2">
                                                                <strong>Banka:</strong> {collection.check_bank}
                                                            </div>
                                                        )}
                                                    </>
                                                )}
                                                {collection.promissory_note_number && (
                                                    <div className="mb-2">
                                                        <strong>Senet No:</strong> {collection.promissory_note_number}
                                                    </div>
                                                )}
                                            </Col>
                                            <Col md={6}>
                                                {collection.check_branch && (
                                                    <div className="mb-2">
                                                        <strong>Şube:</strong> {collection.check_branch}
                                                    </div>
                                                )}
                                                {collection.check_account && (
                                                    <div className="mb-2">
                                                        <strong>Hesap:</strong> {collection.check_account}
                                                    </div>
                                                )}
                                                {collection.promissory_note_guarantor && (
                                                    <div className="mb-2">
                                                        <strong>Kefil:</strong> {collection.promissory_note_guarantor}
                                                    </div>
                                                )}
                                            </Col>
                                        </Row>
                                    </Card.Body>
                                </Card>
                            )}

                            {/* Description and Notes */}
                            {(collection.description || collection.notes) && (
                                <Card className="mb-4">
                                    <Card.Header>
                                        <h6 className="mb-0">Açıklamalar</h6>
                                    </Card.Header>
                                    <Card.Body>
                                        {collection.description && (
                                            <div className="mb-3">
                                                <strong>Açıklama:</strong>
                                                <p className="mt-1 mb-0">{collection.description}</p>
                                            </div>
                                        )}
                                        {collection.notes && (
                                            <div>
                                                <strong>Notlar:</strong>
                                                <p className="mt-1 mb-0">{collection.notes}</p>
                                            </div>
                                        )}
                                    </Card.Body>
                                </Card>
                            )}
                        </Col>

                        <Col lg={4}>
                            {/* Status Information */}
                            <Card className="mb-4">
                                <Card.Header>
                                    <h6 className="mb-0">Durum Bilgileri</h6>
                                </Card.Header>
                                <Card.Body>
                                    <div className="mb-3">
                                        <Badge bg={collection.status_color} className="fs-6">
                                            {getStatusIcon(collection.status)} {collection.status_text}
                                        </Badge>
                                    </div>

                                    <div className="mb-2">
                                        <strong>Onay Durumu:</strong>
                                        <Badge 
                                            bg={collection.approval_status === 'approved' ? 'success' : 
                                                collection.approval_status === 'rejected' ? 'danger' : 'warning'} 
                                            className="ms-2"
                                        >
                                            {collection.approval_status === 'approved' ? 'Onaylandı' :
                                             collection.approval_status === 'rejected' ? 'Reddedildi' : 'Bekliyor'}
                                        </Badge>
                                    </div>

                                    {collection.approver && collection.approved_at && (
                                        <>
                                            <div className="mb-2">
                                                <strong>Onaylayan:</strong> {collection.approver.name}
                                            </div>
                                            <div className="mb-2">
                                                <strong>Onay Tarihi:</strong> {formatDateTime(collection.approved_at)}
                                            </div>
                                        </>
                                    )}

                                    {collection.approval_notes && (
                                        <div className="mb-3">
                                            <strong>Onay Notları:</strong>
                                            <p className="mt-1 mb-0">{collection.approval_notes}</p>
                                        </div>
                                    )}

                                    <div className="mb-2">
                                        <strong>Mutabakat:</strong>
                                        <Badge bg={collection.is_reconciled ? 'success' : 'warning'} className="ms-2">
                                            {collection.is_reconciled ? 'Yapıldı' : 'Bekliyor'}
                                        </Badge>
                                    </div>

                                    {collection.is_reconciled && collection.reconciled_at && (
                                        <>
                                            <div className="mb-2">
                                                <strong>Mutabakat Tarihi:</strong> {formatDateTime(collection.reconciled_at)}
                                            </div>
                                            {collection.reconciler && (
                                                <div className="mb-2">
                                                    <strong>Mutabakat Yapan:</strong> {collection.reconciler.name}
                                                </div>
                                            )}
                                            {collection.bank_statement_reference && (
                                                <div className="mb-2">
                                                    <strong>Banka Ref:</strong> {collection.bank_statement_reference}
                                                </div>
                                            )}
                                        </>
                                    )}

                                    {collection.is_advance_payment && (
                                        <div className="mt-3">
                                            <Badge bg="info">Avans Ödemesi</Badge>
                                        </div>
                                    )}

                                    {collection.installment_count > 1 && (
                                        <div className="mt-3">
                                            <div className="mb-2">
                                                <strong>Taksit Sayısı:</strong> {collection.installment_count}
                                            </div>
                                            {collection.installment_amount && (
                                                <div className="mb-2">
                                                    <strong>Taksit Tutarı:</strong> {formatCurrency(collection.installment_amount, collection.currency)}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </Card.Body>
                            </Card>

                            {/* Exchange Rate Information */}
                            {collection.currency !== 'TRY' && (
                                <Card className="mb-4">
                                    <Card.Header>
                                        <h6 className="mb-0">Kur Bilgileri</h6>
                                    </Card.Header>
                                    <Card.Body>
                                        <div className="mb-2">
                                            <strong>Para Birimi:</strong> {collection.currency}
                                        </div>
                                        <div className="mb-2">
                                            <strong>Kur:</strong> {collection.exchange_rate.toFixed(6)}
                                        </div>
                                        <div className="mb-2">
                                            <strong>TL Karşılığı:</strong> {formatCurrency(collection.amount_in_base_currency, 'TRY')}
                                        </div>
                                    </Card.Body>
                                </Card>
                            )}

                            {/* System Information */}
                            <Card>
                                <Card.Header>
                                    <h6 className="mb-0">Sistem Bilgileri</h6>
                                </Card.Header>
                                <Card.Body>
                                    {collection.creator && (
                                        <div className="mb-2">
                                            <strong>Oluşturan:</strong> {collection.creator.name}
                                        </div>
                                    )}
                                    <div className="mb-2">
                                        <strong>Oluşturma Tarihi:</strong> {formatDateTime(collection.created_at)}
                                    </div>
                                    <div className="mb-2">
                                        <strong>Güncelleme Tarihi:</strong> {formatDateTime(collection.updated_at)}
                                    </div>
                                    {collection.updater && (
                                        <div className="mb-2">
                                            <strong>Güncelleyen:</strong> {collection.updater.name}
                                        </div>
                                    )}
                                    {collection.collector && (
                                        <div className="mb-2">
                                            <strong>Tahsil Eden:</strong> {collection.collector.name}
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