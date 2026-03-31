import React, { useState, useEffect } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { Dropdown } from 'react-bootstrap';
import Layout from '../../../Layouts';

interface CurrentAccount {
    id: number;
    account_code: string;
    title: string;
    account_type: string;
    person_type: string;
    tax_number?: string;
    tax_office?: string;
    tax_office_id?: string;
    mersys_no?: string;
    trade_registry_no?: string;
    employee_count?: number;
    annual_revenue?: number;
    establishment_year?: number;
    address?: string;
    district?: string;
    district_id?: string;
    city?: string;
    city_id?: string;
    postal_code?: string;
    country?: string;
    country_id?: string;
    phone_1?: string;
    phone_2?: string;
    mobile?: string;
    fax?: string;
    email?: string;
    website?: string;
    contact_person?: string;
    contact_title?: string;
    contact_phone?: string;
    contact_email?: string;
    additional_contacts?: any[];
    credit_limit: number;
    payment_term_id?: string;
    payment_method_id?: string;
    discount_rate?: number;
    risk_limit?: number;
    e_invoice_enabled?: boolean;
    e_invoice_address?: string;
    e_archive_enabled?: boolean;
    gib_alias?: string;
    category?: string;
    sector?: string;
    region?: string;
    sales_representative_id?: string;
    lead_source?: string;
    customer_segment?: string;
    preferred_language?: string;
    communication_preferences?: any;
    notes?: string;
    crm_notes?: string;
    current_balance: number;
    is_active: boolean;
    is_blocked: boolean;
    currency: string;
    created_at: string;
    account_type_text: string;
    person_type_text: string;
    status_text: string;
    status_color: string;
    balance_color: string;
    formatted_balance: string;
}

interface Stats {
    total: number;
    active: number;
    customers: number;
    suppliers: number;
    blocked: number;
    with_balance: number;
    overdue: number;
    total_receivables: number;
    total_payables: number;
}

interface Props {
    accounts: {
        data: CurrentAccount[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
        from?: number;
        to?: number;
        links?: any[];
    };
    stats: Stats;
    cities: string[];
    filters: {
        search?: string;
        account_type?: string;
        person_type?: string;
        city?: string;
        status?: string;
        has_balance?: string;
        overdue?: string;
        sort_field?: string;
        sort_direction?: string;
    };
}

export default function CurrentAccountsIndex({ accounts, stats, cities, filters }: Props) {
    const { errors } = usePage<any>().props;
    const [searchTerm, setSearchTerm] = useState(filters.search || '');
    const [accountTypeFilter, setAccountTypeFilter] = useState(filters.account_type || '');
    const [personTypeFilter, setPersonTypeFilter] = useState(filters.person_type || '');
    const [cityFilter, setCityFilter] = useState(filters.city || '');
    const [statusFilter, setStatusFilter] = useState(filters.status || '');
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showBlockModal, setShowBlockModal] = useState(false);
    const [selectedAccount, setSelectedAccount] = useState<CurrentAccount | null>(null);


    const [blockReason, setBlockReason] = useState('');


    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(route('accounting.current-accounts.index'), {
            ...filters,
            search: searchTerm,
            account_type: accountTypeFilter,
            person_type: personTypeFilter,
            city: cityFilter,
            status: statusFilter,
        }, { preserveState: true });
    };

    const clearFilters = () => {
        setSearchTerm('');
        setAccountTypeFilter('');
        setPersonTypeFilter('');
        setCityFilter('');
        setStatusFilter('');
        router.get(route('accounting.current-accounts.index'));
    };



    const openDeleteModal = (account: CurrentAccount) => {
        setSelectedAccount(account);
        setShowDeleteModal(true);
    };

    const openBlockModal = (account: CurrentAccount) => {
        setSelectedAccount(account);
        setBlockReason('');
        setShowBlockModal(true);
    };


    const handleDelete = () => {
        if (selectedAccount) {
            router.delete(route('accounting.current-accounts.destroy', selectedAccount.id), {
                onSuccess: () => {
                    setShowDeleteModal(false);
                    setSelectedAccount(null);
                }
            });
        }
    };

    const handleToggleBlock = () => {
        if (selectedAccount) {
            router.patch(route('accounting.current-accounts.toggle-block', selectedAccount.id), {
                block_reason: blockReason
            }, {
                onSuccess: () => {
                    setShowBlockModal(false);
                    setSelectedAccount(null);
                    setBlockReason('');
                }
            });
        }
    };

    const handleToggleStatus = (account: CurrentAccount) => {
        router.patch(route('accounting.current-accounts.toggle-status', account.id));
    };

    return (
        <Layout>
            <Head title="Cari Kartlar" />
            
            <div className="page-content">
                <div className="container-fluid">
                    {/* Page Title */}
                    <div className="row">
                        <div className="col-12">
                            <div className="page-title-box d-sm-flex align-items-center justify-content-between">
                                <h4 className="mb-sm-0">Cari Kartlar</h4>
                                <div className="page-title-right">
                                    <ol className="breadcrumb m-0">
                                        <li className="breadcrumb-item">Muhasebe</li>
                                        <li className="breadcrumb-item active">Cari Kartlar</li>
                                    </ol>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Stats Cards */}
                    <div className="row">
                        <div className="col-xl-3 col-md-6">
                            <div className="card card-animate">
                                <div className="card-body">
                                    <div className="d-flex align-items-center">
                                        <div className="flex-grow-1 overflow-hidden">
                                            <p className="text-uppercase fw-medium text-muted text-truncate mb-0">Toplam Cari</p>
                                        </div>
                                        <div className="avatar-sm flex-shrink-0">
                                            <span className="avatar-title bg-primary-subtle rounded fs-3">
                                                <i className="bx bx-user-circle text-primary"></i>
                                            </span>
                                        </div>
                                    </div>
                                    <div className="d-flex align-items-end justify-content-between mt-4">
                                        <div>
                                            <h4 className="fs-22 fw-semibold ff-secondary mb-4">
                                                <span className="counter-value">{stats.total}</span>
                                            </h4>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="col-xl-3 col-md-6">
                            <div className="card card-animate">
                                <div className="card-body">
                                    <div className="d-flex align-items-center">
                                        <div className="flex-grow-1 overflow-hidden">
                                            <p className="text-uppercase fw-medium text-muted text-truncate mb-0">Aktif Cari</p>
                                        </div>
                                        <div className="avatar-sm flex-shrink-0">
                                            <span className="avatar-title bg-success-subtle rounded fs-3">
                                                <i className="bx bx-check-circle text-success"></i>
                                            </span>
                                        </div>
                                    </div>
                                    <div className="d-flex align-items-end justify-content-between mt-4">
                                        <div>
                                            <h4 className="fs-22 fw-semibold ff-secondary mb-4">
                                                <span className="counter-value">{stats.active}</span>
                                            </h4>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="col-xl-3 col-md-6">
                            <div className="card card-animate">
                                <div className="card-body">
                                    <div className="d-flex align-items-center">
                                        <div className="flex-grow-1 overflow-hidden">
                                            <p className="text-uppercase fw-medium text-muted text-truncate mb-0">Müşteri</p>
                                        </div>
                                        <div className="avatar-sm flex-shrink-0">
                                            <span className="avatar-title bg-info-subtle rounded fs-3">
                                                <i className="bx bx-store text-info"></i>
                                            </span>
                                        </div>
                                    </div>
                                    <div className="d-flex align-items-end justify-content-between mt-4">
                                        <div>
                                            <h4 className="fs-22 fw-semibold ff-secondary mb-4">
                                                <span className="counter-value">{stats.customers}</span>
                                            </h4>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="col-xl-3 col-md-6">
                            <div className="card card-animate">
                                <div className="card-body">
                                    <div className="d-flex align-items-center">
                                        <div className="flex-grow-1 overflow-hidden">
                                            <p className="text-uppercase fw-medium text-muted text-truncate mb-0">Tedarikçi</p>
                                        </div>
                                        <div className="avatar-sm flex-shrink-0">
                                            <span className="avatar-title bg-warning-subtle rounded fs-3">
                                                <i className="bx bx-package text-warning"></i>
                                            </span>
                                        </div>
                                    </div>
                                    <div className="d-flex align-items-end justify-content-between mt-4">
                                        <div>
                                            <h4 className="fs-22 fw-semibold ff-secondary mb-4">
                                                <span className="counter-value">{stats.suppliers}</span>
                                            </h4>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Filters and Actions */}
                    <div className="row">
                        <div className="col-lg-12">
                            <div className="card">
                                <div className="card-header">
                                    <div className="d-flex align-items-center">
                                        <h5 className="card-title mb-0 flex-grow-1">Cari Kart Listesi</h5>
                                        <div className="flex-shrink-0">
                                            <Link 
                                                href={route('accounting.current-accounts.create')}
                                                className="btn btn-primary add-btn"
                                            >
                                                <i className="ri-add-line align-bottom me-1"></i> Yeni Cari Kart
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                                <div className="card-body">
                                    <form onSubmit={handleSearch} className="row g-3 mb-3">
                                        <div className="col-md-3">
                                            <div className="search-box">
                                                <input
                                                    type="text"
                                                    className="form-control search"
                                                    placeholder="Cari ara..."
                                                    value={searchTerm}
                                                    onChange={(e) => setSearchTerm(e.target.value)}
                                                />
                                                <i className="ri-search-line search-icon"></i>
                                            </div>
                                        </div>
                                        <div className="col-md-2">
                                            <select
                                                className="form-select"
                                                value={accountTypeFilter}
                                                onChange={(e) => setAccountTypeFilter(e.target.value)}
                                            >
                                                <option value="">Tüm Tipler</option>
                                                <option value="customer">Müşteri</option>
                                                <option value="supplier">Tedarikçi</option>
                                                <option value="both">Müşteri/Tedarikçi</option>
                                                <option value="personnel">Personel</option>
                                                <option value="shareholder">Ortak</option>
                                                <option value="other">Diğer</option>
                                            </select>
                                        </div>
                                        <div className="col-md-2">
                                            <select
                                                className="form-select"
                                                value={personTypeFilter}
                                                onChange={(e) => setPersonTypeFilter(e.target.value)}
                                            >
                                                <option value="">Tüm Kişiler</option>
                                                <option value="individual">Gerçek Kişi</option>
                                                <option value="corporate">Tüzel Kişi</option>
                                            </select>
                                        </div>
                                        <div className="col-md-2">
                                            <select
                                                className="form-select"
                                                value={cityFilter}
                                                onChange={(e) => setCityFilter(e.target.value)}
                                            >
                                                <option value="">Tüm Şehirler</option>
                                                {cities.map(city => (
                                                    <option key={city} value={city}>{city}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="col-md-2">
                                            <select
                                                className="form-select"
                                                value={statusFilter}
                                                onChange={(e) => setStatusFilter(e.target.value)}
                                            >
                                                <option value="">Tüm Durumlar</option>
                                                <option value="active">Aktif</option>
                                                <option value="inactive">Pasif</option>
                                                <option value="blocked">Blokeli</option>
                                            </select>
                                        </div>
                                        <div className="col-md-1">
                                            <button type="submit" className="btn btn-primary w-100">
                                                <i className="ri-search-line"></i>
                                            </button>
                                        </div>
                                    </form>
                                    
                                    <div className="d-flex gap-2 mb-3">
                                        <button onClick={clearFilters} className="btn btn-soft-secondary">
                                            <i className="ri-refresh-line me-1"></i> Temizle
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Accounts Table */}
                    <div className="row">
                        <div className="col-lg-12">
                            <div className="card">
                                <div className="card-body">
                                    <div className="table-responsive table-card">
                                        <table className="table table-nowrap table-striped-columns mb-0">
                                            <thead className="table-light">
                                                <tr>
                                                    <th scope="col">Cari Kart</th>
                                                    <th scope="col">Tip</th>
                                                    <th scope="col">Vergi/TC</th>
                                                    <th scope="col">İletişim</th>
                                                    <th scope="col">Bakiye</th>
                                                    <th scope="col">Durum</th>
                                                    <th scope="col">İşlemler</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {accounts.data.length > 0 ? (
                                                    accounts.data.map((account) => (
                                                        <tr key={account.id}>
                                                            <td>
                                                                <div className="d-flex align-items-center">
                                                                    <div className="avatar-sm me-3">
                                                                        <div className="avatar-title bg-primary-subtle text-primary rounded">
                                                                            <i className="bx bx-user-circle"></i>
                                                                        </div>
                                                                    </div>
                                                                    <div className="flex-grow-1">
                                                                        <h6 className="mb-1">
                                                                            <Link 
                                                                                href={route('accounting.current-accounts.show', account.id)}
                                                                                className="text-body fw-medium"
                                                                            >
                                                                                {account.title}
                                                                            </Link>
                                                                        </h6>
                                                                        <p className="text-muted mb-0">{account.account_code}</p>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td>
                                                                <span className="badge bg-light text-body">
                                                                    {account.account_type_text}
                                                                </span>
                                                                <br />
                                                                <small className="text-muted">{account.person_type_text}</small>
                                                            </td>
                                                            <td>
                                                                {account.tax_number ? (
                                                                    <>
                                                                        <span className="fw-medium">{account.tax_number}</span>
                                                                        <br />
                                                                        <small className="text-muted">{account.tax_office}</small>
                                                                    </>
                                                                ) : (
                                                                    <span className="text-muted">-</span>
                                                                )}
                                                            </td>
                                                            <td>
                                                                {account.phone_1 && (
                                                                    <>
                                                                        <span className="fw-medium">{account.phone_1}</span>
                                                                        <br />
                                                                    </>
                                                                )}
                                                                {account.email ? (
                                                                    <small className="text-muted">{account.email}</small>
                                                                ) : (
                                                                    <small className="text-muted">{account.city || '-'}</small>
                                                                )}
                                                            </td>
                                                            <td>
                                                                <span className={`fw-medium text-${account.balance_color}`}>
                                                                    {account.formatted_balance}
                                                                </span>
                                                            </td>
                                                            <td>
                                                                <span className={`badge bg-${account.status_color}-subtle text-${account.status_color}`}>
                                                                    {account.status_text}
                                                                </span>
                                                            </td>
                                                            <td>
                                                                <Dropdown align="end">
                                                                    <Dropdown.Toggle 
                                                                        variant="soft-secondary" 
                                                                        size="sm"
                                                                        className="btn-soft-secondary"
                                                                    >
                                                                        <i className="ri-more-fill align-middle"></i>
                                                                    </Dropdown.Toggle>
                                                                    <Dropdown.Menu>
                                                                        <Dropdown.Item 
                                                                            as={Link} 
                                                                            href={route('accounting.current-accounts.show', account.id)}
                                                                        >
                                                                            <i className="ri-eye-fill align-bottom me-2 text-muted"></i> Görüntüle
                                                                        </Dropdown.Item>
                                                                        <Dropdown.Item 
                                                                            as={Link}
                                                                            href={route('accounting.current-accounts.edit', account.id)}
                                                                        >
                                                                            <i className="ri-pencil-fill align-bottom me-2 text-muted"></i> Düzenle
                                                                        </Dropdown.Item>
                                                                        <Dropdown.Item 
                                                                            onClick={() => handleToggleStatus(account)}
                                                                        >
                                                                            <i className={`ri-${account.is_active ? 'pause' : 'play'}-fill align-bottom me-2 text-muted`}></i> 
                                                                            {account.is_active ? 'Pasifleştir' : 'Aktifleştir'}
                                                                        </Dropdown.Item>
                                                                        <Dropdown.Item 
                                                                            onClick={() => openBlockModal(account)}
                                                                        >
                                                                            <i className={`ri-${account.is_blocked ? 'lock-unlock' : 'lock'}-fill align-bottom me-2 text-warning`}></i> 
                                                                            {account.is_blocked ? 'Blokeyi Kaldır' : 'Bloke Et'}
                                                                        </Dropdown.Item>
                                                                        <Dropdown.Divider />
                                                                        <Dropdown.Item 
                                                                            className="text-danger"
                                                                            onClick={() => openDeleteModal(account)}
                                                                        >
                                                                            <i className="ri-delete-bin-fill align-bottom me-2"></i> Sil
                                                                        </Dropdown.Item>
                                                                    </Dropdown.Menu>
                                                                </Dropdown>
                                                            </td>
                                                        </tr>
                                                    ))
                                                ) : (
                                                    <tr>
                                                        <td colSpan={7} className="text-center py-4">
                                                            <div className="text-muted">Kayıt bulunamadı</div>
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>

                                    {/* Pagination */}
                                    {accounts.last_page > 1 && (
                                        <div className="d-flex justify-content-between align-items-center mt-3">
                                            <div className="text-muted">
                                                {accounts.from}-{accounts.to} arası, toplam {accounts.total} kayıt
                                            </div>
                                            <nav>
                                                <ul className="pagination pagination-sm mb-0">
                                                    {accounts.links?.map((link, index) => (
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
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>


            {/* Delete Modal */}
            <div className={`modal fade ${showDeleteModal ? 'show' : ''}`} 
                 style={{ display: showDeleteModal ? 'block' : 'none' }}
                 tabIndex={-1}>
                <div className="modal-dialog">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h5 className="modal-title">Cari Kart Sil</h5>
                            <button 
                                type="button" 
                                className="btn-close" 
                                onClick={() => {
                                    setShowDeleteModal(false);
                                    setSelectedAccount(null);
                                }}
                            ></button>
                        </div>
                        <div className="modal-body">
                            <p>
                                <strong>{selectedAccount?.title}</strong> cari kartını silmek istediğinizden emin misiniz?
                            </p>
                            <p className="text-muted">Bu işlem geri alınamaz.</p>
                        </div>
                        <div className="modal-footer">
                            <button 
                                type="button" 
                                className="btn btn-secondary" 
                                onClick={() => {
                                    setShowDeleteModal(false);
                                    setSelectedAccount(null);
                                }}
                            >
                                İptal
                            </button>
                            <button 
                                type="button" 
                                className="btn btn-danger" 
                                onClick={handleDelete}
                            >
                                Sil
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Block Modal */}
            <div className={`modal fade ${showBlockModal ? 'show' : ''}`} 
                 style={{ display: showBlockModal ? 'block' : 'none' }}
                 tabIndex={-1}>
                <div className="modal-dialog">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h5 className="modal-title">
                                {selectedAccount?.is_blocked ? 'Blokeyi Kaldır' : 'Cari Kartı Bloke Et'}
                            </h5>
                            <button 
                                type="button" 
                                className="btn-close" 
                                onClick={() => {
                                    setShowBlockModal(false);
                                    setSelectedAccount(null);
                                    setBlockReason('');
                                }}
                            ></button>
                        </div>
                        <div className="modal-body">
                            <p>
                                <strong>{selectedAccount?.title}</strong> cari kartını {selectedAccount?.is_blocked ? 'blokeyi kaldırmak' : 'bloke etmek'} istediğinizden emin misiniz?
                            </p>
                            {!selectedAccount?.is_blocked && (
                                <div className="mb-3">
                                    <label className="form-label">Bloke Nedeni</label>
                                    <textarea
                                        className="form-control"
                                        rows={3}
                                        value={blockReason}
                                        onChange={(e) => setBlockReason(e.target.value)}
                                        placeholder="Bloke etme nedenini yazın..."
                                        required
                                    />
                                </div>
                            )}
                        </div>
                        <div className="modal-footer">
                            <button 
                                type="button" 
                                className="btn btn-secondary" 
                                onClick={() => {
                                    setShowBlockModal(false);
                                    setSelectedAccount(null);
                                    setBlockReason('');
                                }}
                            >
                                İptal
                            </button>
                            <button 
                                type="button" 
                                className={`btn btn-${selectedAccount?.is_blocked ? 'success' : 'warning'}`}
                                onClick={handleToggleBlock}
                            >
                                {selectedAccount?.is_blocked ? 'Blokeyi Kaldır' : 'Bloke Et'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal Backdrop */}
            {(showDeleteModal || showBlockModal) && (
                <div className="modal-backdrop fade show"></div>
            )}
        </Layout>
    );
}