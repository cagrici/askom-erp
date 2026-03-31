import React, { useState } from 'react';
import Layout from '@/Layouts';
import { Head, Link, router } from '@inertiajs/react';
import { Card, Table, Button, Form, Row, Col, InputGroup, Badge, Dropdown, Modal, OverlayTrigger, Tooltip, Alert } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';

interface Product {
    id: number;
    code: string;
    name: string;
    slug: string;
    sku: string;
    barcode?: string;
    category: {
        id: number;
        name: string;
        full_name?: string;
    };
    brand?: {
        id: number;
        name: string;
    };
    stock_quantity: number;
    min_stock_level: number;
    max_stock_level: number;
    cost_price: number;
    sale_price: number;
    is_active: boolean;
    primary_image?: {
        thumbnail_url: string;
    };
    created_at: string;
}

interface StockStats {
    total_products: number;
    in_stock_products: number;
    out_of_stock_products: number;
    low_stock_products: number;
    critical_stock_products: number;
    total_stock_value: number;
    average_stock_level: number;
    stock_turnover_rate: number;
}

interface Props {
    products: {
        data: Product[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
        from?: number;
        to?: number;
        links?: any[];
    };
    filters: {
        search?: string;
        category_id?: number;
        brand_id?: number;
        stock_status?: string;
        stock_value_min?: number;
        stock_value_max?: number;
        is_active?: boolean;
        sort_field?: string;
        sort_direction?: string;
        codes?: string;
    };
    categories: Array<{ id: number; name: string; full_name?: string; }>;
    brands: Array<{ id: number; name: string; }>;
    stockStats: StockStats;
}

export default function StockIndex({ products, filters, categories, brands, stockStats }: Props) {
    const { t } = useTranslation();
    
    // Stock adjustment reason codes
    const reasonCodes = [
        { value: 'physical_count', label: 'Fiziki Sayım' },
        { value: 'damage', label: 'Hasar' },
        { value: 'loss', label: 'Kayıp' },
        { value: 'found', label: 'Bulunan' },
        { value: 'theft', label: 'Hırsızlık' },
        { value: 'expiry', label: 'Son Kullanma Tarihi' },
        { value: 'quality_issue', label: 'Kalite Sorunu' },
        { value: 'system_error', label: 'Sistem Hatası' },
        { value: 'transfer_error', label: 'Transfer Hatası' },
        { value: 'production_scrap', label: 'Üretim Fıresi' },
        { value: 'other', label: 'Diğer' }
    ];
    const [selectedProducts, setSelectedProducts] = useState<number[]>([]);
    const [showBulkUpdateModal, setShowBulkUpdateModal] = useState(false);
    const [showStockUpdateModal, setShowStockUpdateModal] = useState(false);
    const [productToUpdate, setProductToUpdate] = useState<Product | null>(null);
    const [localFilters, setLocalFilters] = useState(filters);
    const [bulkUpdates, setBulkUpdates] = useState<{[key: number]: {stock_quantity: number, reason: string}}>({});
    const [singleUpdate, setSingleUpdate] = useState({
        adjustment_type: 'absolute', // absolute, increase, decrease
        current_quantity: 0,
        new_quantity: 0,
        quantity_change: 0,
        reason_code: '',
        reason_description: '',
        warehouse_id: null,
        reference_number: '',
        notes: ''
    });
    const [showStockQueryModal, setShowStockQueryModal] = useState(false);
    const [stockQueryCodes, setStockQueryCodes] = useState('');

    const handleStockQuery = () => {
        if (!stockQueryCodes.trim()) return;
        setShowStockQueryModal(false);
        router.get(route('stock.index'), { codes: stockQueryCodes.trim() }, { preserveState: true });
    };

    const clearStockQuery = () => {
        setStockQueryCodes('');
        const newFilters = { ...filters };
        delete newFilters.codes;
        router.get(route('stock.index'), newFilters, { preserveState: true });
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(route('stock.index'), { ...filters, ...localFilters }, { preserveState: true });
    };

    const handleFilterChange = (key: string, value: any) => {
        const newFilters = { ...filters };
        
        if (value === null || value === undefined || value === '') {
            delete newFilters[key];
        } else {
            newFilters[key] = value;
        }
        
        setLocalFilters(newFilters);
        router.get(route('stock.index'), newFilters, { preserveState: true });
    };

    const handleSort = (field: string) => {
        const currentSortDirection = filters.sort_field === field && filters.sort_direction === 'asc' ? 'desc' : 'asc';
        
        router.get(route('stock.index'), {
            ...filters,
            sort_field: field,
            sort_direction: currentSortDirection
        }, { preserveState: true });
    };

    const getSortIcon = (field: string) => {
        if (filters.sort_field !== field) {
            return <i className="ri-sort-line ms-1 text-muted"></i>;
        }
        return filters.sort_direction === 'asc' ? 
            <i className="ri-sort-asc ms-1 text-primary"></i> : 
            <i className="ri-sort-desc ms-1 text-primary"></i>;
    };

    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) {
            setSelectedProducts(products.data.map(p => p.id));
        } else {
            setSelectedProducts([]);
        }
    };

    const handleSelectProduct = (id: number) => {
        setSelectedProducts(prev => 
            prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
        );
    };

    const getStockStatusBadge = (product: Product) => {
        if (product.stock_quantity === 0) {
            return <Badge bg="danger">Stokta Yok</Badge>;
        } else if (product.stock_quantity <= product.min_stock_level * 0.5) {
            return <Badge bg="danger">Kritik Stok</Badge>;
        } else if (product.stock_quantity <= product.min_stock_level) {
            return <Badge bg="warning">Düşük Stok</Badge>;
        } else if (product.max_stock_level > 0 && product.stock_quantity > product.max_stock_level) {
            return <Badge bg="info">Fazla Stok</Badge>;
        }
        return <Badge bg="success">Stokta</Badge>;
    };

    const getStockValue = (product: Product) => {
        return product.stock_quantity * product.cost_price;
    };

    const formatCurrency = (amount: number) => {
        return `₺${amount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}`;
    };

    const handleBulkUpdateSubmit = async () => {
        const updates = Object.entries(bulkUpdates).map(([productId, data]) => ({
            product_id: parseInt(productId),
            stock_quantity: data.stock_quantity,
            reason: data.reason
        }));

        if (updates.length === 0) {
            alert('Güncellenecek ürün bulunamadı!');
            return;
        }

        try {
            await router.post(route('stock.bulk-update'), { updates });
            setShowBulkUpdateModal(false);
            setBulkUpdates({});
            setSelectedProducts([]);
        } catch (error) {
            console.error('Bulk update error:', error);
        }
    };

    const handleSingleUpdateSubmit = async () => {
        if (!productToUpdate) return;

        try {
            await router.post(route('stock.update', productToUpdate.id), singleUpdate);
            setShowStockUpdateModal(false);
            setProductToUpdate(null);
            setSingleUpdate({
                adjustment_type: 'absolute',
                current_quantity: 0,
                new_quantity: 0,
                quantity_change: 0,
                reason_code: '',
                reason_description: '',
                warehouse_id: null,
                reference_number: '',
                notes: ''
            });
        } catch (error) {
            console.error('Stock update error:', error);
        }
    };

    const handleExport = () => {
        window.location.href = route('stock.export', filters);
    };

    return (
        <Layout>
            <Head title="Stok Yönetimi" />

            <div className="page-content">
                <div className="container-fluid">
                    <Row className="mb-3">
                        <Col>
                            <div className="page-title-box d-flex align-items-center justify-content-between">
                                <h4 className="mb-0">Stok Yönetimi</h4>
                                <div className="d-flex gap-2">
                                    <Button variant="outline-primary" onClick={handleExport}>
                                        <i className="ri-download-line me-1"></i>
                                        Export
                                    </Button>
                                    <Link href={route('stock.low-stock-alerts')} className="btn btn-warning">
                                        <i className="ri-alarm-warning-line me-1"></i>
                                        Düşük Stok Uyarıları
                                    </Link>
                                    <Link href={route('stock.movements')} className="btn btn-info">
                                        <i className="ri-exchange-line me-1"></i>
                                        Stok Hareketleri
                                    </Link>
                                    <Button variant="success" onClick={() => setShowStockQueryModal(true)}>
                                        <i className="ri-search-eye-line me-1"></i>
                                        Stok Sorgulama
                                    </Button>
                                </div>
                            </div>
                        </Col>
                    </Row>

                    {/* Stock Statistics Cards */}
                    <Row className="mb-4">
                        <Col xl={3} md={6}>
                            <Card className="card-height-100">
                                <Card.Body>
                                    <div className="d-flex align-items-center">
                                        <div className="avatar-sm flex-shrink-0">
                                            <span className="avatar-title bg-primary-subtle text-primary rounded-circle fs-3">
                                                <i className="ri-archive-line"></i>
                                            </span>
                                        </div>
                                        <div className="flex-grow-1 ms-3">
                                            <p className="text-uppercase fw-semibold fs-12 text-muted mb-1">Toplam Ürün</p>
                                            <h4 className="mb-0">{stockStats.total_products.toLocaleString()}</h4>
                                        </div>
                                    </div>
                                </Card.Body>
                            </Card>
                        </Col>
                        <Col xl={3} md={6}>
                            <Card className="card-height-100">
                                <Card.Body>
                                    <div className="d-flex align-items-center">
                                        <div className="avatar-sm flex-shrink-0">
                                            <span className="avatar-title bg-success-subtle text-success rounded-circle fs-3">
                                                <i className="ri-check-line"></i>
                                            </span>
                                        </div>
                                        <div className="flex-grow-1 ms-3">
                                            <p className="text-uppercase fw-semibold fs-12 text-muted mb-1">Stokta</p>
                                            <h4 className="mb-0">{stockStats.in_stock_products.toLocaleString()}</h4>
                                        </div>
                                    </div>
                                </Card.Body>
                            </Card>
                        </Col>
                        <Col xl={3} md={6}>
                            <Card className="card-height-100">
                                <Card.Body>
                                    <div className="d-flex align-items-center">
                                        <div className="avatar-sm flex-shrink-0">
                                            <span className="avatar-title bg-warning-subtle text-warning rounded-circle fs-3">
                                                <i className="ri-alert-line"></i>
                                            </span>
                                        </div>
                                        <div className="flex-grow-1 ms-3">
                                            <p className="text-uppercase fw-semibold fs-12 text-muted mb-1">Düşük Stok</p>
                                            <h4 className="mb-0">{stockStats.low_stock_products.toLocaleString()}</h4>
                                        </div>
                                    </div>
                                </Card.Body>
                            </Card>
                        </Col>
                        <Col xl={3} md={6}>
                            <Card className="card-height-100">
                                <Card.Body>
                                    <div className="d-flex align-items-center">
                                        <div className="avatar-sm flex-shrink-0">
                                            <span className="avatar-title bg-info-subtle text-info rounded-circle fs-3">
                                                <i className="ri-money-dollar-circle-line"></i>
                                            </span>
                                        </div>
                                        <div className="flex-grow-1 ms-3">
                                            <p className="text-uppercase fw-semibold fs-12 text-muted mb-1">Toplam Stok Değeri</p>
                                            <h4 className="mb-0">{formatCurrency(stockStats.total_stock_value)}</h4>
                                        </div>
                                    </div>
                                </Card.Body>
                            </Card>
                        </Col>
                    </Row>

                    {filters.codes && (
                        <Alert variant="info" className="d-flex align-items-center justify-content-between mb-3">
                            <div>
                                <i className="ri-search-eye-line me-2"></i>
                                <strong>Stok Sorgulama Aktif:</strong> {filters.codes.split(/[,\n]+/).filter(c => c.trim()).length} adet stok kodu sorgulanıyor
                                <span className="text-muted ms-2">({products.total} sonuç)</span>
                            </div>
                            <Button variant="outline-info" size="sm" onClick={clearStockQuery}>
                                <i className="ri-close-line me-1"></i>Sorguyu Temizle
                            </Button>
                        </Alert>
                    )}

                    <Card>
                        <Card.Body>
                            <Row className="mb-4">
                                <Col lg={3}>
                                    <Form onSubmit={handleSearch}>
                                        <InputGroup>
                                            <Form.Control
                                                type="text"
                                                placeholder="Ürün adı, kodu, SKU ara..."
                                                value={localFilters.search || ''}
                                                onChange={(e) => setLocalFilters({ ...localFilters, search: e.target.value })}
                                            />
                                            <Button type="submit" variant="primary">
                                                <i className="ri-search-line"></i>
                                            </Button>
                                        </InputGroup>
                                    </Form>
                                </Col>
                                <Col lg={2}>
                                    <Form.Select
                                        value={localFilters.category_id || ''}
                                        onChange={(e) => handleFilterChange('category_id', e.target.value)}
                                    >
                                        <option value="">Tüm Kategoriler</option>
                                        {categories.map(category => (
                                            <option key={category.id} value={category.id}>
                                                {category.full_name || category.name}
                                            </option>
                                        ))}
                                    </Form.Select>
                                </Col>
                                <Col lg={2}>
                                    <Form.Select
                                        value={localFilters.brand_id || ''}
                                        onChange={(e) => handleFilterChange('brand_id', e.target.value)}
                                    >
                                        <option value="">Tüm Markalar</option>
                                        {brands.map(brand => (
                                            <option key={brand.id} value={brand.id}>
                                                {brand.name}
                                            </option>
                                        ))}
                                    </Form.Select>
                                </Col>
                                <Col lg={2}>
                                    <Form.Select
                                        value={localFilters.stock_status || ''}
                                        onChange={(e) => handleFilterChange('stock_status', e.target.value)}
                                    >
                                        <option value="">Tüm Stok Durumları</option>
                                        <option value="in_stock">Stokta</option>
                                        <option value="out_of_stock">Stokta Yok</option>
                                        <option value="low_stock">Düşük Stok</option>
                                        <option value="critical_stock">Kritik Stok</option>
                                        <option value="overstock">Fazla Stok</option>
                                    </Form.Select>
                                </Col>
                                <Col lg={3}>
                                    <div className="d-flex gap-2">
                                        <Form.Control
                                            type="number"
                                            placeholder="Min. değer"
                                            value={localFilters.stock_value_min || ''}
                                            onChange={(e) => handleFilterChange('stock_value_min', e.target.value)}
                                        />
                                        <Form.Control
                                            type="number"
                                            placeholder="Max. değer"
                                            value={localFilters.stock_value_max || ''}
                                            onChange={(e) => handleFilterChange('stock_value_max', e.target.value)}
                                        />
                                    </div>
                                </Col>
                            </Row>

                            {selectedProducts.length > 0 && (
                                <Alert variant="info" className="d-flex justify-content-between align-items-center">
                                    <span>{selectedProducts.length} ürün seçildi</span>
                                    <div className="d-flex gap-2">
                                        <Button 
                                            variant="primary" 
                                            size="sm" 
                                            onClick={() => setShowBulkUpdateModal(true)}
                                        >
                                            <i className="ri-edit-line me-1"></i>
                                            Toplu Stok Güncelle
                                        </Button>
                                        <Button variant="secondary" size="sm" onClick={() => setSelectedProducts([])}>
                                            Seçimi Temizle
                                        </Button>
                                    </div>
                                </Alert>
                            )}

                            <div className="table-responsive">
                                <Table hover className="table-centered align-middle">
                                    <thead className="table-light">
                                        <tr>
                                            <th style={{ width: '40px' }}>
                                                <Form.Check
                                                    type="checkbox"
                                                    onChange={handleSelectAll}
                                                    checked={selectedProducts.length === products.data.length && products.data.length > 0}
                                                />
                                            </th>
                                            <th style={{ width: '60px' }}>Görsel</th>
                                            <th 
                                                className="cursor-pointer"
                                                onClick={() => handleSort('code')}
                                            >
                                                Ürün Kodu
                                                {getSortIcon('code')}
                                            </th>
                                            <th 
                                                className="cursor-pointer"
                                                onClick={() => handleSort('name')}
                                            >
                                                Ürün Adı
                                                {getSortIcon('name')}
                                            </th>
                                            <th>Kategori</th>
                                            <th>Marka</th>
                                            <th 
                                                className="text-center cursor-pointer"
                                                onClick={() => handleSort('stock_quantity')}
                                            >
                                                Mevcut Stok
                                                {getSortIcon('stock_quantity')}
                                            </th>
                                            <th className="text-center">Min/Max Stok</th>
                                            <th className="text-end">Birim Maliyet</th>
                                            <th className="text-end">Stok Değeri</th>
                                            <th className="text-center">Durum</th>
                                            <th className="text-center" style={{ width: '120px' }}>İşlemler</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {products.data.map(product => (
                                            <tr key={product.id}>
                                                <td>
                                                    <Form.Check
                                                        type="checkbox"
                                                        checked={selectedProducts.includes(product.id)}
                                                        onChange={() => handleSelectProduct(product.id)}
                                                    />
                                                </td>
                                                <td>
                                                    {product.primary_image ? (
                                                        <img 
                                                            src={product.primary_image.thumbnail_url} 
                                                            alt={product.name}
                                                            className="rounded"
                                                            style={{ width: '40px', height: '40px', objectFit: 'cover' }}
                                                        />
                                                    ) : (
                                                        <div 
                                                            className="bg-light rounded d-flex align-items-center justify-content-center"
                                                            style={{ width: '40px', height: '40px' }}
                                                        >
                                                            <i className="ri-image-line text-muted"></i>
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="fw-medium">{product.code}</td>
                                                <td>
                                                    <div>
                                                        <div className="fw-medium">{product.name}</div>
                                                        <small className="text-muted">SKU: {product.sku}</small>
                                                    </div>
                                                </td>
                                                <td>{product.category?.full_name || product.category?.name || '-'}</td>
                                                <td>{product.brand?.name || '-'}</td>
                                                <td className="text-center">
                                                    <div className="fw-bold fs-5">{product.stock_quantity}</div>
                                                </td>
                                                <td className="text-center">
                                                    <small className="text-muted">
                                                        {product.min_stock_level} / {product.max_stock_level || '-'}
                                                    </small>
                                                </td>
                                                <td className="text-end">
                                                    {formatCurrency(product.cost_price)}
                                                </td>
                                                <td className="text-end fw-medium">
                                                    {formatCurrency(getStockValue(product))}
                                                </td>
                                                <td className="text-center">
                                                    {getStockStatusBadge(product)}
                                                </td>
                                                <td>
                                                    <div className="d-flex justify-content-center gap-1">
                                                        <OverlayTrigger
                                                            placement="top"
                                                            overlay={<Tooltip>Stok Güncelle</Tooltip>}
                                                        >
                                                            <Button 
                                                                size="sm" 
                                                                variant="primary"
                                                                onClick={() => {
                                                                    setProductToUpdate(product);
                                                                    setSingleUpdate({
                                                                        adjustment_type: 'absolute',
                                                                        current_quantity: product.stock_quantity,
                                                                        new_quantity: product.stock_quantity,
                                                                        quantity_change: 0,
                                                                        reason_code: '',
                                                                        reason_description: '',
                                                                        warehouse_id: null,
                                                                        reference_number: '',
                                                                        notes: ''
                                                                    });
                                                                    setShowStockUpdateModal(true);
                                                                }}
                                                            >
                                                                <i className="ri-edit-line"></i>
                                                            </Button>
                                                        </OverlayTrigger>
                                                        
                                                        <OverlayTrigger
                                                            placement="top"
                                                            overlay={<Tooltip>Stok Geçmişi</Tooltip>}
                                                        >
                                                            <Link 
                                                                href={route('products.stock-history', product.id)}
                                                                className="btn btn-sm btn-info"
                                                            >
                                                                <i className="ri-history-line"></i>
                                                            </Link>
                                                        </OverlayTrigger>

                                                        <OverlayTrigger
                                                            placement="top"
                                                            overlay={<Tooltip>Ürün Detayı</Tooltip>}
                                                        >
                                                            <Link 
                                                                href={route('products.show', product.id)}
                                                                className="btn btn-sm btn-light"
                                                            >
                                                                <i className="ri-eye-line"></i>
                                                            </Link>
                                                        </OverlayTrigger>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </Table>
                            </div>

                            {products.data.length === 0 && (
                                <div className="text-center py-5">
                                    <i className="ri-archive-line fs-1 text-muted"></i>
                                    <p className="text-muted mt-3">Henüz ürün bulunmuyor.</p>
                                </div>
                            )}

                            {/* Pagination */}
                            {products.last_page && products.last_page > 1 && (
                                <div className="d-flex justify-content-between align-items-center mt-4">
                                    <div>
                                        Toplam {products.total || 0} üründen {products.from || 0}-{products.to || 0} arası gösteriliyor
                                    </div>
                                    <nav>
                                        <ul className="pagination mb-0">
                                            {products.links && products.links.map((link: any, index: number) => (
                                                <li 
                                                    key={index} 
                                                    className={`page-item ${link.active ? 'active' : ''} ${!link.url ? 'disabled' : ''}`}
                                                >
                                                    {link.url ? (
                                                        <Link 
                                                            className="page-link" 
                                                            href={link.url}
                                                            dangerouslySetInnerHTML={{ __html: link.label || '' }}
                                                        />
                                                    ) : (
                                                        <span 
                                                            className="page-link"
                                                            dangerouslySetInnerHTML={{ __html: link.label || '' }}
                                                        />
                                                    )}
                                                </li>
                                            ))}
                                        </ul>
                                    </nav>
                                </div>
                            )}
                        </Card.Body>
                    </Card>
                </div>
            </div>

            {/* Stock Adjustment Modal */}
            <Modal show={showStockUpdateModal} onHide={() => setShowStockUpdateModal(false)} size="lg" centered>
                <Modal.Header closeButton>
                    <Modal.Title>
                        <i className="ri-edit-box-line me-2"></i>
                        Stok Düzeltme
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {productToUpdate && (
                        <>
                            {/* Product Info */}
                            <div className="bg-light p-3 rounded mb-4">
                                <div className="d-flex align-items-center">
                                    {productToUpdate.primary_image?.thumbnail_url && (
                                        <img 
                                            src={productToUpdate.primary_image.thumbnail_url}
                                            alt={productToUpdate.name}
                                            className="me-3"
                                            style={{ width: '50px', height: '50px', objectFit: 'cover' }}
                                        />
                                    )}
                                    <div>
                                        <h6 className="mb-1">{productToUpdate.name}</h6>
                                        <small className="text-muted">
                                            Kod: {productToUpdate.code} | SKU: {productToUpdate.sku}
                                        </small>
                                        <br />
                                        <small className="text-muted">
                                            <strong>Mevcut Stok:</strong> {productToUpdate.stock_quantity} | 
                                            <strong> Min:</strong> {productToUpdate.min_stock_level} | 
                                            <strong> Max:</strong> {productToUpdate.max_stock_level || '-'}
                                        </small>
                                    </div>
                                </div>
                            </div>

                            <Row>
                                <Col md={6}>
                                    {/* Adjustment Type */}
                                    <Form.Group className="mb-3">
                                        <Form.Label>Düzeltme Tipi <span className="text-danger">*</span></Form.Label>
                                        <Form.Select
                                            value={singleUpdate.adjustment_type}
                                            onChange={(e) => {
                                                const newType = e.target.value;
                                                setSingleUpdate({
                                                    ...singleUpdate,
                                                    adjustment_type: newType,
                                                    new_quantity: newType === 'absolute' ? singleUpdate.current_quantity : singleUpdate.current_quantity,
                                                    quantity_change: 0
                                                });
                                            }}
                                        >
                                            <option value="absolute">Mutlak Değer</option>
                                            <option value="increase">Artırma (+)</option>
                                            <option value="decrease">Azaltma (-)</option>
                                        </Form.Select>
                                        <Form.Text className="text-muted">
                                            {singleUpdate.adjustment_type === 'absolute' && 'Stok değerini belirtilen miktara ayarla'}
                                            {singleUpdate.adjustment_type === 'increase' && 'Mevcut stoka belirtilen miktarı ekle'}
                                            {singleUpdate.adjustment_type === 'decrease' && 'Mevcut stoktan belirtilen miktarı çıkar'}
                                        </Form.Text>
                                    </Form.Group>

                                    {/* Quantity Input */}
                                    <Form.Group className="mb-3">
                                        <Form.Label>
                                            {singleUpdate.adjustment_type === 'absolute' ? 'Yeni Stok Miktarı' : 'Değişim Miktarı'} 
                                            <span className="text-danger">*</span>
                                        </Form.Label>
                                        <Form.Control
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            value={singleUpdate.adjustment_type === 'absolute' ? singleUpdate.new_quantity : singleUpdate.quantity_change}
                                            onChange={(e) => {
                                                const value = parseFloat(e.target.value) || 0;
                                                if (singleUpdate.adjustment_type === 'absolute') {
                                                    setSingleUpdate({
                                                        ...singleUpdate,
                                                        new_quantity: value,
                                                        quantity_change: value - singleUpdate.current_quantity
                                                    });
                                                } else {
                                                    const newQuantity = singleUpdate.adjustment_type === 'increase' 
                                                        ? singleUpdate.current_quantity + value
                                                        : singleUpdate.current_quantity - value;
                                                    setSingleUpdate({
                                                        ...singleUpdate,
                                                        quantity_change: value,
                                                        new_quantity: Math.max(0, newQuantity)
                                                    });
                                                }
                                            }}
                                        />
                                    </Form.Group>

                                    {/* Result Preview */}
                                    <div className="alert alert-info">
                                        <small>
                                            <strong>Sonuç:</strong> {singleUpdate.current_quantity} 
                                            {singleUpdate.quantity_change > 0 ? ' + ' : ' '}
                                            {singleUpdate.quantity_change < 0 ? singleUpdate.quantity_change : (singleUpdate.quantity_change > 0 ? singleUpdate.quantity_change : '')} 
                                            = <strong>{singleUpdate.new_quantity}</strong>
                                        </small>
                                    </div>
                                </Col>

                                <Col md={6}>
                                    {/* Reason Code */}
                                    <Form.Group className="mb-3">
                                        <Form.Label>Düzeltme Sebebi <span className="text-danger">*</span></Form.Label>
                                        <Form.Select
                                            value={singleUpdate.reason_code}
                                            onChange={(e) => setSingleUpdate({
                                                ...singleUpdate,
                                                reason_code: e.target.value
                                            })}
                                            required
                                        >
                                            <option value="">Sebep Seçin</option>
                                            {reasonCodes.map(reason => (
                                                <option key={reason.value} value={reason.value}>
                                                    {reason.label}
                                                </option>
                                            ))}
                                        </Form.Select>
                                    </Form.Group>

                                    {/* Reference Number */}
                                    <Form.Group className="mb-3">
                                        <Form.Label>Referans Belge No</Form.Label>
                                        <Form.Control
                                            type="text"
                                            placeholder="Belge numarası (opsiyonel)"
                                            value={singleUpdate.reference_number}
                                            onChange={(e) => setSingleUpdate({
                                                ...singleUpdate,
                                                reference_number: e.target.value
                                            })}
                                        />
                                    </Form.Group>

                                    {/* Notes */}
                                    <Form.Group className="mb-3">
                                        <Form.Label>Detaylı Açıklama</Form.Label>
                                        <Form.Control
                                            as="textarea"
                                            rows={3}
                                            placeholder="Düzeltmenin detaylarını açıklayın..."
                                            value={singleUpdate.notes}
                                            onChange={(e) => setSingleUpdate({
                                                ...singleUpdate,
                                                notes: e.target.value
                                            })}
                                        />
                                    </Form.Group>
                                </Col>
                            </Row>

                            {/* Warning for negative stock */}
                            {singleUpdate.new_quantity < 0 && (
                                <div className="alert alert-warning">
                                    <i className="ri-alert-line me-2"></i>
                                    <strong>Uyarı:</strong> Negatif stok değeri! Stok değeri 0'ın altına düşemez.
                                </div>
                            )}

                            {/* Warning for critical stock levels */}
                            {singleUpdate.new_quantity < productToUpdate.min_stock_level && singleUpdate.new_quantity >= 0 && (
                                <div className="alert alert-warning">
                                    <i className="ri-alert-line me-2"></i>
                                    <strong>Uyarı:</strong> Yeni stok miktarı minimum seviyenin ({productToUpdate.min_stock_level}) altında!
                                </div>
                            )}
                        </>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowStockUpdateModal(false)}>
                        <i className="ri-close-line me-1"></i>
                        İptal
                    </Button>
                    <Button 
                        variant="primary" 
                        onClick={handleSingleUpdateSubmit}
                        disabled={!singleUpdate.reason_code || singleUpdate.new_quantity < 0}
                    >
                        <i className="ri-save-line me-1"></i>
                        Stok Düzeltmesini Kaydet
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* Bulk Update Modal */}
            <Modal 
                show={showBulkUpdateModal} 
                onHide={() => setShowBulkUpdateModal(false)} 
                size="lg"
                centered
            >
                <Modal.Header closeButton>
                    <Modal.Title>Toplu Stok Güncelleme</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <p className="mb-3">
                        {selectedProducts.length} ürün için stok güncellemesi yapılacak:
                    </p>
                    <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                        {selectedProducts.map(productId => {
                            const product = products.data.find(p => p.id === productId);
                            if (!product) return null;
                            
                            return (
                                <div key={productId} className="border rounded p-3 mb-3">
                                    <div className="d-flex justify-content-between align-items-center mb-2">
                                        <strong>{product.name}</strong>
                                        <Badge bg="secondary">Mevcut: {product.stock_quantity}</Badge>
                                    </div>
                                    <Row>
                                        <Col md={6}>
                                            <Form.Group>
                                                <Form.Label>Yeni Stok</Form.Label>
                                                <Form.Control
                                                    type="number"
                                                    min="0"
                                                    value={bulkUpdates[productId]?.stock_quantity || product.stock_quantity}
                                                    onChange={(e) => setBulkUpdates({
                                                        ...bulkUpdates,
                                                        [productId]: {
                                                            ...bulkUpdates[productId],
                                                            stock_quantity: parseInt(e.target.value) || 0,
                                                            reason: bulkUpdates[productId]?.reason || ''
                                                        }
                                                    })}
                                                />
                                            </Form.Group>
                                        </Col>
                                        <Col md={6}>
                                            <Form.Group>
                                                <Form.Label>Sebep</Form.Label>
                                                <Form.Control
                                                    type="text"
                                                    value={bulkUpdates[productId]?.reason || ''}
                                                    onChange={(e) => setBulkUpdates({
                                                        ...bulkUpdates,
                                                        [productId]: {
                                                            stock_quantity: bulkUpdates[productId]?.stock_quantity || product.stock_quantity,
                                                            reason: e.target.value
                                                        }
                                                    })}
                                                    placeholder="Güncelleme sebebi..."
                                                />
                                            </Form.Group>
                                        </Col>
                                    </Row>
                                </div>
                            );
                        })}
                    </div>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowBulkUpdateModal(false)}>
                        İptal
                    </Button>
                    <Button variant="primary" onClick={handleBulkUpdateSubmit}>
                        Tümünü Güncelle
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* Stok Sorgulama Modal */}
            <Modal show={showStockQueryModal} onHide={() => setShowStockQueryModal(false)} centered>
                <Modal.Header closeButton>
                    <Modal.Title>
                        <i className="ri-search-eye-line me-2"></i>
                        Hızlı Stok Sorgulama
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form.Group>
                        <Form.Label>Stok Kodları</Form.Label>
                        <Form.Control
                            as="textarea"
                            rows={8}
                            placeholder={"Stok kodlarını virgül veya enter ile ayırarak yazın...\n\nÖrnek:\nASK-001\nASK-002, ASK-003\nASK-004"}
                            value={stockQueryCodes}
                            onChange={(e) => setStockQueryCodes(e.target.value)}
                            autoFocus
                        />
                        <Form.Text className="text-muted">
                            {stockQueryCodes.trim() ? (
                                <>{stockQueryCodes.split(/[,\n]+/).filter(c => c.trim()).length} adet kod girildi</>
                            ) : (
                                <>Virgül veya enter ile ayırarak birden fazla stok kodu girebilirsiniz.</>
                            )}
                        </Form.Text>
                    </Form.Group>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="light" onClick={() => setShowStockQueryModal(false)}>
                        İptal
                    </Button>
                    <Button
                        variant="success"
                        onClick={handleStockQuery}
                        disabled={!stockQueryCodes.trim()}
                    >
                        <i className="ri-search-line me-1"></i>
                        Sorgula
                    </Button>
                </Modal.Footer>
            </Modal>
        </Layout>
    );
}