import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import Layout from '../../../Layouts';

interface InventoryMovement {
    id: number;
    movement_number: string;
    movement_type: string;
    direction: 'in' | 'out';
    quantity: number;
    unit: string;
    movement_date: string;
    reason_description?: string;
    total_cost: number;
    unit_cost: number;
    inventory_item: {
        id: number;
        name: string;
        sku: string;
    };
    warehouse: {
        id: number;
        name: string;
        code: string;
    };
}

interface Props {
    movements: InventoryMovement[];
    filters: {
        date_from?: string;
        date_to?: string;
    };
}

const Movement: React.FC<Props> = ({ movements, filters }) => {
    const [dateFrom, setDateFrom] = useState(filters.date_from || '');
    const [dateTo, setDateTo] = useState(filters.date_to || '');

    const handleFilter = () => {
        router.get('/inventory/reports', {
            type: 'movement_report',
            date_from: dateFrom,
            date_to: dateTo,
        }, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const getMovementTypeText = (type: string) => {
        const types: { [key: string]: string } = {
            'receipt': 'Giriş',
            'issue': 'Çıkış',
            'transfer': 'Transfer',
            'adjustment': 'Düzeltme',
            'production': 'Üretim',
            'return': 'İade',
            'cycle_count': 'Sayım',
        };
        return types[type] || type;
    };

    const getDirectionBadge = (direction: string) => {
        return direction === 'in' 
            ? <span className="badge bg-success-subtle text-success">Giriş</span>
            : <span className="badge bg-danger-subtle text-danger">Çıkış</span>;
    };

    const calculateTotals = () => {
        return movements.reduce((totals, movement) => {
            if (movement.direction === 'in') {
                return {
                    totalIn: totals.totalIn + movement.quantity,
                    totalInValue: totals.totalInValue + movement.total_cost,
                    totalOut: totals.totalOut,
                    totalOutValue: totals.totalOutValue,
                };
            } else {
                return {
                    totalIn: totals.totalIn,
                    totalInValue: totals.totalInValue,
                    totalOut: totals.totalOut + movement.quantity,
                    totalOutValue: totals.totalOutValue + movement.total_cost,
                };
            }
        }, { totalIn: 0, totalInValue: 0, totalOut: 0, totalOutValue: 0 });
    };

    const totals = calculateTotals();

    const exportToPDF = () => {
        window.print();
    };

    const exportToExcel = () => {
        const csvContent = "data:text/csv;charset=utf-8," 
            + "Hareket No,Tarih,Ürün,SKU,Hareket Tipi,Yön,Miktar,Birim Fiyat,Toplam Değer,Depo,Açıklama\n"
            + movements.map(movement => 
                `${movement.movement_number},${new Date(movement.movement_date).toLocaleDateString('tr-TR')},"${movement.inventory_item.name}",${movement.inventory_item.sku},${getMovementTypeText(movement.movement_type)},${movement.direction === 'in' ? 'Giriş' : 'Çıkış'},${movement.quantity},${movement.unit_cost},${movement.total_cost},"${movement.warehouse.name}","${movement.reason_description || ''}"`
            ).join('\n');

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "hareket_raporu.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <Layout>
            <Head title="Hareket Raporu" />
            
            <div className="page-content">
                <div className="container-fluid">
                    {/* Page Title */}
                    <div className="row">
                        <div className="col-12">
                            <div className="page-title-box d-sm-flex align-items-center justify-content-between">
                                <h4 className="mb-sm-0">Hareket Raporu</h4>
                                <div className="page-title-right">
                                    <ol className="breadcrumb m-0">
                                        <li className="breadcrumb-item"><Link href="/inventory">Envanter</Link></li>
                                        <li className="breadcrumb-item"><Link href="/inventory/reports">Raporlar</Link></li>
                                        <li className="breadcrumb-item active">Hareket Raporu</li>
                                    </ol>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Summary Cards */}
                    <div className="row">
                        <div className="col-xl-3 col-md-6">
                            <div className="card card-animate">
                                <div className="card-body">
                                    <div className="d-flex align-items-center">
                                        <div className="flex-grow-1 overflow-hidden">
                                            <p className="text-uppercase fw-medium text-muted text-truncate mb-0">Toplam Giriş</p>
                                        </div>
                                        <div className="avatar-sm flex-shrink-0">
                                            <span className="avatar-title bg-success-subtle rounded fs-3">
                                                <i className="bx bx-down-arrow-alt text-success"></i>
                                            </span>
                                        </div>
                                    </div>
                                    <div className="d-flex align-items-end justify-content-between mt-4">
                                        <div>
                                            <h4 className="fs-22 fw-semibold ff-secondary mb-4">
                                                <span className="counter-value">{totals.totalIn.toLocaleString()}</span>
                                            </h4>
                                            <p className="text-muted mb-0">₺{totals.totalInValue.toLocaleString()}</p>
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
                                            <p className="text-uppercase fw-medium text-muted text-truncate mb-0">Toplam Çıkış</p>
                                        </div>
                                        <div className="avatar-sm flex-shrink-0">
                                            <span className="avatar-title bg-danger-subtle rounded fs-3">
                                                <i className="bx bx-up-arrow-alt text-danger"></i>
                                            </span>
                                        </div>
                                    </div>
                                    <div className="d-flex align-items-end justify-content-between mt-4">
                                        <div>
                                            <h4 className="fs-22 fw-semibold ff-secondary mb-4">
                                                <span className="counter-value">{totals.totalOut.toLocaleString()}</span>
                                            </h4>
                                            <p className="text-muted mb-0">₺{totals.totalOutValue.toLocaleString()}</p>
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
                                            <p className="text-uppercase fw-medium text-muted text-truncate mb-0">Net Hareket</p>
                                        </div>
                                        <div className="avatar-sm flex-shrink-0">
                                            <span className="avatar-title bg-info-subtle rounded fs-3">
                                                <i className="bx bx-transfer text-info"></i>
                                            </span>
                                        </div>
                                    </div>
                                    <div className="d-flex align-items-end justify-content-between mt-4">
                                        <div>
                                            <h4 className="fs-22 fw-semibold ff-secondary mb-4">
                                                <span className="counter-value">{(totals.totalIn - totals.totalOut).toLocaleString()}</span>
                                            </h4>
                                            <p className="text-muted mb-0">₺{(totals.totalInValue - totals.totalOutValue).toLocaleString()}</p>
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
                                            <p className="text-uppercase fw-medium text-muted text-truncate mb-0">Toplam Hareket</p>
                                        </div>
                                        <div className="avatar-sm flex-shrink-0">
                                            <span className="avatar-title bg-primary-subtle rounded fs-3">
                                                <i className="bx bx-list-ul text-primary"></i>
                                            </span>
                                        </div>
                                    </div>
                                    <div className="d-flex align-items-end justify-content-between mt-4">
                                        <div>
                                            <h4 className="fs-22 fw-semibold ff-secondary mb-4">
                                                <span className="counter-value">{movements.length}</span>
                                            </h4>
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
                                    <h4 className="card-title mb-0">Filtreler</h4>
                                </div>
                                <div className="card-body">
                                    <div className="row g-3">
                                        <div className="col-md-4">
                                            <label className="form-label">Başlangıç Tarihi</label>
                                            <input
                                                type="date"
                                                className="form-control"
                                                value={dateFrom}
                                                onChange={(e) => setDateFrom(e.target.value)}
                                            />
                                        </div>
                                        <div className="col-md-4">
                                            <label className="form-label">Bitiş Tarihi</label>
                                            <input
                                                type="date"
                                                className="form-control"
                                                value={dateTo}
                                                onChange={(e) => setDateTo(e.target.value)}
                                            />
                                        </div>
                                        <div className="col-md-4">
                                            <label className="form-label">&nbsp;</label>
                                            <div>
                                                <button 
                                                    type="button" 
                                                    className="btn btn-primary"
                                                    onClick={handleFilter}
                                                >
                                                    <i className="ri-equalizer-fill me-1 align-bottom"></i> Filtrele
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Report Table */}
                    <div className="row">
                        <div className="col-lg-12">
                            <div className="card">
                                <div className="card-header align-items-center d-flex">
                                    <h4 className="card-title mb-0 flex-grow-1">
                                        Hareket Raporu ({movements.length} hareket)
                                    </h4>
                                    <div className="flex-shrink-0">
                                        <div className="d-flex gap-1">
                                            <button 
                                                className="btn btn-soft-danger btn-sm"
                                                onClick={exportToPDF}
                                            >
                                                <i className="ri-file-pdf-line align-middle"></i> PDF
                                            </button>
                                            <button 
                                                className="btn btn-soft-success btn-sm"
                                                onClick={exportToExcel}
                                            >
                                                <i className="ri-file-excel-line align-middle"></i> Excel
                                            </button>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="card-body">
                                    <div className="table-responsive table-card">
                                        <table className="table table-nowrap table-striped-columns mb-0">
                                            <thead className="table-light">
                                                <tr>
                                                    <th scope="col">Hareket No</th>
                                                    <th scope="col">Tarih</th>
                                                    <th scope="col">Ürün</th>
                                                    <th scope="col">Hareket Tipi</th>
                                                    <th scope="col">Yön</th>
                                                    <th scope="col">Miktar</th>
                                                    <th scope="col">Birim Fiyat</th>
                                                    <th scope="col">Toplam Değer</th>
                                                    <th scope="col">Depo</th>
                                                    <th scope="col">Açıklama</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {movements.length > 0 ? (
                                                    movements.map((movement) => (
                                                        <tr key={movement.id}>
                                                            <td>
                                                                <span className="fw-medium">{movement.movement_number}</span>
                                                            </td>
                                                            <td>
                                                                <span className="text-muted">
                                                                    {new Date(movement.movement_date).toLocaleDateString('tr-TR')}
                                                                </span>
                                                            </td>
                                                            <td>
                                                                <div className="d-flex align-items-center">
                                                                    <div className="flex-grow-1">
                                                                        <h5 className="fs-14 mb-1">
                                                                            <Link href={`/inventory/items/${movement.inventory_item.id}`} className="text-body">
                                                                                {movement.inventory_item.name}
                                                                            </Link>
                                                                        </h5>
                                                                        <p className="text-muted mb-0 fs-12">SKU: {movement.inventory_item.sku}</p>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td>
                                                                <span className="badge bg-light text-body">
                                                                    {getMovementTypeText(movement.movement_type)}
                                                                </span>
                                                            </td>
                                                            <td>
                                                                {getDirectionBadge(movement.direction)}
                                                            </td>
                                                            <td>
                                                                <span className="fw-medium">
                                                                    {movement.direction === 'in' ? '+' : '-'}{movement.quantity} {movement.unit}
                                                                </span>
                                                            </td>
                                                            <td>
                                                                <span className="fw-medium">₺{movement.unit_cost.toLocaleString()}</span>
                                                            </td>
                                                            <td>
                                                                <span className="fw-medium">₺{movement.total_cost.toLocaleString()}</span>
                                                            </td>
                                                            <td>
                                                                <span className="text-muted">{movement.warehouse.name}</span>
                                                            </td>
                                                            <td>
                                                                <span className="text-muted">{movement.reason_description || '-'}</span>
                                                            </td>
                                                        </tr>
                                                    ))
                                                ) : (
                                                    <tr>
                                                        <td colSpan={10} className="text-center py-4">
                                                            <div className="text-muted">Kayıt bulunamadı</div>
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
};

export default Movement;