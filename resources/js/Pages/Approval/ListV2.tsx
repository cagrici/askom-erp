import React, { useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import { Card, Col, Row, Badge, Container, Form, Button, InputGroup } from 'react-bootstrap';
import Layout from '../../Layouts';

interface Item {
    id: number;
    [key: string]: any;
}

interface TypeInfo {
    title: string;
    icon: string;
    color: string;
}

interface Props {
    type: string;
    typeInfo: TypeInfo;
    items: Item[];
}

export default function ApprovalListV2({ type, typeInfo, items }: Props) {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedPriority, setSelectedPriority] = useState('');
    
    const filteredItems = items.filter(item => {
        const matchesSearch = Object.values(item).some(value => 
            String(value).toLowerCase().includes(searchTerm.toLowerCase())
        );
        const matchesPriority = !selectedPriority || item.priority === selectedPriority;
        return matchesSearch && matchesPriority;
    });

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('tr-TR', {
            style: 'currency',
            currency: 'TRY',
            minimumFractionDigits: 0,
        }).format(amount);
    };

    const getPriorityBadge = (priority: string) => {
        switch(priority) {
            case 'high':
                return <Badge bg="danger" className="rounded-pill"><i className="ri-fire-fill me-1"></i>Yüksek</Badge>;
            case 'medium':
                return <Badge bg="warning" className="rounded-pill"><i className="ri-time-line me-1"></i>Orta</Badge>;
            case 'low':
                return <Badge bg="success" className="rounded-pill"><i className="ri-check-line me-1"></i>Düşük</Badge>;
            default:
                return null;
        }
    };

    const renderItemCard = (item: Item) => {
        switch(type) {
            case 'siparisler':
                return (
                    <Col lg={6} xl={4} key={item.id}>
                        <Link href={`/onay-2/${type}/${item.id}`} className="text-decoration-none">
                            <Card className={`mb-4 border-start border-4 border-${typeInfo.color} hover-shadow h-100`}>
                                <Card.Body>
                                    <div className="d-flex justify-content-between align-items-start mb-3">
                                        <div>
                                            <h5 className="mb-1 text-dark">{item.orderNo}</h5>
                                            <p className="text-muted mb-0">{item.customer}</p>
                                        </div>
                                        {getPriorityBadge(item.priority)}
                                    </div>
                                    
                                    <p className="text-muted small mb-3">{item.summary}</p>
                                    
                                    <div className="d-flex justify-content-between align-items-end">
                                        <div>
                                            <h4 className="mb-0 text-primary">{formatCurrency(item.amount)}</h4>
                                            <small className="text-muted">
                                                <i className="bi ri-calendar-line me-1"></i>
                                                {item.formattedDate}
                                            </small>
                                        </div>
                                        <Button variant="link" className="p-0">
                                            <i className="bi ri-arrow-right-circle-line fs-5"></i>
                                        </Button>
                                    </div>
                                </Card.Body>
                            </Card>
                        </Link>
                    </Col>
                );

            case 'teklifler':
                return (
                    <Col lg={6} xl={4} key={item.id}>
                        <Link href={`/onay-2/${type}/${item.id}`} className="text-decoration-none">
                            <Card className={`mb-4 border-start border-4 border-${typeInfo.color} hover-shadow h-100`}>
                                <Card.Body>
                                    <div className="d-flex justify-content-between align-items-start mb-3">
                                        <div>
                                            <h5 className="mb-1 text-dark">{item.offerNo}</h5>
                                            <p className="text-muted mb-0">{item.customer}</p>
                                        </div>
                                        {getPriorityBadge(item.priority)}
                                    </div>
                                    
                                    <p className="text-muted small mb-3">{item.summary}</p>
                                    
                                    <div className="mb-3">
                                        <Badge bg="info" className="me-2">
                                            <i className="bi bi-clock me-1"></i>
                                            Geçerlilik: {new Date(item.validUntil).toLocaleDateString('tr-TR')}
                                        </Badge>
                                    </div>
                                    
                                    <div className="d-flex justify-content-between align-items-end">
                                        <div>
                                            <h4 className="mb-0 text-success">{formatCurrency(item.amount)}</h4>
                                            <small className="text-muted">
                                                <i className="bi ri-calendar-line me-1"></i>
                                                {item.formattedDate}
                                            </small>
                                        </div>
                                        <Button variant="link" className="p-0">
                                            <i className="bi ri-arrow-right-circle-line fs-5"></i>
                                        </Button>
                                    </div>
                                </Card.Body>
                            </Card>
                        </Link>
                    </Col>
                );

            case 'masraf-talepleri':
                return (
                    <Col lg={6} xl={4} key={item.id}>
                        <Link href={`/onay-2/${type}/${item.id}`} className="text-decoration-none">
                            <Card className={`mb-4 border-start border-4 border-${typeInfo.color} hover-shadow h-100`}>
                                <Card.Body>
                                    <div className="d-flex justify-content-between align-items-start mb-3">
                                        <div>
                                            <h5 className="mb-1 text-dark">{item.requestNo}</h5>
                                            <p className="text-muted mb-0">{item.employee}</p>
                                            <small className="text-info">{item.department} - {item.type}</small>
                                        </div>
                                        {getPriorityBadge(item.priority)}
                                    </div>
                                    
                                    <p className="text-muted small mb-3">{item.summary}</p>
                                    
                                    <div className="d-flex justify-content-between align-items-end">
                                        <div>
                                            <h4 className="mb-0 text-danger">{formatCurrency(item.amount)}</h4>
                                            <small className="text-muted">
                                                <i className="bi ri-calendar-line me-1"></i>
                                                {item.formattedDate}
                                            </small>
                                        </div>
                                        <Button variant="link" className="p-0">
                                            <i className="bi ri-arrow-right-circle-line fs-5"></i>
                                        </Button>
                                    </div>
                                </Card.Body>
                            </Card>
                        </Link>
                    </Col>
                );

            default:
                return (
                    <Col lg={6} xl={4} key={item.id}>
                        <Card className="mb-4">
                            <Card.Body>
                                <p>Desteklenmeyen öğe türü: {type}</p>
                            </Card.Body>
                        </Card>
                    </Col>
                );
        }
    };

    return (
        <>
            <Head title={`${typeInfo.title} - Onay Listesi`} />
            
            <div className="page-content">
                <Container fluid>
                    {/* Page Header */}
                    <div className="page-title-box d-flex align-items-center justify-content-between mb-4">
                        <div className="d-flex align-items-center">
                            <Link 
                                href="/onay-2" 
                                className="btn btn-light btn-sm me-3"
                            >
                                <i className="bi ri-arrow-left-line"></i>
                            </Link>
                            <div>
                                <h4 className="mb-0">{typeInfo.title}</h4>
                                <p className="text-muted mb-0 mt-1">
                                    {filteredItems.length} öğe onay bekliyor
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Search and Filters */}
                    <Card className="mb-4">
                        <Card.Body>
                            <Row className="g-3">
                                <Col md={6}>
                                    <InputGroup>
                                        <InputGroup.Text>
                                            <i className="bi ri-search-line"></i>
                                        </InputGroup.Text>
                                        <Form.Control
                                            type="text"
                                            placeholder="Ara..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                        />
                                    </InputGroup>
                                </Col>
                                <Col md={6}>
                                    <div className="d-flex gap-2 flex-wrap">
                                        <Button
                                            variant={selectedPriority === '' ? 'primary' : 'outline-primary'}
                                            size="sm"
                                            onClick={() => setSelectedPriority('')}
                                        >
                                            Tümü ({items.length})
                                        </Button>
                                        <Button
                                            variant={selectedPriority === 'high' ? 'danger' : 'outline-danger'}
                                            size="sm"
                                            onClick={() => setSelectedPriority('high')}
                                        >
                                            <i className="bi bi-fire me-1"></i>
                                            Yüksek ({items.filter(i => i.priority === 'high').length})
                                        </Button>
                                        <Button
                                            variant={selectedPriority === 'medium' ? 'warning' : 'outline-warning'}
                                            size="sm"
                                            onClick={() => setSelectedPriority('medium')}
                                        >
                                            <i className="bi bi-clock me-1"></i>
                                            Orta ({items.filter(i => i.priority === 'medium').length})
                                        </Button>
                                        <Button
                                            variant={selectedPriority === 'low' ? 'success' : 'outline-success'}
                                            size="sm"
                                            onClick={() => setSelectedPriority('low')}
                                        >
                                            <i className="bi bi-check-circle me-1"></i>
                                            Düşük ({items.filter(i => i.priority === 'low').length})
                                        </Button>
                                    </div>
                                </Col>
                            </Row>
                        </Card.Body>
                    </Card>

                    {/* Items List */}
                    {filteredItems.length > 0 ? (
                        <Row>
                            {filteredItems.map((item) => renderItemCard(item))}
                        </Row>
                    ) : (
                        <Card>
                            <Card.Body className="text-center py-5">
                                <i className="bi ri-inbox-line fs-1 text-muted mb-3 d-block"></i>
                                <h5 className="text-muted">
                                    {searchTerm ? 'Arama sonucu bulunamadı' : 'Onay bekleyen öğe yok'}
                                </h5>
                                <p className="text-muted">
                                    {searchTerm 
                                        ? 'Farklı arama terimleri deneyin'
                                        : 'Şu anda onayınızı bekleyen bir öğe bulunmamaktadır'
                                    }
                                </p>
                            </Card.Body>
                        </Card>
                    )}
                </Container>
            </div>

            <style jsx>{`
                .hover-shadow {
                    transition: all 0.3s ease;
                }
                .hover-shadow:hover {
                    transform: translateY(-3px);
                    box-shadow: 0 10px 20px rgba(0,0,0,0.1);
                }
            `}</style>
        </>
    );
}

ApprovalListV2.layout = (page: any) => <Layout children={page} />;