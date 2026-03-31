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
    };
}

const topics: Topic[] = [
    {
        id: 'dashboard',
        title: 'CRM Dashboard',
        icon: 'ri-dashboard-3-line',
        content: {
            overview: 'CRM Dashboard, satış süreçlerinizin genel bir özetini sunar. Aktif lead\'ler, pipeline durumu, yaklaşan görevler ve performans metrikleri tek bir ekranda görüntülenir.',
            steps: [
                { title: 'Dashboard Erişimi', description: 'Sol menüden "CRM > CRM Dashboard" seçeneğine tıklayın.' },
                { title: 'Metrik Kartları', description: 'Toplam lead, bu ayki dönüşüm oranı, aktif fırsatlar ve hedef gerçekleşme oranlarını görün.' },
                { title: 'Pipeline Özeti', description: 'Satış pipeline\'ınızdaki fırsatların aşamalara göre dağılımını inceleyin.' },
                { title: 'Aktivite Takvimi', description: 'Bugün ve bu hafta planlı aktivitelerinizi görün.' },
                { title: 'Performans Grafikleri', description: 'Aylık/haftalık satış performansınızı grafiklerle analiz edin.' }
            ],
            tips: [
                'Dashboard\'daki kartlara tıklayarak detay sayfalara geçebilirsiniz.',
                'Tarih filtresini değiştirerek farklı doneleri karşılaştırın.',
                'Dashboard otomatik olarak güncellenir, manuel yenileme gerekmez.'
            ]
        }
    },
    {
        id: 'leads',
        title: 'Lead (Potansiyel Müşteri) Yönetimi',
        icon: 'ri-user-follow-line',
        content: {
            overview: 'Lead\'ler, potansiyel müşterilerinizi temsil eder. Web formlarından, fuarlardan veya referanslardan gelen ilgili kişileri lead olarak kaydedip takip edebilirsiniz.',
            steps: [
                { title: 'Yeni Lead Oluşturma', description: '"CRM > Potansiyel Müşteriler" sayfasından "Yeni Lead" butonuna tıklayın.' },
                { title: 'Temel Bilgiler', description: 'Lead adı, firma bilgisi, iletişim bilgileri ve kaynak bilgisini girin.' },
                { title: 'Lead Puanlama', description: 'Lead\'in potansiyelini değerlendirin (sıcak, ılık, soğuk).' },
                { title: 'Atama', description: 'Lead\'i bir satış temsilcisine atayın.' },
                { title: 'İlk Aktivite', description: 'İlk iletişim için bir aktivite (telefon, e-posta, toplantı) planlayın.' },
                { title: 'Takip', description: 'Lead durumunu güncelleyin ve aktiviteleri kaydedin.' }
            ],
            tips: [
                'Toplu lead import için Excel dosyası yükleyebilirsiniz.',
                'Lead kaynaklarını doğru işaretleyin, pazarlama etkinliğini ölçmek için önemli.',
                'Sıcak lead\'lere öncelik verin, 24 saat içinde iletişime geçin.',
                'Lead\'i fırsata dönüştürmeden önce yeterli bilgi topladığınızdan emin olun.'
            ]
        }
    },
    {
        id: 'kanban',
        title: 'Lead Kanban Görünümü',
        icon: 'ri-layout-column-line',
        content: {
            overview: 'Kanban görünümü, lead\'lerinizi satış aşamalarına göre görsel olarak takip etmenizi sağlar. Sürükle-bırak yöntemiyle lead\'leri aşamalar arasında taşıyabilirsiniz.',
            steps: [
                { title: 'Kanban Erişimi', description: '"CRM > Lead Kanban" sayfasına gidin.' },
                { title: 'Aşamaları Anlayın', description: 'Her sütun bir satış aşamasını temsil eder: Yeni, İletişime Geçildi, İlgileniyor, Teklif Verildi, Kazanıldı, Kaybedildi.' },
                { title: 'Lead Taşıma', description: 'Bir lead kartını sürükleyip başka bir aşamaya bırakın.' },
                { title: 'Hızlı İşlemler', description: 'Lead kartına tıklayın ve hızlı işlem menüsünden aktivite ekleyin veya detaylara gidin.' },
                { title: 'Filtreleme', description: 'Üst taraftaki filtrelerle temsilciye, tarihe veya lead durumuna göre filtreleyin.' }
            ],
            tips: [
                'Her aşamada kaç lead olduğunu sütun başlıklarından görebilirsiniz.',
                'Uzun süredir aynı aşamada kalan lead\'ler farklı renkte görüntülenir.',
                'Kanban\'da çift tıkla lead detay sayfasına geçebilirsiniz.',
                'Görünümü kişiselleştirmek için ayarlar menüsünü kullanın.'
            ]
        }
    },
    {
        id: 'pipeline',
        title: 'Teklif Pipeline',
        icon: 'ri-flow-chart',
        content: {
            overview: 'Teklif Pipeline, satış tekliflerinizin durumunu görsel olarak takip etmenizi sağlar. Hangi tekliflerin ne aşamada olduğunu ve toplam potansiyel geliri görebilirsiniz.',
            steps: [
                { title: 'Pipeline Görünümü', description: '"CRM > Teklif Pipeline" sayfasına gidin.' },
                { title: 'Aşamalar', description: 'Taslak, Gönderildi, Görüşme, Müzakere, Kazanıldı, Kaybedildi aşamalarını görün.' },
                { title: 'Teklif Taşıma', description: 'Teklifleri sürükle-bırak ile aşamalar arasında taşıyın.' },
                { title: 'Değer Göstergeleri', description: 'Her aşamadaki toplam teklif değerini görün.' },
                { title: 'Öncelik Belirleme', description: 'Yüksek değerli tekliflere öncelik verin.' }
            ],
            tips: [
                'Pipeline toplamındaki değer, potansiyel gelirinizi gösterir.',
                'Kazanma oranlarını artırmak için müzakere aşamasındaki tekliflere odaklanın.',
                'Kaybedilen tekliflerin nedenlerini analiz edin, gelecek tekliflerde iyileştirme yapın.',
                'Haftalık pipeline gözden geçirme toplantıları düzenleyin.'
            ]
        }
    },
    {
        id: 'activities',
        title: 'Aktivite Yönetimi',
        icon: 'ri-calendar-check-line',
        content: {
            overview: 'Aktiviteler, müşterilerinizle yaptığınız tüm etkileşimleri kaydetmenizi sağlar. Telefon görüşmeleri, e-postalar, toplantılar ve notlar aktivite olarak kaydedilebilir.',
            steps: [
                { title: 'Aktivite Tipleri', description: 'Telefon, E-posta, Toplantı, Demo, Teklif Sunumu gibi aktivite tiplerini kullanın.' },
                { title: 'Yeni Aktivite', description: '"CRM > Aktiviteler" sayfasından veya lead/müşteri detayından aktivite ekleyin.' },
                { title: 'Planlama', description: 'Aktivite tarih ve saatini belirleyin. Hatırlatıcı ayarlayın.' },
                { title: 'Katılımcılar', description: 'Aktiviteye katılacak diğer ekip üyelerini ekleyin.' },
                { title: 'Tamamlama', description: 'Aktiviteyi gerçekleştirdikten sonra notları ve sonucu kaydedin.' },
                { title: 'Takip Aktivitesi', description: 'Gerekirse bir sonraki aktiviteyi hemen planlayın.' }
            ],
            tips: [
                'Her müşteri iletişimini aktivite olarak kaydedin, tam geçmiş oluşturun.',
                'Hatırlatıcıları açık tutun, hiçbir aktiviteyi kaçırmayın.',
                'Aktivite notlarına önemli detayları ekleyin, gelecekte faydalı olur.',
                'Günlük aktivite hedeflerinizi belirleyin ve takip edin.'
            ]
        }
    },
    {
        id: 'tasks',
        title: 'Görev Yönetimi',
        icon: 'ri-task-line',
        content: {
            overview: 'Görevler, yapılması gereken işleri organize etmenizi sağlar. Lead takibi, teklif hazırlama veya doküman gönderme gibi görevleri atayabilir ve takip edebilirsiniz.',
            steps: [
                { title: 'Görev Oluşturma', description: '"CRM > Görevler" sayfasından "Yeni Görev" oluşturun.' },
                { title: 'Görev Detayları', description: 'Görev başlık, açıklama ve tahmini süre bilgilerini girin.' },
                { title: 'Atama', description: 'Görevi kendinize veya bir ekip üyesine atayın.' },
                { title: 'Öncelik ve Tarih', description: 'Öncelik seviyesi (düşük/orta/yüksek/kritik) ve son tarihi belirleyin.' },
                { title: 'İlişki Kurma', description: 'Görevi bir lead, müşteri veya fırsatla ilişkilendirin.' },
                { title: 'Durum Takibi', description: 'Görev durumunu güncelleyin: Bekliyor, Devam Ediyor, Tamamlandı.' }
            ],
            tips: [
                'Her gün önce yüksek öncelikli görevleri tamamlayın.',
                'Büyük görevleri küçük alt görevlere bölerek ilerleyin.',
                'Geciken görevler için bildirim alırsınız, takip edin.',
                'Görev şablonları oluşturarak tekrarlayan işlemleri hızlandırın.'
            ]
        }
    },
    {
        id: 'conversion',
        title: 'Lead Dönüşümü',
        icon: 'ri-exchange-funds-line',
        content: {
            overview: 'Başarılı lead\'ler müşteriye veya fırsata dönüştürülür. Bu süreç, lead\'in kalifikasyonunun tamamlandığını ve satış sürecinin ilerletildiğini ifade eder.',
            steps: [
                { title: 'Dönüşüm Zamanı', description: 'Lead yeterli bilgiye sahip ve alım potansiyeli netleştiğinde dönüşüm yapın.' },
                { title: 'Dönüşüm İşlemi', description: 'Lead detay sayfasında "Müşteriye Dönüştür" butonuna tıklayın.' },
                { title: 'Müşteri Kartı', description: 'Otomatik olarak cari kart oluşturulur veya mevcut cariyle eşleştirilebilir.' },
                { title: 'Fırsat Oluşturma', description: 'Opsiyonel olarak bir satış fırsatı kaydı oluşturulabilir.' },
                { title: 'Geçmiş Aktarımı', description: 'Lead ile ilgili tüm aktiviteler ve notlar yeni kayda aktarılır.' }
            ],
            tips: [
                'Dönüşüm kriterlerini belirleyin ve tüm ekipte uygulayın.',
                'Erken dönüşüm yapmaktan kaçının, lead\'in hazır olduğuna emin olun.',
                'Dönüşüm sonrası ilk siparişi almak için hızlı hareket edin.',
                'Dönüşüm oranlarınızı takip edin ve iyileştirin.'
            ]
        }
    }
];

export default function CRM() {
    const [activeTopic, setActiveTopic] = useState('dashboard');

    return (
        <Layout>
            <Head title="CRM - Yardım" />
            <div className="page-content">
                <div className="container-fluid">
                    {/* Page Header */}
                    <div className="row">
                        <div className="col-12">
                            <div className="page-title-box d-sm-flex align-items-center justify-content-between">
                                <h4 className="mb-sm-0">CRM Dokümantasyonu</h4>
                                <div className="page-title-right">
                                    <ol className="breadcrumb m-0">
                                        <li className="breadcrumb-item">
                                            <Link href={route('dashboard')}>Dashboard</Link>
                                        </li>
                                        <li className="breadcrumb-item">
                                            <Link href="/documentation">Yardım</Link>
                                        </li>
                                        <li className="breadcrumb-item active">CRM</li>
                                    </ol>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Quick Access Banner */}
                    <div className="row mb-4">
                        <div className="col-12">
                            <div className="card bg-info bg-gradient text-white">
                                <div className="card-body py-3">
                                    <div className="d-flex align-items-center justify-content-between flex-wrap gap-3">
                                        <div>
                                            <h5 className="text-white mb-1">
                                                <i className="ri-customer-service-line me-2"></i>
                                                CRM Modülüne Hızlı Erişim
                                            </h5>
                                            <p className="mb-0 text-white-75">Müşteri ilişkilerinizi ve satış süreçlerinizi yönetin</p>
                                        </div>
                                        <div className="d-flex gap-2 flex-wrap">
                                            <Link href="/crm/dashboard" className="btn btn-light btn-sm">
                                                <i className="ri-dashboard-line me-1"></i> Dashboard
                                            </Link>
                                            <Link href="/crm/leads" className="btn btn-light btn-sm">
                                                <i className="ri-user-follow-line me-1"></i> Lead\'ler
                                            </Link>
                                            <Link href="/crm/leads/kanban" className="btn btn-light btn-sm">
                                                <i className="ri-layout-column-line me-1"></i> Kanban
                                            </Link>
                                            <Link href="/crm/activities" className="btn btn-light btn-sm">
                                                <i className="ri-calendar-check-line me-1"></i> Aktiviteler
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
                            <div className="card sticky-top" style={{ top: '100px' }}>
                                <div className="card-header bg-info text-white">
                                    <h5 className="card-title mb-0">
                                        <i className="ri-customer-service-line me-2"></i>
                                        CRM Modülü
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
                        </div>

                        {/* Content */}
                        <div className="col-lg-9">
                            {/* CRM Process Flow */}
                            <div className="card mb-4">
                                <div className="card-header">
                                    <h5 className="card-title mb-0">
                                        <i className="ri-flow-chart me-2 text-info"></i>
                                        CRM Satış Süreci
                                    </h5>
                                </div>
                                <div className="card-body">
                                    <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
                                        {[
                                            { icon: 'ri-user-add-line', title: 'Lead Oluştur', color: 'primary' },
                                            { icon: 'ri-phone-line', title: 'İletişim', color: 'info' },
                                            { icon: 'ri-file-text-line', title: 'Teklif', color: 'warning' },
                                            { icon: 'ri-discuss-line', title: 'Müzakere', color: 'secondary' },
                                            { icon: 'ri-check-double-line', title: 'Kapanış', color: 'success' }
                                        ].map((step, idx, arr) => (
                                            <React.Fragment key={step.title}>
                                                <div className="text-center">
                                                    <div className={`avatar-md mx-auto mb-2`}>
                                                        <div className={`avatar-title bg-${step.color}-subtle text-${step.color} rounded-circle fs-3`}>
                                                            <i className={step.icon}></i>
                                                        </div>
                                                    </div>
                                                    <h6 className="mb-0">{step.title}</h6>
                                                </div>
                                                {idx < arr.length - 1 && (
                                                    <i className="ri-arrow-right-line fs-4 text-muted d-none d-md-block"></i>
                                                )}
                                            </React.Fragment>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Topics */}
                            {topics.map((topic) => (
                                <div key={topic.id} id={topic.id} className="card mb-4">
                                    <div className="card-header">
                                        <h5 className="card-title mb-0">
                                            <i className={`${topic.icon} me-2 text-info`}></i>
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
                                        <div className="row g-3 mb-4">
                                            {topic.content.steps.map((step, idx) => (
                                                <div key={idx} className="col-md-6">
                                                    <div className="d-flex align-items-start p-3 bg-light-subtle rounded">
                                                        <div className="flex-shrink-0">
                                                            <div className="avatar-xs">
                                                                <div className="avatar-title bg-info-subtle text-info rounded-circle">
                                                                    {idx + 1}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="flex-grow-1 ms-3">
                                                            <h6 className="mb-1">{step.title}</h6>
                                                            <p className="text-muted mb-0 small">{step.description}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Tips */}
                                        <div className="bg-warning-subtle rounded p-3">
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
                                    </div>
                                </div>
                            ))}

                            {/* Best Practices */}
                            <div className="card mb-4">
                                <div className="card-header">
                                    <h5 className="card-title mb-0">
                                        <i className="ri-award-line me-2 text-success"></i>
                                        CRM En İyi Uygulamalar
                                    </h5>
                                </div>
                                <div className="card-body">
                                    <div className="row g-4">
                                        <div className="col-md-6">
                                            <div className="d-flex">
                                                <div className="flex-shrink-0">
                                                    <i className="ri-checkbox-circle-line text-success fs-4"></i>
                                                </div>
                                                <div className="flex-grow-1 ms-3">
                                                    <h6>Düzenli Takip Yapın</h6>
                                                    <p className="text-muted mb-0 small">
                                                        Her lead ile düzenli iletişim kurun. Takip etmeyi bırakmak fırsat kaybına neden olur.
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="col-md-6">
                                            <div className="d-flex">
                                                <div className="flex-shrink-0">
                                                    <i className="ri-checkbox-circle-line text-success fs-4"></i>
                                                </div>
                                                <div className="flex-grow-1 ms-3">
                                                    <h6>Notları Detaylı Tutun</h6>
                                                    <p className="text-muted mb-0 small">
                                                        Her görüşmede öğrenilenleri not alın. Bu bilgiler gelecekte çok değerli olacak.
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="col-md-6">
                                            <div className="d-flex">
                                                <div className="flex-shrink-0">
                                                    <i className="ri-checkbox-circle-line text-success fs-4"></i>
                                                </div>
                                                <div className="flex-grow-1 ms-3">
                                                    <h6>Pipeline\'ı Temiz Tutun</h6>
                                                    <p className="text-muted mb-0 small">
                                                        Kaybedilen veya soğuk lead\'leri zamanında işaretleyin. Pipeline\'ınız gerçeği yansıtsın.
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="col-md-6">
                                            <div className="d-flex">
                                                <div className="flex-shrink-0">
                                                    <i className="ri-checkbox-circle-line text-success fs-4"></i>
                                                </div>
                                                <div className="flex-grow-1 ms-3">
                                                    <h6>Metrikleri Takip Edin</h6>
                                                    <p className="text-muted mb-0 small">
                                                        Dönüşüm oranları, ortalama satış süreci gibi metrikleri düzenli inceleyin.
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Related Topics */}
                            <div className="card border-info">
                                <div className="card-body">
                                    <h6 className="mb-3">
                                        <i className="ri-links-line me-2"></i>
                                        İlgili Konular
                                    </h6>
                                    <div className="d-flex flex-wrap gap-2">
                                        <Link href="/documentation/sales-management" className="btn btn-outline-secondary btn-sm">
                                            Satış Yönetimi
                                        </Link>
                                        <Link href="/documentation/current-accounts" className="btn btn-outline-secondary btn-sm">
                                            Cari Kartlar
                                        </Link>
                                        <Link href="/documentation/reports" className="btn btn-outline-secondary btn-sm">
                                            Satış Raporları
                                        </Link>
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
