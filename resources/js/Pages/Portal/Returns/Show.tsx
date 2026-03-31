import React from 'react';
import { Head, Link } from '@inertiajs/react';
import PortalLayout from '@/Layouts/PortalLayout';

interface SalesReturn {
    id: number;
    return_no: string;
    return_date: string;
    status: string;
    status_label: string;
    return_reason: string;
    reason_label: string;
    return_description: string;
    total_amount: number;
    refund_method?: string;
    refund_method_label?: string;
    rejection_reason?: string;
    pickup_date?: string;
    warehouse_notes?: string;
    sales_order: {
        id: number;
        order_number: string;
    };
    items: Array<{
        id: number;
        product_name: string;
        product_code?: string;
        quantity_returned: number;
        unit_price: number;
        line_total: number;
        condition?: string;
        condition_label?: string;
        images: Array<{
            id: number;
            image_path: string;
            image_url: string;
        }>;
    }>;
    approved_by?: { name: string };
    rejected_by?: { name: string };
    driver?: { name: string };
}

interface Props {
    return: SalesReturn;
}

const Show: React.FC<Props> = ({ return: returnData }) => {
    const getStatusBadge = (status: string) => {
        const statusMap: Record<string, { label: string; class: string }> = {
            pending_approval: { label: 'Onay Bekliyor', class: 'warning' },
            approved: { label: 'Onaylandı', class: 'success' },
            rejected: { label: 'Reddedildi', class: 'danger' },
            processing: { label: 'İşleniyor', class: 'primary' },
            completed: { label: 'Tamamlandı', class: 'success' },
            cancelled: { label: 'İptal', class: 'secondary' },
        };
        const { label, class: badgeClass } = statusMap[status] || { label: status, class: 'secondary' };
        return <span className={`badge bg-${badgeClass} fs-6`}>{label}</span>;
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('tr-TR', {
            style: 'currency',
            currency: 'TRY'
        }).format(amount);
    };

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('tr-TR');
    };

    return (
        <PortalLayout>
            <Head title={`İade Detayı - ${returnData.return_no}`} />

            <div className="row mb-4">
                <div className="col">
                    <div className="d-flex justify-content-between align-items-center">
                        <div>
                            <Link href={route('portal.returns.index')} className="btn btn-sm btn-outline-secondary mb-2">
                                <i className="bx bx-arrow-back me-1"></i>
                                Geri
                            </Link>
                            <h2 className="mb-0">İade Detayı</h2>
                            <p className="text-muted">{returnData.return_no}</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="row g-3">
                {/* Left Column */}
                <div className="col-md-8">
                    {/* Return Info */}
                    <div className="card border-0 shadow-sm mb-3">
                        <div className="card-header bg-white d-flex justify-content-between align-items-center">
                            <h5 className="mb-0">İade Bilgileri</h5>
                            {getStatusBadge(returnData.status)}
                        </div>
                        <div className="card-body">
                            <div className="row g-3">
                                <div className="col-md-6">
                                    <label className="text-muted small">İade No</label>
                                    <div className="fw-bold">{returnData.return_no}</div>
                                </div>
                                <div className="col-md-6">
                                    <label className="text-muted small">İade Tarihi</label>
                                    <div>{formatDate(returnData.return_date)}</div>
                                </div>
                                <div className="col-md-6">
                                    <label className="text-muted small">Sipariş No</label>
                                    <div>
                                        <Link href={route('portal.orders.show', returnData.sales_order.id)} className="text-primary">
                                            {returnData.sales_order.order_number}
                                        </Link>
                                    </div>
                                </div>
                                <div className="col-md-6">
                                    <label className="text-muted small">İade Nedeni</label>
                                    <div>{returnData.reason_label}</div>
                                </div>
                                <div className="col-12">
                                    <label className="text-muted small">Açıklama</label>
                                    <div className="bg-light p-3 rounded">{returnData.return_description}</div>
                                </div>
                                {returnData.refund_method && (
                                    <div className="col-md-6">
                                        <label className="text-muted small">İade Yöntemi</label>
                                        <div>{returnData.refund_method_label}</div>
                                    </div>
                                )}
                                {returnData.rejection_reason && (
                                    <div className="col-12">
                                        <div className="alert alert-danger">
                                            <strong>Red Nedeni:</strong> {returnData.rejection_reason}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Return Items */}
                    <div className="card border-0 shadow-sm mb-3">
                        <div className="card-header bg-white">
                            <h5 className="mb-0">İade Edilen Ürünler</h5>
                        </div>
                        <div className="card-body">
                            <div className="table-responsive">
                                <table className="table table-hover">
                                    <thead>
                                        <tr>
                                            <th>Ürün</th>
                                            <th>Miktar</th>
                                            <th>Birim Fiyat</th>
                                            <th className="text-end">Toplam</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {returnData.items.map((item) => (
                                            <tr key={item.id}>
                                                <td>
                                                    <div className="fw-bold">{item.product_name}</div>
                                                    {item.product_code && (
                                                        <small className="text-muted">Kod: {item.product_code}</small>
                                                    )}
                                                    {item.condition_label && (
                                                        <div>
                                                            <span className="badge bg-light text-dark small">
                                                                Durum: {item.condition_label}
                                                            </span>
                                                        </div>
                                                    )}
                                                </td>
                                                <td>{item.quantity_returned}</td>
                                                <td>{formatCurrency(item.unit_price)}</td>
                                                <td className="text-end fw-bold">{formatCurrency(item.line_total)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    {/* Product Images */}
                    {returnData.items.some(item => item.images.length > 0) && (
                        <div className="card border-0 shadow-sm">
                            <div className="card-header bg-white">
                                <h5 className="mb-0">Ürün Fotoğrafları</h5>
                            </div>
                            <div className="card-body">
                                {returnData.items.map((item) => (
                                    item.images.length > 0 && (
                                        <div key={item.id} className="mb-4">
                                            <h6 className="mb-3">{item.product_name}</h6>
                                            <div className="row g-2">
                                                {item.images.map((image) => (
                                                    <div key={image.id} className="col-md-3 col-sm-4 col-6">
                                                        <a href={image.image_url} target="_blank" rel="noopener noreferrer">
                                                            <img
                                                                src={image.image_url}
                                                                className="img-thumbnail"
                                                                style={{ width: '100%', height: '150px', objectFit: 'cover', cursor: 'pointer' }}
                                                                alt="Ürün fotoğrafı"
                                                            />
                                                        </a>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Right Column - Summary & Timeline */}
                <div className="col-md-4">
                    {/* Summary */}
                    <div className="card border-0 shadow-sm mb-3 sticky-top" style={{ top: '20px' }}>
                        <div className="card-header bg-white">
                            <h5 className="mb-0">İade Özeti</h5>
                        </div>
                        <div className="card-body">
                            <div className="d-flex justify-content-between mb-3">
                                <span className="fs-5 fw-bold">Toplam Tutar</span>
                                <span className="fs-5 fw-bold text-primary">{formatCurrency(returnData.total_amount)}</span>
                            </div>

                            {returnData.status === 'pending_approval' && (
                                <div className="alert alert-warning small">
                                    <i className="bx bx-info-circle me-1"></i>
                                    İade talebiniz inceleniyor. Sonuç hakkında bilgilendirileceksiniz.
                                </div>
                            )}

                            {returnData.status === 'approved' && (
                                <div className="alert alert-success small">
                                    <i className="bx bx-check-circle me-1"></i>
                                    İade talebiniz onaylandı!
                                    {returnData.approved_by && (
                                        <div className="mt-1">
                                            <strong>Onaylayan:</strong> {returnData.approved_by.name}
                                        </div>
                                    )}
                                </div>
                            )}

                            {returnData.status === 'rejected' && (
                                <div className="alert alert-danger small">
                                    <i className="bx bx-x-circle me-1"></i>
                                    İade talebiniz reddedildi.
                                    {returnData.rejected_by && (
                                        <div className="mt-1">
                                            <strong>Reddeden:</strong> {returnData.rejected_by.name}
                                        </div>
                                    )}
                                </div>
                            )}

                            {returnData.status === 'processing' && (
                                <div className="alert alert-info small">
                                    <i className="bx bx-loader me-1"></i>
                                    İade işleminiz devam ediyor.
                                    {returnData.pickup_date && (
                                        <div className="mt-1">
                                            <strong>Toplama Tarihi:</strong> {formatDate(returnData.pickup_date)}
                                        </div>
                                    )}
                                    {returnData.driver && (
                                        <div className="mt-1">
                                            <strong>Sürücü:</strong> {returnData.driver.name}
                                        </div>
                                    )}
                                </div>
                            )}

                            {returnData.status === 'completed' && (
                                <div className="alert alert-success small">
                                    <i className="bx bx-check-double me-1"></i>
                                    İade işleminiz tamamlandı!
                                    {returnData.warehouse_notes && (
                                        <div className="mt-2">
                                            <strong>Depo Notu:</strong>
                                            <div className="mt-1">{returnData.warehouse_notes}</div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Contact */}
                    <div className="card border-0 shadow-sm">
                        <div className="card-header bg-white">
                            <h5 className="mb-0">Yardım</h5>
                        </div>
                        <div className="card-body">
                            <p className="text-muted small">İade süreciniz hakkında sorularınız için bizimle iletişime geçebilirsiniz.</p>
                            <div className="d-grid gap-2">
                                <a href="tel:+908501234567" className="btn btn-outline-primary btn-sm">
                                    <i className="bx bx-phone me-2"></i>
                                    Bizi Arayın
                                </a>
                                <a href="mailto:iade@firma.com" className="btn btn-outline-secondary btn-sm">
                                    <i className="bx bx-envelope me-2"></i>
                                    E-posta Gönderin
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </PortalLayout>
    );
};

export default Show;
