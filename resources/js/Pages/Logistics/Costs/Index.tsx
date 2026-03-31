import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import Layout from '../../../Layouts';

interface Vehicle {
    id: number;
    plate_number: string;
    make: string;
    model: string;
}

interface Shipment {
    id: number;
    shipment_number: string;
    shipment_date: string;
    vehicle?: Vehicle;
    driver?: { id: number; name: string };
    destination_name: string | null;
    destination_city: string | null;
    fuel_cost: number | null;
    toll_cost: number | null;
    other_costs: number | null;
    total_cost: number;
    actual_distance_km: number | null;
    estimated_distance_km: number | null;
    status: string;
}

interface Stats {
    total_cost: number;
    total_fuel_cost: number;
    total_toll_cost: number;
    total_other_costs: number;
    total_shipments: number;
    total_distance: number;
    avg_cost_per_shipment: number;
    avg_cost_per_km: number;
    cost_change_percentage: number;
    prev_total_cost: number;
}

interface CostBreakdown {
    fuel: { amount: number; percentage: number };
    toll: { amount: number; percentage: number };
    other: { amount: number; percentage: number };
}

interface CostTrend {
    month: string;
    fuel_cost: number;
    toll_cost: number;
    other_costs: number;
    total_cost: number;
}

interface TopVehicleCost {
    vehicle_id: number;
    plate_number: string;
    make: string;
    model: string;
    total_cost: number;
    fuel_cost: number;
    toll_cost: number;
    other_costs: number;
    total_distance: number;
    shipment_count: number;
    avg_cost_per_km: number;
}

interface Filters {
    start_date: string;
    end_date: string;
    vehicle_id?: number;
    status?: string;
}

interface Props {
    shipments: {
        data: Shipment[];
        links: any[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
    vehicles: Vehicle[];
    stats: Stats;
    costBreakdown: CostBreakdown;
    costTrends: CostTrend[];
    topVehiclesCosts: TopVehicleCost[];
    filters: Filters;
}

export default function Index({ shipments, vehicles, stats, costBreakdown, costTrends, topVehiclesCosts, filters }: Props) {
    const [startDate, setStartDate] = useState(filters.start_date);
    const [endDate, setEndDate] = useState(filters.end_date);
    const [vehicleId, setVehicleId] = useState(filters.vehicle_id?.toString() || '');
    const [status, setStatus] = useState(filters.status || '');

    const handleFilter = () => {
        router.get(route('logistics.costs.index'), {
            start_date: startDate,
            end_date: endDate,
            vehicle_id: vehicleId || undefined,
            status: status || undefined,
        }, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleReset = () => {
        const now = new Date();
        const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
        const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

        setStartDate(firstDay);
        setEndDate(lastDay);
        setVehicleId('');
        setStatus('');
        router.get(route('logistics.costs.index'));
    };

    const formatCurrency = (value: number | null) => {
        if (value === null || value === 0) return '₺0,00';
        return new Intl.NumberFormat('tr-TR', {
            style: 'currency',
            currency: 'TRY'
        }).format(value);
    };

    const formatNumber = (value: number | null) => {
        if (value === null) return '-';
        return new Intl.NumberFormat('tr-TR', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2
        }).format(value);
    };

    return (
        <Layout>
            <Head title="Maliyet Yönetimi" />
            <div className="page-content">
                <div className="container-fluid">
                    {/* Page Title */}
                    <div className="row">
                        <div className="col-12">
                            <div className="page-title-box d-sm-flex align-items-center justify-content-between">
                                <h4 className="mb-sm-0">Maliyet Yönetimi ve Analizi</h4>
                                <div className="page-title-right">
                                    <ol className="breadcrumb m-0">
                                        <li className="breadcrumb-item">
                                            <Link href={route('dashboard')}>Dashboard</Link>
                                        </li>
                                        <li className="breadcrumb-item">Lojistik</li>
                                        <li className="breadcrumb-item active">Maliyetler</li>
                                    </ol>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Filters */}
                    <div className="row mb-3">
                        <div className="col-12">
                            <div className="card">
                                <div className="card-body">
                                    <div className="row g-3 align-items-end">
                                        <div className="col-md-3">
                                            <label className="form-label">Başlangıç Tarihi</label>
                                            <input
                                                type="date"
                                                className="form-control"
                                                value={startDate}
                                                onChange={(e) => setStartDate(e.target.value)}
                                            />
                                        </div>
                                        <div className="col-md-3">
                                            <label className="form-label">Bitiş Tarihi</label>
                                            <input
                                                type="date"
                                                className="form-control"
                                                value={endDate}
                                                onChange={(e) => setEndDate(e.target.value)}
                                            />
                                        </div>
                                        <div className="col-md-3">
                                            <label className="form-label">Araç</label>
                                            <select
                                                className="form-select"
                                                value={vehicleId}
                                                onChange={(e) => setVehicleId(e.target.value)}
                                            >
                                                <option value="">Tüm Araçlar</option>
                                                {vehicles.map((vehicle) => (
                                                    <option key={vehicle.id} value={vehicle.id}>
                                                        {vehicle.plate_number} - {vehicle.make} {vehicle.model}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="col-md-3">
                                            <div className="d-flex gap-2">
                                                <button
                                                    className="btn btn-primary flex-grow-1"
                                                    onClick={handleFilter}
                                                >
                                                    <i className="fas fa-filter me-1"></i>
                                                    Filtrele
                                                </button>
                                                <button
                                                    className="btn btn-secondary"
                                                    onClick={handleReset}
                                                >
                                                    <i className="fas fa-redo"></i>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Statistics Cards */}
                    <div className="row mb-4">
                        <div className="col-xl-3 col-md-6">
                            <div className="card card-animate">
                                <div className="card-body">
                                    <div className="d-flex align-items-center">
                                        <div className="flex-grow-1">
                                            <p className="text-uppercase fw-medium text-muted mb-0">Toplam Maliyet</p>
                                        </div>
                                    </div>
                                    <div className="d-flex align-items-end justify-content-between mt-2">
                                        <div>
                                            <h4 className="fs-22 fw-semibold ff-secondary mb-2">
                                                {formatCurrency(stats.total_cost)}
                                            </h4>
                                            <span className={`badge ${stats.cost_change_percentage >= 0 ? 'bg-danger-subtle text-danger' : 'bg-success-subtle text-success'}`}>
                                                <i className={`fas fa-arrow-${stats.cost_change_percentage >= 0 ? 'up' : 'down'} me-1`}></i>
                                                %{Math.abs(stats.cost_change_percentage).toFixed(1)}
                                            </span>
                                        </div>
                                        <div className="avatar-sm flex-shrink-0">
                                            <span className="avatar-title bg-primary-subtle rounded fs-3">
                                                <i className="fas fa-coins text-primary"></i>
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="col-xl-3 col-md-6">
                            <div className="card card-animate">
                                <div className="card-body">
                                    <div className="d-flex align-items-center">
                                        <div className="flex-grow-1">
                                            <p className="text-uppercase fw-medium text-muted mb-0">Yakıt Maliyeti</p>
                                        </div>
                                    </div>
                                    <div className="d-flex align-items-end justify-content-between mt-2">
                                        <div>
                                            <h4 className="fs-22 fw-semibold ff-secondary mb-2">
                                                {formatCurrency(stats.total_fuel_cost)}
                                            </h4>
                                            <span className="badge bg-warning-subtle text-warning">
                                                %{costBreakdown.fuel.percentage.toFixed(1)} Oranı
                                            </span>
                                        </div>
                                        <div className="avatar-sm flex-shrink-0">
                                            <span className="avatar-title bg-warning-subtle rounded fs-3">
                                                <i className="fas fa-gas-pump text-warning"></i>
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="col-xl-3 col-md-6">
                            <div className="card card-animate">
                                <div className="card-body">
                                    <div className="d-flex align-items-center">
                                        <div className="flex-grow-1">
                                            <p className="text-uppercase fw-medium text-muted mb-0">Ort. Maliyet/km</p>
                                        </div>
                                    </div>
                                    <div className="d-flex align-items-end justify-content-between mt-2">
                                        <div>
                                            <h4 className="fs-22 fw-semibold ff-secondary mb-2">
                                                {formatCurrency(stats.avg_cost_per_km)}
                                            </h4>
                                            <span className="badge bg-info-subtle text-info">
                                                {formatNumber(stats.total_distance)} km
                                            </span>
                                        </div>
                                        <div className="avatar-sm flex-shrink-0">
                                            <span className="avatar-title bg-info-subtle rounded fs-3">
                                                <i className="fas fa-road text-info"></i>
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="col-xl-3 col-md-6">
                            <div className="card card-animate">
                                <div className="card-body">
                                    <div className="d-flex align-items-center">
                                        <div className="flex-grow-1">
                                            <p className="text-uppercase fw-medium text-muted mb-0">Ort. Maliyet/Sevk</p>
                                        </div>
                                    </div>
                                    <div className="d-flex align-items-end justify-content-between mt-2">
                                        <div>
                                            <h4 className="fs-22 fw-semibold ff-secondary mb-2">
                                                {formatCurrency(stats.avg_cost_per_shipment)}
                                            </h4>
                                            <span className="badge bg-success-subtle text-success">
                                                {stats.total_shipments} Sevkiyat
                                            </span>
                                        </div>
                                        <div className="avatar-sm flex-shrink-0">
                                            <span className="avatar-title bg-success-subtle rounded fs-3">
                                                <i className="fas fa-shipping-fast text-success"></i>
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="row">
                        {/* Cost Breakdown */}
                        <div className="col-xl-4">
                            <div className="card">
                                <div className="card-header">
                                    <h5 className="card-title mb-0">
                                        <i className="fas fa-chart-pie me-2"></i>
                                        Maliyet Dağılımı
                                    </h5>
                                </div>
                                <div className="card-body">
                                    <div className="mb-4">
                                        <div className="d-flex justify-content-between align-items-center mb-2">
                                            <span><i className="fas fa-gas-pump text-warning me-2"></i>Yakıt</span>
                                            <strong>{formatCurrency(costBreakdown.fuel.amount)}</strong>
                                        </div>
                                        <div className="progress mb-3" style={{ height: '10px' }}>
                                            <div
                                                className="progress-bar bg-warning"
                                                style={{ width: `${costBreakdown.fuel.percentage}%` }}
                                            ></div>
                                        </div>
                                        <small className="text-muted">%{costBreakdown.fuel.percentage.toFixed(1)} toplam maliyetin</small>
                                    </div>

                                    <div className="mb-4">
                                        <div className="d-flex justify-content-between align-items-center mb-2">
                                            <span><i className="fas fa-road text-info me-2"></i>Geçiş Ücretleri</span>
                                            <strong>{formatCurrency(costBreakdown.toll.amount)}</strong>
                                        </div>
                                        <div className="progress mb-3" style={{ height: '10px' }}>
                                            <div
                                                className="progress-bar bg-info"
                                                style={{ width: `${costBreakdown.toll.percentage}%` }}
                                            ></div>
                                        </div>
                                        <small className="text-muted">%{costBreakdown.toll.percentage.toFixed(1)} toplam maliyetin</small>
                                    </div>

                                    <div>
                                        <div className="d-flex justify-content-between align-items-center mb-2">
                                            <span><i className="fas fa-ellipsis-h text-secondary me-2"></i>Diğer</span>
                                            <strong>{formatCurrency(costBreakdown.other.amount)}</strong>
                                        </div>
                                        <div className="progress mb-3" style={{ height: '10px' }}>
                                            <div
                                                className="progress-bar bg-secondary"
                                                style={{ width: `${costBreakdown.other.percentage}%` }}
                                            ></div>
                                        </div>
                                        <small className="text-muted">%{costBreakdown.other.percentage.toFixed(1)} toplam maliyetin</small>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Cost Trends */}
                        <div className="col-xl-8">
                            <div className="card">
                                <div className="card-header">
                                    <h5 className="card-title mb-0">
                                        <i className="fas fa-chart-line me-2"></i>
                                        Maliyet Trendleri (Son 6 Ay)
                                    </h5>
                                </div>
                                <div className="card-body">
                                    <div className="table-responsive">
                                        <table className="table table-sm">
                                            <thead className="table-light">
                                                <tr>
                                                    <th>Ay</th>
                                                    <th className="text-end">Yakıt</th>
                                                    <th className="text-end">Geçiş</th>
                                                    <th className="text-end">Diğer</th>
                                                    <th className="text-end">Toplam</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {costTrends.map((trend, index) => (
                                                    <tr key={index}>
                                                        <td><strong>{trend.month}</strong></td>
                                                        <td className="text-end">{formatCurrency(trend.fuel_cost)}</td>
                                                        <td className="text-end">{formatCurrency(trend.toll_cost)}</td>
                                                        <td className="text-end">{formatCurrency(trend.other_costs)}</td>
                                                        <td className="text-end">
                                                            <strong>{formatCurrency(trend.total_cost)}</strong>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Top Vehicles by Cost */}
                    <div className="row mt-3">
                        <div className="col-12">
                            <div className="card">
                                <div className="card-header">
                                    <h5 className="card-title mb-0">
                                        <i className="fas fa-trophy me-2"></i>
                                        En Yüksek Maliyetli Araçlar (Top 10)
                                    </h5>
                                </div>
                                <div className="card-body">
                                    <div className="table-responsive">
                                        <table className="table table-hover align-middle mb-0">
                                            <thead className="table-light">
                                                <tr>
                                                    <th>#</th>
                                                    <th>Araç</th>
                                                    <th className="text-end">Yakıt</th>
                                                    <th className="text-end">Geçiş</th>
                                                    <th className="text-end">Diğer</th>
                                                    <th className="text-end">Toplam Maliyet</th>
                                                    <th className="text-end">Mesafe</th>
                                                    <th className="text-end">₺/km</th>
                                                    <th className="text-end">Sevkiyat</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {topVehiclesCosts.length > 0 ? (
                                                    topVehiclesCosts.map((vehicle, index) => (
                                                        <tr key={vehicle.vehicle_id}>
                                                            <td>
                                                                <span className="badge bg-primary-subtle text-primary">
                                                                    {index + 1}
                                                                </span>
                                                            </td>
                                                            <td>
                                                                <strong>{vehicle.plate_number}</strong>
                                                                <div className="text-muted small">
                                                                    {vehicle.make} {vehicle.model}
                                                                </div>
                                                            </td>
                                                            <td className="text-end">{formatCurrency(vehicle.fuel_cost)}</td>
                                                            <td className="text-end">{formatCurrency(vehicle.toll_cost)}</td>
                                                            <td className="text-end">{formatCurrency(vehicle.other_costs)}</td>
                                                            <td className="text-end">
                                                                <strong>{formatCurrency(vehicle.total_cost)}</strong>
                                                            </td>
                                                            <td className="text-end">{formatNumber(vehicle.total_distance)} km</td>
                                                            <td className="text-end">{formatCurrency(vehicle.avg_cost_per_km)}</td>
                                                            <td className="text-end">
                                                                <span className="badge bg-info-subtle text-info">
                                                                    {vehicle.shipment_count}
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    ))
                                                ) : (
                                                    <tr>
                                                        <td colSpan={9} className="text-center py-4">
                                                            <p className="text-muted">Bu dönem için maliyet verisi bulunmamaktadır.</p>
                                                        </td>
                                                    </tr>
                                                )}
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
}
