import React, { useState, useRef, useEffect } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { Card, Table, Button, Row, Col, Form, Badge, Alert, ProgressBar, Modal, InputGroup } from 'react-bootstrap';
import Layout from '@/Layouts';

interface Customer {
    id: number;
    name: string;
    title?: string;
}

interface SalesOrder {
    id: number;
    order_number: string;
    customer?: Customer;
}

interface ShippingOrder {
    id: number;
    shipping_number: string;
    sales_order?: SalesOrder;
    priority: string;
    priority_label: string;
}

interface User {
    id: number;
    name: string;
}

interface Product {
    id: number;
    name: string;
    code: string;
    barcode?: string;
}

interface PickingTaskItem {
    id: number;
    product_id: number;
    product?: Product;
    required_quantity: number;
    picked_quantity: number;
    remaining_quantity: number;
    status: string;
    status_label: string;
    corridor?: string;
    shelf?: string;
    bin_location?: string;
}

interface PickingScan {
    id: number;
    barcode: string;
    quantity: number;
    scan_result: string;
    scan_result_label: string;
    error_message?: string;
    created_at: string;
}

interface PickingTask {
    id: number;
    task_number: string;
    shipping_order_id: number;
    shipping_order?: ShippingOrder;
    assigned_to_id: number;
    assigned_to?: User;
    assigned_by?: User;
    status: string;
    status_label: string;
    started_at?: string;
    completed_at?: string;
    total_items: number;
    picked_items: number;
    notes?: string;
    created_at: string;
    items?: PickingTaskItem[];
    scans?: PickingScan[];
}

interface ItemsByCorridor {
    [corridor: string]: PickingTaskItem[];
}

interface Props {
    pickingTask: PickingTask;
    itemsByCorridor: ItemsByCorridor;
    canStart: boolean;
    canComplete: boolean;
    isOwner: boolean;
}

const getStatusBadgeVariant = (status: string): string => {
    const variants: Record<string, string> = {
        assigned: 'warning',
        in_progress: 'primary',
        completed: 'success',
        cancelled: 'danger',
        pending: 'secondary',
        partial: 'info',
        skipped: 'dark',
    };
    return variants[status] || 'secondary';
};

const getScanResultBadgeVariant = (result: string): string => {
    const variants: Record<string, string> = {
        success: 'success',
        wrong_product: 'danger',
        wrong_order: 'warning',
        not_found: 'dark',
    };
    return variants[result] || 'secondary';
};

export default function Show({
    pickingTask,
    itemsByCorridor,
    canStart,
    canComplete,
    isOwner,
}: Props) {
    const [barcode, setBarcode] = useState('');
    const [quantity, setQuantity] = useState(1);
    const [scanning, setScanning] = useState(false);
    const [scanResult, setScanResult] = useState<any>(null);
    const [selectedItemId, setSelectedItemId] = useState<number | null>(null);
    const [showCompleteModal, setShowCompleteModal] = useState(false);
    const [showSkipModal, setShowSkipModal] = useState(false);
    const [itemToSkip, setItemToSkip] = useState<PickingTaskItem | null>(null);
    const [skipReason, setSkipReason] = useState('');
    const barcodeInputRef = useRef<HTMLInputElement>(null);

    // Auto-focus barcode input when task is in progress
    useEffect(() => {
        if (pickingTask.status === 'in_progress' && barcodeInputRef.current) {
            barcodeInputRef.current.focus();
        }
    }, [pickingTask.status]);

    const handleStart = () => {
        router.post(route('warehouse.picking-tasks.start', pickingTask.id), {}, {
            preserveScroll: true,
        });
    };

    const handleComplete = () => {
        router.post(route('warehouse.picking-tasks.complete', pickingTask.id), {}, {
            onSuccess: () => setShowCompleteModal(false),
        });
    };

    const handleScan = async () => {
        if (!barcode.trim() || scanning) return;

        setScanning(true);
        setScanResult(null);

        try {
            const response = await fetch(route('warehouse.picking-tasks.scan', pickingTask.id), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
                body: JSON.stringify({
                    barcode: barcode.trim(),
                    quantity,
                    picking_task_item_id: selectedItemId,
                }),
            });

            const result = await response.json();
            setScanResult(result);

            if (result.success) {
                // Clear barcode and reset quantity
                setBarcode('');
                setQuantity(1);
                setSelectedItemId(null);

                // Refresh page to update data
                router.reload({ only: ['pickingTask', 'itemsByCorridor'] });
            }

            // Focus back to barcode input
            setTimeout(() => {
                barcodeInputRef.current?.focus();
            }, 100);
        } catch (error) {
            setScanResult({
                success: false,
                error: 'Tarama sirasinda hata olustu',
                scan_result: 'error',
            });
        } finally {
            setScanning(false);
        }
    };

    const handleSkipItem = (item: PickingTaskItem) => {
        setItemToSkip(item);
        setSkipReason('');
        setShowSkipModal(true);
    };

    const confirmSkip = async () => {
        if (!itemToSkip) return;

        try {
            await fetch(route('warehouse.picking-tasks.items.skip', [pickingTask.id, itemToSkip.id]), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
                body: JSON.stringify({ reason: skipReason }),
            });

            setShowSkipModal(false);
            setItemToSkip(null);
            router.reload({ only: ['pickingTask', 'itemsByCorridor'] });
        } catch (error) {
            console.error('Skip error:', error);
        }
    };

    const handleBarcodeKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleScan();
        }
    };

    const formatDateTime = (dateString?: string) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleString('tr-TR');
    };

    const progressPercent = pickingTask.total_items > 0
        ? Math.round((pickingTask.picked_items / pickingTask.total_items) * 100)
        : 0;

    const pendingItemsCount = Object.values(itemsByCorridor)
        .flat()
        .filter(item => item.status === 'pending' || item.status === 'in_progress')
        .length;

    return (
        <Layout>
            <Head title={`Toplama - ${pickingTask.task_number}`} />
            <div className="page-content">
            <div className="container-fluid py-4">
                {/* Header */}
                <div className="d-flex justify-content-between align-items-start mb-4">
                    <div>
                        <Link
                            href={route('warehouse.picking-tasks.index')}
                            className="text-muted text-decoration-none mb-2 d-inline-block"
                        >
                            <i className="ri-arrow-left-line me-1"></i>
                            Toplama Gorevlerine Don
                        </Link>
                        <h4 className="mb-1">
                            {pickingTask.task_number}
                            <Badge
                                bg={getStatusBadgeVariant(pickingTask.status)}
                                className="ms-2"
                            >
                                {pickingTask.status_label}
                            </Badge>
                        </h4>
                        <p className="text-muted mb-0">
                            Sevk: {pickingTask.shipping_order?.shipping_number} |
                            Musteri: {pickingTask.shipping_order?.sales_order?.customer?.name || pickingTask.shipping_order?.sales_order?.customer?.title}
                        </p>
                    </div>
                    <div className="d-flex gap-2">
                        {canStart && (
                            <Button variant="success" size="lg" onClick={handleStart}>
                                <i className="ri-play-line me-1"></i>
                                Basla
                            </Button>
                        )}
                        {canComplete && pendingItemsCount === 0 && (
                            <Button variant="success" onClick={() => setShowCompleteModal(true)}>
                                <i className="ri-checkbox-circle-line me-1"></i>
                                Tamamla
                            </Button>
                        )}
                        <Link
                            href={route('warehouse.picking-tasks.pdf', pickingTask.id)}
                            className="btn btn-outline-secondary"
                            target="_blank"
                        >
                            <i className="ri-printer-line me-1"></i>
                            Yazdir
                        </Link>
                    </div>
                </div>

                <Row>
                    {/* Left Column - Barcode Scanner & Items */}
                    <Col lg={8}>
                        {/* Barcode Scanner */}
                        {pickingTask.status === 'in_progress' && isOwner && (
                            <Card className="border-0 shadow-sm mb-4 border-primary" style={{ borderWidth: '2px' }}>
                                <Card.Header className="bg-primary text-white">
                                    <h5 className="mb-0">
                                        <i className="ri-barcode-line me-2"></i>
                                        Barkod Okuyucu
                                    </h5>
                                </Card.Header>
                                <Card.Body>
                                    <Row className="align-items-end">
                                        <Col md={6}>
                                            <Form.Label>Barkod</Form.Label>
                                            <InputGroup size="lg">
                                                <InputGroup.Text>
                                                    <i className="ri-barcode-line"></i>
                                                </InputGroup.Text>
                                                <Form.Control
                                                    ref={barcodeInputRef}
                                                    type="text"
                                                    value={barcode}
                                                    onChange={(e) => setBarcode(e.target.value)}
                                                    onKeyPress={handleBarcodeKeyPress}
                                                    placeholder="Barkodu okutun veya yazin..."
                                                    autoFocus
                                                    disabled={scanning}
                                                />
                                            </InputGroup>
                                        </Col>
                                        <Col md={3}>
                                            <Form.Label>Miktar</Form.Label>
                                            <Form.Control
                                                type="number"
                                                size="lg"
                                                min="0.001"
                                                step="1"
                                                value={quantity}
                                                onChange={(e) => setQuantity(parseFloat(e.target.value) || 1)}
                                                disabled={scanning}
                                            />
                                        </Col>
                                        <Col md={3}>
                                            <Button
                                                variant="primary"
                                                size="lg"
                                                className="w-100"
                                                onClick={handleScan}
                                                disabled={!barcode.trim() || scanning}
                                            >
                                                {scanning ? (
                                                    <span className="spinner-border spinner-border-sm"></span>
                                                ) : (
                                                    <>
                                                        <i className="ri-send-plane-line me-1"></i>
                                                        Oku
                                                    </>
                                                )}
                                            </Button>
                                        </Col>
                                    </Row>

                                    {/* Scan Result */}
                                    {scanResult && (
                                        <Alert
                                            variant={scanResult.success ? 'success' : 'danger'}
                                            className="mt-3 mb-0"
                                            dismissible
                                            onClose={() => setScanResult(null)}
                                        >
                                            <i className={`ri-${scanResult.success ? 'checkbox-circle' : 'error-warning'}-line me-2`}></i>
                                            {scanResult.message || scanResult.error}
                                            {scanResult.product && (
                                                <div className="mt-2">
                                                    <strong>{scanResult.product.code}</strong> - {scanResult.product.name}
                                                    {scanResult.picking_task_item && (
                                                        <span className="ms-2">
                                                            ({scanResult.picking_task_item.picked_quantity} / {scanResult.picking_task_item.required_quantity})
                                                        </span>
                                                    )}
                                                </div>
                                            )}
                                        </Alert>
                                    )}
                                </Card.Body>
                            </Card>
                        )}

                        {/* Progress */}
                        <Card className="border-0 shadow-sm mb-4">
                            <Card.Body>
                                <div className="d-flex justify-content-between align-items-center mb-2">
                                    <span className="fw-bold">Ilerleme</span>
                                    <span>{progressPercent}% ({pickingTask.picked_items}/{pickingTask.total_items})</span>
                                </div>
                                <ProgressBar
                                    now={progressPercent}
                                    variant={progressPercent === 100 ? 'success' : 'primary'}
                                    style={{ height: '15px' }}
                                    animated={pickingTask.status === 'in_progress'}
                                />
                            </Card.Body>
                        </Card>

                        {/* Items by Corridor */}
                        {Object.entries(itemsByCorridor).map(([corridor, items]) => (
                            <Card key={corridor} className="border-0 shadow-sm mb-4">
                                <Card.Header className="bg-light">
                                    <h6 className="mb-0">
                                        <i className="ri-map-pin-line me-2"></i>
                                        Koridor: {corridor || 'Belirtilmemis'}
                                        <Badge bg="secondary" className="ms-2">{items.length} kalem</Badge>
                                    </h6>
                                </Card.Header>
                                <Card.Body className="p-0">
                                    <Table responsive hover className="mb-0">
                                        <thead className="bg-light">
                                            <tr>
                                                <th>Konum</th>
                                                <th>Urun</th>
                                                <th className="text-center">Gereken</th>
                                                <th className="text-center">Toplanan</th>
                                                <th className="text-center">Durum</th>
                                                <th></th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {items.map((item) => (
                                                <tr
                                                    key={item.id}
                                                    className={
                                                        item.status === 'completed' ? 'table-success' :
                                                        item.status === 'skipped' ? 'table-secondary' :
                                                        selectedItemId === item.id ? 'table-primary' : ''
                                                    }
                                                >
                                                    <td>
                                                        <code>
                                                            {item.shelf && `R:${item.shelf}`}
                                                            {item.bin_location && ` / ${item.bin_location}`}
                                                            {!item.shelf && !item.bin_location && '-'}
                                                        </code>
                                                    </td>
                                                    <td>
                                                        <div className="fw-bold">{item.product?.code}</div>
                                                        <small className="text-muted">{item.product?.name}</small>
                                                        {item.product?.barcode && (
                                                            <div>
                                                                <small className="text-info">
                                                                    <i className="ri-barcode-line me-1"></i>
                                                                    {item.product.barcode}
                                                                </small>
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className="text-center fw-bold fs-5">
                                                        {item.required_quantity}
                                                    </td>
                                                    <td className="text-center fs-5">
                                                        <span className={item.picked_quantity >= item.required_quantity ? 'text-success fw-bold' : ''}>
                                                            {item.picked_quantity}
                                                        </span>
                                                    </td>
                                                    <td className="text-center">
                                                        <Badge bg={getStatusBadgeVariant(item.status)}>
                                                            {item.status_label}
                                                        </Badge>
                                                    </td>
                                                    <td className="text-end">
                                                        {pickingTask.status === 'in_progress' && isOwner && (
                                                            <div className="btn-group btn-group-sm">
                                                                {item.status !== 'completed' && item.status !== 'skipped' && (
                                                                    <>
                                                                        <Button
                                                                            variant={selectedItemId === item.id ? 'primary' : 'outline-primary'}
                                                                            onClick={() => setSelectedItemId(selectedItemId === item.id ? null : item.id)}
                                                                            title="Bu urunu tara"
                                                                        >
                                                                            <i className="ri-focus-3-line"></i>
                                                                        </Button>
                                                                        <Button
                                                                            variant="outline-secondary"
                                                                            onClick={() => handleSkipItem(item)}
                                                                            title="Atla"
                                                                        >
                                                                            <i className="ri-skip-forward-line"></i>
                                                                        </Button>
                                                                    </>
                                                                )}
                                                            </div>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </Table>
                                </Card.Body>
                            </Card>
                        ))}
                    </Col>

                    {/* Right Column - Info & Recent Scans */}
                    <Col lg={4}>
                        {/* Task Info */}
                        <Card className="border-0 shadow-sm mb-4">
                            <Card.Header className="bg-white">
                                <h6 className="mb-0">Gorev Bilgileri</h6>
                            </Card.Header>
                            <Card.Body>
                                <dl className="row mb-0">
                                    <dt className="col-5">Atanan:</dt>
                                    <dd className="col-7">{pickingTask.assigned_to?.name}</dd>

                                    <dt className="col-5">Atayan:</dt>
                                    <dd className="col-7">{pickingTask.assigned_by?.name}</dd>

                                    <dt className="col-5">Olusturma:</dt>
                                    <dd className="col-7">{formatDateTime(pickingTask.created_at)}</dd>

                                    {pickingTask.started_at && (
                                        <>
                                            <dt className="col-5">Baslama:</dt>
                                            <dd className="col-7">{formatDateTime(pickingTask.started_at)}</dd>
                                        </>
                                    )}

                                    {pickingTask.completed_at && (
                                        <>
                                            <dt className="col-5">Bitis:</dt>
                                            <dd className="col-7">{formatDateTime(pickingTask.completed_at)}</dd>
                                        </>
                                    )}
                                </dl>
                            </Card.Body>
                        </Card>

                        {/* Recent Scans */}
                        {pickingTask.scans && pickingTask.scans.length > 0 && (
                            <Card className="border-0 shadow-sm mb-4">
                                <Card.Header className="bg-white">
                                    <h6 className="mb-0">Son Taramalar</h6>
                                </Card.Header>
                                <Card.Body className="p-0">
                                    <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                                        {pickingTask.scans.map((scan) => (
                                            <div
                                                key={scan.id}
                                                className={`p-2 border-bottom ${scan.scan_result !== 'success' ? 'bg-danger bg-opacity-10' : ''}`}
                                            >
                                                <div className="d-flex justify-content-between align-items-start">
                                                    <div>
                                                        <code className="fw-bold">{scan.barcode}</code>
                                                        <span className="ms-2 badge bg-light text-dark">x{scan.quantity}</span>
                                                    </div>
                                                    <Badge bg={getScanResultBadgeVariant(scan.scan_result)} size="sm">
                                                        {scan.scan_result_label}
                                                    </Badge>
                                                </div>
                                                {scan.error_message && (
                                                    <small className="text-danger">{scan.error_message}</small>
                                                )}
                                                <div>
                                                    <small className="text-muted">
                                                        {formatDateTime(scan.created_at)}
                                                    </small>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </Card.Body>
                            </Card>
                        )}

                        {/* Notes */}
                        {pickingTask.notes && (
                            <Card className="border-0 shadow-sm mb-4">
                                <Card.Header className="bg-white">
                                    <h6 className="mb-0">Notlar</h6>
                                </Card.Header>
                                <Card.Body>
                                    <p className="mb-0">{pickingTask.notes}</p>
                                </Card.Body>
                            </Card>
                        )}

                        {/* Keyboard Shortcuts */}
                        {pickingTask.status === 'in_progress' && (
                            <Card className="border-0 shadow-sm bg-light">
                                <Card.Body>
                                    <h6 className="mb-2">
                                        <i className="ri-keyboard-line me-1"></i>
                                        Kisayollar
                                    </h6>
                                    <small className="d-block text-muted">
                                        <kbd>Enter</kbd> - Barkodu oku
                                    </small>
                                </Card.Body>
                            </Card>
                        )}
                    </Col>
                </Row>
            </div>
</div>
            {/* Complete Modal */}
            <Modal show={showCompleteModal} onHide={() => setShowCompleteModal(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>Gorevi Tamamla</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Alert variant="success">
                        <i className="ri-checkbox-circle-line me-2"></i>
                        Tum kalemler toplandi. Gorev tamamlanacak.
                    </Alert>
                    <p>
                        <strong>Toplam:</strong> {pickingTask.picked_items} / {pickingTask.total_items} kalem
                    </p>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowCompleteModal(false)}>
                        Vazgec
                    </Button>
                    <Button variant="success" onClick={handleComplete}>
                        <i className="ri-checkbox-circle-line me-1"></i>
                        Tamamla
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* Skip Modal */}
            <Modal show={showSkipModal} onHide={() => setShowSkipModal(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>Kalemi Atla</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {itemToSkip && (
                        <>
                            <Alert variant="warning">
                                <i className="ri-error-warning-line me-2"></i>
                                Bu kalem atlanacak ve toplama listesinden cikarilacak.
                            </Alert>
                            <p>
                                <strong>Urun:</strong> {itemToSkip.product?.code} - {itemToSkip.product?.name}
                            </p>
                            <p>
                                <strong>Miktar:</strong> {itemToSkip.required_quantity - itemToSkip.picked_quantity} (kalan)
                            </p>
                            <Form.Group>
                                <Form.Label>Neden (opsiyonel)</Form.Label>
                                <Form.Control
                                    as="textarea"
                                    rows={2}
                                    value={skipReason}
                                    onChange={(e) => setSkipReason(e.target.value)}
                                    placeholder="Atlama nedenini yazin..."
                                />
                            </Form.Group>
                        </>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowSkipModal(false)}>
                        Vazgec
                    </Button>
                    <Button variant="warning" onClick={confirmSkip}>
                        <i className="ri-skip-forward-line me-1"></i>
                        Atla
                    </Button>
                </Modal.Footer>
            </Modal>
        </Layout>
    );
}
