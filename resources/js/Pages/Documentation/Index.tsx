import React, { useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import Layout from '../../Layouts';

interface ModuleCard {
    id: string;
    title: string;
    description: string;
    icon: string;
    color: string;
    link: string;
    features: string[];
}

const modules: ModuleCard[] = [
    {
        id: 'getting-started',
        title: 'Hızlı Başlangıç',
        description: 'ASKOM ERP sistemine ilk adımlarınızı atın. Temel kavramları ve iş akışlarını öğrenin.',
        icon: 'ri-rocket-line',
        color: 'primary',
        link: '/documentation/getting-started',
        features: ['Sistem Girişi', 'Dashboard Kullanımı', 'Temel Navigasyon', 'Profil Ayarları']
    },
    {
        id: 'sales',
        title: 'Satış Yönetimi',
        description: 'Sipariş, teklif, fatura ve iade işlemlerini yönetin. Satış analitiğini takip edin.',
        icon: 'ri-shopping-cart-line',
        color: 'success',
        link: '/documentation/sales-management',
        features: ['Siparişler', 'Teklifler', 'Faturalar', 'İadeler', 'Kampanyalar']
    },
    {
        id: 'crm',
        title: 'CRM - Müşteri İlişkileri',
        description: 'Potansiyel müşterileri, aktiviteleri ve satış pipeline\'ını yönetin.',
        icon: 'ri-customer-service-line',
        color: 'info',
        link: '/documentation/crm',
        features: ['Lead Yönetimi', 'Pipeline Takibi', 'Aktiviteler', 'Görevler']
    },
    {
        id: 'stock',
        title: 'Stok Yönetimi',
        description: 'Stok seviyelerini, hareketleri ve transferleri takip edin.',
        icon: 'ri-stack-line',
        color: 'warning',
        link: '/documentation/stock-management',
        features: ['Stok Listesi', 'Stok Hareketleri', 'Stok Düzeltme', 'Transfer İşlemleri']
    },
    {
        id: 'warehouse',
        title: 'Depo Yönetimi',
        description: 'Depo operasyonlarını, bölgeleri ve lokasyonları yönetin.',
        icon: 'ri-building-line',
        color: 'danger',
        link: '/documentation/warehouse-management',
        features: ['Depo Tanımları', 'Bölge ve Lokasyonlar', 'Mal Kabul', 'Kalite Kontrol']
    },
    {
        id: 'shipping',
        title: 'Sevkiyat & Lojistik',
        description: 'Sevk emirleri, teslimat takibi ve filo yönetimi işlemlerini gerçekleştirin.',
        icon: 'ri-truck-line',
        color: 'secondary',
        link: '/documentation/shipping',
        features: ['Sevk Emirleri', 'Teslimat Takibi', 'Araç Yönetimi', 'Rota Planlama']
    },
    {
        id: 'products',
        title: 'Ürün Yönetimi',
        description: 'Ürünleri, kategorileri, markaları ve varyantları yönetin.',
        icon: 'ri-archive-line',
        color: 'primary',
        link: '/documentation/product-management',
        features: ['Ürün Tanımları', 'Kategoriler', 'Varyantlar', 'Barkod Yönetimi']
    },
    {
        id: 'current-accounts',
        title: 'Cari Kartlar',
        description: 'Müşteri ve tedarikçi hesaplarını, bakiyelerini ve hareketlerini takip edin.',
        icon: 'ri-user-3-line',
        color: 'success',
        link: '/documentation/current-accounts',
        features: ['Cari Tanımları', 'Bakiye Takibi', 'Ekstre Raporları', 'Adres Yönetimi']
    },
    {
        id: 'purchasing',
        title: 'Satın Alma',
        description: 'Satın alma siparişleri, tedarikçi teklifleri ve sözleşmeleri yönetin.',
        icon: 'ri-shopping-bag-line',
        color: 'info',
        link: '/documentation/purchasing',
        features: ['Satın Alma Siparişleri', 'Talepler', 'Tedarikçi Yönetimi', 'Sözleşmeler']
    },
    {
        id: 'accounting',
        title: 'Muhasebe & Finans',
        description: 'Tahsilat, ödeme, banka hesapları ve masraf yönetimi işlemlerini gerçekleştirin.',
        icon: 'ri-calculator-line',
        color: 'warning',
        link: '/documentation/accounting',
        features: ['Tahsilatlar', 'Ödemeler', 'Banka Hesapları', 'Masraf Yönetimi']
    },
    {
        id: 'reports',
        title: 'Raporlama',
        description: 'Satış, stok, mali ve performans raporlarını oluşturun ve analiz edin.',
        icon: 'ri-bar-chart-line',
        color: 'danger',
        link: '/documentation/reports',
        features: ['Satış Raporları', 'Stok Raporları', 'Mali Raporlar', 'Özel Raporlar']
    },
    {
        id: 'settings',
        title: 'Sistem Ayarları',
        description: 'Kullanıcı, rol, yetki ve genel sistem ayarlarını yapılandırın.',
        icon: 'ri-settings-3-line',
        color: 'secondary',
        link: '/documentation/settings',
        features: ['Kullanıcı Yönetimi', 'Rol ve Yetkiler', 'Genel Ayarlar', 'Entegrasyonlar']
    }
];

const quickLinks = [
    { title: 'İlk Siparişi Nasıl Oluştururum?', link: '/documentation/sales-management#create-order', icon: 'ri-add-circle-line' },
    { title: 'Yeni Müşteri Nasıl Eklenir?', link: '/documentation/current-accounts#create-customer', icon: 'ri-user-add-line' },
    { title: 'Stok Transferi Nasıl Yapılır?', link: '/documentation/stock-management#transfer', icon: 'ri-exchange-line' },
    { title: 'Teklif PDF\'i Nasıl Oluşturulur?', link: '/documentation/sales-management#offer-pdf', icon: 'ri-file-pdf-line' },
    { title: 'Depo Bölgesi Nasıl Tanımlanır?', link: '/documentation/warehouse-management#zones', icon: 'ri-layout-grid-line' },
    { title: 'Kullanıcı Yetkisi Nasıl Verilir?', link: '/documentation/settings#permissions', icon: 'ri-shield-user-line' },
];

export default function Index() {
    const [searchQuery, setSearchQuery] = useState('');

    const filteredModules = modules.filter(module =>
        module.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        module.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        module.features.some(f => f.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    return (
        <Layout>
            <Head title="Yardım & Eğitim Portalı" />
            <div className="page-content">
                <div className="container-fluid">
                    {/* Hero Section */}
                    <div className="row mb-4">
                        <div className="col-12">
                            <div className="card bg-primary bg-gradient">
                                <div className="card-body py-5">
                                    <div className="row align-items-center">
                                        <div className="col-lg-8">
                                            <h1 className="text-white mb-3">
                                                <i className="ri-book-open-line me-3"></i>
                                                ASKOM ERP Yardım & Eğitim Portalı
                                            </h1>
                                            <p className="text-white-75 fs-5 mb-4 text-white">
                                                ERP sisteminizi en verimli şekilde kullanmanız için hazırlanmış kapsamlı
                                                eğitim ve yardım dokümanları. Adım adım rehberler, video eğitimler ve
                                                sıkça sorulan sorular ile hızlı bir şekilde sistemde uzmanlaşın.
                                            </p>
                                            <div className="d-flex gap-3 flex-wrap">
                                                <Link href="/documentation/getting-started" className="btn btn-light btn-lg">
                                                    <i className="ri-play-circle-line me-2"></i>
                                                    Hızlı Başla
                                                </Link>
                                                <Link href="/documentation/faq" className="btn btn-outline-light btn-lg">
                                                    <i className="ri-question-line me-2"></i>
                                                    SSS
                                                </Link>
                                            </div>
                                        </div>
                                        <div className="col-lg-4 text-center d-none d-lg-block">
                                            <i className="ri-customer-service-2-line text-white-50" style={{ fontSize: '180px' }}></i>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Search Box */}
                    <div className="row mb-4">
                        <div className="col-lg-8 mx-auto">
                            <div className="card shadow-sm">
                                <div className="card-body">
                                    <div className="input-group input-group-lg">
                                        <span className="input-group-text bg-white border-end-0">
                                            <i className="ri-search-line text-muted"></i>
                                        </span>
                                        <input
                                            type="text"
                                            className="form-control border-start-0"
                                            placeholder="Yardım konusu arayın... (örnek: sipariş, stok, fatura)"
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div className="row mb-4">
                        <div className="col-12">
                            <div className="card">
                                <div className="card-header">
                                    <h5 className="card-title mb-0">
                                        <i className="ri-flashlight-line me-2 text-warning"></i>
                                        Hızlı Erişim
                                    </h5>
                                </div>
                                <div className="card-body">
                                    <div className="row g-3">
                                        {quickLinks.map((link, index) => (
                                            <div key={index} className="col-lg-4 col-md-6">
                                                <Link href={link.link} className="d-block p-3 rounded bg-light-subtle border text-decoration-none hover-shadow">
                                                    <div className="d-flex align-items-center">
                                                        <div className="flex-shrink-0">
                                                            <div className="avatar-sm">
                                                                <div className="avatar-title bg-primary-subtle text-primary rounded">
                                                                    <i className={`${link.icon} fs-5`}></i>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="flex-grow-1 ms-3">
                                                            <span className="text-body">{link.title}</span>
                                                        </div>
                                                        <div className="flex-shrink-0">
                                                            <i className="ri-arrow-right-s-line text-muted"></i>
                                                        </div>
                                                    </div>
                                                </Link>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Module Cards */}
                    <div className="row mb-4">
                        <div className="col-12">
                            <h4 className="mb-3">
                                <i className="ri-book-2-line me-2"></i>
                                Modül Dokümanları
                            </h4>
                        </div>
                    </div>

                    <div className="row g-4">
                        {filteredModules.map((module) => (
                            <div key={module.id} className="col-xl-4 col-lg-6">
                                <div className="card h-100 card-hover">
                                    <div className="card-body">
                                        <div className="d-flex align-items-center mb-3">
                                            <div className={`avatar-md flex-shrink-0`}>
                                                <div className={`avatar-title bg-${module.color}-subtle text-${module.color} rounded-circle fs-3`}>
                                                    <i className={module.icon}></i>
                                                </div>
                                            </div>
                                            <div className="ms-3 flex-grow-1">
                                                <h5 className="card-title mb-1">{module.title}</h5>
                                                <span className={`badge bg-${module.color}-subtle text-${module.color}`}>
                                                    {module.features.length} Konu
                                                </span>
                                            </div>
                                        </div>
                                        <p className="text-muted mb-3">{module.description}</p>
                                        <div className="mb-3">
                                            {module.features.map((feature, idx) => (
                                                <span key={idx} className="badge bg-light text-dark me-1 mb-1">
                                                    {feature}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="card-footer bg-transparent border-top">
                                        <Link href={module.link} className={`btn btn-${module.color} btn-sm w-100`}>
                                            <i className="ri-book-read-line me-1"></i>
                                            Dokümantasyonu Gör
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* No Results */}
                    {filteredModules.length === 0 && (
                        <div className="row">
                            <div className="col-12">
                                <div className="card">
                                    <div className="card-body text-center py-5">
                                        <i className="ri-search-line text-muted" style={{ fontSize: '60px' }}></i>
                                        <h5 className="mt-3">Sonuç Bulunamadı</h5>
                                        <p className="text-muted">"{searchQuery}" ile eşleşen bir yardım konusu bulunamadı.</p>
                                        <button className="btn btn-primary" onClick={() => setSearchQuery('')}>
                                            Aramayı Temizle
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Help Section */}
                    <div className="row mt-4">
                        <div className="col-lg-6">
                            <div className="card border-info">
                                <div className="card-body">
                                    <div className="d-flex">
                                        <div className="flex-shrink-0">
                                            <i className="ri-question-answer-line text-info" style={{ fontSize: '40px' }}></i>
                                        </div>
                                        <div className="flex-grow-1 ms-3">
                                            <h5 className="card-title">Aradığınızı Bulamadınız mı?</h5>
                                            <p className="text-muted mb-2">
                                                Sıkça Sorulan Sorular bölümümüzde daha fazla bilgi bulabilirsiniz.
                                            </p>
                                            <Link href="/documentation/faq" className="btn btn-info btn-sm">
                                                <i className="ri-question-line me-1"></i>
                                                SSS'a Git
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="col-lg-6">
                            <div className="card border-success">
                                <div className="card-body">
                                    <div className="d-flex">
                                        <div className="flex-shrink-0">
                                            <i className="ri-headphone-line text-success" style={{ fontSize: '40px' }}></i>
                                        </div>
                                        <div className="flex-grow-1 ms-3">
                                            <h5 className="card-title">Teknik Destek</h5>
                                            <p className="text-muted mb-2">
                                                Teknik sorunlar için destek ekibimizle iletişime geçebilirsiniz.
                                            </p>
                                            <a href="mailto:destek@askom.com.tr" className="btn btn-success btn-sm">
                                                <i className="ri-mail-line me-1"></i>
                                                Destek Talebi Oluştur
                                            </a>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
                .card-hover {
                    transition: transform 0.2s, box-shadow 0.2s;
                }
                .card-hover:hover {
                    transform: translateY(-5px);
                    box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15) !important;
                }
                .hover-shadow:hover {
                    box-shadow: 0 0.25rem 0.5rem rgba(0, 0, 0, 0.1);
                    background-color: #f8f9fa !important;
                }
            `}</style>
        </Layout>
    );
}
