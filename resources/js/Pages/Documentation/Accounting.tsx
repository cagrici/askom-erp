import React, { useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import Layout from '../../Layouts';

const topics = [
    {
        id: 'collections',
        title: 'Tahsilatlar',
        icon: 'ri-money-dollar-circle-line',
        content: {
            overview: 'Tahsilatlar, müşterilerden yapılan ödemelerin kaydedilmesini ve takibini sağlar. Nakit, kredi kartı, havale ve çek tahsilatları işlenebilir.',
            steps: [
                { title: 'Tahsilat Listesi', description: '"Muhasebe > Tahsilatlar" sayfasını açın.' },
                { title: 'Yeni Tahsilat', description: '"Yeni Tahsilat" butonuyla tahsilat kaydı oluşturun.' },
                { title: 'Cari Seçimi', description: 'Tahsilat yapacağınız müşteriyi seçin.' },
                { title: 'Ödeme Yöntemi', description: 'Nakit, banka, kredi kartı veya çek seçin.' },
                { title: 'Tutar ve Tarih', description: 'Tahsilat tutarı ve tarihini girin.' },
                { title: 'Fatura Eşleştirme', description: 'Tahsilatı açık faturalarla eşleştirin.' }
            ],
            tips: [
                'Kısmi tahsilat yapılabilir.',
                'Çek tahsilatında vade tarihi belirleyin.',
                'Banka tahsilatında dekont no girin.',
                'Açık faturalar otomatik kapanır.'
            ]
        }
    },
    {
        id: 'payments',
        title: 'Ödemeler',
        icon: 'ri-bank-card-2-line',
        content: {
            overview: 'Ödemeler, tedarikçilere ve diğer gider kalemlerine yapılan ödemelerin takibini sağlar.',
            steps: [
                { title: 'Ödeme Listesi', description: '"Muhasebe > Ödemeler" sayfasını açın.' },
                { title: 'Yeni Ödeme', description: '"Yeni Ödeme" butonuyla ödeme kaydı oluşturun.' },
                { title: 'Alıcı Seçimi', description: 'Ödeme yapılacak cari veya gider kalemini seçin.' },
                { title: 'Ödeme Yöntemi', description: 'Nakit, banka transferi veya çek seçin.' },
                { title: 'Onay', description: 'Ödeme onay süreci tamamlanınca işlem gerçekleşir.' }
            ],
            tips: [
                'Toplu ödeme ile zaman kazanın.',
                'Ödeme onay akışı tanımlanabilir.',
                'Vade tarihi yaklaşan faturalar raporlanır.',
                'Erken ödeme indirimi uygulanabilir.'
            ]
        }
    },
    {
        id: 'bank-accounts',
        title: 'Banka Hesapları',
        icon: 'ri-bank-line',
        content: {
            overview: 'Banka hesapları, firma banka hesaplarının tanımı ve hareketlerinin takibini sağlar.',
            steps: [
                { title: 'Hesap Listesi', description: '"Muhasebe > Banka Hesapları" sayfasını açın.' },
                { title: 'Yeni Hesap', description: 'Banka, şube ve hesap bilgilerini girin.' },
                { title: 'IBAN', description: 'IBAN numarasını kaydedin.' },
                { title: 'Bakiye Takibi', description: 'Hesap bakiyelerini güncel tutun.' },
                { title: 'Hareketler', description: 'Banka hareketlerini inceleyin.' }
            ],
            tips: [
                'Her lokasyon için ayrı hesap tanımlayabilirsiniz.',
                'Varsayılan tahsilat hesabını belirleyin.',
                'Banka ekstreleri ile mutabakat yapın.',
                'Döviz hesapları için kur takibi yapılır.'
            ]
        }
    },
    {
        id: 'cash',
        title: 'Kasa İşlemleri',
        icon: 'ri-safe-2-line',
        content: {
            overview: 'Kasa işlemleri, nakit para hareketlerinin takibini sağlar. Her lokasyon için ayrı kasa tanımlanabilir.',
            steps: [
                { title: 'Kasa Listesi', description: '"Muhasebe > Kasa İşlemleri" sayfasını açın.' },
                { title: 'Kasa Tanımı', description: 'Lokasyon bazlı kasa tanımları yapın.' },
                { title: 'Gelir Girişi', description: 'Kasaya para girişi kaydedin.' },
                { title: 'Gider Çıkışı', description: 'Kasadan para çıkışı kaydedin.' },
                { title: 'Günlük Kapanış', description: 'Gün sonunda kasa sayımı ve kapanış yapın.' }
            ],
            tips: [
                'Kasa limiti belirleyerek güvenlik sağlayın.',
                'Kasadan bankaya transfer kaydı tutun.',
                'Kasa sayım farkları için düzeltme yapılır.',
                'Yetkisiz kasa işlemleri uyarı oluşturur.'
            ]
        }
    },
    {
        id: 'expenses',
        title: 'Masraf Yönetimi',
        icon: 'ri-receipt-line',
        content: {
            overview: 'Masraf yönetimi, operasyonel giderlerin kaydı, kategorize edilmesi ve bütçe takibini sağlar.',
            steps: [
                { title: 'Masraf Listesi', description: '"Muhasebe > Masraf Yönetimi" sayfasını açın.' },
                { title: 'Yeni Masraf', description: 'Masraf detaylarını girin.' },
                { title: 'Kategori Seçimi', description: 'Masraf kategorisini seçin (kira, fatura, personel vb.).' },
                { title: 'Belge Yükleme', description: 'Fatura veya fiş görselini yükleyin.' },
                { title: 'Onay', description: 'Masraf onay sürecini tamamlayın.' }
            ],
            tips: [
                'Masraf kategorileri raporlama için önemlidir.',
                'Periyodik masraflar için tekrar şablonu oluşturun.',
                'Bütçe aşımı uyarıları alabilirsiniz.',
                'Departman bazlı masraf takibi yapılabilir.'
            ]
        }
    },
    {
        id: 'aging',
        title: 'Vade Analizleri',
        icon: 'ri-calendar-todo-line',
        content: {
            overview: 'Vade analizi, alacak ve borçlarınızın vade dilimlerine göre dağılımını gösterir. Risk yönetimi için kritik öneme sahiptir.',
            steps: [
                { title: 'Yaşlandırma Raporu', description: '"Muhasebe > Vade Analizleri" sayfasını açın.' },
                { title: 'Vade Dilimleri', description: '0-30, 31-60, 61-90, 90+ gün dilimleri.' },
                { title: 'Alacak Analizi', description: 'Müşteri alacaklarının vade dağılımını görün.' },
                { title: 'Borç Analizi', description: 'Tedarikçi borçlarının vade dağılımını görün.' },
                { title: 'Aksiyon', description: 'Vade aşımı için tahsilat/ödeme aksiyonu başlatın.' }
            ],
            tips: [
                'Haftalık yaşlandırma raporu inceleyin.',
                'Kritik vadelere öncelik verin.',
                'Ödeme hatırlatma mailleri otomatik gönderilir.',
                'Yaşlandırma verileri nakit akışı planlamasında kullanılır.'
            ]
        }
    }
];

export default function Accounting() {
    const [activeTopic, setActiveTopic] = useState('collections');

    return (
        <Layout>
            <Head title="Muhasebe & Finans - Yardım" />
            <div className="page-content">
                <div className="container-fluid">
                    <div className="row">
                        <div className="col-12">
                            <div className="page-title-box d-sm-flex align-items-center justify-content-between">
                                <h4 className="mb-sm-0">Muhasebe & Finans Dokümantasyonu</h4>
                                <div className="page-title-right">
                                    <ol className="breadcrumb m-0">
                                        <li className="breadcrumb-item"><Link href={route('dashboard')}>Dashboard</Link></li>
                                        <li className="breadcrumb-item"><Link href="/documentation">Yardım</Link></li>
                                        <li className="breadcrumb-item active">Muhasebe</li>
                                    </ol>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="row mb-4">
                        <div className="col-12">
                            <div className="card bg-warning bg-gradient">
                                <div className="card-body py-3">
                                    <div className="d-flex align-items-center justify-content-between flex-wrap gap-3">
                                        <div>
                                            <h5 className="text-dark mb-1"><i className="ri-calculator-line me-2"></i>Muhasebe Modülüne Hızlı Erişim</h5>
                                            <p className="mb-0 text-dark opacity-75">Finansal işlemlerinizi yönetin</p>
                                        </div>
                                        <div className="d-flex gap-2 flex-wrap">
                                            <Link href="/accounting/collections" className="btn btn-dark btn-sm"><i className="ri-money-dollar-circle-line me-1"></i> Tahsilatlar</Link>
                                            <Link href="/accounting/payments" className="btn btn-dark btn-sm"><i className="ri-bank-card-2-line me-1"></i> Ödemeler</Link>
                                            <Link href="/accounting/bank-accounts" className="btn btn-dark btn-sm"><i className="ri-bank-line me-1"></i> Banka</Link>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="row">
                        <div className="col-lg-3">
                            <div className="card sticky-top" style={{ top: '100px' }}>
                                <div className="card-header bg-warning">
                                    <h5 className="card-title mb-0 text-dark"><i className="ri-calculator-line me-2"></i>Muhasebe & Finans</h5>
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
                                        <h5 className="card-title mb-0"><i className={`${topic.icon} me-2 text-warning`}></i>{topic.title}</h5>
                                    </div>
                                    <div className="card-body">
                                        <div className="alert alert-soft-warning mb-4"><i className="ri-information-line me-2"></i>{topic.content.overview}</div>
                                        <h6 className="mb-3"><i className="ri-list-ordered me-2"></i>İşlem Adımları</h6>
                                        <div className="timeline-2 mb-4">
                                            {topic.content.steps.map((step, idx) => (
                                                <div key={idx} className="timeline-item pb-3">
                                                    <div className="d-flex">
                                                        <div className="flex-shrink-0"><div className="avatar-xs"><div className="avatar-title bg-warning-subtle text-warning rounded-circle">{idx + 1}</div></div></div>
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

                            <div className="card border-warning">
                                <div className="card-body">
                                    <h6 className="mb-3"><i className="ri-links-line me-2"></i>İlgili Konular</h6>
                                    <div className="d-flex flex-wrap gap-2">
                                        <Link href="/documentation/current-accounts" className="btn btn-outline-secondary btn-sm">Cari Kartlar</Link>
                                        <Link href="/documentation/sales-management" className="btn btn-outline-secondary btn-sm">Satış Yönetimi</Link>
                                        <Link href="/documentation/reports" className="btn btn-outline-secondary btn-sm">Raporlar</Link>
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
