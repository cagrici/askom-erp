import React, { useState } from 'react';
import { Modal, Table, Badge, Accordion, Card, Row, Col } from 'react-bootstrap';

interface DiscountHistoryItem {
    id: number;
    discount_type: string;
    discount_type_label: string;
    discount_target_name: string;
    discount_percentage: number;
    formatted_discount_percentage: string;
    items_affected: number;
    total_discount_amount: number;
    formatted_total_discount_amount: string;
    applied_by: string;
    applied_at: string;
    applied_items: Array<{
        item_id?: number;
        product_id: number;
        product_name: string;
        product_code: string;
        quantity: number;
        original_unit_price: number;
        discount_percentage: number;
        discount_amount: number;
        line_savings: number;
    }>;
    notes?: string;
}

interface DiscountSummary {
    total_applications: number;
    total_savings: number;
    total_items_affected: number;
    type_breakdown: Array<{
        type: string;
        type_label: string;
        applications: number;
        total_savings: number;
        items_affected: number;
    }>;
    last_applied?: string;
}

interface Props {
    show: boolean;
    onHide: () => void;
    historyData: DiscountHistoryItem[];
    summaryData: DiscountSummary;
}

export default function BulkDiscountHistoryPanel({
    show,
    onHide,
    historyData,
    summaryData
}: Props) {
    const [selectedHistoryItem, setSelectedHistoryItem] = useState<DiscountHistoryItem | null>(null);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('tr-TR', {
            style: 'currency',
            currency: 'TRY',
            minimumFractionDigits: 2,
        }).format(amount);
    };

    const getDiscountTypeBadgeVariant = (type: string) => {
        switch (type) {
            case 'category': return 'primary';
            case 'brand': return 'success';
            case 'supplier': return 'warning';
            default: return 'secondary';
        }
    };

    return (
        <>
        <Modal show={show} onHide={onHide} size="xl">
            <Modal.Header closeButton>
                <Modal.Title>
                    <i className="ri-price-tag-3-line me-2"></i>
                    Toplu İndirim Geçmişi
                </Modal.Title>
            </Modal.Header>
            <Modal.Body>
                {/* Summary Cards */}
                <Row className="mb-4">
                    <Col md={3}>
                        <Card className="border-primary">
                            <Card.Body className="text-center">
                                <div className="fs-4 fw-bold text-primary">{summaryData.total_applications}</div>
                                <div className="text-muted">Toplam Uygulama</div>
                            </Card.Body>
                        </Card>
                    </Col>
                    <Col md={3}>
                        <Card className="border-success">
                            <Card.Body className="text-center">
                                <div className="fs-4 fw-bold text-success">{formatCurrency(summaryData.total_savings)}</div>
                                <div className="text-muted">Toplam Tasarruf</div>
                            </Card.Body>
                        </Card>
                    </Col>
                    <Col md={3}>
                        <Card className="border-info">
                            <Card.Body className="text-center">
                                <div className="fs-4 fw-bold text-info">{summaryData.total_items_affected}</div>
                                <div className="text-muted">Etkilenen Kalem</div>
                            </Card.Body>
                        </Card>
                    </Col>
                    <Col md={3}>
                        <Card className="border-warning">
                            <Card.Body className="text-center">
                                <div className="fs-6 fw-bold text-warning">
                                    {summaryData.last_applied || 'Henüz yok'}
                                </div>
                                <div className="text-muted">Son Uygulama</div>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>

                {/* Type Breakdown */}
                {summaryData.type_breakdown.length > 0 && (
                    <Card className="mb-4">
                        <Card.Header>
                            <h6 className="mb-0">İndirim Türü Dağılımı</h6>
                        </Card.Header>
                        <Card.Body>
                            <Row>
                                {summaryData.type_breakdown.map((typeData) => (
                                    <Col key={typeData.type} md={4}>
                                        <div className="d-flex justify-content-between align-items-center mb-2">
                                            <Badge bg={getDiscountTypeBadgeVariant(typeData.type)}>
                                                {typeData.type_label}
                                            </Badge>
                                            <span className="fw-medium">{typeData.applications} uygulama</span>
                                        </div>
                                        <div className="small text-muted">
                                            Tasarruf: {formatCurrency(typeData.total_savings)}
                                        </div>
                                        <div className="small text-muted">
                                            Etkilenen: {typeData.items_affected} kalem
                                        </div>
                                    </Col>
                                ))}
                            </Row>
                        </Card.Body>
                    </Card>
                )}

                {/* History Table */}
                <Card>
                    <Card.Header>
                        <h6 className="mb-0">İndirim Geçmişi</h6>
                    </Card.Header>
                    <Card.Body className="p-0">
                        {historyData.length === 0 ? (
                            <div className="text-center py-4 text-muted">
                                <i className="ri-history-line fs-1 d-block mb-2"></i>
                                Henüz toplu indirim uygulanmamış
                            </div>
                        ) : (
                            <Table className="mb-0" hover>
                                <thead className="table-light">
                                    <tr>
                                        <th>Tarih</th>
                                        <th>Tür</th>
                                        <th>Hedef</th>
                                        <th>İndirim</th>
                                        <th>Kalem</th>
                                        <th>Tasarruf</th>
                                        <th>Uygulayan</th>
                                        <th>Detay</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {historyData.map((history) => (
                                        <tr key={history.id}>
                                            <td>
                                                <small>{history.applied_at}</small>
                                            </td>
                                            <td>
                                                <Badge bg={getDiscountTypeBadgeVariant(history.discount_type)}>
                                                    {history.discount_type_label}
                                                </Badge>
                                            </td>
                                            <td>
                                                <div className="fw-medium">{history.discount_target_name}</div>
                                            </td>
                                            <td>
                                                <span className="fw-medium text-danger">
                                                    {history.formatted_discount_percentage}
                                                </span>
                                            </td>
                                            <td>
                                                <Badge bg="info">{history.items_affected}</Badge>
                                            </td>
                                            <td>
                                                <span className="fw-medium text-success">
                                                    {history.formatted_total_discount_amount}
                                                </span>
                                            </td>
                                            <td>
                                                <small>{history.applied_by}</small>
                                            </td>
                                            <td>
                                                <button
                                                    className="btn btn-sm btn-outline-primary"
                                                    onClick={() => setSelectedHistoryItem(history)}
                                                >
                                                    <i className="ri-eye-line"></i>
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </Table>
                        )}
                    </Card.Body>
                </Card>
            </Modal.Body>
        </Modal>

        {/* Detail Modal */}
        {selectedHistoryItem && (
            <Modal 
                show={!!selectedHistoryItem} 
                onHide={() => setSelectedHistoryItem(null)}
                size="lg"
            >
                <Modal.Header closeButton>
                    <Modal.Title>
                        İndirim Detayı - {selectedHistoryItem.discount_target_name}
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Row className="mb-3">
                        <Col md={6}>
                            <strong>İndirim Türü:</strong>
                            <div>
                                <Badge bg={getDiscountTypeBadgeVariant(selectedHistoryItem.discount_type)}>
                                    {selectedHistoryItem.discount_type_label}
                                </Badge>
                            </div>
                        </Col>
                        <Col md={6}>
                            <strong>İndirim Oranı:</strong>
                            <div className="text-danger fw-medium">
                                {selectedHistoryItem.formatted_discount_percentage}
                            </div>
                        </Col>
                    </Row>

                    <Row className="mb-3">
                        <Col md={6}>
                            <strong>Uygulama Tarihi:</strong>
                            <div>{selectedHistoryItem.applied_at}</div>
                        </Col>
                        <Col md={6}>
                            <strong>Uygulayan:</strong>
                            <div>{selectedHistoryItem.applied_by}</div>
                        </Col>
                    </Row>

                    {selectedHistoryItem.notes && (
                        <Row className="mb-3">
                            <Col>
                                <strong>Notlar:</strong>
                                <div className="mt-1 p-2 bg-light rounded">
                                    {selectedHistoryItem.notes}
                                </div>
                            </Col>
                        </Row>
                    )}

                    <div className="mb-3">
                        <strong>Etkilenen Ürünler:</strong>
                    </div>

                    <Table size="sm" striped>
                        <thead>
                            <tr>
                                <th>Ürün</th>
                                <th>Miktar</th>
                                <th>Orijinal Fiyat</th>
                                <th>İndirim</th>
                                <th>Tasarruf</th>
                            </tr>
                        </thead>
                        <tbody>
                            {selectedHistoryItem.applied_items.map((item, index) => (
                                <tr key={index}>
                                    <td>
                                        <div className="fw-medium">{item.product_name}</div>
                                        <small className="text-muted">{item.product_code}</small>
                                    </td>
                                    <td>{item.quantity}</td>
                                    <td>{formatCurrency(item.original_unit_price)}</td>
                                    <td>
                                        <span className="text-danger">
                                            %{item.discount_percentage.toFixed(2)}
                                        </span>
                                    </td>
                                    <td>
                                        <span className="text-success fw-medium">
                                            {formatCurrency(item.line_savings)}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot>
                            <tr className="table-warning">
                                <td colSpan={4} className="fw-bold">Toplam Tasarruf:</td>
                                <td className="fw-bold text-success">
                                    {selectedHistoryItem.formatted_total_discount_amount}
                                </td>
                            </tr>
                        </tfoot>
                    </Table>
                </Modal.Body>
            </Modal>
        )}
        </>
    );
}