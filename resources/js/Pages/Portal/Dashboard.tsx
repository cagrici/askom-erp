import React from 'react';
import { Head, Link } from '@inertiajs/react';
import PortalLayout from '@/Layouts/PortalLayout';

interface Stats {
    orders_count: number;
    orders_total: number;
    pending_offers_count: number;
    active_returns_count: number;
}

interface Order {
    id: number;
    order_number: string;
    order_date: string;
    status: string;
    total_amount: number;
}

interface Offer {
    id: number;
    offer_no: string;
    offer_date: string;
    status: string;
    total_amount: number;
}

interface Return {
    id: number;
    return_no: string;
    return_date: string;
    status: string;
    total_amount: number;
}

interface Props {
    stats: Stats;
    recentOrders: Order[];
    recentOffers: Offer[];
    activeReturns: Return[];
}

const Dashboard: React.FC<Props> = ({ stats, recentOrders, recentOffers, activeReturns }) => {
    const getStatusBadge = (status: string) => {
        const statusMap: Record<string, { label: string; class: string }> = {
            pending: { label: 'Beklemede', class: 'warning' },
            confirmed: { label: 'Onaylandı', class: 'info' },
            processing: { label: 'Hazırlanıyor', class: 'primary' },
            shipped: { label: 'Kargoda', class: 'info' },
            delivered: { label: 'Teslim Edildi', class: 'success' },
            cancelled: { label: 'İptal', class: 'danger' },
            draft: { label: 'Taslak', class: 'secondary' },
            sent: { label: 'Gönderildi', class: 'info' },
            accepted: { label: 'Kabul Edildi', class: 'success' },
            rejected: { label: 'Reddedildi', class: 'danger' },
            pending_approval: { label: 'Onay Bekliyor', class: 'warning' },
            approved: { label: 'Onaylandı', class: 'success' },
            completed: { label: 'Tamamlandı', class: 'success' },
        };
        const { label, class: badgeClass } = statusMap[status] || { label: status, class: 'secondary' };
        return <span className={`badge bg-${badgeClass}`}>{label}</span>;
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
            <Head title="ASKOM B2B Portal - Ana Sayfa" />

            <div className="row mb-4">
                <div className="col">
                    <h2 className="mb-0">Hoş Geldiniz!</h2>
                    <p className="text-muted">İşlemlerinize genel bakış</p>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="row g-3 mb-4">
                <div className="col-md-3">
                    <div className="card border-0 shadow-sm">
                        <div className="card-body">
                            <div className="d-flex align-items-center">
                                <div className="flex-shrink-0 bg-primary bg-opacity-10 rounded p-3">
                                    <i className="bx bx-shopping-bag text-primary fs-3"></i>
                                </div>
                                <div className="flex-grow-1 ms-3">
                                    <h6 className="text-muted mb-1">Son 30 Gün</h6>
                                    <h3 className="mb-0">{stats.orders_count}</h3>
                                    <small className="text-muted">Sipariş</small>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="col-md-3">
                    <div className="card border-0 shadow-sm">
                        <div className="card-body">
                            <div className="d-flex align-items-center">
                                <div className="flex-shrink-0 bg-success bg-opacity-10 rounded p-3">
                                    <i className="bx bx-money text-success fs-3"></i>
                                </div>
                                <div className="flex-grow-1 ms-3">
                                    <h6 className="text-muted mb-1">Toplam Tutar</h6>
                                    <h3 className="mb-0">{formatCurrency(stats.orders_total)}</h3>
                                    <small className="text-muted">Son 30 gün</small>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="col-md-3">
                    <div className="card border-0 shadow-sm">
                        <div className="card-body">
                            <div className="d-flex align-items-center">
                                <div className="flex-shrink-0 bg-warning bg-opacity-10 rounded p-3">
                                    <i className="bx bx-file text-warning fs-3"></i>
                                </div>
                                <div className="flex-grow-1 ms-3">
                                    <h6 className="text-muted mb-1">Bekleyen Teklifler</h6>
                                    <h3 className="mb-0">{stats.pending_offers_count}</h3>
                                    <small className="text-muted">Teklif</small>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="col-md-3">
                    <div className="card border-0 shadow-sm">
                        <div className="card-body">
                            <div className="d-flex align-items-center">
                                <div className="flex-shrink-0 bg-danger bg-opacity-10 rounded p-3">
                                    <i className="bx bx-arrow-back text-danger fs-3"></i>
                                </div>
                                <div className="flex-grow-1 ms-3">
                                    <h6 className="text-muted mb-1">Aktif İadeler</h6>
                                    <h3 className="mb-0">{stats.active_returns_count}</h3>
                                    <small className="text-muted">İade</small>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="row mb-4">
                <div className="col">
                    <div className="card border-0 shadow-sm">
                        <div className="card-body">
                            <h5 className="card-title mb-3">Hızlı İşlemler</h5>
                            <div className="d-flex gap-2 flex-wrap">
                                <Link
                                    href={route('portal.returns.create')}
                                    className="btn btn-primary"
                                >
                                    <i className="bx bx-plus me-2"></i>
                                    Yeni İade Talebi
                                </Link>
                                <Link
                                    href={route('portal.orders.index')}
                                    className="btn btn-outline-primary"
                                >
                                    <i className="bx bx-list-ul me-2"></i>
                                    Tüm Siparişler
                                </Link>
                                <Link
                                    href={route('portal.offers.index')}
                                    className="btn btn-outline-primary"
                                >
                                    <i className="bx bx-file me-2"></i>
                                    Bekleyen Teklifler
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="row g-3">
                {/* Recent Orders */}
                <div className="col-md-6">
                    <div className="card border-0 shadow-sm h-100">
                        <div className="card-header bg-white border-0 d-flex justify-content-between align-items-center">
                            <h5 className="mb-0">Son Siparişler</h5>
                            <Link href={route('portal.orders.index')} className="btn btn-sm btn-link">
                                Tümünü Gör
                            </Link>
                        </div>
                        <div className="card-body">
                            {recentOrders.length === 0 ? (
                                <p className="text-muted text-center py-4">Henüz sipariş yok</p>
                            ) : (
                                <div className="list-group list-group-flush">
                                    {recentOrders.map((order) => (
                                        <Link
                                            key={order.id}
                                            href={route('portal.orders.show', order.id)}
                                            className="list-group-item list-group-item-action border-0 px-0"
                                        >
                                            <div className="d-flex justify-content-between align-items-center">
                                                <div>
                                                    <div className="fw-bold">{order.order_number}</div>
                                                    <small className="text-muted">{formatDate(order.order_date)}</small>
                                                </div>
                                                <div className="text-end">
                                                    <div className="fw-bold">{formatCurrency(order.total_amount)}</div>
                                                    {getStatusBadge(order.status)}
                                                </div>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Recent Offers */}
                <div className="col-md-6">
                    <div className="card border-0 shadow-sm h-100">
                        <div className="card-header bg-white border-0 d-flex justify-content-between align-items-center">
                            <h5 className="mb-0">Son Teklifler</h5>
                            <Link href={route('portal.offers.index')} className="btn btn-sm btn-link">
                                Tümünü Gör
                            </Link>
                        </div>
                        <div className="card-body">
                            {recentOffers.length === 0 ? (
                                <p className="text-muted text-center py-4">Henüz teklif yok</p>
                            ) : (
                                <div className="list-group list-group-flush">
                                    {recentOffers.map((offer) => (
                                        <Link
                                            key={offer.id}
                                            href={route('portal.offers.show', offer.id)}
                                            className="list-group-item list-group-item-action border-0 px-0"
                                        >
                                            <div className="d-flex justify-content-between align-items-center">
                                                <div>
                                                    <div className="fw-bold">{offer.offer_no}</div>
                                                    <small className="text-muted">{formatDate(offer.offer_date)}</small>
                                                </div>
                                                <div className="text-end">
                                                    <div className="fw-bold">{formatCurrency(offer.total_amount)}</div>
                                                    {getStatusBadge(offer.status)}
                                                </div>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Active Returns */}
                {activeReturns.length > 0 && (
                    <div className="col-12">
                        <div className="card border-0 shadow-sm">
                            <div className="card-header bg-white border-0 d-flex justify-content-between align-items-center">
                                <h5 className="mb-0">Aktif İade Talepleri</h5>
                                <Link href={route('portal.returns.index')} className="btn btn-sm btn-link">
                                    Tümünü Gör
                                </Link>
                            </div>
                            <div className="card-body">
                                <div className="table-responsive">
                                    <table className="table table-hover">
                                        <thead>
                                            <tr>
                                                <th>İade No</th>
                                                <th>Tarih</th>
                                                <th>Tutar</th>
                                                <th>Durum</th>
                                                <th></th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {activeReturns.map((returnItem) => (
                                                <tr key={returnItem.id}>
                                                    <td className="fw-bold">{returnItem.return_no}</td>
                                                    <td>{formatDate(returnItem.return_date)}</td>
                                                    <td>{formatCurrency(returnItem.total_amount)}</td>
                                                    <td>{getStatusBadge(returnItem.status)}</td>
                                                    <td className="text-end">
                                                        <Link
                                                            href={route('portal.returns.show', returnItem.id)}
                                                            className="btn btn-sm btn-outline-primary"
                                                        >
                                                            Detay
                                                        </Link>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </PortalLayout>
    );
};

export default Dashboard;
