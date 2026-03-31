import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import PortalLayout from '@/Layouts/PortalLayout';

interface Offer {
    id: number;
    offer_no: string;
    offer_date: string;
    valid_until: string;
    status: string;
    total_amount: number;
    currency: {
        code: string;
        symbol: string;
    };
}

interface Pagination {
    data: Offer[];
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
    offers: Pagination;
    filters: Filters;
    statuses: Record<string, string>;
}

const Index: React.FC<Props> = ({ offers, filters, statuses }) => {
    const [searchTerm, setSearchTerm] = useState(filters.search || '');
    const [selectedStatus, setSelectedStatus] = useState(filters.status || '');

    const handleSearch = () => {
        router.get(route('portal.offers.index'), {
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
        router.get(route('portal.offers.index'));
    };

    const getStatusBadge = (status: string) => {
        const statusMap: Record<string, { label: string; class: string }> = {
            draft: { label: 'Taslak', class: 'secondary' },
            sent: { label: 'Gönderildi', class: 'info' },
            accepted: { label: 'Kabul Edildi', class: 'success' },
            rejected: { label: 'Reddedildi', class: 'danger' },
            expired: { label: 'Süresi Doldu', class: 'warning' },
        };
        const { label, class: badgeClass } = statusMap[status] || { label: status, class: 'secondary' };
        return <span className={`badge bg-${badgeClass}`}>{label}</span>;
    };

    const formatCurrency = (amount: number | null | undefined, currency: { code: string; symbol: string }) => {
        const value = amount ?? 0;
        return `${currency.symbol}${new Intl.NumberFormat('tr-TR', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(value)}`;
    };

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('tr-TR');
    };

    const isExpired = (validUntil: string) => {
        return new Date(validUntil) < new Date();
    };

    return (
        <PortalLayout>
            <Head title="Tekliflerim" />

            <div className="row mb-4">
                <div className="col">
                    <h2 className="mb-0">Tekliflerim</h2>
                    <p className="text-muted">Size gönderilen tüm teklifleri görüntüleyin</p>
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
                                placeholder="Teklif numarası..."
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

            {/* Offers Table */}
            <div className="card border-0 shadow-sm">
                <div className="card-body">
                    {offers.data.length === 0 ? (
                        <div className="text-center py-5">
                            <i className="bx bx-file fs-1 text-muted"></i>
                            <p className="text-muted mt-3">Henüz teklif yok</p>
                        </div>
                    ) : (
                        <>
                            <div className="table-responsive">
                                <table className="table table-hover align-middle">
                                    <thead>
                                        <tr>
                                            <th>Teklif No</th>
                                            <th>Teklif Tarihi</th>
                                            <th>Geçerlilik Tarihi</th>
                                            <th>Tutar</th>
                                            <th>Durum</th>
                                            <th className="text-end">İşlemler</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {offers.data.map((offer) => (
                                            <tr key={offer.id}>
                                                <td>
                                                    <span className="fw-bold">{offer.offer_no}</span>
                                                </td>
                                                <td>{formatDate(offer.offer_date)}</td>
                                                <td>
                                                    <span className={isExpired(offer.valid_until) ? 'text-danger' : ''}>
                                                        {formatDate(offer.valid_until)}
                                                        {isExpired(offer.valid_until) && (
                                                            <i className="bx bx-error ms-1"></i>
                                                        )}
                                                    </span>
                                                </td>
                                                <td className="fw-bold">{formatCurrency(offer.total_amount, offer.currency)}</td>
                                                <td>{getStatusBadge(offer.status)}</td>
                                                <td className="text-end">
                                                    <div className="btn-group">
                                                        <Link
                                                            href={route('portal.offers.show', offer.id)}
                                                            className="btn btn-sm btn-outline-primary"
                                                        >
                                                            <i className="bx bx-show me-1"></i>
                                                            Detay
                                                        </Link>
                                                        <a
                                                            href={route('portal.offers.pdf', offer.id)}
                                                            className="btn btn-sm btn-outline-secondary"
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                        >
                                                            <i className="bx bx-download"></i>
                                                        </a>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination */}
                            {offers.last_page > 1 && (
                                <div className="d-flex justify-content-between align-items-center mt-4">
                                    <div className="text-muted">
                                        Toplam {offers.total} teklif, sayfa {offers.current_page} / {offers.last_page}
                                    </div>
                                    <nav>
                                        <ul className="pagination mb-0">
                                            {offers.links.map((link, index) => (
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
