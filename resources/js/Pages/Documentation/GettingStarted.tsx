import React, { useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import Layout from '../../Layouts';

interface Step {
    id: number;
    title: string;
    description: string;
    icon: string;
    details: string[];
}

const steps: Step[] = [
    {
        id: 1,
        title: 'Sisteme Giriş Yapın',
        description: 'Kullanıcı adınız ve şifrenizle sisteme giriş yapın.',
        icon: 'ri-login-box-line',
        details: [
            'Tarayıcınızın adres çubuğuna sistem adresinizi yazın',
            'Kullanıcı adınızı (e-posta) girin',
            'Şifrenizi girin ve "Giriş Yap" butonuna tıklayın',
            '"Beni Hatırla" seçeneğini işaretlerseniz bir sonraki girişte bilgileriniz hatırlanır'
        ]
    },
    {
        id: 2,
        title: 'Dashboard\'u Tanıyın',
        description: 'Ana sayfada önemli metrikleri ve hızlı erişim alanlarını inceleyin.',
        icon: 'ri-dashboard-3-line',
        details: [
            'Satış özeti ve günlük ciro bilgilerini görün',
            'Bekleyen siparişler ve onay gerektiren işlemler',
            'Stok uyarıları ve kritik seviyeler',
            'Son aktiviteler ve bildirimler'
        ]
    },
    {
        id: 3,
        title: 'Sol Menü ile Gezinin',
        description: 'Yan menüden tüm modüllere erişebilirsiniz.',
        icon: 'ri-menu-line',
        details: [
            'Satış Yönetimi: Sipariş, teklif, fatura işlemleri',
            'Stok & Depo: Stok takibi ve depo operasyonları',
            'CRM: Müşteri ilişkileri ve lead yönetimi',
            'Muhasebe: Cari kartlar, tahsilat ve ödemeler',
            'Raporlar: Detaylı analiz ve raporlama araçları'
        ]
    },
    {
        id: 4,
        title: 'Profil Ayarlarınızı Yapın',
        description: 'Sağ üst köşedeki profil menüsünden kişisel ayarlarınızı yapın.',
        icon: 'ri-user-settings-line',
        details: [
            'Profil fotoğrafınızı yükleyin',
            'İletişim bilgilerinizi güncelleyin',
            'Bildirim tercihlerinizi ayarlayın',
            'Şifrenizi değiştirin'
        ]
    }
];

const shortcuts = [
    { key: 'Ctrl + S', description: 'Formlarda kaydetme işlemi' },
    { key: 'Ctrl + N', description: 'Yeni kayıt oluşturma' },
    { key: 'Ctrl + F', description: 'Sayfada arama' },
    { key: 'Esc', description: 'Modal/Dialog kapatma' },
    { key: 'Enter', description: 'Formu gönderme/Onaylama' }
];

export default function GettingStarted() {
    const [activeStep, setActiveStep] = useState(1);

    return (
        <Layout>
            <Head title="Hızlı Başlangıç - Yardım" />
            <div className="page-content">
                <div className="container-fluid">
                    {/* Page Header */}
                    <div className="row">
                        <div className="col-12">
                            <div className="page-title-box d-sm-flex align-items-center justify-content-between">
                                <h4 className="mb-sm-0">Hızlı Başlangıç Rehberi</h4>
                                <div className="page-title-right">
                                    <ol className="breadcrumb m-0">
                                        <li className="breadcrumb-item">
                                            <Link href={route('dashboard')}>Dashboard</Link>
                                        </li>
                                        <li className="breadcrumb-item">
                                            <Link href="/documentation">Yardım</Link>
                                        </li>
                                        <li className="breadcrumb-item active">Hızlı Başlangıç</li>
                                    </ol>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Welcome Banner */}
                    <div className="row mb-4">
                        <div className="col-12">
                            <div className="card bg-success bg-gradient">
                                <div className="card-body py-4">
                                    <div className="d-flex align-items-center">
                                        <div className="flex-shrink-0">
                                            <i className="ri-rocket-2-line text-white" style={{ fontSize: '60px' }}></i>
                                        </div>
                                        <div className="flex-grow-1 ms-4">
                                            <h3 className="text-white mb-2">ASKOM ERP'ye Hoşgeldiniz!</h3>
                                            <p className="text-white-75 mb-0 fs-5">
                                                Bu rehber, sistemi hızlı bir şekilde kullanmaya başlamanız için hazırlanmıştır.
                                                Adım adım talimatları takip ederek ERP sisteminde ustalaşın.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="row">
                        {/* Step Navigation */}
                        <div className="col-lg-4">
                            <div className="card sticky-top" style={{ top: '100px' }}>
                                <div className="card-header">
                                    <h5 className="card-title mb-0">
                                        <i className="ri-list-ordered me-2"></i>
                                        İlk Adımlar
                                    </h5>
                                </div>
                                <div className="card-body p-0">
                                    <div className="list-group list-group-flush">
                                        {steps.map((step) => (
                                            <button
                                                key={step.id}
                                                className={`list-group-item list-group-item-action d-flex align-items-center ${activeStep === step.id ? 'active' : ''}`}
                                                onClick={() => setActiveStep(step.id)}
                                            >
                                                <div className={`avatar-sm flex-shrink-0 me-3`}>
                                                    <div className={`avatar-title rounded-circle ${activeStep === step.id ? 'bg-white text-primary' : 'bg-primary-subtle text-primary'}`}>
                                                        {step.id}
                                                    </div>
                                                </div>
                                                <div className="flex-grow-1">
                                                    <h6 className={`mb-0 ${activeStep === step.id ? 'text-white' : ''}`}>
                                                        {step.title}
                                                    </h6>
                                                </div>
                                                <i className={`ri-arrow-right-s-line ${activeStep === step.id ? 'text-white' : 'text-muted'}`}></i>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Step Content */}
                        <div className="col-lg-8">
                            {steps.map((step) => (
                                <div key={step.id} className={`card ${activeStep === step.id ? '' : 'd-none'}`}>
                                    <div className="card-body">
                                        <div className="d-flex align-items-center mb-4">
                                            <div className="avatar-md flex-shrink-0">
                                                <div className="avatar-title bg-primary-subtle text-primary rounded-circle fs-2">
                                                    <i className={step.icon}></i>
                                                </div>
                                            </div>
                                            <div className="flex-grow-1 ms-3">
                                                <h4 className="mb-1">Adım {step.id}: {step.title}</h4>
                                                <p className="text-muted mb-0">{step.description}</p>
                                            </div>
                                        </div>

                                        <div className="alert alert-soft-primary">
                                            <h6 className="alert-heading">
                                                <i className="ri-information-line me-2"></i>
                                                Detaylı Talimatlar
                                            </h6>
                                            <ul className="mb-0 ps-3">
                                                {step.details.map((detail, idx) => (
                                                    <li key={idx} className="mb-2">{detail}</li>
                                                ))}
                                            </ul>
                                        </div>

                                        {/* Navigation buttons */}
                                        <div className="d-flex justify-content-between mt-4">
                                            <button
                                                className="btn btn-outline-primary"
                                                onClick={() => setActiveStep(Math.max(1, activeStep - 1))}
                                                disabled={activeStep === 1}
                                            >
                                                <i className="ri-arrow-left-line me-1"></i>
                                                Önceki Adım
                                            </button>
                                            {activeStep < steps.length ? (
                                                <button
                                                    className="btn btn-primary"
                                                    onClick={() => setActiveStep(activeStep + 1)}
                                                >
                                                    Sonraki Adım
                                                    <i className="ri-arrow-right-line ms-1"></i>
                                                </button>
                                            ) : (
                                                <Link href="/documentation" className="btn btn-success">
                                                    <i className="ri-check-line me-1"></i>
                                                    Tamamla ve Dokümanlara Dön
                                                </Link>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}

                            {/* Keyboard Shortcuts */}
                            <div className="card mt-4">
                                <div className="card-header">
                                    <h5 className="card-title mb-0">
                                        <i className="ri-keyboard-line me-2"></i>
                                        Klavye Kısayolları
                                    </h5>
                                </div>
                                <div className="card-body">
                                    <div className="table-responsive">
                                        <table className="table table-bordered mb-0">
                                            <thead className="table-light">
                                                <tr>
                                                    <th style={{ width: '150px' }}>Kısayol</th>
                                                    <th>İşlem</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {shortcuts.map((shortcut, idx) => (
                                                    <tr key={idx}>
                                                        <td>
                                                            <kbd className="bg-dark">{shortcut.key}</kbd>
                                                        </td>
                                                        <td>{shortcut.description}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>

                            {/* Tips */}
                            <div className="card mt-4">
                                <div className="card-header">
                                    <h5 className="card-title mb-0">
                                        <i className="ri-lightbulb-line me-2 text-warning"></i>
                                        Faydalı İpuçları
                                    </h5>
                                </div>
                                <div className="card-body">
                                    <div className="row g-3">
                                        <div className="col-md-6">
                                            <div className="d-flex">
                                                <div className="flex-shrink-0">
                                                    <i className="ri-checkbox-circle-line text-success fs-4"></i>
                                                </div>
                                                <div className="flex-grow-1 ms-2">
                                                    <h6 className="mb-1">Filtreleri Kullanın</h6>
                                                    <p className="text-muted mb-0 small">
                                                        Liste sayfalarında filtre seçeneklerini kullanarak aradığınız kayıtlara hızla ulaşın.
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="col-md-6">
                                            <div className="d-flex">
                                                <div className="flex-shrink-0">
                                                    <i className="ri-checkbox-circle-line text-success fs-4"></i>
                                                </div>
                                                <div className="flex-grow-1 ms-2">
                                                    <h6 className="mb-1">Bildirimleri Takip Edin</h6>
                                                    <p className="text-muted mb-0 small">
                                                        Sağ üst köşedeki bildirim ikonundan önemli güncellemeleri takip edin.
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="col-md-6">
                                            <div className="d-flex">
                                                <div className="flex-shrink-0">
                                                    <i className="ri-checkbox-circle-line text-success fs-4"></i>
                                                </div>
                                                <div className="flex-grow-1 ms-2">
                                                    <h6 className="mb-1">Hızlı Erişim Menüsünü Kullanın</h6>
                                                    <p className="text-muted mb-0 small">
                                                        Sık kullandığınız işlemlere Dashboard'daki hızlı erişim butonlarından ulaşın.
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="col-md-6">
                                            <div className="d-flex">
                                                <div className="flex-shrink-0">
                                                    <i className="ri-checkbox-circle-line text-success fs-4"></i>
                                                </div>
                                                <div className="flex-grow-1 ms-2">
                                                    <h6 className="mb-1">Excel Dışarı Aktarma</h6>
                                                    <p className="text-muted mb-0 small">
                                                        Çoğu liste sayfasında verileri Excel'e aktarabilirsiniz.
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Related Topics */}
                    <div className="row mt-4">
                        <div className="col-12">
                            <div className="card">
                                <div className="card-header">
                                    <h5 className="card-title mb-0">
                                        <i className="ri-book-mark-line me-2"></i>
                                        İlgili Konular
                                    </h5>
                                </div>
                                <div className="card-body">
                                    <div className="row g-3">
                                        <div className="col-md-3">
                                            <Link href="/documentation/sales-management" className="card card-body bg-light-subtle text-center text-decoration-none hover-shadow">
                                                <i className="ri-shopping-cart-line fs-1 text-success mb-2"></i>
                                                <h6>Satış Yönetimi</h6>
                                            </Link>
                                        </div>
                                        <div className="col-md-3">
                                            <Link href="/documentation/current-accounts" className="card card-body bg-light-subtle text-center text-decoration-none hover-shadow">
                                                <i className="ri-user-3-line fs-1 text-info mb-2"></i>
                                                <h6>Cari Kartlar</h6>
                                            </Link>
                                        </div>
                                        <div className="col-md-3">
                                            <Link href="/documentation/stock-management" className="card card-body bg-light-subtle text-center text-decoration-none hover-shadow">
                                                <i className="ri-stack-line fs-1 text-warning mb-2"></i>
                                                <h6>Stok Yönetimi</h6>
                                            </Link>
                                        </div>
                                        <div className="col-md-3">
                                            <Link href="/documentation/faq" className="card card-body bg-light-subtle text-center text-decoration-none hover-shadow">
                                                <i className="ri-question-line fs-1 text-danger mb-2"></i>
                                                <h6>SSS</h6>
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
                .hover-shadow:hover {
                    box-shadow: 0 0.25rem 0.5rem rgba(0, 0, 0, 0.1);
                    transform: translateY(-2px);
                    transition: all 0.2s ease;
                }
            `}</style>
        </Layout>
    );
}
