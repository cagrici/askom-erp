import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import { Card, Row, Col, Button, Table, Badge, Form, Alert } from 'react-bootstrap';

interface OfferItem {
    id: number;
    product_name: string;
    product_code?: string;
    quantity: number;
    unit_price: number;
    discount_rate: number;
    tax_rate: number;
    total_amount: number;
    unit?: {
        name: string;
    };
}

interface Offer {
    id: number;
    offer_no: string;
    offer_date: string;
    valid_until_date: string;
    status: string;
    customer_display_name: string;
    subtotal: number;
    discount_rate: number;
    discount_amount: number;
    tax_rate: number;
    tax_amount: number;
    total_amount: number;
    currency?: {
        cur_code: string;
        cur_symbol: string;
    };
    customer_notes?: string;
    terms_conditions?: string;
    items: OfferItem[];
}

interface Props {
    offer: Offer | null;
    canApprove: boolean;
    error?: string;
    token: string;
}

const statusLabels: Record<string, string> = {
    draft: 'Taslak',
    sent: 'Gonderildi',
    accepted: 'Kabul Edildi',
    approved: 'Onaylandi',
    rejected: 'Reddedildi',
    converted_to_order: 'Siparise Donusturuldu',
    expired: 'Suresi Doldu'
};

const statusColors: Record<string, string> = {
    draft: 'secondary',
    sent: 'info',
    accepted: 'success',
    approved: 'success',
    rejected: 'danger',
    converted_to_order: 'primary',
    expired: 'warning'
};

export default function OfferApproval({ offer, canApprove, error, token }: Props) {
    const [approvalNotes, setApprovalNotes] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleApprove = () => {
        setIsSubmitting(true);
        router.post(route('offers.public.approve.submit', { token }), {
            notes: approvalNotes,
        }, {
            onError: () => setIsSubmitting(false),
        });
    };

    const currencySymbol = offer?.currency?.cur_symbol || offer?.currency?.cur_code || 'TL';

    if (!offer) {
        return (
            <div className="min-vh-100 bg-light d-flex align-items-center justify-content-center">
                <Head title="Teklif Bulunamadi" />
                <Card className="shadow-sm" style={{ maxWidth: '500px' }}>
                    <Card.Body className="text-center p-5">
                        <i className="ri-error-warning-line text-danger" style={{ fontSize: '4rem' }}></i>
                        <h4 className="mt-3">Teklif Bulunamadi</h4>
                        <p className="text-muted">{error || 'Gecersiz veya suresi dolmus link.'}</p>
                    </Card.Body>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-vh-100 bg-light py-5">
            <Head title={`Teklif: ${offer.offer_no}`} />

            <div className="container">
                {/* Header */}
                <div className="text-center mb-4">
                    <h2 className="mb-2">Satis Teklifi</h2>
                    <p className="text-muted">Teklif No: <strong>{offer.offer_no}</strong></p>
                </div>

                {error && (
                    <Alert variant="warning" className="mb-4">
                        <i className="ri-information-line me-2"></i>
                        {error}
                    </Alert>
                )}

                <Row>
                    <Col lg={8}>
                        {/* Offer Info */}
                        <Card className="mb-4 shadow-sm">
                            <Card.Header className="d-flex justify-content-between align-items-center bg-white">
                                <h5 className="mb-0">Teklif Bilgileri</h5>
                                <Badge bg={statusColors[offer.status] || 'secondary'}>
                                    {statusLabels[offer.status] || offer.status}
                                </Badge>
                            </Card.Header>
                            <Card.Body>
                                <Row>
                                    <Col md={6}>
                                        <p className="mb-2">
                                            <span className="text-muted">Musteri:</span><br />
                                            <strong>{offer.customer_display_name}</strong>
                                        </p>
                                        <p className="mb-2">
                                            <span className="text-muted">Teklif Tarihi:</span><br />
                                            <strong>{new Date(offer.offer_date).toLocaleDateString('tr-TR')}</strong>
                                        </p>
                                    </Col>
                                    <Col md={6}>
                                        <p className="mb-2">
                                            <span className="text-muted">Gecerlilik Tarihi:</span><br />
                                            <strong>{new Date(offer.valid_until_date).toLocaleDateString('tr-TR')}</strong>
                                        </p>
                                    </Col>
                                </Row>
                            </Card.Body>
                        </Card>

                        {/* Items */}
                        <Card className="mb-4 shadow-sm">
                            <Card.Header className="bg-white">
                                <h5 className="mb-0">Urunler</h5>
                            </Card.Header>
                            <Card.Body className="p-0">
                                <div className="table-responsive">
                                    <Table className="mb-0">
                                        <thead className="table-light">
                                            <tr>
                                                <th>Urun</th>
                                                <th className="text-end">Miktar</th>
                                                <th className="text-end">Birim Fiyat</th>
                                                <th className="text-end">Toplam</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {offer.items.map((item) => (
                                                <tr key={item.id}>
                                                    <td>
                                                        <div>
                                                            <strong>{item.product_name}</strong>
                                                            {item.product_code && (
                                                                <div className="small text-muted">Kod: {item.product_code}</div>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="text-end">
                                                        {item.quantity} {item.unit?.name || 'Adet'}
                                                    </td>
                                                    <td className="text-end">
                                                        {Number(item.unit_price).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} {currencySymbol}
                                                    </td>
                                                    <td className="text-end">
                                                        <strong>{Number(item.total_amount).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} {currencySymbol}</strong>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </Table>
                                </div>
                            </Card.Body>
                        </Card>

                        {/* Terms */}
                        {offer.terms_conditions && (
                            <Card className="mb-4 shadow-sm">
                                <Card.Header className="bg-white">
                                    <h5 className="mb-0">Sartlar ve Kosullar</h5>
                                </Card.Header>
                                <Card.Body>
                                    <p className="mb-0" style={{ whiteSpace: 'pre-line' }}>{offer.terms_conditions}</p>
                                </Card.Body>
                            </Card>
                        )}
                    </Col>

                    <Col lg={4}>
                        {/* Summary */}
                        <Card className="mb-4 shadow-sm border-primary">
                            <Card.Header className="bg-primary text-white">
                                <h5 className="mb-0 text-white">Teklif Ozeti</h5>
                            </Card.Header>
                            <Card.Body>
                                <div className="d-flex justify-content-between mb-2">
                                    <span>Ara Toplam:</span>
                                    <strong>{Number(offer.subtotal).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} {currencySymbol}</strong>
                                </div>
                                {offer.discount_amount > 0 && (
                                    <div className="d-flex justify-content-between mb-2">
                                        <span>Iskonto ({offer.discount_rate}%):</span>
                                        <strong className="text-danger">-{Number(offer.discount_amount).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} {currencySymbol}</strong>
                                    </div>
                                )}
                                <div className="d-flex justify-content-between mb-2">
                                    <span>KDV ({offer.tax_rate}%):</span>
                                    <strong>{Number(offer.tax_amount).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} {currencySymbol}</strong>
                                </div>
                                <hr />
                                <div className="d-flex justify-content-between">
                                    <h5 className="mb-0">TOPLAM:</h5>
                                    <h5 className="mb-0 text-primary">
                                        {Number(offer.total_amount).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} {currencySymbol}
                                    </h5>
                                </div>
                            </Card.Body>
                        </Card>

                        {/* Approval Form */}
                        {canApprove && (
                            <Card className="shadow-sm border-success">
                                <Card.Header className="bg-success text-white">
                                    <h5 className="mb-0 text-white">
                                        <i className="ri-checkbox-circle-line me-2"></i>
                                        Teklifi Onayla
                                    </h5>
                                </Card.Header>
                                <Card.Body>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Notunuz (Opsiyonel)</Form.Label>
                                        <Form.Control
                                            as="textarea"
                                            rows={3}
                                            value={approvalNotes}
                                            onChange={(e) => setApprovalNotes(e.target.value)}
                                            placeholder="Eklemek istediginiz notlari yazabilirsiniz..."
                                        />
                                    </Form.Group>
                                    <div className="d-grid">
                                        <Button
                                            variant="success"
                                            size="lg"
                                            onClick={handleApprove}
                                            disabled={isSubmitting}
                                        >
                                            {isSubmitting ? (
                                                <>
                                                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                                    Onaylaniyor...
                                                </>
                                            ) : (
                                                <>
                                                    <i className="ri-check-line me-2"></i>
                                                    Teklifi Onayla
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                    <p className="text-muted small mt-3 mb-0 text-center">
                                        Onayladiginizda satis ekibimiz sizinle iletisime gececektir.
                                    </p>
                                </Card.Body>
                            </Card>
                        )}

                        {/* Download PDF */}
                        <Card className="mt-4 shadow-sm">
                            <Card.Body>
                                <div className="d-grid">
                                    <a href={route('offers.public.pdf', { token })} target="_blank" className="btn btn-outline-primary">
                                        <i className="ri-file-pdf-line me-2"></i>
                                        PDF Olarak Indir
                                    </a>
                                </div>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>

                {/* Footer */}
                <div className="text-center mt-5 text-muted">
                    <p className="mb-1">Bu teklif {new Date(offer.valid_until_date).toLocaleDateString('tr-TR')} tarihine kadar gecerlidir.</p>
                    <p className="small">Sorulariniz icin bizimle iletisime gecebilirsiniz.</p>
                </div>
            </div>
        </div>
    );
}
