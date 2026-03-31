import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { Dropdown } from 'react-bootstrap';
import Layout from '../../../Layouts';

interface Vehicle {
    id: number;
    name: string | null;
    plate_number: string;
    make: string | null;
    model: string | null;
    year: number | null;
    color: string | null;
    vehicle_type: string;
    fuel_type: string | null;
    capacity: number | null;
    mileage: number | null;
    status: 'available' | 'in_use' | 'maintenance' | 'retired';
    is_active: boolean;
    is_available: boolean;
    location?: {
        id: number;
        name: string;
    } | null;
    user?: {
        id: number;
        name: string;
    } | null;
    insurance_expiry_date: string | null;
    traffic_insurance_expiry: string | null;
    inspection_date: string | null;
    created_at: string;
    updated_at: string;
}

interface Location {
    id: number;
    name: string;
}

interface Stats {
    total_vehicles: number;
    active_vehicles: number;
    available_vehicles: number;
    in_use_vehicles: number;
    maintenance_vehicles: number;
    retired_vehicles: number;
    insurance_expiring_soon: number;
    maintenance_due_soon: number;
}

interface Filters {
    search?: string;
    status?: string;
    location_id?: number;
    vehicle_type?: string;
    is_active?: string;
}

interface Props {
    vehicles: {
        data: Vehicle[];
        links: any[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
    locations: Location[];
    stats: Stats;
    filters: Filters;
}

export default function Index({ vehicles, locations, stats, filters }: Props) {
    const [search, setSearch] = useState(filters.search || '');
    const [status, setStatus] = useState(filters.status || '');
    const [locationId, setLocationId] = useState(filters.location_id || '');
    const [vehicleType, setVehicleType] = useState(filters.vehicle_type || '');
    const [isActive, setIsActive] = useState(filters.is_active || '');

    const handleFilter = () => {
        router.get(route('logistics.vehicles.index'), {
            search,
            status,
            location_id: locationId,
            vehicle_type: vehicleType,
            is_active: isActive,
        }, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleReset = () => {
        setSearch('');
        setStatus('');
        setLocationId('');
        setVehicleType('');
        setIsActive('');
        router.get(route('logistics.vehicles.index'));
    };

    const handleDelete = (id: number) => {
        if (confirm('Bu aracı silmek istediğinizden emin misiniz?')) {
            router.delete(route('logistics.vehicles.destroy', id));
        }
    };

    const getStatusBadgeClass = (status: string) => {
        switch (status) {
            case 'available':
                return 'badge-success';
            case 'in_use':
                return 'badge-primary';
            case 'maintenance':
                return 'badge-warning';
            case 'retired':
                return 'badge-secondary';
            default:
                return 'badge-secondary';
        }
    };

    const getStatusText = (status: string) => {
        switch (status) {
            case 'available':
                return 'Müsait';
            case 'in_use':
                return 'Kullanımda';
            case 'maintenance':
                return 'Bakımda';
            case 'retired':
                return 'Hizmet Dışı';
            default:
                return 'Bilinmiyor';
        }
    };

    const getVehicleTypeText = (type: string) => {
        switch (type) {
            case 'car':
                return 'Otomobil';
            case 'van':
                return 'Hafif Ticari';
            case 'truck':
                return 'Kamyon';
            case 'motorcycle':
                return 'Motosiklet';
            case 'bus':
                return 'Otobüs';
            case 'trailer':
                return 'Römork';
            case 'other':
                return 'Diğer';
            default:
                return 'Bilinmiyor';
        }
    };

    const formatNumber = (value: number | null) => {
        if (value === null) return '-';
        return new Intl.NumberFormat('tr-TR').format(value);
    };

    return (
        <Layout>
            <Head title="Araç Yönetimi" />
            <div className="page-content">
                <div className="container-fluid">
                    {/* Page Title */}
                    <div className="row">
                        <div className="col-12">
                            <div className="page-title-box d-sm-flex align-items-center justify-content-between">
                                <h4 className="mb-sm-0">Araç Yönetimi</h4>
                                <div className="page-title-right">
                                    <ol className="breadcrumb m-0">
                                        <li className="breadcrumb-item">
                                            <Link href={route('dashboard')}>Dashboard</Link>
                                        </li>
                                        <li className="breadcrumb-item">Lojistik</li>
                                        <li className="breadcrumb-item active">Araçlar</li>
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
                                            <p className="text-uppercase fw-medium text-muted mb-0">
                                                Toplam Araç
                                            </p>
                                        </div>
                                    </div>
                                    <div className="d-flex align-items-end justify-content-between mt-2">
                                        <div>
                                            <h4 className="fs-22 fw-semibold ff-secondary mb-2">
                                                {stats.total_vehicles}
                                            </h4>
                                            <span className="badge bg-success-subtle text-success">
                                                {stats.active_vehicles} Aktif
                                            </span>
                                        </div>
                                        <div className="avatar-sm flex-shrink-0">
                                            <span className="avatar-title bg-success-subtle rounded fs-3">
                                                <i className="fas fa-car text-success"></i>
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
                                            <p className="text-uppercase fw-medium text-muted mb-0">
                                                Müsait Araçlar
                                            </p>
                                        </div>
                                    </div>
                                    <div className="d-flex align-items-end justify-content-between mt-2">
                                        <div>
                                            <h4 className="fs-22 fw-semibold ff-secondary mb-2">
                                                {stats.available_vehicles}
                                            </h4>
                                            <span className="badge bg-info-subtle text-info">
                                                {stats.in_use_vehicles} Kullanımda
                                            </span>
                                        </div>
                                        <div className="avatar-sm flex-shrink-0">
                                            <span className="avatar-title bg-info-subtle rounded fs-3">
                                                <i className="fas fa-check-circle text-info"></i>
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
                                            <p className="text-uppercase fw-medium text-muted mb-0">
                                                Bakımda
                                            </p>
                                        </div>
                                    </div>
                                    <div className="d-flex align-items-end justify-content-between mt-2">
                                        <div>
                                            <h4 className="fs-22 fw-semibold ff-secondary mb-2">
                                                {stats.maintenance_vehicles}
                                            </h4>
                                            {stats.maintenance_due_soon > 0 && (
                                                <span className="badge bg-warning-subtle text-warning">
                                                    {stats.maintenance_due_soon} Bakım Bekliyor
                                                </span>
                                            )}
                                        </div>
                                        <div className="avatar-sm flex-shrink-0">
                                            <span className="avatar-title bg-warning-subtle rounded fs-3">
                                                <i className="fas fa-wrench text-warning"></i>
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
                                            <p className="text-uppercase fw-medium text-muted mb-0">
                                                Sigorta Uyarıları
                                            </p>
                                        </div>
                                    </div>
                                    <div className="d-flex align-items-end justify-content-between mt-2">
                                        <div>
                                            <h4 className="fs-22 fw-semibold ff-secondary mb-2">
                                                {stats.insurance_expiring_soon}
                                            </h4>
                                            <span className="badge bg-danger-subtle text-danger">
                                                30 Gün İçinde Bitiyor
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
                                                placeholder="Plaka, marka, model..."
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
                                                <option value="available">Müsait</option>
                                                <option value="in_use">Kullanımda</option>
                                                <option value="maintenance">Bakımda</option>
                                                <option value="retired">Hizmet Dışı</option>
                                            </select>
                                        </div>
                                        <div className="col-md-2">
                                            <label className="form-label">Lokasyon</label>
                                            <select
                                                className="form-select"
                                                value={locationId}
                                                onChange={(e) => setLocationId(e.target.value)}
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
                                            <label className="form-label">Araç Tipi</label>
                                            <select
                                                className="form-select"
                                                value={vehicleType}
                                                onChange={(e) => setVehicleType(e.target.value)}
                                            >
                                                <option value="">Tümü</option>
                                                <option value="car">Otomobil</option>
                                                <option value="van">Hafif Ticari</option>
                                                <option value="truck">Kamyon</option>
                                                <option value="motorcycle">Motosiklet</option>
                                                <option value="bus">Otobüs</option>
                                                <option value="trailer">Römork</option>
                                                <option value="other">Diğer</option>
                                            </select>
                                        </div>
                                        <div className="col-md-3">
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
                                                    <i className="fas fa-redo me-1"></i>
                                                    Sıfırla
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Vehicles Table */}
                    <div className="row">
                        <div className="col-12">
                            <div className="card">
                                <div className="card-header d-flex justify-content-between align-items-center">
                                    <h5 className="card-title mb-0">
                                        Araçlar ({vehicles.total})
                                    </h5>
                                    <Link
                                        href={route('logistics.vehicles.create')}
                                        className="btn btn-success btn-sm"
                                    >
                                        <i className="fas fa-plus me-1"></i>
                                        Yeni Araç Ekle
                                    </Link>
                                </div>
                                <div className="card-body">
                                    <div className="table-responsive">
                                        <table className="table table-hover align-middle mb-0">
                                            <thead className="table-light">
                                                <tr>
                                                    <th>Plaka</th>
                                                    <th>Marka/Model</th>
                                                    <th>Tip</th>
                                                    <th>Yıl</th>
                                                    <th>Kilometre</th>
                                                    <th>Lokasyon</th>
                                                    <th>Durum</th>
                                                    <th className="text-end">İşlemler</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {vehicles.data.length > 0 ? (
                                                    vehicles.data.map((vehicle) => (
                                                        <tr key={vehicle.id}>
                                                            <td>
                                                                <strong>{vehicle.plate_number}</strong>
                                                            </td>
                                                            <td>
                                                                {vehicle.make} {vehicle.model}
                                                                {vehicle.year && (
                                                                    <small className="text-muted d-block">
                                                                        {vehicle.year}
                                                                    </small>
                                                                )}
                                                            </td>
                                                            <td>
                                                                <span className="badge bg-secondary-subtle text-secondary">
                                                                    {getVehicleTypeText(vehicle.vehicle_type)}
                                                                </span>
                                                            </td>
                                                            <td>{vehicle.year || '-'}</td>
                                                            <td>{formatNumber(vehicle.mileage)} km</td>
                                                            <td>
                                                                {vehicle.location ? (
                                                                    <span className="badge bg-info-subtle text-info">
                                                                        {vehicle.location.name}
                                                                    </span>
                                                                ) : (
                                                                    <span className="text-muted">-</span>
                                                                )}
                                                            </td>
                                                            <td>
                                                                <span className={`badge ${getStatusBadgeClass(vehicle.status)}`}>
                                                                    {getStatusText(vehicle.status)}
                                                                </span>
                                                            </td>
                                                            <td className="text-end">
                                                                <Dropdown align="end">
                                                                    <Dropdown.Toggle
                                                                        variant="soft-secondary"
                                                                        size="sm"
                                                                        className="btn-icon"
                                                                    >
                                                                        <i className="fas fa-ellipsis-v"></i>
                                                                    </Dropdown.Toggle>
                                                                    <Dropdown.Menu>
                                                                        <Dropdown.Item
                                                                            as={Link}
                                                                            href={route('logistics.vehicles.show', vehicle.id)}
                                                                        >
                                                                            <i className="fas fa-eye me-2"></i>
                                                                            Detay
                                                                        </Dropdown.Item>
                                                                        <Dropdown.Item
                                                                            as={Link}
                                                                            href={route('logistics.vehicles.edit', vehicle.id)}
                                                                        >
                                                                            <i className="fas fa-edit me-2"></i>
                                                                            Düzenle
                                                                        </Dropdown.Item>
                                                                        <Dropdown.Divider />
                                                                        <Dropdown.Item
                                                                            className="text-danger"
                                                                            onClick={() => handleDelete(vehicle.id)}
                                                                        >
                                                                            <i className="fas fa-trash me-2"></i>
                                                                            Sil
                                                                        </Dropdown.Item>
                                                                    </Dropdown.Menu>
                                                                </Dropdown>
                                                            </td>
                                                        </tr>
                                                    ))
                                                ) : (
                                                    <tr>
                                                        <td colSpan={8} className="text-center py-4">
                                                            <i className="fas fa-car fa-3x text-muted mb-3 d-block"></i>
                                                            <p className="text-muted">Henüz araç kaydı bulunmamaktadır.</p>
                                                            <Link
                                                                href={route('logistics.vehicles.create')}
                                                                className="btn btn-primary btn-sm mt-2"
                                                            >
                                                                <i className="fas fa-plus me-1"></i>
                                                                İlk Aracı Ekle
                                                            </Link>
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>

                                    {/* Pagination */}
                                    {vehicles.last_page > 1 && (
                                        <div className="d-flex justify-content-between align-items-center mt-3">
                                            <div className="text-muted">
                                                Toplam {vehicles.total} kayıttan {vehicles.data.length} tanesi gösteriliyor
                                            </div>
                                            <nav>
                                                <ul className="pagination mb-0">
                                                    {vehicles.links.map((link, index) => (
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
