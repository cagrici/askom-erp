import React, { useState } from 'react';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { Card, Table, Button, Row, Col, Badge, Modal, Form, Alert, ProgressBar } from 'react-bootstrap';
import Layout from '@/Layouts';

interface Customer {
    id: number;
    name: string;
    title?: string;
    phone?: string;
    email?: string;
    account_code?: string;
    tax_office?: string;
    tax_number?: string;
    address?: string;
    city?: string;
    district?: string;
    postal_code?: string;
    country?: string;
}

interface SalesOrder {
    id: number;
    order_number: string;
    order_date: string;
    customer?: Customer;
    salesperson?: { id: number; name: string };
}

interface Vehicle {
    id: number;
    plate_number: string;
    make?: string;
    model?: string;
    year?: number;
    color?: string;
    vehicle_type?: string;
    fuel_type?: string;
    capacity?: string;
    mileage?: number;
    status?: string;
    insurance_expiry_date?: string;
    traffic_insurance_expiry?: string;
    inspection_date?: string;
    notes?: string;
}

interface User {
    id: number;
    name: string;
}

interface Driver extends User {
    phone?: string;
    mobile_phone?: string;
    license_number?: string;
    license_type?: string;
    license_expiry_date?: string;
    is_active_driver?: boolean;
    driver_notes?: string;
}

interface Product {
    id: number;
    name: string;
    code: string;
    barcode?: string;
}

interface ShippingOrderItem {
    id: number;
    product_id: number;
    product?: Product;
    sales_order_item?: {
        id: number;
        quantity: number;
    };
    ordered_quantity: number;
    shipping_quantity: number;
    picked_quantity: number;
    status: string;
    status_label: string;
    corridor?: string;
    shelf?: string;
    bin_location?: string;
}

interface PickingTask {
    id: number;
    task_number: string;
    assigned_to?: User;
    assigned_by?: User;
    status: string;
    status_label: string;
    started_at?: string;
    completed_at?: string;
    total_items: number;
    picked_items: number;
}

interface ShippingOrder {
    id: number;
    shipping_number: string;
    sales_order_id: number;
    sales_order?: SalesOrder;
    created_by?: User;
    vehicle_id?: number;
    vehicle?: Vehicle;
    driver_id?: number;
    driver?: Driver;
    cancelled_by?: User;
    status: string;
    status_label: string;
    priority: string;
    priority_label: string;
    requested_ship_date?: string;
    shipped_at?: string;
    delivered_at?: string;
    cancelled_at?: string;
    cancellation_reason?: string;
    total_items: number;
    total_quantity: number;
    total_weight?: number;
    total_volume?: number;
    logo_dispatch_id?: number;
    logo_dispatch_number?: string;
    notes?: string;
    shipping_notes?: string;
    shipping_address?: any;
    created_at: string;
    items?: ShippingOrderItem[];
    picking_tasks?: PickingTask[];
}

interface Props {
    shippingOrder: ShippingOrder;
    warehouseWorkers: User[];
    canAssignPicking: boolean;
    canShip: boolean;
    canCancel: boolean;
    canEdit: boolean;
}

const getStatusBadgeVariant = (status: string): string => {
    const variants: Record<string, string> = {
        pending: 'warning',
        picking_assigned: 'info',
        picking: 'primary',
        ready_to_ship: 'success',
        shipped: 'secondary',
        delivered: 'dark',
        cancelled: 'danger',
    };
    return variants[status] || 'secondary';
};

const getPriorityBadgeVariant = (priority: string): string => {
    const variants: Record<string, string> = {
        urgent: 'danger',
        high: 'warning',
        normal: 'primary',
        low: 'secondary',
    };
    return variants[priority] || 'secondary';
};

const getItemStatusBadgeVariant = (status: string): string => {
    const variants: Record<string, string> = {
        pending: 'secondary',
        picking: 'info',
        picked: 'success',
        shipped: 'dark',
        cancelled: 'danger',
    };
    return variants[status] || 'secondary';
};

export default function Show({
    shippingOrder,
    warehouseWorkers,
    canAssignPicking,
    canShip,
    canCancel,
    canEdit,
}: Props) {
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [showShipModal, setShowShipModal] = useState(false);
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [showVehicleModal, setShowVehicleModal] = useState(false);
    const [showDriverModal, setShowDriverModal] = useState(false);

    const assignForm = useForm({
        assigned_to_id: '',
        notes: '',
    });

    const shipForm = useForm({
        vehicle_id: shippingOrder.vehicle_id?.toString() || '',
        driver_id: shippingOrder.driver_id?.toString() || '',
        shipping_notes: '',
    });

    const cancelForm = useForm({
        cancellation_reason: '',
    });

    const handleAssignPicking = () => {
        assignForm.post(route('warehouse.shipping-orders.assign-picking', shippingOrder.id), {
            onSuccess: () => {
                setShowAssignModal(false);
                assignForm.reset();
            },
        });
    };

    const handleShip = () => {
        shipForm.post(route('warehouse.shipping-orders.ship', shippingOrder.id), {
            onSuccess: () => {
                setShowShipModal(false);
                shipForm.reset();
            },
        });
    };

    const handleCancel = () => {
        cancelForm.post(route('warehouse.shipping-orders.cancel', shippingOrder.id), {
            onSuccess: () => {
                setShowCancelModal(false);
                cancelForm.reset();
            },
        });
    };

    const handleMarkDelivered = () => {
        if (confirm('Sevk teslim edildi olarak isaretlenecek. Emin misiniz?')) {
            router.post(route('warehouse.shipping-orders.mark-delivered', shippingOrder.id));
        }
    };

    const formatDate = (dateString?: string) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString('tr-TR');
    };

    const formatDateTime = (dateString?: string) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleString('tr-TR');
    };

    const pickingProgress = shippingOrder.items?.length
        ? Math.round((shippingOrder.items.filter(i => i.status === 'picked').length / shippingOrder.items.length) * 100)
        : 0;

    return (
        <Layout>
            <Head title={`Sevk Emri - ${shippingOrder.shipping_number}`} />
            <div className="page-content">
            <div className="container-fluid py-4">
                {/* Header */}
                <div className="d-flex justify-content-between align-items-start mb-4">
                    <div>
                        <Link
                            href={route('warehouse.shipping-orders.index')}
                            className="text-muted text-decoration-none mb-2 d-inline-block"
                        >
                            <i className="ri-arrow-left-line me-1"></i>
                            Sevk Emirlerine Don
                        </Link>
                        <h4 className="mb-1">
                            {shippingOrder.shipping_number}
                            <Badge
                                bg={getStatusBadgeVariant(shippingOrder.status)}
                                className="ms-2"
                            >
                                {shippingOrder.status_label}
                            </Badge>
                            <Badge
                                bg={getPriorityBadgeVariant(shippingOrder.priority)}
                                className="ms-2"
                            >
                                {shippingOrder.priority_label}
                            </Badge>
                        </h4>
                        <p className="text-muted mb-0">
                            Siparis: {shippingOrder.sales_order?.order_number} |
                            Musteri: {shippingOrder.sales_order?.customer?.name || shippingOrder.sales_order?.customer?.title}
                        </p>
                    </div>
                    <div className="d-flex gap-2">
                        {canEdit && (
                            <Link
                                href={route('warehouse.shipping-orders.edit', shippingOrder.id)}
                                className="btn btn-outline-primary"
                            >
                                <i className="ri-edit-line me-1"></i>
                                Duzenle
                            </Link>
                        )}
                        {canAssignPicking && (
                            <Button
                                variant="primary"
                                onClick={() => setShowAssignModal(true)}
                            >
                                <i className="ri-user-add-line me-1"></i>
                                Toplama Ata
                            </Button>
                        )}
                        {canShip && (
                            <Button
                                variant="success"
                                onClick={() => setShowShipModal(true)}
                            >
                                <i className="ri-truck-line me-1"></i>
                                Sevk Et
                            </Button>
                        )}
                        {shippingOrder.status === 'shipped' && (
                            <Button
                                variant="dark"
                                onClick={handleMarkDelivered}
                            >
                                <i className="ri-checkbox-circle-line me-1"></i>
                                Teslim Edildi
                            </Button>
                        )}
                        {canCancel && (
                            <Button
                                variant="outline-danger"
                                onClick={() => setShowCancelModal(true)}
                            >
                                <i className="ri-close-circle-line me-1"></i>
                                Iptal Et
                            </Button>
                        )}
                    </div>
                </div>

                {/* Cancelled Warning */}
                {shippingOrder.status === 'cancelled' && (
                    <Alert variant="danger" className="mb-4">
                        <Alert.Heading>
                            <i className="ri-error-warning-line me-2"></i>
                            Sevk Emri Iptal Edildi
                        </Alert.Heading>
                        <p className="mb-0">
                            <strong>Iptal Eden:</strong> {shippingOrder.cancelled_by?.name} |
                            <strong> Tarih:</strong> {formatDateTime(shippingOrder.cancelled_at)}
                        </p>
                        {shippingOrder.cancellation_reason && (
                            <p className="mb-0 mt-2">
                                <strong>Neden:</strong> {shippingOrder.cancellation_reason}
                            </p>
                        )}
                    </Alert>
                )}

                <Row>
                    {/* Left Column - Order Details */}
                    <Col lg={8}>
                        {/* Progress */}
                        {shippingOrder.status !== 'cancelled' && (
                            <Card className="border-0 shadow-sm mb-4">
                                <Card.Body>
                                    <div className="d-flex justify-content-between align-items-center mb-2">
                                        <span className="fw-bold">Toplama Ilerleme</span>
                                        <span>{pickingProgress}%</span>
                                    </div>
                                    <ProgressBar
                                        now={pickingProgress}
                                        variant={pickingProgress === 100 ? 'success' : 'primary'}
                                        style={{ height: '10px' }}
                                    />
                                </Card.Body>
                            </Card>
                        )}

                        {/* Items */}
                        <Card className="border-0 shadow-sm mb-4">
                            <Card.Header className="bg-white">
                                <h5 className="mb-0">
                                    <i className="ri-list-check me-2"></i>
                                    Sevk Kalemleri ({shippingOrder.total_items})
                                </h5>
                            </Card.Header>
                            <Card.Body className="p-0">
                                <Table responsive hover className="mb-0">
                                    <thead className="bg-light">
                                        <tr>
                                            <th>Urun</th>
                                            <th>Konum</th>
                                            <th className="text-center">Sevk Miktari</th>
                                            <th className="text-center">Toplanan</th>
                                            <th className="text-center">Durum</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {shippingOrder.items?.map((item) => (
                                            <tr key={item.id}>
                                                <td>
                                                    <div className="fw-bold">{item.product?.code}</div>
                                                    <small className="text-muted">{item.product?.name}</small>
                                                </td>
                                                <td>
                                                    <small className="text-muted">
                                                        {item.corridor && <span>K: {item.corridor}</span>}
                                                        {item.shelf && <span> / R: {item.shelf}</span>}
                                                        {item.bin_location && <span> / {item.bin_location}</span>}
                                                        {!item.corridor && !item.shelf && !item.bin_location && '-'}
                                                    </small>
                                                </td>
                                                <td className="text-center fw-bold">
                                                    {item.shipping_quantity}
                                                </td>
                                                <td className="text-center">
                                                    <span className={item.picked_quantity >= item.shipping_quantity ? 'text-success fw-bold' : ''}>
                                                        {item.picked_quantity}
                                                    </span>
                                                    {item.picked_quantity < item.shipping_quantity && (
                                                        <small className="text-muted"> / {item.shipping_quantity}</small>
                                                    )}
                                                </td>
                                                <td className="text-center">
                                                    <Badge bg={getItemStatusBadgeVariant(item.status)}>
                                                        {item.status_label}
                                                    </Badge>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </Table>
                            </Card.Body>
                        </Card>

                        {/* Picking Tasks */}
                        {shippingOrder.picking_tasks && shippingOrder.picking_tasks.length > 0 && (
                            <Card className="border-0 shadow-sm mb-4">
                                <Card.Header className="bg-white">
                                    <h5 className="mb-0">
                                        <i className="ri-task-line me-2"></i>
                                        Toplama Gorevleri
                                    </h5>
                                </Card.Header>
                                <Card.Body className="p-0">
                                    <Table responsive hover className="mb-0">
                                        <thead className="bg-light">
                                            <tr>
                                                <th>Gorev No</th>
                                                <th>Atanan</th>
                                                <th>Durum</th>
                                                <th>Ilerleme</th>
                                                <th>Baslama</th>
                                                <th>Bitis</th>
                                                <th></th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {shippingOrder.picking_tasks.map((task) => (
                                                <tr key={task.id}>
                                                    <td className="fw-bold">{task.task_number}</td>
                                                    <td>{task.assigned_to?.name}</td>
                                                    <td>
                                                        <Badge bg={getStatusBadgeVariant(task.status)}>
                                                            {task.status_label}
                                                        </Badge>
                                                    </td>
                                                    <td>
                                                        {task.picked_items} / {task.total_items}
                                                    </td>
                                                    <td>{formatDateTime(task.started_at)}</td>
                                                    <td>{formatDateTime(task.completed_at)}</td>
                                                    <td>
                                                        <Link
                                                            href={route('warehouse.picking-tasks.show', task.id)}
                                                            className="btn btn-sm btn-outline-primary"
                                                        >
                                                            <i className="ri-eye-line"></i>
                                                        </Link>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </Table>
                                </Card.Body>
                            </Card>
                        )}
                    </Col>

                    {/* Right Column - Info */}
                    <Col lg={4}>
                        {/* Order Info */}
                        <Card className="border-0 shadow-sm mb-4">
                            <Card.Header className="bg-white">
                                <h6 className="mb-0">Siparis Bilgileri</h6>
                            </Card.Header>
                            <Card.Body>
                                <dl className="row mb-0">
                                    <dt className="col-5">Siparis No:</dt>
                                    <dd className="col-7">
                                        <Link href={route('sales.orders.show', shippingOrder.sales_order_id)}>
                                            {shippingOrder.sales_order?.order_number}
                                        </Link>
                                    </dd>

                                    <dt className="col-5">Satisci:</dt>
                                    <dd className="col-7">
                                        {shippingOrder.sales_order?.salesperson?.name || '-'}
                                    </dd>

                                    <dt className="col-5">Olusturan:</dt>
                                    <dd className="col-7">{shippingOrder.created_by?.name}</dd>

                                    <dt className="col-5">Olusturma:</dt>
                                    <dd className="col-7">{formatDateTime(shippingOrder.created_at)}</dd>
                                </dl>
                            </Card.Body>
                        </Card>

                        {/* Customer/Account Info */}
                        <Card className="border-0 shadow-sm mb-4">
                            <Card.Header className="bg-white">
                                <h6 className="mb-0">
                                    <i className="ri-building-line me-2"></i>
                                    Cari Hesap Bilgileri
                                </h6>
                            </Card.Header>
                            <Card.Body>
                                <dl className="row mb-0">
                                    <dt className="col-5">Cari Hesap Kodu:</dt>
                                    <dd className="col-7">
                                        {shippingOrder.sales_order?.customer?.account_code || '-'}
                                    </dd>

                                    <dt className="col-5">Cari Hesap Unvani:</dt>
                                    <dd className="col-7">
                                        {shippingOrder.sales_order?.customer?.title || shippingOrder.sales_order?.customer?.name || '-'}
                                    </dd>

                                    <dt className="col-5">Adres:</dt>
                                    <dd className="col-7">
                                        <small>
                                            {shippingOrder.sales_order?.customer?.address || '-'}
                                            {shippingOrder.sales_order?.customer?.district && ` ${shippingOrder.sales_order.customer.district}`}
                                            {shippingOrder.sales_order?.customer?.city && ` / ${shippingOrder.sales_order.customer.city}`}
                                        </small>
                                    </dd>

                                    <dt className="col-5">E-posta:</dt>
                                    <dd className="col-7">
                                        {shippingOrder.sales_order?.customer?.email ? (
                                            <a href={`mailto:${shippingOrder.sales_order.customer.email}`}>
                                                {shippingOrder.sales_order.customer.email}
                                            </a>
                                        ) : '-'}
                                    </dd>

                                    <dt className="col-5">Vergi Dairesi:</dt>
                                    <dd className="col-7">
                                        {shippingOrder.sales_order?.customer?.tax_office || '-'}
                                    </dd>

                                    <dt className="col-5">Vergi No:</dt>
                                    <dd className="col-7">
                                        {shippingOrder.sales_order?.customer?.tax_number || '-'}
                                    </dd>
                                </dl>
                            </Card.Body>
                        </Card>

                        {/* Shipping Info */}
                        <Card className="border-0 shadow-sm mb-4">
                            <Card.Header className="bg-white">
                                <h6 className="mb-0">Sevkiyat Bilgileri</h6>
                            </Card.Header>
                            <Card.Body>
                                <dl className="row mb-0">
                                    <dt className="col-5">Istenen Tarih:</dt>
                                    <dd className="col-7">{formatDate(shippingOrder.requested_ship_date)}</dd>

                                    <dt className="col-5">Arac:</dt>
                                    <dd className="col-7">
                                        {shippingOrder.vehicle ? (
                                            <Button
                                                variant="link"
                                                className="p-0 text-decoration-none"
                                                onClick={() => setShowVehicleModal(true)}
                                            >
                                                {shippingOrder.vehicle.plate_number}
                                                {shippingOrder.vehicle.make && ` - ${shippingOrder.vehicle.make}`}
                                                {shippingOrder.vehicle.model && ` ${shippingOrder.vehicle.model}`}
                                                <i className="ri-external-link-line ms-1"></i>
                                            </Button>
                                        ) : '-'}
                                    </dd>

                                    <dt className="col-5">Sofor:</dt>
                                    <dd className="col-7">
                                        {shippingOrder.driver ? (
                                            <Button
                                                variant="link"
                                                className="p-0 text-decoration-none"
                                                onClick={() => setShowDriverModal(true)}
                                            >
                                                {shippingOrder.driver.name}
                                                <i className="ri-external-link-line ms-1"></i>
                                            </Button>
                                        ) : '-'}
                                    </dd>

                                    {shippingOrder.shipped_at && (
                                        <>
                                            <dt className="col-5">Sevk Tarihi:</dt>
                                            <dd className="col-7">{formatDateTime(shippingOrder.shipped_at)}</dd>
                                        </>
                                    )}

                                    {shippingOrder.delivered_at && (
                                        <>
                                            <dt className="col-5">Teslim Tarihi:</dt>
                                            <dd className="col-7">{formatDateTime(shippingOrder.delivered_at)}</dd>
                                        </>
                                    )}

                                    {shippingOrder.logo_dispatch_number && (
                                        <>
                                            <dt className="col-5">Irsaliye No:</dt>
                                            <dd className="col-7">{shippingOrder.logo_dispatch_number}</dd>
                                        </>
                                    )}
                                </dl>
                            </Card.Body>
                        </Card>

                        {/* Shipping Address */}
                        {shippingOrder.shipping_address && (
                            <Card className="border-0 shadow-sm mb-4">
                                <Card.Header className="bg-white">
                                    <h6 className="mb-0">Teslimat Adresi</h6>
                                </Card.Header>
                                <Card.Body>
                                    <small className="text-muted">
                                        {typeof shippingOrder.shipping_address === 'object'
                                            ? Object.values(shippingOrder.shipping_address).filter(Boolean).join(', ')
                                            : shippingOrder.shipping_address}
                                    </small>
                                </Card.Body>
                            </Card>
                        )}

                        {/* Notes */}
                        {(shippingOrder.notes || shippingOrder.shipping_notes) && (
                            <Card className="border-0 shadow-sm mb-4">
                                <Card.Header className="bg-white">
                                    <h6 className="mb-0">Notlar</h6>
                                </Card.Header>
                                <Card.Body>
                                    {shippingOrder.notes && (
                                        <p className="mb-2">{shippingOrder.notes}</p>
                                    )}
                                    {shippingOrder.shipping_notes && (
                                        <p className="mb-0 text-info">
                                            <i className="ri-truck-line me-1"></i>
                                            {shippingOrder.shipping_notes}
                                        </p>
                                    )}
                                </Card.Body>
                            </Card>
                        )}
                    </Col>
                </Row>
            </div>
</div>
            {/* Assign Picking Modal */}
            <Modal show={showAssignModal} onHide={() => setShowAssignModal(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>Toplama Gorevi Ata</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form.Group className="mb-3">
                        <Form.Label>Depo Elemani *</Form.Label>
                        <Form.Select
                            value={assignForm.data.assigned_to_id}
                            onChange={(e) => assignForm.setData('assigned_to_id', e.target.value)}
                            isInvalid={!!assignForm.errors.assigned_to_id}
                        >
                            <option value="">Secin...</option>
                            {warehouseWorkers.map((worker) => (
                                <option key={worker.id} value={worker.id}>
                                    {worker.name}
                                </option>
                            ))}
                        </Form.Select>
                        <Form.Control.Feedback type="invalid">
                            {assignForm.errors.assigned_to_id}
                        </Form.Control.Feedback>
                    </Form.Group>

                    <Form.Group>
                        <Form.Label>Notlar</Form.Label>
                        <Form.Control
                            as="textarea"
                            rows={2}
                            value={assignForm.data.notes}
                            onChange={(e) => assignForm.setData('notes', e.target.value)}
                            placeholder="Opsiyonel notlar..."
                        />
                    </Form.Group>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowAssignModal(false)}>
                        Vazgec
                    </Button>
                    <Button
                        variant="primary"
                        onClick={handleAssignPicking}
                        disabled={assignForm.processing || !assignForm.data.assigned_to_id}
                    >
                        Gorevi Ata
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* Ship Modal */}
            <Modal show={showShipModal} onHide={() => setShowShipModal(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>Sevk Et</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Alert variant="info">
                        <i className="ri-information-line me-2"></i>
                        Sevk islemi yapildiginda irsaliye olusturulacak ve stok guncellenecektir.
                    </Alert>

                    <Form.Group className="mb-3">
                        <Form.Label>Arac</Form.Label>
                        <Form.Control
                            type="text"
                            value={shippingOrder.vehicle?.plate_number || ''}
                            disabled
                        />
                    </Form.Group>

                    <Form.Group className="mb-3">
                        <Form.Label>Sofor</Form.Label>
                        <Form.Control
                            type="text"
                            value={shippingOrder.driver?.name || ''}
                            disabled
                        />
                    </Form.Group>

                    <Form.Group>
                        <Form.Label>Sevkiyat Notlari</Form.Label>
                        <Form.Control
                            as="textarea"
                            rows={2}
                            value={shipForm.data.shipping_notes}
                            onChange={(e) => shipForm.setData('shipping_notes', e.target.value)}
                            placeholder="Sevkiyat ile ilgili notlar..."
                        />
                    </Form.Group>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowShipModal(false)}>
                        Vazgec
                    </Button>
                    <Button
                        variant="success"
                        onClick={handleShip}
                        disabled={shipForm.processing}
                    >
                        <i className="ri-truck-line me-1"></i>
                        Sevk Et
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* Cancel Modal */}
            <Modal show={showCancelModal} onHide={() => setShowCancelModal(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>Sevk Emri Iptal</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Alert variant="warning">
                        <i className="ri-error-warning-line me-2"></i>
                        Sevk emri iptal edildiginde rezerve edilen stoklar serbest birakilacaktir.
                    </Alert>

                    <Form.Group>
                        <Form.Label>Iptal Nedeni *</Form.Label>
                        <Form.Control
                            as="textarea"
                            rows={3}
                            value={cancelForm.data.cancellation_reason}
                            onChange={(e) => cancelForm.setData('cancellation_reason', e.target.value)}
                            placeholder="Iptal nedenini yaziniz..."
                            isInvalid={!!cancelForm.errors.cancellation_reason}
                        />
                        <Form.Control.Feedback type="invalid">
                            {cancelForm.errors.cancellation_reason}
                        </Form.Control.Feedback>
                    </Form.Group>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowCancelModal(false)}>
                        Vazgec
                    </Button>
                    <Button
                        variant="danger"
                        onClick={handleCancel}
                        disabled={cancelForm.processing || !cancelForm.data.cancellation_reason.trim()}
                    >
                        Iptal Et
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* Vehicle Detail Modal */}
            <Modal show={showVehicleModal} onHide={() => setShowVehicleModal(false)} size="lg">
                <Modal.Header closeButton>
                    <Modal.Title>
                        <i className="ri-car-line me-2"></i>
                        Arac Detayi
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {shippingOrder.vehicle && (
                        <Row>
                            <Col md={6}>
                                <dl className="row mb-0">
                                    <dt className="col-5">Plaka:</dt>
                                    <dd className="col-7 fw-bold">{shippingOrder.vehicle.plate_number}</dd>

                                    <dt className="col-5">Marka:</dt>
                                    <dd className="col-7">{shippingOrder.vehicle.make || '-'}</dd>

                                    <dt className="col-5">Model:</dt>
                                    <dd className="col-7">{shippingOrder.vehicle.model || '-'}</dd>

                                    <dt className="col-5">Yil:</dt>
                                    <dd className="col-7">{shippingOrder.vehicle.year || '-'}</dd>

                                    <dt className="col-5">Renk:</dt>
                                    <dd className="col-7">{shippingOrder.vehicle.color || '-'}</dd>

                                    <dt className="col-5">Arac Tipi:</dt>
                                    <dd className="col-7">{shippingOrder.vehicle.vehicle_type || '-'}</dd>

                                    <dt className="col-5">Yakit Tipi:</dt>
                                    <dd className="col-7">{shippingOrder.vehicle.fuel_type || '-'}</dd>
                                </dl>
                            </Col>
                            <Col md={6}>
                                <dl className="row mb-0">
                                    <dt className="col-5">Kapasite:</dt>
                                    <dd className="col-7">{shippingOrder.vehicle.capacity || '-'}</dd>

                                    <dt className="col-5">Kilometre:</dt>
                                    <dd className="col-7">
                                        {shippingOrder.vehicle.mileage ? `${shippingOrder.vehicle.mileage.toLocaleString()} km` : '-'}
                                    </dd>

                                    <dt className="col-5">Durum:</dt>
                                    <dd className="col-7">
                                        <Badge bg={shippingOrder.vehicle.status === 'available' ? 'success' : 'warning'}>
                                            {shippingOrder.vehicle.status === 'available' ? 'Musait' :
                                             shippingOrder.vehicle.status === 'in_use' ? 'Kullanımda' :
                                             shippingOrder.vehicle.status === 'maintenance' ? 'Bakımda' : shippingOrder.vehicle.status}
                                        </Badge>
                                    </dd>

                                    <dt className="col-5">Sigorta Bitis:</dt>
                                    <dd className="col-7">{formatDate(shippingOrder.vehicle.insurance_expiry_date)}</dd>

                                    <dt className="col-5">Trafik Sig. Bitis:</dt>
                                    <dd className="col-7">{formatDate(shippingOrder.vehicle.traffic_insurance_expiry)}</dd>

                                    <dt className="col-5">Muayene Tarihi:</dt>
                                    <dd className="col-7">{formatDate(shippingOrder.vehicle.inspection_date)}</dd>
                                </dl>
                            </Col>
                            {shippingOrder.vehicle.notes && (
                                <Col xs={12} className="mt-3">
                                    <strong>Notlar:</strong>
                                    <p className="text-muted mb-0 mt-1">{shippingOrder.vehicle.notes}</p>
                                </Col>
                            )}
                        </Row>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Link
                        href={route('logistics.vehicles.show', shippingOrder.vehicle_id || 0)}
                        className="btn btn-outline-primary me-auto"
                    >
                        <i className="ri-external-link-line me-1"></i>
                        Arac Sayfasina Git
                    </Link>
                    <Button variant="secondary" onClick={() => setShowVehicleModal(false)}>
                        Kapat
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* Driver Detail Modal */}
            <Modal show={showDriverModal} onHide={() => setShowDriverModal(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>
                        <i className="ri-user-line me-2"></i>
                        Sofor Detayi
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {shippingOrder.driver && (
                        <dl className="row mb-0">
                            <dt className="col-4">Ad Soyad:</dt>
                            <dd className="col-8 fw-bold">{shippingOrder.driver.name}</dd>

                            <dt className="col-4">Telefon:</dt>
                            <dd className="col-8">
                                {shippingOrder.driver.phone || shippingOrder.driver.mobile_phone ? (
                                    <a href={`tel:${shippingOrder.driver.phone || shippingOrder.driver.mobile_phone}`}>
                                        {shippingOrder.driver.phone || shippingOrder.driver.mobile_phone}
                                    </a>
                                ) : '-'}
                            </dd>

                            <dt className="col-4">Ehliyet No:</dt>
                            <dd className="col-8">{shippingOrder.driver.license_number || '-'}</dd>

                            <dt className="col-4">Ehliyet Sinifi:</dt>
                            <dd className="col-8">{shippingOrder.driver.license_type || '-'}</dd>

                            <dt className="col-4">Ehliyet Bitis:</dt>
                            <dd className="col-8">{formatDate(shippingOrder.driver.license_expiry_date)}</dd>

                            <dt className="col-4">Durum:</dt>
                            <dd className="col-8">
                                <Badge bg={shippingOrder.driver.is_active_driver ? 'success' : 'secondary'}>
                                    {shippingOrder.driver.is_active_driver ? 'Aktif' : 'Pasif'}
                                </Badge>
                            </dd>

                            {shippingOrder.driver.driver_notes && (
                                <>
                                    <dt className="col-4">Notlar:</dt>
                                    <dd className="col-8 text-muted">{shippingOrder.driver.driver_notes}</dd>
                                </>
                            )}
                        </dl>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Link
                        href={route('warehouse.drivers.edit', shippingOrder.driver_id || 0)}
                        className="btn btn-outline-primary me-auto"
                    >
                        <i className="ri-edit-line me-1"></i>
                        Sofor Duzenle
                    </Link>
                    <Button variant="secondary" onClick={() => setShowDriverModal(false)}>
                        Kapat
                    </Button>
                </Modal.Footer>
            </Modal>
        </Layout>
    );
}
