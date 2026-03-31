import React from 'react';
import { Head, Link } from '@inertiajs/react';
import Layout from '../../../Layouts';

interface Warehouse {
    id: number;
    name: string;
    code: string;
}

interface Location {
    id: number;
    code: string;
    location_code: string;
    aisle: string;
    rack: string;
    shelf: string;
    status: string;
    location_type: string;
    inventoryStocks?: any[];
}

interface Zone {
    id: number;
    warehouse_id: number;
    name: string;
    code: string;
    zone_type: string;
    description?: string;
    max_locations?: number;
    temperature_controlled: boolean;
    min_temperature?: number;
    max_temperature?: number;
    status: string;
    locations_count: number;
    location_utilization: number;
    warehouse: Warehouse;
    locations?: Location[];
    created_at: string;
    updated_at: string;
}

interface Props {
    zone: Zone;
}

const Show: React.FC<Props> = ({ zone }) => {
    const getStatusColor = (status: string) => {
        switch (status) {
            case 'active': return 'success';
            case 'inactive': return 'secondary';
            case 'maintenance': return 'warning';
            default: return 'secondary';
        }
    };

    const getStatusText = (status: string) => {
        switch (status) {
            case 'active': return 'Aktif';
            case 'inactive': return 'Pasif';
            case 'maintenance': return 'Bakımda';
            default: return status;
        }
    };

    const getZoneTypeText = (type: string) => {
        switch (type) {
            case 'receiving': return 'Mal Kabul';
            case 'storage': return 'Depolama';
            case 'picking': return 'Toplama';
            case 'packing': return 'Paketleme';
            case 'shipping': return 'Sevkiyat';
            case 'quarantine': return 'Karantina';
            case 'returns': return 'İadeler';
            default: return type;
        }
    };

    const getLocationStatusColor = (status: string) => {
        switch (status) {
            case 'available': return 'success';
            case 'occupied': return 'warning';
            case 'reserved': return 'info';
            case 'blocked': return 'danger';
            case 'maintenance': return 'secondary';
            default: return 'secondary';
        }
    };

    return (
        <Layout>
            <Head title={`Bölge: ${zone.name}`} />
            
            <div className="page-content">
                <div className="container-fluid">
                    {/* Page Title */}
                    <div className="row">
                        <div className="col-12">
                            <div className="page-title-box d-sm-flex align-items-center justify-content-between">
                                <h4 className="mb-sm-0">Bölge Detayları</h4>
                                <div className="page-title-right">
                                    <ol className="breadcrumb m-0">
                                        <li className="breadcrumb-item"><Link href="/warehouses">Depo Yönetimi</Link></li>
                                        <li className="breadcrumb-item"><Link href="/warehouses/zones">Bölgeler</Link></li>
                                        <li className="breadcrumb-item active">{zone.name}</li>
                                    </ol>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="row">
                        {/* Basic Information */}
                        <div className="col-lg-8">
                            <div className="card">
                                <div className="card-header">
                                    <div className="d-flex align-items-center">
                                        <h5 className="card-title mb-0 flex-grow-1">Bölge Bilgileri</h5>
                                        <div className="flex-shrink-0">
                                            <span className={`badge bg-${getStatusColor(zone.status)} fs-12`}>
                                                {getStatusText(zone.status)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className="card-body">
                                    <div className="row">
                                        <div className="col-lg-6">
                                            <div className="table-responsive">
                                                <table className="table table-borderless mb-0">
                                                    <tbody>
                                                        <tr>
                                                            <td className="fw-medium text-muted">Bölge Adı:</td>
                                                            <td>{zone.name}</td>
                                                        </tr>
                                                        <tr>
                                                            <td className="fw-medium text-muted">Bölge Kodu:</td>
                                                            <td>{zone.code}</td>
                                                        </tr>
                                                        <tr>
                                                            <td className="fw-medium text-muted">Depo:</td>
                                                            <td>{zone.warehouse?.name} ({zone.warehouse?.code})</td>
                                                        </tr>
                                                        <tr>
                                                            <td className="fw-medium text-muted">Bölge Tipi:</td>
                                                            <td>{getZoneTypeText(zone.zone_type)}</td>
                                                        </tr>
                                                        <tr>
                                                            <td className="fw-medium text-muted">Durum:</td>
                                                            <td>
                                                                <span className={`badge bg-${getStatusColor(zone.status)}`}>
                                                                    {getStatusText(zone.status)}
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                        <div className="col-lg-6">
                                            <div className="table-responsive">
                                                <table className="table table-borderless mb-0">
                                                    <tbody>
                                                        <tr>
                                                            <td className="fw-medium text-muted">Lokasyon Sayısı:</td>
                                                            <td>{zone.locations_count || 0}</td>
                                                        </tr>
                                                        <tr>
                                                            <td className="fw-medium text-muted">Maksimum Lokasyon:</td>
                                                            <td>{zone.max_locations || 'Sınırsız'}</td>
                                                        </tr>
                                                        <tr>
                                                            <td className="fw-medium text-muted">Kullanım Oranı:</td>
                                                            <td>
                                                                <div className="d-flex align-items-center">
                                                                    <div className="flex-grow-1">
                                                                        <div className="progress progress-sm">
                                                                            <div 
                                                                                className={`progress-bar bg-${Number(zone.location_utilization || 0) >= 90 ? 'danger' : Number(zone.location_utilization || 0) >= 70 ? 'warning' : 'success'}`}
                                                                                style={{ width: `${Number(zone.location_utilization || 0)}%` }}
                                                                            ></div>
                                                                        </div>
                                                                    </div>
                                                                    <span className="ms-2 text-muted">
                                                                        {Number(zone.location_utilization || 0).toFixed(1)}%
                                                                    </span>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                        <tr>
                                                            <td className="fw-medium text-muted">Sıcaklık Kontrollü:</td>
                                                            <td>
                                                                {zone.temperature_controlled ? (
                                                                    <span className="badge bg-success">Evet</span>
                                                                ) : (
                                                                    <span className="badge bg-secondary">Hayır</span>
                                                                )}
                                                            </td>
                                                        </tr>
                                                        {zone.temperature_controlled && (
                                                            <tr>
                                                                <td className="fw-medium text-muted">Sıcaklık Aralığı:</td>
                                                                <td>
                                                                    {zone.min_temperature !== undefined && zone.max_temperature !== undefined ? 
                                                                        `${zone.min_temperature}°C - ${zone.max_temperature}°C` : 
                                                                        'Belirtilmemiş'
                                                                    }
                                                                </td>
                                                            </tr>
                                                        )}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    </div>

                                    {zone.description && (
                                        <div className="row mt-3">
                                            <div className="col-12">
                                                <h6 className="fw-medium text-muted mb-2">Açıklama:</h6>
                                                <p className="text-muted mb-0">{zone.description}</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Locations */}
                            {zone.locations && zone.locations.length > 0 && (
                                <div className="card">
                                    <div className="card-header">
                                        <h5 className="card-title mb-0">Lokasyonlar ({zone.locations.length})</h5>
                                    </div>
                                    <div className="card-body">
                                        <div className="table-responsive">
                                            <table className="table table-nowrap align-middle">
                                                <thead>
                                                    <tr>
                                                        <th>Lokasyon Kodu</th>
                                                        <th>Pozisyon</th>
                                                        <th>Tip</th>
                                                        <th>Durum</th>
                                                        <th>Stok</th>
                                                        <th>İşlemler</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {zone.locations.map(location => (
                                                        <tr key={location.id}>
                                                            <td>
                                                                <Link 
                                                                    href={`/warehouses/locations/${location.id}`}
                                                                    className="fw-medium"
                                                                >
                                                                    {location.location_code || location.code}
                                                                </Link>
                                                            </td>
                                                            <td>
                                                                {location.aisle}-{location.rack}-{location.shelf}
                                                            </td>
                                                            <td>
                                                                <span className="badge bg-info">
                                                                    {location.location_type}
                                                                </span>
                                                            </td>
                                                            <td>
                                                                <span className={`badge bg-${getLocationStatusColor(location.status)}`}>
                                                                    {location.status}
                                                                </span>
                                                            </td>
                                                            <td>
                                                                {location.inventoryStocks?.length || 0}
                                                            </td>
                                                            <td>
                                                                <Link 
                                                                    href={`/warehouses/locations/${location.id}`}
                                                                    className="btn btn-sm btn-outline-primary"
                                                                >
                                                                    Görüntüle
                                                                </Link>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Sidebar - Actions and Info */}
                        <div className="col-lg-4">
                            {/* Actions */}
                            <div className="card">
                                <div className="card-header">
                                    <h5 className="card-title mb-0">İşlemler</h5>
                                </div>
                                <div className="card-body">
                                    <div className="d-grid gap-2">
                                        <Link
                                            href={`/warehouses/zones/${zone.id}/edit`}
                                            className="btn btn-primary"
                                        >
                                            <i className="ri-edit-line me-1"></i>
                                            Düzenle
                                        </Link>
                                        <Link
                                            href="/warehouses/locations/create"
                                            className="btn btn-success"
                                        >
                                            <i className="ri-add-line me-1"></i>
                                            Yeni Lokasyon Ekle
                                        </Link>
                                        <Link
                                            href="/warehouses/zones"
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
                                    <div className="d-flex align-items-center mb-3">
                                        <div className="avatar-sm flex-shrink-0">
                                            <span className="avatar-title bg-light text-primary rounded-circle fs-3">
                                                <i className="ri-map-pin-line"></i>
                                            </span>
                                        </div>
                                        <div className="flex-grow-1 ms-3">
                                            <h6 className="mb-0">{zone.locations_count || 0}</h6>
                                            <p className="text-muted mb-0">Toplam Lokasyon</p>
                                        </div>
                                    </div>
                                    <div className="d-flex align-items-center mb-3">
                                        <div className="avatar-sm flex-shrink-0">
                                            <span className="avatar-title bg-light text-success rounded-circle fs-3">
                                                <i className="ri-check-line"></i>
                                            </span>
                                        </div>
                                        <div className="flex-grow-1 ms-3">
                                            <h6 className="mb-0">
                                                {zone.locations?.filter(l => l.status === 'available').length || 0}
                                            </h6>
                                            <p className="text-muted mb-0">Müsait Lokasyon</p>
                                        </div>
                                    </div>
                                    <div className="d-flex align-items-center">
                                        <div className="avatar-sm flex-shrink-0">
                                            <span className="avatar-title bg-light text-warning rounded-circle fs-3">
                                                <i className="ri-package-line"></i>
                                            </span>
                                        </div>
                                        <div className="flex-grow-1 ms-3">
                                            <h6 className="mb-0">
                                                {zone.locations?.filter(l => l.status === 'occupied').length || 0}
                                            </h6>
                                            <p className="text-muted mb-0">Dolu Lokasyon</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Creation Info */}
                            <div className="card">
                                <div className="card-header">
                                    <h5 className="card-title mb-0">Kayıt Bilgileri</h5>
                                </div>
                                <div className="card-body">
                                    <div className="table-responsive">
                                        <table className="table table-borderless mb-0">
                                            <tbody>
                                                <tr>
                                                    <td className="fw-medium text-muted">Oluşturulma:</td>
                                                    <td>{new Date(zone.created_at).toLocaleDateString('tr-TR')}</td>
                                                </tr>
                                                <tr>
                                                    <td className="fw-medium text-muted">Son Güncelleme:</td>
                                                    <td>{new Date(zone.updated_at).toLocaleDateString('tr-TR')}</td>
                                                </tr>
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

export default Show;