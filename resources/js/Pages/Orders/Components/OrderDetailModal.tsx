import React from 'react';
import { Modal, Button, Table, Row, Col, Card, Badge, Spinner } from 'react-bootstrap';
import moment from 'moment';
import { useTranslation } from 'react-i18next';

interface OrderItem {
    id: number;
    order_m_id: number;
    item_id: number;
    item_name: string;
    item_code: string;
    qty: number;
    unit_name: string;
    unit_price: number;
    amt: number;
}

interface OrderDetail {
    id: number;
    doc_no: string;
    doc_date: string;
    entity_id: number;
    co_id: number;
    order_status: number;
    amt: number;
    amt_vat: number;
    entity?: {
        id: number;
        entity_name: string;
        entity_code: string;
    };
    company?: {
        id: number;
        co_desc: string;
        co_code: string;
    };
    contract?: {
        id: number;
        doc_no: string;
        amt: number;
        remaining_amount: number;
    };
    items?: OrderItem[];
    address1?: string;
    shipping_date?: string;
    note3?: string;
}

interface OrderDetailModalProps {
    show: boolean;
    order: OrderDetail | null;
    loading: boolean;
    onHide: () => void;
}

const OrderDetailModal: React.FC<OrderDetailModalProps> = ({ show, order, loading, onHide }) => {
    const { t } = useTranslation();

    const formatCurrency = (amount: number | string | undefined, symbol = '₺') => {
        if (!amount) return `${symbol}0.00`;

        return `${symbol}${parseFloat(amount.toString()).toLocaleString('tr-TR', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        })}`;
    };

    const getStatusBadge = (status: number | undefined) => {
        if (status === undefined) return null;

        const statusMap: { [key: number]: { variant: string; text: string } } = {
            0: { variant: 'secondary', text: t('New') },
            1: { variant: 'primary', text: t('Processing') },
            2: { variant: 'info', text: t('Shipped') },
            3: { variant: 'success', text: t('Delivered') },
            4: { variant: 'danger', text: t('Canceled') },
            5: { variant: 'warning', text: t('OnHold') }
        };

        const statusInfo = statusMap[status] || { variant: 'secondary', text: t('Unknown') };

        return (
            <Badge bg={statusInfo.variant}>
                {statusInfo.text}
            </Badge>
        );
    };

    if (!show) return null;

    if (loading || !order) {
        return (
            <Modal show={show} onHide={onHide} size="lg">
                <Modal.Header closeButton>
                    <Modal.Title>{t('OrderDetails')}</Modal.Title>
                </Modal.Header>
                <Modal.Body className="text-center py-5">
                    <Spinner animation="border" role="status">
                        <span className="visually-hidden">{t('Loading')}</span>
                    </Spinner>
                    <p className="mt-3">{t('LoadingOrderDetails')}</p>
                </Modal.Body>
            </Modal>
        );
    }

    return (
        <Modal show={show} onHide={onHide} size="xl" dialogClassName="modal-90w">
            <Modal.Header closeButton>
                <Modal.Title>
                    {t('OrderNumber')} #{order.doc_no}
                    <span className="mx-2">|</span>
                    {getStatusBadge(order.order_status)}
                </Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Row className="mb-4">
                    <Col md={6}>
                        <Card>
                            <Card.Header>{t('OrderInformation')}</Card.Header>
                            <Card.Body>
                                <Row className="mb-2">
                                    <Col md={4} className="fw-bold">{t('OrderNumber')}:</Col>
                                    <Col md={8}>{order.doc_no}</Col>
                                </Row>
                                <Row className="mb-2">
                                    <Col md={4} className="fw-bold">{t('OrderDate')}:</Col>
                                    <Col md={8}>{moment(order.doc_date).format('DD.MM.YYYY')}</Col>
                                </Row>
                                <Row className="mb-2">
                                    <Col md={4} className="fw-bold">{t('ShippingDate')}:</Col>
                                    <Col md={8}>
                                        {order.shipping_date
                                            ? moment(order.shipping_date).format('DD.MM.YYYY')
                                            : t('NotSpecified')}
                                    </Col>
                                </Row>
                                <Row className="mb-2">
                                    <Col md={4} className="fw-bold">{t('Status')}:</Col>
                                    <Col md={8}>{getStatusBadge(order.order_status)}</Col>
                                </Row>
                                <Row className="mb-2">
                                    <Col md={4} className="fw-bold">{t('Company')}:</Col>
                                    <Col md={8}>{order.company?.co_desc || '-'}</Col>
                                </Row>
                                {order.note3 && (
                                    <Row className="mb-2">
                                        <Col md={4} className="fw-bold">{t('Notes')}:</Col>
                                        <Col md={8}>{order.note3}</Col>
                                    </Row>
                                )}
                            </Card.Body>
                        </Card>
                    </Col>
                    <Col md={6}>
                        <Card>
                            <Card.Header>{t('CustomerInformation')}</Card.Header>
                            <Card.Body>
                                <Row className="mb-2">
                                    <Col md={4} className="fw-bold">{t('Customer')}:</Col>
                                    <Col md={8}>{order.entity?.entity_name || '-'}</Col>
                                </Row>
                                <Row className="mb-2">
                                    <Col md={4} className="fw-bold">{t('CustomerCode')}:</Col>
                                    <Col md={8}>{order.entity?.entity_code || '-'}</Col>
                                </Row>
                                <Row className="mb-2">
                                    <Col md={4} className="fw-bold">{t('Address')}:</Col>
                                    <Col md={8}>{order.address1 || '-'}</Col>
                                </Row>
                                {order.contract && (
                                    <>
                                        <Row className="mb-2">
                                            <Col md={4} className="fw-bold">{t('ContractNumber')}:</Col>
                                            <Col md={8}>{order.contract.doc_no}</Col>
                                        </Row>
                                        <Row className="mb-2">
                                            <Col md={4} className="fw-bold">{t('ContractAmount')}:</Col>
                                            <Col md={8}>{formatCurrency(order.contract.amt)}</Col>
                                        </Row>
                                        <Row className="mb-2">
                                            <Col md={4} className="fw-bold">{t('RemainingAmount')}:</Col>
                                            <Col md={8}>{formatCurrency(order.contract.remaining_amount)}</Col>
                                        </Row>
                                    </>
                                )}
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>

                <Card className="mb-3">
                    <Card.Header>{t('OrderItems')}</Card.Header>
                    <Card.Body>
                        <div className="table-responsive">
                            <Table striped bordered hover>
                                <thead>
                                <tr>
                                    <th>#</th>
                                    <th>{t('ProductCode')}</th>
                                    <th>{t('ProductName')}</th>
                                    <th>{t('Quantity')}</th>
                                    <th>{t('Unit')}</th>
                                    <th>{t('UnitPrice')}</th>
                                    <th>{t('Total')}</th>
                                </tr>
                                </thead>
                                <tbody>
                                {order.items && order.items.length > 0 ? (
                                    order.items.map((item, index) => (
                                        <tr key={item.id}>
                                            <td>{index + 1}</td>
                                            <td>{item.item_code}</td>
                                            <td>{item.item_name}</td>
                                            <td>{item.qty}</td>
                                            <td>{item.unit_name}</td>
                                            <td>{formatCurrency(item.unit_price)}</td>
                                            <td>{formatCurrency(item.amt)}</td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={7} className="text-center">{t('NoItemsFound')}</td>
                                    </tr>
                                )}
                                </tbody>
                                <tfoot>
                                <tr>
                                    <td colSpan={6} className="text-end fw-bold">{t('Subtotal')}:</td>
                                    <td>{formatCurrency(order.amt)}</td>
                                </tr>
                                <tr>
                                    <td colSpan={6} className="text-end fw-bold">{t('VAT')}:</td>
                                    <td>{formatCurrency(order.amt_vat)}</td>
                                </tr>
                                <tr>
                                    <td colSpan={6} className="text-end fw-bold">{t('Total')}:</td>
                                    <td className="fw-bold">{formatCurrency(parseFloat(order.amt.toString()) + parseFloat(order.amt_vat.toString()))}</td>
                                </tr>
                                </tfoot>
                            </Table>
                        </div>
                    </Card.Body>
                </Card>
            </Modal.Body>
            <Modal.Footer>
                <Button variant="primary" onClick={() => window.print()} className="me-2">
                    <i className="ri-printer-line me-1"></i> {t('Print')}
                </Button>
                <Button variant="secondary" onClick={onHide}>
                    {t('Close')}
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

export default OrderDetailModal;
