import React, { useState, useEffect, useCallback } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { Card, Container, Form, InputGroup, ListGroup, Modal, Button, Row, Col, Accordion, Table, Spinner, Image, Alert, Badge } from 'react-bootstrap';
import { FaSearch, FaMicrophone, FaHome, FaCheck, FaTimes, FaExpand, FaFileInvoice, FaHistory, FaUser, FaPhone, FaEnvelope, FaMapMarkerAlt, FaChartLine, FaTags, FaClipboardList } from 'react-icons/fa';
import Layout from "../../Layouts";
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    BarElement,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend
);

interface PendingItem {
    id: number;
    type: 'invoice' | 'offer';
    doc_no: string;
    entity_name: string;
    amount: string;
    date: string;
    sort_date?: string;
    entity_id?: number;
}

interface PendingResponse {
    data: PendingItem[];
    current_page: number;
    per_page: number;
    total: number;
    last_page: number;
    has_more: boolean;
}

interface ItemDetail {
    id: number;
    doc_no: string;
    entity_name: string;
    amount: string;
    date: string;
    entity_id?: number;
    items?: {
        quantity?: number;
        unit?: string;
        price?: number;
        dimensions?: string;
        product_name?: string;
        item_code?: string;
        price_info?: {
            price_tl: number;
            amount_tl: number;
            price_foreign?: number;
            amount_foreign?: number;
            currency_rate?: number;
            currency_name?: string;
            currency_code?: string;
            is_foreign_currency: boolean;
        };
    }[];
    images?: string[];
}

interface Invoice {
    id: number;
    invoice_no: string;
    amount: string; // Backend'den formatlanmış string geliyor
    date: string;
    status: number;
    entity_id?: number;
}

interface CustomerDetails {
    id: number;
    code: string;
    name: string;
    address: string;
    phone: string;
    email: string;
    tax_no: string;
}

interface CustomerAnalytics {
    entity: CustomerDetails;
    summary: {
        total_purchases_5_years: string;
        total_invoice_count: number;
        average_order_value: string;
    };
    recent_invoices: Array<{
        id: number;
        doc_no: string;
        doc_date: string;
        amount: string;
        status: number;
        items_count: number;
    }>;
    recent_offers: Array<{
        id: number;
        doc_no: string;
        doc_date: string;
        amount: string;
        status: number;
    }>;
    monthly_data: Array<{
        month: string;
        amount: number;
    }>;
    top_products: Array<{
        product_name: string;
        total_quantity: number;
        total_amount: number;
    }>;
}

interface Props {
    // Remove quotes prop as we'll fetch from API
}

export default function PendingQuotes(props: Props) {
    const [searchTerm, setSearchTerm] = useState('');
    const [items, setItems] = useState<PendingItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [page, setPage] = useState(1);
    const [isListening, setIsListening] = useState(false);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [selectedItem, setSelectedItem] = useState<PendingItem | null>(null);
    const [itemDetail, setItemDetail] = useState<ItemDetail | null>(null);
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [loadingDetail, setLoadingDetail] = useState(false);
    const [loadingInvoices, setLoadingInvoices] = useState(false);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [processing, setProcessing] = useState(false);
    const [showAlert, setShowAlert] = useState(false);
    const [alertMessage, setAlertMessage] = useState('');
    const [alertType, setAlertType] = useState<'success' | 'error'>('success');
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [rejectionNote, setRejectionNote] = useState('');
    const [isListeningNote, setIsListeningNote] = useState(false);
    const [showInvoiceDetailModal, setShowInvoiceDetailModal] = useState(false);
    const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
    const [invoiceDetail, setInvoiceDetail] = useState<ItemDetail | null>(null);
    const [loadingInvoiceDetail, setLoadingInvoiceDetail] = useState(false);

    // Customer analysis modal states
    const [showCustomerAnalysisModal, setShowCustomerAnalysisModal] = useState(false);
    const [customerAnalytics, setCustomerAnalytics] = useState<CustomerAnalytics | null>(null);
    const [loadingCustomerAnalytics, setLoadingCustomerAnalytics] = useState(false);
    const [selectedEntityId, setSelectedEntityId] = useState<number | null>(null);

    // Advanced search modal states
    const [showAdvancedSearchModal, setShowAdvancedSearchModal] = useState(false);
    const [isAdvancedSearchActive, setIsAdvancedSearchActive] = useState(false);
    const [advancedSearch, setAdvancedSearch] = useState({
        doc_no: '',
        entity_name: '',
        type: 'all', // 'all', 'invoices', 'offers'
        amount_min: '',
        amount_max: '',
        date_from: '',
        date_to: ''
    });

    const fetchItems = useCallback(async (pageNum: number = 1, resetItems: boolean = false, search: string = '', advanced: any = null) => {
        if (loading) return;

        setLoading(true);

        try {
            let url = `/onay-fatura-teklif/pending/api?page=${pageNum}&per_page=20`;

            if (advanced) {
                // Use advanced search parameters
                url += `&type=${advanced.type}`;
                if (advanced.doc_no) url += `&doc_no=${encodeURIComponent(advanced.doc_no)}`;
                if (advanced.entity_name) url += `&entity_name=${encodeURIComponent(advanced.entity_name)}`;
                if (advanced.amount_min) url += `&amount_min=${encodeURIComponent(advanced.amount_min)}`;
                if (advanced.amount_max) url += `&amount_max=${encodeURIComponent(advanced.amount_max)}`;
                if (advanced.date_from) url += `&date_from=${encodeURIComponent(advanced.date_from)}`;
                if (advanced.date_to) url += `&date_to=${encodeURIComponent(advanced.date_to)}`;
            } else {
                // Use simple search
                url += `&type=all`;
                if (search) url += `&search=${encodeURIComponent(search)}`;
            }

            const response = await fetch(url);
            const data: PendingResponse = await response.json();

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

    // Search effect with debouncing
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            setItems([]);
            setPage(1);
            setHasMore(true);
            setIsAdvancedSearchActive(false); // Reset advanced search when using simple search
            fetchItems(1, true, searchTerm);
        }, 500);

        return () => clearTimeout(timeoutId);
    }, [searchTerm]);

    useEffect(() => {
        const handleScroll = () => {
            if (
                window.innerHeight + document.documentElement.scrollTop
                >= document.documentElement.offsetHeight - 200 &&
                !loading &&
                hasMore
            ) {
                if (isAdvancedSearchActive) {
                    fetchItems(page + 1, false, '', advancedSearch);
                } else {
                    fetchItems(page + 1, false, searchTerm);
                }
            }
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, [fetchItems, page, loading, hasMore, searchTerm, isAdvancedSearchActive, advancedSearch]);

    // Use server-side search instead of client-side filtering
    const filteredQuotes = items;

    const getStatusColor = (status: string) => {
        switch (status) {
            case '2':
                return '#ffc107';
            case '4':
                return '#28a745';
            case '1':
                return '#dc3545';
            default:
                return '#6c757d';
        }
    };

    const getStatusText = (item: PendingItem) => {
        if (item.type === 'invoice') {
            return 'F'; // Fatura
        } else if (item.type === 'offer') {
            return 'T'; // Teklif
        }
        return 'B'; // Bekliyor
    };

    const truncateEntityName = (name: string) => {
        const words = name.split(' ');
        return words.slice(0, 2).join(' ') + (words.length > 2 ? '...' : '');
    };

    const handleItemClick = async (item: PendingItem) => {
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
                    images: [
                        '/images/mermer-blok-1.jpg',
                        '/images/mermer-blok-2.jpg',
                        '/images/mermer-blok-3.jpg'
                    ]
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

    const handleCustomerNameClick = async (entityId: number) => {
        setSelectedEntityId(entityId);
        setLoadingCustomerAnalytics(true);
        setShowCustomerAnalysisModal(true);

        try {
            const response = await fetch(`/onay-fatura-teklif/cari-analiz/${entityId}`);
            const analytics = await response.json();
            setCustomerAnalytics(analytics);
        } catch (error) {
            console.error('Customer analytics fetch error:', error);
        } finally {
            setLoadingCustomerAnalytics(false);
        }
    };

    const handleCloseCustomerAnalysisModal = () => {
        setShowCustomerAnalysisModal(false);
        setCustomerAnalytics(null);
        setSelectedEntityId(null);
    };

    const getStatusBadge = (status: number, type: 'invoice' | 'offer') => {
        if (type === 'invoice') {
            switch (status) {
                case 1: return <Badge bg="info">Bekliyor</Badge>;
                case 2: return <Badge bg="warning">Onaylanıyor</Badge>;
                case 3: return <Badge bg="danger">Reddedildi</Badge>;
                case 4: return <Badge bg="success">Onaylı</Badge>;
                default: return <Badge bg="secondary">Bilinmiyor</Badge>;
            }
        } else {
            switch (status) {
                case 1: return <Badge bg="info">Bekliyor</Badge>;
                case 2: return <Badge bg="warning">Onaylanıyor</Badge>;
                case 3: return <Badge bg="danger">Reddedildi</Badge>;
                case 4: return <Badge bg="success">Onaylı</Badge>;
                default: return <Badge bg="secondary">Bilinmiyor</Badge>;
            }
        }
    };

    const createMonthlyTrendChart = () => {
        if (!customerAnalytics?.monthly_data) return null;

        const chartData = {
            labels: customerAnalytics.monthly_data.map(item => item.month),
            datasets: [
                {
                    label: 'Aylık Alım Tutarı (TL)',
                    data: customerAnalytics.monthly_data.map(item => item.amount),
                    borderColor: '#0d6efd',
                    backgroundColor: 'rgba(13, 110, 253, 0.1)',
                    borderWidth: 3,
                    pointBackgroundColor: '#0d6efd',
                    pointBorderColor: '#ffffff',
                    pointBorderWidth: 2,
                    pointRadius: 6,
                    fill: true,
                    tension: 0.4,
                }
            ]
        };

        const options = {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top' as const,
                    labels: {
                        font: {
                            size: 12
                        }
                    }
                },
                title: {
                    display: false,
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    titleColor: '#fff',
                    bodyColor: '#fff',
                    borderColor: '#0d6efd',
                    borderWidth: 1,
                    callbacks: {
                        label: function(context: any) {
                            return `${context.dataset.label}: ${new Intl.NumberFormat('tr-TR', {
                                minimumFractionDigits: 2
                            }).format(context.parsed.y)} TL`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(0, 0, 0, 0.1)',
                    },
                    ticks: {
                        callback: function(value: any) {
                            return new Intl.NumberFormat('tr-TR', {
                                minimumFractionDigits: 0,
                                maximumFractionDigits: 0
                            }).format(value) + ' TL';
                        }
                    }
                },
                x: {
                    grid: {
                        color: 'rgba(0, 0, 0, 0.1)',
                    }
                }
            }
        };

        return <Line data={chartData} options={options} height={200} />;
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('tr-TR', {
            style: 'currency',
            currency: 'TRY'
        }).format(amount);
    };

    const handleApprove = async () => {
        if (!selectedItem) return;

        setProcessing(true);
        try {
            const response = await fetch(`/onay-fatura-teklif/api/${selectedItem.type}/${selectedItem.id}/approve`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''
                },
            });

            if (response.ok) {
                setAlertType('success');
                setAlertMessage(`Seçili carinin ${selectedItem.type === 'invoice' ? 'faturasını' : 'teklifini'} onayladınız`);
                setShowAlert(true);

                // Remove item from list
                setItems(prev => prev.filter(item => !(item.id === selectedItem.id && item.type === selectedItem.type)));

                // Close modal after delay
                setTimeout(() => {
                    handleCloseModal();
                    setShowAlert(false);
                }, 2000);
            } else {
                setAlertType('error');
                setAlertMessage('Onaylama sırasında bir hata oluştu');
                setShowAlert(true);
            }
        } catch (error) {
            console.error('Error approving item:', error);
            setAlertType('error');
            setAlertMessage('Onaylama sırasında bir hata oluştu');
            setShowAlert(true);
        } finally {
            setProcessing(false);
        }
    };

    const handleReject = () => {
        setShowRejectModal(true);
    };

    const handleConfirmReject = async () => {
        if (!selectedItem) return;

        setProcessing(true);
        try {
            const response = await fetch(`/onay-fatura-teklif/api/${selectedItem.type}/${selectedItem.id}/reject`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''
                },
                body: JSON.stringify({
                    note: rejectionNote
                })
            });

            if (response.ok) {
                setAlertType('success');
                setAlertMessage(`Seçili carinin ${selectedItem.type === 'invoice' ? 'faturasını' : 'teklifini'} geri gönderdiniz`);
                setShowAlert(true);

                // Remove item from list
                setItems(prev => prev.filter(item => !(item.id === selectedItem.id && item.type === selectedItem.type)));

                // Close modals and reset
                setShowRejectModal(false);
                setRejectionNote('');

                // Close detail modal after delay
                setTimeout(() => {
                    handleCloseModal();
                    setShowAlert(false);
                }, 2000);
            } else {
                setAlertType('error');
                setAlertMessage('Geri gönderme sırasında bir hata oluştu');
                setShowAlert(true);
            }
        } catch (error) {
            console.error('Error rejecting item:', error);
            setAlertType('error');
            setAlertMessage('Geri gönderme sırasında bir hata oluştu');
            setShowAlert(true);
        } finally {
            setProcessing(false);
        }
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

    const handleVoiceNote = () => {
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
            setIsListeningNote(true);
        };

        recognition.onresult = (event: any) => {
            const transcript = event.results[0][0].transcript;
            setRejectionNote(prev => prev + (prev ? ' ' : '') + transcript);
            setIsListeningNote(false);
        };

        recognition.onerror = (event: any) => {
            console.error('Speech recognition error:', event.error);
            setIsListeningNote(false);
            alert('Ses tanıma hatası: ' + event.error);
        };

        recognition.onend = () => {
            setIsListeningNote(false);
        };

        if (isListeningNote) {
            recognition.stop();
        } else {
            recognition.start();
        }
    };

    return (
        <>
            <Head title="Bekleyen Onaylar" />

            <div style={{ backgroundColor: '#2c3e50', minHeight: '100vh' }}>
                <Container fluid className="py-2">
                    <Card style={{ backgroundColor: '#34495e', border: 'none' }}>
                        <Card.Body className="p-2">
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
                                <InputGroup.Text
                                    style={{
                                        backgroundColor: 'white',
                                        border: '1px solid #ced4da',
                                        cursor: 'pointer'
                                    }}
                                    onClick={() => router.visit('/onay-fatura-teklif/history')}
                                    title="Onay Geçmişi"
                                >
                                    <FaHistory color="#6c757d" />
                                </InputGroup.Text>
                                <InputGroup.Text
                                    style={{
                                        backgroundColor: 'white',
                                        border: '1px solid #ced4da',
                                        borderLeft: 'none',
                                        cursor: 'pointer'
                                    }}
                                    onClick={() => setShowAdvancedSearchModal(true)}
                                    title="Detaylı Arama"
                                >
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
                                {filteredQuotes.map((item) => (
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
                                                <span style={{ color: getStatusColor('pending'), fontWeight: 'bold' }}>
                                                    {getStatusText(item)}
                                                </span>
                                            </div>
                                        </div>
                                    </ListGroup.Item>
                                ))}
                            </ListGroup>

                            {filteredQuotes.length === 0 && !loading && (
                                <div className="text-center py-5">
                                    <p className="text-white-50">Bekleyen onay bulunamadı.</p>
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
                                    <p
                                        className="fw-bold text-primary"
                                        style={{ cursor: 'pointer', textDecoration: 'underline' }}
                                        onClick={() => handleCustomerNameClick(itemDetail.entity_id || selectedItem?.entity_id || 0)}
                                        title="Müşteri analizini görüntüle"
                                    >
                                        {itemDetail.entity_name}
                                    </p>
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
                                                        <p className="mb-1"><strong>Kodu:</strong> {detail.item_code || '-'}</p>
                                                        <p className="mb-1"><strong>Kaç ton almış?</strong> {detail.quantity} {detail.unit}</p>
                                                    </Col>
                                                    <Col md={6}>
                                                        {detail.price_info?.is_foreign_currency ? (
                                                            <div>
                                                                <p className="mb-1"><strong>Birim Fiyat:</strong> {formatCurrency(detail.price_info.price_tl || 0)} ({detail.price_info.price_foreign?.toLocaleString('tr-TR', { minimumFractionDigits: 2 }) || 0} {detail.price_info.currency_code})</p>
                                                                <p className="mb-1"><strong>Tutar:</strong> {formatCurrency(detail.price_info.amount_tl || 0)} ({detail.price_info.amount_foreign?.toLocaleString('tr-TR', { minimumFractionDigits: 2 }) || 0} {detail.price_info.currency_code})</p>

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
                                            <Col xs={4} key={index} className="mb-2">
                                                <Image
                                                    src={image}
                                                    alt={`Görsel ${index + 1}`}
                                                    thumbnail
                                                    style={{ cursor: 'pointer', height: '80px', objectFit: 'cover' }}
                                                    onClick={() => setSelectedImage(image)}
                                                />
                                            </Col>
                                        ))
                                    ) : (
                                        [1, 2, 3].map((index) => (
                                            <Col xs={4} key={index} className="mb-2">
                                                <Image
                                                    src={`/images/mermer-blok-${index}.jpg`}
                                                    alt={`Varsayılan Görsel ${index}`}
                                                    thumbnail
                                                    style={{ cursor: 'pointer', height: '80px', objectFit: 'cover' }}
                                                    onClick={() => setSelectedImage(`/images/default-${index}.jpg`)}
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
                    <div className="d-flex justify-content-center gap-3 w-100">
                        <Button
                            variant="danger"
                            size="lg"
                            onClick={handleReject}
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

            {/* Reject Confirmation Modal */}
            <Modal
                show={showRejectModal}
                onHide={() => setShowRejectModal(false)}
                centered
                size="md"
            >
                <Modal.Header closeButton className="bg-warning ">
                    <Modal.Title className="text-white">Geri Gönderme Onayı</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <p>Bu {selectedItem?.type === 'invoice' ? 'faturayı' : 'teklifi'} geri göndermek istediğinizden emin misiniz?</p>

                    <Form.Group className="mt-3">
                        <Form.Label>Not (İsteğe bağlı)</Form.Label>
                        <InputGroup>
                            <Form.Control
                                as="textarea"
                                rows={3}
                                value={rejectionNote}
                                onChange={(e) => setRejectionNote(e.target.value)}
                                placeholder="Geri gönderme sebebinizi yazabilirsiniz..."
                            />
                            <InputGroup.Text
                                style={{
                                    backgroundColor: isListeningNote ? '#dc3545' : 'white',
                                    border: '1px solid #ced4da',
                                    cursor: 'pointer',
                                    transition: 'background-color 0.3s'
                                }}
                                onClick={handleVoiceNote}
                                title={isListeningNote ? 'Dinlemeyi durdur' : 'Sesli not'}
                            >
                                <FaMicrophone color={isListeningNote ? 'white' : '#6c757d'} />
                            </InputGroup.Text>
                        </InputGroup>
                        <Form.Text className="text-muted">
                            Mikrofon butonunu kullanarak sesli not ekleyebilirsiniz.
                        </Form.Text>
                    </Form.Group>
                </Modal.Body>
                <Modal.Footer>
                    <Button
                        variant="secondary"
                        onClick={() => {
                            setShowRejectModal(false);
                            setRejectionNote('');
                        }}
                        disabled={processing}
                    >
                        İptal
                    </Button>
                    <Button
                        variant="danger"
                        onClick={handleConfirmReject}
                        disabled={processing}
                    >
                        {processing ? (
                            <>
                                <Spinner
                                    as="span"
                                    animation="border"
                                    size="sm"
                                    role="status"
                                    aria-hidden="true"
                                    className="me-2"
                                />
                                Gönderiliyor...
                            </>
                        ) : (
                            'Geri Gönder'
                        )}
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* Alert Modal */}
            <Modal
                show={showAlert}
                onHide={() => setShowAlert(false)}
                centered
                size="sm"
            >
                <Modal.Body className="text-center py-4">
                    <Alert variant={alertType} className="mb-3">
                        {alertMessage}
                    </Alert>
                </Modal.Body>
            </Modal>

            {/* Invoice Detail Modal */}
            <Modal
                show={showInvoiceDetailModal}
                onHide={handleCloseInvoiceModal}
                size="lg"
                centered
            >
                <Modal.Header closeButton style={{ backgroundColor: '#cccccc', color: 'white' }}>
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
                                    <p>
                                        <strong>Müşteri:</strong>
                                        <span
                                            className="text-primary ms-2"
                                            style={{ cursor: 'pointer', textDecoration: 'underline' }}
                                            onClick={() => handleCustomerNameClick(invoiceDetail.entity_id || selectedInvoice?.entity_id || 0)}
                                            title="Müşteri analizini görüntüle"
                                        >
                                            {invoiceDetail.entity_name}
                                        </span>
                                    </p>
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

            {/* Advanced Search Modal */}
            <Modal
                show={showAdvancedSearchModal}
                onHide={() => setShowAdvancedSearchModal(false)}
                size="lg"
            >
                <Modal.Header closeButton>
                    <Modal.Title>Detaylı Arama</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Row>
                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label>Belge No</Form.Label>
                                <Form.Control
                                    type="text"
                                    placeholder="Fatura/Teklif numarası giriniz"
                                    value={advancedSearch.doc_no}
                                    onChange={(e) => setAdvancedSearch(prev => ({...prev, doc_no: e.target.value}))}
                                />
                            </Form.Group>
                        </Col>
                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label>Müşteri Adı</Form.Label>
                                <Form.Control
                                    type="text"
                                    placeholder="Müşteri adı giriniz"
                                    value={advancedSearch.entity_name}
                                    onChange={(e) => setAdvancedSearch(prev => ({...prev, entity_name: e.target.value}))}
                                />
                            </Form.Group>
                        </Col>
                    </Row>

                    <Row>
                        <Col md={12}>
                            <Form.Group className="mb-3">
                                <Form.Label>Belge Türü</Form.Label>
                                <Form.Select
                                    value={advancedSearch.type}
                                    onChange={(e) => setAdvancedSearch(prev => ({...prev, type: e.target.value}))}
                                >
                                    <option value="all">Tümü</option>
                                    <option value="invoices">Sadece Faturalar</option>
                                    <option value="offers">Sadece Teklifler</option>
                                </Form.Select>
                            </Form.Group>
                        </Col>
                    </Row>

                    <Row>
                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label>Min Tutar</Form.Label>
                                <Form.Control
                                    type="number"
                                    placeholder="Minimum tutar"
                                    value={advancedSearch.amount_min}
                                    onChange={(e) => setAdvancedSearch(prev => ({...prev, amount_min: e.target.value}))}
                                />
                            </Form.Group>
                        </Col>
                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label>Max Tutar</Form.Label>
                                <Form.Control
                                    type="number"
                                    placeholder="Maksimum tutar"
                                    value={advancedSearch.amount_max}
                                    onChange={(e) => setAdvancedSearch(prev => ({...prev, amount_max: e.target.value}))}
                                />
                            </Form.Group>
                        </Col>
                    </Row>

                    <Row>
                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label>Başlangıç Tarihi</Form.Label>
                                <Form.Control
                                    type="date"
                                    value={advancedSearch.date_from}
                                    onChange={(e) => setAdvancedSearch(prev => ({...prev, date_from: e.target.value}))}
                                />
                            </Form.Group>
                        </Col>
                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label>Bitiş Tarihi</Form.Label>
                                <Form.Control
                                    type="date"
                                    value={advancedSearch.date_to}
                                    onChange={(e) => setAdvancedSearch(prev => ({...prev, date_to: e.target.value}))}
                                />
                            </Form.Group>
                        </Col>
                    </Row>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => {
                        setAdvancedSearch({
                            doc_no: '',
                            entity_name: '',
                            type: 'all',
                            amount_min: '',
                            amount_max: '',
                            date_from: '',
                            date_to: ''
                        });
                        setIsAdvancedSearchActive(false);
                        setSearchTerm('');
                        setItems([]);
                        setPage(1);
                        setHasMore(true);
                        fetchItems(1, true);
                    }}>
                        Temizle
                    </Button>
                    <Button variant="primary" onClick={() => {
                        setItems([]);
                        setPage(1);
                        setHasMore(true);
                        setIsAdvancedSearchActive(true);
                        setSearchTerm(''); // Clear simple search when using advanced
                        fetchItems(1, true, '', advancedSearch);
                        setShowAdvancedSearchModal(false);
                    }}>
                        Ara
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* Customer Analysis Modal */}
            <Modal
                show={showCustomerAnalysisModal}
                onHide={handleCloseCustomerAnalysisModal}
                size="xl"
                centered
            >
                <Modal.Header closeButton style={{ backgroundColor: '#2c3e50', color: 'white' }}>
                    <Modal.Title className="text-white">
                        <FaUser className="me-2" />
                        Müşteri Analizi

                    </Modal.Title>
                </Modal.Header>
                <Modal.Body style={{ maxHeight: '80vh', overflowY: 'auto' }}>
                    {loadingCustomerAnalytics ? (
                        <div className="text-center py-5">
                            <Spinner animation="border" />
                            <p className="mt-3">Müşteri analizi yükleniyor...</p>
                        </div>
                    ) : customerAnalytics ? (
                        <div>
                            {/* Customer Info Header */}
                            <Card className="mb-4">
                                <Card.Header>
                                    <h5 className="mb-0">
                                        <FaUser className="me-2" />
                                        Müşteri Bilgileri
                                    </h5>
                                </Card.Header>
                                <Card.Body>
                                    <Row>
                                        <Col md={6}>
                                            <p><strong>Müşteri Kodu:</strong> {customerAnalytics.entity.code}</p>
                                            <p><strong>Firma Adı:</strong> {customerAnalytics.entity.name}</p>
                                            <p><strong>Vergi No:</strong> {customerAnalytics.entity.tax_no || 'Belirtilmemiş'}</p>
                                        </Col>
                                        <Col md={6}>
                                            <p><FaPhone className="me-2" />{customerAnalytics.entity.phone || 'Belirtilmemiş'}</p>
                                            <p><FaEnvelope className="me-2" />{customerAnalytics.entity.email || 'Belirtilmemiş'}</p>
                                            <p><FaMapMarkerAlt className="me-2" />{customerAnalytics.entity.address || 'Belirtilmemiş'}</p>
                                        </Col>
                                    </Row>
                                </Card.Body>
                            </Card>

                            {/* Summary Statistics */}
                            <Row className="mb-4">
                                <Col md={4}>
                                    <Card className="text-center">
                                        <Card.Body>
                                            <h4 className="text-primary">{customerAnalytics.summary.total_purchases_5_years}</h4>
                                            <p className="mb-0">Son 5 Yıl Toplam Alım</p>
                                        </Card.Body>
                                    </Card>
                                </Col>
                                <Col md={4}>
                                    <Card className="text-center">
                                        <Card.Body>
                                            <h4 className="text-success">{customerAnalytics.summary.total_invoice_count}</h4>
                                            <p className="mb-0">Toplam Fatura Sayısı</p>
                                        </Card.Body>
                                    </Card>
                                </Col>
                                <Col md={4}>
                                    <Card className="text-center">
                                        <Card.Body>
                                            <h4 className="text-info">{customerAnalytics.summary.average_order_value}</h4>
                                            <p className="mb-0">Ortalama Sipariş Tutarı</p>
                                        </Card.Body>
                                    </Card>
                                </Col>
                            </Row>

                            <Row>
                                {/* Monthly Purchase Chart */}
                                <Col lg={6} className="mb-4">
                                    <Card>
                                        <Card.Header>
                                            <h6 className="mb-0">
                                                <FaChartLine className="me-2" />
                                                Aylık Alım Trendi (Son 12 Ay)
                                            </h6>
                                        </Card.Header>
                                        <Card.Body>
                                            {customerAnalytics.monthly_data && customerAnalytics.monthly_data.length > 0 ? (
                                                <>
                                                    <div style={{ height: '200px', marginBottom: '15px' }}>
                                                        {createMonthlyTrendChart()}
                                                    </div>
                                                    <div style={{ maxHeight: '150px', overflowY: 'auto' }}>
                                                        <Table striped size="sm">
                                                            <thead>
                                                                <tr>
                                                                    <th>Ay</th>
                                                                    <th>Tutar (TL)</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {customerAnalytics.monthly_data.map((month, index) => (
                                                                    <tr key={index}>
                                                                        <td>{month.month}</td>
                                                                        <td>{new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 2 }).format(month.amount)}</td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </Table>
                                                    </div>
                                                </>
                                            ) : (
                                                <div className="text-center py-3">
                                                    <p className="text-muted mb-0">Aylık trend verisi bulunamadı</p>
                                                </div>
                                            )}
                                        </Card.Body>
                                    </Card>
                                </Col>

                                {/* Top Products */}
                                <Col lg={6} className="mb-4">
                                    <Card>
                                        <Card.Header>
                                            <h6 className="mb-0">
                                                <FaTags className="me-2" />
                                                En Çok Alınan Ürünler
                                            </h6>
                                        </Card.Header>
                                        <Card.Body style={{ maxHeight: '400px', overflowY: 'auto' }}>
                                            {customerAnalytics.top_products.length > 0 ? (
                                                <Table striped size="sm">
                                                    <thead>
                                                        <tr>
                                                            <th>Ürün Adı</th>
                                                            <th>Miktar</th>
                                                            <th>Tutar</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {customerAnalytics.top_products.map((product, index) => (
                                                            <tr key={index}>
                                                                <td>{product.product_name}</td>
                                                                <td>{product.total_quantity}</td>
                                                                <td>{new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 2 }).format(product.total_amount)} TL</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </Table>
                                            ) : (
                                                <p className="text-muted">Ürün detayı bulunamadı</p>
                                            )}
                                        </Card.Body>
                                    </Card>
                                </Col>
                            </Row>

                            <Row>
                                {/* Recent Invoices */}
                                <Col lg={6} className="mb-4">
                                    <Card>
                                        <Card.Header>
                                            <h6 className="mb-0">
                                                <FaFileInvoice className="me-2" />
                                                Son Faturalar
                                            </h6>
                                        </Card.Header>
                                        <Card.Body style={{ maxHeight: '300px', overflowY: 'auto' }}>
                                            {customerAnalytics.recent_invoices.length > 0 ? (
                                                <Table striped size="sm">
                                                    <thead>
                                                        <tr>
                                                            <th>Belge No</th>
                                                            <th>Tarih</th>
                                                            <th>Tutar</th>
                                                            <th>Durum</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {customerAnalytics.recent_invoices.map((invoice) => (
                                                            <tr key={invoice.id}>
                                                                <td>{invoice.doc_no}</td>
                                                                <td>{invoice.doc_date}</td>
                                                                <td>{invoice.amount}</td>
                                                                <td>{getStatusBadge(invoice.status, 'invoice')}</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </Table>
                                            ) : (
                                                <p className="text-muted">Fatura bulunamadı</p>
                                            )}
                                        </Card.Body>
                                    </Card>
                                </Col>

                                {/* Recent Offers */}
                                <Col lg={6} className="mb-4">
                                    <Card>
                                        <Card.Header>
                                            <h6 className="mb-0">
                                                <FaClipboardList className="me-2" />
                                                Son Teklifler
                                            </h6>
                                        </Card.Header>
                                        <Card.Body style={{ maxHeight: '300px', overflowY: 'auto' }}>
                                            {customerAnalytics.recent_offers.length > 0 ? (
                                                <Table striped size="sm">
                                                    <thead>
                                                        <tr>
                                                            <th>Belge No</th>
                                                            <th>Tarih</th>
                                                            <th>Tutar</th>
                                                            <th>Durum</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {customerAnalytics.recent_offers.map((offer) => (
                                                            <tr key={offer.id}>
                                                                <td>{offer.doc_no}</td>
                                                                <td>{offer.doc_date}</td>
                                                                <td>{offer.amount}</td>
                                                                <td>{getStatusBadge(offer.status, 'offer')}</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </Table>
                                            ) : (
                                                <p className="text-muted">Teklif bulunamadı</p>
                                            )}
                                        </Card.Body>
                                    </Card>
                                </Col>
                            </Row>
                        </div>
                    ) : (
                        <div className="text-center py-5">
                            <p className="text-muted">Müşteri analiz verileri yüklenemedi.</p>
                        </div>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={handleCloseCustomerAnalysisModal}>
                        Kapat
                    </Button>
                </Modal.Footer>
            </Modal>
        </>
    );
}
