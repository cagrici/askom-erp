import React from 'react';
import { Head, Link } from '@inertiajs/react';
import Layout from '../../Layouts';

interface Warehouse {
    id: number;
    name: string;
    code: string;
    warehouse_type: string;
    address: string;
    city: string;
    postal_code: string;
    country: string;
    phone?: string;
    email?: string;
    manager_name?: string;
    capacity?: number;
    area_sqm?: number;
    status: string;
    description?: string;
    created_at: string;
}

interface Props {
    warehouse: Warehouse;
}

const Show: React.FC<Props> = ({ warehouse }) => {
    const getStatusBadge = (status: string) => {
        const badges: { [key: string]: string } = {
            'active': 'success',
            'inactive': 'secondary',
            'maintenance': 'warning',
            'closed': 'danger'
        };
        
        const labels: { [key: string]: string } = {
            'active': 'Aktif',
            'inactive': 'İnaktif', 
            'maintenance': 'Bakımda',
            'closed': 'Kapalı'
        };

        return (
            <span className={`badge bg-${badges[status] || 'secondary'} fs-12`}>
                {labels[status] || status}
            </span>
        );
    };

    const getWarehouseTypeText = (type: string) => {
        const types: { [key: string]: string } = {
            'distribution': 'Dağıtım',
            'storage': 'Depolama',
            'cross_dock': 'Cross Dock',
            'fulfillment': 'Fulfillment',
            'manufacturing': 'Üretim',
            'cold_storage': 'Soğuk Hava'
        };
        return types[type] || type;
    };

    return (
        <Layout>
            <Head title={`${warehouse.name} - Detay`} />
            
            <div className="page-content">
                <div className="container-fluid">
                    {/* Page Title */}
                    <div className="row">
                        <div className="col-12">
                            <div className="page-title-box d-sm-flex align-items-center justify-content-between">
                                <h4 className="mb-sm-0">Depo Detayı</h4>
                                <div className="page-title-right">
                                    <ol className="breadcrumb m-0">
                                        <li className="breadcrumb-item"><Link href="/warehouses">Depo Yönetimi</Link></li>
                                        <li className="breadcrumb-item active">Detay</li>
                                    </ol>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="row">
                        {/* Warehouse Information */}
                        <div className="col-lg-8">
                            <div className="card">
                                <div className="card-header">
                                    <div className="d-flex align-items-center justify-content-between">
                                        <h5 className="card-title mb-0">Depo Bilgileri</h5>
                                        {getStatusBadge(warehouse.status)}
                                    </div>
                                </div>
                                <div className="card-body">
                                    <div className="row">
                                        <div className="col-md-6">
                                            <div className="table-responsive">
                                                <table className="table table-borderless mb-0">
                                                    <tbody>
                                                        <tr>
                                                            <td className="fw-medium">Depo Adı:</td>
                                                            <td>{warehouse.name}</td>
                                                        </tr>
                                                        <tr>
                                                            <td className="fw-medium">Depo Kodu:</td>
                                                            <td>{warehouse.code}</td>
                                                        </tr>
                                                        <tr>
                                                            <td className="fw-medium">Depo Tipi:</td>
                                                            <td>{getWarehouseTypeText(warehouse.warehouse_type)}</td>
                                                        </tr>
                                                        <tr>
                                                            <td className="fw-medium">Müdür:</td>
                                                            <td>{warehouse.manager_name || '-'}</td>
                                                        </tr>
                                                        <tr>
                                                            <td className="fw-medium">Telefon:</td>
                                                            <td>{warehouse.phone || '-'}</td>
                                                        </tr>
                                                        <tr>
                                                            <td className="fw-medium">E-posta:</td>
                                                            <td>{warehouse.email || '-'}</td>
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
                                                            <td className="fw-medium">Adres:</td>
                                                            <td>{warehouse.address}</td>
                                                        </tr>
                                                        <tr>
                                                            <td className="fw-medium">Şehir:</td>
                                                            <td>{warehouse.city}</td>
                                                        </tr>
                                                        <tr>
                                                            <td className="fw-medium">Posta Kodu:</td>
                                                            <td>{warehouse.postal_code}</td>
                                                        </tr>
                                                        <tr>
                                                            <td className="fw-medium">Ülke:</td>
                                                            <td>{warehouse.country}</td>
                                                        </tr>
                                                        <tr>
                                                            <td className="fw-medium">Kapasite:</td>
                                                            <td>{warehouse.capacity ? `${warehouse.capacity.toLocaleString()} m³` : '-'}</td>
                                                        </tr>
                                                        <tr>
                                                            <td className="fw-medium">Alan:</td>
                                                            <td>{warehouse.area_sqm ? `${warehouse.area_sqm.toLocaleString()} m²` : '-'}</td>
                                                        </tr>
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Description */}
                                    {warehouse.description && (
                                        <div className="row mt-4">
                                            <div className="col-12">
                                                <h6 className="fw-semibold">Açıklama</h6>
                                                <p className="text-muted">{warehouse.description}</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Actions & Quick Stats */}
                        <div className="col-lg-4">
                            <div className="card">
                                <div className="card-header">
                                    <h5 className="card-title mb-0">İşlemler</h5>
                                </div>
                                <div className="card-body">
                                    <div className="d-grid gap-2">
                                        <Link
                                            href={route('warehouses.edit', warehouse.id)}
                                            className="btn btn-primary"
                                        >
                                            <i className="ri-edit-line me-1"></i>
                                            Düzenle
                                        </Link>
                                        
                                        <Link
                                            href={route('warehouses.locations.index')} 
                                            className="btn btn-success"
                                        >
                                            <i className="ri-map-pin-line me-1"></i>
                                            Lokasyonları Görüntüle
                                        </Link>

                                        <Link
                                            href={route('warehouses.zones.index')}
                                            className="btn btn-info"
                                        >
                                            <i className="ri-building-line me-1"></i>
                                            Zonları Görüntüle
                                        </Link>

                                        <Link
                                            href={route('warehouses.staff.index')}
                                            className="btn btn-warning"
                                        >
                                            <i className="ri-team-line me-1"></i>
                                            Personeli Görüntüle
                                        </Link>

                                        <Link
                                            href={route('warehouses.operations.index')}
                                            className="btn btn-secondary"
                                        >
                                            <i className="ri-tools-line me-1"></i>
                                            Operasyonları Görüntüle
                                        </Link>

                                        <Link
                                            href="/warehouses"
                                            className="btn btn-light"
                                        >
                                            <i className="ri-arrow-left-line me-1"></i>
                                            Geri Dön
                                        </Link>
                                    </div>
                                </div>
                            </div>

                            {/* Quick Info */}
                            <div className="card">
                                <div className="card-header">
                                    <h5 className="card-title mb-0">Hızlı Bilgi</h5>
                                </div>
                                <div className="card-body">
                                    <div className="row g-3">
                                        <div className="col-6">
                                            <div className="text-center">
                                                <h4 className="mb-1 text-primary">-</h4>
                                                <p className="text-muted mb-0 fs-13">Toplam Lokasyon</p>
                                            </div>
                                        </div>
                                        <div className="col-6">
                                            <div className="text-center">
                                                <h4 className="mb-1 text-success">-</h4>
                                                <p className="text-muted mb-0 fs-13">Aktif Zon</p>
                                            </div>
                                        </div>
                                        <div className="col-6">
                                            <div className="text-center">
                                                <h4 className="mb-1 text-info">-</h4>
                                                <p className="text-muted mb-0 fs-13">Personel Sayısı</p>
                                            </div>
                                        </div>
                                        <div className="col-6">
                                            <div className="text-center">
                                                <h4 className="mb-1 text-warning">-</h4>
                                                <p className="text-muted mb-0 fs-13">Aktif Operasyon</p>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="mt-4">
                                        <div className="d-flex align-items-center justify-content-between mb-2">
                                            <span className="fw-medium">Kapasite Kullanımı</span>
                                            <span className="fw-medium">-%</span>
                                        </div>
                                        <div className="progress" style={{ height: '8px' }}>
                                            <div className="progress-bar bg-primary" style={{ width: '0%' }}></div>
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