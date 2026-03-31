import React, { useState, useEffect } from 'react';
import Layout from '@/Layouts';
import { Head, Link, router } from '@inertiajs/react';
import { Card, Table, Button, Form, Row, Col, InputGroup, Badge, Dropdown, Modal, OverlayTrigger, Tooltip } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';
import { formatProductPrice, formatCostPrice } from '@/utils/currency';

interface ProductTranslation {
    id: number;
    product_id: number;
    locale: string;
    name: string;
    description?: string;
    short_description?: string;
    meta_title?: string;
    meta_description?: string;
    meta_keywords?: string;
}

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
    sale_price: number;
    cost_price: number;
    sale_price_try?: number;
    cost_price_try?: number;
    currency?: string;
    logo_currency?: string;
    stock_quantity: number;
    min_stock_level: number;
    is_active: boolean;
    is_featured: boolean;
    product_type: string;
    primary_image?: {
        id: number;
        image_path: string;
        thumbnail_path: string;
        image_url: string;
        thumbnail_url: string;
        is_primary: boolean;
        sort_order: number;
    };
    translations?: ProductTranslation[];
    current_translation?: ProductTranslation;
    created_at: string;
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
        is_active?: boolean;
        sort_field?: string;
        sort_direction?: string;
    };
    categories: Array<{ id: number; name: string; full_name?: string; }>;
    brands: Array<{ id: number; name: string; }>;
}

export default function ProductIndex({ products, filters, categories, brands }: Props) {
    const { t, i18n } = useTranslation();
    const [selectedProducts, setSelectedProducts] = useState<number[]>([]);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [productToDelete, setProductToDelete] = useState<Product | null>(null);
    const [localFilters, setLocalFilters] = useState(filters);

    // Helper function to get translated product name
    const getTranslatedName = (product: Product): string => {
        // First try current_translation from backend
        if (product.current_translation?.name) {
            return product.current_translation.name;
        }
        
        // Fallback to finding translation for current locale
        const currentLocale = i18n.language || 'tr';
        const translation = product.translations?.find(t => t.locale === currentLocale);
        if (translation?.name) {
            return translation.name;
        }
        
        // Final fallback to original name field
        return product.name || '';
    };


    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(route('products.index'), { ...filters, ...localFilters }, { preserveState: true });
    };

    const handleFilterChange = (key: string, value: any) => {
        const newFilters = { ...filters };

        // Null veya undefined değerleri URL'den çıkar
        if (value === null || value === undefined || value === '') {
            delete newFilters[key];
        } else {
            newFilters[key] = value;
        }

        setLocalFilters(newFilters);
        router.get(route('products.index'), newFilters, { preserveState: true });
    };

    const handleSort = (field: string) => {
        const currentSortDirection = filters.sort_field === field && filters.sort_direction === 'asc' ? 'desc' : 'asc';

        router.get(route('products.index'), {
            ...filters, // Mevcut tüm filtreleri koru
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

    const handleBulkDelete = async () => {
        if (selectedProducts.length === 0) return;

        if (confirm(`${selectedProducts.length} ürünü silmek istediğinizden emin misiniz?`)) {
            try {
                await router.post(route('products.bulk-delete'), {
                    ids: selectedProducts
                });
                setSelectedProducts([]);
            } catch (error) {
                console.error('Bulk delete error:', error);
            }
        }
    };

    const handleDelete = async () => {
        if (!productToDelete) return;

        try {
            await router.delete(route('products.destroy', productToDelete.id));
            setShowDeleteModal(false);
            setProductToDelete(null);
        } catch (error) {
            console.error('Delete error:', error);
        }
    };

    const getStockStatusBadge = (product: Product) => {
        if (product.stock_quantity === 0) {
            return <Badge bg="danger">Stokta Yok</Badge>;
        } else if (product.stock_quantity <= product.min_stock_level) {
            return <Badge bg="warning">Düşük Stok</Badge>;
        }
        return <Badge bg="success">Stokta</Badge>;
    };

    const getProductTypeBadge = (type: string) => {
        const types: { [key: string]: { variant: string; label: string } } = {
            'simple': { variant: 'primary', label: 'Basit' },
            'variable': { variant: 'info', label: 'Varyantlı' },
            'bundle': { variant: 'warning', label: 'Set' },
            'grouped': { variant: 'secondary', label: 'Gruplu' }
        };
        const typeInfo = types[type] || { variant: 'secondary', label: type };
        return <Badge bg={typeInfo.variant}>{typeInfo.label}</Badge>;
    };

    return (
        <Layout>
            <Head title="Ürün Yönetimi" />

            <div className="page-content">
                <div className="container-fluid">
                    <Row className="mb-3">
                        <Col>
                            <div className="page-title-box d-flex align-items-center justify-content-between">
                                <h4 className="mb-0">Ürün Yönetimi</h4>
                                <div className="d-flex gap-2">
                                    <a
                                        href={route('products.export-excel', {
                                            search: filters.search || undefined,
                                            category_id: filters.category_id || undefined,
                                            brand_id: filters.brand_id || undefined,
                                            stock_status: filters.stock_status || undefined,
                                            is_active: filters.is_active !== undefined && filters.is_active !== '' ? filters.is_active : undefined,
                                        })}
                                        className="btn btn-success"
                                    >
                                        <i className="ri-file-excel-2-line me-1"></i>
                                        Excel
                                    </a>
                                    <Link href={route('products.create')} className="btn btn-primary">
                                        <i className="ri-add-line me-1"></i>
                                        Yeni Ürün
                                    </Link>
                                </div>
                            </div>
                        </Col>
                    </Row>

                    <Card>
                        <Card.Body>
                            <Row className="mb-4">
                                <Col lg={4}>
                                    <Form onSubmit={handleSearch}>
                                        <InputGroup>
                                            <Form.Control
                                                type="text"
                                                placeholder="Ürün adı, kodu, SKU veya barkod ara..."
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
                                    </Form.Select>
                                </Col>
                                <Col lg={2}>
                                    <Form.Select
                                        value={localFilters.is_active !== undefined && localFilters.is_active !== null ? localFilters.is_active.toString() : ''}
                                        onChange={(e) => handleFilterChange('is_active', e.target.value === '' ? null : e.target.value)}
                                    >
                                        <option value="">Tüm Durumlar</option>
                                        <option value="true">Aktif</option>
                                        <option value="false">Pasif</option>
                                    </Form.Select>
                                </Col>
                            </Row>

                            {selectedProducts.length > 0 && (
                                <div className="mb-3 d-flex justify-content-between align-items-center">
                                    <span>{selectedProducts.length} ürün seçildi</span>
                                    <div className="d-flex gap-2">
                                        <Button variant="danger" size="sm" onClick={handleBulkDelete}>
                                            <i className="ri-delete-bin-line me-1"></i>
                                            Seçilileri Sil
                                        </Button>
                                    </div>
                                </div>
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
                                                className="text-end cursor-pointer"
                                                onClick={() => handleSort('sale_price')}
                                            >
                                                Fiyat
                                                {getSortIcon('sale_price')}
                                            </th>
                                            <th
                                                className="text-center cursor-pointer"
                                                onClick={() => handleSort('stock_quantity')}
                                            >
                                                Stok
                                                {getSortIcon('stock_quantity')}
                                            </th>
                                            <th className="text-center">Tip</th>
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
                                                            alt={getTranslatedName(product)}
                                                            className="rounded"
                                                            style={{ width: '55px', height: '55px', objectFit: 'cover' }}
                                                        />
                                                    ) : (
                                                        <div
                                                            className="bg-light rounded d-flex align-items-center justify-content-center"
                                                            style={{ width: '55px', height: '55px' }}
                                                        >
                                                            <i className="ri-image-line text-muted"></i>
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="fw-medium">{product.code}</td>
                                                <td>
                                                    <div>
                                                        <div className="fw-medium">{getTranslatedName(product)}</div>
                                                        <small className="text-muted">SKU: {product.sku}</small>
                                                        {product.barcode && (
                                                            <small className="text-muted ms-2">Barkod: {product.barcode}</small>
                                                        )}
                                                    </div>
                                                </td>
                                                <td>{product.category?.full_name || product.category?.name || '-'}</td>
                                                <td>{product.brand?.name || '-'}</td>
                                                <td className="text-end">
                                                    <div>{formatProductPrice(product)}</div>
                                                    <small className="text-muted">
                                                        Maliyet: {formatCostPrice(product)}
                                                    </small>
                                                </td>
                                                <td className="text-center">
                                                    <div>{product.stock_quantity}</div>
                                                    {getStockStatusBadge(product)}
                                                </td>
                                                <td className="text-center">
                                                    {getProductTypeBadge(product.product_type)}
                                                </td>
                                                <td className="text-center">
                                                    <div className="d-flex flex-column align-items-center gap-1">
                                                        <Badge bg={product.is_active ? 'success' : 'danger'}>
                                                            {product.is_active ? 'Aktif' : 'Pasif'}
                                                        </Badge>
                                                        {product.is_featured && (
                                                            <Badge bg="warning">
                                                                <i className="ri-star-fill"></i> Öne Çıkan
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </td>
                                                <td>
                                                    <div className="d-flex justify-content-center gap-1">
                                                        <OverlayTrigger
                                                            placement="top"
                                                            overlay={<Tooltip>Görüntüle</Tooltip>}
                                                        >
                                                            <Link
                                                                href={route('products.show', product.id)}
                                                                className="btn btn-sm btn-light"
                                                            >
                                                                <i className="ri-eye-line"></i>
                                                            </Link>
                                                        </OverlayTrigger>

                                                        <OverlayTrigger
                                                            placement="top"
                                                            overlay={<Tooltip>Düzenle</Tooltip>}
                                                        >
                                                            <Link
                                                                href={route('products.edit', product.id)}
                                                                className="btn btn-sm btn-primary"
                                                            >
                                                                <i className="ri-pencil-line"></i>
                                                            </Link>
                                                        </OverlayTrigger>

                                                        <Dropdown>
                                                            <Dropdown.Toggle
                                                                as="button"
                                                                className="btn btn-sm btn-light"
                                                            >
                                                                <i className="ri-more-2-fill"></i>
                                                            </Dropdown.Toggle>
                                                            <Dropdown.Menu>
                                                                <Dropdown.Item
                                                                    onClick={() => router.post(route('products.duplicate', product.id))}
                                                                >
                                                                    <i className="ri-file-copy-line me-2"></i>
                                                                    Kopyala
                                                                </Dropdown.Item>
                                                                <Dropdown.Item
                                                                    as={Link}
                                                                    href={route('products.stock-history', product.id)}
                                                                >
                                                                    <i className="ri-history-line me-2"></i>
                                                                    Stok Geçmişi
                                                                </Dropdown.Item>
                                                                <Dropdown.Divider />
                                                                <Dropdown.Item
                                                                    className="text-danger"
                                                                    onClick={() => {
                                                                        setProductToDelete(product);
                                                                        setShowDeleteModal(true);
                                                                    }}
                                                                >
                                                                    <i className="ri-delete-bin-line me-2"></i>
                                                                    Sil
                                                                </Dropdown.Item>
                                                            </Dropdown.Menu>
                                                        </Dropdown>
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

            {/* Delete Modal */}
            <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered>
                <Modal.Header closeButton>
                    <Modal.Title>Ürünü Sil</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <p>
                        <strong>{productToDelete ? getTranslatedName(productToDelete) : ''}</strong> ürününü silmek istediğinizden emin misiniz?
                    </p>
                    <p className="text-danger mb-0">
                        <i className="ri-alert-line me-1"></i>
                        Bu işlem geri alınamaz!
                    </p>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
                        İptal
                    </Button>
                    <Button variant="danger" onClick={handleDelete}>
                        Sil
                    </Button>
                </Modal.Footer>
            </Modal>
        </Layout>
    );
}
