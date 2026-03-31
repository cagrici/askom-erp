import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import Layout from '../../../Layouts';
import { PurchaseOrder, CurrentAccount, Location } from '@/types/purchasing';
import { PaginatedData, PageProps } from '@/types';

interface OrdersIndexProps extends PageProps {
    orders: PaginatedData<PurchaseOrder>;
    suppliers: CurrentAccount[];
    locations: Location[];
    filters: {
        status?: string;
        supplier_id?: number;
        location_id?: number;
        search?: string;
        order_date_from?: string;
        order_date_to?: string;
        sort_field?: string;
        sort_direction?: string;
    };
}

export default function Index({ orders, suppliers, locations, filters }: OrdersIndexProps) {
    const [searchTerm, setSearchTerm] = useState(filters.search || '');
    const [selectedStatus, setSelectedStatus] = useState(filters.status || '');
    const [selectedSupplier, setSelectedSupplier] = useState(filters.supplier_id || '');
    const [selectedLocation, setSelectedLocation] = useState(filters.location_id || '');
    const [dateFrom, setDateFrom] = useState(filters.order_date_from || '');
    const [dateTo, setDateTo] = useState(filters.order_date_to || '');

    const handleFilter = () => {
        router.get(route('purchasing.orders.index'), {
            search: searchTerm,
            status: selectedStatus,
            supplier_id: selectedSupplier,
            location_id: selectedLocation,
            order_date_from: dateFrom,
            order_date_to: dateTo,
        }, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleClearFilters = () => {
        setSearchTerm('');
        setSelectedStatus('');
        setSelectedSupplier('');
        setSelectedLocation('');
        setDateFrom('');
        setDateTo('');
        router.get(route('purchasing.orders.index'));
    };

    const handleSort = (field: string) => {
        const direction = filters.sort_field === field && filters.sort_direction === 'asc' ? 'desc' : 'asc';
        router.get(route('purchasing.orders.index'), {
            ...filters,
            sort_field: field,
            sort_direction: direction,
        }, {
            preserveState: true,
            preserveScroll: true,
        });
    };

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

    return (
        <Layout>
            <Head title="Satın Alma Siparişleri" />
<div className="page-content">
            <div className="container-fluid">
                <div className="row">
                    <div className="col-12">
                        <div className="card">
                            <div className="card-header d-flex justify-content-between align-items-center">
                                <h3 className="card-title">Satın Alma Siparişleri</h3>
                                <Link
                                    href={route('purchasing.orders.create')}
                                    className="btn btn-primary"
                                >
                                    <i className="fas fa-plus me-2"></i>
                                    Yeni Sipariş
                                </Link>
                            </div>

                            <div className="card-body">
                                {/* Filters */}
                                <div className="row mb-3">
                                    <div className="col-md-3">
                                        <input
                                            type="text"
                                            className="form-control"
                                            placeholder="Ara..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                        />
                                    </div>
                                    <div className="col-md-2">
                                        <select
                                            className="form-select"
                                            value={selectedStatus}
                                            onChange={(e) => setSelectedStatus(e.target.value)}
                                        >
                                            <option value="">Tüm Durumlar</option>
                                            <option value="draft">Taslak</option>
                                            <option value="pending">Beklemede</option>
                                            <option value="approved">Onaylandı</option>
                                            <option value="sent">Gönderildi</option>
                                            <option value="partial">Kısmi</option>
                                            <option value="completed">Tamamlandı</option>
                                            <option value="cancelled">İptal</option>
                                        </select>
                                    </div>
                                    <div className="col-md-2">
                                        <select
                                            className="form-select"
                                            value={selectedSupplier}
                                            onChange={(e) => setSelectedSupplier(e.target.value)}
                                        >
                                            <option value="">Tüm Tedarikçiler</option>
                                            {suppliers.map((supplier) => (
                                                <option key={supplier.id} value={supplier.id}>
                                                    {supplier.title}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="col-md-2">
                                        <select
                                            className="form-select"
                                            value={selectedLocation}
                                            onChange={(e) => setSelectedLocation(e.target.value)}
                                        >
                                            <option value="">Tüm Lokasyonlar</option>
                                            {locations.map((location) => (
                                                <option key={location.id} value={location.id}>
                                                    {location.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="col-md-3">
                                        <div className="input-group">
                                            <button
                                                className="btn btn-outline-secondary"
                                                type="button"
                                                onClick={handleFilter}
                                            >
                                                <i className="ri ri-search-line"></i>
                                            </button>
                                            <button
                                                className="btn btn-outline-secondary"
                                                type="button"
                                                onClick={handleClearFilters}
                                            >
                                                <i className="fas fa-times"></i>
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Date Filters */}
                                <div className="row mb-3">
                                    <div className="col-md-3">
                                        <label className="form-label">Başlangıç Tarihi</label>
                                        <input
                                            type="date"
                                            className="form-control"
                                            value={dateFrom}
                                            onChange={(e) => setDateFrom(e.target.value)}
                                        />
                                    </div>
                                    <div className="col-md-3">
                                        <label className="form-label">Bitiş Tarihi</label>
                                        <input
                                            type="date"
                                            className="form-control"
                                            value={dateTo}
                                            onChange={(e) => setDateTo(e.target.value)}
                                        />
                                    </div>
                                </div>

                                {/* Orders Table */}
                                <div className="table-responsive">
                                    <table className="table table-striped table-hover">
                                        <thead>
                                            <tr>
                                                <th
                                                    className="sortable"
                                                    onClick={() => handleSort('order_number')}
                                                >
                                                    Sipariş No
                                                    {filters.sort_field === 'order_number' && (
                                                        <i className={`fas fa-sort-${filters.sort_direction === 'asc' ? 'up' : 'down'} ms-1`}></i>
                                                    )}
                                                </th>
                                                <th
                                                    className="sortable"
                                                    onClick={() => handleSort('title')}
                                                >
                                                    Başlık
                                                    {filters.sort_field === 'title' && (
                                                        <i className={`fas fa-sort-${filters.sort_direction === 'asc' ? 'up' : 'down'} ms-1`}></i>
                                                    )}
                                                </th>
                                                <th>Tedarikçi</th>
                                                <th>Lokasyon</th>
                                                <th
                                                    className="sortable"
                                                    onClick={() => handleSort('order_date')}
                                                >
                                                    Sipariş Tarihi
                                                    {filters.sort_field === 'order_date' && (
                                                        <i className={`fas fa-sort-${filters.sort_direction === 'asc' ? 'up' : 'down'} ms-1`}></i>
                                                    )}
                                                </th>
                                                <th>Teslimat Tarihi</th>
                                                <th>Durum</th>
                                                <th>Öncelik</th>
                                                <th
                                                    className="sortable"
                                                    onClick={() => handleSort('total_amount')}
                                                >
                                                    Toplam
                                                    {filters.sort_field === 'total_amount' && (
                                                        <i className={`fas fa-sort-${filters.sort_direction === 'asc' ? 'up' : 'down'} ms-1`}></i>
                                                    )}
                                                </th>
                                                <th>İşlemler</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {orders.data.length > 0 ? (
                                                orders.data.map((order) => (
                                                    <tr key={order.id}>
                                                        <td>
                                                            <Link
                                                                href={route('purchasing.orders.show', order.id)}
                                                                className="text-decoration-none fw-bold"
                                                            >
                                                                {order.order_number}
                                                            </Link>
                                                        </td>
                                                        <td>{order.title}</td>
                                                        <td>{order.supplier?.title}</td>
                                                        <td>{order.location?.name}</td>
                                                        <td>{new Date(order.order_date).toLocaleDateString('tr-TR')}</td>
                                                        <td>{new Date(order.delivery_date).toLocaleDateString('tr-TR')}</td>
                                                        <td>{getStatusBadge(order.status)}</td>
                                                        <td>{getPriorityBadge(order.priority)}</td>
                                                        <td>
                                                            {new Intl.NumberFormat('tr-TR', {
                                                                style: 'currency',
                                                                currency: order.currency
                                                            }).format(order.total_amount)}
                                                        </td>
                                                        <td>
                                                            <div className="btn-group" role="group">
                                                                <Link
                                                                    href={route('purchasing.orders.show', order.id)}
                                                                    className="btn btn-sm btn-outline-primary"
                                                                    title="Görüntüle"
                                                                >
                                                                    <i className="fas fa-eye"></i>
                                                                </Link>
                                                                {(order.status === 'draft' || order.status === 'pending') && (
                                                                    <Link
                                                                        href={route('purchasing.orders.edit', order.id)}
                                                                        className="btn btn-sm btn-outline-warning"
                                                                        title="Düzenle"
                                                                    >
                                                                        <i className="fas fa-edit"></i>
                                                                    </Link>
                                                                )}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr>
                                                    <td colSpan={10} className="text-center py-4">
                                                        <div className="text-muted">
                                                            <i className="fas fa-inbox fa-3x mb-3"></i>
                                                            <p>Henüz satın alma siparişi bulunmuyor.</p>
                                                            <Link
                                                                href={route('purchasing.orders.create')}
                                                                className="btn btn-primary"
                                                            >
                                                                İlk Siparişi Oluştur
                                                            </Link>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Pagination */}
                                {orders.data.length > 0 && (
                                    <div className="d-flex justify-content-between align-items-center mt-3">
                                        <div className="text-muted">
                                            {orders.from} - {orders.to} arası, toplam {orders.total} kayıt
                                        </div>
                                        {orders.links && (
                                            <nav>
                                                <div className="d-flex">
                                                    {orders.links.map((link, index) => (
                                                        <button
                                                            key={index}
                                                            className={`btn btn-sm ${
                                                                link.active
                                                                    ? 'btn-primary'
                                                                    : link.url
                                                                        ? 'btn-outline-primary'
                                                                        : 'btn-outline-secondary disabled'
                                                            } mx-1`}
                                                            onClick={() => link.url && router.get(link.url)}
                                                            disabled={!link.url}
                                                            dangerouslySetInnerHTML={{ __html: link.label }}
                                                        />
                                                    ))}
                                                </div>
                                            </nav>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
</div>
            <style jsx>{`
                .sortable {
                    cursor: pointer;
                    user-select: none;
                }
                .sortable:hover {
                    background-color: rgba(0, 0, 0, 0.05);
                }
            `}</style>
        </Layout>
    );
}
