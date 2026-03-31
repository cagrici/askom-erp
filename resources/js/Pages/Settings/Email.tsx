import React, { useState } from 'react';
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

export default function Email({ settings }: Props) {
    const { data, setData, post, processing, errors } = useForm({
        mail_driver: settings.mail_driver?.value || 'smtp',
        mail_host: settings.mail_host?.value || '',
        mail_port: settings.mail_port?.value || 587,
        mail_username: settings.mail_username?.value || '',
        mail_password: settings.mail_password?.value || '',
        mail_encryption: settings.mail_encryption?.value || 'tls',
        mail_from_address: settings.mail_from_address?.value || '',
        mail_from_name: settings.mail_from_name?.value || '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('settings.email.update'), {
            preserveScroll: true,
        });
    };

    return (
        <Layout>
            <Head title="E-posta Ayarları" />
            <div className="page-content">
                <div className="container-fluid">
                    {/* Page Title */}
                    <div className="row">
                        <div className="col-12">
                            <div className="page-title-box d-sm-flex align-items-center justify-content-between">
                                <h4 className="mb-sm-0">E-posta Ayarları</h4>
                                <div className="page-title-right">
                                    <ol className="breadcrumb m-0">
                                        <li className="breadcrumb-item">
                                            <Link href={route('dashboard')}>Dashboard</Link>
                                        </li>
                                        <li className="breadcrumb-item">Ayarlar</li>
                                        <li className="breadcrumb-item active">E-posta</li>
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
                                                className="nav-link active"
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
                            {/* SMTP Configuration */}
                            <div className="col-lg-8">
                                <div className="card">
                                    <div className="card-header">
                                        <h5 className="card-title mb-0">
                                            <i className="fas fa-server me-2"></i>
                                            SMTP Sunucu Ayarları
                                        </h5>
                                    </div>
                                    <div className="card-body">
                                        <div className="mb-3">
                                            <label className="form-label">E-posta Sürücüsü <span className="text-danger">*</span></label>
                                            <select
                                                className={`form-select ${errors.mail_driver ? 'is-invalid' : ''}`}
                                                value={data.mail_driver}
                                                onChange={(e) => setData('mail_driver', e.target.value)}
                                            >
                                                <option value="smtp">SMTP</option>
                                                <option value="sendmail">Sendmail</option>
                                                <option value="mailgun">Mailgun</option>
                                                <option value="ses">Amazon SES</option>
                                                <option value="postmark">Postmark</option>
                                            </select>
                                            {errors.mail_driver && <div className="invalid-feedback">{errors.mail_driver}</div>}
                                        </div>

                                        <div className="row">
                                            <div className="col-md-8 mb-3">
                                                <label className="form-label">SMTP Sunucusu</label>
                                                <input
                                                    type="text"
                                                    className={`form-control ${errors.mail_host ? 'is-invalid' : ''}`}
                                                    value={data.mail_host}
                                                    onChange={(e) => setData('mail_host', e.target.value)}
                                                    placeholder="smtp.gmail.com"
                                                />
                                                {errors.mail_host && <div className="invalid-feedback">{errors.mail_host}</div>}
                                            </div>

                                            <div className="col-md-4 mb-3">
                                                <label className="form-label">Port</label>
                                                <input
                                                    type="number"
                                                    className={`form-control ${errors.mail_port ? 'is-invalid' : ''}`}
                                                    value={data.mail_port}
                                                    onChange={(e) => setData('mail_port', parseInt(e.target.value))}
                                                    placeholder="587"
                                                />
                                                {errors.mail_port && <div className="invalid-feedback">{errors.mail_port}</div>}
                                            </div>
                                        </div>

                                        <div className="mb-3">
                                            <label className="form-label">Kullanıcı Adı / E-posta</label>
                                            <input
                                                type="text"
                                                className={`form-control ${errors.mail_username ? 'is-invalid' : ''}`}
                                                value={data.mail_username}
                                                onChange={(e) => setData('mail_username', e.target.value)}
                                                placeholder="your-email@gmail.com"
                                            />
                                            {errors.mail_username && <div className="invalid-feedback">{errors.mail_username}</div>}
                                        </div>

                                        <div className="mb-3">
                                            <label className="form-label">Şifre / Uygulama Şifresi</label>
                                            <input
                                                type="password"
                                                className={`form-control ${errors.mail_password ? 'is-invalid' : ''}`}
                                                value={data.mail_password}
                                                onChange={(e) => setData('mail_password', e.target.value)}
                                                placeholder="••••••••••••"
                                            />
                                            {errors.mail_password && <div className="invalid-feedback">{errors.mail_password}</div>}
                                            <small className="text-muted">Gmail kullanıyorsanız, uygulama şifresi oluşturmanız gerekebilir.</small>
                                        </div>

                                        <div className="mb-3">
                                            <label className="form-label">Şifreleme</label>
                                            <select
                                                className={`form-select ${errors.mail_encryption ? 'is-invalid' : ''}`}
                                                value={data.mail_encryption}
                                                onChange={(e) => setData('mail_encryption', e.target.value)}
                                            >
                                                <option value="">Yok</option>
                                                <option value="tls">TLS (587)</option>
                                                <option value="ssl">SSL (465)</option>
                                            </select>
                                            {errors.mail_encryption && <div className="invalid-feedback">{errors.mail_encryption}</div>}
                                        </div>
                                    </div>
                                </div>

                                {/* Sender Information */}
                                <div className="card">
                                    <div className="card-header">
                                        <h5 className="card-title mb-0">
                                            <i className="fas fa-paper-plane me-2"></i>
                                            Gönderen Bilgileri
                                        </h5>
                                    </div>
                                    <div className="card-body">
                                        <div className="mb-3">
                                            <label className="form-label">Gönderen E-posta <span className="text-danger">*</span></label>
                                            <input
                                                type="email"
                                                className={`form-control ${errors.mail_from_address ? 'is-invalid' : ''}`}
                                                value={data.mail_from_address}
                                                onChange={(e) => setData('mail_from_address', e.target.value)}
                                                placeholder="noreply@yourcompany.com"
                                            />
                                            {errors.mail_from_address && <div className="invalid-feedback">{errors.mail_from_address}</div>}
                                            <small className="text-muted">Sistemden gönderilen e-postalarda görünecek adres</small>
                                        </div>

                                        <div className="mb-3">
                                            <label className="form-label">Gönderen Adı <span className="text-danger">*</span></label>
                                            <input
                                                type="text"
                                                className={`form-control ${errors.mail_from_name ? 'is-invalid' : ''}`}
                                                value={data.mail_from_name}
                                                onChange={(e) => setData('mail_from_name', e.target.value)}
                                                placeholder="Your Company Name"
                                            />
                                            {errors.mail_from_name && <div className="invalid-feedback">{errors.mail_from_name}</div>}
                                            <small className="text-muted">Sistemden gönderilen e-postalarda görünecek isim</small>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Info and Help */}
                            <div className="col-lg-4">
                                <div className="card border-info">
                                    <div className="card-body">
                                        <h5 className="card-title text-info">
                                            <i className="fas fa-info-circle me-2"></i>
                                            Bilgi
                                        </h5>
                                        <p className="mb-2">
                                            <strong>SMTP Nedir?</strong>
                                        </p>
                                        <p className="mb-3 small">
                                            SMTP (Simple Mail Transfer Protocol), e-posta gönderme protokolüdür. Sistemden otomatik e-posta göndermek için gereklidir.
                                        </p>

                                        <p className="mb-2">
                                            <strong>Popüler SMTP Ayarları:</strong>
                                        </p>

                                        <div className="mb-3">
                                            <p className="mb-1 small"><strong>Gmail</strong></p>
                                            <ul className="small mb-2">
                                                <li>Sunucu: smtp.gmail.com</li>
                                                <li>Port: 587 (TLS) veya 465 (SSL)</li>
                                                <li>Uygulama şifresi gerekir</li>
                                            </ul>

                                            <p className="mb-1 small"><strong>Outlook/Office 365</strong></p>
                                            <ul className="small mb-2">
                                                <li>Sunucu: smtp.office365.com</li>
                                                <li>Port: 587 (TLS)</li>
                                            </ul>

                                            <p className="mb-1 small"><strong>Yahoo</strong></p>
                                            <ul className="small mb-0">
                                                <li>Sunucu: smtp.mail.yahoo.com</li>
                                                <li>Port: 587 (TLS) veya 465 (SSL)</li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>

                                <div className="card border-warning">
                                    <div className="card-body">
                                        <h5 className="card-title text-warning">
                                            <i className="fas fa-exclamation-triangle me-2"></i>
                                            Önemli Notlar
                                        </h5>
                                        <ul className="mb-0 small">
                                            <li className="mb-2">
                                                <strong>Gmail Kullanıcıları:</strong> "Güvenliği düşük uygulamalara izin ver" seçeneğini açmanız veya uygulama şifresi oluşturmanız gerekebilir.
                                            </li>
                                            <li className="mb-2">
                                                <strong>2FA Aktif ise:</strong> Uygulama şifresi kullanmanız zorunludur.
                                            </li>
                                            <li className="mb-0">
                                                <strong>Test Etme:</strong> Ayarları kaydettikten sonra test e-postası göndererek kontrol edin.
                                            </li>
                                        </ul>
                                    </div>
                                </div>

                                <div className="card bg-success-subtle">
                                    <div className="card-body">
                                        <h5 className="card-title text-success">
                                            <i className="fas fa-lightbulb me-2"></i>
                                            İpucu
                                        </h5>
                                        <p className="mb-0 small">
                                            Profesyonel kullanım için SendGrid, Mailgun veya Amazon SES gibi özel e-posta servisleri kullanmanızı öneririz. Bu servisler daha yüksek gönderim limitleri ve daha iyi teslimat oranları sunar.
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
                                                onClick={() => router.visit(route('settings.general'))}
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
