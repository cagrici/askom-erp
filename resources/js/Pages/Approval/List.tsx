import React, { useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import { Card, Row, Col, Table, Button, Form, InputGroup } from 'react-bootstrap';
import Layout from '../../Layouts';

interface ListItem {
    id: number;
    [key: string]: any;
}

interface TypeInfo {
    title: string;
    icon: string;
}

interface Props {
    type: string;
    typeInfo: TypeInfo;
    items: ListItem[];
}

export default function ApprovalList({ type, typeInfo, items }: Props) {
    const [searchTerm, setSearchTerm] = useState('');
    
    // Arama fonksiyonu
    const filteredItems = items.filter(item => {
        const searchString = Object.values(item).join(' ').toLowerCase();
        return searchString.includes(searchTerm.toLowerCase());
    });

    return (
        <>
            <Head title={`Onay Bekleyen ${typeInfo.title}`} />

            <div className="page-content">
                <div className="page-header mb-4">
                    <Row className="align-items-center">
                        <Col>
                            <div className="d-flex align-items-center">
                                <Link 
                                    href={route('approval.index')} 
                                    className="btn btn-secondary btn-lg me-3"
                                    style={{ fontSize: '1.2rem', padding: '0.75rem 1.5rem' }}
                                >
                                    <i className="bi ri-arrow-left-line me-2"></i>
                                    Geri
                                </Link>
                                <div>
                                    <h1 className="page-title mb-0">
                                        <i className={`bi ${typeInfo.icon} me-3`}></i>
                                        Onay Bekleyen {typeInfo.title}
                                    </h1>
                                    <p className="text-muted mb-0 mt-1">Toplam {filteredItems.length} kayıt bulundu</p>
                                </div>
                            </div>
                        </Col>
                        <Col xs="auto">
                            <InputGroup size="lg" style={{ width: '350px' }}>
                                <InputGroup.Text>
                                    <i className="bi ri-search-line"></i>
                                </InputGroup.Text>
                                <Form.Control
                                    type="text"
                                    placeholder="Ara..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    style={{ fontSize: '1.1rem' }}
                                />
                            </InputGroup>
                        </Col>
                    </Row>
                </div>

                <Card className="shadow-sm">
                    <Card.Body className="p-0">
                        <Table hover responsive className="mb-0" style={{ fontSize: '1.1rem' }}>
                            <thead className="bg-light">
                                <tr>
                                    {type === 'siparisler' && (
                                        <>
                                            <th className="py-3 px-4">Sipariş No</th>
                                            <th className="py-3">Müşteri</th>
                                            <th className="py-3">Tutar</th>
                                            <th className="py-3">Tarih</th>
                                            <th className="py-3">Durum</th>
                                            <th className="py-3 text-center">İşlemler</th>
                                        </>
                                    )}
                                    {type === 'teklifler' && (
                                        <>
                                            <th className="py-3 px-4">Teklif No</th>
                                            <th className="py-3">Müşteri</th>
                                            <th className="py-3">Tutar</th>
                                            <th className="py-3">Tarih</th>
                                            <th className="py-3">Durum</th>
                                            <th className="py-3 text-center">İşlemler</th>
                                        </>
                                    )}
                                    {type === 'masraf-talepleri' && (
                                        <>
                                            <th className="py-3 px-4">Talep No</th>
                                            <th className="py-3">Personel</th>
                                            <th className="py-3">Tutar</th>
                                            <th className="py-3">Tarih</th>
                                            <th className="py-3">Tür</th>
                                            <th className="py-3 text-center">İşlemler</th>
                                        </>
                                    )}
                                </tr>
                            </thead>
                            <tbody>
                                {filteredItems.length > 0 ? (
                                    filteredItems.map((item) => (
                                        <tr 
                                            key={item.id} 
                                            style={{ cursor: 'pointer' }}
                                            onClick={() => window.location.href = route('approval.detail', [type, item.id])}
                                            className="hover-row"
                                        >
                                            {type === 'siparisler' && (
                                                <>
                                                    <td className="py-3 px-4 fw-bold">{item.orderNo}</td>
                                                    <td className="py-3">{item.customer}</td>
                                                    <td className="py-3 fw-bold text-primary">{item.amount}</td>
                                                    <td className="py-3">{item.date}</td>
                                                    <td className="py-3">
                                                        <span className="badge bg-warning text-dark fs-6 px-3 py-2">
                                                            {item.status}
                                                        </span>
                                                    </td>
                                                    <td className="py-3 text-center">
                                                        <Button 
                                                            variant="primary" 
                                                            size="lg"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                window.location.href = route('approval.detail', [type, item.id]);
                                                            }}
                                                        >
                                                            <i className="bi ri-eye-line me-2"></i>
                                                            Detay
                                                        </Button>
                                                    </td>
                                                </>
                                            )}
                                            {type === 'teklifler' && (
                                                <>
                                                    <td className="py-3 px-4 fw-bold">{item.offerNo}</td>
                                                    <td className="py-3">{item.customer}</td>
                                                    <td className="py-3 fw-bold text-primary">{item.amount}</td>
                                                    <td className="py-3">{item.date}</td>
                                                    <td className="py-3">
                                                        <span className="badge bg-warning text-dark fs-6 px-3 py-2">
                                                            {item.status}
                                                        </span>
                                                    </td>
                                                    <td className="py-3 text-center">
                                                        <Button 
                                                            variant="primary" 
                                                            size="lg"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                window.location.href = route('approval.detail', [type, item.id]);
                                                            }}
                                                        >
                                                            <i className="bi ri-eye-line me-2"></i>
                                                            Detay
                                                        </Button>
                                                    </td>
                                                </>
                                            )}
                                            {type === 'masraf-talepleri' && (
                                                <>
                                                    <td className="py-3 px-4 fw-bold">{item.requestNo}</td>
                                                    <td className="py-3">{item.employee}</td>
                                                    <td className="py-3 fw-bold text-primary">{item.amount}</td>
                                                    <td className="py-3">{item.date}</td>
                                                    <td className="py-3">
                                                        <span className="badge bg-info text-dark fs-6 px-3 py-2">
                                                            {item.type}
                                                        </span>
                                                    </td>
                                                    <td className="py-3 text-center">
                                                        <Button 
                                                            variant="primary" 
                                                            size="lg"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                window.location.href = route('approval.detail', [type, item.id]);
                                                            }}
                                                        >
                                                            <i className="bi ri-eye-line me-2"></i>
                                                            Detay
                                                        </Button>
                                                    </td>
                                                </>
                                            )}
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={6} className="text-center py-5">
                                            <i className="bi ri-inbox-line display-4 text-muted d-block mb-3"></i>
                                            <p className="text-muted fs-5 mb-0">Onay bekleyen kayıt bulunamadı.</p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </Table>
                    </Card.Body>
                </Card>
            </div>

            <style jsx>{`
                .hover-row:hover {
                    background-color: #f8f9fa;
                }
            `}</style>
        </>
    );
}

// Add the layout property
ApprovalList.layout = (page: any) => <Layout children={page} />;