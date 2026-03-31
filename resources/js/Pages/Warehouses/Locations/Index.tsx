import React, { useState, useEffect } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import Layout from '../../../Layouts';
import { initializeTableDropdowns, cleanupDropdowns } from '../../../utils/dropdownUtils';

interface Warehouse {
    id: number;
    name: string;
    code: string;
}

interface Zone {
    id: number;
    warehouse_id: number;
    name: string;
    code: string;
}

interface Location {
    id: number;
    warehouse_id: number;
    zone_id: number;
    location_code: string;
    aisle: string;
    rack: string;
    shelf: string;
    position?: string;
    location_type: string;
    max_weight?: number;
    max_volume?: number;
    length?: number;
    width?: number;
    height?: number;
    status: string;
    is_pickable: boolean;
    is_bulk_location: boolean;
    temperature_controlled: boolean;
    utilization_percentage: number;
    stock_count: number;
    warehouse: Warehouse;
    zone: Zone;
    created_at: string;
}

interface Props {
    locations: Location[];
    warehouses: Warehouse[];
    zones: Zone[];
}

const Index: React.FC<Props> = ({ locations, warehouses, zones }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [warehouseFilter, setWarehouseFilter] = useState('');
    const [zoneFilter, setZoneFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [typeFilter, setTypeFilter] = useState('');

    useEffect(() => {
        // Initialize improved dropdown functionality
        initializeTableDropdowns();

        // Close dropdowns when clicking outside
        document.addEventListener('click', function(e) {
            if (!e.target.closest('.dropdown')) {
                document.querySelectorAll('.dropdown-menu.show').forEach(menu => {
                    menu.classList.remove('show');
                });
            }
        });

        return () => {
            // Cleanup on unmount
            cleanupDropdowns();
        };
    }, []);

    const filteredLocations = locations.filter(location => {
        const matchesSearch = (location.location_code?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                            (location.aisle?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                            (location.warehouse?.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                            (location.zone?.name?.toLowerCase() || '').includes(searchTerm.toLowerCase());
        const matchesWarehouse = !warehouseFilter || location.warehouse_id?.toString() === warehouseFilter;
        const matchesZone = !zoneFilter || location.zone_id?.toString() === zoneFilter;
        const matchesStatus = !statusFilter || location.status === statusFilter;
        const matchesType = !typeFilter || location.location_type === typeFilter;
        
        return matchesSearch && matchesWarehouse && matchesZone && matchesStatus && matchesType;
    });

    const filteredZones = zones.filter(zone => 
        !warehouseFilter || zone.warehouse_id.toString() === warehouseFilter
    );

    const getLocationTypeText = (type: string) => {
        const types: { [key: string]: string } = {
            'floor': 'Zemin',
            'rack': 'Raf',
            'shelf': 'Şelf',
            'bin': 'Kutu',
            'pallet': 'Palet',
            'bulk': 'Dökme',
            'special': 'Özel'
        };
        return types[type] || type;
    };

    const getStatusBadge = (status: string) => {
        const statuses: { [key: string]: { text: string; class: string } } = {
            'available': { text: 'Müsait', class: 'bg-success-subtle text-success' },
            'occupied': { text: 'Dolu', class: 'bg-danger-subtle text-danger' },
            'reserved': { text: 'Rezerve', class: 'bg-warning-subtle text-warning' },
            'blocked': { text: 'Bloklu', class: 'bg-secondary-subtle text-secondary' },
            'maintenance': { text: 'Bakımda', class: 'bg-info-subtle text-info' }
        };
        const statusInfo = statuses[status] || { text: status, class: 'bg-secondary-subtle text-secondary' };
        return <span className={`badge ${statusInfo.class}`}>{statusInfo.text}</span>;
    };

    const getUtilizationColor = (percentage: number) => {
        if (percentage >= 90) return 'bg-danger';
        if (percentage >= 70) return 'bg-warning';
        return 'bg-success';
    };

    const handleDelete = (location: Location) => {
        if (confirm(`${location.location_code} lokasyonunu silmek istediğinizden emin misiniz?`)) {
            router.delete(`/warehouses/locations/${location.id}`);
        }
    };

    return (
        <Layout>
            <Head title="Depolama Lokasyonları" />
            
            <div className="page-content">
                <div className="container-fluid">
                    {/* Page Title */}
                    <div className="row">
                        <div className="col-12">
                            <div className="page-title-box d-sm-flex align-items-center justify-content-between">
                                <h4 className="mb-sm-0">Depolama Lokasyonları</h4>
                                <div className="page-title-right">
                                    <ol className="breadcrumb m-0">
                                        <li className="breadcrumb-item"><Link href="/warehouses">Depo Yönetimi</Link></li>
                                        <li className="breadcrumb-item active">Lokasyonlar</li>
                                    </ol>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Summary Cards */}
                    <div className="row">
                        <div className="col-xl-3 col-md-6">
                            <div className="card card-animate">
                                <div className="card-body">
                                    <div className="d-flex align-items-center">
                                        <div className="flex-grow-1 overflow-hidden">
                                            <p className="text-uppercase fw-medium text-muted text-truncate mb-0">Toplam Lokasyon</p>
                                        </div>
                                        <div className="avatar-sm flex-shrink-0">
                                            <span className="avatar-title bg-primary-subtle rounded fs-3">
                                                <i className="bx bx-current-location text-primary"></i>
                                            </span>
                                        </div>
                                    </div>
                                    <div className="d-flex align-items-end justify-content-between mt-4">
                                        <div>
                                            <h4 className="fs-22 fw-semibold ff-secondary mb-4">
                                                <span className="counter-value">{locations.length}</span>
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
                                            <p className="text-uppercase fw-medium text-muted text-truncate mb-0">Müsait Lokasyon</p>
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
                                                <span className="counter-value">{locations.filter(l => l.status === 'available').length}</span>
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
                                            <p className="text-uppercase fw-medium text-muted text-truncate mb-0">Dolu Lokasyon</p>
                                        </div>
                                        <div className="avatar-sm flex-shrink-0">
                                            <span className="avatar-title bg-danger-subtle rounded fs-3">
                                                <i className="bx bx-package text-danger"></i>
                                            </span>
                                        </div>
                                    </div>
                                    <div className="d-flex align-items-end justify-content-between mt-4">
                                        <div>
                                            <h4 className="fs-22 fw-semibold ff-secondary mb-4">
                                                <span className="counter-value">{locations.filter(l => l.status === 'occupied').length}</span>
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
                                            <p className="text-uppercase fw-medium text-muted text-truncate mb-0">Toplama Uygun</p>
                                        </div>
                                        <div className="avatar-sm flex-shrink-0">
                                            <span className="avatar-title bg-info-subtle rounded fs-3">
                                                <i className="bx bx-select-multiple text-info"></i>
                                            </span>
                                        </div>
                                    </div>
                                    <div className="d-flex align-items-end justify-content-between mt-4">
                                        <div>
                                            <h4 className="fs-22 fw-semibold ff-secondary mb-4">
                                                <span className="counter-value">{locations.filter(l => l.is_pickable).length}</span>
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
                                        <h5 className="card-title mb-0 flex-grow-1">Lokasyon Listesi</h5>
                                        <div className="flex-shrink-0">
                                            <Link 
                                                href="/warehouses/locations/create" 
                                                className="btn btn-primary add-btn"
                                            >
                                                <i className="ri-add-line align-bottom me-1"></i> Yeni Lokasyon
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                                <div className="card-body">
                                    <div className="row g-3 mb-3">
                                        <div className="col-md-2">
                                            <div className="search-box">
                                                <input
                                                    type="text"
                                                    className="form-control search"
                                                    placeholder="Lokasyon ara..."
                                                    value={searchTerm}
                                                    onChange={(e) => setSearchTerm(e.target.value)}
                                                />
                                                <i className="ri-search-line search-icon"></i>
                                            </div>
                                        </div>
                                        <div className="col-md-2">
                                            <select
                                                className="form-select"
                                                value={warehouseFilter}
                                                onChange={(e) => setWarehouseFilter(e.target.value)}
                                            >
                                                <option value="">Tüm Depolar</option>
                                                {warehouses.map(warehouse => (
                                                    <option key={warehouse.id} value={warehouse.id}>
                                                        {warehouse.name}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="col-md-2">
                                            <select
                                                className="form-select"
                                                value={zoneFilter}
                                                onChange={(e) => setZoneFilter(e.target.value)}
                                            >
                                                <option value="">Tüm Bölgeler</option>
                                                {filteredZones.map(zone => (
                                                    <option key={zone.id} value={zone.id}>
                                                        {zone.name}
                                                    </option>
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
                                                <option value="available">Müsait</option>
                                                <option value="occupied">Dolu</option>
                                                <option value="reserved">Rezerve</option>
                                                <option value="blocked">Bloklu</option>
                                                <option value="maintenance">Bakımda</option>
                                            </select>
                                        </div>
                                        <div className="col-md-2">
                                            <select
                                                className="form-select"
                                                value={typeFilter}
                                                onChange={(e) => setTypeFilter(e.target.value)}
                                            >
                                                <option value="">Tüm Tipler</option>
                                                <option value="floor">Zemin</option>
                                                <option value="rack">Raf</option>
                                                <option value="shelf">Şelf</option>
                                                <option value="bin">Kutu</option>
                                                <option value="pallet">Palet</option>
                                                <option value="bulk">Dökme</option>
                                            </select>
                                        </div>
                                        <div className="col-md-2">
                                            <button 
                                                className="btn btn-secondary w-100"
                                                onClick={() => {
                                                    setSearchTerm('');
                                                    setWarehouseFilter('');
                                                    setZoneFilter('');
                                                    setStatusFilter('');
                                                    setTypeFilter('');
                                                }}
                                            >
                                                <i className="ri-refresh-line"></i> Temizle
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Locations Table */}
                    <div className="row">
                        <div className="col-lg-12">
                            <div className="card">
                                <div className="card-body">
                                    <div className="table-responsive table-card">
                                        <table className="table table-nowrap table-striped-columns mb-0">
                                            <thead className="table-light">
                                                <tr>
                                                    <th scope="col">Lokasyon Kodu</th>
                                                    <th scope="col">Depo/Bölge</th>
                                                    <th scope="col">Pozisyon</th>
                                                    <th scope="col">Tip</th>
                                                    <th scope="col">Boyutlar</th>
                                                    <th scope="col">Kullanım</th>
                                                    <th scope="col">Özellikler</th>
                                                    <th scope="col">Durum</th>
                                                    <th scope="col">İşlemler</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {filteredLocations.length > 0 ? (
                                                    filteredLocations.map((location) => (
                                                        <tr key={location.id}>
                                                            <td>
                                                                <div className="d-flex align-items-center">
                                                                    <div className="avatar-sm me-3">
                                                                        <div className="avatar-title bg-primary-subtle text-primary rounded">
                                                                            <i className="bx bx-current-location"></i>
                                                                        </div>
                                                                    </div>
                                                                    <div className="flex-grow-1">
                                                                        <Link 
                                                                            href={`/warehouses/locations/${location.id}`} 
                                                                            className="text-body fw-medium"
                                                                        >
                                                                            {location.location_code}
                                                                        </Link>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td>
                                                                <span className="fw-medium">{location.warehouse.name}</span>
                                                                <br />
                                                                <small className="text-muted">{location.zone.name}</small>
                                                            </td>
                                                            <td>
                                                                <span className="fw-medium">
                                                                    {location.aisle}-{location.rack}-{location.shelf}
                                                                    {location.position && `-${location.position}`}
                                                                </span>
                                                            </td>
                                                            <td>
                                                                <span className="badge bg-light text-body">
                                                                    {getLocationTypeText(location.location_type)}
                                                                </span>
                                                            </td>
                                                            <td>
                                                                {location.length && location.width && location.height ? (
                                                                    <React.Fragment>
                                                                        <span className="fw-medium">
                                                                            {location.length} × {location.width} × {location.height} cm
                                                                        </span>
                                                                        <br />
                                                                        <small className="text-muted">
                                                                            {location.max_volume && `${location.max_volume} m³`}
                                                                            {location.max_weight && `, ${location.max_weight} kg`}
                                                                        </small>
                                                                    </React.Fragment>
                                                                ) : (
                                                                    <span className="text-muted">-</span>
                                                                )}
                                                            </td>
                                                            <td>
                                                                <div className="d-flex align-items-center">
                                                                    <div className="flex-grow-1">
                                                                        <div className="progress progress-sm">
                                                                            <div 
                                                                                className={`progress-bar ${getUtilizationColor(Number(location.utilization_percentage || 0))}`}
                                                                                style={{ width: `${Number(location.utilization_percentage || 0)}%` }}
                                                                            ></div>
                                                                        </div>
                                                                        <small className="text-muted">
                                                                            {location.stock_count} stok ({Number(location.utilization_percentage || 0).toFixed(1)}%)
                                                                        </small>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td>
                                                                <div className="d-flex flex-wrap gap-1">
                                                                    {location.is_pickable && (
                                                                        <span className="badge bg-success-subtle text-success">
                                                                            <i className="bx bx-check me-1"></i>Toplanabilir
                                                                        </span>
                                                                    )}
                                                                    {location.is_bulk_location && (
                                                                        <span className="badge bg-info-subtle text-info">
                                                                            <i className="bx bx-package me-1"></i>Dökme
                                                                        </span>
                                                                    )}
                                                                    {location.temperature_controlled && (
                                                                        <span className="badge bg-warning-subtle text-warning">
                                                                            <i className="bx bx-thermometer me-1"></i>Sıcaklık
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </td>
                                                            <td>
                                                                {getStatusBadge(location.status)}
                                                            </td>
                                                            <td>
                                                                <div className="dropdown">
                                                                    <button 
                                                                        className="btn btn-soft-secondary btn-sm dropdown-toggle" 
                                                                        type="button" 
                                                                        data-bs-toggle="dropdown" 
                                                                        aria-expanded="false"
                                                                    >
                                                                        <i className="ri-more-fill align-middle"></i>
                                                                    </button>
                                                                    <ul className="dropdown-menu dropdown-menu-end">
                                                                        <li>
                                                                            <Link 
                                                                                className="dropdown-item" 
                                                                                href={`/warehouses/locations/${location.id}`}
                                                                            >
                                                                                <i className="ri-eye-fill align-bottom me-2 text-muted"></i> Görüntüle
                                                                            </Link>
                                                                        </li>
                                                                        <li>
                                                                            <Link 
                                                                                className="dropdown-item" 
                                                                                href={`/warehouses/locations/${location.id}/edit`}
                                                                            >
                                                                                <i className="ri-pencil-fill align-bottom me-2 text-muted"></i> Düzenle
                                                                            </Link>
                                                                        </li>
                                                                        <li className="dropdown-divider"></li>
                                                                        <li>
                                                                            <button 
                                                                                className="dropdown-item text-danger" 
                                                                                onClick={() => handleDelete(location)}
                                                                            >
                                                                                <i className="ri-delete-bin-fill align-bottom me-2"></i> Sil
                                                                            </button>
                                                                        </li>
                                                                    </ul>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ))
                                                ) : (
                                                    <tr>
                                                        <td colSpan={9} className="text-center py-4">
                                                            <div className="text-muted">Kayıt bulunamadı</div>
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default Index;