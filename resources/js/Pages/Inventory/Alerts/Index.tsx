import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import Layout from '../../../Layouts';

interface InventoryAlert {
    id: number;
    alert_type: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    title: string;
    message: string;
    status: 'active' | 'acknowledged' | 'resolved' | 'dismissed';
    triggered_at: string;
    acknowledged_at?: string;
    resolved_at?: string;
    snoozed_until?: string;
    escalation_level: number;
    metadata?: any;
    resolution_notes?: string;
    inventory_item?: {
        id: number;
        name: string;
        sku: string;
        barcode?: string;
    };
    warehouse?: {
        id: number;
        name: string;
        code: string;
    };
    assigned_to?: {
        id: number;
        name: string;
    };
    created_by?: {
        id: number;
        name: string;
    };
}

interface Warehouse {
    id: number;
    name: string;
    code: string;
}

interface Props {
    alerts: {
        data: InventoryAlert[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
        links: any[];
    };
    filters: {
        search?: string;
        alert_type?: string;
        severity?: string;
        status?: string;
        warehouse_id?: string;
        assigned?: string;
        sort_field?: string;
        sort_direction?: string;
    };
    warehouses: Warehouse[];
}

const Index: React.FC<Props> = ({ alerts, filters, warehouses }) => {
    const [searchTerm, setSearchTerm] = useState(filters.search || '');
    const [selectedType, setSelectedType] = useState(filters.alert_type || '');
    const [selectedSeverity, setSelectedSeverity] = useState(filters.severity || '');
    const [selectedStatus, setSelectedStatus] = useState(filters.status || '');
    const [selectedWarehouse, setSelectedWarehouse] = useState(filters.warehouse_id || '');
    const [selectedAssigned, setSelectedAssigned] = useState(filters.assigned || '');

    const handleSearch = () => {
        router.get('/inventory/alerts', {
            search: searchTerm,
            alert_type: selectedType,
            severity: selectedSeverity,
            status: selectedStatus,
            warehouse_id: selectedWarehouse,
            assigned: selectedAssigned,
        }, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleSort = (field: string) => {
        const direction = filters.sort_field === field && filters.sort_direction === 'asc' ? 'desc' : 'asc';
        router.get('/inventory/alerts', {
            ...filters,
            sort_field: field,
            sort_direction: direction,
        }, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const getSortIcon = (field: string) => {
        if (filters.sort_field !== field) return 'ri-expand-up-down-line';
        return filters.sort_direction === 'asc' ? 'ri-arrow-up-line' : 'ri-arrow-down-line';
    };

    const getAlertTypeText = (type: string) => {
        const types: { [key: string]: string } = {
            'low_stock': 'Düşük Stok',
            'out_of_stock': 'Stok Tükendi',
            'expiry_warning': 'SKT Uyarısı',
            'expired_items': 'Vadesi Geçmiş',
            'reorder_point': 'Yeniden Sipariş',
            'slow_moving': 'Yavaş Hareket',
            'damaged_stock': 'Hasarlı Stok',
            'count_variance': 'Sayım Farkı',
            'location_full': 'Lokasyon Dolu',
            'quality_hold': 'Kalite Tutma'
        };
        return types[type] || type;
    };

    const getSeverityBadge = (severity: string) => {
        const severities: { [key: string]: { text: string; class: string; icon: string } } = {
            'low': { text: 'Düşük', class: 'bg-info-subtle text-info', icon: 'ri-information-line' },
            'medium': { text: 'Orta', class: 'bg-warning-subtle text-warning', icon: 'ri-alert-line' },
            'high': { text: 'Yüksek', class: 'bg-danger-subtle text-danger', icon: 'ri-error-warning-line' },
            'critical': { text: 'Kritik', class: 'bg-danger text-white', icon: 'ri-alarm-warning-line' }
        };
        const severityInfo = severities[severity] || { text: severity, class: 'bg-secondary-subtle text-secondary', icon: 'ri-question-line' };
        return (
            <span className={`badge ${severityInfo.class}`}>
                <i className={`${severityInfo.icon} me-1`}></i>
                {severityInfo.text}
            </span>
        );
    };

    const getStatusBadge = (status: string) => {
        const statuses: { [key: string]: { text: string; class: string; icon: string } } = {
            'active': { text: 'Aktif', class: 'bg-danger-subtle text-danger', icon: 'ri-error-warning-line' },
            'acknowledged': { text: 'Onaylandı', class: 'bg-info-subtle text-info', icon: 'ri-check-line' },
            'resolved': { text: 'Çözüldü', class: 'bg-success-subtle text-success', icon: 'ri-check-double-line' },
            'dismissed': { text: 'Reddedildi', class: 'bg-secondary-subtle text-secondary', icon: 'ri-close-line' }
        };
        const statusInfo = statuses[status] || { text: status, class: 'bg-secondary-subtle text-secondary', icon: 'ri-question-line' };
        return (
            <span className={`badge ${statusInfo.class}`}>
                <i className={`${statusInfo.icon} me-1`}></i>
                {statusInfo.text}
            </span>
        );
    };

    const getTimeAgo = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
        
        if (diffInMinutes < 1) return 'Az önce';
        if (diffInMinutes < 60) return `${diffInMinutes} dakika önce`;
        if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} saat önce`;
        return `${Math.floor(diffInMinutes / 1440)} gün önce`;
    };

    const handleAlertAction = (alertId: number, action: string, data?: any) => {
        router.post(`/inventory/alerts/${alertId}/${action}`, data || {}, {
            preserveState: true,
            preserveScroll: true,
            onSuccess: () => {
                // Refresh the page or show success message
            }
        });
    };

    return (
        <Layout>
            <Head title="Envanter Uyarıları" />
            
            <div className="page-content">
                <div className="container-fluid">
                    {/* Page Title */}
                    <div className="row">
                        <div className="col-12">
                            <div className="page-title-box d-sm-flex align-items-center justify-content-between">
                                <h4 className="mb-sm-0">Envanter Uyarıları</h4>
                                <div className="page-title-right">
                                    <ol className="breadcrumb m-0">
                                        <li className="breadcrumb-item"><Link href="/inventory">Envanter</Link></li>
                                        <li className="breadcrumb-item active">Uyarılar</li>
                                    </ol>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Quick Stats */}
                    <div className="row">
                        <div className="col-xl-3 col-md-6">
                            <div className="card card-animate">
                                <div className="card-body">
                                    <div className="d-flex align-items-center">
                                        <div className="flex-grow-1 overflow-hidden">
                                            <p className="text-uppercase fw-medium text-muted text-truncate mb-0">Aktif Uyarılar</p>
                                        </div>
                                        <div className="avatar-sm flex-shrink-0">
                                            <span className="avatar-title bg-danger-subtle rounded fs-3">
                                                <i className="bx bx-error text-danger"></i>
                                            </span>
                                        </div>
                                    </div>
                                    <div className="d-flex align-items-end justify-content-between mt-4">
                                        <div>
                                            <h4 className="fs-22 fw-semibold ff-secondary mb-4">
                                                <span className="counter-value">
                                                    {alerts.data.filter(alert => alert.status === 'active').length}
                                                </span>
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
                                            <p className="text-uppercase fw-medium text-muted text-truncate mb-0">Kritik Uyarılar</p>
                                        </div>
                                        <div className="avatar-sm flex-shrink-0">
                                            <span className="avatar-title bg-warning-subtle rounded fs-3">
                                                <i className="bx bx-alarm-exclamation text-warning"></i>
                                            </span>
                                        </div>
                                    </div>
                                    <div className="d-flex align-items-end justify-content-between mt-4">
                                        <div>
                                            <h4 className="fs-22 fw-semibold ff-secondary mb-4">
                                                <span className="counter-value">
                                                    {alerts.data.filter(alert => alert.severity === 'critical').length}
                                                </span>
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
                                            <p className="text-uppercase fw-medium text-muted text-truncate mb-0">Çözülmüş</p>
                                        </div>
                                        <div className="avatar-sm flex-shrink-0">
                                            <span className="avatar-title bg-success-subtle rounded fs-3">
                                                <i className="bx bx-check-double text-success"></i>
                                            </span>
                                        </div>
                                    </div>
                                    <div className="d-flex align-items-end justify-content-between mt-4">
                                        <div>
                                            <h4 className="fs-22 fw-semibold ff-secondary mb-4">
                                                <span className="counter-value">
                                                    {alerts.data.filter(alert => alert.status === 'resolved').length}
                                                </span>
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
                                            <p className="text-uppercase fw-medium text-muted text-truncate mb-0">Toplam</p>
                                        </div>
                                        <div className="avatar-sm flex-shrink-0">
                                            <span className="avatar-title bg-info-subtle rounded fs-3">
                                                <i className="bx bx-bell text-info"></i>
                                            </span>
                                        </div>
                                    </div>
                                    <div className="d-flex align-items-end justify-content-between mt-4">
                                        <div>
                                            <h4 className="fs-22 fw-semibold ff-secondary mb-4">
                                                <span className="counter-value">{alerts.total}</span>
                                            </h4>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Filters */}
                    <div className="row">
                        <div className="col-lg-12">
                            <div className="card">
                                <div className="card-header">
                                    <h4 className="card-title mb-0">Filtreler</h4>
                                </div>
                                <div className="card-body">
                                    <div className="row g-3">
                                        <div className="col-xxl-3 col-sm-6">
                                            <div className="search-box">
                                                <input
                                                    type="text"
                                                    className="form-control"
                                                    placeholder="Ara (Başlık, Mesaj...)"
                                                    value={searchTerm}
                                                    onChange={(e) => setSearchTerm(e.target.value)}
                                                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                                                />
                                                <i className="ri-search-line search-icon"></i>
                                            </div>
                                        </div>
                                        <div className="col-xxl-2 col-sm-6">
                                            <select 
                                                className="form-select"
                                                value={selectedType}
                                                onChange={(e) => setSelectedType(e.target.value)}
                                            >
                                                <option value="">Tüm Uyarı Tipleri</option>
                                                <option value="low_stock">Düşük Stok</option>
                                                <option value="out_of_stock">Stok Tükendi</option>
                                                <option value="expiry_warning">SKT Uyarısı</option>
                                                <option value="expired_items">Vadesi Geçmiş</option>
                                                <option value="reorder_point">Yeniden Sipariş</option>
                                                <option value="slow_moving">Yavaş Hareket</option>
                                                <option value="damaged_stock">Hasarlı Stok</option>
                                                <option value="count_variance">Sayım Farkı</option>
                                            </select>
                                        </div>
                                        <div className="col-xxl-2 col-sm-6">
                                            <select 
                                                className="form-select"
                                                value={selectedSeverity}
                                                onChange={(e) => setSelectedSeverity(e.target.value)}
                                            >
                                                <option value="">Tüm Önem Seviyeleri</option>
                                                <option value="low">Düşük</option>
                                                <option value="medium">Orta</option>
                                                <option value="high">Yüksek</option>
                                                <option value="critical">Kritik</option>
                                            </select>
                                        </div>
                                        <div className="col-xxl-2 col-sm-6">
                                            <select 
                                                className="form-select"
                                                value={selectedStatus}
                                                onChange={(e) => setSelectedStatus(e.target.value)}
                                            >
                                                <option value="">Tüm Durumlar</option>
                                                <option value="active">Aktif</option>
                                                <option value="acknowledged">Onaylandı</option>
                                                <option value="resolved">Çözüldü</option>
                                                <option value="dismissed">Reddedildi</option>
                                            </select>
                                        </div>
                                        <div className="col-xxl-2 col-sm-6">
                                            <select 
                                                className="form-select"
                                                value={selectedWarehouse}
                                                onChange={(e) => setSelectedWarehouse(e.target.value)}
                                            >
                                                <option value="">Tüm Depolar</option>
                                                {warehouses.map((warehouse) => (
                                                    <option key={warehouse.id} value={warehouse.id}>
                                                        {warehouse.name}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="col-xxl-1 col-sm-6">
                                            <button 
                                                type="button" 
                                                className="btn btn-primary w-100"
                                                onClick={handleSearch}
                                            >
                                                <i className="ri-equalizer-fill me-1 align-bottom"></i> Filtrele
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Alerts Table */}
                    <div className="row">
                        <div className="col-lg-12">
                            <div className="card">
                                <div className="card-header align-items-center d-flex">
                                    <h4 className="card-title mb-0 flex-grow-1">
                                        Envanter Uyarıları ({alerts.total})
                                    </h4>
                                    <div className="flex-shrink-0">
                                        <div className="d-flex gap-1">
                                            <button className="btn btn-soft-success btn-sm">
                                                <i className="ri-check-double-line align-middle"></i> Toplu Onayla
                                            </button>
                                            <button className="btn btn-soft-danger btn-sm">
                                                <i className="ri-file-pdf-line align-middle"></i> PDF
                                            </button>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="card-body">
                                    <div className="table-responsive table-card">
                                        <table className="table table-nowrap table-striped-columns mb-0">
                                            <thead className="table-light">
                                                <tr>
                                                    <th scope="col" style={{ width: '50px' }}>
                                                        <div className="form-check">
                                                            <input className="form-check-input" type="checkbox" id="checkAll" />
                                                            <label className="form-check-label" htmlFor="checkAll"></label>
                                                        </div>
                                                    </th>
                                                    <th scope="col">Öncelik</th>
                                                    <th scope="col">Uyarı</th>
                                                    <th scope="col">Ürün/Depo</th>
                                                    <th scope="col">Tip</th>
                                                    <th 
                                                        scope="col"
                                                        style={{ cursor: 'pointer' }}
                                                        onClick={() => handleSort('triggered_at')}
                                                    >
                                                        Tetiklenme <i className={getSortIcon('triggered_at')}></i>
                                                    </th>
                                                    <th scope="col">Durum</th>
                                                    <th scope="col">Atanan</th>
                                                    <th scope="col">İşlemler</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {alerts.data.length > 0 ? (
                                                    alerts.data.map((alert) => (
                                                        <tr key={alert.id}>
                                                            <td>
                                                                <div className="form-check">
                                                                    <input className="form-check-input" type="checkbox" />
                                                                </div>
                                                            </td>
                                                            <td>
                                                                {getSeverityBadge(alert.severity)}
                                                                {alert.escalation_level > 0 && (
                                                                    <span className="badge bg-danger-subtle text-danger ms-1">
                                                                        <i className="ri-arrow-up-line"></i> {alert.escalation_level}
                                                                    </span>
                                                                )}
                                                            </td>
                                                            <td>
                                                                <div className="d-flex align-items-start">
                                                                    <div className="flex-grow-1">
                                                                        <h5 className="fs-14 mb-1">{alert.title}</h5>
                                                                        <p className="text-muted mb-0 fs-12">{alert.message}</p>
                                                                        {alert.snoozed_until && new Date(alert.snoozed_until) > new Date() && (
                                                                            <small className="text-warning">
                                                                                <i className="ri-time-line"></i> Ertelendi: {new Date(alert.snoozed_until).toLocaleDateString('tr-TR')}
                                                                            </small>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td>
                                                                {alert.inventory_item && (
                                                                    <div>
                                                                        <Link href={`/inventory/items/${alert.inventory_item.id}`} className="text-body fw-medium">
                                                                            {alert.inventory_item.name}
                                                                        </Link>
                                                                        <React.Fragment><br /><small className="text-muted">SKU: {alert.inventory_item.sku}</small></React.Fragment>
                                                                    </div>
                                                                )}
                                                                {alert.warehouse && (
                                                                    <div className="mt-1">
                                                                        <span className="text-muted">{alert.warehouse.name}</span>
                                                                    </div>
                                                                )}
                                                            </td>
                                                            <td>
                                                                <span className="badge bg-light text-body">
                                                                    {getAlertTypeText(alert.alert_type)}
                                                                </span>
                                                            </td>
                                                            <td>
                                                                <span className="text-muted">
                                                                    {new Date(alert.triggered_at).toLocaleDateString('tr-TR')}
                                                                </span>
                                                                <React.Fragment>
                                                                    <br />
                                                                    <small className="text-muted">
                                                                        {getTimeAgo(alert.triggered_at)}
                                                                    </small>
                                                                </React.Fragment>
                                                            </td>
                                                            <td>
                                                                {getStatusBadge(alert.status)}
                                                            </td>
                                                            <td>
                                                                {alert.assigned_to ? (
                                                                    <span className="text-body">{alert.assigned_to.name}</span>
                                                                ) : (
                                                                    <span className="text-muted">-</span>
                                                                )}
                                                            </td>
                                                            <td>
                                                                <div className="dropdown">
                                                                    <button className="btn btn-soft-secondary btn-sm dropdown" type="button" data-bs-toggle="dropdown" aria-expanded="false">
                                                                        <i className="ri-more-fill align-middle"></i>
                                                                    </button>
                                                                    <ul className="dropdown-menu dropdown-menu-end">
                                                                        {alert.status === 'active' && (
                                                                            <>
                                                                                <li>
                                                                                    <a 
                                                                                        className="dropdown-item" 
                                                                                        href="#"
                                                                                        onClick={() => handleAlertAction(alert.id, 'acknowledge')}
                                                                                    >
                                                                                        <i className="ri-check-line align-bottom me-2 text-muted"></i> Onayla
                                                                                    </a>
                                                                                </li>
                                                                                <li>
                                                                                    <a 
                                                                                        className="dropdown-item" 
                                                                                        href="#"
                                                                                        onClick={() => handleAlertAction(alert.id, 'snooze', { minutes: 60 })}
                                                                                    >
                                                                                        <i className="ri-time-line align-bottom me-2 text-muted"></i> Ertele (1 saat)
                                                                                    </a>
                                                                                </li>
                                                                                <li className="dropdown-divider"></li>
                                                                            </>
                                                                        )}
                                                                        <li>
                                                                            <a className="dropdown-item" href="#" data-bs-toggle="modal" data-bs-target="#resolveModal">
                                                                                <i className="ri-check-double-line align-bottom me-2 text-muted"></i> Çöz
                                                                            </a>
                                                                        </li>
                                                                        <li>
                                                                            <a className="dropdown-item" href="#" data-bs-toggle="modal" data-bs-target="#assignModal">
                                                                                <i className="ri-user-line align-bottom me-2 text-muted"></i> Ata
                                                                            </a>
                                                                        </li>
                                                                        <li>
                                                                            <a 
                                                                                className="dropdown-item" 
                                                                                href="#"
                                                                                onClick={() => handleAlertAction(alert.id, 'escalate')}
                                                                            >
                                                                                <i className="ri-arrow-up-line align-bottom me-2 text-muted"></i> Yükselt
                                                                            </a>
                                                                        </li>
                                                                        <li className="dropdown-divider"></li>
                                                                        <li>
                                                                            <a 
                                                                                className="dropdown-item text-danger" 
                                                                                href="#"
                                                                                onClick={() => handleAlertAction(alert.id, 'dismiss')}
                                                                            >
                                                                                <i className="ri-close-line align-bottom me-2"></i> Reddet
                                                                            </a>
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
                                    
                                    {/* Pagination */}
                                    {alerts.last_page > 1 && (
                                        <div className="d-flex justify-content-end mt-3">
                                            <nav aria-label="Page navigation">
                                                <ul className="pagination pagination-sm mb-0">
                                                    {alerts.links.map((link, index) => (
                                                        <li key={index} className={`page-item ${link.active ? 'active' : ''} ${!link.url ? 'disabled' : ''}`}>
                                                            {link.url ? (
                                                                <Link
                                                                    className="page-link"
                                                                    href={link.url}
                                                                    preserveState
                                                                    preserveScroll
                                                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                                                />
                                                            ) : (
                                                                <span className="page-link" dangerouslySetInnerHTML={{ __html: link.label }} />
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
};

export default Index;