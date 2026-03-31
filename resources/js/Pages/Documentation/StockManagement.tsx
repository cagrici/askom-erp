import React, { useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import Layout from '../../Layouts';

interface Topic {
    id: string;
    title: string;
    icon: string;
    content: {
        overview: string;
        steps: { title: string; description: string; }[];
        tips: string[];
    };
}

const topics: Topic[] = [
    {
        id: 'stock-list',
        title: 'Stok Listesi',
        icon: 'ri-file-list-2-line',
        content: {
            overview: 'Stok listesi, tüm ürünlerinizin güncel stok miktarlarını, lokasyonlarını ve değerlerini görüntülemenizi sağlar. Filtre ve arama özellikleri ile hızlıca istediğiniz ürünü bulabilirsiniz.',
            steps: [
                { title: 'Stok Listesine Erisim', description: 'Sol menuден "Stok Yonetimi > Stok Listesi" secenegine tiklayin.' },
                { title: 'Arama ve Filtreleme', description: 'Urun kodu, adi veya barkod ile arama yapin. Kategori, marka veya depo filtrelerini kullanin.' },
                { title: 'Stok Bilgilerini Goruntuleyin', description: 'Toplam miktar, kullanilabilir miktar, rezerve miktar ve minimum stok bilgilerini gorun.' },
                { title: 'Detay Inceleme', description: 'Urun satirina tiklayarak detayli stok hareketlerini ve depo bazli dagilimi gorun.' },
                { title: 'Disa Aktarma', description: 'Excel veya PDF olarak stok raporunu disa aktarin.' }
            ],
            tips: [
                'Kritik stok seviyesinin altındaki ürünler kırmızı ile işaretlenir.',
                'Stok listesini favori filtrelere kaydederek hızlı erişim sağlayın.',
                'Depo seçimi yaparak sadece belirli bir deponun stoklarını görüntüleyin.',
                'Kolonları kişiselleştirerek ihtiyacınıza göre düzenleme yapın.'
            ]
        }
    },
    {
        id: 'movements',
        title: 'Stok Hareketleri',
        icon: 'ri-exchange-line',
        content: {
            overview: 'Stok hareketleri, tüm giriş ve çıkış işlemlerini kronolojik olarak listeler. Her hareketin nedeni, miktarı ve sorumlusu takip edilebilir.',
            steps: [
                { title: 'Hareketleri Görüntüleme', description: '"Stok Yönetimi > Stok Hareketleri" sayfasına gidin.' },
                { title: 'Tarih Aralığı Seçin', description: 'İncelemek istediğiniz tarih aralığını belirleyin.' },
                { title: 'Hareket Türü Filtresi', description: 'Giriş, çıkış, transfer veya düzeltme hareketlerini filtreleyin.' },
                { title: 'Detay İnceleme', description: 'Hareket satırına tıklayarak kaynak belge ve detayları görün.' },
                { title: 'Analiz', description: 'Hareket grafiklerini inceleyerek trendleri analiz edin.' }
            ],
            tips: [
                'Her stok hareketi otomatik olarak kaydedilir, manuel silme mumkun degildir.',
                'Hareket referans numarasi ile kaynak belgeye (siparis, fatura vb.) ulasabilirsiniz.',
                'Gunluk, haftalik ve aylik bazda hareket ozetlerini gorebilirsiniz.',
                'Anormalik tespit icin hareket uyari kuraliari tanimlayin.'
            ]
        }
    },
    {
        id: 'adjustments',
        title: 'Stok Düzeltme',
        icon: 'ri-edit-2-line',
        content: {
            overview: 'Stok düzeltme, sayım farkları, fire, kayıp veya diğer nedenlerle gerçek stok ile sistem stoğu arasındaki farkları düzeltmenizi sağlar.',
            steps: [
                { title: 'Duzeltme Olusturma', description: '"Stok Yonetimi > Stok Duzeltme" sayfasindan "Yeni Duzeltme" butonuna tiklayin.' },
                { title: 'Depo Secimi', description: 'Duzeltme yapilacak depoyu secin.' },
                { title: 'Urun ve Miktar', description: 'Duzeltilecek urunu secin, sistem miktarini ve gercek miktari girin.' },
                { title: 'Duzeltme Nedeni', description: 'Duzeltme nedenini secin: Sayim farki, Fire, Kayip, Bozuk urun vb.' },
                { title: 'Onay Sureci', description: 'Duzeltme talebini olusturun. Yetkili onayindan sonra stok guncellenir.' },
                { title: 'Uygulama', description: 'Onaylanan duzeltme otomatik olarak stoka yansitilir.' }
            ],
            tips: [
                'Düzeltme işlemleri denetim için tüm detaylarıyla saklanır.',
                'Büyük miktarlı düzeltmeler için onay mekanizması devrededir.',
                'Düzeltme nedenlerini doğru seçmek raporlama açısından önemlidir.',
                'Periyodik sayım düzeltmeleri için toplu düzeltme özelliğini kullanın.'
            ]
        }
    },
    {
        id: 'transfers',
        title: 'Stok Transferi',
        icon: 'ri-arrow-left-right-line',
        content: {
            overview: 'Stok transferi, ürünleri bir depodan diğerine taşımanızı sağlar. Transfer süreci, çıkış-sevk-kabul aşamalarından oluşur.',
            steps: [
                { title: 'Transfer Talebi', description: '"Stok Yonetimi > Stok Transferi" sayfasindan "Yeni Transfer" olusturun.' },
                { title: 'Depo Secimi', description: 'Kaynak depo (cikis yapilacak) ve hedef depo (kabul edilecek) secin.' },
                { title: 'Urun Ekleme', description: 'Transfer edilecek urunleri ve miktarlari girin.' },
                { title: 'Transfer Onay', description: 'Transfer talebini kaydedin. Yetkili onaylasin.' },
                { title: 'Sevkiyat', description: 'Onaylanan transfer kaynak depodan sevk edilsin.' },
                { title: 'Kabul', description: 'Hedef depoda mal kabul yapilsin, varsa farklar raporlansin.' }
            ],
            tips: [
                'Transfer sırasında ürünler her iki depoda da "transit" olarak işaretlenir.',
                'Kısmi kabul yapılabilir, eksik ürünler için fark kaydı oluşturulur.',
                'Transfer sürecini mobil cihazlardan da takip edebilirsiniz.',
                'Sık yapılan transferler için şablon oluşturabilirsiniz.'
            ]
        }
    },
    {
        id: 'low-stock',
        title: 'Düşük Stok Uyarıları',
        icon: 'ri-alarm-warning-line',
        content: {
            overview: 'Düşük stok uyarıları, minimum stok seviyesinin altına düşen ürünleri otomatik olarak tespit eder ve bildirim gönderir.',
            steps: [
                { title: 'Uyarıları Görüntüleme', description: '"Stok Yönetimi > Düşük Stok Uyarıları" sayfasına gidin.' },
                { title: 'Uyarı Listesi', description: 'Kritik seviyenin altındaki tüm ürünleri görün.' },
                { title: 'Öncelik Sırası', description: 'Ürünler stok açığı oranına göre sıralanır.' },
                { title: 'Sipariş Oluşturma', description: 'Tek tıkla satın alma siparişi oluşturun.' },
                { title: 'Bildirim Ayarları', description: 'E-posta veya sistem bildirimi tercihlerinizi ayarlayın.' }
            ],
            tips: [
                'Her ürün için farklı minimum stok seviyesi tanımlanabilir.',
                'Mevsimsel değişimler için dinamik minimum stok hesaplayın.',
                'Günlük otomatik stok raporu e-posta ile alınabilir.',
                'Uyarı sayısı Dashboard\'da anlık olarak görüntülenir.'
            ]
        }
    },
    {
        id: 'reports',
        title: 'Stok Raporları',
        icon: 'ri-file-chart-line',
        content: {
            overview: 'Stok raporları, envanter durumunuzu analiz etmenizi, trendleri takip etmenizi ve stratejik kararlar almanızı sağlar.',
            steps: [
                { title: 'Rapor Merkezi', description: '"Stok Yönetimi > Stok Raporları" sayfasına gidin.' },
                { title: 'Rapor Türü Seçimi', description: 'Stok durum, hareket, devir hızı, ABC analizi gibi raporları seçin.' },
                { title: 'Parametreler', description: 'Tarih aralığı, depo, kategori gibi parametreleri belirleyin.' },
                { title: 'Rapor Oluşturma', description: 'Raporu oluşturun ve sonuçları inceleyin.' },
                { title: 'Dışa Aktarma', description: 'Excel, PDF veya grafiksel olarak dışa aktarın.' }
            ],
            tips: [
                'ABC analiziyle yüksek değerli ürünlere odaklanın.',
                'Devir hızı düşük ürünleri tespit edin, promosyon veya tasfiye kararı alın.',
                'Karşılaştırmalı raporlarla dönemler arası performans analizi yapın.',
                'Otomatik rapor zamanlayarak periyodik olarak e-posta alın.'
            ]
        }
    },
    {
        id: 'counting',
        title: 'Stok Sayımı',
        icon: 'ri-calculator-line',
        content: {
            overview: 'Stok sayımı, fiziksel envanter denetimi yaparak sistem verilerinin doğruluğunu kontrol etmenizi sağlar.',
            steps: [
                { title: 'Sayım Planlama', description: 'Sayım yapılacak depo, bölge veya ürün grubunu belirleyin.' },
                { title: 'Sayım Listesi', description: 'Sayım formlarını oluşturun veya mobil cihaza indirin.' },
                { title: 'Fiziksel Sayım', description: 'Depo personeli fiziksel sayımı gerçekleştirsin.' },
                { title: 'Veri Girişi', description: 'Sayım sonuçlarını sisteme girin veya barkod okuyucu ile kaydedin.' },
                { title: 'Fark Analizi', description: 'Sistem stoğu ile sayım sonucu arasındaki farkları inceleyin.' },
                { title: 'Düzeltme Uygulama', description: 'Onaylanan farkları stok düzeltme ile sisteme yansıtın.' }
            ],
            tips: [
                'Periyodik sayım (cycle count) yöntemiyle sürekli doğrulama yapın.',
                'Yüksek değerli ürünleri daha sık sayın.',
                'Sayım sırasında stok hareketlerini geçici olarak durdurun.',
                'Mobil barkod tarayıcı ile sayım süresini kısaltın.'
            ]
        }
    }
];

export default function StockManagement() {
    const [activeTopic, setActiveTopic] = useState('stock-list');

    return (
        <Layout>
            <Head title="Stok Yönetimi - Yardım" />
            <div className="page-content">
                <div className="container-fluid">
                    {/* Page Header */}
                    <div className="row">
                        <div className="col-12">
                            <div className="page-title-box d-sm-flex align-items-center justify-content-between">
                                <h4 className="mb-sm-0">Stok Yönetimi Dokümantasyonu</h4>
                                <div className="page-title-right">
                                    <ol className="breadcrumb m-0">
                                        <li className="breadcrumb-item">
                                            <Link href={route('dashboard')}>Dashboard</Link>
                                        </li>
                                        <li className="breadcrumb-item">
                                            <Link href="/documentation">Yardım</Link>
                                        </li>
                                        <li className="breadcrumb-item active">Stok Yönetimi</li>
                                    </ol>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Quick Access Banner */}
                    <div className="row mb-4">
                        <div className="col-12">
                            <div className="card bg-warning bg-gradient">
                                <div className="card-body py-3">
                                    <div className="d-flex align-items-center justify-content-between flex-wrap gap-3">
                                        <div>
                                            <h5 className="text-dark mb-1">
                                                <i className="ri-stack-line me-2"></i>
                                                Stok Modülüne Hızlı Erişim
                                            </h5>
                                            <p className="mb-0 text-dark opacity-75">Stok seviyelerinizi yönetin ve takip edin</p>
                                        </div>
                                        <div className="d-flex gap-2 flex-wrap">
                                            <Link href="/stock" className="btn btn-dark btn-sm">
                                                <i className="ri-file-list-2-line me-1"></i> Stok Listesi
                                            </Link>
                                            <Link href="/stock/movements" className="btn btn-dark btn-sm">
                                                <i className="ri-exchange-line me-1"></i> Hareketler
                                            </Link>
                                            <Link href="/stock/transfers" className="btn btn-dark btn-sm">
                                                <i className="ri-arrow-left-right-line me-1"></i> Transferler
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="row">
                        {/* Sidebar */}
                        <div className="col-lg-3">
                            <div className="card sticky-top" style={{ top: '100px' }}>
                                <div className="card-header bg-warning">
                                    <h5 className="card-title mb-0 text-dark">
                                        <i className="ri-stack-line me-2"></i>
                                        Stok Yönetimi
                                    </h5>
                                </div>
                                <div className="card-body p-0">
                                    <div className="list-group list-group-flush">
                                        {topics.map((topic) => (
                                            <a
                                                key={topic.id}
                                                href={`#${topic.id}`}
                                                className={`list-group-item list-group-item-action d-flex align-items-center ${activeTopic === topic.id ? 'active' : ''}`}
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    setActiveTopic(topic.id);
                                                    document.getElementById(topic.id)?.scrollIntoView({ behavior: 'smooth' });
                                                }}
                                            >
                                                <i className={`${topic.icon} me-2`}></i>
                                                {topic.title}
                                            </a>
                                        ))}
                                    </div>
                                </div>
                                <div className="card-footer">
                                    <Link href="/documentation" className="btn btn-outline-secondary btn-sm w-100">
                                        <i className="ri-arrow-left-line me-1"></i>
                                        Tüm Dokümanlar
                                    </Link>
                                </div>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="col-lg-9">
                            {/* Stock Management Overview */}
                            <div className="card mb-4">
                                <div className="card-header">
                                    <h5 className="card-title mb-0">
                                        <i className="ri-information-line me-2 text-warning"></i>
                                        Stok Yönetimi Genel Bakış
                                    </h5>
                                </div>
                                <div className="card-body">
                                    <p className="text-muted mb-4">
                                        Stok yönetimi modülü, envanterinizi etkin bir şekilde yönetmenizi, stok seviyelerini
                                        optimize etmenizi ve stok maliyetlerini kontrol altında tutmanızı sağlar.
                                    </p>
                                    <div className="row g-3">
                                        {[
                                            { icon: 'ri-eye-line', title: 'Anlık Stok Takibi', desc: 'Tüm ürünlerin güncel stok durumu' },
                                            { icon: 'ri-history-line', title: 'Hareket Geçmişi', desc: 'Detaylı hareket kayıtları' },
                                            { icon: 'ri-alarm-warning-line', title: 'Otomatik Uyarılar', desc: 'Düşük stok bildirimleri' },
                                            { icon: 'ri-pie-chart-line', title: 'Analiz Raporları', desc: 'Karar destek raporları' }
                                        ].map((item, idx) => (
                                            <div key={idx} className="col-md-6 col-lg-3">
                                                <div className="text-center p-3 bg-light-subtle rounded">
                                                    <i className={`${item.icon} fs-1 text-warning mb-2`}></i>
                                                    <h6 className="mb-1">{item.title}</h6>
                                                    <small className="text-muted">{item.desc}</small>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Topics */}
                            {topics.map((topic) => (
                                <div key={topic.id} id={topic.id} className="card mb-4">
                                    <div className="card-header">
                                        <h5 className="card-title mb-0">
                                            <i className={`${topic.icon} me-2 text-warning`}></i>
                                            {topic.title}
                                        </h5>
                                    </div>
                                    <div className="card-body">
                                        {/* Overview */}
                                        <div className="alert alert-soft-warning mb-4">
                                            <i className="ri-information-line me-2"></i>
                                            {topic.content.overview}
                                        </div>

                                        {/* Steps */}
                                        <h6 className="mb-3">
                                            <i className="ri-list-ordered me-2"></i>
                                            İşlem Adımları
                                        </h6>
                                        <div className="timeline-2 mb-4">
                                            {topic.content.steps.map((step, idx) => (
                                                <div key={idx} className="timeline-item pb-3">
                                                    <div className="d-flex">
                                                        <div className="flex-shrink-0">
                                                            <div className="avatar-xs">
                                                                <div className="avatar-title bg-warning-subtle text-warning rounded-circle">
                                                                    {idx + 1}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="flex-grow-1 ms-3">
                                                            <h6 className="mb-1">{step.title}</h6>
                                                            <p className="text-muted mb-0">{step.description}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Tips */}
                                        <div className="bg-success-subtle rounded p-3">
                                            <h6 className="mb-3">
                                                <i className="ri-lightbulb-line me-2 text-success"></i>
                                                İpuçları
                                            </h6>
                                            <ul className="mb-0">
                                                {topic.content.tips.map((tip, idx) => (
                                                    <li key={idx} className="mb-1">{tip}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            ))}

                            {/* Related Topics */}
                            <div className="card border-warning">
                                <div className="card-body">
                                    <h6 className="mb-3">
                                        <i className="ri-links-line me-2"></i>
                                        İlgili Konular
                                    </h6>
                                    <div className="d-flex flex-wrap gap-2">
                                        <Link href="/documentation/warehouse-management" className="btn btn-outline-secondary btn-sm">
                                            Depo Yönetimi
                                        </Link>
                                        <Link href="/documentation/product-management" className="btn btn-outline-secondary btn-sm">
                                            Ürün Yönetimi
                                        </Link>
                                        <Link href="/documentation/purchasing" className="btn btn-outline-secondary btn-sm">
                                            Satın Alma
                                        </Link>
                                        <Link href="/documentation/reports" className="btn btn-outline-secondary btn-sm">
                                            Stok Raporları
                                        </Link>
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
