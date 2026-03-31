import React from 'react';
import { Head, Link, router } from '@inertiajs/react';
import Layout from '../../../Layouts';

interface Warehouse {
    id: number;
    name: string;
    code: string;
}

interface Staff {
    id: number;
    employee: {
        id: number;
        first_name: string;
        last_name: string;
        employee_id: string;
    };
}

interface InventoryItem {
    id: number;
    item_code: string;
    item_name: string;
}

interface Location {
    id: number;
    location_code: string;
    aisle: string;
    shelf: string;
}

interface OperationItem {
    id: number;
    inventory_item_id: number;
    location_id?: number;
    quantity: number;
    processed_quantity?: number;
    status: string;
    notes?: string;
    inventoryItem: InventoryItem;
    location?: Location;
}

interface WarehouseOperation {
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
    created_at: string;
    warehouse: Warehouse;
    assignedStaff?: Staff;
    items?: OperationItem[];
}

interface Props {
    operation: WarehouseOperation;
}

const Show: React.FC<Props> = ({ operation }) => {
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

    const getPriorityText = (priority: string) => {
        const priorities: Record<string, string> = {
            low: 'Düşük',
            normal: 'Normal',
            high: 'Yüksek',
            urgent: 'Acil'
        };
        return priorities[priority] || priority;
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

    const getPriorityColor = (priority: string) => {
        const colors: Record<string, string> = {
            low: 'info',
            normal: 'warning',
            high: 'danger',
            urgent: 'dark'
        };
        return colors[priority] || 'secondary';
    };

    const handleStatusAction = (action: string) => {
        const confirmation = confirm(`Bu operasyonu ${action === 'start' ? 'başlatmak' : action === 'complete' ? 'tamamlamak' : 'iptal etmek'} istediğinizden emin misiniz?`);

        if (confirmation) {
            router.patch(route(`warehouses.operations.${action}`, operation.id));
        }
    };

    const canStart = operation.status === 'pending';
    const canComplete = operation.status === 'in_progress';
    const canCancel = ['pending', 'in_progress'].includes(operation.status);

    const progress = operation.items && operation.items.length > 0
        ? Math.round((operation.items.filter(item => item.status === 'completed').length / operation.items.length) * 100)
        : operation.status === 'completed' ? 100 : operation.status === 'in_progress' ? 50 : 0;

    return (
        <Layout>
            <Head title={`${operation.operation_number} - Detay`} />

            <div className="page-content">
                <div className="container-fluid">
                    {/* Page Title */}
                    <div className="row">
                        <div className="col-12">
                            <div className="page-title-box d-sm-flex align-items-center justify-content-between">
                                <h4 className="mb-sm-0">Depo Operasyonu Detayı</h4>
                                <div className="page-title-right">
                                    <ol className="breadcrumb m-0">
                                        <li className="breadcrumb-item"><Link href="/warehouses">Depo Yönetimi</Link></li>
                                        <li className="breadcrumb-item"><Link href="/warehouses/operations">Operasyonlar</Link></li>
                                        <li className="breadcrumb-item active">Detay</li>
                                    </ol>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="row">
                        {/* Operation Information */}
                        <div className="col-lg-8">
                            <div className="card">
                                <div className="card-header">
                                    <div className="d-flex align-items-center justify-content-between">
                                        <h5 className="card-title mb-0">Operasyon Bilgileri</h5>
                                        <div className="d-flex gap-2">
                                            <span className={`badge bg-${getStatusColor(operation.status)} fs-12`}>
                                                {getStatusText(operation.status)}
                                            </span>
                                            <span className={`badge bg-${getPriorityColor(operation.priority)} fs-12`}>
                                                {getPriorityText(operation.priority)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className="card-body">
                                    <div className="row">
                                        <div className="col-md-6">
                                            <div className="table-responsive">
                                                <table className="table table-borderless mb-0">
                                                    <tbody>
                                                        <tr>
                                                            <td className="fw-medium">Operasyon No:</td>
                                                            <td>{operation.operation_number}</td>
                                                        </tr>
                                                        <tr>
                                                            <td className="fw-medium">Depo:</td>
                                                            <td>{operation.warehouse.name} ({operation.warehouse.code})</td>
                                                        </tr>
                                                        <tr>
                                                            <td className="fw-medium">Operasyon Tipi:</td>
                                                            <td>{getOperationTypeText(operation.operation_type)}</td>
                                                        </tr>
                                                        <tr>
                                                            <td className="fw-medium">Atanan Personel:</td>
                                                            <td>
                                                                {operation.assignedStaff
                                                                    ? `${operation.assignedStaff.employee.first_name} ${operation.assignedStaff.employee.last_name} (${operation.assignedStaff.employee.employee_id})`
                                                                    : 'Atanmamış'
                                                                }
                                                            </td>
                                                        </tr>
                                                        <tr>
                                                            <td className="fw-medium">Tahmini Süre:</td>
                                                            <td>{operation.estimated_duration ? `${operation.estimated_duration} dakika` : '-'}</td>
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
                                                            <td className="fw-medium">Oluşturma:</td>
                                                            <td>{new Date(operation.created_at).toLocaleString('tr-TR')}</td>
                                                        </tr>
                                                        <tr>
                                                            <td className="fw-medium">Başlama:</td>
                                                            <td>
                                                                {operation.started_at
                                                                    ? new Date(operation.started_at).toLocaleString('tr-TR')
                                                                    : '-'
                                                                }
                                                            </td>
                                                        </tr>
                                                        <tr>
                                                            <td className="fw-medium">Tamamlanma:</td>
                                                            <td>
                                                                {operation.completed_at
                                                                    ? new Date(operation.completed_at).toLocaleString('tr-TR')
                                                                    : '-'
                                                                }
                                                            </td>
                                                        </tr>
                                                        <tr>
                                                            <td className="fw-medium">Tahmini Bitiş:</td>
                                                            <td>
                                                                {operation.estimated_completion
                                                                    ? new Date(operation.estimated_completion).toLocaleString('tr-TR')
                                                                    : '-'
                                                                }
                                                            </td>
                                                        </tr>
                                                        <tr>
                                                            <td className="fw-medium">İlerleme:</td>
                                                            <td>
                                                                <div className="d-flex align-items-center">
                                                                    <div className="progress flex-grow-1 me-2" style={{ height: '6px' }}>
                                                                        <div
                                                                            className={`progress-bar bg-${getStatusColor(operation.status)}`}
                                                                            style={{ width: `${progress}%` }}
                                                                        ></div>
                                                                    </div>
                                                                    <span className="fs-12">{progress}%</span>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Description */}
                                    {operation.description && (
                                        <div className="row mt-4">
                                            <div className="col-12">
                                                <h6 className="fw-semibold">Açıklama</h6>
                                                <p className="text-muted">{operation.description}</p>
                                            </div>
                                        </div>
                                    )}

                                    {/* Notes */}
                                    {operation.notes && (
                                        <div className="row mt-3">
                                            <div className="col-12">
                                                <h6 className="fw-semibold">Notlar</h6>
                                                <div className="alert alert-info">
                                                    {operation.notes}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Operation Items */}
                            {operation.items && operation.items.length > 0 && (
                                <div className="card">
                                    <div className="card-header">
                                        <h5 className="card-title mb-0">Operasyon Kalemleri</h5>
                                    </div>
                                    <div className="card-body">
                                        <div className="table-responsive">
                                            <table className="table table-nowrap mb-0">
                                                <thead>
                                                    <tr>
                                                        <th>Ürün Kodu</th>
                                                        <th>Ürün Adı</th>
                                                        <th>Lokasyon</th>
                                                        <th>Miktar</th>
                                                        <th>İşlenen</th>
                                                        <th>Durum</th>
                                                        <th>Not</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {operation.items.map(item => (
                                                        <tr key={item.id}>
                                                            <td className="fw-medium">{item.inventoryItem.item_code}</td>
                                                            <td>{item.inventoryItem.item_name}</td>
                                                            <td>
                                                                {item.location
                                                                    ? `${item.location.location_code} (${item.location.aisle}-${item.location.shelf})`
                                                                    : '-'
                                                                }
                                                            </td>
                                                            <td>{item.quantity}</td>
                                                            <td>{item.processed_quantity || 0}</td>
                                                            <td>
                                                                <span className={`badge bg-${getStatusColor(item.status)} fs-12`}>
                                                                    {getStatusText(item.status)}
                                                                </span>
                                                            </td>
                                                            <td>{item.notes || '-'}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Actions */}
                        <div className="col-lg-4">
                            <div className="card">
                                <div className="card-header">
                                    <h5 className="card-title mb-0">İşlemler</h5>
                                </div>
                                <div className="card-body">
                                    <div className="d-grid gap-2">
                                        {canStart && (
                                            <button
                                                className="btn btn-success"
                                                onClick={() => handleStatusAction('start')}
                                            >
                                                <i className="ri-play-line me-1"></i>
                                                Operasyonu Başlat
                                            </button>
                                        )}

                                        {canComplete && (
                                            <button
                                                className="btn btn-primary"
                                                onClick={() => handleStatusAction('complete')}
                                            >
                                                <i className="ri-check-line me-1"></i>
                                                Operasyonu Tamamla
                                            </button>
                                        )}

                                        {canCancel && (
                                            <button
                                                className="btn btn-danger"
                                                onClick={() => handleStatusAction('cancel')}
                                            >
                                                <i className="ri-close-line me-1"></i>
                                                Operasyonu İptal Et
                                            </button>
                                        )}

                                        <Link
                                            href={route('warehouses.operations.edit', operation.id)}
                                            className="btn btn-warning"
                                        >
                                            <i className="ri-edit-line me-1"></i>
                                            Düzenle
                                        </Link>

                                        <Link
                                            href="/warehouses/operations"
                                            className="btn btn-secondary"
                                        >
                                            <i className="ri-arrow-left-line me-1"></i>
                                            Geri Dön
                                        </Link>
                                    </div>
                                </div>
                            </div>

                            {/* Statistics */}
                            <div className="card">
                                <div className="card-header">
                                    <h5 className="card-title mb-0">İstatistikler</h5>
                                </div>
                                <div className="card-body">
                                    <div className="row g-3">
                                        <div className="col-6">
                                            <div className="text-center">
                                                <h4 className="mb-1 text-primary">{operation.items?.length || 0}</h4>
                                                <p className="text-muted mb-0 fs-13">Toplam Kalem</p>
                                            </div>
                                        </div>
                                        <div className="col-6">
                                            <div className="text-center">
                                                <h4 className="mb-1 text-success">
                                                    {operation.items?.filter(item => item.status === 'completed').length || 0}
                                                </h4>
                                                <p className="text-muted mb-0 fs-13">Tamamlanan</p>
                                            </div>
                                        </div>
                                        <div className="col-12">
                                            <div className="text-center">
                                                <h4 className="mb-1 text-info">{progress}%</h4>
                                                <p className="text-muted mb-0 fs-13">Tamamlanma Oranı</p>
                                            </div>
                                        </div>
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

export default Show;
