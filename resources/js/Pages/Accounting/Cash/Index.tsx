import React, { useState, useEffect, useRef } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import Layout from '../../../Layouts';

interface Location {
    id: number;
    name: string;
}

interface User {
    id: number;
    name: string;
}

interface CashAccount {
    id: number;
    account_code: string;
    account_name: string;
    location?: Location;
    responsible_user?: User;
    currency: string;
    current_balance: number;
    is_active: boolean;
    status_text: string;
    status_color: string;
    formatted_balance: string;
    needs_count: boolean;
}

interface PaginatedData<T> {
    data: T[];
    total: number;
    per_page: number;
    current_page: number;
    last_page: number;
    from: number;
    to: number;
    links: {
        url: string | null;
        label: string;
        active: boolean;
    }[];
}

interface Stats {
    total_accounts: number;
    active_accounts: number;
    total_balance_try: number;
    total_balance_usd: number;
    total_balance_eur: number;
    today_income: number;
    today_expense: number;
    yesterday_income: number;
    yesterday_expense: number;
    accounts_need_count: number;
}

interface Filters {
    search?: string;
    location_id?: number;
    currency?: string;
    is_active?: string;
}

interface Props {
    cashAccounts: PaginatedData<CashAccount>;
    locations: Location[];
    users: User[];
    stats: Stats;
    filters: Filters;
}

export default function Index({ cashAccounts, locations, users, stats, filters }: Props) {
    const [searchTerm, setSearchTerm] = useState(filters.search || '');
    const [selectedLocation, setSelectedLocation] = useState(filters.location_id?.toString() || '');
    const [selectedCurrency, setSelectedCurrency] = useState(filters.currency || '');
    const [selectedStatus, setSelectedStatus] = useState(filters.is_active || '');
    const [openDropdown, setOpenDropdown] = useState<number | null>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setOpenDropdown(null);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const toggleDropdown = (accountId: number) => {
        setOpenDropdown(openDropdown === accountId ? null : accountId);
    };

    const handleSearch = () => {
        router.get(route('accounting.cash.index'), {
            search: searchTerm,
            location_id: selectedLocation || undefined,
            currency: selectedCurrency || undefined,
            is_active: selectedStatus || undefined,
        });
    };

    const handleClearFilters = () => {
        setSearchTerm('');
        setSelectedLocation('');
        setSelectedCurrency('');
        setSelectedStatus('');
        router.get(route('accounting.cash.index'));
    };

    const formatCurrency = (amount: number, currency: string = 'TRY') => {
        return new Intl.NumberFormat('tr-TR', {
            style: 'currency',
            currency: currency,
        }).format(amount);
    };

    const getChangePercentage = (today: number, yesterday: number) => {
        if (yesterday === 0) return today > 0 ? 100 : 0;
        return ((today - yesterday) / yesterday) * 100;
    };

    return (
        <Layout>
            <Head title="Kasa İşlemleri" />
            <div className="page-content">
                <div className="container-fluid">
                    <div className="row">
                        <div className="col-12">
                            <div className="page-title-box d-sm-flex align-items-center justify-content-between">
                                <h4 className="mb-sm-0">Kasa İşlemleri</h4>
                                <div className="page-title-right">
                                    <ol className="breadcrumb m-0">
                                        <li className="breadcrumb-item">
                                            <Link href={route('dashboard')}>Dashboard</Link>
                                        </li>
                                        <li className="breadcrumb-item">Muhasebe</li>
                                        <li className="breadcrumb-item active">Kasa İşlemleri</li>
                                    </ol>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Statistics Cards */}
                    <div className="row mb-4">
                        <div className="col-md-3">
                            <div className="card">
                                <div className="card-body">
                                    <div className="d-flex justify-content-between align-items-center">
                                        <div>
                                            <p className="text-muted mb-1">Toplam Kasa</p>
                                            <h4 className="mb-0">{stats.total_accounts}</h4>
                                            <small className="text-success">{stats.active_accounts} Aktif</small>
                                        </div>
                                        <div className="avatar-sm">
                                            <span className="avatar-title bg-primary-subtle rounded-circle">
                                                <i className="fas fa-cash-register text-primary fa-2x"></i>
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="col-md-3">
                            <div className="card">
                                <div className="card-body">
                                    <div className="d-flex justify-content-between align-items-center">
                                        <div>
                                            <p className="text-muted mb-1">TRY Bakiye</p>
                                            <h5 className="mb-0">{formatCurrency(stats.total_balance_try, 'TRY')}</h5>
                                            {stats.total_balance_usd > 0 && (
                                                <small className="text-muted">USD: {formatCurrency(stats.total_balance_usd, 'USD')}</small>
                                            )}
                                        </div>
                                        <div className="avatar-sm">
                                            <span className="avatar-title bg-success-subtle rounded-circle">
                                                <i className="fas fa-lira-sign text-success fa-2x"></i>
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="col-md-3">
                            <div className="card">
                                <div className="card-body">
                                    <div className="d-flex justify-content-between align-items-center">
                                        <div>
                                            <p className="text-muted mb-1">Bugün Giriş</p>
                                            <h5 className="mb-0 text-success">{formatCurrency(stats.today_income)}</h5>
                                            {stats.yesterday_income > 0 && (
                                                <small className={`${getChangePercentage(stats.today_income, stats.yesterday_income) >= 0 ? 'text-success' : 'text-danger'}`}>
                                                    {getChangePercentage(stats.today_income, stats.yesterday_income).toFixed(1)}% dünden
                                                </small>
                                            )}
                                        </div>
                                        <div className="avatar-sm">
                                            <span className="avatar-title bg-success-subtle rounded-circle">
                                                <i className="fas fa-arrow-down text-success fa-2x"></i>
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="col-md-3">
                            <div className="card">
                                <div className="card-body">
                                    <div className="d-flex justify-content-between align-items-center">
                                        <div>
                                            <p className="text-muted mb-1">Bugün Çıkış</p>
                                            <h5 className="mb-0 text-danger">{formatCurrency(stats.today_expense)}</h5>
                                            {stats.yesterday_expense > 0 && (
                                                <small className={`${getChangePercentage(stats.today_expense, stats.yesterday_expense) >= 0 ? 'text-danger' : 'text-success'}`}>
                                                    {getChangePercentage(stats.today_expense, stats.yesterday_expense).toFixed(1)}% dünden
                                                </small>
                                            )}
                                        </div>
                                        <div className="avatar-sm">
                                            <span className="avatar-title bg-danger-subtle rounded-circle">
                                                <i className="fas fa-arrow-up text-danger fa-2x"></i>
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Count Warning */}
                    {stats.accounts_need_count > 0 && (
                        <div className="row mb-3">
                            <div className="col-12">
                                <div className="alert alert-warning d-flex align-items-center" role="alert">
                                    <i className="fas fa-exclamation-triangle me-2"></i>
                                    <div>
                                        <strong>Dikkat!</strong> {stats.accounts_need_count} kasa sayım bekliyor.
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Filters */}
                    <div className="row mb-4">
                        <div className="col-12">
                            <div className="card">
                                <div className="card-header">
                                    <h5 className="card-title mb-0">
                                        <i className="fas fa-filter me-2"></i>
                                        Filtreler
                                    </h5>
                                </div>
                                <div className="card-body">
                                    <div className="row g-3">
                                        <div className="col-md-4">
                                            <label className="form-label">Arama</label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                placeholder="Kasa kodu, adı..."
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                                            />
                                        </div>
                                        <div className="col-md-3">
                                            <label className="form-label">Lokasyon</label>
                                            <select
                                                className="form-select"
                                                value={selectedLocation}
                                                onChange={(e) => setSelectedLocation(e.target.value)}
                                            >
                                                <option value="">Tümü</option>
                                                {locations.map((location) => (
                                                    <option key={location.id} value={location.id}>
                                                        {location.name}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="col-md-2">
                                            <label className="form-label">Para Birimi</label>
                                            <select
                                                className="form-select"
                                                value={selectedCurrency}
                                                onChange={(e) => setSelectedCurrency(e.target.value)}
                                            >
                                                <option value="">Tümü</option>
                                                <option value="TRY">TRY</option>
                                                <option value="USD">USD</option>
                                                <option value="EUR">EUR</option>
                                            </select>
                                        </div>
                                        <div className="col-md-3">
                                            <label className="form-label">Durum</label>
                                            <select
                                                className="form-select"
                                                value={selectedStatus}
                                                onChange={(e) => setSelectedStatus(e.target.value)}
                                            >
                                                <option value="">Tümü</option>
                                                <option value="1">Aktif</option>
                                                <option value="0">Pasif</option>
                                            </select>
                                        </div>
                                        <div className="col-12 d-flex align-items-end">
                                            <button
                                                className="btn btn-primary me-2"
                                                onClick={handleSearch}
                                            >
                                                <i className="ri ri-search-line me-1"></i>
                                                Ara
                                            </button>
                                            <button
                                                className="btn btn-secondary"
                                                onClick={handleClearFilters}
                                            >
                                                <i className="fas fa-times me-1"></i>
                                                Temizle
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="row mb-3">
                        <div className="col-12">
                            <div className="d-flex justify-content-between align-items-center">
                                <div>
                                    <h5 className="mb-0">
                                        Toplam {cashAccounts.total} kasa bulundu
                                    </h5>
                                </div>
                                <div>
                                    <Link
                                        href={route('accounting.cash.create')}
                                        className="btn btn-primary"
                                    >
                                        <i className="fas fa-plus me-1"></i>
                                        Yeni Kasa
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="row">
                        <div className="col-12">
                            <div className="card">
                                <div className="card-body">
                                    <div className="table-responsive">
                                        <table className="table table-hover">
                                            <thead>
                                                <tr>
                                                    <th>Kasa Kodu</th>
                                                    <th>Kasa Adı</th>
                                                    <th>Lokasyon</th>
                                                    <th>Sorumlu</th>
                                                    <th>Para Birimi</th>
                                                    <th className="text-end">Bakiye</th>
                                                    <th>Durum</th>
                                                    <th>Sayım</th>
                                                    <th>İşlemler</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {cashAccounts.data.length === 0 ? (
                                                    <tr>
                                                        <td colSpan={9} className="text-center py-4">
                                                            <div className="d-flex flex-column align-items-center">
                                                                <i className="fas fa-inbox fa-3x text-muted mb-3"></i>
                                                                <p className="text-muted">Henüz kasa bulunmuyor.</p>
                                                                <Link
                                                                    href={route('accounting.cash.create')}
                                                                    className="btn btn-primary"
                                                                >
                                                                    İlk Kasayı Oluştur
                                                                </Link>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ) : (
                                                    cashAccounts.data.map((account) => (
                                                        <tr key={account.id}>
                                                            <td>
                                                                <span className="fw-medium">
                                                                    {account.account_code}
                                                                </span>
                                                            </td>
                                                            <td>
                                                                <span className="text-muted">
                                                                    {account.account_name}
                                                                </span>
                                                            </td>
                                                            <td>
                                                                <span className="text-muted">
                                                                    {account.location?.name || '-'}
                                                                </span>
                                                            </td>
                                                            <td>
                                                                <span className="text-muted">
                                                                    {account.responsible_user?.name || '-'}
                                                                </span>
                                                            </td>
                                                            <td>
                                                                <span className="badge bg-secondary">
                                                                    {account.currency}
                                                                </span>
                                                            </td>
                                                            <td className="text-end">
                                                                <span className="fw-medium">
                                                                    {account.formatted_balance}
                                                                </span>
                                                            </td>
                                                            <td>
                                                                <span className={`badge bg-${account.status_color}`}>
                                                                    {account.status_text}
                                                                </span>
                                                            </td>
                                                            <td>
                                                                {account.needs_count && (
                                                                    <span className="badge bg-warning">
                                                                        <i className="fas fa-exclamation-triangle me-1"></i>
                                                                        Gerekli
                                                                    </span>
                                                                )}
                                                            </td>
                                                            <td>
                                                                <div className="position-relative" ref={dropdownRef}>
                                                                    <button
                                                                        className="btn btn-light btn-sm dropdown-toggle"
                                                                        type="button"
                                                                        onClick={() => toggleDropdown(account.id)}
                                                                    >
                                                                        İşlemler
                                                                    </button>
                                                                    {openDropdown === account.id && (
                                                                        <div className="dropdown-menu show position-absolute" style={{ zIndex: 1050 }}>
                                                                            <Link
                                                                                href={route('accounting.cash.show', account.id)}
                                                                                className="dropdown-item"
                                                                                onClick={() => setOpenDropdown(null)}
                                                                            >
                                                                                <i className="fas fa-eye me-2"></i>
                                                                                Görüntüle
                                                                            </Link>
                                                                            <Link
                                                                                href={route('accounting.cash.edit', account.id)}
                                                                                className="dropdown-item"
                                                                                onClick={() => setOpenDropdown(null)}
                                                                            >
                                                                                <i className="fas fa-edit me-2"></i>
                                                                                Düzenle
                                                                            </Link>
                                                                            <hr className="dropdown-divider" />
                                                                            <Link
                                                                                href={route('accounting.cash.destroy', account.id)}
                                                                                method="delete"
                                                                                className="dropdown-item text-danger"
                                                                                as="button"
                                                                                onClick={() => setOpenDropdown(null)}
                                                                            >
                                                                                <i className="fas fa-trash me-2"></i>
                                                                                Sil
                                                                            </Link>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ))
                                                )}
                                            </tbody>
                                        </table>
                                    </div>

                                    {/* Pagination */}
                                    {cashAccounts.total > cashAccounts.per_page && (
                                        <div className="d-flex justify-content-between align-items-center mt-3">
                                            <div>
                                                <small className="text-muted">
                                                    {cashAccounts.from} - {cashAccounts.to} arası, toplam {cashAccounts.total} kayıt
                                                </small>
                                            </div>
                                            <nav>
                                                <ul className="pagination pagination-sm mb-0">
                                                    {cashAccounts.links.map((link, index) => (
                                                        <li key={index} className={`page-item ${link.active ? 'active' : ''} ${!link.url ? 'disabled' : ''}`}>
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
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
}
