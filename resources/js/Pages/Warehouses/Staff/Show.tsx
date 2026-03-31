import React from 'react';
import { Head, Link } from '@inertiajs/react';
import Layout from '../../../Layouts';

interface Warehouse {
    id: number;
    name: string;
    code: string;
}

interface Employee {
    id: number;
    first_name: string;
    last_name: string;
    employee_id: string;
    email?: string;
    phone?: string;
    department?: string;
}

interface WarehouseOperation {
    id: number;
    operation_number: string;
    operation_type: string;
    status: string;
    created_at: string;
    completed_at?: string;
    warehouse: Warehouse;
}

interface PerformanceStats {
    total_operations: number;
    completed_operations: number;
    operations_this_month: number;
    average_completion_time: number;
    efficiency_rating: number;
}

interface WarehouseStaff {
    id: number;
    warehouse_id: number;
    employee_id: number;
    role: string;
    role_text: string;
    employment_type: string;
    employment_type_text: string;
    shift: string;
    shift_text: string;
    hire_date: string;
    status: string;
    status_color: string;
    current_status?: string;
    current_status_text?: string;
    current_status_color?: string;
    emergency_contact_name?: string;
    emergency_contact_phone?: string;
    warehouse: Warehouse;
    employee: Employee;
}

interface Props {
    staff: WarehouseStaff;
    recentOperations: WarehouseOperation[];
    performanceStats: PerformanceStats;
}

const Show: React.FC<Props> = ({ staff, recentOperations, performanceStats }) => {
    const getOperationTypeText = (type: string) => {
        const types: Record<string, string> = {
            receiving: 'Mal Kabul',
            picking: 'Toplama',
            packing: 'Paketleme',
            shipping: 'Sevkiyat',
            counting: 'Sayım',
            relocation: 'Yer Değiştirme',
            maintenance: 'Bakım'
        };
        return types[type] || type;
    };

    const getStatusText = (status: string) => {
        const statuses: Record<string, string> = {
            pending: 'Beklemede',
            in_progress: 'Devam Ediyor',
            completed: 'Tamamlandı',
            cancelled: 'İptal Edildi',
            on_hold: 'Bekletiliyor'
        };
        return statuses[status] || status;
    };

    const getStatusColor = (status: string) => {
        const colors: Record<string, string> = {
            pending: 'warning',
            in_progress: 'info',
            completed: 'success',
            cancelled: 'danger',
            on_hold: 'secondary'
        };
        return colors[status] || 'secondary';
    };

    return (
        <Layout>
            <Head title={`${staff.employee?.first_name || ''} ${staff.employee?.last_name || ''} - Detay`} />
            
            <div className="page-content">
                <div className="container-fluid">
                    {/* Page Title */}
                    <div className="row">
                        <div className="col-12">
                            <div className="page-title-box d-sm-flex align-items-center justify-content-between">
                                <h4 className="mb-sm-0">Depo Personeli Detayı</h4>
                                <div className="page-title-right">
                                    <ol className="breadcrumb m-0">
                                        <li className="breadcrumb-item"><Link href="/warehouses">Depo Yönetimi</Link></li>
                                        <li className="breadcrumb-item"><Link href="/warehouses/staff">Personel</Link></li>
                                        <li className="breadcrumb-item active">Detay</li>
                                    </ol>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="row">
                        {/* Staff Information */}
                        <div className="col-lg-8">
                            <div className="card">
                                <div className="card-header">
                                    <h5 className="card-title mb-0">Personel Bilgileri</h5>
                                </div>
                                <div className="card-body">
                                    <div className="row">
                                        <div className="col-md-6">
                                            <div className="table-responsive">
                                                <table className="table table-borderless mb-0">
                                                    <tbody>
                                                        <tr>
                                                            <td className="fw-medium">Ad Soyad:</td>
                                                            <td>{staff.employee?.first_name || ''} {staff.employee?.last_name || ''}</td>
                                                        </tr>
                                                        <tr>
                                                            <td className="fw-medium">Sicil No:</td>
                                                            <td>{staff.employee?.employee_id || '-'}</td>
                                                        </tr>
                                                        <tr>
                                                            <td className="fw-medium">E-posta:</td>
                                                            <td>{staff.employee?.email || '-'}</td>
                                                        </tr>
                                                        <tr>
                                                            <td className="fw-medium">Telefon:</td>
                                                            <td>{staff.employee?.phone || '-'}</td>
                                                        </tr>
                                                        <tr>
                                                            <td className="fw-medium">Departman:</td>
                                                            <td>{staff.employee?.department || '-'}</td>
                                                        </tr>
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                        <div className="col-md-6">
                                            <div className="table-responsive">
                                                <table className="table table-borderless mb-0">
                                                    <tbody>
                                                        <tr>
                                                            <td className="fw-medium">Depo:</td>
                                                            <td>{staff.warehouse.name} ({staff.warehouse.code})</td>
                                                        </tr>
                                                        <tr>
                                                            <td className="fw-medium">Görev:</td>
                                                            <td>{staff.role_text}</td>
                                                        </tr>
                                                        <tr>
                                                            <td className="fw-medium">Çalışma Tipi:</td>
                                                            <td>{staff.employment_type_text}</td>
                                                        </tr>
                                                        <tr>
                                                            <td className="fw-medium">Vardiya:</td>
                                                            <td>{staff.shift_text}</td>
                                                        </tr>
                                                        <tr>
                                                            <td className="fw-medium">İşe Başlama:</td>
                                                            <td>{new Date(staff.hire_date).toLocaleDateString('tr-TR')}</td>
                                                        </tr>
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Status */}
                                    <div className="row mt-3">
                                        <div className="col-12">
                                            <div className="d-flex align-items-center">
                                                <span className="fw-medium me-2">Durum:</span>
                                                <span className={`badge bg-${staff.status_color} fs-12`}>
                                                    {staff.status === 'active' ? 'Aktif' : 
                                                     staff.status === 'inactive' ? 'İnaktif' :
                                                     staff.status === 'suspended' ? 'Askıya Alınmış' : 'İşten Çıkarılmış'}
                                                </span>
                                                {staff.current_status && (
                                                    <>
                                                        <span className="mx-2">|</span>
                                                        <span className="fw-medium me-2">Mevcut Durum:</span>
                                                        <span className={`badge bg-${staff.current_status_color} fs-12`}>
                                                            {staff.current_status_text}
                                                        </span>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Emergency Contact */}
                                    {(staff.emergency_contact_name || staff.emergency_contact_phone) && (
                                        <div className="row mt-4">
                                            <div className="col-12">
                                                <h6 className="fw-semibold">Acil Durum İletişim</h6>
                                                <div className="table-responsive">
                                                    <table className="table table-borderless mb-0">
                                                        <tbody>
                                                            {staff.emergency_contact_name && (
                                                                <tr>
                                                                    <td className="fw-medium">Ad:</td>
                                                                    <td>{staff.emergency_contact_name}</td>
                                                                </tr>
                                                            )}
                                                            {staff.emergency_contact_phone && (
                                                                <tr>
                                                                    <td className="fw-medium">Telefon:</td>
                                                                    <td>{staff.emergency_contact_phone}</td>
                                                                </tr>
                                                            )}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Performance Stats */}
                        <div className="col-lg-4">
                            <div className="card">
                                <div className="card-header">
                                    <h5 className="card-title mb-0">Performans İstatistikleri</h5>
                                </div>
                                <div className="card-body">
                                    <div className="row g-3">
                                        <div className="col-6">
                                            <div className="text-center">
                                                <h4 className="mb-1 text-primary">{performanceStats.total_operations}</h4>
                                                <p className="text-muted mb-0 fs-13">Toplam Operasyon</p>
                                            </div>
                                        </div>
                                        <div className="col-6">
                                            <div className="text-center">
                                                <h4 className="mb-1 text-success">{performanceStats.completed_operations}</h4>
                                                <p className="text-muted mb-0 fs-13">Tamamlanan</p>
                                            </div>
                                        </div>
                                        <div className="col-6">
                                            <div className="text-center">
                                                <h4 className="mb-1 text-info">{performanceStats.operations_this_month}</h4>
                                                <p className="text-muted mb-0 fs-13">Bu Ay</p>
                                            </div>
                                        </div>
                                        <div className="col-6">
                                            <div className="text-center">
                                                <h4 className="mb-1 text-warning">{performanceStats.average_completion_time}</h4>
                                                <p className="text-muted mb-0 fs-13">Ort. Süre (dk)</p>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="mt-4">
                                        <div className="d-flex align-items-center justify-content-between mb-2">
                                            <span className="fw-medium">Verimlilik Oranı</span>
                                            <span className="fw-medium">{performanceStats.efficiency_rating}%</span>
                                        </div>
                                        <div className="progress" style={{ height: '8px' }}>
                                            <div 
                                                className={`progress-bar ${
                                                    performanceStats.efficiency_rating >= 80 ? 'bg-success' :
                                                    performanceStats.efficiency_rating >= 60 ? 'bg-warning' : 'bg-danger'
                                                }`}
                                                style={{ width: `${performanceStats.efficiency_rating}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="card">
                                <div className="card-header">
                                    <h5 className="card-title mb-0">İşlemler</h5>
                                </div>
                                <div className="card-body">
                                    <div className="d-grid gap-2">
                                        <Link
                                            href={route('warehouses.staff.edit', staff.id)}
                                            className="btn btn-primary"
                                        >
                                            <i className="ri-edit-line me-1"></i>
                                            Düzenle
                                        </Link>
                                        <Link
                                            href="/warehouses/staff"
                                            className="btn btn-secondary"
                                        >
                                            <i className="ri-arrow-left-line me-1"></i>
                                            Geri Dön
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Recent Operations */}
                    <div className="row">
                        <div className="col-12">
                            <div className="card">
                                <div className="card-header">
                                    <h5 className="card-title mb-0">Son Operasyonlar</h5>
                                </div>
                                <div className="card-body">
                                    {recentOperations.length > 0 ? (
                                        <div className="table-responsive">
                                            <table className="table table-nowrap mb-0">
                                                <thead>
                                                    <tr>
                                                        <th>Operasyon No</th>
                                                        <th>Tip</th>
                                                        <th>Depo</th>
                                                        <th>Durum</th>
                                                        <th>Oluşturma</th>
                                                        <th>Tamamlanma</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {recentOperations.map(operation => (
                                                        <tr key={operation.id}>
                                                            <td>
                                                                <Link
                                                                    href={route('warehouses.operations.show', operation.id)}
                                                                    className="fw-medium link-primary"
                                                                >
                                                                    {operation.operation_number}
                                                                </Link>
                                                            </td>
                                                            <td>{getOperationTypeText(operation.operation_type)}</td>
                                                            <td>{operation.warehouse.name}</td>
                                                            <td>
                                                                <span className={`badge bg-${getStatusColor(operation.status)} fs-12`}>
                                                                    {getStatusText(operation.status)}
                                                                </span>
                                                            </td>
                                                            <td>{new Date(operation.created_at).toLocaleDateString('tr-TR')}</td>
                                                            <td>
                                                                {operation.completed_at 
                                                                    ? new Date(operation.completed_at).toLocaleDateString('tr-TR')
                                                                    : '-'
                                                                }
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    ) : (
                                        <div className="text-center py-4">
                                            <div className="avatar-md mx-auto mb-4">
                                                <div className="avatar-title bg-light text-primary rounded-circle fs-24">
                                                    <i className="ri-file-list-3-line"></i>
                                                </div>
                                            </div>
                                            <h5 className="fs-16">Henüz operasyon bulunamadı</h5>
                                            <p className="text-muted mb-0">Bu personele henüz operasyon atanmamış.</p>
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

export default Show;