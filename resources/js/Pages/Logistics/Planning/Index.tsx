import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import Layout from '../../../Layouts';

interface Shipment {
    id: number;
    shipment_number: string;
    shipment_date: string;
    planned_delivery_date: string | null;
    actual_delivery_date: string | null;
    status: string;
    status_text: string;
    priority: string;
    priority_text: string;
    destination_name: string | null;
    destination_city: string | null;
    destination_address: string | null;
    estimated_distance_km: number | null;
    estimated_duration_minutes: number | null;
    vehicle?: {
        id: number;
        plate_number: string;
        make: string | null;
        model: string | null;
    } | null;
    driver?: {
        id: number;
        name: string;
    } | null;
    currentAccount?: {
        id: number;
        title: string;
    } | null;
}

interface Vehicle {
    id: number;
    plate_number: string;
    make: string | null;
    model: string | null;
    vehicle_type: string;
}

interface Driver {
    id: number;
    name: string;
}

interface Location {
    id: number;
    name: string;
}

interface Stats {
    total_shipments: number;
    planned_shipments: number;
    in_transit_shipments: number;
    delivered_shipments: number;
    unassigned_shipments: number;
    delayed_shipments: number;
    high_priority_shipments: number;
}

interface Filters {
    start_date: string;
    end_date: string;
    status?: string;
    vehicle_id?: number;
    driver_id?: number;
    priority?: string;
    search?: string;
}

interface Props {
    shipments: {
        data: Shipment[];
        links: any[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
    availableVehicles: Vehicle[];
    availableDrivers: Driver[];
    locations: Location[];
    stats: Stats;
    filters: Filters;
}

export default function Index({ shipments, availableVehicles, availableDrivers, locations, stats, filters }: Props) {
    const [startDate, setStartDate] = useState(filters.start_date);
    const [endDate, setEndDate] = useState(filters.end_date);
    const [status, setStatus] = useState(filters.status || '');
    const [vehicleId, setVehicleId] = useState(filters.vehicle_id || '');
    const [driverId, setDriverId] = useState(filters.driver_id || '');
    const [priority, setPriority] = useState(filters.priority || '');
    const [search, setSearch] = useState(filters.search || '');

    const [assignModalOpen, setAssignModalOpen] = useState(false);
    const [selectedShipment, setSelectedShipment] = useState<Shipment | null>(null);
    const [assignVehicleId, setAssignVehicleId] = useState('');
    const [assignDriverId, setAssignDriverId] = useState('');

    const handleFilter = () => {
        router.get(route('logistics.planning.index'), {
            start_date: startDate,
            end_date: endDate,
            status,
            vehicle_id: vehicleId,
            driver_id: driverId,
            priority,
            search,
        }, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleReset = () => {
        setStartDate(new Date().toISOString().split('T')[0]);
        setEndDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
        setStatus('');
        setVehicleId('');
        setDriverId('');
        setPriority('');
        setSearch('');
        router.get(route('logistics.planning.index'));
    };

    const openAssignModal = (shipment: Shipment) => {
        setSelectedShipment(shipment);
        setAssignVehicleId(shipment.vehicle?.id?.toString() || '');
        setAssignDriverId(shipment.driver?.id?.toString() || '');
        setAssignModalOpen(true);
    };

    const handleAssign = () => {
        if (!selectedShipment) return;

        router.post(route('logistics.planning.assign', selectedShipment.id), {
            vehicle_id: assignVehicleId,
            driver_id: assignDriverId,
        }, {
            onSuccess: () => {
                setAssignModalOpen(false);
                setSelectedShipment(null);
            }
        });
    };

    const handleStatusUpdate = (shipment: Shipment, newStatus: string) => {
        router.post(route('logistics.planning.status', shipment.id), {
            status: newStatus,
        });
    };

    const getStatusBadgeClass = (status: string) => {
        switch (status) {
            case 'draft':
                return 'badge-secondary';
            case 'planned':
                return 'badge-info';
            case 'in_transit':
                return 'badge-primary';
            case 'delivered':
                return 'badge-success';
            case 'cancelled':
                return 'badge-dark';
            case 'delayed':
                return 'badge-danger';
            default:
                return 'badge-secondary';
        }
    };

    const getPriorityBadgeClass = (priority: string) => {
        switch (priority) {
            case 'low':
                return 'badge-secondary';
            case 'normal':
                return 'badge-info';
            case 'high':
                return 'badge-warning';
            case 'urgent':
                return 'badge-danger';
            default:
                return 'badge-secondary';
        }
    };

    const formatDate = (dateString: string | null) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString('tr-TR');
    };

    return (
        <Layout>
            <Head title="Sevkiyat Planlama" />
            <div className="page-content">
                <div className="container-fluid">
                    {/* Page Title */}
                    <div className="row">
                        <div className="col-12">
                            <div className="page-title-box d-sm-flex align-items-center justify-content-between">
                                <h4 className="mb-sm-0">Sevkiyat Planlama</h4>
                                <div className="page-title-right">
                                    <ol className="breadcrumb m-0">
                                        <li className="breadcrumb-item">
                                            <Link href={route('dashboard')}>Dashboard</Link>
                                        </li>
                                        <li className="breadcrumb-item">Lojistik</li>
                                        <li className="breadcrumb-item active">Planlama</li>
                                    </ol>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Statistics Cards */}
                    <div className="row mb-4">
                        <div className="col-xl-2 col-md-4">
                            <div className="card card-animate">
                                <div className="card-body">
                                    <div className="d-flex align-items-center">
                                        <div className="flex-grow-1">
                                            <p className="text-uppercase fw-medium text-muted mb-0 text-truncate">Toplam</p>
                                        </div>
                                    </div>
                                    <div className="d-flex align-items-end justify-content-between mt-2">
                                        <div>
                                            <h4 className="fs-22 fw-semibold ff-secondary mb-0">
                                                {stats.total_shipments}
                                            </h4>
                                        </div>
                                        <div className="avatar-sm flex-shrink-0">
                                            <span className="avatar-title bg-info-subtle rounded fs-3">
                                                <i className="fas fa-shipping-fast text-info"></i>
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="col-xl-2 col-md-4">
                            <div className="card card-animate">
                                <div className="card-body">
                                    <div className="d-flex align-items-center">
                                        <div className="flex-grow-1">
                                            <p className="text-uppercase fw-medium text-muted mb-0 text-truncate">Planlandı</p>
                                        </div>
                                    </div>
                                    <div className="d-flex align-items-end justify-content-between mt-2">
                                        <div>
                                            <h4 className="fs-22 fw-semibold ff-secondary mb-0">
                                                {stats.planned_shipments}
                                            </h4>
                                        </div>
                                        <div className="avatar-sm flex-shrink-0">
                                            <span className="avatar-title bg-primary-subtle rounded fs-3">
                                                <i className="fas fa-calendar-check text-primary"></i>
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="col-xl-2 col-md-4">
                            <div className="card card-animate">
                                <div className="card-body">
                                    <div className="d-flex align-items-center">
                                        <div className="flex-grow-1">
                                            <p className="text-uppercase fw-medium text-muted mb-0 text-truncate">Yolda</p>
                                        </div>
                                    </div>
                                    <div className="d-flex align-items-end justify-content-between mt-2">
                                        <div>
                                            <h4 className="fs-22 fw-semibold ff-secondary mb-0">
                                                {stats.in_transit_shipments}
                                            </h4>
                                        </div>
                                        <div className="avatar-sm flex-shrink-0">
                                            <span className="avatar-title bg-warning-subtle rounded fs-3">
                                                <i className="fas fa-truck text-warning"></i>
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="col-xl-2 col-md-4">
                            <div className="card card-animate">
                                <div className="card-body">
                                    <div className="d-flex align-items-center">
                                        <div className="flex-grow-1">
                                            <p className="text-uppercase fw-medium text-muted mb-0 text-truncate">Teslim Edildi</p>
                                        </div>
                                    </div>
                                    <div className="d-flex align-items-end justify-content-between mt-2">
                                        <div>
                                            <h4 className="fs-22 fw-semibold ff-secondary mb-0">
                                                {stats.delivered_shipments}
                                            </h4>
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

                        <div className="col-xl-2 col-md-4">
                            <div className="card card-animate">
                                <div className="card-body">
                                    <div className="d-flex align-items-center">
                                        <div className="flex-grow-1">
                                            <p className="text-uppercase fw-medium text-muted mb-0 text-truncate">Atamasız</p>
                                        </div>
                                    </div>
                                    <div className="d-flex align-items-end justify-content-between mt-2">
                                        <div>
                                            <h4 className="fs-22 fw-semibold ff-secondary mb-0">
                                                {stats.unassigned_shipments}
                                            </h4>
                                        </div>
                                        <div className="avatar-sm flex-shrink-0">
                                            <span className="avatar-title bg-secondary-subtle rounded fs-3">
                                                <i className="fas fa-question-circle text-secondary"></i>
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="col-xl-2 col-md-4">
                            <div className="card card-animate">
                                <div className="card-body">
                                    <div className="d-flex align-items-center">
                                        <div className="flex-grow-1">
                                            <p className="text-uppercase fw-medium text-muted mb-0 text-truncate">Gecikmiş/Öncelikli</p>
                                        </div>
                                    </div>
                                    <div className="d-flex align-items-end justify-content-between mt-2">
                                        <div>
                                            <h4 className="fs-22 fw-semibold ff-secondary mb-0">
                                                {stats.delayed_shipments}/{stats.high_priority_shipments}
                                            </h4>
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
                                        <div className="col-md-2">
                                            <label className="form-label">Başlangıç Tarihi</label>
                                            <input
                                                type="date"
                                                className="form-control"
                                                value={startDate}
                                                onChange={(e) => setStartDate(e.target.value)}
                                            />
                                        </div>
                                        <div className="col-md-2">
                                            <label className="form-label">Bitiş Tarihi</label>
                                            <input
                                                type="date"
                                                className="form-control"
                                                value={endDate}
                                                onChange={(e) => setEndDate(e.target.value)}
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
                                                <option value="draft">Taslak</option>
                                                <option value="planned">Planlandı</option>
                                                <option value="in_transit">Yolda</option>
                                                <option value="delivered">Teslim Edildi</option>
                                                <option value="cancelled">İptal</option>
                                                <option value="delayed">Gecikmiş</option>
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
                                                <option value="low">Düşük</option>
                                                <option value="normal">Normal</option>
                                                <option value="high">Yüksek</option>
                                                <option value="urgent">Acil</option>
                                            </select>
                                        </div>
                                        <div className="col-md-2">
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

                    {/* Shipments Table */}
                    <div className="row">
                        <div className="col-12">
                            <div className="card">
                                <div className="card-header d-flex justify-content-between align-items-center">
                                    <h5 className="card-title mb-0">
                                        Sevkiyatlar ({shipments.total})
                                    </h5>
                                </div>
                                <div className="card-body">
                                    <div className="table-responsive">
                                        <table className="table table-hover align-middle mb-0">
                                            <thead className="table-light">
                                                <tr>
                                                    <th>Sevkiyat No</th>
                                                    <th>Tarih</th>
                                                    <th>Hedef</th>
                                                    <th>Araç</th>
                                                    <th>Sürücü</th>
                                                    <th>Mesafe/Süre</th>
                                                    <th>Öncelik</th>
                                                    <th>Durum</th>
                                                    <th className="text-end">İşlemler</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {shipments.data.length > 0 ? (
                                                    shipments.data.map((shipment) => (
                                                        <tr key={shipment.id}>
                                                            <td>
                                                                <strong>{shipment.shipment_number}</strong>
                                                            </td>
                                                            <td>
                                                                {formatDate(shipment.shipment_date)}
                                                                {shipment.planned_delivery_date && (
                                                                    <small className="text-muted d-block">
                                                                        Planlanan: {formatDate(shipment.planned_delivery_date)}
                                                                    </small>
                                                                )}
                                                            </td>
                                                            <td>
                                                                {shipment.destination_name || '-'}
                                                                {shipment.destination_city && (
                                                                    <small className="text-muted d-block">
                                                                        {shipment.destination_city}
                                                                    </small>
                                                                )}
                                                            </td>
                                                            <td>
                                                                {shipment.vehicle ? (
                                                                    <>
                                                                        <strong>{shipment.vehicle.plate_number}</strong>
                                                                        <small className="text-muted d-block">
                                                                            {shipment.vehicle.make} {shipment.vehicle.model}
                                                                        </small>
                                                                    </>
                                                                ) : (
                                                                    <span className="badge bg-warning-subtle text-warning">
                                                                        Atanmadı
                                                                    </span>
                                                                )}
                                                            </td>
                                                            <td>
                                                                {shipment.driver ? (
                                                                    shipment.driver.name
                                                                ) : (
                                                                    <span className="badge bg-warning-subtle text-warning">
                                                                        Atanmadı
                                                                    </span>
                                                                )}
                                                            </td>
                                                            <td>
                                                                {shipment.estimated_distance_km ? (
                                                                    <>
                                                                        {shipment.estimated_distance_km} km
                                                                        {shipment.estimated_duration_minutes && (
                                                                            <small className="text-muted d-block">
                                                                                ~{Math.floor(shipment.estimated_duration_minutes / 60)}s {shipment.estimated_duration_minutes % 60}dk
                                                                            </small>
                                                                        )}
                                                                    </>
                                                                ) : '-'}
                                                            </td>
                                                            <td>
                                                                <span className={`badge ${getPriorityBadgeClass(shipment.priority)}`}>
                                                                    {shipment.priority_text}
                                                                </span>
                                                            </td>
                                                            <td>
                                                                <span className={`badge ${getStatusBadgeClass(shipment.status)}`}>
                                                                    {shipment.status_text}
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
                                                                                onClick={() => openAssignModal(shipment)}
                                                                            >
                                                                                <i className="fas fa-truck me-2"></i>
                                                                                Araç/Sürücü Ata
                                                                            </button>
                                                                        </li>
                                                                        {shipment.status === 'planned' && (
                                                                            <li>
                                                                                <button
                                                                                    className="dropdown-item"
                                                                                    onClick={() => handleStatusUpdate(shipment, 'in_transit')}
                                                                                >
                                                                                    <i className="fas fa-play-circle me-2"></i>
                                                                                    Yola Çıktı
                                                                                </button>
                                                                            </li>
                                                                        )}
                                                                        {shipment.status === 'in_transit' && (
                                                                            <li>
                                                                                <button
                                                                                    className="dropdown-item"
                                                                                    onClick={() => handleStatusUpdate(shipment, 'delivered')}
                                                                                >
                                                                                    <i className="fas fa-check-circle me-2"></i>
                                                                                    Teslim Edildi
                                                                                </button>
                                                                            </li>
                                                                        )}
                                                                    </ul>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ))
                                                ) : (
                                                    <tr>
                                                        <td colSpan={9} className="text-center py-4">
                                                            <i className="fas fa-shipping-fast fa-3x text-muted mb-3 d-block"></i>
                                                            <p className="text-muted">Seçili tarih aralığında sevkiyat bulunmamaktadır.</p>
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>

                                    {/* Pagination */}
                                    {shipments.last_page > 1 && (
                                        <div className="d-flex justify-content-between align-items-center mt-3">
                                            <div className="text-muted">
                                                Toplam {shipments.total} kayıttan {shipments.data.length} tanesi gösteriliyor
                                            </div>
                                            <nav>
                                                <ul className="pagination mb-0">
                                                    {shipments.links.map((link, index) => (
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

            {/* Assign Modal */}
            {assignModalOpen && selectedShipment && (
                <div className="modal fade show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">Araç ve Sürücü Ata</h5>
                                <button
                                    type="button"
                                    className="btn-close"
                                    onClick={() => setAssignModalOpen(false)}
                                ></button>
                            </div>
                            <div className="modal-body">
                                <div className="mb-3">
                                    <label className="form-label">Sevkiyat No</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        value={selectedShipment.shipment_number}
                                        disabled
                                    />
                                </div>
                                <div className="mb-3">
                                    <label className="form-label">Araç <span className="text-danger">*</span></label>
                                    <select
                                        className="form-select"
                                        value={assignVehicleId}
                                        onChange={(e) => setAssignVehicleId(e.target.value)}
                                    >
                                        <option value="">Seçiniz</option>
                                        {availableVehicles.map((vehicle) => (
                                            <option key={vehicle.id} value={vehicle.id}>
                                                {vehicle.plate_number} - {vehicle.make} {vehicle.model}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="mb-3">
                                    <label className="form-label">Sürücü <span className="text-danger">*</span></label>
                                    <select
                                        className="form-select"
                                        value={assignDriverId}
                                        onChange={(e) => setAssignDriverId(e.target.value)}
                                    >
                                        <option value="">Seçiniz</option>
                                        {availableDrivers.map((driver) => (
                                            <option key={driver.id} value={driver.id}>
                                                {driver.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={() => setAssignModalOpen(false)}
                                >
                                    İptal
                                </button>
                                <button
                                    type="button"
                                    className="btn btn-primary"
                                    onClick={handleAssign}
                                    disabled={!assignVehicleId || !assignDriverId}
                                >
                                    <i className="fas fa-check me-1"></i>
                                    Ata
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </Layout>
    );
}
