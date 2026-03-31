import React, { useState, useEffect } from 'react';
import { Head } from '@inertiajs/react';
import { Container, Row, Col, Card, Table, Badge, Form, Button, Alert, Tabs, Tab } from 'react-bootstrap';
import { Line } from 'react-chartjs-2';
import Layout from '../../Layouts';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js';
import axios from 'axios';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend
);

interface ExchangeRateProps {
    currency: string;
    currency_name: string;
    current: number;
    previous?: number;
    change: number;
    change_percent: number;
    date: string;
}

interface HistoryPoint {
    date: string;
    value: number;
}

interface Statistics {
    total_currencies: number;
    latest_date: string;
    oldest_date: string;
    total_records: string;
    data_years: number;
}

interface IndexProps {
    mainRates: ExchangeRateProps[];
    allRates: any[];
    usdHistory: HistoryPoint[];
    eurHistory: HistoryPoint[];
    statistics: Statistics;
    averages: {
        weekly: Record<string, number>;
        monthly: Record<string, number>;
    };
}

export default function ExchangeRates({ mainRates, allRates, usdHistory, eurHistory, statistics, averages }: IndexProps) {
    const [activeTab, setActiveTab] = useState('dashboard');
    const [selectedCurrency, setSelectedCurrency] = useState('USD');
    const [selectedPeriod, setSelectedPeriod] = useState('30');
    const [customHistory, setCustomHistory] = useState<any[]>([]);
    const [historyLoading, setHistoryLoading] = useState(false);

    // Converter states
    const [amount, setAmount] = useState('100');
    const [fromCurrency, setFromCurrency] = useState('USD');
    const [toCurrency, setToCurrency] = useState('TRY');
    const [convertDate, setConvertDate] = useState(new Date().toISOString().split('T')[0]); // Today's date in YYYY-MM-DD format
    const [convertResult, setConvertResult] = useState<any>(null);
    const [convertLoading, setConvertLoading] = useState(false);

    // Chart options
    const chartOptions = {
        responsive: true,
        plugins: {
            legend: {
                position: 'top' as const,
            },
            title: {
                display: true,
                text: 'Döviz Kuru Geçmişi (Son 30 Gün)',
            },
        },
        scales: {
            y: {
                beginAtZero: false,
            },
        },
    };

    const mainChartData = {
        labels: usdHistory.map(point => new Date(point.date).toLocaleDateString('tr-TR')),
        datasets: [
            {
                label: 'USD/TRY',
                data: usdHistory.map(point => point.value),
                borderColor: 'rgb(53, 162, 235)',
                backgroundColor: 'rgba(53, 162, 235, 0.5)',
                tension: 0.1,
            },
            {
                label: 'EUR/TRY',
                data: eurHistory.map(point => point.value),
                borderColor: 'rgb(255, 99, 132)',
                backgroundColor: 'rgba(255, 99, 132, 0.5)',
                tension: 0.1,
            },
        ],
    };

    const loadCurrencyHistory = async () => {
        setHistoryLoading(true);
        try {
            const response = await axios.get(`/api/exchange-rates/history/${selectedCurrency}`, {
                params: { period: selectedPeriod }
            });
            setCustomHistory(response.data.data || []);
        } catch (error) {
            console.error('Error loading currency history:', error);
        } finally {
            setHistoryLoading(false);
        }
    };

    const handleConvert = async () => {
        setConvertLoading(true);
        try {
            const response = await axios.post('/api/exchange-rates/convert', {
                amount: parseFloat(amount),
                from: fromCurrency,
                to: toCurrency,
                date: convertDate
            });
            setConvertResult(response.data.result);
        } catch (error: any) {
            console.error('Conversion error:', error);
            setConvertResult({ error: error.response?.data?.message || 'Dönüştürme hatası' });
        } finally {
            setConvertLoading(false);
        }
    };

    useEffect(() => {
        if (activeTab === 'history') {
            loadCurrencyHistory();
        }
    }, [activeTab, selectedCurrency, selectedPeriod]);

    const formatCurrency = (value: number, currency: string = 'TRY') => {
        return new Intl.NumberFormat('tr-TR', {
            style: 'currency',
            currency: currency,
            minimumFractionDigits: 4,
            maximumFractionDigits: 4,
        }).format(value);
    };

    const getTrendIcon = (change: number) => {
        if (change > 0) return <i className="ri-arrow-up-line text-danger"></i>;
        if (change < 0) return <i className="ri-arrow-down-line text-success"></i>;
        return <span className="text-muted">-</span>;
    };

    const getTrendColor = (change: number) => {
        if (change > 0) return 'danger';
        if (change < 0) return 'success';
        return 'secondary';
    };


    return (
        <Layout>
            <Head title="Döviz Kurları - Merkez Bankası Verileri" />
            <div className="page-content">
            <Container fluid className="py-4">
                <div className="mb-4">
                    <h1 className="display-6 mb-2">
                        <i className="ri-global-line me-3 text-primary"></i>
                        Döviz Kurları
                    </h1>
                    <p className="text-muted">Türkiye Cumhuriyet Merkez Bankası resmi döviz kurları</p>
                </div>

            <Tabs activeKey={activeTab} onSelect={(k) => setActiveTab(k || 'dashboard')} className="mb-4">
                <Tab eventKey="dashboard" title={<><i className="ri-line-chart-line me-2"></i>Genel Bakış</>}>
                    <Row className="mb-4">
                        <Col lg={8}>
                            <Card className="shadow-sm">
                                <Card.Header className="bg-white border-bottom">
                                    <h5 className="mb-0">
                                        <i className="ri-line-chart-line me-2 text-primary"></i>
                                        Döviz Kuru Grafiği (Son 30 Gün)
                                    </h5>
                                </Card.Header>
                                <Card.Body>
                                    <Line data={mainChartData} options={chartOptions} />
                                </Card.Body>
                            </Card>
                        </Col>
                        <Col lg={4}>
                            <Card className="shadow-sm mb-3">
                                <Card.Header className="bg-white border-bottom">
                                    <h6 className="mb-0">
                                        <i className="ri-information-line me-2 text-info"></i>
                                        İstatistikler
                                    </h6>
                                </Card.Header>
                                <Card.Body>
                                    <div className="d-flex justify-content-between mb-2">
                                        <span>Toplam Para Birimi:</span>
                                        <strong>{statistics.total_currencies}</strong>
                                    </div>
                                    <div className="d-flex justify-content-between mb-2">
                                        <span>Son Güncelleme:</span>
                                        <strong>{statistics.latest_date}</strong>
                                    </div>
                                    <div className="d-flex justify-content-between mb-2">
                                        <span>İlk Veri:</span>
                                        <strong>{statistics.oldest_date}</strong>
                                    </div>
                                    <div className="d-flex justify-content-between mb-2">
                                        <span>Toplam Kayıt:</span>
                                        <strong>{statistics.total_records}</strong>
                                    </div>
                                    <div className="d-flex justify-content-between">
                                        <span>Veri Aralığı:</span>
                                        <strong>{statistics.data_years} yıl</strong>
                                    </div>
                                </Card.Body>
                            </Card>

                            <Card className="shadow-sm">
                                <Card.Header className="bg-white border-bottom">
                                    <h6 className="mb-0">Ortalama Kurlar</h6>
                                </Card.Header>
                                <Card.Body>
                                    <div className="mb-3">
                                        <small className="text-muted d-block">7 Günlük Ortalama</small>
                                        {Object.entries(averages.weekly).map(([currency, avg]) => (
                                            <div key={currency} className="d-flex justify-content-between">
                                                <span>{currency}:</span>
                                                <strong>{avg.toFixed(4)} TL</strong>
                                            </div>
                                        ))}
                                    </div>
                                    <div>
                                        <small className="text-muted d-block">30 Günlük Ortalama</small>
                                        {Object.entries(averages.monthly).map(([currency, avg]) => (
                                            <div key={currency} className="d-flex justify-content-between">
                                                <span>{currency}:</span>
                                                <strong>{avg.toFixed(4)} TL</strong>
                                            </div>
                                        ))}
                                    </div>
                                </Card.Body>
                            </Card>
                        </Col>
                    </Row>

                    <Card className="shadow-sm">
                        <Card.Header className="bg-white border-bottom">
                            <h5 className="mb-0">
                                <i className="ri-exchange-line me-2 text-primary"></i>
                                Güncel Kurlar ({statistics.latest_date})
                            </h5>
                        </Card.Header>
                        <Card.Body className="p-0">
                            <Table responsive hover className="mb-0">
                                <thead className="table-light">
                                    <tr>
                                        <th>Para Birimi</th>
                                        <th>Güncel Kur</th>
                                        <th>Önceki Gün</th>
                                        <th>Değişim</th>
                                        <th>Değişim %</th>
                                        <th>Durum</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {mainRates.map((rate) => (
                                        <tr key={rate.currency}>
                                            <td>
                                                <strong>{rate.currency}</strong>
                                                <div className="text-muted small">{rate.currency_name}</div>
                                            </td>
                                            <td>
                                                <strong className="fs-6">{rate.current.toFixed(4)} TL</strong>
                                            </td>
                                            <td>
                                                {rate.previous ? rate.previous.toFixed(4) + ' TL' : '-'}
                                            </td>
                                            <td>
                                                <span className={`text-${getTrendColor(rate.change)}`}>
                                                    {rate.change > 0 ? '+' : ''}{rate.change.toFixed(4)} TL
                                                </span>
                                            </td>
                                            <td>
                                                <span className={`text-${getTrendColor(rate.change_percent)}`}>
                                                    {rate.change_percent > 0 ? '+' : ''}{rate.change_percent.toFixed(2)}%
                                                </span>
                                            </td>
                                            <td>
                                                <Badge bg={getTrendColor(rate.change)} className="d-flex align-items-center w-auto">
                                                    {getTrendIcon(rate.change)}
                                                </Badge>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </Table>
                        </Card.Body>
                    </Card>
                </Tab>

                <Tab eventKey="converter" title={<><i className="ri-calculator-line me-2"></i>Döviz Çevirici</>}>
                    <Card className="shadow-sm">
                        <Card.Header className="bg-white border-bottom">
                            <h5 className="mb-0">
                                <i className="ri-calculator-line me-2 text-primary"></i>
                                Döviz Çevirici
                            </h5>
                        </Card.Header>
                        <Card.Body>
                            <Row>
                                <Col md={6}>
                                    <Form>
                                        <Row className="g-3">
                                            <Col md={6}>
                                                <Form.Group>
                                                    <Form.Label>Miktar</Form.Label>
                                                    <Form.Control
                                                        type="number"
                                                        value={amount}
                                                        onChange={(e) => setAmount(e.target.value)}
                                                        placeholder="100"
                                                        step="0.01"
                                                        min="0"
                                                    />
                                                </Form.Group>
                                            </Col>
                                            <Col md={6}>
                                                <Form.Group>
                                                    <Form.Label>
                                                        <i className="ri-calendar-line me-1"></i>
                                                        Tarih
                                                    </Form.Label>
                                                    <Form.Control
                                                        type="date"
                                                        value={convertDate}
                                                        onChange={(e) => setConvertDate(e.target.value)}
                                                        max={new Date().toISOString().split('T')[0]} // Bugünden ileri tarih seçilemesin
                                                    />
                                                    <Form.Text className="text-muted small">
                                                        Seçilen tarihteki kurlar kullanılacak
                                                    </Form.Text>
                                                    <div className="mt-2">
                                                        <div className="btn-group btn-group-sm" role="group">
                                                            <button
                                                                type="button"
                                                                className="btn btn-outline-secondary"
                                                                onClick={() => setConvertDate(new Date().toISOString().split('T')[0])}
                                                            >
                                                                Bugün
                                                            </button>
                                                            <button
                                                                type="button"
                                                                className="btn btn-outline-secondary"
                                                                onClick={() => {
                                                                    const yesterday = new Date();
                                                                    yesterday.setDate(yesterday.getDate() - 1);
                                                                    setConvertDate(yesterday.toISOString().split('T')[0]);
                                                                }}
                                                            >
                                                                Dün
                                                            </button>
                                                            <button
                                                                type="button"
                                                                className="btn btn-outline-secondary"
                                                                onClick={() => {
                                                                    const lastWeek = new Date();
                                                                    lastWeek.setDate(lastWeek.getDate() - 7);
                                                                    setConvertDate(lastWeek.toISOString().split('T')[0]);
                                                                }}
                                                            >
                                                                1 Hafta Önce
                                                            </button>
                                                        </div>
                                                    </div>
                                                </Form.Group>
                                            </Col>
                                            <Col md={6}>
                                                <Form.Group>
                                                    <Form.Label>Çevrilecek Para Birimi</Form.Label>
                                                    <Form.Select
                                                        value={fromCurrency}
                                                        onChange={(e) => setFromCurrency(e.target.value)}
                                                    >
                                                        <option value="TRY">TRY - Türk Lirası</option>
                                                        {allRates.map((rate) => (
                                                            <option key={rate.currency} value={rate.currency}>
                                                                {rate.currency} - {rate.currency_name || rate.currency}
                                                            </option>
                                                        ))}
                                                    </Form.Select>
                                                </Form.Group>
                                            </Col>
                                            <Col md={6}>
                                                <Form.Group>
                                                    <Form.Label>Hedef Para Birimi</Form.Label>
                                                    <Form.Select
                                                        value={toCurrency}
                                                        onChange={(e) => setToCurrency(e.target.value)}
                                                    >
                                                        <option value="TRY">TRY - Türk Lirası</option>
                                                        {allRates.map((rate) => (
                                                            <option key={rate.currency} value={rate.currency}>
                                                                {rate.currency} - {rate.currency_name || rate.currency}
                                                            </option>
                                                        ))}
                                                    </Form.Select>
                                                </Form.Group>
                                            </Col>
                                            <Col md={12}>
                                                <Button
                                                    variant="primary"
                                                    onClick={handleConvert}
                                                    disabled={convertLoading || !amount}
                                                    className="w-100"
                                                >
                                                    <i className="ri-exchange-line me-2"></i>
                                                    {convertLoading ? 'Hesaplanıyor...' : 'Çevir'}
                                                </Button>
                                            </Col>
                                        </Row>
                                    </Form>
                                </Col>
                                <Col md={6}>
                                    {convertResult && (
                                        <Card className="border-primary">
                                            <Card.Header className="bg-primary text-white">
                                                <h6 className="mb-0">Çeviri Sonucu</h6>
                                            </Card.Header>
                                            <Card.Body>
                                                {convertResult.error ? (
                                                    <Alert variant="danger">{convertResult.error}</Alert>
                                                ) : (
                                                    <div>
                                                        <div className="text-center mb-3">
                                                            <h4 className="text-primary">
                                                                {convertResult.amount} {convertResult.from}
                                                            </h4>
                                                            <i className="ri-exchange-line text-muted my-2"></i>
                                                            <h3 className="text-success">
                                                                {convertResult.formatted_result} {convertResult.to}
                                                            </h3>
                                                        </div>
                                                        <div className="mt-3 pt-2 border-top">
                                                            <div className="d-flex justify-content-between align-items-center">
                                                                <small className="text-muted">
                                                                    <i className="ri-calendar-line me-1"></i>
                                                                    Kur Tarihi: {new Date(convertResult.date).toLocaleDateString('tr-TR')}
                                                                </small>
                                                                {convertResult.date !== new Date().toISOString().split('T')[0] && (
                                                                    <Badge bg="info" className="small">
                                                                        Geçmiş Kur
                                                                    </Badge>
                                                                )}
                                                            </div>
                                                        </div>
                                                        {convertResult.rates_used && (
                                                            <div className="mt-2 small text-muted">
                                                                {convertResult.rates_used.from_rate && (
                                                                    <div>1 {convertResult.from} = {convertResult.rates_used.from_rate} TRY</div>
                                                                )}
                                                                {convertResult.rates_used.to_rate && (
                                                                    <div>1 {convertResult.to} = {convertResult.rates_used.to_rate} TRY</div>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </Card.Body>
                                        </Card>
                                    )}
                                </Col>
                            </Row>
                        </Card.Body>
                    </Card>
                </Tab>

                <Tab eventKey="history" title={<><i className="ri-history-line me-2"></i>Geçmiş Veriler</>}>
                    <Card className="shadow-sm">
                        <Card.Header className="bg-white border-bottom">
                            <Row className="align-items-center">
                                <Col md={6}>
                                    <h5 className="mb-0">
                                        <i className="ri-history-line me-2 text-primary"></i>
                                        Geçmiş Kur Verileri
                                    </h5>
                                </Col>
                                <Col md={6}>
                                    <Row className="g-2">
                                        <Col md={6}>
                                            <Form.Select
                                                value={selectedCurrency}
                                                onChange={(e) => setSelectedCurrency(e.target.value)}
                                                size="sm"
                                            >
                                                {allRates.map((rate) => (
                                                    <option key={rate.currency} value={rate.currency}>
                                                        {rate.currency}
                                                    </option>
                                                ))}
                                            </Form.Select>
                                        </Col>
                                        <Col md={6}>
                                            <Form.Select
                                                value={selectedPeriod}
                                                onChange={(e) => setSelectedPeriod(e.target.value)}
                                                size="sm"
                                            >
                                                <option value="7">Son 7 Gün</option>
                                                <option value="30">Son 30 Gün</option>
                                                <option value="90">Son 90 Gün</option>
                                                <option value="365">Son 1 Yıl</option>
                                            </Form.Select>
                                        </Col>
                                    </Row>
                                </Col>
                            </Row>
                        </Card.Header>
                        <Card.Body>
                            {historyLoading ? (
                                <div className="text-center py-4">
                                    <div className="spinner-border text-primary" role="status">
                                        <span className="visually-hidden">Yükleniyor...</span>
                                    </div>
                                </div>
                            ) : customHistory.length > 0 ? (
                                <div>
                                    <div className="table-responsive">
                                        <Table hover>
                                            <thead className="table-light">
                                                <tr>
                                                    <th>Tarih</th>
                                                    <th>Kur (TL)</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {customHistory.slice(0, 20).map((point, index) => (
                                                    <tr key={index}>
                                                        <td>{point.formatted_date}</td>
                                                        <td>{point.formatted_value}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </Table>
                                    </div>
                                    {customHistory.length > 20 && (
                                        <small className="text-muted">
                                            {customHistory.length - 20} kayıt daha var...
                                        </small>
                                    )}
                                </div>
                            ) : (
                                <div className="text-center py-4 text-muted">
                                    Seçilen kriterlere uygun veri bulunamadı.
                                </div>
                            )}
                        </Card.Body>
                    </Card>
                </Tab>

                <Tab eventKey="allrates" title={<><i className="ri-global-line me-2"></i>Tüm Kurlar</>}>
                    <Card className="shadow-sm">
                        <Card.Header className="bg-white border-bottom">
                            <h5 className="mb-0">
                                <i className="ri-global-line me-2 text-primary"></i>
                                Tüm Döviz Kurları ({statistics.latest_date})
                            </h5>
                        </Card.Header>
                        <Card.Body className="p-0">
                            <div className="table-responsive">
                                <Table hover className="mb-0">
                                    <thead className="table-light">
                                        <tr>
                                            <th>Para Birimi</th>
                                            <th>Adı</th>
                                            <th>Kur (TL)</th>
                                            <th>Tarih</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {allRates.map((rate) => (
                                            <tr key={rate.currency}>
                                                <td><strong>{rate.currency}</strong></td>
                                                <td>{rate.currency_name || '-'}</td>
                                                <td><strong>{parseFloat(rate.value).toFixed(4)} TL</strong></td>
                                                <td>{new Date(rate.date).toLocaleDateString('tr-TR')}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </Table>
                            </div>
                        </Card.Body>
                    </Card>
                </Tab>
            </Tabs>
            </Container>
            </div>
        </Layout>
    );
}
