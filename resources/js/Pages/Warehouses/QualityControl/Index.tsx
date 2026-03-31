import React, { useState, useEffect } from 'react';
import { Head, Link } from '@inertiajs/react';
import Layout from '../../../Layouts';
import { initializeTableDropdowns, cleanupDropdowns } from '../../../utils/dropdownUtils';

interface QualityControlItem {
    id: number;
    item_code: string;
    item_name: string;
    batch_number?: string;
    received_quantity: number;
    received_date: string;
    status: 'pending' | 'approved' | 'rejected';
    inspector?: string;
    quality_notes?: string;
    damage_details?: string;
    priority: 'low' | 'medium' | 'high';
    warehouse: {
        name: string;
        code: string;
    };
    supplier_name: string;
    days_waiting: number;
}

interface Props {
    qualityControlItems: QualityControlItem[];
}

const Index: React.FC<Props> = ({ qualityControlItems }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [priorityFilter, setPriorityFilter] = useState('');

    useEffect(() => {
        // Initialize improved dropdown functionality
        initializeTableDropdowns();

        return () => {
            // Cleanup on unmount
            cleanupDropdowns();
        };
    }, []);

    const filteredItems = qualityControlItems.filter(item => {
        const matchesSearch = item.item_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            item.item_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            item.supplier_name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = !statusFilter || item.status === statusFilter;
        const matchesPriority = !priorityFilter || item.priority === priorityFilter;
        
        return matchesSearch && matchesStatus && matchesPriority;
    });

    const getStatusBadge = (status: string) => {
        const badges: { [key: string]: string } = {
            'pending': 'warning',
            'approved': 'success',
            'rejected': 'danger'
        };
        
        const labels: { [key: string]: string } = {
            'pending': 'Beklemede',
            'approved': 'Onaylandı',
            'rejected': 'Reddedildi'
        };

        return (
            <span className={`badge bg-${badges[status] || 'secondary'} fs-12`}>
                {labels[status] || status}
            </span>
        );
    };

    const getPriorityBadge = (priority: string) => {
        const badges: { [key: string]: string } = {
            'low': 'info',
            'medium': 'warning',
            'high': 'danger'
        };
        
        const labels: { [key: string]: string } = {
            'low': 'Düşük',
            'medium': 'Orta',
            'high': 'Yüksek'
        };

        return (
            <span className={`badge bg-${badges[priority] || 'secondary'} fs-12`}>
                {labels[priority] || priority}
            </span>
        );
    };

    return (
        <Layout>
            <Head title="Kalite Kontrol Dashboard" />
            
            <div className="page-content">
                <div className="container-fluid">
                    {/* Page Title */}
                    <div className="row">
                        <div className="col-12">
                            <div className="page-title-box d-sm-flex align-items-center justify-content-between">
                                <h4 className="mb-sm-0">Kalite Kontrol Dashboard</h4>
                                <div className="page-title-right">
                                    <ol className="breadcrumb m-0">
                                        <li className="breadcrumb-item"><Link href="/warehouses">Depo Yönetimi</Link></li>
                                        <li className="breadcrumb-item active">Kalite Kontrol</li>
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
                                            <p className="text-uppercase fw-medium text-muted text-truncate mb-0">Bekleyen Kontroller</p>
                                        </div>
                                        <div className="flex-shrink-0">
                                            <h5 className="text-warning mb-0">
                                                {qualityControlItems.filter(item => item.status === 'pending').length}
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
                                            <p className="text-uppercase fw-medium text-muted text-truncate mb-0">Onaylanan</p>
                                        </div>
                                        <div className="flex-shrink-0">
                                            <h5 className="text-success mb-0">
                                                {qualityControlItems.filter(item => item.status === 'approved').length}
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
                                            <p className="text-uppercase fw-medium text-muted text-truncate mb-0">Reddedilen</p>
                                        </div>
                                        <div className="flex-shrink-0">
                                            <h5 className="text-danger mb-0">
                                                {qualityControlItems.filter(item => item.status === 'rejected').length}
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
                                            <p className="text-uppercase fw-medium text-muted text-truncate mb-0">Yüksek Öncelik</p>
                                        </div>
                                        <div className="flex-shrink-0">
                                            <h5 className="text-info mb-0">
                                                {qualityControlItems.filter(item => item.priority === 'high' && item.status === 'pending').length}
                                            </h5>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Filters and List */}
                    <div className="row">
                        <div className="col-lg-12">
                            <div className="card">
                                <div className="card-header">
                                    <div className="row align-items-center">
                                        <div className="col-md-4">
                                            <h5 className="card-title mb-0">Kalite Kontrol Listesi</h5>
                                        </div>
                                        <div className="col-md-8">
                                            <div className="row g-2">
                                                <div className="col-md-4">
                                                    <input
                                                        type="text"
                                                        className="form-control"
                                                        placeholder="Ürün veya tedarikçi ara..."
                                                        value={searchTerm}
                                                        onChange={(e) => setSearchTerm(e.target.value)}
                                                    />
                                                </div>
                                                <div className="col-md-4">
                                                    <select
                                                        className="form-select"
                                                        value={statusFilter}
                                                        onChange={(e) => setStatusFilter(e.target.value)}
                                                    >
                                                        <option value="">Tüm Durumlar</option>
                                                        <option value="pending">Beklemede</option>
                                                        <option value="approved">Onaylandı</option>
                                                        <option value="rejected">Reddedildi</option>
                                                    </select>
                                                </div>
                                                <div className="col-md-4">
                                                    <select
                                                        className="form-select"
                                                        value={priorityFilter}
                                                        onChange={(e) => setPriorityFilter(e.target.value)}
                                                    >
                                                        <option value="">Tüm Öncelikler</option>
                                                        <option value="high">Yüksek</option>
                                                        <option value="medium">Orta</option>
                                                        <option value="low">Düşük</option>
                                                    </select>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="card-body">
                                    {filteredItems.length > 0 ? (
                                        <div className="table-responsive">
                                            <table className="table table-nowrap table-striped-columns mb-0">
                                                <thead className="table-light">
                                                    <tr>
                                                        <th>Ürün</th>
                                                        <th>Tedarikçi</th>
                                                        <th>Lot/Seri</th>
                                                        <th>Miktar</th>
                                                        <th>Beklenme</th>
                                                        <th>Öncelik</th>
                                                        <th>Durum</th>
                                                        <th>İşlemler</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {filteredItems.map(item => (
                                                        <tr key={item.id} className={item.priority === 'high' ? 'table-warning' : ''}>
                                                            <td>
                                                                <div className="fw-medium">{item.item_name}</div>
                                                                <small className="text-muted">{item.item_code}</small>
                                                            </td>
                                                            <td>{item.supplier_name}</td>
                                                            <td>
                                                                {item.batch_number ? (
                                                                    <span className="badge bg-light text-dark">{item.batch_number}</span>
                                                                ) : (
                                                                    <span className="text-muted">-</span>
                                                                )}
                                                            </td>
                                                            <td className="text-center">{item.received_quantity}</td>
                                                            <td>
                                                                <span className={`badge ${item.days_waiting > 2 ? 'bg-danger' : item.days_waiting > 1 ? 'bg-warning' : 'bg-info'}`}>
                                                                    {item.days_waiting} gün
                                                                </span>
                                                            </td>
                                                            <td>{getPriorityBadge(item.priority)}</td>
                                                            <td>{getStatusBadge(item.status)}</td>
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
                                                                                href={route('warehouses.quality-control.show', item.id)}
                                                                            >
                                                                                <i className="ri-eye-fill align-bottom me-2 text-muted"></i> Detay
                                                                            </Link>
                                                                        </li>
                                                                        {item.status === 'pending' && (
                                                                            <>
                                                                                <li>
                                                                                    <Link
                                                                                        className="dropdown-item text-success"
                                                                                        href={route('warehouses.quality-control.approve', item.id)}
                                                                                    >
                                                                                        <i className="ri-check-line align-bottom me-2 text-success"></i> Onayla
                                                                                    </Link>
                                                                                </li>
                                                                                <li>
                                                                                    <Link
                                                                                        className="dropdown-item text-danger"
                                                                                        href={route('warehouses.quality-control.reject', item.id)}
                                                                                    >
                                                                                        <i className="ri-close-line align-bottom me-2 text-danger"></i> Reddet
                                                                                    </Link>
                                                                                </li>
                                                                            </>
                                                                        )}
                                                                    </ul>
                                                                </div>
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
                                                    <i className="ri-shield-check-line"></i>
                                                </div>
                                            </div>
                                            <h5 className="fs-16">Kalite kontrol bekleyen ürün bulunamadı</h5>
                                            <p className="text-muted mb-0">Tüm ürünler kontrol edilmiş veya arama kriterlerinizi değiştirin.</p>
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