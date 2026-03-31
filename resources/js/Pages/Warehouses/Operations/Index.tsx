import React, { useState, useEffect } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import Layout from '../../../Layouts';
import { initializeTableDropdowns, cleanupDropdowns } from '../../../utils/dropdownUtils';

interface Warehouse {
    id: number;
    name: string;
    code: string;
}

interface Staff {
    id: number;
    first_name: string;
    last_name: string;
    warehouse_id: number;
}

interface Operation {
    id: number;
    warehouse_id: number;
    operation_number: string;
    operation_type: string;
    priority: string;
    assigned_staff_id?: number;
    description?: string;
    notes?: string;
    estimated_duration?: number;
    estimated_completion?: string;
    status: string;
    started_at?: string;
    completed_at?: string;
    cancelled_at?: string;
    progress_percentage: number;
    items_count: number;
    items_processed: number;
    warehouse: Warehouse;
    assignedStaff?: {
        id: number;
        first_name: string;
        last_name: string;
    };
    created_at: string;
}

interface Props {
    operations: Operation[];
    warehouses: Warehouse[];
    staff: Staff[];
}

const Index: React.FC<Props> = ({ operations, warehouses, staff }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [warehouseFilter, setWarehouseFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [typeFilter, setTypeFilter] = useState('');
    const [priorityFilter, setPriorityFilter] = useState('');

    useEffect(() => {
        // Initialize improved dropdown functionality
        initializeTableDropdowns();

        return () => {
            // Cleanup on unmount
            cleanupDropdowns();
        };
    }, []);

    const filteredOperations = operations.filter(operation => {
        const matchesSearch = operation.operation_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            operation.warehouse.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            (operation.description && operation.description.toLowerCase().includes(searchTerm.toLowerCase()));
        const matchesWarehouse = !warehouseFilter || operation.warehouse_id.toString() === warehouseFilter;
        const matchesStatus = !statusFilter || operation.status === statusFilter;
        const matchesType = !typeFilter || operation.operation_type === typeFilter;
        const matchesPriority = !priorityFilter || operation.priority === priorityFilter;
        
        return matchesSearch && matchesWarehouse && matchesStatus && matchesType && matchesPriority;
    });

    const getOperationTypeText = (type: string) => {
        const types: { [key: string]: string } = {
            'receiving': 'Mal Kabul',
            'picking': 'Toplama',
            'packing': 'Paketleme',
            'shipping': 'Sevkiyat',
            'counting': 'Sayım',
            'relocation': 'Yer Değiştirme',
            'maintenance': 'Bakım'
        };
        return types[type] || type;
    };

    const getPriorityBadge = (priority: string) => {
        const priorities: { [key: string]: { text: string; class: string } } = {
            'low': { text: 'Düşük', class: 'bg-success-subtle text-success' },
            'medium': { text: 'Orta', class: 'bg-info-subtle text-info' },
            'high': { text: 'Yüksek', class: 'bg-warning-subtle text-warning' },
            'urgent': { text: 'Acil', class: 'bg-danger-subtle text-danger' }
        };
        const priorityInfo = priorities[priority] || { text: priority, class: 'bg-secondary-subtle text-secondary' };
        return <span className={`badge ${priorityInfo.class}`}>{priorityInfo.text}</span>;
    };

    const getStatusBadge = (status: string) => {
        const statuses: { [key: string]: { text: string; class: string } } = {
            'pending': { text: 'Beklemede', class: 'bg-warning-subtle text-warning' },
            'in_progress': { text: 'Devam Ediyor', class: 'bg-info-subtle text-info' },
            'completed': { text: 'Tamamlandı', class: 'bg-success-subtle text-success' },
            'cancelled': { text: 'İptal Edildi', class: 'bg-danger-subtle text-danger' },
            'on_hold': { text: 'Bekletildi', class: 'bg-secondary-subtle text-secondary' }
        };
        const statusInfo = statuses[status] || { text: status, class: 'bg-secondary-subtle text-secondary' };
        return <span className={`badge ${statusInfo.class}`}>{statusInfo.text}</span>;
    };

    const getProgressColor = (percentage: number) => {
        if (percentage >= 80) return 'bg-success';
        if (percentage >= 50) return 'bg-warning';
        return 'bg-danger';
    };

    const handleStatusChange = (operation: Operation, action: string) => {
        const confirmMessage = {
            'start': 'Operasyonu başlatmak istediğinizden emin misiniz?',
            'complete': 'Operasyonu tamamlamak istediğinizden emin misiniz?',
            'cancel': 'Operasyonu iptal etmek istediğinizden emin misiniz?'
        };

        if (confirm(confirmMessage[action as keyof typeof confirmMessage])) {
            router.patch(`/warehouses/operations/${operation.id}/${action}`);
        }
    };

    const handleDelete = (operation: Operation) => {
        if (confirm(`${operation.operation_number} operasyonunu silmek istediğinizden emin misiniz?`)) {
            router.delete(`/warehouses/operations/${operation.id}`);
        }
    };

    return (
        <Layout>
            <Head title="Depo Operasyonları" />
            
            <div className="page-content">
                <div className="container-fluid">
                    {/* Page Title */}
                    <div className="row">
                        <div className="col-12">
                            <div className="page-title-box d-sm-flex align-items-center justify-content-between">
                                <h4 className="mb-sm-0">Depo Operasyonları</h4>
                                <div className="page-title-right">
                                    <ol className="breadcrumb m-0">
                                        <li className="breadcrumb-item"><Link href="/warehouses">Depo Yönetimi</Link></li>
                                        <li className="breadcrumb-item active">Operasyonlar</li>
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
                                            <p className="text-uppercase fw-medium text-muted text-truncate mb-0">Toplam Operasyon</p>
                                        </div>
                                        <div className="avatar-sm flex-shrink-0">
                                            <span className="avatar-title bg-primary-subtle rounded fs-3">
                                                <i className="bx bx-task text-primary"></i>
                                            </span>
                                        </div>
                                    </div>
                                    <div className="d-flex align-items-end justify-content-between mt-4">
                                        <div>
                                            <h4 className="fs-22 fw-semibold ff-secondary mb-4">
                                                <span className="counter-value">{operations.length}</span>
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
                                            <p className="text-uppercase fw-medium text-muted text-truncate mb-0">Beklemede</p>
                                        </div>
                                        <div className="avatar-sm flex-shrink-0">
                                            <span className="avatar-title bg-warning-subtle rounded fs-3">
                                                <i className="bx bx-time text-warning"></i>
                                            </span>
                                        </div>
                                    </div>
                                    <div className="d-flex align-items-end justify-content-between mt-4">
                                        <div>
                                            <h4 className="fs-22 fw-semibold ff-secondary mb-4">
                                                <span className="counter-value">{operations.filter(o => o.status === 'pending').length}</span>
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
                                            <p className="text-uppercase fw-medium text-muted text-truncate mb-0">Devam Ediyor</p>
                                        </div>
                                        <div className="avatar-sm flex-shrink-0">
                                            <span className="avatar-title bg-info-subtle rounded fs-3">
                                                <i className="bx bx-loader-alt text-info"></i>
                                            </span>
                                        </div>
                                    </div>
                                    <div className="d-flex align-items-end justify-content-between mt-4">
                                        <div>
                                            <h4 className="fs-22 fw-semibold ff-secondary mb-4">
                                                <span className="counter-value">{operations.filter(o => o.status === 'in_progress').length}</span>
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
                                            <p className="text-uppercase fw-medium text-muted text-truncate mb-0">Tamamlandı</p>
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
                                                <span className="counter-value">{operations.filter(o => o.status === 'completed').length}</span>
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
                                        <h5 className="card-title mb-0 flex-grow-1">Operasyon Listesi</h5>
                                        <div className="flex-shrink-0">
                                            <Link 
                                                href="/warehouses/operations/create" 
                                                className="btn btn-primary add-btn"
                                            >
                                                <i className="ri-add-line align-bottom me-1"></i> Yeni Operasyon
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
                                                    placeholder="Operasyon ara..."
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
                                                <option value="pending">Beklemede</option>
                                                <option value="in_progress">Devam Ediyor</option>
                                                <option value="completed">Tamamlandı</option>
                                                <option value="cancelled">İptal Edildi</option>
                                                <option value="on_hold">Bekletildi</option>
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
                                                <option value="picking">Toplama</option>
                                                <option value="packing">Paketleme</option>
                                                <option value="shipping">Sevkiyat</option>
                                                <option value="counting">Sayım</option>
                                                <option value="relocation">Yer Değiştirme</option>
                                            </select>
                                        </div>
                                        <div className="col-md-2">
                                            <select
                                                className="form-select"
                                                value={priorityFilter}
                                                onChange={(e) => setPriorityFilter(e.target.value)}
                                            >
                                                <option value="">Tüm Öncelikler</option>
                                                <option value="low">Düşük</option>
                                                <option value="medium">Orta</option>
                                                <option value="high">Yüksek</option>
                                                <option value="urgent">Acil</option>
                                            </select>
                                        </div>
                                        <div className="col-md-2">
                                            <button 
                                                className="btn btn-secondary w-100"
                                                onClick={() => {
                                                    setSearchTerm('');
                                                    setWarehouseFilter('');
                                                    setStatusFilter('');
                                                    setTypeFilter('');
                                                    setPriorityFilter('');
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

                    {/* Operations Table */}
                    <div className="row">
                        <div className="col-lg-12">
                            <div className="card">
                                <div className="card-body">
                                    <div className="table-responsive table-card">
                                        <table className="table table-nowrap table-striped-columns mb-0">
                                            <thead className="table-light">
                                                <tr>
                                                    <th scope="col">Operasyon No</th>
                                                    <th scope="col">Tip</th>
                                                    <th scope="col">Depo</th>
                                                    <th scope="col">Öncelik</th>
                                                    <th scope="col">Atanan Personel</th>
                                                    <th scope="col">İlerleme</th>
                                                    <th scope="col">Durum</th>
                                                    <th scope="col">Tarih</th>
                                                    <th scope="col">İşlemler</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {filteredOperations.length > 0 ? (
                                                    filteredOperations.map((operation) => (
                                                        <tr key={operation.id}>
                                                            <td>
                                                                <div className="d-flex align-items-center">
                                                                    <div className="avatar-sm me-3">
                                                                        <div className="avatar-title bg-primary-subtle text-primary rounded">
                                                                            <i className="bx bx-task"></i>
                                                                        </div>
                                                                    </div>
                                                                    <div className="flex-grow-1">
                                                                        <Link 
                                                                            href={`/warehouses/operations/${operation.id}`} 
                                                                            className="text-body fw-medium"
                                                                        >
                                                                            {operation.operation_number}
                                                                        </Link>
                                                                        {operation.description && (
                                                                            <p className="text-muted mb-0 text-truncate" style={{ maxWidth: '200px' }}>
                                                                                {operation.description}
                                                                            </p>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td>
                                                                <span className="badge bg-light text-body">
                                                                    {getOperationTypeText(operation.operation_type)}
                                                                </span>
                                                            </td>
                                                            <td>
                                                                <span className="fw-medium">{operation.warehouse.name}</span>
                                                                <br />
                                                                <small className="text-muted">{operation.warehouse.code}</small>
                                                            </td>
                                                            <td>
                                                                {getPriorityBadge(operation.priority)}
                                                            </td>
                                                            <td>
                                                                {operation.assignedStaff ? (
                                                                    <span className="fw-medium">
                                                                        {operation.assignedStaff.first_name} {operation.assignedStaff.last_name}
                                                                    </span>
                                                                ) : (
                                                                    <span className="text-muted">Atanmamış</span>
                                                                )}
                                                            </td>
                                                            <td>
                                                                <div className="d-flex align-items-center">
                                                                    <div className="flex-grow-1">
                                                                        <div className="progress progress-sm">
                                                                            <div 
                                                                                className={`progress-bar ${getProgressColor(operation.progress_percentage)}`}
                                                                                style={{ width: `${operation.progress_percentage}%` }}
                                                                            ></div>
                                                                        </div>
                                                                        <small className="text-muted">
                                                                            {operation.items_processed}/{operation.items_count} ({operation.progress_percentage}%)
                                                                        </small>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td>
                                                                {getStatusBadge(operation.status)}
                                                            </td>
                                                            <td>
                                                                <span className="fw-medium">
                                                                    {new Date(operation.created_at).toLocaleDateString('tr-TR')}
                                                                </span>
                                                                {operation.estimated_completion && (
                                                                    <React.Fragment>
                                                                        <br />
                                                                        <small className="text-muted">
                                                                            Tahmini: {new Date(operation.estimated_completion).toLocaleDateString('tr-TR')}
                                                                        </small>
                                                                    </React.Fragment>
                                                                )}
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
                                                                                href={`/warehouses/operations/${operation.id}`}
                                                                            >
                                                                                <i className="ri-eye-fill align-bottom me-2 text-muted"></i> Görüntüle
                                                                            </Link>
                                                                        </li>
                                                                        {operation.status === 'pending' && (
                                                                            <li>
                                                                                <button 
                                                                                    className="dropdown-item" 
                                                                                    onClick={() => handleStatusChange(operation, 'start')}
                                                                                >
                                                                                    <i className="ri-play-fill align-bottom me-2 text-success"></i> Başlat
                                                                                </button>
                                                                            </li>
                                                                        )}
                                                                        {operation.status === 'in_progress' && (
                                                                            <li>
                                                                                <button 
                                                                                    className="dropdown-item" 
                                                                                    onClick={() => handleStatusChange(operation, 'complete')}
                                                                                >
                                                                                    <i className="ri-check-fill align-bottom me-2 text-success"></i> Tamamla
                                                                                </button>
                                                                            </li>
                                                                        )}
                                                                        {(operation.status === 'pending' || operation.status === 'in_progress') && (
                                                                            <li>
                                                                                <button 
                                                                                    className="dropdown-item" 
                                                                                    onClick={() => handleStatusChange(operation, 'cancel')}
                                                                                >
                                                                                    <i className="ri-close-fill align-bottom me-2 text-danger"></i> İptal Et
                                                                                </button>
                                                                            </li>
                                                                        )}
                                                                        <li>
                                                                            <Link 
                                                                                className="dropdown-item" 
                                                                                href={`/warehouses/operations/${operation.id}/edit`}
                                                                            >
                                                                                <i className="ri-pencil-fill align-bottom me-2 text-muted"></i> Düzenle
                                                                            </Link>
                                                                        </li>
                                                                        <li className="dropdown-divider"></li>
                                                                        <li>
                                                                            <button 
                                                                                className="dropdown-item text-danger" 
                                                                                onClick={() => handleDelete(operation)}
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