import React from 'react';
import Layout from '@/Layouts';
import { Head } from '@inertiajs/react';
import { Container, Row, Col, Card } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';

interface Stats {
    total_sales: number;
    monthly_target: number;
    pending_orders: number;
    active_customers: number;
}

interface SaticiProps {
    title: string;
    welcomeMessage: string;
    stats: Stats;
    recentOrders: any[];
    topProducts: any[];
}

const Satici: React.FC<SaticiProps> = ({ 
    title, 
    welcomeMessage, 
    stats, 
    recentOrders, 
    topProducts 
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
                        <div className="alert alert-success" role="alert">
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
                                            {t('Total Sales')}
                                        </p>
                                    </div>
                                </div>
                                <div className="d-flex align-items-end justify-content-between mt-4">
                                    <div>
                                        <h4 className="fs-22 fw-semibold ff-secondary mb-4">
                                            <span className="counter-value">{stats.total_sales}</span>
                                        </h4>
                                    </div>
                                    <div className="avatar-sm flex-shrink-0">
                                        <span className="avatar-title bg-success-subtle rounded fs-3">
                                            <i className="bx bx-dollar-circle text-success"></i>
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
                                            {t('Monthly Target')}
                                        </p>
                                    </div>
                                </div>
                                <div className="d-flex align-items-end justify-content-between mt-4">
                                    <div>
                                        <h4 className="fs-22 fw-semibold ff-secondary mb-4">
                                            <span className="counter-value">{stats.monthly_target}</span>
                                        </h4>
                                    </div>
                                    <div className="avatar-sm flex-shrink-0">
                                        <span className="avatar-title bg-info-subtle rounded fs-3">
                                            <i className="bx bx-target-lock text-info"></i>
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
                                            <i className="bx bx-shopping-bag text-warning"></i>
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
                                            {t('Active Customers')}
                                        </p>
                                    </div>
                                </div>
                                <div className="d-flex align-items-end justify-content-between mt-4">
                                    <div>
                                        <h4 className="fs-22 fw-semibold ff-secondary mb-4">
                                            <span className="counter-value">{stats.active_customers}</span>
                                        </h4>
                                    </div>
                                    <div className="avatar-sm flex-shrink-0">
                                        <span className="avatar-title bg-primary-subtle rounded fs-3">
                                            <i className="bx bx-user-circle text-primary"></i>
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
                                <h4 className="card-title mb-0">{t('Recent Orders')}</h4>
                            </Card.Header>
                            <Card.Body>
                                {recentOrders.length > 0 ? (
                                    <div>
                                        {/* Siparişler listesi burada gösterilecek */}
                                        <p>{t('Recent orders will be displayed here')}</p>
                                    </div>
                                ) : (
                                    <div className="text-center py-4">
                                        <p className="text-muted">{t('No recent orders found')}</p>
                                    </div>
                                )}
                            </Card.Body>
                        </Card>
                    </Col>

                    <Col lg={6}>
                        <Card>
                            <Card.Header>
                                <h4 className="card-title mb-0">{t('Top Products')}</h4>
                            </Card.Header>
                            <Card.Body>
                                {topProducts.length > 0 ? (
                                    <div>
                                        {/* En çok satan ürünler burada gösterilecek */}
                                        <p>{t('Top selling products will be displayed here')}</p>
                                    </div>
                                ) : (
                                    <div className="text-center py-4">
                                        <p className="text-muted">{t('No product data available')}</p>
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

export default Satici;