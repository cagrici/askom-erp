import React, { useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import Layout from '../../Layouts';

const topics = [
    {
        id: 'products',
        title: 'Ürün Tanımları',
        icon: 'ri-archive-line',
        content: {
            overview: 'Urun tanimlari, satisiniza konu olan tum urunlerin sistemde kayitli tutulmasini saglar. Her urun icin detayli bilgiler, fiyatlar ve stok parametreleri tanimlanır.',
            steps: [
                { title: 'Ürün Listesi', description: '"Ürün Yönetimi > Ürünler" sayfasından tüm ürünleri görün.' },
                { title: 'Yeni Ürün', description: '"Yeni Ürün" butonuyla ürün kartı oluşturun.' },
                { title: 'Temel Bilgiler', description: 'Ürün adı, kodu, kategorisi ve markası girin.' },
                { title: 'Fiyat Bilgileri', description: 'Alış fiyatı, satış fiyatı ve KDV oranını belirleyin.' },
                { title: 'Stok Ayarları', description: 'Minimum stok, birim ve ambalaj bilgilerini girin.' },
                { title: 'Görseller', description: 'Ürün görsellerini yükleyin.' }
            ],
            tips: [
                'Ürün kodu benzersiz olmalıdır ve değiştirilemez.',
                'Toplu ürün import için Excel şablonunu kullanın.',
                'Ürün durumunu pasif yaparak satıştan kaldırabilirsiniz.',
                'Ürün açıklamaları B2B portalda görüntülenir.'
            ]
        }
    },
    {
        id: 'categories',
        title: 'Kategoriler',
        icon: 'ri-folder-line',
        content: {
            overview: 'Kategoriler, ürünlerinizi mantıksal gruplara ayırmanızı sağlar. Hiyerarşik kategori yapısı ile çok seviyeli sınıflandırma yapılabilir.',
            steps: [
                { title: 'Kategori Ağacı', description: '"Ürün Yönetimi > Kategoriler" sayfasından kategori ağacını görün.' },
                { title: 'Üst Kategori', description: 'Ana kategorileri oluşturun (örnek: Elektronik, Giyim).' },
                { title: 'Alt Kategori', description: 'Ana kategorilerin altına alt kategoriler ekleyin.' },
                { title: 'Kategori Özellikleri', description: 'Her kategori için özel özellikler tanımlayın.' },
                { title: 'Sıralama', description: 'Kategorilerin görüntüleme sırasını ayarlayın.' }
            ],
            tips: [
                'Maksimum 5 seviye derinlik önerilir.',
                'Kategori silmeden önce ürünleri taşıyın.',
                'Kategori bazlı iskonto tanımlanabilir.',
                'B2B ve B2C için farklı kategoriler kullanılabilir.'
            ]
        }
    },
    {
        id: 'brands',
        title: 'Markalar',
        icon: 'ri-award-line',
        content: {
            overview: 'Markalar, urunlerinizin ait oldugu ticari markalari tanimlamanizi saglar. Marka bazli raporlama ve filtreleme yapılabilir.',
            steps: [
                { title: 'Marka Listesi', description: '"Ürün Yönetimi > Markalar" sayfasını açın.' },
                { title: 'Yeni Marka', description: 'Marka adı, logo ve açıklama girin.' },
                { title: 'Marka Atama', description: 'Ürün oluştururken markasını seçin.' },
                { title: 'Marka Raporu', description: 'Marka bazlı satış ve stok raporlarını inceleyin.' }
            ],
            tips: [
                'Marka logoları 200x200 px önerilir.',
                'Tedarikçi markalı ürünler için ayrı kategori oluşturun.',
                'Popüler markalar vitrin sayfasında öne çıkarılabilir.',
                'Marka bazlı kampanyalar tanımlanabilir.'
            ]
        }
    },
    {
        id: 'units',
        title: 'Birimler',
        icon: 'ri-ruler-line',
        content: {
            overview: 'Birimler, ürünlerin satış ve stok takibinde kullanılan ölçü birimlerini tanımlar. Adet, kilogram, metre gibi temel birimler ve ambalaj birimleri tanımlanabilir.',
            steps: [
                { title: 'Birim Listesi', description: '"Ürün Yönetimi > Birimler" sayfasını açın.' },
                { title: 'Temel Birim', description: 'Temel birimleri tanımlayın: Adet, Kg, Lt, M.' },
                { title: 'Dönüşüm Oranı', description: 'Birimler arası dönüşüm oranlarını belirleyin.' },
                { title: 'Ürün Birimi', description: 'Her ürüne varsayılan birim atayın.' }
            ],
            tips: [
                'Temel birim en küçük ölçü birimi olmalıdır.',
                'Koli, palet gibi ambalaj birimleri tanımlayın.',
                'Birim değişikliği stok miktarlarını etkiler.',
                'Farklı satış kanalları için farklı birimler kullanılabilir.'
            ]
        }
    },
    {
        id: 'variants',
        title: 'Varyantlar',
        icon: 'ri-palette-line',
        content: {
            overview: 'Varyantlar, aynı ürünün farklı özelliklerini (renk, beden, kapasite) ayrı ayrı takip etmenizi sağlar. Her varyant için ayrı stok ve barkod tutulur.',
            steps: [
                { title: 'Varyant Özellikleri', description: 'Renk, Beden, Kapasite gibi varyant özelliklerini tanımlayın.' },
                { title: 'Ürün Varyantları', description: 'Ana ürüne varyant seçenekleri ekleyin.' },
                { title: 'Varyant Detayları', description: 'Her varyant için barkod, fiyat ve stok girin.' },
                { title: 'Matris Görünümü', description: 'Tüm varyantları matris görünümünde yönetin.' }
            ],
            tips: [
                'Varyant kombinasyonları otomatik oluşturulabilir.',
                'Her varyant için ayrı görsel tanımlanabilir.',
                'Varyant bazlı minimum stok ayarlanabilir.',
                'Varyant fiyatları ana ürün fiyatından farklı olabilir.'
            ]
        }
    },
    {
        id: 'bundles',
        title: 'Ürün Setleri',
        icon: 'ri-stack-line',
        content: {
            overview: 'Ürün setleri, birden fazla ürünü tek bir ürün olarak satmanızı sağlar. Set fiyatları ve stok takibi otomatik yapılır.',
            steps: [
                { title: 'Set Oluşturma', description: '"Ürün Yönetimi > Ürün Setleri" sayfasından yeni set oluşturun.' },
                { title: 'Ürün Ekleme', description: 'Sete dahil olacak ürünleri ve miktarları belirleyin.' },
                { title: 'Fiyat Belirleme', description: 'Set fiyatını manuel veya otomatik hesaplayın.' },
                { title: 'Stok Kontrolü', description: 'Set satışında tüm bileşenlerin stoğu düşer.' }
            ],
            tips: [
                'Set indirimi toplam fiyata göre hesaplanır.',
                'Set stoğu en düşük stoklu ürün kadardır.',
                'Kampanya setleri için geçici setler oluşturun.',
                'Set bileşenleri değiştirilebilir.'
            ]
        }
    },
    {
        id: 'barcodes',
        title: 'Barkod Yönetimi',
        icon: 'ri-barcode-line',
        content: {
            overview: 'Barkod yönetimi, ürünlerinize benzersiz barkodlar atamayı ve barkod etiketleri oluşturmanızı sağlar.',
            steps: [
                { title: 'Barkod Listesi', description: '"Ürün Yönetimi > Barkodlar" sayfasını açın.' },
                { title: 'Barkod Atama', description: 'Ürüne mevcut barkodu girin veya yeni üret.' },
                { title: 'Barkod Türü', description: 'EAN-13, Code128, QR Code gibi türleri seçin.' },
                { title: 'Etiket Yazdırma', description: 'Barkod etiketlerini yazıcıya gönderin.' }
            ],
            tips: [
                'EAN-13 uluslararası standart barkod tipidir.',
                'Dahili barkodlar için önek kullanın.',
                'Toplu barkod yazdırma zamandan tasarruf sağlar.',
                'Barkod okuyucu ile hızlı veri girişi yapın.'
            ]
        }
    },
    {
        id: 'images',
        title: 'Ürün Görselleri',
        icon: 'ri-image-line',
        content: {
            overview: 'Ürün görselleri, ürünlerinizin fotoğraflarını yüklemenizi ve yönetmenizi sağlar. B2B ve B2C kanallarda görsel gösterimi önemlidir.',
            steps: [
                { title: 'Görsel Yükleme', description: 'Ürün detay sayfasından görsel yükleyin.' },
                { title: 'Ana Görsel', description: 'Birden fazla görsel varsa ana görseli seçin.' },
                { title: 'Sıralama', description: 'Görsellerin gösterim sırasını düzenleyin.' },
                { title: 'Toplu Yükleme', description: '"Ürün Görselleri" sayfasından toplu yükleme yapın.' }
            ],
            tips: [
                'Önerilen boyut: 1000x1000 px, maks 2MB.',
                'Beyaz zemin üzerinde ürün fotoğrafları tercih edin.',
                'Farklı açılardan fotoğraflar ekleyin.',
                'Otomatik optimize edilerek boyut küçülür.'
            ]
        }
    }
];

export default function ProductManagement() {
    const [activeTopic, setActiveTopic] = useState('products');

    return (
        <Layout>
            <Head title="Ürün Yönetimi - Yardım" />
            <div className="page-content">
                <div className="container-fluid">
                    <div className="row">
                        <div className="col-12">
                            <div className="page-title-box d-sm-flex align-items-center justify-content-between">
                                <h4 className="mb-sm-0">Ürün Yönetimi Dokümantasyonu</h4>
                                <div className="page-title-right">
                                    <ol className="breadcrumb m-0">
                                        <li className="breadcrumb-item"><Link href={route('dashboard')}>Dashboard</Link></li>
                                        <li className="breadcrumb-item"><Link href="/documentation">Yardım</Link></li>
                                        <li className="breadcrumb-item active">Ürün Yönetimi</li>
                                    </ol>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="row mb-4">
                        <div className="col-12">
                            <div className="card bg-primary bg-gradient text-white">
                                <div className="card-body py-3">
                                    <div className="d-flex align-items-center justify-content-between flex-wrap gap-3">
                                        <div>
                                            <h5 className="text-white mb-1"><i className="ri-archive-line me-2"></i>Ürün Modülüne Hızlı Erişim</h5>
                                            <p className="mb-0 text-white-75">Ürün kataloğunuzu yönetin</p>
                                        </div>
                                        <div className="d-flex gap-2 flex-wrap">
                                            <Link href="/products/list" className="btn btn-light btn-sm"><i className="ri-archive-line me-1"></i> Ürünler</Link>
                                            <Link href="/products/categories" className="btn btn-light btn-sm"><i className="ri-folder-line me-1"></i> Kategoriler</Link>
                                            <Link href="/products/brands" className="btn btn-light btn-sm"><i className="ri-award-line me-1"></i> Markalar</Link>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="row">
                        <div className="col-lg-3">
                            <div className="card sticky-top" style={{ top: '100px' }}>
                                <div className="card-header bg-primary text-white">
                                    <h5 className="card-title mb-0"><i className="ri-archive-line me-2"></i>Ürün Yönetimi</h5>
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
                                        <h5 className="card-title mb-0"><i className={`${topic.icon} me-2 text-primary`}></i>{topic.title}</h5>
                                    </div>
                                    <div className="card-body">
                                        <div className="alert alert-soft-primary mb-4"><i className="ri-information-line me-2"></i>{topic.content.overview}</div>
                                        <h6 className="mb-3"><i className="ri-list-ordered me-2"></i>İşlem Adımları</h6>
                                        <div className="timeline-2 mb-4">
                                            {topic.content.steps.map((step, idx) => (
                                                <div key={idx} className="timeline-item pb-3">
                                                    <div className="d-flex">
                                                        <div className="flex-shrink-0"><div className="avatar-xs"><div className="avatar-title bg-primary-subtle text-primary rounded-circle">{idx + 1}</div></div></div>
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

                            <div className="card border-primary">
                                <div className="card-body">
                                    <h6 className="mb-3"><i className="ri-links-line me-2"></i>İlgili Konular</h6>
                                    <div className="d-flex flex-wrap gap-2">
                                        <Link href="/documentation/stock-management" className="btn btn-outline-secondary btn-sm">Stok Yönetimi</Link>
                                        <Link href="/documentation/sales-management" className="btn btn-outline-secondary btn-sm">Satış Yönetimi</Link>
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
