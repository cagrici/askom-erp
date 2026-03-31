import React, { useState } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import Layout from '../../../Layouts';

interface PutawayItem {
    id: number;
    item_code: string;
    item_name: string;
    category: string;
    quantity: number;
    unit: string;
    batch_number?: string;
    received_date: string;
    quality_status: 'approved' | 'pending' | 'rejected';
    current_location?: {
        id: number;
        code: string;
        name: string;
        zone: string;
        zone_type: string;
        coordinates?: {
            x: number;
            y: number;
            level: number;
        };
    };
    suggested_locations: SuggestedLocation[];
    priority: 'low' | 'medium' | 'high';
    warehouse: {
        id: number;
        name: string;
        code: string;
    };
    dimensions?: {
        length: number;
        width: number;
        height: number;
        weight: number;
    };
    storage_requirements: string[];
    supplier_name: string;
    value: number;
}

interface SuggestedLocation {
    location_id: number;
    location_code: string;
    location_name: string;
    zone_name: string;
    zone_type: string;
    compatibility_score: number;
    distance_score: number;
    capacity_utilization: number;
    available_capacity: number;
    reasons: string[];
    warnings?: string[];
    coordinates?: {
        x: number;
        y: number;
        level: number;
    };
    estimated_time: number; // dakika
}

interface Props {
    putawayItem: PutawayItem;
}

const Show: React.FC<Props> = ({ putawayItem }) => {
    const [selectedLocation, setSelectedLocation] = useState<number | null>(null);
    const { post, processing } = useForm();

    const handleAssignLocation = (locationId: number) => {
        post(route('warehouses.putaway.assign', [putawayItem.id, locationId]));
    };

    const getScoreColor = (score: number): string => {
        if (score >= 80) return 'success';
        if (score >= 60) return 'warning';
        return 'danger';
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
            <span className={`badge bg-${badges[priority]} fs-12`}>
                {labels[priority]}
            </span>
        );
    };

    return (
        <Layout>
            <Head title={`${putawayItem.item_name} - Yerleştirme Detayı`} />
            
            <div className="page-content">
                <div className="container-fluid">
                    {/* Page Title */}
                    <div className="row">
                        <div className="col-12">
                            <div className="page-title-box d-sm-flex align-items-center justify-content-between">
                                <h4 className="mb-sm-0">Yerleştirme Detayı</h4>
                                <div className="page-title-right">
                                    <ol className="breadcrumb m-0">
                                        <li className="breadcrumb-item"><Link href="/warehouses">Depo Yönetimi</Link></li>
                                        <li className="breadcrumb-item"><Link href="/warehouses/putaway">Yerleştirme</Link></li>
                                        <li className="breadcrumb-item active">Detay</li>
                                    </ol>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="row">
                        {/* Item Information */}
                        <div className="col-lg-4">
                            <div className="card">
                                <div className="card-header">
                                    <h5 className="card-title mb-0">Ürün Bilgileri</h5>
                                </div>
                                <div className="card-body">
                                    <div className="table-responsive">
                                        <table className="table table-borderless mb-0">
                                            <tbody>
                                                <tr>
                                                    <td className="fw-medium">Ürün Adı:</td>
                                                    <td>{putawayItem.item_name}</td>
                                                </tr>
                                                <tr>
                                                    <td className="fw-medium">Ürün Kodu:</td>
                                                    <td>{putawayItem.item_code}</td>
                                                </tr>
                                                <tr>
                                                    <td className="fw-medium">Kategori:</td>
                                                    <td>{putawayItem.category}</td>
                                                </tr>
                                                <tr>
                                                    <td className="fw-medium">Miktar:</td>
                                                    <td><strong>{putawayItem.quantity} {putawayItem.unit}</strong></td>
                                                </tr>
                                                <tr>
                                                    <td className="fw-medium">Lot/Seri:</td>
                                                    <td>{putawayItem.batch_number || '-'}</td>
                                                </tr>
                                                <tr>
                                                    <td className="fw-medium">Tedarikçi:</td>
                                                    <td>{putawayItem.supplier_name}</td>
                                                </tr>
                                                <tr>
                                                    <td className="fw-medium">Değer:</td>
                                                    <td>₺{putawayItem.value.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</td>
                                                </tr>
                                                <tr>
                                                    <td className="fw-medium">Öncelik:</td>
                                                    <td>{getPriorityBadge(putawayItem.priority)}</td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>

                                    {/* Dimensions */}
                                    {putawayItem.dimensions && (
                                        <div className="mt-4">
                                            <h6 className="fw-semibold">Boyutlar</h6>
                                            <div className="row g-2">
                                                <div className="col-6">
                                                    <div className="text-center p-2 border rounded">
                                                        <div className="fs-14 fw-medium">{putawayItem.dimensions.length}cm</div>
                                                        <small className="text-muted">Uzunluk</small>
                                                    </div>
                                                </div>
                                                <div className="col-6">
                                                    <div className="text-center p-2 border rounded">
                                                        <div className="fs-14 fw-medium">{putawayItem.dimensions.width}cm</div>
                                                        <small className="text-muted">Genişlik</small>
                                                    </div>
                                                </div>
                                                <div className="col-6">
                                                    <div className="text-center p-2 border rounded">
                                                        <div className="fs-14 fw-medium">{putawayItem.dimensions.height}cm</div>
                                                        <small className="text-muted">Yükseklik</small>
                                                    </div>
                                                </div>
                                                <div className="col-6">
                                                    <div className="text-center p-2 border rounded">
                                                        <div className="fs-14 fw-medium">{putawayItem.dimensions.weight}kg</div>
                                                        <small className="text-muted">Ağırlık</small>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Storage Requirements */}
                                    <div className="mt-4">
                                        <h6 className="fw-semibold">Depolama Gereksinimleri</h6>
                                        <div className="d-flex flex-wrap gap-1">
                                            {putawayItem.storage_requirements.map((requirement, index) => (
                                                <span key={index} className="badge bg-light text-dark">{requirement}</span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Current Location */}
                            <div className="card">
                                <div className="card-header">
                                    <h5 className="card-title mb-0">Mevcut Durum</h5>
                                </div>
                                <div className="card-body">
                                    {putawayItem.current_location ? (
                                        <div className="alert alert-success">
                                            <h6 className="alert-heading">Yerleştirilmiş</h6>
                                            <p className="mb-2">
                                                <strong>Konum:</strong> {putawayItem.current_location.code}<br />
                                                <strong>Bölge:</strong> {putawayItem.current_location.zone}<br />
                                                <strong>Tip:</strong> {putawayItem.current_location.zone_type}
                                            </p>
                                            {putawayItem.current_location.coordinates && (
                                                <small className="text-muted">
                                                    Koordinat: X:{putawayItem.current_location.coordinates.x}, 
                                                    Y:{putawayItem.current_location.coordinates.y}, 
                                                    Seviye:{putawayItem.current_location.coordinates.level}
                                                </small>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="alert alert-warning">
                                            <h6 className="alert-heading">Yerleştirme Bekliyor</h6>
                                            <p className="mb-0">Bu ürün henüz bir konuma yerleştirilmemiş.</p>
                                            <small className="text-muted">
                                                Teslim Tarihi: {new Date(putawayItem.received_date).toLocaleDateString('tr-TR')}
                                            </small>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Location Suggestions */}
                        <div className="col-lg-8">
                            <div className="card">
                                <div className="card-header">
                                    <div className="d-flex align-items-center justify-content-between">
                                        <h5 className="card-title mb-0">Önerilen Lokasyonlar</h5>
                                        <button 
                                            className="btn btn-sm btn-outline-primary"
                                            onClick={() => window.location.reload()}
                                        >
                                            <i className="ri-refresh-line me-1"></i>
                                            Yenile
                                        </button>
                                    </div>
                                </div>
                                <div className="card-body">
                                    {putawayItem.suggested_locations.length > 0 ? (
                                        <div className="row g-3">
                                            {putawayItem.suggested_locations.map((location, index) => (
                                                <div key={location.location_id} className="col-md-6">
                                                    <div className={`card h-100 ${selectedLocation === location.location_id ? 'border-primary' : ''}`}>
                                                        <div className="card-body">
                                                            <div className="d-flex justify-content-between align-items-start mb-3">
                                                                <div>
                                                                    <h6 className="card-title mb-1">
                                                                        #{index + 1} {location.location_code}
                                                                        {index === 0 && (
                                                                            <span className="badge bg-success ms-2">En İyi</span>
                                                                        )}
                                                                    </h6>
                                                                    <p className="text-muted mb-0">{location.zone_name}</p>
                                                                    <small className="text-muted">{location.zone_type}</small>
                                                                </div>
                                                                <div className="text-end">
                                                                    <div className={`fs-18 fw-bold text-${getScoreColor(location.compatibility_score)}`}>
                                                                        {location.compatibility_score}%
                                                                    </div>
                                                                    <small className="text-muted">Uyumluluk</small>
                                                                </div>
                                                            </div>

                                                            <div className="row g-2 mb-3">
                                                                <div className="col-6">
                                                                    <div className="text-center p-2 border rounded">
                                                                        <div className="fs-14 fw-medium">{location.distance_score}%</div>
                                                                        <small className="text-muted">Mesafe</small>
                                                                    </div>
                                                                </div>
                                                                <div className="col-6">
                                                                    <div className="text-center p-2 border rounded">
                                                                        <div className="fs-14 fw-medium">{location.capacity_utilization}%</div>
                                                                        <small className="text-muted">Doluluk</small>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            <div className="mb-3">
                                                                <div className="d-flex justify-content-between align-items-center mb-1">
                                                                    <small className="text-muted">Kapasite</small>
                                                                    <small className="text-muted">{location.available_capacity} birim kaldı</small>
                                                                </div>
                                                                <div className="progress" style={{ height: '4px' }}>
                                                                    <div 
                                                                        className="progress-bar bg-info"
                                                                        style={{ width: `${location.capacity_utilization}%` }}
                                                                    ></div>
                                                                </div>
                                                            </div>

                                                            <div className="mb-3">
                                                                <small className="text-muted d-block mb-1">Avantajlar:</small>
                                                                <ul className="list-unstyled mb-0">
                                                                    {location.reasons.map((reason, idx) => (
                                                                        <li key={idx} className="fs-13">
                                                                            <i className="ri-check-line text-success me-1"></i>
                                                                            {reason}
                                                                        </li>
                                                                    ))}
                                                                </ul>
                                                            </div>

                                                            {location.warnings && location.warnings.length > 0 && (
                                                                <div className="mb-3">
                                                                    <small className="text-muted d-block mb-1">Uyarılar:</small>
                                                                    <ul className="list-unstyled mb-0">
                                                                        {location.warnings.map((warning, idx) => (
                                                                            <li key={idx} className="fs-13">
                                                                                <i className="ri-alert-line text-warning me-1"></i>
                                                                                {warning}
                                                                            </li>
                                                                        ))}
                                                                    </ul>
                                                                </div>
                                                            )}

                                                            <div className="d-flex justify-content-between align-items-center">
                                                                <small className="text-muted">
                                                                    <i className="ri-time-line me-1"></i>
                                                                    ~{location.estimated_time} dk
                                                                </small>
                                                                {location.coordinates && (
                                                                    <small className="text-muted">
                                                                        {location.coordinates.x},{location.coordinates.y},{location.coordinates.level}
                                                                    </small>
                                                                )}
                                                            </div>

                                                            <div className="mt-3">
                                                                <button
                                                                    type="button"
                                                                    className={`btn w-100 ${
                                                                        selectedLocation === location.location_id ? 'btn-primary' : 'btn-outline-primary'
                                                                    }`}
                                                                    onClick={() => {
                                                                        setSelectedLocation(location.location_id);
                                                                        handleAssignLocation(location.location_id);
                                                                    }}
                                                                    disabled={processing}
                                                                >
                                                                    {processing && selectedLocation === location.location_id ? (
                                                                        <>
                                                                            <i className="ri-loader-2-line me-1"></i>
                                                                            Yerleştiriliyor...
                                                                        </>
                                                                    ) : (
                                                                        <>
                                                                            <i className="ri-map-pin-line me-1"></i>
                                                                            Bu Konuma Yerleştir
                                                                        </>
                                                                    )}
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-4">
                                            <div className="avatar-md mx-auto mb-4">
                                                <div className="avatar-title bg-light text-primary rounded-circle fs-24">
                                                    <i className="ri-map-pin-line"></i>
                                                </div>
                                            </div>
                                            <h5 className="fs-16">Uygun lokasyon bulunamadı</h5>
                                            <p className="text-muted mb-0">Lütfen manuel yerleştirme seçeneğini kullanın.</p>
                                            <div className="mt-3">
                                                <Link
                                                    href={route('warehouses.putaway.manual', putawayItem.id)}
                                                    className="btn btn-primary"
                                                >
                                                    <i className="ri-map-pin-user-line me-1"></i>
                                                    Manuel Yerleştir
                                                </Link>
                                            </div>
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