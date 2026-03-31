import React from 'react';
import { Head } from '@inertiajs/react';
import Layout from '../../Layouts';

interface DashboardData {
    metrics: {
        total_items: number;
        total_stock_value: number;
        low_stock_items: number;
        out_of_stock_items: number;
        expired_items: number;
        active_alerts: number;
    };
    recent_movements: any[];
    stock_by_warehouse: any[];
    low_stock_items: any[];
    expiring_items: any[];
    movement_trends: any;
    abc_summary: any[];
}

interface Props {
    dashboardData: DashboardData;
}

const Dashboard: React.FC<Props> = ({ dashboardData }) => {
    const { metrics, recent_movements, stock_by_warehouse, low_stock_items, expiring_items } = dashboardData;

    return (
        <Layout>
            <Head title="Envanter Dashboard" />
            
            <div className="page-content">
                <div className="container-fluid">
                    {/* Page Title */}
                    <div className="row">
                        <div className="col-12">
                            <div className="page-title-box d-sm-flex align-items-center justify-content-between">
                                <h4 className="mb-sm-0">Envanter Dashboard</h4>
                                <div className="page-title-right">
                                    <ol className="breadcrumb m-0">
                                        <li className="breadcrumb-item"><a href="javascript: void(0);">Envanter</a></li>
                                        <li className="breadcrumb-item active">Dashboard</li>
                                    </ol>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Metrics Cards */}
                    <div className="row">
                        <div className="col-xl-2 col-md-4">
                            <div className="card card-animate">
                                <div className="card-body">
                                    <div className="d-flex align-items-center">
                                        <div className="flex-grow-1 overflow-hidden">
                                            <p className="text-uppercase fw-medium text-muted text-truncate mb-0">
                                                Toplam Kalem
                                            </p>
                                        </div>
                                    </div>
                                    <div className="d-flex align-items-end justify-content-between mt-4">
                                        <div>
                                            <h4 className="fs-22 fw-semibold ff-secondary mb-4">
                                                <span className="counter-value">{metrics.total_items}</span>
                                            </h4>
                                        </div>
                                        <div className="avatar-sm flex-shrink-0">
                                            <span className="avatar-title bg-primary-subtle rounded fs-3">
                                                <i className="bx bx-package text-primary"></i>
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="col-xl-2 col-md-4">
                            <div className="card card-animate">
                                <div className="card-body">
                                    <div className="d-flex align-items-center">
                                        <div className="flex-grow-1 overflow-hidden">
                                            <p className="text-uppercase fw-medium text-muted text-truncate mb-0">
                                                Toplam Değer
                                            </p>
                                        </div>
                                    </div>
                                    <div className="d-flex align-items-end justify-content-between mt-4">
                                        <div>
                                            <h4 className="fs-22 fw-semibold ff-secondary mb-4">
                                                ₺<span className="counter-value">{metrics.total_stock_value.toLocaleString()}</span>
                                            </h4>
                                        </div>
                                        <div className="avatar-sm flex-shrink-0">
                                            <span className="avatar-title bg-success-subtle rounded fs-3">
                                                <i className="bx bx-dollar-circle text-success"></i>
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="col-xl-2 col-md-4">
                            <div className="card card-animate">
                                <div className="card-body">
                                    <div className="d-flex align-items-center">
                                        <div className="flex-grow-1 overflow-hidden">
                                            <p className="text-uppercase fw-medium text-muted text-truncate mb-0">
                                                Düşük Stok
                                            </p>
                                        </div>
                                    </div>
                                    <div className="d-flex align-items-end justify-content-between mt-4">
                                        <div>
                                            <h4 className="fs-22 fw-semibold ff-secondary mb-4">
                                                <span className="counter-value">{metrics.low_stock_items}</span>
                                            </h4>
                                        </div>
                                        <div className="avatar-sm flex-shrink-0">
                                            <span className="avatar-title bg-warning-subtle rounded fs-3">
                                                <i className="bx bx-error text-warning"></i>
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="col-xl-2 col-md-4">
                            <div className="card card-animate">
                                <div className="card-body">
                                    <div className="d-flex align-items-center">
                                        <div className="flex-grow-1 overflow-hidden">
                                            <p className="text-uppercase fw-medium text-muted text-truncate mb-0">
                                                Stok Tükendi
                                            </p>
                                        </div>
                                    </div>
                                    <div className="d-flex align-items-end justify-content-between mt-4">
                                        <div>
                                            <h4 className="fs-22 fw-semibold ff-secondary mb-4">
                                                <span className="counter-value">{metrics.out_of_stock_items}</span>
                                            </h4>
                                        </div>
                                        <div className="avatar-sm flex-shrink-0">
                                            <span className="avatar-title bg-danger-subtle rounded fs-3">
                                                <i className="bx bx-x-circle text-danger"></i>
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="col-xl-2 col-md-4">
                            <div className="card card-animate">
                                <div className="card-body">
                                    <div className="d-flex align-items-center">
                                        <div className="flex-grow-1 overflow-hidden">
                                            <p className="text-uppercase fw-medium text-muted text-truncate mb-0">
                                                Vadesi Geçmiş
                                            </p>
                                        </div>
                                    </div>
                                    <div className="d-flex align-items-end justify-content-between mt-4">
                                        <div>
                                            <h4 className="fs-22 fw-semibold ff-secondary mb-4">
                                                <span className="counter-value">{metrics.expired_items}</span>
                                            </h4>
                                        </div>
                                        <div className="avatar-sm flex-shrink-0">
                                            <span className="avatar-title bg-dark-subtle rounded fs-3">
                                                <i className="bx bx-time text-dark"></i>
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="col-xl-2 col-md-4">
                            <div className="card card-animate">
                                <div className="card-body">
                                    <div className="d-flex align-items-center">
                                        <div className="flex-grow-1 overflow-hidden">
                                            <p className="text-uppercase fw-medium text-muted text-truncate mb-0">
                                                Aktif Uyarılar
                                            </p>
                                        </div>
                                    </div>
                                    <div className="d-flex align-items-end justify-content-between mt-4">
                                        <div>
                                            <h4 className="fs-22 fw-semibold ff-secondary mb-4">
                                                <span className="counter-value">{metrics.active_alerts}</span>
                                            </h4>
                                        </div>
                                        <div className="avatar-sm flex-shrink-0">
                                            <span className="avatar-title bg-info-subtle rounded fs-3">
                                                <i className="bx bx-bell text-info"></i>
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="row">
                        {/* Recent Movements */}
                        <div className="col-xl-8">
                            <div className="card">
                                <div className="card-header align-items-center d-flex">
                                    <h4 className="card-title mb-0 flex-grow-1">Son Hareketler</h4>
                                    <div className="flex-shrink-0">
                                        <a href="/inventory/movements" className="btn btn-soft-info btn-sm">
                                            <i className="ri-file-list-3-line align-middle"></i> Tümünü Gör
                                        </a>
                                    </div>
                                </div>
                                <div className="card-body">
                                    <div className="table-responsive table-card">
                                        <table className="table table-hover table-centered align-middle table-nowrap mb-0">
                                            <tbody>
                                                {recent_movements && recent_movements.length > 0 ? (
                                                    recent_movements.map((movement, index) => (
                                                        <tr key={index}>
                                                            <td>
                                                                <div className="d-flex align-items-center">
                                                                    <div className="avatar-xs me-3">
                                                                        <div className={`avatar-title rounded-circle bg-${movement.direction === 'in' ? 'success' : 'danger'}-subtle text-${movement.direction === 'in' ? 'success' : 'danger'}`}>
                                                                            <i className={`bx bx-${movement.direction === 'in' ? 'down-arrow-alt' : 'up-arrow-alt'}`}></i>
                                                                        </div>
                                                                    </div>
                                                                    <div className="flex-grow-1">
                                                                        <h5 className="fs-14 mb-1">{movement.inventory_item?.name}</h5>
                                                                        <p className="text-muted mb-0">{movement.movement_type_text}</p>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td>
                                                                <span className="text-muted">{movement.warehouse?.name}</span>
                                                            </td>
                                                            <td>
                                                                <span className={`badge bg-${movement.direction === 'in' ? 'success' : 'danger'}-subtle text-${movement.direction === 'in' ? 'success' : 'danger'}`}>
                                                                    {movement.direction === 'in' ? '+' : '-'}{movement.quantity} {movement.unit}
                                                                </span>
                                                            </td>
                                                            <td>
                                                                <small className="text-muted">{new Date(movement.movement_date).toLocaleDateString('tr-TR')}</small>
                                                            </td>
                                                        </tr>
                                                    ))
                                                ) : (
                                                    <tr>
                                                        <td colSpan={4} className="text-center py-4">
                                                            <div className="text-muted">Henüz hareket bulunmuyor</div>
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Stock by Warehouse */}
                        <div className="col-xl-4">
                            <div className="card">
                                <div className="card-header align-items-center d-flex">
                                    <h4 className="card-title mb-0 flex-grow-1">Depo Bazında Stok</h4>
                                </div>
                                <div className="card-body">
                                    {stock_by_warehouse && stock_by_warehouse.length > 0 ? (
                                        stock_by_warehouse.map((warehouse, index) => (
                                            <div key={index} className="d-flex align-items-center border-bottom py-3">
                                                <div className="flex-grow-1">
                                                    <h5 className="fs-14 mb-1">{warehouse.name}</h5>
                                                    <p className="text-muted mb-0">{warehouse.total_quantity} kalem</p>
                                                </div>
                                                <div className="flex-shrink-0">
                                                    <span className="text-success fw-semibold">₺{warehouse.total_cost.toLocaleString()}</span>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-center py-4">
                                            <div className="text-muted">Stok bilgisi bulunmuyor</div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="row">
                        {/* Low Stock Items */}
                        <div className="col-xl-6">
                            <div className="card">
                                <div className="card-header align-items-center d-flex">
                                    <h4 className="card-title mb-0 flex-grow-1">Düşük Stok Uyarıları</h4>
                                    <div className="flex-shrink-0">
                                        <a href="/inventory/alerts" className="btn btn-soft-warning btn-sm">
                                            <i className="ri-error-warning-line align-middle"></i> Tümünü Gör
                                        </a>
                                    </div>
                                </div>
                                <div className="card-body">
                                    {low_stock_items && low_stock_items.length > 0 ? (
                                        low_stock_items.map((item, index) => (
                                            <div key={index} className="d-flex align-items-center border-bottom py-3">
                                                <div className="avatar-xs me-3">
                                                    <div className="avatar-title rounded-circle bg-warning-subtle text-warning">
                                                        <i className="bx bx-error"></i>
                                                    </div>
                                                </div>
                                                <div className="flex-grow-1">
                                                    <h5 className="fs-14 mb-1">{item.name}</h5>
                                                    <p className="text-muted mb-0">SKU: {item.sku}</p>
                                                </div>
                                                <div className="flex-shrink-0">
                                                    <span className="text-warning fw-semibold">{item.available_stock} / {item.reorder_point}</span>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-center py-4">
                                            <div className="text-muted">Düşük stok uyarısı bulunmuyor</div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Expiring Items */}
                        <div className="col-xl-6">
                            <div className="card">
                                <div className="card-header align-items-center d-flex">
                                    <h4 className="card-title mb-0 flex-grow-1">Yaklaşan Son Kullanma Tarihleri</h4>
                                </div>
                                <div className="card-body">
                                    {expiring_items && expiring_items.length > 0 ? (
                                        expiring_items.map((item, index) => (
                                            <div key={index} className="d-flex align-items-center border-bottom py-3">
                                                <div className="avatar-xs me-3">
                                                    <div className="avatar-title rounded-circle bg-danger-subtle text-danger">
                                                        <i className="bx bx-time"></i>
                                                    </div>
                                                </div>
                                                <div className="flex-grow-1">
                                                    <h5 className="fs-14 mb-1">{item.name}</h5>
                                                    <p className="text-muted mb-0">
                                                        {item.stocks && item.stocks.length > 0 && (
                                                            <>SKT: {new Date(item.stocks[0].expiry_date).toLocaleDateString('tr-TR')}</>
                                                        )}
                                                    </p>
                                                </div>
                                                <div className="flex-shrink-0">
                                                    {item.stocks && item.stocks.length > 0 && (
                                                        <span className="text-danger fw-semibold">{item.stocks[0].quantity_on_hand}</span>
                                                    )}
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-center py-4">
                                            <div className="text-muted">Yaklaşan son kullanma tarihi bulunmuyor</div>
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

export default Dashboard;