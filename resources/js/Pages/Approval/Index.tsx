import React from 'react';
import { Head, Link } from '@inertiajs/react';
import { Card, Row, Col, Badge } from 'react-bootstrap';
import Layout from '../../Layouts';

interface ApprovalType {
    id: string;
    title: string;
    count: number;
    color: string;
    icon: string;
    description: string;
}

interface Props {
    approvalTypes: ApprovalType[];
}

export default function ApprovalIndex({ approvalTypes }: Props) {
    return (
        <>
            <Head title="Onay Bekleyenler" />

            <div className="page-content">
                <div className="page-header mb-5">
                    <Row>
                        <Col>
                            <h1 className="page-title display-6">
                                <i className="bi ri-check-line text-success me-3"></i>
                                Onay Bekleyenler
                            </h1>
                            <p className="text-muted fs-5">Onayınızı bekleyen işlemleri buradan görüntüleyebilirsiniz.</p>
                        </Col>
                    </Row>
                </div>
<div className="card">
    <div className="card-body">           <Row className="g-4">
                    {approvalTypes.map((type) => (
                        <Col key={type.id} xs={12} sm={6} md={4} lg={4} xl={3}>
                            <Link href={route('approval.list', type.id)} className="text-decoration-none">
                                <Card
                                    className={`h-100 shadow-sm hover-shadow transition-all border-0 bg-${type.color} bg-opacity-10`}
                                    style={{
                                        cursor: 'pointer',
                                        minHeight: '200px',
                                        transition: 'all 0.3s ease'
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.transform = 'translateY(-5px)';
                                        e.currentTarget.style.boxShadow = '0 0.5rem 1rem rgba(0, 0, 0, 0.15)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.transform = 'translateY(0)';
                                        e.currentTarget.style.boxShadow = '';
                                    }}
                                >
                                    <Card.Body className="d-flex flex-column align-items-center justify-content-center text-center p-4">
                                        <div className={`mb-3 text-${type.color}`}>
                                            <i className={`bi ${type.icon} display-3`}></i>
                                        </div>
                                        <h3 className={`mb-3 fw-bold text-${type.color}`}>{type.title}</h3>
                                        <Badge
                                            bg={type.color}
                                            className="fs-3 px-4 py-3 rounded-pill"
                                            style={{ minWidth: '100px' }}
                                        >
                                            {type.count}
                                        </Badge>
                                        <p className="text-muted mt-3 mb-0 fs-6">{type.description}</p>
                                    </Card.Body>
                                </Card>
                            </Link>
                        </Col>
                    ))}
                </Row>
</div>
</div>
                {/* Toplam onay bekleyen */}
                <Row className="mt-5">
                    <Col>
                        <Card className="bg-light border-0">
                            <Card.Body className="text-center py-4">
                                <h4 className="mb-0">
                                    Toplam Onay Bekleyen:
                                    <Badge bg="dark" className="ms-3 fs-4 px-4 py-2">
                                        {approvalTypes.reduce((sum, type) => sum + type.count, 0)}
                                    </Badge>
                                </h4>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>
            </div>

            <style jsx>{`
                .hover-shadow {
                    transition: all 0.3s ease;
                }
                .hover-shadow:hover {
                    box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15) !important;
                }
                .transition-all {
                    transition: all 0.3s ease;
                }
            `}</style>
        </>
    );
}

// Add the layout property
ApprovalIndex.layout = (page: any) => <Layout children={page} />;
