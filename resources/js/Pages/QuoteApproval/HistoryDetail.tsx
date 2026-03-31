import React from 'react';
import { Head, Link } from '@inertiajs/react';
import { Card, Container, Button, Row, Col, Image, Badge } from 'react-bootstrap';
import { FaArrowLeft } from 'react-icons/fa';

interface QuoteItem {
    id: number;
    block_no: string;
    unit_price: number;
    quantity: number;
    unit: string;
    total: number;
    image_path?: string;
}

interface Quote {
    id: number;
    company_name: string;
    formatted_amount: string;
    status: string;
    quote_date: string;
    created_by: string;
    items: QuoteItem[];
}

interface Props {
    quote: Quote;
}

export default function HistoryDetail({ quote }: Props) {
    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'approved':
                return <Badge bg="success" className="fs-6">Onaylandı</Badge>;
            case 'rejected':
                return <Badge bg="danger" className="fs-6">Reddedildi</Badge>;
            default:
                return <Badge bg="secondary" className="fs-6">{status}</Badge>;
        }
    };
    
    return (
        <>
            <Head title="Teklif Detayı" />
            
            <div style={{ backgroundColor: '#2c3e50', minHeight: '100vh' }}>
                <Container fluid className="py-4">
                    <Card style={{ backgroundColor: '#34495e', border: 'none', color: 'white' }}>
                        <Card.Header style={{ backgroundColor: '#2c3e50', borderBottom: '1px solid #34495e' }}>
                            <div className="d-flex justify-content-between align-items-center">
                                <h4 className="mb-0">{quote.company_name} - {quote.formatted_amount}</h4>
                                <div className="d-flex align-items-center gap-3">
                                    {getStatusBadge(quote.status)}
                                    <Link 
                                        href={route('quote-approvals.history')} 
                                        className="text-white"
                                    >
                                        <FaArrowLeft size={20} />
                                    </Link>
                                </div>
                            </div>
                        </Card.Header>
                        
                        <Card.Body className="p-4">
                            <div className="mb-4">
                                <h5 className="mb-3">TARİH : {quote.quote_date}</h5>
                            </div>
                            
                            {quote.items.length > 0 && (
                                <div>
                                    <Row className="g-4">
                                        {quote.items.map((item) => (
                                            <Col key={item.id} xs={12}>
                                                <Card style={{ backgroundColor: '#2c3e50', border: '1px solid #34495e' }}>
                                                    <Card.Body>
                                                        <Row className="align-items-center">
                                                            <Col xs={12} md={8}>
                                                                <h6 className="text-uppercase mb-3">
                                                                    BLOK NO: {item.block_no}
                                                                </h6>
                                                                <Row>
                                                                    <Col xs={6}>
                                                                        <p className="mb-1">BİRİM FİYAT</p>
                                                                        <p className="fw-bold">$ {item.unit_price.toFixed(2)}</p>
                                                                    </Col>
                                                                    <Col xs={6}>
                                                                        <p className="mb-1">MİKTAR</p>
                                                                        <p className="fw-bold">{item.quantity} {item.unit}</p>
                                                                    </Col>
                                                                </Row>
                                                            </Col>
                                                            <Col xs={12} md={4} className="text-center">
                                                                {item.image_path && (
                                                                    <Image 
                                                                        src={`/storage/${item.image_path}`} 
                                                                        rounded
                                                                        style={{ 
                                                                            maxWidth: '150px', 
                                                                            maxHeight: '150px',
                                                                            objectFit: 'cover'
                                                                        }}
                                                                    />
                                                                )}
                                                            </Col>
                                                        </Row>
                                                    </Card.Body>
                                                </Card>
                                            </Col>
                                        ))}
                                    </Row>
                                </div>
                            )}
                        </Card.Body>
                    </Card>
                </Container>
            </div>
        </>
    );
}