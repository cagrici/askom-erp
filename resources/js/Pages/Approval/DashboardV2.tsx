import React from 'react';
import { Head, Link } from '@inertiajs/react';
import { Card, Col, Row, Badge, Container } from 'react-bootstrap';
import Layout from '../../Layouts';

interface ApprovalType {
    id: string;
    title: string;
    count: number;
    color: string;
    icon: string;
    description: string;
    priority: string;
}

interface Props {
    approvalTypes: ApprovalType[];
}

const iconMap = {
    'ri-shopping-cart-line': 'ri-shopping-cart-fill',
    'ri-file-text-line': 'ri-file-text-fill',
    'ri-bank-card-line': 'ri-bank-card-fill',
    'ri-money-dollar-circle-line': 'ri-money-dollar-circle-fill',
    'ri-calendar-line': 'ri-calendar-check-fill',
    'ri-exchange-line': 'ri-exchange-fill',
};

export default function ApprovalDashboardV2({ approvalTypes }: Props) {
    const totalPending = approvalTypes.reduce((sum, type) => sum + type.count, 0);
    const highPriorityCount = approvalTypes.filter(type => type.priority === 'high').reduce((sum, type) => sum + type.count, 0);

    return (
        <>
            <Head title="Onay Merkezi" />

            <div className="page-content">
                <Container fluid>
                    {/* Page Title */}
                    <div className="page-title-box d-sm-flex align-items-center justify-content-between mb-4">
                        <div>
                            <h4 className="mb-sm-0">Onay Merkezi</h4>
                            <p className="text-muted mb-0 mt-1">
                                Onay bekleyen işlemlerinizi yönetin
                            </p>
                        </div>
                        <div className="text-end">
                            <h2 className="text-primary mb-0">{totalPending}</h2>
                            <small className="text-muted">Toplam Bekleyen</small>
                        </div>
                    </div>

                    {/* Alert for high priority items */}
                    {highPriorityCount > 0 && (
                        <div className="alert alert-danger alert-dismissible fade show mb-4" role="alert">
                            <div className="d-flex align-items-center">
                                <i className="ri-error-warning-fill fs-5 me-2"></i>
                                <div>
                                    <strong>{highPriorityCount} yüksek öncelikli işlem</strong> onay bekliyor!
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Approval Cards */}
                    <Row className="g-4">
                        {approvalTypes.map((type) => {
                            const iconClass = iconMap[type.icon as keyof typeof iconMap] || 'ri-list-check';

                            return (
                                <Col lg={4} md={6} key={type.id}>
                                    <Link
                                        href={`/onay-2/${type.id}`}
                                        className="text-decoration-none"
                                    >
                                        <Card className={`h-100 border-start border-5 border-${type.color} hover-shadow transition`}>
                                            <Card.Body>
                                                <div className="d-flex align-items-center mb-3">
                                                    <div className={`avatar-sm bg-${type.color} bg-opacity-10 rounded`}>
                                                        <span className={`avatar-title text-${type.color} fs-3`}>
                                                            <i className={iconClass}></i>
                                                        </span>
                                                    </div>
                                                    <div className="ms-3 flex-grow-1">
                                                        <h5 className="mb-1 text-dark">{type.title}</h5>
                                                        <p className="text-muted mb-0 small">
                                                            {type.description}
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="d-flex align-items-end justify-content-between">
                                                    <div>
                                                        <h2 className={`mb-0 text-${type.color}`}>
                                                            {type.count}
                                                        </h2>
                                                        <span className="text-muted small">bekleyen</span>
                                                    </div>
                                                    <div>
                                                        {type.priority === 'high' && (
                                                            <Badge bg="danger" className="rounded-pill">
                                                                <i className="ri-fire-fill me-1"></i>
                                                                Yüksek Öncelik
                                                            </Badge>
                                                        )}
                                                        {type.priority === 'medium' && (
                                                            <Badge bg="warning" className="rounded-pill">
                                                                <i className="ri-time-line me-1"></i>
                                                                Orta Öncelik
                                                            </Badge>
                                                        )}
                                                        {type.priority === 'low' && (
                                                            <Badge bg="success" className="rounded-pill">
                                                                <i className="ri-check-line me-1"></i>
                                                                Düşük Öncelik
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </div>
                                            </Card.Body>
                                            <Card.Footer className="bg-transparent border-0">
                                                <div className="text-center">
                                                    <span className="text-primary">
                                                        Detayları Gör
                                                        <i className="ri-arrow-right-line ms-1"></i>
                                                    </span>
                                                </div>
                                            </Card.Footer>
                                        </Card>
                                    </Link>
                                </Col>
                            );
                        })}
                    </Row>

                    {/* Quick Actions */}
                    <Row className="mt-5">
                        <Col>
                            <h5 className="mb-3">Hızlı İşlemler</h5>
                            <Row className="g-3">
                                <Col sm={6} md={3}>
                                    <Card className="text-center hover-shadow-sm">
                                        <Card.Body>
                                            <i className="ri-line-chart-line fs-1 text-primary mb-3 d-block"></i>
                                            <h6 className="mb-1">Raporlar</h6>
                                            <p className="text-muted small mb-0">Onay raporları</p>
                                        </Card.Body>
                                    </Card>
                                </Col>
                                <Col sm={6} md={3}>
                                    <Card className="text-center hover-shadow-sm">
                                        <Card.Body>
                                            <i className="ri-settings-3-line fs-1 text-success mb-3 d-block"></i>
                                            <h6 className="mb-1">Ayarlar</h6>
                                            <p className="text-muted small mb-0">Onay ayarları</p>
                                        </Card.Body>
                                    </Card>
                                </Col>
                                <Col sm={6} md={3}>
                                    <Card className="text-center hover-shadow-sm">
                                        <Card.Body>
                                            <i className="ri-history-line fs-1 text-warning mb-3 d-block"></i>
                                            <h6 className="mb-1">Geçmiş</h6>
                                            <p className="text-muted small mb-0">Onay geçmişi</p>
                                        </Card.Body>
                                    </Card>
                                </Col>
                                <Col sm={6} md={3}>
                                    <Card className="text-center hover-shadow-sm">
                                        <Card.Body>
                                            <i className="ri-user-shared-line fs-1 text-info mb-3 d-block"></i>
                                            <h6 className="mb-1">Delegasyon</h6>
                                            <p className="text-muted small mb-0">Yetki devri</p>
                                        </Card.Body>
                                    </Card>
                                </Col>
                            </Row>
                        </Col>
                    </Row>

                    {/* Tips Card */}
                    <Row className="mt-4">
                        <Col>
                            <Card className="bg-primary bg-opacity-10 border-0">
                                <Card.Body>
                                    <div className="d-flex align-items-start">
                                        <div className="flex-shrink-0">
                                            <i className="ri-lightbulb-line fs-4 text-primary"></i>
                                        </div>
                                        <div className="flex-grow-1 ms-3">
                                            <h6 className="text-primary mb-1">İpucu</h6>
                                            <p className="mb-0">
                                                Yüksek öncelikli işlemleri önce değerlendirerek iş akışınızı hızlandırabilirsiniz.
                                                Mobil cihazınızdan da onay işlemlerinizi kolayca gerçekleştirebilirsiniz.
                                            </p>
                                        </div>
                                    </div>
                                </Card.Body>
                            </Card>
                        </Col>
                    </Row>
                </Container>
            </div>

            <style jsx>{`
                .hover-shadow {
                    transition: all 0.3s ease;
                }
                .hover-shadow:hover {
                    transform: translateY(-5px);
                    box-shadow: 0 10px 30px rgba(0,0,0,0.1);
                }
                .hover-shadow-sm:hover {
                    box-shadow: 0 5px 15px rgba(0,0,0,0.1);
                    cursor: pointer;
                }
                .transition {
                    transition: all 0.3s ease;
                }
            `}</style>
        </>
    );
}

ApprovalDashboardV2.layout = (page: any) => <Layout children={page} />;
