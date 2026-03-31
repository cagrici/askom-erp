import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import Layout from '../../../Layouts';

interface InventoryStock {
    id: number;
    quantity_on_hand: number;
    quantity_available: number;
    quantity_allocated: number;
    quantity_reserved: number;
    unit_cost: number;
    total_cost: number;
    lot_number?: string;
    serial_number?: string;
    expiry_date?: string;
    manufacturing_date?: string;
    condition: string;
    status: string;
    last_counted_at?: string;
    last_counted_by?: string;
    created_at: string;
    inventory_item: {
        id: number;
        name: string;
        sku: string;
        barcode?: string;
        base_unit: string;
        reorder_point: number;
        reorder_quantity: number;
    };
    warehouse: {
        id: number;
        name: string;
        code: string;
    };
    location?: {
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
    stocks: {
        data: InventoryStock[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
        links: any[];
    };
    filters: {
        search?: string;
        warehouse_id?: string;
        status?: string;
        condition?: string;
        stock_level?: string;
        expiry_status?: string;
        sort_field?: string;
        sort_direction?: string;
    };
    warehouses: Warehouse[];
}

const Index: React.FC<Props> = ({ stocks, filters, warehouses }) => {
    const [searchTerm, setSearchTerm] = useState(filters.search || '');
    const [selectedWarehouse, setSelectedWarehouse] = useState(filters.warehouse_id || '');
    const [selectedStatus, setSelectedStatus] = useState(filters.status || '');
    const [selectedCondition, setSelectedCondition] = useState(filters.condition || '');
    const [selectedStockLevel, setSelectedStockLevel] = useState(filters.stock_level || '');
    const [selectedExpiryStatus, setSelectedExpiryStatus] = useState(filters.expiry_status || '');

    const handleSearch = () => {
        router.get('/inventory/stocks', {
            search: searchTerm,
            warehouse_id: selectedWarehouse,
            status: selectedStatus,
            condition: selectedCondition,
            stock_level: selectedStockLevel,
            expiry_status: selectedExpiryStatus,
        }, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleSort = (field: string) => {
        const direction = filters.sort_field === field && filters.sort_direction === 'asc' ? 'desc' : 'asc';
        router.get('/inventory/stocks', {
            ...filters,
            sort_field: field,
            sort_direction: direction,
        }, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const getSortIcon = (field: string) => {
        if (filters.sort_field !== field) return 'ri-expand-up-down-line';
        return filters.sort_direction === 'asc' ? 'ri-arrow-up-line' : 'ri-arrow-down-line';
    };

    const getStockStatusBadge = (stock: InventoryStock) => {
        if (stock.quantity_available <= 0) {
            return <span className="badge bg-danger-subtle text-danger">Stok Yok</span>;
        }
        if (stock.quantity_available <= stock.inventory_item.reorder_point) {
            return <span className="badge bg-warning-subtle text-warning">Düşük Stok</span>;
        }
        return <span className="badge bg-success-subtle text-success">Normal</span>;
    };

    const getConditionBadge = (condition: string) => {
        const conditions: { [key: string]: { text: string; class: string } } = {
            'good': { text: 'İyi', class: 'bg-success-subtle text-success' },
            'damaged': { text: 'Hasarlı', class: 'bg-danger-subtle text-danger' },
            'expired': { text: 'Vadesi Geçmiş', class: 'bg-dark-subtle text-dark' },
            'quarantine': { text: 'Karantina', class: 'bg-warning-subtle text-warning' },
            'returned': { text: 'İade', class: 'bg-info-subtle text-info' }
        };
        const conditionInfo = conditions[condition] || { text: condition, class: 'bg-secondary-subtle text-secondary' };
        return <span className={`badge ${conditionInfo.class}`}>{conditionInfo.text}</span>;
    };

    const getStatusBadge = (status: string) => {
        const statuses: { [key: string]: { text: string; class: string } } = {
            'active': { text: 'Aktif', class: 'bg-success-subtle text-success' },
            'blocked': { text: 'Bloklu', class: 'bg-danger-subtle text-danger' },
            'reserved': { text: 'Rezerve', class: 'bg-warning-subtle text-warning' },
            'quarantine': { text: 'Karantina', class: 'bg-info-subtle text-info' }
        };
        const statusInfo = statuses[status] || { text: status, class: 'bg-secondary-subtle text-secondary' };
        return <span className={`badge ${statusInfo.class}`}>{statusInfo.text}</span>;
    };

    const getExpiryWarning = (expiryDate?: string) => {
        if (!expiryDate) return null;
        
        const expiry = new Date(expiryDate);
        const now = new Date();
        const daysUntilExpiry = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysUntilExpiry < 0) {
            return <span className="badge bg-danger-subtle text-danger">Vadesi Geçmiş</span>;
        } else if (daysUntilExpiry <= 30) {
            return <span className="badge bg-warning-subtle text-warning">{daysUntilExpiry} gün kaldı</span>;
        }
        return null;
    };

    return (
        <Layout>
            <Head title="Stok Seviyeleri" />
            
            <div className="page-content">
                <div className="container-fluid">
                    {/* Page Title */}
                    <div className="row">
                        <div className="col-12">
                            <div className="page-title-box d-sm-flex align-items-center justify-content-between">
                                <h4 className="mb-sm-0">Stok Seviyeleri</h4>
                                <div className="page-title-right">
                                    <ol className="breadcrumb m-0">
                                        <li className="breadcrumb-item"><Link href="/inventory">Envanter</Link></li>
                                        <li className="breadcrumb-item active">Stok Seviyeleri</li>
                                    </ol>
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
                                        <div className="col-xxl-3 col-sm-6">
                                            <div className="search-box">
                                                <input
                                                    type="text"
                                                    className="form-control"
                                                    placeholder="Ara (Ürün Adı, SKU...)"
                                                    value={searchTerm}
                                                    onChange={(e) => setSearchTerm(e.target.value)}
                                                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                                                />
                                                <i className="ri-search-line search-icon"></i>
                                            </div>
                                        </div>
                                        <div className="col-xxl-2 col-sm-6">
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
                                        <div className="col-xxl-2 col-sm-6">
                                            <select 
                                                className="form-select"
                                                value={selectedStatus}
                                                onChange={(e) => setSelectedStatus(e.target.value)}
                                            >
                                                <option value="">Tüm Durumlar</option>
                                                <option value="active">Aktif</option>
                                                <option value="blocked">Bloklu</option>
                                                <option value="reserved">Rezerve</option>
                                                <option value="quarantine">Karantina</option>
                                            </select>
                                        </div>
                                        <div className="col-xxl-2 col-sm-6">
                                            <select 
                                                className="form-select"
                                                value={selectedCondition}
                                                onChange={(e) => setSelectedCondition(e.target.value)}
                                            >
                                                <option value="">Tüm Durumlar</option>
                                                <option value="good">İyi</option>
                                                <option value="damaged">Hasarlı</option>
                                                <option value="expired">Vadesi Geçmiş</option>
                                                <option value="quarantine">Karantina</option>
                                                <option value="returned">İade</option>
                                            </select>
                                        </div>
                                        <div className="col-xxl-2 col-sm-6">
                                            <select 
                                                className="form-select"
                                                value={selectedStockLevel}
                                                onChange={(e) => setSelectedStockLevel(e.target.value)}
                                            >
                                                <option value="">Tüm Stok Seviyeleri</option>
                                                <option value="available">Kullanılabilir</option>
                                                <option value="allocated">Ayrılmış</option>
                                                <option value="empty">Boş</option>
                                            </select>
                                        </div>
                                        <div className="col-xxl-2 col-sm-6">
                                            <select 
                                                className="form-select"
                                                value={selectedExpiryStatus}
                                                onChange={(e) => setSelectedExpiryStatus(e.target.value)}
                                            >
                                                <option value="">Tüm SKT Durumları</option>
                                                <option value="expiring">Yaklaşan SKT</option>
                                                <option value="expired">Vadesi Geçmiş</option>
                                            </select>
                                        </div>
                                        <div className="col-xxl-1 col-sm-6">
                                            <button 
                                                type="button" 
                                                className="btn btn-primary w-100"
                                                onClick={handleSearch}
                                            >
                                                <i className="ri-equalizer-fill me-1 align-bottom"></i> Filtrele
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Stocks Table */}
                    <div className="row">
                        <div className="col-lg-12">
                            <div className="card">
                                <div className="card-header align-items-center d-flex">
                                    <h4 className="card-title mb-0 flex-grow-1">
                                        Stok Seviyeleri ({stocks.total})
                                    </h4>
                                    <div className="flex-shrink-0">
                                        <div className="d-flex gap-1">
                                            <button className="btn btn-soft-primary btn-sm">
                                                <i className="ri-calculator-line align-middle"></i> Sayım Başlat
                                            </button>
                                            <button className="btn btn-soft-danger btn-sm">
                                                <i className="ri-file-pdf-line align-middle"></i> PDF
                                            </button>
                                            <button className="btn btn-soft-success btn-sm">
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
                                                    <th scope="col">Ürün</th>
                                                    <th scope="col">Depo / Lokasyon</th>
                                                    <th 
                                                        scope="col"
                                                        style={{ cursor: 'pointer' }}
                                                        onClick={() => handleSort('quantity_on_hand')}
                                                    >
                                                        Eldeki Miktar <i className={getSortIcon('quantity_on_hand')}></i>
                                                    </th>
                                                    <th 
                                                        scope="col"
                                                        style={{ cursor: 'pointer' }}
                                                        onClick={() => handleSort('quantity_available')}
                                                    >
                                                        Kullanılabilir <i className={getSortIcon('quantity_available')}></i>
                                                    </th>
                                                    <th scope="col">Ayrılmış</th>
                                                    <th scope="col">Lot/Seri</th>
                                                    <th scope="col">Son Kullanma</th>
                                                    <th scope="col">Durum</th>
                                                    <th scope="col">Kalite</th>
                                                    <th 
                                                        scope="col"
                                                        style={{ cursor: 'pointer' }}
                                                        onClick={() => handleSort('total_cost')}
                                                    >
                                                        Toplam Değer <i className={getSortIcon('total_cost')}></i>
                                                    </th>
                                                    <th scope="col">İşlemler</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {stocks.data.length > 0 ? (
                                                    stocks.data.map((stock) => (
                                                        <tr key={stock.id}>
                                                            <td>
                                                                <div className="d-flex align-items-center">
                                                                    <div className="flex-grow-1">
                                                                        <h5 className="fs-14 mb-1">
                                                                            <Link href={`/inventory/items/${stock.inventory_item.id}`} className="text-body">
                                                                                {stock.inventory_item.name}
                                                                            </Link>
                                                                        </h5>
                                                                        <p className="text-muted mb-0 fs-12">
                                                                            SKU: {stock.inventory_item.sku}
                                                                            {stock.inventory_item.barcode && (
                                                                                <> | {stock.inventory_item.barcode}</>
                                                                            )}
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td>
                                                                <span className="fw-medium">{stock.warehouse.name}</span>
                                                                {stock.location && (
                                                                    <React.Fragment><br /><small className="text-muted">{stock.location.name}</small></React.Fragment>
                                                                )}
                                                            </td>
                                                            <td>
                                                                <span className="fw-medium">
                                                                    {stock.quantity_on_hand} {stock.inventory_item.base_unit}
                                                                </span>
                                                                <React.Fragment><br />{getStockStatusBadge(stock)}</React.Fragment>
                                                            </td>
                                                            <td>
                                                                <span className="fw-medium text-success">
                                                                    {stock.quantity_available} {stock.inventory_item.base_unit}
                                                                </span>
                                                            </td>
                                                            <td>
                                                                <span className="fw-medium text-warning">
                                                                    {stock.quantity_allocated} {stock.inventory_item.base_unit}
                                                                </span>
                                                                {stock.quantity_reserved > 0 && (
                                                                    <React.Fragment><br /><small className="text-info">Rezerve: {stock.quantity_reserved}</small></React.Fragment>
                                                                )}
                                                            </td>
                                                            <td>
                                                                {stock.lot_number && (
                                                                    <span className="badge bg-light text-body">Lot: {stock.lot_number}</span>
                                                                )}
                                                                {stock.serial_number && (
                                                                    <React.Fragment><br /><span className="badge bg-light text-body">SN: {stock.serial_number}</span></React.Fragment>
                                                                )}
                                                            </td>
                                                            <td>
                                                                {stock.expiry_date ? (
                                                                    <>
                                                                        <span className="text-muted">
                                                                            {new Date(stock.expiry_date).toLocaleDateString('tr-TR')}
                                                                        </span>
                                                                        <React.Fragment><br />{getExpiryWarning(stock.expiry_date)}</React.Fragment>
                                                                    </>
                                                                ) : (
                                                                    <span className="text-muted">-</span>
                                                                )}
                                                            </td>
                                                            <td>
                                                                {getStatusBadge(stock.status)}
                                                            </td>
                                                            <td>
                                                                {getConditionBadge(stock.condition)}
                                                            </td>
                                                            <td>
                                                                <span className="fw-medium">₺{stock.total_cost.toLocaleString()}</span>
                                                                <React.Fragment><br /><small className="text-muted">@₺{stock.unit_cost.toLocaleString()}</small></React.Fragment>
                                                            </td>
                                                            <td>
                                                                <div className="dropdown">
                                                                    <button className="btn btn-soft-secondary btn-sm dropdown" type="button" data-bs-toggle="dropdown" aria-expanded="false">
                                                                        <i className="ri-more-fill align-middle"></i>
                                                                    </button>
                                                                    <ul className="dropdown-menu dropdown-menu-end">
                                                                        <li>
                                                                            <a className="dropdown-item" href="#" data-bs-toggle="modal" data-bs-target="#adjustmentModal">
                                                                                <i className="ri-edit-box-line align-bottom me-2 text-muted"></i> Stok Düzeltme
                                                                            </a>
                                                                        </li>
                                                                        <li>
                                                                            <a className="dropdown-item" href="#" data-bs-toggle="modal" data-bs-target="#cycleCountModal">
                                                                                <i className="ri-calculator-line align-bottom me-2 text-muted"></i> Sayım Yap
                                                                            </a>
                                                                        </li>
                                                                        <li>
                                                                            <a className="dropdown-item" href="#" data-bs-toggle="modal" data-bs-target="#transferModal">
                                                                                <i className="ri-truck-line align-bottom me-2 text-muted"></i> Transfer Et
                                                                            </a>
                                                                        </li>
                                                                        <li className="dropdown-divider"></li>
                                                                        <li>
                                                                            <a className="dropdown-item" href="#" data-bs-toggle="modal" data-bs-target="#blockModal">
                                                                                <i className="ri-forbid-line align-bottom me-2 text-muted"></i> Blokla
                                                                            </a>
                                                                        </li>
                                                                        <li>
                                                                            <a className="dropdown-item" href="#" data-bs-toggle="modal" data-bs-target="#reserveModal">
                                                                                <i className="ri-bookmark-line align-bottom me-2 text-muted"></i> Rezerve Et
                                                                            </a>
                                                                        </li>
                                                                    </ul>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ))
                                                ) : (
                                                    <tr>
                                                        <td colSpan={11} className="text-center py-4">
                                                            <div className="text-muted">Kayıt bulunamadı</div>
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                    
                                    {/* Pagination */}
                                    {stocks.last_page > 1 && (
                                        <div className="d-flex justify-content-end mt-3">
                                            <nav aria-label="Page navigation">
                                                <ul className="pagination pagination-sm mb-0">
                                                    {stocks.links.map((link, index) => (
                                                        <li key={index} className={`page-item ${link.active ? 'active' : ''} ${!link.url ? 'disabled' : ''}`}>
                                                            {link.url ? (
                                                                <Link
                                                                    className="page-link"
                                                                    href={link.url}
                                                                    preserveState
                                                                    preserveScroll
                                                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                                                />
                                                            ) : (
                                                                <span className="page-link" dangerouslySetInnerHTML={{ __html: link.label }} />
                                                            )}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </nav>
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

export default Index;