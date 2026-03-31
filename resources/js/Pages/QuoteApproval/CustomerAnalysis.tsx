import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Head, router } from '@inertiajs/react';
import { Card, Container, Form, InputGroup, Row, Col, Table, Badge, ListGroup, Spinner, Modal, Button, Image } from 'react-bootstrap';
import { FaSearch, FaMicrophone, FaHome, FaUser, FaPhone, FaEnvelope, FaMapMarkerAlt, FaFileInvoice, FaClipboardList, FaChartLine, FaTags } from 'react-icons/fa';
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
import {formatNumber} from "chart.js/helpers";

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


interface Customer {
    id: number;
    entity_code: string;
    entity_name: string;
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

interface InvoiceDetail {
    id: number;
    doc_no: string;
    entity_name: string;
    entity_id?: number;
    amount: string;
    date: string;
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

interface CustomerAnalytics {
    entity: CustomerDetails;
    summary: {
        total_purchases_5_years: string;
        total_purchases_5_years_raw: number;
        total_invoice_count: number;
        average_order_value: string;
        average_order_value_raw: number;
        currency: string;
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

export default function CustomerAnalysis() {
    const [searchTerm, setSearchTerm] = useState('');
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
    const [customerAnalytics, setCustomerAnalytics] = useState<CustomerAnalytics | null>(null);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [loading, setLoading] = useState(false);
    const [analyticsLoading, setAnalyticsLoading] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const searchRef = useRef<HTMLInputElement>(null);

    // Invoice detail modal states
    const [showInvoiceDetailModal, setShowInvoiceDetailModal] = useState(false);
    const [selectedInvoiceId, setSelectedInvoiceId] = useState<number | null>(null);
    const [invoiceDetail, setInvoiceDetail] = useState<InvoiceDetail | null>(null);
    const [loadingInvoiceDetail, setLoadingInvoiceDetail] = useState(false);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);

    // Chart filter states
    const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
    const [availableYears, setAvailableYears] = useState<number[]>([]);
    const [loadingChart, setLoadingChart] = useState(false);

    // Currency filter states
    const [selectedCurrency, setSelectedCurrency] = useState<string>('USD'); // Default to USD
    const [currencyLoading, setCurrencyLoading] = useState<boolean>(false);
    const [availableCurrencies] = useState<{code: string, name: string, symbol: string}[]>([
        {code: 'USD', name: 'Amerikan Doları', symbol: '$'},
        {code: 'EUR', name: 'Euro', symbol: '€'},
        {code: 'TRY', name: 'Türk Lirası', symbol: '₺'}
    ]);

    // Debounced search for autocomplete
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            if (searchTerm.length >= 2) {
                searchCustomers();
            } else {
                setCustomers([]);
                setShowSuggestions(false);
            }
        }, 300);

        return () => clearTimeout(timeoutId);
    }, [searchTerm]);

    const searchCustomers = async () => {
        if (loading) return;

        setLoading(true);
        try {
            const response = await fetch(`/onay-fatura-teklif/cari-analiz/search?search=${encodeURIComponent(searchTerm)}`);
            const data = await response.json();
            setCustomers(data);
            setShowSuggestions(true);
        } catch (error) {
            console.error('Customer search error:', error);
        } finally {
            setLoading(false);
        }
    };

    const selectCustomer = async (customer: Customer) => {
        setSelectedCustomer(customer);
        setSearchTerm(`${customer.entity_code} - ${customer.entity_name}`);
        setShowSuggestions(false);
        setAnalyticsLoading(true);

        try {
            const response = await fetch(`/onay-fatura-teklif/cari-analiz/${customer.id}?currency=${selectedCurrency}`);
            const analytics = await response.json();
            setCustomerAnalytics(analytics);

            // Set available years and current year from response
            if (analytics.available_years) {
                setAvailableYears(analytics.available_years);
                // Set the year returned from backend (current_year)
                if (analytics.current_year) {
                    setSelectedYear(analytics.current_year);
                } else if (analytics.available_years.length > 0) {
                    setSelectedYear(analytics.available_years[0]);
                }
            }
        } catch (error) {
            console.error('Analytics fetch error:', error);
        } finally {
            setAnalyticsLoading(false);
        }
    };

    const clearSearch = () => {
        setSearchTerm('');
        setSelectedCustomer(null);
        setCustomerAnalytics(null);
        setShowSuggestions(false);
        setAvailableYears([]);
        setSelectedYear(new Date().getFullYear());
        setSelectedCurrency('USD'); // Reset to default currency
        setCurrencyLoading(false); // Reset currency loading state
        if (searchRef.current) {
            searchRef.current.focus();
        }
    };

    const fetchMonthlyData = async (year: number, currency?: string) => {
        if (!selectedCustomer) return;

        setLoadingChart(true);
        const targetCurrency = currency || selectedCurrency;
        try {
            const response = await fetch(`/onay-fatura-teklif/cari-analiz/${selectedCustomer.id}/monthly-data?year=${year}&currency=${targetCurrency}`);
            const data = await response.json();

            // Update monthly data in customerAnalytics
            if (customerAnalytics) {
                setCustomerAnalytics(prevAnalytics => ({
                    ...prevAnalytics!,
                    monthly_data: data.monthly_data
                }));
            }
        } catch (error) {
            console.error('Monthly data fetch error:', error);
        } finally {
            setLoadingChart(false);
        }
    };

    const handleYearChange = (year: number) => {
        setSelectedYear(year);
        fetchMonthlyData(year);
    };

    const handleCurrencyChange = async (currency: string) => {
        // If customer is already selected, refetch data with new currency
        if (selectedCustomer) {
            setCurrencyLoading(true);
            const previousCurrency = selectedCurrency;
            
            try {
                // Update currency state first to avoid UI flickering
                setSelectedCurrency(currency);
                
                const response = await fetch(`/onay-fatura-teklif/cari-analiz/${selectedCustomer.id}?currency=${currency}`);
                const analytics = await response.json();

                // Update analytics data
                setCustomerAnalytics(analytics);

                // Refresh monthly data for current year with new currency
                await fetchMonthlyData(selectedYear, currency);
            } catch (error) {
                console.error('Analytics fetch error:', error);
                // Revert currency selection on error
                setSelectedCurrency(previousCurrency);
            } finally {
                setCurrencyLoading(false);
            }
        } else {
            // Just update currency if no customer selected
            setSelectedCurrency(currency);
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

        recognition.start();
    };

    const handleInvoiceClick = async (invoiceId: number) => {
        setSelectedInvoiceId(invoiceId);
        setLoadingInvoiceDetail(true);
        setShowInvoiceDetailModal(true);

        try {
            const response = await fetch(`/onay-fatura-teklif/api/invoice/${invoiceId}/detail`);
            const detail = await response.json();
            setInvoiceDetail(detail);
        } catch (error) {
            console.error('Invoice detail fetch error:', error);
        } finally {
            setLoadingInvoiceDetail(false);
        }
    };

    const handleCloseInvoiceModal = () => {
        setShowInvoiceDetailModal(false);
        setSelectedInvoiceId(null);
        setInvoiceDetail(null);
        setSelectedImage(null);
    };

    const formatCurrency = useCallback((amount: number, currency?: string) => {
        const targetCurrency = currency || selectedCurrency;
        const currencyInfo = availableCurrencies.find(c => c.code === targetCurrency) || availableCurrencies[0];
        return new Intl.NumberFormat('tr-TR', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(amount) + ' ' + currencyInfo.symbol;
    }, [selectedCurrency, availableCurrencies]);

    // Memoized summary statistics to ensure they update with currency changes
    const summaryStats = useMemo(() => {
        if (!customerAnalytics || currencyLoading) return null;
        
        // Only update if we have valid raw data and currency is not loading
        if (customerAnalytics.summary.total_purchases_5_years_raw !== undefined && 
            customerAnalytics.summary.average_order_value_raw !== undefined) {
            return {
                totalPurchases: formatCurrency(customerAnalytics.summary.total_purchases_5_years_raw, selectedCurrency),
                averageOrder: formatCurrency(customerAnalytics.summary.average_order_value_raw, selectedCurrency)
            };
        }
        return null;
    }, [customerAnalytics, selectedCurrency, formatCurrency, currencyLoading]);

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

        const currentCurrencyInfo = availableCurrencies.find(c => c.code === selectedCurrency) || availableCurrencies[0];

        const chartData = {
            labels: customerAnalytics.monthly_data.map(item => item.month),
            datasets: [
                {
                    label: `Aylık Alım Tutarı (${currentCurrencyInfo.symbol})`,
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
                            }).format(context.parsed.y)} ${currentCurrencyInfo.symbol}`;
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
                            }).format(value) + ' ' + currentCurrencyInfo.symbol;
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

        return <Line data={chartData} options={options} height={300} />;
    };

    return (
        <>
            <Head title="Cari Analiz" />

            <div style={{ backgroundColor: '#2c3e50', minHeight: '100vh' }}>
                <Container fluid className="py-4">
                    <Card style={{ backgroundColor: '#34495e', border: 'none' }}>
                        <Card.Body className="p-0">
                            <InputGroup className="mb-4">
                                <InputGroup.Text
                                    style={{
                                        backgroundColor: 'white',
                                        border: '1px solid #ced4da',
                                        cursor: 'pointer'
                                    }}
                                    onClick={() => router.visit('/onay-fatura-teklif/')}
                                    title="Ana Sayfa"
                                >
                                    <FaHome color="#6c757d" />
                                </InputGroup.Text>
                                <InputGroup.Text
                                    style={{
                                        backgroundColor: 'white',
                                        border: '1px solid #ced4da',
                                        borderLeft: 'none',
                                        cursor: 'pointer'
                                    }}
                                    onClick={clearSearch}
                                    title="Temizle"
                                >
                                    <FaSearch />
                                </InputGroup.Text>
                                <Form.Control
                                    ref={searchRef}
                                    type="text"
                                    placeholder="Cari kodu veya adı ile arama yapınız..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    style={{
                                        border: '1px solid #ced4da',
                                        borderLeft: 'none',
                                        borderRight: 'none'
                                    }}
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

                            {/* Search Suggestions */}
                            {showSuggestions && customers.length > 0 && (
                                <Card className="position-absolute" style={{ zIndex: 1000, width: 'calc(100% - 2rem)', marginTop: '-1rem' }}>
                                    <ListGroup variant="flush">
                                        {customers.map((customer) => (
                                            <ListGroup.Item
                                                key={customer.id}
                                                action
                                                onClick={() => selectCustomer(customer)}
                                                style={{ cursor: 'pointer' }}
                                            >
                                                <strong>{customer.entity_code}</strong> - {customer.entity_name}
                                            </ListGroup.Item>
                                        ))}
                                    </ListGroup>
                                </Card>
                            )}

                            {/* Customer Analytics */}
                            {analyticsLoading ? (
                                <div className="text-center py-5">
                                    <Spinner animation="border" />
                                    <p className="text-white mt-2">Cari analizi yükleniyor...</p>
                                </div>
                            ) : customerAnalytics ? (
                                <div className="mt-4">
                                    {/* Customer Info Header */}
                                    <Card className="mb-4">
                                        <Card.Header>
                                            <h4 className="mb-0">
                                                <FaUser className="me-2" />
                                                Cari Bilgileri
                                            </h4>
                                        </Card.Header>
                                        <Card.Body>
                                            <Row>
                                                <Col md={6}>
                                                    <p><strong>Cari Kodu:</strong> {customerAnalytics.entity.code}</p>
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

                                    {/* Currency Selector */}
                                    <Row className="mb-3">
                                        <Col md={12}>
                                            <Card>
                                                <Card.Body className="py-2">
                                                    <div className="d-flex align-items-center">
                                                        <span className="me-3"><strong>Döviz Birimi:</strong></span>
                                                        <Form.Select
                                                            size="sm"
                                                            style={{ width: '200px' }}
                                                            value={selectedCurrency}
                                                            onChange={(e) => handleCurrencyChange(e.target.value)}
                                                            disabled={analyticsLoading || currencyLoading}
                                                        >
                                                            {availableCurrencies.map(currency => (
                                                                <option key={currency.code} value={currency.code}>
                                                                    {currency.symbol} {currency.name}
                                                                </option>
                                                            ))}
                                                        </Form.Select>
                                                        {currencyLoading && (
                                                            <Spinner 
                                                                animation="border" 
                                                                size="sm" 
                                                                className="ms-2"
                                                                variant="primary"
                                                            />
                                                        )}
                                                    </div>
                                                </Card.Body>
                                            </Card>
                                        </Col>
                                    </Row>

                                    {/* Summary Statistics */}
                                    <Row className="mb-4">
                                        <Col md={4}>
                                            <Card className="text-center">
                                                <Card.Body>
                                                    {currencyLoading ? (
                                                        <div className="d-flex align-items-center justify-content-center" style={{ height: '50px' }}>
                                                            <Spinner animation="border" size="sm" />
                                                        </div>
                                                    ) : (
                                                        <h3 className="text-primary">{summaryStats?.totalPurchases}</h3>
                                                    )}
                                                    <p className="mb-0">Son 5 Yıl Toplam Alım</p>
                                                </Card.Body>
                                            </Card>
                                        </Col>
                                        <Col md={4}>
                                            <Card className="text-center">
                                                <Card.Body>
                                                    <h3 className="text-success">{customerAnalytics.summary.total_invoice_count}</h3>
                                                    <p className="mb-0">Toplam Fatura Sayısı</p>
                                                </Card.Body>
                                            </Card>
                                        </Col>
                                        <Col md={4}>
                                            <Card className="text-center">
                                                <Card.Body>
                                                    {currencyLoading ? (
                                                        <div className="d-flex align-items-center justify-content-center" style={{ height: '50px' }}>
                                                            <Spinner animation="border" size="sm" />
                                                        </div>
                                                    ) : (
                                                        <h3 className="text-info">{summaryStats?.averageOrder}</h3>
                                                    )}
                                                    <p className="mb-0">Ortalama Sipariş Tutarı</p>
                                                </Card.Body>
                                            </Card>
                                        </Col>
                                    </Row>

                                    {/* Monthly Purchase Chart */}
                                    <Row>
                                        <Col lg={6} className="mb-4">
                                            <Card>
                                                <Card.Header>
                                                    <div className="d-flex justify-content-between align-items-center">
                                                        <h5 className="mb-0">
                                                            <FaChartLine className="me-2" />
                                                            Aylık Alım Trendi ({selectedYear})
                                                        </h5>
                                                        {availableYears.length > 0 && (
                                                            <Form.Select
                                                                size="sm"
                                                                style={{ width: 'auto' }}
                                                                value={selectedYear}
                                                                onChange={(e) => handleYearChange(parseInt(e.target.value))}
                                                                disabled={loadingChart}
                                                            >
                                                                {availableYears.map(year => (
                                                                    <option key={year} value={year}>
                                                                        {year}
                                                                    </option>
                                                                ))}
                                                            </Form.Select>
                                                        )}
                                                    </div>
                                                </Card.Header>
                                                <Card.Body>
                                                    {loadingChart ? (
                                                        <div className="d-flex align-items-center justify-content-center" style={{ height: '300px' }}>
                                                            <Spinner animation="border" />
                                                            <span className="ms-2">Grafik yükleniyor...</span>
                                                        </div>
                                                    ) : customerAnalytics.monthly_data && customerAnalytics.monthly_data.length > 0 ? (
                                                        <>
                                                            <div style={{ height: '300px', marginBottom: '20px' }}>
                                                                {createMonthlyTrendChart()}
                                                            </div>
                                                            <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                                                                <Table striped size="sm">
                                                                    <thead>
                                                                        <tr>
                                                                            <th>Ay</th>
                                                                            <th>Tutar ({availableCurrencies.find(c => c.code === selectedCurrency)?.symbol || selectedCurrency})</th>
                                                                        </tr>
                                                                    </thead>
                                                                    <tbody>
                                                                        {customerAnalytics.monthly_data.map((month, index) => (
                                                                            <tr key={index}>
                                                                                <td>{month.month}</td>
                                                                                <td>{formatCurrency(month.amount, selectedCurrency)}</td>
                                                                            </tr>
                                                                        ))}
                                                                    </tbody>
                                                                </Table>
                                                            </div>
                                                        </>
                                                    ) : (
                                                        <div className="d-flex align-items-center justify-content-center" style={{ height: '300px' }}>
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
                                                    <h5 className="mb-0">
                                                        <FaTags className="me-2" />
                                                        En Çok Alınan Ürünler
                                                    </h5>
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
                                                                        <td>{ formatNumber(product.total_quantity,2)}</td>
                                                                        <td>{formatCurrency(product.total_amount, selectedCurrency)}</td>
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
                                                    <h5 className="mb-0">
                                                        <FaFileInvoice className="me-2" />
                                                        Son Faturalar
                                                    </h5>
                                                </Card.Header>
                                                <Card.Body style={{ maxHeight: '400px', overflowY: 'auto' }}>
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
                                                                    <td>
                                                                        <span
                                                                            className="text-primary"
                                                                            style={{ cursor: 'pointer', textDecoration: 'underline' }}
                                                                            onClick={() => handleInvoiceClick(invoice.id)}
                                                                            title="Fatura detayını görüntüle"
                                                                        >
                                                                            {invoice.doc_no}
                                                                        </span>
                                                                    </td>
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
                                                    <h5 className="mb-0">
                                                        <FaClipboardList className="me-2" />
                                                        Son Teklifler
                                                    </h5>
                                                </Card.Header>
                                                <Card.Body style={{ maxHeight: '400px', overflowY: 'auto' }}>
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
                                    <FaSearch size={64} color="#6c757d" />
                                    <h4 className="text-white mt-3">Cari Analizi</h4>
                                    <p className="text-white-50">Analiz yapmak istediğiniz cariyi arama alanından seçiniz</p>
                                </div>
                            )}
                        </Card.Body>
                    </Card>
                </Container>
            </div>

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

                            {/* Images */}
                            {invoiceDetail.images && invoiceDetail.images.length > 0 && (
                                <div className="mb-4">
                                    <h5>Görseller</h5>
                                    <Row>
                                        {invoiceDetail.images.map((image, index) => (
                                            <Col xs={4} key={index} className="mb-2">
                                                <Image
                                                    src={image}
                                                    alt={`Görsel ${index + 1}`}
                                                    thumbnail
                                                    style={{ cursor: 'pointer', height: '80px', objectFit: 'cover' }}
                                                    onClick={() => setSelectedImage(image)}
                                                />
                                            </Col>
                                        ))}
                                    </Row>
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
        </>
    );
}
