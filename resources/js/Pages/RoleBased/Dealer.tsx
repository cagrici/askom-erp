import React from 'react';
import Layout from '@/Layouts';
import { Head } from '@inertiajs/react';
import { Container, Row, Col, Card } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';

interface Stats {
    available_products: number;
    pending_orders: number;
    completed_orders: number;
    account_balance: number;
}

interface DealerProps {
    title: string;
    welcomeMessage: string;
    stats: Stats;
    availableProducts: any[];
    orderHistory: any[];
}

const Dealer: React.FC<DealerProps> = ({ 
    title, 
    welcomeMessage, 
    stats, 
    availableProducts, 
    orderHistory 
}) => {
    const { t } = useTranslation();

    return (
        <Layout>
            <Head title={title} />
            
            <Container fluid>
                <div className="page-title-box d-sm-flex align-items-center justify-content-between">
                    <h4 className="mb-sm-0">{title}</h4>
                </div>

                <Row>
                    <Col lg={12}>
                        <div className="alert alert-warning" role="alert">
                            <strong>{welcomeMessage}</strong>
                        </div>
                    </Col>
                </Row>

                <Row>
                    <Col md={3}>
                        <Card className="card-animate">
                            <Card.Body>
                                <div className="d-flex align-items-center">
                                    <div className="flex-grow-1 overflow-hidden">
                                        <p className="text-uppercase fw-medium text-muted text-truncate mb-0">
                                            {t('Available Products')}
                                        </p>
                                    </div>
                                </div>
                                <div className="d-flex align-items-end justify-content-between mt-4">
                                    <div>
                                        <h4 className="fs-22 fw-semibold ff-secondary mb-4">
                                            <span className="counter-value">{stats.available_products}</span>
                                        </h4>
                                    </div>
                                    <div className="avatar-sm flex-shrink-0">
                                        <span className="avatar-title bg-success-subtle rounded fs-3">
                                            <i className="bx bx-package text-success"></i>
                                        </span>
                                    </div>
                                </div>
                            </Card.Body>
                        </Card>
                    </Col>

                    <Col md={3}>
                        <Card className="card-animate">
                            <Card.Body>
                                <div className="d-flex align-items-center">
                                    <div className="flex-grow-1 overflow-hidden">
                                        <p className="text-uppercase fw-medium text-muted text-truncate mb-0">
                                            {t('Pending Orders')}
                                        </p>
                                    </div>
                                </div>
                                <div className="d-flex align-items-end justify-content-between mt-4">
                                    <div>
                                        <h4 className="fs-22 fw-semibold ff-secondary mb-4">
                                            <span className="counter-value">{stats.pending_orders}</span>
                                        </h4>
                                    </div>
                                    <div className="avatar-sm flex-shrink-0">
                                        <span className="avatar-title bg-warning-subtle rounded fs-3">
                                            <i className="bx bx-time-five text-warning"></i>
                                        </span>
                                    </div>
                                </div>
                            </Card.Body>
                        </Card>
                    </Col>

                    <Col md={3}>
                        <Card className="card-animate">
                            <Card.Body>
                                <div className="d-flex align-items-center">
                                    <div className="flex-grow-1 overflow-hidden">
                                        <p className="text-uppercase fw-medium text-muted text-truncate mb-0">
                                            {t('Completed Orders')}
                                        </p>
                                    </div>
                                </div>
                                <div className="d-flex align-items-end justify-content-between mt-4">
                                    <div>
                                        <h4 className="fs-22 fw-semibold ff-secondary mb-4">
                                            <span className="counter-value">{stats.completed_orders}</span>
                                        </h4>
                                    </div>
                                    <div className="avatar-sm flex-shrink-0">
                                        <span className="avatar-title bg-info-subtle rounded fs-3">
                                            <i className="bx bx-check-circle text-info"></i>
                                        </span>
                                    </div>
                                </div>
                            </Card.Body>
                        </Card>
                    </Col>

                    <Col md={3}>
                        <Card className="card-animate">
                            <Card.Body>
                                <div className="d-flex align-items-center">
                                    <div className="flex-grow-1 overflow-hidden">
                                        <p className="text-uppercase fw-medium text-muted text-truncate mb-0">
                                            {t('Account Balance')}
                                        </p>
                                    </div>
                                </div>
                                <div className="d-flex align-items-end justify-content-between mt-4">
                                    <div>
                                        <h4 className="fs-22 fw-semibold ff-secondary mb-4">
                                            <span className="counter-value">{stats.account_balance}</span>
                                        </h4>
                                    </div>
                                    <div className="avatar-sm flex-shrink-0">
                                        <span className="avatar-title bg-primary-subtle rounded fs-3">
                                            <i className="bx bx-wallet text-primary"></i>
                                        </span>
                                    </div>
                                </div>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>

                <Row>
                    <Col lg={6}>
                        <Card>
                            <Card.Header>
                                <h4 className="card-title mb-0">{t('Available Products')}</h4>
                            </Card.Header>
                            <Card.Body>
                                {availableProducts.length > 0 ? (
                                    <div>
                                        <p>{t('Product catalog and pricing will be displayed here')}</p>
                                    </div>
                                ) : (
                                    <div className="text-center py-4">
                                        <p className="text-muted">{t('No products available')}</p>
                                    </div>
                                )}
                            </Card.Body>
                        </Card>
                    </Col>

                    <Col lg={6}>
                        <Card>
                            <Card.Header>
                                <h4 className="card-title mb-0">{t('Order History')}</h4>
                            </Card.Header>
                            <Card.Body>
                                {orderHistory.length > 0 ? (
                                    <div>
                                        <p>{t('Your order history and status will be displayed here')}</p>
                                    </div>
                                ) : (
                                    <div className="text-center py-4">
                                        <p className="text-muted">{t('No order history found')}</p>
                                    </div>
                                )}
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>
            </Container>
        </Layout>
    );
};

export default Dealer;