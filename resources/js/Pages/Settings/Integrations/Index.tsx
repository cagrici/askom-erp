import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import Layout from '../../../Layouts';

interface Integration {
    id: number;
    name: string;
    code: string;
    type: string;
    description: string;
    is_active: boolean;
    is_configured: boolean;
    last_sync_at: string | null;
    last_sync_status: string | null;
    sync_count: number;
}

interface Stats {
    total_integrations: number;
    active_integrations: number;
    configured_integrations: number;
    recent_syncs: number;
    successful_syncs: number;
    failed_syncs: number;
    success_rate: number;
}

interface Props {
    integrations: Integration[];
    stats: Stats;
}

export default function IntegrationsIndex({ integrations, stats }: Props) {
    const [filterType, setFilterType] = useState<string>('all');

    const getTypeLabel = (type: string) => {
        const types: Record<string, string> = {
            accounting: 'Muhasebe',
            einvoice: 'e-Fatura',
            payment: 'Ödeme',
            shipping: 'Kargo',
            marketplace: 'Pazaryeri',
            sms: 'SMS',
            currency: 'Döviz Kuru',
        };
        return types[type] || type;
    };

    const getTypeBadgeColor = (type: string) => {
        const colors: Record<string, string> = {
            accounting: 'primary',
            einvoice: 'success',
            payment: 'warning',
            shipping: 'info',
            marketplace: 'danger',
            sms: 'secondary',
            currency: 'dark',
        };
        return colors[type] || 'secondary';
    };

    const filteredIntegrations = filterType === 'all'
        ? integrations
        : integrations.filter(i => i.type === filterType);

    const groupedIntegrations = filteredIntegrations.reduce((groups, integration) => {
        const type = integration.type;
        if (!groups[type]) {
            groups[type] = [];
        }
        groups[type].push(integration);
        return groups;
    }, {} as Record<string, Integration[]>);

    const toggleStatus = (integration: Integration) => {
        router.patch(route('settings.integrations.toggle-status', integration.id), {}, {
            preserveScroll: true,
        });
    };

    const testConnection = (integration: Integration) => {
        router.post(route('settings.integrations.test', integration.id), {}, {
            preserveScroll: true,
        });
    };

    const syncNow = (integration: Integration) => {
        if (confirm(`${integration.name} entegrasyonu için senkronizasyon başlatılsın mı?`)) {
            router.post(route('settings.integrations.sync', integration.id), {}, {
                preserveScroll: true,
            });
        }
    };

    return (
        <Layout>
            <Head title="Entegrasyonlar" />
            <div className="page-content">
                <div className="container-fluid">
                    {/* Page Title */}
                    <div className="row">
                        <div className="col-12">
                            <div className="page-title-box d-sm-flex align-items-center justify-content-between">
                                <h4 className="mb-sm-0">Entegrasyonlar</h4>
                                <div className="page-title-right">
                                    <ol className="breadcrumb m-0">
                                        <li className="breadcrumb-item">
                                            <Link href={route('dashboard')}>Dashboard</Link>
                                        </li>
                                        <li className="breadcrumb-item">Ayarlar</li>
                                        <li className="breadcrumb-item active">Entegrasyonlar</li>
                                    </ol>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Settings Navigation Tabs */}
                    <div className="row mb-3">
                        <div className="col-12">
                            <div className="card">
                                <div className="card-body">
                                    <ul className="nav nav-pills" role="tablist">
                                        <li className="nav-item">
                                            <Link
                                                href={route('settings.general')}
                                                className="nav-link"
                                            >
                                                <i className="fas fa-cog me-1"></i>
                                                Genel
                                            </Link>
                                        </li>
                                        <li className="nav-item">
                                            <Link
                                                href={route('settings.company')}
                                                className="nav-link"
                                            >
                                                <i className="fas fa-building me-1"></i>
                                                Firma
                                            </Link>
                                        </li>
                                        <li className="nav-item">
                                            <Link
                                                href={route('settings.currencies.index')}
                                                className="nav-link"
                                            >
                                                <i className="fas fa-dollar-sign me-1"></i>
                                                Para Birimleri
                                            </Link>
                                        </li>
                                        <li className="nav-item">
                                            <Link
                                                href={route('settings.integrations.index')}
                                                className="nav-link active"
                                            >
                                                <i className="fas fa-plug me-1"></i>
                                                Entegrasyonlar
                                            </Link>
                                        </li>
                                        <li className="nav-item">
                                            <Link
                                                href={route('settings.backup.index')}
                                                className="nav-link"
                                            >
                                                <i className="fas fa-database me-1"></i>
                                                Yedekleme
                                            </Link>
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Statistics Cards */}
                    <div className="row">
                        <div className="col-xl-3 col-md-6">
                            <div className="card card-animate">
                                <div className="card-body">
                                    <div className="d-flex align-items-center">
                                        <div className="flex-grow-1">
                                            <p className="text-uppercase fw-medium text-muted mb-0">
                                                Toplam Entegrasyon
                                            </p>
                                        </div>
                                        <div className="flex-shrink-0">
                                            <h5 className="text-muted fs-14 mb-0">
                                                <i className="fas fa-plug align-middle"></i>
                                            </h5>
                                        </div>
                                    </div>
                                    <div className="d-flex align-items-end justify-content-between mt-4">
                                        <div>
                                            <h4 className="fs-22 fw-semibold ff-secondary mb-0">
                                                {stats.total_integrations}
                                            </h4>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="col-xl-3 col-md-6">
                            <div className="card card-animate">
                                <div className="card-body">
                                    <div className="d-flex align-items-center">
                                        <div className="flex-grow-1">
                                            <p className="text-uppercase fw-medium text-muted mb-0">
                                                Aktif Entegrasyon
                                            </p>
                                        </div>
                                        <div className="flex-shrink-0">
                                            <h5 className="text-success fs-14 mb-0">
                                                <i className="fas fa-check-circle align-middle"></i>
                                            </h5>
                                        </div>
                                    </div>
                                    <div className="d-flex align-items-end justify-content-between mt-4">
                                        <div>
                                            <h4 className="fs-22 fw-semibold ff-secondary mb-0">
                                                {stats.active_integrations}
                                            </h4>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="col-xl-3 col-md-6">
                            <div className="card card-animate">
                                <div className="card-body">
                                    <div className="d-flex align-items-center">
                                        <div className="flex-grow-1">
                                            <p className="text-uppercase fw-medium text-muted mb-0">
                                                Son 7 Gün Senkronizasyon
                                            </p>
                                        </div>
                                        <div className="flex-shrink-0">
                                            <h5 className="text-info fs-14 mb-0">
                                                <i className="fas fa-sync align-middle"></i>
                                            </h5>
                                        </div>
                                    </div>
                                    <div className="d-flex align-items-end justify-content-between mt-4">
                                        <div>
                                            <h4 className="fs-22 fw-semibold ff-secondary mb-0">
                                                {stats.recent_syncs}
                                            </h4>
                                            <p className="mb-0 text-muted">
                                                <span className="badge bg-success-subtle text-success mb-0">
                                                    {stats.successful_syncs} başarılı
                                                </span>
                                                {stats.failed_syncs > 0 && (
                                                    <span className="badge bg-danger-subtle text-danger mb-0 ms-1">
                                                        {stats.failed_syncs} başarısız
                                                    </span>
                                                )}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="col-xl-3 col-md-6">
                            <div className="card card-animate">
                                <div className="card-body">
                                    <div className="d-flex align-items-center">
                                        <div className="flex-grow-1">
                                            <p className="text-uppercase fw-medium text-muted mb-0">
                                                Başarı Oranı
                                            </p>
                                        </div>
                                        <div className="flex-shrink-0">
                                            <h5 className="text-primary fs-14 mb-0">
                                                <i className="fas fa-chart-line align-middle"></i>
                                            </h5>
                                        </div>
                                    </div>
                                    <div className="d-flex align-items-end justify-content-between mt-4">
                                        <div>
                                            <h4 className="fs-22 fw-semibold ff-secondary mb-0">
                                                %{stats.success_rate}
                                            </h4>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Filter */}
                    <div className="row mb-3">
                        <div className="col-12">
                            <div className="btn-group" role="group">
                                <button
                                    type="button"
                                    className={`btn btn-${filterType === 'all' ? 'primary' : 'outline-primary'}`}
                                    onClick={() => setFilterType('all')}
                                >
                                    Tümü
                                </button>
                                <button
                                    type="button"
                                    className={`btn btn-${filterType === 'accounting' ? 'primary' : 'outline-primary'}`}
                                    onClick={() => setFilterType('accounting')}
                                >
                                    Muhasebe
                                </button>
                                <button
                                    type="button"
                                    className={`btn btn-${filterType === 'einvoice' ? 'success' : 'outline-success'}`}
                                    onClick={() => setFilterType('einvoice')}
                                >
                                    e-Fatura
                                </button>
                                <button
                                    type="button"
                                    className={`btn btn-${filterType === 'payment' ? 'warning' : 'outline-warning'}`}
                                    onClick={() => setFilterType('payment')}
                                >
                                    Ödeme
                                </button>
                                <button
                                    type="button"
                                    className={`btn btn-${filterType === 'shipping' ? 'info' : 'outline-info'}`}
                                    onClick={() => setFilterType('shipping')}
                                >
                                    Kargo
                                </button>
                                <button
                                    type="button"
                                    className={`btn btn-${filterType === 'marketplace' ? 'danger' : 'outline-danger'}`}
                                    onClick={() => setFilterType('marketplace')}
                                >
                                    Pazaryeri
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Integrations Grid */}
                    {Object.entries(groupedIntegrations).map(([type, items]) => (
                        <div key={type} className="row mb-4">
                            <div className="col-12">
                                <h5 className="mb-3">
                                    <span className={`badge bg-${getTypeBadgeColor(type)}`}>
                                        {getTypeLabel(type)}
                                    </span>
                                </h5>
                                <div className="row">
                                    {items.map((integration) => (
                                        <div key={integration.id} className="col-xl-4 col-md-6 mb-3">
                                            <div className="card border">
                                                <div className="card-body">
                                                    <div className="d-flex align-items-start">
                                                        <div className="flex-grow-1">
                                                            <h5 className="card-title mb-1">
                                                                {integration.name}
                                                                {integration.is_active && (
                                                                    <span className="badge bg-success ms-2">Aktif</span>
                                                                )}
                                                                {integration.is_configured && !integration.is_active && (
                                                                    <span className="badge bg-warning ms-2">Yapılandırılmış</span>
                                                                )}
                                                            </h5>
                                                            <p className="text-muted small mb-2">
                                                                {integration.description}
                                                            </p>
                                                            {integration.last_sync_at && (
                                                                <p className="text-muted small mb-0">
                                                                    <i className="fas fa-sync me-1"></i>
                                                                    Son Senkronizasyon: {new Date(integration.last_sync_at).toLocaleString('tr-TR')}
                                                                    <span className={`badge bg-${integration.last_sync_status === 'success' ? 'success' : 'danger'} ms-2`}>
                                                                        {integration.last_sync_status}
                                                                    </span>
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="mt-3 d-flex gap-2">
                                                        <Link
                                                            href={route('settings.integrations.show', integration.id)}
                                                            className="btn btn-sm btn-primary flex-grow-1"
                                                        >
                                                            <i className="fas fa-cog me-1"></i>
                                                            Yapılandır
                                                        </Link>
                                                        {integration.is_configured && (
                                                            <>
                                                                <button
                                                                    type="button"
                                                                    className="btn btn-sm btn-info"
                                                                    onClick={() => testConnection(integration)}
                                                                    title="Bağlantı Testi"
                                                                >
                                                                    <i className="fas fa-flask"></i>
                                                                </button>
                                                                {integration.is_active && (
                                                                    <button
                                                                        type="button"
                                                                        className="btn btn-sm btn-success"
                                                                        onClick={() => syncNow(integration)}
                                                                        title="Şimdi Senkronize Et"
                                                                    >
                                                                        <i className="fas fa-sync"></i>
                                                                    </button>
                                                                )}
                                                                <button
                                                                    type="button"
                                                                    className={`btn btn-sm btn-${integration.is_active ? 'danger' : 'success'}`}
                                                                    onClick={() => toggleStatus(integration)}
                                                                    title={integration.is_active ? 'Devre Dışı Bırak' : 'Aktif Et'}
                                                                >
                                                                    <i className={`fas fa-${integration.is_active ? 'times' : 'check'}`}></i>
                                                                </button>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </Layout>
    );
}
