import React from 'react';
import { Head, Link } from '@inertiajs/react';
import Layout from '../../../Layouts';

interface Vehicle {
    id: number;
    plate_number: string;
    make: string;
    model: string;
}

interface Driver {
    id: number;
    name: string;
}

interface Location {
    id: number;
    name: string;
}

interface CurrentAccount {
    id: number;
    company_name: string;
}

interface Shipment {
    id: number;
    shipment_number: string;
    status: string;
    status_text: string;
    priority: string;
    priority_text: string;
    vehicle?: Vehicle;
    driver?: Driver;
    location?: Location;
    currentAccount?: CurrentAccount;
    shipment_date: string;
    planned_delivery_date: string | null;
    actual_delivery_date: string | null;
    departure_time: string | null;
    arrival_time: string | null;
    origin_address: string | null;
    origin_city: string | null;
    origin_latitude: number | null;
    origin_longitude: number | null;
    destination_name: string | null;
    destination_address: string | null;
    destination_city: string | null;
    destination_contact_name: string | null;
    destination_contact_phone: string | null;
    destination_latitude: number | null;
    destination_longitude: number | null;
    current_latitude: number | null;
    current_longitude: number | null;
    last_location_update: string | null;
    completion_percentage: number;
    estimated_distance_km: number | null;
    actual_distance_km: number | null;
    estimated_duration_minutes: number | null;
    actual_duration_minutes: number | null;
    total_weight_kg: number | null;
    total_volume_m3: number | null;
    total_packages: number | null;
    cargo_description: string | null;
    requires_signature: boolean;
    requires_refrigeration: boolean;
    is_fragile: boolean;
    estimated_cost: number | null;
    actual_cost: number | null;
    fuel_cost: number | null;
    toll_cost: number | null;
    other_costs: number | null;
    total_cost: number;
    waybill_number: string | null;
    reference_number: string | null;
    special_instructions: string | null;
    delivery_notes: string | null;
    route_notes: string | null;
    is_delayed: boolean;
    created_at: string;
}

interface Props {
    shipment: Shipment;
}

export default function Show({ shipment }: Props) {
    const formatNumber = (value: number | null) => {
        if (value === null) return '-';
        return new Intl.NumberFormat('tr-TR', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2
        }).format(value);
    };

    const formatCurrency = (value: number | null) => {
        if (value === null || value === 0) return '-';
        return new Intl.NumberFormat('tr-TR', {
            style: 'currency',
            currency: 'TRY'
        }).format(value);
    };

    const openGoogleMaps = (lat: number | null, lng: number | null) => {
        if (!lat || !lng) return;
        const url = `https://www.google.com/maps?q=${lat},${lng}`;
        window.open(url, '_blank');
    };

    const openRouteMap = () => {
        if (!shipment.origin_latitude || !shipment.origin_longitude ||
            !shipment.destination_latitude || !shipment.destination_longitude) return;

        const url = `https://www.google.com/maps/dir/${shipment.origin_latitude},${shipment.origin_longitude}/${shipment.destination_latitude},${shipment.destination_longitude}`;
        window.open(url, '_blank');
    };

    return (
        <Layout>
            <Head title={`Sevkiyat Takibi - ${shipment.shipment_number}`} />
            <div className="page-content">
                <div className="container-fluid">
                    {/* Page Title */}
                    <div className="row">
                        <div className="col-12">
                            <div className="page-title-box d-sm-flex align-items-center justify-content-between">
                                <h4 className="mb-sm-0">Sevkiyat Detayları</h4>
                                <div className="page-title-right">
                                    <ol className="breadcrumb m-0">
                                        <li className="breadcrumb-item">
                                            <Link href={route('dashboard')}>Dashboard</Link>
                                        </li>
                                        <li className="breadcrumb-item">
                                            <Link href={route('logistics.tracking.index')}>Canlı Takip</Link>
                                        </li>
                                        <li className="breadcrumb-item active">{shipment.shipment_number}</li>
                                    </ol>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Header Card */}
                    <div className="row mb-3">
                        <div className="col-12">
                            <div className="card">
                                <div className="card-body">
                                    <div className="row align-items-center">
                                        <div className="col-md-6">
                                            <h4 className="mb-0">
                                                {shipment.shipment_number}
                                                <span className={`badge ${shipment.is_delayed ? 'bg-danger' : 'bg-success'} ms-2`}>
                                                    {shipment.status_text}
                                                </span>
                                            </h4>
                                            {shipment.currentAccount && (
                                                <p className="text-muted mb-0">
                                                    <i className="fas fa-building me-1"></i>
                                                    {shipment.currentAccount.company_name}
                                                </p>
                                            )}
                                        </div>
                                        <div className="col-md-6 text-md-end">
                                            <button
                                                className="btn btn-primary"
                                                onClick={openRouteMap}
                                                disabled={!shipment.origin_latitude || !shipment.destination_latitude}
                                            >
                                                <i className="fas fa-route me-1"></i>
                                                Rotayı Haritada Göster
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Progress */}
                    <div className="row mb-3">
                        <div className="col-12">
                            <div className="card">
                                <div className="card-body">
                                    <h5 className="card-title mb-3">Teslimat İlerlemesi</h5>
                                    <div className="progress mb-2" style={{ height: '30px' }}>
                                        <div
                                            className={`progress-bar ${shipment.is_delayed ? 'bg-danger' : 'bg-success'}`}
                                            role="progressbar"
                                            style={{ width: `${shipment.completion_percentage}%` }}
                                            aria-valuenow={shipment.completion_percentage}
                                            aria-valuemin={0}
                                            aria-valuemax={100}
                                        >
                                            <strong>{shipment.completion_percentage}%</strong>
                                        </div>
                                    </div>
                                    {shipment.last_location_update && (
                                        <p className="text-muted mb-0">
                                            <i className="fas fa-clock me-1"></i>
                                            Son konum güncellemesi: {shipment.last_location_update}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="row">
                        {/* Route Information */}
                        <div className="col-lg-6">
                            <div className="card">
                                <div className="card-header">
                                    <h5 className="card-title mb-0">
                                        <i className="fas fa-route me-2"></i>
                                        Rota Bilgileri
                                    </h5>
                                </div>
                                <div className="card-body">
                                    <div className="mb-3">
                                        <h6 className="text-muted mb-2">Başlangıç</h6>
                                        <p className="mb-1">{shipment.origin_address || '-'}</p>
                                        <p className="text-muted mb-2">{shipment.origin_city || '-'}</p>
                                        {shipment.origin_latitude && shipment.origin_longitude && (
                                            <button
                                                className="btn btn-sm btn-soft-primary"
                                                onClick={() => openGoogleMaps(shipment.origin_latitude, shipment.origin_longitude)}
                                            >
                                                <i className="fas fa-map-marker-alt me-1"></i>
                                                Haritada Göster
                                            </button>
                                        )}
                                    </div>

                                    <div className="text-center mb-3">
                                        <i className="fas fa-arrow-down fa-2x text-primary"></i>
                                    </div>

                                    {shipment.current_latitude && shipment.current_longitude && (
                                        <div className="mb-3 p-3 bg-light rounded">
                                            <h6 className="text-primary mb-2">
                                                <i className="fas fa-map-pin me-1"></i>
                                                Mevcut Konum
                                            </h6>
                                            <button
                                                className="btn btn-sm btn-soft-primary"
                                                onClick={() => openGoogleMaps(shipment.current_latitude, shipment.current_longitude)}
                                            >
                                                <i className="fas fa-map-marker-alt me-1"></i>
                                                Haritada Göster
                                            </button>
                                        </div>
                                    )}

                                    <div className="text-center mb-3">
                                        <i className="fas fa-arrow-down fa-2x text-primary"></i>
                                    </div>

                                    <div>
                                        <h6 className="text-muted mb-2">Hedef</h6>
                                        <p className="mb-1"><strong>{shipment.destination_name || '-'}</strong></p>
                                        <p className="mb-1">{shipment.destination_address || '-'}</p>
                                        <p className="text-muted mb-2">{shipment.destination_city || '-'}</p>
                                        {shipment.destination_contact_name && (
                                            <p className="mb-1">
                                                <i className="fas fa-user me-1"></i>
                                                {shipment.destination_contact_name}
                                            </p>
                                        )}
                                        {shipment.destination_contact_phone && (
                                            <p className="mb-2">
                                                <i className="fas fa-phone me-1"></i>
                                                {shipment.destination_contact_phone}
                                            </p>
                                        )}
                                        {shipment.destination_latitude && shipment.destination_longitude && (
                                            <button
                                                className="btn btn-sm btn-soft-primary"
                                                onClick={() => openGoogleMaps(shipment.destination_latitude, shipment.destination_longitude)}
                                            >
                                                <i className="fas fa-map-marker-alt me-1"></i>
                                                Haritada Göster
                                            </button>
                                        )}
                                    </div>

                                    <hr />

                                    <div className="row">
                                        <div className="col-6">
                                            <p className="text-muted mb-1">Mesafe</p>
                                            <p className="mb-0">
                                                {formatNumber(shipment.estimated_distance_km)} km
                                            </p>
                                        </div>
                                        <div className="col-6">
                                            <p className="text-muted mb-1">Süre</p>
                                            <p className="mb-0">
                                                {shipment.estimated_duration_minutes ?
                                                    `${Math.floor(shipment.estimated_duration_minutes / 60)}s ${shipment.estimated_duration_minutes % 60}dk` : '-'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Shipment Details */}
                        <div className="col-lg-6">
                            {/* Vehicle & Driver */}
                            <div className="card mb-3">
                                <div className="card-header">
                                    <h5 className="card-title mb-0">
                                        <i className="fas fa-truck me-2"></i>
                                        Araç ve Sürücü
                                    </h5>
                                </div>
                                <div className="card-body">
                                    {shipment.vehicle ? (
                                        <div className="mb-3">
                                            <p className="text-muted mb-1">Araç</p>
                                            <p className="mb-0">
                                                <i className="fas fa-truck text-primary me-2"></i>
                                                {shipment.vehicle.plate_number} - {shipment.vehicle.make} {shipment.vehicle.model}
                                            </p>
                                        </div>
                                    ) : (
                                        <p className="text-muted">Araç atanmamış</p>
                                    )}

                                    {shipment.driver ? (
                                        <div>
                                            <p className="text-muted mb-1">Sürücü</p>
                                            <p className="mb-0">
                                                <i className="fas fa-user text-primary me-2"></i>
                                                {shipment.driver.name}
                                            </p>
                                        </div>
                                    ) : (
                                        <p className="text-muted">Sürücü atanmamış</p>
                                    )}
                                </div>
                            </div>

                            {/* Cargo Details */}
                            <div className="card mb-3">
                                <div className="card-header">
                                    <h5 className="card-title mb-0">
                                        <i className="fas fa-boxes me-2"></i>
                                        Kargo Detayları
                                    </h5>
                                </div>
                                <div className="card-body">
                                    <div className="row">
                                        <div className="col-6">
                                            <p className="text-muted mb-1">Ağırlık</p>
                                            <p className="mb-3">
                                                {formatNumber(shipment.total_weight_kg)} kg
                                            </p>
                                        </div>
                                        <div className="col-6">
                                            <p className="text-muted mb-1">Hacim</p>
                                            <p className="mb-3">
                                                {formatNumber(shipment.total_volume_m3)} m³
                                            </p>
                                        </div>
                                        <div className="col-6">
                                            <p className="text-muted mb-1">Paket Sayısı</p>
                                            <p className="mb-3">
                                                {shipment.total_packages || '-'}
                                            </p>
                                        </div>
                                        <div className="col-6">
                                            <p className="text-muted mb-1">Öncelik</p>
                                            <p className="mb-3">
                                                <span className={`badge badge-${shipment.priority === 'urgent' ? 'danger' : shipment.priority === 'high' ? 'warning' : 'info'}`}>
                                                    {shipment.priority_text}
                                                </span>
                                            </p>
                                        </div>
                                    </div>

                                    {shipment.cargo_description && (
                                        <div className="mb-3">
                                            <p className="text-muted mb-1">Açıklama</p>
                                            <p className="mb-0">{shipment.cargo_description}</p>
                                        </div>
                                    )}

                                    <div className="d-flex gap-2 flex-wrap">
                                        {shipment.requires_signature && (
                                            <span className="badge bg-info-subtle text-info">
                                                <i className="fas fa-signature me-1"></i>
                                                İmza Gerekli
                                            </span>
                                        )}
                                        {shipment.requires_refrigeration && (
                                            <span className="badge bg-primary-subtle text-primary">
                                                <i className="fas fa-snowflake me-1"></i>
                                                Soğutmalı
                                            </span>
                                        )}
                                        {shipment.is_fragile && (
                                            <span className="badge bg-warning-subtle text-warning">
                                                <i className="fas fa-exclamation-triangle me-1"></i>
                                                Kırılabilir
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Cost Information */}
                            <div className="card">
                                <div className="card-header">
                                    <h5 className="card-title mb-0">
                                        <i className="fas fa-dollar-sign me-2"></i>
                                        Maliyet Bilgileri
                                    </h5>
                                </div>
                                <div className="card-body">
                                    <div className="row">
                                        <div className="col-6">
                                            <p className="text-muted mb-1">Yakıt</p>
                                            <p className="mb-3">{formatCurrency(shipment.fuel_cost)}</p>
                                        </div>
                                        <div className="col-6">
                                            <p className="text-muted mb-1">Geçiş Ücreti</p>
                                            <p className="mb-3">{formatCurrency(shipment.toll_cost)}</p>
                                        </div>
                                        <div className="col-6">
                                            <p className="text-muted mb-1">Diğer</p>
                                            <p className="mb-3">{formatCurrency(shipment.other_costs)}</p>
                                        </div>
                                        <div className="col-6">
                                            <p className="text-muted mb-1"><strong>Toplam</strong></p>
                                            <p className="mb-0"><strong>{formatCurrency(shipment.total_cost)}</strong></p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Additional Information */}
                    {(shipment.special_instructions || shipment.delivery_notes || shipment.route_notes) && (
                        <div className="row mt-3">
                            <div className="col-12">
                                <div className="card">
                                    <div className="card-header">
                                        <h5 className="card-title mb-0">
                                            <i className="fas fa-sticky-note me-2"></i>
                                            Notlar ve Talimatlar
                                        </h5>
                                    </div>
                                    <div className="card-body">
                                        {shipment.special_instructions && (
                                            <div className="mb-3">
                                                <h6 className="text-muted">Özel Talimatlar</h6>
                                                <p className="mb-0">{shipment.special_instructions}</p>
                                            </div>
                                        )}
                                        {shipment.delivery_notes && (
                                            <div className="mb-3">
                                                <h6 className="text-muted">Teslimat Notları</h6>
                                                <p className="mb-0">{shipment.delivery_notes}</p>
                                            </div>
                                        )}
                                        {shipment.route_notes && (
                                            <div>
                                                <h6 className="text-muted">Rota Notları</h6>
                                                <p className="mb-0">{shipment.route_notes}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </Layout>
    );
}
