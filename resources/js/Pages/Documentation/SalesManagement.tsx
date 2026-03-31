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
        relatedLinks: { title: string; link: string; }[];
    };
}

const topics: Topic[] = [
    {
        id: 'orders',
        title: 'Sipariş Yönetimi',
        icon: 'ri-file-list-3-line',
        content: {
            overview: 'Satış siparişleri, müşterilerinizden alınan sipariş bilgilerini kaydetmenizi ve takip etmenizi sağlar. Sipariş süreci tekliften faturaya kadar tüm aşamaları kapsar.',
            steps: [
                { title: 'Yeni Sipariş Oluşturma', description: 'Sol menüden "Satış Yönetimi > Siparişler" sayfasına gidin. Sağ üstteki "Yeni Sipariş" butonuna tıklayın.' },
                { title: 'Müşteri Seçimi', description: 'Sipariş formunda müşteri arama alanına müşteri adı veya kodu yazın. Listeden ilgili müşteriyi seçin.' },
                { title: 'Ürün Ekleme', description: '"Ürün Ekle" butonuna tıklayarak sipariş kalemlerini ekleyin. Ürün, miktar ve birim fiyat bilgilerini girin.' },
                { title: 'Teslimat Bilgileri', description: 'Teslimat adresi, istenen teslimat tarihi ve özel notları girin.' },
                { title: 'Sipariş Onay', description: 'Tüm bilgileri kontrol ettikten sonra "Kaydet" veya "Onayla ve Kaydet" butonuna tıklayın.' }
            ],
            tips: [
                'Sipariş oluştururken önceki siparişleri kopyalayarak zaman kazanabilirsiniz.',
                'Müşteri özeli fiyat listesi varsa otomatik olarak uygulanır.',
                'Stok durumunu sipariş ekranında anlık olarak görebilirsiniz.',
                'Toplu sipariş için Excel import özelliğini kullanabilirsiniz.'
            ],
            relatedLinks: [
                { title: 'Teklif Oluşturma', link: '#offers' },
                { title: 'Fatura Kesme', link: '#invoices' },
                { title: 'Cari Kart Tanımlama', link: '/documentation/current-accounts' }
            ]
        }
    },
    {
        id: 'offers',
        title: 'Teklif Yönetimi',
        icon: 'ri-draft-line',
        content: {
            overview: 'Satış teklifleri, potansiyel veya mevcut müşterilerinize fiyat ve ürün bilgilerini resmi olarak sunmanızı sağlar. Teklifler onaylandığında siparişe dönüştürülebilir.',
            steps: [
                { title: 'Yeni Teklif Oluşturma', description: '"Satış Yönetimi > Teklifler" sayfasından "Yeni Teklif" butonuna tıklayın.' },
                { title: 'Teklif Bilgileri', description: 'Müşteri, geçerlilik süresi, ödeme koşulları ve teslimat şartlarını belirleyin.' },
                { title: 'Ürünleri Ekleyin', description: 'Teklif edilecek ürünleri, miktarları ve birim fiyatları girin. İskonto uygulayabilirsiniz.' },
                { title: 'PDF Oluşturma', description: '"PDF Oluştur" butonuyla profesyonel görünümlü teklif dokümanı oluşturun.' },
                { title: 'Teklif Gönderme', description: 'PDF\'i e-posta ile doğrudan müşteriye gönderebilir veya indirebilirsiniz.' },
                { title: 'Siparişe Dönüştürme', description: 'Onaylanan teklifi "Siparişe Dönüştür" butonu ile tek tıkla siparişe çevirin.' }
            ],
            tips: [
                'Teklif geçerlilik süresi dolmadan hatırlatma bildirimi alırsınız.',
                'Teklif PDF\'inde firma logonuz ve iletişim bilgileriniz otomatik eklenir.',
                'Farklı para birimlerinde teklif oluşturabilirsiniz.',
                'Teklif revizyonları otomatik numaralanır (Rev.1, Rev.2 vb.).'
            ],
            relatedLinks: [
                { title: 'Sipariş Oluşturma', link: '#orders' },
                { title: 'Fiyat Listeleri', link: '#price-lists' },
                { title: 'CRM Pipeline', link: '/documentation/crm' }
            ]
        }
    },
    {
        id: 'invoices',
        title: 'Fatura Yönetimi',
        icon: 'ri-bill-line',
        content: {
            overview: 'Satış faturaları, tamamlanan siparişlerin mali kayıtlarını oluşturmanızı sağlar. E-fatura entegrasyonu ile yasal uyumluluk sağlanır.',
            steps: [
                { title: 'Fatura Oluşturma Yöntemleri', description: 'Fatura, siparişten otomatik veya manuel olarak oluşturulabilir.' },
                { title: 'Siparişten Fatura', description: 'Sipariş detay sayfasında "Fatura Oluştur" butonuna tıklayın. Sipariş bilgileri otomatik aktarılır.' },
                { title: 'Manuel Fatura', description: '"Faturalar" sayfasından "Yeni Fatura" ile boş fatura oluşturun.' },
                { title: 'Fatura Detayları', description: 'Fatura tarihi, vade tarihi, KDV oranları ve özel notları kontrol edin.' },
                { title: 'Fatura Onay', description: 'Faturayı onaylayın. Onaylanan faturalar değiştirilemez.' },
                { title: 'E-Fatura Gönderim', description: 'Entegrasyon aktifse e-fatura otomatik GİB\'e iletilir.' }
            ],
            tips: [
                'Fatura numaraları otomatik sıra ile oluşturulur.',
                'İrsaliyeli fatura seçeneği ile sevkiyatla birlikte fatura kesebilirsiniz.',
                'Fatura iptal işlemi için "İptal Faturası" oluşturmanız gerekir.',
                'Dövizli faturalarda kur bilgisi otomatik çekilir.'
            ],
            relatedLinks: [
                { title: 'Tahsilat İşlemi', link: '/documentation/accounting' },
                { title: 'E-Fatura Ayarları', link: '/documentation/settings' },
                { title: 'Sipariş Yönetimi', link: '#orders' }
            ]
        }
    },
    {
        id: 'returns',
        title: 'İade Yönetimi',
        icon: 'ri-arrow-go-back-line',
        content: {
            overview: 'Satış iadeleri, müşteriden geri dönen ürünlerin takibini ve muhasebe kayıtlarının düzenlenmesini sağlar.',
            steps: [
                { title: 'İade Talebi Oluşturma', description: '"Satış Yönetimi > İadeler" sayfasından "Yeni İade" butonuna tıklayın.' },
                { title: 'Orijinal Sipariş/Fatura Seçimi', description: 'İade edilecek ürünlerin bulunduğu sipariş veya faturayı seçin.' },
                { title: 'İade Edilecek Ürünler', description: 'İade edilecek ürünleri ve miktarları belirleyin. İade nedenini seçin.' },
                { title: 'Kalite Kontrol', description: 'İade ürünler depoya ulaştığında kalite kontrol işlemi başlatın.' },
                { title: 'İade Faturası', description: 'İade onaylandığında otomatik iade faturası oluşturulur.' },
                { title: 'Stok Güncelleme', description: 'İade ürünler kalite kontrolden geçerse stoka iade edilir.' }
            ],
            tips: [
                'İade nedenleri raporlama için kategorize edilmiştir.',
                'Kısmi iade yapabilirsiniz (siparişte bazı ürünler).',
                'İade süreci mail bildirimleri ile takip edilebilir.',
                'Hasarlı ürünler için ayrı fire kaydı oluşturabilirsiniz.'
            ],
            relatedLinks: [
                { title: 'Stok Düzeltme', link: '/documentation/stock-management' },
                { title: 'Kalite Kontrol', link: '/documentation/warehouse-management' },
                { title: 'Fatura İptali', link: '#invoices' }
            ]
        }
    },
    {
        id: 'campaigns',
        title: 'Kampanya Yönetimi',
        icon: 'ri-gift-line',
        content: {
            overview: 'Satış kampanyaları, belirli dönemler veya koşullar için özel fiyatlandırma ve promosyonlar tanımlamanızı sağlar.',
            steps: [
                { title: 'Yeni Kampanya Tanımlama', description: '"Satış Yönetimi > Kampanyalar" sayfasından yeni kampanya oluşturun.' },
                { title: 'Kampanya Türü', description: 'Yüzde iskonto, sabit indirim, al-öyle veya hediye ürün seçeneklerinden birini seçin.' },
                { title: 'Geçerlilik Tarihleri', description: 'Kampanyanın başlangıç ve bitiş tarihlerini belirleyin.' },
                { title: 'Koşullar', description: 'Minimum sepet tutarı, belirli ürün kategorileri veya müşteri grupları gibi koşullar tanımlayın.' },
                { title: 'Kampanya Aktivasyonu', description: 'Kampanyayı aktif hale getirin. Belirtilen tarihler arasında otomatik uygulanır.' }
            ],
            tips: [
                'Aynı anda birden fazla kampanya aktif olabilir.',
                'Kampanyalar sipariş ve teklif ekranlarında otomatik uygulanır.',
                'Kampanya performansını raporlar bölümünden takip edebilirsiniz.',
                'Özel müşteri gruplarına özel kampanyalar tanımlayabilirsiniz.'
            ],
            relatedLinks: [
                { title: 'Fiyat Listeleri', link: '#price-lists' },
                { title: 'İskonto Tanımları', link: '#discounts' },
                { title: 'Satış Raporları', link: '/documentation/reports' }
            ]
        }
    },
    {
        id: 'price-lists',
        title: 'Fiyat Listeleri',
        icon: 'ri-price-tag-3-line',
        content: {
            overview: 'Fiyat listeleri, farklı müşteri grupları veya satış kanalları için özel fiyatlandırma yapmanızı sağlar.',
            steps: [
                { title: 'Fiyat Listesi Oluşturma', description: '"Satış Yönetimi > Fiyat Listeleri" sayfasından yeni liste oluşturun.' },
                { title: 'Liste Özellikleri', description: 'Liste adı, para birimi ve geçerlilik tarihlerini belirleyin.' },
                { title: 'Ürün Fiyatları', description: 'Listedeki ürünler için özel fiyatlar tanımlayın.' },
                { title: 'Müşteri Atama', description: 'Fiyat listesini belirli müşteri veya müşteri gruplarına atayın.' },
                { title: 'Varsayılan Liste', description: 'Bir listeyi varsayılan olarak işaretleyebilirsiniz.' }
            ],
            tips: [
                'Excel ile toplu fiyat güncelleme yapabilirsiniz.',
                'Fiyat listesi hiyerarşisi: Müşteri özeli > Grup listesi > Genel liste.',
                'Geçerliliği dolan fiyat listeleri otomatik deaktive olur.',
                'Fiyat değişim geçmişi saklanır ve raporlanabilir.'
            ],
            relatedLinks: [
                { title: 'Kampanyalar', link: '#campaigns' },
                { title: 'Müşteri Tanımları', link: '/documentation/current-accounts' },
                { title: 'Ürün Yönetimi', link: '/documentation/product-management' }
            ]
        }
    },
    {
        id: 'discounts',
        title: 'İskonto Yönetimi',
        icon: 'ri-percent-line',
        content: {
            overview: 'İskonto tanımları, satış işlemlerinde uygulanacak indirim kurallarını belirlemenizi sağlar.',
            steps: [
                { title: 'İskonto Türü Seçimi', description: 'Yüzde iskonto, miktar iskontosu veya kademeli iskonto seçin.' },
                { title: 'Uygulama Alanı', description: 'İskonto tüm ürünlere mi, belirli kategorilere mi yoksa belirli ürünlere mi uygulanacak?' },
                { title: 'Koşulları Belirleyin', description: 'Minimum miktar, minimum tutar gibi koşullar ekleyin.' },
                { title: 'Öncelik Sırası', description: 'Birden fazla iskonto geçerli olduğunda hangisinin öncelikli olacağını belirleyin.' }
            ],
            tips: [
                'İskontolar otomatik veya manuel olarak uygulanabilir.',
                'Maksimum iskonto limitleri tanımlanabilir.',
                'Satış temsilcisi bazlı iskonto yetkileri ayarlanabilir.',
                'İskonto onay akışı tanımlanabilir (belirli oranların üzerinde onay gerekir).'
            ],
            relatedLinks: [
                { title: 'Kampanyalar', link: '#campaigns' },
                { title: 'Fiyat Listeleri', link: '#price-lists' },
                { title: 'Kullanıcı Yetkileri', link: '/documentation/settings' }
            ]
        }
    },
    {
        id: 'analytics',
        title: 'Satış Analitiği',
        icon: 'ri-line-chart-line',
        content: {
            overview: 'Satış analitiği, satış performansınızı ölçmenizi ve stratejik kararlar almanızı sağlar.',
            steps: [
                { title: 'Dashboard Görüntüleme', description: '"Satış Yönetimi > Satış Analitiği" sayfasını açın.' },
                { title: 'Tarih Aralığı Seçimi', description: 'Analiz etmek istediğiniz dönemi seçin.' },
                { title: 'Grafik ve Metrikler', description: 'Satış trendi, ürün bazlı satış, müşteri bazlı satış grafiklerini inceleyin.' },
                { title: 'Karşılaştırmalı Analiz', description: 'Önceki dönemlerle karşılaştırmalı analiz yapın.' },
                { title: 'Rapor Dışa Aktarma', description: 'Analizleri PDF veya Excel olarak dışa aktarın.' }
            ],
            tips: [
                'Dashboard\'daki kartlara tıklayarak detay raporlara ulaşabilirsiniz.',
                'Filtreleri kaydederek sık kullanılan analizlere hızlı erişim sağlayın.',
                'Hedeflerle kıyaslama için satış hedeflerini tanımlayın.',
                'Otomatik rapor gönderimi ayarlayabilirsiniz.'
            ],
            relatedLinks: [
                { title: 'Satış Raporları', link: '/documentation/reports' },
                { title: 'Satış Hedefleri', link: '#targets' },
                { title: 'CRM Dashboard', link: '/documentation/crm' }
            ]
        }
    }
];

const DocumentationSidebar = ({ topics, activeTopic, setActiveTopic }: {
    topics: Topic[];
    activeTopic: string;
    setActiveTopic: (id: string) => void;
}) => (
    <div className="card sticky-top" style={{ top: '100px' }}>
        <div className="card-header bg-success text-white">
            <h5 className="card-title mb-0">
                <i className="ri-shopping-cart-line me-2"></i>
                Satış Yönetimi
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
);

export default function SalesManagement() {
    const [activeTopic, setActiveTopic] = useState('orders');

    return (
        <Layout>
            <Head title="Satış Yönetimi - Yardım" />
            <div className="page-content">
                <div className="container-fluid">
                    {/* Page Header */}
                    <div className="row">
                        <div className="col-12">
                            <div className="page-title-box d-sm-flex align-items-center justify-content-between">
                                <h4 className="mb-sm-0">Satış Yönetimi Dokümantasyonu</h4>
                                <div className="page-title-right">
                                    <ol className="breadcrumb m-0">
                                        <li className="breadcrumb-item">
                                            <Link href={route('dashboard')}>Dashboard</Link>
                                        </li>
                                        <li className="breadcrumb-item">
                                            <Link href="/documentation">Yardim</Link>
                                        </li>
                                        <li className="breadcrumb-item active">Satis Yonetimi</li>
                                    </ol>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Quick Access Banner */}
                    <div className="row mb-4">
                        <div className="col-12">
                            <div className="card bg-success bg-gradient text-white">
                                <div className="card-body py-3">
                                    <div className="d-flex align-items-center justify-content-between flex-wrap gap-3">
                                        <div>
                                            <h5 className="text-white mb-1">
                                                <i className="ri-shopping-cart-line me-2"></i>
                                                Satis Modulune Hizli Erisim
                                            </h5>
                                            <p className="mb-0 text-white-75">Siparis, teklif ve fatura islemlerinize hemen baslayin</p>
                                        </div>
                                        <div className="d-flex gap-2 flex-wrap">
                                            <Link href="/sales/orders" className="btn btn-light btn-sm">
                                                <i className="ri-file-list-3-line me-1"></i> Siparisler
                                            </Link>
                                            <Link href="/sales/offers" className="btn btn-light btn-sm">
                                                <i className="ri-draft-line me-1"></i> Teklifler
                                            </Link>
                                            <Link href="/sales/invoices" className="btn btn-light btn-sm">
                                                <i className="ri-bill-line me-1"></i> Faturalar
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
                            <DocumentationSidebar
                                topics={topics}
                                activeTopic={activeTopic}
                                setActiveTopic={setActiveTopic}
                            />
                        </div>

                        {/* Content */}
                        <div className="col-lg-9">
                            {topics.map((topic) => (
                                <div key={topic.id} id={topic.id} className="card mb-4">
                                    <div className="card-header">
                                        <h5 className="card-title mb-0">
                                            <i className={`${topic.icon} me-2 text-success`}></i>
                                            {topic.title}
                                        </h5>
                                    </div>
                                    <div className="card-body">
                                        {/* Overview */}
                                        <div className="alert alert-soft-info mb-4">
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
                                                                <div className="avatar-title bg-success-subtle text-success rounded-circle">
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
                                        <div className="bg-warning-subtle rounded p-3 mb-4">
                                            <h6 className="mb-3">
                                                <i className="ri-lightbulb-line me-2 text-warning"></i>
                                                İpuçları
                                            </h6>
                                            <ul className="mb-0">
                                                {topic.content.tips.map((tip, idx) => (
                                                    <li key={idx} className="mb-1">{tip}</li>
                                                ))}
                                            </ul>
                                        </div>

                                        {/* Related Links */}
                                        <h6 className="mb-2">
                                            <i className="ri-links-line me-2"></i>
                                            İlgili Konular
                                        </h6>
                                        <div className="d-flex flex-wrap gap-2">
                                            {topic.content.relatedLinks.map((link, idx) => (
                                                <a
                                                    key={idx}
                                                    href={link.link}
                                                    className="btn btn-outline-secondary btn-sm"
                                                    onClick={(e) => {
                                                        if (link.link.startsWith('#')) {
                                                            e.preventDefault();
                                                            setActiveTopic(link.link.substring(1));
                                                            document.getElementById(link.link.substring(1))?.scrollIntoView({ behavior: 'smooth' });
                                                        }
                                                    }}
                                                >
                                                    {link.title}
                                                </a>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ))}

                            {/* Need More Help */}
                            <div className="card border-info">
                                <div className="card-body">
                                    <div className="d-flex">
                                        <div className="flex-shrink-0">
                                            <i className="ri-customer-service-2-line text-info" style={{ fontSize: '40px' }}></i>
                                        </div>
                                        <div className="flex-grow-1 ms-3">
                                            <h5>Daha Fazla Yardım Gerekiyor mu?</h5>
                                            <p className="text-muted mb-2">
                                                Satış modülü ile ilgili sorularınız için destek ekibimize ulaşın.
                                            </p>
                                            <Link href="/documentation/faq" className="btn btn-info btn-sm me-2">
                                                <i className="ri-question-line me-1"></i>
                                                SSS
                                            </Link>
                                            <a href="mailto:destek@askom.com.tr" className="btn btn-outline-info btn-sm">
                                                <i className="ri-mail-line me-1"></i>
                                                Destek Talebi
                                            </a>
                                        </div>
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
