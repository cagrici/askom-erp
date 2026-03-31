import React from 'react';
import { Head, Link } from '@inertiajs/react';
import Layout from '../../../Layouts';

interface PurchaseOrderItem {
    id: number;
    item_code: string;
    item_name: string;
    ordered_quantity: number;
    received_quantity: number;
    remaining_quantity: number;
    unit_price: number;
    total_price: number;
    barcode?: string;
    batch_number?: string;
    expiry_date?: string;
    received_at?: string;
}

interface PurchaseOrder {
    id: number;
    order_number: string;
    supplier_name: string;
    supplier_contact?: string;
    order_date: string;
    expected_delivery_date: string;
    delivery_date?: string;
    status: string;
    total_amount: number;
    warehouse: {
        id: number;
        name: string;
        code: string;
    };
    items: PurchaseOrderItem[];
    notes?: string;
}

interface Props {
    purchaseOrder: PurchaseOrder;
}

const Show: React.FC<Props> = ({ purchaseOrder }) => {
    const getStatusBadge = (status: string) => {
        const badges: { [key: string]: string } = {
            'pending': 'warning',
            'partial': 'info',
            'completed': 'success',
            'cancelled': 'danger'
        };
        
        const labels: { [key: string]: string } = {
            'pending': 'Beklemede',
            'partial': 'Kısmi Teslim',
            'completed': 'Tamamlandı',
            'cancelled': 'İptal'
        };

        return (
            <span className={`badge bg-${badges[status] || 'secondary'} fs-12`}>
                {labels[status] || status}
            </span>
        );
    };

    const getProgressPercentage = (received: number, ordered: number): number => {
        return ordered > 0 ? Math.round((received / ordered) * 100) : 0;
    };

    const getTotalReceived = (): number => {
        return purchaseOrder.items.reduce((sum, item) => sum + item.received_quantity, 0);
    };

    const getTotalOrdered = (): number => {
        return purchaseOrder.items.reduce((sum, item) => sum + item.ordered_quantity, 0);
    };

    const getReceivedValue = (): number => {
        return purchaseOrder.items.reduce((sum, item) => sum + (item.received_quantity * item.unit_price), 0);
    };

    return (
        <Layout>
            <Head title={`${purchaseOrder.order_number} - Detay`} />
            
            <div className="page-content">
                <div className="container-fluid">
                    {/* Page Title */}
                    <div className="row">
                        <div className="col-12">
                            <div className="page-title-box d-sm-flex align-items-center justify-content-between">
                                <h4 className="mb-sm-0">Sipariş Detayı</h4>
                                <div className="page-title-right">
                                    <ol className="breadcrumb m-0">
                                        <li className="breadcrumb-item"><Link href="/warehouses">Depo Yönetimi</Link></li>
                                        <li className="breadcrumb-item"><Link href="/warehouses/receiving">Mal Kabul</Link></li>
                                        <li className="breadcrumb-item active">Detay</li>
                                    </ol>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="row">
                        {/* Order Information */}
                        <div className="col-lg-8">
                            <div className="card">
                                <div className="card-header">
                                    <div className="d-flex align-items-center justify-content-between">
                                        <h5 className="card-title mb-0">Sipariş Bilgileri</h5>
                                        {getStatusBadge(purchaseOrder.status)}
                                    </div>
                                </div>
                                <div className="card-body">
                                    <div className="row">
                                        <div className="col-md-6">
                                            <div className="table-responsive">
                                                <table className="table table-borderless mb-0">
                                                    <tbody>
                                                        <tr>
                                                            <td className="fw-medium">Sipariş No:</td>
                                                            <td>{purchaseOrder.order_number}</td>
                                                        </tr>
                                                        <tr>
                                                            <td className="fw-medium">Tedarikçi:</td>
                                                            <td>{purchaseOrder.supplier_name}</td>
                                                        </tr>
                                                        <tr>
                                                            <td className="fw-medium">İletişim:</td>
                                                            <td>{purchaseOrder.supplier_contact || '-'}</td>
                                                        </tr>
                                                        <tr>
                                                            <td className="fw-medium">Depo:</td>
                                                            <td>{purchaseOrder.warehouse.name} ({purchaseOrder.warehouse.code})</td>
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
                                                            <td className="fw-medium">Sipariş Tarihi:</td>
                                                            <td>{new Date(purchaseOrder.order_date).toLocaleDateString('tr-TR')}</td>
                                                        </tr>
                                                        <tr>
                                                            <td className="fw-medium">Beklenen Teslimat:</td>
                                                            <td>{new Date(purchaseOrder.expected_delivery_date).toLocaleDateString('tr-TR')}</td>
                                                        </tr>
                                                        <tr>
                                                            <td className="fw-medium">Teslim Tarihi:</td>
                                                            <td>
                                                                {purchaseOrder.delivery_date 
                                                                    ? new Date(purchaseOrder.delivery_date).toLocaleDateString('tr-TR')
                                                                    : '-'
                                                                }
                                                            </td>
                                                        </tr>
                                                        <tr>
                                                            <td className="fw-medium">Toplam Tutar:</td>
                                                            <td>
                                                                <span className="fw-semibold">
                                                                    ₺{purchaseOrder.total_amount?.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Notes */}
                                    {purchaseOrder.notes && (
                                        <div className="row mt-4">
                                            <div className="col-12">
                                                <h6 className="fw-semibold">Notlar</h6>
                                                <div className="alert alert-info">
                                                    {purchaseOrder.notes}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Items */}
                            <div className="card">
                                <div className="card-header">
                                    <h5 className="card-title mb-0">Sipariş Kalemleri</h5>
                                </div>
                                <div className="card-body">
                                    <div className="table-responsive">
                                        <table className="table table-nowrap table-striped mb-0">
                                            <thead className="table-light">
                                                <tr>
                                                    <th>Ürün Kodu</th>
                                                    <th>Ürün Adı</th>
                                                    <th>Sipariş</th>
                                                    <th>Teslim</th>
                                                    <th>Kalan</th>
                                                    <th>İlerleme</th>
                                                    <th>Birim Fiyat</th>
                                                    <th>Toplam</th>
                                                    <th>Barkod</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {purchaseOrder.items.map(item => {
                                                    const progress = getProgressPercentage(item.received_quantity, item.ordered_quantity);
                                                    const isCompleted = item.remaining_quantity === 0;
                                                    
                                                    return (
                                                        <tr key={item.id} className={isCompleted ? 'table-success' : ''}>
                                                            <td className="fw-medium">{item.item_code}</td>
                                                            <td>{item.item_name}</td>
                                                            <td className="text-center">{item.ordered_quantity}</td>
                                                            <td className="text-center">
                                                                <span className={isCompleted ? 'text-success fw-medium' : ''}>
                                                                    {item.received_quantity}
                                                                </span>
                                                            </td>
                                                            <td className="text-center">
                                                                <span className={item.remaining_quantity > 0 ? 'text-warning' : 'text-success'}>
                                                                    {item.remaining_quantity}
                                                                </span>
                                                            </td>
                                                            <td>
                                                                <div className="d-flex align-items-center">
                                                                    <div className="progress flex-fill me-2" style={{ height: '6px' }}>
                                                                        <div 
                                                                            className={`progress-bar ${progress === 100 ? 'bg-success' : 'bg-primary'}`}
                                                                            style={{ width: `${progress}%` }}
                                                                        ></div>
                                                                    </div>
                                                                    <span className="fs-12">{progress}%</span>
                                                                </div>
                                                            </td>
                                                            <td>₺{item.unit_price?.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</td>
                                                            <td>₺{item.total_price?.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</td>
                                                            <td>
                                                                {item.barcode ? (
                                                                    <span className="badge bg-light text-dark">{item.barcode}</span>
                                                                ) : (
                                                                    <span className="text-muted">-</span>
                                                                )}
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Statistics & Actions */}
                        <div className="col-lg-4">
                            <div className="card">
                                <div className="card-header">
                                    <h5 className="card-title mb-0">İstatistikler</h5>
                                </div>
                                <div className="card-body">
                                    <div className="row g-3">
                                        <div className="col-6">
                                            <div className="text-center">
                                                <h4 className="mb-1 text-primary">{purchaseOrder.items.length}</h4>
                                                <p className="text-muted mb-0 fs-13">Toplam Kalem</p>
                                            </div>
                                        </div>
                                        <div className="col-6">
                                            <div className="text-center">
                                                <h4 className="mb-1 text-success">{getTotalReceived()}</h4>
                                                <p className="text-muted mb-0 fs-13">Teslim Alınan</p>
                                            </div>
                                        </div>
                                        <div className="col-6">
                                            <div className="text-center">
                                                <h4 className="mb-1 text-warning">{getTotalOrdered() - getTotalReceived()}</h4>
                                                <p className="text-muted mb-0 fs-13">Bekleyen</p>
                                            </div>
                                        </div>
                                        <div className="col-6">
                                            <div className="text-center">
                                                <h4 className="mb-1 text-info">
                                                    ₺{getReceivedValue().toLocaleString('tr-TR', { maximumFractionDigits: 0 })}
                                                </h4>
                                                <p className="text-muted mb-0 fs-13">Teslim Değer</p>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="mt-4">
                                        <div className="d-flex align-items-center justify-content-between mb-2">
                                            <span className="fw-medium">Tamamlanma Oranı</span>
                                            <span className="fw-medium">
                                                {getProgressPercentage(getTotalReceived(), getTotalOrdered())}%
                                            </span>
                                        </div>
                                        <div className="progress" style={{ height: '8px' }}>
                                            <div 
                                                className={`progress-bar ${
                                                    getProgressPercentage(getTotalReceived(), getTotalOrdered()) === 100 ? 'bg-success' : 'bg-primary'
                                                }`}
                                                style={{ width: `${getProgressPercentage(getTotalReceived(), getTotalOrdered())}%` }}
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
                                        {purchaseOrder.status !== 'completed' && (
                                            <Link
                                                href={route('warehouses.receiving.process', purchaseOrder.id)}
                                                className="btn btn-primary"
                                            >
                                                <i className="ri-scanner-line me-1"></i>
                                                Teslim Alma İşlemi
                                            </Link>
                                        )}
                                        
                                        <Link
                                            href="/warehouses/receiving"
                                            className="btn btn-secondary"
                                        >
                                            <i className="ri-arrow-left-line me-1"></i>
                                            Geri Dön
                                        </Link>

                                        <button className="btn btn-outline-primary">
                                            <i className="ri-printer-line me-1"></i>
                                            Yazdır
                                        </button>

                                        <button className="btn btn-outline-success">
                                            <i className="ri-download-line me-1"></i>
                                            Excel Export
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Recent Activity */}
                            <div className="card">
                                <div className="card-header">
                                    <h5 className="card-title mb-0">Son İşlemler</h5>
                                </div>
                                <div className="card-body">
                                    <div className="timeline-sm">
                                        <div className="timeline-sm-item">
                                            <div className="timeline-sm-marker"></div>
                                            <div className="timeline-sm-content">
                                                <p className="timeline-sm-time">Bugün 14:30</p>
                                                <p className="timeline-sm-text">Sipariş oluşturuldu</p>
                                            </div>
                                        </div>
                                        <div className="timeline-sm-item">
                                            <div className="timeline-sm-marker bg-warning"></div>
                                            <div className="timeline-sm-content">
                                                <p className="timeline-sm-time">Bugün 15:45</p>
                                                <p className="timeline-sm-text">Teslim alma başlatıldı</p>
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