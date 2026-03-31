import React from 'react';
import { Head, Link } from '@inertiajs/react';
import Layout from '../../../Layouts';

interface Warehouse {
    id: number;
    name: string;
}

interface StockByWarehouse {
    warehouse_id: number;
    warehouse?: Warehouse;
    total_quantity: number;
    available_quantity: number;
    total_value: number;
}

interface Movement {
    id: number;
    movement_number: string;
    movement_type: string;
    direction: string;
    quantity: number;
    unit?: string;
    movement_date: string;
    reference_number?: string;
    notes?: string;
    warehouse?: Warehouse;
    creator?: { id: number; name: string };
}

interface Alert {
    id: number;
    alert_type: string;
    message: string;
    severity: string;
    created_at: string;
}

interface Barcode {
    id: number;
    barcode: string;
    type?: string;
}

interface Stock {
    id: number;
    warehouse_id: number;
    quantity_on_hand: number;
    quantity_available: number;
    quantity_allocated: number;
    total_cost: number;
    lot_number?: string;
    serial_number?: string;
    expiry_date?: string;
    status: string;
    warehouse?: Warehouse;
    location?: { id: number; name: string };
}

interface InventoryItem {
    id: number;
    name: string;
    sku: string;
    barcode?: string;
    internal_code?: string;
    description?: string;
    category?: string;
    brand?: string;
    model?: string;
    item_type: string;
    status: string;
    base_unit: string;
    reorder_point: number;
    reorder_quantity: number;
    minimum_stock?: number;
    maximum_stock?: number;
    lead_time_days?: number;
    abc_classification?: string;
    valuation_method?: string;
    standard_cost?: number;
    average_cost?: number;
    last_purchase_cost?: number;
    weight?: number;
    length?: number;
    width?: number;
    height?: number;
    lot_tracking_enabled?: boolean;
    serial_number_tracking?: boolean;
    expiry_tracking_enabled?: boolean;
    quality_check_required?: boolean;
    stocks: Stock[];
    movements: Movement[];
    alerts: Alert[];
    barcodes: Barcode[];
}

interface MovementSummary {
    movement_type: string;
    direction: string;
    count: number;
    total_quantity: number;
}

interface Props {
    item: InventoryItem;
    stockByWarehouse: StockByWarehouse[];
    movementSummary: MovementSummary[];
}

const itemTypeLabels: Record<string, string> = {
    raw_material: 'Hammadde',
    finished_product: 'Bitmiş Ürün',
    semi_finished: 'Yarı Mamul',
    consumable: 'Sarf Malzemesi',
    packaging: 'Ambalaj',
    spare_part: 'Yedek Parça',
};

const movementTypeLabels: Record<string, string> = {
    receipt: 'Giriş',
    issue: 'Çıkış',
    transfer: 'Transfer',
    adjustment: 'Düzeltme',
    return: 'İade',
    production: 'Üretim',
    scrap: 'Fire',
};

const directionLabels: Record<string, string> = {
    in: 'Giriş',
    out: 'Çıkış',
};

const Show: React.FC<Props> = ({ item, stockByWarehouse, movementSummary }) => {
    const totalStock = stockByWarehouse.reduce((sum, s) => sum + Number(s.total_quantity || 0), 0);
    const totalAvailable = stockByWarehouse.reduce((sum, s) => sum + Number(s.available_quantity || 0), 0);
    const totalValue = stockByWarehouse.reduce((sum, s) => sum + Number(s.total_value || 0), 0);

    const getStockStatusBadge = () => {
        if (totalAvailable <= 0) {
            return <span className="badge bg-danger-subtle text-danger">Stok Yok</span>;
        }
        if (totalAvailable <= item.reorder_point) {
            return <span className="badge bg-warning-subtle text-warning">Düşük Stok</span>;
        }
        return <span className="badge bg-success-subtle text-success">Normal</span>;
    };

    const getABCBadge = (classification?: string) => {
        if (!classification) return null;
        const colors: Record<string, string> = {
            A: 'bg-success-subtle text-success',
            B: 'bg-warning-subtle text-warning',
            C: 'bg-info-subtle text-info',
        };
        return <span className={`badge ${colors[classification] || 'bg-secondary-subtle text-secondary'}`}>{classification}</span>;
    };

    const getDirectionBadge = (direction: string) => {
        if (direction === 'in') return <span className="badge bg-success-subtle text-success">Giriş</span>;
        return <span className="badge bg-danger-subtle text-danger">Çıkış</span>;
    };

    const getSeverityBadge = (severity: string) => {
        const map: Record<string, string> = {
            critical: 'bg-danger',
            high: 'bg-warning text-dark',
            medium: 'bg-info',
            low: 'bg-secondary',
        };
        return <span className={`badge ${map[severity] || 'bg-secondary'}`}>{severity}</span>;
    };

    return (
        <Layout>
            <Head title={`${item.name} - Envanter Detayı`} />

            <div className="page-content">
                <div className="container-fluid">
                    {/* Page Title */}
                    <div className="row">
                        <div className="col-12">
                            <div className="page-title-box d-sm-flex align-items-center justify-content-between">
                                <h4 className="mb-sm-0">{item.name}</h4>
                                <div className="page-title-right">
                                    <ol className="breadcrumb m-0">
                                        <li className="breadcrumb-item"><Link href="/inventory">Envanter</Link></li>
                                        <li className="breadcrumb-item"><Link href="/inventory/items">Kalemler</Link></li>
                                        <li className="breadcrumb-item active">{item.sku}</li>
                                    </ol>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Active Alerts */}
                    {item.alerts && item.alerts.length > 0 && (
                        <div className="row">
                            <div className="col-12">
                                {item.alerts.map((alert) => (
                                    <div key={alert.id} className={`alert alert-${alert.severity === 'critical' ? 'danger' : alert.severity === 'high' ? 'warning' : 'info'} alert-dismissible fade show`}>
                                        <i className="ri-alarm-warning-line me-2"></i>
                                        <strong>{alert.alert_type}:</strong> {alert.message}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Summary Cards */}
                    <div className="row">
                        <div className="col-xl-3 col-md-6">
                            <div className="card card-animate">
                                <div className="card-body">
                                    <div className="d-flex align-items-center">
                                        <div className="flex-grow-1">
                                            <p className="text-uppercase fw-medium text-muted mb-0">Toplam Stok</p>
                                        </div>
                                        <div className="flex-shrink-0">
                                            {getStockStatusBadge()}
                                        </div>
                                    </div>
                                    <div className="d-flex align-items-end justify-content-between mt-4">
                                        <div>
                                            <h4 className="fs-22 fw-semibold mb-4">
                                                {totalStock.toLocaleString()} <span className="fs-14 text-muted">{item.base_unit}</span>
                                            </h4>
                                        </div>
                                        <div className="avatar-sm flex-shrink-0">
                                            <span className="avatar-title bg-primary-subtle rounded fs-3">
                                                <i className="ri-stack-line text-primary"></i>
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
                                            <p className="text-uppercase fw-medium text-muted mb-0">Kullanılabilir</p>
                                        </div>
                                    </div>
                                    <div className="d-flex align-items-end justify-content-between mt-4">
                                        <div>
                                            <h4 className="fs-22 fw-semibold mb-4">
                                                {totalAvailable.toLocaleString()} <span className="fs-14 text-muted">{item.base_unit}</span>
                                            </h4>
                                        </div>
                                        <div className="avatar-sm flex-shrink-0">
                                            <span className="avatar-title bg-success-subtle rounded fs-3">
                                                <i className="ri-checkbox-circle-line text-success"></i>
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
                                            <p className="text-uppercase fw-medium text-muted mb-0">Toplam Değer</p>
                                        </div>
                                    </div>
                                    <div className="d-flex align-items-end justify-content-between mt-4">
                                        <div>
                                            <h4 className="fs-22 fw-semibold mb-4">
                                                ₺{totalValue.toLocaleString()}
                                            </h4>
                                        </div>
                                        <div className="avatar-sm flex-shrink-0">
                                            <span className="avatar-title bg-warning-subtle rounded fs-3">
                                                <i className="ri-money-dollar-circle-line text-warning"></i>
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
                                            <p className="text-uppercase fw-medium text-muted mb-0">Depo Sayısı</p>
                                        </div>
                                        {getABCBadge(item.abc_classification)}
                                    </div>
                                    <div className="d-flex align-items-end justify-content-between mt-4">
                                        <div>
                                            <h4 className="fs-22 fw-semibold mb-4">
                                                {stockByWarehouse.length}
                                            </h4>
                                        </div>
                                        <div className="avatar-sm flex-shrink-0">
                                            <span className="avatar-title bg-info-subtle rounded fs-3">
                                                <i className="ri-building-2-line text-info"></i>
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="row">
                        {/* Item Details */}
                        <div className="col-xl-4">
                            <div className="card">
                                <div className="card-header">
                                    <h4 className="card-title mb-0">Kalem Bilgileri</h4>
                                </div>
                                <div className="card-body">
                                    <div className="table-responsive">
                                        <table className="table table-borderless mb-0">
                                            <tbody>
                                                <tr>
                                                    <th className="ps-0 text-muted" style={{ width: '40%' }}>SKU</th>
                                                    <td className="fw-medium">{item.sku}</td>
                                                </tr>
                                                {item.barcode && (
                                                    <tr>
                                                        <th className="ps-0 text-muted">Barkod</th>
                                                        <td>{item.barcode}</td>
                                                    </tr>
                                                )}
                                                {item.internal_code && (
                                                    <tr>
                                                        <th className="ps-0 text-muted">Dahili Kod</th>
                                                        <td>{item.internal_code}</td>
                                                    </tr>
                                                )}
                                                <tr>
                                                    <th className="ps-0 text-muted">Tip</th>
                                                    <td><span className="badge bg-light text-body">{itemTypeLabels[item.item_type] || item.item_type}</span></td>
                                                </tr>
                                                {item.category && (
                                                    <tr>
                                                        <th className="ps-0 text-muted">Kategori</th>
                                                        <td>{item.category}</td>
                                                    </tr>
                                                )}
                                                {item.brand && (
                                                    <tr>
                                                        <th className="ps-0 text-muted">Marka</th>
                                                        <td>{item.brand}</td>
                                                    </tr>
                                                )}
                                                {item.model && (
                                                    <tr>
                                                        <th className="ps-0 text-muted">Model</th>
                                                        <td>{item.model}</td>
                                                    </tr>
                                                )}
                                                <tr>
                                                    <th className="ps-0 text-muted">Birim</th>
                                                    <td>{item.base_unit}</td>
                                                </tr>
                                                <tr>
                                                    <th className="ps-0 text-muted">Durum</th>
                                                    <td>
                                                        <span className={`badge ${item.status === 'active' ? 'bg-success-subtle text-success' : 'bg-danger-subtle text-danger'}`}>
                                                            {item.status === 'active' ? 'Aktif' : item.status === 'inactive' ? 'Pasif' : 'Kullanımdan Kaldırılmış'}
                                                        </span>
                                                    </td>
                                                </tr>
                                                {item.abc_classification && (
                                                    <tr>
                                                        <th className="ps-0 text-muted">ABC Sınıfı</th>
                                                        <td>{getABCBadge(item.abc_classification)}</td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>

                                    {item.description && (
                                        <div className="mt-3">
                                            <h6 className="text-muted">Açıklama</h6>
                                            <p className="mb-0">{item.description}</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Stock Thresholds */}
                            <div className="card">
                                <div className="card-header">
                                    <h4 className="card-title mb-0">Stok Eşikleri</h4>
                                </div>
                                <div className="card-body">
                                    <div className="table-responsive">
                                        <table className="table table-borderless mb-0">
                                            <tbody>
                                                <tr>
                                                    <th className="ps-0 text-muted" style={{ width: '50%' }}>Yeniden Sipariş Noktası</th>
                                                    <td className="fw-medium">{item.reorder_point} {item.base_unit}</td>
                                                </tr>
                                                <tr>
                                                    <th className="ps-0 text-muted">Yeniden Sipariş Miktarı</th>
                                                    <td className="fw-medium">{item.reorder_quantity} {item.base_unit}</td>
                                                </tr>
                                                {item.minimum_stock != null && (
                                                    <tr>
                                                        <th className="ps-0 text-muted">Minimum Stok</th>
                                                        <td>{item.minimum_stock} {item.base_unit}</td>
                                                    </tr>
                                                )}
                                                {item.maximum_stock != null && (
                                                    <tr>
                                                        <th className="ps-0 text-muted">Maksimum Stok</th>
                                                        <td>{item.maximum_stock} {item.base_unit}</td>
                                                    </tr>
                                                )}
                                                {item.lead_time_days != null && (
                                                    <tr>
                                                        <th className="ps-0 text-muted">Tedarik Süresi</th>
                                                        <td>{item.lead_time_days} gün</td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>

                            {/* Cost Info */}
                            {(item.standard_cost || item.average_cost || item.last_purchase_cost) && (
                                <div className="card">
                                    <div className="card-header">
                                        <h4 className="card-title mb-0">Maliyet Bilgileri</h4>
                                    </div>
                                    <div className="card-body">
                                        <div className="table-responsive">
                                            <table className="table table-borderless mb-0">
                                                <tbody>
                                                    {item.valuation_method && (
                                                        <tr>
                                                            <th className="ps-0 text-muted" style={{ width: '50%' }}>Değerleme Yöntemi</th>
                                                            <td className="text-uppercase">{item.valuation_method}</td>
                                                        </tr>
                                                    )}
                                                    {item.standard_cost != null && (
                                                        <tr>
                                                            <th className="ps-0 text-muted">Standart Maliyet</th>
                                                            <td className="fw-medium">₺{Number(item.standard_cost).toLocaleString()}</td>
                                                        </tr>
                                                    )}
                                                    {item.average_cost != null && (
                                                        <tr>
                                                            <th className="ps-0 text-muted">Ortalama Maliyet</th>
                                                            <td className="fw-medium">₺{Number(item.average_cost).toLocaleString()}</td>
                                                        </tr>
                                                    )}
                                                    {item.last_purchase_cost != null && (
                                                        <tr>
                                                            <th className="ps-0 text-muted">Son Alış Maliyeti</th>
                                                            <td className="fw-medium">₺{Number(item.last_purchase_cost).toLocaleString()}</td>
                                                        </tr>
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Tracking Features */}
                            {(item.lot_tracking_enabled || item.serial_number_tracking || item.expiry_tracking_enabled || item.quality_check_required) && (
                                <div className="card">
                                    <div className="card-header">
                                        <h4 className="card-title mb-0">Takip Özellikleri</h4>
                                    </div>
                                    <div className="card-body">
                                        <div className="d-flex flex-wrap gap-2">
                                            {item.lot_tracking_enabled && (
                                                <span className="badge bg-primary-subtle text-primary fs-12"><i className="ri-barcode-line me-1"></i>Lot Takibi</span>
                                            )}
                                            {item.serial_number_tracking && (
                                                <span className="badge bg-info-subtle text-info fs-12"><i className="ri-hashtag me-1"></i>Seri No Takibi</span>
                                            )}
                                            {item.expiry_tracking_enabled && (
                                                <span className="badge bg-warning-subtle text-warning fs-12"><i className="ri-calendar-event-line me-1"></i>Son Kullanma Tarihi</span>
                                            )}
                                            {item.quality_check_required && (
                                                <span className="badge bg-success-subtle text-success fs-12"><i className="ri-shield-check-line me-1"></i>Kalite Kontrol</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Right Column */}
                        <div className="col-xl-8">
                            {/* Stock by Warehouse */}
                            <div className="card">
                                <div className="card-header align-items-center d-flex">
                                    <h4 className="card-title mb-0 flex-grow-1">Depo Bazlı Stok</h4>
                                </div>
                                <div className="card-body">
                                    <div className="table-responsive table-card">
                                        <table className="table table-nowrap table-striped-columns mb-0">
                                            <thead className="table-light">
                                                <tr>
                                                    <th>Depo</th>
                                                    <th className="text-end">Eldeki Miktar</th>
                                                    <th className="text-end">Kullanılabilir</th>
                                                    <th className="text-end">Toplam Değer</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {stockByWarehouse.length > 0 ? (
                                                    stockByWarehouse.map((stock, index) => (
                                                        <tr key={index}>
                                                            <td className="fw-medium">{stock.warehouse?.name || `Depo #${stock.warehouse_id}`}</td>
                                                            <td className="text-end">{Number(stock.total_quantity).toLocaleString()} {item.base_unit}</td>
                                                            <td className="text-end">{Number(stock.available_quantity).toLocaleString()} {item.base_unit}</td>
                                                            <td className="text-end">₺{Number(stock.total_value).toLocaleString()}</td>
                                                        </tr>
                                                    ))
                                                ) : (
                                                    <tr>
                                                        <td colSpan={4} className="text-center py-4 text-muted">Stok kaydı bulunamadı</td>
                                                    </tr>
                                                )}
                                            </tbody>
                                            {stockByWarehouse.length > 0 && (
                                                <tfoot className="table-light">
                                                    <tr>
                                                        <th>Toplam</th>
                                                        <th className="text-end">{totalStock.toLocaleString()} {item.base_unit}</th>
                                                        <th className="text-end">{totalAvailable.toLocaleString()} {item.base_unit}</th>
                                                        <th className="text-end">₺{totalValue.toLocaleString()}</th>
                                                    </tr>
                                                </tfoot>
                                            )}
                                        </table>
                                    </div>
                                </div>
                            </div>

                            {/* Movement Summary (Last 30 Days) */}
                            {movementSummary.length > 0 && (
                                <div className="card">
                                    <div className="card-header">
                                        <h4 className="card-title mb-0">Hareket Özeti (Son 30 Gün)</h4>
                                    </div>
                                    <div className="card-body">
                                        <div className="table-responsive table-card">
                                            <table className="table table-nowrap table-striped-columns mb-0">
                                                <thead className="table-light">
                                                    <tr>
                                                        <th>Hareket Tipi</th>
                                                        <th>Yön</th>
                                                        <th className="text-end">Adet</th>
                                                        <th className="text-end">Toplam Miktar</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {movementSummary.map((ms, index) => (
                                                        <tr key={index}>
                                                            <td>{movementTypeLabels[ms.movement_type] || ms.movement_type}</td>
                                                            <td>{getDirectionBadge(ms.direction)}</td>
                                                            <td className="text-end">{ms.count}</td>
                                                            <td className="text-end">{Number(ms.total_quantity).toLocaleString()} {item.base_unit}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Recent Movements */}
                            <div className="card">
                                <div className="card-header align-items-center d-flex">
                                    <h4 className="card-title mb-0 flex-grow-1">Son Hareketler</h4>
                                </div>
                                <div className="card-body">
                                    <div className="table-responsive table-card">
                                        <table className="table table-nowrap table-striped-columns mb-0">
                                            <thead className="table-light">
                                                <tr>
                                                    <th>Hareket No</th>
                                                    <th>Tip</th>
                                                    <th>Yön</th>
                                                    <th>Depo</th>
                                                    <th className="text-end">Miktar</th>
                                                    <th>Tarih</th>
                                                    <th>Oluşturan</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {item.movements && item.movements.length > 0 ? (
                                                    item.movements.map((movement) => (
                                                        <tr key={movement.id}>
                                                            <td className="fw-medium">{movement.movement_number}</td>
                                                            <td>{movementTypeLabels[movement.movement_type] || movement.movement_type}</td>
                                                            <td>{getDirectionBadge(movement.direction)}</td>
                                                            <td>{movement.warehouse?.name || '-'}</td>
                                                            <td className="text-end">{Number(movement.quantity).toLocaleString()} {movement.unit || item.base_unit}</td>
                                                            <td>{new Date(movement.movement_date).toLocaleDateString('tr-TR')}</td>
                                                            <td>{movement.creator?.name || '-'}</td>
                                                        </tr>
                                                    ))
                                                ) : (
                                                    <tr>
                                                        <td colSpan={7} className="text-center py-4 text-muted">Hareket kaydı bulunamadı</td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>

                            {/* Barcodes */}
                            {item.barcodes && item.barcodes.length > 0 && (
                                <div className="card">
                                    <div className="card-header">
                                        <h4 className="card-title mb-0">Barkodlar</h4>
                                    </div>
                                    <div className="card-body">
                                        <div className="d-flex flex-wrap gap-2">
                                            {item.barcodes.map((bc) => (
                                                <span key={bc.id} className="badge bg-light text-body fs-13 p-2">
                                                    <i className="ri-barcode-line me-1"></i>{bc.barcode}
                                                    {bc.type && <small className="text-muted ms-1">({bc.type})</small>}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default Show;
