import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import Layout from '../../../Layouts';

interface InventoryItem {
    id: number;
    name: string;
    sku: string;
    barcode?: string;
    description?: string;
    category?: string;
    item_type: string;
    status: string;
    reorder_point: number;
    reorder_quantity: number;
    abc_classification?: string;
    base_unit: string;
    total_stock?: number;
    available_stock?: number;
    allocated_stock?: number;
    total_value?: number;
    stocks: any[];
    movements: any[];
}

interface Props {
    items: {
        data: InventoryItem[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
        links: any[];
    };
    filters: {
        search?: string;
        status?: string;
        item_type?: string;
        category?: string;
        stock_level?: string;
        abc_classification?: string;
        sort_field?: string;
        sort_direction?: string;
    };
    categories: string[];
}

const Index: React.FC<Props> = ({ items, filters, categories }) => {
    const [searchTerm, setSearchTerm] = useState(filters.search || '');
    const [selectedStatus, setSelectedStatus] = useState(filters.status || '');
    const [selectedType, setSelectedType] = useState(filters.item_type || '');
    const [selectedCategory, setSelectedCategory] = useState(filters.category || '');
    const [selectedStockLevel, setSelectedStockLevel] = useState(filters.stock_level || '');
    const [selectedABC, setSelectedABC] = useState(filters.abc_classification || '');

    const handleSearch = () => {
        router.get('/inventory/items', {
            search: searchTerm,
            status: selectedStatus,
            item_type: selectedType,
            category: selectedCategory,
            stock_level: selectedStockLevel,
            abc_classification: selectedABC,
        }, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleSort = (field: string) => {
        const direction = filters.sort_field === field && filters.sort_direction === 'asc' ? 'desc' : 'asc';
        router.get('/inventory/items', {
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

    const getStockStatusBadge = (item: InventoryItem) => {
        if (!item.available_stock || item.available_stock <= 0) {
            return <span className="badge bg-danger-subtle text-danger">Stok Yok</span>;
        }
        if (item.available_stock <= item.reorder_point) {
            return <span className="badge bg-warning-subtle text-warning">Düşük Stok</span>;
        }
        return <span className="badge bg-success-subtle text-success">Normal</span>;
    };

    const getABCBadge = (classification?: string) => {
        if (!classification) return null;
        const colors = {
            'A': 'bg-success-subtle text-success',
            'B': 'bg-warning-subtle text-warning',
            'C': 'bg-info-subtle text-info'
        };
        return <span className={`badge ${colors[classification as keyof typeof colors] || 'bg-secondary-subtle text-secondary'}`}>{classification}</span>;
    };

    return (
        <Layout>
            <Head title="Envanter Kalemleri" />
            
            <div className="page-content">
                <div className="container-fluid">
                    {/* Page Title */}
                    <div className="row">
                        <div className="col-12">
                            <div className="page-title-box d-sm-flex align-items-center justify-content-between">
                                <h4 className="mb-sm-0">Envanter Kalemleri</h4>
                                <div className="page-title-right">
                                    <ol className="breadcrumb m-0">
                                        <li className="breadcrumb-item"><Link href="/inventory">Envanter</Link></li>
                                        <li className="breadcrumb-item active">Kalemler</li>
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
                                                    placeholder="Ara (İsim, SKU, Barkod...)"
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
                                                value={selectedStatus}
                                                onChange={(e) => setSelectedStatus(e.target.value)}
                                            >
                                                <option value="">Tüm Durumlar</option>
                                                <option value="active">Aktif</option>
                                                <option value="inactive">Pasif</option>
                                                <option value="discontinued">Kullanımdan Kaldırılmış</option>
                                            </select>
                                        </div>
                                        <div className="col-xxl-2 col-sm-6">
                                            <select 
                                                className="form-select"
                                                value={selectedType}
                                                onChange={(e) => setSelectedType(e.target.value)}
                                            >
                                                <option value="">Tüm Tipler</option>
                                                <option value="raw_material">Hammadde</option>
                                                <option value="finished_product">Bitmiş Ürün</option>
                                                <option value="semi_finished">Yarı Mamul</option>
                                                <option value="consumable">Sarf Malzemesi</option>
                                                <option value="packaging">Ambalaj</option>
                                                <option value="spare_part">Yedek Parça</option>
                                            </select>
                                        </div>
                                        <div className="col-xxl-2 col-sm-6">
                                            <select 
                                                className="form-select"
                                                value={selectedCategory}
                                                onChange={(e) => setSelectedCategory(e.target.value)}
                                            >
                                                <option value="">Tüm Kategoriler</option>
                                                {categories.map((category) => (
                                                    <option key={category} value={category}>{category}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="col-xxl-2 col-sm-6">
                                            <select 
                                                className="form-select"
                                                value={selectedStockLevel}
                                                onChange={(e) => setSelectedStockLevel(e.target.value)}
                                            >
                                                <option value="">Tüm Stok Seviyeleri</option>
                                                <option value="normal">Normal</option>
                                                <option value="low">Düşük</option>
                                                <option value="out">Stok Yok</option>
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

                    {/* Items Table */}
                    <div className="row">
                        <div className="col-lg-12">
                            <div className="card">
                                <div className="card-header align-items-center d-flex">
                                    <h4 className="card-title mb-0 flex-grow-1">
                                        Envanter Kalemleri ({items.total})
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
                                                        onClick={() => handleSort('name')}
                                                    >
                                                        Ürün Adı <i className={getSortIcon('name')}></i>
                                                    </th>
                                                    <th 
                                                        scope="col"
                                                        style={{ cursor: 'pointer' }}
                                                        onClick={() => handleSort('sku')}
                                                    >
                                                        SKU <i className={getSortIcon('sku')}></i>
                                                    </th>
                                                    <th scope="col">Kategori</th>
                                                    <th scope="col">Tip</th>
                                                    <th scope="col">Eldeki Stok</th>
                                                    <th scope="col">Kullanılabilir</th>
                                                    <th scope="col">Durumu</th>
                                                    <th scope="col">ABC</th>
                                                    <th scope="col">Değer</th>
                                                    <th scope="col">İşlemler</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {items.data.length > 0 ? (
                                                    items.data.map((item) => (
                                                        <tr key={item.id}>
                                                            <td>
                                                                <div className="d-flex align-items-center">
                                                                    <div className="flex-grow-1">
                                                                        <h5 className="fs-14 mb-1">
                                                                            <Link href={`/inventory/items/${item.id}`} className="text-body">
                                                                                {item.name}
                                                                            </Link>
                                                                        </h5>
                                                                        {item.description && (
                                                                            <p className="text-muted mb-0 fs-12">{item.description.substring(0, 50)}...</p>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td>
                                                                <span className="fw-medium">{item.sku}</span>
                                                                {item.barcode && (
                                                                    <React.Fragment><br /><small className="text-muted">{item.barcode}</small></React.Fragment>
                                                                )}
                                                            </td>
                                                            <td>
                                                                <span className="text-muted">{item.category || '-'}</span>
                                                            </td>
                                                            <td>
                                                                <span className="badge bg-light text-body">{item.item_type}</span>
                                                            </td>
                                                            <td>
                                                                <span className="fw-medium">{item.total_stock || 0} {item.base_unit}</span>
                                                            </td>
                                                            <td>
                                                                <span className="fw-medium">{item.available_stock || 0} {item.base_unit}</span>
                                                                <React.Fragment><br />{getStockStatusBadge(item)}</React.Fragment>
                                                            </td>
                                                            <td>
                                                                <span className={`badge ${item.status === 'active' ? 'bg-success-subtle text-success' : 'bg-danger-subtle text-danger'}`}>
                                                                    {item.status === 'active' ? 'Aktif' : 'Pasif'}
                                                                </span>
                                                            </td>
                                                            <td>
                                                                {getABCBadge(item.abc_classification)}
                                                            </td>
                                                            <td>
                                                                <span className="fw-medium">₺{(item.total_value || 0).toLocaleString()}</span>
                                                            </td>
                                                            <td>
                                                                <div className="dropdown">
                                                                    <button className="btn btn-soft-secondary btn-sm dropdown" type="button" data-bs-toggle="dropdown" aria-expanded="false">
                                                                        <i className="ri-more-fill align-middle"></i>
                                                                    </button>
                                                                    <ul className="dropdown-menu dropdown-menu-end">
                                                                        <li>
                                                                            <Link className="dropdown-item" href={`/inventory/items/${item.id}`}>
                                                                                <i className="ri-eye-fill align-bottom me-2 text-muted"></i> Detayları Görüntüle
                                                                            </Link>
                                                                        </li>
                                                                        <li>
                                                                            <a className="dropdown-item" href="#" data-bs-toggle="modal" data-bs-target="#adjustmentModal">
                                                                                <i className="ri-edit-box-line align-bottom me-2 text-muted"></i> Stok Düzeltme
                                                                            </a>
                                                                        </li>
                                                                        <li>
                                                                            <a className="dropdown-item" href="#">
                                                                                <i className="ri-qr-code-line align-bottom me-2 text-muted"></i> Barkod Yazdır
                                                                            </a>
                                                                        </li>
                                                                        <li className="dropdown-divider"></li>
                                                                        <li>
                                                                            <a className="dropdown-item" href="#" data-bs-toggle="modal" data-bs-target="#cycleCountModal">
                                                                                <i className="ri-calculator-line align-bottom me-2 text-muted"></i> Sayım Yap
                                                                            </a>
                                                                        </li>
                                                                    </ul>
                                                                </div>
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
                                    
                                    {/* Pagination */}
                                    {items.last_page > 1 && (
                                        <div className="d-flex justify-content-end mt-3">
                                            <nav aria-label="Page navigation">
                                                <ul className="pagination pagination-sm mb-0">
                                                    {items.links.map((link, index) => (
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