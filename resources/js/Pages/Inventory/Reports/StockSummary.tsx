import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import Layout from '../../../Layouts';

interface InventoryItem {
    id: number;
    name: string;
    sku: string;
    barcode?: string;
    category?: string;
    item_type: string;
    base_unit: string;
    reorder_point: number;
    reorder_quantity: number;
    abc_classification?: string;
    stocks: InventoryStock[];
}

interface InventoryStock {
    id: number;
    warehouse_id: number;
    quantity_on_hand: number;
    quantity_available: number;
    quantity_allocated: number;
    total_cost: number;
    unit_cost: number;
    warehouse: {
        id: number;
        name: string;
        code: string;
    };
}

interface Warehouse {
    id: number;
    name: string;
    code: string;
}

interface Props {
    items: InventoryItem[];
    filters: {
        warehouse_id?: string;
        category?: string;
    };
    warehouses: Warehouse[];
}

const StockSummary: React.FC<Props> = ({ items, filters, warehouses }) => {
    const [selectedWarehouse, setSelectedWarehouse] = useState(filters.warehouse_id || '');
    const [selectedCategory, setSelectedCategory] = useState(filters.category || '');

    const handleFilter = () => {
        router.get('/inventory/reports', {
            type: 'stock_summary',
            warehouse_id: selectedWarehouse,
            category: selectedCategory,
        }, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const calculateTotals = () => {
        return items.reduce((totals, item) => {
            const itemStocks = selectedWarehouse 
                ? item.stocks.filter(stock => stock.warehouse_id.toString() === selectedWarehouse)
                : item.stocks;

            const totalQuantity = itemStocks.reduce((sum, stock) => sum + stock.quantity_on_hand, 0);
            const totalValue = itemStocks.reduce((sum, stock) => sum + stock.total_cost, 0);

            return {
                totalItems: totals.totalItems + (totalQuantity > 0 ? 1 : 0),
                totalQuantity: totals.totalQuantity + totalQuantity,
                totalValue: totals.totalValue + totalValue,
            };
        }, { totalItems: 0, totalQuantity: 0, totalValue: 0 });
    };

    const totals = calculateTotals();

    const exportToPDF = () => {
        window.print();
    };

    const exportToExcel = () => {
        const csvContent = "data:text/csv;charset=utf-8," 
            + "SKU,Ürün Adı,Kategori,Eldeki Miktar,Kullanılabilir,Ayrılmış,Birim Fiyat,Toplam Değer,Depo\n"
            + items.map(item => {
                return item.stocks.map(stock => 
                    `${item.sku},"${item.name}","${item.category || ''}",${stock.quantity_on_hand},${stock.quantity_available},${stock.quantity_allocated},${stock.unit_cost},${stock.total_cost},"${stock.warehouse.name}"`
                ).join('\n');
            }).join('\n');

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "stok_ozet_raporu.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <Layout>
            <Head title="Stok Özet Raporu" />
            
            <div className="page-content">
                <div className="container-fluid">
                    {/* Page Title */}
                    <div className="row">
                        <div className="col-12">
                            <div className="page-title-box d-sm-flex align-items-center justify-content-between">
                                <h4 className="mb-sm-0">Stok Özet Raporu</h4>
                                <div className="page-title-right">
                                    <ol className="breadcrumb m-0">
                                        <li className="breadcrumb-item"><Link href="/inventory">Envanter</Link></li>
                                        <li className="breadcrumb-item"><Link href="/inventory/reports">Raporlar</Link></li>
                                        <li className="breadcrumb-item active">Stok Özeti</li>
                                    </ol>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Summary Cards */}
                    <div className="row">
                        <div className="col-xl-4 col-md-6">
                            <div className="card card-animate">
                                <div className="card-body">
                                    <div className="d-flex align-items-center">
                                        <div className="flex-grow-1 overflow-hidden">
                                            <p className="text-uppercase fw-medium text-muted text-truncate mb-0">Toplam Kalem</p>
                                        </div>
                                        <div className="avatar-sm flex-shrink-0">
                                            <span className="avatar-title bg-primary-subtle rounded fs-3">
                                                <i className="bx bx-package text-primary"></i>
                                            </span>
                                        </div>
                                    </div>
                                    <div className="d-flex align-items-end justify-content-between mt-4">
                                        <div>
                                            <h4 className="fs-22 fw-semibold ff-secondary mb-4">
                                                <span className="counter-value">{totals.totalItems}</span>
                                            </h4>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="col-xl-4 col-md-6">
                            <div className="card card-animate">
                                <div className="card-body">
                                    <div className="d-flex align-items-center">
                                        <div className="flex-grow-1 overflow-hidden">
                                            <p className="text-uppercase fw-medium text-muted text-truncate mb-0">Toplam Miktar</p>
                                        </div>
                                        <div className="avatar-sm flex-shrink-0">
                                            <span className="avatar-title bg-success-subtle rounded fs-3">
                                                <i className="bx bx-cube text-success"></i>
                                            </span>
                                        </div>
                                    </div>
                                    <div className="d-flex align-items-end justify-content-between mt-4">
                                        <div>
                                            <h4 className="fs-22 fw-semibold ff-secondary mb-4">
                                                <span className="counter-value">{totals.totalQuantity.toLocaleString()}</span>
                                            </h4>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="col-xl-4 col-md-6">
                            <div className="card card-animate">
                                <div className="card-body">
                                    <div className="d-flex align-items-center">
                                        <div className="flex-grow-1 overflow-hidden">
                                            <p className="text-uppercase fw-medium text-muted text-truncate mb-0">Toplam Değer</p>
                                        </div>
                                        <div className="avatar-sm flex-shrink-0">
                                            <span className="avatar-title bg-warning-subtle rounded fs-3">
                                                <i className="bx bx-dollar-circle text-warning"></i>
                                            </span>
                                        </div>
                                    </div>
                                    <div className="d-flex align-items-end justify-content-between mt-4">
                                        <div>
                                            <h4 className="fs-22 fw-semibold ff-secondary mb-4">
                                                ₺<span className="counter-value">{totals.totalValue.toLocaleString()}</span>
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
                                            <label className="form-label">Depo</label>
                                            <select 
                                                className="form-select"
                                                value={selectedWarehouse}
                                                onChange={(e) => setSelectedWarehouse(e.target.value)}
                                            >
                                                <option value="">Tüm Depolar</option>
                                                {warehouses.map((warehouse) => (
                                                    <option key={warehouse.id} value={warehouse.id}>
                                                        {warehouse.name}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="col-md-4">
                                            <label className="form-label">Kategori</label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                placeholder="Kategori adı"
                                                value={selectedCategory}
                                                onChange={(e) => setSelectedCategory(e.target.value)}
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
                                        Stok Özet Raporu ({items.length} kalem)
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
                                                    <th scope="col">SKU</th>
                                                    <th scope="col">Ürün Adı</th>
                                                    <th scope="col">Kategori</th>
                                                    <th scope="col">Eldeki Miktar</th>
                                                    <th scope="col">Kullanılabilir</th>
                                                    <th scope="col">Ayrılmış</th>
                                                    <th scope="col">Birim Fiyat</th>
                                                    <th scope="col">Toplam Değer</th>
                                                    <th scope="col">Depo</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {items.length > 0 ? (
                                                    items.map((item) => {
                                                        const filteredStocks = selectedWarehouse 
                                                            ? item.stocks.filter(stock => stock.warehouse_id.toString() === selectedWarehouse)
                                                            : item.stocks;

                                                        return filteredStocks.map((stock, stockIndex) => (
                                                            <tr key={`${item.id}-${stock.id}`}>
                                                                {stockIndex === 0 && (
                                                                    <>
                                                                        <td rowSpan={filteredStocks.length}>
                                                                            <span className="fw-medium">{item.sku}</span>
                                                                        </td>
                                                                        <td rowSpan={filteredStocks.length}>
                                                                            <Link href={`/inventory/items/${item.id}`} className="text-body">
                                                                                {item.name}
                                                                            </Link>
                                                                        </td>
                                                                        <td rowSpan={filteredStocks.length}>
                                                                            <span className="text-muted">{item.category || '-'}</span>
                                                                        </td>
                                                                    </>
                                                                )}
                                                                <td>
                                                                    <span className="fw-medium">{stock.quantity_on_hand} {item.base_unit}</span>
                                                                </td>
                                                                <td>
                                                                    <span className="text-success">{stock.quantity_available} {item.base_unit}</span>
                                                                </td>
                                                                <td>
                                                                    <span className="text-warning">{stock.quantity_allocated} {item.base_unit}</span>
                                                                </td>
                                                                <td>
                                                                    <span className="fw-medium">₺{stock.unit_cost.toLocaleString()}</span>
                                                                </td>
                                                                <td>
                                                                    <span className="fw-medium">₺{stock.total_cost.toLocaleString()}</span>
                                                                </td>
                                                                <td>
                                                                    <span className="text-muted">{stock.warehouse.name}</span>
                                                                </td>
                                                            </tr>
                                                        ));
                                                    })
                                                ) : (
                                                    <tr>
                                                        <td colSpan={9} className="text-center py-4">
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

export default StockSummary;