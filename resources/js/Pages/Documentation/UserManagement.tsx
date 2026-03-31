import React, { useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import Layout from '../../Layouts';

const topics = [
    {
        id: 'users',
        title: 'Kullanıcı Yönetimi',
        icon: 'ri-user-line',
        content: {
            overview: 'Kullanıcı yönetimi, sisteme erişim hakkı olan kullanıcıların tanımı, yetkilendirilmesi ve güvenlik ayarlarının yapılmasını sağlar.',
            steps: [
                { title: 'Kullanıcı Listesi', description: '"Yönetim > Kullanıcılar" sayfasını açın.' },
                { title: 'Yeni Kullanıcı', description: '"Yeni Kullanıcı" butonuyla kullanıcı ekleyin.' },
                { title: 'Temel Bilgiler', description: 'Ad, soyad, e-posta ve telefon girin.' },
                { title: 'Şifre', description: 'Geçici şifre belirleyin veya davet maili gönderin.' },
                { title: 'Rol Atama', description: 'Kullanıcıya uygun rol(ler) atayın.' },
                { title: 'Departman/Lokasyon', description: 'Bağlı olduğu departman ve lokasyonu seçin.' }
            ],
            tips: [
                'Güçlü şifre politikası uygulayın.',
                'Ayrılan personelin hesabını hemen deaktive edin.',
                'Tek bir hesabı birden fazla kişi kullanmasın.',
                'Periyodik şifre değişikliğini zorunlu kılın.'
            ]
        }
    },
    {
        id: 'roles',
        title: 'Roller',
        icon: 'ri-shield-user-line',
        content: {
            overview: 'Roller, benzer yetkilere sahip kullanıcı gruplarını tanımlar. Bir kullanıcıya bir veya birden fazla rol atanabilir.',
            steps: [
                { title: 'Rol Listesi', description: '"Yönetim > Roller" sayfasını açın.' },
                { title: 'Yeni Rol', description: 'Yeni rol oluşturun ve adını verin.' },
                { title: 'Yetki Atama', description: 'Role dahil olacak yetkileri seçin.' },
                { title: 'Kullanıcı Atama', description: 'Rolü kullanıcılara atayın.' },
                { title: 'Hiyerarşi', description: 'Rollerin kapsam ve önceliğini belirleyin.' }
            ],
            tips: [
                'Çok fazla rol oluşturmayın, yönetimi zorlaştırır.',
                'Roller iş fonksiyonlarına göre tanımlanmalı.',
                'Süper Admin rolü dikkatli kullanılmalı.',
                'Rol değişiklikleri anında etki eder.'
            ]
        }
    },
    {
        id: 'permissions',
        title: 'Yetkiler',
        icon: 'ri-key-2-line',
        content: {
            overview: 'Yetkiler, sistemdeki her işlem için erişim kontrolü sağlar. Yetkiler rollere atanarak kullanıcılara verilir.',
            steps: [
                { title: 'Yetki Listesi', description: '"Yönetim > Yetkiler" sayfasını açın.' },
                { title: 'Yetki Grupları', description: 'Yetkileri modüllere göre gruplanmış görün.' },
                { title: 'CRUD Yetkileri', description: 'Her modül için Görüntüle, Oluştur, Düzenle, Sil yetkileri.' },
                { title: 'Özel Yetkiler', description: 'Onay, rapor, export gibi özel yetkiler.' },
                { title: 'Role Atama', description: 'Yetkileri rollere atayın.' }
            ],
            tips: [
                'En az yetki prensibi uygulayın.',
                'Kritik işlemler için ayrı onay yetkisi tanımlayın.',
                'Yetki değişiklikleri loglanır.',
                'Periyodik yetki gözden geçirmesi yapın.'
            ]
        }
    },
    {
        id: 'departments',
        title: 'Departmanlar',
        icon: 'ri-building-line',
        content: {
            overview: 'Departmanlar, organizasyon yapısını sistemde tanımlamanızı sağlar. Kullanıcılar departmanlara atanır.',
            steps: [
                { title: 'Departman Listesi', description: '"Yönetim > Departmanlar" sayfasını açın.' },
                { title: 'Yeni Departman', description: 'Departman adı ve açıklamasını girin.' },
                { title: 'Hiyerarşi', description: 'Üst departmanı belirleyin.' },
                { title: 'Yönetici Atama', description: 'Departman yöneticisini seçin.' },
                { title: 'Personel Atama', description: 'Kullanıcıları departmana atayın.' }
            ],
            tips: [
                'Departman yapısı organizasyon şemasını yansıtmalı.',
                'Departman bazlı raporlar alınabilir.',
                'Departman değişiklikleri yetkileri etkileyebilir.',
                'Cross-functional roller için birden fazla departman atanabilir.'
            ]
        }
    },
    {
        id: 'positions',
        title: 'Pozisyonlar',
        icon: 'ri-briefcase-line',
        content: {
            overview: 'Pozisyonlar, iş unvanlarını ve görev tanımlarını belirler. Her kullanıcıya bir pozisyon atanır.',
            steps: [
                { title: 'Pozisyon Listesi', description: '"Yönetim > Pozisyonlar" sayfasını açın.' },
                { title: 'Yeni Pozisyon', description: 'Pozisyon adı ve açıklamasını girin.' },
                { title: 'Varsayılan Roller', description: 'Pozisyona otomatik atanacak rolleri belirleyin.' },
                { title: 'Kullanıcı Atama', description: 'Kullanıcılara pozisyon atayın.' }
            ],
            tips: [
                'Pozisyon tanımları İK ile uyumlu olmalı.',
                'Varsayılan roller iş başlangıcını hızlandırır.',
                'Pozisyon değişikliğinde yetkiler otomatik güncellenmez.',
                'Pozisyon hiyerarşisi onay akışlarında kullanılabilir.'
            ]
        }
    },
    {
        id: 'audit',
        title: 'Aktivite Logları',
        icon: 'ri-history-line',
        content: {
            overview: 'Aktivite logları, sistemde yapılan tüm işlemlerin kayıtlarını tutar. Güvenlik ve denetim için kritik öneme sahiptir.',
            steps: [
                { title: 'Log Görüntüleme', description: 'Dashboard veya ayarlar üzerinden logları inceleyin.' },
                { title: 'Filtreleme', description: 'Kullanıcı, tarih, işlem tipi ile filtreleyin.' },
                { title: 'Detay', description: 'Her işlemin önceki ve sonraki değerlerini görün.' },
                { title: 'Export', description: 'Denetim için logları dışa aktarın.' }
            ],
            tips: [
                'Şüpheli aktiviteleri düzenli inceleyin.',
                'Başarısız giriş denemelerini takip edin.',
                'Kritik işlemler için ekstra doğrulama isteyin.',
                'Log saklama süresi yasal gereksinimlere uygun olmalı.'
            ]
        }
    }
];

export default function UserManagement() {
    const [activeTopic, setActiveTopic] = useState('users');

    return (
        <Layout>
            <Head title="Kullanıcı Yönetimi - Yardım" />
            <div className="page-content">
                <div className="container-fluid">
                    <div className="row">
                        <div className="col-12">
                            <div className="page-title-box d-sm-flex align-items-center justify-content-between">
                                <h4 className="mb-sm-0">Kullanıcı Yönetimi Dokümantasyonu</h4>
                                <div className="page-title-right">
                                    <ol className="breadcrumb m-0">
                                        <li className="breadcrumb-item"><Link href={route('dashboard')}>Dashboard</Link></li>
                                        <li className="breadcrumb-item"><Link href="/documentation">Yardım</Link></li>
                                        <li className="breadcrumb-item active">Kullanıcı Yönetimi</li>
                                    </ol>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="row mb-4">
                        <div className="col-12">
                            <div className="card bg-dark bg-gradient text-white">
                                <div className="card-body py-3">
                                    <div className="d-flex align-items-center justify-content-between flex-wrap gap-3">
                                        <div>
                                            <h5 className="text-white mb-1"><i className="ri-user-settings-line me-2"></i>Kullanıcı Yönetimi Modülüne Hızlı Erişim</h5>
                                            <p className="mb-0 text-white-75">Kullanıcılar ve yetkilerini yönetin</p>
                                        </div>
                                        <div className="d-flex gap-2 flex-wrap">
                                            <Link href="/admin/users" className="btn btn-light btn-sm"><i className="ri-user-line me-1"></i> Kullanıcılar</Link>
                                            <Link href="/admin/roles" className="btn btn-light btn-sm"><i className="ri-shield-user-line me-1"></i> Roller</Link>
                                            <Link href="/admin/permissions" className="btn btn-light btn-sm"><i className="ri-key-2-line me-1"></i> Yetkiler</Link>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="row">
                        <div className="col-lg-3">
                            <div className="card sticky-top" style={{ top: '100px' }}>
                                <div className="card-header bg-dark text-white">
                                    <h5 className="card-title mb-0"><i className="ri-user-settings-line me-2"></i>Kullanıcı Yönetimi</h5>
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
                                        <h5 className="card-title mb-0"><i className={`${topic.icon} me-2 text-dark`}></i>{topic.title}</h5>
                                    </div>
                                    <div className="card-body">
                                        <div className="alert alert-soft-dark mb-4"><i className="ri-information-line me-2"></i>{topic.content.overview}</div>
                                        <h6 className="mb-3"><i className="ri-list-ordered me-2"></i>İşlem Adımları</h6>
                                        <div className="timeline-2 mb-4">
                                            {topic.content.steps.map((step, idx) => (
                                                <div key={idx} className="timeline-item pb-3">
                                                    <div className="d-flex">
                                                        <div className="flex-shrink-0"><div className="avatar-xs"><div className="avatar-title bg-dark-subtle text-dark rounded-circle">{idx + 1}</div></div></div>
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

                            <div className="card border-dark">
                                <div className="card-body">
                                    <h6 className="mb-3"><i className="ri-links-line me-2"></i>İlgili Konular</h6>
                                    <div className="d-flex flex-wrap gap-2">
                                        <Link href="/documentation/settings" className="btn btn-outline-secondary btn-sm">Sistem Ayarları</Link>
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
