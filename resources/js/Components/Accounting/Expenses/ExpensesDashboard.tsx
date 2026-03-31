import React from 'react';
import { ExpenseStats } from '@/types/expense';

interface Props {
    stats: ExpenseStats;
    charts: {
        categoryDistribution: any[];
        statusDistribution: any;
        monthlyData: any[];
    };
}

export default function ExpensesDashboard({ stats, charts }: Props) {
    const formatCurrency = (amount: number, currency: string = 'TRY') => {
        return new Intl.NumberFormat('tr-TR', {
            style: 'currency',
            currency: currency,
            minimumFractionDigits: 2
        }).format(amount);
    };

    const formatNumber = (number: number) => {
        return new Intl.NumberFormat('tr-TR').format(number);
    };

    const getGrowthIcon = (rate: number) => {
        if (rate > 0) return 'fas fa-arrow-up text-success';
        if (rate < 0) return 'fas fa-arrow-down text-danger';
        return 'fas fa-minus text-muted';
    };

    return (
        <div className="row mb-4">
            {/* Summary Cards */}
            <div className="col-xl-3 col-lg-6 col-md-6 mb-3">
                <div className="card border-0 shadow-sm h-100">
                    <div className="card-body">
                        <div className="d-flex align-items-center">
                            <div className="flex-shrink-0">
                                <div className="bg-primary bg-opacity-10 rounded-3 p-3">
                                    <i className="fas fa-receipt text-primary fs-4"></i>
                                </div>
                            </div>
                            <div className="flex-grow-1 ms-3">
                                <div className="text-muted small">Bu Ay Toplam Gider</div>
                                <div className="fs-5 fw-bold">{formatCurrency(stats.current_month_amount)}</div>
                                <div className="d-flex align-items-center text-sm">
                                    <i className={getGrowthIcon(stats.monthly_growth_rate) + ' me-1'}></i>
                                    <span className={stats.monthly_growth_rate >= 0 ? 'text-success' : 'text-danger'}>
                                        %{Math.abs(stats.monthly_growth_rate).toFixed(1)}
                                    </span>
                                    <span className="text-muted ms-1">geçen aya göre</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="col-xl-3 col-lg-6 col-md-6 mb-3">
                <div className="card border-0 shadow-sm h-100">
                    <div className="card-body">
                        <div className="d-flex align-items-center">
                            <div className="flex-shrink-0">
                                <div className="bg-warning bg-opacity-10 rounded-3 p-3">
                                    <i className="fas fa-clock text-warning fs-4"></i>
                                </div>
                            </div>
                            <div className="flex-grow-1 ms-3">
                                <div className="text-muted small">Bekleyen Onaylar</div>
                                <div className="fs-5 fw-bold">{formatNumber(stats.pending_expenses)}</div>
                                <div className="text-muted small">
                                    {formatCurrency(stats.pending_amount_try)} değerinde
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="col-xl-3 col-lg-6 col-md-6 mb-3">
                <div className="card border-0 shadow-sm h-100">
                    <div className="card-body">
                        <div className="d-flex align-items-center">
                            <div className="flex-shrink-0">
                                <div className="bg-danger bg-opacity-10 rounded-3 p-3">
                                    <i className="fas fa-exclamation-triangle text-danger fs-4"></i>
                                </div>
                            </div>
                            <div className="flex-grow-1 ms-3">
                                <div className="text-muted small">Vadesi Geçen</div>
                                <div className="fs-5 fw-bold">{formatNumber(stats.overdue_expenses)}</div>
                                <div className="text-muted small">
                                    {formatCurrency(stats.overdue_amount)} değerinde
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="col-xl-3 col-lg-6 col-md-6 mb-3">
                <div className="card border-0 shadow-sm h-100">
                    <div className="card-body">
                        <div className="d-flex align-items-center">
                            <div className="flex-shrink-0">
                                <div className="bg-success bg-opacity-10 rounded-3 p-3">
                                    <i className="fas fa-check-circle text-success fs-4"></i>
                                </div>
                            </div>
                            <div className="flex-grow-1 ms-3">
                                <div className="text-muted small">Ödenmiş Giderler</div>
                                <div className="fs-5 fw-bold">{formatNumber(stats.paid_expenses)}</div>
                                <div className="text-muted small">
                                    Toplam {formatNumber(stats.total_expenses)} giderden
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Status Distribution */}
            <div className="col-xl-4 col-lg-6 mb-3">
                <div className="card border-0 shadow-sm h-100">
                    <div className="card-header bg-transparent border-0 pb-0">
                        <h6 className="card-title mb-0">Durum Dağılımı</h6>
                    </div>
                    <div className="card-body pt-2">
                        <div className="row g-2">
                            <div className="col-6">
                                <div className="text-center p-2">
                                    <div className="text-muted small">Taslak</div>
                                    <div className="fw-bold text-secondary">{formatNumber(stats.draft_expenses)}</div>
                                </div>
                            </div>
                            <div className="col-6">
                                <div className="text-center p-2">
                                    <div className="text-muted small">Beklemede</div>
                                    <div className="fw-bold text-warning">{formatNumber(stats.pending_expenses)}</div>
                                </div>
                            </div>
                            <div className="col-6">
                                <div className="text-center p-2">
                                    <div className="text-muted small">Onaylandı</div>
                                    <div className="fw-bold text-info">{formatNumber(stats.approved_expenses)}</div>
                                </div>
                            </div>
                            <div className="col-6">
                                <div className="text-center p-2">
                                    <div className="text-muted small">Ödendi</div>
                                    <div className="fw-bold text-success">{formatNumber(stats.paid_expenses)}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Currency Distribution */}
            <div className="col-xl-4 col-lg-6 mb-3">
                <div className="card border-0 shadow-sm h-100">
                    <div className="card-header bg-transparent border-0 pb-0">
                        <h6 className="card-title mb-0">Para Birimi Dağılımı</h6>
                    </div>
                    <div className="card-body pt-2">
                        <div className="row g-2">
                            <div className="col-12 mb-2">
                                <div className="d-flex justify-content-between align-items-center">
                                    <span className="text-muted">TRY</span>
                                    <span className="fw-bold">{formatCurrency(stats.total_amount_try, 'TRY')}</span>
                                </div>
                            </div>
                            <div className="col-12 mb-2">
                                <div className="d-flex justify-content-between align-items-center">
                                    <span className="text-muted">USD</span>
                                    <span className="fw-bold">{formatCurrency(stats.total_amount_usd, 'USD')}</span>
                                </div>
                            </div>
                            <div className="col-12 mb-2">
                                <div className="d-flex justify-content-between align-items-center">
                                    <span className="text-muted">EUR</span>
                                    <span className="fw-bold">{formatCurrency(stats.total_amount_eur, 'EUR')}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Category Distribution */}
            <div className="col-xl-4 col-lg-12 mb-3">
                <div className="card border-0 shadow-sm h-100">
                    <div className="card-header bg-transparent border-0 pb-0">
                        <h6 className="card-title mb-0">Kategori Dağılımı</h6>
                    </div>
                    <div className="card-body pt-2">
                        <div className="row g-1">
                            {charts.categoryDistribution.slice(0, 6).map((item, index) => (
                                <div key={index} className="col-12 mb-2">
                                    <div className="d-flex justify-content-between align-items-center">
                                        <div className="d-flex align-items-center">
                                            <div 
                                                className="rounded-circle me-2"
                                                style={{ 
                                                    width: '8px', 
                                                    height: '8px', 
                                                    backgroundColor: item.color 
                                                }}
                                            ></div>
                                            <small className="text-muted">{item.category}</small>
                                        </div>
                                        <small className="fw-bold">
                                            {formatCurrency(item.total_amount)}
                                        </small>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="col-12">
                <div className="card border-0 shadow-sm">
                    <div className="card-body">
                        <div className="row text-center">
                            <div className="col-md-3 col-6 mb-2">
                                <a href="/accounting/expenses/create" className="text-decoration-none">
                                    <div className="p-3 rounded bg-primary bg-opacity-10">
                                        <i className="fas fa-plus text-primary fs-4 mb-2"></i>
                                        <div className="fw-medium text-primary">Yeni Gider</div>
                                    </div>
                                </a>
                            </div>
                            <div className="col-md-3 col-6 mb-2">
                                <a href="/accounting/expenses/analytics" className="text-decoration-none">
                                    <div className="p-3 rounded bg-info bg-opacity-10">
                                        <i className="fas fa-chart-bar text-info fs-4 mb-2"></i>
                                        <div className="fw-medium text-info">Analitik</div>
                                    </div>
                                </a>
                            </div>
                            <div className="col-md-3 col-6 mb-2">
                                <a href="/accounting/expenses?status=pending" className="text-decoration-none">
                                    <div className="p-3 rounded bg-warning bg-opacity-10">
                                        <i className="fas fa-clock text-warning fs-4 mb-2"></i>
                                        <div className="fw-medium text-warning">Bekleyen Onaylar</div>
                                    </div>
                                </a>
                            </div>
                            <div className="col-md-3 col-6 mb-2">
                                <a href="/accounting/expenses?is_overdue=1" className="text-decoration-none">
                                    <div className="p-3 rounded bg-danger bg-opacity-10">
                                        <i className="fas fa-exclamation-triangle text-danger fs-4 mb-2"></i>
                                        <div className="fw-medium text-danger">Vadesi Geçenler</div>
                                    </div>
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}