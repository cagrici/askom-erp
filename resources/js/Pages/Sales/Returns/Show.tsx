import React, { useState } from 'react';
import { Head, Link, useForm, router } from '@inertiajs/react';
import { Card, Table, Button, Row, Col, Badge, Image, Modal, Form } from 'react-bootstrap';
import Layout from '@/Layouts';

interface SalesReturn {
    id: number;
    return_no: string;
    return_date: string;
    status: string;
    status_label: string;
    return_reason: string;
    reason_label: string;
    return_description: string;
    total_amount: number;
    refund_method?: string;
    refund_method_label?: string;
    rejection_reason?: string;
    pickup_date?: string;
    pickup_notes?: string;
    warehouse_notes?: string;
    sales_order: {
        id: number;
        order_number: string;
    };
    customer: {
        title: string;
        entity_code: string;
        email?: string;
    };
    items: Array<{
        id: number;
        product_name: string;
        product_code?: string;
        quantity_returned: number;
        unit_price: number;
        line_total: number;
        condition?: string;
        condition_label?: string;
        images: Array<{
            id: number;
            image_path: string;
            image_url: string;
        }>;
    }>;
    created_by?: { name: string };
    approved_by?: { name: string };
    rejected_by?: { name: string };
    driver?: { name: string };
}

interface Props {
    return: SalesReturn;
    canApprove: boolean;
    canReject: boolean;
    canAssignDriver: boolean;
    canProcess: boolean;
}

export default function Show({ return: returnData, canApprove, canReject, canAssignDriver, canProcess }: Props) {
    const [showApproveModal, setShowApproveModal] = useState(false);
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [showAssignDriverModal, setShowAssignDriverModal] = useState(false);

    const approveForm = useForm({
        refund_method: 'credit_note',
    });

    const rejectForm = useForm({
        rejection_reason: '',
    });

    const assignDriverForm = useForm({
        driver_id: '',
        pickup_date: '',
    });

    const handleApprove = () => {
        approveForm.post(route('sales.returns.approve', returnData.id), {
            onSuccess: () => setShowApproveModal(false),
        });
    };

    const handleReject = () => {
        rejectForm.post(route('sales.returns.reject', returnData.id), {
            onSuccess: () => setShowRejectModal(false),
        });
    };

    const handleAssignDriver = () => {
        assignDriverForm.post(route('sales.returns.assign-driver', returnData.id), {
            onSuccess: () => setShowAssignDriverModal(false),
        });
    };

    const getStatusColor = (status: string) => {
        const colors: Record<string, string> = {
            pending_approval: 'warning',
            approved: 'info',
            rejected: 'danger',
            processing: 'primary',
            completed: 'success',
            cancelled: 'secondary',
        };
        return colors[status] || 'secondary';
    };

    return (
        <Layout>
            <Head title={`İade Detayı - ${returnData.return_no}`} />

            <div className="page-content">
                <div className="container-fluid">
                <Row className="mb-3">
                    <Col>
                        <div className="page-title-box d-sm-flex align-items-center justify-content-between">
                            <h4 className="mb-sm-0">İade Detayı: {returnData.return_no}</h4>
                            <div className="page-title-right d-flex gap-2">
                                <Link href={route('sales.returns.index')}>
                                    <Button variant="secondary" size="sm">
                                        <i className="ri-arrow-left-line me-1"></i>
                                        Geri Dön
                                    </Button>
                                </Link>
                                <a
                                    href={route('sales.returns.pdf', returnData.id)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    <Button variant="outline-primary" size="sm">
                                        <i className="ri-file-pdf-line me-1"></i>
                                        PDF İndir
                                    </Button>
                                </a>
                            </div>
                        </div>
                    </Col>
                </Row>

                <Row>
                    <Col lg={8}>
                        {/* Return Info */}
                        <Card className="mb-3">
                            <Card.Header className="d-flex justify-content-between align-items-center">
                                <h5 className="card-title mb-0">İade Bilgileri</h5>
                                <Badge bg={getStatusColor(returnData.status)} className="fs-6">
                                    {returnData.status_label}
                                </Badge>
                            </Card.Header>
                            <Card.Body>
                                <Row>
                                    <Col md={6}>
                                        <p className="mb-2">
                                            <strong>İade No:</strong> {returnData.return_no}
                                        </p>
                                        <p className="mb-2">
                                            <strong>Sipariş No:</strong>{' '}
                                            <Link
                                                href={route('sales.orders.show', returnData.sales_order.id)}
                                                className="text-primary"
                                            >
                                                {returnData.sales_order.order_number}
                                            </Link>
                                        </p>
                                        <p className="mb-2">
                                            <strong>İade Tarihi:</strong>{' '}
                                            {new Date(returnData.return_date).toLocaleDateString('tr-TR')}
                                        </p>
                                        <p className="mb-2">
                                            <strong>İade Nedeni:</strong>{' '}
                                            <Badge bg="secondary">{returnData.reason_label}</Badge>
                                        </p>
                                    </Col>
                                    <Col md={6}>
                                        <p className="mb-2">
                                            <strong>Müşteri:</strong> {returnData.customer.title}
                                        </p>
                                        <p className="mb-2">
                                            <strong>Cari Kod:</strong> {returnData.customer.entity_code}
                                        </p>
                                        {returnData.refund_method_label && (
                                            <p className="mb-2">
                                                <strong>İade Yöntemi:</strong> {returnData.refund_method_label}
                                            </p>
                                        )}
                                        <p className="mb-2">
                                            <strong>Toplam Tutar:</strong> ₺
                                            {Number(returnData.total_amount).toLocaleString('tr-TR', {
                                                minimumFractionDigits: 2,
                                            })}
                                        </p>
                                    </Col>
                                </Row>
                                <hr />
                                <Row>
                                    <Col>
                                        <strong>Açıklama:</strong>
                                        <p className="mt-2">{returnData.return_description}</p>
                                    </Col>
                                </Row>
                            </Card.Body>
                        </Card>

                        {/* Return Items */}
                        <Card className="mb-3">
                            <Card.Header>
                                <h5 className="card-title mb-0">İade Edilen Ürünler</h5>
                            </Card.Header>
                            <Card.Body>
                                <Table hover className="mb-0">
                                    <thead className="table-light">
                                        <tr>
                                            <th>Ürün</th>
                                            <th className="text-center">Miktar</th>
                                            <th className="text-end">Birim Fiyat</th>
                                            <th className="text-end">Toplam</th>
                                            {returnData.status === 'completed' && <th>Durum</th>}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {returnData.items.map((item) => (
                                            <tr key={item.id}>
                                                <td>
                                                    <div>{item.product_name}</div>
                                                    {item.product_code && (
                                                        <small className="text-muted">Kod: {item.product_code}</small>
                                                    )}
                                                </td>
                                                <td className="text-center">{item.quantity_returned}</td>
                                                <td className="text-end">
                                                    ₺{Number(item.unit_price).toFixed(2)}
                                                </td>
                                                <td className="text-end">
                                                    ₺{Number(item.line_total).toFixed(2)}
                                                </td>
                                                {returnData.status === 'completed' && (
                                                    <td>
                                                        <Badge bg="info">{item.condition_label}</Badge>
                                                    </td>
                                                )}
                                            </tr>
                                        ))}
                                    </tbody>
                                </Table>
                            </Card.Body>
                        </Card>

                        {/* Product Images */}
                        <Card>
                            <Card.Header>
                                <h5 className="card-title mb-0">Ürün Fotoğrafları</h5>
                            </Card.Header>
                            <Card.Body>
                                {returnData.items.map((item) => (
                                    <div key={item.id} className="mb-4">
                                        <h6 className="mb-3">{item.product_name}</h6>
                                        <div className="d-flex flex-wrap gap-2">
                                            {item.images.map((image) => (
                                                <a
                                                    key={image.id}
                                                    href={`/storage/${image.image_path}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                >
                                                    <Image
                                                        src={`/storage/${image.image_path}`}
                                                        rounded
                                                        style={{
                                                            width: '120px',
                                                            height: '120px',
                                                            objectFit: 'cover',
                                                            cursor: 'pointer',
                                                        }}
                                                    />
                                                </a>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </Card.Body>
                        </Card>
                    </Col>

                    <Col lg={4}>
                        {/* Actions */}
                        {(canApprove || canReject) && (
                            <Card className="mb-3">
                                <Card.Header>
                                    <h5 className="card-title mb-0">İşlemler</h5>
                                </Card.Header>
                                <Card.Body className="d-grid gap-2">
                                    {canApprove && (
                                        <Button
                                            variant="success"
                                            onClick={() => setShowApproveModal(true)}
                                        >
                                            <i className="ri-check-line me-2"></i>
                                            İade Talebini Onayla
                                        </Button>
                                    )}
                                    {canReject && (
                                        <Button
                                            variant="danger"
                                            onClick={() => setShowRejectModal(true)}
                                        >
                                            <i className="ri-close-line me-2"></i>
                                            İade Talebini Reddet
                                        </Button>
                                    )}
                                    {canAssignDriver && (
                                        <Button
                                            variant="primary"
                                            onClick={() => setShowAssignDriverModal(true)}
                                        >
                                            <i className="ri-user-add-line me-2"></i>
                                            Şoför Ata
                                        </Button>
                                    )}
                                </Card.Body>
                            </Card>
                        )}

                        {/* Timeline */}
                        <Card>
                            <Card.Header>
                                <h5 className="card-title mb-0">Zaman Çizelgesi</h5>
                            </Card.Header>
                            <Card.Body>
                                <div className="timeline">
                                    <div className="timeline-item">
                                        <i className="ri-add-circle-line text-success"></i>
                                        <div>
                                            <strong>İade Talebi Oluşturuldu</strong>
                                            <p className="mb-0 text-muted small">
                                                {new Date(returnData.return_date).toLocaleString('tr-TR')}
                                            </p>
                                            {returnData.created_by && (
                                                <p className="mb-0 text-muted small">
                                                    {returnData.created_by.name}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    {returnData.approved_by && (
                                        <div className="timeline-item">
                                            <i className="ri-check-circle-line text-info"></i>
                                            <div>
                                                <strong>Onaylandı</strong>
                                                <p className="mb-0 text-muted small">
                                                    {returnData.approved_by.name}
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    {returnData.rejected_by && (
                                        <div className="timeline-item">
                                            <i className="ri-close-circle-line text-danger"></i>
                                            <div>
                                                <strong>Reddedildi</strong>
                                                <p className="mb-0 text-muted small">
                                                    {returnData.rejected_by.name}
                                                </p>
                                                {returnData.rejection_reason && (
                                                    <p className="mb-0 text-muted small">
                                                        Neden: {returnData.rejection_reason}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {returnData.driver && (
                                        <div className="timeline-item">
                                            <i className="ri-truck-line text-primary"></i>
                                            <div>
                                                <strong>Şoför Atandı</strong>
                                                <p className="mb-0 text-muted small">
                                                    {returnData.driver.name}
                                                </p>
                                                {returnData.pickup_date && (
                                                    <p className="mb-0 text-muted small">
                                                        Teslim Tarihi:{' '}
                                                        {new Date(returnData.pickup_date).toLocaleDateString('tr-TR')}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>

                {/* Approve Modal */}
                <Modal show={showApproveModal} onHide={() => setShowApproveModal(false)}>
                    <Modal.Header closeButton>
                        <Modal.Title>İade Talebini Onayla</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <Form.Group>
                            <Form.Label>İade Yöntemi</Form.Label>
                            <Form.Select
                                value={approveForm.data.refund_method}
                                onChange={(e) => approveForm.setData('refund_method', e.target.value)}
                            >
                                <option value="credit_note">Kredi Notu</option>
                                <option value="bank_transfer">Banka Transferi</option>
                                <option value="cash">Nakit</option>
                                <option value="replacement">Ürün Değişimi</option>
                            </Form.Select>
                        </Form.Group>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={() => setShowApproveModal(false)}>
                            İptal
                        </Button>
                        <Button
                            variant="success"
                            onClick={handleApprove}
                            disabled={approveForm.processing}
                        >
                            Onayla
                        </Button>
                    </Modal.Footer>
                </Modal>

                {/* Reject Modal */}
                <Modal show={showRejectModal} onHide={() => setShowRejectModal(false)}>
                    <Modal.Header closeButton>
                        <Modal.Title>İade Talebini Reddet</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <Form.Group>
                            <Form.Label>Red Nedeni *</Form.Label>
                            <Form.Control
                                as="textarea"
                                rows={4}
                                value={rejectForm.data.rejection_reason}
                                onChange={(e) => rejectForm.setData('rejection_reason', e.target.value)}
                                placeholder="Red nedenini açıklayınız..."
                                required
                            />
                        </Form.Group>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={() => setShowRejectModal(false)}>
                            İptal
                        </Button>
                        <Button
                            variant="danger"
                            onClick={handleReject}
                            disabled={rejectForm.processing || !rejectForm.data.rejection_reason}
                        >
                            Reddet
                        </Button>
                    </Modal.Footer>
                </Modal>

                {/* Assign Driver Modal */}
                <Modal show={showAssignDriverModal} onHide={() => setShowAssignDriverModal(false)}>
                    <Modal.Header closeButton>
                        <Modal.Title>Şoför Ata</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <Form.Group className="mb-3">
                            <Form.Label>Şoför *</Form.Label>
                            <Form.Select
                                value={assignDriverForm.data.driver_id}
                                onChange={(e) => assignDriverForm.setData('driver_id', e.target.value)}
                                required
                            >
                                <option value="">Şoför Seçiniz</option>
                                {/* TODO: Add drivers list */}
                            </Form.Select>
                        </Form.Group>

                        <Form.Group>
                            <Form.Label>Teslim Alma Tarihi *</Form.Label>
                            <Form.Control
                                type="date"
                                value={assignDriverForm.data.pickup_date}
                                onChange={(e) => assignDriverForm.setData('pickup_date', e.target.value)}
                                min={new Date().toISOString().split('T')[0]}
                                required
                            />
                        </Form.Group>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={() => setShowAssignDriverModal(false)}>
                            İptal
                        </Button>
                        <Button
                            variant="primary"
                            onClick={handleAssignDriver}
                            disabled={
                                assignDriverForm.processing ||
                                !assignDriverForm.data.driver_id ||
                                !assignDriverForm.data.pickup_date
                            }
                        >
                            Ata
                        </Button>
                    </Modal.Footer>
                </Modal>
                </div>
            </div>
        </Layout>
    );
}
