import React, { useState } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import Layout from '../../../Layouts';
import { ExpenseStats } from '@/types/expense';

interface ExpenseTrend {
    date: string;
    amount: number;
    count: number;
}

interface CategoryAnalysis {
    category_id: number;
    category_name: string;
    count: number;
    total_amount: number;
    avg_amount: number;
    percentage: number;
}

interface StatusAnalysis {
    status: string;
    count: number;
    total_amount: number;
    percentage: number;
}

interface EmployeeAnalysis {
    employee_id: number;
    employee_name: string;
    count: number;
    total_amount: number;
}

interface CurrencyAnalysis {
    currency: string;
    count: number;
    total_amount: number;
    avg_exchange_rate: number;
}

interface PageProps {
    period: string;
    stats: ExpenseStats;
    trends: ExpenseTrend[];
    categoryAnalysis: CategoryAnalysis[];
    statusAnalysis: StatusAnalysis[];
    employeeAnalysis: EmployeeAnalysis[];
    currencyAnalysis: CurrencyAnalysis[];
    monthlyComparison: {
        current_month: number;
        previous_month: number;
        growth_rate: number;
    };
}

export default function Analytics() {
    const { 
        period = '30', 
        stats = {} as ExpenseStats, 
        trends = [], 
        categoryAnalysis = [], 
        statusAnalysis = [], 
        employeeAnalysis = [], 
        currencyAnalysis = [],
        monthlyComparison = { current_month: 0, previous_month: 0, growth_rate: 0 }
    } = usePage<PageProps>().props;
    
    const [selectedPeriod, setSelectedPeriod] = useState(period);

    const handlePeriodChange = (newPeriod: string) => {
        setSelectedPeriod(newPeriod);
        router.get(route('accounting.expenses.analytics'), { period: newPeriod });
    };

    const formatCurrency = (amount: number, currency: string = 'TRY') => {
        return new Intl.NumberFormat('tr-TR', {
            style: 'currency',
            currency: currency,
        }).format(amount);
    };

    const formatNumber = (number: number) => {
        return new Intl.NumberFormat('tr-TR').format(number);
    };

    const getStatusText = (status: string) => {
        const statuses: Record<string, string> = {
            'draft': 'Taslak',
            'pending': 'Bekleyen',
            'approved': 'Onaylandı',
            'paid': 'Ödendi',
            'cancelled': 'İptal',
        };
        return statuses[status] || status;
    };

    const getStatusBadgeColor = (status: string) => {
        const colors: Record<string, string> = {
            'draft': 'secondary',
            'pending': 'warning',
            'approved': 'success',
            'paid': 'primary',
            'cancelled': 'danger',
        };
        return colors[status] || 'secondary';
    };

    return (
        <Layout>
            <Head title="Gider Analitikleri" />
            <div className="page-content">
            <div className="container-fluid">
                <div className="row">
                    <div className="col-12">
                        <div className="page-title-box d-sm-flex align-items-center justify-content-between">
                            <h4 className="mb-sm-0">Gider Analitikleri</h4>
                            <div className="page-title-right">
                                <ol className="breadcrumb m-0">
                                    <li className="breadcrumb-item">
                                        <Link href={route('dashboard')}>Dashboard</Link>
                                    </li>
                                    <li className="breadcrumb-item">
                                        <Link href={route('accounting.expenses.index')}>Giderler</Link>
                                    </li>
                                    <li className="breadcrumb-item active">Analitikler</li>
                                </ol>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Period Selection */}
                <div className="row mb-4">
                    <div className="col-xl-3 col-md-6">
                        <div className="card">
                            <div className="card-body">
                                <label className="form-label">Analiz Dönemi:</label>
                                <select
                                    className="form-select"
                                    value={selectedPeriod}
                                    onChange={(e) => handlePeriodChange(e.target.value)}
                                >
                                    <option value="7">Son 7 Gün</option>
                                    <option value="30">Son 30 Gün</option>
                                    <option value="90">Son 90 Gün</option>
                                    <option value="365">Son 1 Yıl</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="row mb-4">
                    <div className="col-xl-3 col-md-6">
                        <div className="card mini-stats-wid">
                            <div className="card-body">
                                <div className="d-flex">
                                    <div className="flex-grow-1">
                                        <p className="text-muted fw-medium">Toplam Gider</p>
                                        <h4 className="mb-0">{formatNumber(stats.total_expenses || 0)}</h4>
                                    </div>
                                    <div className="flex-shrink-0 align-self-center">
                                        <div className="mini-stat-icon avatar-sm rounded-circle bg-primary">
                                            <span className="avatar-title">
                                                <i className="fas fa-receipt text-white font-size-16"></i>
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="col-xl-3 col-md-6">
                        <div className="card mini-stats-wid">
                            <div className="card-body">
                                <div className="d-flex">
                                    <div className="flex-grow-1">
                                        <p className="text-muted fw-medium">Bu Ay Tutarı</p>
                                        <h4 className="mb-0">{formatCurrency(stats.current_month_amount || 0)}</h4>
                                    </div>
                                    <div className="flex-shrink-0 align-self-center">
                                        <div className="mini-stat-icon avatar-sm rounded-circle bg-success">
                                            <span className="avatar-title">
                                                <i className="fas fa-chart-line text-white font-size-16"></i>
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="col-xl-3 col-md-6">
                        <div className="card mini-stats-wid">
                            <div className="card-body">
                                <div className="d-flex">
                                    <div className="flex-grow-1">
                                        <p className="text-muted fw-medium">Bekleyen Ödemeler</p>
                                        <h4 className="mb-0">{formatCurrency(stats.pending_amount_try || 0)}</h4>
                                    </div>
                                    <div className="flex-shrink-0 align-self-center">
                                        <div className="mini-stat-icon avatar-sm rounded-circle bg-warning">
                                            <span className="avatar-title">
                                                <i className="fas fa-clock text-white font-size-16"></i>
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="col-xl-3 col-md-6">
                        <div className="card mini-stats-wid">
                            <div className="card-body">
                                <div className="d-flex">
                                    <div className="flex-grow-1">
                                        <p className="text-muted fw-medium">Vadesi Geçen</p>
                                        <h4 className="mb-0">{formatCurrency(stats.overdue_amount || 0)}</h4>
                                    </div>
                                    <div className="flex-shrink-0 align-self-center">
                                        <div className="mini-stat-icon avatar-sm rounded-circle bg-danger">
                                            <span className="avatar-title">
                                                <i className="fas fa-exclamation-triangle text-white font-size-16"></i>
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="row">
                    {/* Expense Trends Chart Placeholder */}
                    <div className="col-lg-8">
                        <div className="card mb-4">
                            <div className="card-header">
                                <h5 className="card-title mb-0">
                                    <i className="fas fa-chart-line me-2"></i>
                                    Gider Trendleri
                                </h5>
                            </div>
                            <div className="card-body">
                                <div className="text-center py-4">
                                    <i className="fas fa-chart-line fa-3x text-muted mb-3"></i>
                                    <p className="text-muted">
                                        Gider trendleri grafiği burada gösterilecek
                                        <br />
                                        <small>Chart.js veya başka bir grafik kütüphanesi ile entegre edilebilir</small>
                                    </p>

                                    {/* Simple text-based data display */}
                                    <div className="mt-4">
                                        <h6>Günlük Gider Verileri (Son {selectedPeriod} Gün)</h6>
                                        <div className="row">
                                            <div className="col-md-4">
                                                <div className="border rounded p-3 mb-2">
                                                    <div className="fw-bold text-primary">
                                                        {formatNumber(trends.reduce((sum, t) => sum + t.count, 0))}
                                                    </div>
                                                    <small className="text-muted">Toplam Gider Sayısı</small>
                                                </div>
                                            </div>
                                            <div className="col-md-4">
                                                <div className="border rounded p-3 mb-2">
                                                    <div className="fw-bold text-success">
                                                        {formatCurrency(trends.reduce((sum, t) => sum + t.amount, 0))}
                                                    </div>
                                                    <small className="text-muted">Toplam Tutar</small>
                                                </div>
                                            </div>
                                            <div className="col-md-4">
                                                <div className="border rounded p-3 mb-2">
                                                    <div className="fw-bold text-info">
                                                        {trends.length > 0 ? formatCurrency(trends.reduce((sum, t) => sum + t.amount, 0) / trends.length) : formatCurrency(0)}
                                                    </div>
                                                    <small className="text-muted">Günlük Ortalama</small>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Status Distribution */}
                    <div className="col-lg-4">
                        <div className="card mb-4">
                            <div className="card-header">
                                <h6 className="card-title mb-0">Durum Dağılımı</h6>
                            </div>
                            <div className="card-body">
                                {statusAnalysis.map((item, index) => (
                                    <div key={index} className="d-flex justify-content-between align-items-center mb-3">
                                        <div>
                                            <span className={`badge bg-${getStatusBadgeColor(item.status)} me-2`}>
                                                {getStatusText(item.status)}
                                            </span>
                                            <small className="text-muted">({item.percentage.toFixed(1)}%)</small>
                                        </div>
                                        <div className="text-end">
                                            <div className="fw-bold">{formatNumber(item.count)}</div>
                                            <small className="text-muted">{formatCurrency(item.total_amount)}</small>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Category Analysis */}
                <div className="row mb-4">
                    <div className="col-12">
                        <div className="card">
                            <div className="card-header">
                                <h6 className="card-title mb-0">Kategori Analizi</h6>
                            </div>
                            <div className="card-body">
                                <div className="table-responsive">
                                    <table className="table table-hover">
                                        <thead>
                                            <tr>
                                                <th>Kategori</th>
                                                <th>Gider Sayısı</th>
                                                <th>Toplam Tutar</th>
                                                <th>Ortalama Tutar</th>
                                                <th>Yüzde</th>
                                                <th>Grafik</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {categoryAnalysis.map((item, index) => (
                                                <tr key={index}>
                                                    <td className="fw-medium">{item.category_name}</td>
                                                    <td>{formatNumber(item.count)}</td>
                                                    <td>{formatCurrency(item.total_amount)}</td>
                                                    <td>{formatCurrency(item.avg_amount)}</td>
                                                    <td>
                                                        <span className="badge bg-primary">{item.percentage.toFixed(1)}%</span>
                                                    </td>
                                                    <td>
                                                        <div className="progress" style={{ height: '6px' }}>
                                                            <div
                                                                className="progress-bar bg-primary"
                                                                style={{ width: `${item.percentage}%` }}
                                                            ></div>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="row">
                    {/* Employee Analysis */}
                    <div className="col-lg-6">
                        <div className="card">
                            <div className="card-header">
                                <h6 className="card-title mb-0">Çalışan Bazında Analiz</h6>
                            </div>
                            <div className="card-body">
                                <div className="table-responsive">
                                    <table className="table table-sm">
                                        <thead>
                                            <tr>
                                                <th>Çalışan</th>
                                                <th>Gider Sayısı</th>
                                                <th>Toplam Tutar</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {employeeAnalysis.slice(0, 10).map((item, index) => (
                                                <tr key={index}>
                                                    <td>{item.employee_name}</td>
                                                    <td>{formatNumber(item.count)}</td>
                                                    <td>{formatCurrency(item.total_amount)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Currency Analysis */}
                    <div className="col-lg-6">
                        <div className="card">
                            <div className="card-header">
                                <h6 className="card-title mb-0">Para Birimi Analizi</h6>
                            </div>
                            <div className="card-body">
                                <div className="table-responsive">
                                    <table className="table table-sm">
                                        <thead>
                                            <tr>
                                                <th>Para Birimi</th>
                                                <th>Gider Sayısı</th>
                                                <th>Toplam Tutar</th>
                                                <th>Ort. Kur</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {currencyAnalysis.map((item, index) => (
                                                <tr key={index}>
                                                    <td>
                                                        <span className="badge bg-secondary">{item.currency}</span>
                                                    </td>
                                                    <td>{formatNumber(item.count)}</td>
                                                    <td>{formatCurrency(item.total_amount, item.currency)}</td>
                                                    <td>{item.avg_exchange_rate.toFixed(4)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            </div>
        </Layout>
    );
}