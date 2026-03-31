import React, { useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import Layout from '../../Layouts';

const topics = [
    {
        id: 'sales-reports',
        title: 'Satış Raporları',
        icon: 'ri-shopping-cart-line',
        content: {
            overview: 'Satış raporları, satış performansınızı analiz etmenizi, trendleri görmenizi ve stratejik kararlar almanızı sağlar.',
            steps: [
                { title: 'Rapor Seçimi', description: '"Raporlar > Satış Raporları" sayfasını açın.' },
                { title: 'Tarih Aralığı', description: 'Raporlamak istediğiniz dönemi seçin.' },
                { title: 'Filtreler', description: 'Müşteri, ürün kategorisi, satış temsilcisi gibi filtreler uygulayın.' },
                { title: 'Rapor Tipi', description: 'Özet, detaylı veya grafiksel format seçin.' },
                { title: 'Dışa Aktarma', description: 'Excel veya PDF olarak indirin.' }
            ],
            tips: [
                'Günlük, haftalık, aylık karşılaştırmalar yapın.',
                'En çok satan ürünleri analiz edin.',
                'Bölge bazlı satış performansını takip edin.',
                'Hedef gerçekleşme oranlarını izleyin.'
            ],
            reportTypes: ['Satış Özeti', 'Ürün Bazlı Satış', 'Müşteri Bazlı Satış', 'Temsilci Performansı', 'Bölge Analizi']
        }
    },
    {
        id: 'stock-reports',
        title: 'Stok Raporları',
        icon: 'ri-stack-line',
        content: {
            overview: 'Stok raporları, envanter durumunuzu analiz etmenizi, stok maliyetlerini kontrol etmenizi ve optimizasyon fırsatları bulmanızı sağlar.',
            steps: [
                { title: 'Stok Durumu', description: 'Güncel stok miktarları ve değerlerini görün.' },
                { title: 'Hareket Raporu', description: 'Giriş-çıkış hareketlerini analiz edin.' },
                { title: 'Devir Hızı', description: 'Ürün bazlı stok devir hızlarını inceleyin.' },
                { title: 'ABC Analizi', description: 'Ürünleri değer ve hareket hızına göre sınıflandırın.' },
                { title: 'Yaşlandırma', description: 'Stokta bekleme sürelerini analiz edin.' }
            ],
            tips: [
                'Düşük devir hızlı ürünleri tespit edin.',
                'Olumlu stok için talep tahmini yapın.',
                'Depo bazlı stok dağılımını izleyin.',
                'Minimum stok seviyelerini optimize edin.'
            ],
            reportTypes: ['Stok Durumu', 'Stok Hareketi', 'ABC Analizi', 'Devir Hızı', 'Yaşlandırma']
        }
    },
    {
        id: 'financial-reports',
        title: 'Mali Raporlar',
        icon: 'ri-money-dollar-circle-line',
        content: {
            overview: 'Mali raporlar, alacak-borç durumu, nakit akışı ve finansal performans hakkında detaylı bilgi sağlar.',
            steps: [
                { title: 'Alacak Raporu', description: 'Müşteri alacaklarını ve vade durumlarını görün.' },
                { title: 'Borç Raporu', description: 'Tedarikçi borçlarını analiz edin.' },
                { title: 'Nakit Akışı', description: 'Gelir-gider akışını izleyin.' },
                { title: 'Kar/Zarar', description: 'Dönemsel kar/zarar analizini inceleyin.' },
                { title: 'Bütçe Karşılaştırma', description: 'Gerçekleşen ile planı karşılaştırın.' }
            ],
            tips: [
                'Haftalık nakit akışı projeksiyonu yapın.',
                'Vade aşımı için erken uyarı alın.',
                'Karlılık analizlerini ürün bazlı yapın.',
                'Bütçe sapmalarını anlık takip edin.'
            ],
            reportTypes: ['Alacak Yaşlandırma', 'Borç Yaşlandırma', 'Nakit Akışı', 'Kar-Zarar', 'Bütçe Analizi']
        }
    },
    {
        id: 'customer-reports',
        title: 'Müşteri Raporları',
        icon: 'ri-user-3-line',
        content: {
            overview: 'Müşteri raporları, müşteri davranışlarını, segmentasyonu ve sadakati analiz etmenizi sağlar.',
            steps: [
                { title: 'Müşteri Analizi', description: 'Müşteri bazlı satış ve karlılık görün.' },
                { title: 'RFM Analizi', description: 'Recency, Frequency, Monetary skorlarını inceleyin.' },
                { title: 'Segmentasyon', description: 'Müşterileri gruplara ayırın.' },
                { title: 'Sadakat', description: 'Tekrar satın alma oranlarını takip edin.' },
                { title: 'Kayıp Analizi', description: 'Pasif müşterileri tespit edin.' }
            ],
            tips: [
                'En değerli müşterilere özel ilgi gösterin.',
                'Kayıp riski olan müşterileri belirleyin.',
                'Müşteri yaşam değeri hesaplayın.',
                'Segment bazlı kampanyalar oluşturun.'
            ],
            reportTypes: ['Müşteri Sıralaması', 'RFM Analizi', 'Segment Raporu', 'Sadakat Analizi', 'Kayıp Raporu']
        }
    },
    {
        id: 'product-reports',
        title: 'Ürün Analizleri',
        icon: 'ri-archive-line',
        content: {
            overview: 'Ürün analizleri, ürün performansı, karlılık ve portföy optimizasyonu için veriler sağlar.',
            steps: [
                { title: 'Ürün Performansı', description: 'Ürün bazlı satış ve kar marjlarını görün.' },
                { title: 'Kategori Analizi', description: 'Kategori bazlı performansı karşılaştırın.' },
                { title: 'Marj Analizi', description: 'Brüt kar marjlarını inceleyin.' },
                { title: 'Cross-sell', description: 'Birlikte satılan ürünleri analiz edin.' },
                { title: 'Yaşam Döngüsü', description: 'Ürün yaşam döngüsü aşamalarını izleyin.' }
            ],
            tips: [
                'Düşük marjlı ürünleri optimize edin.',
                'En çok satanlar listesi ile trend takibi yapın.',
                'Cross-sell fırsatlarını kampanyalarda kullanın.',
                'Yaşlanmış ürünler için aksiyon alın.'
            ],
            reportTypes: ['Ürün Sıralaması', 'Marj Analizi', 'Kategori Performansı', 'Cross-sell', 'Yaşam Döngüsü']
        }
    },
    {
        id: 'performance-reports',
        title: 'Performans Raporları',
        icon: 'ri-line-chart-line',
        content: {
            overview: 'Performans raporları, ekip ve bireysel performansı ölçmenizi ve hedef takibi yapmanızı sağlar.',
            steps: [
                { title: 'Temsilci Performansı', description: 'Satış temsilcilerinin performansını görün.' },
                { title: 'Hedef Takibi', description: 'Hedef gerçekleşme oranlarını izleyin.' },
                { title: 'KPI Dashboard', description: 'Anahtar performans göstergelerini takip edin.' },
                { title: 'Karşılaştırma', description: 'Dönemler ve kişiler arası karşılaştırma yapın.' },
                { title: 'Trend Analizi', description: 'Performans trendlerini analiz edin.' }
            ],
            tips: [
                'Haftalık performans toplantıları düzenleyin.',
                'Hedef altında kalanlara destek verin.',
                'Başarılı uygulamaları ekipte paylaşın.',
                'KPI\'ları düzenli olarak gözden geçirin.'
            ],
            reportTypes: ['Temsilci Performansı', 'Hedef Gerçekleşme', 'KPI Takibi', 'Verimlilik Analizi']
        }
    },
    {
        id: 'custom-reports',
        title: 'Özel Raporlar',
        icon: 'ri-file-list-3-line',
        content: {
            overview: 'Özel raporlar, standart dışında ihtiyaçlarınıza yönelik kişiselleştirilebilir raporlar oluşturmanızı sağlar.',
            steps: [
                { title: 'Rapor Tasarımcısı', description: '"Raporlar > Özel Raporlar" sayfasından yeni rapor oluşturun.' },
                { title: 'Veri Seçimi', description: 'Rapora dahil edilecek veri alanlarını seçin.' },
                { title: 'Filtreler', description: 'Raporun kapsamı için filtreler belirleyin.' },
                { title: 'Gruplama', description: 'Verilerin nasıl gruplanacağını belirleyin.' },
                { title: 'Kaydetme', description: 'Raporu kaydederek tekrar kullanın.' }
            ],
            tips: [
                'Sık kullanılan raporları favorilere ekleyin.',
                'Zamanlı rapor gönderimi ayarlayın.',
                'Paylaşım izinlerini düzenleyin.',
                'Rapor şablonları ekip içerisinde paylaşılabilir.'
            ],
            reportTypes: ['Rapor Tasarımcısı', 'Şablonlar', 'Zamanlama', 'Paylaşım']
        }
    }
];

export default function Reports() {
    const [activeTopic, setActiveTopic] = useState('sales-reports');

    return (
        <Layout>
            <Head title="Raporlama - Yardım" />
            <div className="page-content">
                <div className="container-fluid">
                    <div className="row">
                        <div className="col-12">
                            <div className="page-title-box d-sm-flex align-items-center justify-content-between">
                                <h4 className="mb-sm-0">Raporlama Dokümantasyonu</h4>
                                <div className="page-title-right">
                                    <ol className="breadcrumb m-0">
                                        <li className="breadcrumb-item"><Link href="/documentation">Yardım</Link></li>
                                        <li className="breadcrumb-item active">Raporlama</li>
                                    </ol>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="row mb-4">
                        <div className="col-12">
                            <div className="card bg-danger bg-gradient text-white">
                                <div className="card-body py-3">
                                    <div className="d-flex align-items-center justify-content-between flex-wrap gap-3">
                                        <div>
                                            <h5 className="text-white mb-1"><i className="ri-bar-chart-line me-2"></i>Raporlama Modülüne Hızlı Erişim</h5>
                                            <p className="mb-0 text-white-75">İşletme verilerinizi analiz edin</p>
                                        </div>
                                        <div className="d-flex gap-2 flex-wrap">
                                            <Link href="/reports/sales" className="btn btn-light btn-sm"><i className="ri-shopping-cart-line me-1"></i> Satış</Link>
                                            <Link href="/reports/inventory" className="btn btn-light btn-sm"><i className="ri-stack-line me-1"></i> Stok</Link>
                                            <Link href="/reports/financial" className="btn btn-light btn-sm"><i className="ri-money-dollar-circle-line me-1"></i> Mali</Link>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="row">
                        <div className="col-lg-3">
                            <div className="card sticky-top" style={{ top: '100px' }}>
                                <div className="card-header bg-danger text-white">
                                    <h5 className="card-title mb-0"><i className="ri-bar-chart-line me-2"></i>Raporlama</h5>
                                </div>
                                <div className="card-body p-0">
                                    <div className="list-group list-group-flush">
                                        {topics.map((topic) => (
                                            <a key={topic.id} href={`#${topic.id}`}
                                                className={`list-group-item list-group-item-action d-flex align-items-center ${activeTopic === topic.id ? 'active' : ''}`}
                                                onClick={(e) => { e.preventDefault(); setActiveTopic(topic.id); document.getElementById(topic.id)?.scrollIntoView({ behavior: 'smooth' }); }}>
                                                <i className={`${topic.icon} me-2`}></i>{topic.title}
                                            </a>
                                        ))}
                                    </div>
                                </div>
                                <div className="card-footer">
                                    <Link href="/documentation" className="btn btn-outline-secondary btn-sm w-100"><i className="ri-arrow-left-line me-1"></i>Tüm Dokümanlar</Link>
                                </div>
                            </div>
                        </div>

                        <div className="col-lg-9">
                            {topics.map((topic) => (
                                <div key={topic.id} id={topic.id} className="card mb-4">
                                    <div className="card-header">
                                        <h5 className="card-title mb-0"><i className={`${topic.icon} me-2 text-danger`}></i>{topic.title}</h5>
                                    </div>
                                    <div className="card-body">
                                        <div className="alert alert-soft-danger mb-4"><i className="ri-information-line me-2"></i>{topic.content.overview}</div>

                                        {/* Report Types */}
                                        {'reportTypes' in topic.content && (
                                            <div className="mb-4">
                                                <h6 className="mb-2"><i className="ri-file-list-line me-2"></i>Mevcut Rapor Tipleri</h6>
                                                <div className="d-flex flex-wrap gap-2">
                                                    {(topic.content as any).reportTypes.map((type: string, idx: number) => (
                                                        <span key={idx} className="badge bg-danger-subtle text-danger">{type}</span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        <h6 className="mb-3"><i className="ri-list-ordered me-2"></i>İşlem Adımları</h6>
                                        <div className="row g-3 mb-4">
                                            {topic.content.steps.map((step, idx) => (
                                                <div key={idx} className="col-md-6">
                                                    <div className="d-flex align-items-start p-3 bg-light-subtle rounded">
                                                        <div className="flex-shrink-0"><div className="avatar-xs"><div className="avatar-title bg-danger-subtle text-danger rounded-circle">{idx + 1}</div></div></div>
                                                        <div className="flex-grow-1 ms-3"><h6 className="mb-1">{step.title}</h6><p className="text-muted mb-0 small">{step.description}</p></div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        <div className="bg-success-subtle rounded p-3">
                                            <h6 className="mb-3"><i className="ri-lightbulb-line me-2 text-success"></i>İpuçları</h6>
                                            <ul className="mb-0">{topic.content.tips.map((tip, idx) => (<li key={idx} className="mb-1">{tip}</li>))}</ul>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
}
