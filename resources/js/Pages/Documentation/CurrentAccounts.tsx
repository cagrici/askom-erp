import React, { useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import Layout from '../../Layouts';

const topics = [
    {
        id: 'create-customer',
        title: 'Cari Kart Oluşturma',
        icon: 'ri-user-add-line',
        content: {
            overview: 'Cari kartlar, müşterilerinizin ve tedarikçilerinizin finansal hesaplarını takip etmenizi sağlar. Her iş ortağı için ayrı cari kart oluşturulur.',
            steps: [
                { title: 'Cari Kart Listesi', description: '"Muhasebe > Cari Kartlar" sayfasına gidin.' },
                { title: 'Yeni Cari', description: '"Yeni Cari" butonuna tıklayın.' },
                { title: 'Cari Tipi', description: 'Müşteri, Tedarikçi veya Her İkisi seçin.' },
                { title: 'Temel Bilgiler', description: 'Cari adı, kodu, vergi no ve iletişim bilgilerini girin.' },
                { title: 'Adres Bilgileri', description: 'Fatura ve teslimat adreslerini tanımlayın.' },
                { title: 'Finansal Ayarlar', description: 'Kredi limiti, vade ve ödeme koşullarını belirleyin.' }
            ],
            tips: [
                'Cari kodu benzersiz olmalıdır.',
                'Tüzel müşteriler için TC kimlik no zorunludur.',
                'Kurumsal müşteriler için vergi no zorunludur.',
                'Excel ile toplu cari aktarımı yapılabilir.'
            ]
        }
    },
    {
        id: 'customer-types',
        title: 'Cari Tipleri',
        icon: 'ri-group-line',
        content: {
            overview: 'Cari tipleri, iş ortaklarınızı sınıflandırmanızı sağlar. Müşteri, tedarikçi veya hem müşteri hem tedarikçi olarak tanımlanabilir.',
            steps: [
                { title: 'Müşteri', description: 'Satış yaptığınız firmalar veya kişiler.' },
                { title: 'Tedarikçi', description: 'Mal veya hizmet aldığınız firmalar.' },
                { title: 'Her İkisi', description: 'Hem satış hem alış yaptığınız firmalar.' },
                { title: 'Tip Değişikliği', description: 'Mevcut carinin tipi sonradan değiştirilebilir.' }
            ],
            tips: [
                'Tip bazlı filtre kullanarak listeleri ayırın.',
                'Her tip için farklı numara serisi kullanılabilir.',
                'Tip bazlı raporlar alınabilir.',
                'Tedarikçi listesi satın alma ekranında görüntülenir.'
            ]
        }
    },
    {
        id: 'balance',
        title: 'Bakiye Takibi',
        icon: 'ri-scales-line',
        content: {
            overview: 'Bakiye takibi, her carinin borç ve alacak durumunu anlık olarak görmenizi sağlar. Cari ekstre ile detaylı hareket geçmişi incelenebilir.',
            steps: [
                { title: 'Anlık Bakiye', description: 'Cari listesinde veya cari detay sayfasında bakiyeyi görün.' },
                { title: 'Bakiye Türü', description: 'Borç bakiyesi (bize borçlu), Alacak bakiyesi (bizim borcumuz).' },
                { title: 'Ekstre Görüntüleme', description: 'Cari detayında "Ekstre" sekmesinden hareketleri inceleyin.' },
                { title: 'Tarih Filtreleme', description: 'Belirli tarih aralığındaki hareketleri filtreleyin.' },
                { title: 'Dönem Bakiyesi', description: 'Ay veya yıl bazlı bakiye değişimini izleyin.' }
            ],
            tips: [
                'Negatif bakiye bizim borcumuzu gösterir.',
                'Vade aşımı olan cari kartlar otomatik raporlanır.',
                'Bakiye yaşlandırma raporu ile vade analizi yapın.',
                'Ekstre PDF olarak müşteriye gönderilebilir.'
            ]
        }
    },
    {
        id: 'credit-limit',
        title: 'Kredi Limiti',
        icon: 'ri-bank-card-line',
        content: {
            overview: 'Kredi limiti, bir müşterinin sizden yapabileceği maksimum borç tutarını belirler. Limit aşıldığında sistem uyarı verir.',
            steps: [
                { title: 'Limit Tanımlama', description: 'Cari kart düzenlerken kredi limitini girin.' },
                { title: 'Limit Kontrolü', description: 'Sipariş alınırken otomatik limit kontrolü yapılır.' },
                { title: 'Aşım Uyarısı', description: 'Limit aşıldığında operatör uyarılır.' },
                { title: 'Limit Artışı', description: 'Yetkili kullanıcı limiti artırabilir.' }
            ],
            tips: [
                'Limit kontrolünü devre dışı bırakmak risklidir.',
                'Müşterinin ödeme geçmişine göre limit belirleyin.',
                'Mevsimsel dönemler için geçici limit artışı yapılabilir.',
                'Kredi limiti raporları ile risk analizi yapın.'
            ]
        }
    },
    {
        id: 'addresses',
        title: 'Teslimat Adresleri',
        icon: 'ri-map-pin-line',
        content: {
            overview: 'Her cari için birden fazla teslimat adresi tanımlanabilir. Sipariş alınırken uygun teslimat adresi seçilir.',
            steps: [
                { title: 'Adres Listesi', description: 'Cari detay sayfasından "Adresler" sekmesini açın.' },
                { title: 'Yeni Adres', description: '"Adres Ekle" butonuyla yeni teslimat adresi girin.' },
                { title: 'Adres Detayları', description: 'Adres adı, tam adres, il/ilçe ve iletişim bilgilerini girin.' },
                { title: 'Varsayılan Adres', description: 'Bir adresi varsayılan olarak işaretleyin.' },
                { title: 'Adres Seçimi', description: 'Sipariş alınırken adres listesinden seçim yapın.' }
            ],
            tips: [
                'Şube bazlı teslimat adresleri oluşturun.',
                'Adres koordinatları ile harita entegrasyonu yapın.',
                'Pasif adresler sipariş ekranında görünmez.',
                'Adres değişikliği geçmişi saklanır.'
            ]
        }
    },
    {
        id: 'contacts',
        title: 'Yetkili Kişiler',
        icon: 'ri-contacts-line',
        content: {
            overview: 'Her cari için birden fazla yetkili kişi tanımlanabilir. Satın alma, muhasebe veya genel iletişim için farklı yetkiler belirlenebilir.',
            steps: [
                { title: 'Kişi Listesi', description: 'Cari detayında "Yetkililer" sekmesini açın.' },
                { title: 'Yeni Kişi', description: '"Kişi Ekle" butonuyla yetkili kişi ekleyin.' },
                { title: 'Kişi Bilgileri', description: 'Ad, soyad, unvan, telefon ve e-posta girin.' },
                { title: 'Rol Atama', description: 'Kişinin rolünü seçin: Genel, Satın Alma, Muhasebe vb.' },
                { title: 'Ana İrtibat', description: 'Birincil irtibat kişisini işaretleyin.' }
            ],
            tips: [
                'Her rol için farklı kişi tanımlayın.',
                'E-posta bildirimleri ilgili kişiye gönderilir.',
                'Telefon numarası formatını doğru girin.',
                'Ayrılan kişiler cari ile birlikte silinmez.'
            ]
        }
    },
    {
        id: 'reports',
        title: 'Cari Raporları',
        icon: 'ri-file-chart-line',
        content: {
            overview: 'Cari raporları, alacak-borç durumu, vade analizi ve müşteri performansı hakkında detaylı bilgi sağlar.',
            steps: [
                { title: 'Bakiye Raporu', description: 'Tüm carilerin güncel bakiyelerini listeleyin.' },
                { title: 'Yaşlandırma Raporu', description: 'Alacakların vade dilimine göre dağılımını görün.' },
                { title: 'Cari Ekstre', description: 'Tek carinin tüm hareketlerini raporlayın.' },
                { title: 'Risk Raporu', description: 'Limit aşımı ve vade aşımı olan carileri listeleyin.' },
                { title: 'Performans Raporu', description: 'Müşteri bazlı satış ve karlılık analizini yapın.' }
            ],
            tips: [
                'Haftalık bakiye raporu ile takip yapın.',
                'Vade aşımı olan müşterilere hatırlatma gönderin.',
                'ABC analizi ile önemli müşterileri belirleyin.',
                'Raporları Excel\'e aktararak analiz yapın.'
            ]
        }
    }
];

export default function CurrentAccounts() {
    const [activeTopic, setActiveTopic] = useState('create-customer');

    return (
        <Layout>
            <Head title="Cari Kartlar - Yardım" />
            <div className="page-content">
                <div className="container-fluid">
                    <div className="row">
                        <div className="col-12">
                            <div className="page-title-box d-sm-flex align-items-center justify-content-between">
                                <h4 className="mb-sm-0">Cari Kartlar Dokümantasyonu</h4>
                                <div className="page-title-right">
                                    <ol className="breadcrumb m-0">
                                        <li className="breadcrumb-item"><Link href="/documentation">Yardım</Link></li>
                                        <li className="breadcrumb-item active">Cari Kartlar</li>
                                    </ol>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="row mb-4">
                        <div className="col-12">
                            <div className="card bg-success bg-gradient text-white">
                                <div className="card-body py-3">
                                    <div className="d-flex align-items-center justify-content-between flex-wrap gap-3">
                                        <div>
                                            <h5 className="text-white mb-1"><i className="ri-user-3-line me-2"></i>Cari Modülüne Hızlı Erişim</h5>
                                            <p className="mb-0 text-white-75">Müşteri ve tedarikçi hesaplarını yönetin</p>
                                        </div>
                                        <div className="d-flex gap-2 flex-wrap">
                                            <Link href="/accounting/current-accounts" className="btn btn-light btn-sm"><i className="ri-user-3-line me-1"></i> Cari Kartlar</Link>
                                            <Link href="/accounting/current-accounts?type=customer" className="btn btn-light btn-sm"><i className="ri-store-line me-1"></i> Müşteriler</Link>
                                            <Link href="/purchasing/suppliers" className="btn btn-light btn-sm"><i className="ri-truck-line me-1"></i> Tedarikçiler</Link>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="row">
                        <div className="col-lg-3">
                            <div className="card sticky-top" style={{ top: '100px' }}>
                                <div className="card-header bg-success text-white">
                                    <h5 className="card-title mb-0"><i className="ri-user-3-line me-2"></i>Cari Kartlar</h5>
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
                                        <h5 className="card-title mb-0"><i className={`${topic.icon} me-2 text-success`}></i>{topic.title}</h5>
                                    </div>
                                    <div className="card-body">
                                        <div className="alert alert-soft-success mb-4"><i className="ri-information-line me-2"></i>{topic.content.overview}</div>
                                        <h6 className="mb-3"><i className="ri-list-ordered me-2"></i>İşlem Adımları</h6>
                                        <div className="timeline-2 mb-4">
                                            {topic.content.steps.map((step, idx) => (
                                                <div key={idx} className="timeline-item pb-3">
                                                    <div className="d-flex">
                                                        <div className="flex-shrink-0"><div className="avatar-xs"><div className="avatar-title bg-success-subtle text-success rounded-circle">{idx + 1}</div></div></div>
                                                        <div className="flex-grow-1 ms-3"><h6 className="mb-1">{step.title}</h6><p className="text-muted mb-0">{step.description}</p></div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="bg-warning-subtle rounded p-3">
                                            <h6 className="mb-3"><i className="ri-lightbulb-line me-2 text-warning"></i>İpuçları</h6>
                                            <ul className="mb-0">{topic.content.tips.map((tip, idx) => (<li key={idx} className="mb-1">{tip}</li>))}</ul>
                                        </div>
                                    </div>
                                </div>
                            ))}

                            <div className="card border-success">
                                <div className="card-body">
                                    <h6 className="mb-3"><i className="ri-links-line me-2"></i>İlgili Konular</h6>
                                    <div className="d-flex flex-wrap gap-2">
                                        <Link href="/documentation/sales-management" className="btn btn-outline-secondary btn-sm">Satış Yönetimi</Link>
                                        <Link href="/documentation/accounting" className="btn btn-outline-secondary btn-sm">Muhasebe</Link>
                                        <Link href="/documentation/crm" className="btn btn-outline-secondary btn-sm">CRM</Link>
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
