import React from 'react';
import { Head, Link } from '@inertiajs/react';
import Layout from '../../../Layouts';

const Index: React.FC = () => {
    const reportCategories = [
        {
            title: 'Operasyon Raporları',
            description: 'Depo operasyonlarına ilişkin detaylı raporlar',
            icon: 'ri-settings-3-line',
            color: 'primary',
            reports: [
                {
                    name: 'Operasyon Performans Raporu',
                    description: 'Depo operasyonlarının performans analizi',
                    url: '/warehouses/reports?type=operation_performance',
                    icon: 'ri-speed-line'
                },
                {
                    name: 'Günlük Operasyon Raporu',
                    description: 'Günlük operasyon aktivitelerinin özeti',
                    url: '/warehouses/reports?type=daily_operations',
                    icon: 'ri-calendar-line'
                },
                {
                    name: 'Operasyon Tipleri Analizi',
                    description: 'Operasyon tiplerinin dağılımı ve analizi',
                    url: '/warehouses/reports?type=operation_types',
                    icon: 'ri-pie-chart-line'
                }
            ]
        },
        {
            title: 'Kapasite ve Lokasyon Raporları',
            description: 'Depo kapasitesi ve lokasyon kullanım raporları',
            icon: 'ri-building-line',
            color: 'success',
            reports: [
                {
                    name: 'Kapasite Kullanım Raporu',
                    description: 'Depo kapasitelerinin kullanım analizi',
                    url: '/warehouses/reports?type=capacity_utilization',
                    icon: 'ri-pie-chart-box-line'
                },
                {
                    name: 'Lokasyon Doluluk Raporu',
                    description: 'Depolama lokasyonlarının doluluk oranları',
                    url: '/warehouses/reports?type=location_occupancy',
                    icon: 'ri-layout-grid-line'
                },
                {
                    name: 'Bölge Bazlı Analiz',
                    description: 'Depo bölgelerinin performans karşılaştırması',
                    url: '/warehouses/reports?type=zone_analysis',
                    icon: 'ri-map-2-line'
                }
            ]
        },
        {
            title: 'Personel ve Verimlilik Raporları',
            description: 'Personel performansı ve verimlilik analizleri',
            icon: 'ri-team-line',
            color: 'warning',
            reports: [
                {
                    name: 'Personel Performans Raporu',
                    description: 'Çalışan performanslarının detaylı analizi',
                    url: '/warehouses/reports?type=staff_performance',
                    icon: 'ri-user-star-line'
                },
                {
                    name: 'Vardiya Verimlilik Raporu',
                    description: 'Vardiya bazında verimlilik analizi',
                    url: '/warehouses/reports?type=shift_productivity',
                    icon: 'ri-time-line'
                },
                {
                    name: 'Eğitim ve Sertifikasyon Raporu',
                    description: 'Personel eğitim durumu ve sertifikaları',
                    url: '/warehouses/reports?type=training_certification',
                    icon: 'ri-graduation-cap-line'
                }
            ]
        },
        {
            title: 'Maliyet ve Verimlilik Analizleri',
            description: 'Finansal analiz ve verimlilik raporları',
            icon: 'ri-money-dollar-circle-line',
            color: 'info',
            reports: [
                {
                    name: 'Operasyon Maliyet Analizi',
                    description: 'Depo operasyonlarının maliyet analizi',
                    url: '/warehouses/reports?type=operation_costs',
                    icon: 'ri-funds-line'
                },
                {
                    name: 'Verimlilik Trendi',
                    description: 'Depo verimliliğinin zaman içindeki değişimi',
                    url: '/warehouses/reports?type=efficiency_trends',
                    icon: 'ri-line-chart-line'
                },
                {
                    name: 'KPI Dashboard',
                    description: 'Anahtar performans göstergelerinin özeti',
                    url: '/warehouses/reports?type=kpi_dashboard',
                    icon: 'ri-dashboard-3-line'
                }
            ]
        }
    ];

    const quickStats = [
        {
            title: 'Toplam Operasyon (Bu Ay)',
            value: '1,847',
            change: '+8.2%',
            changeType: 'increase',
            icon: 'ri-settings-3-line',
            color: 'primary'
        },
        {
            title: 'Ortalama Verimlilik',
            value: '87.5%',
            change: '+2.1%',
            changeType: 'increase',
            icon: 'ri-speed-line',
            color: 'success'
        },
        {
            title: 'Kapasite Kullanımı',
            value: '76.3%',
            change: '+5.4%',
            changeType: 'increase',
            icon: 'ri-pie-chart-line',
            color: 'warning'
        },
        {
            title: 'Personel Memnuniyeti',
            value: '4.2/5',
            change: '+0.3',
            changeType: 'increase',
            icon: 'ri-user-star-line',
            color: 'info'
        }
    ];

    return (
        <Layout>
            <Head title="Depo Raporları" />
            
            <div className="page-content">
                <div className="container-fluid">
                    {/* Page Title */}
                    <div className="row">
                        <div className="col-12">
                            <div className="page-title-box d-sm-flex align-items-center justify-content-between">
                                <h4 className="mb-sm-0">Depo Raporları ve Analizler</h4>
                                <div className="page-title-right">
                                    <ol className="breadcrumb m-0">
                                        <li className="breadcrumb-item"><Link href="/warehouses">Depo Yönetimi</Link></li>
                                        <li className="breadcrumb-item active">Raporlar</li>
                                    </ol>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Quick Stats */}
                    <div className="row">
                        {quickStats.map((stat, index) => (
                            <div key={index} className="col-xl-3 col-md-6">
                                <div className="card card-animate">
                                    <div className="card-body">
                                        <div className="d-flex align-items-center">
                                            <div className="flex-grow-1 overflow-hidden">
                                                <p className="text-uppercase fw-medium text-muted text-truncate mb-0">
                                                    {stat.title}
                                                </p>
                                            </div>
                                            <div className="avatar-sm flex-shrink-0">
                                                <span className={`avatar-title bg-${stat.color}-subtle rounded fs-3`}>
                                                    <i className={`${stat.icon} text-${stat.color}`}></i>
                                                </span>
                                            </div>
                                        </div>
                                        <div className="d-flex align-items-end justify-content-between mt-4">
                                            <div>
                                                <h4 className="fs-22 fw-semibold ff-secondary mb-4">
                                                    <span className="counter-value">{stat.value}</span>
                                                </h4>
                                                <span className={`badge bg-${stat.changeType === 'increase' ? 'success' : 'danger'}-subtle text-${stat.changeType === 'increase' ? 'success' : 'danger'} mb-0`}>
                                                    <i className={`ri-arrow-${stat.changeType === 'increase' ? 'up' : 'down'}-line align-middle`}></i>
                                                    {stat.change}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Report Categories */}
                    {reportCategories.map((category, categoryIndex) => (
                        <div key={categoryIndex} className="row">
                            <div className="col-lg-12">
                                <div className="card">
                                    <div className="card-header">
                                        <div className="d-flex align-items-center">
                                            <div className={`avatar-sm me-3`}>
                                                <span className={`avatar-title bg-${category.color}-subtle text-${category.color} rounded fs-3`}>
                                                    <i className={category.icon}></i>
                                                </span>
                                            </div>
                                            <div className="flex-grow-1">
                                                <h4 className="card-title mb-1">{category.title}</h4>
                                                <p className="text-muted mb-0">{category.description}</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="card-body">
                                        <div className="row">
                                            {category.reports.map((report, reportIndex) => (
                                                <div key={reportIndex} className="col-md-4">
                                                    <Link 
                                                        href={report.url}
                                                        className="text-decoration-none"
                                                    >
                                                        <div className="border rounded p-4 h-100 hover-shadow-sm">
                                                            <div className="d-flex align-items-start">
                                                                <div className="avatar-sm me-3">
                                                                    <div className="avatar-title bg-light text-primary rounded">
                                                                        <i className={report.icon}></i>
                                                                    </div>
                                                                </div>
                                                                <div className="flex-grow-1">
                                                                    <h5 className="fs-15 mb-2">{report.name}</h5>
                                                                    <p className="text-muted mb-0">{report.description}</p>
                                                                </div>
                                                                <div className="flex-shrink-0">
                                                                    <i className="ri-arrow-right-line text-muted"></i>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </Link>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}

                    {/* Recent Reports */}
                    <div className="row">
                        <div className="col-lg-12">
                            <div className="card">
                                <div className="card-header align-items-center d-flex">
                                    <h4 className="card-title mb-0 flex-grow-1">Son Oluşturulan Raporlar</h4>
                                    <div className="flex-shrink-0">
                                        <button type="button" className="btn btn-soft-info btn-sm">
                                            <i className="ri-file-list-3-line align-middle"></i> Tümünü Görüntüle
                                        </button>
                                    </div>
                                </div>
                                <div className="card-body">
                                    <div className="table-responsive table-card">
                                        <table className="table table-borderless table-centered align-middle table-nowrap mb-0">
                                            <thead className="text-muted table-light">
                                                <tr>
                                                    <th scope="col">Rapor Adı</th>
                                                    <th scope="col">Kategori</th>
                                                    <th scope="col">Oluşturan</th>
                                                    <th scope="col">Tarih</th>
                                                    <th scope="col">Durum</th>
                                                    <th scope="col">İşlemler</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                <tr>
                                                    <td>
                                                        <div className="d-flex align-items-center">
                                                            <div className="avatar-xs me-3">
                                                                <div className="avatar-title bg-success-subtle text-success rounded-circle">
                                                                    <i className="ri-file-excel-line"></i>
                                                                </div>
                                                            </div>
                                                            <div className="flex-grow-1">
                                                                <h5 className="fs-14 mb-0">Şubat 2024 Operasyon Performansı</h5>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td><span className="badge bg-primary-subtle text-primary">Operasyon Raporu</span></td>
                                                    <td>Ahmet Yılmaz</td>
                                                    <td>15 Mart 2024</td>
                                                    <td><span className="badge bg-success-subtle text-success">Tamamlandı</span></td>
                                                    <td>
                                                        <div className="dropdown">
                                                            <button className="btn btn-soft-secondary btn-sm dropdown" type="button" data-bs-toggle="dropdown">
                                                                <i className="ri-more-fill"></i>
                                                            </button>
                                                            <ul className="dropdown-menu dropdown-menu-end">
                                                                <li><a className="dropdown-item" href="#"><i className="ri-eye-line me-2"></i>Görüntüle</a></li>
                                                                <li><a className="dropdown-item" href="#"><i className="ri-download-line me-2"></i>İndir</a></li>
                                                                <li><a className="dropdown-item" href="#"><i className="ri-share-line me-2"></i>Paylaş</a></li>
                                                            </ul>
                                                        </div>
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td>
                                                        <div className="d-flex align-items-center">
                                                            <div className="avatar-xs me-3">
                                                                <div className="avatar-title bg-danger-subtle text-danger rounded-circle">
                                                                    <i className="ri-file-pdf-line"></i>
                                                                </div>
                                                            </div>
                                                            <div className="flex-grow-1">
                                                                <h5 className="fs-14 mb-0">Kapasite Kullanım Analizi</h5>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td><span className="badge bg-success-subtle text-success">Kapasite Raporu</span></td>
                                                    <td>Fatma Demir</td>
                                                    <td>14 Mart 2024</td>
                                                    <td><span className="badge bg-success-subtle text-success">Tamamlandı</span></td>
                                                    <td>
                                                        <div className="dropdown">
                                                            <button className="btn btn-soft-secondary btn-sm dropdown" type="button" data-bs-toggle="dropdown">
                                                                <i className="ri-more-fill"></i>
                                                            </button>
                                                            <ul className="dropdown-menu dropdown-menu-end">
                                                                <li><a className="dropdown-item" href="#"><i className="ri-eye-line me-2"></i>Görüntüle</a></li>
                                                                <li><a className="dropdown-item" href="#"><i className="ri-download-line me-2"></i>İndir</a></li>
                                                                <li><a className="dropdown-item" href="#"><i className="ri-share-line me-2"></i>Paylaş</a></li>
                                                            </ul>
                                                        </div>
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td>
                                                        <div className="d-flex align-items-center">
                                                            <div className="avatar-xs me-3">
                                                                <div className="avatar-title bg-info-subtle text-info rounded-circle">
                                                                    <i className="ri-file-chart-line"></i>
                                                                </div>
                                                            </div>
                                                            <div className="flex-grow-1">
                                                                <h5 className="fs-14 mb-0">Personel Performans Raporu</h5>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td><span className="badge bg-warning-subtle text-warning">Personel Raporu</span></td>
                                                    <td>Mehmet Kaya</td>
                                                    <td>13 Mart 2024</td>
                                                    <td><span className="badge bg-warning-subtle text-warning">İşlemde</span></td>
                                                    <td>
                                                        <div className="dropdown">
                                                            <button className="btn btn-soft-secondary btn-sm dropdown" type="button" data-bs-toggle="dropdown">
                                                                <i className="ri-more-fill"></i>
                                                            </button>
                                                            <ul className="dropdown-menu dropdown-menu-end">
                                                                <li><a className="dropdown-item" href="#"><i className="ri-eye-line me-2"></i>Görüntüle</a></li>
                                                                <li><a className="dropdown-item" href="#"><i className="ri-close-line me-2"></i>İptal Et</a></li>
                                                            </ul>
                                                        </div>
                                                    </td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Report Insights */}
                    <div className="row">
                        <div className="col-lg-12">
                            <div className="card">
                                <div className="card-header">
                                    <h4 className="card-title mb-0">Rapor İçgörüleri ve Öneriler</h4>
                                </div>
                                <div className="card-body">
                                    <div className="row">
                                        <div className="col-md-4">
                                            <div className="border-start border-4 border-primary ps-3 mb-3">
                                                <h6 className="text-primary mb-2">Operasyon Verimliliği</h6>
                                                <p className="text-muted mb-0">
                                                    Son ay içerisinde operasyon verimliliği %8.2 artış gösterdi. 
                                                    Özellikle toplama operasyonlarında kayda değer iyileşme gözlemlendi.
                                                </p>
                                            </div>
                                        </div>
                                        <div className="col-md-4">
                                            <div className="border-start border-4 border-success ps-3 mb-3">
                                                <h6 className="text-success mb-2">Kapasite Optimizasyonu</h6>
                                                <p className="text-muted mb-0">
                                                    A Bölgesinde %95 doluluk oranına ulaşıldı. B ve C bölgelerine 
                                                    kademeli geçiş planlanarak kapasite dengelemesi yapılmalı.
                                                </p>
                                            </div>
                                        </div>
                                        <div className="col-md-4">
                                            <div className="border-start border-4 border-warning ps-3 mb-3">
                                                <h6 className="text-warning mb-2">Personel Gelişimi</h6>
                                                <p className="text-muted mb-0">
                                                    Yeni işe başlayan personelin adaptasyon süresi ortalama 15 güne 
                                                    düştü. Eğitim programlarının etkinliği artırıldı.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <style jsx>{`
                .hover-shadow-sm:hover {
                    box-shadow: 0 0.125rem 0.25rem rgba(0, 0, 0, 0.075) !important;
                    transition: box-shadow 0.15s ease-in-out;
                }
            `}</style>
        </Layout>
    );
};

export default Index;