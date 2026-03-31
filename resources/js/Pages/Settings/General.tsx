import React, { useState, useEffect } from 'react';
import { Head, Link, router, useForm } from '@inertiajs/react';
import Layout from '../../Layouts';

interface Setting {
    id: number;
    key: string;
    value: string | number | boolean;
    type: string;
    group: string;
    description: string | null;
    is_public: boolean;
}

interface Props {
    settings: Record<string, Setting>;
}

export default function General({ settings }: Props) {
    const { data, setData, post, processing, errors } = useForm({
        app_name: settings.app_name?.value || '',
        app_description: settings.app_description?.value || '',
        company_name: settings.company_name?.value || '',
        company_address: settings.company_address?.value || '',
        company_phone: settings.company_phone?.value || '',
        company_email: settings.company_email?.value || '',
        company_website: settings.company_website?.value || '',
        tax_office: settings.tax_office?.value || '',
        tax_number: settings.tax_number?.value || '',
        default_currency: settings.default_currency?.value || 'TRY',
        default_language: settings.default_language?.value || 'tr',
        timezone: settings.timezone?.value || 'Europe/Istanbul',
        date_format: settings.date_format?.value || 'd/m/Y',
        time_format: settings.time_format?.value || 'H:i',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('settings.general.update'), {
            preserveScroll: true,
        });
    };

    return (
        <Layout>
            <Head title="Genel Ayarlar" />
            <div className="page-content">
                <div className="container-fluid">
                    {/* Page Title */}
                    <div className="row">
                        <div className="col-12">
                            <div className="page-title-box d-sm-flex align-items-center justify-content-between">
                                <h4 className="mb-sm-0">Genel Ayarlar</h4>
                                <div className="page-title-right">
                                    <ol className="breadcrumb m-0">
                                        <li className="breadcrumb-item">
                                            <Link href={route('dashboard')}>Dashboard</Link>
                                        </li>
                                        <li className="breadcrumb-item">Ayarlar</li>
                                        <li className="breadcrumb-item active">Genel</li>
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
                                                className="nav-link active"
                                            >
                                                <i className="fas fa-cog me-1"></i>
                                                Genel
                                            </Link>
                                        </li>
                                        <li className="nav-item">
                                            <Link
                                                href={route('settings.system')}
                                                className="nav-link"
                                            >
                                                <i className="fas fa-server me-1"></i>
                                                Sistem
                                            </Link>
                                        </li>
                                        <li className="nav-item">
                                            <Link
                                                href={route('settings.email')}
                                                className="nav-link"
                                            >
                                                <i className="fas fa-envelope me-1"></i>
                                                E-posta
                                            </Link>
                                        </li>
                                        <li className="nav-item">
                                            <Link
                                                href={route('settings.tax.index')}
                                                className="nav-link"
                                            >
                                                <i className="fas fa-percentage me-1"></i>
                                                Vergi
                                            </Link>
                                        </li>
                                        <li className="nav-item">
                                            <Link
                                                href={route('settings.locations.index')}
                                                className="nav-link"
                                            >
                                                <i className="fas fa-map-marker-alt me-1"></i>
                                                Lokasyonlar
                                            </Link>
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit}>
                        <div className="row">
                            {/* Application Settings */}
                            <div className="col-lg-6">
                                <div className="card">
                                    <div className="card-header">
                                        <h5 className="card-title mb-0">
                                            <i className="fas fa-desktop me-2"></i>
                                            Uygulama Bilgileri
                                        </h5>
                                    </div>
                                    <div className="card-body">
                                        <div className="mb-3">
                                            <label className="form-label">Uygulama Adı <span className="text-danger">*</span></label>
                                            <input
                                                type="text"
                                                className={`form-control ${errors.app_name ? 'is-invalid' : ''}`}
                                                value={data.app_name}
                                                onChange={(e) => setData('app_name', e.target.value)}
                                            />
                                            {errors.app_name && <div className="invalid-feedback">{errors.app_name}</div>}
                                        </div>

                                        <div className="mb-3">
                                            <label className="form-label">Uygulama Açıklaması</label>
                                            <textarea
                                                className={`form-control ${errors.app_description ? 'is-invalid' : ''}`}
                                                rows={3}
                                                value={data.app_description}
                                                onChange={(e) => setData('app_description', e.target.value)}
                                            ></textarea>
                                            {errors.app_description && <div className="invalid-feedback">{errors.app_description}</div>}
                                        </div>
                                    </div>
                                </div>

                                {/* Company Information */}
                                <div className="card">
                                    <div className="card-header">
                                        <h5 className="card-title mb-0">
                                            <i className="fas fa-building me-2"></i>
                                            Firma Bilgileri
                                        </h5>
                                    </div>
                                    <div className="card-body">
                                        <div className="mb-3">
                                            <label className="form-label">Firma Adı</label>
                                            <input
                                                type="text"
                                                className={`form-control ${errors.company_name ? 'is-invalid' : ''}`}
                                                value={data.company_name}
                                                onChange={(e) => setData('company_name', e.target.value)}
                                            />
                                            {errors.company_name && <div className="invalid-feedback">{errors.company_name}</div>}
                                        </div>

                                        <div className="mb-3">
                                            <label className="form-label">Firma Adresi</label>
                                            <textarea
                                                className={`form-control ${errors.company_address ? 'is-invalid' : ''}`}
                                                rows={3}
                                                value={data.company_address}
                                                onChange={(e) => setData('company_address', e.target.value)}
                                            ></textarea>
                                            {errors.company_address && <div className="invalid-feedback">{errors.company_address}</div>}
                                        </div>

                                        <div className="row">
                                            <div className="col-md-6 mb-3">
                                                <label className="form-label">Firma Telefonu</label>
                                                <input
                                                    type="text"
                                                    className={`form-control ${errors.company_phone ? 'is-invalid' : ''}`}
                                                    value={data.company_phone}
                                                    onChange={(e) => setData('company_phone', e.target.value)}
                                                />
                                                {errors.company_phone && <div className="invalid-feedback">{errors.company_phone}</div>}
                                            </div>

                                            <div className="col-md-6 mb-3">
                                                <label className="form-label">Firma E-posta</label>
                                                <input
                                                    type="email"
                                                    className={`form-control ${errors.company_email ? 'is-invalid' : ''}`}
                                                    value={data.company_email}
                                                    onChange={(e) => setData('company_email', e.target.value)}
                                                />
                                                {errors.company_email && <div className="invalid-feedback">{errors.company_email}</div>}
                                            </div>
                                        </div>

                                        <div className="mb-3">
                                            <label className="form-label">Firma Web Sitesi</label>
                                            <input
                                                type="text"
                                                className={`form-control ${errors.company_website ? 'is-invalid' : ''}`}
                                                value={data.company_website}
                                                onChange={(e) => setData('company_website', e.target.value)}
                                                placeholder="https://example.com"
                                            />
                                            {errors.company_website && <div className="invalid-feedback">{errors.company_website}</div>}
                                        </div>

                                        <div className="row">
                                            <div className="col-md-6 mb-3">
                                                <label className="form-label">Vergi Dairesi</label>
                                                <input
                                                    type="text"
                                                    className={`form-control ${errors.tax_office ? 'is-invalid' : ''}`}
                                                    value={data.tax_office}
                                                    onChange={(e) => setData('tax_office', e.target.value)}
                                                />
                                                {errors.tax_office && <div className="invalid-feedback">{errors.tax_office}</div>}
                                            </div>

                                            <div className="col-md-6 mb-3">
                                                <label className="form-label">Vergi Numarası</label>
                                                <input
                                                    type="text"
                                                    className={`form-control ${errors.tax_number ? 'is-invalid' : ''}`}
                                                    value={data.tax_number}
                                                    onChange={(e) => setData('tax_number', e.target.value)}
                                                />
                                                {errors.tax_number && <div className="invalid-feedback">{errors.tax_number}</div>}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Regional Settings */}
                            <div className="col-lg-6">
                                <div className="card">
                                    <div className="card-header">
                                        <h5 className="card-title mb-0">
                                            <i className="fas fa-globe me-2"></i>
                                            Bölgesel Ayarlar
                                        </h5>
                                    </div>
                                    <div className="card-body">
                                        <div className="mb-3">
                                            <label className="form-label">Para Birimi</label>
                                            <select
                                                className={`form-select ${errors.default_currency ? 'is-invalid' : ''}`}
                                                value={data.default_currency}
                                                onChange={(e) => setData('default_currency', e.target.value)}
                                            >
                                                <option value="TRY">Türk Lirası (₺)</option>
                                                <option value="USD">ABD Doları ($)</option>
                                                <option value="EUR">Euro (€)</option>
                                                <option value="GBP">İngiliz Sterlini (£)</option>
                                            </select>
                                            {errors.default_currency && <div className="invalid-feedback">{errors.default_currency}</div>}
                                        </div>

                                        <div className="mb-3">
                                            <label className="form-label">Dil</label>
                                            <select
                                                className={`form-select ${errors.default_language ? 'is-invalid' : ''}`}
                                                value={data.default_language}
                                                onChange={(e) => setData('default_language', e.target.value)}
                                            >
                                                <option value="tr">Türkçe</option>
                                                <option value="en">English</option>
                                            </select>
                                            {errors.default_language && <div className="invalid-feedback">{errors.default_language}</div>}
                                        </div>

                                        <div className="mb-3">
                                            <label className="form-label">Saat Dilimi</label>
                                            <select
                                                className={`form-select ${errors.timezone ? 'is-invalid' : ''}`}
                                                value={data.timezone}
                                                onChange={(e) => setData('timezone', e.target.value)}
                                            >
                                                <option value="Europe/Istanbul">İstanbul (GMT+3)</option>
                                                <option value="Europe/London">Londra (GMT+0)</option>
                                                <option value="America/New_York">New York (GMT-5)</option>
                                                <option value="Asia/Dubai">Dubai (GMT+4)</option>
                                            </select>
                                            {errors.timezone && <div className="invalid-feedback">{errors.timezone}</div>}
                                        </div>

                                        <div className="row">
                                            <div className="col-md-6 mb-3">
                                                <label className="form-label">Tarih Formatı</label>
                                                <select
                                                    className={`form-select ${errors.date_format ? 'is-invalid' : ''}`}
                                                    value={data.date_format}
                                                    onChange={(e) => setData('date_format', e.target.value)}
                                                >
                                                    <option value="d/m/Y">31/12/2025</option>
                                                    <option value="m/d/Y">12/31/2025</option>
                                                    <option value="Y-m-d">2025-12-31</option>
                                                    <option value="d.m.Y">31.12.2025</option>
                                                </select>
                                                {errors.date_format && <div className="invalid-feedback">{errors.date_format}</div>}
                                            </div>

                                            <div className="col-md-6 mb-3">
                                                <label className="form-label">Saat Formatı</label>
                                                <select
                                                    className={`form-select ${errors.time_format ? 'is-invalid' : ''}`}
                                                    value={data.time_format}
                                                    onChange={(e) => setData('time_format', e.target.value)}
                                                >
                                                    <option value="H:i">24 Saat (14:30)</option>
                                                    <option value="h:i A">12 Saat (02:30 PM)</option>
                                                </select>
                                                {errors.time_format && <div className="invalid-feedback">{errors.time_format}</div>}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Info Card */}
                                <div className="card border-info">
                                    <div className="card-body">
                                        <h5 className="card-title text-info">
                                            <i className="fas fa-info-circle me-2"></i>
                                            Bilgi
                                        </h5>
                                        <p className="mb-2">
                                            <i className="fas fa-check text-success me-2"></i>
                                            Bu ayarlar tüm uygulama genelinde geçerli olacaktır.
                                        </p>
                                        <p className="mb-2">
                                            <i className="fas fa-check text-success me-2"></i>
                                            Firma bilgileri raporlar ve faturaları üzerinde görünecektir.
                                        </p>
                                        <p className="mb-0">
                                            <i className="fas fa-check text-success me-2"></i>
                                            Bölgesel ayarlar tarih, saat ve para birimi formatlarını belirler.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Save Button */}
                        <div className="row">
                            <div className="col-12">
                                <div className="card">
                                    <div className="card-body">
                                        <div className="d-flex justify-content-end gap-2">
                                            <button
                                                type="button"
                                                className="btn btn-secondary"
                                                onClick={() => router.visit(route('dashboard'))}
                                            >
                                                <i className="fas fa-times me-1"></i>
                                                İptal
                                            </button>
                                            <button
                                                type="submit"
                                                className="btn btn-primary"
                                                disabled={processing}
                                            >
                                                {processing ? (
                                                    <>
                                                        <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                                                        Kaydediliyor...
                                                    </>
                                                ) : (
                                                    <>
                                                        <i className="fas fa-save me-1"></i>
                                                        Kaydet
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </Layout>
    );
}
