import React, { useState } from 'react';
import Layout from '@/Layouts';
import { Head, router } from '@inertiajs/react';
import { Badge, Card, Col, Modal, Nav, Row, Table } from 'react-bootstrap';
import Chart from 'react-apexcharts';
import { ApexOptions } from 'apexcharts';
import CountUp from 'react-countup';
import axios from 'axios';

// ==================== TYPES ====================

interface LogoKpi {
    key: string;
    title: string;
    value: number;
    previous: number;
    change: { percent: number; trend: 'up' | 'down' | 'flat' };
    currency: string | null;
    icon: string;
    color: string;
    subtitle_value?: number;
}

interface MonthlyRevenue {
    label: string;
    nettotal: number;
    grosstotal: number;
    vat: number;
    count: number;
}

interface TopCustomer {
    cari_kodu: string;
    cari_adi: string;
    ciro: number;
    fatura_sayisi: number;
}

interface TopProduct {
    urun_kodu: string;
    urun_adi: string;
    miktar: number;
    tutar: number;
}

interface SalespersonPerf {
    plasiyer_kodu: string;
    plasiyer_adi: string;
    ciro: number;
    siparis_sayisi: number;
}

interface AgingBucket {
    vade_grubu: string;
    label: string;
    net_tutar: number;
    cari_sayisi: number;
}

interface InvoiceVsCollection {
    label: string;
    fatura: number;
    tahsilat: number;
}

interface StockDistItem {
    label: string;
    urun_sayisi: number;
    miktar: number;
}

interface DailySale {
    gun: string;
    toplam: number;
    siparis_sayisi: number;
}

interface BankTrendPoint {
    label: string;
    bakiye: number;
    hareket: number;
}

interface OrderStatusBucket {
    durum: string;
    durum_label: string;
    sayisi: number;
    tutar: number;
}

interface CariNet {
    toplam_borc: number;
    toplam_alacak: number;
    net_alacak: number;
    cari_sayisi: number;
}

interface TopDebtor {
    cari_adi: string;
    cari_kodu: string;
    net_bakiye: number;
}

interface BankAccountDetail {
    code: string;
    name: string;
    branch: string;
    total_in: number;
    total_out: number;
    amount: number;
}

interface LogoBalanceRow {
    currency: string;
    amount: number;
    account_count: number;
    accounts?: BankAccountDetail[];
}

interface LogoDashboardData {
    connected: boolean;
    generated_at: string;
    cache_ttl_minutes?: number;
    kpi: LogoKpi[];
    monthly_revenue_trend: MonthlyRevenue[];
    top_customers: TopCustomer[];
    top_products: TopProduct[];
    salesperson_performance: SalespersonPerf[];
    customer_aging: AgingBucket[];
    invoice_vs_collection: InvoiceVsCollection[];
    stock_distribution: StockDistItem[];
    daily_sales_30d: DailySale[];
    bank_balance_trend: BankTrendPoint[];
    order_status_funnel: OrderStatusBucket[];
    cari_net: CariNet | null;
    top_debtors: TopDebtor[];
    bank_balances: LogoBalanceRow[];
    cash_balances: LogoBalanceRow[];
}

interface Props {
    logo: LogoDashboardData;
}

// ==================== FORMATTERS ====================

const formatMoney = (value: number, currency = 'TRY') =>
    new Intl.NumberFormat('tr-TR', {
        style: 'currency',
        currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(value || 0);

const formatNumber = (value: number) =>
    new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 0 }).format(value || 0);

const formatDate = (value: string | null) => {
    if (!value) return '-';
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? value : d.toLocaleString('tr-TR');
};

// ==================== COLORS ====================

const COLORS = {
    primary: '#405189',
    success: '#0ab39c',
    warning: '#f7b84b',
    info: '#3577f1',
    danger: '#f06548',
    secondary: '#6c757d',
    teal: '#299cdb',
};

type TabKey = 'genel' | 'satis' | 'finans' | 'stok';

// ==================== COMPONENT ====================

const CompanyManagerDashboard: React.FC<Props> = ({ logo }) => {
    const [activeTab, setActiveTab] = useState<TabKey>('genel');
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [bankModal, setBankModal] = useState<{ currency: string; accounts: BankAccountDetail[] } | null>(null);

    const handleRefresh = async () => {
        setIsRefreshing(true);
        try {
            await axios.post('/dashboard/company/refresh');
            router.reload();
        } catch {
            // silently fail
        } finally {
            setIsRefreshing(false);
        }
    };

    if (!logo?.connected) {
        return (
            <Layout>
                <Head title="Şirket Yönetimi Dashboard" />
                <div className="page-content">
                    <div className="container-fluid">
                        <div className="alert alert-danger d-flex align-items-center gap-2 mt-4">
                            <i className="ri-error-warning-line fs-4"></i>
                            <div>
                                <strong>Logo Tiger bağlantısı kurulamadı.</strong>
                                <div className="fs-13 mt-1">Veritabanı bağlantısını kontrol edin ve sayfayı yenileyin.</div>
                            </div>
                        </div>
                    </div>
                </div>
            </Layout>
        );
    }

    // ==================== CHART OPTIONS ====================

    const dailySalesOpts: ApexOptions = {
        chart: { type: 'bar', toolbar: { show: false }, sparkline: { enabled: false } },
        plotOptions: { bar: { borderRadius: 3, columnWidth: '60%' } },
        colors: [COLORS.primary],
        dataLabels: { enabled: false },
        xaxis: { categories: logo.daily_sales_30d.map(d => d.gun), labels: { rotate: -45, style: { fontSize: '10px' } } },
        yaxis: { labels: { formatter: (v: number) => formatNumber(v) } },
        tooltip: { y: { formatter: (v: number) => formatMoney(v) } },
        grid: { strokeDashArray: 3 },
    };

    const revenueTrendOpts: ApexOptions = {
        chart: { type: 'area', toolbar: { show: false }, zoom: { enabled: false } },
        stroke: { curve: 'smooth', width: 2 },
        fill: { type: 'gradient', gradient: { opacityFrom: 0.4, opacityTo: 0.05 } },
        colors: [COLORS.primary, COLORS.success],
        dataLabels: { enabled: false },
        xaxis: { categories: logo.monthly_revenue_trend.map(d => d.label) },
        yaxis: [
            { title: { text: 'Ciro (₺)' }, labels: { formatter: (v: number) => formatNumber(v) } },
            { opposite: true, title: { text: 'Fatura Adedi' }, labels: { formatter: (v: number) => formatNumber(v) } },
        ],
        tooltip: { shared: true, intersect: false, y: { formatter: (v: number, opts: any) => opts.seriesIndex === 0 ? formatMoney(v) : formatNumber(v) } },
        legend: { position: 'top' },
        grid: { strokeDashArray: 3 },
    };

    const orderFunnelOpts: ApexOptions = {
        chart: { type: 'donut' },
        labels: logo.order_status_funnel.map(d => d.durum_label),
        colors: [COLORS.success, COLORS.primary, COLORS.info, COLORS.secondary],
        legend: { position: 'bottom', fontSize: '12px' },
        dataLabels: { enabled: true, formatter: (_v: number, opts: any) => formatNumber(logo.order_status_funnel[opts.seriesIndex]?.sayisi || 0) },
        tooltip: { y: { formatter: (v: number) => formatMoney(v) } },
    };

    const topCustomersOpts: ApexOptions = {
        chart: { type: 'bar', toolbar: { show: false } },
        plotOptions: { bar: { horizontal: true, borderRadius: 4, barHeight: '65%' } },
        colors: [COLORS.primary],
        dataLabels: { enabled: false },
        xaxis: { labels: { formatter: (v: string) => formatNumber(Number(v)) } },
        yaxis: { labels: { maxWidth: 200, style: { fontSize: '11px' } } },
        tooltip: { y: { formatter: (v: number) => formatMoney(v) } },
        grid: { strokeDashArray: 3 },
    };

    const topProductsOpts: ApexOptions = {
        chart: { type: 'bar', toolbar: { show: false } },
        plotOptions: { bar: { horizontal: true, borderRadius: 4, barHeight: '65%' } },
        colors: [COLORS.success],
        dataLabels: { enabled: false },
        xaxis: { labels: { formatter: (v: string) => formatNumber(Number(v)) } },
        yaxis: { labels: { maxWidth: 200, style: { fontSize: '11px' } } },
        tooltip: { y: { formatter: (v: number) => formatMoney(v) } },
        grid: { strokeDashArray: 3 },
    };

    const salespersonOpts: ApexOptions = {
        chart: { type: 'bar', toolbar: { show: false } },
        plotOptions: { bar: { borderRadius: 4, columnWidth: '50%' } },
        colors: [COLORS.info],
        dataLabels: { enabled: false },
        xaxis: { categories: logo.salesperson_performance.map(d => d.plasiyer_adi || d.plasiyer_kodu), labels: { rotate: -45, style: { fontSize: '10px' } } },
        yaxis: { labels: { formatter: (v: number) => formatNumber(v) } },
        tooltip: { y: { formatter: (v: number) => formatMoney(v) } },
        grid: { strokeDashArray: 3 },
    };

    const invVsCollOpts: ApexOptions = {
        chart: { type: 'line', toolbar: { show: false }, zoom: { enabled: false } },
        stroke: { curve: 'smooth', width: [3, 3] },
        colors: [COLORS.danger, COLORS.success],
        dataLabels: { enabled: false },
        xaxis: { categories: logo.invoice_vs_collection.map(d => d.label) },
        yaxis: { labels: { formatter: (v: number) => formatNumber(v) } },
        tooltip: { shared: true, y: { formatter: (v: number) => formatMoney(v) } },
        legend: { position: 'top' },
        grid: { strokeDashArray: 3 },
    };

    const agingOpts: ApexOptions = {
        chart: { type: 'donut' },
        labels: logo.customer_aging.map(d => d.label),
        colors: [COLORS.success, COLORS.warning, '#e8850c', COLORS.danger, '#991b1b'],
        legend: { position: 'bottom' },
        dataLabels: { enabled: true },
        tooltip: { y: { formatter: (v: number) => formatMoney(v) } },
    };

    const bankTrendOpts: ApexOptions = {
        chart: { type: 'area', toolbar: { show: false }, zoom: { enabled: false } },
        stroke: { curve: 'smooth', width: 2 },
        fill: { type: 'gradient', gradient: { opacityFrom: 0.35, opacityTo: 0.05 } },
        colors: [COLORS.success],
        dataLabels: { enabled: false },
        xaxis: { categories: logo.bank_balance_trend.map(d => d.label) },
        yaxis: { labels: { formatter: (v: number) => formatNumber(v) } },
        tooltip: { y: { formatter: (v: number) => formatMoney(v) } },
        grid: { strokeDashArray: 3 },
    };

    const stockDistOpts: ApexOptions = {
        chart: { type: 'donut' },
        labels: logo.stock_distribution.map(d => d.label),
        colors: [COLORS.primary, COLORS.success, COLORS.info, COLORS.warning, COLORS.danger, COLORS.teal, COLORS.secondary, '#7c3aed', '#059669', '#d97706', '#dc2626', '#2563eb', '#7c2d12', '#4338ca', '#0d9488'],
        legend: { position: 'bottom', fontSize: '11px' },
        dataLabels: { enabled: false },
        tooltip: { y: { formatter: (v: number) => formatNumber(v) + ' adet' } },
    };

    // ==================== RENDER ====================

    return (
        <>
        <Layout>
            <Head title="Şirket Yönetimi Dashboard" />
            <div className="page-content">
                <div className="container-fluid">

                    {/* HEADER */}
                    <Row className="mb-4 align-items-center">
                        <Col>
                            <h4 className="mb-1 d-flex align-items-center gap-2">
                                <i className="ri-dashboard-3-line text-primary"></i>
                                Şirket Yönetimi Kokpit Paneli
                            </h4>
                            <p className="text-muted mb-0 fs-13">
                                Logo Tiger ERP verileri
                                <Badge bg="success" className="ms-2">Bağlı</Badge>
                            </p>
                        </Col>
                        <Col xs="auto" className="text-end">
                            <small className="text-muted d-block mb-2">
                                Son güncelleme: {formatDate(logo.generated_at)}
                                {logo.cache_ttl_minutes && <span className="ms-1">({logo.cache_ttl_minutes} dk cache)</span>}
                            </small>
                            <button
                                className="btn btn-soft-primary btn-sm"
                                onClick={handleRefresh}
                                disabled={isRefreshing}
                            >
                                <i className={`ri-refresh-line me-1 ${isRefreshing ? 'ri-loader-4-line spin' : ''}`}></i>
                                {isRefreshing ? 'Yenileniyor...' : 'Yenile'}
                            </button>
                        </Col>
                    </Row>

                    {/* KPI CARDS */}
                    <Row className="g-3 mb-4">
                        {logo.kpi.length === 0 && (
                            <Col xs={12}>
                                <div className="alert alert-info mb-0">KPI verileri yüklenemedi.</div>
                            </Col>
                        )}
                        {logo.kpi.map((card) => (
                            <Col xl={3} md={6} key={card.key}>
                                <Card className="card-animate border-0 shadow-sm h-100">
                                    <Card.Body>
                                        <div className="d-flex justify-content-between align-items-start">
                                            <div>
                                                <p className="text-uppercase fw-medium text-muted fs-12 mb-1">{card.title}</p>
                                                <h4 className="fs-22 fw-semibold mb-0">
                                                    {card.currency ? (
                                                        <CountUp
                                                            end={card.value}
                                                            separator="."
                                                            decimal=","
                                                            decimals={0}
                                                            duration={1.5}
                                                            prefix={card.currency === 'TRY' ? '₺' : card.currency === 'USD' ? '$' : '€'}
                                                        />
                                                    ) : (
                                                        <CountUp end={card.value} separator="." decimal="," decimals={0} duration={1.5} />
                                                    )}
                                                </h4>
                                                {card.key === 'open_orders' && card.subtitle_value ? (
                                                    <p className="text-muted mb-0 mt-1 fs-12">Tutar: {formatMoney(card.subtitle_value)}</p>
                                                ) : null}
                                                {card.change.percent !== 0 && (
                                                    <small className={card.change.trend === 'up' ? 'text-success' : card.change.trend === 'down' ? 'text-danger' : 'text-muted'}>
                                                        <i className={`ri-arrow-${card.change.trend === 'up' ? 'up' : card.change.trend === 'down' ? 'down' : 'right'}-line me-1`}></i>
                                                        {Math.abs(card.change.percent).toFixed(1)}%
                                                        {card.key === 'monthly_revenue' && <span className="text-muted ms-1">geçen aya göre</span>}
                                                    </small>
                                                )}
                                            </div>
                                            <div className={`avatar-sm rounded bg-${card.color}-subtle`}>
                                                <span className={`avatar-title rounded text-${card.color} fs-4`}>
                                                    <i className={card.icon}></i>
                                                </span>
                                            </div>
                                        </div>
                                    </Card.Body>
                                </Card>
                            </Col>
                        ))}
                    </Row>

                    {/* TABS */}
                    <Nav variant="tabs" className="mb-4 nav-tabs-custom">
                        {([
                            ['genel', 'ri-dashboard-line', 'Genel Bakış'],
                            ['satis', 'ri-line-chart-line', 'Satış Analizi'],
                            ['finans', 'ri-wallet-3-line', 'Finans & Cari'],
                            ['stok', 'ri-stack-line', 'Stok & Envanter'],
                        ] as [TabKey, string, string][]).map(([key, icon, label]) => (
                            <Nav.Item key={key}>
                                <Nav.Link
                                    active={activeTab === key}
                                    onClick={() => setActiveTab(key)}
                                    className="d-flex align-items-center gap-1"
                                    style={{ cursor: 'pointer' }}
                                >
                                    <i className={icon}></i> {label}
                                </Nav.Link>
                            </Nav.Item>
                        ))}
                    </Nav>

                    {/* TAB 1: GENEL BAKIŞ */}
                    {activeTab === 'genel' && (
                        <>
                            <Row className="g-3 mb-4">
                                <Col xxl={8}>
                                    <Card className="border-0 shadow-sm h-100">
                                        <Card.Header className="bg-transparent border-0">
                                            <h5 className="mb-0">Son 30 Gün Günlük Satış</h5>
                                        </Card.Header>
                                        <Card.Body>
                                            {logo.daily_sales_30d.length > 0 ? (
                                                <Chart type="bar" height={300} options={dailySalesOpts} series={[{ name: 'Ciro', data: logo.daily_sales_30d.map(d => d.toplam) }]} />
                                            ) : (
                                                <div className="text-center text-muted py-5">Veri bulunamadı</div>
                                            )}
                                        </Card.Body>
                                    </Card>
                                </Col>
                                <Col xxl={4}>
                                    <Card className="border-0 shadow-sm h-100">
                                        <Card.Header className="bg-transparent border-0">
                                            <h5 className="mb-0">Sipariş Durum Dağılımı</h5>
                                            <small className="text-muted">Son 3 ay</small>
                                        </Card.Header>
                                        <Card.Body>
                                            {logo.order_status_funnel.length > 0 ? (
                                                <Chart type="donut" height={300} options={orderFunnelOpts} series={logo.order_status_funnel.map(d => d.tutar)} />
                                            ) : (
                                                <div className="text-center text-muted py-5">Veri bulunamadı</div>
                                            )}
                                        </Card.Body>
                                    </Card>
                                </Col>
                            </Row>

                            <Row className="g-3 mb-4">
                                <Col xs={12}>
                                    <Card className="border-0 shadow-sm">
                                        <Card.Header className="bg-transparent border-0">
                                            <h5 className="mb-0">Son 12 Ay Ciro Trendi</h5>
                                        </Card.Header>
                                        <Card.Body>
                                            {logo.monthly_revenue_trend.length > 0 ? (
                                                <Chart
                                                    type="line"
                                                    height={350}
                                                    options={revenueTrendOpts}
                                                    series={[
                                                        { name: 'Ciro (KDV Dahil)', type: 'area', data: logo.monthly_revenue_trend.map(d => d.nettotal) },
                                                        { name: 'Fatura Adedi', type: 'column', data: logo.monthly_revenue_trend.map(d => d.count) },
                                                    ]}
                                                />
                                            ) : (
                                                <div className="text-center text-muted py-5">Veri bulunamadı</div>
                                            )}
                                        </Card.Body>
                                    </Card>
                                </Col>
                            </Row>

                            {/* Cari özet kartları */}
                            {logo.cari_net && (
                                <Row className="g-3 mb-4">
                                    <Col xl={3} md={6}>
                                        <Card className="border bg-primary-subtle h-100">
                                            <Card.Body>
                                                <div className="text-muted fs-12 mb-1">Toplam Borç (Müşterilerde)</div>
                                                <h5 className="text-success mb-0">{formatMoney(logo.cari_net.toplam_borc)}</h5>
                                            </Card.Body>
                                        </Card>
                                    </Col>
                                    <Col xl={3} md={6}>
                                        <Card className="border bg-danger-subtle h-100">
                                            <Card.Body>
                                                <div className="text-muted fs-12 mb-1">Toplam Alacak (Müşteriye)</div>
                                                <h5 className="text-danger mb-0">{formatMoney(logo.cari_net.toplam_alacak)}</h5>
                                            </Card.Body>
                                        </Card>
                                    </Col>
                                    <Col xl={3} md={6}>
                                        <Card className="border bg-success-subtle h-100">
                                            <Card.Body>
                                                <div className="text-muted fs-12 mb-1">Net Alacak</div>
                                                <h5 className={`mb-0 ${logo.cari_net.net_alacak >= 0 ? 'text-success' : 'text-danger'}`}>
                                                    {formatMoney(logo.cari_net.net_alacak)}
                                                </h5>
                                            </Card.Body>
                                        </Card>
                                    </Col>
                                    <Col xl={3} md={6}>
                                        <Card className="border bg-info-subtle h-100">
                                            <Card.Body>
                                                <div className="text-muted fs-12 mb-1">Aktif Cari Sayısı</div>
                                                <h5 className="mb-0">{formatNumber(logo.cari_net.cari_sayisi)}</h5>
                                            </Card.Body>
                                        </Card>
                                    </Col>
                                </Row>
                            )}
                        </>
                    )}

                    {/* TAB 2: SATIŞ ANALİZİ */}
                    {activeTab === 'satis' && (
                        <>
                            <Row className="g-3 mb-4">
                                <Col xxl={6}>
                                    <Card className="border-0 shadow-sm h-100">
                                        <Card.Header className="bg-transparent border-0">
                                            <h5 className="mb-0">En Çok Ciro Yapan 10 Müşteri</h5>
                                            <small className="text-muted">Son 12 ay (fatura bazlı)</small>
                                        </Card.Header>
                                        <Card.Body>
                                            {logo.top_customers.length > 0 ? (
                                                <Chart
                                                    type="bar"
                                                    height={380}
                                                    options={topCustomersOpts}
                                                    series={[{ name: 'Ciro', data: logo.top_customers.map(d => d.ciro) }]}
                                                    // categories set via yaxis
                                                />
                                            ) : (
                                                <div className="text-center text-muted py-5">Veri bulunamadı</div>
                                            )}
                                            {logo.top_customers.length > 0 && (
                                                <div className="table-responsive mt-2">
                                                    <Table className="table-sm align-middle mb-0" hover>
                                                        <thead className="table-light">
                                                            <tr>
                                                                <th>Müşteri</th>
                                                                <th className="text-end">Ciro</th>
                                                                <th className="text-end">Fatura</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {logo.top_customers.map((c, i) => (
                                                                <tr key={i}>
                                                                    <td>
                                                                        <div className="fw-medium">{c.cari_adi}</div>
                                                                        <small className="text-muted">{c.cari_kodu}</small>
                                                                    </td>
                                                                    <td className="text-end fw-semibold">{formatMoney(c.ciro)}</td>
                                                                    <td className="text-end">{c.fatura_sayisi}</td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </Table>
                                                </div>
                                            )}
                                        </Card.Body>
                                    </Card>
                                </Col>
                                <Col xxl={6}>
                                    <Card className="border-0 shadow-sm h-100">
                                        <Card.Header className="bg-transparent border-0">
                                            <h5 className="mb-0">En Çok Satan 10 Ürün</h5>
                                            <small className="text-muted">Son 12 ay (sipariş bazlı)</small>
                                        </Card.Header>
                                        <Card.Body>
                                            {logo.top_products.length > 0 ? (
                                                <Chart
                                                    type="bar"
                                                    height={380}
                                                    options={topProductsOpts}
                                                    series={[{ name: 'Tutar', data: logo.top_products.map(d => d.tutar) }]}
                                                />
                                            ) : (
                                                <div className="text-center text-muted py-5">Veri bulunamadı</div>
                                            )}
                                            {logo.top_products.length > 0 && (
                                                <div className="table-responsive mt-2">
                                                    <Table className="table-sm align-middle mb-0" hover>
                                                        <thead className="table-light">
                                                            <tr>
                                                                <th>Ürün</th>
                                                                <th className="text-end">Tutar</th>
                                                                <th className="text-end">Miktar</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {logo.top_products.map((p, i) => (
                                                                <tr key={i}>
                                                                    <td>
                                                                        <div className="fw-medium">{p.urun_adi}</div>
                                                                        <small className="text-muted">{p.urun_kodu}</small>
                                                                    </td>
                                                                    <td className="text-end fw-semibold">{formatMoney(p.tutar)}</td>
                                                                    <td className="text-end">{formatNumber(p.miktar)}</td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </Table>
                                                </div>
                                            )}
                                        </Card.Body>
                                    </Card>
                                </Col>
                            </Row>

                            <Row className="g-3 mb-4">
                                <Col xxl={6}>
                                    <Card className="border-0 shadow-sm h-100">
                                        <Card.Header className="bg-transparent border-0">
                                            <h5 className="mb-0">Plasiyer Performansı</h5>
                                            <small className="text-muted">Bu ay</small>
                                        </Card.Header>
                                        <Card.Body>
                                            {logo.salesperson_performance.length > 0 ? (
                                                <Chart
                                                    type="bar"
                                                    height={300}
                                                    options={salespersonOpts}
                                                    series={[{ name: 'Ciro', data: logo.salesperson_performance.map(d => d.ciro) }]}
                                                />
                                            ) : (
                                                <div className="text-center text-muted py-5">Bu ay plasiyer verisi bulunamadı</div>
                                            )}
                                        </Card.Body>
                                    </Card>
                                </Col>
                                <Col xxl={6}>
                                    <Card className="border-0 shadow-sm h-100">
                                        <Card.Header className="bg-transparent border-0">
                                            <h5 className="mb-0">Fatura vs Tahsilat Trendi</h5>
                                            <small className="text-muted">Son 12 ay</small>
                                        </Card.Header>
                                        <Card.Body>
                                            {logo.invoice_vs_collection.length > 0 ? (
                                                <Chart
                                                    type="line"
                                                    height={300}
                                                    options={invVsCollOpts}
                                                    series={[
                                                        { name: 'Faturalar', data: logo.invoice_vs_collection.map(d => d.fatura) },
                                                        { name: 'Tahsilatlar', data: logo.invoice_vs_collection.map(d => d.tahsilat) },
                                                    ]}
                                                />
                                            ) : (
                                                <div className="text-center text-muted py-5">Veri bulunamadı</div>
                                            )}
                                        </Card.Body>
                                    </Card>
                                </Col>
                            </Row>
                        </>
                    )}

                    {/* TAB 3: FİNANS & CARİ */}
                    {activeTab === 'finans' && (
                        <>
                            <Row className="g-3 mb-4">
                                <Col xxl={5}>
                                    <Card className="border-0 shadow-sm h-100">
                                        <Card.Header className="bg-transparent border-0">
                                            <h5 className="mb-0">Cari Vade Analizi</h5>
                                        </Card.Header>
                                        <Card.Body>
                                            {logo.customer_aging.length > 0 ? (
                                                <Chart
                                                    type="donut"
                                                    height={300}
                                                    options={agingOpts}
                                                    series={logo.customer_aging.map(d => Math.abs(d.net_tutar))}
                                                />
                                            ) : (
                                                <div className="text-center text-muted py-5">Veri bulunamadı</div>
                                            )}
                                            {logo.customer_aging.length > 0 && (
                                                <div className="table-responsive mt-3">
                                                    <Table className="table-sm mb-0">
                                                        <thead className="table-light">
                                                            <tr>
                                                                <th>Vade</th>
                                                                <th className="text-end">Net Tutar</th>
                                                                <th className="text-end">Cari Sayısı</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {logo.customer_aging.map((a, i) => (
                                                                <tr key={i}>
                                                                    <td>{a.label}</td>
                                                                    <td className={`text-end fw-semibold ${a.vade_grubu === 'guncel' ? 'text-success' : 'text-danger'}`}>
                                                                        {formatMoney(a.net_tutar)}
                                                                    </td>
                                                                    <td className="text-end text-muted">{a.cari_sayisi}</td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </Table>
                                                </div>
                                            )}
                                        </Card.Body>
                                    </Card>
                                </Col>
                                <Col xxl={7}>
                                    <Card className="border-0 shadow-sm h-100">
                                        <Card.Header className="bg-transparent border-0">
                                            <h5 className="mb-0">Banka Bakiye Trendi</h5>
                                            <small className="text-muted">Son 12 ay (kümülatif)</small>
                                        </Card.Header>
                                        <Card.Body>
                                            {logo.bank_balance_trend.length > 0 ? (
                                                <Chart
                                                    type="area"
                                                    height={300}
                                                    options={bankTrendOpts}
                                                    series={[{ name: 'Bakiye', data: logo.bank_balance_trend.map(d => d.bakiye) }]}
                                                />
                                            ) : (
                                                <div className="text-center text-muted py-5">Veri bulunamadı</div>
                                            )}
                                        </Card.Body>
                                    </Card>
                                </Col>
                            </Row>

                            <Row className="g-3 mb-4">
                                <Col xxl={6}>
                                    <Card className="border-0 shadow-sm h-100">
                                        <Card.Header className="bg-transparent border-0">
                                            <h5 className="mb-0 d-flex align-items-center gap-2">
                                                Banka Bakiyeleri
                                                <Badge bg="primary" className="fs-10">LOGO</Badge>
                                            </h5>
                                        </Card.Header>
                                        <Card.Body className="pt-0">
                                            <div className="table-responsive">
                                                <Table className="table-sm align-middle mb-0" hover>
                                                    <thead className="table-light">
                                                        <tr>
                                                            <th>Döviz</th>
                                                            <th className="text-end">Bakiye</th>
                                                            <th className="text-end">Hesap</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {logo.bank_balances.length === 0 && (
                                                            <tr><td colSpan={3} className="text-center text-muted py-3">Banka verisi bulunamadı</td></tr>
                                                        )}
                                                        {logo.bank_balances.map((row) => (
                                                            <tr
                                                                key={`bank-${row.currency}`}
                                                                onClick={() => row.accounts && row.accounts.length > 0 && setBankModal({ currency: row.currency, accounts: row.accounts })}
                                                                style={{ cursor: row.accounts && row.accounts.length > 0 ? 'pointer' : 'default' }}
                                                                title={row.accounts && row.accounts.length > 0 ? 'Detay için tıklayın' : undefined}
                                                            >
                                                                <td>
                                                                    {row.currency}
                                                                    {row.accounts && row.accounts.length > 0 && (
                                                                        <i className="ri-external-link-line ms-1 text-muted" style={{ fontSize: '11px' }} />
                                                                    )}
                                                                </td>
                                                                <td className={`text-end fw-semibold ${row.amount >= 0 ? 'text-success' : 'text-danger'}`}>
                                                                    {formatMoney(row.amount, row.currency)}
                                                                </td>
                                                                <td className="text-end text-muted">{row.account_count}</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </Table>
                                            </div>
                                        </Card.Body>
                                    </Card>
                                </Col>
                                <Col xxl={6}>
                                    <Card className="border-0 shadow-sm h-100">
                                        <Card.Header className="bg-transparent border-0">
                                            <h5 className="mb-0 d-flex align-items-center gap-2">
                                                Kasa Bakiyeleri
                                                <Badge bg="primary" className="fs-10">LOGO</Badge>
                                            </h5>
                                        </Card.Header>
                                        <Card.Body className="pt-0">
                                            <div className="table-responsive">
                                                <Table className="table-sm align-middle mb-0">
                                                    <thead className="table-light">
                                                        <tr>
                                                            <th>Döviz</th>
                                                            <th className="text-end">Bakiye</th>
                                                            <th className="text-end">Kasa</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {logo.cash_balances.length === 0 && (
                                                            <tr><td colSpan={3} className="text-center text-muted py-3">Kasa verisi bulunamadı</td></tr>
                                                        )}
                                                        {logo.cash_balances.map((row) => (
                                                            <tr key={`cash-${row.currency}`}>
                                                                <td>{row.currency}</td>
                                                                <td className={`text-end fw-semibold ${row.amount >= 0 ? 'text-success' : 'text-danger'}`}>
                                                                    {formatMoney(row.amount, row.currency)}
                                                                </td>
                                                                <td className="text-end text-muted">{row.account_count}</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </Table>
                                            </div>
                                        </Card.Body>
                                    </Card>
                                </Col>
                            </Row>

                            {/* Top Debtors */}
                            <Row className="g-3 mb-4">
                                <Col xs={12}>
                                    <Card className="border-0 shadow-sm">
                                        <Card.Header className="bg-transparent border-0">
                                            <h5 className="mb-0">En Borçlu 10 Müşteri</h5>
                                        </Card.Header>
                                        <Card.Body className="pt-0">
                                            <div className="table-responsive">
                                                <Table className="table-sm align-middle mb-0" hover>
                                                    <thead className="table-light">
                                                        <tr>
                                                            <th>#</th>
                                                            <th>Müşteri</th>
                                                            <th className="text-end">Net Bakiye</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {logo.top_debtors.length === 0 && (
                                                            <tr><td colSpan={3} className="text-center text-muted py-4">Veri bulunamadı</td></tr>
                                                        )}
                                                        {logo.top_debtors.map((d, i) => (
                                                            <tr key={i}>
                                                                <td className="text-muted">{i + 1}</td>
                                                                <td>
                                                                    <div className="fw-medium">{d.cari_adi}</div>
                                                                    <small className="text-muted">{d.cari_kodu}</small>
                                                                </td>
                                                                <td className="text-end fw-semibold text-success">{formatMoney(d.net_bakiye)}</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </Table>
                                            </div>
                                        </Card.Body>
                                    </Card>
                                </Col>
                            </Row>
                        </>
                    )}

                    {/* TAB 4: STOK & ENVANTER */}
                    {activeTab === 'stok' && (
                        <>
                            <Row className="g-3 mb-4">
                                <Col xxl={8}>
                                    <Card className="border-0 shadow-sm h-100">
                                        <Card.Header className="bg-transparent border-0">
                                            <h5 className="mb-0">Stok Dağılımı (Marka Bazlı)</h5>
                                        </Card.Header>
                                        <Card.Body>
                                            {logo.stock_distribution.length > 0 ? (
                                                <Chart
                                                    type="donut"
                                                    height={380}
                                                    options={stockDistOpts}
                                                    series={logo.stock_distribution.map(d => d.miktar)}
                                                />
                                            ) : (
                                                <div className="text-center text-muted py-5">Stok verisi bulunamadı</div>
                                            )}
                                        </Card.Body>
                                    </Card>
                                </Col>
                                <Col xxl={4}>
                                    <Card className="border-0 shadow-sm mb-3">
                                        <Card.Body>
                                            <h6 className="mb-3">Stok Özeti</h6>
                                            <div className="d-flex justify-content-between mb-2">
                                                <span className="text-muted">Toplam Çeşit</span>
                                                <strong>{formatNumber(logo.stock_distribution.reduce((s, d) => s + d.urun_sayisi, 0))}</strong>
                                            </div>
                                            <div className="d-flex justify-content-between mb-2">
                                                <span className="text-muted">Toplam Miktar</span>
                                                <strong>{formatNumber(logo.stock_distribution.reduce((s, d) => s + d.miktar, 0))}</strong>
                                            </div>
                                            <div className="d-flex justify-content-between">
                                                <span className="text-muted">Marka/Grup Sayısı</span>
                                                <strong>{logo.stock_distribution.length}</strong>
                                            </div>
                                        </Card.Body>
                                    </Card>

                                    {logo.stock_distribution.length > 0 && (
                                        <Card className="border-0 shadow-sm">
                                            <Card.Header className="bg-transparent border-0 pb-0">
                                                <h6 className="mb-0">Detay Tablosu</h6>
                                            </Card.Header>
                                            <Card.Body className="pt-2">
                                                <div className="table-responsive">
                                                    <Table className="table-sm mb-0">
                                                        <thead className="table-light">
                                                            <tr>
                                                                <th>Marka</th>
                                                                <th className="text-end">Çeşit</th>
                                                                <th className="text-end">Miktar</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {logo.stock_distribution.map((s, i) => (
                                                                <tr key={i}>
                                                                    <td>{s.label}</td>
                                                                    <td className="text-end">{s.urun_sayisi}</td>
                                                                    <td className="text-end fw-semibold">{formatNumber(s.miktar)}</td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </Table>
                                                </div>
                                            </Card.Body>
                                        </Card>
                                    )}
                                </Col>
                            </Row>
                        </>
                    )}

                </div>
            </div>
        </Layout>

        {/* Banka Hesap Detay Modal */}
        <Modal show={!!bankModal} onHide={() => setBankModal(null)} size="lg" centered>
            <Modal.Header closeButton>
                <Modal.Title className="fs-15 d-flex align-items-center gap-2">
                    <Badge bg="primary" className="fs-10">LOGO</Badge>
                    Banka Bakiyesi — {bankModal?.currency}
                </Modal.Title>
            </Modal.Header>
            <Modal.Body className="p-0">
                {bankModal && (
                    <div className="table-responsive">
                        <Table className="mb-0 align-middle" hover>
                            <thead className="table-light">
                                <tr>
                                    <th className="ps-3">Hesap Kodu</th>
                                    <th>Banka / Şube</th>
                                    <th className="text-end">Giriş</th>
                                    <th className="text-end">Çıkış</th>
                                    <th className="text-end pe-3">Net Bakiye</th>
                                </tr>
                            </thead>
                            <tbody>
                                {bankModal.accounts.map((acc, i) => (
                                    <tr key={i}>
                                        <td className="ps-3"><span className="fw-semibold">{acc.code || '—'}</span></td>
                                        <td>
                                            <div className="fw-semibold fs-13">{acc.name || '—'}</div>
                                            {acc.branch && <div className="text-muted fs-11">{acc.branch}</div>}
                                        </td>
                                        <td className="text-end text-success fs-13">{formatMoney(acc.total_in, bankModal.currency)}</td>
                                        <td className="text-end text-danger fs-13">{formatMoney(acc.total_out, bankModal.currency)}</td>
                                        <td className={`text-end fw-bold pe-3 ${acc.amount >= 0 ? 'text-success' : 'text-danger'}`}>
                                            {formatMoney(acc.amount, bankModal.currency)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot className="table-light">
                                <tr>
                                    <td colSpan={4} className="ps-3 fw-semibold text-end pe-2">Toplam</td>
                                    <td className={`text-end fw-bold pe-3 ${bankModal.accounts.reduce((s, a) => s + a.amount, 0) >= 0 ? 'text-success' : 'text-danger'}`}>
                                        {formatMoney(bankModal.accounts.reduce((s, a) => s + a.amount, 0), bankModal.currency)}
                                    </td>
                                </tr>
                            </tfoot>
                        </Table>
                    </div>
                )}
            </Modal.Body>
        </Modal>
        </>
    );
};

CompanyManagerDashboard.layout = (page: React.ReactElement) => page;

export default CompanyManagerDashboard;
