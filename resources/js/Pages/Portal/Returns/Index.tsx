import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import PortalLayout from '@/Layouts/PortalLayout';

interface SalesReturn {
    id: number;
    return_no: string;
    return_date: string;
    status: string;
    status_label: string;
    total_amount: number;
    sales_order: {
        order_number: string;
    };
}

interface Pagination {
    data: SalesReturn[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    links: Array<{ url: string | null; label: string; active: boolean }>;
}

interface Filters {
    status?: string;
    search?: string;
    date_from?: string;
    date_to?: string;
}

interface Props {
    returns: Pagination;
    filters: Filters;
    statuses: Record<string, string>;
}

const Index: React.FC<Props> = ({ returns, filters, statuses }) => {
    const [searchTerm, setSearchTerm] = useState(filters.search || '');
    const [selectedStatus, setSelectedStatus] = useState(filters.status || '');
    const [dateFrom, setDateFrom] = useState(filters.date_from || '');
    const [dateTo, setDateTo] = useState(filters.date_to || '');

    const handleSearch = () => {
        router.get(route('portal.returns.index'), {
            search: searchTerm,
            status: selectedStatus,
            date_from: dateFrom,
            date_to: dateTo,
        }, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleReset = () => {
        setSearchTerm('');
        setSelectedStatus('');
        setDateFrom('');
        setDateTo('');
        router.get(route('portal.returns.index'));
    };

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
            <Head title="İadelerim" />

            <div className="row mb-4">
                <div className="col">
                    <div className="d-flex justify-content-between align-items-center">
                        <div>
                            <h2 className="mb-0">İadelerim</h2>
                            <p className="text-muted">İade taleplerinizi görüntüleyin ve yeni talep oluşturun</p>
                        </div>
                        <div>
                            <Link href={route('portal.returns.create')} className="btn btn-primary">
                                <i className="bx bx-plus me-2"></i>
                                Yeni İade Talebi
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="card border-0 shadow-sm mb-4">
                <div className="card-body">
                    <div className="row g-3">
                        <div className="col-md-3">
                            <label className="form-label">Ara</label>
                            <input
                                type="text"
                                className="form-control"
                                placeholder="İade numarası..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                            />
                        </div>
                        <div className="col-md-3">
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
                        <div className="col-md-2">
                            <label className="form-label">Başlangıç</label>
                            <input
                                type="date"
                                className="form-control"
                                value={dateFrom}
                                onChange={(e) => setDateFrom(e.target.value)}
                            />
                        </div>
                        <div className="col-md-2">
                            <label className="form-label">Bitiş</label>
                            <input
                                type="date"
                                className="form-control"
                                value={dateTo}
                                onChange={(e) => setDateTo(e.target.value)}
                            />
                        </div>
                        <div className="col-md-2 d-flex align-items-end gap-2">
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

            {/* Returns Table */}
            <div className="card border-0 shadow-sm">
                <div className="card-body">
                    {returns.data.length === 0 ? (
                        <div className="text-center py-5">
                            <i className="bx bx-arrow-back fs-1 text-muted"></i>
                            <p className="text-muted mt-3">Henüz iade talebi yok</p>
                            <Link href={route('portal.returns.create')} className="btn btn-primary">
                                <i className="bx bx-plus me-2"></i>
                                İlk İade Talebinizi Oluşturun
                            </Link>
                        </div>
                    ) : (
                        <>
                            <div className="table-responsive">
                                <table className="table table-hover align-middle">
                                    <thead>
                                        <tr>
                                            <th>İade No</th>
                                            <th>Sipariş No</th>
                                            <th>Tarih</th>
                                            <th>Tutar</th>
                                            <th>Durum</th>
                                            <th className="text-end">İşlemler</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {returns.data.map((returnItem) => (
                                            <tr key={returnItem.id}>
                                                <td>
                                                    <span className="fw-bold">{returnItem.return_no}</span>
                                                </td>
                                                <td>{returnItem.sales_order.order_number}</td>
                                                <td>{formatDate(returnItem.return_date)}</td>
                                                <td className="fw-bold">{formatCurrency(returnItem.total_amount)}</td>
                                                <td>{getStatusBadge(returnItem.status)}</td>
                                                <td className="text-end">
                                                    <Link
                                                        href={route('portal.returns.show', returnItem.id)}
                                                        className="btn btn-sm btn-outline-primary"
                                                    >
                                                        <i className="bx bx-show me-1"></i>
                                                        Detay
                                                    </Link>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination */}
                            {returns.last_page > 1 && (
                                <div className="d-flex justify-content-between align-items-center mt-4">
                                    <div className="text-muted">
                                        Toplam {returns.total} iade, sayfa {returns.current_page} / {returns.last_page}
                                    </div>
                                    <nav>
                                        <ul className="pagination mb-0">
                                            {returns.links.map((link, index) => (
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
