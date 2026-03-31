import React from 'react';
import { Head, Link } from '@inertiajs/react';
import { Card, Row, Col, Button, Table, Alert } from 'react-bootstrap';
import Layout from '../../Layouts';

interface DetailItem {
    name: string;
    quantity: number;
    price: string;
    total: string;
}

interface Detail {
    orderNo: string;
    customer: string;
    date: string;
    deliveryDate: string;
    amount: string;
    status: string;
    items: DetailItem[];
    notes: string;
}

interface Props {
    type: string;
    detail: Detail | null;
}

export default function ApprovalDetail({ type, detail }: Props) {
    if (!detail) {
        return (
            <>
                <Head title="Detay Bulunamadı" />
                <div className="page-content">
                    <Alert variant="warning" className="text-center">
                        <i className="bi ri-error-warning-line display-4 d-block mb-3"></i>
                        <h4>Kayıt bulunamadı!</h4>
                        <Link href={route('approval.index')} className="btn btn-primary mt-3">
                            Onay Listesine Dön
                        </Link>
                    </Alert>
                </div>
            </>
        );
    }

    return (
        <>
            <Head title={`Sipariş Detayı - ${detail.orderNo}`} />

            <div className="page-content">
                <div className="page-header mb-4">
                    <Row className="align-items-center">
                        <Col>
                            <div className="d-flex align-items-center">
                                <Link 
                                    href={route('approval.list', type)} 
                                    className="btn btn-secondary btn-lg me-3"
                                    style={{ fontSize: '1.2rem', padding: '0.75rem 1.5rem' }}
                                >
                                    <i className="bi ri-arrow-left-line me-2"></i>
                                    Listeye Dön
                                </Link>
                                <div>
                                    <h1 className="page-title mb-0">
                                        Sipariş Detayı: {detail.orderNo}
                                    </h1>
                                    <p className="text-muted mb-0 mt-1">
                                        <span className="badge bg-warning text-dark fs-6 px-3 py-2">
                                            {detail.status}
                                        </span>
                                    </p>
                                </div>
                            </div>
                        </Col>
                    </Row>
                </div>

                <Row>
                    <Col lg={8}>
                        {/* Genel Bilgiler */}
                        <Card className="shadow-sm mb-4">
                            <Card.Header className="bg-light py-3">
                                <h4 className="mb-0">
                                    <i className="bi ri-information-line me-2"></i>
                                    Genel Bilgiler
                                </h4>
                            </Card.Header>
                            <Card.Body className="p-4">
                                <Row className="g-4">
                                    <Col md={6}>
                                        <div className="mb-3">
                                            <label className="text-muted mb-1 d-block">Müşteri</label>
                                            <h5 className="mb-0">{detail.customer}</h5>
                                        </div>
                                    </Col>
                                    <Col md={6}>
                                        <div className="mb-3">
                                            <label className="text-muted mb-1 d-block">Sipariş No</label>
                                            <h5 className="mb-0">{detail.orderNo}</h5>
                                        </div>
                                    </Col>
                                    <Col md={6}>
                                        <div className="mb-3">
                                            <label className="text-muted mb-1 d-block">Sipariş Tarihi</label>
                                            <h5 className="mb-0">{detail.date}</h5>
                                        </div>
                                    </Col>
                                    <Col md={6}>
                                        <div className="mb-3">
                                            <label className="text-muted mb-1 d-block">Teslim Tarihi</label>
                                            <h5 className="mb-0">{detail.deliveryDate}</h5>
                                        </div>
                                    </Col>
                                </Row>
                            </Card.Body>
                        </Card>

                        {/* Sipariş Kalemleri */}
                        <Card className="shadow-sm mb-4">
                            <Card.Header className="bg-light py-3">
                                <h4 className="mb-0">
                                    <i className="bi ri-list-check me-2"></i>
                                    Sipariş Kalemleri
                                </h4>
                            </Card.Header>
                            <Card.Body className="p-0">
                                <Table responsive className="mb-0" style={{ fontSize: '1.1rem' }}>
                                    <thead className="bg-light">
                                        <tr>
                                            <th className="py-3 px-4">Ürün</th>
                                            <th className="py-3 text-center">Miktar</th>
                                            <th className="py-3 text-end">Birim Fiyat</th>
                                            <th className="py-3 text-end pe-4">Toplam</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {detail.items.map((item, index) => (
                                            <tr key={index}>
                                                <td className="py-3 px-4">{item.name}</td>
                                                <td className="py-3 text-center">{item.quantity}</td>
                                                <td className="py-3 text-end">{item.price}</td>
                                                <td className="py-3 text-end pe-4 fw-bold">{item.total}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot className="bg-light">
                                        <tr>
                                            <td colSpan={3} className="py-3 px-4 text-end fw-bold">
                                                GENEL TOPLAM:
                                            </td>
                                            <td className="py-3 text-end pe-4">
                                                <h4 className="mb-0 text-primary">{detail.amount}</h4>
                                            </td>
                                        </tr>
                                    </tfoot>
                                </Table>
                            </Card.Body>
                        </Card>

                        {/* Notlar */}
                        {detail.notes && (
                            <Card className="shadow-sm mb-4">
                                <Card.Header className="bg-light py-3">
                                    <h4 className="mb-0">
                                        <i className="bi ri-chat-3-line me-2"></i>
                                        Notlar
                                    </h4>
                                </Card.Header>
                                <Card.Body className="p-4">
                                    <Alert variant="info" className="mb-0">
                                        <i className="bi ri-information-line me-2"></i>
                                        {detail.notes}
                                    </Alert>
                                </Card.Body>
                            </Card>
                        )}
                    </Col>

                    <Col lg={4}>
                        {/* Onay İşlemleri */}
                        <Card className="shadow-sm sticky-top" style={{ top: '20px' }}>
                            <Card.Header className="bg-primary text-white py-3">
                                <h4 className="mb-0">
                                    <i className="bi ri-checkbox-line me-2"></i>
                                    Onay İşlemleri
                                </h4>
                            </Card.Header>
                            <Card.Body className="p-4">
                                <div className="text-center mb-4">
                                    <h2 className="text-primary mb-3">{detail.amount}</h2>
                                    <p className="text-muted mb-0">Toplam Tutar</p>
                                </div>
                                
                                <hr className="my-4" />

                                <div className="d-grid gap-3">
                                    <Button 
                                        variant="success" 
                                        size="lg" 
                                        className="py-3"
                                        style={{ fontSize: '1.2rem' }}
                                    >
                                        <i className="bi ri-check-line me-2"></i>
                                        ONAYLA
                                    </Button>
                                    
                                    <Button 
                                        variant="danger" 
                                        size="lg" 
                                        className="py-3"
                                        style={{ fontSize: '1.2rem' }}
                                    >
                                        <i className="bi ri-close-circle-line me-2"></i>
                                        REDDET
                                    </Button>
                                    
                                    <Button 
                                        variant="warning" 
                                        size="lg" 
                                        className="py-3"
                                        style={{ fontSize: '1.2rem' }}
                                    >
                                        <i className="bi ri-history-line me-2"></i>
                                        BEKLET
                                    </Button>
                                </div>

                                <hr className="my-4" />

                                <div className="d-grid">
                                    <Button 
                                        variant="outline-primary" 
                                        size="lg"
                                        className="py-2"
                                    >
                                        <i className="bi ri-printer-line me-2"></i>
                                        Yazdır
                                    </Button>
                                </div>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>
            </div>
        </>
    );
}

// Add the layout property
ApprovalDetail.layout = (page: any) => <Layout children={page} />;