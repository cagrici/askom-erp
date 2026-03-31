import React, { useState, useEffect, useRef } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import Layout from '../../../Layouts';

interface Supplier {
    id: number;
    account_name: string;
    title?: string;
}

interface Location {
    id: number;
    name: string;
}

interface User {
    id: number;
    name: string;
}

interface SupplierOffer {
    id: number;
    offer_number: string;
    supplier: {
        id: number;
        title: string;
    };
    location?: Location;
    offer_date: string;
    valid_until: string;
    status: 'pending' | 'approved' | 'rejected' | 'expired' | 'converted';
    status_text: string;
    status_color: string;
    currency: string;
    total_amount: number;
    requestedBy?: User;
    is_valid: boolean;
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

interface Filters {
    status?: string;
    supplier_id?: number;
    location_id?: number;
    search?: string;
}

interface Props {
    offers: PaginatedData<SupplierOffer>;
    suppliers: Supplier[];
    locations: Location[];
    filters: Filters;
}

export default function Index({ offers, suppliers, locations, filters }: Props) {
    const [searchTerm, setSearchTerm] = useState(filters.search || '');
    const [selectedStatus, setSelectedStatus] = useState(filters.status || 'all');
    const [selectedSupplier, setSelectedSupplier] = useState(filters.supplier_id?.toString() || '');
    const [selectedLocation, setSelectedLocation] = useState(filters.location_id?.toString() || '');
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

    const toggleDropdown = (offerId: number) => {
        setOpenDropdown(openDropdown === offerId ? null : offerId);
    };

    const handleSearch = () => {
        router.get(route('purchasing.offers.index'), {
            search: searchTerm,
            status: selectedStatus !== 'all' ? selectedStatus : undefined,
            supplier_id: selectedSupplier || undefined,
            location_id: selectedLocation || undefined,
        });
    };

    const handleClearFilters = () => {
        setSearchTerm('');
        setSelectedStatus('all');
        setSelectedSupplier('');
        setSelectedLocation('');
        router.get(route('purchasing.offers.index'));
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

    const isExpiringSoon = (validUntil: string) => {
        const daysUntilExpiry = Math.ceil((new Date(validUntil).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
        return daysUntilExpiry <= 3 && daysUntilExpiry > 0;
    };

    return (
        <Layout>
            <Head title="Tedarikçi Teklifleri" />
            <div className="page-content">
                <div className="container-fluid">
                    <div className="row">
                        <div className="col-12">
                            <div className="page-title-box d-sm-flex align-items-center justify-content-between">
                                <h4 className="mb-sm-0">Tedarikçi Teklifleri</h4>
                                <div className="page-title-right">
                                    <ol className="breadcrumb m-0">
                                        <li className="breadcrumb-item">
                                            <Link href={route('dashboard')}>Dashboard</Link>
                                        </li>
                                        <li className="breadcrumb-item">Satın Alma</li>
                                        <li className="breadcrumb-item active">Teklifler</li>
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
                                        <div className="col-md-4">
                                            <label className="form-label">Arama</label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                placeholder="Teklif no, tedarikçi adı..."
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
                                                <option value="all">Tümü</option>
                                                <option value="pending">Beklemede</option>
                                                <option value="approved">Onaylandı</option>
                                                <option value="rejected">Reddedildi</option>
                                                <option value="expired">Süresi Doldu</option>
                                                <option value="converted">Siparişe Dönüştürüldü</option>
                                            </select>
                                        </div>
                                        <div className="col-md-3">
                                            <label className="form-label">Tedarikçi</label>
                                            <select
                                                className="form-select"
                                                value={selectedSupplier}
                                                onChange={(e) => setSelectedSupplier(e.target.value)}
                                            >
                                                <option value="">Tümü</option>
                                                {suppliers.map((supplier) => (
                                                    <option key={supplier.id} value={supplier.id}>
                                                        {supplier.account_name}
                                                    </option>
                                                ))}
                                            </select>
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
                                        Toplam {offers.total} teklif bulundu
                                    </h5>
                                </div>
                                <div>
                                    <Link
                                        href={route('purchasing.offers.create')}
                                        className="btn btn-primary"
                                    >
                                        <i className="fas fa-plus me-1"></i>
                                        Yeni Teklif
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
                                                    <th>Teklif No</th>
                                                    <th>Tedarikçi</th>
                                                    <th>Teklif Tarihi</th>
                                                    <th>Geçerlilik Tarihi</th>
                                                    <th>Durum</th>
                                                    <th>Lokasyon</th>
                                                    <th>Talep Eden</th>
                                                    <th>Toplam Tutar</th>
                                                    <th>İşlemler</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {offers.data.length === 0 ? (
                                                    <tr>
                                                        <td colSpan={9} className="text-center py-4">
                                                            <div className="d-flex flex-column align-items-center">
                                                                <i className="fas fa-inbox fa-3x text-muted mb-3"></i>
                                                                <p className="text-muted">Henüz teklif bulunmuyor.</p>
                                                                <Link
                                                                    href={route('purchasing.offers.create')}
                                                                    className="btn btn-primary"
                                                                >
                                                                    İlk Teklifi Oluştur
                                                                </Link>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ) : (
                                                    offers.data.map((offer) => (
                                                        <tr key={offer.id}>
                                                            <td>
                                                                <span className="fw-medium">
                                                                    {offer.offer_number}
                                                                </span>
                                                            </td>
                                                            <td>
                                                                <span className="text-muted">
                                                                    {offer.supplier.title}
                                                                </span>
                                                            </td>
                                                            <td>
                                                                {formatDate(offer.offer_date)}
                                                            </td>
                                                            <td>
                                                                <div className="d-flex flex-column">
                                                                    <span>{formatDate(offer.valid_until)}</span>
                                                                    {offer.is_valid && isExpiringSoon(offer.valid_until) && (
                                                                        <span className="badge bg-warning text-dark mt-1" style={{ fontSize: '0.7rem' }}>
                                                                            Yakında Sona Erecek
                                                                        </span>
                                                                    )}
                                                                    {!offer.is_valid && offer.status !== 'converted' && (
                                                                        <span className="badge bg-secondary mt-1" style={{ fontSize: '0.7rem' }}>
                                                                            Süresi Doldu
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </td>
                                                            <td>
                                                                <span className={`badge bg-${offer.status_color}`}>
                                                                    {offer.status_text}
                                                                </span>
                                                            </td>
                                                            <td>
                                                                <span className="text-muted">
                                                                    {offer.location?.name || '-'}
                                                                </span>
                                                            </td>
                                                            <td>
                                                                <span className="text-muted">
                                                                    {offer.requestedBy?.name || 'N/A'}
                                                                </span>
                                                            </td>
                                                            <td>
                                                                <span className="fw-medium">
                                                                    {formatCurrency(offer.total_amount, offer.currency)}
                                                                </span>
                                                            </td>
                                                            <td>
                                                                <div className="position-relative" ref={dropdownRef}>
                                                                    <button
                                                                        className="btn btn-light btn-sm dropdown-toggle"
                                                                        type="button"
                                                                        onClick={() => toggleDropdown(offer.id)}
                                                                    >
                                                                        İşlemler
                                                                    </button>
                                                                    {openDropdown === offer.id && (
                                                                        <div className="dropdown-menu show position-absolute" style={{ zIndex: 1050 }}>
                                                                            <Link
                                                                                href={route('purchasing.offers.show', offer.id)}
                                                                                className="dropdown-item"
                                                                                onClick={() => setOpenDropdown(null)}
                                                                            >
                                                                                <i className="fas fa-eye me-2"></i>
                                                                                Görüntüle
                                                                            </Link>
                                                                            {offer.status === 'pending' && (
                                                                                <>
                                                                                    <Link
                                                                                        href={route('purchasing.offers.edit', offer.id)}
                                                                                        className="dropdown-item"
                                                                                        onClick={() => setOpenDropdown(null)}
                                                                                    >
                                                                                        <i className="fas fa-edit me-2"></i>
                                                                                        Düzenle
                                                                                    </Link>
                                                                                    <hr className="dropdown-divider" />
                                                                                    <Link
                                                                                        href={route('purchasing.offers.approve', offer.id)}
                                                                                        method="post"
                                                                                        className="dropdown-item text-success"
                                                                                        as="button"
                                                                                        onClick={() => setOpenDropdown(null)}
                                                                                    >
                                                                                        <i className="fas fa-check me-2"></i>
                                                                                        Onayla
                                                                                    </Link>
                                                                                    <hr className="dropdown-divider" />
                                                                                    <Link
                                                                                        href={route('purchasing.offers.destroy', offer.id)}
                                                                                        method="delete"
                                                                                        className="dropdown-item text-danger"
                                                                                        as="button"
                                                                                        onClick={() => setOpenDropdown(null)}
                                                                                    >
                                                                                        <i className="fas fa-trash me-2"></i>
                                                                                        Sil
                                                                                    </Link>
                                                                                </>
                                                                            )}
                                                                            {offer.status === 'approved' && (
                                                                                <Link
                                                                                    href={route('purchasing.orders.create', { offer_id: offer.id })}
                                                                                    className="dropdown-item"
                                                                                    onClick={() => setOpenDropdown(null)}
                                                                                >
                                                                                    <i className="fas fa-exchange-alt me-2"></i>
                                                                                    Siparişe Dönüştür
                                                                                </Link>
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
                                    {offers.total > offers.per_page && (
                                        <div className="d-flex justify-content-between align-items-center mt-3">
                                            <div>
                                                <small className="text-muted">
                                                    {offers.from} - {offers.to} arası, toplam {offers.total} kayıt
                                                </small>
                                            </div>
                                            <nav>
                                                <ul className="pagination pagination-sm mb-0">
                                                    {offers.links.map((link, index) => (
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
