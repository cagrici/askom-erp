import React, { useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import Layout from '../../Layouts';

const topics = [
    {
        id: 'warehouses',
        title: 'Depo Tanımları',
        icon: 'ri-building-2-line',
        content: {
            overview: 'Depo tanımları, fiziksel depolama alanlarınızı sisteme kaydetmenizi sağlar. Her depo için konum, kapasite ve sorumlular tanımlanır.',
            steps: [
                { title: 'Depo Listesi', description: '"Depo Yönetimi > Depolar" sayfasına gidin.' },
                { title: 'Yeni Depo', description: '"Yeni Depo" butonuyla yeni depo kartı oluşturun.' },
                { title: 'Temel Bilgiler', description: 'Depo adı, kodu, adresi ve iletişim bilgilerini girin.' },
                { title: 'Kapasite', description: 'Depo kapasitesi, alan ölçüleri ve özelliklerini tanımlayın.' },
                { title: 'Sorumlular', description: 'Depo müdürü ve personeli atayın.' }
            ],
            tips: [
                'Her lokasyonda birden fazla depo tanımlanabilir.',
                'Depo tipleri: Ana depo, Şube depo, Transit depo, İade depo.',
                'Pasif depolarda stok hareketi yapılamaz.',
                'Depo kodları benzersiz olmalıdır.'
            ]
        }
    },
    {
        id: 'zones',
        title: 'Depo Bölgeleri',
        icon: 'ri-layout-grid-line',
        content: {
            overview: 'Depo bölgeleri, depolarınızı mantıksal alanlara ayırmanızı sağlar. Toplama, raflı depolama, soğuk depo gibi bölgeler tanımlanabilir.',
            steps: [
                { title: 'Bölge Listesi', description: '"Depo Yönetimi > Depo Bölgeleri" sayfasına gidin.' },
                { title: 'Yeni Bölge', description: 'Depo seçerek yeni bölge tanımlayın.' },
                { title: 'Bölge Özellikleri', description: 'Bölge adı, türü ve kapasite bilgilerini girin.' },
                { title: 'Lokasyon Atama', description: 'Bölgeye ait raf/koridor/katları tanımlayın.' },
                { title: 'Erişim İzinleri', description: 'Bölgeye erişim yetkisi olan personeli belirleyin.' }
            ],
            tips: [
                'Bölge türleri: Depolama, Toplama, Paketleme, Sevkiyat, Kabul.',
                'Sıcaklık kontrollü bölgeler için özel işaretleme yapın.',
                'Tehlikeli madde bölgeleri ayrı tutulmalıdır.',
                'Bölge bazlı stok raporu alınabilir.'
            ]
        }
    },
    {
        id: 'locations',
        title: 'Depolama Lokasyonları',
        icon: 'ri-map-pin-line',
        content: {
            overview: 'Depolama lokasyonları, ürünlerin depo içinde tam olarak nerede konumlandırılacağını belirler. Raf, koridor, seviye bazında adresler tanımlanır.',
            steps: [
                { title: 'Lokasyon Yapısı', description: 'Depo-Bölge-Koridor-Raf-Seviye-Hücre hiyerarşisi oluşturun.' },
                { title: 'Lokasyon Kodlama', description: 'Lokasyon kodlama şablonu belirleyin (örnek: A-01-02-03).' },
                { title: 'Kapasite', description: 'Her lokasyonun maksimum ağırlık ve hacim kapasitesini girin.' },
                { title: 'Lokasyon Türü', description: 'Sabit lokasyon veya dinamik lokasyon olarak tanımlayın.' },
                { title: 'Barkod', description: 'Lokasyon barkodlarını oluşturun ve yazdırın.' }
            ],
            tips: [
                'Sabit lokasyonlar belirli ürünler için ayrılır.',
                'Dinamik lokasyonlar boş olan herhangi bir ürüne atanabilir.',
                'Lokasyon barkodları ile hızlı yerleşim ve toplama yapın.',
                'ABC analizine göre ürünleri uygun lokasyonlara yerleştirin.'
            ]
        }
    },
    {
        id: 'receiving',
        title: 'Mal Kabul',
        icon: 'ri-inbox-archive-line',
        content: {
            overview: 'Mal kabul süreci, gelen ürünlerin depoya alınmasını, kontrolünü ve kayda geçirilmesini kapsar.',
            steps: [
                { title: 'Beklenen Teslimatlar', description: '"Depo Yönetimi > Mal Kabul" sayfasından beklenen siparişleri görün.' },
                { title: 'Teslimat Karşılama', description: 'Gelen aracı ve irsaliyeyi kaydedin.' },
                { title: 'Fiziksel Kontrol', description: 'Ürünlerin miktar ve görünümünü kontrol edin.' },
                { title: 'Sistem Kayıt', description: 'Teslim alınan miktarları sisteme girin.' },
                { title: 'Fark Kaydı', description: 'Eksik veya fazla varsa fark raporu oluşturun.' },
                { title: 'Kalite Kontrole Yönlendirme', description: 'Gerekliyse ürünleri kalite kontrole gönderin.' }
            ],
            tips: [
                'Mobil cihazlarla barkod taratarak hızlı kabul yapın.',
                'Fotoğraflı hasar kaydı tutun.',
                'Tedarikçi performans takibi için zamanında teslimat oranlarını izleyin.',
                'Randevulu teslimat sistemiyle kabul planlayın.'
            ]
        }
    },
    {
        id: 'quality-control',
        title: 'Kalite Kontrol',
        icon: 'ri-shield-check-line',
        content: {
            overview: 'Kalite kontrol, gelen veya üretilen ürünlerin belirlenen standartlara uygunluğunun denetlenmesini sağlar.',
            steps: [
                { title: 'KK Kuyruğu', description: '"Depo Yönetimi > Kalite Kontrol" sayfasından bekleyen ürünleri görün.' },
                { title: 'Numune Alma', description: 'Kontrol edilecek ürünlerden numune alın.' },
                { title: 'Test İşlemi', description: 'Belirlenen kriterlere göre testleri gerçekleştirin.' },
                { title: 'Sonuç Kaydı', description: 'Test sonuçlarını sisteme girin.' },
                { title: 'Onay/Red', description: 'Ürünü onaylayın veya reddedin.' },
                { title: 'Stoka Aktar', description: 'Onaylanan ürünler ana stoka aktarılır.' }
            ],
            tips: [
                'Tedarikçi bazlı kalite geçmişi tutun.',
                'Kritik ürünler için %100 kontrol yapın.',
                'Reddedilen ürünler için iade veya imha süreci başlatın.',
                'KK sonuçları satın alma kararlarını etkiler.'
            ]
        }
    },
    {
        id: 'putaway',
        title: 'Yerleştirme (Put-away)',
        icon: 'ri-inbox-unarchive-line',
        content: {
            overview: 'Yerleştirme süreci, kabul edilen ürünlerin uygun depo lokasyonlarına yerleştirilmesini sağlar.',
            steps: [
                { title: 'Yerleştirme Listesi', description: '"Depo Yönetimi > Yerleştirme" sayfasından bekleyen ürünleri görün.' },
                { title: 'Lokasyon Önerisi', description: 'Sistem, ürün özelliklerine göre lokasyon önerir.' },
                { title: 'Yerleşim Onay', description: 'Önerilen lokasyonu onaylayın veya değiştirin.' },
                { title: 'Fiziksel Yerleşim', description: 'Ürünleri belirtilen lokasyona yerleştirin.' },
                { title: 'Barkod Tarama', description: 'Lokasyon ve ürün barkodunu taratarak işlem bitirin.' }
            ],
            tips: [
                'ABC yöntemine göre hızlı hareket eden ürünler öne yakın lokasyonlara.',
                'Ağır ürünler alt raflara yerleştirilmeli.',
                'FIFO için yeni ürünler arkaya yerleştirilmeli.',
                'Otomatik lokasyon önerisi zamandan tasarruf sağlar.'
            ]
        }
    },
    {
        id: 'operations',
        title: 'Depo Operasyonları',
        icon: 'ri-settings-4-line',
        content: {
            overview: 'Depo operasyonları, günlük depo faaliyetlerinin planlanması, takibi ve yönetimini kapsar.',
            steps: [
                { title: 'Operasyon Planı', description: 'Günlük operasyon planını oluşturun.' },
                { title: 'İş Emirleri', description: 'Toplama, yerleştirme, sayım gibi iş emirleri atayın.' },
                { title: 'Performans Takibi', description: 'Gerçekleşen işlemleri ve süreleri takip edin.' },
                { title: 'Kapasite Yönetimi', description: 'Depo doluluğunu ve kapasiteyi izleyin.' },
                { title: 'Vardiya Yönetimi', description: 'Personel vardiyalarını planlayın.' }
            ],
            tips: [
                'Günlük hedefler koyarak verimlilik artırın.',
                'Darboğazları tespit edip çözüm üretin.',
                'Mobil cihazlarla saha işlemlerini hızlandırın.',
                'Performans metrikleri ile personeli değerlendirin.'
            ]
        }
    },
    {
        id: 'staff',
        title: 'Depo Personeli',
        icon: 'ri-team-line',
        content: {
            overview: 'Depo personeli yönetimi, depo çalışanlarının tanımı, yetkilendirilmesi ve performans takibini kapsar.',
            steps: [
                { title: 'Personel Listesi', description: '"Depo Yönetimi > Depo Personeli" sayfasını açın.' },
                { title: 'Personel Kartı', description: 'Yeni personel ekleyin veya mevcut personeli güncelleyin.' },
                { title: 'Görev Atama', description: 'Personele depo, bölge ve görev tipi atayın.' },
                { title: 'Yetkilendirme', description: 'Ekipman ve bölge erişim yetkilerini verin.' },
                { title: 'Performans', description: 'Tamamlanan iş emirleri ve verimlilik ölçümlerini görün.' }
            ],
            tips: [
                'Forklift gibi ekipman kullanımı için sertifika kontrolü yapın.',
                'Cross-training ile personel esnekliği sağlayın.',
                'Performans bazlı teşviklerle motivasyonu artırın.',
                'Güvenlik eğitimlerini düzenli yapın.'
            ]
        }
    }
];

export default function WarehouseManagement() {
    const [activeTopic, setActiveTopic] = useState('warehouses');

    return (
        <Layout>
            <Head title="Depo Yönetimi - Yardım" />
            <div className="page-content">
                <div className="container-fluid">
                    {/* Page Header */}
                    <div className="row">
                        <div className="col-12">
                            <div className="page-title-box d-sm-flex align-items-center justify-content-between">
                                <h4 className="mb-sm-0">Depo Yönetimi Dokümantasyonu</h4>
                                <div className="page-title-right">
                                    <ol className="breadcrumb m-0">
                                        <li className="breadcrumb-item"><Link href={route('dashboard')}>Dashboard</Link></li>
                                        <li className="breadcrumb-item"><Link href="/documentation">Yardım</Link></li>
                                        <li className="breadcrumb-item active">Depo Yönetimi</li>
                                    </ol>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Quick Access */}
                    <div className="row mb-4">
                        <div className="col-12">
                            <div className="card bg-danger bg-gradient text-white">
                                <div className="card-body py-3">
                                    <div className="d-flex align-items-center justify-content-between flex-wrap gap-3">
                                        <div>
                                            <h5 className="text-white mb-1"><i className="ri-building-line me-2"></i>Depo Modülüne Hızlı Erişim</h5>
                                            <p className="mb-0 text-white-75">Depo operasyonlarınızı yönetin</p>
                                        </div>
                                        <div className="d-flex gap-2 flex-wrap">
                                            <Link href="/warehouses" className="btn btn-light btn-sm"><i className="ri-building-2-line me-1"></i> Depolar</Link>
                                            <Link href="/warehouses/receiving" className="btn btn-light btn-sm"><i className="ri-inbox-archive-line me-1"></i> Mal Kabul</Link>
                                            <Link href="/warehouses/operations" className="btn btn-light btn-sm"><i className="ri-settings-4-line me-1"></i> Operasyonlar</Link>
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
                                <div className="card-header bg-danger text-white">
                                    <h5 className="card-title mb-0"><i className="ri-building-line me-2"></i>Depo Yönetimi</h5>
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

                        {/* Content */}
                        <div className="col-lg-9">
                            {topics.map((topic) => (
                                <div key={topic.id} id={topic.id} className="card mb-4">
                                    <div className="card-header">
                                        <h5 className="card-title mb-0"><i className={`${topic.icon} me-2 text-danger`}></i>{topic.title}</h5>
                                    </div>
                                    <div className="card-body">
                                        <div className="alert alert-soft-danger mb-4"><i className="ri-information-line me-2"></i>{topic.content.overview}</div>
                                        <h6 className="mb-3"><i className="ri-list-ordered me-2"></i>İşlem Adımları</h6>
                                        <div className="timeline-2 mb-4">
                                            {topic.content.steps.map((step, idx) => (
                                                <div key={idx} className="timeline-item pb-3">
                                                    <div className="d-flex">
                                                        <div className="flex-shrink-0"><div className="avatar-xs"><div className="avatar-title bg-danger-subtle text-danger rounded-circle">{idx + 1}</div></div></div>
                                                        <div className="flex-grow-1 ms-3"><h6 className="mb-1">{step.title}</h6><p className="text-muted mb-0">{step.description}</p></div>
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

                            {/* Related */}
                            <div className="card border-danger">
                                <div className="card-body">
                                    <h6 className="mb-3"><i className="ri-links-line me-2"></i>İlgili Konular</h6>
                                    <div className="d-flex flex-wrap gap-2">
                                        <Link href="/documentation/stock-management" className="btn btn-outline-secondary btn-sm">Stok Yönetimi</Link>
                                        <Link href="/documentation/shipping" className="btn btn-outline-secondary btn-sm">Sevkiyat</Link>
                                        <Link href="/documentation/purchasing" className="btn btn-outline-secondary btn-sm">Satın Alma</Link>
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
