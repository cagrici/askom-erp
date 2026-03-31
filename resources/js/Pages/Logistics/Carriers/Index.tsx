import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import Layout from '../../../Layouts';

interface Carrier {
    id: number;
    carrier_code: string;
    company_name: string;
    trade_name: string | null;
    contact_person: string | null;
    phone: string | null;
    mobile: string | null;
    email: string | null;
    city: string | null;
    carrier_type: string;
    carrier_type_text: string;
    contract_type: string;
    contract_type_text: string;
    fleet_size: number | null;
    rating: number | null;
    on_time_percentage: number | null;
    total_shipments: number;
    status: string;
    status_text: string;
    is_preferred: boolean;
    is_verified: boolean;
    insurance_expiry_date: string | null;
    contract_end_date: string | null;
    created_at: string;
}

interface Stats {
    total_carriers: number;
    active_carriers: number;
    preferred_carriers: number;
    verified_carriers: number;
    road_carriers: number;
    air_carriers: number;
    insurance_expiring: number;
    contract_expiring: number;
    avg_rating: number;
    avg_on_time: number;
}

interface Filters {
    search?: string;
    status?: string;
    carrier_type?: string;
    contract_type?: string;
    preferred?: string;
    verified?: string;
}

interface Props {
    carriers: {
        data: Carrier[];
        links: any[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
    stats: Stats;
    filters: Filters;
}

export default function Index({ carriers, stats, filters }: Props) {
    const [search, setSearch] = useState(filters.search || '');
    const [status, setStatus] = useState(filters.status || '');
    const [carrierType, setCarrierType] = useState(filters.carrier_type || '');
    const [contractType, setContractType] = useState(filters.contract_type || '');
    const [showPreferred, setShowPreferred] = useState(filters.preferred === 'true');
    const [showVerified, setShowVerified] = useState(filters.verified === 'true');

    const handleFilter = () => {
        router.get(route('logistics.carriers.index'), {
            search,
            status,
            carrier_type: carrierType,
            contract_type: contractType,
            preferred: showPreferred ? 'true' : undefined,
            verified: showVerified ? 'true' : undefined,
        }, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleReset = () => {
        setSearch('');
        setStatus('');
        setCarrierType('');
        setContractType('');
        setShowPreferred(false);
        setShowVerified(false);
        router.get(route('logistics.carriers.index'));
    };

    const handleTogglePreferred = (carrierId: number) => {
        router.post(route('logistics.carriers.preferred', carrierId));
    };

    const handleToggleVerified = (carrierId: number) => {
        router.post(route('logistics.carriers.verified', carrierId));
    };

    const handleDelete = (carrierId: number) => {
        if (confirm('Bu taşıyıcıyı silmek istediğinizden emin misiniz?')) {
            router.delete(route('logistics.carriers.destroy', carrierId));
        }
    };

    const getStatusBadgeClass = (status: string) => {
        switch (status) {
            case 'active':
                return 'badge-success';
            case 'inactive':
                return 'badge-secondary';
            case 'suspended':
                return 'badge-warning';
            case 'blacklisted':
                return 'badge-danger';
            default:
                return 'badge-secondary';
        }
    };

    const getCarrierTypeBadgeClass = (type: string) => {
        switch (type) {
            case 'road':
                return 'badge-primary';
            case 'air':
                return 'badge-info';
            case 'sea':
                return 'badge-primary';
            case 'rail':
                return 'badge-secondary';
            case 'multimodal':
                return 'badge-warning';
            default:
                return 'badge-secondary';
        }
    };

    const formatNumber = (value: number | null) => {
        if (value === null) return '-';
        return new Intl.NumberFormat('tr-TR', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2
        }).format(value);
    };

    const renderStars = (rating: number | null) => {
        if (!rating) return '-';
        const stars = [];
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 >= 0.5;

        for (let i = 0; i < fullStars; i++) {
            stars.push(<i key={`full-${i}`} className="fas fa-star text-warning"></i>);
        }
        if (hasHalfStar) {
            stars.push(<i key="half" className="fas fa-star-half-alt text-warning"></i>);
        }
        const emptyStars = 5 - stars.length;
        for (let i = 0; i < emptyStars; i++) {
            stars.push(<i key={`empty-${i}`} className="far fa-star text-muted"></i>);
        }

        return (
            <span>
                {stars} <small className="text-muted">({rating.toFixed(1)})</small>
            </span>
        );
    };

    return (
        <Layout>
            <Head title="Taşıyıcı Yönetimi" />
            <div className="page-content">
                <div className="container-fluid">
                    {/* Page Title */}
                    <div className="row">
                        <div className="col-12">
                            <div className="page-title-box d-sm-flex align-items-center justify-content-between">
                                <h4 className="mb-sm-0">Taşıyıcı Yönetimi</h4>
                                <div className="page-title-right">
                                    <ol className="breadcrumb m-0">
                                        <li className="breadcrumb-item">
                                            <Link href={route('dashboard')}>Dashboard</Link>
                                        </li>
                                        <li className="breadcrumb-item">Lojistik</li>
                                        <li className="breadcrumb-item active">Taşıyıcılar</li>
                                    </ol>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Statistics Cards */}
                    <div className="row mb-4">
                        <div className="col-xl-3 col-md-6">
                            <div className="card card-animate">
                                <div className="card-body">
                                    <div className="d-flex align-items-center">
                                        <div className="flex-grow-1">
                                            <p className="text-uppercase fw-medium text-muted mb-0">Toplam Taşıyıcı</p>
                                        </div>
                                    </div>
                                    <div className="d-flex align-items-end justify-content-between mt-2">
                                        <div>
                                            <h4 className="fs-22 fw-semibold ff-secondary mb-2">
                                                {stats.total_carriers}
                                            </h4>
                                            <span className="badge bg-success-subtle text-success">
                                                {stats.active_carriers} Aktif
                                            </span>
                                        </div>
                                        <div className="avatar-sm flex-shrink-0">
                                            <span className="avatar-title bg-primary-subtle rounded fs-3">
                                                <i className="fas fa-shipping-fast text-primary"></i>
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="col-xl-3 col-md-6">
                            <div className="card card-animate">
                                <div className="card-body">
                                    <div className="d-flex align-items-center">
                                        <div className="flex-grow-1">
                                            <p className="text-uppercase fw-medium text-muted mb-0">Tercih Edilen</p>
                                        </div>
                                    </div>
                                    <div className="d-flex align-items-end justify-content-between mt-2">
                                        <div>
                                            <h4 className="fs-22 fw-semibold ff-secondary mb-2">
                                                {stats.preferred_carriers}
                                            </h4>
                                            <span className="badge bg-info-subtle text-info">
                                                {stats.verified_carriers} Doğrulanmış
                                            </span>
                                        </div>
                                        <div className="avatar-sm flex-shrink-0">
                                            <span className="avatar-title bg-info-subtle rounded fs-3">
                                                <i className="fas fa-star text-info"></i>
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="col-xl-3 col-md-6">
                            <div className="card card-animate">
                                <div className="card-body">
                                    <div className="d-flex align-items-center">
                                        <div className="flex-grow-1">
                                            <p className="text-uppercase fw-medium text-muted mb-0">Ort. Puan</p>
                                        </div>
                                    </div>
                                    <div className="d-flex align-items-end justify-content-between mt-2">
                                        <div>
                                            <h4 className="fs-22 fw-semibold ff-secondary mb-2">
                                                {formatNumber(stats.avg_rating)} / 5
                                            </h4>
                                            <span className="badge bg-warning-subtle text-warning">
                                                Zamanında: %{formatNumber(stats.avg_on_time)}
                                            </span>
                                        </div>
                                        <div className="avatar-sm flex-shrink-0">
                                            <span className="avatar-title bg-warning-subtle rounded fs-3">
                                                <i className="fas fa-trophy text-warning"></i>
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="col-xl-3 col-md-6">
                            <div className="card card-animate">
                                <div className="card-body">
                                    <div className="d-flex align-items-center">
                                        <div className="flex-grow-1">
                                            <p className="text-uppercase fw-medium text-muted mb-0">Uyarılar</p>
                                        </div>
                                    </div>
                                    <div className="d-flex align-items-end justify-content-between mt-2">
                                        <div>
                                            <h4 className="fs-22 fw-semibold ff-secondary mb-2">
                                                {stats.insurance_expiring + stats.contract_expiring}
                                            </h4>
                                            <span className="badge bg-danger-subtle text-danger">
                                                Sigorta: {stats.insurance_expiring} | Sözleşme: {stats.contract_expiring}
                                            </span>
                                        </div>
                                        <div className="avatar-sm flex-shrink-0">
                                            <span className="avatar-title bg-danger-subtle rounded fs-3">
                                                <i className="fas fa-exclamation-triangle text-danger"></i>
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Filters */}
                    <div className="row mb-3">
                        <div className="col-12">
                            <div className="card">
                                <div className="card-body">
                                    <div className="row g-3">
                                        <div className="col-md-3">
                                            <label className="form-label">Ara</label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                placeholder="Kod, firma, kişi, telefon..."
                                                value={search}
                                                onChange={(e) => setSearch(e.target.value)}
                                                onKeyPress={(e) => e.key === 'Enter' && handleFilter()}
                                            />
                                        </div>
                                        <div className="col-md-2">
                                            <label className="form-label">Durum</label>
                                            <select
                                                className="form-select"
                                                value={status}
                                                onChange={(e) => setStatus(e.target.value)}
                                            >
                                                <option value="">Tümü</option>
                                                <option value="active">Aktif</option>
                                                <option value="inactive">Pasif</option>
                                                <option value="suspended">Askıya Alınmış</option>
                                                <option value="blacklisted">Kara Liste</option>
                                            </select>
                                        </div>
                                        <div className="col-md-2">
                                            <label className="form-label">Taşıyıcı Tipi</label>
                                            <select
                                                className="form-select"
                                                value={carrierType}
                                                onChange={(e) => setCarrierType(e.target.value)}
                                            >
                                                <option value="">Tümü</option>
                                                <option value="road">Karayolu</option>
                                                <option value="air">Havayolu</option>
                                                <option value="sea">Denizyolu</option>
                                                <option value="rail">Demiryolu</option>
                                                <option value="multimodal">Çoklu Mod</option>
                                            </select>
                                        </div>
                                        <div className="col-md-2">
                                            <label className="form-label">Sözleşme</label>
                                            <select
                                                className="form-select"
                                                value={contractType}
                                                onChange={(e) => setContractType(e.target.value)}
                                            >
                                                <option value="">Tümü</option>
                                                <option value="permanent">Sürekli</option>
                                                <option value="temporary">Geçici</option>
                                                <option value="spot">Spot</option>
                                            </select>
                                        </div>
                                        <div className="col-md-1">
                                            <label className="form-label d-block">&nbsp;</label>
                                            <div className="form-check">
                                                <input
                                                    className="form-check-input"
                                                    type="checkbox"
                                                    id="preferred"
                                                    checked={showPreferred}
                                                    onChange={(e) => setShowPreferred(e.target.checked)}
                                                />
                                                <label className="form-check-label" htmlFor="preferred">
                                                    Tercih
                                                </label>
                                            </div>
                                            <div className="form-check">
                                                <input
                                                    className="form-check-input"
                                                    type="checkbox"
                                                    id="verified"
                                                    checked={showVerified}
                                                    onChange={(e) => setShowVerified(e.target.checked)}
                                                />
                                                <label className="form-check-label" htmlFor="verified">
                                                    Doğrulı
                                                </label>
                                            </div>
                                        </div>
                                        <div className="col-md-2">
                                            <label className="form-label">&nbsp;</label>
                                            <div className="d-flex gap-2">
                                                <button
                                                    className="btn btn-primary flex-grow-1"
                                                    onClick={handleFilter}
                                                >
                                                    <i className="fas fa-filter me-1"></i>
                                                    Filtrele
                                                </button>
                                                <button
                                                    className="btn btn-secondary"
                                                    onClick={handleReset}
                                                >
                                                    <i className="fas fa-redo"></i>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Carriers Table */}
                    <div className="row">
                        <div className="col-12">
                            <div className="card">
                                <div className="card-header d-flex justify-content-between align-items-center">
                                    <h5 className="card-title mb-0">
                                        Taşıyıcılar ({carriers.total})
                                    </h5>
                                    <Link
                                        href={route('logistics.carriers.create')}
                                        className="btn btn-success btn-sm"
                                    >
                                        <i className="fas fa-plus me-1"></i>
                                        Yeni Taşıyıcı
                                    </Link>
                                </div>
                                <div className="card-body">
                                    <div className="table-responsive">
                                        <table className="table table-hover align-middle mb-0">
                                            <thead className="table-light">
                                                <tr>
                                                    <th style={{ width: '30px' }}></th>
                                                    <th>Taşıyıcı Kodu / Firma</th>
                                                    <th>İletişim</th>
                                                    <th>Tip</th>
                                                    <th>Performans</th>
                                                    <th>Filo</th>
                                                    <th>Durum</th>
                                                    <th className="text-end">İşlemler</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {carriers.data.length > 0 ? (
                                                    carriers.data.map((carrier) => (
                                                        <tr key={carrier.id}>
                                                            <td>
                                                                <div className="d-flex flex-column gap-1">
                                                                    {carrier.is_preferred && (
                                                                        <button
                                                                            className="btn btn-sm btn-link p-0"
                                                                            onClick={() => handleTogglePreferred(carrier.id)}
                                                                            title="Tercih Edilen"
                                                                        >
                                                                            <i className="fas fa-star text-warning"></i>
                                                                        </button>
                                                                    )}
                                                                    {carrier.is_verified && (
                                                                        <button
                                                                            className="btn btn-sm btn-link p-0"
                                                                            onClick={() => handleToggleVerified(carrier.id)}
                                                                            title="Doğrulanmış"
                                                                        >
                                                                            <i className="fas fa-check-circle text-success"></i>
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            </td>
                                                            <td>
                                                                <strong>{carrier.carrier_code}</strong>
                                                                <div className="text-muted">
                                                                    {carrier.company_name}
                                                                </div>
                                                                {carrier.trade_name && (
                                                                    <small className="text-muted">
                                                                        {carrier.trade_name}
                                                                    </small>
                                                                )}
                                                            </td>
                                                            <td>
                                                                {carrier.contact_person && (
                                                                    <div>
                                                                        <i className="fas fa-user me-1"></i>
                                                                        {carrier.contact_person}
                                                                    </div>
                                                                )}
                                                                {carrier.phone && (
                                                                    <div>
                                                                        <i className="fas fa-phone me-1"></i>
                                                                        {carrier.phone}
                                                                    </div>
                                                                )}
                                                                {carrier.email && (
                                                                    <small className="text-muted d-block">
                                                                        {carrier.email}
                                                                    </small>
                                                                )}
                                                            </td>
                                                            <td>
                                                                <span className={`badge ${getCarrierTypeBadgeClass(carrier.carrier_type)}`}>
                                                                    {carrier.carrier_type_text}
                                                                </span>
                                                                <div className="mt-1">
                                                                    <small className="text-muted">
                                                                        {carrier.contract_type_text}
                                                                    </small>
                                                                </div>
                                                            </td>
                                                            <td>
                                                                <div className="mb-1">
                                                                    {renderStars(carrier.rating)}
                                                                </div>
                                                                {carrier.on_time_percentage !== null && (
                                                                    <small className="text-muted">
                                                                        Zamanında: %{formatNumber(carrier.on_time_percentage)}
                                                                    </small>
                                                                )}
                                                                {carrier.total_shipments > 0 && (
                                                                    <div>
                                                                        <small className="text-muted">
                                                                            {carrier.total_shipments} Sevkiyat
                                                                        </small>
                                                                    </div>
                                                                )}
                                                            </td>
                                                            <td>
                                                                {carrier.fleet_size ? (
                                                                    <span className="badge bg-secondary-subtle text-secondary">
                                                                        <i className="fas fa-truck me-1"></i>
                                                                        {carrier.fleet_size} Araç
                                                                    </span>
                                                                ) : '-'}
                                                            </td>
                                                            <td>
                                                                <span className={`badge ${getStatusBadgeClass(carrier.status)}`}>
                                                                    {carrier.status_text}
                                                                </span>
                                                            </td>
                                                            <td className="text-end">
                                                                <div className="dropdown">
                                                                    <button
                                                                        className="btn btn-soft-secondary btn-sm dropdown-toggle"
                                                                        type="button"
                                                                        data-bs-toggle="dropdown"
                                                                    >
                                                                        <i className="fas fa-ellipsis-v"></i>
                                                                    </button>
                                                                    <ul className="dropdown-menu dropdown-menu-end">
                                                                        <li>
                                                                            <Link
                                                                                href={route('logistics.carriers.show', carrier.id)}
                                                                                className="dropdown-item"
                                                                            >
                                                                                <i className="fas fa-eye me-2"></i>
                                                                                Görüntüle
                                                                            </Link>
                                                                        </li>
                                                                        <li>
                                                                            <Link
                                                                                href={route('logistics.carriers.edit', carrier.id)}
                                                                                className="dropdown-item"
                                                                            >
                                                                                <i className="fas fa-edit me-2"></i>
                                                                                Düzenle
                                                                            </Link>
                                                                        </li>
                                                                        <li>
                                                                            <button
                                                                                className="dropdown-item"
                                                                                onClick={() => handleTogglePreferred(carrier.id)}
                                                                            >
                                                                                <i className={`fas fa-star me-2 ${carrier.is_preferred ? 'text-warning' : ''}`}></i>
                                                                                {carrier.is_preferred ? 'Tercihten Çıkar' : 'Tercih Et'}
                                                                            </button>
                                                                        </li>
                                                                        <li>
                                                                            <button
                                                                                className="dropdown-item"
                                                                                onClick={() => handleToggleVerified(carrier.id)}
                                                                            >
                                                                                <i className={`fas fa-check-circle me-2 ${carrier.is_verified ? 'text-success' : ''}`}></i>
                                                                                {carrier.is_verified ? 'Doğrulamayı Kaldır' : 'Doğrula'}
                                                                            </button>
                                                                        </li>
                                                                        <li>
                                                                            <hr className="dropdown-divider" />
                                                                        </li>
                                                                        <li>
                                                                            <button
                                                                                className="dropdown-item text-danger"
                                                                                onClick={() => handleDelete(carrier.id)}
                                                                            >
                                                                                <i className="fas fa-trash me-2"></i>
                                                                                Sil
                                                                            </button>
                                                                        </li>
                                                                    </ul>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ))
                                                ) : (
                                                    <tr>
                                                        <td colSpan={8} className="text-center py-4">
                                                            <i className="fas fa-shipping-fast fa-3x text-muted mb-3 d-block"></i>
                                                            <p className="text-muted">Henüz taşıyıcı kaydı bulunmamaktadır.</p>
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>

                                    {/* Pagination */}
                                    {carriers.last_page > 1 && (
                                        <div className="d-flex justify-content-between align-items-center mt-3">
                                            <div className="text-muted">
                                                Toplam {carriers.total} kayıttan {carriers.data.length} tanesi gösteriliyor
                                            </div>
                                            <nav>
                                                <ul className="pagination mb-0">
                                                    {carriers.links.map((link, index) => (
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
        </Layout>
    );
}
