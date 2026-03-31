import React from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
import { Card, Row, Col, Badge, Table } from 'react-bootstrap';
import Layout from '../../../Layouts';

interface InventoryMovement {
    id: number;
    movement_number: string;
    movement_type: string;
    direction: string;
    quantity: number;
    unit: string;
    base_quantity: number;
    lot_number?: string;
    batch_code?: string;
    serial_number?: string;
    unit_cost: number;
    total_cost: number;
    cost_currency: string;
    movement_date: string;
    effective_date?: string;
    expiry_date?: string;
    reference_type?: string;
    reference_number?: string;
    reference_id?: number;
    external_reference?: string;
    document_type?: string;
    document_number?: string;
    document_date?: string;
    partner_type?: string;
    partner_name?: string;
    partner_id?: number;
    condition_before?: string;
    condition_after?: string;
    quality_check_done?: boolean;
    quality_results?: any;
    package_type?: string;
    package_id?: string;
    package_weight?: number;
    container_number?: string;
    reason_code?: string;
    reason_description?: string;
    notes?: string;
    requires_approval?: boolean;
    approval_status?: string;
    approved_by?: number;
    approved_at?: string;
    approval_notes?: string;
    stock_before: number;
    stock_after: number;
    is_system_generated?: boolean;
    source_system?: string;
    is_reversed?: boolean;
    reversed_by_movement_id?: number;
    scanned_barcode?: string;
    scan_timestamp?: string;
    scanner_device?: string;
    temperature_at_movement?: number;
    temperature_compliant?: boolean;
    custom_attributes?: any;
    status: string;
    error_message?: string;
    created_at: string;
    updated_at: string;
    inventory_item?: {
        id: number;
        name: string;
        code: string;
        description?: string;
    };
    warehouse?: {
        id: number;
        name: string;
        code: string;
    };
    warehouse_location?: {
        id: number;
        name: string;
        code: string;
    };
    from_warehouse?: {
        id: number;
        name: string;
        code: string;
    };
    to_warehouse?: {
        id: number;
        name: string;
        code: string;
    };
    from_location?: {
        id: number;
        name: string;
        code: string;
    };
    to_location?: {
        id: number;
        name: string;
        code: string;
    };
    creator?: {
        id: number;
        name: string;
    };
    updater?: {
        id: number;
        name: string;
    };
    approver?: {
        id: number;
        name: string;
    };
    movement_type_text: string;
    direction_text: string;
    direction_color: string;
    status_color: string;
    formatted_quantity: string;
}

interface PageProps {
    movement: InventoryMovement;
}

export default function Show() {
    const { movement } = usePage<PageProps>().props;

    const formatCurrency = (amount: number, currency: string = 'TRY') => {
        return new Intl.NumberFormat('tr-TR', {
            style: 'currency',
            currency: currency,
        }).format(amount);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('tr-TR');
    };

    const formatDateTime = (dateString: string) => {
        return new Date(dateString).toLocaleString('tr-TR');
    };

    const getDirectionIcon = (direction: string) => {
        switch (direction) {
            case 'in':
                return '↗️';
            case 'out':
                return '↙️';
            case 'transfer':
                return '↔️';
            default:
                return '•';
        }
    };

    return (
        <Layout title={`Hareket Detayı - ${movement.movement_number}`}>
            <Head title={`Hareket Detayı - ${movement.movement_number}`} />
            <div className="page-content">
            <div className="container-fluid">
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <div>
                        <h1 className="h3 mb-0">Hareket Detayı</h1>
                        <p className="text-muted mb-0">{movement.movement_number}</p>
                    </div>
                    <div>
                        <Link
                            href={route('accounting.movements.index')}
                            className="btn btn-outline-secondary"
                        >
                            <i className="fas fa-arrow-left"></i> Geri Dön
                        </Link>
                    </div>
                </div>

                <Row>
                    <Col lg={8}>
                        {/* Basic Information */}
                        <Card className="mb-4">
                            <Card.Header>
                                <h6 className="mb-0">Temel Bilgiler</h6>
                            </Card.Header>
                            <Card.Body>
                                <Row>
                                    <Col md={6}>
                                        <Table borderless>
                                            <tbody>
                                                <tr>
                                                    <td className="fw-bold">Hareket No:</td>
                                                    <td>{movement.movement_number}</td>
                                                </tr>
                                                <tr>
                                                    <td className="fw-bold">Hareket Tipi:</td>
                                                    <td>{movement.movement_type_text}</td>
                                                </tr>
                                                <tr>
                                                    <td className="fw-bold">Yön:</td>
                                                    <td>
                                                        <Badge bg={movement.direction_color}>
                                                            {getDirectionIcon(movement.direction)} {movement.direction_text}
                                                        </Badge>
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td className="fw-bold">Durum:</td>
                                                    <td>
                                                        <Badge bg={movement.status_color}>
                                                            {movement.status}
                                                        </Badge>
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td className="fw-bold">Hareket Tarihi:</td>
                                                    <td>{formatDate(movement.movement_date)}</td>
                                                </tr>
                                                {movement.effective_date && (
                                                    <tr>
                                                        <td className="fw-bold">Etkili Tarih:</td>
                                                        <td>{formatDate(movement.effective_date)}</td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </Table>
                                    </Col>
                                    <Col md={6}>
                                        <Table borderless>
                                            <tbody>
                                                <tr>
                                                    <td className="fw-bold">Ürün:</td>
                                                    <td>
                                                        {movement.inventory_item && (
                                                            <div>
                                                                <div className="fw-bold">{movement.inventory_item.name}</div>
                                                                <small className="text-muted">{movement.inventory_item.code}</small>
                                                            </div>
                                                        )}
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td className="fw-bold">Depo:</td>
                                                    <td>
                                                        {movement.warehouse && (
                                                            <div>
                                                                <div>{movement.warehouse.name}</div>
                                                                <small className="text-muted">{movement.warehouse.code}</small>
                                                            </div>
                                                        )}
                                                    </td>
                                                </tr>
                                                {movement.warehouse_location && (
                                                    <tr>
                                                        <td className="fw-bold">Lokasyon:</td>
                                                        <td>
                                                            <div>{movement.warehouse_location.name}</div>
                                                            <small className="text-muted">{movement.warehouse_location.code}</small>
                                                        </td>
                                                    </tr>
                                                )}
                                                <tr>
                                                    <td className="fw-bold">Miktar:</td>
                                                    <td className="fw-bold text-primary">{movement.formatted_quantity}</td>
                                                </tr>
                                                <tr>
                                                    <td className="fw-bold">Toplam Tutar:</td>
                                                    <td className="fw-bold text-success">
                                                        {formatCurrency(movement.total_cost, movement.cost_currency)}
                                                    </td>
                                                </tr>
                                            </tbody>
                                        </Table>
                                    </Col>
                                </Row>
                            </Card.Body>
                        </Card>

                        {/* Transfer Information */}
                        {movement.direction === 'transfer' && (movement.from_warehouse || movement.to_warehouse) && (
                            <Card className="mb-4">
                                <Card.Header>
                                    <h6 className="mb-0">Transfer Bilgileri</h6>
                                </Card.Header>
                                <Card.Body>
                                    <Row>
                                        <Col md={6}>
                                            <h6>Kaynak</h6>
                                            {movement.from_warehouse && (
                                                <div className="mb-2">
                                                    <strong>Depo:</strong> {movement.from_warehouse.name}
                                                    <br />
                                                    <small className="text-muted">{movement.from_warehouse.code}</small>
                                                </div>
                                            )}
                                            {movement.from_location && (
                                                <div>
                                                    <strong>Lokasyon:</strong> {movement.from_location.name}
                                                    <br />
                                                    <small className="text-muted">{movement.from_location.code}</small>
                                                </div>
                                            )}
                                        </Col>
                                        <Col md={6}>
                                            <h6>Hedef</h6>
                                            {movement.to_warehouse && (
                                                <div className="mb-2">
                                                    <strong>Depo:</strong> {movement.to_warehouse.name}
                                                    <br />
                                                    <small className="text-muted">{movement.to_warehouse.code}</small>
                                                </div>
                                            )}
                                            {movement.to_location && (
                                                <div>
                                                    <strong>Lokasyon:</strong> {movement.to_location.name}
                                                    <br />
                                                    <small className="text-muted">{movement.to_location.code}</small>
                                                </div>
                                            )}
                                        </Col>
                                    </Row>
                                </Card.Body>
                            </Card>
                        )}

                        {/* Document Information */}
                        {(movement.document_number || movement.reference_number) && (
                            <Card className="mb-4">
                                <Card.Header>
                                    <h6 className="mb-0">Belge Bilgileri</h6>
                                </Card.Header>
                                <Card.Body>
                                    <Row>
                                        <Col md={6}>
                                            {movement.document_type && (
                                                <div className="mb-2">
                                                    <strong>Belge Tipi:</strong> {movement.document_type}
                                                </div>
                                            )}
                                            {movement.document_number && (
                                                <div className="mb-2">
                                                    <strong>Belge No:</strong> {movement.document_number}
                                                </div>
                                            )}
                                            {movement.document_date && (
                                                <div className="mb-2">
                                                    <strong>Belge Tarihi:</strong> {formatDate(movement.document_date)}
                                                </div>
                                            )}
                                        </Col>
                                        <Col md={6}>
                                            {movement.reference_number && (
                                                <div className="mb-2">
                                                    <strong>Referans No:</strong> {movement.reference_number}
                                                </div>
                                            )}
                                            {movement.external_reference && (
                                                <div className="mb-2">
                                                    <strong>Dış Referans:</strong> {movement.external_reference}
                                                </div>
                                            )}
                                            {movement.partner_name && (
                                                <div className="mb-2">
                                                    <strong>İş Ortağı:</strong> {movement.partner_name}
                                                </div>
                                            )}
                                        </Col>
                                    </Row>
                                </Card.Body>
                            </Card>
                        )}

                        {/* Notes */}
                        {movement.notes && (
                            <Card className="mb-4">
                                <Card.Header>
                                    <h6 className="mb-0">Notlar</h6>
                                </Card.Header>
                                <Card.Body>
                                    <p className="mb-0">{movement.notes}</p>
                                </Card.Body>
                            </Card>
                        )}
                    </Col>

                    <Col lg={4}>
                        {/* Status Card */}
                        <Card className="mb-4">
                            <Card.Header>
                                <h6 className="mb-0">Durum Bilgileri</h6>
                            </Card.Header>
                            <Card.Body>
                                <div className="mb-3">
                                    <Badge bg={movement.status_color} className="fs-6">
                                        {movement.status}
                                    </Badge>
                                </div>

                                <div className="mb-2">
                                    <strong>Önceki Stok:</strong> {movement.stock_before} {movement.unit}
                                </div>
                                <div className="mb-2">
                                    <strong>Sonraki Stok:</strong> {movement.stock_after} {movement.unit}
                                </div>

                                {movement.requires_approval && (
                                    <div className="mt-3">
                                        <div className="mb-2">
                                            <strong>Onay Durumu:</strong> {movement.approval_status || 'Bekliyor'}
                                        </div>
                                        {movement.approver && (
                                            <div className="mb-2">
                                                <strong>Onaylayan:</strong> {movement.approver.name}
                                            </div>
                                        )}
                                        {movement.approved_at && (
                                            <div className="mb-2">
                                                <strong>Onay Tarihi:</strong> {formatDateTime(movement.approved_at)}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </Card.Body>
                        </Card>

                        {/* Quality Information */}
                        {movement.quality_check_done && (
                            <Card className="mb-4">
                                <Card.Header>
                                    <h6 className="mb-0">Kalite Kontrol</h6>
                                </Card.Header>
                                <Card.Body>
                                    <div className="mb-2">
                                        <Badge bg="success">Kalite kontrolü yapıldı</Badge>
                                    </div>
                                    {movement.condition_before && (
                                        <div className="mb-2">
                                            <strong>Önceki Durum:</strong> {movement.condition_before}
                                        </div>
                                    )}
                                    {movement.condition_after && (
                                        <div className="mb-2">
                                            <strong>Sonraki Durum:</strong> {movement.condition_after}
                                        </div>
                                    )}
                                </Card.Body>
                            </Card>
                        )}

                        {/* System Information */}
                        <Card>
                            <Card.Header>
                                <h6 className="mb-0">Sistem Bilgileri</h6>
                            </Card.Header>
                            <Card.Body>
                                {movement.creator && (
                                    <div className="mb-2">
                                        <strong>Oluşturan:</strong> {movement.creator.name}
                                    </div>
                                )}
                                <div className="mb-2">
                                    <strong>Oluşturma Tarihi:</strong> {formatDateTime(movement.created_at)}
                                </div>
                                <div className="mb-2">
                                    <strong>Güncelleme Tarihi:</strong> {formatDateTime(movement.updated_at)}
                                </div>
                                {movement.is_system_generated && (
                                    <div className="mb-2">
                                        <Badge bg="info">Sistem tarafından oluşturuldu</Badge>
                                    </div>
                                )}
                                {movement.source_system && (
                                    <div className="mb-2">
                                        <strong>Kaynak Sistem:</strong> {movement.source_system}
                                    </div>
                                )}
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>
            </div>
            </div>
        </Layout>
    );
}
