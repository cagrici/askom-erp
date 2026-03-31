import React, { useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import Layout from '../../Layouts';

const topics = [
    {
        id: 'shipping-orders',
        title: 'Sevk Emirleri',
        icon: 'ri-file-paper-2-line',
        content: {
            overview: 'Sevk emirleri, onaylanan siparişlerin müşteriye gönderilmesi için oluşturulan emirlerdir. Her sevk emri, hangi ürünlerin ne zaman ve nereye gönderileceğini belirler.',
            steps: [
                { title: 'Sevk Emri Listesi', description: '"Lojistik > Sevk Emirleri" sayfasından bekleyen emirleri görün.' },
                { title: 'Otomatik Oluşturma', description: 'Onaylanan siparişler için sevk emri otomatik oluşturulur.' },
                { title: 'Toplama Atama', description: 'Sevk emrini depo toplama ekibine atayın.' },
                { title: 'Paketleme', description: 'Toplanan ürünleri paketleyin ve etiketleyin.' },
                { title: 'Sevkiyat Planlama', description: 'Teslimat tarihini ve aracını belirleyin.' },
                { title: 'Çıkış Onay', description: 'Depodan çıkış işlemini onaylayın.' }
            ],
            tips: [
                'Acil siparişler öncelikli olarak işlenir.',
                'Aynı bölgeye gidecek siparişler birleştirilir.',
                'İrsaliye otomatik oluşturulur.',
                'GPS ile sevkiyat takibi yapılabilir.'
            ]
        }
    },
    {
        id: 'picking',
        title: 'Toplama İşlemleri',
        icon: 'ri-hand-heart-line',
        content: {
            overview: 'Toplama işlemleri, sevk emirlerindeki ürünlerin depodan toplanmasını kapsar. Verimli toplama yöntemleri ile işlem süresi kısaltılır.',
            steps: [
                { title: 'Toplama Listesi', description: '"Lojistik > Toplama Görevleri" sayfasından görevleri görün.' },
                { title: 'Görev Atama', description: 'Toplama görevini personele atayın.' },
                { title: 'Rota Oluşturma', description: 'Sistem, optimal toplama rotasını oluşturur.' },
                { title: 'Ürün Toplama', description: 'Barkod taratarak ürünleri toplayın.' },
                { title: 'Miktar Doğrulama', description: 'Her ürün için miktarı doğrulayın.' },
                { title: 'Toplama Tamamla', description: 'Toplama işlemini tamamlayın, paketlemeye gönderin.' }
            ],
            tips: [
                'Dalga toplama ile birden fazla sipariş aynı anda toplanabilir.',
                'Mobil cihazlarla eller serbest çalışma sağlanır.',
                'FIFO kurallarına dikkat edin.',
                'Eksik ürün bildirimi anında yapılır.'
            ]
        }
    },
    {
        id: 'vehicles',
        title: 'Araç Yönetimi',
        icon: 'ri-truck-line',
        content: {
            overview: 'Araç yönetimi, filo araçlarınızın tanımı, kapasite ve bakım takibini kapsar.',
            steps: [
                { title: 'Araç Listesi', description: '"Lojistik > Araçlar" sayfasından filo araçları görün.' },
                { title: 'Araç Kartı', description: 'Plaka, kapasite, araç tipi ve özellikleri girin.' },
                { title: 'Bakım Planı', description: 'Periyodik bakım zamanlarını tanımlayın.' },
                { title: 'Yakıt Takibi', description: 'Yakıt tüketim ve maliyetlerini kaydedin.' },
                { title: 'Belge Takibi', description: 'Ruhsat, sigorta ve muayene tarihlerini takip edin.' }
            ],
            tips: [
                'Bakım yaklaşımında otomatik uyarı alın.',
                'Araç kullanım raporları ile verimliliği ölçün.',
                'Soğutuculu araçlar için sıcaklık takibi yapın.',
                'Araç boş dönüşleri minimize edin.'
            ]
        }
    },
    {
        id: 'drivers',
        title: 'Şoför Yönetimi',
        icon: 'ri-steering-line',
        content: {
            overview: 'Şoför yönetimi, teslimat personelinin tanımı, yetkilendirme ve performans takibini kapsar.',
            steps: [
                { title: 'Şoför Listesi', description: '"Lojistik > Şoförler" sayfasını açın.' },
                { title: 'Şoför Kartı', description: 'Kişisel bilgiler ve ehliyet detaylarını girin.' },
                { title: 'Araç Atama', description: 'Şoföre varsayılan araç atayın.' },
                { title: 'Rota Atama', description: 'Günlük teslimat rotalarını atayın.' },
                { title: 'Performans', description: 'Teslimat sayısı ve müşteri puanlamalarını takip edin.' }
            ],
            tips: [
                'Ehliyet geçerlilik kontrolleri otomatik yapılır.',
                'Mobil uygulama ile şoför lokasyonunu takip edin.',
                'Teslimat kanıtı (POD) fotoğrafla alınabilir.',
                'Performans bazlı prim sistemi kurulabilir.'
            ]
        }
    },
    {
        id: 'planning',
        title: 'Sevkiyat Planlama',
        icon: 'ri-calendar-check-line',
        content: {
            overview: 'Sevkiyat planlama, teslimat rotalarının, araçların ve sürelerin optimize edilmesini sağlar.',
            steps: [
                { title: 'Günlük Plan', description: '"Lojistik > Sevkiyat Planlama" sayfasından günlük planı oluşturun.' },
                { title: 'Sipariş Atama', description: 'Bekleyen siparişleri araçlara atayın.' },
                { title: 'Rota Optimizasyonu', description: 'Sistem, en verimli rotayı hesaplar.' },
                { title: 'Zaman Penceresi', description: 'Müşteri tercih edilen teslimat saatlerini dikkate alın.' },
                { title: 'Plan Onay', description: 'Sevkiyat planını onaylayın ve uygulamayı başlatın.' }
            ],
            tips: [
                'Trafik ve hava durumu verilerini dikkate alın.',
                'Ağır yükler için uygun araç seçimi yapın.',
                'Acil siparişler plana sonradan eklenebilir.',
                'Maliyet vs hız dengesini optimize edin.'
            ]
        }
    },
    {
        id: 'tracking',
        title: 'Teslimat Takibi',
        icon: 'ri-map-pin-time-line',
        content: {
            overview: 'Teslimat takibi, sevkiyatların gerçek zamanlı olarak izlenmesini ve müşterinin bilgilendirilmesini sağlar.',
            steps: [
                { title: 'Canlı Takip', description: '"Lojistik > Teslimat Takibi" sayfasından canlı harita görün.' },
                { title: 'Durum Güncelleme', description: 'Şoför, her teslimat sonrası durumu günceller.' },
                { title: 'Müşteri Bildirimi', description: 'Müşteri SMS/e-posta ile bilgilendirilir.' },
                { title: 'Problem Yönetimi', description: 'Teslimat sorunları anında raporlanır.' },
                { title: 'Teslimat Kanıtı', description: 'İmza ve fotoğraf ile teslimat doğrulanır.' }
            ],
            tips: [
                'ETA (Tahmini Varış Süresi) müşteriye gönderilir.',
                'Gecikmeler otomatik bildirilir.',
                'Teslimat geçmişi raporlanabilir.',
                'Müşteri memnuniyeti anketi gönderilebilir.'
            ]
        }
    },
    {
        id: 'carriers',
        title: 'Nakliye Firmaları',
        icon: 'ri-building-4-line',
        content: {
            overview: 'Nakliye firmaları yönetimi, dış kaynak kargo ve lojistik firmalarının tanımı ve performans takibini kapsar.',
            steps: [
                { title: 'Firma Listesi', description: '"Lojistik > Nakliye Firmalari" sayfasini acin.' },
                { title: 'Firma Karti', description: 'Firma bilgileri, anlasmali ucretler ve bolge kapsamini girin.' },
                { title: 'Entegrasyon', description: 'Kargo takip API entegrasyonunu aktif edin.' },
                { title: 'Performans', description: 'Teslimat sureleri ve hasar oranlarini takip edin.' },
                { title: 'Fatura Karsilastirma', description: 'Sevkiyat faturalarini kontrol edin.' }
            ],
            tips: [
                'Birden fazla kargo firması ile çalışın, alternatif sağlayın.',
                'Bölgesel avantajlı firmaları tercih edin.',
                'Entegrasyon ile otomatik kargo takibi sağlayın.',
                'Anlaşmalı ücretleri periyodik güncelleyin.'
            ]
        }
    }
];

export default function Shipping() {
    const [activeTopic, setActiveTopic] = useState('shipping-orders');

    return (
        <Layout>
            <Head title="Sevkiyat & Lojistik - Yardım" />
            <div className="page-content">
                <div className="container-fluid">
                    <div className="row">
                        <div className="col-12">
                            <div className="page-title-box d-sm-flex align-items-center justify-content-between">
                                <h4 className="mb-sm-0">Sevkiyat & Lojistik Dokümantasyonu</h4>
                                <div className="page-title-right">
                                    <ol className="breadcrumb m-0">
                                        <li className="breadcrumb-item"><Link href="/documentation">Yardım</Link></li>
                                        <li className="breadcrumb-item active">Sevkiyat</li>
                                    </ol>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="row mb-4">
                        <div className="col-12">
                            <div className="card bg-secondary bg-gradient text-white">
                                <div className="card-body py-3">
                                    <div className="d-flex align-items-center justify-content-between flex-wrap gap-3">
                                        <div>
                                            <h5 className="text-white mb-1"><i className="ri-truck-line me-2"></i>Lojistik Modülüne Hızlı Erişim</h5>
                                            <p className="mb-0 text-white-75">Sevkiyat ve teslimat operasyonlarınızı yönetin</p>
                                        </div>
                                        <div className="d-flex gap-2 flex-wrap">
                                            <Link href="/warehouse/shipping-orders" className="btn btn-light btn-sm"><i className="ri-file-paper-2-line me-1"></i> Sevk Emirleri</Link>
                                            <Link href="/warehouse/picking-tasks" className="btn btn-light btn-sm"><i className="ri-hand-heart-line me-1"></i> Toplama</Link>
                                            <Link href="/logistics/vehicles" className="btn btn-light btn-sm"><i className="ri-truck-line me-1"></i> Araçlar</Link>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="row">
                        <div className="col-lg-3">
                            <div className="card sticky-top" style={{ top: '100px' }}>
                                <div className="card-header bg-secondary text-white">
                                    <h5 className="card-title mb-0"><i className="ri-truck-line me-2"></i>Sevkiyat & Lojistik</h5>
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
                                        <h5 className="card-title mb-0"><i className={`${topic.icon} me-2 text-secondary`}></i>{topic.title}</h5>
                                    </div>
                                    <div className="card-body">
                                        <div className="alert alert-soft-secondary mb-4"><i className="ri-information-line me-2"></i>{topic.content.overview}</div>
                                        <h6 className="mb-3"><i className="ri-list-ordered me-2"></i>İşlem Adımları</h6>
                                        <div className="row g-3 mb-4">
                                            {topic.content.steps.map((step, idx) => (
                                                <div key={idx} className="col-md-6">
                                                    <div className="d-flex align-items-start p-3 bg-light-subtle rounded">
                                                        <div className="flex-shrink-0"><div className="avatar-xs"><div className="avatar-title bg-secondary-subtle text-secondary rounded-circle">{idx + 1}</div></div></div>
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

                            <div className="card border-secondary">
                                <div className="card-body">
                                    <h6 className="mb-3"><i className="ri-links-line me-2"></i>İlgili Konular</h6>
                                    <div className="d-flex flex-wrap gap-2">
                                        <Link href="/documentation/warehouse-management" className="btn btn-outline-secondary btn-sm">Depo Yönetimi</Link>
                                        <Link href="/documentation/sales-management" className="btn btn-outline-secondary btn-sm">Satış Yönetimi</Link>
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
