import React, { useState } from 'react';
import Layout from '@/Layouts';
import { Head, Link, router } from '@inertiajs/react';
import { Card, Button, Row, Col, Badge, Table, Modal, Form, Alert, Timeline } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';

interface User {
    id: number;
    name: string;
    email: string;
}

interface Location {
    id: number;
    name: string;
    code: string;
    address?: string;
}

interface Product {
    id: number;
    name: string;
    code: string;
    unit_name: string;
}

interface StockTransferItem {
    id: number;
    product: Product;
    quantity: number;
    transferred_quantity: number;
    received_quantity: number;
    unit_cost: number;
    total_cost: number;
    notes?: string;
    serial_numbers?: string[];
    batch_numbers?: string[];
    expiry_date?: string;
}

interface StockTransfer {
    id: number;
    transfer_number: string;
    title: string;
    description?: string;
    from_location: Location;
    to_location: Location;
    transfer_type: string;
    transfer_type_text: string;
    status: string;
    status_text: string;
    status_color: string;
    priority: string;
    priority_text: string;
    priority_color: string;
    total_items: number;
    total_value: number;
    expected_date?: string;
    shipped_date?: string;
    received_date?: string;
    tracking_number?: string;
    carrier?: string;
    notes?: string;
    created_at: string;
    requester?: User;
    approver?: User;
    shipper?: User;
    receiver?: User;
    items: StockTransferItem[];
    can_be_approved: boolean;
    can_be_shipped: boolean;
    can_be_received: boolean;
    can_be_cancelled: boolean;
    can_be_edited: boolean;
    can_be_deleted: boolean;
    is_completed: boolean;
    is_in_transit: boolean;
    workflow_history: any[];
}

interface Props {
    transfer: StockTransfer;
}

export default function ShowTransfer({ transfer }: Props) {
    const { t } = useTranslation();
    const [showApproveModal, setShowApproveModal] = useState(false);
    const [showShipModal, setShowShipModal] = useState(false);
    const [showReceiveModal, setShowReceiveModal] = useState(false);
    const [showCancelModal, setShowCancelModal] = useState(false);
    
    const [shipData, setShipData] = useState({
        tracking_number: '',
        carrier: '',
        notes: ''
    });
    
    const [receiveData, setReceiveData] = useState({
        notes: '',
        items: transfer.items.map(item => ({
            id: item.id,
            received_quantity: item.quantity
        }))
    });

    const [cancelReason, setCancelReason] = useState('');

    const formatDate = (dateString?: string) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString('tr-TR');
    };

    const formatDateTime = (dateString: string) => {
        return new Date(dateString).toLocaleString('tr-TR', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const formatCurrency = (amount: number) => {
        return `₺${amount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}`;
    };

    const handleApprove = async () => {
        try {
            await router.post(route('stock.transfers.approve', transfer.id));
            setShowApproveModal(false);
        } catch (error) {
            console.error('Approval error:', error);
        }
    };

    const handleShip = async () => {
        try {
            await router.post(route('stock.transfers.ship', transfer.id), shipData);
            setShowShipModal(false);
        } catch (error) {
            console.error('Shipping error:', error);
        }
    };

    const handleReceive = async () => {
        try {
            await router.post(route('stock.transfers.receive', transfer.id), receiveData);
            setShowReceiveModal(false);
        } catch (error) {
            console.error('Receiving error:', error);
        }
    };

    const handleCancel = async () => {
        try {
            await router.post(route('stock.transfers.cancel', transfer.id), { reason: cancelReason });
            setShowCancelModal(false);
        } catch (error) {
            console.error('Cancellation error:', error);
        }
    };

    const updateReceivedQuantity = (itemId: number, quantity: number) => {
        setReceiveData(prev => ({
            ...prev,
            items: prev.items.map(item => 
                item.id === itemId ? { ...item, received_quantity: quantity } : item
            )
        }));
    };

    const getStatusIcon = (status: string) => {
        const icons = {
            'pending': 'ri-time-line text-warning',
            'approved': 'ri-check-line text-success',
            'shipped': 'ri-truck-line text-info',
            'received': 'ri-inbox-line text-primary',
            'completed': 'ri-check-double-line text-success',
            'cancelled': 'ri-close-line text-danger'
        };
        return icons[status] || 'ri-more-line text-muted';
    };

    const getTransferTypeIcon = (type: string) => {
        switch (type) {
            case 'internal':
                return <i className="ri-shuffle-line text-primary"></i>;
            case 'external':
                return <i className="ri-external-link-line text-info"></i>;
            case 'warehouse_to_store':
                return <i className="ri-arrow-right-line text-success"></i>;
            case 'store_to_warehouse':
                return <i className="ri-arrow-left-line text-warning"></i>;
            case 'store_to_store':
                return <i className="ri-exchange-line text-secondary"></i>;
            case 'emergency':
                return <i className="ri-alarm-warning-line text-danger"></i>;
            case 'return':
                return <i className="ri-reply-line text-info"></i>;
            default:
                return <i className="ri-more-line text-muted"></i>;
        }
    };

    return (
        <Layout>
            <Head title={`Transfer ${transfer.transfer_number}`} />

            <div className="page-content">
                <div className="container-fluid">
                    <Row className="mb-3">
                        <Col>
                            <div className="page-title-box d-flex align-items-center justify-content-between">
                                <div>
                                    <h4 className="mb-0">Transfer {transfer.transfer_number}</h4>
                                    <div className="page-title-right">
                                        <ol className="breadcrumb m-0">
                                            <li className="breadcrumb-item">
                                                <Link href={route('stock.index')}>Stok Yönetimi</Link>
                                            </li>
                                            <li className="breadcrumb-item">
                                                <Link href={route('stock.transfers')}>Stok Transferleri</Link>
                                            </li>
                                            <li className="breadcrumb-item active">{transfer.transfer_number}</li>
                                        </ol>
                                    </div>
                                </div>
                                <div className="d-flex gap-2">
                                    <Link 
                                        href={route('stock.transfers')} 
                                        className="btn btn-secondary"
                                    >
                                        <i className="ri-arrow-left-line me-1"></i>
                                        Geri Dön
                                    </Link>

                                    {transfer.can_be_approved && (
                                        <Button 
                                            variant="success"
                                            onClick={() => setShowApproveModal(true)}
                                        >
                                            <i className="ri-check-line me-1"></i>
                                            Onayla
                                        </Button>
                                    )}

                                    {transfer.can_be_shipped && (
                                        <Button 
                                            variant="info"
                                            onClick={() => setShowShipModal(true)}
                                        >
                                            <i className="ri-truck-line me-1"></i>
                                            Gönder
                                        </Button>
                                    )}

                                    {transfer.can_be_received && (
                                        <Button 
                                            variant="primary"
                                            onClick={() => setShowReceiveModal(true)}
                                        >
                                            <i className="ri-inbox-line me-1"></i>
                                            Teslim Al
                                        </Button>
                                    )}

                                    {transfer.can_be_cancelled && (
                                        <Button 
                                            variant="warning"
                                            onClick={() => setShowCancelModal(true)}
                                        >
                                            <i className="ri-close-line me-1"></i>
                                            İptal Et
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </Col>
                    </Row>

                    <Row>
                        <Col lg={8}>
                            {/* Transfer Info */}
                            <Card className="mb-4">
                                <Card.Header>
                                    <div className="d-flex align-items-center justify-content-between">
                                        <h5 className="mb-0">Transfer Bilgileri</h5>
                                        <div className="d-flex align-items-center gap-2">
                                            {getTransferTypeIcon(transfer.transfer_type)}
                                            <Badge bg={transfer.status_color} className="fs-6">
                                                {transfer.status_text}
                                            </Badge>
                                        </div>
                                    </div>
                                </Card.Header>
                                <Card.Body>
                                    <Row>
                                        <Col md={6}>
                                            <div className="mb-3">
                                                <label className="form-label text-muted">Transfer Başlığı</label>
                                                <div className="fw-medium">{transfer.title}</div>
                                            </div>
                                            {transfer.description && (
                                                <div className="mb-3">
                                                    <label className="form-label text-muted">Açıklama</label>
                                                    <div>{transfer.description}</div>
                                                </div>
                                            )}
                                            <div className="mb-3">
                                                <label className="form-label text-muted">Transfer Türü</label>
                                                <div className="fw-medium">{transfer.transfer_type_text}</div>
                                            </div>
                                            <div className="mb-3">
                                                <label className="form-label text-muted">Öncelik</label>
                                                <div>
                                                    <Badge bg={transfer.priority_color}>{transfer.priority_text}</Badge>
                                                </div>
                                            </div>
                                        </Col>
                                        <Col md={6}>
                                            <div className="mb-3">
                                                <label className="form-label text-muted">Kaynak Lokasyon</label>
                                                <div className="fw-medium text-success">
                                                    <i className="ri-map-pin-line me-1"></i>
                                                    {transfer.from_location.name} ({transfer.from_location.code})
                                                </div>
                                            </div>
                                            <div className="mb-3">
                                                <label className="form-label text-muted">Hedef Lokasyon</label>
                                                <div className="fw-medium text-primary">
                                                    <i className="ri-map-pin-line me-1"></i>
                                                    {transfer.to_location.name} ({transfer.to_location.code})
                                                </div>
                                            </div>
                                            <div className="mb-3">
                                                <label className="form-label text-muted">Beklenen Tarih</label>
                                                <div className="fw-medium">{formatDate(transfer.expected_date)}</div>
                                            </div>
                                            {transfer.tracking_number && (
                                                <div className="mb-3">
                                                    <label className="form-label text-muted">Takip Numarası</label>
                                                    <div className="fw-medium">
                                                        <Badge bg="info" className="fs-6">{transfer.tracking_number}</Badge>
                                                        {transfer.carrier && ` (${transfer.carrier})`}
                                                    </div>
                                                </div>
                                            )}
                                        </Col>
                                    </Row>
                                    {transfer.notes && (
                                        <div className="mt-3">
                                            <label className="form-label text-muted">Notlar</label>
                                            <div className="bg-light p-3 rounded">{transfer.notes}</div>
                                        </div>
                                    )}
                                </Card.Body>
                            </Card>

                            {/* Transfer Items */}
                            <Card>
                                <Card.Header>
                                    <h5 className="mb-0">Transfer Ürünleri ({transfer.items.length} ürün)</h5>
                                </Card.Header>
                                <Card.Body>
                                    <div className="table-responsive">
                                        <Table hover>
                                            <thead className="table-light">
                                                <tr>
                                                    <th>Ürün</th>
                                                    <th className="text-center">Talep Edilen</th>
                                                    <th className="text-center">Gönderilen</th>
                                                    <th className="text-center">Alınan</th>
                                                    <th className="text-end">Birim Fiyat</th>
                                                    <th className="text-end">Toplam</th>
                                                    <th className="text-center">Durum</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {transfer.items.map(item => (
                                                    <tr key={item.id}>
                                                        <td>
                                                            <div>
                                                                <div className="fw-medium">{item.product.name}</div>
                                                                <small className="text-muted">{item.product.code}</small>
                                                                {item.notes && (
                                                                    <div>
                                                                        <small className="text-info">
                                                                            <i className="ri-information-line me-1"></i>
                                                                            {item.notes}
                                                                        </small>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td className="text-center">
                                                            <Badge bg="secondary">
                                                                {item.quantity} {item.product.unit_name}
                                                            </Badge>
                                                        </td>
                                                        <td className="text-center">
                                                            <Badge bg={item.transferred_quantity > 0 ? "info" : "light"}>
                                                                {item.transferred_quantity} {item.product.unit_name}
                                                            </Badge>
                                                        </td>
                                                        <td className="text-center">
                                                            <Badge bg={item.received_quantity > 0 ? "success" : "light"}>
                                                                {item.received_quantity} {item.product.unit_name}
                                                            </Badge>
                                                        </td>
                                                        <td className="text-end">{formatCurrency(item.unit_cost)}</td>
                                                        <td className="text-end fw-medium">{formatCurrency(item.total_cost)}</td>
                                                        <td className="text-center">
                                                            {item.received_quantity >= item.quantity ? (
                                                                <Badge bg="success">Tamamlandı</Badge>
                                                            ) : item.transferred_quantity > 0 ? (
                                                                <Badge bg="info">Yolda</Badge>
                                                            ) : transfer.status === 'approved' ? (
                                                                <Badge bg="warning">Hazırlanıyor</Badge>
                                                            ) : (
                                                                <Badge bg="secondary">Bekliyor</Badge>
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                            <tfoot>
                                                <tr className="table-active">
                                                    <th colSpan={5}>Toplam</th>
                                                    <th className="text-end">{formatCurrency(transfer.total_value)}</th>
                                                    <th></th>
                                                </tr>
                                            </tfoot>
                                        </Table>
                                    </div>
                                </Card.Body>
                            </Card>
                        </Col>

                        <Col lg={4}>
                            {/* Status Timeline */}
                            <Card className="mb-4">
                                <Card.Header>
                                    <h5 className="mb-0">Transfer Süreci</h5>
                                </Card.Header>
                                <Card.Body>
                                    <div className="timeline">
                                        <div className="timeline-item">
                                            <div className="timeline-marker bg-success">
                                                <i className="ri-add-line"></i>
                                            </div>
                                            <div className="timeline-content">
                                                <h6 className="mb-1">Transfer Oluşturuldu</h6>
                                                <p className="text-muted mb-1">{formatDateTime(transfer.created_at)}</p>
                                                {transfer.requester && (
                                                    <small className="text-muted">Oluşturan: {transfer.requester.name}</small>
                                                )}
                                            </div>
                                        </div>

                                        {transfer.status !== 'pending' && (
                                            <div className="timeline-item">
                                                <div className="timeline-marker bg-info">
                                                    <i className="ri-check-line"></i>
                                                </div>
                                                <div className="timeline-content">
                                                    <h6 className="mb-1">Transfer Onaylandı</h6>
                                                    {transfer.approver && (
                                                        <small className="text-muted">Onaylayan: {transfer.approver.name}</small>
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                        {transfer.shipped_date && (
                                            <div className="timeline-item">
                                                <div className="timeline-marker bg-warning">
                                                    <i className="ri-truck-line"></i>
                                                </div>
                                                <div className="timeline-content">
                                                    <h6 className="mb-1">Transfer Gönderildi</h6>
                                                    <p className="text-muted mb-1">{formatDateTime(transfer.shipped_date)}</p>
                                                    {transfer.shipper && (
                                                        <small className="text-muted">Gönderen: {transfer.shipper.name}</small>
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                        {transfer.received_date && (
                                            <div className="timeline-item">
                                                <div className="timeline-marker bg-primary">
                                                    <i className="ri-inbox-line"></i>
                                                </div>
                                                <div className="timeline-content">
                                                    <h6 className="mb-1">Transfer Teslim Alındı</h6>
                                                    <p className="text-muted mb-1">{formatDateTime(transfer.received_date)}</p>
                                                    {transfer.receiver && (
                                                        <small className="text-muted">Teslim Alan: {transfer.receiver.name}</small>
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                        {transfer.is_completed && (
                                            <div className="timeline-item">
                                                <div className="timeline-marker bg-success">
                                                    <i className="ri-check-double-line"></i>
                                                </div>
                                                <div className="timeline-content">
                                                    <h6 className="mb-1">Transfer Tamamlandı</h6>
                                                </div>
                                            </div>
                                        )}

                                        {transfer.status === 'cancelled' && (
                                            <div className="timeline-item">
                                                <div className="timeline-marker bg-danger">
                                                    <i className="ri-close-line"></i>
                                                </div>
                                                <div className="timeline-content">
                                                    <h6 className="mb-1">Transfer İptal Edildi</h6>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </Card.Body>
                            </Card>

                            {/* Summary Stats */}
                            <Card>
                                <Card.Header>
                                    <h5 className="mb-0">Özet</h5>
                                </Card.Header>
                                <Card.Body>
                                    <div className="d-flex justify-content-between mb-2">
                                        <span>Toplam Ürün Çeşidi:</span>
                                        <span className="fw-medium">{transfer.items.length}</span>
                                    </div>
                                    <div className="d-flex justify-content-between mb-2">
                                        <span>Toplam Miktar:</span>
                                        <span className="fw-medium">{transfer.total_items} Adet</span>
                                    </div>
                                    <div className="d-flex justify-content-between mb-2">
                                        <span>Toplam Değer:</span>
                                        <span className="fw-medium text-primary">{formatCurrency(transfer.total_value)}</span>
                                    </div>
                                    <hr />
                                    <div className="d-flex justify-content-between">
                                        <span>Durum:</span>
                                        <Badge bg={transfer.status_color} className="fs-6">
                                            {transfer.status_text}
                                        </Badge>
                                    </div>
                                </Card.Body>
                            </Card>
                        </Col>
                    </Row>
                </div>
            </div>

            {/* Approve Modal */}
            <Modal show={showApproveModal} onHide={() => setShowApproveModal(false)} centered>
                <Modal.Header closeButton>
                    <Modal.Title>Transferi Onayla</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <p>
                        <strong>{transfer.transfer_number}</strong> numaralı stok transferini onaylamak istediğinizden emin misiniz?
                    </p>
                    <Alert variant="info">
                        <i className="ri-information-line me-1"></i>
                        Onaylandıktan sonra transfer gönderme aşamasına geçecektir.
                    </Alert>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowApproveModal(false)}>
                        İptal
                    </Button>
                    <Button variant="success" onClick={handleApprove}>
                        <i className="ri-check-line me-1"></i>
                        Onayla
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* Ship Modal */}
            <Modal show={showShipModal} onHide={() => setShowShipModal(false)} centered>
                <Modal.Header closeButton>
                    <Modal.Title>Transferi Gönder</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form.Group className="mb-3">
                        <Form.Label>Takip Numarası</Form.Label>
                        <Form.Control
                            type="text"
                            value={shipData.tracking_number}
                            onChange={(e) => setShipData({...shipData, tracking_number: e.target.value})}
                            placeholder="Kargo takip numarası girin"
                        />
                    </Form.Group>
                    <Form.Group className="mb-3">
                        <Form.Label>Kargo Firması</Form.Label>
                        <Form.Control
                            type="text"
                            value={shipData.carrier}
                            onChange={(e) => setShipData({...shipData, carrier: e.target.value})}
                            placeholder="Kargo firması adı"
                        />
                    </Form.Group>
                    <Form.Group className="mb-3">
                        <Form.Label>Gönderim Notları</Form.Label>
                        <Form.Control
                            as="textarea"
                            rows={3}
                            value={shipData.notes}
                            onChange={(e) => setShipData({...shipData, notes: e.target.value})}
                            placeholder="Gönderim hakkında ek bilgiler..."
                        />
                    </Form.Group>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowShipModal(false)}>
                        İptal
                    </Button>
                    <Button variant="info" onClick={handleShip}>
                        <i className="ri-truck-line me-1"></i>
                        Gönder
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* Receive Modal */}
            <Modal show={showReceiveModal} onHide={() => setShowReceiveModal(false)} size="lg" centered>
                <Modal.Header closeButton>
                    <Modal.Title>Transferi Teslim Al</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Alert variant="info">
                        Her ürün için alınan miktarı kontrol edin. Eksik veya fazla alınan ürünler kayıt altına alınacaktır.
                    </Alert>
                    
                    <div className="table-responsive">
                        <Table size="sm">
                            <thead>
                                <tr>
                                    <th>Ürün</th>
                                    <th className="text-center">Gönderilen</th>
                                    <th className="text-center">Alınan Miktar</th>
                                </tr>
                            </thead>
                            <tbody>
                                {transfer.items.map((item, index) => (
                                    <tr key={item.id}>
                                        <td>
                                            <div>
                                                <div className="fw-medium">{item.product.name}</div>
                                                <small className="text-muted">{item.product.code}</small>
                                            </div>
                                        </td>
                                        <td className="text-center">
                                            <Badge bg="info">{item.transferred_quantity} {item.product.unit_name}</Badge>
                                        </td>
                                        <td className="text-center">
                                            <Form.Control
                                                type="number"
                                                size="sm"
                                                value={receiveData.items[index]?.received_quantity || 0}
                                                onChange={(e) => updateReceivedQuantity(item.id, parseInt(e.target.value) || 0)}
                                                min="0"
                                                max={item.transferred_quantity}
                                                style={{ width: '100px', margin: '0 auto' }}
                                            />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
                    </div>

                    <Form.Group className="mt-3">
                        <Form.Label>Teslim Alma Notları</Form.Label>
                        <Form.Control
                            as="textarea"
                            rows={3}
                            value={receiveData.notes}
                            onChange={(e) => setReceiveData({...receiveData, notes: e.target.value})}
                            placeholder="Teslim alma sırasında gözlemlenen durumlar..."
                        />
                    </Form.Group>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowReceiveModal(false)}>
                        İptal
                    </Button>
                    <Button variant="primary" onClick={handleReceive}>
                        <i className="ri-inbox-line me-1"></i>
                        Teslim Al
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* Cancel Modal */}
            <Modal show={showCancelModal} onHide={() => setShowCancelModal(false)} centered>
                <Modal.Header closeButton>
                    <Modal.Title>Transferi İptal Et</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Alert variant="warning">
                        <i className="ri-alert-line me-1"></i>
                        Bu işlem geri alınamaz! Transfer iptal edildikten sonra tekrar aktif hale getirilemez.
                    </Alert>
                    <Form.Group>
                        <Form.Label>İptal Sebebi *</Form.Label>
                        <Form.Control
                            as="textarea"
                            rows={3}
                            value={cancelReason}
                            onChange={(e) => setCancelReason(e.target.value)}
                            placeholder="Transfer iptal sebebini açıklayın..."
                            required
                        />
                    </Form.Group>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowCancelModal(false)}>
                        Vazgeç
                    </Button>
                    <Button 
                        variant="danger" 
                        onClick={handleCancel}
                        disabled={!cancelReason.trim()}
                    >
                        <i className="ri-close-line me-1"></i>
                        İptal Et
                    </Button>
                </Modal.Footer>
            </Modal>
        </Layout>
    );
}