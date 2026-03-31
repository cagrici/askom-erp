import React from 'react';
import Layout from '@/Layouts';
import { Head } from '@inertiajs/react';
import { Container, Row, Col, Card } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';

interface Stats {
    pending_invoices: number;
    monthly_revenue: number;
    outstanding_payments: number;
    expense_total: number;
}

interface MuhasebeProps {
    title: string;
    welcomeMessage: string;
    stats: Stats;
    recentTransactions: any[];
    pendingApprovals: any[];
}

const Muhasebe: React.FC<MuhasebeProps> = ({ 
    title, 
    welcomeMessage, 
    stats, 
    recentTransactions, 
    pendingApprovals 
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
                        <div className="alert alert-primary" role="alert">
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
                                            {t('Pending Invoices')}
                                        </p>
                                    </div>
                                </div>
                                <div className="d-flex align-items-end justify-content-between mt-4">
                                    <div>
                                        <h4 className="fs-22 fw-semibold ff-secondary mb-4">
                                            <span className="counter-value">{stats.pending_invoices}</span>
                                        </h4>
                                    </div>
                                    <div className="avatar-sm flex-shrink-0">
                                        <span className="avatar-title bg-warning-subtle rounded fs-3">
                                            <i className="bx bx-receipt text-warning"></i>
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
                                            {t('Monthly Revenue')}
                                        </p>
                                    </div>
                                </div>
                                <div className="d-flex align-items-end justify-content-between mt-4">
                                    <div>
                                        <h4 className="fs-22 fw-semibold ff-secondary mb-4">
                                            <span className="counter-value">{stats.monthly_revenue}</span>
                                        </h4>
                                    </div>
                                    <div className="avatar-sm flex-shrink-0">
                                        <span className="avatar-title bg-success-subtle rounded fs-3">
                                            <i className="bx bx-trending-up text-success"></i>
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
                                            {t('Outstanding Payments')}
                                        </p>
                                    </div>
                                </div>
                                <div className="d-flex align-items-end justify-content-between mt-4">
                                    <div>
                                        <h4 className="fs-22 fw-semibold ff-secondary mb-4">
                                            <span className="counter-value">{stats.outstanding_payments}</span>
                                        </h4>
                                    </div>
                                    <div className="avatar-sm flex-shrink-0">
                                        <span className="avatar-title bg-danger-subtle rounded fs-3">
                                            <i className="bx bx-money text-danger"></i>
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
                                            {t('Total Expenses')}
                                        </p>
                                    </div>
                                </div>
                                <div className="d-flex align-items-end justify-content-between mt-4">
                                    <div>
                                        <h4 className="fs-22 fw-semibold ff-secondary mb-4">
                                            <span className="counter-value">{stats.expense_total}</span>
                                        </h4>
                                    </div>
                                    <div className="avatar-sm flex-shrink-0">
                                        <span className="avatar-title bg-info-subtle rounded fs-3">
                                            <i className="bx bx-credit-card text-info"></i>
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
                                <h4 className="card-title mb-0">{t('Recent Transactions')}</h4>
                            </Card.Header>
                            <Card.Body>
                                {recentTransactions.length > 0 ? (
                                    <div>
                                        <p>{t('Recent financial transactions will be displayed here')}</p>
                                    </div>
                                ) : (
                                    <div className="text-center py-4">
                                        <p className="text-muted">{t('No recent transactions')}</p>
                                    </div>
                                )}
                            </Card.Body>
                        </Card>
                    </Col>

                    <Col lg={6}>
                        <Card>
                            <Card.Header>
                                <h4 className="card-title mb-0">{t('Pending Approvals')}</h4>
                            </Card.Header>
                            <Card.Body>
                                {pendingApprovals.length > 0 ? (
                                    <div>
                                        <p>{t('Items requiring your approval will be displayed here')}</p>
                                    </div>
                                ) : (
                                    <div className="text-center py-4">
                                        <p className="text-muted">{t('No pending approvals')}</p>
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

export default Muhasebe;