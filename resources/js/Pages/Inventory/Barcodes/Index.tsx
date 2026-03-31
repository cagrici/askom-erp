import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import Layout from '../../../Layouts';

interface InventoryBarcode {
    id: number;
    barcode: string;
    barcode_type: string;
    format: string;
    status: 'active' | 'inactive' | 'expired';
    is_primary: boolean;
    generated_at: string;
    expires_at?: string;
    last_scanned_at?: string;
    scan_count: number;
    print_count: number;
    replacement_reason?: string;
    metadata?: any;
    inventory_item: {
        id: number;
        name: string;
        sku: string;
        item_type: string;
        base_unit: string;
    };
    created_by?: {
        id: number;
        name: string;
    };
    last_scanned_by?: {
        id: number;
        name: string;
    };
}

interface Props {
    barcodes: {
        data: InventoryBarcode[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
        links: any[];
    };
    filters: {
        search?: string;
        barcode_type?: string;
        format?: string;
        status?: string;
        item_type?: string;
        sort_field?: string;
        sort_direction?: string;
    };
}

const Index: React.FC<Props> = ({ barcodes, filters }) => {
    const [searchTerm, setSearchTerm] = useState(filters.search || '');
    const [selectedType, setSelectedType] = useState(filters.barcode_type || '');
    const [selectedFormat, setSelectedFormat] = useState(filters.format || '');
    const [selectedStatus, setSelectedStatus] = useState(filters.status || '');
    const [selectedItemType, setSelectedItemType] = useState(filters.item_type || '');

    const handleSearch = () => {
        router.get('/inventory/barcodes', {
            search: searchTerm,
            barcode_type: selectedType,
            format: selectedFormat,
            status: selectedStatus,
            item_type: selectedItemType,
        }, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleSort = (field: string) => {
        const direction = filters.sort_field === field && filters.sort_direction === 'asc' ? 'desc' : 'asc';
        router.get('/inventory/barcodes', {
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

    const getBarcodeTypeText = (type: string) => {
        const types: { [key: string]: string } = {
            'ean13': 'EAN-13',
            'ean8': 'EAN-8',
            'upc': 'UPC',
            'code128': 'Code 128',
            'code39': 'Code 39',
            'qrcode': 'QR Code',
            'datamatrix': 'DataMatrix',
            'pdf417': 'PDF417'
        };
        return types[type] || type;
    };

    const getFormatText = (format: string) => {
        const formats: { [key: string]: string } = {
            'item': 'Ürün Barkodu',
            'lot': 'Lot Barkodu',
            'serial': 'Seri Barkodu',
            'location': 'Lokasyon Barkodu',
            'pallet': 'Palet Barkodu',
            'case': 'Koli Barkodu'
        };
        return formats[format] || format;
    };

    const getStatusBadge = (status: string) => {
        const statuses: { [key: string]: { text: string; class: string; icon: string } } = {
            'active': { text: 'Aktif', class: 'bg-success-subtle text-success', icon: 'ri-check-line' },
            'inactive': { text: 'Pasif', class: 'bg-secondary-subtle text-secondary', icon: 'ri-close-line' },
            'expired': { text: 'Süresi Dolmuş', class: 'bg-danger-subtle text-danger', icon: 'ri-time-line' }
        };
        const statusInfo = statuses[status] || { text: status, class: 'bg-secondary-subtle text-secondary', icon: 'ri-question-line' };
        return (
            <span className={`badge ${statusInfo.class}`}>
                <i className={`${statusInfo.icon} me-1`}></i>
                {statusInfo.text}
            </span>
        );
    };

    const handleBarcodeAction = (barcodeId: number, action: string, data?: any) => {
        router.post(`/inventory/barcodes/${barcodeId}/${action}`, data || {}, {
            preserveState: true,
            preserveScroll: true,
            onSuccess: () => {
                // Show success message or refresh
            }
        });
    };

    const handleBulkGenerate = () => {
        router.post('/inventory/barcodes/bulk-generate', {}, {
            preserveState: true,
            onSuccess: () => {
                // Show success message
            }
        });
    };

    return (
        <Layout>
            <Head title="Barkod Yönetimi" />
            
            <div className="page-content">
                <div className="container-fluid">
                    {/* Page Title */}
                    <div className="row">
                        <div className="col-12">
                            <div className="page-title-box d-sm-flex align-items-center justify-content-between">
                                <h4 className="mb-sm-0">Barkod Yönetimi</h4>
                                <div className="page-title-right">
                                    <ol className="breadcrumb m-0">
                                        <li className="breadcrumb-item"><Link href="/inventory">Envanter</Link></li>
                                        <li className="breadcrumb-item active">Barkod Yönetimi</li>
                                    </ol>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Quick Stats */}
                    <div className="row">
                        <div className="col-xl-3 col-md-6">
                            <div className="card card-animate">
                                <div className="card-body">
                                    <div className="d-flex align-items-center">
                                        <div className="flex-grow-1 overflow-hidden">
                                            <p className="text-uppercase fw-medium text-muted text-truncate mb-0">Toplam Barkod</p>
                                        </div>
                                        <div className="avatar-sm flex-shrink-0">
                                            <span className="avatar-title bg-primary-subtle rounded fs-3">
                                                <i className="bx bx-qr text-primary"></i>
                                            </span>
                                        </div>
                                    </div>
                                    <div className="d-flex align-items-end justify-content-between mt-4">
                                        <div>
                                            <h4 className="fs-22 fw-semibold ff-secondary mb-4">
                                                <span className="counter-value">{barcodes.total}</span>
                                            </h4>
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
                                            <p className="text-uppercase fw-medium text-muted text-truncate mb-0">Aktif Barkodlar</p>
                                        </div>
                                        <div className="avatar-sm flex-shrink-0">
                                            <span className="avatar-title bg-success-subtle rounded fs-3">
                                                <i className="bx bx-check-circle text-success"></i>
                                            </span>
                                        </div>
                                    </div>
                                    <div className="d-flex align-items-end justify-content-between mt-4">
                                        <div>
                                            <h4 className="fs-22 fw-semibold ff-secondary mb-4">
                                                <span className="counter-value">
                                                    {barcodes.data.filter(b => b.status === 'active').length}
                                                </span>
                                            </h4>
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
                                            <p className="text-uppercase fw-medium text-muted text-truncate mb-0">Toplam Tarama</p>
                                        </div>
                                        <div className="avatar-sm flex-shrink-0">
                                            <span className="avatar-title bg-info-subtle rounded fs-3">
                                                <i className="bx bx-scan text-info"></i>
                                            </span>
                                        </div>
                                    </div>
                                    <div className="d-flex align-items-end justify-content-between mt-4">
                                        <div>
                                            <h4 className="fs-22 fw-semibold ff-secondary mb-4">
                                                <span className="counter-value">
                                                    {barcodes.data.reduce((total, b) => total + b.scan_count, 0)}
                                                </span>
                                            </h4>
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
                                            <p className="text-uppercase fw-medium text-muted text-truncate mb-0">QR Kodları</p>
                                        </div>
                                        <div className="avatar-sm flex-shrink-0">
                                            <span className="avatar-title bg-warning-subtle rounded fs-3">
                                                <i className="bx bx-qr-scan text-warning"></i>
                                            </span>
                                        </div>
                                    </div>
                                    <div className="d-flex align-items-end justify-content-between mt-4">
                                        <div>
                                            <h4 className="fs-22 fw-semibold ff-secondary mb-4">
                                                <span className="counter-value">
                                                    {barcodes.data.filter(b => b.barcode_type === 'qrcode').length}
                                                </span>
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
                                        <div className="col-xxl-3 col-sm-6">
                                            <div className="search-box">
                                                <input
                                                    type="text"
                                                    className="form-control"
                                                    placeholder="Ara (Barkod, Ürün Adı, SKU...)"
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
                                                <option value="">Tüm Barkod Tipleri</option>
                                                <option value="ean13">EAN-13</option>
                                                <option value="ean8">EAN-8</option>
                                                <option value="upc">UPC</option>
                                                <option value="code128">Code 128</option>
                                                <option value="code39">Code 39</option>
                                                <option value="qrcode">QR Code</option>
                                                <option value="datamatrix">DataMatrix</option>
                                                <option value="pdf417">PDF417</option>
                                            </select>
                                        </div>
                                        <div className="col-xxl-2 col-sm-6">
                                            <select 
                                                className="form-select"
                                                value={selectedFormat}
                                                onChange={(e) => setSelectedFormat(e.target.value)}
                                            >
                                                <option value="">Tüm Formatlar</option>
                                                <option value="item">Ürün Barkodu</option>
                                                <option value="lot">Lot Barkodu</option>
                                                <option value="serial">Seri Barkodu</option>
                                                <option value="location">Lokasyon Barkodu</option>
                                                <option value="pallet">Palet Barkodu</option>
                                                <option value="case">Koli Barkodu</option>
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
                                                <option value="inactive">Pasif</option>
                                                <option value="expired">Süresi Dolmuş</option>
                                            </select>
                                        </div>
                                        <div className="col-xxl-2 col-sm-6">
                                            <select 
                                                className="form-select"
                                                value={selectedItemType}
                                                onChange={(e) => setSelectedItemType(e.target.value)}
                                            >
                                                <option value="">Tüm Ürün Tipleri</option>
                                                <option value="raw_material">Hammadde</option>
                                                <option value="finished_product">Bitmiş Ürün</option>
                                                <option value="semi_finished">Yarı Mamul</option>
                                                <option value="consumable">Sarf Malzemesi</option>
                                                <option value="packaging">Ambalaj</option>
                                                <option value="spare_part">Yedek Parça</option>
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

                    {/* Barcodes Table */}
                    <div className="row">
                        <div className="col-lg-12">
                            <div className="card">
                                <div className="card-header align-items-center d-flex">
                                    <h4 className="card-title mb-0 flex-grow-1">
                                        Barkod Listesi ({barcodes.total})
                                    </h4>
                                    <div className="flex-shrink-0">
                                        <div className="d-flex gap-1">
                                            <button 
                                                className="btn btn-success btn-sm"
                                                onClick={handleBulkGenerate}
                                            >
                                                <i className="ri-qr-code-line align-middle"></i> Toplu Oluştur
                                            </button>
                                            <button className="btn btn-soft-primary btn-sm">
                                                <i className="ri-printer-line align-middle"></i> Toplu Yazdır
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
                                                    <th scope="col" style={{ width: '50px' }}>
                                                        <div className="form-check">
                                                            <input className="form-check-input" type="checkbox" id="checkAll" />
                                                            <label className="form-check-label" htmlFor="checkAll"></label>
                                                        </div>
                                                    </th>
                                                    <th 
                                                        scope="col"
                                                        style={{ cursor: 'pointer' }}
                                                        onClick={() => handleSort('barcode')}
                                                    >
                                                        Barkod <i className={getSortIcon('barcode')}></i>
                                                    </th>
                                                    <th scope="col">Ürün</th>
                                                    <th scope="col">Tip</th>
                                                    <th scope="col">Format</th>
                                                    <th scope="col">Durum</th>
                                                    <th 
                                                        scope="col"
                                                        style={{ cursor: 'pointer' }}
                                                        onClick={() => handleSort('scan_count')}
                                                    >
                                                        Taramalar <i className={getSortIcon('scan_count')}></i>
                                                    </th>
                                                    <th scope="col">Son Tarama</th>
                                                    <th 
                                                        scope="col"
                                                        style={{ cursor: 'pointer' }}
                                                        onClick={() => handleSort('generated_at')}
                                                    >
                                                        Oluşturma <i className={getSortIcon('generated_at')}></i>
                                                    </th>
                                                    <th scope="col">İşlemler</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {barcodes.data.length > 0 ? (
                                                    barcodes.data.map((barcode) => (
                                                        <tr key={barcode.id}>
                                                            <td>
                                                                <div className="form-check">
                                                                    <input className="form-check-input" type="checkbox" />
                                                                </div>
                                                            </td>
                                                            <td>
                                                                <div className="d-flex align-items-center">
                                                                    <div className="avatar-xs me-3">
                                                                        <div className="avatar-title rounded-circle bg-light text-primary">
                                                                            <i className="ri-qr-code-line"></i>
                                                                        </div>
                                                                    </div>
                                                                    <div className="flex-grow-1">
                                                                        <h6 className="fs-14 mb-1 font-monospace">{barcode.barcode}</h6>
                                                                        {barcode.is_primary && (
                                                                            <span className="badge bg-primary-subtle text-primary">Birincil</span>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td>
                                                                <div className="d-flex align-items-center">
                                                                    <div className="flex-grow-1">
                                                                        <Link href={`/inventory/items/${barcode.inventory_item.id}`} className="text-body fw-medium">
                                                                            {barcode.inventory_item.name}
                                                                        </Link>
                                                                        <br />
                                                                        <small className="text-muted">SKU: {barcode.inventory_item.sku}</small>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td>
                                                                <span className="badge bg-light text-body">
                                                                    {getBarcodeTypeText(barcode.barcode_type)}
                                                                </span>
                                                            </td>
                                                            <td>
                                                                <span className="text-muted">
                                                                    {getFormatText(barcode.format)}
                                                                </span>
                                                            </td>
                                                            <td>
                                                                {getStatusBadge(barcode.status)}
                                                                {barcode.expires_at && (
                                                                    <React.Fragment>
                                                                        <br />
                                                                        <small className="text-muted">
                                                                            SKT: {new Date(barcode.expires_at).toLocaleDateString('tr-TR')}
                                                                        </small>
                                                                    </React.Fragment>
                                                                )}
                                                            </td>
                                                            <td>
                                                                <span className="fw-medium">{barcode.scan_count}</span>
                                                                <React.Fragment>
                                                                    <br />
                                                                    <small className="text-muted">Yazdırma: {barcode.print_count}</small>
                                                                </React.Fragment>
                                                            </td>
                                                            <td>
                                                                {barcode.last_scanned_at ? (
                                                                    <React.Fragment>
                                                                        <span className="text-muted">
                                                                            {new Date(barcode.last_scanned_at).toLocaleDateString('tr-TR')}
                                                                        </span>
                                                                        {barcode.last_scanned_by && (
                                                                            <React.Fragment>
                                                                                <br />
                                                                                <small className="text-muted">
                                                                                    {barcode.last_scanned_by.name}
                                                                                </small>
                                                                            </React.Fragment>
                                                                        )}
                                                                    </React.Fragment>
                                                                ) : (
                                                                    <span className="text-muted">-</span>
                                                                )}
                                                            </td>
                                                            <td>
                                                                <span className="text-muted">
                                                                    {new Date(barcode.generated_at).toLocaleDateString('tr-TR')}
                                                                </span>
                                                                {barcode.created_by && (
                                                                    <React.Fragment>
                                                                        <br />
                                                                        <small className="text-muted">
                                                                            {barcode.created_by.name}
                                                                        </small>
                                                                    </React.Fragment>
                                                                )}
                                                            </td>
                                                            <td>
                                                                <div className="dropdown">
                                                                    <button className="btn btn-soft-secondary btn-sm dropdown" type="button" data-bs-toggle="dropdown" aria-expanded="false">
                                                                        <i className="ri-more-fill align-middle"></i>
                                                                    </button>
                                                                    <ul className="dropdown-menu dropdown-menu-end">
                                                                        <li>
                                                                            <a 
                                                                                className="dropdown-item" 
                                                                                href="#"
                                                                                onClick={() => handleBarcodeAction(barcode.id, 'print')}
                                                                            >
                                                                                <i className="ri-printer-line align-bottom me-2 text-muted"></i> Yazdır
                                                                            </a>
                                                                        </li>
                                                                        <li>
                                                                            <a className="dropdown-item" href="#" data-bs-toggle="modal" data-bs-target="#scanModal">
                                                                                <i className="ri-qr-scan-line align-bottom me-2 text-muted"></i> Test Tarama
                                                                            </a>
                                                                        </li>
                                                                        <li>
                                                                            <a className="dropdown-item" href="#">
                                                                                <i className="ri-download-line align-bottom me-2 text-muted"></i> İndir
                                                                            </a>
                                                                        </li>
                                                                        <li className="dropdown-divider"></li>
                                                                        <li>
                                                                            <a className="dropdown-item" href="#" data-bs-toggle="modal" data-bs-target="#replaceModal">
                                                                                <i className="ri-refresh-line align-bottom me-2 text-muted"></i> Değiştir
                                                                            </a>
                                                                        </li>
                                                                        {barcode.status === 'active' ? (
                                                                            <li>
                                                                                <a 
                                                                                    className="dropdown-item text-warning" 
                                                                                    href="#"
                                                                                    onClick={() => handleBarcodeAction(barcode.id, 'deactivate')}
                                                                                >
                                                                                    <i className="ri-pause-line align-bottom me-2"></i> Pasifleştir
                                                                                </a>
                                                                            </li>
                                                                        ) : (
                                                                            <li>
                                                                                <a 
                                                                                    className="dropdown-item text-success" 
                                                                                    href="#"
                                                                                    onClick={() => handleBarcodeAction(barcode.id, 'activate')}
                                                                                >
                                                                                    <i className="ri-play-line align-bottom me-2"></i> Aktifleştir
                                                                                </a>
                                                                            </li>
                                                                        )}
                                                                        <li className="dropdown-divider"></li>
                                                                        <li>
                                                                            <a className="dropdown-item text-danger" href="#">
                                                                                <i className="ri-delete-bin-line align-bottom me-2"></i> Sil
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
                                    {barcodes.last_page > 1 && (
                                        <div className="d-flex justify-content-end mt-3">
                                            <nav aria-label="Page navigation">
                                                <ul className="pagination pagination-sm mb-0">
                                                    {barcodes.links.map((link, index) => (
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