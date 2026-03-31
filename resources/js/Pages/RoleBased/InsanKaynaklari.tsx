import React from 'react';
import Layout from '@/Layouts';
import { Head } from '@inertiajs/react';
import { Container, Row, Col, Card } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';

interface Stats {
    total_employees: number;
    pending_requests: number;
    upcoming_birthdays: number;
    leave_requests: number;
}

interface InsanKaynaklariProps {
    title: string;
    welcomeMessage: string;
    stats: Stats;
    employeeRequests: any[];
    upcomingEvents: any[];
}

const InsanKaynaklari: React.FC<InsanKaynaklariProps> = ({ 
    title, 
    welcomeMessage, 
    stats, 
    employeeRequests, 
    upcomingEvents 
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
                                            {t('Total Employees')}
                                        </p>
                                    </div>
                                </div>
                                <div className="d-flex align-items-end justify-content-between mt-4">
                                    <div>
                                        <h4 className="fs-22 fw-semibold ff-secondary mb-4">
                                            <span className="counter-value">{stats.total_employees}</span>
                                        </h4>
                                    </div>
                                    <div className="avatar-sm flex-shrink-0">
                                        <span className="avatar-title bg-primary-subtle rounded fs-3">
                                            <i className="bx bx-group text-primary"></i>
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
                                            {t('Pending Requests')}
                                        </p>
                                    </div>
                                </div>
                                <div className="d-flex align-items-end justify-content-between mt-4">
                                    <div>
                                        <h4 className="fs-22 fw-semibold ff-secondary mb-4">
                                            <span className="counter-value">{stats.pending_requests}</span>
                                        </h4>
                                    </div>
                                    <div className="avatar-sm flex-shrink-0">
                                        <span className="avatar-title bg-warning-subtle rounded fs-3">
                                            <i className="bx bx-time text-warning"></i>
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
                                            {t('Upcoming Birthdays')}
                                        </p>
                                    </div>
                                </div>
                                <div className="d-flex align-items-end justify-content-between mt-4">
                                    <div>
                                        <h4 className="fs-22 fw-semibold ff-secondary mb-4">
                                            <span className="counter-value">{stats.upcoming_birthdays}</span>
                                        </h4>
                                    </div>
                                    <div className="avatar-sm flex-shrink-0">
                                        <span className="avatar-title bg-success-subtle rounded fs-3">
                                            <i className="bx bx-party text-success"></i>
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
                                            {t('Leave Requests')}
                                        </p>
                                    </div>
                                </div>
                                <div className="d-flex align-items-end justify-content-between mt-4">
                                    <div>
                                        <h4 className="fs-22 fw-semibold ff-secondary mb-4">
                                            <span className="counter-value">{stats.leave_requests}</span>
                                        </h4>
                                    </div>
                                    <div className="avatar-sm flex-shrink-0">
                                        <span className="avatar-title bg-info-subtle rounded fs-3">
                                            <i className="bx bx-calendar text-info"></i>
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
                                <h4 className="card-title mb-0">{t('Employee Requests')}</h4>
                            </Card.Header>
                            <Card.Body>
                                {employeeRequests.length > 0 ? (
                                    <div>
                                        <p>{t('Employee requests and applications will be displayed here')}</p>
                                    </div>
                                ) : (
                                    <div className="text-center py-4">
                                        <p className="text-muted">{t('No pending employee requests')}</p>
                                    </div>
                                )}
                            </Card.Body>
                        </Card>
                    </Col>

                    <Col lg={6}>
                        <Card>
                            <Card.Header>
                                <h4 className="card-title mb-0">{t('Upcoming Events')}</h4>
                            </Card.Header>
                            <Card.Body>
                                {upcomingEvents.length > 0 ? (
                                    <div>
                                        <p>{t('Company events and important dates will be displayed here')}</p>
                                    </div>
                                ) : (
                                    <div className="text-center py-4">
                                        <p className="text-muted">{t('No upcoming events')}</p>
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

export default InsanKaynaklari;