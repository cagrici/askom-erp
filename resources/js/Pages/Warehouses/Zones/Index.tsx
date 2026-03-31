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
    zone_type: string;
    description?: string;
    max_locations?: number;
    temperature_controlled: boolean;
    min_temperature?: number;
    max_temperature?: number;
    status: string;
    locations_count: number;
    location_utilization: number;
    warehouse: Warehouse;
    created_at: string;
}

interface Props {
    zones: Zone[];
    warehouses: Warehouse[];
}

const Index: React.FC<Props> = ({ zones, warehouses }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [warehouseFilter, setWarehouseFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [typeFilter, setTypeFilter] = useState('');

    // Initialize Bootstrap dropdowns
    useEffect(() => {
        // Initialize improved dropdown functionality
        initializeTableDropdowns();

        return () => {
            // Cleanup on unmount
            cleanupDropdowns();
        };
    }, []);

    const filteredZones = zones.filter(zone => {
        const matchesSearch = zone.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            zone.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            zone.warehouse.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesWarehouse = !warehouseFilter || zone.warehouse_id.toString() === warehouseFilter;
        const matchesStatus = !statusFilter || zone.status === statusFilter;
        const matchesType = !typeFilter || zone.zone_type === typeFilter;
        
        return matchesSearch && matchesWarehouse && matchesStatus && matchesType;
    });

    const getZoneTypeText = (type: string) => {
        const types: { [key: string]: string } = {
            'receiving': 'Mal Kabul',
            'storage': 'Depolama',
            'picking': 'Toplama',
            'packing': 'Paketleme',
            'shipping': 'Sevkiyat',
            'quarantine': 'Karantina',
            'returns': 'İadeler'
        };
        return types[type] || type;
    };

    const getStatusBadge = (status: string) => {
        const statuses: { [key: string]: { text: string; class: string } } = {
            'active': { text: 'Aktif', class: 'bg-success-subtle text-success' },
            'inactive': { text: 'Pasif', class: 'bg-secondary-subtle text-secondary' },
            'maintenance': { text: 'Bakımda', class: 'bg-warning-subtle text-warning' }
        };
        const statusInfo = statuses[status] || { text: status, class: 'bg-secondary-subtle text-secondary' };
        return <span className={`badge ${statusInfo.class}`}>{statusInfo.text}</span>;
    };

    const getUtilizationColor = (percentage: number) => {
        if (percentage >= 90) return 'bg-danger';
        if (percentage >= 70) return 'bg-warning';
        return 'bg-success';
    };

    const handleDelete = (zone: Zone) => {
        if (confirm(`${zone.name} bölgesini silmek istediğinizden emin misiniz?`)) {
            router.delete(`/warehouses/zones/${zone.id}`);
        }
    };

    return (
        <Layout>
            <Head title="Depo Bölgeleri" />
            
            <div className="page-content">
                <div className="container-fluid">
                    {/* Page Title */}
                    <div className="row">
                        <div className="col-12">
                            <div className="page-title-box d-sm-flex align-items-center justify-content-between">
                                <h4 className="mb-sm-0">Depo Bölgeleri</h4>
                                <div className="page-title-right">
                                    <ol className="breadcrumb m-0">
                                        <li className="breadcrumb-item"><Link href="/warehouses">Depo Yönetimi</Link></li>
                                        <li className="breadcrumb-item active">Bölgeler</li>
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
                                            <p className="text-uppercase fw-medium text-muted text-truncate mb-0">Toplam Bölge</p>
                                        </div>
                                        <div className="avatar-sm flex-shrink-0">
                                            <span className="avatar-title bg-primary-subtle rounded fs-3">
                                                <i className="bx bx-map text-primary"></i>
                                            </span>
                                        </div>
                                    </div>
                                    <div className="d-flex align-items-end justify-content-between mt-4">
                                        <div>
                                            <h4 className="fs-22 fw-semibold ff-secondary mb-4">
                                                <span className="counter-value">{zones.length}</span>
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
                                            <p className="text-uppercase fw-medium text-muted text-truncate mb-0">Aktif Bölge</p>
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
                                                <span className="counter-value">{zones.filter(z => z.status === 'active').length}</span>
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
                                            <p className="text-uppercase fw-medium text-muted text-truncate mb-0">Toplam Lokasyon</p>
                                        </div>
                                        <div className="avatar-sm flex-shrink-0">
                                            <span className="avatar-title bg-info-subtle rounded fs-3">
                                                <i className="bx bx-current-location text-info"></i>
                                            </span>
                                        </div>
                                    </div>
                                    <div className="d-flex align-items-end justify-content-between mt-4">
                                        <div>
                                            <h4 className="fs-22 fw-semibold ff-secondary mb-4">
                                                <span className="counter-value">{zones.reduce((sum, z) => sum + z.locations_count, 0)}</span>
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
                                            <p className="text-uppercase fw-medium text-muted text-truncate mb-0">Sıcaklık Kontrollü</p>
                                        </div>
                                        <div className="avatar-sm flex-shrink-0">
                                            <span className="avatar-title bg-warning-subtle rounded fs-3">
                                                <i className="bx bx-thermometer text-warning"></i>
                                            </span>
                                        </div>
                                    </div>
                                    <div className="d-flex align-items-end justify-content-between mt-4">
                                        <div>
                                            <h4 className="fs-22 fw-semibold ff-secondary mb-4">
                                                <span className="counter-value">{zones.filter(z => z.temperature_controlled).length}</span>
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
                                        <h5 className="card-title mb-0 flex-grow-1">Bölge Listesi</h5>
                                        <div className="flex-shrink-0">
                                            <Link 
                                                href="/warehouses/zones/create" 
                                                className="btn btn-primary add-btn"
                                            >
                                                <i className="ri-add-line align-bottom me-1"></i> Yeni Bölge
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                                <div className="card-body">
                                    <div className="row g-3 mb-3">
                                        <div className="col-md-3">
                                            <div className="search-box">
                                                <input
                                                    type="text"
                                                    className="form-control search"
                                                    placeholder="Bölge ara..."
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
                                                value={statusFilter}
                                                onChange={(e) => setStatusFilter(e.target.value)}
                                            >
                                                <option value="">Tüm Durumlar</option>
                                                <option value="active">Aktif</option>
                                                <option value="inactive">Pasif</option>
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
                                                <option value="receiving">Mal Kabul</option>
                                                <option value="storage">Depolama</option>
                                                <option value="picking">Toplama</option>
                                                <option value="packing">Paketleme</option>
                                                <option value="shipping">Sevkiyat</option>
                                            </select>
                                        </div>
                                        <div className="col-md-3">
                                            <button 
                                                className="btn btn-secondary w-100"
                                                onClick={() => {
                                                    setSearchTerm('');
                                                    setWarehouseFilter('');
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

                    {/* Zones Table */}
                    <div className="row">
                        <div className="col-lg-12">
                            <div className="card">
                                <div className="card-body">
                                    <div className="table-responsive table-card">
                                        <table className="table table-nowrap table-striped-columns mb-0">
                                            <thead className="table-light">
                                                <tr>
                                                    <th scope="col">Bölge</th>
                                                    <th scope="col">Depo</th>
                                                    <th scope="col">Tip</th>
                                                    <th scope="col">Lokasyon Kullanımı</th>
                                                    <th scope="col">Sıcaklık</th>
                                                    <th scope="col">Durum</th>
                                                    <th scope="col">İşlemler</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {filteredZones.length > 0 ? (
                                                    filteredZones.map((zone) => (
                                                        <tr key={zone.id}>
                                                            <td>
                                                                <div className="d-flex align-items-center">
                                                                    <div className="avatar-sm me-3">
                                                                        <div className="avatar-title bg-primary-subtle text-primary rounded">
                                                                            <i className="bx bx-map"></i>
                                                                        </div>
                                                                    </div>
                                                                    <div className="flex-grow-1">
                                                                        <Link 
                                                                            href={`/warehouses/zones/${zone.id}`} 
                                                                            className="text-body fw-medium"
                                                                        >
                                                                            {zone.name}
                                                                        </Link>
                                                                        <p className="text-muted mb-0">{zone.code}</p>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td>
                                                                <span className="fw-medium">{zone.warehouse.name}</span>
                                                                <br />
                                                                <small className="text-muted">{zone.warehouse.code}</small>
                                                            </td>
                                                            <td>
                                                                <span className="badge bg-light text-body">
                                                                    {getZoneTypeText(zone.zone_type)}
                                                                </span>
                                                            </td>
                                                            <td>
                                                                <div className="d-flex align-items-center">
                                                                    <div className="flex-grow-1">
                                                                        <div className="progress progress-sm">
                                                                            <div 
                                                                                className={`progress-bar ${getUtilizationColor(zone.location_utilization)}`}
                                                                                style={{ width: `${zone.location_utilization}%` }}
                                                                            ></div>
                                                                        </div>
                                                                        <small className="text-muted">
                                                                            {zone.locations_count} lokasyon ({zone.location_utilization.toFixed(1)}%)
                                                                        </small>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td>
                                                                {zone.temperature_controlled ? (
                                                                    <React.Fragment>
                                                                        <span className="badge bg-info-subtle text-info">
                                                                            <i className="bx bx-thermometer me-1"></i>
                                                                            Kontrollü
                                                                        </span>
                                                                        <br />
                                                                        <small className="text-muted">
                                                                            {zone.min_temperature}°C - {zone.max_temperature}°C
                                                                        </small>
                                                                    </React.Fragment>
                                                                ) : (
                                                                    <span className="text-muted">Normal</span>
                                                                )}
                                                            </td>
                                                            <td>
                                                                {getStatusBadge(zone.status)}
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
                                                                                href={`/warehouses/zones/${zone.id}`}
                                                                            >
                                                                                <i className="ri-eye-fill align-bottom me-2 text-muted"></i> Görüntüle
                                                                            </Link>
                                                                        </li>
                                                                        <li>
                                                                            <Link 
                                                                                className="dropdown-item" 
                                                                                href={`/warehouses/zones/${zone.id}/edit`}
                                                                            >
                                                                                <i className="ri-pencil-fill align-bottom me-2 text-muted"></i> Düzenle
                                                                            </Link>
                                                                        </li>
                                                                        <li className="dropdown-divider"></li>
                                                                        <li>
                                                                            <button 
                                                                                className="dropdown-item text-danger" 
                                                                                onClick={() => handleDelete(zone)}
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
                                                        <td colSpan={7} className="text-center py-4">
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