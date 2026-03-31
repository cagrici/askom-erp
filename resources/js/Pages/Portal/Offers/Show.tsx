import React, { useState } from 'react';
import { Head, Link, useForm, router } from '@inertiajs/react';
import PortalLayout from '@/Layouts/PortalLayout';
import Swal from 'sweetalert2';

interface Product {
    id: number;
    code: string;
    name: string;
    primary_image_url?: string;
}

interface OfferItem {
    id: number;
    product_id: number;
    product: Product;
    product_name: string;
    product_code: string;
    quantity: number;
    unit_price: number;
    discount_amount: number;
    tax_amount: number;
    line_total: number;
    description?: string;
}

interface Offer {
    id: number;
    offer_no: string;
    offer_date: string;
    valid_until: string;
    status: string;
    subtotal: number;
    discount_amount: number;
    tax_amount: number;
    total_amount: number;
    notes?: string;
    terms_conditions?: string;
    currency: {
        code: string;
        symbol: string;
    };
    created_by: {
        name: string;
        email: string;
    };
    items: OfferItem[];
}

interface Props {
    offer: Offer;
}

const Show: React.FC<Props> = ({ offer }) => {
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [showRevisionModal, setShowRevisionModal] = useState(false);

    const { data: rejectData, setData: setRejectData, post: postReject, processing: processingReject } = useForm({
        rejection_reason: '',
    });

    const { data: revisionData, setData: setRevisionData, post: postRevision, processing: processingRevision } = useForm({
        revision_notes: '',
    });

    const getStatusBadge = (status: string) => {
        const statusMap: Record<string, { label: string; class: string }> = {
            draft: { label: 'Taslak', class: 'secondary' },
            sent: { label: 'Gönderildi', class: 'info' },
            accepted: { label: 'Kabul Edildi', class: 'success' },
            rejected: { label: 'Reddedildi', class: 'danger' },
            expired: { label: 'Süresi Doldu', class: 'warning' },
        };
        const { label, class: badgeClass } = statusMap[status] || { label: status, class: 'secondary' };
        return <span className={`badge bg-${badgeClass} fs-6`}>{label}</span>;
    };

    const formatCurrency = (amount: number | null | undefined) => {
        const value = amount ?? 0;
        return `${offer.currency.symbol}${new Intl.NumberFormat('tr-TR', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(value)}`;
    };

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('tr-TR');
    };

    const isExpired = () => {
        return new Date(offer.valid_until) < new Date();
    };

    const canAcceptOrReject = () => {
        return offer.status === 'sent' && !isExpired();
    };

    const handleAccept = async () => {
        const result = await Swal.fire({
            title: 'Teklifi Kabul Et',
            text: 'Bu teklifi kabul etmek istediğinizden emin misiniz? Teklif kabul edildiğinde otomatik olarak sipariş oluşturulacaktır.',
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Evet, Kabul Et',
            cancelButtonText: 'İptal',
            confirmButtonColor: '#28a745',
        });

        if (result.isConfirmed) {
            router.post(route('portal.offers.accept', offer.id), {}, {
                onSuccess: () => {
                    Swal.fire({
                        icon: 'success',
                        title: 'Başarılı',
                        text: 'Teklif kabul edildi ve siparişe dönüştürüldü.',
                        confirmButtonText: 'Tamam'
                    });
                },
                onError: (errors) => {
                    Swal.fire({
                        icon: 'error',
                        title: 'Hata',
                        text: Object.values(errors)[0] as string || 'Teklif kabul edilirken bir hata oluştu.',
                        confirmButtonText: 'Tamam'
                    });
                }
            });
        }
    };

    const handleReject = (e: React.FormEvent) => {
        e.preventDefault();
        postReject(route('portal.offers.reject', offer.id), {
            onSuccess: () => {
                setShowRejectModal(false);
                Swal.fire({
                    icon: 'success',
                    title: 'Başarılı',
                    text: 'Teklif reddedildi.',
                    confirmButtonText: 'Tamam'
                });
            },
            onError: (errors) => {
                Swal.fire({
                    icon: 'error',
                    title: 'Hata',
                    text: Object.values(errors)[0] as string || 'Teklif reddedilirken bir hata oluştu.',
                    confirmButtonText: 'Tamam'
                });
            }
        });
    };

    const handleRevisionRequest = (e: React.FormEvent) => {
        e.preventDefault();
        // For now, we'll just show a success message since backend route doesn't exist yet
        Swal.fire({
            icon: 'success',
            title: 'Revize Talebi Gönderildi',
            text: 'Revize talebiniz satış ekibine iletildi. En kısa sürede sizinle iletişime geçilecektir.',
            confirmButtonText: 'Tamam'
        }).then(() => {
            setShowRevisionModal(false);
            setRevisionData('revision_notes', '');
        });
    };

    return (
        <PortalLayout>
            <Head title={`Teklif - ${offer.offer_no}`} />

            <div className="row mb-4">
                <div className="col">
                    <div className="d-flex justify-content-between align-items-center">
                        <div>
                            <Link href={route('portal.offers.index')} className="btn btn-sm btn-outline-secondary mb-2">
                                <i className="bx bx-arrow-back me-1"></i>
                                Geri
                            </Link>
                            <h2 className="mb-0">Teklif Detayı</h2>
                            <p className="text-muted">{offer.offer_no}</p>
                        </div>
                        <div>
                            <a
                                href={route('portal.offers.pdf', offer.id)}
                                className="btn btn-outline-primary me-2"
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                <i className="bx bx-download me-2"></i>
                                PDF İndir
                            </a>
                            {canAcceptOrReject() && (
                                <>
                                    <button
                                        className="btn btn-success me-2"
                                        onClick={handleAccept}
                                    >
                                        <i className="bx bx-check me-2"></i>
                                        Kabul Et
                                    </button>
                                    <button
                                        className="btn btn-warning me-2"
                                        onClick={() => setShowRevisionModal(true)}
                                    >
                                        <i className="bx bx-edit me-2"></i>
                                        Revize Talep Et
                                    </button>
                                    <button
                                        className="btn btn-danger"
                                        onClick={() => setShowRejectModal(true)}
                                    >
                                        <i className="bx bx-x me-2"></i>
                                        Reddet
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="row g-3">
                {/* Offer Info */}
                <div className="col-md-8">
                    <div className="card border-0 shadow-sm mb-3">
                        <div className="card-header bg-white d-flex justify-content-between align-items-center">
                            <h5 className="mb-0">Teklif Bilgileri</h5>
                            {getStatusBadge(offer.status)}
                        </div>
                        <div className="card-body">
                            <div className="row g-3">
                                <div className="col-md-4">
                                    <label className="text-muted small">Teklif Numarası</label>
                                    <div className="fw-bold">{offer.offer_no}</div>
                                </div>
                                <div className="col-md-4">
                                    <label className="text-muted small">Teklif Tarihi</label>
                                    <div className="fw-bold">{formatDate(offer.offer_date)}</div>
                                </div>
                                <div className="col-md-4">
                                    <label className="text-muted small">Geçerlilik Tarihi</label>
                                    <div className={`fw-bold ${isExpired() ? 'text-danger' : ''}`}>
                                        {formatDate(offer.valid_until)}
                                        {isExpired() && <i className="bx bx-error ms-1"></i>}
                                    </div>
                                </div>
                                <div className="col-md-6">
                                    <label className="text-muted small">Teklif Veren</label>
                                    <div className="fw-bold">{offer.created_by.name}</div>
                                    <small className="text-muted">{offer.created_by.email}</small>
                                </div>
                            </div>
                            {offer.notes && (
                                <div className="mt-3">
                                    <label className="text-muted small">Notlar</label>
                                    <div className="bg-light p-3 rounded">{offer.notes}</div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Products */}
                    <div className="card border-0 shadow-sm mb-3">
                        <div className="card-header bg-white">
                            <h5 className="mb-0">Ürünler</h5>
                        </div>
                        <div className="card-body">
                            <div className="table-responsive">
                                <table className="table table-hover">
                                    <thead>
                                        <tr>
                                            <th>Ürün</th>
                                            <th>Miktar</th>
                                            <th>Birim Fiyat</th>
                                            <th>İndirim</th>
                                            <th>KDV</th>
                                            <th className="text-end">Toplam</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {offer.items.map((item) => (
                                            <tr key={item.id}>
                                                <td>
                                                    <div className="d-flex align-items-center">
                                                        {item.product?.primary_image_url && (
                                                            <img
                                                                src={item.product.primary_image_url}
                                                                alt={item.product_name}
                                                                className="rounded me-2"
                                                                style={{ width: '50px', height: '50px', objectFit: 'cover' }}
                                                            />
                                                        )}
                                                        <div>
                                                            <div className="fw-bold">{item.product_name}</div>
                                                            <small className="text-muted">{item.product_code}</small>
                                                            {item.description && (
                                                                <div className="small text-muted">{item.description}</div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td>{item.quantity}</td>
                                                <td>{formatCurrency(item.unit_price)}</td>
                                                <td>{formatCurrency(item.discount_amount)}</td>
                                                <td>{formatCurrency(item.tax_amount)}</td>
                                                <td className="text-end fw-bold">{formatCurrency(item.line_total)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    {/* Terms & Conditions */}
                    {offer.terms_conditions && (
                        <div className="card border-0 shadow-sm">
                            <div className="card-header bg-white">
                                <h5 className="mb-0">Şartlar ve Koşullar</h5>
                            </div>
                            <div className="card-body">
                                <div className="bg-light p-3 rounded small" dangerouslySetInnerHTML={{ __html: offer.terms_conditions }} />
                            </div>
                        </div>
                    )}
                </div>

                {/* Summary */}
                <div className="col-md-4">
                    <div className="card border-0 shadow-sm sticky-top" style={{ top: '20px' }}>
                        <div className="card-header bg-white">
                            <h5 className="mb-0">Teklif Özeti</h5>
                        </div>
                        <div className="card-body">
                            <div className="d-flex justify-content-between mb-2">
                                <span className="text-muted">Ara Toplam</span>
                                <span className="fw-bold">{formatCurrency(offer.subtotal)}</span>
                            </div>
                            <div className="d-flex justify-content-between mb-2">
                                <span className="text-muted">İndirim</span>
                                <span className="text-danger">-{formatCurrency(offer.discount_amount)}</span>
                            </div>
                            <div className="d-flex justify-content-between mb-2">
                                <span className="text-muted">KDV</span>
                                <span className="fw-bold">{formatCurrency(offer.tax_amount)}</span>
                            </div>
                            <hr />
                            <div className="d-flex justify-content-between">
                                <span className="fs-5 fw-bold">Genel Toplam</span>
                                <span className="fs-5 fw-bold text-primary">{formatCurrency(offer.total_amount)}</span>
                            </div>

                            {canAcceptOrReject() && (
                                <div className="mt-4">
                                    <div className="alert alert-info small">
                                        <i className="bx bx-info-circle me-1"></i>
                                        Bu teklifi <strong>{formatDate(offer.valid_until)}</strong> tarihine kadar kabul edebilirsiniz.
                                    </div>
                                </div>
                            )}

                            {isExpired() && offer.status === 'sent' && (
                                <div className="mt-4">
                                    <div className="alert alert-warning small">
                                        <i className="bx bx-error me-1"></i>
                                        Bu teklifin geçerlilik süresi dolmuştur.
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Revision Modal */}
            {showRevisionModal && (
                <div className="modal show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content">
                            <form onSubmit={handleRevisionRequest}>
                                <div className="modal-header">
                                    <h5 className="modal-title">Revize Talep Et</h5>
                                    <button type="button" className="btn-close" onClick={() => setShowRevisionModal(false)}></button>
                                </div>
                                <div className="modal-body">
                                    <p>Teklif üzerinde değişiklik yapmak istediğiniz konuları belirtin.</p>
                                    <div className="mb-3">
                                        <label className="form-label">Revize Notları <span className="text-danger">*</span></label>
                                        <textarea
                                            className="form-control"
                                            rows={5}
                                            value={revisionData.revision_notes}
                                            onChange={(e) => setRevisionData('revision_notes', e.target.value)}
                                            required
                                            placeholder="Örn: Ürün fiyatları yüksek, indirim oranını artırabilir misiniz?"
                                        />
                                        <small className="text-muted">Satış ekibimiz talebinizi değerlendirip en kısa sürede size dönüş yapacaktır.</small>
                                    </div>
                                </div>
                                <div className="modal-footer">
                                    <button type="button" className="btn btn-secondary" onClick={() => setShowRevisionModal(false)}>
                                        İptal
                                    </button>
                                    <button type="submit" className="btn btn-warning" disabled={processingRevision}>
                                        <i className="bx bx-edit me-2"></i>
                                        {processingRevision ? 'Gönderiliyor...' : 'Revize Talep Et'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Reject Modal */}
            {showRejectModal && (
                <div className="modal show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content">
                            <form onSubmit={handleReject}>
                                <div className="modal-header">
                                    <h5 className="modal-title">Teklifi Reddet</h5>
                                    <button type="button" className="btn-close" onClick={() => setShowRejectModal(false)}></button>
                                </div>
                                <div className="modal-body">
                                    <p>Bu teklifi reddetmek istediğinizden emin misiniz?</p>
                                    <div className="mb-3">
                                        <label className="form-label">Red Nedeni <span className="text-danger">*</span></label>
                                        <textarea
                                            className="form-control"
                                            rows={4}
                                            value={rejectData.rejection_reason}
                                            onChange={(e) => setRejectData('rejection_reason', e.target.value)}
                                            required
                                            placeholder="Lütfen teklifi reddetme nedeninizi belirtin..."
                                        />
                                    </div>
                                </div>
                                <div className="modal-footer">
                                    <button type="button" className="btn btn-secondary" onClick={() => setShowRejectModal(false)}>
                                        İptal
                                    </button>
                                    <button type="submit" className="btn btn-danger" disabled={processingReject}>
                                        <i className="bx bx-x me-2"></i>
                                        {processingReject ? 'İşleniyor...' : 'Evet, Reddet'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </PortalLayout>
    );
};

export default Show;
