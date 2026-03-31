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
    lot_number?: string;
    movement_date: string;
    reason_description?: string;
    notes?: string;
    stock_before: number;
    stock_after: number;
    unit_cost: number;
    total_cost: number;
    status: string;
    inventory_item: {
        id: number;
        name: string;
        sku: string;
        barcode?: string;
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
    creator: {
        id: number;
        name: string;
    };
}

interface Warehouse {
    id: number;
    name: string;
    code: string;
}

interface Props {
    movements: {
        data: InventoryMovement[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
        links: any[];
    };
    filters: {
        search?: string;
        movement_type?: string;
        direction?: string;
        warehouse_id?: string;
        date_from?: string;
        date_to?: string;
        status?: string;
        sort_field?: string;
        sort_direction?: string;
    };
    warehouses: Warehouse[];
}

const Index: React.FC<Props> = ({ movements, filters, warehouses }) => {
    const [searchTerm, setSearchTerm] = useState(filters.search || '');
    const [selectedType, setSelectedType] = useState(filters.movement_type || '');
    const [selectedDirection, setSelectedDirection] = useState(filters.direction || '');
    const [selectedWarehouse, setSelectedWarehouse] = useState(filters.warehouse_id || '');
    const [dateFrom, setDateFrom] = useState(filters.date_from || '');
    const [dateTo, setDateTo] = useState(filters.date_to || '');
    const [selectedStatus, setSelectedStatus] = useState(filters.status || '');

    const handleSearch = () => {
        router.get('/inventory/movements', {
            search: searchTerm,
            movement_type: selectedType,
            direction: selectedDirection,
            warehouse_id: selectedWarehouse,
            date_from: dateFrom,
            date_to: dateTo,
            status: selectedStatus,
        }, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleSort = (field: string) => {
        const direction = filters.sort_field === field && filters.sort_direction === 'asc' ? 'desc' : 'asc';
        router.get('/inventory/movements', {
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

    const getMovementTypeText = (type: string) => {
        const types: { [key: string]: string } = {
            'receipt': 'Giriş',
            'issue': 'Çıkış',
            'transfer': 'Transfer',
            'adjustment': 'Düzeltme',
            'production': 'Üretim',
            'return': 'İade',
            'cycle_count': 'Sayım',
            'damage': 'Hasarlı',
            'expiry': 'Vadesi Geçmiş'
        };
        return types[type] || type;
    };

    const getDirectionBadge = (direction: string) => {
        return direction === 'in' 
            ? <span className="badge bg-success-subtle text-success">Giriş</span>
            : <span className="badge bg-danger-subtle text-danger">Çıkış</span>;
    };

    const getStatusBadge = (status: string) => {
        const statuses: { [key: string]: { text: string; class: string } } = {
            'completed': { text: 'Tamamlandı', class: 'bg-success-subtle text-success' },
            'pending': { text: 'Beklemede', class: 'bg-warning-subtle text-warning' },
            'cancelled': { text: 'İptal Edildi', class: 'bg-danger-subtle text-danger' },
            'processing': { text: 'İşlemde', class: 'bg-info-subtle text-info' }
        };
        const statusInfo = statuses[status] || { text: status, class: 'bg-secondary-subtle text-secondary' };
        return <span className={`badge ${statusInfo.class}`}>{statusInfo.text}</span>;
    };

    return (
        <Layout>
            <Head title="Envanter Hareketleri" />
            
            <div className="page-content">
                <div className="container-fluid">
                    {/* Page Title */}
                    <div className="row">
                        <div className="col-12">
                            <div className="page-title-box d-sm-flex align-items-center justify-content-between">
                                <h4 className="mb-sm-0">Envanter Hareketleri</h4>
                                <div className="page-title-right">
                                    <ol className="breadcrumb m-0">
                                        <li className="breadcrumb-item"><Link href="/inventory">Envanter</Link></li>
                                        <li className="breadcrumb-item active">Hareketler</li>
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
                                                    placeholder="Ara (Hareket No, Referans, Ürün...)"
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
                                                value={selectedType}
                                                onChange={(e) => setSelectedType(e.target.value)}
                                            >
                                                <option value="">Tüm Hareket Tipleri</option>
                                                <option value="receipt">Giriş</option>
                                                <option value="issue">Çıkış</option>
                                                <option value="transfer">Transfer</option>
                                                <option value="adjustment">Düzeltme</option>
                                                <option value="production">Üretim</option>
                                                <option value="return">İade</option>
                                                <option value="cycle_count">Sayım</option>
                                                <option value="damage">Hasarlı</option>
                                                <option value="expiry">Vadesi Geçmiş</option>
                                            </select>
                                        </div>
                                        <div className="col-xxl-2 col-sm-6">
                                            <select 
                                                className="form-select"
                                                value={selectedDirection}
                                                onChange={(e) => setSelectedDirection(e.target.value)}
                                            >
                                                <option value="">Tüm Yönler</option>
                                                <option value="in">Giriş</option>
                                                <option value="out">Çıkış</option>
                                            </select>
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
                                            <input
                                                type="date"
                                                className="form-control"
                                                placeholder="Başlangıç Tarihi"
                                                value={dateFrom}
                                                onChange={(e) => setDateFrom(e.target.value)}
                                            />
                                        </div>
                                        <div className="col-xxl-2 col-sm-6">
                                            <input
                                                type="date"
                                                className="form-control"
                                                placeholder="Bitiş Tarihi"
                                                value={dateTo}
                                                onChange={(e) => setDateTo(e.target.value)}
                                            />
                                        </div>
                                        <div className="col-xxl-2 col-sm-6">
                                            <select 
                                                className="form-select"
                                                value={selectedStatus}
                                                onChange={(e) => setSelectedStatus(e.target.value)}
                                            >
                                                <option value="">Tüm Durumlar</option>
                                                <option value="completed">Tamamlandı</option>
                                                <option value="pending">Beklemede</option>
                                                <option value="processing">İşlemde</option>
                                                <option value="cancelled">İptal Edildi</option>
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

                    {/* Movements Table */}
                    <div className="row">
                        <div className="col-lg-12">
                            <div className="card">
                                <div className="card-header align-items-center d-flex">
                                    <h4 className="card-title mb-0 flex-grow-1">
                                        Envanter Hareketleri ({movements.total})
                                    </h4>
                                    <div className="flex-shrink-0">
                                        <div className="d-flex gap-1">
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
                                                    <th 
                                                        scope="col" 
                                                        style={{ cursor: 'pointer' }}
                                                        onClick={() => handleSort('movement_number')}
                                                    >
                                                        Hareket No <i className={getSortIcon('movement_number')}></i>
                                                    </th>
                                                    <th 
                                                        scope="col"
                                                        style={{ cursor: 'pointer' }}
                                                        onClick={() => handleSort('movement_date')}
                                                    >
                                                        Tarih <i className={getSortIcon('movement_date')}></i>
                                                    </th>
                                                    <th scope="col">Ürün</th>
                                                    <th scope="col">Hareket Tipi</th>
                                                    <th scope="col">Yön</th>
                                                    <th scope="col">Miktar</th>
                                                    <th scope="col">Depo</th>
                                                    <th scope="col">Birim Fiyat</th>
                                                    <th scope="col">Toplam Değer</th>
                                                    <th scope="col">Durum</th>
                                                    <th scope="col">İşlemler</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {movements.data.length > 0 ? (
                                                    movements.data.map((movement) => (
                                                        <tr key={movement.id}>
                                                            <td>
                                                                <span className="fw-medium">{movement.movement_number}</span>
                                                                {movement.lot_number && (
                                                                    <React.Fragment><br /><small className="text-muted">Lot: {movement.lot_number}</small></React.Fragment>
                                                                )}
                                                            </td>
                                                            <td>
                                                                <span className="text-muted">
                                                                    {new Date(movement.movement_date).toLocaleDateString('tr-TR')}
                                                                </span>
                                                                <React.Fragment>
                                                                    <br />
                                                                    <small className="text-muted">
                                                                        {new Date(movement.movement_date).toLocaleTimeString('tr-TR', { 
                                                                            hour: '2-digit', 
                                                                            minute: '2-digit' 
                                                                        })}
                                                                    </small>
                                                                </React.Fragment>
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
                                                                <React.Fragment>
                                                                    <br />
                                                                    <small className="text-muted">
                                                                        {movement.stock_before} → {movement.stock_after}
                                                                    </small>
                                                                </React.Fragment>
                                                            </td>
                                                            <td>
                                                                <span className="text-muted">{movement.warehouse.name}</span>
                                                                {movement.location && (
                                                                    <React.Fragment><br /><small className="text-muted">{movement.location.name}</small></React.Fragment>
                                                                )}
                                                            </td>
                                                            <td>
                                                                <span className="fw-medium">₺{movement.unit_cost.toLocaleString()}</span>
                                                            </td>
                                                            <td>
                                                                <span className="fw-medium">₺{movement.total_cost.toLocaleString()}</span>
                                                            </td>
                                                            <td>
                                                                {getStatusBadge(movement.status)}
                                                            </td>
                                                            <td>
                                                                <div className="dropdown">
                                                                    <button className="btn btn-soft-secondary btn-sm dropdown" type="button" data-bs-toggle="dropdown" aria-expanded="false">
                                                                        <i className="ri-more-fill align-middle"></i>
                                                                    </button>
                                                                    <ul className="dropdown-menu dropdown-menu-end">
                                                                        <li>
                                                                            <a className="dropdown-item" href="#">
                                                                                <i className="ri-eye-fill align-bottom me-2 text-muted"></i> Detayları Görüntüle
                                                                            </a>
                                                                        </li>
                                                                        <li>
                                                                            <a className="dropdown-item" href="#">
                                                                                <i className="ri-printer-line align-bottom me-2 text-muted"></i> Yazdır
                                                                            </a>
                                                                        </li>
                                                                        {movement.status === 'pending' && (
                                                                            <>
                                                                                <li className="dropdown-divider"></li>
                                                                                <li>
                                                                                    <a className="dropdown-item text-danger" href="#">
                                                                                        <i className="ri-close-circle-line align-bottom me-2"></i> İptal Et
                                                                                    </a>
                                                                                </li>
                                                                            </>
                                                                        )}
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
                                    {movements.last_page > 1 && (
                                        <div className="d-flex justify-content-end mt-3">
                                            <nav aria-label="Page navigation">
                                                <ul className="pagination pagination-sm mb-0">
                                                    {movements.links.map((link, index) => (
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