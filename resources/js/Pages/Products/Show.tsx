import React, { useState } from 'react';
import Layout from '@/Layouts';
import { Head, Link } from '@inertiajs/react';
import { Card, Row, Col, Badge, Table, Button, Nav, Tab } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';

interface Category {
    id: number;
    name: string;
    full_name?: string;
}

interface Brand {
    id: number;
    name: string;
    logo?: string;
}

interface Supplier {
    id: number;
    code: string;
    name: string;
    company_name?: string;
}

interface ProductImage {
    id: number;
    image_path: string;
    thumbnail_path: string;
    is_primary: boolean;
    sort_order: number;
}

interface ProductVariant {
    id: number;
    name: string;
    sku: string;
    price?: number;
    stock_quantity: number;
    is_active: boolean;
}

interface ProductAttribute {
    id: number;
    name: string;
    type: string;
    pivot: {
        value?: string;
        attribute_value_id?: number;
    };
    values?: Array<{
        id: number;
        value: string;
        color_hex?: string;
    }>;
}

interface BundleItem {
    id: number;
    quantity: number;
    product: {
        id: number;
        name: string;
        sku: string;
        price?: number;
    };
}

interface ProductPrice {
    id: number;
    price: number;
    price_list: {
        id: number;
        name: string;
    };
}

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
    name: string;
    slug: string;
    code: string;
    barcode?: string;
    sku: string;
    category?: Category;
    brand?: Brand;
    supplier?: Supplier;
    description?: string;
    short_description?: string;
    translations?: ProductTranslation[];
    current_translation?: ProductTranslation;
    cost_price?: number;
    sale_price?: number;
    wholesale_price?: number;
    min_sale_price?: number;
    tax_rate: number;
    currency: string;
    stock_quantity: number;
    min_stock_level?: number;
    max_stock_level?: number;
    track_inventory: boolean;
    allow_backorder: boolean;
    weight?: number;
    width?: number;
    height?: number;
    depth?: number;
    volume?: number;
    unit_of_measure: string;
    items_per_package: number;
    items_per_box?: number;
    boxes_per_pallet?: number;
    package_type?: string;
    product_type: string;
    tax_id?: number;
    tax?: {
        id: number;
        name: string;
        type: 'percentage' | 'fixed';
        rate: number;
        fixed_amount?: number;
        code: string;
    };
    can_be_purchased?: boolean;
    can_be_sold?: boolean;
    is_stockable?: boolean;
    is_serialized?: boolean;
    lead_time_days?: number;
    purchase_uom?: string;
    sales_uom?: string;
    is_active: boolean;
    is_featured: boolean;
    is_digital: boolean;
    is_new: boolean;
    meta_title?: string;
    meta_description?: string;
    meta_keywords?: string;
    specifications?: Record<string, any>;
    tags?: string[];
    country_of_origin?: string;
    warranty_period?: number;
    warranty_info?: string;
    images?: ProductImage[];
    variants?: ProductVariant[];
    attributes?: ProductAttribute[];
    bundleItems?: BundleItem[];
    prices?: ProductPrice[];
    created_at: string;
    updated_at: string;
}

interface Props {
    product: Product;
}

export default function ProductShow({ product }: Props) {
    const { t, i18n } = useTranslation();
    const [currentLocale, setCurrentLocale] = useState(i18n.language || 'tr');
    
    // Helper functions to get translated content
    const getTranslatedField = (field: 'name' | 'description' | 'short_description' | 'meta_title' | 'meta_description' | 'meta_keywords'): string => {
        // First try current_translation from backend if available
        if (product.current_translation?.[field]) {
            return product.current_translation[field];
        }
        
        // Find translation for current locale
        const translation = product.translations?.find(t => t.locale === currentLocale);
        if (translation?.[field]) {
            return translation[field];
        }
        
        // Fallback to original field or Turkish translation
        const turkishTranslation = product.translations?.find(t => t.locale === 'tr');
        if (turkishTranslation?.[field]) {
            return turkishTranslation[field];
        }
        
        // Final fallback to original product field
        return (product as any)[field] || '';
    };
    
    const getTranslatedName = (): string => getTranslatedField('name');
    const getTranslatedDescription = (): string => getTranslatedField('description');
    const getTranslatedShortDescription = (): string => getTranslatedField('short_description');
    
    // Get available languages for this product
    const availableLanguages = product.translations?.map(t => t.locale) || [];

    const formatPrice = (price?: number) => {
        return price ? `₺${price.toLocaleString()}` : '-';
    };

    const getStockBadge = (quantity: number, minLevel?: number) => {
        if (quantity <= 0) {
            return <Badge bg="danger">Stokta Yok</Badge>;
        } else if (minLevel && quantity <= minLevel) {
            return <Badge bg="warning">Düşük Stok</Badge>;
        } else {
            return <Badge bg="success">Stokta Var</Badge>;
        }
    };

    const getProductTypeBadge = (type: string) => {
        const types: Record<string, { label: string; color: string }> = {
            'raw_material': { label: 'Hammadde', color: 'secondary' },
            'finished_goods': { label: 'Mamul', color: 'primary' },
            'semi_finished': { label: 'Yarı Mamul', color: 'info' },
            'trading_goods': { label: 'Ticari Mal', color: 'success' },
            'service': { label: 'Hizmet', color: 'warning' },
            'consumable': { label: 'Sarf Malzeme', color: 'dark' },
        };
        
        const typeInfo = types[type] || { label: type, color: 'secondary' };
        return <Badge bg={typeInfo.color}>{typeInfo.label}</Badge>;
    };

    const getBooleanBadge = (value?: boolean, trueLabel: string = 'Evet', falseLabel: string = 'Hayır') => {
        return value ? 
            <Badge bg="success">{trueLabel}</Badge> : 
            <Badge bg="secondary">{falseLabel}</Badge>;
    };

    const primaryImage = product.images?.find(img => img.is_primary) || product.images?.[0];

    return (
        <Layout>
            <Head title={getTranslatedName()} />

            <div className="page-content">
                <div className="container-fluid">
                    <Row className="mb-3">
                        <Col>
                            <div className="page-title-box d-flex align-items-center justify-content-between">
                                <h4 className="mb-0">{getTranslatedName()}</h4>
                                <div className="d-flex gap-2">
                                    <Link href={route('products.edit', product.id)} className="btn btn-primary">
                                        <i className="ri-pencil-line me-1"></i>
                                        Düzenle
                                    </Link>
                                    <Link href={route('products.index')} className="btn btn-secondary">
                                        <i className="ri-arrow-left-line me-1"></i>
                                        Geri Dön
                                    </Link>
                                </div>
                            </div>
                        </Col>
                    </Row>

                    <Row>
                        {/* Sol Taraf - Ürün Görseli */}
                        <Col xl={4}>
                            <Card>
                                <Card.Body>
                                    {primaryImage ? (
                                        <div className="text-center">
                                            <img
                                                src={`/storage/${primaryImage.image_path}`}
                                                alt={getTranslatedName()}
                                                className="img-fluid rounded"
                                                style={{ maxHeight: '400px', width: '100%', objectFit: 'contain' }}
                                            />
                                        </div>
                                    ) : (
                                        <div className="text-center py-5">
                                            <i className="ri-image-line fs-1 text-muted"></i>
                                            <p className="text-muted mt-2">Görsel bulunmuyor</p>
                                        </div>
                                    )}

                                    {product.images && product.images.length > 1 && (
                                        <div className="mt-3">
                                            <Row>
                                                {product.images.map((image, index) => (
                                                    <Col xs={3} key={image.id} className="mb-2">
                                                        <img
                                                            src={`/storage/${image.thumbnail_path || image.image_path}`}
                                                            alt={`${getTranslatedName()} - ${index + 1}`}
                                                            className={`img-fluid rounded border ${image.is_primary ? 'border-primary border-2' : ''}`}
                                                            style={{ height: '60px', width: '100%', objectFit: 'cover', cursor: 'pointer' }}
                                                        />
                                                    </Col>
                                                ))}
                                            </Row>
                                        </div>
                                    )}
                                </Card.Body>
                            </Card>

                            {/* Hızlı Bilgiler */}
                            <Card>
                                <Card.Header>
                                    <h5 className="card-title mb-0">Hızlı Bilgiler</h5>
                                </Card.Header>
                                <Card.Body>
                                    <Table size="sm" className="mb-0">
                                        <tbody>
                                            <tr>
                                                <td><strong>Ürün Kodu:</strong></td>
                                                <td>{product.code}</td>
                                            </tr>
                                            <tr>
                                                <td><strong>SKU:</strong></td>
                                                <td>{product.sku}</td>
                                            </tr>
                                            {product.barcode && (
                                                <tr>
                                                    <td><strong>Barkod:</strong></td>
                                                    <td>{product.barcode}</td>
                                                </tr>
                                            )}
                                            <tr>
                                                <td><strong>Kategori:</strong></td>
                                                <td>{product.category?.name || '-'}</td>
                                            </tr>
                                            <tr>
                                                <td><strong>Marka:</strong></td>
                                                <td>{product.brand?.name || '-'}</td>
                                            </tr>
                                            <tr>
                                                <td><strong>Tedarikçi:</strong></td>
                                                <td>{product.supplier?.name || '-'}</td>
                                            </tr>
                                            <tr>
                                                <td><strong>Tip:</strong></td>
                                                <td>{getProductTypeBadge(product.product_type)}</td>
                                            </tr>
                                            {product.tax && (
                                                <tr>
                                                    <td><strong>Vergi:</strong></td>
                                                    <td>
                                                        <Badge bg="outline-primary">
                                                            {product.tax.name} ({product.tax.type === 'percentage' ? `%${product.tax.rate}` : `₺${product.tax.fixed_amount}`})
                                                        </Badge>
                                                    </td>
                                                </tr>
                                            )}
                                            <tr>
                                                <td><strong>Satın Alınabilir:</strong></td>
                                                <td>{getBooleanBadge(product.can_be_purchased)}</td>
                                            </tr>
                                            <tr>
                                                <td><strong>Satılabilir:</strong></td>
                                                <td>{getBooleanBadge(product.can_be_sold)}</td>
                                            </tr>
                                            <tr>
                                                <td><strong>Stoklanabilir:</strong></td>
                                                <td>{getBooleanBadge(product.is_stockable)}</td>
                                            </tr>
                                            <tr>
                                                <td><strong>Seri Numaralı:</strong></td>
                                                <td>{getBooleanBadge(product.is_serialized)}</td>
                                            </tr>
                                            {product.lead_time_days && (
                                                <tr>
                                                    <td><strong>Tedarik Süresi:</strong></td>
                                                    <td>{product.lead_time_days} gün</td>
                                                </tr>
                                            )}
                                            {product.purchase_uom && (
                                                <tr>
                                                    <td><strong>Alış Birimi:</strong></td>
                                                    <td><code>{product.purchase_uom}</code></td>
                                                </tr>
                                            )}
                                            {product.sales_uom && (
                                                <tr>
                                                    <td><strong>Satış Birimi:</strong></td>
                                                    <td><code>{product.sales_uom}</code></td>
                                                </tr>
                                            )}
                                            <tr>
                                                <td><strong>Durum:</strong></td>
                                                <td>
                                                    <div className="d-flex flex-wrap gap-1">
                                                        <Badge bg={product.is_active ? 'success' : 'danger'}>
                                                            {product.is_active ? 'Aktif' : 'Pasif'}
                                                        </Badge>
                                                        {product.is_featured && <Badge bg="warning">Öne Çıkan</Badge>}
                                                        {product.is_new && <Badge bg="info">Yeni</Badge>}
                                                        {product.is_digital && <Badge bg="secondary">Dijital</Badge>}
                                                    </div>
                                                </td>
                                            </tr>
                                        </tbody>
                                    </Table>
                                </Card.Body>
                            </Card>
                        </Col>

                        {/* Sağ Taraf - Ürün Detayları */}
                        <Col xl={8}>
                            <Tab.Container defaultActiveKey="details">
                                <Nav variant="tabs" className="mb-3">
                                    <Nav.Item>
                                        <Nav.Link eventKey="details">
                                            <i className="ri-information-line me-1"></i>
                                            Genel Bilgiler
                                        </Nav.Link>
                                    </Nav.Item>
                                    <Nav.Item>
                                        <Nav.Link eventKey="pricing">
                                            <i className="ri-money-dollar-circle-line me-1"></i>
                                            Fiyatlandırma
                                        </Nav.Link>
                                    </Nav.Item>
                                    <Nav.Item>
                                        <Nav.Link eventKey="inventory">
                                            <i className="ri-stack-line me-1"></i>
                                            Stok Bilgileri
                                        </Nav.Link>
                                    </Nav.Item>
                                    {product.variants && product.variants.length > 0 && (
                                        <Nav.Item>
                                            <Nav.Link eventKey="variants">
                                                <i className="ri-palette-line me-1"></i>
                                                Varyantlar ({product.variants.length})
                                            </Nav.Link>
                                        </Nav.Item>
                                    )}
                                    {product.attributes && product.attributes.length > 0 && (
                                        <Nav.Item>
                                            <Nav.Link eventKey="attributes">
                                                <i className="ri-settings-2-line me-1"></i>
                                                Özellikler
                                            </Nav.Link>
                                        </Nav.Item>
                                    )}
                                </Nav>

                                <Tab.Content>
                                    {/* Genel Bilgiler */}
                                    <Tab.Pane eventKey="details">
                                        <Card>
                                            <Card.Body>
                                                {availableLanguages.length > 1 && (
                                                    <div className="mb-4">
                                                        <h6>Dil Seçimi</h6>
                                                        <div className="d-flex flex-wrap gap-2">
                                                            {availableLanguages.map(locale => {
                                                                const languageNames: Record<string, string> = {
                                                                    'tr': 'Türkçe',
                                                                    'en': 'English',
                                                                    'de': 'Deutsch',
                                                                    'fr': 'Français'
                                                                };
                                                                return (
                                                                    <Badge 
                                                                        key={locale}
                                                                        bg={currentLocale === locale ? 'primary' : 'light'}
                                                                        text={currentLocale === locale ? 'white' : 'dark'}
                                                                        style={{ cursor: 'pointer' }}
                                                                        onClick={() => setCurrentLocale(locale)}
                                                                    >
                                                                        {languageNames[locale] || locale.toUpperCase()}
                                                                    </Badge>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                )}
                                                
                                                {getTranslatedShortDescription() && (
                                                    <div className="mb-4">
                                                        <h6>Kısa Açıklama</h6>
                                                        <p className="text-muted">{getTranslatedShortDescription()}</p>
                                                    </div>
                                                )}

                                                {getTranslatedDescription() && (
                                                    <div className="mb-4">
                                                        <h6>Detaylı Açıklama</h6>
                                                        <div className="text-muted" dangerouslySetInnerHTML={{ __html: getTranslatedDescription() }} />
                                                    </div>
                                                )}

                                                <Row>
                                                    <Col md={6}>
                                                        <h6>Fiziksel Özellikler</h6>
                                                        <Table size="sm">
                                                            <tbody>
                                                                {product.weight && (
                                                                    <tr>
                                                                        <td>Ağırlık:</td>
                                                                        <td>{product.weight} kg</td>
                                                                    </tr>
                                                                )}
                                                                {product.width && (
                                                                    <tr>
                                                                        <td>Genişlik:</td>
                                                                        <td>{product.width} cm</td>
                                                                    </tr>
                                                                )}
                                                                {product.height && (
                                                                    <tr>
                                                                        <td>Yükseklik:</td>
                                                                        <td>{product.height} cm</td>
                                                                    </tr>
                                                                )}
                                                                {product.depth && (
                                                                    <tr>
                                                                        <td>Derinlik:</td>
                                                                        <td>{product.depth} cm</td>
                                                                    </tr>
                                                                )}
                                                                <tr>
                                                                    <td>Ölçü Birimi:</td>
                                                                    <td>{product.unit_of_measure}</td>
                                                                </tr>
                                                            </tbody>
                                                        </Table>
                                                    </Col>
                                                    <Col md={6}>
                                                        <h6>Paketleme Bilgileri</h6>
                                                        <Table size="sm">
                                                            <tbody>
                                                                <tr>
                                                                    <td>Paket Başına Adet:</td>
                                                                    <td>{product.items_per_package}</td>
                                                                </tr>
                                                                {product.items_per_box && (
                                                                    <tr>
                                                                        <td>Kutu Başına Adet:</td>
                                                                        <td>{product.items_per_box}</td>
                                                                    </tr>
                                                                )}
                                                                {product.boxes_per_pallet && (
                                                                    <tr>
                                                                        <td>Palet Başına Kutu:</td>
                                                                        <td>{product.boxes_per_pallet}</td>
                                                                    </tr>
                                                                )}
                                                                {product.package_type && (
                                                                    <tr>
                                                                        <td>Paket Tipi:</td>
                                                                        <td>{product.package_type}</td>
                                                                    </tr>
                                                                )}
                                                            </tbody>
                                                        </Table>
                                                    </Col>
                                                </Row>

                                                {(product.country_of_origin || product.warranty_period) && (
                                                    <Row className="mt-4">
                                                        <Col md={6}>
                                                            <h6>Diğer Bilgiler</h6>
                                                            <Table size="sm">
                                                                <tbody>
                                                                    {product.country_of_origin && (
                                                                        <tr>
                                                                            <td>Menşe Ülke:</td>
                                                                            <td>{product.country_of_origin}</td>
                                                                        </tr>
                                                                    )}
                                                                    {product.warranty_period && (
                                                                        <tr>
                                                                            <td>Garanti Süresi:</td>
                                                                            <td>{product.warranty_period} ay</td>
                                                                        </tr>
                                                                    )}
                                                                </tbody>
                                                            </Table>
                                                        </Col>
                                                        {product.warranty_info && (
                                                            <Col md={6}>
                                                                <h6>Garanti Bilgileri</h6>
                                                                <p className="text-muted small">{product.warranty_info}</p>
                                                            </Col>
                                                        )}
                                                    </Row>
                                                )}

                                                {/* ERP Ayarları */}
                                                <Row className="mt-4">
                                                    <Col md={12}>
                                                        <h6>ERP Ayarları</h6>
                                                        <div className="bg-light p-3 rounded">
                                                            <Row>
                                                                <Col md={4}>
                                                                    <div className="mb-2">
                                                                        <strong>Ürün Tipi:</strong>
                                                                        <div className="mt-1">
                                                                            {getProductTypeBadge(product.product_type)}
                                                                        </div>
                                                                    </div>
                                                                </Col>
                                                                <Col md={4}>
                                                                    <div className="mb-2">
                                                                        <strong>Satın Alınabilir:</strong>
                                                                        <div className="mt-1">
                                                                            {getBooleanBadge(product.can_be_purchased)}
                                                                        </div>
                                                                    </div>
                                                                </Col>
                                                                <Col md={4}>
                                                                    <div className="mb-2">
                                                                        <strong>Satılabilir:</strong>
                                                                        <div className="mt-1">
                                                                            {getBooleanBadge(product.can_be_sold)}
                                                                        </div>
                                                                    </div>
                                                                </Col>
                                                            </Row>
                                                            <Row>
                                                                <Col md={4}>
                                                                    <div className="mb-2">
                                                                        <strong>Stoklanabilir:</strong>
                                                                        <div className="mt-1">
                                                                            {getBooleanBadge(product.is_stockable)}
                                                                        </div>
                                                                    </div>
                                                                </Col>
                                                                <Col md={4}>
                                                                    <div className="mb-2">
                                                                        <strong>Seri Numaralı:</strong>
                                                                        <div className="mt-1">
                                                                            {getBooleanBadge(product.is_serialized)}
                                                                        </div>
                                                                    </div>
                                                                </Col>
                                                                {product.lead_time_days && (
                                                                    <Col md={4}>
                                                                        <div className="mb-2">
                                                                            <strong>Tedarik Süresi:</strong>
                                                                            <div className="mt-1">
                                                                                <Badge bg="info">{product.lead_time_days} gün</Badge>
                                                                            </div>
                                                                        </div>
                                                                    </Col>
                                                                )}
                                                            </Row>
                                                            {(product.purchase_uom || product.sales_uom) && (
                                                                <Row>
                                                                    {product.purchase_uom && (
                                                                        <Col md={6}>
                                                                            <div className="mb-2">
                                                                                <strong>Alış Birimi:</strong>
                                                                                <div className="mt-1">
                                                                                    <code>{product.purchase_uom}</code>
                                                                                </div>
                                                                            </div>
                                                                        </Col>
                                                                    )}
                                                                    {product.sales_uom && (
                                                                        <Col md={6}>
                                                                            <div className="mb-2">
                                                                                <strong>Satış Birimi:</strong>
                                                                                <div className="mt-1">
                                                                                    <code>{product.sales_uom}</code>
                                                                                </div>
                                                                            </div>
                                                                        </Col>
                                                                    )}
                                                                </Row>
                                                            )}
                                                        </div>
                                                    </Col>
                                                </Row>

                                                {product.tags && product.tags.length > 0 && (
                                                    <div className="mt-4">
                                                        <h6>Etiketler</h6>
                                                        <div className="d-flex flex-wrap gap-1">
                                                            {product.tags.map((tag, index) => (
                                                                <Badge key={index} bg="light" text="dark">
                                                                    #{tag}
                                                                </Badge>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </Card.Body>
                                        </Card>
                                    </Tab.Pane>

                                    {/* Fiyatlandırma */}
                                    <Tab.Pane eventKey="pricing">
                                        <Card>
                                            <Card.Body>
                                                <Row>
                                                    <Col md={6}>
                                                        <h6>Fiyat Bilgileri</h6>
                                                        <Table>
                                                            <tbody>
                                                                {product.cost_price && (
                                                                    <tr>
                                                                        <td><strong>Maliyet Fiyatı:</strong></td>
                                                                        <td>{formatPrice(product.cost_price)}</td>
                                                                    </tr>
                                                                )}
                                                                <tr>
                                                                    <td><strong>Satış Fiyatı:</strong></td>
                                                                    <td className="text-primary fw-bold fs-5">
                                                                        {formatPrice(product.sale_price)}
                                                                    </td>
                                                                </tr>
                                                                {product.wholesale_price && (
                                                                    <tr>
                                                                        <td><strong>Toptan Fiyatı:</strong></td>
                                                                        <td>{formatPrice(product.wholesale_price)}</td>
                                                                    </tr>
                                                                )}
                                                                {product.min_sale_price && (
                                                                    <tr>
                                                                        <td><strong>Min. Satış Fiyatı:</strong></td>
                                                                        <td>{formatPrice(product.min_sale_price)}</td>
                                                                    </tr>
                                                                )}
                                                                {product.tax ? (
                                                                    <tr>
                                                                        <td><strong>Vergi:</strong></td>
                                                                        <td>
                                                                            <Badge bg="outline-primary">
                                                                                {product.tax.name} - {product.tax.type === 'percentage' ? `%${product.tax.rate}` : `₺${product.tax.fixed_amount}`}
                                                                            </Badge>
                                                                        </td>
                                                                    </tr>
                                                                ) : (
                                                                    <tr>
                                                                        <td><strong>KDV Oranı:</strong></td>
                                                                        <td>%{product.tax_rate}</td>
                                                                    </tr>
                                                                )}
                                                                <tr>
                                                                    <td><strong>Para Birimi:</strong></td>
                                                                    <td>{product.currency}</td>
                                                                </tr>
                                                            </tbody>
                                                        </Table>
                                                    </Col>
                                                    {product.cost_price && product.sale_price && (
                                                        <Col md={6}>
                                                            <h6>Kar Analizi</h6>
                                                            <Table>
                                                                <tbody>
                                                                    <tr>
                                                                        <td><strong>Brüt Kar:</strong></td>
                                                                        <td className="text-success">
                                                                            {formatPrice(product.sale_price - product.cost_price)}
                                                                        </td>
                                                                    </tr>
                                                                    <tr>
                                                                        <td><strong>Kar Marjı:</strong></td>
                                                                        <td className="text-success">
                                                                            %{(((product.sale_price - product.cost_price) / product.sale_price) * 100).toFixed(2)}
                                                                        </td>
                                                                    </tr>
                                                                    <tr>
                                                                        <td><strong>Markup:</strong></td>
                                                                        <td className="text-info">
                                                                            %{(((product.sale_price - product.cost_price) / product.cost_price) * 100).toFixed(2)}
                                                                        </td>
                                                                    </tr>
                                                                </tbody>
                                                            </Table>
                                                        </Col>
                                                    )}
                                                </Row>

                                                {product.prices && product.prices.length > 0 && (
                                                    <div className="mt-4">
                                                        <h6>Fiyat Listeleri</h6>
                                                        <Table>
                                                            <thead>
                                                                <tr>
                                                                    <th>Fiyat Listesi</th>
                                                                    <th>Fiyat</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {product.prices.map(price => (
                                                                    <tr key={price.id}>
                                                                        <td>{price.price_list.name}</td>
                                                                        <td>{formatPrice(price.price)}</td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </Table>
                                                    </div>
                                                )}
                                            </Card.Body>
                                        </Card>
                                    </Tab.Pane>

                                    {/* Stok Bilgileri */}
                                    <Tab.Pane eventKey="inventory">
                                        <Card>
                                            <Card.Body>
                                                <Row>
                                                    <Col md={6}>
                                                        <h6>Stok Durumu</h6>
                                                        <div className="mb-3">
                                                            <div className="d-flex align-items-center justify-content-between">
                                                                <span>Mevcut Stok:</span>
                                                                <span className="fw-bold fs-4">{product.stock_quantity}</span>
                                                            </div>
                                                            <div className="mt-2">
                                                                {getStockBadge(product.stock_quantity, product.min_stock_level)}
                                                            </div>
                                                        </div>
                                                        
                                                        <Table size="sm">
                                                            <tbody>
                                                                {product.min_stock_level && (
                                                                    <tr>
                                                                        <td>Minimum Stok:</td>
                                                                        <td>{product.min_stock_level}</td>
                                                                    </tr>
                                                                )}
                                                                {product.max_stock_level && (
                                                                    <tr>
                                                                        <td>Maksimum Stok:</td>
                                                                        <td>{product.max_stock_level}</td>
                                                                    </tr>
                                                                )}
                                                            </tbody>
                                                        </Table>
                                                    </Col>
                                                    <Col md={6}>
                                                        <h6>Stok Ayarları</h6>
                                                        <div className="d-flex flex-column gap-2">
                                                            <div className="d-flex align-items-center">
                                                                <i className={`ri-${product.track_inventory ? 'check' : 'close'}-line me-2 text-${product.track_inventory ? 'success' : 'danger'}`}></i>
                                                                Stok Takibi {product.track_inventory ? 'Aktif' : 'Pasif'}
                                                            </div>
                                                            <div className="d-flex align-items-center">
                                                                <i className={`ri-${product.allow_backorder ? 'check' : 'close'}-line me-2 text-${product.allow_backorder ? 'success' : 'danger'}`}></i>
                                                                Stok Bittiğinde Sipariş {product.allow_backorder ? 'Alınır' : 'Alınmaz'}
                                                            </div>
                                                        </div>
                                                    </Col>
                                                </Row>
                                            </Card.Body>
                                        </Card>
                                    </Tab.Pane>

                                    {/* Varyantlar */}
                                    {product.variants && product.variants.length > 0 && (
                                        <Tab.Pane eventKey="variants">
                                            <Card>
                                                <Card.Body>
                                                    <div className="table-responsive">
                                                        <Table>
                                                            <thead>
                                                                <tr>
                                                                    <th>Varyant Adı</th>
                                                                    <th>SKU</th>
                                                                    <th>Fiyat</th>
                                                                    <th>Stok</th>
                                                                    <th>Durum</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {product.variants.map(variant => (
                                                                    <tr key={variant.id}>
                                                                        <td>{variant.name}</td>
                                                                        <td><code>{variant.sku}</code></td>
                                                                        <td>{formatPrice(variant.price)}</td>
                                                                        <td>{variant.stock_quantity}</td>
                                                                        <td>
                                                                            <Badge bg={variant.is_active ? 'success' : 'danger'}>
                                                                                {variant.is_active ? 'Aktif' : 'Pasif'}
                                                                            </Badge>
                                                                        </td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </Table>
                                                    </div>
                                                </Card.Body>
                                            </Card>
                                        </Tab.Pane>
                                    )}

                                    {/* Özellikler */}
                                    {product.attributes && product.attributes.length > 0 && (
                                        <Tab.Pane eventKey="attributes">
                                            <Card>
                                                <Card.Body>
                                                    <Row>
                                                        {product.attributes.map(attribute => (
                                                            <Col md={6} key={attribute.id} className="mb-3">
                                                                <div className="d-flex justify-content-between align-items-center">
                                                                    <strong>{attribute.name}:</strong>
                                                                    <span>
                                                                        {attribute.pivot.value || 
                                                                         attribute.values?.find(v => v.id === attribute.pivot.attribute_value_id)?.value || 
                                                                         '-'}
                                                                    </span>
                                                                </div>
                                                            </Col>
                                                        ))}
                                                    </Row>
                                                </Card.Body>
                                            </Card>
                                        </Tab.Pane>
                                    )}
                                </Tab.Content>
                            </Tab.Container>
                        </Col>
                    </Row>
                </div>
            </div>
        </Layout>
    );
}