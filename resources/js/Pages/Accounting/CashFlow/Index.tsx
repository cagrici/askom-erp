import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import Layout from '../../../Layouts';

// ==================== TYPES ====================

interface BankBalance {
    account_code: string;
    account_name: string;
    branch: string;
    currency: string;
    total_in: number;
    total_out: number;
    amount: number;
    total_in_foreign: number | null;
    total_out_foreign: number | null;
    amount_foreign: number | null;
}

interface CashBalance {
    currency: string;
    amount: number;
    account_count: number;
}

interface CustomerBalance {
    cari_ref: number;
    cari_kodu: string;
    cari_adi: string;
    grup: string;
    borc: number;
    alacak: number;
    net_bakiye: number;
    amount: number;
}

interface CurrencyBreakdown {
    currency: string;
    net_doviz: number;
    net_try: number;
    cari_sayisi: number;
}

interface AccountSummary {
    total: number;
    count: number;
    by_customer: CustomerBalance[];
    by_currency: CurrencyBreakdown[];
}

interface CheckItem {
    id: number;
    tip: string;
    portfoy_no: string;
    seri_no: string;
    banka: string;
    cari_adi: string;
    vade_tarihi: string;
    islem_tarihi: string;
    amount: number;
    currency: string;
    durum: string;
    vadeye_kalan_gun: number;
    vadesi_gecmis: boolean;
}

interface OverdueItem {
    cari_kodu: string;
    cari_adi: string;
    net_bakiye: number;
    amount: number;
    son_hareket: string | null;
    gecikme_gun: number;
    hareketsiz_gun: number;
}

interface TimelineItem {
    label: string;
    period_key: string;
    type: 'actual' | 'current' | 'projection';
    giris: number;
    cikis: number;
    net: number;
}

interface Summary {
    total_cash: number;
    total_bank: number;
    total_kasa: number;
    total_receivables: number;
    total_payables: number;
    net_position: number;
    total_checks_receivable: number;
    total_checks_payable: number;
    overdue_receivables: number;
    overdue_payables: number;
    forecast_overdue: number;
    forecast_this_week: number;
    forecast_next_4_weeks: number;
}

interface WeeklyForecastItem {
    week_key: string;
    label: string;
    week_start: string | null;
    week_end: string | null;
    receivable_amount: number;
    check_amount: number;
    total_expected: number;
    customer_count: number;
    is_overdue: boolean;
    is_current_week: boolean;
}

interface ForecastCustomer {
    cari_kodu: string;
    cari_adi: string;
    vade_gun?: string;
    total: number;
}

interface ForecastSummary {
    total_overdue: number;
    total_this_week: number;
    total_next_week: number;
    total_next_4_weeks: number;
    total_12_weeks: number;
    has_due_dates: boolean;
}

interface WeeklyForecast {
    weeks: WeeklyForecastItem[];
    top_customers: ForecastCustomer[];
    summary: ForecastSummary;
}

interface Props {
    connected: boolean;
    generated_at: string;
    summary: Summary;
    bank_balances: BankBalance[];
    cash_balances: CashBalance[];
    receivables: AccountSummary;
    payables: AccountSummary;
    checks_receivable: CheckItem[];
    checks_payable: CheckItem[];
    overdue_receivables: OverdueItem[];
    overdue_payables: OverdueItem[];
    weekly_forecast: WeeklyForecast;
    timeline: TimelineItem[];
    filters: {
        period: string;
    };
}

// ==================== HELPERS ====================

const formatMoney = (amount: number, currency = 'TRY') => {
    const symbol = currency === 'TRY' ? '₺' : currency === 'USD' ? '$' : currency === 'EUR' ? '€' : currency + ' ';
    return symbol + new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Math.abs(amount));
};

const formatCompact = (amount: number) => {
    const abs = Math.abs(amount);
    if (abs >= 1_000_000) return (amount / 1_000_000).toFixed(1) + 'M';
    if (abs >= 1_000) return (amount / 1_000).toFixed(0) + 'K';
    return amount.toFixed(0);
};

const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    return d.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

const getDueBadge = (days: number) => {
    if (days < 0) return { class: 'bg-danger', text: `${Math.abs(days)} gün gecikme` };
    if (days === 0) return { class: 'bg-warning', text: 'Bugün' };
    if (days <= 7) return { class: 'bg-warning', text: `${days} gün` };
    if (days <= 30) return { class: 'bg-info', text: `${days} gün` };
    return { class: 'bg-secondary', text: `${days} gün` };
};

// ==================== EXPORT HELPERS ====================

const escapeCsv = (val: any): string => {
    if (val === null || val === undefined) return '';
    const str = String(val);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return '"' + str.replace(/"/g, '""') + '"';
    }
    return str;
};

const downloadCsv = (filename: string, headers: string[], rows: string[][]) => {
    const bom = '\uFEFF';
    const csv = bom + [headers.join(';'), ...rows.map(r => r.join(';'))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
};

const formatNum = (n: number) => n.toFixed(2).replace('.', ',');

// ==================== COMPONENT ====================

export default function Index({
    connected,
    generated_at,
    summary,
    bank_balances = [],
    cash_balances = [],
    receivables = { total: 0, count: 0, by_customer: [], by_currency: [] },
    payables = { total: 0, count: 0, by_customer: [], by_currency: [] },
    checks_receivable = [],
    checks_payable = [],
    overdue_receivables = [],
    overdue_payables = [],
    weekly_forecast = { weeks: [], top_customers: [], summary: { total_overdue: 0, total_this_week: 0, total_next_week: 0, total_next_4_weeks: 0, total_12_weeks: 0, has_due_dates: false } },
    timeline = [],
    filters,
}: Props) {
    const [activeTab, setActiveTab] = useState('receivables');
    const [timelineTab, setTimelineTab] = useState<'forecast' | 'timeline'>('forecast');
    const [period, setPeriod] = useState(filters?.period || 'monthly');
    const [recPage, setRecPage] = useState(1);
    const [payPage, setPayPage] = useState(1);
    const [recSearch, setRecSearch] = useState('');
    const [paySearch, setPaySearch] = useState('');
    const [recGroup, setRecGroup] = useState('all');
    const [payGroup, setPayGroup] = useState('all');
    const PAGE_SIZE = 50;

    // Filtered & paginated customer lists
    const filterCustomers = (customers: CustomerBalance[], search: string, group: string) => {
        let result = customers;
        if (group !== 'all') {
            result = result.filter(c => c.grup === group);
        }
        if (search.trim()) {
            const s = search.toLowerCase();
            result = result.filter(c => c.cari_kodu.toLowerCase().includes(s) || c.cari_adi.toLowerCase().includes(s));
        }
        return result;
    };

    const filteredReceivables = filterCustomers(receivables.by_customer || [], recSearch, recGroup);
    const filteredPayables = filterCustomers(payables.by_customer || [], paySearch, payGroup);
    const recTotalPages = Math.max(1, Math.ceil(filteredReceivables.length / PAGE_SIZE));
    const payTotalPages = Math.max(1, Math.ceil(filteredPayables.length / PAGE_SIZE));
    const pagedReceivables = filteredReceivables.slice((recPage - 1) * PAGE_SIZE, recPage * PAGE_SIZE);
    const pagedPayables = filteredPayables.slice((payPage - 1) * PAGE_SIZE, payPage * PAGE_SIZE);

    const handlePeriodChange = (newPeriod: string) => {
        setPeriod(newPeriod);
        router.get(route('accounting.cash-flow.index'), { period: newPeriod }, { preserveState: true });
    };

    const handleRefresh = () => {
        router.get(route('accounting.cash-flow.index'), { period, refresh: 1 }, { preserveState: false });
    };

    const exportReceivables = () => {
        const headers = ['Cari Kodu', 'Cari Adı', 'Grup', 'Borç', 'Alacak', 'Bakiye'];
        const rows = (receivables.by_customer || []).map(c => [
            escapeCsv(c.cari_kodu), escapeCsv(c.cari_adi), escapeCsv(c.grup), formatNum(c.borc), formatNum(c.alacak), formatNum(c.net_bakiye)
        ]);
        downloadCsv('alacaklar.csv', headers, rows);
    };

    const exportPayables = () => {
        const headers = ['Cari Kodu', 'Cari Adı', 'Grup', 'Borç', 'Alacak', 'Bakiye'];
        const rows = (payables.by_customer || []).map(c => [
            escapeCsv(c.cari_kodu), escapeCsv(c.cari_adi), escapeCsv(c.grup), formatNum(c.borc), formatNum(c.alacak), formatNum(Math.abs(c.net_bakiye))
        ]);
        downloadCsv('borclar.csv', headers, rows);
    };

    const exportChecksReceivable = () => {
        const headers = ['Portföy No', 'Cari', 'Banka', 'Tutar', 'Döviz', 'Vade Tarihi', 'Vadeye Kalan Gün', 'Durum'];
        const rows = checks_receivable.map(c => [
            escapeCsv(c.portfoy_no), escapeCsv(c.cari_adi), escapeCsv(c.banka), formatNum(c.amount),
            c.currency, c.vade_tarihi, String(c.vadeye_kalan_gun), escapeCsv(c.durum)
        ]);
        downloadCsv('alinan_cekler.csv', headers, rows);
    };

    const exportChecksPayable = () => {
        const headers = ['Portföy No', 'Tip', 'Cari', 'Tutar', 'Döviz', 'Vade Tarihi', 'Vadeye Kalan Gün', 'Durum'];
        const rows = checks_payable.map(c => [
            escapeCsv(c.portfoy_no), escapeCsv(c.tip), escapeCsv(c.cari_adi), formatNum(c.amount),
            c.currency, c.vade_tarihi, String(c.vadeye_kalan_gun), escapeCsv(c.durum)
        ]);
        downloadCsv('verilen_cekler.csv', headers, rows);
    };

    const exportBankBalances = () => {
        const headers = ['Hesap Kodu', 'Hesap Adı', 'Şube', 'Döviz', 'Giriş (TRY)', 'Çıkış (TRY)', 'Bakiye (TRY)', 'Döviz Bakiye'];
        const rows = bank_balances.map(b => [
            escapeCsv(b.account_code), escapeCsv(b.account_name), escapeCsv(b.branch),
            b.currency, formatNum(b.total_in), formatNum(b.total_out), formatNum(b.amount),
            b.amount_foreign != null ? formatNum(b.amount_foreign) : ''
        ]);
        downloadCsv('banka_bakiyeleri.csv', headers, rows);
    };

    const exportForecast = () => {
        const headers = ['Hafta', 'Hafta Baslangic', 'Hafta Bitis', 'Cari Alacak (TRY)', 'Cek/Senet (TRY)', 'Toplam (TRY)', 'Musteri Sayisi'];
        const rows = (weekly_forecast.weeks || []).map(w => [
            escapeCsv(w.label), w.week_start || '', w.week_end || '',
            formatNum(w.receivable_amount), formatNum(w.check_amount), formatNum(w.total_expected), String(w.customer_count)
        ]);
        downloadCsv('haftalik_tahsilat_tahmini.csv', headers, rows);
    };

    const exportForecastCustomers = () => {
        const headers = ['Cari Kodu', 'Cari Adi', 'Toplam Alacak (TRY)'];
        const rows = (weekly_forecast.top_customers || []).map(c => [
            escapeCsv(c.cari_kodu), escapeCsv(c.cari_adi), formatNum(c.total)
        ]);
        downloadCsv('tahsilat_musteri_kirilimi.csv', headers, rows);
    };

    const exportTimeline = () => {
        const headers = ['Dönem', 'Tip', 'Giriş', 'Çıkış', 'Net'];
        const rows = timeline.map(t => [
            escapeCsv(t.label), t.type === 'projection' ? 'Projeksiyon' : 'Gerçekleşen',
            formatNum(t.giris), formatNum(t.cikis), formatNum(t.net)
        ]);
        downloadCsv('nakit_akis_zaman_cizelgesi.csv', headers, rows);
    };

    if (!connected) {
        return (
            <React.Fragment>
                <Head title="Nakit Akışı" />
                <div className="page-content">
                    <div className="container-fluid">
                        <div className="alert alert-warning">
                            <i className="ri-error-warning-line me-2"></i>
                            Logo Tiger veritabanına bağlanılamadı. Lütfen daha sonra tekrar deneyin.
                        </div>
                    </div>
                </div>
            </React.Fragment>
        );
    }

    // Find max value for timeline bar chart scaling
    const timelineMax = Math.max(1, ...timeline.map(t => Math.max(t.giris, t.cikis)));

    return (
        <React.Fragment>
            <Head title="Nakit Akışı" />
            <div className="page-content">
                <div className="container-fluid">

                    {/* Page Header */}
                    <div className="row mb-3">
                        <div className="col-12">
                            <div className="d-flex align-items-center justify-content-between">
                                <div>
                                    <h4 className="mb-0">Nakit Akış Tablosu</h4>
                                    <small className="text-muted">
                                        Son güncelleme: {generated_at}
                                    </small>
                                </div>
                                <div className="d-flex gap-2">
                                    <div className="btn-group" role="group">
                                        <button
                                            className={`btn btn-sm ${period === 'weekly' ? 'btn-primary' : 'btn-outline-primary'}`}
                                            onClick={() => handlePeriodChange('weekly')}
                                        >
                                            Haftalık
                                        </button>
                                        <button
                                            className={`btn btn-sm ${period === 'monthly' ? 'btn-primary' : 'btn-outline-primary'}`}
                                            onClick={() => handlePeriodChange('monthly')}
                                        >
                                            Aylık
                                        </button>
                                    </div>
                                    <button className="btn btn-sm btn-outline-secondary" onClick={handleRefresh}>
                                        <i className="ri-refresh-line"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* KPI Cards */}
                    <div className="row mb-3">
                        <div className="col-xl-3 col-md-6 mb-3">
                            <div className="card card-animate border-0 shadow-sm h-100">
                                <div className="card-body">
                                    <div className="d-flex align-items-center">
                                        <div className="flex-grow-1">
                                            <p className="text-uppercase fw-medium text-muted mb-1" style={{ fontSize: '0.75rem' }}>Toplam Nakit</p>
                                            <h4 className="fs-20 fw-bold text-success mb-0">{formatMoney(summary.total_cash)}</h4>
                                            <div className="mt-1">
                                                <small className="text-muted">Banka: {formatMoney(summary.total_bank)}</small>
                                                <br />
                                                <small className="text-muted">Kasa: {formatMoney(summary.total_kasa)}</small>
                                            </div>
                                        </div>
                                        <div className="avatar-sm flex-shrink-0">
                                            <span className="avatar-title bg-success-subtle text-success rounded-circle fs-3">
                                                <i className="ri-bank-line"></i>
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="col-xl-3 col-md-6 mb-3">
                            <div className="card card-animate border-0 shadow-sm h-100">
                                <div className="card-body">
                                    <div className="d-flex align-items-center">
                                        <div className="flex-grow-1">
                                            <p className="text-uppercase fw-medium text-muted mb-1" style={{ fontSize: '0.75rem' }}>Toplam Alacak</p>
                                            <h4 className="fs-20 fw-bold text-info mb-0">{formatMoney(summary.total_receivables)}</h4>
                                            <div className="mt-1">
                                                <small className="text-danger">
                                                    Top 30 bakiye: {formatMoney(summary.overdue_receivables)}
                                                </small>
                                            </div>
                                        </div>
                                        <div className="avatar-sm flex-shrink-0">
                                            <span className="avatar-title bg-info-subtle text-info rounded-circle fs-3">
                                                <i className="ri-arrow-down-circle-line"></i>
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="col-xl-3 col-md-6 mb-3">
                            <div className="card card-animate border-0 shadow-sm h-100">
                                <div className="card-body">
                                    <div className="d-flex align-items-center">
                                        <div className="flex-grow-1">
                                            <p className="text-uppercase fw-medium text-muted mb-1" style={{ fontSize: '0.75rem' }}>Toplam Borç</p>
                                            <h4 className="fs-20 fw-bold text-danger mb-0">{formatMoney(summary.total_payables)}</h4>
                                            <div className="mt-1">
                                                <small className="text-danger">
                                                    Top 30 bakiye: {formatMoney(Math.abs(summary.overdue_payables))}
                                                </small>
                                            </div>
                                        </div>
                                        <div className="avatar-sm flex-shrink-0">
                                            <span className="avatar-title bg-danger-subtle text-danger rounded-circle fs-3">
                                                <i className="ri-arrow-up-circle-line"></i>
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="col-xl-3 col-md-6 mb-3">
                            <div className="card card-animate border-0 shadow-sm h-100">
                                <div className="card-body">
                                    <div className="d-flex align-items-center">
                                        <div className="flex-grow-1">
                                            <p className="text-uppercase fw-medium text-muted mb-1" style={{ fontSize: '0.75rem' }}>Net Pozisyon</p>
                                            <h4 className={`fs-20 fw-bold mb-0 ${summary.net_position >= 0 ? 'text-success' : 'text-danger'}`}>
                                                {summary.net_position >= 0 ? '+' : '-'}{formatMoney(summary.net_position)}
                                            </h4>
                                            <div className="mt-1">
                                                <small className="text-muted">Nakit + Alacak - Borç</small>
                                            </div>
                                        </div>
                                        <div className="avatar-sm flex-shrink-0">
                                            <span className={`avatar-title ${summary.net_position >= 0 ? 'bg-success-subtle text-success' : 'bg-danger-subtle text-danger'} rounded-circle fs-3`}>
                                                <i className="ri-funds-line"></i>
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Check Summary Cards */}
                    <div className="row mb-3">
                        <div className="col-xl-3 col-md-6 mb-3">
                            <div className="card border-0 shadow-sm h-100">
                                <div className="card-body py-3">
                                    <div className="d-flex justify-content-between align-items-center">
                                        <div>
                                            <small className="text-muted">Alınan Çekler</small>
                                            <h5 className="mb-0 text-success">{formatMoney(summary.total_checks_receivable)}</h5>
                                        </div>
                                        <span className="badge bg-success-subtle text-success">{checks_receivable.length} adet</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="col-xl-3 col-md-6 mb-3">
                            <div className="card border-0 shadow-sm h-100">
                                <div className="card-body py-3">
                                    <div className="d-flex justify-content-between align-items-center">
                                        <div>
                                            <small className="text-muted">Verilen Çek/Senet</small>
                                            <h5 className="mb-0 text-danger">{formatMoney(summary.total_checks_payable)}</h5>
                                        </div>
                                        <span className="badge bg-danger-subtle text-danger">{checks_payable.length} adet</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="col-xl-3 col-md-6 mb-3">
                            <div className="card border-0 shadow-sm h-100">
                                <div className="card-body py-3">
                                    <div className="d-flex justify-content-between align-items-center">
                                        <div>
                                            <small className="text-muted">Borçlu Cariler</small>
                                            <h5 className="mb-0">{receivables.count}</h5>
                                        </div>
                                        <i className="ri-user-received-line fs-24 text-muted"></i>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="col-xl-3 col-md-6 mb-3">
                            <div className="card border-0 shadow-sm h-100">
                                <div className="card-body py-3">
                                    <div className="d-flex justify-content-between align-items-center">
                                        <div>
                                            <small className="text-muted">Alacaklı Cariler</small>
                                            <h5 className="mb-0">{payables.count}</h5>
                                        </div>
                                        <i className="ri-user-shared-line fs-24 text-muted"></i>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Forecast & Timeline Card */}
                    <div className="row mb-3">
                        <div className="col-12">
                            <div className="card border-0 shadow-sm">
                                <div className="card-header bg-transparent border-0 pb-0">
                                    <ul className="nav nav-tabs card-header-tabs">
                                        <li className="nav-item">
                                            <button className={`nav-link ${timelineTab === 'forecast' ? 'active' : ''}`} onClick={() => setTimelineTab('forecast')}>
                                                <i className="ri-line-chart-line me-1"></i>Haftalik Tahsilat Tahmini
                                            </button>
                                        </li>
                                        <li className="nav-item">
                                            <button className={`nav-link ${timelineTab === 'timeline' ? 'active' : ''}`} onClick={() => setTimelineTab('timeline')}>
                                                <i className="ri-bar-chart-grouped-line me-1"></i>Nakit Akis Zaman Cizelgesi
                                                <small className="text-muted ms-1">({period === 'weekly' ? 'Haftalik' : 'Aylik'})</small>
                                            </button>
                                        </li>
                                    </ul>
                                </div>
                                <div className="card-body">

                                    {/* Tab: Forecast */}
                                    {timelineTab === 'forecast' && (
                                        <div>
                                            {/* KPI Cards: Bu Hafta, Gelecek Hafta, 4 Hafta, 12 Hafta, Vadesi Gecmis */}
                                            <div className="row mb-3">
                                                <div className="col mb-2">
                                                    <div className="card border border-warning bg-warning-subtle h-100 mb-0">
                                                        <div className="card-body py-2 px-3">
                                                            <small className="text-muted">Bu Hafta</small>
                                                            <h5 className="mb-0 text-warning">{formatMoney(weekly_forecast.summary.total_this_week)}</h5>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="col mb-2">
                                                    <div className="card border border-info bg-info-subtle h-100 mb-0">
                                                        <div className="card-body py-2 px-3">
                                                            <small className="text-muted">Gelecek Hafta</small>
                                                            <h5 className="mb-0 text-info">{formatMoney(weekly_forecast.summary.total_next_week)}</h5>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="col mb-2">
                                                    <div className="card border border-primary bg-primary-subtle h-100 mb-0">
                                                        <div className="card-body py-2 px-3">
                                                            <small className="text-muted">Onumuzdeki 4 Hafta</small>
                                                            <h5 className="mb-0 text-primary">{formatMoney(weekly_forecast.summary.total_next_4_weeks)}</h5>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="col mb-2">
                                                    <div className="card border border-success bg-success-subtle h-100 mb-0">
                                                        <div className="card-body py-2 px-3">
                                                            <small className="text-muted">12 Hafta Toplam</small>
                                                            <h5 className="mb-0 text-success">{formatMoney(weekly_forecast.summary.total_12_weeks)}</h5>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="col mb-2">
                                                    <div className="card border border-danger bg-danger-subtle h-100 mb-0">
                                                        <div className="card-body py-2 px-3">
                                                            <small className="text-muted">Vadesi Gecmis</small>
                                                            <h5 className="mb-0 text-danger">{formatMoney(weekly_forecast.summary.total_overdue)}</h5>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {!weekly_forecast.summary.has_due_dates && (
                                                <div className="alert alert-warning py-2 mb-3">
                                                    <i className="ri-error-warning-line me-1"></i>
                                                    Cari hesap odeme plani bilgisi bulunamadi. Tahminler yalnizca cek/senet vadelerine dayanmaktadir.
                                                </div>
                                            )}

                                            {/* Weekly Forecast Table */}
                                            <div className="d-flex justify-content-between align-items-center mb-2">
                                                <h6 className="mb-0">
                                                    <i className="ri-calendar-check-line me-1"></i>
                                                    Haftalik Kirilim
                                                </h6>
                                                <button className="btn btn-sm btn-outline-success" onClick={exportForecast} title="Excel'e Aktar">
                                                    <i className="ri-file-excel-2-line me-1"></i>Excel
                                                </button>
                                            </div>

                                            {(() => {
                                                const forecastWeeks = weekly_forecast.weeks || [];
                                                const forecastMax = Math.max(1, ...forecastWeeks.map(w => w.total_expected));
                                                return (
                                                    <div className="table-responsive mb-2">
                                                        <table className="table table-sm table-bordered mb-0" style={{ fontSize: '0.8rem' }}>
                                                            <thead className="table-light">
                                                                <tr>
                                                                    <th style={{ width: '130px' }}>Hafta</th>
                                                                    <th className="text-end">Cari Alacak</th>
                                                                    <th className="text-end">Cek/Senet</th>
                                                                    <th className="text-end">Toplam</th>
                                                                    <th className="text-center">Musteri</th>
                                                                    <th>Grafik</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {forecastWeeks.map((w, idx) => (
                                                                    <tr
                                                                        key={idx}
                                                                        className={
                                                                            w.is_overdue ? 'table-danger' :
                                                                            w.is_current_week ? 'table-warning' : ''
                                                                        }
                                                                    >
                                                                        <td className="fw-medium">
                                                                            {w.is_overdue && <i className="ri-error-warning-line text-danger me-1"></i>}
                                                                            {w.is_current_week && <i className="ri-arrow-right-s-fill text-warning me-1"></i>}
                                                                            {w.label}
                                                                        </td>
                                                                        <td className="text-end text-success">{w.receivable_amount > 0 ? formatCompact(w.receivable_amount) : '-'}</td>
                                                                        <td className="text-end text-primary">{w.check_amount > 0 ? formatCompact(w.check_amount) : '-'}</td>
                                                                        <td className="text-end fw-bold">{w.total_expected > 0 ? formatCompact(w.total_expected) : '-'}</td>
                                                                        <td className="text-center">{w.customer_count > 0 ? w.customer_count : '-'}</td>
                                                                        <td style={{ width: '35%' }}>
                                                                            {w.total_expected > 0 && (
                                                                                <div className="d-flex align-items-center gap-0" style={{ height: '18px' }}>
                                                                                    {w.receivable_amount > 0 && (
                                                                                        <div
                                                                                            className="bg-success"
                                                                                            style={{
                                                                                                width: `${(w.receivable_amount / forecastMax) * 100}%`,
                                                                                                height: '12px',
                                                                                                borderRadius: '2px 0 0 2px',
                                                                                            }}
                                                                                            title={`Cari: ${formatMoney(w.receivable_amount)}`}
                                                                                        ></div>
                                                                                    )}
                                                                                    {w.check_amount > 0 && (
                                                                                        <div
                                                                                            className="bg-primary"
                                                                                            style={{
                                                                                                width: `${(w.check_amount / forecastMax) * 100}%`,
                                                                                                height: '12px',
                                                                                                borderRadius: w.receivable_amount > 0 ? '0 2px 2px 0' : '2px',
                                                                                            }}
                                                                                            title={`Cek: ${formatMoney(w.check_amount)}`}
                                                                                        ></div>
                                                                                    )}
                                                                                </div>
                                                                            )}
                                                                        </td>
                                                                    </tr>
                                                                ))}
                                                                {forecastWeeks.length === 0 && (
                                                                    <tr><td colSpan={6} className="text-center text-muted py-3">Tahsilat tahmini verisi bulunamadi</td></tr>
                                                                )}
                                                            </tbody>
                                                            {forecastWeeks.length > 0 && (
                                                                <tfoot className="table-light">
                                                                    <tr>
                                                                        <td className="fw-bold">Genel Toplam</td>
                                                                        <td className="text-end fw-bold text-success">
                                                                            {formatCompact(forecastWeeks.reduce((s, w) => s + w.receivable_amount, 0))}
                                                                        </td>
                                                                        <td className="text-end fw-bold text-primary">
                                                                            {formatCompact(forecastWeeks.reduce((s, w) => s + w.check_amount, 0))}
                                                                        </td>
                                                                        <td className="text-end fw-bold">
                                                                            {formatCompact(forecastWeeks.reduce((s, w) => s + w.total_expected, 0))}
                                                                        </td>
                                                                        <td></td>
                                                                        <td></td>
                                                                    </tr>
                                                                </tfoot>
                                                            )}
                                                        </table>
                                                    </div>
                                                );
                                            })()}

                                            <div className="mb-3 d-flex gap-3">
                                                <small><span className="badge bg-success">&nbsp;</span> Cari Alacak</small>
                                                <small><span className="badge bg-primary">&nbsp;</span> Cek/Senet</small>
                                            </div>

                                            {weekly_forecast.summary.has_due_dates && (
                                                <div className="text-muted mb-3" style={{ fontSize: '0.8rem' }}>
                                                    <i className="ri-information-line me-1"></i>
                                                    Vade tarihleri, cari kartindaki odeme plani (gun) kullanilarak hesaplanmaktadir (islem tarihi + odeme plani gun).
                                                </div>
                                            )}

                                            {/* Top Customers Table */}
                                            {(weekly_forecast.top_customers || []).length > 0 && (
                                                <>
                                                    <div className="d-flex justify-content-between align-items-center mb-2">
                                                        <h6 className="mb-0">
                                                            <i className="ri-user-star-line me-1"></i>
                                                            En Yuksek Alacakli Musteriler (Vadeli)
                                                        </h6>
                                                        <button className="btn btn-sm btn-outline-success" onClick={exportForecastCustomers} title="Excel'e Aktar">
                                                            <i className="ri-file-excel-2-line me-1"></i>Excel
                                                        </button>
                                                    </div>
                                                    <div className="table-responsive">
                                                        <table className="table table-sm table-hover table-striped align-middle mb-0" style={{ fontSize: '0.85rem' }}>
                                                            <thead className="table-light">
                                                                <tr>
                                                                    <th>#</th>
                                                                    <th>Cari Kodu</th>
                                                                    <th>Cari Adi</th>
                                                                    <th className="text-center">Vade (Gun)</th>
                                                                    <th className="text-end">Toplam Alacak</th>
                                                                    <th style={{ width: '25%' }}>Oran</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {(() => {
                                                                    const customers = weekly_forecast.top_customers || [];
                                                                    const maxCust = Math.max(1, ...customers.map(c => c.total));
                                                                    return customers.map((c, idx) => (
                                                                        <tr key={idx}>
                                                                            <td className="text-muted">{idx + 1}</td>
                                                                            <td><code>{c.cari_kodu}</code></td>
                                                                            <td>{c.cari_adi}</td>
                                                                            <td className="text-center">
                                                                                <span className="badge bg-secondary">{c.vade_gun || '0'} gun</span>
                                                                            </td>
                                                                            <td className="text-end fw-bold text-success">{formatMoney(c.total)}</td>
                                                                            <td>
                                                                                <div className="progress" style={{ height: '8px' }}>
                                                                                    <div
                                                                                        className="progress-bar bg-success"
                                                                                        style={{ width: `${(c.total / maxCust) * 100}%` }}
                                                                                    ></div>
                                                                                </div>
                                                                            </td>
                                                                        </tr>
                                                                    ));
                                                                })()}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    )}

                                    {/* Tab: Timeline */}
                                    {timelineTab === 'timeline' && timeline.length > 0 && (
                                        <div>
                                            <div className="d-flex justify-content-end mb-2">
                                                <button className="btn btn-sm btn-outline-success" onClick={exportTimeline} title="Excel'e Aktar">
                                                    <i className="ri-file-excel-2-line me-1"></i>Excel
                                                </button>
                                            </div>
                                            <div className="table-responsive">
                                                <table className="table table-sm table-bordered mb-0" style={{ fontSize: '0.8rem' }}>
                                                    <thead className="table-light">
                                                        <tr>
                                                            <th style={{ width: '120px' }}>Donem</th>
                                                            <th className="text-end">Giris</th>
                                                            <th className="text-end">Cikis</th>
                                                            <th className="text-end">Net</th>
                                                            <th>Grafik</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {timeline.map((t, idx) => (
                                                            <tr key={idx} className={t.type === 'projection' ? 'table-light' : t.type === 'current' ? 'table-warning' : ''}>
                                                                <td className="fw-medium">
                                                                    {t.type === 'projection' && <i className="ri-arrow-right-s-line text-muted"></i>}
                                                                    {t.label}
                                                                </td>
                                                                <td className="text-end text-success">{formatCompact(t.giris)}</td>
                                                                <td className="text-end text-danger">{formatCompact(t.cikis)}</td>
                                                                <td className={`text-end fw-bold ${t.net >= 0 ? 'text-success' : 'text-danger'}`}>
                                                                    {t.net >= 0 ? '+' : ''}{formatCompact(t.net)}
                                                                </td>
                                                                <td style={{ width: '40%' }}>
                                                                    <div className="d-flex align-items-center gap-1" style={{ height: '20px' }}>
                                                                        <div
                                                                            className={`${t.type === 'projection' ? 'bg-success bg-opacity-50' : 'bg-success'}`}
                                                                            style={{ width: `${(t.giris / timelineMax) * 50}%`, height: '10px', borderRadius: '2px' }}
                                                                        ></div>
                                                                        <div
                                                                            className={`${t.type === 'projection' ? 'bg-danger bg-opacity-50' : 'bg-danger'}`}
                                                                            style={{ width: `${(t.cikis / timelineMax) * 50}%`, height: '10px', borderRadius: '2px' }}
                                                                        ></div>
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                            <div className="mt-2 d-flex gap-3">
                                                <small><span className="badge bg-success">&nbsp;</span> Giris (gerceklesen)</small>
                                                <small><span className="badge bg-danger">&nbsp;</span> Cikis (gerceklesen)</small>
                                                <small><span className="badge bg-success bg-opacity-50">&nbsp;</span> Giris (projeksiyon)</small>
                                                <small><span className="badge bg-danger bg-opacity-50">&nbsp;</span> Cikis (projeksiyon)</small>
                                            </div>
                                        </div>
                                    )}
                                    {timelineTab === 'timeline' && timeline.length === 0 && (
                                        <div className="text-center text-muted py-4">Zaman cizelgesi verisi bulunamadi</div>
                                    )}

                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Detail Tabs */}
                    <div className="row">
                        <div className="col-12">
                            <div className="card border-0 shadow-sm">
                                <div className="card-header bg-transparent border-0 pb-0">
                                    <ul className="nav nav-tabs card-header-tabs">
                                        <li className="nav-item">
                                            <button className={`nav-link ${activeTab === 'receivables' ? 'active' : ''}`} onClick={() => setActiveTab('receivables')}>
                                                <i className="ri-arrow-down-circle-line me-1"></i>Alacaklar
                                                <span className="badge bg-info ms-1">{receivables.count}</span>
                                            </button>
                                        </li>
                                        <li className="nav-item">
                                            <button className={`nav-link ${activeTab === 'payables' ? 'active' : ''}`} onClick={() => setActiveTab('payables')}>
                                                <i className="ri-arrow-up-circle-line me-1"></i>Borçlar
                                                <span className="badge bg-danger ms-1">{payables.count}</span>
                                            </button>
                                        </li>
                                        <li className="nav-item">
                                            <button className={`nav-link ${activeTab === 'checks' ? 'active' : ''}`} onClick={() => setActiveTab('checks')}>
                                                <i className="ri-secure-payment-line me-1"></i>Çek Portföyü
                                                <span className="badge bg-secondary ms-1">{checks_receivable.length + checks_payable.length}</span>
                                            </button>
                                        </li>
                                        <li className="nav-item">
                                            <button className={`nav-link ${activeTab === 'bank' ? 'active' : ''}`} onClick={() => setActiveTab('bank')}>
                                                <i className="ri-bank-line me-1"></i>Banka & Kasa
                                            </button>
                                        </li>
                                    </ul>
                                </div>
                                <div className="card-body">

                                    {/* Tab: Receivables */}
                                    {activeTab === 'receivables' && (
                                        <div>
                                            <div className="d-flex justify-content-between align-items-center mb-3">
                                                <h6 className="mb-0">Alacak Detayı <small className="text-muted">({receivables.count} cari, toplam {formatMoney(receivables.total)})</small></h6>
                                                <div className="d-flex gap-2 align-items-center">
                                                    <div className="btn-group" role="group">
                                                        {[
                                                            { key: 'all', label: 'Tümü' },
                                                            { key: 'Ana Hesap', label: 'Ana Hesap' },
                                                            { key: 'Yurtiçi', label: 'Yurtiçi' },
                                                            { key: 'Yurtdışı', label: 'Yurtdışı' },
                                                        ].map(g => (
                                                            <button
                                                                key={g.key}
                                                                className={`btn btn-sm ${recGroup === g.key ? 'btn-primary' : 'btn-outline-primary'}`}
                                                                onClick={() => { setRecGroup(g.key); setRecPage(1); }}
                                                            >
                                                                {g.label}
                                                            </button>
                                                        ))}
                                                    </div>
                                                    <input
                                                        type="text"
                                                        className="form-control form-control-sm"
                                                        placeholder="Cari ara..."
                                                        value={recSearch}
                                                        onChange={e => { setRecSearch(e.target.value); setRecPage(1); }}
                                                        style={{ width: '180px' }}
                                                    />
                                                    <button className="btn btn-sm btn-outline-success" onClick={exportReceivables} title="Tümünü Excel'e Aktar">
                                                        <i className="ri-file-excel-2-line me-1"></i>Excel ({receivables.count})
                                                    </button>
                                                </div>
                                            </div>
                                            <div className="table-responsive">
                                                <table className="table table-sm table-hover table-striped align-middle mb-0" style={{ fontSize: '0.85rem' }}>
                                                    <thead className="table-light">
                                                        <tr>
                                                            <th>#</th>
                                                            <th>Cari Kodu</th>
                                                            <th>Cari Adı</th>
                                                            <th>Grup</th>
                                                            <th className="text-end">Borç</th>
                                                            <th className="text-end">Alacak</th>
                                                            <th className="text-end">Bakiye</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {pagedReceivables.map((c, idx) => (
                                                            <tr key={idx}>
                                                                <td className="text-muted">{(recPage - 1) * PAGE_SIZE + idx + 1}</td>
                                                                <td><code>{c.cari_kodu}</code></td>
                                                                <td>{c.cari_adi}</td>
                                                                <td>
                                                                    <span className={`badge ${c.grup === 'Yurtdışı' ? 'bg-warning' : c.grup === 'Yurtiçi' ? 'bg-info' : 'bg-secondary'}`}>
                                                                        {c.grup}
                                                                    </span>
                                                                </td>
                                                                <td className="text-end">{formatMoney(c.borc)}</td>
                                                                <td className="text-end">{formatMoney(c.alacak)}</td>
                                                                <td className="text-end fw-bold text-success">{formatMoney(c.net_bakiye)}</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                    {filteredReceivables.length > 0 && (
                                                        <tfoot className="table-light">
                                                            <tr>
                                                                <td colSpan={6} className="text-end fw-bold">Toplam:</td>
                                                                <td className="text-end fw-bold text-success">{formatMoney(receivables.total)}</td>
                                                            </tr>
                                                        </tfoot>
                                                    )}
                                                </table>
                                            </div>

                                            {/* Pagination */}
                                            {recTotalPages > 1 && (
                                                <div className="d-flex justify-content-between align-items-center mt-2">
                                                    <small className="text-muted">
                                                        {filteredReceivables.length} cari{recSearch ? ` (filtre: "${recSearch}")` : ''} - Sayfa {recPage}/{recTotalPages}
                                                    </small>
                                                    <nav>
                                                        <ul className="pagination pagination-sm mb-0">
                                                            <li className={`page-item ${recPage <= 1 ? 'disabled' : ''}`}>
                                                                <button className="page-link" onClick={() => setRecPage(1)}>&laquo;</button>
                                                            </li>
                                                            <li className={`page-item ${recPage <= 1 ? 'disabled' : ''}`}>
                                                                <button className="page-link" onClick={() => setRecPage(p => Math.max(1, p - 1))}>&lsaquo;</button>
                                                            </li>
                                                            {Array.from({ length: Math.min(5, recTotalPages) }, (_, i) => {
                                                                let page: number;
                                                                if (recTotalPages <= 5) page = i + 1;
                                                                else if (recPage <= 3) page = i + 1;
                                                                else if (recPage >= recTotalPages - 2) page = recTotalPages - 4 + i;
                                                                else page = recPage - 2 + i;
                                                                return (
                                                                    <li key={page} className={`page-item ${recPage === page ? 'active' : ''}`}>
                                                                        <button className="page-link" onClick={() => setRecPage(page)}>{page}</button>
                                                                    </li>
                                                                );
                                                            })}
                                                            <li className={`page-item ${recPage >= recTotalPages ? 'disabled' : ''}`}>
                                                                <button className="page-link" onClick={() => setRecPage(p => Math.min(recTotalPages, p + 1))}>&rsaquo;</button>
                                                            </li>
                                                            <li className={`page-item ${recPage >= recTotalPages ? 'disabled' : ''}`}>
                                                                <button className="page-link" onClick={() => setRecPage(recTotalPages)}>&raquo;</button>
                                                            </li>
                                                        </ul>
                                                    </nav>
                                                </div>
                                            )}

                                            {/* Currency Breakdown */}
                                            {receivables.by_currency?.length > 1 && (
                                                <div className="mt-3 mb-3">
                                                    <h6 className="text-muted mb-2"><i className="ri-exchange-dollar-line me-1"></i>Döviz Kırılımı</h6>
                                                    <div className="d-flex flex-wrap gap-2">
                                                        {receivables.by_currency.map((cc, idx) => (
                                                            <div key={idx} className="border rounded px-3 py-2" style={{ fontSize: '0.85rem' }}>
                                                                <span className="badge bg-secondary me-1">{cc.currency}</span>
                                                                <span className="fw-bold">{formatMoney(Math.abs(cc.net_doviz), cc.currency)}</span>
                                                                <span className="text-muted ms-1">({formatMoney(cc.net_try)} TRY)</span>
                                                                <small className="text-muted ms-1">({cc.cari_sayisi} cari)</small>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Overdue Receivables */}
                                            {overdue_receivables.length > 0 && (
                                                <div className="mt-4">
                                                    <h6 className="text-danger mb-3">
                                                        <i className="ri-error-warning-line me-1"></i>
                                                        En Yüksek Bakiyeli Alacaklar (Top 30)
                                                    </h6>
                                                    <div className="table-responsive">
                                                        <table className="table table-sm table-hover align-middle mb-0" style={{ fontSize: '0.85rem' }}>
                                                            <thead className="table-danger">
                                                                <tr>
                                                                    <th>Cari Kodu</th>
                                                                    <th>Cari Adı</th>
                                                                    <th className="text-end">Bakiye</th>
                                                                    <th>Son Hareket</th>
                                                                    <th className="text-center" title="Son hareketten bu yana geçen gün sayısı">Hareketsiz</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {overdue_receivables.map((o, idx) => (
                                                                    <tr key={idx}>
                                                                        <td><code>{o.cari_kodu}</code></td>
                                                                        <td>{o.cari_adi}</td>
                                                                        <td className="text-end fw-bold">{formatMoney(o.amount)}</td>
                                                                        <td>{formatDate(o.son_hareket || '')}</td>
                                                                        <td className="text-center">
                                                                            <span className={`badge ${(o.hareketsiz_gun ?? o.gecikme_gun) > 90 ? 'bg-danger' : (o.hareketsiz_gun ?? o.gecikme_gun) > 30 ? 'bg-warning' : 'bg-info'}`}>
                                                                                {o.hareketsiz_gun ?? o.gecikme_gun} gün
                                                                            </span>
                                                                        </td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Tab: Payables */}
                                    {activeTab === 'payables' && (
                                        <div>
                                            <div className="d-flex justify-content-between align-items-center mb-3">
                                                <h6 className="mb-0">Borç Detayı <small className="text-muted">({payables.count} cari, toplam {formatMoney(payables.total)})</small></h6>
                                                <div className="d-flex gap-2 align-items-center">
                                                    <div className="btn-group" role="group">
                                                        {[
                                                            { key: 'all', label: 'Tümü' },
                                                            { key: 'Ana Hesap', label: 'Ana Hesap' },
                                                            { key: 'Yurtiçi', label: 'Yurtiçi' },
                                                            { key: 'Yurtdışı', label: 'Yurtdışı' },
                                                        ].map(g => (
                                                            <button
                                                                key={g.key}
                                                                className={`btn btn-sm ${payGroup === g.key ? 'btn-primary' : 'btn-outline-primary'}`}
                                                                onClick={() => { setPayGroup(g.key); setPayPage(1); }}
                                                            >
                                                                {g.label}
                                                            </button>
                                                        ))}
                                                    </div>
                                                    <input
                                                        type="text"
                                                        className="form-control form-control-sm"
                                                        placeholder="Cari ara..."
                                                        value={paySearch}
                                                        onChange={e => { setPaySearch(e.target.value); setPayPage(1); }}
                                                        style={{ width: '180px' }}
                                                    />
                                                    <button className="btn btn-sm btn-outline-success" onClick={exportPayables} title="Tümünü Excel'e Aktar">
                                                        <i className="ri-file-excel-2-line me-1"></i>Excel ({payables.count})
                                                    </button>
                                                </div>
                                            </div>
                                            <div className="table-responsive">
                                                <table className="table table-sm table-hover table-striped align-middle mb-0" style={{ fontSize: '0.85rem' }}>
                                                    <thead className="table-light">
                                                        <tr>
                                                            <th>#</th>
                                                            <th>Cari Kodu</th>
                                                            <th>Cari Adı</th>
                                                            <th>Grup</th>
                                                            <th className="text-end">Borç</th>
                                                            <th className="text-end">Alacak</th>
                                                            <th className="text-end">Bakiye</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {pagedPayables.map((c, idx) => (
                                                            <tr key={idx}>
                                                                <td className="text-muted">{(payPage - 1) * PAGE_SIZE + idx + 1}</td>
                                                                <td><code>{c.cari_kodu}</code></td>
                                                                <td>{c.cari_adi}</td>
                                                                <td>
                                                                    <span className={`badge ${c.grup === 'Yurtdışı' ? 'bg-warning' : c.grup === 'Yurtiçi' ? 'bg-info' : 'bg-secondary'}`}>
                                                                        {c.grup}
                                                                    </span>
                                                                </td>
                                                                <td className="text-end">{formatMoney(c.borc)}</td>
                                                                <td className="text-end">{formatMoney(c.alacak)}</td>
                                                                <td className="text-end fw-bold text-danger">{formatMoney(Math.abs(c.net_bakiye))}</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                    {filteredPayables.length > 0 && (
                                                        <tfoot className="table-light">
                                                            <tr>
                                                                <td colSpan={6} className="text-end fw-bold">Toplam:</td>
                                                                <td className="text-end fw-bold text-danger">{formatMoney(payables.total)}</td>
                                                            </tr>
                                                        </tfoot>
                                                    )}
                                                </table>
                                            </div>

                                            {/* Pagination */}
                                            {payTotalPages > 1 && (
                                                <div className="d-flex justify-content-between align-items-center mt-2">
                                                    <small className="text-muted">
                                                        {filteredPayables.length} cari{paySearch ? ` (filtre: "${paySearch}")` : ''} - Sayfa {payPage}/{payTotalPages}
                                                    </small>
                                                    <nav>
                                                        <ul className="pagination pagination-sm mb-0">
                                                            <li className={`page-item ${payPage <= 1 ? 'disabled' : ''}`}>
                                                                <button className="page-link" onClick={() => setPayPage(1)}>&laquo;</button>
                                                            </li>
                                                            <li className={`page-item ${payPage <= 1 ? 'disabled' : ''}`}>
                                                                <button className="page-link" onClick={() => setPayPage(p => Math.max(1, p - 1))}>&lsaquo;</button>
                                                            </li>
                                                            {Array.from({ length: Math.min(5, payTotalPages) }, (_, i) => {
                                                                let page: number;
                                                                if (payTotalPages <= 5) page = i + 1;
                                                                else if (payPage <= 3) page = i + 1;
                                                                else if (payPage >= payTotalPages - 2) page = payTotalPages - 4 + i;
                                                                else page = payPage - 2 + i;
                                                                return (
                                                                    <li key={page} className={`page-item ${payPage === page ? 'active' : ''}`}>
                                                                        <button className="page-link" onClick={() => setPayPage(page)}>{page}</button>
                                                                    </li>
                                                                );
                                                            })}
                                                            <li className={`page-item ${payPage >= payTotalPages ? 'disabled' : ''}`}>
                                                                <button className="page-link" onClick={() => setPayPage(p => Math.min(payTotalPages, p + 1))}>&rsaquo;</button>
                                                            </li>
                                                            <li className={`page-item ${payPage >= payTotalPages ? 'disabled' : ''}`}>
                                                                <button className="page-link" onClick={() => setPayPage(payTotalPages)}>&raquo;</button>
                                                            </li>
                                                        </ul>
                                                    </nav>
                                                </div>
                                            )}

                                            {/* Currency Breakdown */}
                                            {payables.by_currency?.length > 1 && (
                                                <div className="mt-3 mb-3">
                                                    <h6 className="text-muted mb-2"><i className="ri-exchange-dollar-line me-1"></i>Döviz Kırılımı</h6>
                                                    <div className="d-flex flex-wrap gap-2">
                                                        {payables.by_currency.map((cc, idx) => (
                                                            <div key={idx} className="border rounded px-3 py-2" style={{ fontSize: '0.85rem' }}>
                                                                <span className="badge bg-secondary me-1">{cc.currency}</span>
                                                                <span className="fw-bold">{formatMoney(Math.abs(cc.net_doviz), cc.currency)}</span>
                                                                <span className="text-muted ms-1">({formatMoney(cc.net_try)} TRY)</span>
                                                                <small className="text-muted ms-1">({cc.cari_sayisi} cari)</small>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Overdue Payables */}
                                            {overdue_payables.length > 0 && (
                                                <div className="mt-4">
                                                    <h6 className="text-warning mb-3">
                                                        <i className="ri-error-warning-line me-1"></i>
                                                        En Yüksek Bakiyeli Borçlar (Top 30)
                                                    </h6>
                                                    <div className="table-responsive">
                                                        <table className="table table-sm table-hover align-middle mb-0" style={{ fontSize: '0.85rem' }}>
                                                            <thead className="table-warning">
                                                                <tr>
                                                                    <th>Cari Kodu</th>
                                                                    <th>Cari Adı</th>
                                                                    <th className="text-end">Bakiye</th>
                                                                    <th>Son Hareket</th>
                                                                    <th className="text-center" title="Son hareketten bu yana geçen gün sayısı">Hareketsiz</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {overdue_payables.map((o, idx) => (
                                                                    <tr key={idx}>
                                                                        <td><code>{o.cari_kodu}</code></td>
                                                                        <td>{o.cari_adi}</td>
                                                                        <td className="text-end fw-bold">{formatMoney(o.amount)}</td>
                                                                        <td>{formatDate(o.son_hareket || '')}</td>
                                                                        <td className="text-center">
                                                                            <span className={`badge ${(o.hareketsiz_gun ?? o.gecikme_gun) > 90 ? 'bg-danger' : (o.hareketsiz_gun ?? o.gecikme_gun) > 30 ? 'bg-warning' : 'bg-info'}`}>
                                                                                {o.hareketsiz_gun ?? o.gecikme_gun} gün
                                                                            </span>
                                                                        </td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Tab: Checks */}
                                    {activeTab === 'checks' && (
                                        <div>
                                            {/* Received Checks */}
                                            <div className="d-flex justify-content-between align-items-center mb-3">
                                                <h6 className="mb-0">
                                                    <i className="ri-arrow-down-circle-line text-success me-1"></i>
                                                    Alınan Çekler
                                                    <span className="badge bg-success ms-2">{checks_receivable.length} adet - {formatMoney(summary.total_checks_receivable)}</span>
                                                </h6>
                                                <button className="btn btn-sm btn-outline-success" onClick={exportChecksReceivable} title="Excel'e Aktar">
                                                    <i className="ri-file-excel-2-line me-1"></i>Excel
                                                </button>
                                            </div>
                                            <div className="table-responsive mb-4">
                                                <table className="table table-sm table-hover table-striped align-middle mb-0" style={{ fontSize: '0.85rem' }}>
                                                    <thead className="table-light">
                                                        <tr>
                                                            <th>Portföy No</th>
                                                            <th>Cari</th>
                                                            <th>Banka</th>
                                                            <th className="text-end">Tutar</th>
                                                            <th>Vade</th>
                                                            <th className="text-center">Vadeye Kalan</th>
                                                            <th>Durum</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {checks_receivable.map((c, idx) => {
                                                            const badge = getDueBadge(c.vadeye_kalan_gun);
                                                            return (
                                                                <tr key={idx} className={c.vadesi_gecmis ? 'table-danger' : ''}>
                                                                    <td><code>{c.portfoy_no}</code></td>
                                                                    <td className="text-truncate" style={{ maxWidth: '200px' }} title={c.cari_adi}>{c.cari_adi}</td>
                                                                    <td>{c.banka}</td>
                                                                    <td className="text-end fw-bold">{formatMoney(c.amount, c.currency)}</td>
                                                                    <td>{formatDate(c.vade_tarihi)}</td>
                                                                    <td className="text-center">
                                                                        <span className={`badge ${badge.class}`}>{badge.text}</span>
                                                                    </td>
                                                                    <td>
                                                                        <span className={`badge ${c.durum === 'Portfoyde' ? 'bg-primary' : 'bg-secondary'}`}>
                                                                            {c.durum}
                                                                        </span>
                                                                    </td>
                                                                </tr>
                                                            );
                                                        })}
                                                        {checks_receivable.length === 0 && (
                                                            <tr><td colSpan={7} className="text-center text-muted py-3">Alınan çek bulunamadı</td></tr>
                                                        )}
                                                    </tbody>
                                                </table>
                                            </div>

                                            {/* Given Checks/Notes */}
                                            <div className="d-flex justify-content-between align-items-center mb-3">
                                                <h6 className="mb-0">
                                                    <i className="ri-arrow-up-circle-line text-danger me-1"></i>
                                                    Verilen Çek/Senetler
                                                    <span className="badge bg-danger ms-2">{checks_payable.length} adet - {formatMoney(summary.total_checks_payable)}</span>
                                                </h6>
                                                <button className="btn btn-sm btn-outline-success" onClick={exportChecksPayable} title="Excel'e Aktar">
                                                    <i className="ri-file-excel-2-line me-1"></i>Excel
                                                </button>
                                            </div>
                                            <div className="table-responsive">
                                                <table className="table table-sm table-hover table-striped align-middle mb-0" style={{ fontSize: '0.85rem' }}>
                                                    <thead className="table-light">
                                                        <tr>
                                                            <th>Portföy No</th>
                                                            <th>Tip</th>
                                                            <th>Cari</th>
                                                            <th className="text-end">Tutar</th>
                                                            <th>Vade</th>
                                                            <th className="text-center">Vadeye Kalan</th>
                                                            <th>Durum</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {checks_payable.map((c, idx) => {
                                                            const badge = getDueBadge(c.vadeye_kalan_gun);
                                                            return (
                                                                <tr key={idx} className={c.vadesi_gecmis ? 'table-danger' : ''}>
                                                                    <td><code>{c.portfoy_no}</code></td>
                                                                    <td><span className="badge bg-secondary">{c.tip}</span></td>
                                                                    <td className="text-truncate" style={{ maxWidth: '200px' }} title={c.cari_adi}>{c.cari_adi}</td>
                                                                    <td className="text-end fw-bold">{formatMoney(c.amount, c.currency)}</td>
                                                                    <td>{formatDate(c.vade_tarihi)}</td>
                                                                    <td className="text-center">
                                                                        <span className={`badge ${badge.class}`}>{badge.text}</span>
                                                                    </td>
                                                                    <td>
                                                                        <span className={`badge ${c.durum === 'Portfoyde' ? 'bg-primary' : 'bg-secondary'}`}>
                                                                            {c.durum}
                                                                        </span>
                                                                    </td>
                                                                </tr>
                                                            );
                                                        })}
                                                        {checks_payable.length === 0 && (
                                                            <tr><td colSpan={7} className="text-center text-muted py-3">Verilen çek/senet bulunamadı</td></tr>
                                                        )}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    )}

                                    {/* Tab: Bank & Cash */}
                                    {activeTab === 'bank' && (
                                        <div>
                                            {/* Bank Accounts */}
                                            <div className="d-flex justify-content-between align-items-center mb-3">
                                                <h6 className="mb-0">
                                                    <i className="ri-bank-line text-primary me-1"></i>
                                                    Banka Hesapları
                                                </h6>
                                                <button className="btn btn-sm btn-outline-success" onClick={exportBankBalances} title="Excel'e Aktar">
                                                    <i className="ri-file-excel-2-line me-1"></i>Excel
                                                </button>
                                            </div>
                                            <div className="table-responsive mb-4">
                                                <table className="table table-sm table-hover table-striped align-middle mb-0" style={{ fontSize: '0.85rem' }}>
                                                    <thead className="table-light">
                                                        <tr>
                                                            <th>Hesap Kodu</th>
                                                            <th>Hesap Adı</th>
                                                            <th>Şube</th>
                                                            <th>Döviz</th>
                                                            <th className="text-end">Giriş (TRY)</th>
                                                            <th className="text-end">Çıkış (TRY)</th>
                                                            <th className="text-end">Bakiye (TRY)</th>
                                                            <th className="text-end">Döviz Bakiye</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {bank_balances.map((b, idx) => (
                                                            <tr key={idx}>
                                                                <td><code>{b.account_code}</code></td>
                                                                <td>{b.account_name}</td>
                                                                <td>{b.branch}</td>
                                                                <td><span className="badge bg-secondary">{b.currency}</span></td>
                                                                <td className="text-end text-success">{formatMoney(b.total_in)}</td>
                                                                <td className="text-end text-danger">{formatMoney(b.total_out)}</td>
                                                                <td className={`text-end fw-bold ${b.amount >= 0 ? 'text-success' : 'text-danger'}`}>
                                                                    {formatMoney(b.amount)}
                                                                </td>
                                                                <td className="text-end">
                                                                    {b.amount_foreign != null ? (
                                                                        <span className={b.amount_foreign >= 0 ? 'text-success' : 'text-danger'}>
                                                                            {formatMoney(b.amount_foreign, b.currency)}
                                                                        </span>
                                                                    ) : (
                                                                        <span className="text-muted">-</span>
                                                                    )}
                                                                </td>
                                                            </tr>
                                                        ))}
                                                        {bank_balances.length === 0 && (
                                                            <tr><td colSpan={8} className="text-center text-muted py-3">Banka hesabı bulunamadı</td></tr>
                                                        )}
                                                    </tbody>
                                                    {bank_balances.length > 0 && (
                                                        <tfoot className="table-light">
                                                            <tr>
                                                                <td colSpan={6} className="text-end fw-bold">Toplam (TRY):</td>
                                                                <td className="text-end fw-bold text-success">{formatMoney(summary.total_bank)}</td>
                                                                <td></td>
                                                            </tr>
                                                        </tfoot>
                                                    )}
                                                </table>
                                            </div>

                                            {/* Cash Accounts */}
                                            <h6 className="mb-3">
                                                <i className="ri-safe-2-line text-warning me-1"></i>
                                                Kasa Bakiyeleri
                                            </h6>
                                            <div className="table-responsive">
                                                <table className="table table-sm table-hover table-striped align-middle mb-0" style={{ fontSize: '0.85rem' }}>
                                                    <thead className="table-light">
                                                        <tr>
                                                            <th>Döviz</th>
                                                            <th>Hesap Sayısı</th>
                                                            <th className="text-end">Bakiye</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {cash_balances.map((c, idx) => (
                                                            <tr key={idx}>
                                                                <td><span className="badge bg-secondary">{c.currency}</span></td>
                                                                <td>{c.account_count}</td>
                                                                <td className={`text-end fw-bold ${c.amount >= 0 ? 'text-success' : 'text-danger'}`}>
                                                                    {formatMoney(c.amount, c.currency)}
                                                                </td>
                                                            </tr>
                                                        ))}
                                                        {cash_balances.length === 0 && (
                                                            <tr><td colSpan={3} className="text-center text-muted py-3">Kasa hesabı bulunamadı</td></tr>
                                                        )}
                                                    </tbody>
                                                    {cash_balances.length > 0 && (
                                                        <tfoot className="table-light">
                                                            <tr>
                                                                <td colSpan={2} className="text-end fw-bold">Toplam:</td>
                                                                <td className="text-end fw-bold text-success">{formatMoney(summary.total_kasa)}</td>
                                                            </tr>
                                                        </tfoot>
                                                    )}
                                                </table>
                                            </div>
                                        </div>
                                    )}


                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </React.Fragment>
    );
}

(Index as any).layout = (page: any) => <Layout>{page}</Layout>;
