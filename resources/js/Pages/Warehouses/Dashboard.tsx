import React from 'react';
import { Head, Link } from '@inertiajs/react';
import Layout from '../../Layouts';

interface DashboardData {
    metrics: {
        total_warehouses: number;
        active_warehouses: number;
        total_locations: number;
        occupied_locations: number;
        available_locations: number;
        pending_operations: number;
        completed_operations_today: number;
        total_staff: number;
        active_staff: number;
        total_capacity: number;
        utilized_capacity: number;
        capacity_percentage: number;
    };
    warehouse_performance: Array<{
        id: number;
        name: string;
        code: string;
        total_operations: number;
        completed_operations: number;
        pending_operations: number;
        efficiency_percentage: number;
        capacity_utilization: number;
        staff_count: number;
    }>;
    recent_operations: Array<{
        id: number;
        operation_number: string;
        operation_type: string;
        status: string;
        warehouse: {
            name: string;
        };
        created_at: string;
        estimated_completion: string;
        progress_percentage: number;
    }>;
    location_utilization: Array<{
        warehouse_name: string;
        zone_name: string;
        total_locations: number;
        occupied_locations: number;
        utilization_percentage: number;
    }>;
    staff_performance: Array<{
        id: number;
        name: string;
        role: string;
        warehouse: string;
        completed_operations: number;
        efficiency_rating: number;
        status: string;
    }>;
    alerts: Array<{
        id: number;
        type: string;
        message: string;
        severity: string;
        warehouse?: string;
        created_at: string;
    }>;
}

interface Props {
    dashboardData: DashboardData;
}

const Dashboard: React.FC<Props> = ({ dashboardData }) => {
    const { metrics, warehouse_performance, recent_operations, location_utilization, staff_performance, alerts } = dashboardData;

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

    const getEfficiencyColor = (percentage: number) => {
        if (percentage >= 90) return 'text-success';
        if (percentage >= 70) return 'text-warning';
        return 'text-danger';
    };

    return (
        <Layout>
            <Head title="Depo Dashboard" />
            
            <div className="page-content">
                <div className="container-fluid">
                    {/* Page Title */}
                    <div className="row">
                        <div className="col-12">
                            <div className="page-title-box d-sm-flex align-items-center justify-content-between">
                                <h4 className="mb-sm-0">Depo Dashboard</h4>
                                <div className="page-title-right">
                                    <ol className="breadcrumb m-0">
                                        <li className="breadcrumb-item"><Link href="/warehouses">Depo Yönetimi</Link></li>
                                        <li className="breadcrumb-item active">Dashboard</li>
                                    </ol>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Key Metrics */}
                    <div className="row">
                        <div className="col-xl-3 col-md-6">
                            <div className="card card-animate">
                                <div className="card-body">
                                    <div className="d-flex align-items-center">
                                        <div className="flex-grow-1 overflow-hidden">
                                            <p className="text-uppercase fw-medium text-muted text-truncate mb-0">
                                                Aktif Depolar
                                            </p>
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
                                                <span className="counter-value">{metrics.active_warehouses}</span>
                                                <span className="text-muted fs-14">/{metrics.total_warehouses}</span>
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
                                            <p className="text-uppercase fw-medium text-muted text-truncate mb-0">
                                                Kapasite Kullanımı
                                            </p>
                                        </div>
                                        <div className="avatar-sm flex-shrink-0">
                                            <span className="avatar-title bg-success-subtle rounded fs-3">
                                                <i className="bx bx-cube text-success"></i>
                                            </span>
                                        </div>
                                    </div>
                                    <div className="d-flex align-items-end justify-content-between mt-4">
                                        <div>
                                            <h4 className="fs-22 fw-semibold ff-secondary mb-4">
                                                <span className="counter-value">{metrics.capacity_percentage.toFixed(1)}</span>%
                                            </h4>
                                            <p className="text-muted mb-0">{metrics.utilized_capacity.toLocaleString()} / {metrics.total_capacity.toLocaleString()}</p>
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
                                            <p className="text-uppercase fw-medium text-muted text-truncate mb-0">
                                                Bekleyen Operasyonlar
                                            </p>
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
                                                <span className="counter-value">{metrics.pending_operations}</span>
                                            </h4>
                                            <p className="text-muted mb-0">Bugün tamamlanan: {metrics.completed_operations_today}</p>
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
                                            <p className="text-uppercase fw-medium text-muted text-truncate mb-0">
                                                Aktif Personel
                                            </p>
                                        </div>
                                        <div className="avatar-sm flex-shrink-0">
                                            <span className="avatar-title bg-info-subtle rounded fs-3">
                                                <i className="bx bx-user text-info"></i>
                                            </span>
                                        </div>
                                    </div>
                                    <div className="d-flex align-items-end justify-content-between mt-4">
                                        <div>
                                            <h4 className="fs-22 fw-semibold ff-secondary mb-4">
                                                <span className="counter-value">{metrics.active_staff}</span>
                                                <span className="text-muted fs-14">/{metrics.total_staff}</span>
                                            </h4>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="row">
                        {/* Recent Operations */}
                        <div className="col-xl-8">
                            <div className="card">
                                <div className="card-header align-items-center d-flex">
                                    <h4 className="card-title mb-0 flex-grow-1">Son Operasyonlar</h4>
                                    <div className="flex-shrink-0">
                                        <Link href="/warehouses/operations" className="btn btn-soft-info btn-sm">
                                            <i className="ri-file-list-3-line align-middle"></i> Tümünü Gör
                                        </Link>
                                    </div>
                                </div>
                                <div className="card-body">
                                    <div className="table-responsive table-card">
                                        <table className="table table-hover table-centered align-middle table-nowrap mb-0">
                                            <tbody>
                                                {recent_operations && recent_operations.length > 0 ? (
                                                    recent_operations.map((operation, index) => (
                                                        <tr key={index}>
                                                            <td>
                                                                <div className="d-flex align-items-center">
                                                                    <div className="avatar-xs me-3">
                                                                        <div className="avatar-title rounded-circle bg-primary-subtle text-primary">
                                                                            <i className="bx bx-package"></i>
                                                                        </div>
                                                                    </div>
                                                                    <div className="flex-grow-1">
                                                                        <h5 className="fs-14 mb-1">{operation.operation_number}</h5>
                                                                        <p className="text-muted mb-0">{getOperationTypeText(operation.operation_type)}</p>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td>
                                                                <span className="text-muted">{operation.warehouse.name}</span>
                                                            </td>
                                                            <td>
                                                                {getStatusBadge(operation.status)}
                                                            </td>
                                                            <td>
                                                                <div className="progress progress-sm">
                                                                    <div 
                                                                        className="progress-bar" 
                                                                        role="progressbar" 
                                                                        style={{ width: `${operation.progress_percentage}%` }}
                                                                    ></div>
                                                                </div>
                                                                <small className="text-muted">{operation.progress_percentage}%</small>
                                                            </td>
                                                            <td>
                                                                <small className="text-muted">
                                                                    {new Date(operation.created_at).toLocaleDateString('tr-TR')}
                                                                </small>
                                                            </td>
                                                        </tr>
                                                    ))
                                                ) : (
                                                    <tr>
                                                        <td colSpan={5} className="text-center py-4">
                                                            <div className="text-muted">Henüz operasyon bulunmuyor</div>
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Alerts */}
                        <div className="col-xl-4">
                            <div className="card">
                                <div className="card-header align-items-center d-flex">
                                    <h4 className="card-title mb-0 flex-grow-1">Uyarılar</h4>
                                    <div className="flex-shrink-0">
                                        <span className="badge bg-danger-subtle text-danger">{alerts.length}</span>
                                    </div>
                                </div>
                                <div className="card-body">
                                    {alerts && alerts.length > 0 ? (
                                        alerts.slice(0, 5).map((alert, index) => (
                                            <div key={index} className="d-flex align-items-start border-bottom py-3">
                                                <div className="flex-grow-1">
                                                    <div className="d-flex align-items-center mb-2">
                                                        {getSeverityBadge(alert.severity)}
                                                        <small className="text-muted ms-auto">
                                                            {new Date(alert.created_at).toLocaleDateString('tr-TR')}
                                                        </small>
                                                    </div>
                                                    <p className="text-muted mb-1">{alert.message}</p>
                                                    {alert.warehouse && (
                                                        <small className="text-muted">{alert.warehouse}</small>
                                                    )}
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-center py-4">
                                            <div className="text-muted">Aktif uyarı bulunmuyor</div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="row">
                        {/* Warehouse Performance */}
                        <div className="col-xl-8">
                            <div className="card">
                                <div className="card-header align-items-center d-flex">
                                    <h4 className="card-title mb-0 flex-grow-1">Depo Performansı</h4>
                                </div>
                                <div className="card-body">
                                    <div className="table-responsive table-card">
                                        <table className="table table-nowrap table-striped-columns mb-0">
                                            <thead className="table-light">
                                                <tr>
                                                    <th scope="col">Depo</th>
                                                    <th scope="col">Operasyonlar</th>
                                                    <th scope="col">Verimlilik</th>
                                                    <th scope="col">Kapasite</th>
                                                    <th scope="col">Personel</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {warehouse_performance && warehouse_performance.length > 0 ? (
                                                    warehouse_performance.map((warehouse) => (
                                                        <tr key={warehouse.id}>
                                                            <td>
                                                                <div className="d-flex align-items-center">
                                                                    <div className="flex-grow-1">
                                                                        <h6 className="fs-14 mb-1">{warehouse.name}</h6>
                                                                        <p className="text-muted mb-0 fs-12">{warehouse.code}</p>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td>
                                                                <span className="fw-medium text-success">{warehouse.completed_operations}</span>
                                                                <span className="text-muted"> / {warehouse.total_operations}</span>
                                                                <React.Fragment>
                                                                    <br />
                                                                    <small className="text-warning">Bekleyen: {warehouse.pending_operations}</small>
                                                                </React.Fragment>
                                                            </td>
                                                            <td>
                                                                <span className={`fw-medium ${getEfficiencyColor(warehouse.efficiency_percentage)}`}>
                                                                    {warehouse.efficiency_percentage}%
                                                                </span>
                                                                <div className="progress progress-sm mt-1">
                                                                    <div 
                                                                        className={`progress-bar ${warehouse.efficiency_percentage >= 90 ? 'bg-success' : warehouse.efficiency_percentage >= 70 ? 'bg-warning' : 'bg-danger'}`}
                                                                        style={{ width: `${warehouse.efficiency_percentage}%` }}
                                                                    ></div>
                                                                </div>
                                                            </td>
                                                            <td>
                                                                <span className="fw-medium">{warehouse.capacity_utilization}%</span>
                                                                <div className="progress progress-sm mt-1">
                                                                    <div 
                                                                        className="progress-bar bg-info" 
                                                                        style={{ width: `${warehouse.capacity_utilization}%` }}
                                                                    ></div>
                                                                </div>
                                                            </td>
                                                            <td>
                                                                <span className="fw-medium">{warehouse.staff_count}</span>
                                                            </td>
                                                        </tr>
                                                    ))
                                                ) : (
                                                    <tr>
                                                        <td colSpan={5} className="text-center py-4">
                                                            <div className="text-muted">Veri bulunmuyor</div>
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Location Utilization */}
                        <div className="col-xl-4">
                            <div className="card">
                                <div className="card-header align-items-center d-flex">
                                    <h4 className="card-title mb-0 flex-grow-1">Lokasyon Kullanımı</h4>
                                </div>
                                <div className="card-body">
                                    {location_utilization && location_utilization.length > 0 ? (
                                        location_utilization.map((location, index) => (
                                            <div key={index} className="d-flex align-items-center border-bottom py-3">
                                                <div className="flex-grow-1">
                                                    <h6 className="fs-14 mb-1">{location.warehouse_name}</h6>
                                                    <p className="text-muted mb-2">{location.zone_name}</p>
                                                    <div className="progress progress-sm">
                                                        <div 
                                                            className="progress-bar bg-primary" 
                                                            style={{ width: `${location.utilization_percentage}%` }}
                                                        ></div>
                                                    </div>
                                                    <small className="text-muted">
                                                        {location.occupied_locations} / {location.total_locations} (%{location.utilization_percentage})
                                                    </small>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-center py-4">
                                            <div className="text-muted">Lokasyon bilgisi bulunmuyor</div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Staff Performance */}
                    <div className="row">
                        <div className="col-lg-12">
                            <div className="card">
                                <div className="card-header align-items-center d-flex">
                                    <h4 className="card-title mb-0 flex-grow-1">Personel Performansı</h4>
                                    <div className="flex-shrink-0">
                                        <Link href="/warehouses/staff" className="btn btn-soft-info btn-sm">
                                            <i className="ri-team-line align-middle"></i> Tüm Personel
                                        </Link>
                                    </div>
                                </div>
                                <div className="card-body">
                                    <div className="table-responsive table-card">
                                        <table className="table table-nowrap table-striped-columns mb-0">
                                            <thead className="table-light">
                                                <tr>
                                                    <th scope="col">Personel</th>
                                                    <th scope="col">Rol</th>
                                                    <th scope="col">Depo</th>
                                                    <th scope="col">Tamamlanan İşler</th>
                                                    <th scope="col">Verimlilik</th>
                                                    <th scope="col">Durum</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {staff_performance && staff_performance.length > 0 ? (
                                                    staff_performance.slice(0, 10).map((staff) => (
                                                        <tr key={staff.id}>
                                                            <td>
                                                                <span className="fw-medium">{staff.name}</span>
                                                            </td>
                                                            <td>
                                                                <span className="badge bg-light text-body">{staff.role}</span>
                                                            </td>
                                                            <td>
                                                                <span className="text-muted">{staff.warehouse}</span>
                                                            </td>
                                                            <td>
                                                                <span className="fw-medium">{staff.completed_operations}</span>
                                                            </td>
                                                            <td>
                                                                <span className={`fw-medium ${getEfficiencyColor(staff.efficiency_rating)}`}>
                                                                    {staff.efficiency_rating}%
                                                                </span>
                                                            </td>
                                                            <td>
                                                                <span className={`badge ${staff.status === 'active' ? 'bg-success-subtle text-success' : 'bg-secondary-subtle text-secondary'}`}>
                                                                    {staff.status === 'active' ? 'Aktif' : 'Pasif'}
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    ))
                                                ) : (
                                                    <tr>
                                                        <td colSpan={6} className="text-center py-4">
                                                            <div className="text-muted">Personel bilgisi bulunmuyor</div>
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

export default Dashboard;