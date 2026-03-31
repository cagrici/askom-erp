import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import PortalLayout from '@/Layouts/PortalLayout';

interface Order {
    id: number;
    order_number: string;
    order_date: string;
    status: string;
    total_amount: number;
    items_count: number;
}

interface Pagination {
    data: Order[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    links: Array<{ url: string | null; label: string; active: boolean }>;
}

interface Filters {
    status?: string;
    search?: string;
}

interface Props {
    orders: Pagination;
    filters: Filters;
    statuses: Record<string, string>;
}

const Index: React.FC<Props> = ({ orders, filters, statuses }) => {
    const [searchTerm, setSearchTerm] = useState(filters.search || '');
    const [selectedStatus, setSelectedStatus] = useState(filters.status || '');

    const handleSearch = () => {
        router.get(route('portal.orders.index'), {
            search: searchTerm,
            status: selectedStatus,
        }, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleReset = () => {
        setSearchTerm('');
        setSelectedStatus('');
        router.get(route('portal.orders.index'));
    };

    const getStatusBadge = (status: string) => {
        const statusMap: Record<string, { label: string; class: string }> = {
            pending: { label: 'Beklemede', class: 'warning' },
            confirmed: { label: 'Onaylandı', class: 'info' },
            processing: { label: 'Hazırlanıyor', class: 'primary' },
            shipped: { label: 'Kargoda', class: 'info' },
            delivered: { label: 'Teslim Edildi', class: 'success' },
            cancelled: { label: 'İptal', class: 'danger' },
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
            <Head title="Siparişlerim" />

            <div className="row mb-4">
                <div className="col">
                    <h2 className="mb-0">Siparişlerim</h2>
                    <p className="text-muted">Tüm siparişlerinizi görüntüleyin</p>
                </div>
            </div>

            {/* Filters */}
            <div className="card border-0 shadow-sm mb-4">
                <div className="card-body">
                    <div className="row g-3">
                        <div className="col-md-4">
                            <label className="form-label">Ara</label>
                            <input
                                type="text"
                                className="form-control"
                                placeholder="Sipariş numarası..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                            />
                        </div>
                        <div className="col-md-4">
                            <label className="form-label">Durum</label>
                            <select
                                className="form-select"
                                value={selectedStatus}
                                onChange={(e) => setSelectedStatus(e.target.value)}
                            >
                                <option value="">Tümü</option>
                                {Object.entries(statuses).map(([key, label]) => (
                                    <option key={key} value={key}>{label}</option>
                                ))}
                            </select>
                        </div>
                        <div className="col-md-4 d-flex align-items-end gap-2">
                            <button className="btn btn-primary flex-grow-1" onClick={handleSearch}>
                                <i className="bx bx-search me-2"></i>
                                Ara
                            </button>
                            <button className="btn btn-outline-secondary" onClick={handleReset}>
                                <i className="bx bx-reset"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Orders Table */}
            <div className="card border-0 shadow-sm">
                <div className="card-body">
                    {orders.data.length === 0 ? (
                        <div className="text-center py-5">
                            <i className="bx bx-shopping-bag fs-1 text-muted"></i>
                            <p className="text-muted mt-3">Henüz sipariş yok</p>
                        </div>
                    ) : (
                        <>
                            <div className="table-responsive">
                                <table className="table table-hover align-middle">
                                    <thead>
                                        <tr>
                                            <th>Sipariş No</th>
                                            <th>Tarih</th>
                                            <th>Ürün Sayısı</th>
                                            <th>Tutar</th>
                                            <th>Durum</th>
                                            <th className="text-end">İşlemler</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {orders.data.map((order) => (
                                            <tr key={order.id}>
                                                <td>
                                                    <span className="fw-bold">{order.order_number}</span>
                                                </td>
                                                <td>{formatDate(order.order_date)}</td>
                                                <td>
                                                    <span className="badge bg-light text-dark">
                                                        {order.items_count} ürün
                                                    </span>
                                                </td>
                                                <td className="fw-bold">{formatCurrency(order.total_amount)}</td>
                                                <td>{getStatusBadge(order.status)}</td>
                                                <td className="text-end">
                                                    <div className="btn-group">
                                                        <Link
                                                            href={route('portal.orders.show', order.id)}
                                                            className="btn btn-sm btn-outline-primary"
                                                        >
                                                            <i className="bx bx-show me-1"></i>
                                                            Detay
                                                        </Link>
                                                        <Link
                                                            href={route('portal.orders.pdf', order.id)}
                                                            className="btn btn-sm btn-outline-secondary"
                                                        >
                                                            <i className="bx bx-download"></i>
                                                        </Link>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination */}
                            {orders.last_page > 1 && (
                                <div className="d-flex justify-content-between align-items-center mt-4">
                                    <div className="text-muted">
                                        Toplam {orders.total} sipariş, sayfa {orders.current_page} / {orders.last_page}
                                    </div>
                                    <nav>
                                        <ul className="pagination mb-0">
                                            {orders.links.map((link, index) => (
                                                <li
                                                    key={index}
                                                    className={`page-item ${link.active ? 'active' : ''} ${!link.url ? 'disabled' : ''}`}
                                                >
                                                    {link.url ? (
                                                        <Link
                                                            href={link.url}
                                                            className="page-link"
                                                            dangerouslySetInnerHTML={{ __html: link.label }}
                                                        />
                                                    ) : (
                                                        <span
                                                            className="page-link"
                                                            dangerouslySetInnerHTML={{ __html: link.label }}
                                                        />
                                                    )}
                                                </li>
                                            ))}
                                        </ul>
                                    </nav>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </PortalLayout>
    );
};

export default Index;
