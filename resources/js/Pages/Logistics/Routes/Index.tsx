import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import Layout from '../../../Layouts';

interface LogisticsRoute {
    id: number;
    route_number: string;
    route_name: string;
    origin_location: string | null;
    destination_location: string | null;
    total_distance_km: number | null;
    estimated_duration_minutes: number | null;
    route_type: string;
    route_type_text: string;
    frequency: string;
    frequency_text: string;
    status: string;
    status_text: string;
    is_favorite: boolean;
    is_optimized: boolean;
    estimated_fuel_cost: number | null;
    estimated_toll_cost: number | null;
    total_cost: number;
    waypoint_count: number;
    total_trips: number;
    last_used_at: string | null;
    created_at: string;
}

interface Stats {
    total_routes: number;
    active_routes: number;
    favorite_routes: number;
    optimized_routes: number;
    delivery_routes: number;
    multi_stop_routes: number;
    total_distance: number;
    avg_distance: number;
}

interface Filters {
    search?: string;
    status?: string;
    route_type?: string;
    frequency?: string;
    favorites?: string;
}

interface Props {
    routes: {
        data: LogisticsRoute[];
        links: any[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
    stats: Stats;
    filters: Filters;
}

export default function Index({ routes, stats, filters }: Props) {
    const [search, setSearch] = useState(filters.search || '');
    const [status, setStatus] = useState(filters.status || '');
    const [routeType, setRouteType] = useState(filters.route_type || '');
    const [frequency, setFrequency] = useState(filters.frequency || '');
    const [showFavorites, setShowFavorites] = useState(filters.favorites === 'true');

    const handleFilter = () => {
        router.get(route('logistics.routes.index'), {
            search,
            status,
            route_type: routeType,
            frequency,
            favorites: showFavorites ? 'true' : undefined,
        }, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleReset = () => {
        setSearch('');
        setStatus('');
        setRouteType('');
        setFrequency('');
        setShowFavorites(false);
        router.get(route('logistics.routes.index'));
    };

    const handleToggleFavorite = (routeId: number) => {
        router.post(route('logistics.routes.favorite', routeId));
    };

    const handleDelete = (routeId: number) => {
        if (confirm('Bu rotayı silmek istediğinizden emin misiniz?')) {
            router.delete(route('logistics.routes.destroy', routeId));
        }
    };

    const getStatusBadgeClass = (status: string) => {
        switch (status) {
            case 'active':
                return 'badge-success';
            case 'inactive':
                return 'badge-secondary';
            case 'under_review':
                return 'badge-warning';
            default:
                return 'badge-secondary';
        }
    };

    const getRouteTypeBadgeClass = (type: string) => {
        switch (type) {
            case 'delivery':
                return 'badge-primary';
            case 'pickup':
                return 'badge-info';
            case 'round_trip':
                return 'badge-warning';
            case 'multi_stop':
                return 'badge-danger';
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

    const formatCurrency = (value: number | null) => {
        if (value === null || value === 0) return '-';
        return new Intl.NumberFormat('tr-TR', {
            style: 'currency',
            currency: 'TRY'
        }).format(value);
    };

    const formatDuration = (minutes: number | null) => {
        if (!minutes) return '-';
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return hours > 0 ? `${hours}s ${mins}dk` : `${mins}dk`;
    };

    return (
        <Layout>
            <Head title="Rota Yönetimi" />
            <div className="page-content">
                <div className="container-fluid">
                    {/* Page Title */}
                    <div className="row">
                        <div className="col-12">
                            <div className="page-title-box d-sm-flex align-items-center justify-content-between">
                                <h4 className="mb-sm-0">Rota Yönetimi</h4>
                                <div className="page-title-right">
                                    <ol className="breadcrumb m-0">
                                        <li className="breadcrumb-item">
                                            <Link href={route('dashboard')}>Dashboard</Link>
                                        </li>
                                        <li className="breadcrumb-item">Lojistik</li>
                                        <li className="breadcrumb-item active">Rotalar</li>
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
                                            <p className="text-uppercase fw-medium text-muted mb-0">Toplam Rota</p>
                                        </div>
                                    </div>
                                    <div className="d-flex align-items-end justify-content-between mt-2">
                                        <div>
                                            <h4 className="fs-22 fw-semibold ff-secondary mb-2">
                                                {stats.total_routes}
                                            </h4>
                                            <span className="badge bg-success-subtle text-success">
                                                {stats.active_routes} Aktif
                                            </span>
                                        </div>
                                        <div className="avatar-sm flex-shrink-0">
                                            <span className="avatar-title bg-primary-subtle rounded fs-3">
                                                <i className="fas fa-route text-primary"></i>
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
                                            <p className="text-uppercase fw-medium text-muted mb-0">Favoriler</p>
                                        </div>
                                    </div>
                                    <div className="d-flex align-items-end justify-content-between mt-2">
                                        <div>
                                            <h4 className="fs-22 fw-semibold ff-secondary mb-2">
                                                {stats.favorite_routes}
                                            </h4>
                                            <span className="badge bg-warning-subtle text-warning">
                                                {stats.optimized_routes} Optimize
                                            </span>
                                        </div>
                                        <div className="avatar-sm flex-shrink-0">
                                            <span className="avatar-title bg-warning-subtle rounded fs-3">
                                                <i className="fas fa-star text-warning"></i>
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
                                            <p className="text-uppercase fw-medium text-muted mb-0">Toplam Mesafe</p>
                                        </div>
                                    </div>
                                    <div className="d-flex align-items-end justify-content-between mt-2">
                                        <div>
                                            <h4 className="fs-22 fw-semibold ff-secondary mb-2">
                                                {formatNumber(stats.total_distance)} km
                                            </h4>
                                            <span className="badge bg-info-subtle text-info">
                                                Ort: {formatNumber(stats.avg_distance)} km
                                            </span>
                                        </div>
                                        <div className="avatar-sm flex-shrink-0">
                                            <span className="avatar-title bg-info-subtle rounded fs-3">
                                                <i className="fas fa-road text-info"></i>
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
                                            <p className="text-uppercase fw-medium text-muted mb-0">Çoklu Durak</p>
                                        </div>
                                    </div>
                                    <div className="d-flex align-items-end justify-content-between mt-2">
                                        <div>
                                            <h4 className="fs-22 fw-semibold ff-secondary mb-2">
                                                {stats.multi_stop_routes}
                                            </h4>
                                            <span className="badge bg-danger-subtle text-danger">
                                                {stats.delivery_routes} Teslimat
                                            </span>
                                        </div>
                                        <div className="avatar-sm flex-shrink-0">
                                            <span className="avatar-title bg-danger-subtle rounded fs-3">
                                                <i className="fas fa-map-marked-alt text-danger"></i>
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
                                                placeholder="Rota no, isim, lokasyon..."
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
                                                <option value="under_review">İnceleme Altında</option>
                                            </select>
                                        </div>
                                        <div className="col-md-2">
                                            <label className="form-label">Rota Tipi</label>
                                            <select
                                                className="form-select"
                                                value={routeType}
                                                onChange={(e) => setRouteType(e.target.value)}
                                            >
                                                <option value="">Tümü</option>
                                                <option value="delivery">Teslimat</option>
                                                <option value="pickup">Toplama</option>
                                                <option value="round_trip">Gidiş-Dönüş</option>
                                                <option value="multi_stop">Çoklu Durak</option>
                                            </select>
                                        </div>
                                        <div className="col-md-2">
                                            <label className="form-label">Sıklık</label>
                                            <select
                                                className="form-select"
                                                value={frequency}
                                                onChange={(e) => setFrequency(e.target.value)}
                                            >
                                                <option value="">Tümü</option>
                                                <option value="daily">Günlük</option>
                                                <option value="weekly">Haftalık</option>
                                                <option value="monthly">Aylık</option>
                                                <option value="on_demand">Talep Üzerine</option>
                                            </select>
                                        </div>
                                        <div className="col-md-1">
                                            <label className="form-label">Favoriler</label>
                                            <div className="form-check">
                                                <input
                                                    className="form-check-input"
                                                    type="checkbox"
                                                    checked={showFavorites}
                                                    onChange={(e) => setShowFavorites(e.target.checked)}
                                                />
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

                    {/* Routes Table */}
                    <div className="row">
                        <div className="col-12">
                            <div className="card">
                                <div className="card-header d-flex justify-content-between align-items-center">
                                    <h5 className="card-title mb-0">
                                        Rotalar ({routes.total})
                                    </h5>
                                </div>
                                <div className="card-body">
                                    <div className="table-responsive">
                                        <table className="table table-hover align-middle mb-0">
                                            <thead className="table-light">
                                                <tr>
                                                    <th style={{ width: '30px' }}></th>
                                                    <th>Rota No / İsim</th>
                                                    <th>Başlangıç - Varış</th>
                                                    <th>Tip</th>
                                                    <th>Mesafe/Süre</th>
                                                    <th>Duraklar</th>
                                                    <th>Maliyet</th>
                                                    <th>Sıklık</th>
                                                    <th>Kullanım</th>
                                                    <th>Durum</th>
                                                    <th className="text-end">İşlemler</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {routes.data.length > 0 ? (
                                                    routes.data.map((logisticsRoute) => (
                                                        <tr key={logisticsRoute.id}>
                                                            <td>
                                                                <button
                                                                    className="btn btn-sm btn-link p-0"
                                                                    onClick={() => handleToggleFavorite(logisticsRoute.id)}
                                                                    title={logisticsRoute.is_favorite ? 'Favorilerden çıkar' : 'Favorilere ekle'}
                                                                >
                                                                    <i className={`fas fa-star ${logisticsRoute.is_favorite ? 'text-warning' : 'text-muted'}`}></i>
                                                                </button>
                                                            </td>
                                                            <td>
                                                                <strong>{logisticsRoute.route_number}</strong>
                                                                <small className="text-muted d-block">
                                                                    {logisticsRoute.route_name}
                                                                </small>
                                                            </td>
                                                            <td>
                                                                <div className="d-flex flex-column">
                                                                    <span>{logisticsRoute.origin_location || '-'}</span>
                                                                    <i className="fas fa-arrow-down text-muted" style={{ fontSize: '10px' }}></i>
                                                                    <span>{logisticsRoute.destination_location || '-'}</span>
                                                                </div>
                                                            </td>
                                                            <td>
                                                                <span className={`badge ${getRouteTypeBadgeClass(logisticsRoute.route_type)}`}>
                                                                    {logisticsRoute.route_type_text}
                                                                </span>
                                                                {logisticsRoute.is_optimized && (
                                                                    <span className="badge bg-success-subtle text-success d-block mt-1">
                                                                        <i className="fas fa-check-circle me-1"></i>
                                                                        Optimize
                                                                    </span>
                                                                )}
                                                            </td>
                                                            <td>
                                                                {logisticsRoute.total_distance_km ? (
                                                                    <>
                                                                        {formatNumber(logisticsRoute.total_distance_km)} km
                                                                        {logisticsRoute.estimated_duration_minutes && (
                                                                            <small className="text-muted d-block">
                                                                                {formatDuration(logisticsRoute.estimated_duration_minutes)}
                                                                            </small>
                                                                        )}
                                                                    </>
                                                                ) : '-'}
                                                            </td>
                                                            <td>
                                                                {logisticsRoute.waypoint_count > 0 ? (
                                                                    <span className="badge bg-info-subtle text-info">
                                                                        <i className="fas fa-map-marker-alt me-1"></i>
                                                                        {logisticsRoute.waypoint_count} Durak
                                                                    </span>
                                                                ) : '-'}
                                                            </td>
                                                            <td>
                                                                {formatCurrency(logisticsRoute.total_cost)}
                                                            </td>
                                                            <td>
                                                                <small>{logisticsRoute.frequency_text}</small>
                                                            </td>
                                                            <td>
                                                                {logisticsRoute.total_trips > 0 ? (
                                                                    <span className="badge bg-secondary-subtle text-secondary">
                                                                        {logisticsRoute.total_trips} Sefer
                                                                    </span>
                                                                ) : '-'}
                                                            </td>
                                                            <td>
                                                                <span className={`badge ${getStatusBadgeClass(logisticsRoute.status)}`}>
                                                                    {logisticsRoute.status_text}
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
                                                                            <button
                                                                                className="dropdown-item"
                                                                                onClick={() => handleToggleFavorite(logisticsRoute.id)}
                                                                            >
                                                                                <i className={`fas fa-star me-2 ${logisticsRoute.is_favorite ? 'text-warning' : ''}`}></i>
                                                                                {logisticsRoute.is_favorite ? 'Favorilerden Çıkar' : 'Favorilere Ekle'}
                                                                            </button>
                                                                        </li>
                                                                        <li>
                                                                            <hr className="dropdown-divider" />
                                                                        </li>
                                                                        <li>
                                                                            <button
                                                                                className="dropdown-item text-danger"
                                                                                onClick={() => handleDelete(logisticsRoute.id)}
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
                                                        <td colSpan={11} className="text-center py-4">
                                                            <i className="fas fa-route fa-3x text-muted mb-3 d-block"></i>
                                                            <p className="text-muted">Henüz rota kaydı bulunmamaktadır.</p>
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>

                                    {/* Pagination */}
                                    {routes.last_page > 1 && (
                                        <div className="d-flex justify-content-between align-items-center mt-3">
                                            <div className="text-muted">
                                                Toplam {routes.total} kayıttan {routes.data.length} tanesi gösteriliyor
                                            </div>
                                            <nav>
                                                <ul className="pagination mb-0">
                                                    {routes.links.map((link, index) => (
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
