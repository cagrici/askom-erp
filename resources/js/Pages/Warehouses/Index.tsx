import React, { useState, useEffect } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import Layout from '../../Layouts';
import { initializeTableDropdowns, cleanupDropdowns } from '../../utils/dropdownUtils';

interface Warehouse {
    id: number;
    name: string;
    code: string;
    warehouse_type: string;
    address: string;
    city: string;
    country: string;
    phone?: string;
    email?: string;
    max_capacity: number;
    used_capacity: number;
    capacity_utilization: number;
    efficiency_percentage: number;
    status: string;
    zones_count: number;
    locations_count: number;
    staff_count: number;
    operations_count: number;
    created_at: string;
}

interface Props {
    warehouses: Warehouse[];
}

const Index: React.FC<Props> = ({ warehouses }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [typeFilter, setTypeFilter] = useState('');

    useEffect(() => {
        // Initialize improved dropdown functionality
        initializeTableDropdowns();

        return () => {
            // Cleanup on unmount
            cleanupDropdowns();
        };
    }, []);

    const filteredWarehouses = warehouses.filter(warehouse => {
        const matchesSearch = (warehouse.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                            (warehouse.code || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                            (warehouse.city || '').toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = !statusFilter || warehouse.status === statusFilter;
        const matchesType = !typeFilter || warehouse.warehouse_type === typeFilter;
        
        return matchesSearch && matchesStatus && matchesType;
    });

    const getWarehouseTypeText = (type: string) => {
        const types: { [key: string]: string } = {
            'main': 'Ana Depo',
            'regional': 'Bölge Deposu',
            'distribution': 'Dağıtım Merkezi',
            'retail': 'Perakende Deposu',
            'production': 'Üretim Deposu',
            'cross_dock': 'Cross-Dock',
            'cold_storage': 'Soğuk Depo',
            'hazardous': 'Tehlikeli Madde Deposu'
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

    const getCapacityColor = (percentage: number) => {
        if (percentage >= 90) return 'bg-danger';
        if (percentage >= 70) return 'bg-warning';
        return 'bg-success';
    };

    const getEfficiencyColor = (percentage: number) => {
        if (percentage >= 90) return 'text-success';
        if (percentage >= 70) return 'text-warning';
        return 'text-danger';
    };

    const handleDelete = (warehouse: Warehouse) => {
        if (confirm(`${warehouse.name} deposunu silmek istediğinizden emin misiniz?`)) {
            router.delete(`/warehouses/${warehouse.id}`);
        }
    };

    return (
        <Layout>
            <Head title="Depo Yönetimi" />
            
            <div className="page-content">
                <div className="container-fluid">
                    {/* Page Title */}
                    <div className="row">
                        <div className="col-12">
                            <div className="page-title-box d-sm-flex align-items-center justify-content-between">
                                <h4 className="mb-sm-0">Depo Yönetimi</h4>
                                <div className="page-title-right">
                                    <ol className="breadcrumb m-0">
                                        <li className="breadcrumb-item"><Link href="/warehouses/dashboard">Depo Dashboard</Link></li>
                                        <li className="breadcrumb-item active">Depolar</li>
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
                                            <p className="text-uppercase fw-medium text-muted text-truncate mb-0">Toplam Depo</p>
                                        </div>
                                        <div className="avatar-sm flex-shrink-0">
                                            <span className="avatar-title bg-primary-subtle rounded fs-3">
                                                <i className="bx bx-building text-primary"></i>
                                            </span>
                                        </div>
                                    </div>
                                    <div className="d-flex align-items-end justify-content-between mt-4">
                                        <div>
                                            <h4 className="fs-22 fw-semibold ff-secondary mb-4">
                                                <span className="counter-value">{warehouses.length}</span>
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
                                            <p className="text-uppercase fw-medium text-muted text-truncate mb-0">Aktif Depo</p>
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
                                                <span className="counter-value">{warehouses.filter(w => w.status === 'active').length}</span>
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
                                                <i className="bx bx-map text-info"></i>
                                            </span>
                                        </div>
                                    </div>
                                    <div className="d-flex align-items-end justify-content-between mt-4">
                                        <div>
                                            <h4 className="fs-22 fw-semibold ff-secondary mb-4">
                                                <span className="counter-value">{warehouses.reduce((sum, w) => sum + (w.locations_count || 0), 0)}</span>
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
                                            <p className="text-uppercase fw-medium text-muted text-truncate mb-0">Toplam Personel</p>
                                        </div>
                                        <div className="avatar-sm flex-shrink-0">
                                            <span className="avatar-title bg-warning-subtle rounded fs-3">
                                                <i className="bx bx-user text-warning"></i>
                                            </span>
                                        </div>
                                    </div>
                                    <div className="d-flex align-items-end justify-content-between mt-4">
                                        <div>
                                            <h4 className="fs-22 fw-semibold ff-secondary mb-4">
                                                <span className="counter-value">{warehouses.reduce((sum, w) => sum + (w.staff_count || 0), 0)}</span>
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
                                        <h5 className="card-title mb-0 flex-grow-1">Depo Listesi</h5>
                                        <div className="flex-shrink-0">
                                            <Link 
                                                href="/warehouses/create" 
                                                className="btn btn-primary add-btn"
                                            >
                                                <i className="ri-add-line align-bottom me-1"></i> Yeni Depo
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                                <div className="card-body">
                                    <div className="row g-3 mb-3">
                                        <div className="col-md-4">
                                            <div className="search-box">
                                                <input
                                                    type="text"
                                                    className="form-control search"
                                                    placeholder="Depo ara..."
                                                    value={searchTerm}
                                                    onChange={(e) => setSearchTerm(e.target.value)}
                                                />
                                                <i className="ri-search-line search-icon"></i>
                                            </div>
                                        </div>
                                        <div className="col-md-3">
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
                                        <div className="col-md-3">
                                            <select
                                                className="form-select"
                                                value={typeFilter}
                                                onChange={(e) => setTypeFilter(e.target.value)}
                                            >
                                                <option value="">Tüm Tipler</option>
                                                <option value="main">Ana Depo</option>
                                                <option value="regional">Bölge Deposu</option>
                                                <option value="distribution">Dağıtım Merkezi</option>
                                                <option value="retail">Perakende Deposu</option>
                                                <option value="production">Üretim Deposu</option>
                                            </select>
                                        </div>
                                        <div className="col-md-2">
                                            <button 
                                                className="btn btn-secondary w-100"
                                                onClick={() => {
                                                    setSearchTerm('');
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

                    {/* Warehouses Table */}
                    <div className="row">
                        <div className="col-lg-12">
                            <div className="card">
                                <div className="card-body">
                                    <div className="table-responsive table-card">
                                        <table className="table table-nowrap table-striped-columns mb-0">
                                            <thead className="table-light">
                                                <tr>
                                                    <th scope="col">Depo</th>
                                                    <th scope="col">Tip</th>
                                                    <th scope="col">Lokasyon</th>
                                                    <th scope="col">Kapasite</th>
                                                    <th scope="col">Verimlilik</th>
                                                    <th scope="col">Bölge/Lokasyon</th>
                                                    <th scope="col">Personel</th>
                                                    <th scope="col">Durum</th>
                                                    <th scope="col">İşlemler</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {filteredWarehouses.length > 0 ? (
                                                    filteredWarehouses.map((warehouse) => (
                                                        <tr key={warehouse.id}>
                                                            <td>
                                                                <div className="d-flex align-items-center">
                                                                    <div className="avatar-sm me-3">
                                                                        <div className="avatar-title bg-primary-subtle text-primary rounded">
                                                                            <i className="bx bx-building"></i>
                                                                        </div>
                                                                    </div>
                                                                    <div className="flex-grow-1">
                                                                        <Link 
                                                                            href={`/warehouses/${warehouse.id}`} 
                                                                            className="text-body fw-medium"
                                                                        >
                                                                            {warehouse.name}
                                                                        </Link>
                                                                        <p className="text-muted mb-0">{warehouse.code}</p>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td>
                                                                <span className="badge bg-light text-body">
                                                                    {getWarehouseTypeText(warehouse.warehouse_type)}
                                                                </span>
                                                            </td>
                                                            <td>
                                                                <span className="fw-medium">{warehouse.city || '-'}</span>
                                                                <br />
                                                                <small className="text-muted">{warehouse.country || '-'}</small>
                                                            </td>
                                                            <td>
                                                                <div className="d-flex align-items-center">
                                                                    <div className="flex-grow-1">
                                                                        <div className="progress progress-sm">
                                                                            <div
                                                                                className={`progress-bar ${getCapacityColor(warehouse.capacity_utilization || 0)}`}
                                                                                style={{ width: `${warehouse.capacity_utilization || 0}%` }}
                                                                            ></div>
                                                                        </div>
                                                                        <small className="text-muted">
                                                                            {(warehouse.used_capacity || 0).toLocaleString()} / {(warehouse.max_capacity || 0).toLocaleString()}
                                                                            ({(warehouse.capacity_utilization || 0).toFixed(1)}%)
                                                                        </small>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td>
                                                                <span className={`fw-medium ${getEfficiencyColor(warehouse.efficiency_percentage || 0)}`}>
                                                                    {(warehouse.efficiency_percentage || 0).toFixed(1)}%
                                                                </span>
                                                            </td>
                                                            <td>
                                                                <span className="fw-medium">{warehouse.zones_count || 0} bölge</span>
                                                                <br />
                                                                <small className="text-muted">{warehouse.locations_count || 0} lokasyon</small>
                                                            </td>
                                                            <td>
                                                                <span className="fw-medium">{warehouse.staff_count || 0}</span>
                                                                <br />
                                                                <small className="text-muted">{warehouse.operations_count || 0} operasyon</small>
                                                            </td>
                                                            <td>
                                                                {getStatusBadge(warehouse.status)}
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
                                                                                href={`/warehouses/${warehouse.id}`}
                                                                            >
                                                                                <i className="ri-eye-fill align-bottom me-2 text-muted"></i> Görüntüle
                                                                            </Link>
                                                                        </li>
                                                                        <li>
                                                                            <Link 
                                                                                className="dropdown-item" 
                                                                                href={`/warehouses/${warehouse.id}/edit`}
                                                                            >
                                                                                <i className="ri-pencil-fill align-bottom me-2 text-muted"></i> Düzenle
                                                                            </Link>
                                                                        </li>
                                                                        <li className="dropdown-divider"></li>
                                                                        <li>
                                                                            <button 
                                                                                className="dropdown-item text-danger" 
                                                                                onClick={() => handleDelete(warehouse)}
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