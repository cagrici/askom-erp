import React, { useState, useEffect } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import Layout from '../../../Layouts';

interface Vehicle {
    id: number;
    plate_number: string;
    make: string;
    model: string;
}

interface Driver {
    id: number;
    name: string;
}

interface Shipment {
    id: number;
    shipment_number: string;
    status: string;
    status_text: string;
    priority: string;
    priority_text: string;
    vehicle?: Vehicle;
    driver?: Driver;
    destination_name: string | null;
    destination_city: string | null;
    destination_address: string | null;
    origin_latitude: number | null;
    origin_longitude: number | null;
    destination_latitude: number | null;
    destination_longitude: number | null;
    current_latitude: number | null;
    current_longitude: number | null;
    last_location_update: string | null;
    completion_percentage: number;
    planned_delivery_date: string | null;
    is_delayed: boolean;
    estimated_distance_km: number | null;
}

interface Stats {
    in_transit: number;
    on_time: number;
    delayed: number;
    urgent_priority: number;
    deliveries_today: number;
    tracked_vehicles: number;
    avg_completion: number;
}

interface Filters {
    vehicle_id?: number;
    driver_id?: number;
    priority?: string;
    search?: string;
}

interface Props {
    shipments: Shipment[];
    vehicles: Vehicle[];
    stats: Stats;
    filters: Filters;
}

export default function Index({ shipments, vehicles, stats, filters }: Props) {
    const [search, setSearch] = useState(filters.search || '');
    const [vehicleId, setVehicleId] = useState(filters.vehicle_id?.toString() || '');
    const [priority, setPriority] = useState(filters.priority || '');
    const [selectedShipment, setSelectedShipment] = useState<Shipment | null>(null);
    const [autoRefresh, setAutoRefresh] = useState(true);

    // Auto-refresh every 30 seconds
    useEffect(() => {
        if (!autoRefresh) return;

        const interval = setInterval(() => {
            router.reload({ only: ['shipments', 'stats'] });
        }, 30000);

        return () => clearInterval(interval);
    }, [autoRefresh]);

    const handleFilter = () => {
        router.get(route('logistics.tracking.index'), {
            search,
            vehicle_id: vehicleId || undefined,
            priority: priority || undefined,
        }, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleReset = () => {
        setSearch('');
        setVehicleId('');
        setPriority('');
        router.get(route('logistics.tracking.index'));
    };

    const getPriorityBadgeClass = (priority: string) => {
        switch (priority) {
            case 'urgent':
                return 'badge-danger';
            case 'high':
                return 'badge-warning';
            case 'normal':
                return 'badge-info';
            case 'low':
                return 'badge-secondary';
            default:
                return 'badge-secondary';
        }
    };

    const getProgressBarClass = (percentage: number, isDelayed: boolean) => {
        if (isDelayed) return 'bg-danger';
        if (percentage >= 75) return 'bg-success';
        if (percentage >= 50) return 'bg-info';
        if (percentage >= 25) return 'bg-warning';
        return 'bg-secondary';
    };

    const formatNumber = (value: number | null) => {
        if (value === null) return '-';
        return new Intl.NumberFormat('tr-TR', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2
        }).format(value);
    };

    const handleShowMap = (shipment: Shipment) => {
        setSelectedShipment(shipment);
    };

    const openGoogleMaps = (shipment: Shipment) => {
        if (!shipment.current_latitude || !shipment.current_longitude) return;

        const url = `https://www.google.com/maps?q=${shipment.current_latitude},${shipment.current_longitude}`;
        window.open(url, '_blank');
    };

    return (
        <Layout>
            <Head title="Canlı Takip" />
            <div className="page-content">
                <div className="container-fluid">
                    {/* Page Title */}
                    <div className="row">
                        <div className="col-12">
                            <div className="page-title-box d-sm-flex align-items-center justify-content-between">
                                <h4 className="mb-sm-0">Canlı Sevkiyat Takibi</h4>
                                <div className="page-title-right">
                                    <ol className="breadcrumb m-0">
                                        <li className="breadcrumb-item">
                                            <Link href={route('dashboard')}>Dashboard</Link>
                                        </li>
                                        <li className="breadcrumb-item">Lojistik</li>
                                        <li className="breadcrumb-item active">Canlı Takip</li>
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
                                            <p className="text-uppercase fw-medium text-muted mb-0">Yoldaki Sevkiyatlar</p>
                                        </div>
                                    </div>
                                    <div className="d-flex align-items-end justify-content-between mt-2">
                                        <div>
                                            <h4 className="fs-22 fw-semibold ff-secondary mb-2">
                                                {stats.in_transit}
                                            </h4>
                                            <span className="badge bg-primary-subtle text-primary">
                                                {stats.tracked_vehicles} Araç
                                            </span>
                                        </div>
                                        <div className="avatar-sm flex-shrink-0">
                                            <span className="avatar-title bg-primary-subtle rounded fs-3">
                                                <i className="fas fa-truck text-primary"></i>
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
                                            <p className="text-uppercase fw-medium text-muted mb-0">Zamanında</p>
                                        </div>
                                    </div>
                                    <div className="d-flex align-items-end justify-content-between mt-2">
                                        <div>
                                            <h4 className="fs-22 fw-semibold ff-secondary mb-2">
                                                {stats.on_time}
                                            </h4>
                                            <span className="badge bg-success-subtle text-success">
                                                %{stats.in_transit > 0 ? Math.round((stats.on_time / stats.in_transit) * 100) : 0}
                                            </span>
                                        </div>
                                        <div className="avatar-sm flex-shrink-0">
                                            <span className="avatar-title bg-success-subtle rounded fs-3">
                                                <i className="fas fa-check-circle text-success"></i>
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
                                            <p className="text-uppercase fw-medium text-muted mb-0">Gecikmiş</p>
                                        </div>
                                    </div>
                                    <div className="d-flex align-items-end justify-content-between mt-2">
                                        <div>
                                            <h4 className="fs-22 fw-semibold ff-secondary mb-2">
                                                {stats.delayed}
                                            </h4>
                                            <span className="badge bg-danger-subtle text-danger">
                                                Acil: {stats.urgent_priority}
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

                        <div className="col-xl-3 col-md-6">
                            <div className="card card-animate">
                                <div className="card-body">
                                    <div className="d-flex align-items-center">
                                        <div className="flex-grow-1">
                                            <p className="text-uppercase fw-medium text-muted mb-0">Ort. Tamamlanma</p>
                                        </div>
                                    </div>
                                    <div className="d-flex align-items-end justify-content-between mt-2">
                                        <div>
                                            <h4 className="fs-22 fw-semibold ff-secondary mb-2">
                                                %{formatNumber(stats.avg_completion)}
                                            </h4>
                                            <span className="badge bg-info-subtle text-info">
                                                Bugün: {stats.deliveries_today}
                                            </span>
                                        </div>
                                        <div className="avatar-sm flex-shrink-0">
                                            <span className="avatar-title bg-info-subtle rounded fs-3">
                                                <i className="fas fa-percentage text-info"></i>
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Filters and Auto-refresh */}
                    <div className="row mb-3">
                        <div className="col-12">
                            <div className="card">
                                <div className="card-body">
                                    <div className="row g-3 align-items-end">
                                        <div className="col-md-4">
                                            <label className="form-label">Ara</label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                placeholder="Sevkiyat no, hedef..."
                                                value={search}
                                                onChange={(e) => setSearch(e.target.value)}
                                                onKeyPress={(e) => e.key === 'Enter' && handleFilter()}
                                            />
                                        </div>
                                        <div className="col-md-3">
                                            <label className="form-label">Araç</label>
                                            <select
                                                className="form-select"
                                                value={vehicleId}
                                                onChange={(e) => setVehicleId(e.target.value)}
                                            >
                                                <option value="">Tüm Araçlar</option>
                                                {vehicles.map((vehicle) => (
                                                    <option key={vehicle.id} value={vehicle.id}>
                                                        {vehicle.plate_number} - {vehicle.make} {vehicle.model}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="col-md-2">
                                            <label className="form-label">Öncelik</label>
                                            <select
                                                className="form-select"
                                                value={priority}
                                                onChange={(e) => setPriority(e.target.value)}
                                            >
                                                <option value="">Tümü</option>
                                                <option value="urgent">Acil</option>
                                                <option value="high">Yüksek</option>
                                                <option value="normal">Normal</option>
                                                <option value="low">Düşük</option>
                                            </select>
                                        </div>
                                        <div className="col-md-3">
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
                                            <div className="form-check mt-2">
                                                <input
                                                    className="form-check-input"
                                                    type="checkbox"
                                                    id="autoRefresh"
                                                    checked={autoRefresh}
                                                    onChange={(e) => setAutoRefresh(e.target.checked)}
                                                />
                                                <label className="form-check-label" htmlFor="autoRefresh">
                                                    Otomatik Yenile (30sn)
                                                </label>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Shipments Tracking List */}
                    <div className="row">
                        <div className="col-12">
                            <div className="card">
                                <div className="card-header d-flex justify-content-between align-items-center">
                                    <h5 className="card-title mb-0">
                                        Aktif Sevkiyatlar ({shipments.length})
                                    </h5>
                                    <div className="text-muted">
                                        <i className="fas fa-sync-alt me-1"></i>
                                        Son güncelleme: {new Date().toLocaleTimeString('tr-TR')}
                                    </div>
                                </div>
                                <div className="card-body">
                                    {shipments.length > 0 ? (
                                        <div className="table-responsive">
                                            <table className="table table-hover align-middle mb-0">
                                                <thead className="table-light">
                                                    <tr>
                                                        <th>Sevkiyat</th>
                                                        <th>Araç/Sürücü</th>
                                                        <th>Hedef</th>
                                                        <th>İlerleme</th>
                                                        <th>Öncelik</th>
                                                        <th>Son Konum</th>
                                                        <th className="text-end">İşlemler</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {shipments.map((shipment) => (
                                                        <tr key={shipment.id}>
                                                            <td>
                                                                <strong>{shipment.shipment_number}</strong>
                                                                {shipment.is_delayed && (
                                                                    <span className="badge bg-danger-subtle text-danger ms-2">
                                                                        <i className="fas fa-clock me-1"></i>
                                                                        Gecikmiş
                                                                    </span>
                                                                )}
                                                            </td>
                                                            <td>
                                                                {shipment.vehicle && (
                                                                    <div>
                                                                        <i className="fas fa-truck text-primary me-1"></i>
                                                                        {shipment.vehicle.plate_number}
                                                                    </div>
                                                                )}
                                                                {shipment.driver && (
                                                                    <small className="text-muted d-block">
                                                                        <i className="fas fa-user me-1"></i>
                                                                        {shipment.driver.name}
                                                                    </small>
                                                                )}
                                                            </td>
                                                            <td>
                                                                <div>
                                                                    {shipment.destination_name || '-'}
                                                                </div>
                                                                {shipment.destination_city && (
                                                                    <small className="text-muted">
                                                                        {shipment.destination_city}
                                                                    </small>
                                                                )}
                                                            </td>
                                                            <td style={{ minWidth: '200px' }}>
                                                                <div className="d-flex align-items-center">
                                                                    <div className="flex-grow-1 me-2">
                                                                        <div className="progress" style={{ height: '20px' }}>
                                                                            <div
                                                                                className={`progress-bar ${getProgressBarClass(shipment.completion_percentage, shipment.is_delayed)}`}
                                                                                role="progressbar"
                                                                                style={{ width: `${shipment.completion_percentage}%` }}
                                                                                aria-valuenow={shipment.completion_percentage}
                                                                                aria-valuemin={0}
                                                                                aria-valuemax={100}
                                                                            >
                                                                                {shipment.completion_percentage}%
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                {shipment.estimated_distance_km && (
                                                                    <small className="text-muted">
                                                                        {formatNumber(shipment.estimated_distance_km)} km
                                                                    </small>
                                                                )}
                                                            </td>
                                                            <td>
                                                                <span className={`badge ${getPriorityBadgeClass(shipment.priority)}`}>
                                                                    {shipment.priority_text}
                                                                </span>
                                                            </td>
                                                            <td>
                                                                {shipment.last_location_update ? (
                                                                    <small className="text-muted">
                                                                        <i className="fas fa-map-marker-alt me-1"></i>
                                                                        {shipment.last_location_update}
                                                                    </small>
                                                                ) : (
                                                                    <small className="text-muted">Konum yok</small>
                                                                )}
                                                            </td>
                                                            <td className="text-end">
                                                                <div className="btn-group btn-group-sm">
                                                                    {shipment.current_latitude && shipment.current_longitude && (
                                                                        <button
                                                                            className="btn btn-soft-primary"
                                                                            onClick={() => openGoogleMaps(shipment)}
                                                                            title="Haritada Göster"
                                                                        >
                                                                            <i className="fas fa-map-marked-alt"></i>
                                                                        </button>
                                                                    )}
                                                                    <Link
                                                                        href={route('logistics.tracking.show', shipment.id)}
                                                                        className="btn btn-soft-info"
                                                                        title="Detaylar"
                                                                    >
                                                                        <i className="fas fa-eye"></i>
                                                                    </Link>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    ) : (
                                        <div className="text-center py-5">
                                            <i className="fas fa-truck fa-3x text-muted mb-3 d-block"></i>
                                            <p className="text-muted">Şu anda yolda sevkiyat bulunmamaktadır.</p>
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
