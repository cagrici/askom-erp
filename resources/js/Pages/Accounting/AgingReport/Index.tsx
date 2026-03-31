import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import Layout from '../../../Layouts';

interface Account {
    id: number;
    title: string;
    account_type: string;
}

interface AgingData {
    account_id: number;
    account_code: string;
    account_name: string;
    account_type: string;
    total: number;
    current: number;
    period_1: number;
    period_2: number;
    period_3: number;
    over_120: number;
}

interface Summary {
    total_accounts: number;
    total_amount: number;
    current: number;
    period_1: number;
    period_2: number;
    period_3: number;
    over_120: number;
    current_percent: number;
    period_1_percent: number;
    period_2_percent: number;
    period_3_percent: number;
    over_120_percent: number;
}

interface Filters {
    type: string;
    as_of_date: string;
    account_type?: string;
    account_id?: number;
}

interface Props {
    agingData: AgingData[];
    summary: Summary;
    accounts: Account[];
    filters: Filters;
}

export default function Index({ agingData, summary, accounts, filters }: Props) {
    const [reportType, setReportType] = useState(filters.type);
    const [asOfDate, setAsOfDate] = useState(filters.as_of_date);
    const [accountType, setAccountType] = useState(filters.account_type || '');
    const [selectedAccount, setSelectedAccount] = useState(filters.account_id?.toString() || '');

    const handleFilter = () => {
        router.get(route('accounting.aging.index'), {
            type: reportType,
            as_of_date: asOfDate,
            account_type: accountType || undefined,
            account_id: selectedAccount || undefined,
        });
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('tr-TR', {
            style: 'currency',
            currency: 'TRY',
        }).format(amount);
    };

    const getProgressColor = (percent: number) => {
        if (percent < 20) return 'success';
        if (percent < 40) return 'info';
        if (percent < 60) return 'warning';
        return 'danger';
    };

    return (
        <Layout>
            <Head title="Yaşlandırma Raporu" />
            <div className="page-content">
                <div className="container-fluid">
                    <div className="row">
                        <div className="col-12">
                            <div className="page-title-box d-sm-flex align-items-center justify-content-between">
                                <h4 className="mb-sm-0">Yaşlandırma Raporu</h4>
                                <div className="page-title-right">
                                    <ol className="breadcrumb m-0">
                                        <li className="breadcrumb-item">
                                            <Link href={route('dashboard')}>Dashboard</Link>
                                        </li>
                                        <li className="breadcrumb-item">Muhasebe</li>
                                        <li className="breadcrumb-item active">Yaşlandırma</li>
                                    </ol>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Report Type Selection */}
                    <div className="row mb-4">
                        <div className="col-12">
                            <div className="btn-group" role="group">
                                <button
                                    type="button"
                                    className={`btn ${reportType === 'receivables' ? 'btn-primary' : 'btn-outline-primary'}`}
                                    onClick={() => {
                                        setReportType('receivables');
                                        router.get(route('accounting.aging.index'), {
                                            type: 'receivables',
                                            as_of_date: asOfDate,
                                            account_type: accountType || undefined,
                                        });
                                    }}
                                >
                                    <i className="fas fa-arrow-down me-2"></i>
                                    Alacaklar
                                </button>
                                <button
                                    type="button"
                                    className={`btn ${reportType === 'payables' ? 'btn-primary' : 'btn-outline-primary'}`}
                                    onClick={() => {
                                        setReportType('payables');
                                        router.get(route('accounting.aging.index'), {
                                            type: 'payables',
                                            as_of_date: asOfDate,
                                            account_type: accountType || undefined,
                                        });
                                    }}
                                >
                                    <i className="fas fa-arrow-up me-2"></i>
                                    Borçlar
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Filters */}
                    <div className="row mb-4">
                        <div className="col-12">
                            <div className="card">
                                <div className="card-header">
                                    <h5 className="card-title mb-0">
                                        <i className="fas fa-filter me-2"></i>
                                        Filtreler
                                    </h5>
                                </div>
                                <div className="card-body">
                                    <div className="row g-3">
                                        <div className="col-md-3">
                                            <label className="form-label">Tarih İtibariyle</label>
                                            <input
                                                type="date"
                                                className="form-control"
                                                value={asOfDate}
                                                onChange={(e) => setAsOfDate(e.target.value)}
                                            />
                                        </div>
                                        <div className="col-md-3">
                                            <label className="form-label">Hesap Tipi</label>
                                            <select
                                                className="form-select"
                                                value={accountType}
                                                onChange={(e) => setAccountType(e.target.value)}
                                            >
                                                <option value="">Tümü</option>
                                                <option value="customer">Müşteri</option>
                                                <option value="supplier">Tedarikçi</option>
                                            </select>
                                        </div>
                                        <div className="col-md-4">
                                            <label className="form-label">Cari Hesap</label>
                                            <select
                                                className="form-select"
                                                value={selectedAccount}
                                                onChange={(e) => setSelectedAccount(e.target.value)}
                                            >
                                                <option value="">Tümü</option>
                                                {accounts.map((account) => (
                                                    <option key={account.id} value={account.id}>
                                                        {account.title}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="col-md-2 d-flex align-items-end">
                                            <button
                                                className="btn btn-primary w-100"
                                                onClick={handleFilter}
                                            >
                                                <i className="ri ri-search-line me-1"></i>
                                                Filtrele
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Summary Cards */}
                    <div className="row mb-4">
                        <div className="col-md-12">
                            <div className="card">
                                <div className="card-body">
                                    <h5 className="card-title mb-3">
                                        Özet - Toplam {summary.total_accounts} Hesap
                                    </h5>
                                    <div className="row">
                                        <div className="col-md-2">
                                            <div className="text-center">
                                                <p className="text-muted mb-1">Toplam</p>
                                                <h4 className="mb-0">{formatCurrency(summary.total_amount)}</h4>
                                            </div>
                                        </div>
                                        <div className="col-md-2">
                                            <div className="text-center">
                                                <p className="text-muted mb-1">Vadesi Gelmemiş / 0-30 Gün</p>
                                                <h5 className="mb-0 text-success">{formatCurrency(summary.current)}</h5>
                                                <small className="text-muted">{summary.current_percent.toFixed(1)}%</small>
                                            </div>
                                        </div>
                                        <div className="col-md-2">
                                            <div className="text-center">
                                                <p className="text-muted mb-1">31-60 Gün</p>
                                                <h5 className="mb-0 text-info">{formatCurrency(summary.period_1)}</h5>
                                                <small className="text-muted">{summary.period_1_percent.toFixed(1)}%</small>
                                            </div>
                                        </div>
                                        <div className="col-md-2">
                                            <div className="text-center">
                                                <p className="text-muted mb-1">61-90 Gün</p>
                                                <h5 className="mb-0 text-warning">{formatCurrency(summary.period_2)}</h5>
                                                <small className="text-muted">{summary.period_2_percent.toFixed(1)}%</small>
                                            </div>
                                        </div>
                                        <div className="col-md-2">
                                            <div className="text-center">
                                                <p className="text-muted mb-1">91-120 Gün</p>
                                                <h5 className="mb-0 text-danger">{formatCurrency(summary.period_3)}</h5>
                                                <small className="text-muted">{summary.period_3_percent.toFixed(1)}%</small>
                                            </div>
                                        </div>
                                        <div className="col-md-2">
                                            <div className="text-center">
                                                <p className="text-muted mb-1">120+ Gün</p>
                                                <h5 className="mb-0 text-danger">{formatCurrency(summary.over_120)}</h5>
                                                <small className="text-muted">{summary.over_120_percent.toFixed(1)}%</small>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Progress Bar */}
                                    <div className="mt-3">
                                        <div className="progress" style={{ height: '25px' }}>
                                            {summary.current_percent > 0 && (
                                                <div
                                                    className="progress-bar bg-success"
                                                    style={{ width: `${summary.current_percent}%` }}
                                                    title={`0-30 Gün: ${summary.current_percent.toFixed(1)}%`}
                                                >
                                                    {summary.current_percent.toFixed(0)}%
                                                </div>
                                            )}
                                            {summary.period_1_percent > 0 && (
                                                <div
                                                    className="progress-bar bg-info"
                                                    style={{ width: `${summary.period_1_percent}%` }}
                                                    title={`31-60 Gün: ${summary.period_1_percent.toFixed(1)}%`}
                                                >
                                                    {summary.period_1_percent.toFixed(0)}%
                                                </div>
                                            )}
                                            {summary.period_2_percent > 0 && (
                                                <div
                                                    className="progress-bar bg-warning"
                                                    style={{ width: `${summary.period_2_percent}%` }}
                                                    title={`61-90 Gün: ${summary.period_2_percent.toFixed(1)}%`}
                                                >
                                                    {summary.period_2_percent.toFixed(0)}%
                                                </div>
                                            )}
                                            {summary.period_3_percent > 0 && (
                                                <div
                                                    className="progress-bar bg-orange"
                                                    style={{ width: `${summary.period_3_percent}%` }}
                                                    title={`91-120 Gün: ${summary.period_3_percent.toFixed(1)}%`}
                                                >
                                                    {summary.period_3_percent.toFixed(0)}%
                                                </div>
                                            )}
                                            {summary.over_120_percent > 0 && (
                                                <div
                                                    className="progress-bar bg-danger"
                                                    style={{ width: `${summary.over_120_percent}%` }}
                                                    title={`120+ Gün: ${summary.over_120_percent.toFixed(1)}%`}
                                                >
                                                    {summary.over_120_percent.toFixed(0)}%
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Data Table */}
                    <div className="row">
                        <div className="col-12">
                            <div className="card">
                                <div className="card-header d-flex justify-content-between align-items-center">
                                    <h5 className="card-title mb-0">Detaylı Rapor</h5>
                                    <Link
                                        href={route('accounting.aging.export', {
                                            type: reportType,
                                            as_of_date: asOfDate,
                                            account_type: accountType || undefined,
                                            account_id: selectedAccount || undefined,
                                        })}
                                        className="btn btn-success btn-sm"
                                    >
                                        <i className="fas fa-file-excel me-1"></i>
                                        Excel'e Aktar
                                    </Link>
                                </div>
                                <div className="card-body">
                                    <div className="table-responsive">
                                        <table className="table table-hover table-sm">
                                            <thead>
                                                <tr>
                                                    <th>Hesap Kodu</th>
                                                    <th>Cari Hesap</th>
                                                    <th>Tip</th>
                                                    <th className="text-end">0-30 Gün</th>
                                                    <th className="text-end">31-60 Gün</th>
                                                    <th className="text-end">61-90 Gün</th>
                                                    <th className="text-end">91-120 Gün</th>
                                                    <th className="text-end">120+ Gün</th>
                                                    <th className="text-end">Toplam</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {agingData.length === 0 ? (
                                                    <tr>
                                                        <td colSpan={9} className="text-center py-4">
                                                            <i className="fas fa-inbox fa-3x text-muted mb-3"></i>
                                                            <p className="text-muted">Seçili kriterlere göre veri bulunamadı.</p>
                                                        </td>
                                                    </tr>
                                                ) : (
                                                    agingData.map((data) => (
                                                        <tr key={data.account_id}>
                                                            <td>
                                                                <span className="text-muted">{data.account_code}</span>
                                                            </td>
                                                            <td>
                                                                <Link
                                                                    href={route('accounting.current-accounts.show', data.account_id)}
                                                                    className="text-primary"
                                                                >
                                                                    {data.account_name}
                                                                </Link>
                                                            </td>
                                                            <td>
                                                                <span className="badge bg-secondary">
                                                                    {data.account_type === 'customer' ? 'Müşteri' : 'Tedarikçi'}
                                                                </span>
                                                            </td>
                                                            <td className="text-end">
                                                                {data.current > 0 && (
                                                                    <span className="text-success fw-medium">
                                                                        {formatCurrency(data.current)}
                                                                    </span>
                                                                )}
                                                            </td>
                                                            <td className="text-end">
                                                                {data.period_1 > 0 && (
                                                                    <span className="text-info fw-medium">
                                                                        {formatCurrency(data.period_1)}
                                                                    </span>
                                                                )}
                                                            </td>
                                                            <td className="text-end">
                                                                {data.period_2 > 0 && (
                                                                    <span className="text-warning fw-medium">
                                                                        {formatCurrency(data.period_2)}
                                                                    </span>
                                                                )}
                                                            </td>
                                                            <td className="text-end">
                                                                {data.period_3 > 0 && (
                                                                    <span className="text-danger fw-medium">
                                                                        {formatCurrency(data.period_3)}
                                                                    </span>
                                                                )}
                                                            </td>
                                                            <td className="text-end">
                                                                {data.over_120 > 0 && (
                                                                    <span className="text-danger fw-bold">
                                                                        {formatCurrency(data.over_120)}
                                                                    </span>
                                                                )}
                                                            </td>
                                                            <td className="text-end">
                                                                <strong>{formatCurrency(data.total)}</strong>
                                                            </td>
                                                        </tr>
                                                    ))
                                                )}
                                            </tbody>
                                            {agingData.length > 0 && (
                                                <tfoot className="table-light">
                                                    <tr>
                                                        <th colSpan={3}>TOPLAM</th>
                                                        <th className="text-end">{formatCurrency(summary.current)}</th>
                                                        <th className="text-end">{formatCurrency(summary.period_1)}</th>
                                                        <th className="text-end">{formatCurrency(summary.period_2)}</th>
                                                        <th className="text-end">{formatCurrency(summary.period_3)}</th>
                                                        <th className="text-end">{formatCurrency(summary.over_120)}</th>
                                                        <th className="text-end">{formatCurrency(summary.total_amount)}</th>
                                                    </tr>
                                                </tfoot>
                                            )}
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
