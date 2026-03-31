import React from 'react';
import Layout from '@/Layouts';
import { Head, Link } from '@inertiajs/react';
import { Card, Row, Col, Badge, Table, Button, Nav, Tab } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';

interface Product {
    id: number;
    name: string;
    sku: string;
    sale_price?: number;
}

interface VariantAttributeValue {
    id: number;
    value: string;
    color_hex?: string;
    attribute: {
        id: number;
        name: string;
        type: string;
    };
}

interface Variant {
    id: number;
    name: string;
    sku: string;
    price?: number;
    compare_price?: number;
    cost_price?: number;
    stock_quantity: number;
    weight?: number;
    dimensions?: {
        length?: number;
        width?: number;
        height?: number;
    };
    is_active: boolean;
    product: Product;
    attribute_values: VariantAttributeValue[];
    created_at: string;
    updated_at: string;
}

interface Props {
    variant: Variant;
}

export default function VariantShow({ variant }: Props) {
    const { t } = useTranslation();

    const formatPrice = (price?: number) => {
        return price ? `₺${price.toLocaleString()}` : '-';
    };

    const getStockBadge = (quantity: number) => {
        if (quantity <= 0) {
            return <Badge bg="danger">Stokta Yok</Badge>;
        } else if (quantity <= 10) {
            return <Badge bg="warning">Düşük Stok</Badge>;
        } else {
            return <Badge bg="success">Stokta Var</Badge>;
        }
    };

    const calculateMargin = () => {
        if (!variant.price || !variant.cost_price) return null;
        return (((variant.price - variant.cost_price) / variant.price) * 100).toFixed(2);
    };

    const calculateMarkup = () => {
        if (!variant.price || !variant.cost_price) return null;
        return (((variant.price - variant.cost_price) / variant.cost_price) * 100).toFixed(2);
    };

    return (
        <>
            <Head title={variant.name} />
            <Layout>
                <div className="page-content">
                    <div className="container-fluid">
                        <Row className="mb-3">
                            <Col>
                                <div className="page-title-box d-flex align-items-center justify-content-between">
                                    <div>
                                        <h4 className="mb-0">{variant.name}</h4>
                                        <p className="text-muted mb-0">
                                            {variant.product.name} varyantı
                                        </p>
                                    </div>
                                    <div className="d-flex gap-2">
                                        <Link href={route('product-variants.edit', variant.id)} className="btn btn-primary">
                                            <i className="ri-pencil-line me-1"></i>
                                            Düzenle
                                        </Link>
                                        <Link href={route('product-variants.index')} className="btn btn-secondary">
                                            <i className="ri-arrow-left-line me-1"></i>
                                            Geri Dön
                                        </Link>
                                    </div>
                                </div>
                            </Col>
                        </Row>

                        <Row>
                            {/* Sol Taraf - Özet Kartları */}
                            <Col xl={4}>
                                {/* Temel Bilgiler */}
                                <Card>
                                    <Card.Header>
                                        <h5 className="card-title mb-0">Temel Bilgiler</h5>
                                    </Card.Header>
                                    <Card.Body>
                                        <Table size="sm" className="mb-0">
                                            <tbody>
                                                <tr>
                                                    <td><strong>Varyant ID:</strong></td>
                                                    <td>{variant.id}</td>
                                                </tr>
                                                <tr>
                                                    <td><strong>SKU:</strong></td>
                                                    <td><code>{variant.sku}</code></td>
                                                </tr>
                                                <tr>
                                                    <td><strong>Ana Ürün:</strong></td>
                                                    <td>
                                                        <Link 
                                                            href={route('products.show', variant.product.id)}
                                                            className="text-decoration-none"
                                                        >
                                                            {variant.product.name}
                                                        </Link>
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td><strong>Ana Ürün SKU:</strong></td>
                                                    <td><code>{variant.product.sku}</code></td>
                                                </tr>
                                                <tr>
                                                    <td><strong>Durum:</strong></td>
                                                    <td>
                                                        <Badge bg={variant.is_active ? 'success' : 'danger'}>
                                                            {variant.is_active ? 'Aktif' : 'Pasif'}
                                                        </Badge>
                                                    </td>
                                                </tr>
                                            </tbody>
                                        </Table>
                                    </Card.Body>
                                </Card>

                                {/* Stok Durumu */}
                                <Card>
                                    <Card.Header>
                                        <h5 className="card-title mb-0">Stok Durumu</h5>
                                    </Card.Header>
                                    <Card.Body>
                                        <div className="text-center mb-3">
                                            <h2 className="mb-1">{variant.stock_quantity}</h2>
                                            <p className="text-muted mb-2">Mevcut Stok</p>
                                            {getStockBadge(variant.stock_quantity)}
                                        </div>
                                    </Card.Body>
                                </Card>

                                {/* Fiyat Özeti */}
                                <Card>
                                    <Card.Header>
                                        <h5 className="card-title mb-0">Fiyat Özeti</h5>
                                    </Card.Header>
                                    <Card.Body>
                                        <Table size="sm" className="mb-0">
                                            <tbody>
                                                {variant.cost_price && (
                                                    <tr>
                                                        <td><strong>Maliyet:</strong></td>
                                                        <td>{formatPrice(variant.cost_price)}</td>
                                                    </tr>
                                                )}
                                                <tr>
                                                    <td><strong>Satış Fiyatı:</strong></td>
                                                    <td className="text-primary fw-bold">
                                                        {formatPrice(variant.price)}
                                                    </td>
                                                </tr>
                                                {variant.compare_price && (
                                                    <tr>
                                                        <td><strong>Karşılaştırma:</strong></td>
                                                        <td className="text-muted">
                                                            <del>{formatPrice(variant.compare_price)}</del>
                                                        </td>
                                                    </tr>
                                                )}
                                                {calculateMargin() && (
                                                    <tr>
                                                        <td><strong>Kar Marjı:</strong></td>
                                                        <td className="text-success">
                                                            %{calculateMargin()}
                                                        </td>
                                                    </tr>
                                                )}
                                                {calculateMarkup() && (
                                                    <tr>
                                                        <td><strong>Markup:</strong></td>
                                                        <td className="text-info">
                                                            %{calculateMarkup()}
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </Table>
                                    </Card.Body>
                                </Card>
                            </Col>

                            {/* Sağ Taraf - Detaylı Bilgiler */}
                            <Col xl={8}>
                                <Tab.Container defaultActiveKey="attributes">
                                    <Nav variant="tabs" className="mb-3">
                                        <Nav.Item>
                                            <Nav.Link eventKey="attributes">
                                                <i className="ri-palette-line me-1"></i>
                                                Özellikler
                                            </Nav.Link>
                                        </Nav.Item>
                                        <Nav.Item>
                                            <Nav.Link eventKey="pricing">
                                                <i className="ri-money-dollar-circle-line me-1"></i>
                                                Detaylı Fiyatlandırma
                                            </Nav.Link>
                                        </Nav.Item>
                                        <Nav.Item>
                                            <Nav.Link eventKey="physical">
                                                <i className="ri-ruler-line me-1"></i>
                                                Fiziksel Özellikler
                                            </Nav.Link>
                                        </Nav.Item>
                                        <Nav.Item>
                                            <Nav.Link eventKey="history">
                                                <i className="ri-history-line me-1"></i>
                                                Geçmiş
                                            </Nav.Link>
                                        </Nav.Item>
                                    </Nav>

                                    <Tab.Content>
                                        {/* Özellikler */}
                                        <Tab.Pane eventKey="attributes">
                                            <Card>
                                                <Card.Body>
                                                    {variant.attribute_values.length > 0 ? (
                                                        <Row>
                                                            {variant.attribute_values.map(av => (
                                                                <Col md={6} key={av.id} className="mb-3">
                                                                    <div className="border rounded p-3">
                                                                        <h6 className="mb-2">{av.attribute.name}</h6>
                                                                        <div className="d-flex align-items-center">
                                                                            {av.color_hex && (
                                                                                <div 
                                                                                    className="rounded-circle me-3"
                                                                                    style={{
                                                                                        width: '24px',
                                                                                        height: '24px',
                                                                                        backgroundColor: av.color_hex,
                                                                                        border: '2px solid #dee2e6'
                                                                                    }}
                                                                                />
                                                                            )}
                                                                            <div>
                                                                                <Badge bg="primary" className="fs-6">
                                                                                    {av.value}
                                                                                </Badge>
                                                                                <div className="small text-muted mt-1">
                                                                                    {av.attribute.type === 'color' ? 'Renk' :
                                                                                     av.attribute.type === 'size' ? 'Boyut' :
                                                                                     av.attribute.type === 'material' ? 'Malzeme' :
                                                                                     'Özellik'}
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </Col>
                                                            ))}
                                                        </Row>
                                                    ) : (
                                                        <div className="text-center py-4">
                                                            <i className="ri-palette-line fs-1 text-muted"></i>
                                                            <p className="text-muted mt-2">Bu varyanta özel özellik tanımlanmamış.</p>
                                                        </div>
                                                    )}
                                                </Card.Body>
                                            </Card>
                                        </Tab.Pane>

                                        {/* Detaylı Fiyatlandırma */}
                                        <Tab.Pane eventKey="pricing">
                                            <Card>
                                                <Card.Body>
                                                    <Row>
                                                        <Col md={6}>
                                                            <h6>Fiyat Bilgileri</h6>
                                                            <Table>
                                                                <tbody>
                                                                    {variant.cost_price && (
                                                                        <tr>
                                                                            <td><strong>Maliyet Fiyatı:</strong></td>
                                                                            <td>{formatPrice(variant.cost_price)}</td>
                                                                        </tr>
                                                                    )}
                                                                    <tr>
                                                                        <td><strong>Satış Fiyatı:</strong></td>
                                                                        <td className="text-primary fw-bold fs-5">
                                                                            {formatPrice(variant.price)}
                                                                        </td>
                                                                    </tr>
                                                                    {variant.compare_price && (
                                                                        <tr>
                                                                            <td><strong>Karşılaştırma Fiyatı:</strong></td>
                                                                            <td>{formatPrice(variant.compare_price)}</td>
                                                                        </tr>
                                                                    )}
                                                                    {variant.product.sale_price && (
                                                                        <tr>
                                                                            <td><strong>Ana Ürün Fiyatı:</strong></td>
                                                                            <td className="text-muted">
                                                                                {formatPrice(variant.product.sale_price)}
                                                                            </td>
                                                                        </tr>
                                                                    )}
                                                                </tbody>
                                                            </Table>
                                                        </Col>
                                                        {variant.cost_price && variant.price && (
                                                            <Col md={6}>
                                                                <h6>Kar Analizi</h6>
                                                                <Table>
                                                                    <tbody>
                                                                        <tr>
                                                                            <td><strong>Brüt Kar:</strong></td>
                                                                            <td className="text-success">
                                                                                {formatPrice(variant.price - variant.cost_price)}
                                                                            </td>
                                                                        </tr>
                                                                        <tr>
                                                                            <td><strong>Kar Marjı:</strong></td>
                                                                            <td className="text-success">
                                                                                %{calculateMargin()}
                                                                            </td>
                                                                        </tr>
                                                                        <tr>
                                                                            <td><strong>Markup:</strong></td>
                                                                            <td className="text-info">
                                                                                %{calculateMarkup()}
                                                                            </td>
                                                                        </tr>
                                                                        {variant.compare_price && variant.price < variant.compare_price && (
                                                                            <tr>
                                                                                <td><strong>İndirim:</strong></td>
                                                                                <td className="text-danger">
                                                                                    {formatPrice(variant.compare_price - variant.price)}
                                                                                    ({(((variant.compare_price - variant.price) / variant.compare_price) * 100).toFixed(1)}%)
                                                                                </td>
                                                                            </tr>
                                                                        )}
                                                                    </tbody>
                                                                </Table>
                                                            </Col>
                                                        )}
                                                    </Row>
                                                </Card.Body>
                                            </Card>
                                        </Tab.Pane>

                                        {/* Fiziksel Özellikler */}
                                        <Tab.Pane eventKey="physical">
                                            <Card>
                                                <Card.Body>
                                                    <Row>
                                                        <Col md={6}>
                                                            <h6>Boyutlar ve Ağırlık</h6>
                                                            <Table>
                                                                <tbody>
                                                                    {variant.weight && (
                                                                        <tr>
                                                                            <td><strong>Ağırlık:</strong></td>
                                                                            <td>{variant.weight} kg</td>
                                                                        </tr>
                                                                    )}
                                                                    {variant.dimensions?.length && (
                                                                        <tr>
                                                                            <td><strong>Uzunluk:</strong></td>
                                                                            <td>{variant.dimensions.length} cm</td>
                                                                        </tr>
                                                                    )}
                                                                    {variant.dimensions?.width && (
                                                                        <tr>
                                                                            <td><strong>Genişlik:</strong></td>
                                                                            <td>{variant.dimensions.width} cm</td>
                                                                        </tr>
                                                                    )}
                                                                    {variant.dimensions?.height && (
                                                                        <tr>
                                                                            <td><strong>Yükseklik:</strong></td>
                                                                            <td>{variant.dimensions.height} cm</td>
                                                                        </tr>
                                                                    )}
                                                                    {variant.dimensions?.length && variant.dimensions?.width && variant.dimensions?.height && (
                                                                        <tr>
                                                                            <td><strong>Hacim:</strong></td>
                                                                            <td>
                                                                                {(variant.dimensions.length * variant.dimensions.width * variant.dimensions.height / 1000000).toFixed(3)} m³
                                                                            </td>
                                                                        </tr>
                                                                    )}
                                                                </tbody>
                                                            </Table>
                                                        </Col>
                                                        <Col md={6}>
                                                            <h6>Stok Bilgileri</h6>
                                                            <Table>
                                                                <tbody>
                                                                    <tr>
                                                                        <td><strong>Mevcut Stok:</strong></td>
                                                                        <td>
                                                                            <span className="fw-bold fs-5">{variant.stock_quantity}</span>
                                                                            <div className="mt-1">
                                                                                {getStockBadge(variant.stock_quantity)}
                                                                            </div>
                                                                        </td>
                                                                    </tr>
                                                                </tbody>
                                                            </Table>
                                                        </Col>
                                                    </Row>

                                                    {(!variant.weight && !variant.dimensions?.length && !variant.dimensions?.width && !variant.dimensions?.height) && (
                                                        <div className="text-center py-4">
                                                            <i className="ri-ruler-line fs-1 text-muted"></i>
                                                            <p className="text-muted mt-2">Fiziksel özellik bilgisi bulunmuyor.</p>
                                                        </div>
                                                    )}
                                                </Card.Body>
                                            </Card>
                                        </Tab.Pane>

                                        {/* Geçmiş */}
                                        <Tab.Pane eventKey="history">
                                            <Card>
                                                <Card.Body>
                                                    <h6>Varyant Geçmişi</h6>
                                                    <Table>
                                                        <tbody>
                                                            <tr>
                                                                <td><strong>Oluşturma Tarihi:</strong></td>
                                                                <td>{new Date(variant.created_at).toLocaleString('tr-TR')}</td>
                                                            </tr>
                                                            <tr>
                                                                <td><strong>Son Güncelleme:</strong></td>
                                                                <td>{new Date(variant.updated_at).toLocaleString('tr-TR')}</td>
                                                            </tr>
                                                        </tbody>
                                                    </Table>

                                                    <div className="mt-4">
                                                        <h6>Hızlı İşlemler</h6>
                                                        <div className="d-flex gap-2">
                                                            <Link 
                                                                href={route('product-variants.edit', variant.id)} 
                                                                className="btn btn-primary btn-sm"
                                                            >
                                                                <i className="ri-pencil-line me-1"></i>
                                                                Düzenle
                                                            </Link>
                                                            <Link 
                                                                href={route('products.show', variant.product.id)} 
                                                                className="btn btn-outline-info btn-sm"
                                                            >
                                                                <i className="ri-eye-line me-1"></i>
                                                                Ana Ürünü Görüntüle
                                                            </Link>
                                                        </div>
                                                    </div>
                                                </Card.Body>
                                            </Card>
                                        </Tab.Pane>
                                    </Tab.Content>
                                </Tab.Container>
                            </Col>
                        </Row>
                    </div>
                </div>
            </Layout>
        </>
    );
}