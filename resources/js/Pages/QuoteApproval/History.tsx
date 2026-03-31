import React, { useState, useEffect, useCallback } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { Card, Container, Form, InputGroup, ListGroup, Modal, Button, Row, Col, Accordion, Table, Spinner, Image } from 'react-bootstrap';
import { FaSearch, FaMicrophone, FaHome, FaFileInvoice } from 'react-icons/fa';
import Layout from "../../Layouts";

interface HistoryItem {
    id: number;
    type: 'invoice' | 'offer';
    doc_no: string;
    entity_name: string;
    amount: string;
    date: string;
    sort_date?: string;
    status?: number;
}

interface ItemDetail {
    id: number;
    doc_no: string;
    entity_name: string;
    amount: string;
    date: string;
    items?: {
        quantity?: number;
        unit?: string;
        price?: number;
        dimensions?: string;
        product_name?: string;
        price_info?: {
            price_tl: number;
            amount_tl: number;
            price_foreign?: number;
            amount_foreign?: number;
            currency_rate?: number;
            currency_name?: string;
            is_foreign_currency: boolean;
        };
    }[];
    images?: string[];
}

interface Invoice {
    id: number;
    invoice_no: string;
    amount: string;
    date: string;
    status: string;
}

interface HistoryResponse {
    data: HistoryItem[];
    current_page: number;
    per_page: number;
    total: number;
    last_page: number;
    has_more: boolean;
}

interface Props {
    // No props needed as we'll fetch from API
}

export default function History(props: Props) {
    const [searchTerm, setSearchTerm] = useState('');
    const [items, setItems] = useState<HistoryItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [page, setPage] = useState(1);
    const [isListening, setIsListening] = useState(false);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [selectedItem, setSelectedItem] = useState<HistoryItem | null>(null);
    const [itemDetail, setItemDetail] = useState<ItemDetail | null>(null);
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [loadingDetail, setLoadingDetail] = useState(false);
    const [loadingInvoices, setLoadingInvoices] = useState(false);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [showInvoiceDetailModal, setShowInvoiceDetailModal] = useState(false);
    const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
    const [invoiceDetail, setInvoiceDetail] = useState<ItemDetail | null>(null);
    const [loadingInvoiceDetail, setLoadingInvoiceDetail] = useState(false);

    const fetchItems = useCallback(async (pageNum: number = 1, resetItems: boolean = false) => {
        if (loading) return;

        setLoading(true);

        try {
            // Use the same API endpoint but with history parameter
            const response = await fetch(`/onay-fatura-teklif/history/api?page=${pageNum}&per_page=20&type=all`);
            const data: HistoryResponse = await response.json();

            if (resetItems) {
                setItems(data.data);
            } else {
                setItems(prev => [...prev, ...data.data]);
            }

            setHasMore(data.has_more);
            setPage(pageNum);
        } catch (error) {
            console.error('Error fetching items:', error);
        } finally {
            setLoading(false);
        }
    }, [loading]);

    useEffect(() => {
        setItems([]);
        setPage(1);
        setHasMore(true);
        fetchItems(1, true);
    }, []);

    useEffect(() => {
        const handleScroll = () => {
            if (
                window.innerHeight + document.documentElement.scrollTop
                >= document.documentElement.offsetHeight - 200 &&
                !loading &&
                hasMore
            ) {
                fetchItems(page + 1);
            }
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, [fetchItems, page, loading, hasMore]);

    const filteredItems = items.filter(item =>
        item.entity_name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getStatusColor = () => {
        return '#28a745'; // Green for approved items
    };

    const getStatusText = (item: HistoryItem) => {
        if (item.type === 'invoice') {
            return 'F'; // Fatura
        } else if (item.type === 'offer') {
            return 'T'; // Teklif
        }
        return 'O'; // Onaylandı
    };

    const truncateEntityName = (name: string) => {
        const words = name.split(' ');
        return words.slice(0, 3).join(' ') + (words.length > 3 ? '...' : '');
    };

    const handleItemClick = async (item: HistoryItem) => {
        setSelectedItem(item);
        setShowDetailModal(true);
        setLoadingDetail(true);
        setLoadingInvoices(true);

        try {
            // Fetch item details
            const detailResponse = await fetch(`/onay-fatura-teklif/api/${item.type}/${item.id}/detail`);
            if (detailResponse.ok) {
                const detail = await detailResponse.json();
                setItemDetail(detail);
            } else {
                // Mock data for now
                setItemDetail({
                    id: item.id,
                    doc_no: item.doc_no,
                    entity_name: item.entity_name,
                    amount: item.amount,
                    date: item.date,
                    items: [
                        {
                            quantity: 150,
                            unit: 'ton',
                            price: 2500,
                            dimensions: '30x60x2 cm',
                            product_name: 'Mermer Plaka'
                        }
                    ],
                    images: []
                });
            }
        } catch (error) {
            console.error('Error fetching detail:', error);
        } finally {
            setLoadingDetail(false);
        }

        try {
            // Fetch invoices
            const invoiceResponse = await fetch(`/onay-fatura-teklif/api/entity/${item.id}/invoices`);
            if (invoiceResponse.ok) {
                const invoiceData = await invoiceResponse.json();
                setInvoices(invoiceData);
            } else {
                // Mock data for now
                setInvoices([
                    { id: 1, invoice_no: 'FAT-2024-001', amount: '375.000,00 TL', date: '15.01.2024', status: 'paid' },
                    { id: 2, invoice_no: 'FAT-2024-002', amount: '425.000,00 TL', date: '20.01.2024', status: 'paid' },
                    { id: 3, invoice_no: 'FAT-2024-003', amount: '295.000,00 TL', date: '25.01.2024', status: 'pending' },
                    { id: 4, invoice_no: 'FAT-2023-156', amount: '520.000,00 TL', date: '28.12.2023', status: 'paid' },
                    { id: 5, invoice_no: 'FAT-2023-155', amount: '180.000,00 TL', date: '22.12.2023', status: 'paid' }
                ]);
            }
        } catch (error) {
            console.error('Error fetching invoices:', error);
        } finally {
            setLoadingInvoices(false);
        }
    };

    const handleInvoiceClick = async (invoice: Invoice) => {
        setSelectedInvoice(invoice);
        setShowInvoiceDetailModal(true);
        setLoadingInvoiceDetail(true);

        try {
            const response = await fetch(`/onay-fatura-teklif/api/invoice/${invoice.id}/detail`);
            if (response.ok) {
                const detail = await response.json();
                setInvoiceDetail(detail);
            }
        } catch (error) {
            console.error('Error fetching invoice detail:', error);
        } finally {
            setLoadingInvoiceDetail(false);
        }
    };

    const handleCloseInvoiceModal = () => {
        setShowInvoiceDetailModal(false);
        setSelectedInvoice(null);
        setInvoiceDetail(null);
    };

    const handleCloseModal = () => {
        setShowDetailModal(false);
        setSelectedItem(null);
        setItemDetail(null);
        setInvoices([]);
        setSelectedImage(null);
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('tr-TR', {
            style: 'currency',
            currency: 'TRY'
        }).format(amount);
    };

    const handleVoiceSearch = () => {
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            alert('Tarayıcınız ses tanıma özelliğini desteklemiyor.');
            return;
        }

        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        const recognition = new SpeechRecognition();

        recognition.lang = 'tr-TR';
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;

        recognition.onstart = () => {
            setIsListening(true);
        };

        recognition.onresult = (event: any) => {
            const transcript = event.results[0][0].transcript;
            setSearchTerm(transcript);
            setIsListening(false);
        };

        recognition.onerror = (event: any) => {
            console.error('Speech recognition error:', event.error);
            setIsListening(false);
            alert('Ses tanıma hatası: ' + event.error);
        };

        recognition.onend = () => {
            setIsListening(false);
        };

        if (isListening) {
            recognition.stop();
        } else {
            recognition.start();
        }
    };

    return (
        <>
            <Head title="Onay Geçmişi" />

            <div style={{ backgroundColor: '#2c3e50', minHeight: '100vh' }}>
                <Container fluid className="py-4">
                    <Card style={{ backgroundColor: '#34495e', border: 'none' }}>
                        <Card.Body className="p-4">
                            <InputGroup className="mb-4">
                                <InputGroup.Text
                                    style={{
                                        backgroundColor: 'white',
                                        border: '1px solid #ced4da',
                                        cursor: 'pointer'
                                    }}
                                    onClick={() => router.visit('/onay-fatura-teklif/')}
                                    title="Ana sayfaya dön"
                                >
                                    <FaHome color="#6c757d" />
                                </InputGroup.Text>
                                <InputGroup.Text style={{ backgroundColor: 'white', border: '1px solid #ced4da', borderLeft: 'none' }}>
                                    <FaSearch />
                                </InputGroup.Text>
                                <Form.Control
                                    type="text"
                                    placeholder="Ara..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    style={{ border: '1px solid #ced4da', borderLeft: 'none' }}
                                />
                                <InputGroup.Text
                                    style={{
                                        backgroundColor: isListening ? '#dc3545' : 'white',
                                        border: '1px solid #ced4da',
                                        borderLeft: 'none',
                                        cursor: 'pointer',
                                        transition: 'background-color 0.3s'
                                    }}
                                    onClick={handleVoiceSearch}
                                    title={isListening ? 'Dinlemeyi durdur' : 'Sesli arama'}
                                >
                                    <FaMicrophone color={isListening ? 'white' : '#6c757d'} />
                                </InputGroup.Text>
                            </InputGroup>

                            <ListGroup variant="flush">
                                {filteredItems.map((item) => (
                                    <ListGroup.Item
                                        key={`${item.type}-${item.id}`}
                                        className="px-0 py-3"
                                        style={{
                                            backgroundColor: '#2c3e50',
                                            border: 'none',
                                            borderBottom: '1px solid #34495e',
                                            cursor: 'pointer'
                                        }}
                                        onClick={() => handleItemClick(item)}
                                    >
                                        <div className="d-flex p-2 justify-content-between align-items-center">
                                            <div>
                                                <h5 className="mb-0 text-white">{truncateEntityName(item.entity_name)}</h5>
                                                <small className="text-white-50">{item.doc_no}</small>
                                            </div>
                                            <div className="text-end">
                                                <div className="text-white mb-1">{item.amount}</div>
                                                <span style={{ color: getStatusColor(), fontWeight: 'bold' }}>
                                                    {getStatusText(item)} - Onaylandı
                                                </span>
                                            </div>
                                        </div>
                                    </ListGroup.Item>
                                ))}
                            </ListGroup>

                            {filteredItems.length === 0 && !loading && (
                                <div className="text-center py-5">
                                    <p className="text-white-50">Onay geçmişi bulunamadı.</p>
                                </div>
                            )}

                            {loading && (
                                <div className="text-center py-4">
                                    <div className="spinner-border text-light" role="status">
                                        <span className="visually-hidden">Yükleniyor...</span>
                                    </div>
                                </div>
                            )}
                        </Card.Body>
                    </Card>
                </Container>
            </div>

            {/* Detail Modal */}
            <Modal
                show={showDetailModal}
                onHide={handleCloseModal}
                size="lg"
                centered
            >
                <Modal.Header closeButton style={{ backgroundColor: '#f0f0f0', color: 'white' }}>
                    <Modal.Title>
                        {selectedItem?.type === 'invoice' ? 'Fatura' : 'Teklif'} Detayı - {selectedItem?.doc_no}
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {loadingDetail ? (
                        <div className="text-center py-4">
                            <Spinner animation="border" />
                        </div>
                    ) : itemDetail && (
                        <div>
                            {/* Basic Details */}
                            <Row className="mb-4">
                                <Col md={6}>
                                    <h6 className="text-muted">Müşteri</h6>
                                    <p className="fw-bold">{itemDetail.entity_name}</p>
                                </Col>
                                <Col md={6}>
                                    <h6 className="text-muted">Tutar</h6>
                                    <p className="fw-bold">{itemDetail.amount}</p>
                                </Col>
                            </Row>

                            {/* Item Details */}
                            {itemDetail.items && itemDetail.items.length > 0 && (
                                <div className="mb-4">
                                    <h5>Detay Bilgileri</h5>
                                    {itemDetail.items.map((detail, index) => (
                                        <Card key={index} className="mb-2">
                                            <Card.Body>
                                                <Row>
                                                    <Col md={6}>
                                                        <p className="mb-1"><strong>Ürün:</strong> {detail.product_name || 'Mermer'}</p>
                                                        <p className="mb-1"><strong>Kaç ton almış?</strong> {detail.quantity} {detail.unit}</p>
                                                    </Col>
                                                    <Col md={6}>
                                                        {detail.price_info?.is_foreign_currency ? (
                                                            <div>
                                                                <p className="mb-1"><strong>Fiyat (TL):</strong> {formatCurrency(detail.price_info.price_tl || 0)}</p>
                                                                <p className="mb-1"><strong>Fiyat ({detail.price_info.currency_name}):</strong> {detail.price_info.price_foreign?.toLocaleString('tr-TR', { minimumFractionDigits: 2 }) || 0}</p>
                                                                <p className="mb-1"><strong>Tutar (TL):</strong> {formatCurrency(detail.price_info.amount_tl || 0)}</p>
                                                                <p className="mb-1"><strong>Tutar ({detail.price_info.currency_name}):</strong> {detail.price_info.amount_foreign?.toLocaleString('tr-TR', { minimumFractionDigits: 2 }) || 0}</p>
                                                                <p className="mb-1"><strong>Kur:</strong> {detail.price_info.currency_rate?.toLocaleString('tr-TR', { minimumFractionDigits: 4 }) || 1}</p>
                                                            </div>
                                                        ) : (
                                                            <p className="mb-1"><strong>Fiyat nedir?</strong> {formatCurrency(detail.price || 0)}</p>
                                                        )}
                                                        <p className="mb-1"><strong>Ebatlar nedir?</strong> {detail.dimensions || 'Belirtilmemiş'}</p>
                                                    </Col>
                                                </Row>
                                            </Card.Body>
                                        </Card>
                                    ))}
                                </div>
                            )}

                            {/* Images */}
                            <div className="mb-4">
                                <h5>Görseller</h5>
                                <Row>
                                    {itemDetail.images && itemDetail.images.length > 0 ? (
                                        itemDetail.images.map((image, index) => (
                                            <Col md={4} key={index} className="mb-3">
                                                <Image
                                                    src={image}
                                                    alt={`Görsel ${index + 1}`}
                                                    thumbnail
                                                    style={{ cursor: 'pointer', height: '150px', objectFit: 'cover' }}
                                                    onClick={() => setSelectedImage(image)}
                                                />
                                            </Col>
                                        ))
                                    ) : (
                                        [1, 2, 3].map((index) => (
                                            <Col md={4} key={index} className="mb-3">
                                                <Image
                                                    src={`/images/mermer-blok-${index}.jpg`}
                                                    alt={`Varsayılan Görsel ${index}`}
                                                    thumbnail
                                                    style={{ cursor: 'pointer', height: '150px', objectFit: 'cover' }}
                                                    onClick={() => setSelectedImage(`/images/mermer-blok-${index}.jpg`)}
                                                />
                                            </Col>
                                        ))
                                    )}
                                </Row>
                            </div>

                            {/* Invoices Accordion */}
                            <Accordion>
                                <Accordion.Item eventKey="0">
                                    <Accordion.Header>
                                        <FaFileInvoice className="me-2" />
                                        Son Faturalar
                                    </Accordion.Header>
                                    <Accordion.Body>
                                        {loadingInvoices ? (
                                            <div className="text-center py-3">
                                                <Spinner animation="border" size="sm" />
                                            </div>
                                        ) : invoices.length > 0 ? (
                                            <Table striped bordered hover size="sm">
                                                <thead>
                                                    <tr>
                                                        <th>Fatura No</th>
                                                        <th>Tarih</th>
                                                        <th>Tutar</th>
                                                        <th>Durum</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {invoices.map((invoice) => (
                                                        <tr
                                                            key={invoice.id}
                                                            style={{ cursor: 'pointer' }}
                                                            onClick={() => handleInvoiceClick(invoice)}
                                                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}
                                                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = ''}
                                                        >
                                                            <td className="text-primary">{invoice.invoice_no}</td>
                                                            <td>{invoice.date}</td>
                                                            <td>{invoice.amount}</td>
                                                            <td>
                                                                <span className={`badge ${invoice.status === 'paid' ? 'bg-success' : 'bg-warning'}`}>
                                                                    {invoice.status === 'paid' ? 'Ödendi' : 'Bekliyor'}
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </Table>
                                        ) : (
                                            <p className="text-muted">Fatura bulunamadı.</p>
                                        )}
                                    </Accordion.Body>
                                </Accordion.Item>
                            </Accordion>
                        </div>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={handleCloseModal}>
                        Kapat
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* Image Preview Modal */}
            <Modal
                show={!!selectedImage}
                onHide={() => setSelectedImage(null)}
                size="xl"
                centered
            >
                <Modal.Header closeButton style={{ backgroundColor: '#2c3e50', color: 'white' }}>
                    <Modal.Title>Görsel Önizleme</Modal.Title>
                </Modal.Header>
                <Modal.Body className="text-center p-0">
                    {selectedImage && (
                        <Image
                            src={selectedImage}
                            alt="Büyük görsel"
                            fluid
                            style={{ maxHeight: '80vh' }}
                        />
                    )}
                </Modal.Body>
            </Modal>

            {/* Invoice Detail Modal */}
            <Modal
                show={showInvoiceDetailModal}
                onHide={handleCloseInvoiceModal}
                size="lg"
                centered
            >
                <Modal.Header closeButton style={{ backgroundColor: '#2c3e50', color: 'white' }}>
                    <Modal.Title>
                        <FaFileInvoice className="me-2" />
                        Fatura Detayı
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {loadingInvoiceDetail ? (
                        <div className="text-center py-5">
                            <Spinner animation="border" />
                            <p className="mt-3">Fatura detayları yükleniyor...</p>
                        </div>
                    ) : invoiceDetail ? (
                        <div>
                            {/* Invoice Header Info */}
                            <Row className="mb-4">
                                <Col md={6}>
                                    <p><strong>Müşteri:</strong> {invoiceDetail.entity_name}</p>
                                    <p><strong>Fatura No:</strong> {invoiceDetail.doc_no}</p>
                                </Col>
                                <Col md={6} className="text-end">
                                    <p><strong>Tarih:</strong> {invoiceDetail.date}</p>
                                    <p><strong>Toplam:</strong> {invoiceDetail.amount}</p>
                                </Col>
                            </Row>

                            {/* Invoice Items */}
                            {invoiceDetail.items && invoiceDetail.items.length > 0 && (
                                <div>
                                    <h5 className="mb-3">Fatura Kalemleri</h5>
                                    <Table striped bordered hover responsive>
                                        <thead>
                                            <tr>
                                                <th>Ürün/Hizmet</th>
                                                <th>Miktar</th>
                                                <th>Birim</th>
                                                <th>Birim Fiyat</th>
                                                <th>Tutar</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {invoiceDetail.items.map((item, index) => (
                                                <tr key={index}>
                                                    <td>
                                                        {item.product_name}
                                                        {item.dimensions && (
                                                            <div className="small text-muted">{item.dimensions}</div>
                                                        )}
                                                    </td>
                                                    <td>{item.quantity || '-'}</td>
                                                    <td>{item.unit || '-'}</td>
                                                    <td>
                                                        {item.price_info?.is_foreign_currency ? (
                                                            <div>
                                                                <div>{formatCurrency(item.price_info.price_foreign || 0)} {item.price_info.currency_code}</div>
                                                                <div className="small text-muted">{formatCurrency(item.price_info.price_tl)} TL</div>
                                                            </div>
                                                        ) : (
                                                            formatCurrency(item.price || 0)
                                                        )}
                                                    </td>
                                                    <td>
                                                        {item.price_info?.is_foreign_currency ? (
                                                            <div>
                                                                <div>{formatCurrency(item.price_info.amount_foreign || 0)} {item.price_info.currency_code}</div>
                                                                <div className="small text-muted">{formatCurrency(item.price_info.amount_tl)} TL</div>
                                                            </div>
                                                        ) : (
                                                            formatCurrency((item.quantity || 0) * (item.price || 0))
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </Table>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="text-center py-5">
                            <p className="text-muted">Fatura detayları yüklenemedi.</p>
                        </div>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={handleCloseInvoiceModal}>
                        Kapat
                    </Button>
                </Modal.Footer>
            </Modal>
        </>
    );
}
