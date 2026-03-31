import React from 'react';
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

export default function Company({ settings }: Props) {
    const { data, setData, post, processing, errors } = useForm({
        company_name: settings.company_name?.value || '',
        company_legal_name: settings.company_legal_name?.value || '',
        company_address: settings.company_address?.value || '',
        company_city: settings.company_city?.value || '',
        company_state: settings.company_state?.value || '',
        company_postal_code: settings.company_postal_code?.value || '',
        company_country: settings.company_country?.value || 'Türkiye',
        company_phone: settings.company_phone?.value || '',
        company_fax: settings.company_fax?.value || '',
        company_email: settings.company_email?.value || '',
        company_website: settings.company_website?.value || '',
        tax_office: settings.tax_office?.value || '',
        tax_number: settings.tax_number?.value || '',
        trade_registry_number: settings.trade_registry_number?.value || '',
        mersis_number: settings.mersis_number?.value || '',
        company_logo: settings.company_logo?.value || '',
        company_favicon: settings.company_favicon?.value || '',
        bank_name: settings.bank_name?.value || '',
        bank_branch: settings.bank_branch?.value || '',
        bank_account_name: settings.bank_account_name?.value || '',
        bank_account_number: settings.bank_account_number?.value || '',
        iban: settings.iban?.value || '',
        swift_code: settings.swift_code?.value || '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('settings.company.update'), {
            preserveScroll: true,
        });
    };

    return (
        <Layout>
            <Head title="Firma Bilgileri" />
            <div className="page-content">
                <div className="container-fluid">
                    {/* Page Title */}
                    <div className="row">
                        <div className="col-12">
                            <div className="page-title-box d-sm-flex align-items-center justify-content-between">
                                <h4 className="mb-sm-0">Firma Bilgileri</h4>
                                <div className="page-title-right">
                                    <ol className="breadcrumb m-0">
                                        <li className="breadcrumb-item">
                                            <Link href={route('dashboard')}>Dashboard</Link>
                                        </li>
                                        <li className="breadcrumb-item">Ayarlar</li>
                                        <li className="breadcrumb-item active">Firma Bilgileri</li>
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
                                                className="nav-link active"
                                            >
                                                <i className="fas fa-building me-1"></i>
                                                Firma
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

                    <form onSubmit={handleSubmit}>
                        <div className="row">
                            {/* Left Column */}
                            <div className="col-lg-6">
                                {/* Basic Information */}
                                <div className="card">
                                    <div className="card-header">
                                        <h5 className="card-title mb-0">
                                            <i className="fas fa-info-circle me-2"></i>
                                            Temel Bilgiler
                                        </h5>
                                    </div>
                                    <div className="card-body">
                                        <div className="mb-3">
                                            <label className="form-label">Firma Adı <span className="text-danger">*</span></label>
                                            <input
                                                type="text"
                                                className={`form-control ${errors.company_name ? 'is-invalid' : ''}`}
                                                value={data.company_name}
                                                onChange={(e) => setData('company_name', e.target.value)}
                                            />
                                            {errors.company_name && <div className="invalid-feedback">{errors.company_name}</div>}
                                        </div>

                                        <div className="mb-3">
                                            <label className="form-label">Yasal Firma Adı</label>
                                            <input
                                                type="text"
                                                className={`form-control ${errors.company_legal_name ? 'is-invalid' : ''}`}
                                                value={data.company_legal_name}
                                                onChange={(e) => setData('company_legal_name', e.target.value)}
                                                placeholder="Limited Şirketi / Anonim Şirketi vb."
                                            />
                                            {errors.company_legal_name && <div className="invalid-feedback">{errors.company_legal_name}</div>}
                                        </div>

                                        <div className="mb-3">
                                            <label className="form-label">Adres</label>
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
                                                <label className="form-label">Şehir</label>
                                                <input
                                                    type="text"
                                                    className={`form-control ${errors.company_city ? 'is-invalid' : ''}`}
                                                    value={data.company_city}
                                                    onChange={(e) => setData('company_city', e.target.value)}
                                                />
                                                {errors.company_city && <div className="invalid-feedback">{errors.company_city}</div>}
                                            </div>

                                            <div className="col-md-6 mb-3">
                                                <label className="form-label">İlçe/Bölge</label>
                                                <input
                                                    type="text"
                                                    className={`form-control ${errors.company_state ? 'is-invalid' : ''}`}
                                                    value={data.company_state}
                                                    onChange={(e) => setData('company_state', e.target.value)}
                                                />
                                                {errors.company_state && <div className="invalid-feedback">{errors.company_state}</div>}
                                            </div>
                                        </div>

                                        <div className="row">
                                            <div className="col-md-6 mb-3">
                                                <label className="form-label">Posta Kodu</label>
                                                <input
                                                    type="text"
                                                    className={`form-control ${errors.company_postal_code ? 'is-invalid' : ''}`}
                                                    value={data.company_postal_code}
                                                    onChange={(e) => setData('company_postal_code', e.target.value)}
                                                />
                                                {errors.company_postal_code && <div className="invalid-feedback">{errors.company_postal_code}</div>}
                                            </div>

                                            <div className="col-md-6 mb-3">
                                                <label className="form-label">Ülke</label>
                                                <input
                                                    type="text"
                                                    className={`form-control ${errors.company_country ? 'is-invalid' : ''}`}
                                                    value={data.company_country}
                                                    onChange={(e) => setData('company_country', e.target.value)}
                                                />
                                                {errors.company_country && <div className="invalid-feedback">{errors.company_country}</div>}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Contact Information */}
                                <div className="card">
                                    <div className="card-header">
                                        <h5 className="card-title mb-0">
                                            <i className="fas fa-phone me-2"></i>
                                            İletişim Bilgileri
                                        </h5>
                                    </div>
                                    <div className="card-body">
                                        <div className="row">
                                            <div className="col-md-6 mb-3">
                                                <label className="form-label">Telefon</label>
                                                <input
                                                    type="text"
                                                    className={`form-control ${errors.company_phone ? 'is-invalid' : ''}`}
                                                    value={data.company_phone}
                                                    onChange={(e) => setData('company_phone', e.target.value)}
                                                    placeholder="+90 (555) 123 45 67"
                                                />
                                                {errors.company_phone && <div className="invalid-feedback">{errors.company_phone}</div>}
                                            </div>

                                            <div className="col-md-6 mb-3">
                                                <label className="form-label">Faks</label>
                                                <input
                                                    type="text"
                                                    className={`form-control ${errors.company_fax ? 'is-invalid' : ''}`}
                                                    value={data.company_fax}
                                                    onChange={(e) => setData('company_fax', e.target.value)}
                                                    placeholder="+90 (555) 123 45 68"
                                                />
                                                {errors.company_fax && <div className="invalid-feedback">{errors.company_fax}</div>}
                                            </div>
                                        </div>

                                        <div className="mb-3">
                                            <label className="form-label">E-posta</label>
                                            <input
                                                type="email"
                                                className={`form-control ${errors.company_email ? 'is-invalid' : ''}`}
                                                value={data.company_email}
                                                onChange={(e) => setData('company_email', e.target.value)}
                                                placeholder="info@firma.com"
                                            />
                                            {errors.company_email && <div className="invalid-feedback">{errors.company_email}</div>}
                                        </div>

                                        <div className="mb-3">
                                            <label className="form-label">Web Sitesi</label>
                                            <input
                                                type="url"
                                                className={`form-control ${errors.company_website ? 'is-invalid' : ''}`}
                                                value={data.company_website}
                                                onChange={(e) => setData('company_website', e.target.value)}
                                                placeholder="https://www.firma.com"
                                            />
                                            {errors.company_website && <div className="invalid-feedback">{errors.company_website}</div>}
                                        </div>
                                    </div>
                                </div>

                                {/* Logo & Branding */}
                                <div className="card">
                                    <div className="card-header">
                                        <h5 className="card-title mb-0">
                                            <i className="fas fa-palette me-2"></i>
                                            Logo ve Marka
                                        </h5>
                                    </div>
                                    <div className="card-body">
                                        <div className="mb-3">
                                            <label className="form-label">Firma Logosu</label>
                                            <input
                                                type="text"
                                                className={`form-control ${errors.company_logo ? 'is-invalid' : ''}`}
                                                value={data.company_logo}
                                                onChange={(e) => setData('company_logo', e.target.value)}
                                                placeholder="/images/logo.png"
                                            />
                                            {errors.company_logo && <div className="invalid-feedback">{errors.company_logo}</div>}
                                            <small className="text-muted">Logo dosyasının yolu veya URL'si</small>
                                        </div>

                                        <div className="mb-3">
                                            <label className="form-label">Favicon</label>
                                            <input
                                                type="text"
                                                className={`form-control ${errors.company_favicon ? 'is-invalid' : ''}`}
                                                value={data.company_favicon}
                                                onChange={(e) => setData('company_favicon', e.target.value)}
                                                placeholder="/images/favicon.ico"
                                            />
                                            {errors.company_favicon && <div className="invalid-feedback">{errors.company_favicon}</div>}
                                            <small className="text-muted">Favicon dosyasının yolu veya URL'si</small>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Right Column */}
                            <div className="col-lg-6">
                                {/* Tax & Legal Information */}
                                <div className="card">
                                    <div className="card-header">
                                        <h5 className="card-title mb-0">
                                            <i className="fas fa-file-invoice me-2"></i>
                                            Vergi ve Yasal Bilgiler
                                        </h5>
                                    </div>
                                    <div className="card-body">
                                        <div className="mb-3">
                                            <label className="form-label">Vergi Dairesi</label>
                                            <input
                                                type="text"
                                                className={`form-control ${errors.tax_office ? 'is-invalid' : ''}`}
                                                value={data.tax_office}
                                                onChange={(e) => setData('tax_office', e.target.value)}
                                            />
                                            {errors.tax_office && <div className="invalid-feedback">{errors.tax_office}</div>}
                                        </div>

                                        <div className="mb-3">
                                            <label className="form-label">Vergi Numarası</label>
                                            <input
                                                type="text"
                                                className={`form-control ${errors.tax_number ? 'is-invalid' : ''}`}
                                                value={data.tax_number}
                                                onChange={(e) => setData('tax_number', e.target.value)}
                                            />
                                            {errors.tax_number && <div className="invalid-feedback">{errors.tax_number}</div>}
                                        </div>

                                        <div className="mb-3">
                                            <label className="form-label">Ticaret Sicil Numarası</label>
                                            <input
                                                type="text"
                                                className={`form-control ${errors.trade_registry_number ? 'is-invalid' : ''}`}
                                                value={data.trade_registry_number}
                                                onChange={(e) => setData('trade_registry_number', e.target.value)}
                                            />
                                            {errors.trade_registry_number && <div className="invalid-feedback">{errors.trade_registry_number}</div>}
                                        </div>

                                        <div className="mb-3">
                                            <label className="form-label">MERSİS Numarası</label>
                                            <input
                                                type="text"
                                                className={`form-control ${errors.mersis_number ? 'is-invalid' : ''}`}
                                                value={data.mersis_number}
                                                onChange={(e) => setData('mersis_number', e.target.value)}
                                            />
                                            {errors.mersis_number && <div className="invalid-feedback">{errors.mersis_number}</div>}
                                            <small className="text-muted">Merkezi Sicil Kayıt Sistemi numarası</small>
                                        </div>
                                    </div>
                                </div>

                                {/* Bank Information */}
                                <div className="card">
                                    <div className="card-header">
                                        <h5 className="card-title mb-0">
                                            <i className="fas fa-university me-2"></i>
                                            Banka Bilgileri
                                        </h5>
                                    </div>
                                    <div className="card-body">
                                        <div className="mb-3">
                                            <label className="form-label">Banka Adı</label>
                                            <input
                                                type="text"
                                                className={`form-control ${errors.bank_name ? 'is-invalid' : ''}`}
                                                value={data.bank_name}
                                                onChange={(e) => setData('bank_name', e.target.value)}
                                            />
                                            {errors.bank_name && <div className="invalid-feedback">{errors.bank_name}</div>}
                                        </div>

                                        <div className="mb-3">
                                            <label className="form-label">Şube</label>
                                            <input
                                                type="text"
                                                className={`form-control ${errors.bank_branch ? 'is-invalid' : ''}`}
                                                value={data.bank_branch}
                                                onChange={(e) => setData('bank_branch', e.target.value)}
                                            />
                                            {errors.bank_branch && <div className="invalid-feedback">{errors.bank_branch}</div>}
                                        </div>

                                        <div className="mb-3">
                                            <label className="form-label">Hesap Adı</label>
                                            <input
                                                type="text"
                                                className={`form-control ${errors.bank_account_name ? 'is-invalid' : ''}`}
                                                value={data.bank_account_name}
                                                onChange={(e) => setData('bank_account_name', e.target.value)}
                                            />
                                            {errors.bank_account_name && <div className="invalid-feedback">{errors.bank_account_name}</div>}
                                        </div>

                                        <div className="mb-3">
                                            <label className="form-label">Hesap Numarası</label>
                                            <input
                                                type="text"
                                                className={`form-control ${errors.bank_account_number ? 'is-invalid' : ''}`}
                                                value={data.bank_account_number}
                                                onChange={(e) => setData('bank_account_number', e.target.value)}
                                            />
                                            {errors.bank_account_number && <div className="invalid-feedback">{errors.bank_account_number}</div>}
                                        </div>

                                        <div className="mb-3">
                                            <label className="form-label">IBAN</label>
                                            <input
                                                type="text"
                                                className={`form-control ${errors.iban ? 'is-invalid' : ''}`}
                                                value={data.iban}
                                                onChange={(e) => setData('iban', e.target.value)}
                                                placeholder="TR00 0000 0000 0000 0000 0000 00"
                                            />
                                            {errors.iban && <div className="invalid-feedback">{errors.iban}</div>}
                                        </div>

                                        <div className="mb-3">
                                            <label className="form-label">SWIFT Kodu</label>
                                            <input
                                                type="text"
                                                className={`form-control ${errors.swift_code ? 'is-invalid' : ''}`}
                                                value={data.swift_code}
                                                onChange={(e) => setData('swift_code', e.target.value)}
                                            />
                                            {errors.swift_code && <div className="invalid-feedback">{errors.swift_code}</div>}
                                            <small className="text-muted">Uluslararası ödemeler için gereklidir</small>
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
                                            Bu bilgiler faturalar, teklif belgeleri ve raporlar üzerinde görünecektir.
                                        </p>
                                        <p className="mb-2">
                                            <i className="fas fa-check text-success me-2"></i>
                                            MERSİS numarası e-Fatura sistemi için gereklidir.
                                        </p>
                                        <p className="mb-2">
                                            <i className="fas fa-check text-success me-2"></i>
                                            Banka bilgileri müşterilere gönderilen faturalarda yer alır.
                                        </p>
                                        <p className="mb-0">
                                            <i className="fas fa-check text-success me-2"></i>
                                            Logo ve favicon ayarları tüm sistem genelinde kullanılacaktır.
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
