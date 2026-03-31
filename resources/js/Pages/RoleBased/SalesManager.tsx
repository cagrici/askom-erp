import React from 'react';
import Layout from '@/Layouts';
import { Head } from '@inertiajs/react';
import { Container, Row, Col, Card } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';

interface Stats {
    team_performance: number;
    total_revenue: number;
    monthly_target: number;
    active_deals: number;
}

interface SalesManagerProps {
    title: string;
    welcomeMessage: string;
    stats: Stats;
    teamMembers: any[];
    salesReports: any[];
}

const SalesManager: React.FC<SalesManagerProps> = ({ 
    title, 
    welcomeMessage, 
    stats, 
    teamMembers, 
    salesReports 
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
                                            {t('Team Performance')}
                                        </p>
                                    </div>
                                </div>
                                <div className="d-flex align-items-end justify-content-between mt-4">
                                    <div>
                                        <h4 className="fs-22 fw-semibold ff-secondary mb-4">
                                            <span className="counter-value">{stats.team_performance}%</span>
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
                                            {t('Total Revenue')}
                                        </p>
                                    </div>
                                </div>
                                <div className="d-flex align-items-end justify-content-between mt-4">
                                    <div>
                                        <h4 className="fs-22 fw-semibold ff-secondary mb-4">
                                            <span className="counter-value">{stats.total_revenue}</span>
                                        </h4>
                                    </div>
                                    <div className="avatar-sm flex-shrink-0">
                                        <span className="avatar-title bg-info-subtle rounded fs-3">
                                            <i className="bx bx-dollar-circle text-info"></i>
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
                                        <span className="avatar-title bg-warning-subtle rounded fs-3">
                                            <i className="bx bx-target-lock text-warning"></i>
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
                                            {t('Active Deals')}
                                        </p>
                                    </div>
                                </div>
                                <div className="d-flex align-items-end justify-content-between mt-4">
                                    <div>
                                        <h4 className="fs-22 fw-semibold ff-secondary mb-4">
                                            <span className="counter-value">{stats.active_deals}</span>
                                        </h4>
                                    </div>
                                    <div className="avatar-sm flex-shrink-0">
                                        <span className="avatar-title bg-primary-subtle rounded fs-3">
                                            <i className="bx bx-briefcase text-primary"></i>
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
                                <h4 className="card-title mb-0">{t('Team Members')}</h4>
                            </Card.Header>
                            <Card.Body>
                                {teamMembers.length > 0 ? (
                                    <div>
                                        <p>{t('Team member performance will be displayed here')}</p>
                                    </div>
                                ) : (
                                    <div className="text-center py-4">
                                        <p className="text-muted">{t('No team members found')}</p>
                                    </div>
                                )}
                            </Card.Body>
                        </Card>
                    </Col>

                    <Col lg={6}>
                        <Card>
                            <Card.Header>
                                <h4 className="card-title mb-0">{t('Sales Reports')}</h4>
                            </Card.Header>
                            <Card.Body>
                                {salesReports.length > 0 ? (
                                    <div>
                                        <p>{t('Sales reports and analytics will be displayed here')}</p>
                                    </div>
                                ) : (
                                    <div className="text-center py-4">
                                        <p className="text-muted">{t('No sales data available')}</p>
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

export default SalesManager;