import React from 'react';

interface Props {
    show: boolean;
    onClose: () => void;
}

const ReceivingHelpModal: React.FC<Props> = ({ show, onClose }) => {
    if (!show) return null;

    return (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog modal-xl modal-dialog-scrollable">
                <div className="modal-content">
                    <div className="modal-header bg-primary text-white">
                        <h5 className="modal-title">
                            <i className="ri-book-open-line me-2"></i>
                            Mal Kabul Süreci - Kullanım Kılavuzu
                        </h5>
                        <button
                            type="button"
                            className="btn-close btn-close-white"
                            onClick={onClose}
                        ></button>
                    </div>
                    <div className="modal-body">
                        {/* Genel Bakış */}
                        <div className="mb-4">
                            <h5 className="text-primary">
                                <i className="ri-information-line me-2"></i>
                                Genel Bakış
                            </h5>
                            <p className="text-muted">
                                Mal kabul modülü, tedarikçilerden gelen ürünlerin depoya teslim alınması,
                                kalite kontrolünden geçirilmesi ve stoğa kaydedilmesi süreçlerini yönetir.
                            </p>
                        </div>

                        <hr />

                        {/* Süreç Adımları */}
                        <div className="mb-4">
                            <h5 className="text-primary">
                                <i className="ri-list-check me-2"></i>
                                Mal Kabul Süreci Adımları
                            </h5>

                            <div className="timeline">
                                {/* Adım 1 */}
                                <div className="d-flex mb-4">
                                    <div className="flex-shrink-0">
                                        <span className="badge bg-primary rounded-circle" style={{ width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>
                                            1
                                        </span>
                                    </div>
                                    <div className="flex-grow-1 ms-3">
                                        <h6 className="mb-2">Satın Alma Siparişini Seçin</h6>
                                        <p className="text-muted mb-2">
                                            Mal Kabul listesinden teslim alınacak satın alma siparişini bulun ve
                                            "Teslim Al" butonuna tıklayın.
                                        </p>
                                        <div className="alert alert-info mb-0">
                                            <i className="ri-lightbulb-line me-1"></i>
                                            <strong>İpucu:</strong> Filtre özelliklerini kullanarak sipariş numarası,
                                            tedarikçi adı veya tarih aralığına göre arama yapabilirsiniz.
                                        </div>
                                    </div>
                                </div>

                                {/* Adım 2 */}
                                <div className="d-flex mb-4">
                                    <div className="flex-shrink-0">
                                        <span className="badge bg-primary rounded-circle" style={{ width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>
                                            2
                                        </span>
                                    </div>
                                    <div className="flex-grow-1 ms-3">
                                        <h6 className="mb-2">Ürünü Barkod ile Okutun veya Seçin</h6>
                                        <p className="text-muted mb-2">İki farklı yöntemle ürün seçebilirsiniz:</p>

                                        <div className="row g-3">
                                            <div className="col-md-6">
                                                <div className="card bg-light">
                                                    <div className="card-body">
                                                        <h6 className="card-title">
                                                            <i className="ri-qr-scan-line text-primary me-2"></i>
                                                            Barkod Okuyucu
                                                        </h6>
                                                        <ul className="mb-0 small">
                                                            <li>El terminali ile barkodu okutun</li>
                                                            <li>Veya barkod numarasını manuel yazın</li>
                                                            <li>Enter tuşuna basın veya "Ürün Ara" butonuna tıklayın</li>
                                                            <li>Sistem otomatik olarak ürünü bulup seçecektir</li>
                                                        </ul>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="col-md-6">
                                                <div className="card bg-light">
                                                    <div className="card-body">
                                                        <h6 className="card-title">
                                                            <i className="ri-list-check text-success me-2"></i>
                                                            Manuel Seçim
                                                        </h6>
                                                        <ul className="mb-0 small">
                                                            <li>Sağ taraftaki ürün listesinden seçim yapın</li>
                                                            <li>"Seç" butonuna tıklayın</li>
                                                            <li>Ürün otomatik olarak forma yüklenecektir</li>
                                                        </ul>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="alert alert-warning mt-3 mb-0">
                                            <i className="ri-error-warning-line me-1"></i>
                                            <strong>Önemli:</strong> Barkod okuyucu alanı her zaman aktiftir.
                                            El terminalinizle herhangi bir zamanda barkod okutabilirsiniz.
                                        </div>
                                    </div>
                                </div>

                                {/* Adım 3 */}
                                <div className="d-flex mb-4">
                                    <div className="flex-shrink-0">
                                        <span className="badge bg-primary rounded-circle" style={{ width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>
                                            3
                                        </span>
                                    </div>
                                    <div className="flex-grow-1 ms-3">
                                        <h6 className="mb-2">Teslim Bilgilerini Doldurun</h6>
                                        <p className="text-muted mb-2">Formdaki gerekli bilgileri eksiksiz doldurun:</p>

                                        <table className="table table-sm table-bordered">
                                            <thead className="table-light">
                                                <tr>
                                                    <th width="30%">Alan</th>
                                                    <th width="15%">Zorunlu</th>
                                                    <th>Açıklama</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                <tr>
                                                    <td><strong>Miktar</strong></td>
                                                    <td><span className="badge bg-danger">Evet</span></td>
                                                    <td>Teslim alınan ürün miktarı. Kalan miktardan fazla olamaz.</td>
                                                </tr>
                                                <tr>
                                                    <td><strong>Lot/Seri No</strong></td>
                                                    <td><span className="badge bg-secondary">Hayır</span></td>
                                                    <td>Ürünün lot veya seri numarası (varsa). Takip için önemlidir.</td>
                                                </tr>
                                                <tr>
                                                    <td><strong>Son Kullanma Tarihi</strong></td>
                                                    <td><span className="badge bg-secondary">Hayır</span></td>
                                                    <td>Gıda, ilaç gibi ürünlerde mutlaka girilmelidir.</td>
                                                </tr>
                                                <tr>
                                                    <td><strong>Barkod</strong></td>
                                                    <td><span className="badge bg-secondary">Hayır</span></td>
                                                    <td>Ürünün barkodu yoksa "Oluştur" butonu ile yeni barkod oluşturabilirsiniz.</td>
                                                </tr>
                                                <tr>
                                                    <td><strong>Notlar</strong></td>
                                                    <td><span className="badge bg-secondary">Hayır</span></td>
                                                    <td>Teslim alma ile ilgili özel notlar (hasar, eksiklik vb.)</td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                {/* Adım 4 */}
                                <div className="d-flex mb-4">
                                    <div className="flex-shrink-0">
                                        <span className="badge bg-warning rounded-circle" style={{ width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>
                                            4
                                        </span>
                                    </div>
                                    <div className="flex-grow-1 ms-3">
                                        <h6 className="mb-2">Kalite Kontrolü (Gerekirse)</h6>
                                        <p className="text-muted mb-2">
                                            Belirli ürünler için kalite kontrol zorunludur. Sistem otomatik olarak
                                            kalite kontrol gereken ürünleri tespit eder.
                                        </p>

                                        <div className="card border-warning mb-3">
                                            <div className="card-header bg-warning bg-opacity-10">
                                                <strong>Kalite Kontrol Gerektiren Durumlar:</strong>
                                            </div>
                                            <div className="card-body">
                                                <ul className="mb-0">
                                                    <li>Değeri 1.000 TL üzerindeki ürünler</li>
                                                    <li>Elektronik ürünler</li>
                                                    <li>Cam ve kırılabilir ürünler</li>
                                                    <li>Medikal ürünler</li>
                                                    <li>Özel ambalaj gerektiren ürünler</li>
                                                </ul>
                                            </div>
                                        </div>

                                        <h6 className="mt-3 mb-2">Kalite Kontrol Süreci:</h6>
                                        <div className="row g-3">
                                            <div className="col-md-4">
                                                <div className="card h-100 border-success">
                                                    <div className="card-body text-center">
                                                        <i className="ri-check-double-line text-success" style={{ fontSize: '2rem' }}></i>
                                                        <h6 className="mt-2 text-success">Onaylandı</h6>
                                                        <p className="small text-muted mb-0">
                                                            Ürün kalite kontrolünden geçti.
                                                            Stoğa eklenir ve kullanıma hazır hale gelir.
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="col-md-4">
                                                <div className="card h-100 border-danger">
                                                    <div className="card-body text-center">
                                                        <i className="ri-close-circle-line text-danger" style={{ fontSize: '2rem' }}></i>
                                                        <h6 className="mt-2 text-danger">Reddedildi</h6>
                                                        <p className="small text-muted mb-0">
                                                            Ürün hasarlı veya standartlara uygun değil.
                                                            Karantina alanına yerleştirilir. Hasar detayları zorunludur.
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="col-md-4">
                                                <div className="card h-100 border-warning">
                                                    <div className="card-body text-center">
                                                        <i className="ri-pause-circle-line text-warning" style={{ fontSize: '2rem' }}></i>
                                                        <h6 className="mt-2 text-warning">Beklemede</h6>
                                                        <p className="small text-muted mb-0">
                                                            Detaylı inceleme gerekiyor.
                                                            Ürün geçici olarak bekletilir, stoğa eklenmez.
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="alert alert-info mt-3 mb-0">
                                            <h6 className="alert-heading">Kalite Kontrol Listesi</h6>
                                            <p className="mb-2">Her ürün için aşağıdaki kontroller yapılmalıdır:</p>
                                            <ul className="mb-0">
                                                <li>Fiziksel görünüm (çizik, kırık, deformasyon)</li>
                                                <li>Ambalaj durumu (yırtık, ezik, açılmış)</li>
                                                <li>Miktar sayımı (doğrulama)</li>
                                                <li>Son kullanma tarihi (uygun tarih aralığı)</li>
                                                <li>Belgeler (irsaliye, sertifika, garanti belgesi)</li>
                                                <li>Teknik özellikler (katalog uygunluğu)</li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>

                                {/* Adım 5 */}
                                <div className="d-flex">
                                    <div className="flex-shrink-0">
                                        <span className="badge bg-success rounded-circle" style={{ width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>
                                            5
                                        </span>
                                    </div>
                                    <div className="flex-grow-1 ms-3">
                                        <h6 className="mb-2">Teslim Almayı Tamamlayın</h6>
                                        <p className="text-muted mb-2">
                                            Tüm bilgileri kontrol ettikten sonra:
                                        </p>
                                        <ul>
                                            <li><strong>Kalite kontrol gerekliyse:</strong> "Kalite Kontrole Gönder" butonuna tıklayın</li>
                                            <li><strong>Kalite kontrol gerekmiyorsa:</strong> "Teslim Al" butonuna tıklayın</li>
                                        </ul>
                                        <p className="text-muted">
                                            Sistem otomatik olarak stok kaydı oluşturacak ve satın alma siparişini güncelleyecektir.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <hr />

                        {/* Önemli Notlar */}
                        <div className="mb-4">
                            <h5 className="text-primary">
                                <i className="ri-alert-line me-2"></i>
                                Önemli Notlar ve İpuçları
                            </h5>

                            <div className="row g-3">
                                <div className="col-md-6">
                                    <div className="card border-success h-100">
                                        <div className="card-header bg-success bg-opacity-10">
                                            <i className="ri-thumb-up-line text-success me-1"></i>
                                            <strong>Yapılması Gerekenler</strong>
                                        </div>
                                        <div className="card-body">
                                            <ul className="small mb-0">
                                                <li>Her ürünü tek tek kontrol edin</li>
                                                <li>Hasarlı ürünleri mutlaka işaretleyin</li>
                                                <li>Son kullanma tarihlerini kontrol edin</li>
                                                <li>Lot/Seri numaralarını kaydedin</li>
                                                <li>Eksik veya fazla teslimatları not edin</li>
                                                <li>Kalite kontrol listesini eksiksiz doldurun</li>
                                                <li>Tedarikçi belgelerini saklayın</li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                                <div className="col-md-6">
                                    <div className="card border-danger h-100">
                                        <div className="card-header bg-danger bg-opacity-10">
                                            <i className="ri-thumb-down-line text-danger me-1"></i>
                                            <strong>Yapılmaması Gerekenler</strong>
                                        </div>
                                        <div className="card-body">
                                            <ul className="small mb-0">
                                                <li>Hasarlı ürünleri stoğa kabul etmeyin</li>
                                                <li>Kalite kontrolü atlamayın</li>
                                                <li>Yanlış miktarlar girmeyin</li>
                                                <li>Son kullanma tarihi geçmiş ürünleri almayın</li>
                                                <li>Belgesiz ürünleri teslim almayın</li>
                                                <li>Farklı lotları karıştırmayın</li>
                                                <li>İrsaliye olmadan teslim almayın</li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <hr />

                        {/* Sık Sorulan Sorular */}
                        <div className="mb-4">
                            <h5 className="text-primary">
                                <i className="ri-question-line me-2"></i>
                                Sık Sorulan Sorular
                            </h5>

                            <div className="accordion" id="faqAccordion">
                                <div className="accordion-item">
                                    <h2 className="accordion-header">
                                        <button className="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#faq1">
                                            Sipariş edilen miktardan az ürün geldiyse ne yapmalıyım?
                                        </button>
                                    </h2>
                                    <div id="faq1" className="accordion-collapse collapse" data-bs-parent="#faqAccordion">
                                        <div className="accordion-body">
                                            Gelen miktarı olduğu gibi girin. Sistem otomatik olarak kalan miktarı hesaplayacaktır.
                                            Notlar bölümüne eksik teslimat hakkında açıklama yazın. Satın alma departmanı
                                            kalan miktar için tedarikçi ile iletişime geçecektir.
                                        </div>
                                    </div>
                                </div>

                                <div className="accordion-item">
                                    <h2 className="accordion-header">
                                        <button className="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#faq2">
                                            Barkodu olmayan ürünleri nasıl işlemeliyim?
                                        </button>
                                    </h2>
                                    <div id="faq2" className="accordion-collapse collapse" data-bs-parent="#faqAccordion">
                                        <div className="accordion-body">
                                            Barkod alanındaki "Oluştur" butonuna tıklayarak sistem otomatik olarak yeni bir
                                            barkod numarası oluşturacaktır (ASK ile başlayan). Bu barkodu ürün üzerine
                                            yapıştırarak gelecekte kolay takip edebilirsiniz.
                                        </div>
                                    </div>
                                </div>

                                <div className="accordion-item">
                                    <h2 className="accordion-header">
                                        <button className="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#faq3">
                                            Kalite kontrolden geçmeyen ürünlere ne olur?
                                        </button>
                                    </h2>
                                    <div id="faq3" className="accordion-collapse collapse" data-bs-parent="#faqAccordion">
                                        <div className="accordion-body">
                                            Reddedilen ürünler karantina alanına yerleştirilir ve stoğa eklenmez. Hasar detayları
                                            kaydedilir ve otomatik olarak satın alma departmanına bildirim gönderilir.
                                            Tedarikçi ile iade veya değişim süreci başlatılır.
                                        </div>
                                    </div>
                                </div>

                                <div className="accordion-item">
                                    <h2 className="accordion-header">
                                        <button className="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#faq4">
                                            El terminalim çalışmıyor, ne yapmalıyım?
                                        </button>
                                    </h2>
                                    <div id="faq4" className="accordion-collapse collapse" data-bs-parent="#faqAccordion">
                                        <div className="accordion-body">
                                            Manuel olarak barkod numarasını klavye ile yazabilirsiniz. Alternatif olarak,
                                            sağ taraftaki ürün listesinden "Seç" butonuna tıklayarak da ürün seçimi yapabilirsiniz.
                                            Teknik destek için IT departmanına başvurun.
                                        </div>
                                    </div>
                                </div>

                                <div className="accordion-item">
                                    <h2 className="accordion-header">
                                        <button className="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#faq5">
                                            Yanlış ürün teslim aldım, nasıl düzeltebilirim?
                                        </button>
                                    </h2>
                                    <div id="faq5" className="accordion-collapse collapse" data-bs-parent="#faqAccordion">
                                        <div className="accordion-body">
                                            Henüz kaydetmediyseniz, formu temizleyip doğru ürünü seçin. Eğer kaydettiyseniz,
                                            hemen yöneticinize bildirin. Stok düzeltme modülünden düzeltme işlemi yapılabilir.
                                            Gelecekte daha dikkatli olun ve her işlemi kaydetmeden önce kontrol edin.
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <hr />

                        {/* İletişim */}
                        <div className="alert alert-primary mb-0">
                            <h6 className="alert-heading">
                                <i className="ri-customer-service-line me-2"></i>
                                Yardıma mı ihtiyacınız var?
                            </h6>
                            <p className="mb-2">
                                Bu kılavuzda bulamadığınız bilgiler için lütfen depo yöneticiniz veya
                                IT destek ekibi ile iletişime geçin.
                            </p>
                            <hr />
                            <p className="mb-0 small">
                                <strong>IT Destek:</strong> destek@firma.com | Dahili: 1234<br />
                                <strong>Depo Yönetimi:</strong> depo@firma.com | Dahili: 5678
                            </p>
                        </div>
                    </div>
                    <div className="modal-footer">
                        <button type="button" className="btn btn-secondary" onClick={onClose}>
                            Kapat
                        </button>
                        <button type="button" className="btn btn-primary" onClick={() => window.print()}>
                            <i className="ri-printer-line me-1"></i>
                            Yazdır
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ReceivingHelpModal;
