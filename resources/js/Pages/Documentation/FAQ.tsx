import React, { useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import Layout from '../../Layouts';

interface FAQItem {
    question: string;
    answer: string;
}

interface FAQCategory {
    id: string;
    title: string;
    icon: string;
    faqs: FAQItem[];
}

const faqCategories: FAQCategory[] = [
    {
        id: 'general',
        title: 'Genel Sorular',
        icon: 'ri-question-line',
        faqs: [
            {
                question: 'Sisteme nasıl giriş yaparım?',
                answer: 'Tarayıcınıza sistem adresinizi yazın, kullanıcı adınız (e-posta) ve şifrenizle giriş yapın. "Beni Hatırla" seçeneği ile bir sonraki girişte bilgileriniz hatırlanır.'
            },
            {
                question: 'Şifremi unuttum, ne yapmalıyım?',
                answer: 'Giriş ekranında "Şifremi Unuttum" linkine tıklayın. E-posta adresinizi girin ve size şifre sıfırlama bağlantısı gönderilecektir.'
            },
            {
                question: 'Oturumum neden otomatik kapanıyor?',
                answer: 'Güvenlik nedeniyle belirli bir süre işlem yapılmadığında oturum otomatik kapatılır. Bu süre sistem ayarlarından değiştirilebilir. "Beni Hatırla" seçeneği ile daha uzun süre açık kalır.'
            },
            {
                question: 'Hangi tarayıcılar destekleniyor?',
                answer: 'Google Chrome, Mozilla Firefox, Microsoft Edge ve Safari tarayıcılarının güncel sürümleri desteklenmektedir. En iyi deneyim için Chrome önerilir.'
            },
            {
                question: 'Mobil cihazlardan kullanabilir miyim?',
                answer: 'Evet, sistem responsive tasarıma sahiptir ve tablet/mobil cihazlardan kullanılabilir. Bazı detaylı işlemler için masaüstü tercih edilir.'
            }
        ]
    },
    {
        id: 'sales',
        title: 'Satış İşlemleri',
        icon: 'ri-shopping-cart-line',
        faqs: [
            {
                question: 'Yeni sipariş nasıl oluştururum?',
                answer: 'Sol menüden "Satış Yönetimi > Siparişler" sayfasına gidin, "Yeni Sipariş" butonuna tıklayın. Müşteri seçin, ürünleri ekleyin ve kaydedin.'
            },
            {
                question: 'Siparişi nasıl iptal ederim?',
                answer: 'Sipariş detay sayfasında "İptal" butonuna tıklayın. Faturalanmış siparişler iptal edilemez, bunun yerine iade işlemi yapılmalıdır.'
            },
            {
                question: 'Teklif PDF\'i nasıl oluştururum?',
                answer: 'Teklif detay sayfasında "PDF Oluştur" butonuna tıklayın. PDF indirilecek veya doğrudan müşteriye mail atabilirsiniz.'
            },
            {
                question: 'İskonto nasıl uygularım?',
                answer: 'Sipariş/Teklif ekranında ürün satırında veya genel toplam üzerinde iskonto girebilirsiniz. Yetkiniz dahilindeki oranları uygulayabilirsiniz.'
            },
            {
                question: 'Fatura nasıl keserim?',
                answer: 'Sipariş detay sayfasından "Fatura Oluştur" butonuna tıklayın. Sipariş bilgileri otomatik aktarılır, kontrol edip onaylayın.'
            }
        ]
    },
    {
        id: 'stock',
        title: 'Stok & Depo',
        icon: 'ri-stack-line',
        faqs: [
            {
                question: 'Ürünün stok durumunu nasıl görürüm?',
                answer: '"Stok Yönetimi > Stok Listesi" sayfasından ürün arayarak güncel stok miktarını görebilirsiniz. Depo bazlı dağılımı da inceleyebilirsiniz.'
            },
            {
                question: 'Stok transferi nasıl yaparım?',
                answer: '"Stok Yönetimi > Stok Transferi" sayfasından kaynak ve hedef depoyu seçin, transfer edilecek ürünleri ekleyin ve kaydedin.'
            },
            {
                question: 'Stok sayım farkı nasıl girerim?',
                answer: '"Stok Yönetimi > Stok Düzeltme" sayfasından düzeltme kaydı oluşturun. Gerçek miktarı girin ve düzeltme nedenini seçin.'
            },
            {
                question: 'Minimum stok uyarısı nasıl alırım?',
                answer: 'Ürün kartında minimum stok seviyesini tanımlayın. Stok bu seviyenin altına düşerse otomatik uyarı alırsınız ve Dashboard\'da görüntülenir.'
            },
            {
                question: 'Depo bölgeleri nasıl tanımlanır?',
                answer: '"Depo Yönetimi > Depo Bölgeleri" sayfasından ilgili depoyu seçerek bölge tanımlayabilirsiniz. Her bölge için özellikler belirlenebilir.'
            }
        ]
    },
    {
        id: 'crm',
        title: 'CRM & Müşteriler',
        icon: 'ri-customer-service-line',
        faqs: [
            {
                question: 'Lead ile müşteri arasındaki fark nedir?',
                answer: 'Lead potansiyel müşterileri temsil eder, henüz satış gerçekleşmemiş. Lead\'i müşteriye dönüştürdüğünüzde cari kart oluşturulur ve satış yapılabilir.'
            },
            {
                question: 'Lead\'i müşteriye nasıl dönüştürürüm?',
                answer: 'Lead detay sayfasında "Müşteriye Dönüştür" butonuna tıklayın. Cari kart otomatik oluşturulur, mevcut bir cariyle de eşleştirebilirsiniz.'
            },
            {
                question: 'Aktivite nasıl kayıt ederim?',
                answer: 'Lead veya müşteri detay sayfasında "Aktivite Ekle" butonuna tıklayın. Aktivite tipi, tarih, notlar ve katılımcıları girin.'
            },
            {
                question: 'Pipeline görünümünü nasıl kullanırım?',
                answer: 'Pipeline sayfasında teklifleri sürükle-bırak yöntemiyle aşamalar arasında taşıyabilirsiniz. Her aşamadaki toplam değeri görebilirsiniz.'
            },
            {
                question: 'Müşteri iletişim geçmişini nasıl görürüm?',
                answer: 'Müşteri detay sayfasında "Aktiviteler" sekmesinden tüm iletişim geçmişini kronolojik olarak inceleyebilirsiniz.'
            }
        ]
    },
    {
        id: 'accounting',
        title: 'Muhasebe & Finans',
        icon: 'ri-calculator-line',
        faqs: [
            {
                question: 'Tahsilat nasıl kayıt ederim?',
                answer: '"Muhasebe > Tahsilatlar" sayfasından "Yeni Tahsilat" butonuna tıklayın. Müşteri, tutar ve ödeme yöntemini seçip kaydedin.'
            },
            {
                question: 'Çek tahsilatı nasıl izlenir?',
                answer: 'Tahsilat kaydında ödeme yöntemi olarak "Çek" seçin ve vade tarihini girin. Vade takviminden bekleyen çekleri takip edebilirsiniz.'
            },
            {
                question: 'Müşteri bakiyesini nasıl görürüm?',
                answer: '"Muhasebe > Cari Kartlar" sayfasından müşteriyi bulun, bakiye kolonunda güncel bakiyeyi görebilirsiniz. Detay için cari kartını açın.'
            },
            {
                question: 'Vade aşımı raporunu nasıl alırım?',
                answer: '"Muhasebe > Vade Analizleri" sayfasından yaşlandırma raporunu görüntüleyin. Vade dilimlerine göre alacakları takip edin.'
            },
            {
                question: 'Masraf kaydı nasıl oluştururum?',
                answer: '"Muhasebe > Masraf Yönetimi" sayfasından "Yeni Masraf" butonuyla masraf kaydı oluşturun. Kategori ve belge bilgilerini girin.'
            }
        ]
    },
    {
        id: 'products',
        title: 'Ürün Yönetimi',
        icon: 'ri-archive-line',
        faqs: [
            {
                question: 'Yeni ürün nasıl tanımlarım?',
                answer: '"Ürün Yönetimi > Ürünler" sayfasından "Yeni Ürün" butonuyla ürün kartı oluşturun. Temel bilgiler, fiyat ve stok ayarlarını girin.'
            },
            {
                question: 'Toplu ürün aktarımı nasıl yaparım?',
                answer: 'Ürün listesi sayfasında "İçe Aktar" butonuna tıklayın, Excel şablonunu indirin, doldurun ve yükleyin.'
            },
            {
                question: 'Ürün varyantları nasıl oluşturulur?',
                answer: 'Ürün kartında "Varyantlar" sekmesinden özellik (renk, beden vb.) seçin. Kombinasyonlar otomatik oluşturulur.'
            },
            {
                question: 'Barkod nasıl tanımlarım?',
                answer: 'Ürün kartında barkod alanına mevcut barkodu girin veya "Üret" butonuyla sistem tarafından benzersiz barkod oluşturun.'
            },
            {
                question: 'Ürün görselleri nasıl eklenir?',
                answer: 'Ürün detay sayfasında "Görseller" sekmesinden fotoğrafları sürükle-bırak veya seç-yükle yöntemiyle ekleyebilirsiniz.'
            }
        ]
    },
    {
        id: 'reports',
        title: 'Raporlama',
        icon: 'ri-bar-chart-line',
        faqs: [
            {
                question: 'Satış raporu nasıl alırım?',
                answer: '"Raporlar > Satış Raporları" sayfasından rapor türünü seçin, tarih aralığı ve filtreleri belirleyin, "Rapor Oluştur" butonuna tıklayın.'
            },
            {
                question: 'Raporu Excel\'e nasıl aktarırım?',
                answer: 'Rapor sonuç ekranında "Excel\'e Aktar" veya "PDF İndir" butonlarına tıklayarak dışa aktarabilirsiniz.'
            },
            {
                question: 'Otomatik rapor gönderimini nasıl ayarlarım?',
                answer: 'Rapor oluşturma ekranında "Zamanlama" sekmesinden gün, saat ve alıcı e-posta adreslerini belirleyerek otomatik gönderim ayarlayabilirsiniz.'
            },
            {
                question: 'Özel rapor nasıl oluştururum?',
                answer: '"Raporlar > Özel Raporlar" sayfasından rapor tasarımcısını kullanarak ihtiyacınıza yönelik raporlar oluşturabilirsiniz.'
            }
        ]
    },
    {
        id: 'technical',
        title: 'Teknik Sorunlar',
        icon: 'ri-tools-line',
        faqs: [
            {
                question: 'Sayfa yüklenmiyor veya hata alıyorsam ne yapmalıyım?',
                answer: 'Tarayıcı önbelleğini temizleyin (Ctrl+Shift+Delete), sayfayı yenileyin. Sorun devam ederse farklı tarayıcı deneyin veya destek ekibiyle iletişime geçin.'
            },
            {
                question: 'Yazdırma işlemi çalışmıyor, ne yapmalıyım?',
                answer: 'Tarayıcı yazdırma ayarlarınızı kontrol edin, pop-up engelleyicisini devre dışı bırakın. PDF indirip yazdırmayı deneyin.'
            },
            {
                question: 'Sistem yavaş çalışıyor, nasıl hızlandırabilirim?',
                answer: 'Tarayıcıda açık sekme sayısını azaltın, tarayıcı güncellemelerini yapın, internet bağlantınızı kontrol edin.'
            },
            {
                question: 'Veri kaybı yaşadım, geri getirebilir misiniz?',
                answer: 'Sistem düzenli yedeklenmektedir. Destek ekibiyle iletişime geçerek veri kurtarma talebi oluşturabilirsiniz.'
            },
            {
                question: 'Entegrasyon hatası alıyorsam ne yapmalıyım?',
                answer: 'Entegrasyon ayarlarını kontrol edin, API anahtarlarının geçerliliğini doğrulayın. Hata devam ederse entegrasyon loglarını destek ekibiyle paylaşın.'
            }
        ]
    }
];

export default function FAQ() {
    const [activeCategory, setActiveCategory] = useState('general');
    const [expandedFaqs, setExpandedFaqs] = useState<Record<string, boolean>>({});
    const [searchQuery, setSearchQuery] = useState('');

    const toggleFaq = (categoryId: string, faqIndex: number) => {
        const key = `${categoryId}-${faqIndex}`;
        setExpandedFaqs(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const filteredCategories = faqCategories.map(category => ({
        ...category,
        faqs: category.faqs.filter(faq =>
            faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
            faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
        )
    })).filter(category => category.faqs.length > 0);

    return (
        <Layout>
            <Head title="Sıkça Sorulan Sorular - Yardım" />
            <div className="page-content">
                <div className="container-fluid">
                    <div className="row">
                        <div className="col-12">
                            <div className="page-title-box d-sm-flex align-items-center justify-content-between">
                                <h4 className="mb-sm-0">Sıkça Sorulan Sorular</h4>
                                <div className="page-title-right">
                                    <ol className="breadcrumb m-0">
                                        <li className="breadcrumb-item"><Link href={route('dashboard')}>Dashboard</Link></li>
                                        <li className="breadcrumb-item"><Link href="/documentation">Yardım</Link></li>
                                        <li className="breadcrumb-item active">SSS</li>
                                    </ol>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Search */}
                    <div className="row mb-4">
                        <div className="col-lg-8 mx-auto">
                            <div className="card bg-primary bg-gradient">
                                <div className="card-body py-4">
                                    <h4 className="text-white text-center mb-3">
                                        <i className="ri-question-answer-line me-2"></i>
                                        Nasıl Yardımcı Olabiliriz?
                                    </h4>
                                    <div className="input-group input-group-lg">
                                        <span className="input-group-text bg-white border-end-0">
                                            <i className="ri-search-line text-muted"></i>
                                        </span>
                                        <input
                                            type="text"
                                            className="form-control border-start-0"
                                            placeholder="Sorunuzu yazın..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="row">
                        {/* Category Sidebar */}
                        <div className="col-lg-3">
                            <div className="card sticky-top" style={{ top: '100px' }}>
                                <div className="card-header">
                                    <h5 className="card-title mb-0">
                                        <i className="ri-folders-line me-2"></i>
                                        Kategoriler
                                    </h5>
                                </div>
                                <div className="card-body p-0">
                                    <div className="list-group list-group-flush">
                                        {faqCategories.map((category) => (
                                            <button
                                                key={category.id}
                                                className={`list-group-item list-group-item-action d-flex align-items-center justify-content-between ${activeCategory === category.id ? 'active' : ''}`}
                                                onClick={() => setActiveCategory(category.id)}
                                            >
                                                <span>
                                                    <i className={`${category.icon} me-2`}></i>
                                                    {category.title}
                                                </span>
                                                <span className={`badge ${activeCategory === category.id ? 'bg-white text-primary' : 'bg-primary-subtle text-primary'}`}>
                                                    {category.faqs.length}
                                                </span>
                                            </button>
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

                        {/* FAQ Content */}
                        <div className="col-lg-9">
                            {searchQuery ? (
                                // Search Results
                                <div className="card">
                                    <div className="card-header">
                                        <h5 className="card-title mb-0">
                                            <i className="ri-search-line me-2"></i>
                                            Arama Sonuçları: "{searchQuery}"
                                        </h5>
                                    </div>
                                    <div className="card-body">
                                        {filteredCategories.length === 0 ? (
                                            <div className="text-center py-5">
                                                <i className="ri-search-line text-muted" style={{ fontSize: '60px' }}></i>
                                                <h5 className="mt-3">Sonuç Bulunamadı</h5>
                                                <p className="text-muted">Farklı anahtar kelimelerle tekrar deneyin.</p>
                                                <button className="btn btn-primary" onClick={() => setSearchQuery('')}>
                                                    Aramayı Temizle
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="accordion" id="searchResults">
                                                {filteredCategories.map((category) => (
                                                    <div key={category.id}>
                                                        <h6 className="text-muted mt-3 mb-2">
                                                            <i className={`${category.icon} me-2`}></i>
                                                            {category.title}
                                                        </h6>
                                                        {category.faqs.map((faq, idx) => {
                                                            const key = `search-${category.id}-${idx}`;
                                                            return (
                                                                <div key={key} className="accordion-item">
                                                                    <h2 className="accordion-header">
                                                                        <button
                                                                            className={`accordion-button ${expandedFaqs[key] ? '' : 'collapsed'}`}
                                                                            type="button"
                                                                            onClick={() => setExpandedFaqs(prev => ({ ...prev, [key]: !prev[key] }))}
                                                                        >
                                                                            {faq.question}
                                                                        </button>
                                                                    </h2>
                                                                    <div className={`accordion-collapse collapse ${expandedFaqs[key] ? 'show' : ''}`}>
                                                                        <div className="accordion-body text-muted">{faq.answer}</div>
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                // Category View
                                faqCategories.map((category) => (
                                    <div
                                        key={category.id}
                                        className={`card ${activeCategory === category.id ? '' : 'd-none'}`}
                                    >
                                        <div className="card-header">
                                            <h5 className="card-title mb-0">
                                                <i className={`${category.icon} me-2 text-primary`}></i>
                                                {category.title}
                                            </h5>
                                        </div>
                                        <div className="card-body">
                                            <div className="accordion" id={`accordion-${category.id}`}>
                                                {category.faqs.map((faq, idx) => {
                                                    const key = `${category.id}-${idx}`;
                                                    return (
                                                        <div key={key} className="accordion-item">
                                                            <h2 className="accordion-header">
                                                                <button
                                                                    className={`accordion-button ${expandedFaqs[key] ? '' : 'collapsed'}`}
                                                                    type="button"
                                                                    onClick={() => toggleFaq(category.id, idx)}
                                                                >
                                                                    <i className="ri-question-mark me-2 text-primary"></i>
                                                                    {faq.question}
                                                                </button>
                                                            </h2>
                                                            <div className={`accordion-collapse collapse ${expandedFaqs[key] ? 'show' : ''}`}>
                                                                <div className="accordion-body">
                                                                    <p className="text-muted mb-0">{faq.answer}</p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}

                            {/* Contact Support */}
                            <div className="card border-info mt-4">
                                <div className="card-body">
                                    <div className="d-flex">
                                        <div className="flex-shrink-0">
                                            <i className="ri-customer-service-2-line text-info" style={{ fontSize: '50px' }}></i>
                                        </div>
                                        <div className="flex-grow-1 ms-4">
                                            <h5>Sorunuz Cevaplanamadı mı?</h5>
                                            <p className="text-muted mb-3">
                                                Aradığınız cevabı bulamadıysanız destek ekibimizle iletişime geçebilirsiniz.
                                                En kısa sürede size yardımcı olacağız.
                                            </p>
                                            <div className="d-flex gap-2 flex-wrap">
                                                <a href="mailto:destek@askom.com.tr" className="btn btn-info">
                                                    <i className="ri-mail-line me-1"></i>
                                                    E-posta Gönder
                                                </a>
                                                <a href="tel:+902123456789" className="btn btn-outline-info">
                                                    <i className="ri-phone-line me-1"></i>
                                                    Bizi Arayın
                                                </a>
                                            </div>
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
