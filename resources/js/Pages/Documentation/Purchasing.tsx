import React, { useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import Layout from '../../Layouts';

const topics = [
    {
        id: 'orders',
        title: 'Satın Alma Siparişleri',
        icon: 'ri-file-list-3-line',
        content: {
            overview: 'Satın alma siparişleri, tedarikçilerden ürün teminini planlamak ve takip etmek için kullanılır. Sipariş oluşturma, onay süreci ve teslimat takibi yapılır.',
            steps: [
                { title: 'Sipariş Listesi', description: '"Satın Alma > Siparişler" sayfasına gidin.' },
                { title: 'Yeni Sipariş', description: '"Yeni Sipariş" butonuna tıklayarak sipariş oluşturun.' },
                { title: 'Tedarikçi Seçimi', description: 'Sipariş verilecek tedarikçiyi seçin.' },
                { title: 'Ürün Ekleme', description: 'Sipariş kalemlerini, miktarları ve fiyatları girin.' },
                { title: 'Onay Süreci', description: 'Siparişi onaya gönderin ve onay bekleyin.' },
                { title: 'Tedarikçi Bildirimi', description: 'Onaylanan sipariş tedarikçiye mail ile gönderilir.' }
            ],
            tips: [
                'Minimum sipariş tutarı kontrolü yapılır.',
                'Tekrarlayan siparişler için şablon oluşturun.',
                'Birden fazla tedarikçi teklifini karşılaştırın.',
                'Sipariş geçmişi ile tedarikçi performansını takip edin.'
            ]
        }
    },
    {
        id: 'requests',
        title: 'Satın Alma Talepleri',
        icon: 'ri-inbox-line',
        content: {
            overview: 'Satın alma talepleri, departmanlardan gelen ihtiyaçların merkezi olarak toplanmasını ve değerlendirilmesini sağlar.',
            steps: [
                { title: 'Talep Oluşturma', description: 'İlgili departman personeli talep oluşturur.' },
                { title: 'Talep Detayları', description: 'İstenen ürün, miktar ve aciliyet derecesini belirtir.' },
                { title: 'Onay Akışı', description: 'Talep belirlenen onay hiyerarşisinden geçer.' },
                { title: 'Satın Alma Değerlendirmesi', description: 'Satın alma birimi talepleri inceler.' },
                { title: 'Siparişe Dönüştürme', description: 'Uygun talepler satın alma siparişine dönüştürülür.' }
            ],
            tips: [
                'Acil talepler öncelikli işlenir.',
                'Bütçe kontrolü ile talep onay akışı entegredir.',
                'Benzer talepler birleştirilerek ekonomi sağlanır.',
                'Talep durumları kullanıcıya bildirilir.'
            ]
        }
    },
    {
        id: 'suppliers',
        title: 'Tedarikçi Yönetimi',
        icon: 'ri-building-4-line',
        content: {
            overview: 'Tedarikçi yönetimi, iş ortaklarınızın bilgilerini, performansını ve ilişkilierinizi takip etmenizi sağlar.',
            steps: [
                { title: 'Tedarikçi Listesi', description: '"Satın Alma > Tedarikçiler" sayfasını açın.' },
                { title: 'Yeni Tedarikçi', description: 'Tedarikçi bilgilerini sisteme girin.' },
                { title: 'İletişim Bilgileri', description: 'Yetkili kişiler ve iletişim detaylarını kaydedin.' },
                { title: 'Ürün İlişkilendirme', description: 'Tedarikçinin sunduğu ürünleri belirleyin.' },
                { title: 'Fiyat Listeleri', description: 'Anlaşmalı fiyat listelerini yükleyin.' }
            ],
            tips: [
                'Alternatif tedarikçi tanımlayın, risk azaltın.',
                'Tedarikçi değerlendirmesi periyodik yapılmalı.',
                'Sertifika ve belge takibi yapın.',
                'Tedarikçi puanlama sistemi kullanın.'
            ]
        }
    },
    {
        id: 'offers',
        title: 'Tedarikçi Teklifleri',
        icon: 'ri-draft-line',
        content: {
            overview: 'Tedarikçi teklifleri, farklı tedarikçilerden alınan fiyat tekliflerinin karşılaştırılmasını ve en uygun seçimin yapılmasını sağlar.',
            steps: [
                { title: 'Teklif Talebi', description: 'Seçili tedarikçilere teklif talebi gönderin.' },
                { title: 'Teklif Girişi', description: 'Gelen teklifleri sisteme kaydedin.' },
                { title: 'Karşılaştırma', description: 'Teklifleri fiyat, vade ve koşullara göre karşılaştırın.' },
                { title: 'Seçim', description: 'En uygun teklifi seçin ve siparişe dönüştürün.' },
                { title: 'Arşivleme', description: 'Seçilmeyen teklifler gelecek referans için saklanır.' }
            ],
            tips: [
                'Minimum 3 tedarikçi teklifi alın.',
                'Teslim süresi ve ödeme koşullarını da değerlendirin.',
                'Kalite geçmişini fiyatla birlikte dikkate alın.',
                'Teklif geçerlilik sürelerine dikkat edin.'
            ]
        }
    },
    {
        id: 'contracts',
        title: 'Sözleşmeler',
        icon: 'ri-file-paper-line',
        content: {
            overview: 'Tedarikçi sözleşmeleri, uzun vadeli iş birliklerinin yasal çerçevesini ve koşullarını belirler.',
            steps: [
                { title: 'Sözleşme Listesi', description: '"Satın Alma > Sözleşmeler" sayfasını açın.' },
                { title: 'Yeni Sözleşme', description: 'Sözleşme detaylarını sisteme girin.' },
                { title: 'Koşullar', description: 'Fiyat, miktar, vade ve teslim koşullarını belirleyin.' },
                { title: 'Doküman Yükleme', description: 'İmzalı sözleşme dokümanını yükleyin.' },
                { title: 'Takip', description: 'Sözleşme bitiş tarihini ve yenileme sürecini takip edin.' }
            ],
            tips: [
                'Sözleşme bitmeden yenileme görüşmesi başlatın.',
                'Sözleşmedeki fiyatlar otomatik uygulanır.',
                'Sözleşme dışı alımlar için uyarı verin.',
                'Cezai şart ve garanti koşullarını kaydedin.'
            ]
        }
    },
    {
        id: 'invoices',
        title: 'Alış Faturaları',
        icon: 'ri-bill-line',
        content: {
            overview: 'Alış faturaları, tedarikçilerden gelen faturaların kaydedilmesini ve muhasebe entegrasyonunu sağlar.',
            steps: [
                { title: 'Fatura Girişi', description: '"Satın Alma > Alış Faturaları" sayfasından fatura girin.' },
                { title: 'Sipariş Eşleştirme', description: 'Faturayı ilgili satın alma siparişi ile eşleştirin.' },
                { title: 'Miktar Kontrolü', description: 'Fatura miktarları ile teslim alınan miktarları karşılaştırın.' },
                { title: 'Onay', description: 'Fatura uygunsa onaylayın, muhasebe kaydı oluşur.' },
                { title: 'Ödeme Planlama', description: 'Vade tarihine göre ödeme planlayın.' }
            ],
            tips: [
                'Fatura-sipariş eşleşmeyen durumlar raporlanır.',
                'E-fatura otomatik işlenir.',
                'Fatura iptali için onay gerekir.',
                'Vade takibi ile erken ödeme indirimi yakalanabilir.'
            ]
        }
    },
    {
        id: 'performance',
        title: 'Tedarikçi Performansı',
        icon: 'ri-line-chart-line',
        content: {
            overview: 'Tedarikçi performans değerlendirmesi, iş ortaklarınızın kalite, teslimat ve fiyat performansını ölçer.',
            steps: [
                { title: 'Performans Kriterleri', description: 'Zamanında teslimat, kalite, fiyat uygunluğu kriterleri.' },
                { title: 'Otomatik Hesaplama', description: 'Sistem siparişlerden otomatik puan hesaplar.' },
                { title: 'Manuel Değerlendirme', description: 'Ek kriterler için manuel puan girin.' },
                { title: 'Raporlama', description: 'Tedarikçi karşılaştırma raporlarını inceleyin.' },
                { title: 'Aksiyon', description: 'Düşük performans için iyileştirme planı oluşturun.' }
            ],
            tips: [
                'Çeyreklik performans değerlendirmesi yapın.',
                'A-B-C sınıflandırması ile tedarikçileri kategorize edin.',
                'Performans puanını yeni sipariş kararlarında kullanın.',
                'Uzun süreli düşük performans için alternatif arayın.'
            ]
        }
    }
];

export default function Purchasing() {
    const [activeTopic, setActiveTopic] = useState('orders');

    return (
        <Layout>
            <Head title="Satın Alma - Yardım" />
            <div className="page-content">
                <div className="container-fluid">
                    <div className="row">
                        <div className="col-12">
                            <div className="page-title-box d-sm-flex align-items-center justify-content-between">
                                <h4 className="mb-sm-0">Satın Alma Dokümantasyonu</h4>
                                <div className="page-title-right">
                                    <ol className="breadcrumb m-0">
                                        <li className="breadcrumb-item"><Link href="/documentation">Yardım</Link></li>
                                        <li className="breadcrumb-item active">Satın Alma</li>
                                    </ol>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="row mb-4">
                        <div className="col-12">
                            <div className="card bg-info bg-gradient text-white">
                                <div className="card-body py-3">
                                    <div className="d-flex align-items-center justify-content-between flex-wrap gap-3">
                                        <div>
                                            <h5 className="text-white mb-1"><i className="ri-shopping-bag-line me-2"></i>Satın Alma Modülüne Hızlı Erişim</h5>
                                            <p className="mb-0 text-white-75">Tedarik süreçlerinizi yönetin</p>
                                        </div>
                                        <div className="d-flex gap-2 flex-wrap">
                                            <Link href="/purchasing/orders" className="btn btn-light btn-sm"><i className="ri-file-list-3-line me-1"></i> Siparişler</Link>
                                            <Link href="/purchasing/suppliers" className="btn btn-light btn-sm"><i className="ri-building-4-line me-1"></i> Tedarikçiler</Link>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="row">
                        <div className="col-lg-3">
                            <div className="card sticky-top" style={{ top: '100px' }}>
                                <div className="card-header bg-info text-white">
                                    <h5 className="card-title mb-0"><i className="ri-shopping-bag-line me-2"></i>Satın Alma</h5>
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
                                        <h5 className="card-title mb-0"><i className={`${topic.icon} me-2 text-info`}></i>{topic.title}</h5>
                                    </div>
                                    <div className="card-body">
                                        <div className="alert alert-soft-info mb-4"><i className="ri-information-line me-2"></i>{topic.content.overview}</div>
                                        <h6 className="mb-3"><i className="ri-list-ordered me-2"></i>İşlem Adımları</h6>
                                        <div className="timeline-2 mb-4">
                                            {topic.content.steps.map((step, idx) => (
                                                <div key={idx} className="timeline-item pb-3">
                                                    <div className="d-flex">
                                                        <div className="flex-shrink-0"><div className="avatar-xs"><div className="avatar-title bg-info-subtle text-info rounded-circle">{idx + 1}</div></div></div>
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

                            <div className="card border-info">
                                <div className="card-body">
                                    <h6 className="mb-3"><i className="ri-links-line me-2"></i>İlgili Konular</h6>
                                    <div className="d-flex flex-wrap gap-2">
                                        <Link href="/documentation/warehouse-management" className="btn btn-outline-secondary btn-sm">Depo Yönetimi</Link>
                                        <Link href="/documentation/stock-management" className="btn btn-outline-secondary btn-sm">Stok Yönetimi</Link>
                                        <Link href="/documentation/accounting" className="btn btn-outline-secondary btn-sm">Muhasebe</Link>
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
