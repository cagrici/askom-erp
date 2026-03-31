import React, { useState, useEffect, useRef } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import Layout from '../../../Layouts';
import { PurchaseRequest, PurchaseRequestFilters, Location, Department, PaginatedData } from '@/types/purchasing';

interface Props {
    requests: PaginatedData<PurchaseRequest>;
    locations: Location[];
    departments: Department[];
    filters: PurchaseRequestFilters;
}

export default function Index({ requests, locations, departments, filters }: Props) {
    const [searchTerm, setSearchTerm] = useState(filters.search || '');
    const [selectedStatus, setSelectedStatus] = useState(filters.status || '');
    const [selectedPriority, setSelectedPriority] = useState(filters.priority || '');
    const [selectedLocation, setSelectedLocation] = useState(filters.location_id?.toString() || '');
    const [selectedDepartment, setSelectedDepartment] = useState(filters.department_id?.toString() || '');
    const [dateFrom, setDateFrom] = useState(filters.date_from || '');
    const [dateTo, setDateTo] = useState(filters.date_to || '');
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

    const toggleDropdown = (requestId: number) => {
        setOpenDropdown(openDropdown === requestId ? null : requestId);
    };

    const handleSearch = () => {
        router.get(route('purchasing.requests.index'), {
            search: searchTerm,
            status: selectedStatus,
            priority: selectedPriority,
            location_id: selectedLocation,
            department_id: selectedDepartment,
            date_from: dateFrom,
            date_to: dateTo,
        });
    };

    const handleClearFilters = () => {
        setSearchTerm('');
        setSelectedStatus('');
        setSelectedPriority('');
        setSelectedLocation('');
        setSelectedDepartment('');
        setDateFrom('');
        setDateTo('');
        router.get(route('purchasing.requests.index'));
    };

    const getStatusText = (status: string) => {
        const statuses: Record<string, string> = {
            'draft': 'Taslak',
            'pending': 'Bekliyor',
            'approved': 'Onaylandı',
            'rejected': 'Reddedildi',
            'converted': 'Dönüştürüldü',
            'cancelled': 'İptal Edildi',
        };
        return statuses[status] || status;
    };

    const getStatusBadgeColor = (status: string) => {
        const colors: Record<string, string> = {
            'draft': 'secondary',
            'pending': 'warning',
            'approved': 'success',
            'rejected': 'danger',
            'converted': 'info',
            'cancelled': 'dark',
        };
        return colors[status] || 'secondary';
    };

    const getPriorityText = (priority: string) => {
        const priorities: Record<string, string> = {
            'low': 'Düşük',
            'medium': 'Orta',
            'high': 'Yüksek',
            'urgent': 'Acil',
        };
        return priorities[priority] || priority;
    };

    const getPriorityBadgeColor = (priority: string) => {
        const colors: Record<string, string> = {
            'low': 'success',
            'medium': 'info',
            'high': 'warning',
            'urgent': 'danger',
        };
        return colors[priority] || 'secondary';
    };

    const formatCurrency = (amount: number, currency: string = 'TRY') => {
        return new Intl.NumberFormat('tr-TR', {
            style: 'currency',
            currency: currency,
        }).format(amount);
    };

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('tr-TR');
    };

    return (
        <Layout>
            <Head title="Satın Alma Talepleri" />
            <div className="page-content">
                <div className="container-fluid">
                    <div className="row">
                        <div className="col-12">
                            <div className="page-title-box d-sm-flex align-items-center justify-content-between">
                                <h4 className="mb-sm-0">Satın Alma Talepleri</h4>
                                <div className="page-title-right">
                                    <ol className="breadcrumb m-0">
                                        <li className="breadcrumb-item">
                                            <Link href={route('dashboard')}>Dashboard</Link>
                                        </li>
                                        <li className="breadcrumb-item">Satın Alma</li>
                                        <li className="breadcrumb-item active">Talepler</li>
                                    </ol>
                                </div>
                            </div>
                        </div>
                    </div>

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
                                        <div className="col-md-3">
                                            <label className="form-label">Arama</label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                placeholder="Talep no, başlık..."
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                                            />
                                        </div>
                                        <div className="col-md-2">
                                            <label className="form-label">Durum</label>
                                            <select
                                                className="form-select"
                                                value={selectedStatus}
                                                onChange={(e) => setSelectedStatus(e.target.value)}
                                            >
                                                <option value="">Tümü</option>
                                                <option value="draft">Taslak</option>
                                                <option value="pending">Bekliyor</option>
                                                <option value="approved">Onaylandı</option>
                                                <option value="rejected">Reddedildi</option>
                                                <option value="converted">Dönüştürüldü</option>
                                                <option value="cancelled">İptal Edildi</option>
                                            </select>
                                        </div>
                                        <div className="col-md-2">
                                            <label className="form-label">Öncelik</label>
                                            <select
                                                className="form-select"
                                                value={selectedPriority}
                                                onChange={(e) => setSelectedPriority(e.target.value)}
                                            >
                                                <option value="">Tümü</option>
                                                <option value="low">Düşük</option>
                                                <option value="medium">Orta</option>
                                                <option value="high">Yüksek</option>
                                                <option value="urgent">Acil</option>
                                            </select>
                                        </div>
                                        <div className="col-md-2">
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
                                        <div className="col-md-3">
                                            <label className="form-label">Departman</label>
                                            <select
                                                className="form-select"
                                                value={selectedDepartment}
                                                onChange={(e) => setSelectedDepartment(e.target.value)}
                                            >
                                                <option value="">Tümü</option>
                                                {departments.map((department) => (
                                                    <option key={department.id} value={department.id}>
                                                        {department.name}
                                                    </option>
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
                                        <div className="col-md-8 d-flex align-items-end">
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
                                        Toplam {requests.total} talep bulundu
                                    </h5>
                                </div>
                                <div>
                                    <Link
                                        href={route('purchasing.requests.create')}
                                        className="btn btn-primary"
                                    >
                                        <i className="fas fa-plus me-1"></i>
                                        Yeni Talep
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
                                                    <th>Talep No</th>
                                                    <th>Başlık</th>
                                                    <th>Durum</th>
                                                    <th>Öncelik</th>
                                                    <th>Talep Eden</th>
                                                    <th>Lokasyon</th>
                                                    <th>Talep Tarihi</th>
                                                    <th>Gereksinim Tarihi</th>
                                                    <th>Toplam Tutar</th>
                                                    <th>İşlemler</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {requests.data.length === 0 ? (
                                                    <tr>
                                                        <td colSpan={10} className="text-center py-4">
                                                            <div className="d-flex flex-column align-items-center">
                                                                <i className="fas fa-inbox fa-3x text-muted mb-3"></i>
                                                                <p className="text-muted">Henüz talep bulunmuyor.</p>
                                                                <Link
                                                                    href={route('purchasing.requests.create')}
                                                                    className="btn btn-primary"
                                                                >
                                                                    İlk Talebi Oluştur
                                                                </Link>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ) : (
                                                    requests.data.map((request) => (
                                                        <tr key={request.id}>
                                                            <td>
                                                                <span className="fw-medium">
                                                                    {request.request_number}
                                                                </span>
                                                                {request.is_urgent && (
                                                                    <span className="badge bg-danger ms-1">ACİL</span>
                                                                )}
                                                            </td>
                                                            <td>
                                                                <div>
                                                                    <div className="fw-medium">{request.title}</div>
                                                                    {request.description && (
                                                                        <small className="text-muted">
                                                                            {request.description.length > 50
                                                                                ? request.description.substring(0, 50) + '...'
                                                                                : request.description
                                                                            }
                                                                        </small>
                                                                    )}
                                                                </div>
                                                            </td>
                                                            <td>
                                                                <span className={`badge bg-${getStatusBadgeColor(request.status)}`}>
                                                                    {getStatusText(request.status)}
                                                                </span>
                                                            </td>
                                                            <td>
                                                                <span className={`badge bg-${getPriorityBadgeColor(request.priority)}`}>
                                                                    {getPriorityText(request.priority)}
                                                                </span>
                                                            </td>
                                                            <td>
                                                                <span className="text-muted">
                                                                    {request.requestedBy?.name || 'N/A'}
                                                                </span>
                                                            </td>
                                                            <td>
                                                                <span className="text-muted">
                                                                    {request.location?.name || 'N/A'}
                                                                </span>
                                                            </td>
                                                            <td>
                                                                {formatDate(request.requested_date)}
                                                            </td>
                                                            <td>
                                                                {formatDate(request.required_date)}
                                                            </td>
                                                            <td>
                                                                <span className="fw-medium">
                                                                    {formatCurrency(request.total_amount, request.currency)}
                                                                </span>
                                                            </td>
                                                            <td>
                                                                <div className="position-relative" ref={dropdownRef}>
                                                                    <button
                                                                        className="btn btn-light btn-sm dropdown-toggle"
                                                                        type="button"
                                                                        onClick={() => toggleDropdown(request.id)}
                                                                    >
                                                                        İşlemler
                                                                    </button>
                                                                    {openDropdown === request.id && (
                                                                        <div className="dropdown-menu show position-absolute" style={{ zIndex: 1050 }}>
                                                                            <Link
                                                                                href={route('purchasing.requests.show', request.id)}
                                                                                className="dropdown-item"
                                                                                onClick={() => setOpenDropdown(null)}
                                                                            >
                                                                                <i className="fas fa-eye me-2"></i>
                                                                                Görüntüle
                                                                            </Link>
                                                                            {request.can_be_edited && (
                                                                                <Link
                                                                                    href={route('purchasing.requests.edit', request.id)}
                                                                                    className="dropdown-item"
                                                                                    onClick={() => setOpenDropdown(null)}
                                                                                >
                                                                                    <i className="fas fa-edit me-2"></i>
                                                                                    Düzenle
                                                                                </Link>
                                                                            )}
                                                                            {request.can_be_converted && (
                                                                                <Link
                                                                                    href={route('purchasing.orders.create', { request_id: request.id })}
                                                                                    className="dropdown-item"
                                                                                    onClick={() => setOpenDropdown(null)}
                                                                                >
                                                                                    <i className="fas fa-exchange-alt me-2"></i>
                                                                                    Siparişe Dönüştür
                                                                                </Link>
                                                                            )}
                                                                            {request.can_be_deleted && (
                                                                                <>
                                                                                    <hr className="dropdown-divider" />
                                                                                    <Link
                                                                                        href={route('purchasing.requests.destroy', request.id)}
                                                                                        method="delete"
                                                                                        className="dropdown-item text-danger"
                                                                                        data-confirm="Bu talebi silmek istediğinizden emin misiniz?"
                                                                                        onClick={() => setOpenDropdown(null)}
                                                                                    >
                                                                                        <i className="fas fa-trash me-2"></i>
                                                                                        Sil
                                                                                    </Link>
                                                                                </>
                                                                            )}
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
                                    {requests.total > requests.per_page && (
                                        <div className="d-flex justify-content-between align-items-center mt-3">
                                            <div>
                                                <small className="text-muted">
                                                    {requests.from} - {requests.to} arası, toplam {requests.total} kayıt
                                                </small>
                                            </div>
                                            <nav>
                                                <ul className="pagination pagination-sm mb-0">
                                                    {requests.links.map((link, index) => (
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
