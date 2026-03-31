import React from 'react';
import { Head, Link, router } from '@inertiajs/react';
import Layout from '../../../Layouts';
import { PurchaseRequest } from '@/types/purchasing';
import { PageProps } from '@/types';

interface ShowRequestProps extends PageProps {
    request: PurchaseRequest;
}

export default function Show({ request }: ShowRequestProps) {
    const getStatusBadge = (status: string) => {
        const statusClasses = {
            'draft': 'bg-secondary',
            'pending': 'bg-warning',
            'approved': 'bg-success',
            'rejected': 'bg-danger',
            'converted': 'bg-info',
            'cancelled': 'bg-dark',
        };
        
        const statusLabels = {
            'draft': 'Taslak',
            'pending': 'Beklemede',
            'approved': 'Onaylandı',
            'rejected': 'Reddedildi',
            'converted': 'Siparişe Dönüştürüldü',
            'cancelled': 'İptal',
        };

        return (
            <span className={`badge ${statusClasses[status as keyof typeof statusClasses] || 'bg-secondary'}`}>
                {statusLabels[status as keyof typeof statusLabels] || status}
            </span>
        );
    };

    const getPriorityBadge = (priority: string) => {
        const priorityClasses = {
            'low': 'bg-success',
            'medium': 'bg-warning',
            'high': 'bg-danger',
            'urgent': 'bg-dark',
        };
        
        const priorityLabels = {
            'low': 'Düşük',
            'medium': 'Orta',
            'high': 'Yüksek',
            'urgent': 'Acil',
        };

        return (
            <span className={`badge ${priorityClasses[priority as keyof typeof priorityClasses] || 'bg-secondary'}`}>
                {priorityLabels[priority as keyof typeof priorityLabels] || priority}
            </span>
        );
    };

    const handleApprove = () => {
        if (confirm('Bu talebi onaylamak istediğinizden emin misiniz?')) {
            router.post(route('purchasing.requests.approve', request.id));
        }
    };

    const handleReject = () => {
        const reason = prompt('Red etme nedenini giriniz:');
        if (reason) {
            router.post(route('purchasing.requests.reject', request.id), { reason });
        }
    };

    const handleCancel = () => {
        const reason = prompt('İptal etme nedenini giriniz:');
        if (reason) {
            router.post(route('purchasing.requests.cancel', request.id), { reason });
        }
    };

    const handleConvertToOrder = () => {
        if (confirm('Bu talebi satın alma siparişine dönüştürmek istediğinizden emin misiniz?')) {
            router.get(route('purchasing.orders.create', { request_id: request.id }));
        }
    };

    const canEdit = ['draft', 'pending'].includes(request.status);
    const canApprove = request.status === 'pending';
    const canConvert = request.status === 'approved';
    const canCancel = ['draft', 'pending', 'approved'].includes(request.status);

    return (
        <Layout>
            <Head title={`Talep Detayı - ${request.request_number}`} />
            
            <div className="page-content">
                <div className="container-fluid">
                    <div className="row">
                        <div className="col-12">
                            <div className="card">
                                <div className="card-header d-flex justify-content-between align-items-center">
                                    <div>
                                        <h3 className="card-title">
                                            Talep Detayı - {request.request_number}
                                        </h3>
                                        <div className="mt-2">
                                            {getStatusBadge(request.status)}
                                            <span className="ms-2">{getPriorityBadge(request.priority)}</span>
                                        </div>
                                    </div>
                                    <div className="d-flex gap-2">
                                        {canEdit && (
                                            <Link
                                                href={route('purchasing.requests.edit', request.id)}
                                                className="btn btn-warning btn-sm"
                                            >
                                                <i className="fas fa-edit me-2"></i>
                                                Düzenle
                                            </Link>
                                        )}
                                        {canApprove && (
                                            <>
                                                <button
                                                    className="btn btn-success btn-sm"
                                                    onClick={handleApprove}
                                                >
                                                    <i className="fas fa-check me-2"></i>
                                                    Onayla
                                                </button>
                                                <button
                                                    className="btn btn-danger btn-sm"
                                                    onClick={handleReject}
                                                >
                                                    <i className="fas fa-times me-2"></i>
                                                    Reddet
                                                </button>
                                            </>
                                        )}
                                        {canConvert && (
                                            <button
                                                className="btn btn-primary btn-sm"
                                                onClick={handleConvertToOrder}
                                            >
                                                <i className="fas fa-exchange-alt me-2"></i>
                                                Siparişe Dönüştür
                                            </button>
                                        )}
                                        {canCancel && (
                                            <button
                                                className="btn btn-outline-danger btn-sm"
                                                onClick={handleCancel}
                                            >
                                                <i className="fas fa-ban me-2"></i>
                                                İptal Et
                                            </button>
                                        )}
                                        <Link
                                            href={route('purchasing.requests.index')}
                                            className="btn btn-secondary"
                                        >
                                            <i className="fas fa-arrow-left me-2"></i>
                                            Geri Dön
                                        </Link>
                                    </div>
                                </div>

                                <div className="card-body">
                                    {/* Basic Information */}
                                    <div className="row mb-4">
                                        <div className="col-md-6">
                                            <div className="row mb-3">
                                                <div className="col-sm-4"><strong>Başlık:</strong></div>
                                                <div className="col-sm-8">{request.title}</div>
                                            </div>
                                            <div className="row mb-3">
                                                <div className="col-sm-4"><strong>Departman:</strong></div>
                                                <div className="col-sm-8">{request.department?.name}</div>
                                            </div>
                                            <div className="row mb-3">
                                                <div className="col-sm-4"><strong>Lokasyon:</strong></div>
                                                <div className="col-sm-8">{request.location?.name}</div>
                                            </div>
                                            <div className="row mb-3">
                                                <div className="col-sm-4"><strong>Talep Eden:</strong></div>
                                                <div className="col-sm-8">{request.requested_by_user?.name}</div>
                                            </div>
                                            <div className="row mb-3">
                                                <div className="col-sm-4"><strong>Gerekli Tarih:</strong></div>
                                                <div className="col-sm-8">{new Date(request.required_date).toLocaleDateString('tr-TR')}</div>
                                            </div>
                                        </div>
                                        <div className="col-md-6">
                                            <div className="row mb-3">
                                                <div className="col-sm-4"><strong>Para Birimi:</strong></div>
                                                <div className="col-sm-8">{request.currency}</div>
                                            </div>
                                            <div className="row mb-3">
                                                <div className="col-sm-4"><strong>Bütçe Kodu:</strong></div>
                                                <div className="col-sm-8">{request.budget_code || '-'}</div>
                                            </div>
                                            <div className="row mb-3">
                                                <div className="col-sm-4"><strong>Oluşturulma:</strong></div>
                                                <div className="col-sm-8">{new Date(request.created_at).toLocaleString('tr-TR')}</div>
                                            </div>
                                            {request.approved_by_user && (
                                                <>
                                                    <div className="row mb-3">
                                                        <div className="col-sm-4"><strong>Onaylayan:</strong></div>
                                                        <div className="col-sm-8">{request.approved_by_user.name}</div>
                                                    </div>
                                                    <div className="row mb-3">
                                                        <div className="col-sm-4"><strong>Onay Tarihi:</strong></div>
                                                        <div className="col-sm-8">{new Date(request.approved_at).toLocaleString('tr-TR')}</div>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    {/* Description */}
                                    {request.description && (
                                        <div className="row mb-4">
                                            <div className="col-md-12">
                                                <h6>Açıklama</h6>
                                                <div className="card bg-light">
                                                    <div className="card-body">
                                                        {request.description}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Items */}
                                    <div className="mb-4">
                                        <h5>Talep Kalemleri</h5>
                                        <div className="table-responsive">
                                            <table className="table table-bordered">
                                                <thead>
                                                    <tr>
                                                        <th>#</th>
                                                        <th>Açıklama</th>
                                                        <th>Özellik</th>
                                                        <th>Miktar</th>
                                                        <th>Birim</th>
                                                        <th>Tahmini Birim Fiyat</th>
                                                        <th>Toplam</th>
                                                        <th>Notlar</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {request.items?.map((item, index) => (
                                                        <tr key={item.id || index}>
                                                            <td>{index + 1}</td>
                                                            <td>{item.description}</td>
                                                            <td>{item.specification || '-'}</td>
                                                            <td>{item.quantity}</td>
                                                            <td>{item.unit}</td>
                                                            <td>
                                                                {item.unit_price > 0 ? (
                                                                    new Intl.NumberFormat('tr-TR', {
                                                                        style: 'currency',
                                                                        currency: request.currency
                                                                    }).format(item.unit_price)
                                                                ) : '-'}
                                                            </td>
                                                            <td className="fw-bold">
                                                                {item.total_price > 0 ? (
                                                                    new Intl.NumberFormat('tr-TR', {
                                                                        style: 'currency',
                                                                        currency: request.currency
                                                                    }).format(item.total_price)
                                                                ) : '-'}
                                                            </td>
                                                            <td>{item.notes || '-'}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                                {request.total_amount > 0 && (
                                                    <tfoot>
                                                        <tr>
                                                            <td colSpan={6} className="text-end fw-bold">Toplam Tutar:</td>
                                                            <td className="fw-bold">
                                                                {new Intl.NumberFormat('tr-TR', {
                                                                    style: 'currency',
                                                                    currency: request.currency
                                                                }).format(request.total_amount)}
                                                            </td>
                                                            <td></td>
                                                        </tr>
                                                    </tfoot>
                                                )}
                                            </table>
                                        </div>
                                    </div>

                                    {/* Notes and Additional Information */}
                                    <div className="row">
                                        <div className="col-md-12">
                                            {request.notes && (
                                                <div className="mb-3">
                                                    <h6>Notlar</h6>
                                                    <div className="card bg-light">
                                                        <div className="card-body">
                                                            {request.notes}
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {request.approval_notes && (
                                                <div className="mb-3">
                                                    <h6>Onay Notları</h6>
                                                    <div className="alert alert-info">
                                                        <i className="fas fa-info-circle me-2"></i>
                                                        {request.approval_notes}
                                                    </div>
                                                </div>
                                            )}

                                            {request.rejection_reason && (
                                                <div className="mb-3">
                                                    <h6>Red Nedeni</h6>
                                                    <div className="alert alert-danger">
                                                        <i className="fas fa-exclamation-triangle me-2"></i>
                                                        {request.rejection_reason}
                                                    </div>
                                                </div>
                                            )}

                                            {request.cancellation_reason && (
                                                <div className="mb-3">
                                                    <h6>İptal Nedeni</h6>
                                                    <div className="alert alert-warning">
                                                        <i className="fas fa-ban me-2"></i>
                                                        {request.cancellation_reason}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Related Purchase Orders */}
                                    {request.purchase_orders && request.purchase_orders.length > 0 && (
                                        <div className="mt-4">
                                            <h6>Bağlı Satın Alma Siparişleri</h6>
                                            <div className="table-responsive">
                                                <table className="table table-sm table-bordered">
                                                    <thead>
                                                        <tr>
                                                            <th>Sipariş No</th>
                                                            <th>Başlık</th>
                                                            <th>Tedarikçi</th>
                                                            <th>Durum</th>
                                                            <th>Toplam</th>
                                                            <th>İşlem</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {request.purchase_orders.map((order) => (
                                                            <tr key={order.id}>
                                                                <td>{order.order_number}</td>
                                                                <td>{order.title}</td>
                                                                <td>{order.supplier?.title}</td>
                                                                <td>{getStatusBadge(order.status)}</td>
                                                                <td>
                                                                    {new Intl.NumberFormat('tr-TR', {
                                                                        style: 'currency',
                                                                        currency: order.currency
                                                                    }).format(order.total_amount)}
                                                                </td>
                                                                <td>
                                                                    <Link
                                                                        href={route('purchasing.orders.show', order.id)}
                                                                        className="btn btn-sm btn-outline-primary"
                                                                    >
                                                                        <i className="fas fa-eye"></i>
                                                                    </Link>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
}