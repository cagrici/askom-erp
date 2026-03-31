import React from 'react';
import { Head, Link, router } from '@inertiajs/react';
import Layout from '../../../Layouts';
import { PurchaseOrder } from '@/types/purchasing';
import { PageProps } from '@/types';

interface ShowOrderProps extends PageProps {
    order: PurchaseOrder;
}

export default function Show({ order }: ShowOrderProps) {
    const getStatusBadge = (status: string) => {
        const statusClasses = {
            'draft': 'bg-secondary',
            'pending': 'bg-warning',
            'approved': 'bg-info',
            'sent': 'bg-primary',
            'partial': 'bg-warning',
            'completed': 'bg-success',
            'cancelled': 'bg-danger',
        };
        
        const statusLabels = {
            'draft': 'Taslak',
            'pending': 'Beklemede',
            'approved': 'Onaylandı',
            'sent': 'Gönderildi',
            'partial': 'Kısmi',
            'completed': 'Tamamlandı',
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
        if (confirm('Bu siparişi onaylamak istediğinizden emin misiniz?')) {
            router.post(route('purchasing.orders.approve', order.id));
        }
    };

    const handleReject = () => {
        const reason = prompt('Red etme nedenini giriniz:');
        if (reason) {
            router.post(route('purchasing.orders.reject', order.id), { reason });
        }
    };

    const handleCancel = () => {
        const reason = prompt('İptal etme nedenini giriniz:');
        if (reason) {
            router.post(route('purchasing.orders.cancel', order.id), { reason });
        }
    };

    const canEdit = ['draft', 'pending'].includes(order.status);
    const canApprove = order.status === 'pending';
    const canCancel = ['draft', 'pending', 'approved'].includes(order.status);

    return (
        <Layout>
            <Head title={`Sipariş Detayı - ${order.order_number}`} />
            
            <div className="page-content">
                <div className="container-fluid">
                    <div className="row">
                        <div className="col-12">
                            <div className="card">
                                <div className="card-header d-flex justify-content-between align-items-center">
                                    <div>
                                        <h3 className="card-title">
                                            Sipariş Detayı - {order.order_number}
                                        </h3>
                                        <div className="mt-2">
                                            {getStatusBadge(order.status)}
                                            <span className="ms-2">{getPriorityBadge(order.priority)}</span>
                                        </div>
                                    </div>
                                    <div className="d-flex gap-2">
                                        {canEdit && (
                                            <Link
                                                href={route('purchasing.orders.edit', order.id)}
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
                                            href={route('purchasing.orders.index')}
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
                                                <div className="col-sm-8">{order.title}</div>
                                            </div>
                                            <div className="row mb-3">
                                                <div className="col-sm-4"><strong>Tedarikçi:</strong></div>
                                                <div className="col-sm-8">{order.supplier?.title}</div>
                                            </div>
                                            <div className="row mb-3">
                                                <div className="col-sm-4"><strong>Lokasyon:</strong></div>
                                                <div className="col-sm-8">{order.location?.name || '-'}</div>
                                            </div>
                                            <div className="row mb-3">
                                                <div className="col-sm-4"><strong>Sipariş Tarihi:</strong></div>
                                                <div className="col-sm-8">{new Date(order.order_date).toLocaleDateString('tr-TR')}</div>
                                            </div>
                                            <div className="row mb-3">
                                                <div className="col-sm-4"><strong>Teslimat Tarihi:</strong></div>
                                                <div className="col-sm-8">{new Date(order.delivery_date).toLocaleDateString('tr-TR')}</div>
                                            </div>
                                        </div>
                                        <div className="col-md-6">
                                            <div className="row mb-3">
                                                <div className="col-sm-4"><strong>Sipariş Veren:</strong></div>
                                                <div className="col-sm-8">{order.ordered_by_user?.name}</div>
                                            </div>
                                            <div className="row mb-3">
                                                <div className="col-sm-4"><strong>Para Birimi:</strong></div>
                                                <div className="col-sm-8">{order.currency}</div>
                                            </div>
                                            <div className="row mb-3">
                                                <div className="col-sm-4"><strong>Oluşturulma:</strong></div>
                                                <div className="col-sm-8">{new Date(order.created_at).toLocaleString('tr-TR')}</div>
                                            </div>
                                            {order.approved_by_user && (
                                                <>
                                                    <div className="row mb-3">
                                                        <div className="col-sm-4"><strong>Onaylayan:</strong></div>
                                                        <div className="col-sm-8">{order.approved_by_user.name}</div>
                                                    </div>
                                                    <div className="row mb-3">
                                                        <div className="col-sm-4"><strong>Onay Tarihi:</strong></div>
                                                        <div className="col-sm-8">{new Date(order.approved_at).toLocaleString('tr-TR')}</div>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    {/* Delivery Information */}
                                    <div className="row mb-4">
                                        <div className="col-md-12">
                                            <h5>Teslimat Bilgileri</h5>
                                            <div className="card bg-light">
                                                <div className="card-body">
                                                    <div className="row">
                                                        <div className="col-md-6">
                                                            <div className="row mb-2">
                                                                <div className="col-sm-4"><strong>Adres:</strong></div>
                                                                <div className="col-sm-8">{order.delivery_address}</div>
                                                            </div>
                                                        </div>
                                                        <div className="col-md-6">
                                                            <div className="row mb-2">
                                                                <div className="col-sm-4"><strong>İletişim:</strong></div>
                                                                <div className="col-sm-8">{order.delivery_contact || '-'}</div>
                                                            </div>
                                                            <div className="row mb-2">
                                                                <div className="col-sm-4"><strong>Telefon:</strong></div>
                                                                <div className="col-sm-8">{order.delivery_phone || '-'}</div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Items */}
                                    <div className="mb-4">
                                        <h5>Sipariş Kalemleri</h5>
                                        <div className="table-responsive">
                                            <table className="table table-bordered">
                                                <thead>
                                                    <tr>
                                                        <th>#</th>
                                                        <th>Açıklama</th>
                                                        <th>Özellik</th>
                                                        <th>Miktar</th>
                                                        <th>Birim</th>
                                                        <th>Birim Fiyat</th>
                                                        <th>İndirim</th>
                                                        <th>Vergi</th>
                                                        <th>Toplam</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {order.items?.map((item, index) => (
                                                        <tr key={item.id || index}>
                                                            <td>{index + 1}</td>
                                                            <td>{item.description}</td>
                                                            <td>{item.specification || '-'}</td>
                                                            <td>{item.quantity}</td>
                                                            <td>{item.unit}</td>
                                                            <td>
                                                                {new Intl.NumberFormat('tr-TR', {
                                                                    style: 'currency',
                                                                    currency: order.currency
                                                                }).format(item.unit_price)}
                                                            </td>
                                                            <td>
                                                                {item.discount_rate}% 
                                                                {item.discount_amount > 0 && (
                                                                    <small className="text-muted d-block">
                                                                        ({new Intl.NumberFormat('tr-TR', {
                                                                            style: 'currency',
                                                                            currency: order.currency
                                                                        }).format(item.discount_amount)})
                                                                    </small>
                                                                )}
                                                            </td>
                                                            <td>
                                                                {item.tax_rate}%
                                                                {item.tax_amount > 0 && (
                                                                    <small className="text-muted d-block">
                                                                        ({new Intl.NumberFormat('tr-TR', {
                                                                            style: 'currency',
                                                                            currency: order.currency
                                                                        }).format(item.tax_amount)})
                                                                    </small>
                                                                )}
                                                            </td>
                                                            <td className="fw-bold">
                                                                {new Intl.NumberFormat('tr-TR', {
                                                                    style: 'currency',
                                                                    currency: order.currency
                                                                }).format(item.total_price)}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>

                                    {/* Totals */}
                                    <div className="row">
                                        <div className="col-md-8">
                                            {order.notes && (
                                                <div>
                                                    <h6>Notlar</h6>
                                                    <div className="card bg-light">
                                                        <div className="card-body">
                                                            {order.notes}
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                            {order.description && (
                                                <div className="mt-3">
                                                    <h6>Açıklama</h6>
                                                    <div className="card bg-light">
                                                        <div className="card-body">
                                                            {order.description}
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                        <div className="col-md-4">
                                            <div className="card">
                                                <div className="card-header">
                                                    <h6 className="card-title mb-0">Toplam Tutar</h6>
                                                </div>
                                                <div className="card-body">
                                                    <div className="d-flex justify-content-between mb-2">
                                                        <span>Ara Toplam:</span>
                                                        <span>{new Intl.NumberFormat('tr-TR', {
                                                            style: 'currency',
                                                            currency: order.currency
                                                        }).format(order.subtotal)}</span>
                                                    </div>
                                                    <div className="d-flex justify-content-between mb-2">
                                                        <span>İndirim:</span>
                                                        <span className="text-success">-{new Intl.NumberFormat('tr-TR', {
                                                            style: 'currency',
                                                            currency: order.currency
                                                        }).format(order.discount_amount)}</span>
                                                    </div>
                                                    <div className="d-flex justify-content-between mb-2">
                                                        <span>Vergi:</span>
                                                        <span>{new Intl.NumberFormat('tr-TR', {
                                                            style: 'currency',
                                                            currency: order.currency
                                                        }).format(order.tax_amount)}</span>
                                                    </div>
                                                    <hr />
                                                    <div className="d-flex justify-content-between fw-bold fs-5">
                                                        <span>Genel Toplam:</span>
                                                        <span className="text-primary">{new Intl.NumberFormat('tr-TR', {
                                                            style: 'currency',
                                                            currency: order.currency
                                                        }).format(order.total_amount)}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Purchase Request Reference */}
                                    {order.purchase_request && (
                                        <div className="mt-4">
                                            <h6>Bağlı Satın Alma Talebi</h6>
                                            <div className="alert alert-info">
                                                <i className="fas fa-link me-2"></i>
                                                Bu sipariş <strong>{order.purchase_request.request_number}</strong> 
                                                numaralı satın alma talebinden oluşturulmuştur.
                                                <Link 
                                                    href={route('purchasing.requests.show', order.purchase_request.id)}
                                                    className="btn btn-sm btn-outline-info ms-2"
                                                >
                                                    Talebi Görüntüle
                                                </Link>
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