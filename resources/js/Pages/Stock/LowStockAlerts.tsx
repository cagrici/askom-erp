import React, { useState } from 'react';
import Layout from '@/Layouts';
import { Head, Link, router } from '@inertiajs/react';
import { Card, Table, Badge, Row, Col, Form, Alert, Button } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';

interface Product {
    id: number;
    code: string;
    name: string;
    sku: string;
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
    primary_image?: {
        thumbnail_url: string;
    };
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
        critical_only?: boolean;
    };
}

export default function LowStockAlerts({ products, filters }: Props) {
    const { t } = useTranslation();
    const [localFilters, setLocalFilters] = useState(filters);

    const handleFilterChange = (key: string, value: any) => {
        const newFilters = { ...filters };
        
        if (value === null || value === undefined || value === '') {
            delete newFilters[key];
        } else {
            newFilters[key] = value;
        }
        
        setLocalFilters(newFilters);
        router.get(route('stock.low-stock-alerts'), newFilters, { preserveState: true });
    };

    const getStockStatusBadge = (product: Product) => {
        if (product.stock_quantity === 0) {
            return <Badge bg="danger">Stok Yok</Badge>;
        } else if (product.stock_quantity <= product.min_stock_level * 0.5) {
            return <Badge bg="danger">Kritik Stok</Badge>;
        } else if (product.stock_quantity <= product.min_stock_level) {
            return <Badge bg="warning">Düşük Stok</Badge>;
        }
        return <Badge bg="success">Normal</Badge>;
    };

    const getStockPercentage = (product: Product) => {
        if (product.min_stock_level === 0) return 0;
        return Math.round((product.stock_quantity / product.min_stock_level) * 100);
    };

    const getProgressBarClass = (percentage: number) => {
        if (percentage <= 25) return 'bg-danger';
        if (percentage <= 50) return 'bg-warning';
        if (percentage <= 75) return 'bg-info';
        return 'bg-success';
    };

    const formatCurrency = (amount: number) => {
        return `₺${amount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}`;
    };

    const getSuggestedOrderQuantity = (product: Product) => {
        const targetStock = product.max_stock_level || (product.min_stock_level * 3);
        return Math.max(0, targetStock - product.stock_quantity);
    };

    return (
        <Layout>
            <Head title="Düşük Stok Uyarıları" />

            <div className="page-content">
                <div className="container-fluid">
                    <Row className="mb-3">
                        <Col>
                            <div className="page-title-box d-flex align-items-center justify-content-between">
                                <div>
                                    <h4 className="mb-0">Düşük Stok Uyarıları</h4>
                                    <div className="page-title-right">
                                        <ol className="breadcrumb m-0">
                                            <li className="breadcrumb-item">
                                                <Link href={route('stock.index')}>Stok Yönetimi</Link>
                                            </li>
                                            <li className="breadcrumb-item active">Düşük Stok Uyarıları</li>
                                        </ol>
                                    </div>
                                </div>
                                <div>
                                    <Link 
                                        href={route('stock.index')} 
                                        className="btn btn-secondary me-2"
                                    >
                                        <i className="ri-arrow-left-line me-1"></i>
                                        Stok Listesi
                                    </Link>
                                </div>
                            </div>
                        </Col>
                    </Row>

                    {products.total > 0 && (
                        <Alert variant="warning" className="mb-4">
                            <div className="d-flex align-items-center">
                                <i className="ri-alert-line fs-4 me-3"></i>
                                <div>
                                    <h6 className="mb-1">Stok Uyarısı</h6>
                                    <p className="mb-0">
                                        {products.total} ürün minimum stok seviyesinin altında. 
                                        Acil sipariş vermeniz önerilir.
                                    </p>
                                </div>
                            </div>
                        </Alert>
                    )}

                    <Card>
                        <Card.Header>
                            <div className="d-flex justify-content-between align-items-center">
                                <h5 className="card-title mb-0">
                                    <i className="ri-alarm-warning-line me-2 text-warning"></i>
                                    Düşük Stok Ürünleri
                                    {products.total > 0 && (
                                        <Badge bg="warning" className="ms-2">{products.total}</Badge>
                                    )}
                                </h5>
                                <div>
                                    <Form.Check
                                        type="switch"
                                        id="critical-only"
                                        label="Sadece Kritik Stok"
                                        checked={localFilters.critical_only || false}
                                        onChange={(e) => handleFilterChange('critical_only', e.target.checked)}
                                    />
                                </div>
                            </div>
                        </Card.Header>
                        <Card.Body>
                            {products.data.length > 0 ? (
                                <>
                                    <div className="table-responsive">
                                        <Table hover className="table-centered align-middle">
                                            <thead className="table-light">
                                                <tr>
                                                    <th style={{ width: '60px' }}>Görsel</th>
                                                    <th>Ürün Bilgileri</th>
                                                    <th>Kategori/Marka</th>
                                                    <th className="text-center">Mevcut Stok</th>
                                                    <th className="text-center">Min. Stok</th>
                                                    <th className="text-center">Stok Oranı</th>
                                                    <th className="text-center">Durum</th>
                                                    <th className="text-end">Önerilen Sipariş</th>
                                                    <th className="text-end">Tahmini Maliyet</th>
                                                    <th className="text-center">İşlemler</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {products.data.map(product => {
                                                    const stockPercentage = getStockPercentage(product);
                                                    const suggestedQuantity = getSuggestedOrderQuantity(product);
                                                    const estimatedCost = suggestedQuantity * product.cost_price;

                                                    return (
                                                        <tr key={product.id}>
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
                                                            <td>
                                                                <div>
                                                                    <div className="fw-medium">{product.name}</div>
                                                                    <small className="text-muted">
                                                                        {product.code} | SKU: {product.sku}
                                                                    </small>
                                                                </div>
                                                            </td>
                                                            <td>
                                                                <div>
                                                                    <div className="text-dark">
                                                                        {product.category.full_name || product.category.name}
                                                                    </div>
                                                                    <small className="text-muted">
                                                                        {product.brand?.name || '-'}
                                                                    </small>
                                                                </div>
                                                            </td>
                                                            <td className="text-center">
                                                                <div className="fw-bold fs-5 text-danger">
                                                                    {product.stock_quantity}
                                                                </div>
                                                            </td>
                                                            <td className="text-center">
                                                                <div className="fw-medium">
                                                                    {product.min_stock_level}
                                                                </div>
                                                            </td>
                                                            <td className="text-center">
                                                                <div className="mb-1">
                                                                    <small className="fw-medium">{stockPercentage}%</small>
                                                                </div>
                                                                <div className="progress" style={{ height: '6px' }}>
                                                                    <div 
                                                                        className={`progress-bar ${getProgressBarClass(stockPercentage)}`}
                                                                        style={{ width: `${Math.min(stockPercentage, 100)}%` }}
                                                                    ></div>
                                                                </div>
                                                            </td>
                                                            <td className="text-center">
                                                                {getStockStatusBadge(product)}
                                                            </td>
                                                            <td className="text-end">
                                                                <div className="fw-bold text-primary">
                                                                    {suggestedQuantity} adet
                                                                </div>
                                                            </td>
                                                            <td className="text-end">
                                                                <div className="fw-medium text-success">
                                                                    {formatCurrency(estimatedCost)}
                                                                </div>
                                                            </td>
                                                            <td>
                                                                <div className="d-flex justify-content-center gap-1">
                                                                    <Button 
                                                                        size="sm" 
                                                                        variant="success"
                                                                        title="Hızlı Sipariş"
                                                                    >
                                                                        <i className="ri-shopping-cart-line"></i>
                                                                    </Button>
                                                                    
                                                                    <Link 
                                                                        href={route('products.stock-history', product.id)}
                                                                        className="btn btn-sm btn-info"
                                                                        title="Stok Geçmişi"
                                                                    >
                                                                        <i className="ri-history-line"></i>
                                                                    </Link>

                                                                    <Link 
                                                                        href={route('products.edit', product.id)}
                                                                        className="btn btn-sm btn-primary"
                                                                        title="Düzenle"
                                                                    >
                                                                        <i className="ri-pencil-line"></i>
                                                                    </Link>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </Table>
                                    </div>

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
                                </>
                            ) : (
                                <div className="text-center py-5">
                                    <i className="ri-check-double-line fs-1 text-success"></i>
                                    <h5 className="mt-3 text-success">Harika!</h5>
                                    <p className="text-muted mb-0">
                                        Tüm ürünlerinizin stok seviyeleri normal durumda.
                                    </p>
                                    <small className="text-muted">
                                        Düşük stok seviyesine ulaşan ürünler burada görüntülenecek.
                                    </small>
                                </div>
                            )}
                        </Card.Body>
                    </Card>
                </div>
            </div>
        </Layout>
    );
}