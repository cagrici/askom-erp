import React from 'react';
import Layout from '@/Layouts';
import { Head, Link } from '@inertiajs/react';
import { Card, Table, Badge, Row, Col, Button } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';

interface Product {
    id: number;
    name: string;
    code: string;
    sku: string;
    stock_quantity: number;
}

interface User {
    id: number;
    name: string;
    email: string;
}

interface InventoryMovement {
    id: number;
    movement_type: string;
    quantity: number;
    unit_cost?: number;
    total_cost?: number;
    reference_type?: string;
    reference_id?: number;
    notes?: string;
    created_at: string;
    movement_type_text: string;
    movement_type_color: string;
    formatted_quantity: string;
    creator?: User;
}

interface Props {
    product: Product;
    movements: {
        data: InventoryMovement[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
        from?: number;
        to?: number;
        links?: any[];
    };
}

export default function StockHistory({ product, movements }: Props) {
    const { t } = useTranslation();

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString('tr-TR', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const formatCurrency = (amount?: number) => {
        if (!amount) return '-';
        return `₺${amount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}`;
    };

    const getMovementIcon = (type: string) => {
        switch (type) {
            case 'in':
                return <i className="ri-arrow-down-line text-success"></i>;
            case 'out':
                return <i className="ri-arrow-up-line text-danger"></i>;
            case 'adjustment':
                return <i className="ri-settings-line text-warning"></i>;
            default:
                return <i className="ri-more-line text-secondary"></i>;
        }
    };

    const getReferenceText = (movement: InventoryMovement) => {
        if (!movement.reference_type || !movement.reference_id) {
            return '-';
        }

        const referenceTypes: { [key: string]: string } = {
            'purchase_order': 'Satın Alma Siparişi',
            'sales_order': 'Satış Siparişi',
            'transfer': 'Transfer',
            'adjustment': 'Stok Düzeltme'
        };

        const typeName = referenceTypes[movement.reference_type] || movement.reference_type;
        return `${typeName} #${movement.reference_id}`;
    };

    return (
        <Layout>
            <Head title={`${product.name} - Stok Geçmişi`} />

            <div className="page-content">
                <div className="container-fluid">
                    <Row className="mb-3">
                        <Col>
                            <div className="page-title-box d-flex align-items-center justify-content-between">
                                <div>
                                    <h4 className="mb-0">Stok Geçmişi</h4>
                                    <div className="page-title-right">
                                        <ol className="breadcrumb m-0">
                                            <li className="breadcrumb-item">
                                                <Link href={route('products.index')}>Ürünler</Link>
                                            </li>
                                            <li className="breadcrumb-item">
                                                <Link href={route('products.show', product.id)}>{product.name}</Link>
                                            </li>
                                            <li className="breadcrumb-item active">Stok Geçmişi</li>
                                        </ol>
                                    </div>
                                </div>
                                <div>
                                    <Link 
                                        href={route('products.show', product.id)} 
                                        className="btn btn-secondary me-2"
                                    >
                                        <i className="ri-arrow-left-line me-1"></i>
                                        Ürüne Dön
                                    </Link>
                                    <Link 
                                        href={route('products.edit', product.id)} 
                                        className="btn btn-primary"
                                    >
                                        <i className="ri-pencil-line me-1"></i>
                                        Düzenle
                                    </Link>
                                </div>
                            </div>
                        </Col>
                    </Row>

                    {/* Product Info Card */}
                    <Card className="mb-4">
                        <Card.Body>
                            <Row>
                                <Col md={8}>
                                    <h5 className="card-title mb-3">{product.name}</h5>
                                    <div className="row">
                                        <div className="col-md-4">
                                            <p className="text-muted mb-1">Ürün Kodu</p>
                                            <p className="fw-medium">{product.code}</p>
                                        </div>
                                        <div className="col-md-4">
                                            <p className="text-muted mb-1">SKU</p>
                                            <p className="fw-medium">{product.sku}</p>
                                        </div>
                                        <div className="col-md-4">
                                            <p className="text-muted mb-1">Mevcut Stok</p>
                                            <p className="fw-medium">
                                                <Badge bg="primary" className="fs-6">
                                                    {product.stock_quantity} adet
                                                </Badge>
                                            </p>
                                        </div>
                                    </div>
                                </Col>
                            </Row>
                        </Card.Body>
                    </Card>

                    {/* Stock History Table */}
                    <Card>
                        <Card.Header>
                            <h5 className="card-title mb-0">
                                <i className="ri-history-line me-2"></i>
                                Stok Hareketleri
                                {movements.total > 0 && (
                                    <Badge bg="secondary" className="ms-2">{movements.total}</Badge>
                                )}
                            </h5>
                        </Card.Header>
                        <Card.Body>
                            {movements.data.length > 0 ? (
                                <>
                                    <div className="table-responsive">
                                        <Table hover className="table-centered align-middle">
                                            <thead className="table-light">
                                                <tr>
                                                    <th style={{ width: '50px' }}>Tip</th>
                                                    <th>Hareket Türü</th>
                                                    <th className="text-end">Miktar</th>
                                                    <th className="text-end">Birim Fiyat</th>
                                                    <th className="text-end">Toplam Tutar</th>
                                                    <th>Referans</th>
                                                    <th>Kullanıcı</th>
                                                    <th>Tarih</th>
                                                    <th>Notlar</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {movements.data.map(movement => (
                                                    <tr key={movement.id}>
                                                        <td className="text-center">
                                                            {getMovementIcon(movement.movement_type)}
                                                        </td>
                                                        <td>
                                                            <Badge bg={movement.movement_type_color}>
                                                                {movement.movement_type_text}
                                                            </Badge>
                                                        </td>
                                                        <td className="text-end fw-medium">
                                                            {movement.formatted_quantity}
                                                        </td>
                                                        <td className="text-end">
                                                            {formatCurrency(movement.unit_cost)}
                                                        </td>
                                                        <td className="text-end">
                                                            {formatCurrency(movement.total_cost)}
                                                        </td>
                                                        <td>
                                                            <small className="text-muted">
                                                                {getReferenceText(movement)}
                                                            </small>
                                                        </td>
                                                        <td>
                                                            {movement.creator ? (
                                                                <div>
                                                                    <div className="fw-medium">{movement.creator.name}</div>
                                                                    <small className="text-muted">{movement.creator.email}</small>
                                                                </div>
                                                            ) : (
                                                                <span className="text-muted">-</span>
                                                            )}
                                                        </td>
                                                        <td>
                                                            <small className="text-muted">
                                                                {formatDate(movement.created_at)}
                                                            </small>
                                                        </td>
                                                        <td>
                                                            {movement.notes ? (
                                                                <small className="text-muted">{movement.notes}</small>
                                                            ) : (
                                                                <span className="text-muted">-</span>
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </Table>
                                    </div>

                                    {/* Pagination */}
                                    {movements.last_page && movements.last_page > 1 && (
                                        <div className="d-flex justify-content-between align-items-center mt-4">
                                            <div>
                                                Toplam {movements.total || 0} hareketten {movements.from || 0}-{movements.to || 0} arası gösteriliyor
                                            </div>
                                            <nav>
                                                <ul className="pagination mb-0">
                                                    {movements.links && movements.links.map((link: any, index: number) => (
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
                                    <i className="ri-history-line fs-1 text-muted"></i>
                                    <p className="text-muted mt-3 mb-0">Bu ürün için henüz stok hareketi bulunmuyor.</p>
                                    <small className="text-muted">
                                        Stok hareketleri ürün giriş/çıkışları ve düzeltmeler burada görüntülenecek.
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