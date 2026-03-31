import React, { useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import Layout from '../../Layouts';

const topics = [
    {
        id: 'general',
        title: 'Genel Ayarlar',
        icon: 'ri-settings-line',
        content: {
            overview: 'Genel ayarlar, sistem genelinde geçerli olacak temel yapılandırmaları içerir. Firma bilgileri, bölgesel ayarlar ve görsel tercihler burada yapılır.',
            steps: [
                { title: 'Ayarlar Sayfası', description: '"Sistem Ayarları > Genel Ayarlar" sayfasını açın.' },
                { title: 'Uygulama Bilgileri', description: 'Uygulama adı ve açıklamasını girin.' },
                { title: 'Firma Bilgileri', description: 'Firma adı, adresi, telefon ve e-posta bilgilerini girin.' },
                { title: 'Bölgesel Ayarlar', description: 'Para birimi, dil, saat dilimi ve tarih formatını seçin.' },
                { title: 'Kaydet', description: 'Değişiklikleri kaydedin.' }
            ],
            tips: [
                'Firma bilgileri fatura ve raporlarda görüntülenir.',
                'Para birimi tüm mali işlemlerde varsayılan olarak kullanılır.',
                'Tarih formatı tüm ekranlarda uygulanır.',
                'Değişiklikler anında etki eder.'
            ]
        }
    },
    {
        id: 'company',
        title: 'Firma Bilgileri',
        icon: 'ri-building-2-line',
        content: {
            overview: 'Firma bilgileri, yasal ve ticari kimlik bilgilerinizi sistemde saklar. Bu bilgiler resmi belgelerde kullanılır.',
            steps: [
                { title: 'Firma Sayfası', description: '"Sistem Ayarları > Firma Bilgileri" sayfasını açın.' },
                { title: 'Yasal Bilgiler', description: 'Vergi dairesi, vergi no, ticaret sicil no girin.' },
                { title: 'Logo', description: 'Firma logosunu yükleyin.' },
                { title: 'Banka Bilgileri', description: 'Varsayılan banka hesap bilgilerini girin.' },
                { title: 'E-fatura', description: 'E-fatura mükelleflik bilgilerini girin.' }
            ],
            tips: [
                'Logo 300x100 px boyutunda önerilir.',
                'Vergi numarası doğru girilmeli, faturalarda kullanılır.',
                'Birden fazla firma için lokasyon tanımlayın.',
                'E-fatura ayarları entegratör ile uyumlu olmalı.'
            ]
        }
    },
    {
        id: 'locations',
        title: 'Lokasyonlar',
        icon: 'ri-map-pin-line',
        content: {
            overview: 'Lokasyonlar, firmanızın farklı şubelerini veya çalışma alanlarını tanımlar. Her lokasyon için ayrı depolar ve personel tanımlanabilir.',
            steps: [
                { title: 'Lokasyon Listesi', description: '"Sistem Ayarları > Lokasyonlar" sayfasını açın.' },
                { title: 'Yeni Lokasyon', description: 'Lokasyon adı, adresi ve iletişim bilgilerini girin.' },
                { title: 'Lokasyon Tipi', description: 'Merkez, şube, depo, mağaza gibi tipler seçin.' },
                { title: 'Ayarlar', description: 'Lokasyona özel fiyat listesi ve iskonto tanımlayın.' },
                { title: 'Personel', description: 'Lokasyona ait personeli belirleyin.' }
            ],
            tips: [
                'Her lokasyon için ayrı numara serisi kullanılabilir.',
                'Lokasyon bazlı stok takibi yapılır.',
                'Kullanıcılar belirli lokasyonlarla sınırlanabilir.',
                'Lokasyonlar arası transfer işlemi desteklenir.'
            ]
        }
    },
    {
        id: 'currencies',
        title: 'Para Birimleri',
        icon: 'ri-money-dollar-box-line',
        content: {
            overview: 'Para birimleri, sistemde kullanılacak döviz cinslerini ve kur bilgilerini tanımlar. Çoklu para birimi desteği sağlar.',
            steps: [
                { title: 'Para Birimi Listesi', description: '"Sistem Ayarları > Para Birimleri" sayfasını açın.' },
                { title: 'Varsayılan Birim', description: 'Ana para biriminizi belirleyin (genellikle TRY).' },
                { title: 'Ek Birimler', description: 'Kullanacağınız döviz birimlerini ekleyin (USD, EUR vb.).' },
                { title: 'Kur Güncelleme', description: 'Güncel döviz kurlarını otomatik veya manuel girin.' },
                { title: 'Görüntüleme', description: 'Ondalık ve binlik ayraçlarını belirleyin.' }
            ],
            tips: [
                'TCMB kur entegrasyonu ile otomatik güncelleme yapılabilir.',
                'Dövizli faturalarda kur sabitlenebilir.',
                'Kur farkı otomatik hesaplanır.',
                'Geçmiş kur verileri saklanır.'
            ]
        }
    },
    {
        id: 'tax',
        title: 'Vergi Ayarları',
        icon: 'ri-percent-line',
        content: {
            overview: 'Vergi ayarları, KDV ve diğer vergi oranlarının tanımlanmasını sağlar. Ürünler ve hizmetler için farklı oranlar belirlenebilir.',
            steps: [
                { title: 'Vergi Listesi', description: '"Sistem Ayarları > Vergi Ayarları" sayfasını açın.' },
                { title: 'Yeni Vergi', description: 'Vergi adı ve oranını girin (örnek: KDV %20).' },
                { title: 'Varsayılan', description: 'Varsayılan vergi oranını belirleyin.' },
                { title: 'Ürün Atama', description: 'Ürünlere uygun vergi oranlarını atayın.' },
                { title: 'Muafiyet', description: 'Vergi muafiyeti durumlarını tanımlayın.' }
            ],
            tips: [
                'Yasal vergi oranları değişikliklerini takip edin.',
                'İhracat işlemleri için %0 KDV kullanın.',
                'Vergi değişiklikleri mevcut belgeleri etkilemez.',
                'Vergi detayları e-faturada otomatik raporlanır.'
            ]
        }
    },
    {
        id: 'email',
        title: 'E-posta Ayarları',
        icon: 'ri-mail-settings-line',
        content: {
            overview: 'E-posta ayarları, sistemden gönderilecek maillerin sunucu ayarlarını ve şablon yapılandırmalarını içerir.',
            steps: [
                { title: 'SMTP Ayarları', description: '"Sistem Ayarları > E-posta" sayfasını açın.' },
                { title: 'Sunucu Bilgileri', description: 'SMTP host, port, kullanıcı adı ve şifre girin.' },
                { title: 'Gönderici', description: 'Varsayılan gönderici adı ve e-posta adresini belirleyin.' },
                { title: 'Test', description: 'Test maili göndererek ayarları doğrulayın.' },
                { title: 'Şablonlar', description: 'E-posta şablonlarını kişiselleştirin.' }
            ],
            tips: [
                'SSL/TLS şifreleme kullanın.',
                'Spam filtresine takılmamak için SPF ve DKIM ayarlayın.',
                'Farklı işlem türleri için farklı şablonlar kullanın.',
                'Başarısız gönderimler raporlanır.'
            ]
        }
    },
    {
        id: 'integrations',
        title: 'Entegrasyonlar',
        icon: 'ri-plug-line',
        content: {
            overview: 'Entegrasyonlar, dış sistemlerle bağlantı kurmanızı sağlar. E-fatura, muhasebe yazılımı, kargo firmaları gibi entegrasyonlar yapılabilir.',
            steps: [
                { title: 'Entegrasyon Listesi', description: '"Sistem Ayarları > Entegrasyonlar" sayfasını açın.' },
                { title: 'Entegrasyon Seçimi', description: 'Kullanmak istediğiniz entegrasyonu seçin.' },
                { title: 'API Ayarları', description: 'API anahtarları ve bağlantı bilgilerini girin.' },
                { title: 'Test', description: 'Bağlantı testini gerçekleştirin.' },
                { title: 'Aktivasyon', description: 'Entegrasyonu aktif hale getirin.' }
            ],
            tips: [
                'API anahtarlarını güvenli saklayın.',
                'Entegrasyon loglarını düzenli kontrol edin.',
                'Hata durumlarında otomatik yeniden deneme ayarlayın.',
                'Entegrasyon sürümleri uyumluluğunu kontrol edin.'
            ]
        }
    },
    {
        id: 'backup',
        title: 'Yedekleme',
        icon: 'ri-database-2-line',
        content: {
            overview: 'Yedekleme ayarları, veri güvenliğinizi sağlamak için otomatik ve manuel yedekleme işlemlerini yönetmenizi sağlar.',
            steps: [
                { title: 'Yedekleme Sayfası', description: '"Sistem Ayarları > Yedekleme" sayfasını açın.' },
                { title: 'Manuel Yedek', description: '"Yedek Al" butonuyla anlık yedek oluşturun.' },
                { title: 'Otomatik Yedek', description: 'Günlük/haftalık otomatik yedekleme zamanlayın.' },
                { title: 'Yedek Listesi', description: 'Mevcut yedekleri görüntüleyin ve indirin.' },
                { title: 'Geri Yükleme', description: 'Gerektiğinde yedekten geri yükleme yapın.' }
            ],
            tips: [
                'Yedekleri farklı lokasyonlarda saklayın.',
                'Yedekleme başarılarını mail ile bildirin.',
                'Eski yedekleri periyodik olarak temizleyin.',
                'Geri yükleme testlerini düzenli yapın.'
            ]
        }
    }
];

export default function Settings() {
    const [activeTopic, setActiveTopic] = useState('general');

    return (
        <Layout>
            <Head title="Sistem Ayarları - Yardım" />
            <div className="page-content">
                <div className="container-fluid">
                    <div className="row">
                        <div className="col-12">
                            <div className="page-title-box d-sm-flex align-items-center justify-content-between">
                                <h4 className="mb-sm-0">Sistem Ayarları Dokümantasyonu</h4>
                                <div className="page-title-right">
                                    <ol className="breadcrumb m-0">
                                        <li className="breadcrumb-item"><Link href={route('dashboard')}>Dashboard</Link></li>
                                        <li className="breadcrumb-item"><Link href="/documentation">Yardım</Link></li>
                                        <li className="breadcrumb-item active">Sistem Ayarları</li>
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
                                            <h5 className="text-white mb-1"><i className="ri-settings-3-line me-2"></i>Ayarlar Modülüne Hızlı Erişim</h5>
                                            <p className="mb-0 text-white-75">Sistem yapılandırmalarını yönetin</p>
                                        </div>
                                        <div className="d-flex gap-2 flex-wrap">
                                            <Link href="/settings/general" className="btn btn-light btn-sm"><i className="ri-settings-line me-1"></i> Genel</Link>
                                            <Link href="/settings/company" className="btn btn-light btn-sm"><i className="ri-building-2-line me-1"></i> Firma</Link>
                                            <Link href="/settings/email" className="btn btn-light btn-sm"><i className="ri-mail-settings-line me-1"></i> E-posta</Link>
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
                                    <h5 className="card-title mb-0"><i className="ri-settings-3-line me-2"></i>Sistem Ayarları</h5>
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
                                        <div className="timeline-2 mb-4">
                                            {topic.content.steps.map((step, idx) => (
                                                <div key={idx} className="timeline-item pb-3">
                                                    <div className="d-flex">
                                                        <div className="flex-shrink-0"><div className="avatar-xs"><div className="avatar-title bg-secondary-subtle text-secondary rounded-circle">{idx + 1}</div></div></div>
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

                            <div className="card border-secondary">
                                <div className="card-body">
                                    <h6 className="mb-3"><i className="ri-links-line me-2"></i>İlgili Konular</h6>
                                    <div className="d-flex flex-wrap gap-2">
                                        <Link href="/documentation/user-management" className="btn btn-outline-secondary btn-sm">Kullanıcı Yönetimi</Link>
                                        <Link href="/documentation/faq" className="btn btn-outline-secondary btn-sm">Sıkça Sorulan Sorular</Link>
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
