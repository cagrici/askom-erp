import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import PortalLayout from '@/Layouts/PortalLayout';

interface Invoice {
    id: number;
    order_number: string;
    order_date: string;
    status: string;
    total_amount: number;
}

interface Pagination {
    data: Invoice[];
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
    invoices: Pagination;
    filters: Filters;
    statuses: Record<string, string>;
}

const Index: React.FC<Props> = ({ invoices, filters, statuses }) => {
    const [searchTerm, setSearchTerm] = useState(filters.search || '');
    const [selectedStatus, setSelectedStatus] = useState(filters.status || '');
    const [dateFrom, setDateFrom] = useState(filters.date_from || '');
    const [dateTo, setDateTo] = useState(filters.date_to || '');

    const handleSearch = () => {
        router.get(route('portal.invoices.index'), {
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
        router.get(route('portal.invoices.index'));
    };

    const getStatusBadge = (status: string) => {
        const statusMap: Record<string, { label: string; class: string }> = {
            invoiced: { label: 'Faturalandı', class: 'info' },
            paid: { label: 'Ödendi', class: 'success' },
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
            <Head title="Faturalarım" />

            <div className="row mb-4">
                <div className="col">
                    <h2 className="mb-0">Faturalarım</h2>
                    <p className="text-muted">Tüm faturalarınızı görüntüleyin</p>
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
                                placeholder="Fatura numarası..."
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
                            <label className="form-label">Başlangıç Tarihi</label>
                            <input
                                type="date"
                                className="form-control"
                                value={dateFrom}
                                onChange={(e) => setDateFrom(e.target.value)}
                            />
                        </div>
                        <div className="col-md-2">
                            <label className="form-label">Bitiş Tarihi</label>
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

            {/* Invoices Table */}
            <div className="card border-0 shadow-sm">
                <div className="card-body">
                    {invoices.data.length === 0 ? (
                        <div className="text-center py-5">
                            <i className="bx bx-receipt fs-1 text-muted"></i>
                            <p className="text-muted mt-3">Henüz fatura yok</p>
                        </div>
                    ) : (
                        <>
                            <div className="table-responsive">
                                <table className="table table-hover align-middle">
                                    <thead>
                                        <tr>
                                            <th>Fatura No</th>
                                            <th>Tarih</th>
                                            <th>Tutar</th>
                                            <th>Durum</th>
                                            <th className="text-end">İşlemler</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {invoices.data.map((invoice) => (
                                            <tr key={invoice.id}>
                                                <td>
                                                    <span className="fw-bold">{invoice.order_number}</span>
                                                </td>
                                                <td>{formatDate(invoice.order_date)}</td>
                                                <td className="fw-bold">{formatCurrency(invoice.total_amount)}</td>
                                                <td>{getStatusBadge(invoice.status)}</td>
                                                <td className="text-end">
                                                    <div className="btn-group">
                                                        <Link
                                                            href={route('portal.invoices.show', invoice.id)}
                                                            className="btn btn-sm btn-outline-primary"
                                                        >
                                                            <i className="bx bx-show me-1"></i>
                                                            Detay
                                                        </Link>
                                                        <Link
                                                            href={route('portal.invoices.pdf', invoice.id)}
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
                            {invoices.last_page > 1 && (
                                <div className="d-flex justify-content-between align-items-center mt-4">
                                    <div className="text-muted">
                                        Toplam {invoices.total} fatura, sayfa {invoices.current_page} / {invoices.last_page}
                                    </div>
                                    <nav>
                                        <ul className="pagination mb-0">
                                            {invoices.links.map((link, index) => (
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
