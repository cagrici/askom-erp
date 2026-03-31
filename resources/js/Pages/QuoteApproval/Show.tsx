import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import { Card, Container, Button, Row, Col, Modal, Form, Image } from 'react-bootstrap';
import { FaArrowLeft, FaCheck, FaTimes } from 'react-icons/fa';
import Layout from "../../Layouts";

interface QuoteItem {
    id: number;
    block_no: string;
    unit_price: number;
    quantity: number;
    unit: string;
    total: number;
    image_path?: string;
}

interface QuoteDocument {
    id: number;
    file_name: string;
    file_path: string;
}

interface Quote {
    id: number;
    company_name: string;
    formatted_amount: string;
    status: string;
    quote_date: string;
    created_by: string;
    items: QuoteItem[];
    documents: QuoteDocument[];
}

interface Props {
    quote: Quote;
}

export default function Show({ quote }: Props) {
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [rejectReason, setRejectReason] = useState('');
    const [processing, setProcessing] = useState(false);

    const handleApprove = () => {
        if (confirm('Bu teklifi onaylamak istediğinizden emin misiniz?')) {
            setProcessing(true);
            router.post(`/onay-fatura-teklif/quote/${quote.id}/approve`, {}, {
                onFinish: () => setProcessing(false)
            });
        }
    };

    const handleReject = () => {
        if (rejectReason.trim()) {
            setProcessing(true);
            router.post(`/onay-fatura-teklif/quote/${quote.id}/reject`, {
                reason: rejectReason
            }, {
                onFinish: () => {
                    setProcessing(false);
                    setShowRejectModal(false);
                }
            });
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
                                <Button
                                    variant="link"
                                    className="text-white p-0"
                                    onClick={() => router.visit('/onay-fatura-teklif/pending')}
                                >
                                    <FaArrowLeft size={20} />
                                </Button>
                            </div>
                        </Card.Header>

                        <Card.Body className="p-4">
                            {quote.documents.length > 0 && (
                                <div className="mb-4">
                                    <iframe
                                        src={`/storage/${quote.documents[0].file_path}`}
                                        style={{ width: '100%', height: '600px', border: 'none' }}
                                        title="Teklif Dökümanı"
                                    />
                                </div>
                            )}

                            <div className="mb-4">
                                <h5 className="mb-3">Teklif Detayları</h5>
                                <Row>
                                    <Col md={6}>
                                        <p><strong>Firma:</strong> {quote.company_name}</p>
                                        <p><strong>Tarih:</strong> {quote.quote_date}</p>
                                    </Col>
                                    <Col md={6}>
                                        <p><strong>Toplam:</strong> {quote.formatted_amount}</p>
                                        <p><strong>Oluşturan:</strong> {quote.created_by}</p>
                                    </Col>
                                </Row>
                            </div>

                            {quote.items.length > 0 && (
                                <div className="mb-4">
                                    <h5 className="mb-3">Kalemler</h5>
                                    <div className="table-responsive">
                                        <table className="table table-dark table-striped">
                                            <thead>
                                                <tr>
                                                    <th>Blok No</th>
                                                    <th>Birim Fiyat</th>
                                                    <th>Miktar</th>
                                                    <th>Birim</th>
                                                    <th>Toplam</th>
                                                    <th>Görsel</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {quote.items.map((item) => (
                                                    <tr key={item.id}>
                                                        <td>{item.block_no}</td>
                                                        <td>${item.unit_price.toFixed(2)}</td>
                                                        <td>{item.quantity}</td>
                                                        <td>{item.unit}</td>
                                                        <td>${item.total.toFixed(2)}</td>
                                                        <td>
                                                            {item.image_path && (
                                                                <Image
                                                                    src={`/storage/${item.image_path}`}
                                                                    thumbnail
                                                                    style={{ maxWidth: '100px' }}
                                                                />
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                            <div className="d-flex justify-content-center gap-3 mt-4">
                                <Button
                                    variant="danger"
                                    size="lg"
                                    onClick={() => setShowRejectModal(true)}
                                    disabled={processing}
                                    style={{ minWidth: '150px' }}
                                >
                                    <FaTimes className="me-2" />
                                    GERİ
                                </Button>
                                <Button
                                    variant="success"
                                    size="lg"
                                    onClick={handleApprove}
                                    disabled={processing}
                                    style={{ minWidth: '150px' }}
                                >
                                    <FaCheck className="me-2" />
                                    ONAY
                                </Button>
                            </div>
                        </Card.Body>
                    </Card>
                </Container>
            </div>

            <Modal
                show={showRejectModal}
                onHide={() => setShowRejectModal(false)}
                centered
            >
                <Modal.Header closeButton style={{ backgroundColor: '#2c3e50', color: 'white' }}>
                    <Modal.Title>Reddetme Nedeni</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form.Group>
                        <Form.Label>Lütfen reddetme nedenini belirtiniz:</Form.Label>
                        <Form.Control
                            as="textarea"
                            rows={3}
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                            placeholder="Reddetme nedeni..."
                        />
                    </Form.Group>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowRejectModal(false)}>
                        İptal
                    </Button>
                    <Button
                        variant="danger"
                        onClick={handleReject}
                        disabled={!rejectReason.trim() || processing}
                    >
                        Reddet
                    </Button>
                </Modal.Footer>
            </Modal>
        </>
    );
}
