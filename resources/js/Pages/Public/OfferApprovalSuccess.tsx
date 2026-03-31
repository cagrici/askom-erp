import React from 'react';
import { Head } from '@inertiajs/react';
import { Card } from 'react-bootstrap';

interface Props {
    offer: {
        offer_no: string;
        total_amount: number;
        customer_display_name: string;
        currency?: {
            cur_symbol: string;
        };
        customer_approved_at?: string;
    } | null;
    error?: string;
}

export default function OfferApprovalSuccess({ offer, error }: Props) {
    if (!offer || error) {
        return (
            <div className="min-vh-100 bg-light d-flex align-items-center justify-content-center">
                <Head title="Hata" />
                <Card className="shadow-sm" style={{ maxWidth: '500px' }}>
                    <Card.Body className="text-center p-5">
                        <i className="ri-error-warning-line text-danger" style={{ fontSize: '4rem' }}></i>
                        <h4 className="mt-3">Hata</h4>
                        <p className="text-muted">{error || 'Bir hata olustu.'}</p>
                    </Card.Body>
                </Card>
            </div>
        );
    }

    const currencySymbol = offer.currency?.cur_symbol || 'TL';

    return (
        <div className="min-vh-100 bg-light d-flex align-items-center justify-content-center">
            <Head title="Teklif Onaylandi" />

            <Card className="shadow" style={{ maxWidth: '600px' }}>
                <Card.Body className="text-center p-5">
                    <div className="mb-4">
                        <div
                            className="d-inline-flex align-items-center justify-content-center bg-success text-white rounded-circle"
                            style={{ width: '100px', height: '100px' }}
                        >
                            <i className="ri-check-line" style={{ fontSize: '3rem' }}></i>
                        </div>
                    </div>

                    <h2 className="text-success mb-3">Teklif Onaylandi!</h2>

                    <p className="lead mb-4">
                        <strong>{offer.offer_no}</strong> numarali teklifiniz basariyla onaylandi.
                    </p>

                    <div className="bg-light rounded p-4 mb-4">
                        <div className="row">
                            <div className="col-6 text-start">
                                <span className="text-muted">Musteri:</span><br />
                                <strong>{offer.customer_display_name}</strong>
                            </div>
                            <div className="col-6 text-end">
                                <span className="text-muted">Toplam Tutar:</span><br />
                                <strong className="text-primary" style={{ fontSize: '1.25rem' }}>
                                    {Number(offer.total_amount).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} {currencySymbol}
                                </strong>
                            </div>
                        </div>
                        {offer.customer_approved_at && (
                            <div className="mt-3 pt-3 border-top">
                                <span className="text-muted">Onay Tarihi:</span>{' '}
                                <strong>{offer.customer_approved_at}</strong>
                            </div>
                        )}
                    </div>

                    <div className="alert alert-info text-start">
                        <i className="ri-information-line me-2"></i>
                        <strong>Siradaki Adimlar:</strong>
                        <ul className="mb-0 mt-2">
                            <li>Satis ekibimiz en kisa surede sizinle iletisime gececektir.</li>
                            <li>Siparisleriniz onay sonrasi isleme alinacaktir.</li>
                            <li>Sorulariniz icin bize ulasabilirsiniz.</li>
                        </ul>
                    </div>

                    <p className="text-muted small mt-4 mb-0">
                        Bizi tercih ettiginiz icin tesekkur ederiz.
                    </p>
                </Card.Body>
            </Card>
        </div>
    );
}
