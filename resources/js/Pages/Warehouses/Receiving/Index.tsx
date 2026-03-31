import React, { useState, useEffect } from 'react';
import { Head, Link } from '@inertiajs/react';
import Layout from '../../../Layouts';
import { initializeTableDropdowns, cleanupDropdowns } from '../../../utils/dropdownUtils';

interface PurchaseOrder {
    id: number;
    order_number: string;
    supplier_name: string;
    order_date: string;
    expected_delivery_date: string;
    status: string;
    total_items: number;
    received_items: number;
    warehouse_id: number;
    warehouse: {
        name: string;
        code: string;
    };
}

interface Props {
    purchaseOrders: PurchaseOrder[];
}

const Index: React.FC<Props> = ({ purchaseOrders }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('');

    useEffect(() => {
        // Initialize improved dropdown functionality
        initializeTableDropdowns();

        return () => {
            // Cleanup on unmount
            cleanupDropdowns();
        };
    }, []);

    const filteredOrders = purchaseOrders.filter(order => {
        const matchesSearch = order.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            order.supplier_name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = !statusFilter || order.status === statusFilter;
        
        return matchesSearch && matchesStatus;
    });

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

    const getProgressPercentage = (received: number, total: number): number => {
        return total > 0 ? Math.round((received / total) * 100) : 0;
    };

    return (
        <Layout>
            <Head title="Mal Kabul İşlemleri" />
            
            <div className="page-content">
                <div className="container-fluid">
                    {/* Page Title */}
                    <div className="row">
                        <div className="col-12">
                            <div className="page-title-box d-sm-flex align-items-center justify-content-between">
                                <h4 className="mb-sm-0">Mal Kabul İşlemleri</h4>
                                <div className="page-title-right">
                                    <ol className="breadcrumb m-0">
                                        <li className="breadcrumb-item"><Link href="/warehouses">Depo Yönetimi</Link></li>
                                        <li className="breadcrumb-item active">Mal Kabul</li>
                                    </ol>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Stats Cards */}
                    <div className="row">
                        <div className="col-xl-3 col-md-6">
                            <div className="card card-animate">
                                <div className="card-body">
                                    <div className="d-flex align-items-center">
                                        <div className="flex-grow-1 overflow-hidden">
                                            <p className="text-uppercase fw-medium text-muted text-truncate mb-0">Bekleyen Siparişler</p>
                                        </div>
                                        <div className="flex-shrink-0">
                                            <h5 className="text-warning mb-0">
                                                {purchaseOrders.filter(o => o.status === 'pending').length}
                                            </h5>
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
                                            <p className="text-uppercase fw-medium text-muted text-truncate mb-0">Kısmi Teslim</p>
                                        </div>
                                        <div className="flex-shrink-0">
                                            <h5 className="text-info mb-0">
                                                {purchaseOrders.filter(o => o.status === 'partial').length}
                                            </h5>
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
                                            <p className="text-uppercase fw-medium text-muted text-truncate mb-0">Tamamlanan</p>
                                        </div>
                                        <div className="flex-shrink-0">
                                            <h5 className="text-success mb-0">
                                                {purchaseOrders.filter(o => o.status === 'completed').length}
                                            </h5>
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
                                            <p className="text-uppercase fw-medium text-muted text-truncate mb-0">Toplam Sipariş</p>
                                        </div>
                                        <div className="flex-shrink-0">
                                            <h5 className="text-primary mb-0">{purchaseOrders.length}</h5>
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
                                    <div className="row align-items-center">
                                        <div className="col-md-6">
                                            <h5 className="card-title mb-0">Gelen Siparişler</h5>
                                        </div>
                                        <div className="col-md-6">
                                            <div className="row g-2">
                                                <div className="col-md-6">
                                                    <input
                                                        type="text"
                                                        className="form-control"
                                                        placeholder="Sipariş No veya Tedarikçi Ara..."
                                                        value={searchTerm}
                                                        onChange={(e) => setSearchTerm(e.target.value)}
                                                    />
                                                </div>
                                                <div className="col-md-6">
                                                    <select
                                                        className="form-select"
                                                        value={statusFilter}
                                                        onChange={(e) => setStatusFilter(e.target.value)}
                                                    >
                                                        <option value="">Tüm Durumlar</option>
                                                        <option value="pending">Beklemede</option>
                                                        <option value="partial">Kısmi Teslim</option>
                                                        <option value="completed">Tamamlandı</option>
                                                        <option value="cancelled">İptal</option>
                                                    </select>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="card-body">
                                    {filteredOrders.length > 0 ? (
                                        <div className="table-responsive">
                                            <table className="table table-nowrap table-striped-columns mb-0">
                                                <thead className="table-light">
                                                    <tr>
                                                        <th>Sipariş No</th>
                                                        <th>Tedarikçi</th>
                                                        <th>Depo</th>
                                                        <th>Sipariş Tarihi</th>
                                                        <th>Beklenen Teslimat</th>
                                                        <th>İlerleme</th>
                                                        <th>Durum</th>
                                                        <th>İşlemler</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {filteredOrders.map(order => {
                                                        const progress = getProgressPercentage(order.received_items, order.total_items);
                                                        
                                                        return (
                                                            <tr key={order.id}>
                                                                <td>
                                                                    <Link
                                                                        href={route('warehouses.receiving.show', order.id)}
                                                                        className="fw-medium link-primary"
                                                                    >
                                                                        {order.order_number}
                                                                    </Link>
                                                                </td>
                                                                <td>{order.supplier_name}</td>
                                                                <td>
                                                                    <span className="badge bg-light text-dark">
                                                                        {order.warehouse.name}
                                                                    </span>
                                                                </td>
                                                                <td>{new Date(order.order_date).toLocaleDateString('tr-TR')}</td>
                                                                <td>{new Date(order.expected_delivery_date).toLocaleDateString('tr-TR')}</td>
                                                                <td>
                                                                    <div className="d-flex align-items-center">
                                                                        <div className="progress flex-fill me-2" style={{ height: '6px' }}>
                                                                            <div 
                                                                                className={`progress-bar ${progress === 100 ? 'bg-success' : 'bg-primary'}`}
                                                                                style={{ width: `${progress}%` }}
                                                                            ></div>
                                                                        </div>
                                                                        <span className="fs-12">{order.received_items}/{order.total_items}</span>
                                                                    </div>
                                                                </td>
                                                                <td>{getStatusBadge(order.status)}</td>
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
                                                                                    href={route('warehouses.receiving.show', order.id)}
                                                                                >
                                                                                    <i className="ri-eye-fill align-bottom me-2 text-muted"></i> Detay
                                                                                </Link>
                                                                            </li>
                                                                            {order.status !== 'completed' && (
                                                                                <li>
                                                                                    <Link
                                                                                        className="dropdown-item"
                                                                                        href={route('warehouses.receiving.process', order.id)}
                                                                                    >
                                                                                        <i className="ri-scanner-line align-bottom me-2 text-muted"></i> Teslim Al
                                                                                    </Link>
                                                                                </li>
                                                                            )}
                                                                        </ul>
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>
                                    ) : (
                                        <div className="text-center py-4">
                                            <div className="avatar-md mx-auto mb-4">
                                                <div className="avatar-title bg-light text-primary rounded-circle fs-24">
                                                    <i className="ri-truck-line"></i>
                                                </div>
                                            </div>
                                            <h5 className="fs-16">Gösterilecek sipariş bulunamadı</h5>
                                            <p className="text-muted mb-0">Arama kriterlerinizi değiştirmeyi deneyin.</p>
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