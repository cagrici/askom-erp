import React from 'react';
import { Head, Link } from '@inertiajs/react';
import Layout from '../../../Layouts';

interface Warehouse {
    id: number;
    name: string;
    code: string;
}

interface Zone {
    id: number;
    warehouse_id: number;
    name: string;
    code: string;
}

interface Location {
    id: number;
    warehouse_id: number;
    zone_id: number;
    code: string;
    location_code: string;
    aisle: string;
    rack: string;
    shelf: string;
    position: string;
    location_type: string;
    max_weight: string;
    max_volume: string;
    length: string;
    width: string;
    height: string;
    status: string;
    is_pickable: boolean;
    is_bulk_location: boolean;
    temperature_controlled: boolean;
    warehouse: Warehouse;
    zone: Zone;
    utilization_percentage?: number;
    stock_count?: number;
    created_at: string;
    updated_at: string;
}

interface Props {
    location: Location;
}

const Show: React.FC<Props> = ({ location }) => {
    const getStatusColor = (status: string) => {
        switch (status) {
            case 'available': return 'success';
            case 'occupied': return 'warning';
            case 'reserved': return 'info';
            case 'blocked': return 'danger';
            case 'maintenance': return 'secondary';
            default: return 'secondary';
        }
    };

    const getStatusText = (status: string) => {
        switch (status) {
            case 'available': return 'Müsait';
            case 'occupied': return 'Dolu';
            case 'reserved': return 'Rezerve';
            case 'blocked': return 'Bloklu';
            case 'maintenance': return 'Bakımda';
            default: return status;
        }
    };

    const getLocationTypeText = (type: string) => {
        switch (type) {
            case 'floor': return 'Zemin';
            case 'rack': return 'Raf';
            case 'shelf': return 'Şelf';
            case 'bin': return 'Kutu';
            case 'pallet': return 'Palet';
            case 'bulk': return 'Dökme';
            case 'special': return 'Özel';
            default: return type;
        }
    };

    return (
        <Layout>
            <Head title={`Lokasyon: ${location.location_code || location.code}`} />
            
            <div className="page-content">
                <div className="container-fluid">
                    {/* Page Title */}
                    <div className="row">
                        <div className="col-12">
                            <div className="page-title-box d-sm-flex align-items-center justify-content-between">
                                <h4 className="mb-sm-0">Lokasyon Detayları</h4>
                                <div className="page-title-right">
                                    <ol className="breadcrumb m-0">
                                        <li className="breadcrumb-item"><Link href="/warehouses">Depo Yönetimi</Link></li>
                                        <li className="breadcrumb-item"><Link href="/warehouses/locations">Lokasyonlar</Link></li>
                                        <li className="breadcrumb-item active">{location.location_code || location.code}</li>
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
                                        <h5 className="card-title mb-0 flex-grow-1">Lokasyon Bilgileri</h5>
                                        <div className="flex-shrink-0">
                                            <span className={`badge bg-${getStatusColor(location.status)} fs-12`}>
                                                {getStatusText(location.status)}
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
                                                            <td className="fw-medium text-muted">Lokasyon Kodu:</td>
                                                            <td>{location.location_code || location.code}</td>
                                                        </tr>
                                                        <tr>
                                                            <td className="fw-medium text-muted">Depo:</td>
                                                            <td>{location.warehouse?.name} ({location.warehouse?.code})</td>
                                                        </tr>
                                                        <tr>
                                                            <td className="fw-medium text-muted">Bölge:</td>
                                                            <td>{location.zone?.name} ({location.zone?.code})</td>
                                                        </tr>
                                                        <tr>
                                                            <td className="fw-medium text-muted">Lokasyon Tipi:</td>
                                                            <td>{getLocationTypeText(location.location_type)}</td>
                                                        </tr>
                                                        <tr>
                                                            <td className="fw-medium text-muted">Durum:</td>
                                                            <td>
                                                                <span className={`badge bg-${getStatusColor(location.status)}`}>
                                                                    {getStatusText(location.status)}
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
                                                            <td className="fw-medium text-muted">Koridor:</td>
                                                            <td>{location.aisle}</td>
                                                        </tr>
                                                        <tr>
                                                            <td className="fw-medium text-muted">Raf:</td>
                                                            <td>{location.rack}</td>
                                                        </tr>
                                                        <tr>
                                                            <td className="fw-medium text-muted">Şelf:</td>
                                                            <td>{location.shelf}</td>
                                                        </tr>
                                                        {location.position && (
                                                            <tr>
                                                                <td className="fw-medium text-muted">Pozisyon:</td>
                                                                <td>{location.position}</td>
                                                            </tr>
                                                        )}
                                                        <tr>
                                                            <td className="fw-medium text-muted">Stok Adedi:</td>
                                                            <td>{location.stock_count || 0}</td>
                                                        </tr>
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Physical Specifications */}
                            <div className="card">
                                <div className="card-header">
                                    <h5 className="card-title mb-0">Fiziksel Özellikler</h5>
                                </div>
                                <div className="card-body">
                                    <div className="row">
                                        <div className="col-lg-6">
                                            <div className="table-responsive">
                                                <table className="table table-borderless mb-0">
                                                    <tbody>
                                                        <tr>
                                                            <td className="fw-medium text-muted">Uzunluk:</td>
                                                            <td>{location.length ? `${location.length} cm` : '-'}</td>
                                                        </tr>
                                                        <tr>
                                                            <td className="fw-medium text-muted">Genişlik:</td>
                                                            <td>{location.width ? `${location.width} cm` : '-'}</td>
                                                        </tr>
                                                        <tr>
                                                            <td className="fw-medium text-muted">Yükseklik:</td>
                                                            <td>{location.height ? `${location.height} cm` : '-'}</td>
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
                                                            <td className="fw-medium text-muted">Maksimum Ağırlık:</td>
                                                            <td>{location.max_weight ? `${location.max_weight} kg` : '-'}</td>
                                                        </tr>
                                                        <tr>
                                                            <td className="fw-medium text-muted">Maksimum Hacim:</td>
                                                            <td>{location.max_volume ? `${location.max_volume} m³` : '-'}</td>
                                                        </tr>
                                                        <tr>
                                                            <td className="fw-medium text-muted">Kullanım Oranı:</td>
                                                            <td>
                                                                {location.utilization_percentage !== undefined ? (
                                                                    <div className="d-flex align-items-center">
                                                                        <div className="flex-grow-1">
                                                                            <div className="progress progress-sm">
                                                                                <div 
                                                                                    className={`progress-bar bg-${Number(location.utilization_percentage || 0) >= 90 ? 'danger' : Number(location.utilization_percentage || 0) >= 70 ? 'warning' : 'success'}`}
                                                                                    style={{ width: `${Number(location.utilization_percentage || 0)}%` }}
                                                                                ></div>
                                                                            </div>
                                                                        </div>
                                                                        <span className="ms-2 text-muted">
                                                                            {Number(location.utilization_percentage || 0).toFixed(1)}%
                                                                        </span>
                                                                    </div>
                                                                ) : '-'}
                                                            </td>
                                                        </tr>
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Sidebar - Properties and Actions */}
                        <div className="col-lg-4">
                            {/* Location Properties */}
                            <div className="card">
                                <div className="card-header">
                                    <h5 className="card-title mb-0">Lokasyon Özellikleri</h5>
                                </div>
                                <div className="card-body">
                                    <div className="d-flex align-items-center mb-3">
                                        <div className="flex-grow-1">
                                            <h6 className="mb-1">Toplanabilir Lokasyon</h6>
                                            <p className="text-muted mb-0">Bu lokasyondan malzeme toplanabilir mi?</p>
                                        </div>
                                        <div className="flex-shrink-0">
                                            {location.is_pickable ? (
                                                <span className="badge bg-success">Evet</span>
                                            ) : (
                                                <span className="badge bg-secondary">Hayır</span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="d-flex align-items-center mb-3">
                                        <div className="flex-grow-1">
                                            <h6 className="mb-1">Dökme Depolama</h6>
                                            <p className="text-muted mb-0">Dökme malzeme depolanabilir mi?</p>
                                        </div>
                                        <div className="flex-shrink-0">
                                            {location.is_bulk_location ? (
                                                <span className="badge bg-success">Evet</span>
                                            ) : (
                                                <span className="badge bg-secondary">Hayır</span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="d-flex align-items-center">
                                        <div className="flex-grow-1">
                                            <h6 className="mb-1">Sıcaklık Kontrollü</h6>
                                            <p className="text-muted mb-0">Sıcaklık kontrolü gerekir mi?</p>
                                        </div>
                                        <div className="flex-shrink-0">
                                            {location.temperature_controlled ? (
                                                <span className="badge bg-success">Evet</span>
                                            ) : (
                                                <span className="badge bg-secondary">Hayır</span>
                                            )}
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
                                            href={`/warehouses/locations/${location.id}/edit`}
                                            className="btn btn-primary"
                                        >
                                            <i className="ri-edit-line me-1"></i>
                                            Düzenle
                                        </Link>
                                        <Link
                                            href="/warehouses/locations"
                                            className="btn btn-secondary"
                                        >
                                            <i className="ri-arrow-left-line me-1"></i>
                                            Geri Dön
                                        </Link>
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
                                                    <td>{new Date(location.created_at).toLocaleDateString('tr-TR')}</td>
                                                </tr>
                                                <tr>
                                                    <td className="fw-medium text-muted">Son Güncelleme:</td>
                                                    <td>{new Date(location.updated_at).toLocaleDateString('tr-TR')}</td>
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